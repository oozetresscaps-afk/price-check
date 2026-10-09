"""Generate the bagl mascot SVG (for app.js) and its CSS (for styles.css), plus icon SVGs."""
import math, sys

LINE = "#3B2A22"; BLUSH = "#F2906F"; MOUTH = "#E8794F"; EYE = "#211816"
GOLD = "#EDBE5A"; GOLDD = "#D29E3A"; CREAM = "#F7E8D0"
FILL = "#EBD9BC"; SHADE = "#D9C29E"; LIGHT = "#F6EBD6"; INNER = "#8E6A4F"
ROPE = "#9DB27E"; ROPED = "#7F9662"; CORAL = "#E58C7A"

CY = 122; LX, RX = 86, 114; LR = 11.5; ERX, ERY = 6, 7.4; ECY = CY + 0.5


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def coin(r=7, cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<g{c}><circle r="{r}" fill="{GOLD}"/><circle r="{f(r-2.6)}" fill="none" stroke="{GOLDD}" stroke-width="1.6"/>'
            f'<circle cx="{f(-r*.35)}" cy="{f(-r*.35)}" r="{f(r*.2)}" fill="#fff" opacity=".8"/></g>')


def e_path(cx, cy, R):
    a = math.radians(38)
    return f"M{f(cx-R)} {f(cy)} L{f(cx+R)} {f(cy)} A{R} {R} 0 1 0 {f(cx+R*math.cos(a))} {f(cy+R*math.sin(a))}"


def lidded(x, cut):
    top = ECY - ERY + cut; dy = top - ECY; hw = ERX * (1 - (dy / ERY) ** 2) ** .5
    return f'<path d="M{f(x-hw)} {f(top)} L{f(x+hw)} {f(top)} A{ERX} {ERY} 0 1 1 {f(x-hw)} {f(top)} Z" fill="{EYE}"/>'


S = f'fill="none" stroke="{LINE}" stroke-linecap="round"'


def face_parts():
    blush = (f'<ellipse cx="68" cy="{CY+11}" rx="7" ry="4.2" fill="{BLUSH}" opacity=".8"/>'
             f'<ellipse cx="132" cy="{CY+11}" rx="7" ry="4.2" fill="{BLUSH}" opacity=".8"/>')
    brows = (f'<g class="bl-b1"><path d="M{RX-5} {CY-15} q5 -3 10 -0.5" {S} stroke-width="1.8" opacity=".55"/></g>'
             f'<g class="bl-b2"><path d="M{LX-6} {CY-15} l11 1.8" {S} stroke-width="2" opacity=".8"/>'
             f'<path d="M{RX-6} {CY-15.5} q6 -5 12 -1" {S} stroke-width="2" opacity=".8"/></g>')
    eyes = (f'<g class="bl-eyes"><g class="bl-look">'
            f'<g class="bl-es">{lidded(LX+.8, 3.6)}{lidded(RX+.8, 3.6)}</g>'
            f'<g class="bl-ex">{lidded(LX+1.4, 5.6)}{lidded(RX+1.4, 5.6)}</g>'
            f'<g class="bl-ew"><ellipse cx="{LX}" cy="{ECY}" rx="{ERX}" ry="{ERY}" fill="{EYE}"/><ellipse cx="{RX}" cy="{ECY}" rx="{ERX}" ry="{ERY}" fill="{EYE}"/></g>'
            f'</g>'
            f'<g class="bl-shut" {S} stroke-width="2.2" stroke-linejoin="round"><path d="M{LX-4} {CY-5} L{LX+3} {CY} L{LX-4} {CY+5}"/><path d="M{RX+4} {CY-5} L{RX-3} {CY} L{RX+4} {CY+5}"/></g>'
            f'<g class="bl-sleep" {S} stroke-width="2.2"><path d="M{LX-6} {CY+1} q6 4 12 0"/><path d="M{RX-6} {CY+1} q6 4 12 0"/></g>'
            f'</g>')
    glasses = (f'<g transform="rotate(5 100 120)"><g class="bl-glasses"><g {S} stroke-width="1.8">'
               f'<circle cx="{LX}" cy="{CY}" r="{LR}"/><circle cx="{RX}" cy="{CY}" r="{LR}"/>'
               f'<path d="M{f(LX+LR)} {CY-1} q{f((RX-LX-2*LR)/2)} -3 {f(RX-LX-2*LR)} 0"/>'
               f'<path d="M{f(LX-LR)} {CY-2} l-6 -1.5"/><path d="M{f(RX+LR)} {CY-2} l6 -1.5"/></g></g></g>')
    mouths = (f'<path class="bl-ms" d="M94.5 {CY+17} q5.5 2.6 9.5 -1 q1.2 -1.1 1.9 -2.8" {S} stroke-width="2.1"/>'
              f'<path class="bl-mx" d="M92.5 {CY+17} q7.5 3.2 12 -1.6 q1.6 -1.6 2.6 -4" {S} stroke-width="2.2"/>'
              f'<ellipse class="bl-mo" cx="100" cy="{CY+16}" rx="2.6" ry="3" fill="{MOUTH}"/>')
    drop = '<path class="bl-drop" d="M138 96 q5 7 0 10 q-5 -3 0 -10 Z" fill="#9FC3E0"/>'
    return blush, brows, eyes, glasses, mouths, drop


def patch():
    return (f'<g transform="rotate(-10 136 157)"><circle cx="136" cy="157" r="12.5" fill="{CORAL}"/>'
            f'<circle cx="136" cy="157" r="10" fill="none" stroke="{CREAM}" stroke-width="1.3" stroke-dasharray="2.4 2"/>'
            f'<path d="{e_path(136, 157, 4.4)}" fill="none" stroke="{CREAM}" stroke-width="2.4" stroke-linecap="round"/></g>')


def bandage():
    return ('<g transform="rotate(-20 64 106)"><rect x="56" y="102" width="16" height="7" rx="3.5" fill="#F2C9A8"/>'
            '<rect x="61" y="102" width="6" height="7" fill="#E9B48F"/></g>')


def body(face=True, coins=True):
    blush, brows, eyes, glasses, mouths, drop = face_parts()
    fly = "".join(f'<g transform="translate(100 42)">{coin(r, "bl-fly bl-f" + str(i))}</g>'
                  for i, r in [(1, 7), (2, 7), (3, 6.5), (4, 5.5)]) if coins else ""
    return f'''<ellipse cx="100" cy="194" rx="46" ry="4" fill="#000" opacity=".08"/>
<g class="bl-fl"><ellipse cx="84" cy="191" rx="10" ry="5.5" fill="{SHADE}"/></g><g class="bl-fr"><ellipse cx="116" cy="191" rx="10" ry="5.5" fill="{SHADE}"/></g>
<g class="bl-sway"><g class="bl-bag">
<g class="bl-al"><path d="M48 142 Q36 148 34 158" fill="none" stroke="{SHADE}" stroke-width="10" stroke-linecap="round"/></g>
<g class="bl-ar"><path d="M152 142 Q164 148 166 158" fill="none" stroke="{SHADE}" stroke-width="10" stroke-linecap="round"/></g>
<path d="M82 74 C56 90 36 118 40 150 C43 178 68 190 100 190 C132 190 157 178 160 150 C164 118 144 90 118 74 Z" fill="{FILL}"/>
<path d="M128 82 C150 100 163 128 159 156 C155 176 137 188 112 190 C137 180 150 160 148 134 C146 110 139 94 128 82 Z" fill="{SHADE}" opacity=".8"/>
<path d="M56 112 Q50 126 52 142" fill="none" stroke="{LIGHT}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
<path d="M58 172 Q100 188 142 172" fill="none" stroke="{SHADE}" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round"/>
<g class="bl-top"><ellipse cx="100" cy="46" rx="24" ry="6.5" fill="{INNER}"/>
<g class="bl-pile"><g transform="translate(91 44)">{coin(7)}</g><g transform="translate(108 43)">{coin(7)}</g><g transform="translate(100 37)">{coin(7)}</g></g>
<path d="M76 46 Q100 58 124 46 C128 56 124 66 118 74 L82 74 C76 66 72 56 76 46 Z" fill="{FILL}"/>
<path d="M76 46 Q100 58 124 46" fill="none" stroke="{LIGHT}" stroke-width="3" stroke-linecap="round"/>
<path d="M116 52 C120 60 118 68 114 74" fill="none" stroke="{SHADE}" stroke-width="5" stroke-linecap="round" opacity=".7"/></g>
<rect x="78" y="69" width="44" height="10" rx="5" fill="{ROPE}"/>
{patch()}{bandage()}
<path d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15" fill="none" stroke="{ROPE}" stroke-width="3.4" stroke-linecap="round"/><circle cx="112" cy="76" r="4.5" fill="{ROPED}"/>
{blush}{brows}{eyes}{glasses}{mouths}{drop}
</g></g>
{fly}
<g class="bl-z" fill="{LINE}" font-family="Baloo 2, sans-serif" font-weight="800"><text x="146" y="70" font-size="18">z</text><text x="160" y="54" font-size="13">z</text></g>'''


def app_svg():
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 28 168 168" class="mascot" aria-hidden="true">\n{body()}\n</svg>'


CSS = r"""/* ---------- Mascot: bagl, a smug little money bag ---------- */
.mascot { display: block; width: 100%; height: auto; overflow: visible; }
.mascot * { transform-box: view-box; }
.mascot .bl-fly { transform-box: fill-box; transform-origin: center; opacity: 0; }
.mascot .bl-sway { transform-origin: 100px 190px; animation: bl-sway 4s ease-in-out infinite; }
.mascot .bl-bag { transform-origin: 100px 190px; }
.mascot .bl-top { transform-origin: 100px 74px; }
.mascot .bl-pile { transform-origin: 100px 46px; }
.mascot .bl-al { transform-origin: 48px 142px; }
.mascot .bl-ar { transform-origin: 152px 142px; }
.mascot .bl-eyes { transform-origin: 100px 122.5px; animation: bl-blink 4.8s infinite; }
.mascot .bl-glasses { transform-origin: 131px 120px; }
.mascot .bl-mo { transform-origin: 100px 138px; }
.mascot .bl-ex, .mascot .bl-ew, .mascot .bl-shut, .mascot .bl-sleep, .mascot .bl-b2,
.mascot .bl-mx, .mascot .bl-mo, .mascot .bl-drop, .mascot .bl-z { opacity: 0; }
@keyframes bl-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.8deg); } }
@keyframes bl-blink { 0%, 93%, 100% { transform: scaleY(1); } 95.5% { transform: scaleY(.12); } }

/* extra smug: opening line, after a refresh, when he's showing off */
[data-mood="smug"] .mascot .bl-es, [data-mood="happy"] .mascot .bl-es, [data-idle="smug"] .mascot .bl-es,
[data-mood="smug"] .mascot .bl-ms, [data-mood="happy"] .mascot .bl-ms, [data-idle="smug"] .mascot .bl-ms,
[data-mood="smug"] .mascot .bl-b1, [data-mood="happy"] .mascot .bl-b1, [data-idle="smug"] .mascot .bl-b1 { opacity: 0; }
[data-mood="smug"] .mascot .bl-ex, [data-mood="happy"] .mascot .bl-ex, [data-idle="smug"] .mascot .bl-ex,
[data-mood="smug"] .mascot .bl-mx, [data-mood="happy"] .mascot .bl-mx, [data-idle="smug"] .mascot .bl-mx,
[data-mood="smug"] .mascot .bl-b2, [data-mood="happy"] .mascot .bl-b2, [data-idle="smug"] .mascot .bl-b2 { opacity: 1; }
[data-mood="smug"] .mascot .bl-bag, [data-idle="smug"] .mascot .bl-bag { animation: bl-lean 2.6s ease-in-out; }
@keyframes bl-lean { 0%, 100% { transform: rotate(0); } 20%, 75% { transform: rotate(-4deg) scale(1.02, .99); } }

/* happy: a smug little hop and a jingle of coins */
[data-mood="happy"] .mascot .bl-bag { animation: bl-hop .62s var(--spring) 2; }
[data-mood="happy"] .mascot .bl-pile { animation: bl-jingle .31s ease-in-out 4; }
@keyframes bl-hop { 0%, 100% { transform: translateY(0) scale(1); } 15% { transform: scale(1.05, .93); } 45% { transform: translateY(-13px) scale(.97, 1.04); } }
@keyframes bl-jingle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px) rotate(3deg); } }

/* searching: eyes darting, coins rattling */
[data-mood="search"] .mascot .bl-look { animation: bl-dart .9s ease-in-out infinite; }
[data-mood="search"] .mascot .bl-pile { animation: bl-jingle .45s ease-in-out infinite; }
@keyframes bl-dart { 0%, 100% { transform: translateX(-3px); } 50% { transform: translateX(3px); } }

/* sleepy: offline / no data */
[data-mood="sleepy"] .mascot .bl-eyes { animation: none; }
[data-mood="sleepy"] .mascot .bl-look, [data-mood="sleepy"] .mascot .bl-ms, [data-mood="sleepy"] .mascot .bl-b1 { opacity: 0; }
[data-mood="sleepy"] .mascot .bl-sleep { opacity: 1; }
[data-mood="sleepy"] .mascot .bl-mo { opacity: 1; transform: scale(.7); animation: bl-snore 3.4s ease-in-out infinite; }
[data-mood="sleepy"] .mascot .bl-glasses { transform: translateY(5px) rotate(4deg); }
[data-mood="sleepy"] .mascot .bl-sway { animation: bl-doze 3.4s ease-in-out infinite; }
[data-mood="sleepy"] .mascot .bl-z { opacity: 1; animation: bl-zz 2.4s ease-in-out infinite; }
@keyframes bl-doze { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(-4.5deg) translateY(2px); } }
@keyframes bl-snore { 0%, 100% { transform: scale(.6); } 50% { transform: scale(.9, 1.1); } }
@keyframes bl-zz { 0% { opacity: 0; transform: translateY(6px); } 40% { opacity: .75; } 100% { opacity: 0; transform: translateY(-10px); } }

/* idle routines, switched on by data-idle */
[data-idle="look"] .mascot .bl-look { animation: bl-look 2.6s ease-in-out; }
@keyframes bl-look { 0%, 100% { transform: translate(0, 0); } 20%, 40% { transform: translate(-3.5px, .5px); } 60%, 85% { transform: translate(3.5px, -.5px); } }
[data-idle="jingle"] .mascot .bl-pile { animation: bl-jingle .3s ease-in-out 4; }
[data-idle="jingle"] .mascot .bl-top { animation: bl-puff 1.2s ease-in-out; }
@keyframes bl-puff { 0%, 100% { transform: scale(1); } 30% { transform: scale(1.08, 1.06) translateY(-2px); } 60% { transform: scale(.98, 1.01); } }
[data-idle="wiggle"] .mascot .bl-sway { animation: bl-wiggle 1.4s ease-in-out; }
@keyframes bl-wiggle { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(-6deg); } 45% { transform: rotate(5deg); } 70% { transform: rotate(-2.5deg); } }
[data-idle="glasses"] .mascot .bl-glasses { animation: bl-nudge 2s linear; }
@keyframes bl-nudge {
  0%, 10% { transform: translateY(0) rotate(0); animation-timing-function: ease-in; }
  35%, 55% { transform: translateY(2.6px) rotate(3.5deg); animation-timing-function: cubic-bezier(.5, 0, .2, 1); }
  66% { transform: translateY(-1.4px) rotate(-.8deg); animation-timing-function: ease-in-out; }
  74% { transform: translateY(.4px) rotate(.2deg); animation-timing-function: ease-out; }
  80%, 100% { transform: translateY(0) rotate(0); }
}

/* the big one: hiccup, gold sprays out, a coin bonks him, then he acts like he meant it */
[data-idle="spill"] .mascot .bl-bag { animation: bl-hic 3.2s ease-in-out; }
[data-idle="spill"] .mascot .bl-top { animation: bl-burst 3.2s ease-in-out; }
[data-idle="spill"] .mascot .bl-al { animation: bl-flail-l 3.2s ease-in-out; }
[data-idle="spill"] .mascot .bl-ar { animation: bl-flail-r 3.2s ease-in-out; }
[data-idle="spill"] .mascot .bl-fl { animation: bl-step-l 3.2s ease-in-out; }
[data-idle="spill"] .mascot .bl-fr { animation: bl-step-r 3.2s ease-in-out; }
[data-idle="spill"] .mascot .bl-es { animation: bl-es 3.2s steps(1); }
[data-idle="spill"] .mascot .bl-ew { animation: bl-ew 3.2s steps(1); }
[data-idle="spill"] .mascot .bl-shut { animation: bl-shut 3.2s steps(1); }
[data-idle="spill"] .mascot .bl-ms, [data-idle="spill"] .mascot .bl-b1 { animation: bl-ms 3.2s steps(1); }
[data-idle="spill"] .mascot .bl-mo { animation: bl-gasp 3.2s ease-in-out, bl-mo 3.2s steps(1); }
[data-idle="spill"] .mascot .bl-glasses { animation: bl-slip 3.2s linear; }
[data-idle="spill"] .mascot .bl-drop { animation: bl-drop 3.2s ease-out; }
[data-idle="spill"] .mascot .bl-f1 { animation: bl-f1 3.2s linear; }
[data-idle="spill"] .mascot .bl-f2 { animation: bl-f2 3.2s linear; }
[data-idle="spill"] .mascot .bl-f3 { animation: bl-f3 3.2s linear; }
[data-idle="spill"] .mascot .bl-f4 { animation: bl-f4 3.2s linear; }
@keyframes bl-hic { 0%, 18%, 44%, 100% { transform: scale(1, 1); } 24% { transform: scale(1.07, .9); } 31% { transform: scale(.95, 1.08); } 37% { transform: scale(1.02, .98); } }
@keyframes bl-burst { 0%, 22%, 46%, 100% { transform: scale(1); } 30% { transform: scale(1.14, 1.1) translateY(-3px); } }
@keyframes bl-flail-l { 0%, 22%, 70%, 100% { transform: rotate(0); } 30% { transform: rotate(58deg); } 36% { transform: rotate(38deg); } 42% { transform: rotate(62deg); } 50% { transform: rotate(30deg); } }
@keyframes bl-flail-r { 0%, 22%, 70%, 100% { transform: rotate(0); } 30% { transform: rotate(-58deg); } 36% { transform: rotate(-40deg); } 42% { transform: rotate(-64deg); } 50% { transform: rotate(-30deg); } }
@keyframes bl-step-l { 0%, 22%, 40%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
@keyframes bl-step-r { 0%, 26%, 44%, 100% { transform: translateY(0); } 34% { transform: translateY(-5px); } }
@keyframes bl-es { 0% { opacity: 1; } 24% { opacity: 0; } 72% { opacity: 1; } }
@keyframes bl-ew { 0% { opacity: 0; } 24% { opacity: 1; } 56% { opacity: 0; } }
@keyframes bl-shut { 0% { opacity: 0; } 56% { opacity: 1; } 72% { opacity: 0; } }
@keyframes bl-ms { 0% { opacity: 1; } 24% { opacity: 0; } 74% { opacity: 1; } }
@keyframes bl-mo { 0% { opacity: 0; } 24% { opacity: 1; } 74% { opacity: 0; } }
@keyframes bl-gasp { 0%, 24%, 52%, 100% { transform: scale(1); } 30% { transform: scale(1.6, 1.8); } 56% { transform: scale(.7, .5); } }
@keyframes bl-drop { 0%, 56% { opacity: 0; transform: translateY(0); } 60% { opacity: 1; } 80% { opacity: 0; transform: translateY(10px); } 100% { opacity: 0; } }
@keyframes bl-slip {
  0%, 22% { transform: translateY(0) rotate(0); animation-timing-function: ease-out; }
  26% { transform: translateY(1.6px) rotate(-1deg); animation-timing-function: ease-in-out; }
  31% { transform: translateY(-1.4px) rotate(.6deg); animation-timing-function: ease-in-out; }
  36% { transform: translateY(.4px) rotate(-.2deg); animation-timing-function: ease-out; }
  40%, 54% { transform: translateY(0) rotate(0); animation-timing-function: cubic-bezier(.2, .9, .3, 1); }
  56% { transform: translateY(4.2px) rotate(7deg); animation-timing-function: ease-in-out; }
  58.5% { transform: translateY(2.4px) rotate(4.6deg); animation-timing-function: ease-in-out; }
  61% { transform: translateY(3.6px) rotate(6.2deg); animation-timing-function: ease-in-out; }
  63%, 76% { transform: translateY(3.2px) rotate(5.6deg); animation-timing-function: cubic-bezier(.5, 0, .2, 1); }
  79.5% { transform: translateY(-1.6px) rotate(-1deg); animation-timing-function: ease-in-out; }
  82% { transform: translateY(.5px) rotate(.3deg); animation-timing-function: ease-out; }
  84%, 100% { transform: translateY(0) rotate(0); }
}
@keyframes bl-f1 { 0%, 28% { opacity: 0; transform: translate(0, 6px) scale(.5); } 30% { opacity: 1; transform: translate(0, 0) scale(1); }
  38% { transform: translate(-18px, -30px) rotate(-120deg); } 46% { transform: translate(-36px, -26px) rotate(-240deg); }
  58% { transform: translate(-54px, 146px) rotate(-420deg); } 62% { transform: translate(-58px, 138px) rotate(-450deg); }
  66%, 90% { opacity: 1; transform: translate(-61px, 146px) rotate(-480deg); } 96%, 100% { opacity: 0; transform: translate(-61px, 146px) rotate(-480deg); } }
@keyframes bl-f2 { 0%, 30% { opacity: 0; transform: translate(0, 6px) scale(.5); } 32% { opacity: 1; transform: translate(0, 0) scale(1); }
  40% { transform: translate(20px, -38px) rotate(140deg); } 48% { transform: translate(40px, -32px) rotate(260deg); }
  60% { transform: translate(58px, 146px) rotate(440deg); } 64% { transform: translate(62px, 139px) rotate(470deg); }
  68%, 90% { opacity: 1; transform: translate(65px, 146px) rotate(500deg); } 96%, 100% { opacity: 0; transform: translate(65px, 146px) rotate(500deg); } }
@keyframes bl-f3 { 0%, 30% { opacity: 0; transform: translate(0, 6px) scale(.5); } 32% { opacity: 1; transform: translate(0, 0); }
  44% { transform: translate(4px, -46px) rotate(90deg); } 54% { transform: translate(6px, -8px) rotate(180deg); }
  58% { transform: translate(6px, -12px) rotate(190deg); } 62%, 74% { opacity: 1; transform: translate(6px, -6px) rotate(200deg); }
  80% { transform: translate(28px, 30px) rotate(320deg); } 88% { transform: translate(44px, 146px) rotate(460deg); }
  90% { opacity: 1; transform: translate(46px, 142px) rotate(470deg); } 96%, 100% { opacity: 0; transform: translate(48px, 146px) rotate(480deg); } }
@keyframes bl-f4 { 0%, 32% { opacity: 0; transform: translate(0, 6px) scale(.5); } 34% { opacity: 1; transform: translate(0, 0); }
  42% { transform: translate(-8px, -24px) rotate(-90deg); } 56% { transform: translate(-34px, 147px) rotate(-300deg); }
  60% { transform: translate(-37px, 142px) rotate(-320deg); } 64%, 90% { opacity: 1; transform: translate(-40px, 147px) rotate(-340deg); }
  96%, 100% { opacity: 0; transform: translate(-40px, 147px) rotate(-340deg); } }
"""


def icon_svg(size=512, maskable=False):
    """Zoomed-in extra-smug face. The sack fabric fills the icon; the tie and coins peek over the top."""
    blush, brows, eyes, glasses, mouths, drop = face_parts()
    # show extra smug layers only
    eyes = eyes.replace('<g class="bl-es">', '<g class="bl-es" opacity="0">').replace('<g class="bl-ew">', '<g class="bl-ew" opacity="0">')
    eyes = eyes.replace('<g class="bl-shut"', '<g class="bl-shut" opacity="0"').replace('<g class="bl-sleep"', '<g class="bl-sleep" opacity="0"')
    brows = brows.replace('<g class="bl-b1">', '<g class="bl-b1" opacity="0">')
    mouths = mouths.replace('class="bl-ms"', 'class="bl-ms" opacity="0"').replace('class="bl-mo"', 'class="bl-mo" opacity="0"')
    vb = "38 62 124 124" if not maskable else "26 50 148 148"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{size}" height="{size}">
<rect x="0" y="0" width="200" height="220" fill="#2A2029"/>
<radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#3A2C38"/><stop offset="1" stop-color="#211A22"/></radialGradient>
<rect x="0" y="0" width="200" height="220" fill="url(#g)"/>
<g transform="translate(100 124) scale(1.22) translate(-100 -124)">
<path d="M82 74 C56 90 36 118 40 150 C43 178 68 190 100 190 C132 190 157 178 160 150 C164 118 144 90 118 74 Z" fill="{FILL}"/>
<path d="M128 82 C150 100 163 128 159 156 C155 176 137 188 112 190 C137 180 150 160 148 134 C146 110 139 94 128 82 Z" fill="{SHADE}" opacity=".8"/>
<path d="M56 112 Q50 126 52 142" fill="none" stroke="{LIGHT}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
<ellipse cx="100" cy="46" rx="24" ry="6.5" fill="{INNER}"/>
<g transform="translate(91 44)">{coin(7)}</g><g transform="translate(108 43)">{coin(7)}</g><g transform="translate(100 37)">{coin(7)}</g>
<path d="M76 46 Q100 58 124 46 C128 56 124 66 118 74 L82 74 C76 66 72 56 76 46 Z" fill="{FILL}"/>
<path d="M76 46 Q100 58 124 46" fill="none" stroke="{LIGHT}" stroke-width="3" stroke-linecap="round"/>
<path d="M116 52 C120 60 118 68 114 74" fill="none" stroke="{SHADE}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
<rect x="78" y="69" width="44" height="10" rx="5" fill="{ROPE}"/>
{patch()}{bandage()}
<path d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15" fill="none" stroke="{ROPE}" stroke-width="3.4" stroke-linecap="round"/><circle cx="112" cy="76" r="4.5" fill="{ROPED}"/>
{blush}{brows}{eyes}{glasses}{mouths}
</g>
</svg>'''


if __name__ == "__main__":
    out = sys.argv[1]
    open(f"{out}/mascot.svg", "w").write(app_svg())
    open(f"{out}/mascot.css", "w").write(CSS)
    open(f"{out}/icon.svg", "w").write(icon_svg())
    open(f"{out}/icon-maskable.svg", "w").write(icon_svg(maskable=True))
    print("ok")
