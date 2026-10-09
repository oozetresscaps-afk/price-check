"use strict";

/* ================= constants ================= */

const DATA_URL = "data/prices.json";
const CONDS = [
  ["NM", "Near Mint"], ["LP", "Lightly Played"], ["MP", "Moderately Played"],
  ["HP", "Heavily Played"], ["DMG", "Damaged"],
];
const COND_CODE = Object.fromEntries(CONDS.map(([k, v]) => [v.toLowerCase(), k]));
const CODE_NAMES = { N: "Normal", R: "Reverse Holofoil", H: "Holofoil" };
const PRINT_ORDER = ["Normal", "Unlimited", "1st Edition", "Holofoil", "Unlimited Holofoil", "1st Edition Holofoil", "Reverse Holofoil"];
const PRINT_STYLE = {
  "Normal": { tag: "", short: "Normal", cls: "pr-normal" },
  "Unlimited": { tag: "", short: "Unlimited", cls: "pr-normal" },
  "Reverse Holofoil": { tag: "✨ Reverse holo", short: "✨ Reverse", cls: "pr-rev" },
  "Holofoil": { tag: "🌟 Holo", short: "🌟 Holo", cls: "pr-holo" },
  "Unlimited Holofoil": { tag: "🌟 Holo", short: "🌟 Holo", cls: "pr-holo" },
  "1st Edition": { tag: "1st Edition", short: "1st Ed.", cls: "pr-first" },
  "1st Edition Holofoil": { tag: "🌟 1st Edition holo", short: "🌟 1st Ed.", cls: "pr-firstholo" },
};
const pstyle = (p) => PRINT_STYLE[p] || { tag: p, short: p, cls: "pr-other" };
const pOrder = (p) => { const i = PRINT_ORDER.indexOf(p); return i < 0 ? 50 : i; };
const SORTS = { num: "Sort: Number", price: "Sort: Price" };
const SMUG = [
  "Ready to spend way too much money on cardboard?",
  "How's the ol' bank account looking there, pal?",
  "Oh good, you're back. The cardboard missed you.",
  "It's not spending, it's \"investing.\" Sure it is.",
  "Let me guess. You're \"just looking.\" Uh huh.",
  "Your wallet called. It sounded scared.",
  "Bold of you to open me with that bank balance.",
  "Go ahead, pretend you're going to haggle. It's cute.",
  "Every card is a \"deal\" if you squint hard enough.",
  "You don't need another reverse holo. Anyway, here are the prices.",
  "Back for more? That binder isn't going to fill itself.",
  "Play it cool. The dealer can smell desperation.",
  "Ah yes, cardboard. Your favorite financial decision.",
  "Rent can wait. That Skyridge card can't. Right?",
  "Is this a grail, or is it just Saturday?",
  "Remember: if you don't look at the receipt, it didn't happen.",
  "Sure, \"one more pack\" and then you're done. I believe you.",
  "Another day, another card you'll call a steal.",
];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem("eq:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("eq:" + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("eq:" + k); } catch {} },
};

const state = {
  data: null,
  tab: store.get("tab", "all"),
  cond: store.get("cond", "NM"),
  sort: store.get("sort", "num"),
  theme: store.get("theme", "dark"),
  own: "all",
  q: "",
  coll: migrateColl(store.get("coll", null)),
  fetchedOk: false,
  tried: false,
  refreshing: false,
  imgProgress: null,
};

function migrateColl(c) {
  if (!c?.items) return c;
  for (const id of Object.keys(c.items)) c.items[id] = c.items[id].map(([p, cond, q]) => [CODE_NAMES[p] || p, cond, q]);
  return c;
}

/* ================= theme ================= */

function applyTheme(t) {
  state.theme = t;
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#1E1720" : "#FFF7F2");
  const b = $("theme");
  if (b) {
    b.innerHTML = `<span class="emoji" aria-hidden="true">${t === "dark" ? "☀️" : "🌙"}</span>`;
    b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}
applyTheme(state.theme);

/* ================= the mascot: bagl ================= */

const MASCOT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 28 168 168" class="mascot" aria-hidden="true">
<ellipse cx="100" cy="194" rx="46" ry="4" fill="#000" opacity=".08"/>
<g class="bl-fl"><ellipse cx="84" cy="191" rx="10" ry="5.5" fill="#D9C29E"/></g><g class="bl-fr"><ellipse cx="116" cy="191" rx="10" ry="5.5" fill="#D9C29E"/></g>
<g class="bl-sway"><g class="bl-bag">
<g class="bl-al"><path d="M48 142 Q36 148 34 158" fill="none" stroke="#D9C29E" stroke-width="10" stroke-linecap="round"/></g>
<g class="bl-ar"><path d="M152 142 Q164 148 166 158" fill="none" stroke="#D9C29E" stroke-width="10" stroke-linecap="round"/></g>
<path d="M82 74 C56 90 36 118 40 150 C43 178 68 190 100 190 C132 190 157 178 160 150 C164 118 144 90 118 74 Z" fill="#EBD9BC"/>
<path d="M128 82 C150 100 163 128 159 156 C155 176 137 188 112 190 C137 180 150 160 148 134 C146 110 139 94 128 82 Z" fill="#D9C29E" opacity=".8"/>
<path d="M56 112 Q50 126 52 142" fill="none" stroke="#F6EBD6" stroke-width="4" stroke-linecap="round" opacity=".9"/>
<path d="M58 172 Q100 188 142 172" fill="none" stroke="#D9C29E" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round"/>
<g class="bl-top"><ellipse cx="100" cy="46" rx="24" ry="6.5" fill="#8E6A4F"/>
<g class="bl-pile"><g transform="translate(91 44)"><g><circle r="7" fill="#EDBE5A"/><circle r="4.4" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-2.45" cy="-2.45" r="1.4" fill="#fff" opacity=".8"/></g></g><g transform="translate(108 43)"><g><circle r="7" fill="#EDBE5A"/><circle r="4.4" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-2.45" cy="-2.45" r="1.4" fill="#fff" opacity=".8"/></g></g><g transform="translate(100 37)"><g><circle r="7" fill="#EDBE5A"/><circle r="4.4" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-2.45" cy="-2.45" r="1.4" fill="#fff" opacity=".8"/></g></g></g>
<path d="M76 46 Q100 58 124 46 C128 56 124 66 118 74 L82 74 C76 66 72 56 76 46 Z" fill="#EBD9BC"/>
<path d="M76 46 Q100 58 124 46" fill="none" stroke="#F6EBD6" stroke-width="3" stroke-linecap="round"/>
<path d="M116 52 C120 60 118 68 114 74" fill="none" stroke="#D9C29E" stroke-width="5" stroke-linecap="round" opacity=".7"/></g>
<rect x="78" y="69" width="44" height="10" rx="5" fill="#9DB27E"/>
<g transform="rotate(-10 136 157)"><circle cx="136" cy="157" r="12.5" fill="#E58C7A"/><circle cx="136" cy="157" r="10" fill="none" stroke="#F7E8D0" stroke-width="1.3" stroke-dasharray="2.4 2"/><path d="M131.6 157 L140.4 157 A4.4 4.4 0 1 0 139.47 159.71" fill="none" stroke="#F7E8D0" stroke-width="2.4" stroke-linecap="round"/></g><g transform="rotate(-20 64 106)"><rect x="56" y="102" width="16" height="7" rx="3.5" fill="#F2C9A8"/><rect x="61" y="102" width="6" height="7" fill="#E9B48F"/></g>
<path d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15" fill="none" stroke="#9DB27E" stroke-width="3.4" stroke-linecap="round"/><circle cx="112" cy="76" r="4.5" fill="#7F9662"/>
<ellipse cx="68" cy="133" rx="7" ry="4.2" fill="#F2906F" opacity=".8"/><ellipse cx="132" cy="133" rx="7" ry="4.2" fill="#F2906F" opacity=".8"/><g class="bl-b1"><path d="M109 107 q5 -3 10 -0.5" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="1.8" opacity=".55"/></g><g class="bl-b2"><path d="M80 107 l11 1.8" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2" opacity=".8"/><path d="M108 106.5 q6 -5 12 -1" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2" opacity=".8"/></g><g class="bl-eyes"><g class="bl-look"><g class="bl-es"><path d="M81.65 118.7 L91.95 118.7 A6 7.4 0 1 1 81.65 118.7 Z" fill="#211816"/><path d="M109.65 118.7 L119.95 118.7 A6 7.4 0 1 1 109.65 118.7 Z" fill="#211816"/></g><g class="bl-ex"><path d="M81.58 120.7 L93.22 120.7 A6 7.4 0 1 1 81.58 120.7 Z" fill="#211816"/><path d="M109.58 120.7 L121.22 120.7 A6 7.4 0 1 1 109.58 120.7 Z" fill="#211816"/></g><g class="bl-ew"><ellipse cx="86" cy="122.5" rx="6" ry="7.4" fill="#211816"/><ellipse cx="114" cy="122.5" rx="6" ry="7.4" fill="#211816"/></g></g><g class="bl-shut" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2.2" stroke-linejoin="round"><path d="M82 117 L89 122 L82 127"/><path d="M118 117 L111 122 L118 127"/></g><g class="bl-sleep" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2.2"><path d="M80 123 q6 4 12 0"/><path d="M108 123 q6 4 12 0"/></g></g><g transform="rotate(5 100 120)"><g class="bl-glasses"><g fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="1.8"><circle cx="86" cy="122" r="11.5"/><circle cx="114" cy="122" r="11.5"/><path d="M97.5 121 q2.5 -3 5 0"/><path d="M74.5 120 l-6 -1.5"/><path d="M125.5 120 l6 -1.5"/></g></g></g><path class="bl-ms" d="M94.5 139 q5.5 2.6 9.5 -1 q1.2 -1.1 1.9 -2.8" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2.1"/><path class="bl-mx" d="M92.5 139 q7.5 3.2 12 -1.6 q1.6 -1.6 2.6 -4" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2.2"/><ellipse class="bl-mo" cx="100" cy="138" rx="2.6" ry="3" fill="#E8794F"/><path class="bl-drop" d="M138 96 q5 7 0 10 q-5 -3 0 -10 Z" fill="#9FC3E0"/>
</g></g>
<g transform="translate(100 42)"><g class="bl-fly bl-f1"><circle r="7" fill="#EDBE5A"/><circle r="4.4" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-2.45" cy="-2.45" r="1.4" fill="#fff" opacity=".8"/></g></g><g transform="translate(100 42)"><g class="bl-fly bl-f2"><circle r="7" fill="#EDBE5A"/><circle r="4.4" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-2.45" cy="-2.45" r="1.4" fill="#fff" opacity=".8"/></g></g><g transform="translate(100 42)"><g class="bl-fly bl-f3"><circle r="6.5" fill="#EDBE5A"/><circle r="3.9" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-2.27" cy="-2.27" r="1.3" fill="#fff" opacity=".8"/></g></g><g transform="translate(100 42)"><g class="bl-fly bl-f4"><circle r="5.5" fill="#EDBE5A"/><circle r="2.9" fill="none" stroke="#D29E3A" stroke-width="1.6"/><circle cx="-1.92" cy="-1.92" r="1.1" fill="#fff" opacity=".8"/></g></g>
<g class="bl-z" fill="#3B2A22" font-family="Baloo 2, sans-serif" font-weight="800"><text x="146" y="70" font-size="18">z</text><text x="160" y="54" font-size="13">z</text></g>
</svg>`;
function mascot() { return MASCOT; }
let moodTimer;
function mood(m, ms) {
  const b = $("buddy");
  if (m !== "idle") b.dataset.idle = "";
  b.dataset.mood = m;
  clearTimeout(moodTimer);
  if (ms) moodTimer = setTimeout(() => { b.dataset.mood = "idle"; }, ms);
}

/* little idle routines, picked at random so he never loops the same way.
   "spill" is the big one: he hiccups, gold sprays everywhere, a coin bonks him, he pretends he meant it. */
const IDLES = ["spill", "spill", "look", "jingle", "glasses", "wiggle", "smug"];
const IDLE_MS = { spill: 3300, smug: 2700, wiggle: 1500, glasses: 2100 };
let playTimer;
function play(name) {
  const b = $("buddy");
  if (reduceMotion.matches) return;
  b.dataset.idle = "";
  void b.offsetWidth; // restart the animation if the same routine plays twice in a row
  b.dataset.idle = name;
  clearTimeout(playTimer);
  playTimer = setTimeout(() => { if (b.dataset.idle === name) b.dataset.idle = ""; }, IDLE_MS[name] || 2700);
}
function idleLoop() {
  const b = $("buddy");
  if (!document.hidden && b.dataset.mood === "idle" && !b.dataset.idle) play(IDLES[Math.floor(Math.random() * IDLES.length)]);
  setTimeout(idleLoop, 5000 + Math.random() * 5000);
}

/* ================= the speech bubble ================= */

function say(html) {
  const el = $("bubble");
  el.innerHTML = html;
  if (!reduceMotion.matches) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
}
function smug(face = true) {
  let i = Math.floor(Math.random() * SMUG.length);
  const last = store.get("smug", -1);
  if (i === last) i = (i + 1) % SMUG.length;
  store.set("smug", i);
  say(SMUG[i]);
  const b = $("buddy");
  if (face && b.dataset.mood === "idle" && !b.dataset.idle) mood("smug", 2600);
}

/* ================= helpers ================= */

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmt = (v) => (v == null ? "—" : usd.format(v));
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const shortDate = (iso) => {
  const d = new Date(iso + "T12:00:00");
  const opts = d.getFullYear() === new Date().getFullYear() ? { month: "short", day: "numeric" } : { month: "short", year: "numeric" };
  return d.toLocaleDateString("en-US", opts);
};
function ago(iso) {
  if (!iso) return "a while ago";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 36) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} days ago`;
}
// "Vending Machine cards Series 1 (Blue)" and Collectr's "Vending Series 1 (Blue)" are the same set
const setKey = (name) => norm(name).replace(/\b(machine|cards|pokemon)\b/g, "").replace(/\s+/g, " ").trim();
function numKey(num) {
  const n = String(num || "").split("/")[0].trim().toLowerCase();
  const m = /^([a-z]*?)0*(\d+)([a-z]?)$/.exec(n);
  return m ? m[1] + m[2] + m[3] : n;
}

/* ================= data ================= */

function prepare(data) {
  const setIdx = new Map(data.sets.map((s, i) => [s.id, i]));
  const setOf = new Map(data.sets.map((s) => [s.id, s]));
  for (const s of data.sets) s.tab = s.tab || s.name;
  data.byKey = new Map();
  data.byId = new Map(data.cards.map((c) => [String(c.id), c]));
  data.rows = [];
  for (const c of data.cards) {
    for (const k of ["p", "l"]) c[k] = Object.fromEntries(Object.entries(c[k] || {}).map(([p, v]) => [CODE_NAMES[p] || p, v]));
    c.s = (c.s || []).map((s) => [s[0], CODE_NAMES[s[1]] || s[1], s[2], s[3]]);
    const set = setOf.get(c.set) || {};
    c.abbr = set.abbr || ""; c.tab = set.tab || ""; c.setName = set.name || "";
    c.key = norm(c.name);
    c.nk = numKey(c.num);
    const m = /^([a-z]*)(\d+)([a-z]?)/i.exec(c.nk);
    c.order = (setIdx.get(c.set) ?? 99) * 100000 + (m ? (m[1] ? 1000 : 0) + Number(m[2]) + (m[3] ? (m[3].charCodeAt(0) - 96) / 10 : 0) : 5000);
    const sk = setKey(c.setName);
    if (c.nk) data.byKey.set(`${sk}|${c.nk}`, c);
    if (!data.byKey.has(`${sk}|n:${c.key}`)) data.byKey.set(`${sk}|n:${c.key}`, c);
    const prints = new Set([...Object.keys(c.p), ...Object.keys(c.l), ...c.s.map((s) => s[1])]);
    if (!prints.size) prints.add("Normal");
    c.prints = [...prints].sort((a, b) => pOrder(a) - pOrder(b));
    for (const p of c.prints) data.rows.push({ c, p });
  }
  data.rows.sort((a, b) => a.c.order - b.c.order || a.c.key.localeCompare(b.c.key) || pOrder(a.p) - pOrder(b.p));
  data.tabs = [...new Set(data.sets.filter((s) => s.count !== 0).map((s) => s.tab))];
  return data;
}

const market = (c, p, cond) => c.p[p]?.[cond] ?? null;
const lastSale = (c, p, cond) => c.s.find((s) => s[1] === p && s[0] === cond) || null;
const anySale = (c, p) => c.s.find((s) => s[1] === p) || null;
const lowest = (c, p, cond) => c.l[p]?.[cond] || null;
function lowestAny(c, p) {
  let best = null;
  for (const [cond, v] of Object.entries(c.l[p] || {})) {
    if (!best || v[0] + v[1] < best[0] + best[1]) best = [v[0], v[1], cond];
  }
  return best;
}
const owned = (c, p) => (state.coll?.items?.[c.id] || []).filter((it) => !p || it[0] === p);
const ownedQty = (c, p) => owned(c, p).reduce((n, it) => n + it[2], 0);

async function loadSaved() {
  try {
    const r = await fetch(DATA_URL);
    if (!r.ok) throw new Error(r.status);
    state.data = prepare(await r.json());
  } catch { state.data = null; }
}

async function refresh(manual) {
  if (state.refreshing) return;
  state.refreshing = true;
  $("refresh").classList.add("spinning");
  if (manual || $("buddy").dataset.mood !== "smug") mood("search");
  if (manual) say("Fine, I'll go check TCGplayer for you… 🔍");
  renderStatus();
  try {
    const r = await fetch(`${DATA_URL}?fresh=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const fresh = prepare(await r.json());
    const changed = !state.data || fresh.updated !== state.data.updated
      || fresh.salesUpdated !== state.data.salesUpdated || fresh.listingsUpdated !== state.data.listingsUpdated;
    state.data = fresh;
    state.fetchedOk = true;
    if (changed) { renderControls(); renderList(true); }
    warmImages();
    if (manual || $("buddy").dataset.mood !== "smug") mood("happy", 1600);
    if (manual) say(changed ? "Fresh prices. Your wallet's already sweating ✨" : "Nothing new. Prices didn't move just because you stared at them.");
  } catch {
    state.fetchedOk = false;
    if (state.data) { mood("sleepy", 7000); if (manual) say("No signal. Good thing I saved everything 📦"); }
    else { mood("sleepy"); say("I need internet once to grab prices. Then you can go broke offline 📶"); }
  } finally {
    state.refreshing = false;
    state.tried = true;
    $("refresh").classList.remove("spinning");
    if ($("buddy").dataset.mood === "search") mood("idle");
    renderStatus();
  }
}

function warmImages() {
  const sw = navigator.serviceWorker?.controller;
  if (!sw || !state.data) return;
  sw.postMessage({ type: "cache-images", urls: state.data.cards.filter((c) => c.img).map((c) => `img/${c.id}.jpg`) });
}
navigator.serviceWorker?.addEventListener("message", (e) => {
  if (e.data?.type === "img-progress") { state.imgProgress = e.data; renderStatus(); }
});

/* ================= Collectr import ================= */

function parseCSV(text) {
  const rows = []; let row = []; let field = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = ""; if (row.some((f) => f !== "")) rows.push(row); row = [];
    } else field += ch;
  }
  row.push(field); if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

function importCollectr(text, fileName) {
  const rows = parseCSV(text.replace(/^﻿/, ""));
  if (rows.length < 2) throw new Error("That file is empty.");
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => head.findIndex((h) => h === name || h.startsWith(name));
  const iSet = col("set"), iNum = col("card number"), iVar = col("variance"), iCond = col("card condition"), iQty = col("quantity"), iName = col("product name");
  if (iSet < 0 || iNum < 0) throw new Error("That doesn't look like a Collectr export. It needs Set and Card Number columns.");
  const sets = new Set(state.data.sets.map((s) => setKey(s.name)));
  const items = {}; let matched = 0; const missed = [];
  for (const r of rows.slice(1)) {
    const set = setKey((r[iSet] || "").trim());
    if (!sets.has(set)) continue;
    const name = (r[iName] || "").trim();
    const bare = norm(name.replace(/\s*\([^)]*\)\s*$/, ""));
    const loose = (k) => k.replace(/[^a-z0-9]+/g, "");
    let card = state.data.byKey.get(`${set}|${numKey(r[iNum])}`) || state.data.byKey.get(`${set}|n:${bare}`);
    if (!card) {
      const near = state.data.cards.filter((c) => setKey(c.setName) === set && loose(c.key).startsWith(loose(bare)));
      if (near.length === 1) card = near[0];
    }
    let p = (r[iVar] || "Normal").trim();
    if (card && !card.prints.includes(p)) p = card.prints.length === 1 ? card.prints[0] : (p === "Normal" && card.prints.includes("Unlimited") ? "Unlimited" : null);
    const cond = COND_CODE[(r[iCond] || "").trim().toLowerCase()] || "NM";
    const qty = Math.max(1, parseInt(r[iQty], 10) || 1);
    if (!card || !p) { missed.push(`${name || "?"} (${r[iSet]} ${r[iNum]})`); continue; }
    const list = items[card.id] || (items[card.id] = []);
    const same = list.find((it) => it[0] === p && it[1] === cond);
    if (same) same[2] += qty; else list.push([p, cond, qty]);
    matched += qty;
  }
  state.coll = { items, matched, cards: Object.keys(items).length, missed: missed.slice(0, 20), missedCount: missed.length, at: new Date().toISOString(), file: fileName };
  store.set("coll", state.coll);
}

/* ================= rendering: header + controls ================= */

function renderStatus() {
  const el = $("status"); const d = state.data;
  let t;
  if (state.refreshing) t = "🔄 Checking TCGplayer for fresh prices…";
  else if (!d) t = navigator.onLine ? "No prices saved yet. Tap ↻ to try again." : "📶 Needs internet once to grab prices";
  else if (!navigator.onLine || (state.tried && !state.fetchedOk)) t = `📦 Offline, showing prices from ${ago(d.updated)}`;
  else t = `✨ Prices from ${ago(d.updated)}`;
  const p = state.imgProgress;
  if (d && p && p.total) t += p.done < p.total ? `, saving pics ${p.done}/${p.total}` : ", saved for offline";
  if (el.textContent !== t) el.textContent = t;
}

function buildSeg(el, items, current, attr) {
  el.innerHTML = `<span class="pill" aria-hidden="true"></span>` + items.map(([k, label, aria]) =>
    `<button type="button" data-${attr}="${esc(k)}" aria-pressed="${k === current}"${aria ? ` aria-label="${esc(aria)}"` : ""}>${label}</button>`).join("");
  el.style.setProperty("--n", items.length);
  setSeg(el, current, attr);
}
function setSeg(el, value, attr) {
  const btns = [...el.querySelectorAll(`[data-${attr}]`)];
  const i = btns.findIndex((b) => b.dataset[attr] === value);
  btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr] === value)));
  const prev = el.style.getPropertyValue("--i");
  el.style.setProperty("--i", Math.max(0, i));
  if (prev !== "" && prev !== String(Math.max(0, i)) && !reduceMotion.matches) { el.classList.remove("boing"); void el.offsetWidth; el.classList.add("boing"); }
}

const TAB_LABEL = { Promos: "⭐ Black Star Promos", Vending: "🇯🇵 Vending", VS: "🇯🇵 VS" };
function renderControls() {
  const tabs = ["all", ...(state.data?.tabs || [])];
  if (!tabs.includes(state.tab)) state.tab = "all";
  let chips = tabs.map((t) =>
    `<button class="set-chip" type="button" data-tab="${esc(t)}" aria-pressed="${t === state.tab}">${t === "all" ? "All" : esc(TAB_LABEL[t] || t)}</button>`).join("");
  if (state.coll) {
    chips += `<span class="chip-gap" aria-hidden="true"></span>`
      + `<button class="set-chip" type="button" data-own="need" aria-pressed="${state.own === "need"}">🎯 Need</button>`
      + `<button class="set-chip" type="button" data-own="have" aria-pressed="${state.own === "have"}">✅ Have</button>`;
  }
  $("sets").innerHTML = chips;
  buildSeg($("condition"), CONDS.map(([k, l]) => [k, k, l]), state.cond, "cond");
  $("sort").textContent = SORTS[state.sort];
  renderNudge();
}

function renderNudge() {
  const show = state.data && !state.coll && !store.get("nudged", false);
  $("nudge").innerHTML = show
    ? `<button class="nudge" type="button" data-open-coll><span class="emoji" aria-hidden="true">📚</span><span><b>Mark the cards you own.</b> Import your Collectr export and I'll show what you still need.</span></button>`
    : "";
}

/* ================= rendering: list ================= */

function parseQuery(raw) {
  const words = norm(raw.trim()).replace(/^#/, "").split(/\s+/).filter(Boolean);
  let print = null; const rest = [];
  for (const w of words) {
    if (/^rev(erse)?(holo)?s?$/.test(w)) print = "rev";
    else if (/^holos?$/.test(w) && print !== "rev") print = "holo";
    else if (/^1st$/.test(w)) print = "first";
    else if (/^(normal|non-?holo)$/.test(w)) print = "normal";
    else rest.push(w);
  }
  return { print, q: rest.join(" ") };
}
function printMatches(p, want) {
  if (!want) return true;
  if (want === "rev") return p === "Reverse Holofoil";
  if (want === "holo") return /Holofoil/.test(p) && p !== "Reverse Holofoil";
  if (want === "first") return p.startsWith("1st");
  return p === "Normal" || p === "Unlimited";
}

function filtered() {
  const d = state.data; if (!d) return [];
  const { print, q } = parseQuery(state.q);
  const isNum = /^[a-z]*\d+[a-z]?(\/[a-z]*\d*)?$/.test(q);
  let list = d.rows.filter(({ c, p }) =>
    (state.tab === "all" || c.tab === state.tab) && printMatches(p, print));
  if (state.own !== "all" && state.coll) list = list.filter(({ c, p }) => (ownedQty(c, p) > 0) === (state.own === "have"));
  if (q) {
    list = list.filter(({ c }) => isNum
      ? (q.includes("/") ? c.num.toLowerCase().startsWith(q) : c.nk === q || c.nk.replace(/[a-z]$/, "") === q)
      : c.key.includes(q));
  }
  if (state.sort === "price") list = [...list].sort((a, b) => (market(b.c, b.p, state.cond) ?? -1) - (market(a.c, a.p, state.cond) ?? -1));
  return list;
}

function rowHTML({ c, p }) {
  const cond = state.cond, st = pstyle(p);
  const m = market(c, p, cond);
  const lo = lowest(c, p, cond);
  const loAny = lo ? null : lowestAny(c, p);
  const s = lastSale(c, p, cond);
  const sAny = s ? null : anySale(c, p);
  const qty = ownedQty(c, p);
  const img = c.img
    ? `<img class="thumb" src="img/${c.id}.jpg" alt="" loading="lazy" decoding="async" width="50" height="70">`
    : `<span class="thumb"></span>`;
  const low = lo ? `🛒 <b>${fmt(lo[0])}</b> low` : loAny ? `🛒 <b>${fmt(loAny[0])}</b> ${loAny[2]}` : `🛒 none listed`;
  const sold = s ? `🏷️ <b>${fmt(s[2])}</b> ${shortDate(s[3])}` : sAny ? `🏷️ <b>${fmt(sAny[2])}</b> ${sAny[0]}, ${shortDate(sAny[3])}` : `🏷️ no sales yet`;
  return `<button class="row ${st.cls}${qty ? " have" : ""}" type="button" data-id="${c.id}" data-p="${esc(p)}">
    <span class="thumbwrap">${img}${st.cls !== "pr-normal" ? `<span class="thumb-foil" aria-hidden="true"></span>` : ""}${qty ? `<span class="owned" aria-label="You have ${qty}">${qty > 1 ? "×" + qty : "✓"}</span>` : ""}</span>
    <span class="who"><span class="name">${esc(c.name)}</span><span class="meta">${esc([c.abbr, c.num].filter(Boolean).join(" "))}${c.rarity ? ", " + esc(c.rarity) : ""}</span>${st.tag ? `<span class="ptag">${st.tag}</span>` : ""}</span>
    <span class="val"><span class="price${m == null ? " none" : ""}">${fmt(m)}</span><small>market</small></span>
    <span class="stats"><span class="stat">${low}</span><span class="stat">${sold}</span></span>
  </button>`;
}

let renderToken = 0;
function renderList(animate) {
  const list = $("list");
  if (!state.data) {
    list.innerHTML = `<div class="empty"><div class="buddy-big" data-mood="sleepy">${mascot()}</div><strong>No prices on this phone yet</strong>Connect to Wi-Fi or data and tap ↻ at the top. After one good load, everything works offline.</div>`;
    $("count").textContent = "";
    return;
  }
  const rows = filtered();
  const suffix = state.own === "need" ? " you still need" : state.own === "have" ? " you have" : "";
  $("count").textContent = `${rows.length.toLocaleString()} cards${suffix}, ${state.cond} prices`;
  if (!rows.length) {
    const msg = state.own === "need" && !state.q ? ["You've got them all!", "Nothing left to hunt here. Your wallet thanks you 🎉"]
      : ["Nothing matches", "Try another set, or check the spelling."];
    list.innerHTML = `<div class="empty"><div class="buddy-big" data-mood="search">${mascot()}</div><strong>${msg[0]}</strong>${msg[1]}</div>`;
    return;
  }
  list.classList.remove("enter");
  // draw the first screenful right away and the rest just after, so big lists stay snappy
  const token = ++renderToken;
  list.innerHTML = rows.slice(0, 40).map(rowHTML).join("");
  if (rows.length > 40) setTimeout(() => { if (token === renderToken) list.insertAdjacentHTML("beforeend", rows.slice(40).map(rowHTML).join("")); }, 30);
  if (animate && !reduceMotion.matches) { void list.offsetWidth; list.classList.add("enter"); }
}

/* ================= card sheet ================= */

const sheet = $("sheet");
const sheetState = { mode: null, card: null, print: "Normal", cond: "NM", ask: "" };

function openCard(id, p) {
  const c = state.data.cards.find((x) => String(x.id) === String(id));
  if (!c) return;
  Object.assign(sheetState, { mode: "card", card: c, cond: state.cond, ask: "", print: c.prints.includes(p) ? p : c.prints[0] });
  renderCard();
  showSheet();
}

function ownedTag(c, p) {
  if (!state.coll) return "";
  const mine = owned(c, p);
  if (mine.length) return `<span class="tag have">✅ You have ${mine.map(([, cond, q]) => `${q} ${cond}`).join(", ")}</span>`;
  const others = [...new Set(owned(c).map((it) => pstyle(it[0]).short.replace(/^\S+ /, "")))];
  return `<span class="tag need">🎯 You need this one.${others.length ? ` You have the ${others.join(" and ").toLowerCase()}.` : ""}</span>`;
}

function renderCard() {
  const { card: c, print: p, cond } = sheetState;
  const st = pstyle(p);
  const sales = c.s.filter((s) => s[1] === p).slice(0, 15);
  const rows = CONDS.map(([k, label]) => {
    const m = market(c, p, k), lo = lowest(c, p, k), s = lastSale(c, p, k);
    return `<button class="crow" type="button" data-scond="${k}" aria-pressed="${k === cond}" aria-label="${label}">
      <span class="c">${k}</span>
      <span class="v${m == null ? " none" : ""}">${fmt(m)}</span>
      <span class="v${lo ? "" : " none"}">${lo ? `${fmt(lo[0])}<small>${lo[1] ? `+${fmt(lo[1])} ship` : "free ship"}</small>` : "—"}</span>
      <span class="v${s ? "" : " none"}">${s ? `${fmt(s[2])}<small>${shortDate(s[3])}</small>` : "—"}</span>
    </button>`;
  }).join("");

  sheet.innerHTML = `<div class="sheet-inner">
    <div class="grabzone"><button class="close" type="button" data-close aria-label="Close">✕</button><div class="grab" aria-hidden="true"></div></div>
    <div class="card-head">
      <div class="card-img${st.cls !== "pr-normal" ? " foil" : ""}">${c.img ? `<img src="img/${c.id}.jpg" alt="${esc(c.name)} card">` : ""}</div>
      <div>
        <h2 id="sheet-title">${esc(c.name)}</h2>
        <p class="set-line">${esc(c.setName)} ${esc(c.num)}</p>
        <p>${esc(c.rarity)}</p>
        ${st.tag ? `<span class="ptag big ${st.cls}">${st.tag}</span>` : ""}
        ${ownedTag(c, p)}
      </div>
    </div>
    ${c.prints.length > 1 ? `<div class="seg" id="sprint" role="group" aria-label="Version"></div>` : ""}
    <div class="ctable">
      <div class="chead" aria-hidden="true"><span>Cond.</span><span>Market</span><span>🛒 Lowest</span><span>🏷️ Sold</span></div>
      ${rows}
    </div>
    <div class="ask">
      <label for="ask"><span class="emoji" aria-hidden="true">🏪</span>Table price
        <span class="money">$<input id="ask" inputmode="decimal" type="text" placeholder="0.00" value="${esc(sheetState.ask)}" autocomplete="off"></span>
      </label>
      <div class="verdict" id="verdict" aria-live="polite"></div>
      <div id="askoff"></div>
      <button class="btn addcart" type="button" data-addcart>${addCartLabel()}</button>
    </div>
    <section class="sales">
      <h3>🏷️ Recent sales</h3>
      ${sales.length ? `<ol>${sales.map((s) => `<li><span>${shortDate(s[3])}</span><span class="k">${s[0]}</span><span class="p">${fmt(s[2])}</span></li>`).join("")}</ol>`
        : `<p class="none">No sales of this version on TCGplayer lately.</p>`}
    </section>
    <a class="btn" href="https://www.tcgplayer.com/product/${c.id}" target="_blank" rel="noopener">See it live on TCGplayer
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    <p class="fine">Prices from TCGplayer, checked ${ago(state.data.listingsUpdated || state.data.updated)}. Lowest is the cheapest copy listed in that condition, shipping to the US. Sold is the item price without shipping.</p>
  </div>`;
  if (c.prints.length > 1) buildSeg($("sprint"), c.prints.map((x) => [x, pstyle(x).short]), p, "sprint");
  renderVerdict(false);
}

const QUIPS = {
  "Great deal!": ["Buy it before they check their phone.", "Act casual. Pay fast.", "Even I'm impressed. Barely."],
  "Same as online": ["At least you skip the shipping wait.", "A wash. Haggle a little anyway."],
  "Fair price": ["Fine. Not a steal, but fine.", "Fair. Try 90% and see if they blink."],
  "Pricey": ["They saw you coming.", "Your wallet just flinched.", "Haggle, or walk away slowly."],
  "Under market": ["Under market. I'll allow it.", "Not bad. Not bad at all."],
  "Over market": ["Absolutely not. Well, maybe. No.", "Over market. Make a face and wait."],
};
function renderVerdict(pop) {
  const out = $("verdict"); if (!out) return;
  const { card: c, print: p, cond } = sheetState;
  const ask = parseFloat(String(sheetState.ask).replace(/[^0-9.]/g, ""));
  const m = market(c, p, cond);
  const lo = lowest(c, p, cond);
  const loT = lo ? lo[0] + lo[1] : null;
  let e, title, sub;
  if (!ask) { e = "💬"; title = ""; sub = `Type the vendor's price to compare it with ${cond} on TCGplayer.`; }
  else {
    const pct = m ? `${Math.round((ask / m) * 100)}% of ${cond} market (${fmt(m)})` : `No ${cond} market price`;
    if (loT != null && ask < loT - 0.004) { e = "🔥"; title = "Great deal!"; sub = `${fmt(loT - ask)} less than the cheapest one online (${fmt(loT)} shipped). ${pct}.`; }
    else if (loT != null && Math.abs(ask - loT) <= 0.004) { e = "🤝"; title = "Same as online"; sub = `Matches the cheapest listing shipped. ${pct}.`; }
    else if (loT != null && m != null && ask <= m) { e = "👍"; title = "Fair price"; sub = `${pct}. Online has one for ${fmt(loT)} shipped, ${fmt(ask - loT)} less.`; }
    else if (loT != null) { e = "😬"; title = "Pricey"; sub = `Online is ${fmt(ask - loT)} cheaper (${fmt(loT)} shipped). ${pct}.`; }
    else if (m != null && ask <= m) { e = "👍"; title = "Under market"; sub = `${pct}. None listed online in ${cond} right now.`; }
    else if (m != null) { e = "😬"; title = "Over market"; sub = `${pct}. None listed online in ${cond} right now.`; }
    else { e = "🤷"; title = "Not enough data"; sub = `TCGplayer has no ${cond} market or listings for this version.`; }
  }
  const qs = QUIPS[title];
  const quip = qs ? qs[(Number(c.id) + COND_ORDER.indexOf(cond)) % qs.length] : "";
  out.innerHTML = `<span class="emoji" aria-hidden="true">${e}</span><span>${title ? `<b>${title}</b>` : ""}${sub}${quip ? `<i class="quip">${quip}</i>` : ""}</span>`;
  const off = $("askoff");
  if (off) {
    if (!ask) off.innerHTML = "";
    else { if (!off.firstChild) off.innerHTML = `<h3 class="hh ask-h">Offer them</h3>`; paintTiles(off, ask, m); }
  }
  if (pop && !reduceMotion.matches) { out.classList.remove("pop"); void out.offsetWidth; out.classList.add("pop"); }
}

/* ================= collection sheet ================= */

function openCollection() {
  sheetState.mode = "coll";
  store.set("nudged", true);
  renderNudge();
  renderCollection();
  showSheet();
}

function renderCollection(msg) {
  const c = state.coll;
  const body = c
    ? `<h2 id="sheet-title">Your collection</h2>
       <p>I'm marking what you own from <b>${esc(c.file || "your Collectr export")}</b>, imported ${ago(c.at)}.</p>
       <div class="stats-big"><span><b>${c.cards}</b>cards matched</span><span><b>${c.matched}</b>copies</span>${c.missedCount ? `<span><b>${c.missedCount}</b>not found</span>` : ""}</div>
       ${c.missedCount ? `<p class="fine">Not found: ${esc(c.missed.join(", "))}${c.missedCount > c.missed.length ? "…" : ""}</p>` : ""}
       <button class="btn primary" type="button" data-pick>📥 Import a newer export</button>
       <button class="btn quiet" type="button" data-forget>Remove my collection</button>`
    : `<h2 id="sheet-title">Mark what you own</h2>
       <p>Export your portfolio from Collectr as a CSV file, then pick it here. I'll match every set I track.</p>
       <button class="btn primary" type="button" data-pick>📥 Choose Collectr file</button>`;
  sheet.innerHTML = `<div class="sheet-inner">
    <div class="grabzone"><button class="close" type="button" data-close aria-label="Close">✕</button><div class="grab" aria-hidden="true"></div></div>
    <div class="coll">
      <div class="buddy-big" data-mood="${msg ? "happy" : "idle"}">${mascot()}</div>
      ${msg ? `<p class="verdict pop" style="justify-content:center"><b>${esc(msg)}</b></p>` : ""}
      ${body}
      <p class="fine">Your collection stays on this phone. It isn't uploaded anywhere.</p>
    </div>
  </div>`;
}

$("csv").addEventListener("change", async (e) => {
  const f = e.target.files?.[0]; e.target.value = "";
  if (!f || !state.data) return;
  try {
    importCollectr(await f.text(), f.name);
    renderControls(); renderList(true);
    renderCollection(`Found ${state.coll.cards} of your cards! 🎉`);
    mood("happy", 2000); say(`${state.coll.cards} cards and you still want more. Classic. Tap 🎯 Need to see what's missing.`);
  } catch (err) {
    renderCollection();
    sheet.querySelector(".coll").insertAdjacentHTML("afterbegin", `<p class="tag need">⚠️ ${esc(err.message)}</p>`);
  }
});

/* ================= hagl: haggle tools ================= */

const HAGL_PCTS = [85, 90, 95];
const HAGL_LINES = [
  "Start low. They expect it.",
  "Say \"bundle deal\" with a straight face.",
  "Never let them see you want it.",
  "Mention cash. Watch the price drop.",
  "Point out the whitening. There's always whitening.",
  "Walk away once. They'll call you back.",
  "Don't round up. Ever.",
];
const COND_ORDER = CONDS.map(([k]) => k);
const cart = { items: [], lot: "", ...(store.get("cart", null) || {}) };
function cartBadge(bump) {
  const n = cart.items.length, el = $("hagl-n");
  el.hidden = !n; el.textContent = n > 99 ? "99+" : n;
  if (bump && !reduceMotion.matches) { const b = $("hagl"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
}
const saveCart = () => { store.set("cart", { items: cart.items, lot: cart.lot }); cartBadge(); };

// a little coin hops from what you tapped into the cart
function flyCoin(from, to, done) {
  if (reduceMotion.matches || !from || !to) { done?.(); return; }
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const coin = document.createElement("span");
  coin.className = "flycoin"; coin.setAttribute("aria-hidden", "true");
  coin.style.left = `${x0 - 13}px`; coin.style.top = `${y0 - 13}px`;
  (sheet.open ? sheet : document.body).appendChild(coin);
  const dx = x1 - x0, dy = y1 - y0, lift = Math.min(-60, dy / 2 - 70);
  coin.animate([
    { transform: "translate(0,0) scale(.6) rotate(0)", opacity: 0 },
    { transform: `translate(${dx * .45}px, ${lift}px) scale(1.15) rotate(220deg)`, opacity: 1, offset: .45 },
    { transform: `translate(${dx}px, ${dy}px) scale(.55) rotate(420deg)`, opacity: .9 },
  ], { duration: 700, easing: "cubic-bezier(.3,.7,.4,1)" }).finished.then(() => { coin.remove(); done?.(); }, () => coin.remove());
}
const hagl = { tab: store.get("hagltab", "quick"), quick: "", q: "", line: "" };
const money = (s) => { const v = parseFloat(String(s ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(v) && v > 0 ? v : null; };
const pctOf = (v, of) => (of ? `${Math.round((v / of) * 100)}%` : "");

// cheapest copy on TCGplayer in this condition; if there's none, the cheapest one in better shape
function bestListing(c, p, cond) {
  const exact = lowest(c, p, cond);
  if (exact) return { price: exact[0], ship: exact[1], cond, exact: true };
  let best = null;
  for (const k of COND_ORDER.slice(0, COND_ORDER.indexOf(cond))) {
    const v = lowest(c, p, k);
    if (v && (!best || v[0] + v[1] < best.price + best.ship)) best = { price: v[0], ship: v[1], cond: k, exact: false };
  }
  return best;
}

function addToCart(c, p, cond, ask) {
  cart.items.unshift({ id: String(c.id), p, cond, ask: ask || "" });
  saveCart();
}
function addCartLabel() {
  const c = sheetState.card;
  const n = c ? cart.items.filter((it) => it.id === String(c.id) && it.p === sheetState.print).length : 0;
  return n ? `✅ In your hagl cart${n > 1 ? ` ×${n}` : ""}. Add another` : `🤝 Add to hagl cart`;
}

function openHagl(tab) {
  if (!state.data && tab !== "quick") tab = "quick";
  if (tab) { hagl.tab = tab; store.set("hagltab", tab); }
  sheetState.mode = "hagl";
  hagl.line = HAGL_LINES[Math.floor(Math.random() * HAGL_LINES.length)];
  renderHagl();
  showSheet();
  if (hagl.tab === "quick") setTimeout(() => $("hq")?.focus({ preventScroll: true }), 450);
}

function renderHagl() {
  const n = cart.items.length;
  sheet.innerHTML = `<div class="sheet-inner hagl">
    <div class="grabzone"><button class="close" type="button" data-close aria-label="Close">✕</button><div class="grab" aria-hidden="true"></div></div>
    <div class="hagl-head">
      <div class="buddy-big" data-mood="smug">${mascot()}</div>
      <div><h2 id="sheet-title">hagl</h2><p>${esc(hagl.line)}</p></div>
    </div>
    <div class="seg" id="htabs" role="group" aria-label="Tool"></div>
    <div id="hbody"></div>
  </div>`;
  buildSeg($("htabs"), [["quick", "⚡ Quick %"], ["cart", `🛒 Cart${n ? ` (${n})` : ""}`]], hagl.tab, "htab");
  renderHaglBody();
}

function renderHaglBody() {
  const body = $("hbody"); if (!body) return;
  if (hagl.tab === "quick") {
    body.innerHTML = `<div class="hq">
      <label class="hq-in" for="hq">Their price
        <span class="money">$<input id="hq" inputmode="decimal" type="text" placeholder="0.00" autocomplete="off" value="${esc(hagl.quick)}"></span>
      </label>
      <div id="hq-out"></div>
    </div>`;
    renderQuick();
    return;
  }
  if (!state.data) { body.innerHTML = `<p class="fine">The cart needs prices saved on this phone first. Tap ↻ with a connection.</p>`; return; }
  body.innerHTML = `<label class="search hsearch">
      <span class="visually-hidden">Add a card from their table</span>
      <span class="emoji" aria-hidden="true">🔍</span>
      <input id="hs" type="search" placeholder="Add a card from their table" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" value="${esc(hagl.q)}">
    </label>
    <div id="hs-res" class="hres"></div>
    <div id="hcart" class="hcart"></div>
    <div id="hsum" hidden>
      <div class="htotals"><div id="htot"></div>
        <label class="trow lot" for="hlot"><span>Price for the whole lot<small>if they quote one number</small></span>
          <span class="money sm">$<input id="hlot" inputmode="decimal" type="text" autocomplete="off" placeholder="0.00" value="${esc(cart.lot)}"></span></label>
      </div>
      <div id="hoffer"></div>
      <button class="btn quiet" type="button" data-hclear>Empty the cart</button>
      <p class="fine">Shipping is counted per card, so buying several from one seller would cost a bit less. If a condition isn't listed, I use the cheapest copy in better shape.</p>
    </div>`;
  renderSearch();
  renderCart();
}

function tiles(base, mkt) {
  return `<div class="htiles">${HAGL_PCTS.map((p) => {
    const v = Math.round(base * p) / 100;
    return `<div class="htile"><span class="hp">${p}%</span><b>${v >= 100 ? usd0.format(Math.round(v)) : fmt(v)}</b><small>${mkt ? `${pctOf(v, mkt)} of market` : `save ${fmt(base - v)}`}</small></div>`;
  }).join("")}</div>`;
}

function paintTiles(el, base, mkt) {
  const wrap = el.querySelector(":scope > .htiles");
  if (!wrap) { el.insertAdjacentHTML("beforeend", tiles(base, mkt)); return; }
  const fresh = document.createElement("div"); fresh.innerHTML = tiles(base, mkt);
  [...wrap.children].forEach((t, k) => {
    const n = fresh.firstElementChild.children[k], b = t.querySelector("b"), nb = n.querySelector("b");
    if (b.textContent !== nb.textContent) { b.textContent = nb.textContent; if (!reduceMotion.matches) { b.classList.remove("tick"); void b.offsetWidth; b.classList.add("tick"); } }
    t.querySelector("small").textContent = n.querySelector("small").textContent;
  });
}
const QUICK_HINT = `<p class="hint">Type what they're asking and I'll do the math. You do the talking.</p>`;
function renderQuick() {
  const out = $("hq-out"); if (!out) return;
  const v = money(hagl.quick);
  if (!v) { out.innerHTML = QUICK_HINT; return; }
  out.querySelector(".hint")?.remove();
  paintTiles(out, v);
}

/* --- cart: search --- */
function searchRows(raw) {
  const { print, q } = parseQuery(raw);
  if (!q) return [];
  const isNum = /^[a-z]*\d+[a-z]?(\/[a-z]*\d*)?$/.test(q);
  return state.data.rows.filter(({ c, p }) => printMatches(p, print) && (isNum
    ? (q.includes("/") ? c.num.toLowerCase().startsWith(q) : c.nk === q || c.nk.replace(/[a-z]$/, "") === q)
    : c.key.includes(q)));
}
function renderSearch() {
  const el = $("hs-res"); if (!el) return;
  if (!hagl.q.trim()) { el.innerHTML = ""; return; }
  const all = searchRows(hagl.q), rows = all.slice(0, 8);
  el.innerHTML = rows.length
    ? rows.map(({ c, p }) => {
        const st = pstyle(p), m = market(c, p, "NM");
        return `<button class="hres-row ${st.cls}" type="button" data-hadd="${c.id}" data-p="${esc(p)}">
          ${c.img ? `<img src="img/${c.id}.jpg" alt="" loading="lazy" width="34" height="47">` : `<span class="noimg"></span>`}
          <span class="who"><b>${esc(c.name)}</b><span>${esc([c.abbr, c.num].filter(Boolean).join(" "))}${st.tag ? ` · ${st.short}` : ""}</span></span>
          <span class="m">${fmt(m)}<small>NM</small></span><span class="plus" aria-hidden="true">＋</span>
        </button>`;
      }).join("") + (all.length > rows.length ? `<p class="fine">${all.length - rows.length} more. Add a number or "rev" / "holo" to narrow it down.</p>` : "")
    : `<p class="fine">Nothing matches "${esc(hagl.q)}".</p>`;
}

/* --- cart: items and totals --- */
function cartRows() {
  return cart.items.map((it, i) => {
    const c = state.data.byId.get(it.id);
    if (!c) return { it, i, c: null };
    return { it, i, c, m: market(c, it.p, it.cond), lo: bestListing(c, it.p, it.cond), ask: money(it.ask) };
  });
}

function renderCart() {
  const el = $("hcart"); if (!el) return;
  const rows = cartRows();
  if (!rows.length) {
    el.innerHTML = `<div class="hempty"><b>Your cart is empty</b>Search above for the cards on their table, or tap 🤝 Add to hagl cart on any card.</div>`;
    $("hsum").hidden = true;
    return;
  }
  el.innerHTML = rows.map(({ it, i, c, m, lo }) => {
    if (!c) return `<div class="hitem"><div class="hwho"><b>Card not found</b><span>It isn't in the latest prices.</span></div><button class="hx" type="button" data-hrm="${i}" aria-label="Remove">✕</button></div>`;
    const st = pstyle(it.p);
    const loTxt = lo
      ? `${fmt(lo.price + lo.ship)}<small>${lo.exact ? (lo.ship ? `incl. ${fmt(lo.ship)} ship` : "free ship") : `only ${lo.cond} listed`}</small>`
      : `—<small>none listed</small>`;
    return `<div class="hitem ${st.cls}">
      <div class="htop">
        ${c.img ? `<img src="img/${c.id}.jpg" alt="" loading="lazy" width="40" height="56">` : `<span class="noimg"></span>`}
        <div class="hwho"><b>${esc(c.name)}</b><span>${esc([c.abbr, c.num].filter(Boolean).join(" "))}</span>${st.tag ? `<span class="ptag">${st.tag}</span>` : ""}</div>
        <button class="hx" type="button" data-hrm="${i}" aria-label="Remove ${esc(c.name)}">✕</button>
      </div>
      <div class="hcond" role="group" aria-label="Condition">${COND_ORDER.map((k) => `<button type="button" data-hcond="${k}" data-i="${i}" aria-pressed="${k === it.cond}">${k}</button>`).join("")}</div>
      <div class="hnums">
        <span><small>Market</small><b class="${m == null ? "none" : ""}">${fmt(m)}</b></span>
        <span><small>🛒 TCG low</small><b class="${lo ? "" : "none"}">${loTxt}</b></span>
        <label><small>🏪 Sticker</small><span class="money sm">$<input data-hask="${i}" inputmode="decimal" type="text" placeholder="0.00" autocomplete="off" value="${esc(it.ask)}"></span></label>
      </div>
    </div>`;
  }).join("");
  renderTotals();
}

function renderTotals() {
  const el = $("htot"); if (!el) return;
  const rows = cartRows().filter((r) => r.c);
  $("hsum").hidden = !rows.length;
  if (!rows.length) return;
  const n = rows.length;
  const withM = rows.filter((r) => r.m != null), withLo = rows.filter((r) => r.lo), withAsk = rows.filter((r) => r.ask != null);
  const mTot = withM.reduce((s, r) => s + r.m, 0);
  const loTot = withLo.reduce((s, r) => s + r.lo.price + r.lo.ship, 0);
  const askSum = withAsk.reduce((s, r) => s + r.ask, 0);
  const lot = money(cart.lot);
  const sticker = lot ?? (withAsk.length ? askSum : null);
  const base = sticker ?? mTot;
  const missM = n - withM.length, missLo = n - withLo.length;

  el.innerHTML = `<div class="trow"><span>Market total<small>${n} card${n > 1 ? "s" : ""}${missM ? `, ${missM} with no market price` : ""}</small></span><b>${fmt(mTot)}</b></div>
    <div class="trow"><span>🛒 Buy it all on TCGplayer<small>lowest listed + shipping${missLo ? `, ${missLo} not listed` : ""}</small></span><b>${withLo.length ? fmt(loTot) : "—"}</b></div>
    <div class="trow"><span>🏪 Their stickers<small>${withAsk.length ? `${withAsk.length} of ${n} priced` : "type them on each card"}</small></span><b>${withAsk.length ? fmt(askSum) : "—"}</b></div>`;
  $("hlot").placeholder = withAsk.length ? askSum.toFixed(2) : "0.00";

  // compare like with like: a lot price covers every card, stickers only cover the cards that have one
  const cover = lot ? rows : withAsk;
  const partial = !lot && withAsk.length && withAsk.length < n;
  const mCmp = cover.every((r) => r.m != null) ? cover.reduce((s, r) => s + r.m, 0) : null;
  const loCmp = cover.every((r) => r.lo) ? cover.reduce((s, r) => s + r.lo.price + r.lo.ship, 0) : null;
  const mRef = sticker != null ? mCmp : mTot;
  let verdict = "";
  if (sticker != null) {
    const bits = [];
    if (mCmp) bits.push(`${lot ? "The lot price is" : "Their stickers are"} <b>${pctOf(sticker, mCmp)}</b> of market`);
    if (loCmp != null) {
      const d = sticker - loCmp;
      bits.push(Math.abs(d) < 0.005 ? "the same as buying online" : d < 0 ? `<b>${fmt(-d)} less</b> than buying online` : `<b>${fmt(d)} more</b> than buying online`);
    }
    if (bits.length) verdict = `<p class="hverdict">${bits.join(", ")}${partial ? ` (for the ${withAsk.length} priced card${withAsk.length > 1 ? "s" : ""})` : ""}.</p>`;
  }
  const ho = $("hoffer");
  if (!ho.firstChild) ho.innerHTML = `<div id="hverd"></div><h3 class="hh" id="hoh"></h3><div id="htl"></div>`;
  $("hverd").innerHTML = verdict;
  $("hoh").textContent = `Offer ${sticker != null ? (lot ? "on the lot price" : "on their stickers") : "on market"}`;
  const tl = $("htl");
  if (base) { tl.querySelector(".fine")?.remove(); paintTiles(tl, base, mRef || null); }
  else tl.innerHTML = `<p class="fine">Add stickers or a lot price to work out offers.</p>`;
}

function setCartCount() {
  const b = $("htabs")?.querySelector('[data-htab="cart"]');
  if (b) b.textContent = `🛒 Cart${cart.items.length ? ` (${cart.items.length})` : ""}`;
}

sheet.addEventListener("click", (e) => {
  const add = e.target.closest("[data-addcart]");
  if (add && sheetState.mode === "card") {
    addToCart(sheetState.card, sheetState.print, sheetState.cond, sheetState.ask);
    add.textContent = addCartLabel();
    flyCoin(add, $("hagl"), () => cartBadge(true));
    if (!reduceMotion.matches) { add.classList.remove("pop"); void add.offsetWidth; add.classList.add("pop"); }
    say(`${cart.items.length} in the cart. Tap 🤝 hagl to see the damage.`);
    return;
  }
  if (sheetState.mode !== "hagl") return;
  const t = e.target.closest("[data-htab]");
  if (t) {
    if (t.dataset.htab === "cart" && !state.data) return;
    hagl.tab = t.dataset.htab; store.set("hagltab", hagl.tab);
    setSeg($("htabs"), hagl.tab, "htab");
    renderHaglBody();
    if (hagl.tab === "quick") $("hq")?.focus({ preventScroll: true });
    return;
  }
  const a = e.target.closest("[data-hadd]");
  if (a) {
    const c = state.data.byId.get(a.dataset.hadd);
    if (!c) return;
    addToCart(c, a.dataset.p, state.cond, "");
    const tab = $("htabs")?.querySelector('[data-htab="cart"]');
    flyCoin(a.querySelector(".plus") || a, tab, () => { setCartCount(); if (tab && !reduceMotion.matches) { tab.classList.remove("bump"); void tab.offsetWidth; tab.classList.add("bump"); } });
    hagl.q = ""; const inp = $("hs"); if (inp) inp.value = "";
    renderSearch(); renderCart();
    return;
  }
  const rm = e.target.closest("[data-hrm]");
  if (rm) { cart.items.splice(Number(rm.dataset.hrm), 1); saveCart(); renderCart(); setCartCount(); return; }
  const hc = e.target.closest("[data-hcond]");
  if (hc) { const it = cart.items[Number(hc.dataset.i)]; if (it) { it.cond = hc.dataset.hcond; saveCart(); renderCart(); } return; }
  if (e.target.closest("[data-hclear]")) { cart.items = []; cart.lot = ""; saveCart(); const l = $("hlot"); if (l) l.value = ""; renderCart(); setCartCount(); }
});

let hTimer;
sheet.addEventListener("input", (e) => {
  if (sheetState.mode !== "hagl") return;
  const el = e.target;
  if (el.id === "hq") { hagl.quick = el.value; renderQuick(); return; }
  if (el.id === "hs") { hagl.q = el.value; clearTimeout(hTimer); hTimer = setTimeout(renderSearch, 80); return; }
  if (el.id === "hlot") { cart.lot = el.value; saveCart(); renderTotals(); return; }
  if (el.dataset.hask != null) {
    const it = cart.items[Number(el.dataset.hask)]; if (!it) return;
    it.ask = el.value; saveCart(); renderTotals();
  }
});
$("hagl").addEventListener("click", () => openHagl());

/* ================= sheet open/close + drag ================= */

function showSheet() {
  sheet.classList.remove("closing");
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
}
function closeSheet() {
  if (!sheet.open || sheet.classList.contains("closing")) return;
  if (reduceMotion.matches) { sheet.close(); return; }
  sheet.classList.add("closing");
  sheet.addEventListener("animationend", () => { sheet.classList.remove("closing"); sheet.style.transform = ""; sheet.close(); }, { once: true });
}
sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });

let drag = null;
sheet.addEventListener("pointerdown", (e) => {
  if (!e.target.closest(".grabzone") || e.target.closest("[data-close]")) return;
  drag = { y: e.clientY, dy: 0 }; sheet.classList.add("dragging"); sheet.setPointerCapture(e.pointerId);
});
sheet.addEventListener("pointermove", (e) => {
  if (!drag) return;
  drag.dy = Math.max(0, e.clientY - drag.y);
  sheet.style.transform = `translateY(${drag.dy}px)`;
});
const endDrag = () => {
  if (!drag) return;
  sheet.classList.remove("dragging");
  if (drag.dy > 110) closeSheet();
  else { sheet.style.transition = "transform .3s var(--spring)"; sheet.style.transform = ""; setTimeout(() => (sheet.style.transition = ""), 320); }
  drag = null;
};
sheet.addEventListener("pointerup", endDrag);
sheet.addEventListener("pointercancel", endDrag);

sheet.addEventListener("click", (e) => {
  if (e.target === sheet || e.target.closest("[data-close]")) { closeSheet(); return; }
  if (e.target.closest("[data-pick]")) { $("csv").click(); return; }
  if (e.target.closest("[data-forget]")) {
    state.coll = null; state.own = "all"; store.del("coll");
    renderControls(); renderList(true); renderCollection(); return;
  }
  const pb = e.target.closest("[data-sprint]");
  if (pb) {
    sheetState.print = pb.dataset.sprint;
    setSeg($("sprint"), sheetState.print, "sprint");
    setTimeout(renderCard, reduceMotion.matches ? 0 : 90);
    return;
  }
  const cb = e.target.closest("[data-scond]");
  if (cb) {
    sheetState.cond = cb.dataset.scond;
    sheet.querySelectorAll("[data-scond]").forEach((x) => x.setAttribute("aria-pressed", String(x === cb)));
    renderVerdict(!!sheetState.ask);
  }
});
let askTimer;
sheet.addEventListener("input", (e) => {
  if (e.target.id !== "ask") return;
  sheetState.ask = e.target.value;
  clearTimeout(askTimer);
  askTimer = setTimeout(() => renderVerdict(true), 250);
});

/* ================= on-screen keyboard ================= */
// Keep sheets above the keyboard. Chrome resizes the page with the meta tag; this covers browsers that don't.
let fullH = innerHeight;
function onViewport() {
  const vv = window.visualViewport, root = document.documentElement;
  const h = vv ? vv.height : innerHeight;
  fullH = Math.max(fullH, innerHeight);
  const over = vv ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
  root.style.setProperty("--vvh", `${Math.round(h)}px`);
  root.style.setProperty("--kb", `${Math.round(over)}px`);
  const open = h < fullH * 0.75 && document.activeElement?.tagName === "INPUT";
  const was = root.classList.contains("kb");
  root.classList.toggle("kb", open);
  if (open && !was) revealFocus();
}
// scroll the field (and what it controls) into the space above the keyboard
function revealFocus() {
  const el = document.activeElement;
  if (!el || el.tagName !== "INPUT" || !sheet.contains(el)) return;
  const target = el.id === "ask" ? el.closest(".ask") : el.id === "hq" ? el.closest(".hq") : el.id === "hs" ? el.closest(".hsearch") : el.closest(".hitem, .trow") || el;
  setTimeout(() => target.scrollIntoView({ block: el.id === "hlot" ? "center" : "start", behavior: reduceMotion.matches ? "auto" : "smooth" }), 60);
}
window.visualViewport?.addEventListener("resize", onViewport);
addEventListener("resize", onViewport);
addEventListener("orientationchange", () => { fullH = 0; setTimeout(onViewport, 400); });
document.addEventListener("focusin", () => setTimeout(onViewport, 50));
document.addEventListener("focusout", () => setTimeout(onViewport, 50));
sheet.addEventListener("focusin", () => { if (document.documentElement.classList.contains("kb")) revealFocus(); });
onViewport();

/* ================= events ================= */

$("sets").addEventListener("click", (e) => {
  const own = e.target.closest("[data-own]");
  if (own) {
    state.own = state.own === own.dataset.own ? "all" : own.dataset.own;
    $("sets").querySelectorAll("[data-own]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.own === state.own)));
    renderList(true); return;
  }
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  state.tab = b.dataset.tab; store.set("tab", state.tab);
  $("sets").querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.tab === state.tab)));
  b.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
  renderList(true);
});
const COND_LINES = {
  NM: ["Near Mint only. Look at you, fancy.", "Mint or nothing. I respect the delusion."],
  LP: ["Lightly Played. The sensible choice. Boring, but sensible.", "LP: basically NM if you don't look too hard."],
  MP: ["Moderately Played. Pre-loved, like your wallet.", "MP. A card with a past. I like that."],
  HP: ["Heavily Played? Someone's bargain hunting.", "HP. It's been through things. So have you."],
  DMG: ["Damaged. Bold. I like it.", "Creased cardboard is still cardboard."],
};
let condTalk = 0;
$("condition").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cond]"); if (!b || b.dataset.cond === state.cond) return;
  state.cond = b.dataset.cond; store.set("cond", state.cond);
  setSeg($("condition"), state.cond, "cond"); renderList(false);
  const list = $("list");
  if (!reduceMotion.matches) { list.classList.remove("tick"); void list.offsetWidth; list.classList.add("tick"); }
  if (++condTalk % 2 === 1) { const l = COND_LINES[state.cond]; say(l[Math.floor(Math.random() * l.length)]); }
  if ($("buddy").dataset.mood === "idle") play("jingle");
});
$("sort").addEventListener("click", () => {
  state.sort = state.sort === "num" ? "price" : "num"; store.set("sort", state.sort);
  $("sort").textContent = SORTS[state.sort];
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  renderList(true);
});
let qTimer;
$("q").addEventListener("input", (e) => {
  clearTimeout(qTimer);
  if (!state.refreshing) mood("search", 1200);
  qTimer = setTimeout(() => { state.q = e.target.value; renderList(false); }, 90);
});
$("list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]"); if (b) openCard(b.dataset.id, b.dataset.p);
});
$("nudge").addEventListener("click", (e) => { if (e.target.closest("[data-open-coll]")) openCollection(); });
$("collection").addEventListener("click", () => { if (state.data) openCollection(); });
$("refresh").addEventListener("click", () => refresh(true));
$("theme").addEventListener("click", () => {
  applyTheme(state.theme === "dark" ? "light" : "dark"); store.set("theme", state.theme);
  say(state.theme === "light" ? "Ow. My eyes. Who turned the lights on? 😎" : "Ahh. Much better. Money looks good in the dark.");
  if ($("buddy").dataset.mood === "idle") play(state.theme === "light" ? "wiggle" : "smug");
});
$("buddy").addEventListener("click", () => {
  const b = $("buddy");
  if (b.dataset.mood !== "idle" && b.dataset.mood !== "smug") return smug(false);
  mood("idle"); play("spill"); smug(false);
});
$("bubble").addEventListener("click", () => smug());

const finder = document.querySelector(".finder");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { finder.classList.toggle("stuck", finder.getBoundingClientRect().top <= 0 && scrollY > 40); ticking = false; });
}, { passive: true });

addEventListener("online", () => { renderStatus(); refresh(); });
addEventListener("offline", () => { renderStatus(); mood("sleepy", 6000); say("No signal. Relax, I saved everything 📦"); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    smug();
    if (navigator.onLine && state.data && Date.now() - new Date(state.data.updated).getTime() > 30 * 60000) refresh();
  }
});

/* ================= start ================= */

const h1 = document.querySelector("h1");
h1.innerHTML = [...h1.textContent].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
h1.setAttribute("aria-label", "bagl");
h1.addEventListener("click", () => {
  if (reduceMotion.matches) return;
  h1.classList.remove("wave"); void h1.offsetWidth; h1.classList.add("wave");
  if ($("buddy").dataset.mood === "idle") play("jingle");
});

(async function start() {
  cartBadge();
  $("buddy").innerHTML = mascot();
  $("buddy").dataset.mood = "idle";
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    navigator.serviceWorker.ready.then(() => setTimeout(warmImages, 600));
    navigator.serviceWorker.addEventListener("controllerchange", () => setTimeout(warmImages, 600));
  }
  smug();
  renderControls();
  await loadSaved();
  renderControls();
  renderList(true);
  renderStatus();
  setTimeout(idleLoop, 3000);
  if (navigator.onLine) await refresh();
  else { renderStatus(); if (state.data) mood("sleepy", 6000); }
})();
