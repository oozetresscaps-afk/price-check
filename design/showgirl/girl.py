"""showy mascot concept: an original chibi showgirl magician in bagl's soft flat style (dot eyes, blush, no outlines)."""
SKIN = "#FCE3D2"; SKINS = "#F2CBB5"; HAIR = "#F7B6CC"; HAIRS = "#E79AB4"; HAIRL = "#FFDCE8"
COAT = "#3E3263"; COATS = "#2C2450"; SHIRT = "#FFF4EE"; BOW = "#E8668F"; GOLD = "#EDBE5A"; GOLDD = "#D29E3A"
SHORTS = "#2B2236"; NET = "#2B2236"; RED = "#D24552"; REDD = "#A9343F"; CREAM = "#F8EADA"; EYE = "#211816"; BLUSH = "#F59A9A"; MOUTH = "#E8794F"; INK = "#3B2A22"
CARDS = ["#E58C7A", "#EDBE5A", "#7FA6C9"]

DEFS = f'''<defs>
<pattern id="stripe" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="{RED}"/><rect x="4" width="4" height="8" fill="{CREAM}"/></pattern>
<pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="{RED}"/><circle cx="4.5" cy="4.5" r="1.7" fill="{CREAM}"/></pattern>
<pattern id="net" width="4.6" height="4.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<path d="M0 0 V4.6 M0 0 H4.6" stroke="{NET}" stroke-width=".85" fill="none"/></pattern></defs>'''


def card(x, y, r, color, w=16, h=22):
    return (f'<g transform="translate({x} {y}) rotate({r})"><rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" rx="2.6" fill="{color}"/>'
            f'<rect x="{-w/2+2.2}" y="{-h/2+2.4}" width="{w-4.4}" height="{h*.42}" rx="1.6" fill="#fff" opacity=".5"/>'
            f'<path d="M{-w/2+3} {h/2-6} h{w*.5} M{-w/2+3} {h/2-3.4} h{w*.35}" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g>')


def star(x, y, s=1, c=GOLD):
    return f'<path d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" transform="translate({x} {y}) scale({s})" fill="{c}"/>'


def eyes(kind, cx=100, cy=90, dx=15):
    lx, rx = cx - dx, cx + dx
    lash = (f'<path d="M{lx-4.6} {cy-3.6} l-2.8 -1.1 M{rx+4.6} {cy-3.6} l2.8 -1.1" stroke="{EYE}" stroke-width="1.8" stroke-linecap="round"/>')
    dot = lambda x: f'<ellipse cx="{x}" cy="{cy}" rx="4.6" ry="5.8" fill="{EYE}"/>'
    if kind == "dots":
        return dot(lx) + dot(rx) + lash
    if kind == "wink":
        return dot(lx) + f'<path d="M{rx-5} {cy+1} q5 -5 10 0" fill="none" stroke="{EYE}" stroke-width="2.4" stroke-linecap="round"/>' + f'<path d="M{lx-4.6} {cy-3.6} l-2.8 -1.1" stroke="{EYE}" stroke-width="1.8" stroke-linecap="round"/>'
    if kind == "smug":  # dots with a flat lid
        out = ""
        for x in (lx, rx):
            out += (f'<path d="M{x-4.4} {cy-1.6} L{x+4.4} {cy-2.2} A4.6 5.8 0 0 1 {x} {cy+5.8} A4.6 5.8 0 0 1 {x-4.4} {cy-1.6} Z" fill="{EYE}"/>')
        return out + lash
    return ""


def face(eye="dots", mouth="smirk", cx=100, cy=90):
    m = {
        "smirk": f'<path d="M{cx-4} {cy+15} q4.5 2.6 8 -1 q1 -1 1.6 -2.6" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>',
        "o": f'<ellipse cx="{cx}" cy="{cy+15}" rx="3" ry="3.6" fill="{MOUTH}"/>',
        "grin": f'<path d="M{cx-6} {cy+13} q6 6 12 0 Z" fill="{MOUTH}"/>',
    }[mouth]
    return (f'<ellipse cx="{cx-23}" cy="{cy+9}" rx="7" ry="4.3" fill="{BLUSH}" opacity=".8"/>'
            f'<ellipse cx="{cx+23}" cy="{cy+9}" rx="7" ry="4.3" fill="{BLUSH}" opacity=".8"/>'
            + eyes(eye, cx, cy) + m)


def tophat(x, y, r, s=1):
    return (f'<g transform="translate({x} {y}) rotate({r}) scale({s})">'
            f'<ellipse cx="0" cy="0" rx="21" ry="5" fill="{REDD}"/>'
            f'<path d="M-12 0 L-11 -24 Q0 -27 11 -24 L12 0 Z" fill="{RED}"/>'
            f'<path d="M-11.7 -7 L11.7 -7 L12 -2 L-12 -2 Z" fill="{GOLD}"/>'
            f'<path d="M-3 -8 l3 -6 l3 6 Z" fill="{CREAM}" opacity=".0"/>'
            f'<path d="M-7 -21 Q-6 -14 -6.5 -10" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/></g>')


def _shoe_front():  # front-facing pumps with a strap, little heels peeking out the sides
    out = ""
    for x, hx in ((82, 82.5), (104, 114.5)):
        out += (f'<path d="M{hx} 197 h3 l-.4 11 h-2.2 Z" fill="{REDD}"/>'
                f'<path d="M{x-1.5} 190 h17 v5 q0 6 -3 9.5 q-2.5 3 -5.5 3 q-3 0 -5.5 -3 q-3 -3.5 -3 -9.5 Z" fill="{RED}"/>'
                f'<path d="M{x-1.5} 193.5 h17" stroke="{REDD}" stroke-width="2.2"/><circle cx="{x+7}" cy="193.5" r="2" fill="{GOLD}"/>'
                f'<path d="M{x+2.5} 198 q1 4 4 6" stroke="#fff" stroke-width="1.4" fill="none" opacity=".35" stroke-linecap="round"/>')
    return out


def _shoe_profile():  # both feet turned the same way, classic pump silhouette
    out = ""
    for x in (82, 104):
        out += (f'<path d="M{x} 189 L{x+14} 189 L{x+15} 195 Q{x+24} 198 {x+26.5} 203.5 Q{x+27} 207 {x+22.5} 207 L{x+12} 207 '
                f'Q{x+8} 203.5 {x+4.4} 202.5 L{x+3.4} 208 L{x+.8} 208 L{x-.6} 199 Z" fill="{RED}"/>'
                f'<path d="M{x+1} 193 L{x+14.5} 193" stroke="{REDD}" stroke-width="2"/><circle cx="{x+8}" cy="193" r="1.8" fill="{GOLD}"/>')
    return out


SHOES = {"front": _shoe_front, "profile": _shoe_profile}
SHOE = "profile"


def body(arm_l, arm_r, extras_back="", extras_front=""):
    """chibi showgirl: ruff collar + bow, striped bodice with gold lacing, puffed sleeves, polka-dot tutu, fishnet tights, heels."""
    legs = "".join(
        f'<path d="M{x} 168 h14 v24 h-14 Z" fill="{SKIN}"/><path d="M{x} 168 h14 v24 h-14 Z" fill="url(#net)"/>'
        for x in (82, 104))
    shoes = SHOES[SHOE]()
    skirt = (f'<path d="M80 146 Q100 151 120 146 L145 170 Q100 182 55 170 Z" fill="url(#dots)"/>'
             + "".join(f'<circle cx="{x:.1f}" cy="{170 + 6 * (1 - ((x - 100) / 45) ** 2):.1f}" r="4.6" fill="{CREAM}"/>' for x in [57 + i * 8.6 for i in range(11)])
             + f'<path d="M80 146 Q100 151 120 146" stroke="{GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    bodice = (f'<path d="M78 120 Q100 116 122 120 L119 148 Q100 152 81 148 Z" fill="url(#stripe)"/>'
              f'<path d="M78 120 Q100 116 122 120 L119 148 Q100 152 81 148 Z" fill="none" stroke="{REDD}" stroke-width="1.6" opacity=".6"/>'
              f'<path d="M97 125 L103 129 L97 133 L103 137 L97 141 L103 145" stroke="{GOLD}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>'
              + "".join(f'<circle cx="{x}" cy="{y}" r="1.2" fill="{GOLD}"/>' for x, y in [(97, 125), (103, 129), (97, 133), (103, 137), (97, 141), (103, 145)]))
    def arm(a):
        d, hx, hy = a
        return (f'<path d="{d}" fill="none" stroke="{SKIN}" stroke-width="8.5" stroke-linecap="round"/>'
                f'<circle cx="{hx}" cy="{hy}" r="5.8" fill="{CREAM}"/>')
    sleeves = (f'<circle cx="76" cy="124" r="9" fill="url(#stripe)"/><circle cx="124" cy="124" r="9" fill="url(#stripe)"/>'
               f'<path d="M68 129 Q76 134 84 129 M116 129 Q124 134 132 129" stroke="{GOLD}" stroke-width="2" fill="none" stroke-linecap="round"/>')
    return extras_back + legs + shoes + skirt + bodice + arm(arm_l) + arm(arm_r) + sleeves + extras_front


def ruff():
    # frilly collar and bow tie, drawn over the chin so it reads at chibi size
    return ("".join(f'<circle cx="{84 + i * 5.3:.1f}" cy="{121.5 + 1.3 * abs(i - 3):.1f}" r="4.4" fill="{CREAM}"/>' for i in range(7))
            + f'<path d="M100 123 L90.5 118 Q88.5 123 90.5 128 Z M100 123 L109.5 118 Q111.5 123 109.5 128 Z" fill="{RED}"/><circle cx="100" cy="123" r="2.7" fill="{REDD}"/>')


def head(back_hair, front_hair, eye, mouth, hat="", tilt=0, over=""):
    return (f'<g transform="rotate({tilt} 100 112)">{back_hair}'
            f'<ellipse cx="100" cy="80" rx="44" ry="41" fill="{SKIN}"/>'
            f'{face(eye, mouth)}{front_hair}{hat}</g>{ruff()}{over}')


BANGS = (f'<path d="M56 90 C53 50 78 31 102 31 C128 31 149 52 145 90 L140 73 L135 82 L129 62 L121 78 L113 58 L105 76 L97 56 L89 75 L81 60 L75 80 L67 66 L62 84 Z" fill="{HAIR}"/>'
         f'<path d="M59 74 Q49 100 55 128 Q63 118 67 98 Q68 84 64 76 Z" fill="{HAIR}"/>'
         f'<path d="M141 74 Q151 100 145 128 Q137 118 133 98 Q132 84 136 76 Z" fill="{HAIR}"/>'
         f'<path d="M74 44 Q90 35 108 37" stroke="{HAIRL}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>'
         f'<path d="M126 44 Q132 48 136 54" stroke="{HAIRL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')

BOB_BACK = (f'<path d="M51 86 C47 42 78 24 102 24 C128 24 155 44 151 88 C150 104 147 116 139 123 Q131 128 127 119 L73 119 Q69 128 61 123 C53 116 50 104 51 86 Z" fill="{HAIRS}"/>')
BOB_FRONT = (f'<path d="M55 90 C52 50 78 31 102 31 C128 31 150 52 146 90 L141 74 L135 82 L129 63 L121 79 L113 59 L105 77 L97 57 L89 76 L81 61 L75 81 L67 67 L61 84 Z" fill="{HAIR}"/>'
             f'<path d="M58 74 Q47 104 57 121 Q65 127 71 119 Q63 104 65 82 Z" fill="{HAIR}"/>'
             f'<path d="M142 74 Q153 104 143 121 Q135 127 129 119 Q137 104 135 82 Z" fill="{HAIR}"/>'
             f'<path d="M73 44 Q90 35 108 37" stroke="{HAIRL}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>'
             f'<path d="M127 44 Q133 48 137 54" stroke="{HAIRL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>'
             + star(132, 62, .75))

# --- option 1: messy bob with a side ponytail, wand up, cards fanned: "ta-da!" ---
def opt1():
    back = (f'<path d="M54 82 C50 40 80 24 104 25 C134 27 154 50 148 92 C146 108 140 118 131 123 L69 123 C60 117 55 101 54 82 Z" fill="{HAIRS}"/>'
            f'<path d="M141 64 C164 62 174 92 167 120 C163 130 152 132 150 125 C158 108 156 88 143 80 Z" fill="{HAIR}"/>'
            f'<circle cx="145" cy="67" r="5" fill="{GOLD}"/>')
    back = BOB_BACK
    hat = tophat(76, 36, -24, .95)
    wand = (f'<path d="M151 92 L170 58" stroke="{SHORTS}" stroke-width="4.4" stroke-linecap="round"/>'
            f'<path d="M166 65 L170 58" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/>'
            + star(174, 50, .9) + star(160, 44, .5, "#fff") + star(184, 64, .45))
    fan = card(40, 140, -28, CARDS[0]) + card(46, 136, -8, CARDS[1]) + card(53, 137, 14, CARDS[2])
    b = body(("M72 128 Q58 136 50 146", 50, 146), ("M128 126 Q146 116 151 94", 151, 92), extras_front=wand + fan)
    return b + head(back, BOB_FRONT, "wink", "grin", hat, tilt=-3)

# --- option 2: space buns, tipping her top hat, smug ---
def opt2():
    back = (f'<path d="M56 84 C52 44 80 26 104 27 C132 28 152 50 147 90 C145 104 140 112 134 116 L66 116 C59 110 57 98 56 84 Z" fill="{HAIRS}"/>'
            f'<circle cx="62" cy="40" r="17" fill="{HAIR}"/><circle cx="138" cy="40" r="17" fill="{HAIR}"/>'
            f'<path d="M54 34 Q60 26 70 28 M130 28 Q140 26 146 34" stroke="{HAIRL}" stroke-width="3" fill="none" stroke-linecap="round"/>'
            f'<path d="M58 96 Q50 118 56 132 M142 96 Q150 118 144 132" stroke="{HAIR}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    back = BOB_BACK
    hat = tophat(118, 30, 18, .9)
    sparkle = star(150, 18, .55) + star(162, 34, .35, "#fff")
    b = body(("M72 128 Q64 138 78 146", 79, 146), ("M126 124 Q126 124 126 124", 126, 124))
    sleeve = (f'<path d="M130 124 Q166 98 143 44" fill="none" stroke="{SKIN}" stroke-width="8.5" stroke-linecap="round"/>'
              f'<circle cx="124" cy="124" r="9" fill="url(#stripe)"/><circle cx="141" cy="40" r="6.2" fill="{CREAM}"/>')
    return b + head(back, BOB_FRONT.replace(star(132, 62, .75), star(70, 62, .75)), "smug", "smirk", hat + sparkle, tilt=4, over=sleeve)

# --- option 3: long wavy hair with a big bow, springing cards hand to hand ---
def opt3():
    back = (f'<path d="M52 84 C48 40 80 24 104 25 C134 26 156 52 150 92 C156 120 160 146 150 160 C142 150 146 132 138 122 L62 122 '
            f'C54 132 58 150 50 160 C40 146 44 120 52 84 Z" fill="{HAIRS}"/>'
            f'<path d="M60 130 Q52 146 56 158 M142 130 Q150 146 146 158" stroke="{HAIR}" stroke-width="6" fill="none" stroke-linecap="round"/>')
    bow = (f'<g transform="translate(132 40) rotate(16)"><path d="M0 0 L-16 -10 Q-19 0 -16 10 Z M0 0 L16 -10 Q19 0 16 10 Z" fill="{BOW}"/>'
           f'<circle r="4.2" fill="#C9507A"/></g>')
    back = BOB_BACK
    hat = tophat(78, 36, -18, .8)
    arc = "".join(card(40 + i * 15, 146 - 18 * (1 - ((i - 4) / 4) ** 2), -44 + i * 11, CARDS[i % 3], 12, 17) for i in range(9))
    b = body(("M72 128 Q54 136 40 146", 40, 146), ("M128 128 Q146 136 160 146", 160, 146))
    return b + head(back, BOB_FRONT, "dots", "o", hat, tilt=0, over=arc)


def svg(inner):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 6 160 210">{DEFS}{inner}</svg>'


if __name__ == "__main__":
    opts = [(opt1, "1  Ta-da: wand up, cards fanned, wink"), (opt2, "2  Tipping her top hat, smug"), (opt3, "3  Springing cards hand to hand")]
    cells = "".join(f'<figure><div class="bg">{svg(fn())}</div><figcaption>{t}</figcaption></figure>' for fn, t in opts)
    open("girl.html", "w").write(f'''<html><head><style>
body{{margin:0;font:600 15px system-ui;background:#fff}}
figure{{margin:0}} .bg{{width:280px;height:340px;border-radius:26px;display:grid;place-items:center;overflow:hidden;background:#1E1720}}
.bg svg{{width:250px;height:328px}}
figcaption{{padding:8px 4px;color:#333}} .grid{{display:grid;grid-template-columns:repeat(3,280px);gap:16px;padding:16px}}
</style></head><body><div class="grid">{cells}</div></body></html>''')
    print("ok")
