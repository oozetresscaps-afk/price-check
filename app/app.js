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
  "Hmph. You're back. N-not that I was waiting or anything.",
  "It's not like I saved these prices for YOU. They just… happened to be saved.",
  "Don't get the wrong idea. I only help so I can watch you overpay.",
  "Ugh, fine. Here are your precious cardboard prices.",
  "Your wallet's crying again. Not my problem. …Okay, a little my problem.",
  "Another reverse holo? You're hopeless. …It is cute, though.",
  "Only an amateur pays sticker price. You're not an amateur. Right?",
  "Don't stare at me, dummy. Stare at the prices.",
  "You'd be lost without me. N-not that I'm saying I'm important!",
  "I didn't dress up for you. This is just how a professional looks.",
  "Fine, I'll come to the show. Somebody has to stop you.",
  "Ta-da. Prices. You may now applaud. Quietly.",
  "If you buy that without haggling, I'm not talking to you.",
  "Hmph! You call that a binder? Fill it properly.",
  "I'm only smiling because the lighting is good. Don't read into it.",
  "Pick a card, any card. …Not THAT one, it's overpriced.",
  "B-baka! Check the condition before you fall in love!",
  "It's fine. I'm used to being your financial advisor.",
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
document.documentElement.dataset.cond = state.cond;

/* ================= the mascot: showy's showgirl magician ================= */

const MASCOT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="22 4 156 210" class="mascot" aria-hidden="true"><ellipse cx="100" cy="209" rx="40" ry="4" fill="#000" opacity=".12"/><g class="g-bob"><g class="g-hop"><path d="M82 168 h14 v24 h-14 Z" fill="#FCE3D2"/><path d="M82 168 h14 v24 h-14 Z" fill="url(#sg-net)"/><path d="M104 168 h14 v24 h-14 Z" fill="#FCE3D2"/><path d="M104 168 h14 v24 h-14 Z" fill="url(#sg-net)"/><path d="M82 189 L96 189 L97 195 Q106 198 108.5 203.5 Q109 207 104.5 207 L94 207 Q90 203.5 86.4 202.5 L85.4 208 L82.8 208 L81.4 199 Z" fill="#D24552"/><path d="M83 193 L96.5 193" stroke="#A9343F" stroke-width="2"/><circle cx="90" cy="193" r="1.8" fill="#EDBE5A"/><path d="M104 189 L118 189 L119 195 Q128 198 130.5 203.5 Q131 207 126.5 207 L116 207 Q112 203.5 108.4 202.5 L107.4 208 L104.8 208 L103.4 199 Z" fill="#D24552"/><path d="M105 193 L118.5 193" stroke="#A9343F" stroke-width="2"/><circle cx="112" cy="193" r="1.8" fill="#EDBE5A"/><path d="M80 146 Q100 151 120 146 L145 170 Q100 182 55 170 Z" fill="url(#sg-dots)"/><circle cx="57.0" cy="170.5" r="4.6" fill="#F8EADA"/><circle cx="65.6" cy="172.5" r="4.6" fill="#F8EADA"/><circle cx="74.2" cy="174.0" r="4.6" fill="#F8EADA"/><circle cx="82.8" cy="175.1" r="4.6" fill="#F8EADA"/><circle cx="91.4" cy="175.8" r="4.6" fill="#F8EADA"/><circle cx="100.0" cy="176.0" r="4.6" fill="#F8EADA"/><circle cx="108.6" cy="175.8" r="4.6" fill="#F8EADA"/><circle cx="117.2" cy="175.1" r="4.6" fill="#F8EADA"/><circle cx="125.8" cy="174.0" r="4.6" fill="#F8EADA"/><circle cx="134.4" cy="172.5" r="4.6" fill="#F8EADA"/><circle cx="143.0" cy="170.5" r="4.6" fill="#F8EADA"/><path d="M80 146 Q100 151 120 146" stroke="#EDBE5A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M78 120 Q100 116 122 120 L119 148 Q100 152 81 148 Z" fill="url(#sg-stripe)"/><path d="M78 120 Q100 116 122 120 L119 148 Q100 152 81 148 Z" fill="none" stroke="#A9343F" stroke-width="1.6" opacity=".6"/><path d="M97 125 L103 129 L97 133 L103 137 L97 141 L103 145" stroke="#EDBE5A" stroke-width="1.6" fill="none" stroke-linejoin="round"/><g class="cv c-nm pb"><path d="M72 128 Q58 136 50 146" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="50" cy="146" r="5.8" fill="#F8EADA"/></g><g class="cv c-lp pb"><path d="M72 128 Q54 136 40 146" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="40" cy="146" r="5.8" fill="#F8EADA"/><path d="M128 128 Q146 136 160 146" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="160" cy="146" r="5.8" fill="#F8EADA"/></g><g class="cv c-mp pb"><path d="M72 128 Q64 138 78 146" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="79" cy="146" r="5.8" fill="#F8EADA"/></g><g class="cv c-hp pb"><path d="M72 128 Q58 138 64 144" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="64" cy="144" r="5.8" fill="#F8EADA"/><path d="M128 128 Q142 138 136 144" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="136" cy="144" r="5.8" fill="#F8EADA"/></g><g class="cv c-dmg pb"><path d="M128 128 Q146 136 156 146" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="156" cy="146" r="5.8" fill="#F8EADA"/></g><circle cx="76" cy="124" r="9" fill="url(#sg-stripe)"/><path d="M68 129 Q76 134 84 129" stroke="#EDBE5A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="124" cy="124" r="9" fill="url(#sg-stripe)"/><path d="M116 129 Q124 134 132 129" stroke="#EDBE5A" stroke-width="2" fill="none" stroke-linecap="round"/><g class="g-head"><path d="M51 86 C47 42 78 24 102 24 C128 24 155 44 151 88 C150 104 147 116 139 123 Q131 128 127 119 L73 119 Q69 128 61 123 C53 116 50 104 51 86 Z" fill="#E79AB4"/><ellipse cx="100" cy="80" rx="44" ry="41" fill="#FCE3D2"/><ellipse cx="77" cy="99" rx="7" ry="4.3" fill="#F59A9A" opacity=".8"/><ellipse cx="123" cy="99" rx="7" ry="4.3" fill="#F59A9A" opacity=".8"/><g class="g-eyes"><g class="g-look"><g class="fv e-dots f-lp fm-search"><ellipse cx="85" cy="90" rx="4.6" ry="5.8" fill="#211816"/><ellipse cx="115" cy="90" rx="4.6" ry="5.8" fill="#211816"/><path d="M80.4 86.4 l-2.8 -1.1 M119.6 86.4 l2.8 -1.1" stroke="#211816" stroke-width="1.8" stroke-linecap="round"/></g><g class="fv e-up f-hp"><g class="lookup"><ellipse cx="85" cy="88" rx="4.6" ry="5.8" fill="#211816"/><ellipse cx="115" cy="88" rx="4.6" ry="5.8" fill="#211816"/><path d="M80.4 84.4 l-2.8 -1.1 M119.6 84.4 l2.8 -1.1" stroke="#211816" stroke-width="1.8" stroke-linecap="round"/></g></g><g class="fv e-wink f-nm"><ellipse cx="85" cy="90" rx="4.6" ry="5.8" fill="#211816"/><path d="M80.4 86.4 l-2.8 -1.1" stroke="#211816" stroke-width="1.8" stroke-linecap="round"/><path d="M110 91 q5 -5 10 0" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke="#211816" stroke-width="2.4"/></g><g class="fv e-smug f-mp f-dmg fm-smug"><path d="M80.6 88.4 L89.4 87.80000000000001 A4.6 5.8 0 0 1 85 95.8 A4.6 5.8 0 0 1 80.6 88.4 Z" fill="#211816"/><path d="M110.6 88.4 L119.4 87.80000000000001 A4.6 5.8 0 0 1 115 95.8 A4.6 5.8 0 0 1 110.6 88.4 Z" fill="#211816"/><path d="M80.4 88.8 l-2.8 -1.1 M119.6 88.2 l2.8 -1.1" stroke="#211816" stroke-width="1.8" stroke-linecap="round"/></g><g class="fv e-happy fm-happy"><path d="M80 91.5 q5 -6 10 0 M110 91.5 q5 -6 10 0" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke="#211816" stroke-width="2.6"/></g><g class="fv e-shut fm-trick"><path d="M81 86 L88 90 L81 94 M119 86 L112 90 L119 94" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke="#211816" stroke-width="2.4" stroke-linejoin="round"/></g><g class="fv e-sleep fm-sleepy"><path d="M80 90 q5 4 10 0 M110 90 q5 4 10 0" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke="#211816" stroke-width="2.4"/></g></g></g><g class="fv m-grin f-nm fm-happy fm-trick"><path d="M94 103 q6 6 12 0 Z" fill="#E8794F"/></g><g class="fv m-smirk f-mp fm-smug"><path d="M96 105 q4.5 2.6 8 -1 q1 -1 1.6 -2.6" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2"/></g><g class="fv m-o f-lp fm-search"><ellipse cx="100" cy="105" rx="3" ry="3.6" fill="#E8794F"/></g><g class="fv m-tiny f-hp fm-sleepy"><ellipse cx="101" cy="105" rx="2" ry="2.3" fill="#E8794F"/></g><g class="fv m-pout f-dmg"><path d="M95 106 q2.5 -3 5 0 q2.5 -3 5 0" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2"/></g><g class="fv b-raise f-mp fm-smug"><path d="M109 77 q6 -4.5 12 -1" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="1.9" opacity=".8"/></g><g class="fv b-annoy f-dmg"><path d="M78 76 l11 3.5 M122 76 l-11 3.5" fill="none" stroke="#3B2A22" stroke-linecap="round" stroke-width="2.1"/></g><g class="fv x-sweat f-hp"><path class="sweat" d="M139 70 q5 7 0 10 q-5 -3 0 -10 Z" fill="#9FC3E0"/></g><g class="fv x-anger f-dmg"><g class="anger"><path d="M126 58 q3 3 0 6 M130 56 q-3 3 0 6 M124 62 q3 -3 6 0 M126 66 q3 -3 6 0" stroke="#D24552" stroke-width="2.2" fill="none" stroke-linecap="round" transform="translate(-2 -6)"/></g></g><path d="M55 90 C52 50 78 31 102 31 C128 31 150 52 146 90 L141 74 L135 82 L129 63 L121 79 L113 59 L105 77 L97 57 L89 76 L81 61 L75 81 L67 67 L61 84 Z" fill="#F7B6CC"/><path d="M58 74 Q47 104 57 121 Q65 127 71 119 Q63 104 65 82 Z" fill="#F7B6CC"/><path d="M142 74 Q153 104 143 121 Q135 127 129 119 Q137 104 135 82 Z" fill="#F7B6CC"/><path d="M73 44 Q90 35 108 37" stroke="#FFDCE8" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/><path d="M127 44 Q133 48 137 54" stroke="#FFDCE8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(132 62) scale(0.75)" fill="#EDBE5A"/><g class="cv c-dmg"><ellipse cx="74" cy="104" rx="6" ry="3" fill="#5A5160" opacity=".35"/><ellipse cx="124" cy="96" rx="4" ry="2.4" fill="#5A5160" opacity=".3"/><path d="M64 42 l3 -5 l2 5 l3 -5 M136 40 l3 -5 l2 5" stroke="#E79AB4" stroke-width="2" fill="none" stroke-linejoin="round"/></g><g class="cv c-nm hat h-nm"><g transform="translate(76 36) rotate(-24) scale(0.95)"><ellipse cx="0" cy="0" rx="21" ry="5" fill="#A9343F"/><path d="M-12 0 L-11 -24 Q0 -27 11 -24 L12 0 Z" fill="#D24552"/><path d="M-11.7 -7 L11.7 -7 L12 -2 L-12 -2 Z" fill="#EDBE5A"/><path d="M-3 -8 l3 -6 l3 6 Z" fill="#F8EADA" opacity=".0"/><path d="M-7 -21 Q-6 -14 -6.5 -10" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/></g></g><g class="cv c-lp hat h-lp"><g transform="translate(78 36) rotate(-18) scale(0.82)"><ellipse cx="0" cy="0" rx="21" ry="5" fill="#A9343F"/><path d="M-12 0 L-11 -24 Q0 -27 11 -24 L12 0 Z" fill="#D24552"/><path d="M-11.7 -7 L11.7 -7 L12 -2 L-12 -2 Z" fill="#EDBE5A"/><path d="M-3 -8 l3 -6 l3 6 Z" fill="#F8EADA" opacity=".0"/><path d="M-7 -21 Q-6 -14 -6.5 -10" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/></g></g><g class="cv c-hp hat h-hp"><g transform="translate(80 35) rotate(-20) scale(0.86)"><ellipse cx="0" cy="0" rx="21" ry="5" fill="#A9343F"/><path d="M-12 0 L-11 -24 Q0 -27 11 -24 L12 0 Z" fill="#D24552"/><path d="M-11.7 -7 L11.7 -7 L12 -2 L-12 -2 Z" fill="#EDBE5A"/><path d="M-3 -8 l3 -6 l3 6 Z" fill="#F8EADA" opacity=".0"/><path d="M-7 -21 Q-6 -14 -6.5 -10" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/></g></g><g class="cv c-dmg hat h-dmg"><g transform="translate(112 44) rotate(34) scale(0.9)"><ellipse cx="0" cy="0" rx="21" ry="5" fill="#A9343F"/><path d="M-12 0 L-11 -24 Q0 -27 11 -24 L12 0 Z" fill="#D24552"/><path d="M-11.7 -7 L11.7 -7 L12 -2 L-12 -2 Z" fill="#EDBE5A"/><path d="M-3 -8 l3 -6 l3 6 Z" fill="#F8EADA" opacity=".0"/><path d="M-7 -21 Q-6 -14 -6.5 -10" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/></g><g class="wisp"><path d="M118 20 q-4 -5 0 -10 q4 -5 0 -10" stroke="#9A93A6" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></g></g></g><circle cx="84.0" cy="125.4" r="4.4" fill="#F8EADA"/><circle cx="89.3" cy="124.1" r="4.4" fill="#F8EADA"/><circle cx="94.6" cy="122.8" r="4.4" fill="#F8EADA"/><circle cx="99.9" cy="121.5" r="4.4" fill="#F8EADA"/><circle cx="105.2" cy="122.8" r="4.4" fill="#F8EADA"/><circle cx="110.5" cy="124.1" r="4.4" fill="#F8EADA"/><circle cx="115.8" cy="125.4" r="4.4" fill="#F8EADA"/><path d="M100 123 L90.5 118 Q88.5 123 90.5 128 Z M100 123 L109.5 118 Q111.5 123 109.5 128 Z" fill="#D24552"/><circle cx="100" cy="123" r="2.7" fill="#A9343F"/><g class="cv c-nm pf"><path d="M128 126 Q150 118 151 94" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="124" cy="124" r="9" fill="url(#sg-stripe)"/><path d="M116 129 Q124 134 132 129" stroke="#EDBE5A" stroke-width="2" fill="none" stroke-linecap="round"/><g class="wand"><path d="M151 92 L170 58" stroke="#6A57A0" stroke-width="4.6" stroke-linecap="round"/><path d="M164.2 68.4 L165.8 65.6" stroke="#EDBE5A" stroke-width="5.2"/><path d="M166 65 L170 58" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/></g><g class="spk k0"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(174 50) scale(0.9)" fill="#EDBE5A"/></g><g class="spk k1"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(160 42) scale(0.5)" fill="#fff"/></g><g class="spk k2"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(186 66) scale(0.5)" fill="#EDBE5A"/></g><g class="spk k3"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(178 34) scale(0.4)" fill="#fff"/></g><circle cx="151" cy="92" r="5.8" fill="#F8EADA"/><g class="fan"><g transform="translate(40 140) rotate(-28)"><rect x="-8.0" y="-11.0" width="16" height="22" rx="2.6" fill="#E58C7A"/><rect x="-5.8" y="-8.6" width="11.6" height="9.24" rx="1.6" fill="#fff" opacity=".5"/><path d="M-5.0 5.0 h8.0 M-5.0 7.6 h5.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g><g transform="translate(46 136) rotate(-8)"><rect x="-8.0" y="-11.0" width="16" height="22" rx="2.6" fill="#EDBE5A"/><rect x="-5.8" y="-8.6" width="11.6" height="9.24" rx="1.6" fill="#fff" opacity=".5"/><path d="M-5.0 5.0 h8.0 M-5.0 7.6 h5.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g><g transform="translate(53 137) rotate(14)"><rect x="-8.0" y="-11.0" width="16" height="22" rx="2.6" fill="#7FA6C9"/><rect x="-5.8" y="-8.6" width="11.6" height="9.24" rx="1.6" fill="#fff" opacity=".5"/><path d="M-5.0 5.0 h8.0 M-5.0 7.6 h5.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g></g><g class="cv c-lp pf"><g class="ac a0"><g transform="translate(40 146.0) rotate(-44)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#E58C7A"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a1"><g transform="translate(55 138.125) rotate(-33)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#EDBE5A"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a2"><g transform="translate(70 132.5) rotate(-22)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#7FA6C9"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a3"><g transform="translate(85 129.125) rotate(-11)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#E58C7A"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a4"><g transform="translate(100 128.0) rotate(0)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#EDBE5A"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a5"><g transform="translate(115 129.125) rotate(11)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#7FA6C9"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a6"><g transform="translate(130 132.5) rotate(22)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#E58C7A"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a7"><g transform="translate(145 138.125) rotate(33)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#EDBE5A"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g><g class="ac a8"><g transform="translate(160 146.0) rotate(44)"><rect x="-6.0" y="-8.5" width="12" height="17" rx="2.6" fill="#7FA6C9"/><rect x="-3.8" y="-6.1" width="7.6" height="7.14" rx="1.6" fill="#fff" opacity=".5"/><path d="M-3.0 2.5 h6.0 M-3.0 5.1 h4.199999999999999" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g></g></g><g class="cv c-mp pf"><g class="tip"><path d="M130 124 Q166 98 143 44" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="124" cy="124" r="9" fill="url(#sg-stripe)"/><path d="M116 129 Q124 134 132 129" stroke="#EDBE5A" stroke-width="2" fill="none" stroke-linecap="round"/><g transform="translate(120 40)"><g class="mcoin"><g><circle r="6" fill="#EDBE5A"/><circle r="3.7" fill="none" stroke="#D29E3A" stroke-width="1.4"/><circle cx="-2.1" cy="-2.1" r="1.2" fill="#fff" opacity=".8"/></g></g></g><g transform="translate(118 30) rotate(18) scale(0.9)"><ellipse cx="0" cy="0" rx="21" ry="5" fill="#A9343F"/><path d="M-12 0 L-11 -24 Q0 -27 11 -24 L12 0 Z" fill="#D24552"/><path d="M-11.7 -7 L11.7 -7 L12 -2 L-12 -2 Z" fill="#EDBE5A"/><path d="M-3 -8 l3 -6 l3 6 Z" fill="#F8EADA" opacity=".0"/><path d="M-7 -21 Q-6 -14 -6.5 -10" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/></g><circle cx="141" cy="40" r="6.2" fill="#F8EADA"/></g></g><g class="cv c-hp pf"><g transform="translate(100 92)"><g class="jc j0"><g><circle r="6.5" fill="#EDBE5A"/><circle r="4.2" fill="none" stroke="#D29E3A" stroke-width="1.4"/><circle cx="-2.3" cy="-2.3" r="1.3" fill="#fff" opacity=".8"/></g></g></g><g transform="translate(100 92)"><g class="jc j1"><g><circle r="6.5" fill="#EDBE5A"/><circle r="4.2" fill="none" stroke="#D29E3A" stroke-width="1.4"/><circle cx="-2.3" cy="-2.3" r="1.3" fill="#fff" opacity=".8"/></g></g></g><g transform="translate(100 92)"><g class="jc j2"><g><circle r="6.5" fill="#EDBE5A"/><circle r="4.2" fill="none" stroke="#D29E3A" stroke-width="1.4"/><circle cx="-2.3" cy="-2.3" r="1.3" fill="#fff" opacity=".8"/></g></g></g></g><g class="cv c-dmg pf"><path d="M74 126 Q56 116 86 108" fill="none" stroke="#FCE3D2" stroke-width="8.5" stroke-linecap="round"/><circle cx="88" cy="107" r="5.8" fill="#F8EADA"/><path d="M156 146 L178 130" stroke="#6A57A0" stroke-width="4.6" stroke-linecap="round"/><path d="M173.5 133.3 L178 130" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/><g transform="translate(180 126)"><g class="smk s0"><circle r="5" fill="#8C8496"/><circle cx="4" cy="-2" r="3.6" fill="#8C8496"/></g></g><g transform="translate(180 126)"><g class="smk s1"><circle r="5" fill="#8C8496"/><circle cx="4" cy="-2" r="3.6" fill="#8C8496"/></g></g><g transform="translate(180 126)"><g class="smk s2"><circle r="5" fill="#8C8496"/><circle cx="4" cy="-2" r="3.6" fill="#8C8496"/></g></g></g></g></g><g class="fx-poof"><g fill="#FFF8EE" opacity=".96"><circle cx="100" cy="112" r="30"/><circle cx="68" cy="92" r="20"/><circle cx="134" cy="90" r="21"/><circle cx="62" cy="140" r="19"/><circle cx="140" cy="142" r="20"/><circle cx="100" cy="64" r="22"/><circle cx="100" cy="166" r="22"/><circle cx="80" cy="120" r="18"/><circle cx="122" cy="126" r="18"/></g><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(44 76) scale(0.9)" fill="#EDBE5A"/><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(158 80) scale(0.8)" fill="#EDBE5A"/><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(152 176) scale(0.7)" fill="#EDBE5A"/><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(48 178) scale(0.6)" fill="#EDBE5A"/></g><g class="fx-burst"><g transform="translate(100.0 16.0)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.55)" fill="#fff"/></g></g><g transform="translate(141.1 28.2)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.8)" fill="#EDBE5A"/></g></g><g transform="translate(166.6 60.2)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.55)" fill="#fff"/></g></g><g transform="translate(166.6 99.8)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.8)" fill="#EDBE5A"/></g></g><g transform="translate(141.1 131.8)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.55)" fill="#fff"/></g></g><g transform="translate(100.0 144.0)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.8)" fill="#EDBE5A"/></g></g><g transform="translate(58.9 131.8)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.55)" fill="#fff"/></g></g><g transform="translate(33.4 99.8)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.8)" fill="#EDBE5A"/></g></g><g transform="translate(33.4 60.2)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.55)" fill="#fff"/></g></g><g transform="translate(58.9 28.2)"><g class="bs"><path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate(0 0) scale(0.8)" fill="#EDBE5A"/></g></g></g><g class="fx-z" fill="#3B2A22" font-family="Baloo 2, sans-serif" font-weight="800"><text x="146" y="44" font-size="18">z</text><text x="160" y="28" font-size="13">z</text></g></svg>`;
function mascot() { return MASCOT; }
let moodTimer;
function mood(m, ms) {
  const b = $("buddy");
  if (m !== "idle") b.dataset.idle = "";
  b.dataset.mood = m;
  clearTimeout(moodTimer);
  if (ms) moodTimer = setTimeout(() => { b.dataset.mood = "idle"; }, ms);
}

/* little idle routines, picked at random. Her condition trick plays all the time; these sit on top. */
const IDLES = ["look", "look", "hatslip", "smug", "trick"];
const IDLE_MS = { trick: 1300, smug: 2700, look: 2600, hatslip: 1600 };
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
  if (manual) say("Fine, I'll check TCGplayer. Not because you asked nicely. 🔍");
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
    if (manual) say(changed ? "Fresh prices. You're welcome. …Say thank you. ✨" : "Nothing new. Prices don't move just because you stare at them, dummy.");
  } catch {
    state.fetchedOk = false;
    if (state.data) { mood("sleepy", 7000); if (manual) say("No signal. Good thing I saved everything. Not for you. For me. 📦"); }
    else { mood("sleepy"); say("I need internet once to grab prices. Then you can go broke offline. 📶"); }
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
    list.innerHTML = `<div class="empty"><div class="buddy-big" data-mood="sleepy">${mascot()}</div><strong>No prices yet. Hmph.</strong>Connect to Wi-Fi or data and tap ↻ at the top. After one good load I'll work offline. You're welcome in advance.</div>`;
    $("count").textContent = "";
    return;
  }
  const rows = filtered();
  const suffix = state.own === "need" ? " you still need" : state.own === "have" ? " you have" : "";
  $("count").textContent = `${rows.length.toLocaleString()} cards${suffix}, ${state.cond} prices`;
  if (!rows.length) {
    const msg = state.own === "need" && !state.q ? ["You've got them all!", "…I'm not impressed. Okay, a little impressed. 🎉"]
      : ["Nothing matches", "Did you spell it right? Try another set, dummy."];
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
  "Great deal!": ["Buy it before they notice. Not that I care.", "Hmph. Fine. That's actually a steal.", "Pay fast and act natural, dummy."],
  "Same as online": ["Same as online. At least you skip the shipping. Whatever.", "It's a wash. Haggle anyway. For me. I mean, for you."],
  "Fair price": ["Fair. I suppose. Don't make it weird.", "Offer 90%. I dare you."],
  "Pricey": ["They saw you coming. Ugh.", "Don't you DARE pay that.", "Pricey. Make a sad face. It works on me. N-never mind."],
  "Under market": ["Under market. I'll allow it. This time.", "Not bad. Don't let it go to your head."],
  "Over market": ["Over market. Absolutely not. …Okay, maybe. No.", "You'd pay that? I'm embarrassed for you."],
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
    mood("happy", 2000); say(`${state.coll.cards} cards and you still want more? Hopeless. Tap 🎯 Need and I'll show you what's missing. Not that I care.`);
  } catch (err) {
    renderCollection();
    sheet.querySelector(".coll").insertAdjacentHTML("afterbegin", `<p class="tag need">⚠️ ${esc(err.message)}</p>`);
  }
});

/* ================= hagl: haggle tools ================= */

const HAGL_PCTS = [85, 90, 95];
const HAGL_LINES = [
  "Start low. They expect it. I'd expect it.",
  "Say \"bundle deal\" with a straight face. I'll watch.",
  "Never let them see you want it. Like me. I never want anything.",
  "Mention cash. Watch the price disappear. Like magic. My magic.",
  "Point out the whitening. There's always whitening.",
  "Walk away once. They'll call you back. Trust me.",
  "Hmph. Fine. I'll do the math. You do the talking.",
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
const QUICK_HINT = `<p class="hint">Type what they're asking. I'll do the math, you do the talking. Don't mess it up.</p>`;
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
    el.innerHTML = `<div class="hempty"><b>Your cart is empty</b>Search above for the cards on their table, or tap 🤝 Add to hagl cart on any card. I'll wait. Impatiently.</div>`;
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
    say(`${cart.items.length} in the cart. Tap 🤝 hagl so I can judge you.`);
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
  NM: ["Near Mint. Ta-da! …Don't clap. Okay, you can clap.", "Only the best for you. N-not because I like you!"],
  LP: ["Lightly Played. Watch the cards, not me. Hmph.", "LP: basically NM if you squint. Don't squint at me."],
  MP: ["Moderately Played. A tip of the hat. Don't get used to it.", "MP. It's got character. Unlike your haggling."],
  HP: ["Heavily Played?! You want me to juggle THESE?", "HP. Fine. I'll keep it in the air. Somehow."],
  DMG: ["Damaged?! *cough* That was on purpose. Obviously.", "Hmph! The trick didn't fail. The CARD did."],
};
// she switches tricks with each condition, in a puff of smoke
let outfitTimer;
function changeOutfit(cond) {
  const root = document.documentElement, b = $("buddy");
  clearTimeout(outfitTimer);
  if (reduceMotion.matches) { root.dataset.cond = cond; return; }
  b.classList.remove("poof"); void b.offsetWidth; b.classList.add("poof");
  outfitTimer = setTimeout(() => { root.dataset.cond = cond; setTimeout(() => b.classList.remove("poof"), 480); }, 170);
}
$("condition").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cond]"); if (!b || b.dataset.cond === state.cond) return;
  state.cond = b.dataset.cond; store.set("cond", state.cond);
  setSeg($("condition"), state.cond, "cond"); renderList(false);
  const list = $("list");
  if (!reduceMotion.matches) { list.classList.remove("tick"); void list.offsetWidth; list.classList.add("tick"); }
  changeOutfit(state.cond);
  const l = COND_LINES[state.cond]; say(l[Math.floor(Math.random() * l.length)]);
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
  say(state.theme === "light" ? "H-hey! Warn me before you turn the lights on! 😳" : "Hmph. Much better. A star needs a stage, not a spotlight in her eyes.");
  if ($("buddy").dataset.mood === "idle") play(state.theme === "light" ? "hatslip" : "smug");
});
$("buddy").addEventListener("click", () => {
  const b = $("buddy");
  if (b.dataset.mood !== "idle" && b.dataset.mood !== "smug") return smug(false);
  mood("idle"); play("trick"); smug(false);
});
$("bubble").addEventListener("click", () => smug());

const finder = document.querySelector(".finder");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { finder.classList.toggle("stuck", finder.getBoundingClientRect().top <= 0 && scrollY > 40); ticking = false; });
}, { passive: true });

addEventListener("online", () => { renderStatus(); refresh(); });
addEventListener("offline", () => { renderStatus(); mood("sleepy", 6000); say("No signal? Relax. I saved everything. Obviously. 📦"); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    smug();
    if (navigator.onLine && state.data && Date.now() - new Date(state.data.updated).getTime() > 30 * 60000) refresh();
  }
});

/* ================= start ================= */

const h1 = document.querySelector("h1");
h1.innerHTML = [...h1.textContent].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
h1.setAttribute("aria-label", "showy");
h1.addEventListener("click", () => {
  if (reduceMotion.matches) return;
  h1.classList.remove("wave"); void h1.offsetWidth; h1.classList.add("wave");
  if ($("buddy").dataset.mood === "idle") play("trick");
});

/* boot intro: a fan of cards, a burst of coins, the name. Tap to skip. */
function runIntro() {
  const el = $("intro"), root = document.documentElement;
  if (!el) return Promise.resolve();
  if (root.classList.contains("no-intro")) { el.remove(); return Promise.resolve(); }
  el.querySelector(".intro-stage").insertAdjacentHTML("beforeend",
    [[-78, -70], [-50, -100], [-16, -118], [18, -112], [50, -96], [80, -64], [-102, -34], [104, -30]]
      .map(([x, y], i) => `<span class="icoin" style="--x:${x}px;--y:${y}px;animation-delay:${(0.4 + i * 0.03).toFixed(2)}s"></span>`).join(""));
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      el.classList.add("out"); root.classList.remove("intro-on");
      setTimeout(() => { el.remove(); resolve(); }, 320);
    };
    setTimeout(finish, 1500);
    el.addEventListener("click", finish);
  });
}

(async function start() {
  cartBadge();
  const intro = runIntro();
  $("buddy").innerHTML = mascot();
  $("buddy").dataset.mood = "idle";
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    navigator.serviceWorker.ready.then(() => setTimeout(warmImages, 600));
    navigator.serviceWorker.addEventListener("controllerchange", () => setTimeout(warmImages, 600));
  }
  intro.then(() => smug());
  renderControls();
  await loadSaved();
  renderControls();
  renderList(true);
  renderStatus();
  setTimeout(idleLoop, 3000);
  if (navigator.onLine) await refresh();
  else { renderStatus(); if (state.data) mood("sleepy", 6000); }
})();
