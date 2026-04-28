import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logoB64 = fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64');
const fontB64 = fs.readFileSync(path.join(__dirname, 'fonts/InterVariable.woff2')).toString('base64');

// 2" × 3.5" at 96 CSS px/in = 192 × 336px
// deviceScaleFactor 6.25 → 1200 × 2100px output = 600 DPI
const CSS_W = 192;
const CSS_H = 336;
const SCALE = 6.25;

const baseCSS = `
  @font-face {
    font-family: 'Inter';
    src: url('data:font/woff2;base64,${fontB64}') format('woff2-variations');
    font-weight: 100 900;
    font-style: normal;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 2in;
    height: 3.5in;
    overflow: hidden;
    background: #000;
    color: #fff;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

const frontHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
${baseCSS}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0.28in 0.22in 0.22in;
}

.logo {
  width: 0.78in;
  height: 0.78in;
  display: block;
}

.wordmark {
  text-align: center;
  font-size: 0.155in;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1.25;
  padding-right: 0.155in; /* optical compensation for letter-spacing trailing gap */
}
</style>
</head>
<body>
  <img class="logo" src="data:image/png;base64,${logoB64}" alt="" />
  <div class="wordmark">VERTICAL<br>RECTANGLE</div>
</body>
</html>`;

const backHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
${baseCSS}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0 0.22in;
}

.name {
  font-size: 0.21in;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
  padding-right: 0.21in; /* trailing letter-spacing compensation */
}

.artist {
  font-size: 0.13in;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  text-align: center;
  color: rgba(255,255,255,0.75);
  margin-top: 0.09in;
}

.email {
  font-size: 0.10in;
  font-weight: 400;
  letter-spacing: 0.03em;
  text-align: center;
  color: rgba(255,255,255,0.5);
  margin-top: 0.18in;
}
</style>
</head>
<body>
  <div class="name">Alexis Lucio</div>
  <div class="artist">epsilver</div>
  <div class="email">alexis@verticalrectangle.com</div>
</body>
</html>`;

async function renderCard(html, baseName) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: SCALE });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // PNG — 600 DPI (1200×2100px)
  await page.screenshot({
    path: path.join(__dirname, `${baseName}.png`),
    omitBackground: false,
  });
  console.log(`✓  ${baseName}.png  (1200×2100, 600 DPI)`);

  // PDF — vector text, exact card dimensions
  await page.pdf({
    path: path.join(__dirname, `${baseName}.pdf`),
    width: '2in',
    height: '3.5in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`✓  ${baseName}.pdf  (2×3.5 in, print-ready)`);

  await browser.close();
}

(async () => {
  await renderCard(frontHTML, 'card-front');
  await renderCard(backHTML, 'card-back');
  console.log('\nDone. Upload the PDFs to Staples.');
})();
