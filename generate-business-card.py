import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent

logo_b64 = base64.b64encode((ROOT / "logo.png").read_bytes()).decode()
font_var_b64   = base64.b64encode((ROOT / "fonts/InterVariable.woff2").read_bytes()).decode()
font_black_b64 = base64.b64encode((ROOT / "fonts/Inter-Black.otf").read_bytes()).decode()

SCALE = 6.25  # 600 DPI

def base_css(w: str, h: str) -> str:
    return f"""
@font-face {{
  font-family: 'Inter';
  src: url('data:font/woff2;base64,{font_var_b64}') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
}}
@font-face {{
  font-family: 'InterBlack';
  src: url('data:font/otf;base64,{font_black_b64}') format('opentype');
  font-weight: 900;
  font-style: normal;
}}
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{
  width: {w};
  height: {h};
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}}
"""

# ── FRONT: landscape 3.5" × 2" (content rotated to portrait) ─────────────────
FRONT_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
{base_css("3.5in", "2in")}

body {{
  display: flex;
  align-items: center;
  justify-content: center;
}}

.card-inner {{
  width: 2in;
  height: 3.5in;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0.28in 0.22in 0.22in;
  transform: rotate(-90deg);
}}

.logo {{
  width: 0.78in;
  height: 0.78in;
  display: block;
}}

.wordmark {{
  text-align: center;
  font-size: 0.22in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1;
}}
</style>
</head>
<body>
  <div class="card-inner">
    <img class="logo" src="data:image/png;base64,{logo_b64}" alt="" />
    <div class="wordmark">VERTICAL<br>RECTANGLE</div>
  </div>
</body>
</html>"""

# ── BACK: landscape 3.5" × 2" ────────────────────────────────────────────────
BACK_HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
{base_css("3.5in", "2in")}

body {{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 0.3in;
}}

.name {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.28in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-align: center;
  line-height: 1;
}}

.artist {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.13in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-align: center;
  color: #fff;
  margin-top: 0.08in;
  line-height: 1;
}}

.name + .name {{
  font-size: 0.196in;
}}

.email {{
  font-family: 'InterBlack', sans-serif;
  font-size: 0.1in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-align: center;
  color: #fff;
  margin-top: 0.04in;
  line-height: 1;
}}
</style>
</head>
<body>
  <div class="name">Alexis Lucio</div>
  <div class="name">CEO</div>
  <div class="email">alexis@verticalrectangle.com</div>
  <div class="email">verticalrectangle.com</div>
  <div class="email" style="display:inline-flex;align-items:center;gap:0.03in;"><svg viewBox="0 0 24 24" style="width:0.1in;height:0.1in;fill:white;flex-shrink:0;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> @epsilver_</div>
</body>
</html>"""


def render_card(playwright, html: str, base_name: str, w_in: str, h_in: str):
    # CSS px at 96px/in
    css_w = round(float(w_in.replace("in", "")) * 96)
    css_h = round(float(h_in.replace("in", "")) * 96)
    px_w = round(css_w * SCALE)
    px_h = round(css_h * SCALE)

    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": css_w, "height": css_h},
        device_scale_factor=SCALE,
    )
    page.set_content(html, wait_until="networkidle")

    png_path = str(ROOT / f"{base_name}.png")
    page.screenshot(path=png_path, omit_background=False)
    print(f"✓  {base_name}.png  ({px_w}×{px_h}, 600 DPI)")

    pdf_path = str(ROOT / f"{base_name}.pdf")
    page.pdf(
        path=pdf_path,
        width=w_in,
        height=h_in,
        print_background=True,
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
    )
    print(f"✓  {base_name}.pdf  ({w_in}×{h_in}, print-ready)")

    browser.close()


with sync_playwright() as pw:
    render_card(pw, FRONT_HTML, "card-front", "3.5in", "2in")
    render_card(pw, BACK_HTML,  "card-back",  "3.5in", "2in")
    print("\nDone. Upload the PDFs to Staples.")
