"""bagl's condition outfits, outfit-change poof, and boot intro. Builds on gen.py's base mascot."""
import math, sys
import gen
from gen import LINE, SHADE, FILL, GOLD, GOLDD, CORAL, CREAM, EYE, CY, LX, RX, ERX, ERY, ECY, lidded, f

S = f'fill="none" stroke="{LINE}" stroke-linecap="round"'
STAR = "M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z"
NOTE = (f'<ellipse cx="0" cy="0" rx="3.3" ry="2.5" transform="rotate(-20)" fill="{LINE}"/>'
        f'<path d="M2.9 -1 V-12 Q7.5 -10 7.5 -5.5" stroke="{LINE}" stroke-width="1.7" fill="none" stroke-linecap="round"/>')


def at(x, y, inner, cls):
    return f'<g transform="translate({x} {y})"><g class="{cls}">{inner}</g></g>'


def spiral(r=7.2, turns=3.2, n=60):
    pts = []
    for i in range(n + 1):
        t = i / n
        a = t * turns * 2 * math.pi
        rr = r * t
        pts.append(f"{f(rr * math.cos(a))} {f(rr * math.sin(a))}")
    return "M" + " L".join(pts)


def outfit_nm():
    hat = ('<g transform="rotate(-8 100 42)">'
           '<ellipse cx="100" cy="42" rx="27" ry="6" fill="#2E2430"/>'
           '<path d="M85 42 L87 15 Q100 11 113 15 L115 42 Z" fill="#2E2430"/>'
           f'<path d="M85.6 33.5 L114.4 33.5 L114.9 40 L85.1 40 Z" fill="{CORAL}"/>'
           '<path d="M90 18 Q92 28 91 32" stroke="#fff" stroke-width="2.2" opacity=".2" fill="none" stroke-linecap="round"/></g>')
    bow = ('<path d="M100 87 L86.5 80 Q84.5 87 86.5 94 Z M100 87 L113.5 80 Q115.5 87 113.5 94 Z" fill="#8B6FB8"/>'
           '<circle cx="100" cy="87" r="3.8" fill="#6E5596"/>')
    sparks = "".join(at(x, y, f'<path d="{STAR}" fill="{GOLD}" transform="scale({s})"/>', f"o-spark k{i}")
                     for i, (x, y, s) in enumerate([(40, 96, 1), (162, 84, .8), (154, 126, .6), (46, 140, .55)]))
    return f'<g class="o o-nm">{hat}{bow}{sparks}</g>'


def outfit_lp():
    beanie = ('<path d="M75 46 Q73 17 100 15 Q127 17 125 46 Z" fill="#7FA6C9"/>'
              '<path d="M87 21 Q85 33 86.5 44 M100 16 V44 M113 21 Q115 33 113.5 44" stroke="#6489AE" stroke-width="2.2" fill="none" opacity=".75"/>'
              '<rect x="72" y="39" width="56" height="11" rx="5.5" fill="#6489AE"/>'
              '<path d="M78 44.5 h44" stroke="#557A9E" stroke-width="1.6" stroke-dasharray="2 3" opacity=".8"/>'
              f'<circle cx="100" cy="13" r="7" fill="{CREAM}"/><circle cx="98" cy="11" r="2.2" fill="#fff" opacity=".7"/>')
    notes = "".join(at(110, 134, f'<g transform="scale({s})">{NOTE}</g>', f"o-note n{i}") for i, s in enumerate([1, .8, .9]))
    mouth = '<ellipse class="of" cx="104" cy="139" rx="2.3" ry="2.7" fill="#E8794F"/>'
    return f'<g class="o o-lp">{beanie}{notes}{mouth}</g>'


def outfit_mp():
    hat = ('<path d="M67 46 Q69 39 80 38 L83 22 Q100 15 117 22 L120 38 Q131 39 133 46 Q100 54 67 46 Z" fill="#C9A86A"/>'
           '<path d="M81.6 31 Q100 26.5 118.4 31 L119.3 37.5 Q100 33 80.7 37.5 Z" fill="#8E6A4F"/>'
           '<path d="M70 45 Q100 51 130 45" stroke="#A98A4E" stroke-width="1.6" fill="none" opacity=".8"/>')
    mag = ('<g class="o-mag">'
           f'<path d="M128.5 131.5 L146 144" stroke="#8E6A4F" stroke-width="5.5" stroke-linecap="round"/>'
           '<circle cx="118" cy="121" r="14.5" fill="#EAF4FA" opacity=".94"/>'
           f'<g class="o-bigeye"><ellipse cx="118" cy="123" rx="8.6" ry="10.6" fill="{EYE}"/></g>'
           '<circle cx="118" cy="121" r="14.5" fill="none" stroke="#6B5640" stroke-width="3.2"/>'
           '<path d="M108.5 112.5 q4 -4.5 9.5 -4.5" stroke="#fff" stroke-width="2.2" fill="none" opacity=".85" stroke-linecap="round"/>'
           f'<circle cx="147.5" cy="145" r="6.5" fill="{SHADE}"/></g>')
    mouth = '<ellipse class="of" cx="99" cy="140" rx="2.1" ry="2.4" fill="#E8794F"/>'
    return f'<g class="o o-mp">{hat}{mag}{mouth}</g>'


def outfit_hp():
    wrap = ('<path d="M46 106 Q100 88 154 101 L155.5 111 Q100 99 47.5 116 Z" fill="#F4EFE6"/>'
            '<path d="M60 104 l4 8 M76 99 l3 8 M126 97 l2 8 M142 99 l1.6 8" stroke="#D8CFC0" stroke-width="1.4" stroke-linecap="round"/>'
            '<path d="M49 109 l-11 -7 l1.5 9 Z M49 112 l-10 7 l8.5 1.5 Z" fill="#F4EFE6"/>')
    patch2 = ('<g transform="rotate(8 64 166)"><rect x="54" y="157" width="19" height="17" rx="3" fill="#C9B9DD"/>'
              f'<rect x="56" y="159" width="15" height="13" rx="2" fill="none" stroke="{CREAM}" stroke-width="1.2" stroke-dasharray="2.2 1.8"/></g>')
    cane = '<path d="M40 196 L37 154 Q36 145 29 146" stroke="#8E6A4F" stroke-width="4.2" fill="none" stroke-linecap="round"/>'
    eyes = (f'<g class="of">{lidded(LX + .4, 6.4)}{lidded(RX + .4, 6.4)}'
            f'<path d="M80 131.5 q6 2.6 12 0 M108 131.5 q6 2.6 12 0" stroke="#B9A07E" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>')
    mouth = f'<path class="of" d="M94.5 140 q2.75 -2 5.5 0 q2.75 2 5.5 0" {S} stroke-width="2"/>'
    sigh = ('<g class="o-sigh"><circle cx="82" cy="142" r="3.4" fill="#fff" opacity=".9"/><circle cx="76.5" cy="140" r="2.4" fill="#fff" opacity=".9"/>'
            '<circle cx="72.5" cy="137.5" r="1.6" fill="#fff" opacity=".9"/></g>')
    return f'<g class="o o-hp">{wrap}{patch2}{eyes}{mouth}{sigh}</g>', f'<g class="o o-hp">{cane}</g>'


def outfit_dmg():
    tape = ('<g transform="translate(134 96)"><rect x="-12" y="-3" width="24" height="6" rx="1" fill="#C3C4CC" transform="rotate(35)"/>'
            '<rect x="-12" y="-3" width="24" height="6" rx="1" fill="#B2B3BC" transform="rotate(-35)"/></g>')
    crease = '<path d="M58 126 L74 134 L66 145 L86 152" stroke="#C9B08A" stroke-width="1.7" fill="none" stroke-linejoin="round" opacity=".9"/>'
    hole = ('<path d="M58 170 l4 -5 l3 3 l4 -5 l4 4 l3 -2 l1 6 l-4 4 l-5 -1 l-4 3 l-4 -3 Z" fill="#8E6A4F"/>'
            f'<circle cx="66" cy="170" r="3.4" fill="{GOLD}"/>')
    drip = at(66, 172, f'<circle r="3.2" fill="{GOLD}"/><circle r="1.6" fill="none" stroke="{GOLDD}" stroke-width="1"/>', "o-drip")
    eyes = "".join(at(x, ECY, f'<path d="{spiral()}" {S} stroke-width="1.9"/>', "o-spin") for x in (LX, RX))
    mouth = f'<path class="of" d="M93 140 q1.75 -2.4 3.5 0 t3.5 0 t3.5 0 t3.5 0" {S} stroke-width="2"/>'
    stars = "".join(f'<g transform="translate(100 33)"><g class="o-orb b{i}"><path d="{STAR}" fill="{GOLD}" transform="scale(.75)"/></g></g>' for i in range(3))
    return (f'<g class="o o-dmg">{tape}{crease}{hole}{drip}<g class="of">{eyes}</g>{mouth}{stars}</g>')


def poof():
    puffs = [(100, 120, 26), (70, 104, 18), (132, 102, 19), (64, 144, 17), (138, 146, 18), (100, 84, 17), (100, 160, 20), (82, 128, 16), (120, 130, 16)]
    circles = "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in puffs)
    sparks = "".join(f'<path d="{STAR}" transform="translate({x} {y}) scale({s})" fill="{GOLD}"/>' for x, y, s in [(46, 86, .9), (156, 92, .8), (150, 170, .7), (50, 172, .6)])
    return f'<g class="bl-poof"><g fill="#FFF8EE" opacity=".96">{circles}</g>{sparks}</g>'


def app_svg():
    body = gen.body()
    body = body.replace('<g class="bl-sway"><g class="bl-bag">', '<g class="bl-sway"><g class="bl-pose"><g class="bl-bag">', 1)
    body = body.replace('<path d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15"', '<path class="bl-ends" d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15"', 1)
    hp, cane = outfit_hp()
    outfits = outfit_nm() + outfit_lp() + outfit_mp() + hp + outfit_dmg()
    marker = '\n</g></g>\n<g transform="translate(100 42)">'
    assert marker in body
    # outfits ride on the bag (inside the pose group); the cane stays planted on the ground
    body = body.replace(marker, '\n' + outfits + '\n</g></g>' + cane + '</g>\n<g transform="translate(100 42)">', 1)
    body += poof()
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 28 168 168" class="mascot" aria-hidden="true">\n{body}\n</svg>'


IDLE = '[data-mood="idle"]:not([data-idle="spill"]) > .mascot'


def face_rule(cond, hide, show, extra=""):
    h = ", ".join(f'[data-cond="{cond}"] {IDLE} {s}' for s in hide)
    s = ", ".join(f'[data-cond="{cond}"] {IDLE} {x}' for x in show)
    out = f"{h} {{ display: none; }}\n"
    if s:
        out += f"{s} {{ display: inline; opacity: 1; }}\n"
    return out + extra


CSS = r"""/* ---------- bagl's outfits: one per condition ---------- */
.mascot .o, .mascot .o .of { display: none; }
[data-cond="NM"] .mascot .o-nm, [data-cond="LP"] .mascot .o-lp, [data-cond="MP"] .mascot .o-mp,
[data-cond="HP"] .mascot .o-hp, [data-cond="DMG"] .mascot .o-dmg { display: inline; }
.mascot .bl-pose { transform-origin: 100px 190px; }
.mascot .o-spark, .mascot .o-note, .mascot .o-spin, .mascot .o-orb, .mascot .o-drip, .mascot .o-bigeye { transform-box: fill-box; transform-origin: center; }
[data-cond="NM"] .mascot .bl-ends { display: none; }
[data-cond="MP"] .mascot .bl-ar { display: none; }
[data-cond="HP"] .mascot .bl-brows { display: none; }

/* NM: top hat and bow tie, chin up, sparkling */
[data-cond="NM"] .mascot .bl-pose { animation: o-proud 3.2s ease-in-out infinite; }
@keyframes o-proud { 0%, 100% { transform: rotate(0) translateY(0); } 50% { transform: rotate(-2.5deg) translateY(-2px) scale(1.01, 1.02); } }
.mascot .o-spark { animation: o-twinkle 2.4s ease-in-out infinite; }
.mascot .o-spark.k1 { animation-delay: -.6s; } .mascot .o-spark.k2 { animation-delay: -1.2s; } .mascot .o-spark.k3 { animation-delay: -1.8s; }
@keyframes o-twinkle { 0%, 100% { transform: scale(0) rotate(0); opacity: 0; } 30% { transform: scale(1.1) rotate(45deg); opacity: 1; } 60% { transform: scale(.2) rotate(90deg); opacity: 0; } }

/* LP: beanie, eyes shut, whistling a tune */
[data-cond="LP"] .mascot .bl-pose { animation: o-chill 2.4s ease-in-out infinite; }
@keyframes o-chill { 0%, 100% { transform: rotate(-3.5deg); } 50% { transform: rotate(3.5deg) translateY(-1.5px); } }
.mascot .o-note { opacity: 0; animation: o-note 2.7s ease-out infinite; }
.mascot .o-note.n1 { animation-delay: -.9s; } .mascot .o-note.n2 { animation-delay: -1.8s; }
@keyframes o-note { 0% { opacity: 0; transform: translate(0, 0) scale(.6); } 15% { opacity: 1; } 50% { transform: translate(14px, -22px) rotate(12deg) scale(1); } 100% { opacity: 0; transform: translate(30px, -48px) rotate(-10deg) scale(.9); } }

/* MP: bucket hat, inspecting with a magnifying glass */
[data-cond="MP"] .mascot .bl-pose { animation: o-lean 2.8s ease-in-out infinite; }
@keyframes o-lean { 0%, 100% { transform: rotate(2deg); } 50% { transform: rotate(4deg) translateY(-1px); } }
.mascot .o-mag { transform-origin: 147px 145px; animation: o-scan 2.8s ease-in-out infinite; }
@keyframes o-scan { 0%, 100% { transform: rotate(0) translate(0, 0); } 30% { transform: rotate(-4deg) translate(-3px, -1px); } 70% { transform: rotate(3deg) translate(2px, 1px); } }
.mascot .o-bigeye { animation: o-peer 2.8s ease-in-out infinite; }
@keyframes o-peer { 0%, 100% { transform: translate(0, 0); } 30% { transform: translate(-3px, 0); } 70% { transform: translate(3px, -1px); } 88% { transform: translate(3px, -1px) scaleY(.15); } }

/* HP: bandaged, leaning on a cane, sighing */
[data-cond="HP"] .mascot .bl-pose { animation: o-slouch 3.6s ease-in-out infinite; }
@keyframes o-slouch { 0%, 100% { transform: rotate(-4deg) scale(1.02, .97); } 50% { transform: rotate(-5deg) scale(1, 1); } }
.mascot .o-sigh { transform-origin: 82px 142px; opacity: 0; animation: o-sigh 3.6s ease-out infinite; }
@keyframes o-sigh { 0%, 40% { opacity: 0; transform: translate(0, 0) scale(.5); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(-16px, -8px) scale(1.3); } }

/* DMG: taped up, a hole leaking coins, seeing stars */
[data-cond="DMG"] .mascot .bl-pose { animation: o-wobble 1.9s ease-in-out infinite; }
@keyframes o-wobble { 0%, 100% { transform: rotate(-5deg); } 25% { transform: rotate(4deg) translateY(-1px); } 50% { transform: rotate(-3deg); } 75% { transform: rotate(6deg) translateY(-1px); } }
.mascot .o-spin { animation: o-spin 1.3s linear infinite; }
@keyframes o-spin { to { transform: rotate(360deg); } }
.mascot .o-drip { opacity: 0; animation: o-drip 2.2s ease-in infinite; }
@keyframes o-drip { 0% { opacity: 0; transform: translate(0, 0) scale(.6); } 15% { opacity: 1; transform: translate(-1px, 2px) scale(1); } 60% { opacity: 1; transform: translate(-6px, 18px) rotate(120deg); } 75%, 100% { opacity: 0; transform: translate(-9px, 18px) rotate(160deg); } }
.mascot .o-orb { animation: o-orbit 1.8s linear infinite; }
.mascot .o-orb.b1 { animation-delay: -.6s; } .mascot .o-orb.b2 { animation-delay: -1.2s; }
@keyframes o-orbit {
  0% { transform: translate(30px, 0) scale(1); } 12.5% { transform: translate(21px, 5px) scale(1.1); }
  25% { transform: translate(0, 7px) scale(1.15); } 37.5% { transform: translate(-21px, 5px) scale(1.1); }
  50% { transform: translate(-30px, 0) scale(.9); } 62.5% { transform: translate(-21px, -5px) scale(.75); }
  75% { transform: translate(0, -7px) scale(.65); } 87.5% { transform: translate(21px, -5px) scale(.75); } 100% { transform: translate(30px, 0) scale(1); }
}

/* outfit change: a puff of smoke */
.mascot .bl-poof { opacity: 0; transform-origin: 100px 124px; pointer-events: none; }
.poof > .mascot .bl-poof { animation: bl-poof .62s ease-out; }
@keyframes bl-poof { 0% { opacity: 0; transform: scale(.25); } 28% { opacity: 1; transform: scale(1); } 55% { opacity: 1; transform: scale(1.06); } 100% { opacity: 0; transform: scale(1.3); } }
.poof > .mascot .bl-sway { animation: bl-poof-hop .62s var(--spring); }
@keyframes bl-poof-hop { 30% { transform: translateY(-8px) scale(.94, 1.06); } 60% { transform: scale(1.04, .96); } }
"""

CSS += face_rule("NM", [".bl-es", ".bl-ms", ".bl-b1"], [".bl-ex", ".bl-mx", ".bl-b2"])
CSS += face_rule("LP", [".bl-es", ".bl-ms", ".bl-b1"], [".bl-sleep", ".o .of"],
                 f'[data-cond="LP"] {IDLE} .bl-eyes {{ animation: none; }}\n')
CSS += face_rule("MP", [".bl-ms"], [".o .of"])
CSS += face_rule("HP", [".bl-es", ".bl-ms"], [".o .of"])
CSS += face_rule("DMG", [".bl-es", ".bl-ms", ".bl-b1"], [".o .of"])

INTRO_CSS = r"""/* ---------- boot intro ---------- */
.intro {
  position: fixed; inset: 0; z-index: 60; display: grid; place-content: center; justify-items: center; gap: 2px;
  background: var(--bg); cursor: pointer;
}
.intro.out { animation: intro-out .32s ease-in forwards; }
@keyframes intro-out { to { opacity: 0; transform: scale(1.05); } }
.intro-stage { position: relative; width: 168px; }
.intro-bag { width: 168px; animation: intro-drop .72s linear both; }
@keyframes intro-drop {
  0% { transform: translateY(-75vh) rotate(-16deg); animation-timing-function: cubic-bezier(.5, 0, .9, .5); }
  48% { transform: translateY(0) rotate(2deg) scale(1.12, .84); animation-timing-function: cubic-bezier(.2, .8, .4, 1); }
  68% { transform: translateY(-16px) rotate(-1deg) scale(.95, 1.06); animation-timing-function: ease-in; }
  84% { transform: translateY(0) scale(1.03, .97); }
  100% { transform: none; }
}
.icoin {
  position: absolute; left: 50%; top: 18%; width: 18px; height: 18px; margin: -9px; border-radius: 50%; opacity: 0;
  background: radial-gradient(circle at 35% 35%, #FFF3C4 0 14%, #EDBE5A 16% 60%, #D29E3A 62%);
  box-shadow: inset 0 0 0 1.5px #D29E3A; animation: icoin .9s cubic-bezier(.2, .6, .4, 1) .42s both;
}
@keyframes icoin {
  0% { opacity: 0; transform: translate(0, 0) scale(.4); }
  12% { opacity: 1; }
  45% { transform: translate(calc(var(--x) * .55), var(--y)) scale(1) rotate(200deg); }
  100% { opacity: 0; transform: translate(var(--x), 110px) scale(.8) rotate(420deg); }
}
.intro-word { font: 800 56px/1 var(--fun); color: var(--ink); letter-spacing: -.01em; }
.intro-word span { display: inline-block; animation: intro-letter .5s var(--spring) both; animation-delay: calc(.5s + var(--i) * 75ms); }
@keyframes intro-letter { from { opacity: 0; transform: translateY(18px) scale(.4) rotate(-14deg); } }
.intro-on h1 span { animation-play-state: paused; }
"""

if __name__ == "__main__":
    out = sys.argv[1]
    open(f"{out}/mascot_outfits.svg", "w").write(app_svg())
    open(f"{out}/outfits.css", "w").write(CSS)
    open(f"{out}/intro.css", "w").write(INTRO_CSS)
    print("ok")
