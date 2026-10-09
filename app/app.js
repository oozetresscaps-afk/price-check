"use strict";

const DATA_URL = "data/prices.json";
const CONDS = [
  ["NM", "Near Mint"], ["LP", "Lightly Played"], ["MP", "Moderately Played"],
  ["HP", "Heavily Played"], ["DMG", "Damaged"],
];
const PRINTS = [["N", "Normal"], ["R", "Reverse"], ["H", "Holo"]];
const PRINT_LONG = { N: "Normal", R: "Reverse holo", H: "Holo" };
const SET_COLOR = { EX: "var(--ex)", AQ: "var(--aq)", SK: "var(--sk)" };
const SORTS = { num: "Sort by number", price: "Sort by price" };

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem("pc:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pc:" + k, JSON.stringify(v)); } catch {} },
};

const state = {
  data: null,
  setId: store.get("set", "all"),
  print: store.get("print", "N"),
  cond: store.get("cond", "NM"),
  sort: store.get("sort", "num"),
  q: "",
  fetchedOk: false,
  tried: false,
  refreshing: false,
  imgProgress: null,
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmt = (v) => (v == null ? "—" : usd.format(v));
const shortDate = (iso) => {
  const d = new Date(iso + "T12:00:00");
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
};
function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 36) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} days ago`;
}
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- data ---------- */

function prepare(data) {
  const setIdx = new Map(data.sets.map((s, i) => [s.id, i]));
  const abbr = new Map(data.sets.map((s) => [s.id, s.abbr]));
  for (const c of data.cards) {
    c.abbr = abbr.get(c.set) || "";
    c.key = norm(c.name);
    const m = /^(H?)(\d+)/i.exec(c.num || "");
    c.order = (setIdx.get(c.set) ?? 9) * 100000 + (m ? (m[1] ? 1000 : 0) + Number(m[2]) : 9999);
    c.numLow = (c.num || "").toLowerCase();
    c.s = c.s || [];
    c.p = c.p || {};
  }
  data.cards.sort((a, b) => a.order - b.order);
  return data;
}

function hasPrinting(c, p) {
  return p in c.p || c.s.some((s) => s[1] === p);
}
function lastSale(c, p, cond) {
  return c.s.find((s) => s[1] === p && s[0] === cond) || null;
}
function market(c, p, cond) {
  return c.p[p]?.[cond] ?? null;
}

async function loadSaved() {
  try {
    const r = await fetch(DATA_URL);
    if (!r.ok) throw new Error(r.status);
    state.data = prepare(await r.json());
  } catch {
    state.data = null;
  }
}

async function refresh() {
  if (state.refreshing) return;
  state.refreshing = true;
  $("refresh").classList.add("spinning");
  renderStatus();
  try {
    const r = await fetch(`${DATA_URL}?fresh=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const fresh = prepare(await r.json());
    const changed = !state.data || fresh.updated !== state.data.updated || fresh.salesUpdated !== state.data.salesUpdated;
    state.data = fresh;
    state.fetchedOk = true;
    if (changed) render();
    warmImages();
  } catch {
    state.fetchedOk = false;
  } finally {
    state.refreshing = false;
    state.tried = true;
    $("refresh").classList.remove("spinning");
    renderStatus();
  }
}

/* ---------- offline images ---------- */

function warmImages() {
  const sw = navigator.serviceWorker?.controller;
  if (!sw || !state.data) return;
  const urls = state.data.cards.filter((c) => c.img).map((c) => `img/${c.id}.jpg`);
  sw.postMessage({ type: "cache-images", urls });
}
navigator.serviceWorker?.addEventListener("message", (e) => {
  if (e.data?.type === "img-progress") {
    state.imgProgress = e.data;
    renderStatus();
  }
});

/* ---------- rendering ---------- */

function renderStatus() {
  const el = $("status");
  const d = state.data;
  if (state.refreshing && !d) { el.textContent = "Getting prices"; return; }
  if (!d) {
    el.textContent = navigator.onLine ? "No prices saved yet" : "Offline, no prices saved yet";
    return;
  }
  const parts = [];
  if (!navigator.onLine || (state.tried && !state.fetchedOk && !state.refreshing)) {
    parts.push(`<span class="offline">Offline.</span> Showing prices saved ${ago(d.updated)}`);
  } else if (state.refreshing) {
    parts.push("Checking for newer prices");
  } else {
    parts.push(`TCGplayer prices updated ${ago(d.updated)}`);
  }
  const p = state.imgProgress;
  if (p && p.done < p.total) parts.push(`, saving card images ${p.done} of ${p.total}`);
  el.innerHTML = parts.join("");
}

function renderControls() {
  const sets = $("sets");
  const all = [{ id: "all", name: "All sets" }, ...(state.data?.sets || [])];
  sets.innerHTML = all.map((s) =>
    `<button class="set-chip" type="button" data-set="${s.id}" aria-pressed="${String(s.id) === String(state.setId)}"` +
    (s.abbr ? ` style="--c:${SET_COLOR[s.abbr]}"` : "") + `>${s.abbr ? "<i></i>" : ""}${s.name}</button>`
  ).join("");

  $("printing").innerHTML = PRINTS.map(([k, label]) =>
    `<button type="button" data-print="${k}" aria-pressed="${k === state.print}">${label}</button>`).join("");
  $("condition").innerHTML = CONDS.map(([k, label]) =>
    `<button type="button" data-cond="${k}" aria-pressed="${k === state.cond}" aria-label="${label}">${k}</button>`).join("");
  $("sort").textContent = SORTS[state.sort];
}

function filtered() {
  const d = state.data;
  if (!d) return [];
  const q = norm(state.q.trim());
  const qNum = q.replace(/^#/, "");
  const isNum = /^h?\d+(\/h?\d*)?$/.test(qNum);
  let list = d.cards.filter((c) =>
    (state.setId === "all" || String(c.set) === String(state.setId)) && hasPrinting(c, state.print));
  if (q) {
    list = list.filter((c) => isNum
      ? c.numLow === qNum || c.numLow.startsWith(qNum.includes("/") ? qNum : qNum + "/")
      : c.key.includes(q));
  }
  if (state.sort === "price") {
    list = [...list].sort((a, b) => (market(b, state.print, state.cond) ?? -1) - (market(a, state.print, state.cond) ?? -1));
  }
  return list;
}

function rowHTML(c) {
  const m = market(c, state.print, state.cond);
  const s = lastSale(c, state.print, state.cond);
  const img = c.img
    ? `<img class="thumb" src="img/${c.id}.jpg" alt="" loading="lazy" decoding="async" width="46" height="64">`
    : `<span class="thumb empty"></span>`;
  return `<button class="row" type="button" data-id="${c.id}" style="--c:${SET_COLOR[c.abbr]}">
    ${img}
    <span class="who"><span class="name">${esc(c.name)}</span><span class="meta">${c.abbr} ${c.num}, ${esc(c.rarity)}</span></span>
    <span class="val"><span class="price${m == null ? " none" : ""}">${fmt(m)}</span>${s ? `<span class="sold">Sold ${fmt(s[2])}, ${shortDate(s[3])}</span>` : `<span class="sold">No recent ${state.cond} sale</span>`}</span>
  </button>`;
}

function renderList() {
  const list = $("list");
  if (!state.data) {
    list.innerHTML = `<div class="empty-state"><strong>No prices saved on this phone yet</strong>Connect to Wi-Fi or data and tap refresh at the top. After one successful load, prices stay available offline.</div>`;
    $("count").textContent = "";
    return;
  }
  const rows = filtered();
  const label = PRINT_LONG[state.print].toLowerCase();
  $("count").textContent = `${rows.length} ${label} card${rows.length === 1 ? "" : "s"}, ${state.cond} prices`;
  if (!rows.length) {
    list.innerHTML = `<div class="empty-state"><strong>No ${label} cards match</strong>Try another printing or set, or check the spelling.</div>`;
    return;
  }
  list.innerHTML = rows.map(rowHTML).join("");
}

function render() {
  renderControls();
  renderList();
  renderStatus();
}

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

/* ---------- detail sheet ---------- */

const sheetState = { card: null, print: "N", cond: "NM", ask: "" };

function openSheet(id) {
  const c = state.data.cards.find((x) => String(x.id) === String(id));
  if (!c) return;
  sheetState.card = c;
  sheetState.print = hasPrinting(c, state.print) ? state.print : PRINTS.find(([k]) => hasPrinting(c, k))?.[0] || "N";
  sheetState.cond = state.cond;
  sheetState.ask = "";
  renderSheet();
  const dlg = $("sheet");
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

function renderSheet() {
  const { card: c, print: p, cond } = sheetState;
  const set = state.data.sets.find((s) => s.id === c.set);
  const sales = c.s.filter((s) => s[1] === p).slice(0, 10);
  const condRows = CONDS.map(([k, label]) => {
    const m = market(c, p, k);
    const s = lastSale(c, p, k);
    return `<li><button class="cond-btn" type="button" data-scond="${k}" aria-pressed="${k === cond}" aria-label="${label}">
      <span class="c">${k}</span><span class="m">${fmt(m)}</span>
      <span class="l">${s ? `<b>${fmt(s[2])}</b>${shortDate(s[3])}` : "No recent sale"}</span></button></li>`;
  }).join("");

  $("sheet").innerHTML = `<div class="sheet-inner">
    <button class="close" type="button" data-close aria-label="Close">×</button>
    <div class="grab" aria-hidden="true"></div>
    <div class="sheet-head">
      ${c.img ? `<img src="img/${c.id}.jpg" alt="${esc(c.name)} card">` : `<span class="ph"></span>`}
      <div>
        <h2 id="sheet-title">${esc(c.name)}</h2>
        <p class="set-line" style="--c:${SET_COLOR[c.abbr]}"><i></i>${set?.name || ""} ${c.num}</p>
        <p>${esc(c.rarity)}</p>
      </div>
    </div>
    <div class="seg" role="group" aria-label="Printing">
      ${PRINTS.map(([k, label]) => `<button type="button" data-sprint="${k}" aria-pressed="${k === p}" ${hasPrinting(c, k) ? "" : "disabled"}>${label}</button>`).join("")}
    </div>
    <div class="cond-head" aria-hidden="true"><span>Cond.</span><span>Market</span><span>Last sold</span></div>
    <ol class="cond-list">${condRows}</ol>
    <div class="ask">
      <label for="ask">Asking
        <span class="money">$<input id="ask" inputmode="decimal" type="text" placeholder="0.00" value="${esc(sheetState.ask)}" autocomplete="off"></span>
      </label>
      <output id="ask-out" for="ask"></output>
    </div>
    <section class="sales">
      <h3>Recent ${PRINT_LONG[p].toLowerCase()} sales</h3>
      ${sales.length ? `<ol>${sales.map((s) => `<li><span>${shortDate(s[3])}</span><span class="k">${s[0]}</span><span class="p">${fmt(s[2])}</span></li>`).join("")}</ol>`
        : `<p class="none">No recent ${PRINT_LONG[p].toLowerCase()} sales on TCGplayer.</p>`}
    </section>
    <a class="ext" href="https://www.tcgplayer.com/product/${c.id}" target="_blank" rel="noopener">Open on TCGplayer</a>
    <p class="fine">Market and last sold from TCGplayer, prices updated ${ago(state.data.updated)}. Last sold is the item price without shipping.</p>
  </div>`;
  renderAsk();
}

function renderAsk() {
  const out = $("ask-out");
  if (!out) return;
  const { card: c, print: p, cond } = sheetState;
  const ask = parseFloat(String(sheetState.ask).replace(/[^0-9.]/g, ""));
  const m = market(c, p, cond);
  if (!ask) { out.innerHTML = `Type an asking price to compare it with ${cond} market.`; return; }
  if (m == null) { out.innerHTML = `No ${cond} market price for this printing.`; return; }
  const pct = Math.round((ask / m) * 100);
  const diff = Math.abs(ask - m);
  const dir = ask <= m ? "under" : "over";
  out.innerHTML = `<b>${pct}% of ${cond} market</b>, ${fmt(diff)} ${dir} ${fmt(m)}`;
}

/* ---------- events ---------- */

$("sets").addEventListener("click", (e) => {
  const b = e.target.closest("[data-set]");
  if (!b) return;
  state.setId = b.dataset.set; store.set("set", state.setId);
  render();
});
$("printing").addEventListener("click", (e) => {
  const b = e.target.closest("[data-print]");
  if (!b) return;
  state.print = b.dataset.print; store.set("print", state.print);
  render();
});
$("condition").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cond]");
  if (!b) return;
  state.cond = b.dataset.cond; store.set("cond", state.cond);
  render();
});
$("sort").addEventListener("click", () => {
  state.sort = state.sort === "num" ? "price" : "num"; store.set("sort", state.sort);
  render();
  window.scrollTo({ top: 0 });
});
let qTimer;
$("q").addEventListener("input", (e) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { state.q = e.target.value; renderList(); }, 80);
});
$("list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b) openSheet(b.dataset.id);
});
$("refresh").addEventListener("click", refresh);

const sheet = $("sheet");
sheet.addEventListener("click", (e) => {
  if (e.target === sheet || e.target.closest("[data-close]")) { sheet.close(); return; }
  const pb = e.target.closest("[data-sprint]");
  if (pb && !pb.disabled) { sheetState.print = pb.dataset.sprint; renderSheet(); return; }
  const cb = e.target.closest("[data-scond]");
  if (cb) {
    sheetState.cond = cb.dataset.scond;
    sheet.querySelectorAll("[data-scond]").forEach((x) => x.setAttribute("aria-pressed", String(x === cb)));
    renderAsk();
  }
});
sheet.addEventListener("input", (e) => {
  if (e.target.id === "ask") { sheetState.ask = e.target.value; renderAsk(); }
});

window.addEventListener("online", () => { renderStatus(); refresh(); });
window.addEventListener("offline", renderStatus);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && navigator.onLine && state.data &&
      Date.now() - new Date(state.data.updated).getTime() > 30 * 60000) refresh();
});

/* ---------- start ---------- */

(async function start() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  renderControls();
  await loadSaved();
  render();
  if (navigator.onLine) await refresh();
  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(() => setTimeout(warmImages, 500));
    navigator.serviceWorker.addEventListener("controllerchange", () => setTimeout(warmImages, 500));
  }
})();
