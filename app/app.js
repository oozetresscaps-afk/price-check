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

/* ================= the mascot ================= */

let mascotCount = 0;
function mascot() {
  const id = ++mascotCount;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="mascot" aria-hidden="true">
<defs><clipPath id="cg-${id}"><path d="M129.5 52.8 C135.6 53.1 134.7 53.4 136.6 54.2 C138.5 54.9 140.1 55.8 140.9 57.4 C141.8 59.1 141.4 55.5 141.7 64.2 C141.9 73.0 142.3 94.6 142.4 110.0 C142.6 125.4 143.1 148.0 142.6 156.7 C142.2 165.4 140.7 160.6 139.6 162.2 C138.6 163.8 138.0 165.4 136.3 166.4 C134.6 167.4 135.5 167.8 129.4 168.0 C123.4 168.1 109.8 167.1 100.0 167.3 C90.2 167.4 76.8 168.9 70.8 168.7 C64.8 168.5 65.8 167.1 64.1 166.0 C62.3 164.9 61.2 163.7 60.3 162.1 C59.4 160.6 59.1 165.3 58.7 156.6 C58.3 147.9 58.2 125.4 58.0 110.0 C57.9 94.6 57.6 72.9 57.8 64.2 C58.1 55.4 58.5 59.1 59.5 57.4 C60.5 55.7 62.0 55.2 63.6 54.2 C65.3 53.1 63.1 51.5 69.2 51.2 C75.2 50.9 89.9 52.0 100.0 52.2 C110.1 52.5 123.4 52.4 129.5 52.8 Z"/></clipPath></defs>
<g transform="translate(-6 0) scale(1.04) rotate(-5 100 150)">
<g class="cg-hop">
  <g class="cg-feet"><path d="M91.7 176.0 C91.6 178.0 89.9 180.4 87.9 181.6 C86.0 182.8 82.2 183.6 79.8 183.2 C77.4 182.8 74.4 180.8 73.4 179.1 C72.3 177.4 72.4 174.6 73.5 172.9 C74.5 171.2 77.3 169.3 79.8 168.8 C82.3 168.3 86.6 168.6 88.5 169.8 C90.5 171.0 91.8 174.0 91.7 176.0 Z" fill="#F6B8C8" stroke="#3B2B3A" stroke-width="5"/><path d="M128.4 176.0 C128.4 177.9 126.5 180.9 124.4 182.1 C122.3 183.2 118.4 183.5 115.8 183.1 C113.3 182.6 110.1 181.0 109.0 179.3 C107.8 177.6 108.1 174.5 109.2 172.8 C110.4 171.1 113.4 169.4 115.9 169.0 C118.3 168.6 121.9 169.2 123.9 170.4 C126.0 171.6 128.3 174.1 128.4 176.0 Z" fill="#F6B8C8" stroke="#3B2B3A" stroke-width="5"/></g>
  <g class="cg-body">
    <path d="M129.5 52.8 C135.6 53.1 134.7 53.4 136.6 54.2 C138.5 54.9 140.1 55.8 140.9 57.4 C141.8 59.1 141.4 55.5 141.7 64.2 C141.9 73.0 142.3 94.6 142.4 110.0 C142.6 125.4 143.1 148.0 142.6 156.7 C142.2 165.4 140.7 160.6 139.6 162.2 C138.6 163.8 138.0 165.4 136.3 166.4 C134.6 167.4 135.5 167.8 129.4 168.0 C123.4 168.1 109.8 167.1 100.0 167.3 C90.2 167.4 76.8 168.9 70.8 168.7 C64.8 168.5 65.8 167.1 64.1 166.0 C62.3 164.9 61.2 163.7 60.3 162.1 C59.4 160.6 59.1 165.3 58.7 156.6 C58.3 147.9 58.2 125.4 58.0 110.0 C57.9 94.6 57.6 72.9 57.8 64.2 C58.1 55.4 58.5 59.1 59.5 57.4 C60.5 55.7 62.0 55.2 63.6 54.2 C65.3 53.1 63.1 51.5 69.2 51.2 C75.2 50.9 89.9 52.0 100.0 52.2 C110.1 52.5 123.4 52.4 129.5 52.8 Z" fill="#F6B8C8" stroke="#3B2B3A" stroke-width="6" stroke-linejoin="round"/>
    <g clip-path="url(#cg-${id})"><path class="cg-shine" d="M124 48 l12 0 l-34 124 l-12 0 Z" fill="#fff" opacity=".45"/></g>
    <path d="M124.7 86.0 C129.4 86.1 127.0 86.2 128.0 86.6 C129.0 87.0 130.3 87.8 130.8 88.6 C131.3 89.5 130.8 88.6 130.9 91.6 C131.0 94.7 131.2 102.0 131.2 107.0 C131.1 112.0 130.8 118.9 130.7 121.8 C130.6 124.8 130.9 123.8 130.5 124.8 C130.0 125.8 129.1 127.2 128.1 127.7 C127.1 128.1 129.2 127.5 124.5 127.5 C119.8 127.5 108.2 127.6 100.0 127.7 C91.8 127.8 80.0 128.3 75.3 128.1 C70.6 128.0 72.7 127.5 71.7 127.0 C70.7 126.5 70.0 125.7 69.4 125.0 C68.9 124.2 68.4 125.2 68.5 122.2 C68.5 119.2 69.3 112.0 69.5 107.0 C69.7 102.0 69.4 95.4 69.5 92.3 C69.7 89.2 70.0 89.2 70.4 88.4 C70.7 87.6 70.9 87.8 71.7 87.4 C72.6 86.9 70.6 86.0 75.3 85.9 C80.0 85.8 91.8 86.5 100.0 86.5 C108.2 86.6 120.1 86.0 124.7 86.0 Z" fill="#FFF4F6" stroke="#3B2B3A" stroke-width="4.5" stroke-linejoin="round"/>
    <g class="cg-sparkle"><path d="M100 95 Q102.16 104.84 112 107 Q102.16 109.16 100 119 Q97.84 109.16 88 107 Q97.84 104.84 100 95 Z" fill="#F4C95D" stroke="#3B2B3A" stroke-width="3.5" stroke-linejoin="round"/></g>
    <g class="cg-sparkle2"><path d="M118 92 Q118.9 96.1 123 97 Q118.9 97.9 118 102 Q117.1 97.9 113 97 Q117.1 96.1 118 92 Z" fill="#fff" stroke="#3B2B3A" stroke-width="3.5" stroke-linejoin="round"/></g>
    <path d="M72 140 h52" stroke="#3B2B3A" stroke-width="3" stroke-linecap="round" opacity=".45"/><path d="M72 148 h40" stroke="#3B2B3A" stroke-width="3" stroke-linecap="round" opacity=".45"/><path d="M72 156 h46" stroke="#3B2B3A" stroke-width="3" stroke-linecap="round" opacity=".45"/>
    <g class="cg-eyes"><g class="cg-look" fill="#3B2B3A">
      <ellipse cx="88.0" cy="69" rx="3.4" ry="4"/><ellipse cx="114.0" cy="69" rx="3.4" ry="4"/>
    </g></g>
    <g class="cg-shut" fill="none" stroke="#3B2B3A" stroke-width="3" stroke-linecap="round">
      <path d="M83.0 70 q4 3 8 0"/><path d="M109.0 70 q4 3 8 0"/>
    </g>
    <g class="cg-glasses" fill="none" stroke="#3B2B3A" stroke-width="5" stroke-linecap="round">
      <path d="M97.2 68.0 C97.1 70.5 96.1 73.8 94.4 75.4 C92.7 77.0 89.4 77.8 87.0 77.7 C84.6 77.6 81.9 76.4 80.2 74.8 C78.6 73.1 77.1 70.2 77.1 68.0 C77.1 65.8 78.6 62.9 80.3 61.3 C81.9 59.6 84.6 58.3 87.0 58.2 C89.4 58.0 92.8 58.8 94.5 60.5 C96.2 62.1 97.2 65.5 97.2 68.0 Z"/><path d="M122.3 70.9 C121.7 73.0 119.4 75.2 117.3 76.2 C115.3 77.2 112.4 77.6 110.2 76.9 C108.1 76.3 105.8 74.5 104.6 72.4 C103.4 70.4 102.4 67.1 103.1 64.9 C103.7 62.7 106.3 60.4 108.4 59.3 C110.6 58.3 113.7 58.0 115.9 58.7 C118.0 59.4 120.3 61.6 121.3 63.6 C122.4 65.6 123.0 68.8 122.3 70.9 Z"/><path d="M96.0 67 Q100 62 104.0 67"/>
    </g>
    <g class="cg-hatwrap"><g transform="rotate(-8 98 44)" stroke="#3B2B3A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M118.5 46.0 C118.5 48.1 115.5 50.9 112.1 52.3 C108.7 53.8 102.7 54.9 98.0 54.9 C93.3 54.8 87.4 53.7 84.2 52.2 C80.9 50.7 78.5 48.1 78.4 46.0 C78.4 43.9 80.8 41.3 84.1 39.7 C87.4 38.2 93.4 36.9 98.0 36.9 C102.6 36.9 108.5 38.2 111.9 39.7 C115.3 41.3 118.4 43.9 118.5 46.0 Z" fill="#B8A6E8"/><path d="M63.1 34.0 L97.5 25.0 L131.2 34.1 L98.5 43.8 Z" fill="#B8A6E8"/>
      <g class="cg-tassel"><path d="M98 34 Q118 34 122 50" fill="none" stroke-width="3.5"/>
      <path d="M118 48 l4 12 l4 -12 Z" fill="#F4C95D" stroke-width="3.5"/></g>
      <circle cx="98" cy="34" r="3.5" fill="#F4C95D" stroke-width="3"/>
    </g></g>
  </g>
  <g class="cg-book" stroke="#3B2B3A" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M70 140 L100 146 L130 140 L130 164 L100 169 L70 164 Z" fill="#9CC7E8"/><path d="M73 138 Q86 135 100 143 L100 165 Q86 158 73 160 Z" fill="#FFFBF2"/><path d="M127 138 Q114 135 100 143 L100 165 Q114 158 127 160 Z" fill="#FFFBF2"/><path d="M78 145 q8 -2 17 1.5" fill="none" stroke-width="2.4" opacity=".5"/><path d="M78 150 q8 -2 17 1.5" fill="none" stroke-width="2.4" opacity=".5"/><path d="M78 155 q8 -2 17 1.5" fill="none" stroke-width="2.4" opacity=".5"/><path d="M105 146.5 q8 -3.5 17 -1.5" fill="none" stroke-width="2.4" opacity=".5"/><path d="M105 151.5 q8 -3.5 17 -1.5" fill="none" stroke-width="2.4" opacity=".5"/><path d="M105 156.5 q8 -3.5 17 -1.5" fill="none" stroke-width="2.4" opacity=".5"/>
    <path class="cg-page" d="M127 138 Q114 135 100 143 L100 165 Q114 158 127 160 Z" fill="#FFFBF2"/>
    <path d="M77.0 154.0 C77.0 155.8 75.3 158.4 73.7 159.5 C72.1 160.6 69.3 161.0 67.4 160.6 C65.5 160.2 63.1 158.6 62.3 157.0 C61.5 155.4 61.8 152.8 62.7 151.2 C63.5 149.5 65.5 147.7 67.3 147.2 C69.2 146.8 71.9 147.6 73.5 148.7 C75.1 149.8 77.0 152.2 77.0 154.0 Z" fill="#F6B8C8" stroke-width="5"/><path d="M138.9 154.0 C139.0 155.8 137.5 158.6 135.9 159.7 C134.3 160.9 131.2 161.3 129.3 160.8 C127.5 160.3 125.5 158.5 124.7 156.8 C123.9 155.2 123.7 152.6 124.5 151.1 C125.3 149.5 127.6 147.8 129.4 147.4 C131.2 147.0 133.9 147.6 135.5 148.7 C137.1 149.8 138.8 152.2 138.9 154.0 Z" fill="#F6B8C8" stroke-width="5"/>
  </g>
</g>
<g class="cg-z" fill="#3B2B3A" opacity=".7" font-family="Baloo 2, sans-serif" font-weight="800"><text x="150" y="58" font-size="20">z</text><text x="164" y="40" font-size="14">z</text></g>
</g>
</svg>`;
}
let moodTimer;
function mood(m, ms) {
  const b = $("buddy");
  b.dataset.mood = m;
  clearTimeout(moodTimer);
  if (ms) moodTimer = setTimeout(() => { b.dataset.mood = "idle"; }, ms);
}

/* little idle routines, picked at random so he never loops the same way */
const IDLES = ["read", "read", "glasses", "look", "shine", "tassel", "wiggle"];
function idleLoop() {
  const b = $("buddy");
  if (!document.hidden && b.dataset.mood === "idle" && !reduceMotion.matches) {
    const next = IDLES[Math.floor(Math.random() * IDLES.length)];
    b.dataset.idle = next;
    setTimeout(() => { if (b.dataset.idle === next) b.dataset.idle = ""; }, 2700);
  }
  setTimeout(idleLoop, 4500 + Math.random() * 4500);
}

/* ================= the speech bubble ================= */

function say(html) {
  const el = $("bubble");
  el.innerHTML = html;
  if (!reduceMotion.matches) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
}
function smug() {
  let i = Math.floor(Math.random() * SMUG.length);
  const last = store.get("smug", -1);
  if (i === last) i = (i + 1) % SMUG.length;
  store.set("smug", i);
  say(SMUG[i]);
}

/* ================= helpers ================= */

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmt = (v) => (v == null ? "—" : usd.format(v));
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
  mood("search");
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
    mood("happy", 1600);
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
  el.style.setProperty("--i", Math.max(0, i));
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
  out.innerHTML = `<span class="emoji" aria-hidden="true">${e}</span><span>${title ? `<b>${title}</b>` : ""}${sub}</span>`;
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
    setTimeout(renderCard, reduceMotion.matches ? 0 : 160);
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
$("condition").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cond]"); if (!b) return;
  state.cond = b.dataset.cond; store.set("cond", state.cond);
  setSeg($("condition"), state.cond, "cond"); renderList(true);
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
$("theme").addEventListener("click", () => { applyTheme(state.theme === "dark" ? "light" : "dark"); store.set("theme", state.theme); });
$("buddy").addEventListener("click", () => { mood("happy", 1400); smug(); });
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

(async function start() {
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
