#!/usr/bin/env python3
"""Generate the Vertical Rectangle SVG sprite: logo variants + Rect, the mascot.

Every shape is styled through CSS custom properties set on the <use> host, so one
drawing renders as Memphis (Dawn fills + ink outline), silhouette, or 1-bit line art.

  --logo-ring  --logo-disc  --logo-rect   logo colors
  --logo-ink                              outline-logo stroke
  --r-body   Rect body fill               --r-ink   outlines + limbs
  --r-a1/2/3 accessory fills              --r-hi    cord, iPod (stays light in silhouette)
  --r-suit   Horizontal Rectangle's suit (falls back to --r-body)
"""
from pathlib import Path

INK = "stroke:var(--r-ink);stroke-linejoin:round;stroke-linecap:round"


def body(x=80, y=60, w=40, h=80, fill="var(--r-body)"):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" style="fill:{fill};{INK};stroke-width:3.5"/>'


def limb(d, w=6):
    return f'<path d="{d}" style="fill:none;{INK};stroke-width:{w}"/>'


def hand(cx, cy, r=6):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" style="fill:var(--r-ink)"/>'


def shape(tag, attrs, fill, sw=3):
    a = " ".join(f'{k}="{v}"' for k, v in attrs.items())
    return f'<{tag} {a} style="fill:{fill};{INK};stroke-width:{sw}"/>'


def line(d, color="var(--r-ink)", w=3):
    return f'<path d="{d}" style="fill:none;stroke:{color};stroke-width:{w};stroke-linecap:round;stroke-linejoin:round"/>'


# Chunky Memphis sneakers; left toe points left, right toe points right.
SHOE_L = lambda x: shape("path", {"d": f"M{x+16} 216 H{x-16} C{x-16} 206 {x-8} 202 {x+2} 202 C{x+10} 202 {x+16} 206 {x+16} 216 Z"}, "var(--r-a2)")
SHOE_R = lambda x: shape("path", {"d": f"M{x-16} 216 H{x+16} C{x+16} 206 {x+8} 202 {x-2} 202 C{x-10} 202 {x-16} 206 {x-16} 216 Z"}, "var(--r-a2)")


def legs(lx_end=84, rx_end=120):
    return [
        limb(f"M92 140 C 91 165, {lx_end+3} 185, {lx_end} 204"),
        limb(f"M108 140 C 109 165, {rx_end-3} 185, {rx_end} 204"),
        SHOE_L(lx_end - 2),
        SHOE_R(rx_end + 2),
    ]


def cup(x, y):
    """Paper coffee cup, top-left of lid at (x, y)."""
    return [
        shape("path", {"d": f"M{x+2} {y+5} L{x+24} {y+5} L{x+21} {y+33} L{x+5} {y+33} Z"}, "var(--r-a3)"),
        shape("path", {"d": f"M{x+3.4} {y+13} L{x+22.6} {y+13} L{x+21.7} {y+23} L{x+4.3} {y+23} Z"}, "var(--r-a1)", 2.5),
        shape("rect", {"x": x, "y": y, "width": 26, "height": 6}, "var(--r-ink)", 2),
        line(f"M{x+8} {y-4} q5 -6 0 -12 q-5 -6 0 -12"),
        line(f"M{x+17} {y-4} q5 -6 0 -12"),
    ]


# The waving arm is also published on its own (rect-wave-arm, shoulder at 80,80) so a
# page can rotate it independently: <use rect-wave-body/> + <g><use rect-wave-arm/></g>.
WAVE_ARM = [
    limb("M80 80 C 62 76, 52 58, 56 36"),
    hand(56, 32),
    line("M40 34 q-5 -6 0 -13"), line("M72 24 q5 -6 0 -13"),
]
WAVE_BODY = [
    *legs(),
    body(),
    limb("M120 84 C 138 90, 148 102, 146 118"),
    hand(146, 120),
    *cup(134, 100),
]

POSES = {
    # Home: waving hello, coffee in the other hand.
    "rect-wave": [*WAVE_BODY[:5], *WAVE_ARM, *WAVE_BODY[5:]],
    "rect-wave-body": WAVE_BODY,
    "rect-wave-arm": WAVE_ARM,
    # Silvertune / music: belting into a mic, notes flying.
    "rect-mic": [
        limb("M92 140 C 86 165, 76 185, 70 204"),
        limb("M108 140 C 116 165, 126 185, 134 204"),
        SHOE_L(68), SHOE_R(136),
        body(),
        limb("M80 82 C 60 82, 44 72, 36 52"),
        hand(34, 48),
        limb("M120 86 C 134 88, 140 80, 140 70"),
        limb("M140 68 L128 52", 9),
        shape("circle", {"cx": 124, "cy": 45, "r": 10}, "var(--r-a3)"),
        line("M117 42 L131 48"), line("M119 37 L133 43", w=2.5),
        hand(140, 68),
        shape("ellipse", {"cx": 160, "cy": 40, "rx": 7, "ry": 5, "transform": "rotate(-20 160 40)"}, "var(--r-a1)", 2.5),
        line("M166 38 L166 14"), line("M166 14 q11 4 8 15"),
        shape("ellipse", {"cx": 178, "cy": 84, "rx": 6, "ry": 4.5, "transform": "rotate(-20 178 84)"}, "var(--r-a1)", 2.5),
        line("M183 82 L183 62"),
    ],
    # Research: holding one GPU, sweating.
    "rect-gpu": [
        *legs(),
        body(),
        limb("M80 84 C 66 90, 60 98, 60 108"),
        limb("M120 84 C 134 90, 140 98, 140 108"),
        shape("rect", {"x": 52, "y": 98, "width": 96, "height": 36}, "var(--r-a1)"),
        shape("circle", {"cx": 76, "cy": 116, "r": 12}, "var(--r-a3)", 2.5),
        shape("circle", {"cx": 124, "cy": 116, "r": 12}, "var(--r-a3)", 2.5),
        line("M70 112 L82 120 M82 112 L70 120"), line("M118 112 L130 120 M130 112 L118 120"),
        shape("rect", {"x": 72, "y": 134, "width": 46, "height": 6}, "var(--r-a2)", 2.5),
        hand(56, 104), hand(144, 104),
        shape("path", {"d": "M66 40 q-7 10 0 14 q7 -4 0 -14 z"}, "var(--r-a3)", 2.5),
        shape("path", {"d": "M136 30 q-6 9 0 12 q6 -3 0 -12 z"}, "var(--r-a3)", 2.5),
        line("M150 60 q6 -4 12 0"), line("M154 50 q6 -4 12 0"),
    ],
    # Artists / iPod silhouette ad: dancing with headphones, white cord.
    "rect-dance": [
        limb("M92 140 C 90 165, 84 185, 80 204"),
        SHOE_L(78),
        limb("M108 140 C 124 150, 140 154, 150 144"),
        shape("ellipse", {"cx": 158, "cy": 138, "rx": 15, "ry": 8, "transform": "rotate(-35 158 138)"}, "var(--r-a2)"),
        body(),
        limb("M120 90 C 140 96, 150 84, 160 70"),
        hand(162, 66),
        limb("M80 92 C 62 92, 50 78, 52 64"),
        line("M76 86 C 74 110, 60 108, 52 74", "var(--r-hi)", 3),
        shape("rect", {"x": 40, "y": 36, "width": 22, "height": 34, "rx": 3}, "var(--r-hi)", 2.5),
        shape("rect", {"x": 44, "y": 40, "width": 14, "height": 10}, "var(--r-ink)", 0),
        shape("circle", {"cx": 51, "cy": 60, "r": 6}, "var(--r-hi)", 2.5),
        hand(52, 66),
        limb("M76 66 C 76 38, 124 38, 124 66", 6),
        shape("rect", {"x": 68, "y": 60, "width": 14, "height": 24, "rx": 4}, "var(--r-a2)", 3),
        shape("rect", {"x": 118, "y": 60, "width": 14, "height": 24, "rx": 4}, "var(--r-a2)", 3),
    ],
    # Get a Mac: relaxed, hands in pockets.
    "rect-casual": [
        limb("M94 140 C 93 165, 90 185, 88 204"),
        limb("M106 140 C 108 165, 112 185, 114 204"),
        SHOE_L(86), SHOE_R(116),
        body(),
        limb("M80 86 C 68 96, 70 112, 84 118"),
        limb("M120 86 C 132 96, 130 112, 116 118"),
        line("M84 112 L84 124", "var(--r-ink)", 3), line("M116 112 L116 124", "var(--r-ink)", 3),
    ],
    # Get a Mac, the other guy: a Horizontal Rectangle in a suit with a briefcase.
    "hrect-suit": [
        limb("M86 140 L86 206"), limb("M114 140 L114 206"),
        shape("path", {"d": "M70 216 H94 V206 H76 C72 206 70 210 70 216 Z"}, "var(--r-ink)", 2),
        shape("path", {"d": "M130 216 H106 V206 H124 C128 206 130 210 130 216 Z"}, "var(--r-ink)", 2),
        body(58, 98, 84, 42, "var(--r-suit, var(--r-body))"),
        shape("path", {"d": "M94 98 L106 98 L103 106 L108 126 L100 134 L92 126 L97 106 Z"}, "var(--r-a1)", 2.5),
        limb("M58 108 C 50 122, 48 140, 50 160"),
        hand(50, 162),
        limb("M142 108 C 150 122, 152 140, 150 158"),
        shape("path", {"d": "M145 166 v-6 h12 v6"}, "none", 3),
        shape("rect", {"x": 134, "y": 166, "width": 34, "height": 24}, "var(--r-a2)"),
        line("M134 176 H168", "var(--r-ink)", 2.5),
        hand(150, 160),
    ],
}

LOGOS = {
    # Original mark from logo-large.png (512 grid): ring r256, disc r236, 160x320 rectangle at stroke 20.
    "logo": (
        '<circle cx="256" cy="256" r="256" style="fill:var(--logo-ring)"/>'
        '<circle cx="256" cy="256" r="236" style="fill:var(--logo-disc)"/>'
        '<rect x="176" y="96" width="160" height="320" style="fill:none;stroke:var(--logo-rect);stroke-width:20"/>'
    ),
    "logo-outline": (
        '<circle cx="256" cy="256" r="246" style="fill:none;stroke:var(--logo-ink);stroke-width:20"/>'
        '<rect x="176" y="96" width="160" height="320" style="fill:none;stroke:var(--logo-ink);stroke-width:20"/>'
    ),
}


def main():
    out = ['<svg xmlns="http://www.w3.org/2000/svg">']
    for sid, inner in LOGOS.items():
        out.append(f'<symbol id="{sid}" viewBox="0 0 512 512">{inner}</symbol>')
    for sid, parts in POSES.items():
        out.append(f'<symbol id="{sid}" viewBox="0 0 200 240">' + "".join(parts) + "</symbol>")
    out.append("</svg>\n")
    Path(__file__).with_name("sprite.svg").write_text("\n".join(out))


if __name__ == "__main__":
    main()
