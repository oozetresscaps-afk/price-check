"use strict";

/* ================= constants ================= */

const DATA_URL = "data/prices.json";
const CONDS = [
  ["NM", "Near Mint"], ["LP", "Lightly Played"], ["MP", "Moderately Played"],
  ["HP", "Heavily Played"], ["DMG", "Damaged"],
];
const COND_CODE = Object.fromEntries(CONDS.map(([k, v]) => [v.toLowerCase(), k]));
const PRINTS = [["N", "Normal"], ["R", "✨ Reverse"], ["H", "🌟 Holo"]];
const PRINT_CODE = { "normal": "N", "reverse holofoil": "R", "holofoil": "H" };
const PRINT_NOUN = { N: ["normal card", "normal cards"], R: ["reverse holo", "reverse holos"], H: ["holo", "holos"] };
const PRINT_NAME = { N: "Normal", R: "Reverse holo", H: "Holo" };
const SET_COLOR = { EX: "var(--ex)", AQ: "var(--aq)", SK: "var(--sk)" };
const SORTS = { num: "🔢 Number", price: "💰 Price" };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem("eq:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("eq:" + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("eq:" + k); } catch {} },
};

const state = {
  data: null,
  setId: store.get("set", "all"),
  print: store.get("print", "N"),
  cond: store.get("cond", "NM"),
  sort: store.get("sort", "num"),
  own: "all",
  q: "",
  coll: store.get("coll", null),
  fetchedOk: false,
  tried: false,
  refreshing: false,
  imgProgress: null,
};

/* ================= the mascot ================= */

function mascot() {
  return `<svg class="mascot" viewBox="0 0 200 200" aria-hidden="true">
  <g stroke="#2B1D4E" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M58 96 C36 86 18 66 8 42 C32 46 54 60 70 78 Z" fill="#8FE0A6"/>
    <path d="M56 86 C42 78 30 66 22 54 C36 58 50 66 62 78" fill="#FF9DB8" stroke="none"/>
    <path d="M142 96 C164 86 182 66 192 42 C168 46 146 60 130 78 Z" fill="#8FE0A6"/>
    <path d="M144 86 C158 78 170 66 178 54 C164 58 150 66 138 78" fill="#FF9DB8" stroke="none"/>
    <ellipse cx="78" cy="168" rx="16" ry="8" fill="#6CC98A"/>
    <ellipse cx="122" cy="168" rx="16" ry="8" fill="#6CC98A"/>
    <path d="M100 56 C142 56 160 88 160 118 C160 150 134 168 100 168 C66 168 40 150 40 118 C40 88 58 56 100 56 Z" fill="#8FE0A6"/>
    <path d="M92 58 C90 46 96 40 100 36 C100 46 104 50 110 46 C110 52 106 56 104 58" fill="#8FE0A6"/>
    <ellipse cx="100" cy="146" rx="30" ry="16" fill="#C8F2D3" stroke="none"/>
    <ellipse cx="58" cy="132" rx="9" ry="5" fill="#FF9DB8" stroke="none" opacity=".8"/>
    <path d="M84 146 Q97 156 112 145" fill="none"/>
    <path d="M103 150 L109 148 L107 156 Z" fill="#fff" stroke-width="2.5"/>
  </g>
  <g class="m-glass">
    <line x1="122" y1="128" x2="152" y2="160" stroke="#2B1D4E" stroke-width="15" stroke-linecap="round"/>
    <line x1="122" y1="128" x2="152" y2="160" stroke="#B9783F" stroke-width="8" stroke-linecap="round"/>
    <circle cx="154" cy="152" r="9" fill="#8FE0A6" stroke="#2B1D4E" stroke-width="4"/>
    <circle cx="96" cy="102" r="36" fill="#fff" stroke="#2B1D4E" stroke-width="4"/>
    <g class="m-lid"><g class="m-look">
      <circle cx="96" cy="102" r="19" fill="#5B3FA8"/>
      <circle cx="96" cy="102" r="11" fill="#170E2C"/>
      <circle cx="103" cy="94" r="6" fill="#fff"/>
      <circle cx="89" cy="109" r="2.5" fill="#fff"/>
    </g></g>
    <circle cx="96" cy="102" r="31" fill="#BFE6FF" opacity=".22"/>
    <path d="M74 92 A24 24 0 0 1 90 76" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <circle cx="96" cy="102" r="33" fill="none" stroke="#FFC93C" stroke-width="7"/>
    <circle cx="96" cy="102" r="37.5" fill="none" stroke="#2B1D4E" stroke-width="3"/>
    <circle cx="96" cy="102" r="28.5" fill="none" stroke="#2B1D4E" stroke-width="2"/>
  </g>
</svg>`;
}
function mood(m) {
  const b = $("buddy");
  if (b.dataset.mood === m) return;
  b.dataset.mood = m;
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
function numKey(num) {
  const n = String(num || "").split("/")[0].trim().toLowerCase();
  const m = /^(h?)0*(\d+)([a-z]?)$/.exec(n);
  return m ? m[1] + m[2] + m[3] : n;
}
function plural(p, n) { return PRINT_NOUN[p][n === 1 ? 0 : 1]; }

/* ================= data ================= */

function prepare(data) {
  const setIdx = new Map(data.sets.map((s, i) => [s.id, i]));
  const abbr = new Map(data.sets.map((s) => [s.id, s.abbr]));
  const setName = new Map(data.sets.map((s) => [s.id, s.name.toLowerCase()]));
  data.byKey = new Map();
  for (const c of data.cards) {
    c.abbr = abbr.get(c.set) || "";
    c.key = norm(c.name);
    c.nk = numKey(c.num);
    const m = /^(h?)(\d+)([a-z]?)/i.exec(c.nk);
    c.order = (setIdx.get(c.set) ?? 9) * 100000 + (m ? (m[1] ? 1000 : 0) + Number(m[2]) + (m[3] ? (m[3].charCodeAt(0) - 96) / 10 : 0) : 9999);
    c.s = c.s || []; c.p = c.p || {}; c.l = c.l || {};
    data.byKey.set(`${setName.get(c.set)}|${c.nk}`, c);
  }
  data.cards.sort((a, b) => a.order - b.order);
  return data;
}

const hasPrinting = (c, p) => p in c.p || p in c.l || c.s.some((s) => s[1] === p);
const market = (c, p, cond) => c.p[p]?.[cond] ?? null;
const lastSale = (c, p, cond) => c.s.find((s) => s[1] === p && s[0] === cond) || null;
const lowest = (c, p, cond) => c.l[p]?.[cond] || null;
function lowestAny(c, p) {
  let best = null;
  for (const [cond, v] of Object.entries(c.l[p] || {})) {
    if (!best || v[0] + v[1] < best[0] + best[1]) best = [v[0], v[1], cond];
  }
  return best;
}
function owned(c, p) {
  const items = state.coll?.items?.[c.id] || [];
  return items.filter((it) => !p || it[0] === p);
}
const ownedQty = (c, p) => owned(c, p).reduce((n, it) => n + it[2], 0);

async function loadSaved() {
  try {
    const r = await fetch(DATA_URL);
    if (!r.ok) throw new Error(r.status);
    state.data = prepare(await r.json());
  } catch { state.data = null; }
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
    const changed = !state.data || fresh.updated !== state.data.updated
      || fresh.salesUpdated !== state.data.salesUpdated || fresh.listingsUpdated !== state.data.listingsUpdated;
    state.data = fresh;
    state.fetchedOk = true;
    if (changed) { renderControls(); renderList(true); }
    warmImages();
  } catch {
    state.fetchedOk = false;
  } finally {
    state.refreshing = false;
    state.tried = true;
    $("refresh").classList.remove("spinning");
    renderStatus(true);
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
  const sets = new Set(state.data.sets.map((s) => s.name.toLowerCase()));
  const items = {}; let matched = 0; const missed = [];
  for (const r of rows.slice(1)) {
    const set = (r[iSet] || "").trim().toLowerCase();
    if (!sets.has(set)) continue;
    const card = state.data.byKey.get(`${set}|${numKey(r[iNum])}`);
    const p = PRINT_CODE[(r[iVar] || "Normal").trim().toLowerCase()];
    const cond = COND_CODE[(r[iCond] || "").trim().toLowerCase()] || "NM";
    const qty = Math.max(1, parseInt(r[iQty], 10) || 1);
    if (!card || !p) { missed.push(`${r[iName] || "?"} (${r[iSet]} ${r[iNum]})`); continue; }
    const list = items[card.id] || (items[card.id] = []);
    const same = list.find((it) => it[0] === p && it[1] === cond);
    if (same) same[2] += qty; else list.push([p, cond, qty]);
    matched += qty;
  }
  state.coll = { items, matched, cards: Object.keys(items).length, missed: missed.slice(0, 20), missedCount: missed.length, at: new Date().toISOString(), file: fileName };
  store.set("coll", state.coll);
}

/* ================= rendering: header ================= */

let lastStatus = "";
function renderStatus(pop) {
  const el = $("status"); const d = state.data;
  let html; let m = "look";
  if (state.refreshing) { html = d ? "Sniffing out fresh prices… 🔍" : "Grabbing prices from TCGplayer… 🔍"; m = "search"; }
  else if (!d) { html = navigator.onLine ? "Hmm, I couldn't get prices. Tap ↻ to try again." : "I need internet once to grab prices 📶"; m = "sleepy"; }
  else if (!navigator.onLine || (state.tried && !state.fetchedOk)) {
    html = `<b>No signal? No problem.</b> Using prices from ${ago(d.updated)} 📦`; m = "sleepy";
  } else {
    html = `<b>Fresh TCGplayer prices</b> from ${ago(d.updated)} ✨`;
  }
  const p = state.imgProgress;
  if (d && p && p.done < p.total) html += `<br>Saving card pics for offline: ${p.done}/${p.total}`;
  else if (d && p && p.done >= p.total && p.total) html += `<br>Everything's saved for offline 👍`;
  mood(m);
  if (html !== lastStatus) {
    el.innerHTML = html; lastStatus = html;
    if (pop) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  }
}

function buildSeg(el, items, current, attr) {
  el.innerHTML = `<span class="pill" aria-hidden="true"></span>` + items.map(([k, label, aria]) =>
    `<button type="button" data-${attr}="${k}" aria-pressed="${k === current}"${aria ? ` aria-label="${aria}"` : ""}>${label}</button>`).join("");
  el.style.setProperty("--n", items.length);
  setSeg(el, current, attr);
}
function setSeg(el, value, attr) {
  const btns = [...el.querySelectorAll(`[data-${attr}]`)];
  const i = btns.findIndex((b) => b.dataset[attr] === value);
  btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr] === value)));
  el.style.setProperty("--i", Math.max(0, i));
}

function renderControls() {
  const sets = [{ id: "all", name: "All sets" }, ...(state.data?.sets || [])];
  let chips = sets.map((s) =>
    `<button class="set-chip" type="button" data-set="${s.id}" aria-pressed="${String(s.id) === String(state.setId)}"` +
    (s.abbr ? ` style="--c:${SET_COLOR[s.abbr]}"` : "") + `>${s.abbr ? "<i></i>" : ""}${esc(s.name)}</button>`).join("");
  if (state.coll) {
    chips += `<button class="set-chip" type="button" data-own="need" aria-pressed="${state.own === "need"}">🎯 Need</button>`
      + `<button class="set-chip" type="button" data-own="have" aria-pressed="${state.own === "have"}">✅ Have</button>`;
  }
  $("sets").innerHTML = chips;
  buildSeg($("printing"), PRINTS, state.print, "print");
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

function filtered() {
  const d = state.data; if (!d) return [];
  const q = norm(state.q.trim()).replace(/^#/, "");
  const isNum = /^h?\d+[a-z]?(\/h?\d*)?$/.test(q);
  let list = d.cards.filter((c) =>
    (state.setId === "all" || String(c.set) === String(state.setId)) && hasPrinting(c, state.print));
  if (state.own !== "all" && state.coll) {
    list = list.filter((c) => (ownedQty(c, state.print) > 0) === (state.own === "have"));
  }
  if (q) {
    list = list.filter((c) => isNum
      ? (q.includes("/") ? c.num.toLowerCase().startsWith(q) : c.nk === q || c.nk.replace(/[a-z]$/, "") === q)
      : c.key.includes(q));
  }
  if (state.sort === "price") {
    list = [...list].sort((a, b) => (market(b, state.print, state.cond) ?? -1) - (market(a, state.print, state.cond) ?? -1));
  }
  return list;
}

function rowHTML(c) {
  const p = state.print, cond = state.cond;
  const m = market(c, p, cond);
  const lo = lowest(c, p, cond);
  const any = lo ? null : lowestAny(c, p);
  const s = lastSale(c, p, cond);
  const qty = ownedQty(c, p);
  const img = c.img
    ? `<img class="thumb" src="img/${c.id}.jpg" alt="" loading="lazy" decoding="async" width="50" height="70">`
    : `<span class="thumb"></span>`;
  const low = lo ? `🛒 <b>${fmt(lo[0])}</b> low`
    : any ? `🛒 <b>${fmt(any[0])}</b> ${any[2]}` : `🛒 none listed`;
  const sold = s ? `🏷️ <b>${fmt(s[2])}</b> ${shortDate(s[3])}` : `🏷️ no ${cond} sale`;
  const cheap = lo && m && lo[0] + lo[1] < m * 0.85;
  return `<button class="row${qty ? " have" : ""}" type="button" data-id="${c.id}" style="--c:${SET_COLOR[c.abbr]}">
    <span class="thumbwrap">${img}${qty ? `<span class="owned" aria-label="You have ${qty}">${qty > 1 ? "×" + qty : "✓"}</span>` : ""}</span>
    <span class="who"><span class="name">${esc(c.name)}</span><span class="meta">${c.abbr} ${esc(c.num)}, ${esc(c.rarity)}</span></span>
    <span class="val"><span class="price${m == null ? " none" : ""}">${fmt(m)}</span><small>market</small></span>
    <span class="stats"><span class="stat${cheap ? " deal" : ""}">${low}</span><span class="stat">${sold}</span></span>
  </button>`;
}

function renderList(animate) {
  const list = $("list");
  if (!state.data) {
    list.innerHTML = `<div class="empty"><div class="buddy-big" data-mood="sleepy">${mascot()}</div><strong>No prices on this phone yet</strong>Connect to Wi-Fi or data and tap ↻ at the top. After one good load, everything works offline.</div>`;
    $("count").textContent = "";
    return;
  }
  const rows = filtered();
  const noun = plural(state.print, rows.length);
  const suffix = state.own === "need" ? " you still need" : state.own === "have" ? " you have" : "";
  $("count").textContent = `${rows.length} ${noun}${suffix}, ${state.cond} prices`;
  if (!rows.length) {
    const msg = state.own === "need" && !state.q ? ["You've got them all!", "Nothing left to hunt in this set and printing 🎉"]
      : [`No ${PRINT_NOUN[state.print][1]} match`, "Try another printing or set, or check the spelling."];
    list.innerHTML = `<div class="empty"><div class="buddy-big" data-mood="search">${mascot()}</div><strong>${msg[0]}</strong>${msg[1]}</div>`;
    return;
  }
  list.classList.remove("enter");
  list.innerHTML = rows.map(rowHTML).join("");
  if (animate && !reduceMotion.matches) { void list.offsetWidth; list.classList.add("enter"); }
}

/* ================= card sheet ================= */

const sheet = $("sheet");
const sheetState = { mode: null, card: null, print: "N", cond: "NM", ask: "" };

function openCard(id) {
  const c = state.data.cards.find((x) => String(x.id) === String(id));
  if (!c) return;
  Object.assign(sheetState, {
    mode: "card", card: c, cond: state.cond, ask: "",
    print: hasPrinting(c, state.print) ? state.print : PRINTS.find(([k]) => hasPrinting(c, k))?.[0] || "N",
  });
  renderCard();
  showSheet();
}

function ownedTag(c, p) {
  if (!state.coll) return "";
  const mine = owned(c, p);
  const others = owned(c).filter((it) => it[0] !== p);
  const otherText = others.length ? ` You have the ${[...new Set(others.map((it) => PRINT_NAME[it[0]].toLowerCase()))].join(" and ")}.` : "";
  if (mine.length) {
    const list = mine.map(([, cond, q]) => `${q} ${cond}`).join(", ");
    return `<span class="tag have">✅ You have ${list}</span>`;
  }
  return `<span class="tag need">🎯 You need this ${PRINT_NAME[p].toLowerCase()}.${otherText}</span>`;
}

function renderCard() {
  const { card: c, print: p, cond } = sheetState;
  const set = state.data.sets.find((s) => s.id === c.set);
  const sales = c.s.filter((s) => s[1] === p).slice(0, 10);
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
      <div class="card-img${p !== "N" ? " foil" : ""}">${c.img ? `<img src="img/${c.id}.jpg" alt="${esc(c.name)} card">` : ""}</div>
      <div>
        <h2 id="sheet-title">${esc(c.name)}</h2>
        <p class="set-line" style="--c:${SET_COLOR[c.abbr]}"><i></i>${esc(set?.name)} ${esc(c.num)}</p>
        <p>${esc(c.rarity)}</p>
        ${ownedTag(c, p)}
      </div>
    </div>
    <div class="seg" id="sprint" role="group" aria-label="Printing"></div>
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
      <h3>🏷️ Recent ${PRINT_NAME[p].toLowerCase()} sales</h3>
      ${sales.length ? `<ol>${sales.map((s) => `<li><span>${shortDate(s[3])}</span><span class="k">${s[0]}</span><span class="p">${fmt(s[2])}</span></li>`).join("")}</ol>`
        : `<p class="none">No recent ${PRINT_NAME[p].toLowerCase()} sales on TCGplayer.</p>`}
    </section>
    <a class="btn" href="https://www.tcgplayer.com/product/${c.id}" target="_blank" rel="noopener">See it live on TCGplayer
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    <p class="fine">Prices from TCGplayer, checked ${ago(state.data.listingsUpdated || state.data.updated)}. Lowest is the cheapest English copy listed in that condition, shipping to the US. Sold is the item price without shipping.</p>
  </div>`;
  const avail = PRINTS.filter(([k]) => hasPrinting(c, k));
  buildSeg($("sprint"), avail, p, "sprint");
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
    else { e = "🤷"; title = "Not enough data"; sub = `TCGplayer has no ${cond} market or listings for this printing.`; }
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
       <p>Export your portfolio from Collectr as a CSV file, then pick it here. I'll match your Expedition, Aquapolis and Skyridge cards.</p>
       <button class="btn primary" type="button" data-pick>📥 Choose Collectr file</button>`;
  sheet.innerHTML = `<div class="sheet-inner">
    <div class="grabzone"><button class="close" type="button" data-close aria-label="Close">✕</button><div class="grab" aria-hidden="true"></div></div>
    <div class="coll">
      <div class="buddy-big" data-mood="${msg ? "happy" : "look"}">${mascot()}</div>
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
  if (pb && !pb.disabled) {
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
  const b = e.target.closest("[data-set]");
  if (!b) return;
  state.setId = b.dataset.set; store.set("set", state.setId);
  $("sets").querySelectorAll("[data-set]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.set === state.setId)));
  b.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
  renderList(true);
});
$("printing").addEventListener("click", (e) => {
  const b = e.target.closest("[data-print]"); if (!b) return;
  state.print = b.dataset.print; store.set("print", state.print);
  setSeg($("printing"), state.print, "print"); renderList(true);
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
  mood("search");
  qTimer = setTimeout(() => { state.q = e.target.value; renderList(false); if (!state.refreshing) renderStatus(); }, 90);
});
$("list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]"); if (b) openCard(b.dataset.id);
});
$("nudge").addEventListener("click", (e) => { if (e.target.closest("[data-open-coll]")) openCollection(); });
$("collection").addEventListener("click", () => { if (state.data) openCollection(); });
$("refresh").addEventListener("click", refresh);

const finder = document.querySelector(".finder");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { finder.classList.toggle("stuck", finder.getBoundingClientRect().top <= 0 && scrollY > 40); ticking = false; });
}, { passive: true });

addEventListener("online", () => { renderStatus(true); refresh(); });
addEventListener("offline", () => renderStatus(true));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && navigator.onLine && state.data &&
      Date.now() - new Date(state.data.updated).getTime() > 30 * 60000) refresh();
});

/* ================= start ================= */

(async function start() {
  $("buddy").innerHTML = mascot();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    navigator.serviceWorker.ready.then(() => setTimeout(warmImages, 600));
    navigator.serviceWorker.addEventListener("controllerchange", () => setTimeout(warmImages, 600));
  }
  renderControls();
  await loadSaved();
  renderControls();
  renderList(true);
  renderStatus();
  if (navigator.onLine) await refresh();
  else renderStatus(true);
})();
