"""showy's mascot for the app: the chibi showgirl magician, one trick per card condition.
Writes mascot.svg (no <defs>; patterns live once in index.html), defs.svg, mascot.css, icon svgs."""
import math, sys
import girl as G
from girl import (SKIN, HAIR, HAIRS, HAIRL, RED, REDD, CREAM, GOLD, GOLDD, EYE, BLUSH, MOUTH, INK, SHORTS, CARDS,
                  card, star, tophat, BOB_BACK, BOB_FRONT)

CX, CY = 100, 90
S = f'fill="none" stroke="{INK}" stroke-linecap="round"'


def arm(d, hx, hy):
    return (f'<path d="{d}" fill="none" stroke="{SKIN}" stroke-width="8.5" stroke-linecap="round"/>'
            f'<circle cx="{hx}" cy="{hy}" r="5.8" fill="{CREAM}"/>')


def coin(r=6, cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<g{c}><circle r="{r}" fill="{GOLD}"/><circle r="{r - 2.3:.1f}" fill="none" stroke="{GOLDD}" stroke-width="1.4"/>'
            f'<circle cx="{-r * .35:.1f}" cy="{-r * .35:.1f}" r="{r * .2:.1f}" fill="#fff" opacity=".8"/></g>')


def g(cls, inner, extra=""):
    return f'<g class="{cls}"{extra}>{inner}</g>'


# ---------- body ----------
LEGS = "".join(f'<path d="M{x} 168 h14 v24 h-14 Z" fill="{SKIN}"/><path d="M{x} 168 h14 v24 h-14 Z" fill="url(#sg-net)"/>' for x in (82, 104))
SHOES = G._shoe_profile()
SKIRT = (f'<path d="M80 146 Q100 151 120 146 L145 170 Q100 182 55 170 Z" fill="url(#sg-dots)"/>'
         + "".join(f'<circle cx="{x:.1f}" cy="{170 + 6 * (1 - ((x - 100) / 45) ** 2):.1f}" r="4.6" fill="{CREAM}"/>' for x in [57 + i * 8.6 for i in range(11)])
         + f'<path d="M80 146 Q100 151 120 146" stroke="{GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/>')
BODICE = (f'<path d="M78 120 Q100 116 122 120 L119 148 Q100 152 81 148 Z" fill="url(#sg-stripe)"/>'
          f'<path d="M78 120 Q100 116 122 120 L119 148 Q100 152 81 148 Z" fill="none" stroke="{REDD}" stroke-width="1.6" opacity=".6"/>'
          f'<path d="M97 125 L103 129 L97 133 L103 137 L97 141 L103 145" stroke="{GOLD}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>')
SLEEVE_L = f'<circle cx="76" cy="124" r="9" fill="url(#sg-stripe)"/><path d="M68 129 Q76 134 84 129" stroke="{GOLD}" stroke-width="2" fill="none" stroke-linecap="round"/>'
SLEEVE_R = f'<circle cx="124" cy="124" r="9" fill="url(#sg-stripe)"/><path d="M116 129 Q124 134 132 129" stroke="{GOLD}" stroke-width="2" fill="none" stroke-linecap="round"/>'
RUFF = G.ruff()

# ---------- face variants ----------
def dots(cy=CY, dx=15, lash=True):
    lx, rx = CX - dx, CX + dx
    out = f'<ellipse cx="{lx}" cy="{cy}" rx="4.6" ry="5.8" fill="{EYE}"/><ellipse cx="{rx}" cy="{cy}" rx="4.6" ry="5.8" fill="{EYE}"/>'
    if lash:
        out += f'<path d="M{lx-4.6} {cy-3.6} l-2.8 -1.1 M{rx+4.6} {cy-3.6} l2.8 -1.1" stroke="{EYE}" stroke-width="1.8" stroke-linecap="round"/>'
    return out


def smug_eyes(lid=-1.6):
    out = ""
    for x in (CX - 15, CX + 15):
        out += f'<path d="M{x-4.4} {CY+lid} L{x+4.4} {CY+lid-.6} A4.6 5.8 0 0 1 {x} {CY+5.8} A4.6 5.8 0 0 1 {x-4.4} {CY+lid} Z" fill="{EYE}"/>'
    return out + f'<path d="M{CX-19.6} {CY-1.2} l-2.8 -1.1 M{CX+19.6} {CY-1.8} l2.8 -1.1" stroke="{EYE}" stroke-width="1.8" stroke-linecap="round"/>'


EYES = {
    "e-dots": ("f-lp fm-search", dots()),
    "e-up": ("f-hp", f'<g class="lookup">{dots(CY - 2)}</g>'),
    "e-wink": ("f-nm", f'<ellipse cx="85" cy="{CY}" rx="4.6" ry="5.8" fill="{EYE}"/><path d="M80.4 {CY-3.6} l-2.8 -1.1" stroke="{EYE}" stroke-width="1.8" stroke-linecap="round"/>'
                       f'<path d="M110 {CY+1} q5 -5 10 0" {S} stroke="{EYE}" stroke-width="2.4"/>'),
    "e-smug": ("f-mp f-dmg fm-smug", smug_eyes()),
    "e-happy": ("fm-happy", f'<path d="M80 {CY+1.5} q5 -6 10 0 M110 {CY+1.5} q5 -6 10 0" {S} stroke="{EYE}" stroke-width="2.6"/>'),
    "e-shut": ("fm-trick", f'<path d="M81 {CY-4} L88 {CY} L81 {CY+4} M119 {CY-4} L112 {CY} L119 {CY+4}" {S} stroke="{EYE}" stroke-width="2.4" stroke-linejoin="round"/>'),
    "e-sleep": ("fm-sleepy", f'<path d="M80 {CY} q5 4 10 0 M110 {CY} q5 4 10 0" {S} stroke="{EYE}" stroke-width="2.4"/>'),
}
MOUTHS = {
    "m-grin": ("f-nm fm-happy fm-trick", f'<path d="M{CX-6} {CY+13} q6 6 12 0 Z" fill="{MOUTH}"/>'),
    "m-smirk": ("f-mp fm-smug", f'<path d="M{CX-4} {CY+15} q4.5 2.6 8 -1 q1 -1 1.6 -2.6" {S} stroke-width="2"/>'),
    "m-o": ("f-lp fm-search", f'<ellipse cx="{CX}" cy="{CY+15}" rx="3" ry="3.6" fill="{MOUTH}"/>'),
    "m-tiny": ("f-hp fm-sleepy", f'<ellipse cx="{CX+1}" cy="{CY+15}" rx="2" ry="2.3" fill="{MOUTH}"/>'),
    "m-pout": ("f-dmg", f'<path d="M{CX-5} {CY+16} q2.5 -3 5 0 q2.5 -3 5 0" {S} stroke-width="2"/>'),
}
BROWS = {
    "b-raise": ("f-mp fm-smug", f'<path d="M{CX+9} {CY-13} q6 -4.5 12 -1" {S} stroke-width="1.9" opacity=".8"/>'),
    "b-annoy": ("f-dmg", f'<path d="M{CX-22} {CY-14} l11 3.5 M{CX+22} {CY-14} l-11 3.5" {S} stroke-width="2.1"/>'),
}
EXTRAS = {
    "x-sweat": ("f-hp", '<path class="sweat" d="M139 70 q5 7 0 10 q-5 -3 0 -10 Z" fill="#9FC3E0"/>'),
    "x-anger": ("f-dmg", f'<g class="anger"><path d="M126 58 q3 3 0 6 M130 56 q-3 3 0 6 M124 62 q3 -3 6 0 M126 66 q3 -3 6 0" stroke="{RED}" stroke-width="2.2" fill="none" stroke-linecap="round" transform="translate(-2 -6)"/></g>'),
}


def variants(d):
    return "".join(f'<g class="fv {k} {cls}">{svg}</g>' for k, (cls, svg) in d.items())


FACE = (f'<ellipse cx="{CX-23}" cy="{CY+9}" rx="7" ry="4.3" fill="{BLUSH}" opacity=".8"/>'
        f'<ellipse cx="{CX+23}" cy="{CY+9}" rx="7" ry="4.3" fill="{BLUSH}" opacity=".8"/>'
        f'<g class="g-eyes"><g class="g-look">{variants(EYES)}</g></g>' + variants(MOUTHS) + variants(BROWS))

# ---------- per-condition hats (inside the head) and accessories ----------
HATS = (g("cv c-nm hat h-nm", tophat(76, 36, -24, .95)) + g("cv c-lp hat h-lp", tophat(78, 36, -18, .82))
        + g("cv c-hp hat h-hp", tophat(80, 35, -20, .86))
        + g("cv c-dmg hat h-dmg", tophat(112, 44, 34, .9)
            + f'<g class="wisp"><path d="M118 20 q-4 -5 0 -10 q4 -5 0 -10" stroke="#9A93A6" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></g>'))
SOOT = g("cv c-dmg", f'<ellipse cx="74" cy="104" rx="6" ry="3" fill="#5A5160" opacity=".35"/><ellipse cx="124" cy="96" rx="4" ry="2.4" fill="#5A5160" opacity=".3"/>'
         f'<path d="M64 42 l3 -5 l2 5 l3 -5 M136 40 l3 -5 l2 5" stroke="{HAIRS}" stroke-width="2" fill="none" stroke-linejoin="round"/>')

HEAD = g("g-head", BOB_BACK + f'<ellipse cx="100" cy="80" rx="44" ry="41" fill="{SKIN}"/>' + FACE + variants(EXTRAS) + BOB_FRONT + SOOT + HATS)

# ---------- poses: arms behind the sleeves (pb) and props in front (pf) ----------
WAND_NM = (f'<g class="wand"><path d="M151 92 L170 58" stroke="#6A57A0" stroke-width="4.6" stroke-linecap="round"/><path d="M164.2 68.4 L165.8 65.6" stroke="{GOLD}" stroke-width="5.2"/>'
           f'<path d="M166 65 L170 58" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/></g>'
           + "".join(g(f"spk k{i}", star(x, y, s, c), "") for i, (x, y, s, c) in enumerate([(174, 50, .9, GOLD), (160, 42, .5, "#fff"), (186, 66, .5, GOLD), (178, 34, .4, "#fff")])))
FAN = g("fan", card(40, 140, -28, CARDS[0]) + card(46, 136, -8, CARDS[1]) + card(53, 137, 14, CARDS[2]))

ARC = "".join(g(f"ac a{i}", card(40 + i * 15, 146 - 18 * (1 - ((i - 4) / 4) ** 2), -44 + i * 11, CARDS[i % 3], 12, 17)) for i in range(9))

TIP = g("tip", f'<path d="M130 124 Q166 98 143 44" fill="none" stroke="{SKIN}" stroke-width="8.5" stroke-linecap="round"/>'
        + SLEEVE_R + f'<g class="mcoin">{coin(6)}</g>' + tophat(118, 30, 18, .9) + f'<circle cx="141" cy="40" r="6.2" fill="{CREAM}"/>')
TIP = TIP.replace(f'<g class="mcoin">{coin(6)}</g>', f'<g transform="translate(120 40)"><g class="mcoin">{coin(6)}</g></g>')

JUGGLE = "".join(f'<g transform="translate(100 92)"><g class="jc j{i}">{coin(6.5)}</g></g>' for i in range(3))

COUGH = arm("M74 126 Q56 116 86 108", 88, 107)
WAND_DMG = (f'<path d="M156 146 L178 130" stroke="#6A57A0" stroke-width="4.6" stroke-linecap="round"/>'
            f'<path d="M173.5 133.3 L178 130" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/>'
            + "".join(f'<g transform="translate(180 126)"><g class="smk s{i}"><circle r="5" fill="#8C8496"/><circle cx="4" cy="-2" r="3.6" fill="#8C8496"/></g></g>' for i in range(3)))

POSE_BACK = (g("cv c-nm pb", arm("M72 128 Q58 136 50 146", 50, 146))
             + g("cv c-lp pb", arm("M72 128 Q54 136 40 146", 40, 146) + arm("M128 128 Q146 136 160 146", 160, 146))
             + g("cv c-mp pb", arm("M72 128 Q64 138 78 146", 79, 146))
             + g("cv c-hp pb", arm("M72 128 Q58 138 64 144", 64, 144) + arm("M128 128 Q142 138 136 144", 136, 144))
             + g("cv c-dmg pb", arm("M128 128 Q146 136 156 146", 156, 146)))
POSE_FRONT = (g("cv c-nm pf", f'<path d="M128 126 Q150 118 151 94" fill="none" stroke="{SKIN}" stroke-width="8.5" stroke-linecap="round"/>' + SLEEVE_R + WAND_NM + f'<circle cx="151" cy="92" r="5.8" fill="{CREAM}"/>' + FAN) + g("cv c-lp pf", ARC) + g("cv c-mp pf", TIP)
              + g("cv c-hp pf", JUGGLE) + g("cv c-dmg pf", COUGH + WAND_DMG))

# ---------- effects ----------
POOF = g("fx-poof", '<g fill="#FFF8EE" opacity=".96">' + "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in
         [(100, 112, 30), (68, 92, 20), (134, 90, 21), (62, 140, 19), (140, 142, 20), (100, 64, 22), (100, 166, 22), (80, 120, 18), (122, 126, 18)]) + "</g>"
         + "".join(star(x, y, s) for x, y, s in [(44, 76, .9), (158, 80, .8), (152, 176, .7), (48, 178, .6)]))
BURST = g("fx-burst", "".join(f'<g transform="translate({100 + 70 * math.cos(a):.1f} {80 + 64 * math.sin(a):.1f})"><g class="bs">{star(0, 0, .8 if i % 2 else .55, GOLD if i % 2 else "#fff")}</g></g>'
                               for i, a in enumerate([k * 2 * math.pi / 10 - math.pi / 2 for k in range(10)])))
ZZZ = g("fx-z", f'<text x="146" y="44" font-size="18">z</text><text x="160" y="28" font-size="13">z</text>', f' fill="{INK}" font-family="Baloo 2, sans-serif" font-weight="800"')


def app_svg():
    inner = (f'<ellipse cx="100" cy="209" rx="40" ry="4" fill="#000" opacity=".12"/>'
             + g("g-bob", g("g-hop", LEGS + SHOES + SKIRT + BODICE + POSE_BACK + SLEEVE_L + SLEEVE_R + HEAD + RUFF + POSE_FRONT))
             + POOF + BURST + ZZZ)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="22 4 156 210" class="mascot" aria-hidden="true">{inner}</svg>'


DEFS = (f'<svg class="sg-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>'
        f'<pattern id="sg-stripe" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="{RED}"/><rect x="4" width="4" height="8" fill="{CREAM}"/></pattern>'
        f'<pattern id="sg-dots" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="{RED}"/><circle cx="4.5" cy="4.5" r="1.7" fill="{CREAM}"/></pattern>'
        f'<pattern id="sg-net" width="4.6" height="4.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 V4.6 M0 0 H4.6" stroke="{G.NET}" stroke-width=".85" fill="none"/></pattern>'
        f'</defs></svg>')

# ---------- CSS ----------
IDLE_FACE = '[data-mood="idle"]:not([data-idle="trick"]):not([data-idle="smug"]) > .mascot'
CSS = """/* ---------- Mascot: showy's showgirl magician, one trick per condition ---------- */
.sg-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.mascot { display: block; width: 100%; height: auto; overflow: visible; }
.mascot * { transform-box: view-box; }
.mascot .cv, .mascot .fv, .mascot .fx-z { display: none; }
"""
for c in ("nm", "lp", "mp", "hp", "dmg"):
    CSS += f'[data-cond="{c.upper()}"] .mascot .cv.c-{c} {{ display: inline; }}\n'
    CSS += f'[data-cond="{c.upper()}"] {IDLE_FACE} .fv.f-{c} {{ display: inline; }}\n'
for m in ("smug", "happy", "search", "sleepy"):
    CSS += f'[data-mood="{m}"] > .mascot .fv.fm-{m} {{ display: inline; }}\n'
CSS += '[data-idle="smug"] > .mascot .fv.fm-smug, [data-idle="trick"] > .mascot .fv.fm-happy { display: inline; }\n'
CSS += '[data-idle="trick"] > .mascot .fv.m-grin { display: inline; }\n'
CSS += r"""
/* always: a little bounce, blinking, hats that barely hang on */
.mascot .g-bob { animation: sg-bob 2.6s ease-in-out infinite; }
@keyframes sg-bob { 50% { transform: translateY(-1.6px); } }
.mascot .g-hop { transform-origin: 100px 208px; }
.mascot .g-head { transform-origin: 100px 118px; }
.mascot .g-eyes { transform-origin: 100px 90px; animation: sg-blink 4.6s infinite; }
@keyframes sg-blink { 0%, 93%, 100% { transform: scaleY(1); } 95.5% { transform: scaleY(.12); } }
.mascot .h-nm { transform-origin: 82px 40px; animation: sg-teeter 3.4s ease-in-out infinite; }
.mascot .h-lp { transform-origin: 84px 40px; animation: sg-teeter 3s ease-in-out -1s infinite; }
.mascot .h-hp { transform-origin: 86px 39px; animation: sg-teeter 2.4s ease-in-out -.4s infinite; }
.mascot .h-dmg { transform-origin: 104px 46px; animation: sg-teeter 2.8s ease-in-out infinite; }
@keyframes sg-teeter { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-3deg); } 50% { transform: rotate(2deg); } 78% { transform: rotate(-5deg) translateY(1px); } 86% { transform: rotate(2deg); } }

/* NM: ta-da! wand twirls, sparkles pop, cards fan */
[data-cond="NM"] .mascot .g-head { transform: rotate(-3deg); }
.mascot .wand { transform-origin: 151px 92px; animation: sg-wand 2.4s ease-in-out infinite; }
@keyframes sg-wand { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-12deg); } 55% { transform: rotate(8deg); } }
.mascot .spk { transform-box: fill-box; transform-origin: center; animation: sg-twinkle 2.4s ease-in-out infinite; }
.mascot .spk.k1 { animation-delay: -.6s; } .mascot .spk.k2 { animation-delay: -1.2s; } .mascot .spk.k3 { animation-delay: -1.8s; }
@keyframes sg-twinkle { 0%, 100% { transform: scale(0) rotate(0); opacity: 0; } 30% { transform: scale(1.15) rotate(45deg); opacity: 1; } 60% { transform: scale(.2) rotate(90deg); opacity: 0; } }
.mascot .fan { transform-origin: 50px 146px; animation: sg-fan 2.4s ease-in-out infinite; }
@keyframes sg-fan { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-7deg) translateY(-2px); } }

/* LP: springing cards from hand to hand */
.mascot .ac { animation: sg-spring 1.6s ease-in-out infinite; }
""" + "".join(f".mascot .ac.a{i} {{ animation-delay: {i * .11 - 1.6:.2f}s; }}\n" for i in range(9)) + r"""@keyframes sg-spring { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-9px); } 50% { transform: translateY(0); } }

/* MP: tips her hat and a coin pops out */
[data-cond="MP"] .mascot .g-head { transform: rotate(4deg); }
.mascot .tip { transform-origin: 141px 44px; animation: sg-tip 3.2s ease-in-out infinite; }
@keyframes sg-tip { 0%, 18%, 74%, 100% { transform: none; } 32%, 58% { transform: translate(3px, -10px) rotate(9deg); } }
.mascot .mcoin { opacity: 0; transform-box: fill-box; transform-origin: center; animation: sg-pop 3.2s ease-out infinite; }
@keyframes sg-pop { 0%, 26% { opacity: 0; transform: translateY(4px) scale(.3); } 38% { opacity: 1; transform: translateY(-22px) scale(1) scaleX(1); } 48% { transform: translateY(-28px) scaleX(-1); } 58% { opacity: 1; transform: translateY(-30px) scaleX(1); } 70%, 100% { opacity: 0; transform: translateY(-8px) scale(.6); } }

/* HP: juggling three coins, sweating a little */
[data-cond="HP"] .mascot .g-head { transform: rotate(-2deg); }
.mascot .jc { animation: sg-juggle 1.8s linear infinite; }
.mascot .jc.j1 { animation-delay: -.6s; } .mascot .jc.j2 { animation-delay: -1.2s; }
@keyframes sg-juggle {
  0% { transform: translate(-36px, 50px); } 12.5% { transform: translate(-46px, 6px); } 25% { transform: translate(-30px, -42px); }
  37.5% { transform: translate(0, -62px); } 50% { transform: translate(30px, -42px); } 62.5% { transform: translate(46px, 6px); }
  75% { transform: translate(36px, 50px); } 87.5% { transform: translate(0, 58px); } 100% { transform: translate(-36px, 50px); }
}
.mascot .lookup { animation: sg-follow 1.8s ease-in-out infinite; }
@keyframes sg-follow { 0%, 100% { transform: translate(-2px, -1px); } 50% { transform: translate(2px, -1px); } }
.mascot .sweat { animation: sg-sweat 1.8s ease-in infinite; }
@keyframes sg-sweat { 0%, 30% { opacity: 0; transform: translateY(0); } 45% { opacity: 1; } 100% { opacity: 0; transform: translateY(12px); } }

/* DMG: the trick backfires. smoke, soot, a cough, and she's NOT happy about it */
.mascot .h-dmg + * {}
[data-cond="DMG"] .mascot .g-head { animation: sg-cough 2.6s ease-in-out infinite; }
@keyframes sg-cough { 0%, 60%, 100% { transform: rotate(5deg); } 66% { transform: rotate(3deg) translateY(2px); } 72% { transform: rotate(6deg); } 78% { transform: rotate(3.5deg) translateY(1.5px); } 84% { transform: rotate(5deg); } }
.mascot .smk { opacity: 0; transform-box: fill-box; transform-origin: center; animation: sg-smoke 1.8s ease-out infinite; }
.mascot .smk.s1 { animation-delay: -.6s; } .mascot .smk.s2 { animation-delay: -1.2s; }
@keyframes sg-smoke { 0% { opacity: 0; transform: translate(0, 0) scale(.4); } 20% { opacity: .9; } 100% { opacity: 0; transform: translate(10px, -34px) scale(1.6); } }
.mascot .wisp { animation: sg-wisp 2s ease-in-out infinite; }
@keyframes sg-wisp { 0%, 100% { opacity: .2; transform: translateY(2px); } 50% { opacity: .9; transform: translateY(-3px); } }
.mascot .anger { transform-box: fill-box; transform-origin: center; animation: sg-anger 1.3s ease-in-out infinite; }
@keyframes sg-anger { 0%, 100% { transform: scale(.85); } 50% { transform: scale(1.15); } }

/* moods */
[data-mood="happy"] .mascot .g-hop, [data-idle="trick"] .mascot .g-hop { animation: sg-hop .62s var(--spring) 2; }
@keyframes sg-hop { 0%, 100% { transform: none; } 15% { transform: scale(1.05, .94); } 45% { transform: translateY(-12px) scale(.97, 1.04); } }
[data-mood="search"] .mascot .g-look { animation: sg-dart .9s ease-in-out infinite; }
@keyframes sg-dart { 0%, 100% { transform: translateX(-3px); } 50% { transform: translateX(3px); } }
[data-mood="sleepy"] .mascot .g-eyes { animation: none; }
[data-mood="sleepy"] .mascot .g-head { animation: sg-doze 3.4s ease-in-out infinite; }
@keyframes sg-doze { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(-7deg) translateY(2px); } }
[data-mood="sleepy"] .mascot .fx-z { display: inline; animation: sg-zz 2.4s ease-in-out infinite; }
@keyframes sg-zz { 0% { opacity: 0; transform: translateY(6px); } 40% { opacity: .75; } 100% { opacity: 0; transform: translateY(-10px); } }
[data-mood="smug"] .mascot .g-hop, [data-idle="smug"] .mascot .g-hop { animation: sg-lean 2.6s ease-in-out; }
@keyframes sg-lean { 0%, 100% { transform: none; } 20%, 75% { transform: rotate(-3deg) scale(1.01, .99); } }

/* idle routines */
[data-idle="look"] .mascot .g-look { animation: sg-look 2.6s ease-in-out; }
@keyframes sg-look { 0%, 100% { transform: translate(0, 0); } 20%, 40% { transform: translate(-3.5px, .5px); } 60%, 85% { transform: translate(3.5px, -.5px); } }
[data-idle="hatslip"] .mascot .hat { animation: sg-slip 1.5s ease-in-out; }
@keyframes sg-slip { 0%, 100% { transform: none; } 30% { transform: rotate(-14deg) translate(-3px, 3px); } 45% { transform: rotate(-16deg) translate(-4px, 4px); } 70% { transform: rotate(4deg); } 85% { transform: rotate(-2deg); } }

/* tap: ta-da burst */
.mascot .fx-burst { opacity: 0; }
[data-idle="trick"] .mascot .fx-burst { animation: sg-burst-in 1.2s ease-out; }
@keyframes sg-burst-in { 0% { opacity: 0; } 10%, 70% { opacity: 1; } 100% { opacity: 0; } }
.mascot .bs { transform-box: fill-box; transform-origin: center; }
[data-idle="trick"] .mascot .bs { animation: sg-bs 1.2s cubic-bezier(.2, .9, .3, 1); }
@keyframes sg-bs { 0% { transform: scale(0) rotate(0); } 40% { transform: scale(1.3) rotate(90deg); } 100% { transform: scale(.4) rotate(180deg); } }

/* outfit change: a puff of smoke */
.mascot .fx-poof { opacity: 0; transform-origin: 100px 116px; pointer-events: none; }
.poof > .mascot .fx-poof { animation: sg-poof .62s ease-out; }
@keyframes sg-poof { 0% { opacity: 0; transform: scale(.25); } 28% { opacity: 1; transform: scale(1); } 55% { opacity: 1; transform: scale(1.06); } 100% { opacity: 0; transform: scale(1.3); } }
"""


def icon_svg(size=512, maskable=False):
    """close-up of her smug face"""
    face = FACE
    vb = "30 6 140 140" if not maskable else "18 -2 164 164"
    head = (BOB_BACK + f'<ellipse cx="100" cy="80" rx="44" ry="41" fill="{SKIN}"/>'
            f'<ellipse cx="77" cy="99" rx="7" ry="4.3" fill="{BLUSH}" opacity=".8"/><ellipse cx="123" cy="99" rx="7" ry="4.3" fill="{BLUSH}" opacity=".8"/>'
            + smug_eyes() + MOUTHS["m-smirk"][1] + BROWS["b-raise"][1] + BOB_FRONT + tophat(76, 36, -24, .95))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{size}" height="{size}">'
            f'<defs><pattern id="sg-stripe" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="{RED}"/><rect x="4" width="4" height="8" fill="{CREAM}"/></pattern></defs>'
            f'<rect x="0" y="0" width="200" height="220" fill="#2A2029"/>'
            f'<rect x="0" y="0" width="200" height="220" fill="url(#sg-stripe)" opacity=".18"/>'
            f'<g transform="translate(100 84) scale(1.08) translate(-100 -84)">'
            f'<path d="M72 128 Q100 116 128 128 L132 160 L68 160 Z" fill="url(#sg-stripe)"/>{RUFF}{head}</g></svg>')


if __name__ == "__main__":
    out = sys.argv[1]
    open(f"{out}/mascot.svg", "w").write(app_svg())
    open(f"{out}/defs.svg", "w").write(DEFS)
    open(f"{out}/mascot.css", "w").write(CSS)
    open(f"{out}/icon.svg", "w").write(icon_svg())
    open(f"{out}/icon-maskable.svg", "w").write(icon_svg(maskable=True))
    print("ok")
