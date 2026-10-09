/* Offline support: app files and prices load from the phone first,
   then update in the background whenever there is a connection. */
const VERSION = "v16";
const SHELL = `shell-${VERSION}`;
const DATA = "data";
const IMG = "img";
const SHELL_FILES = [
  "./", "index.html", "styles.css", "app.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png",
  "fonts/atkinson-hyperlegible-latin-400-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "fonts/baloo-2-latin-700-normal.woff2",
  "fonts/baloo-2-latin-800-normal.woff2",
];
const DATA_KEY = new URL("data/prices.json", self.registration.scope).href;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(SHELL_FILES);
    try {
      const r = await fetch(DATA_KEY, { cache: "no-store" });
      if (r.ok) await (await caches.open(DATA)).put(DATA_KEY, r);
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL, DATA, IMG];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.endsWith("/data/prices.json")) {
    e.respondWith(url.searchParams.has("fresh") ? freshData(e.request) : savedData());
    return;
  }
  if (url.pathname.includes("/img/")) {
    e.respondWith(cacheFirst(e.request, IMG));
    return;
  }
  e.respondWith(staleWhileRevalidate(e));
});

async function freshData(request) {
  const r = await fetch(request, { cache: "no-store" });
  if (r.ok) await (await caches.open(DATA)).put(DATA_KEY, r.clone());
  return r;
}

async function savedData() {
  const hit = await caches.match(DATA_KEY);
  if (hit) return hit;
  const r = await fetch(DATA_KEY, { cache: "no-store" });
  if (r.ok) await (await caches.open(DATA)).put(DATA_KEY, r.clone());
  return r;
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const r = await fetch(request);
    if (r.ok) await cache.put(request, r.clone());
    return r;
  } catch {
    return new Response("", { status: 504 });
  }
}

async function staleWhileRevalidate(e) {
  const cache = await caches.open(SHELL);
  const req = e.request.mode === "navigate" ? new URL("index.html", self.registration.scope).href : e.request;
  const hit = await cache.match(req, { ignoreSearch: true });
  const update = fetch(e.request)
    .then((r) => { if (r.ok) cache.put(req, r.clone()); return r; })
    .catch(() => null);
  if (hit) { e.waitUntil(update); return hit; }
  return (await update) || new Response("Offline", { status: 503 });
}

/* Save every card image so the list looks right with no signal. */
let warming = false;
self.addEventListener("message", (e) => {
  if (e.data?.type === "cache-images" && !warming) {
    warming = true;
    e.waitUntil(warmImages(e.data.urls, e.source).finally(() => { warming = false; }));
  }
});

async function warmImages(urls, client) {
  const cache = await caches.open(IMG);
  const scope = self.registration.scope;
  let done = 0;
  const queue = urls.map((u) => new URL(u, scope).href);
  const total = queue.length;
  const report = () => client?.postMessage({ type: "img-progress", done, total });
  async function worker() {
    while (queue.length) {
      const u = queue.pop();
      if (!(await cache.match(u))) {
        try { const r = await fetch(u); if (r.ok) await cache.put(u, r); } catch {}
      }
      done++;
      if (done % 20 === 0) report();
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  report();
}
