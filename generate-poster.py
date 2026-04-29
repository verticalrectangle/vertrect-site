import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent

font_var_b64   = base64.b64encode((ROOT / "fonts/InterVariable.woff2").read_bytes()).decode()
logo_b64       = base64.b64encode((ROOT / "logo-large.png").read_bytes()).decode()

VR_SVG = '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="47" fill="#000" stroke="#fff" stroke-width="3"/><rect x="29" y="18" width="42" height="64" fill="#000" stroke="#fff" stroke-width="5" rx="1"/></svg>'

HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
@font-face {{
  font-family: 'Inter';
  src: url('data:font/woff2;base64,{font_var_b64}') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
}}

*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

html, body {{
  width: 24in;
  height: 36in;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}}

body {{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 1.8in 1.5in;
}}

.logo {{
  width: 5.6in;
  height: 5.6in;
}}

.lines {{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2in;
  text-align: center;
}}

.line {{
  font-size: 3.8in;
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  line-height: 1;
}}

.footer {{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15in;
}}

.footer-wordmark {{
  font-size: 1.1in;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}}

.footer-url {{
  font-size: 0.76in;
  font-weight: 400;
  letter-spacing: 0.06em;
  opacity: 1;
}}
</style>
</head>
<body>
  <img class="logo" src="data:image/png;base64,{logo_b64}" alt="" />

  <div class="lines">
    <div class="line">74KB.</div>
    <div class="line">FREE.</div>
    <div class="line">OPEN</div>
    <div class="line">SOURCE.</div>
    <div class="line">AUTOTUNE.</div>
  </div>

  <div class="footer">
    <div class="footer-wordmark">Vertical Rectangle</div>
    <div class="footer-url">verticalrectangle.com</div>
  </div>
</body>
</html>"""

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 2304, "height": 3456})
    page.set_content(HTML, wait_until="networkidle")
    page.pdf(
        path=str(ROOT / "poster.pdf"),
        width="24in",
        height="36in",
        print_background=True,
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
    )
    print("✓  poster.pdf  (24×36in, print-ready)")
    browser.close()
    print("\nDone. Upload to Staples.")
