LINE = "#3B2A22"; BLUSH = "#F2906F"; MOUTH = "#E8794F"
GOLD = "#EDBE5A"; GOLDD = "#D29E3A"; GOLDL = "#F7DC8E"; CREAM = "#F7E8D0"; RED = "#D9474B"

VARIANTS = {
    "burlap": dict(fill="#E7C79A", shade="#D3AD7C", light="#F3DDB8", inner="#8E6A4F",
                   rope="#A07A62", roped="#86634F", foot="#D3AD7C", extra="card"),
    "velvet": dict(fill="#C9575B", shade="#A9444C", light="#DE7C7A", inner="#6E2E36",
                   rope=GOLD, roped=GOLDD, foot="#A9444C", extra="tassels"),
    "patched": dict(fill="#EBD9BC", shade="#D9C29E", light="#F6EBD6", inner="#8E6A4F",
                    rope="#9DB27E", roped="#7F9662", foot="#D9C29E", extra="patch"),
}


def coin(r=7, cls=""):
    return (f'<g class="{cls}"><circle r="{r}" fill="{GOLD}"/>'
            f'<circle r="{r-2.6}" fill="none" stroke="{GOLDD}" stroke-width="1.6"/>'
            f'<circle cx="{-r*.35}" cy="{-r*.35}" r="{r*.2}" fill="#fff" opacity=".8"/></g>')


def face(v, expr="o"):
    """expr: 'o' = default (slightly smug), 'smug' = extra smug, used with the opening line."""
    cy = 122; lx, rx = 86, 114; r = 11.5
    tilt = ' transform="rotate(5 100 120)"' if v == "patched" else ""
    EYE = "#211816"; RX, RY, ecy = 6, 7.4, cy + 0.5
    def lidded(x, cut):  # dot eye with a flat top lid, cut = how far below the top the lid sits
        top = ecy - RY + cut; dy = top - ecy; hw = RX * (1 - (dy / RY) ** 2) ** .5
        return f'<path d="M{x-hw:.2f} {top:.2f} L{x+hw:.2f} {top:.2f} A{RX} {RY} 0 1 1 {x-hw:.2f} {top:.2f} Z" fill="{EYE}"/>'
    wide = lambda x: f'<ellipse cx="{x}" cy="{ecy}" rx="{RX}" ry="{RY}" fill="{EYE}"/>'
    stroke = f'fill="none" stroke="{LINE}" stroke-linecap="round"'
    if expr == "smug":
        cut, dx = 5.6, 1.4
        smirk = f'<path class="ms" d="M92.5 {cy+17} q7.5 3.2 12 -1.6 q1.6 -1.6 2.6 -4" {stroke} stroke-width="2.2"/>'
        brows = (f'<path d="M{lx-6} {cy-15} l11 1.8" {stroke} stroke-width="2" opacity=".8"/>'
                 f'<path d="M{rx-6} {cy-15.5} q6 -5 12 -1" {stroke} stroke-width="2" opacity=".8"/>')
    else:
        cut, dx = 3.6, 0.8
        smirk = f'<path class="ms" d="M94.5 {cy+17} q5.5 2.6 9.5 -1 q1.2 -1.1 1.9 -2.8" {stroke} stroke-width="2.1"/>'
        brows = f'<path d="M{rx-5} {cy-15} q5 -3 10 -0.5" {stroke} stroke-width="1.8" opacity=".55"/>'
    return f'''
  <ellipse cx="68" cy="{cy+11}" rx="7" ry="4.2" fill="{BLUSH}" opacity=".8"/>
  <ellipse cx="132" cy="{cy+11}" rx="7" ry="4.2" fill="{BLUSH}" opacity=".8"/>
  <g class="brows">{brows}</g>
  <g class="eyes"><g class="es">{lidded(lx+dx, cut)}{lidded(rx+dx, cut)}</g><g class="ew">{wide(lx)}{wide(rx)}</g></g>
  <g class="shut" fill="none" stroke="{LINE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M{lx-4} {cy-5} L{lx+3} {cy} L{lx-4} {cy+5}"/><path d="M{rx+4} {cy-5} L{rx-3} {cy} L{rx+4} {cy+5}"/></g>
  <g{tilt}><g class="glasses"><g fill="none" stroke="{LINE}" stroke-width="1.8">
    <circle cx="{lx}" cy="{cy}" r="{r}"/><circle cx="{rx}" cy="{cy}" r="{r}"/>
    <path d="M{lx+r} {cy-1} q{(rx-lx-2*r)/2} -3 {rx-lx-2*r} 0"/><path d="M{lx-r} {cy-2} l-6 -1.5"/><path d="M{rx+r} {cy-2} l6 -1.5"/></g></g></g>
  {smirk}
  <ellipse class="mouth" cx="100" cy="{cy+16}" rx="2.6" ry="3" fill="{MOUTH}"/>
  <path class="drop" d="M138 96 q5 7 0 10 q-5 -3 0 -10 Z" fill="#9FC3E0"/>'''



import math
def e_path(cx, cy, R):
    a = math.radians(38)
    return f"M{cx-R:.2f} {cy:.2f} L{cx+R:.2f} {cy:.2f} A{R} {R} 0 1 0 {cx+R*math.cos(a):.2f} {cy+R*math.sin(a):.2f}"

def sq_patch(fill, ecol, stitch):
    return (f'<g transform="rotate(-8 136 156)"><rect x="124" y="144" width="24" height="24" rx="4" fill="{fill}"/>'
            f'<rect x="126.5" y="146.5" width="19" height="19" rx="3" fill="none" stroke="{stitch}" stroke-width="1.3" stroke-dasharray="2.5 2"/>'
            f'<path d="{e_path(136, 156.3, 4.4)}" fill="none" stroke="{ecol}" stroke-width="2.4" stroke-linecap="round"/></g>')

MARKS = {
    "purple": lambda: sq_patch("#B59AC4", CREAM, CREAM),
    "sage": lambda: sq_patch("#9DB27E", CREAM, CREAM),
    "round": lambda: (f'<g transform="rotate(-10 136 157)"><circle cx="136" cy="157" r="12.5" fill="#E58C7A"/>'
                      f'<circle cx="136" cy="157" r="10" fill="none" stroke="{CREAM}" stroke-width="1.3" stroke-dasharray="2.4 2"/>'
                      f'<path d="{e_path(136, 157, 4.4)}" fill="none" stroke="{CREAM}" stroke-width="2.4" stroke-linecap="round"/></g>'),
    "light": lambda: (f'<path d="{e_path(100, 161.5, 6.8)}" fill="none" stroke="#FBF4E6" stroke-width="4" stroke-linecap="round"/>'),
    "gold": lambda: (f'<path d="{e_path(100, 161.5, 6.8)}" fill="none" stroke="{GOLDD}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3.2 2.2" opacity=".95"/>'
                     f'<path d="M113 152 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 Z" fill="{GOLD}"/>'),
    "stamp": lambda: (f'<g transform="rotate(-9 100 161)" opacity=".5">'
                      f'<circle cx="100" cy="161" r="11.5" fill="none" stroke="#8E6A4F" stroke-width="1.8" stroke-dasharray="9 1.6 14 2.2 6 1.4"/>'
                      f'<path d="{e_path(100, 161, 5.6)}" fill="none" stroke="#8E6A4F" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="11 1.4 30"/></g>'),
}

def bag(v, expr="o", mark="purple"):
    c = VARIANTS[v]
    extra_back = extra_front = ""
    if c["extra"] == "card":
        extra_back = (f'<g class="peek"><g transform="rotate(14 112 34)"><rect x="104" y="20" width="17" height="24" rx="2.5" fill="{RED}"/>'
                      f'<rect x="107" y="23" width="11" height="9" rx="1.5" fill="#BFD8D2"/>'
                      f'<path d="M108 36 h9 M108 39 h6" stroke="{CREAM}" stroke-width="1.4" stroke-linecap="round"/></g></g>')
    if c["extra"] == "tassels":
        extra_front = (f'<path d="M100 78 q-10 8 -12 18 M100 78 q10 8 13 17" fill="none" stroke="{c["rope"]}" stroke-width="2.4" stroke-linecap="round"/>'
                       f'<path d="M84 94 l4 -2 l4 2 l-1 9 h-6 Z" fill="{c["rope"]}"/><path d="M109 93 l4 -2 l4 2 l-1 9 h-6 Z" fill="{c["rope"]}"/>'
                       f'<circle cx="100" cy="76" r="4.5" fill="{c["roped"]}"/>')
    elif c["extra"] == "patch":
        extra_front = (MARKS[mark]()
                       +                        f'<g transform="rotate(-20 64 106)"><rect x="56" y="102" width="16" height="7" rx="3.5" fill="#F2C9A8"/>'
                       f'<rect x="61" y="102" width="6" height="7" fill="#E9B48F"/></g>'
                       f'<path d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15" fill="none" stroke="{c["rope"]}" stroke-width="3.4" stroke-linecap="round"/>'
                       f'<circle cx="112" cy="76" r="4.5" fill="{c["roped"]}"/>')
    else:
        extra_front = (f'<path d="M112 78 q-4 9 -10 13 M112 78 q6 8 4 15" fill="none" stroke="{c["rope"]}" stroke-width="3.4" stroke-linecap="round"/>'
                       f'<circle cx="112" cy="76" r="4.5" fill="{c["roped"]}"/>')

    stitches = (f'<path d="M58 172 Q100 188 142 172" fill="none" stroke="{c["shade"]}" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round"/>'
                if v != "velvet" else
                f'<path d="M60 170 Q100 186 140 170" fill="none" stroke="{GOLD}" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round" opacity=".9"/>')

    flying = "".join(
        f'<g transform="translate(100 42)">{coin(r, "fly f" + str(i))}</g>'
        for i, r in [(1, 7), (2, 7), (3, 6.5), (4, 5.5)])

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="bagsvg">
<ellipse cx="100" cy="194" rx="46" ry="4" fill="#000" opacity=".06"/>
<g class="foot fl"><ellipse cx="84" cy="191" rx="10" ry="5.5" fill="{c["foot"]}"/></g>
<g class="foot fr"><ellipse cx="116" cy="191" rx="10" ry="5.5" fill="{c["foot"]}"/></g>
<g class="sway"><g class="bag">
  <g class="arm al"><path d="M48 142 Q36 148 34 158" fill="none" stroke="{c["shade"]}" stroke-width="10" stroke-linecap="round"/></g>
  <g class="arm ar"><path d="M152 142 Q164 148 166 158" fill="none" stroke="{c["shade"]}" stroke-width="10" stroke-linecap="round"/></g>
  <path d="M82 74 C56 90 36 118 40 150 C43 178 68 190 100 190 C132 190 157 178 160 150 C164 118 144 90 118 74 Z" fill="{c["fill"]}"/>
  <path d="M128 82 C150 100 163 128 159 156 C155 176 137 188 112 190 C137 180 150 160 148 134 C146 110 139 94 128 82 Z" fill="{c["shade"]}" opacity=".8"/>
  <path d="M56 112 Q50 126 52 142" fill="none" stroke="{c["light"]}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
  {stitches}
  <g class="top">
    <ellipse cx="100" cy="46" rx="24" ry="6.5" fill="{c["inner"]}"/>
    {extra_back}
    <g class="pile"><g transform="translate(91 44)">{coin(7)}</g><g transform="translate(108 43)">{coin(7)}</g><g transform="translate(100 37)">{coin(7)}</g></g>
    <path d="M76 46 Q100 58 124 46 C128 56 124 66 118 74 L82 74 C76 66 72 56 76 46 Z" fill="{c["fill"]}"/>
    <path d="M76 46 Q100 58 124 46" fill="none" stroke="{c["light"]}" stroke-width="3" stroke-linecap="round"/>
    <path d="M116 52 C120 60 118 68 114 74" fill="none" stroke="{c["shade"]}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  </g>
  <rect x="78" y="69" width="44" height="10" rx="5" fill="{c["rope"]}"/>
  {extra_front}
  {face(v, expr)}
</g></g>
{flying}
</svg>'''


CSS = """
.bagsvg *{transform-box:view-box}
.bagsvg .fly *{transform-box:initial}
.sway{transform-origin:100px 190px;animation:sway 3.2s ease-in-out infinite}
.bag{transform-origin:100px 190px;animation:hic 3.2s ease-in-out infinite}
.top{transform-origin:100px 74px;animation:puff 3.2s ease-in-out infinite}
.peek{animation:peek 3.2s ease-in-out infinite}
.al{transform-origin:48px 142px;animation:flail-l 3.2s ease-in-out infinite}
.ar{transform-origin:152px 142px;animation:flail-r 3.2s ease-in-out infinite}
.fl{animation:hop-l 3.2s ease-in-out infinite}
.fr{animation:hop-r 3.2s ease-in-out infinite}
.eyes{transform-origin:100px 122.5px;animation:eyes 3.2s linear infinite}
.shut{opacity:0;animation:shut 3.2s steps(1) infinite}
.still *{animation:none!important}
.glasses{transform-origin:131px 120px;animation:slip 3.2s linear infinite}
.mouth{opacity:0;transform-origin:100px 138px;animation:gasp 3.2s ease-in-out infinite,mo 3.2s steps(1) infinite}
.ms{animation:ms 3.2s steps(1) infinite}
.ew{opacity:0;animation:ew 3.2s steps(1) infinite}
.es{animation:es 3.2s steps(1) infinite}
.brows{animation:ms 3.2s steps(1) infinite}
.still .mouth,.still .ew{opacity:0}
.drop{opacity:0;animation:drop 3.2s ease-out infinite}
.fly{opacity:0;transform-box:fill-box;transform-origin:center}
.f1{animation:f1 3.2s linear infinite}
.f2{animation:f2 3.2s linear infinite}
.f3{animation:f3 3.2s linear infinite}
.f4{animation:f4 3.2s linear infinite}

@keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}
@keyframes hic{0%,18%,44%,100%{transform:scale(1,1)}24%{transform:scale(1.07,.9)}31%{transform:scale(.95,1.08)}37%{transform:scale(1.02,.98)}}
@keyframes puff{0%,22%,46%,100%{transform:scale(1)}30%{transform:scale(1.14,1.1) translateY(-3px)}}
@keyframes peek{0%,24%,52%,100%{transform:translateY(0)}32%{transform:translateY(-9px) rotate(-6deg)}40%{transform:translateY(-6px)}}
@keyframes flail-l{0%,22%,70%,100%{transform:rotate(0)}30%{transform:rotate(58deg)}36%{transform:rotate(38deg)}42%{transform:rotate(62deg)}50%{transform:rotate(30deg)}}
@keyframes flail-r{0%,22%,70%,100%{transform:rotate(0)}30%{transform:rotate(-58deg)}36%{transform:rotate(-40deg)}42%{transform:rotate(-64deg)}50%{transform:rotate(-30deg)}}
@keyframes hop-l{0%,22%,40%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
@keyframes hop-r{0%,26%,44%,100%{transform:translateY(0)}34%{transform:translateY(-5px)}}
@keyframes eyes{0%,7%{transform:scaleY(1);opacity:1}8.5%{transform:scaleY(.12);opacity:1}10%,55.9%{transform:scaleY(1);opacity:1}56%,71.9%{transform:scaleY(1);opacity:0}72%,100%{transform:scaleY(1);opacity:1}}
@keyframes shut{0%{opacity:0}56%{opacity:1}72%{opacity:0}}
@keyframes slip{
 0%,22%{transform:translateY(0) rotate(0);animation-timing-function:ease-out}
 26%{transform:translateY(1.6px) rotate(-1deg);animation-timing-function:ease-in-out}
 31%{transform:translateY(-1.4px) rotate(.6deg);animation-timing-function:ease-in-out}
 36%{transform:translateY(.4px) rotate(-.2deg);animation-timing-function:ease-out}
 40%,54%{transform:translateY(0) rotate(0);animation-timing-function:cubic-bezier(.2,.9,.3,1)}
 56%{transform:translateY(4.2px) rotate(7deg);animation-timing-function:ease-in-out}
 58.5%{transform:translateY(2.4px) rotate(4.6deg);animation-timing-function:ease-in-out}
 61%{transform:translateY(3.6px) rotate(6.2deg);animation-timing-function:ease-in-out}
 63%,76%{transform:translateY(3.2px) rotate(5.6deg);animation-timing-function:cubic-bezier(.5,0,.2,1)}
 79.5%{transform:translateY(-1.6px) rotate(-1deg);animation-timing-function:ease-in-out}
 82%{transform:translateY(.5px) rotate(.3deg);animation-timing-function:ease-out}
 84%,100%{transform:translateY(0) rotate(0)}}
@keyframes mo{0%{opacity:0}24%{opacity:1}74%{opacity:0}}
@keyframes ms{0%{opacity:1}24%{opacity:0}74%{opacity:1}}
@keyframes ew{0%{opacity:0}24%{opacity:1}56%{opacity:0}}
@keyframes es{0%{opacity:1}24%{opacity:0}72%{opacity:1}}
@keyframes gasp{0%,24%,52%,100%{transform:scale(1)}30%{transform:scale(1.6,1.8)}56%{transform:scale(.7,.5)}}
@keyframes drop{0%,56%{opacity:0;transform:translateY(0)}60%{opacity:1}80%{opacity:0;transform:translateY(10px)}100%{opacity:0}}

@keyframes f1{0%,28%{opacity:0;transform:translate(0,6px) scale(.5)}
 30%{opacity:1;transform:translate(0,0) scale(1)}
 38%{transform:translate(-18px,-30px) rotate(-120deg)}
 46%{transform:translate(-36px,-26px) rotate(-240deg)}
 58%{transform:translate(-54px,146px) rotate(-420deg)}
 62%{transform:translate(-58px,138px) rotate(-450deg)}
 66%,90%{opacity:1;transform:translate(-61px,146px) rotate(-480deg)}
 96%,100%{opacity:0;transform:translate(-61px,146px) rotate(-480deg)}}
@keyframes f2{0%,30%{opacity:0;transform:translate(0,6px) scale(.5)}
 32%{opacity:1;transform:translate(0,0) scale(1)}
 40%{transform:translate(20px,-38px) rotate(140deg)}
 48%{transform:translate(40px,-32px) rotate(260deg)}
 60%{transform:translate(58px,146px) rotate(440deg)}
 64%{transform:translate(62px,139px) rotate(470deg)}
 68%,90%{opacity:1;transform:translate(65px,146px) rotate(500deg)}
 96%,100%{opacity:0;transform:translate(65px,146px) rotate(500deg)}}
@keyframes f3{0%,30%{opacity:0;transform:translate(0,6px) scale(.5)}
 32%{opacity:1;transform:translate(0,0)}
 44%{transform:translate(4px,-46px) rotate(90deg)}
 54%{transform:translate(6px,-8px) rotate(180deg)}
 58%{transform:translate(6px,-12px) rotate(190deg)}
 62%,74%{opacity:1;transform:translate(6px,-6px) rotate(200deg)}
 80%{transform:translate(28px,30px) rotate(320deg)}
 88%{transform:translate(44px,146px) rotate(460deg)}
 90%{opacity:1;transform:translate(46px,142px) rotate(470deg)}
 96%,100%{opacity:0;transform:translate(48px,146px) rotate(480deg)}}
@keyframes f4{0%,32%{opacity:0;transform:translate(0,6px) scale(.5)}
 34%{opacity:1;transform:translate(0,0)}
 42%{transform:translate(-8px,-24px) rotate(-90deg)}
 56%{transform:translate(-34px,147px) rotate(-300deg)}
 60%{transform:translate(-37px,142px) rotate(-320deg)}
 64%,90%{opacity:1;transform:translate(-40px,147px) rotate(-340deg)}
 96%,100%{opacity:0;transform:translate(-40px,147px) rotate(-340deg)}}
"""

TAKES = [("purple", "1  Current: purple patch"), ("sage", "2  Sage patch, matches his tie"),
         ("round", "3  Round coral patch"), ("light", "4  Light e under his mouth"),
         ("gold", "5  Gold-thread stitched e"), ("stamp", "6  Faded ink stamp, like a flour sack")]
cells = "".join(f'<figure><div class="bg still" style="background:#FBF5EC">{bag("patched", "o", m)}</div><figcaption>{t}</figcaption></figure>' for m, t in TAKES)
open("pt.html", "w").write(f'''<html><head><style>
body{{margin:0;font:600 15px system-ui;background:#fff}}
figure{{margin:0}} .bg{{width:280px;height:280px;border-radius:26px;display:grid;place-items:center;overflow:hidden}}
.bg svg{{width:256px;height:256px;overflow:visible}}
figcaption{{padding:8px 4px;color:#333}} .grid{{display:grid;grid-template-columns:repeat(3,280px);gap:16px;padding:16px}}
{CSS}</style></head><body><div class="grid">{cells}</div></body></html>''')
print("written")
