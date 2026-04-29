import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent

font_var_b64        = base64.b64encode((ROOT / "fonts/InterVariable.woff2").read_bytes()).decode()
font_regular_b64    = base64.b64encode((ROOT / "fonts/Inter-Regular.otf").read_bytes()).decode()
font_medium_b64     = base64.b64encode((ROOT / "fonts/Inter-Medium.otf").read_bytes()).decode()
font_bold_b64       = base64.b64encode((ROOT / "fonts/Inter-Bold.otf").read_bytes()).decode()
font_extrabold_b64  = base64.b64encode((ROOT / "fonts/Inter-ExtraBold.otf").read_bytes()).decode()

def b64(rel):
    return base64.b64encode((ROOT / rel).read_bytes()).decode()

cei_og_b64       = b64("img/cei-og.png")
epsilver_art_b64 = b64("img/epsilver-art.png")
epsilver_logo_b64 = b64("img/epsilver.png")
wickrunner_og_b64 = b64("img/wickrunner-og.png")

VR_SVG = '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="47" fill="#000" stroke="#fff" stroke-width="3"/><rect x="29" y="18" width="42" height="64" fill="#000" stroke="#fff" stroke-width="5" rx="1"/></svg>'

SILVERTUNE_SVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="27" rx="5.5" ry="3.5" fill="white" transform="rotate(-15 13 27)"/><rect x="17.5" y="8" width="2.5" height="20" fill="white"/><path d="M20 8 C28 10 28 17 23 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>'

PEDAL_SVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="10" width="22" height="16" rx="2" stroke="white" stroke-width="2.5"/><circle cx="13" cy="18" r="3" stroke="white" stroke-width="2"/><line x1="22" y1="14" x2="25" y2="14" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="18" x2="25" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="26" x2="13" y2="29" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="23" y1="26" x2="23" y2="29" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'

CEI_SVG = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="white"/><polygon points="50,15 82.94,38.75 70.71,78.75 29.29,78.75 17.06,38.75" fill="black"/></svg>'

WICKRUNNER_SVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="7" x2="18" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/><rect x="13" y="12" width="10" height="13" stroke="white" stroke-width="2.5"/><line x1="18" y1="25" x2="18" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>'

CSS = f"""
@font-face {{
  font-family: 'Inter';
  src: url('data:font/otf;base64,{font_regular_b64}') format('opentype');
  font-weight: 400;
  font-style: normal;
}}
@font-face {{
  font-family: 'Inter';
  src: url('data:font/otf;base64,{font_medium_b64}') format('opentype');
  font-weight: 500;
  font-style: normal;
}}
@font-face {{
  font-family: 'Inter';
  src: url('data:font/otf;base64,{font_bold_b64}') format('opentype');
  font-weight: 700;
  font-style: normal;
}}
@font-face {{
  font-family: 'Inter';
  src: url('data:font/otf;base64,{font_extrabold_b64}') format('opentype');
  font-weight: 800;
  font-style: normal;
}}
@font-face {{
  font-family: 'InterBlack';
  src: url('data:font/woff2;base64,{font_var_b64}') format('woff2-variations');
  font-weight: 900;
  font-style: normal;
}}

@page {{ size: letter; margin: 0; }}

*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

html, body {{
  background: #000;
  color: #fff;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}}

.page {{
  width: 8.5in;
  height: 11in;
  overflow: hidden;
  break-after: page;
  position: relative;
  background: #000;
}}

/* ── COVER ── */
.cover-page {{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}}

.cover-logo {{
  width: 1.7in;
  height: 1.7in;
  margin-bottom: 0.32in;
}}

.cover-title {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.68in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.24in;
}}

.cover-tagline {{
  font-size: 0.14in;
  font-weight: 400;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  line-height: 2;
}}

/* ── COMPANY PAGE ── */
.company-page {{
  display: flex;
  flex-direction: column;
  padding: 0.75in 0.75in 0.65in;
}}

.company-logo {{
  width: 0.42in;
  height: 0.42in;
  margin-bottom: 0.3in;
}}

.company-name {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.38in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.16in;
}}

.company-tagline {{
  font-size: 0.14in;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1.9;
  margin-bottom: 0.5in;
}}

.company-rule {{
  height: 1px;
  background: rgba(255,255,255,0.15);
  margin-bottom: 0.5in;
}}

.team-member {{
  margin-bottom: 0.38in;
}}

.member-name {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.26in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.09in;
}}

.member-role {{
  font-size: 0.14in;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}}

.company-footer {{
  margin-top: auto;
  padding-top: 0.3in;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}}

.company-footer-url {{
  font-size: 0.13in;
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1.9;
}}

.company-footer-year {{
  font-size: 0.13in;
  font-weight: 700;
  letter-spacing: 0.08em;
}}

/* ── PROJECT PAGE ── */
.project-page .page-inner {{
  padding: 0.6in 0.7in 0;
  display: flex;
  flex-direction: column;
  gap: 0.2in;
}}

.project-header {{
  display: flex;
  align-items: center;
  gap: 0.22in;
}}

.project-icon {{
  width: 0.68in;
  height: 0.68in;
  flex-shrink: 0;
}}

.project-icon svg,
.project-icon img {{
  width: 100%;
  height: 100%;
  object-fit: contain;
}}

.project-name {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.44in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
}}

.project-tagline {{
  font-size: 0.14in;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 0.1in;
}}

.rule {{
  height: 1px;
  background: rgba(255,255,255,0.15);
  flex-shrink: 0;
}}

.page-image {{
  width: 100%;
  aspect-ratio: 1200 / 630;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,0.15);
  display: block;
  flex-shrink: 0;
}}

.logo-thumbnail {{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.22in;
  background: rgba(255,255,255,0.03);
  aspect-ratio: 1200 / 630;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.15);
}}

.logo-thumbnail svg {{
  width: 0.55in;
  height: 0.55in;
}}

.logo-thumbnail-name {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.3in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
}}

.project-body {{
  font-size: 0.16in;
  font-weight: 400;
  line-height: 1.75;
}}

.specs {{
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border: 1px solid rgba(255,255,255,0.15);
  border-right: none;
  border-bottom: none;
  flex-shrink: 0;
}}

.spec-item {{
  padding: 0.15in 0.2in;
  border-right: 1px solid rgba(255,255,255,0.15);
  border-bottom: 1px solid rgba(255,255,255,0.15);
}}

.spec-label {{
  font-size: 0.11in;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.07in;
}}

.spec-value {{
  font-size: 0.15in;
  font-weight: 800;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}}

/* ── FOOTER ── */
.footer {{
  position: absolute;
  bottom: 0;
  left: 0.7in;
  right: 0.7in;
  padding-top: 0.13in;
  padding-bottom: 0.38in;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}}

.footer-left {{
  display: flex;
  align-items: center;
  gap: 0.1in;
}}

.footer-icon {{
  width: 0.43in;
  height: 0.43in;
  flex-shrink: 0;
}}

.footer-icon svg {{ width: 100%; height: 100%; }}

.footer-wordmark {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.27in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}}

.footer-url {{
  font-size: 0.18in;
  font-weight: 400;
  letter-spacing: 0.05em;
}}

/* ── ARTISTS PAGE ── */
.artists-page {{
  display: flex;
  flex-direction: column;
  padding: 0.6in 0.7in 0;
}}

.artists-page-title {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.38in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.3in;
}}

.artist-entry {{
  display: flex;
  flex-direction: column;
  gap: 0.15in;
  padding-bottom: 0.3in;
  margin-bottom: 0.3in;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}}

.artist-entry:last-of-type {{
  border-bottom: none;
}}

.artist-header {{
  display: flex;
  align-items: center;
  gap: 0.18in;
}}

.artist-icon {{
  width: 0.55in;
  height: 0.55in;
  flex-shrink: 0;
}}

.artist-icon svg {{ width: 100%; height: 100%; }}

.artist-name {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.34in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
}}

.artist-tagline {{
  font-size: 0.12in;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 1;
}}

.artist-body {{
  font-size: 0.15in;
  font-weight: 400;
  line-height: 1.75;
  max-width: 5.5in;
}}

/* ── BACK COVER ── */
.back-cover {{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}}

.back-logo {{
  width: 1.7in;
  height: 1.7in;
  margin-bottom: 0.32in;
}}

.back-wordmark {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.68in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 0.24in;
}}

.back-contact {{
  font-size: 0.11in;
  font-weight: 400;
  letter-spacing: 0.06em;
  opacity: 0.45;
  line-height: 2.2;
}}
"""

FOOTER = f"""
<div class="footer">
  <div class="footer-left">
    <div class="footer-icon">{VR_SVG}</div>
    <span class="footer-wordmark">Vertical Rectangle</span>
  </div>
  <span class="footer-url">verticalrectangle.com</span>
</div>"""

def spec(label, value):
    return f'<div class="spec-item"><div class="spec-label">{label}</div><div class="spec-value">{value}</div></div>'

def logo_thumb(icon_svg, name):
    return f'<div class="logo-thumbnail">{icon_svg}<span class="logo-thumbnail-name">{name}</span></div>'

def img_thumb(data, ext="png"):
    return f'<img class="page-image" src="data:image/{ext};base64,{data}" />'

def project_page(icon_html, name, tagline, image_html, body, spec_pairs):
    specs = "".join(spec(l, v) for l, v in spec_pairs)
    return f"""
<div class="page project-page">
  <div class="page-inner">
    <div class="project-header">
      <div class="project-icon">{icon_html}</div>
      <div>
        <h1 class="project-name">{name}</h1>
        <p class="project-tagline">{tagline}</p>
      </div>
    </div>
    <div class="rule"></div>
    {image_html}
    <p class="project-body">{body}</p>
    <div class="specs">{specs}</div>
  </div>
  {FOOTER}
</div>"""


COVER = f"""
<div class="page cover-page">
  <div class="cover-logo">{VR_SVG}</div>
  <h1 class="cover-title" style="margin-bottom: 0; line-height: 0.9;">Vertical<br>Rectangle</h1>
  <p class="cover-tagline">Independent creative technology studio</p>
  <br><br>

  <h1 class="cover-title">DEVELOPMENT PROJECTS<b>AND ARTIST DIRECTORY</b></h1>
</div>"""

COMPANY = f"""
<div class="page company-page">
  <div class="company-logo">{VR_SVG}</div>
  <h1 class="company-name">Vertical Rectangle</h1>
  <p class="company-tagline">Independent creative technology studio</p>
  <div class="company-rule"></div>
  <div class="team-member">
    <h1 class="artists-page-title">STAFF</h1>

    <div class="member-name">Alexis Lucio</div>
    <div class="member-role">CEO, visionary leader, creative direction, and developer.</div>
  </div>
  <div class="team-member">
    <div class="member-name">Leah Macaraeg</div>
    <div class="member-role">Creative direction, editor, and writer.</div>
  </div>
  <div class="team-member">
    <div class="member-name">Timothy Herrick</div>
    <div class="member-role">Author and guru.</div>
  </div>
  <div class="company-footer">
    <div class="company-footer-url">
      <div>verticalrectangle.com</div>
      <div>alexis@verticalrectangle.com</div>
    </div>
    <div class="company-footer-year">2026</div>
  </div>
</div>"""

PAGE_SILVERTUNE = project_page(
    icon_html=SILVERTUNE_SVG,
    name="Silvertune",
    tagline="An Industry-Standard, 100% FLOSS Autotune. Only 74KB.",
    image_html=logo_thumb(SILVERTUNE_SVG, "Silvertune"),
    body="A real-time CLAP and VST3 audio plugin that locks your pitch to the nearest note in any chosen key. Instant, merciless, and musical. The Cher effect. The T-Pain shimmer. The Yeezy edge. Your soul in the mirror singing back at you in perfect tune.",
    spec_pairs=[
        ("Format", "CLAP"),
        ("Language", "C++17"),
        ("Platform", "Linux"),
        ("Status", "In Dev"),
        ("License", "GPLv3"),
    ],
)

PAGE_PEDAL = project_page(
    icon_html=PEDAL_SVG,
    name="Silvertune Pedal",
    tagline="Pitch correction in hardware",
    image_html=logo_thumb(PEDAL_SVG, "Silvertune Pedal"),
    body="Silvertune in hardware. The same pitch correction algorithm built into a pedalboard-ready enclosure. Plug in, choose your key, and sing in tune.",
    spec_pairs=[
        ("Format", "Pedal"),
        ("Language", "C++"),
        ("Platform", "Embedded"),
        ("Status", "In Dev"),
        ("License", "GPLv3"),
    ],
)

PAGE_CEI = project_page(
    icon_html=CEI_SVG,
    name="Cultural Extremity Index",
    tagline="How extreme is your taste?",
    image_html=img_thumb(cei_og_b64),
    body="A tool for measuring how far outside the mainstream you are. Built to answer the question nobody asks but everyone wonders.",
    spec_pairs=[
        ("Format", "Web App"),
        ("Language", "JavaScript"),
        ("Platform", "Web"),
        ("Status", "In Dev"),
        ("License", "GPLv3"),
    ],
)

PAGE_WICKRUNNER = project_page(
    icon_html=WICKRUNNER_SVG,
    name="[Project Name]",
    tagline="[Tagline]",
    image_html=img_thumb(wickrunner_og_b64),
    body="[Project description — coming soon.]",
    spec_pairs=[
        ("Format", "[Value]"),
        ("Language", "[Value]"),
        ("Platform", "[Value]"),
        ("Status", "[Value]"),
        ("License", "GPLv3"),
    ],
)

EPSILVER_ICON_SVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="15" stroke="white" stroke-width="2"/><text x="18" y="25" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="25" font-weight="700" fill="white">e</text></svg>'
DG_ICON_SVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="14" r="8" stroke="white" stroke-width="2"/><line x1="18" y1="22" x2="18" y2="32" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="27" x2="23" y2="27" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
EKIOZE_ICON_SVG = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="15" stroke="white" stroke-width="2"/><line x1="18" y1="9" x2="18" y2="27" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="13.5" x2="26" y2="22.5" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="22.5" x2="26" y2="13.5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'

PAGE_ARTISTS = f"""
<div class="page artists-page">
  <h1 class="artists-page-title">Artists</h1>

  <div class="artist-entry">
    <div class="artist-header">
      <div class="artist-icon">{EPSILVER_ICON_SVG}</div>
      <div>
        <div class="artist-name">Epsilver</div>
        <div class="artist-tagline">Alexis Lucio</div>
      </div>
    </div>
    <p class="artist-body">Digital art, music, and writing made under the name epsilver. Glitch, collage, and motion. Also publishes a blog.</p>
  </div>

  <div class="artist-entry">
    <div class="artist-header">
      <div class="artist-icon">{EKIOZE_ICON_SVG}</div>
      <div>
        <div class="artist-name">Ekioze</div>
        <div class="artist-tagline">Leah Macaraeg</div>
      </div>
    </div>
    <p class="artist-body">Creative writing, character concept art, and digital artist.</p>
  </div>
  <div class="artist-entry">
    <div class="artist-header">
      <div class="artist-icon">{EKIOZE_ICON_SVG}</div>
      <div>
        <div class="artist-name">Timothy Herrick</div>
        <div class="artist-tagline">Author</div>
      </div>
    </div>
    <p class="artist-body">Published author and artist. timhrklit.com</p>
  </div>
  <div class="artist-entry">
    <div class="artist-header">
      <div class="artist-icon">{DG_ICON_SVG}</div>
      <div>
        <div class="artist-name">Depravity Girlz</div>
        <div class="artist-tagline">Invest in the future. Invest in depravity.</div>
      </div>
    </div>
    <p class="artist-body">A collective of cyber artists and content creators.</p>
  </div>

  {FOOTER}
</div>"""

BACK_COVER = f"""
<div class="page back-cover">
  <div class="back-logo">{VR_SVG}</div>
  <h1 class="cover-title" style="margin-bottom: 0; line-height: 0.9;">Vertical<br>Rectangle</h1>
  <p class="cover-tagline">Independent creative technology studio</p>
</div>"""

HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>{CSS}</style>
</head>
<body>
{COVER}
{COMPANY}
{PAGE_SILVERTUNE}
{PAGE_PEDAL}
{PAGE_CEI}
{PAGE_WICKRUNNER}
{PAGE_ARTISTS}
{BACK_COVER}
</body>
</html>"""

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 816, "height": 1056})
    page.set_content(HTML, wait_until="networkidle")
    page.pdf(
        path=str(ROOT / "booklet.pdf"),
        width="8.5in",
        height="11in",
        print_background=True,
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
    )
    print("✓  booklet.pdf  (8.5×11in letter, 8 pages, print-ready)")
    browser.close()
    print("\nDone. Send to printer.")
