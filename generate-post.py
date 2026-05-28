"""
VR LinkedIn post renderer.
Usage:
  python generate-post.py --layout announcement --title "Title" --subtitle "Subtitle" [--body "Body"] [--out out.png]
  python generate-post.py --layout release --title "Project" --version "v1.0" [--body "Notes"] [--out out.png]
  python generate-post.py --layout quote --title "Quote text" --subtitle "— Attribution" [--out out.png]
"""
import argparse
import base64
import html as _html
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent

_font_var_b64   = base64.b64encode((ROOT / "fonts/InterVariable.woff2").read_bytes()).decode()
_logo_b64       = base64.b64encode((ROOT / "logo-large.png").read_bytes()).decode()

SIZE = 1080  # square, works best on LinkedIn feed

BASE_CSS = f"""
@font-face {{
  font-family: 'Inter';
  src: url('data:font/woff2;base64,{_font_var_b64}') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
}}
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; text-rendering: optimizeLegibility; }}
html, body {{
  width: {SIZE}px;
  height: {SIZE}px;
  overflow: hidden;
  background: #080a0e;
  color: #fff;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}}
.logo {{
  position: absolute;
  top: 56px;
  left: 64px;
  width: 44px;
  height: 44px;
}}
.wordmark {{
  position: absolute;
  top: 62px;
  left: 120px;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}}
"""

def _shell(logo, wordmark, inner_html):
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>{BASE_CSS}</style>
</head><body>
  <img class="logo" src="data:image/png;base64,{_logo_b64}" alt="" />
  <span class="wordmark">Vertical Rectangle</span>
  {inner_html}
</body></html>"""


LAYOUTS = {}

# ── ANNOUNCEMENT ─────────────────────────────────────────────────────────────
LAYOUTS["announcement"] = lambda title, subtitle, body: _shell(None, None, f"""
<style>
body {{ display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; padding: 64px; }}
.title {{
  font-size: 96px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  line-height: 0.95;
  margin-bottom: {"32px" if subtitle or body else "0"};
}}
.subtitle {{
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.01em;
  opacity: 0.7;
  margin-bottom: {"24px" if body else "0"};
  max-width: 700px;
  line-height: 1.4;
}}
.body {{
  font-size: 22px;
  font-weight: 400;
  opacity: 0.5;
  max-width: 700px;
  line-height: 1.5;
}}
</style>
<div class="title">{title}</div>
{"<div class='subtitle'>" + subtitle + "</div>" if subtitle else ""}
{"<div class='body'>" + body + "</div>" if body else ""}
""")

# ── RELEASE ───────────────────────────────────────────────────────────────────
LAYOUTS["release"] = lambda title, subtitle, body: _shell(None, None, f"""
<style>
body {{ display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 64px; gap: 0; }}
.tag {{
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.4;
  margin-bottom: 20px;
}}
.title {{
  font-size: 88px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  line-height: 0.95;
  margin-bottom: 24px;
}}
.version {{
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.01em;
  opacity: 0.6;
  margin-bottom: {"32px" if body else "0"};
}}
.body {{
  font-size: 22px;
  font-weight: 400;
  opacity: 0.5;
  max-width: 700px;
  line-height: 1.6;
}}
</style>
<div class="tag">New Release</div>
<div class="title">{title}</div>
{"<div class='version'>" + subtitle + "</div>" if subtitle else ""}
{"<div class='body'>" + body + "</div>" if body else ""}
""")

# ── FLOW ──────────────────────────────────────────────────────────────────────
# title    = pipeline/doc name   e.g. "Mode D CI Pipeline"
# subtitle = project name        e.g. "Pop Maker Studio"
# body     = pipe-separated sections:
#            steps (comma-separated) | tagline | stats (comma-separated)
#   e.g. "BUILD FAILS,CLAUDE DIAGNOSES,COMMENT POSTED,HUMAN FIXES|No auto-patching. Human applies the fix.|~60s turnaround,~$1/run,claude-opus-4-7"
def _flow_html(title, subtitle, body):
    parts = (body or "").split("|")
    steps_raw  = parts[0].strip() if len(parts) > 0 else ""
    tagline    = parts[1].strip() if len(parts) > 1 else ""
    stats_raw  = parts[2].strip() if len(parts) > 2 else ""
    steps = [s.strip() for s in steps_raw.split(",") if s.strip()]
    stats = [s.strip() for s in stats_raw.split(",") if s.strip()]

    steps_html = "".join(
        f"<div class='step'><span class='num'>{i+1:02d}</span><span class='step-text'>{_html.escape(s)}</span></div>"
        for i, s in enumerate(steps)
    )
    stats_html = " <span class='dot'>·</span> ".join(f"<span>{_html.escape(s)}</span>" for s in stats)

    return _shell(None, None, f"""
<style>
body {{
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 72px;
  padding-top: 148px;
  gap: 40px;
}}
.top {{ display: flex; flex-direction: column; gap: 10px; margin-bottom: 0; }}
.project {{
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}}
.title {{
  font-size: 76px;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 0.95;
}}
.tagline {{
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 0;
  max-width: 900px;
  line-height: 1.4;
  margin-top: 8px;
}}
.steps {{
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}}
.step {{
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 22px 0;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}}
.num {{
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.06em;
  flex-shrink: 0;
  width: 36px;
}}
.step-text {{
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}}
.stats {{
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}}
.dot {{ margin: 0 12px; }}
</style>
<div class="top">
  {"<div class='project'>" + subtitle + "</div>" if subtitle else ""}
  <div class="title">{title}</div>
  {"<div class='tagline'>" + tagline + "</div>" if tagline else ""}
</div>
<div class="steps">{steps_html}</div>
{"<div class='stats'>" + stats_html + "</div>" if stats else ""}
""")

LAYOUTS["flow"] = _flow_html

# ── QUOTE ─────────────────────────────────────────────────────────────────────
LAYOUTS["quote"] = lambda title, subtitle, body: _shell(None, None, f"""
<style>
body {{ display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 64px 80px; gap: 0; }}
.quote-mark {{
  font-size: 160px;
  font-weight: 900;
  line-height: 0.7;
  opacity: 0.15;
  margin-bottom: 8px;
}}
.quote {{
  font-size: 52px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  max-width: 900px;
  margin-bottom: 40px;
}}
.attribution {{
  font-size: 22px;
  font-weight: 400;
  opacity: 0.5;
  letter-spacing: 0.01em;
}}
</style>
<div class="quote-mark">"</div>
<div class="quote">{title}</div>
{"<div class='attribution'>" + subtitle + "</div>" if subtitle else ""}
""")


def render(layout: str, title: str, subtitle: str = "", body: str = "", out: str = None) -> str:
    if layout not in LAYOUTS:
        raise ValueError(f"Unknown layout '{layout}'. Choose from: {', '.join(LAYOUTS)}")

    html = LAYOUTS[layout](title, subtitle, body)

    if out is None:
        slug = title.lower().replace(" ", "-")[:40]
        out = str(ROOT / f"post-{layout}-{slug}.png")

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": SIZE, "height": SIZE}, device_scale_factor=2)
        page.set_content(html, wait_until="networkidle")
        page.screenshot(path=out, omit_background=False)
        browser.close()

    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a VR-branded LinkedIn post image.")
    parser.add_argument("--layout", required=True, choices=list(LAYOUTS), help="Post layout")
    parser.add_argument("--title", required=True, help="Main text / title")
    parser.add_argument("--subtitle", default="", help="Subtitle, version, or attribution")
    parser.add_argument("--body", default="", help="Optional body copy")
    parser.add_argument("--out", default=None, help="Output PNG path")
    args = parser.parse_args()

    path = render(args.layout, args.title, args.subtitle, args.body, args.out)
    print(f"✓  {path}")
