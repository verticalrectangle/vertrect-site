const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const src = path.join(__dirname, 'logo.png');
const out = __dirname;

const sizes = [
  { name: 'favicon-16x16.png',          size: 16  },
  { name: 'favicon-32x32.png',          size: 32  },
  { name: 'apple-touch-icon.png',       size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generate() {
  for (const { name, size } of sizes) {
    await sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(out, name));
    console.log(`✓ ${name}`);
  }

  // og-image.png — puppeteer HTML render
  const fontB64 = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Black.ttf')).toString('base64');
  const logoB64 = fs.readFileSync(src).toString('base64');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @font-face {
    font-family: 'InterBlack';
    src: url('data:font/ttf;base64,${fontB64}') format('truetype');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #000;
    display: flex;
    align-items: center;
    padding: 0 120px;
    gap: 80px;
  }
  img { width: 300px; height: 300px; flex-shrink: 0; }
  h1 {
    font-family: 'InterBlack', sans-serif;
    font-size: 85px;
    font-weight: 900;
    color: #fff;
    text-transform: uppercase;
    line-height: 0.95;
    letter-spacing: -2px;
  }
</style>
</head>
<body>
  <img src="data:image/png;base64,${logoB64}" />
  <h1>Vertical<br>Rectangle</h1>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(out, 'og-image.png'), type: 'png' });
  await browser.close();
  console.log('✓ og-image.png');

  // favicon.ico — multi-size (16, 32, 48)
  // sharp doesn't write .ico natively, so we bundle 3 PNGs using raw buffers
  // and write a minimal ICO file manually
  const icoSizes = [16, 32, 48];
  const images = await Promise.all(
    icoSizes.map(s => sharp(src).resize(s, s).png().toBuffer())
  );

  fs.writeFileSync(path.join(out, 'favicon.ico'), buildIco(images, icoSizes));
  console.log('✓ favicon.ico');

  // site.webmanifest
  const manifest = {
    name: 'Vertical Rectangle',
    short_name: 'VertRect',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
  };
  fs.writeFileSync(
    path.join(out, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('✓ site.webmanifest');
  console.log('\nAll done.');
}

// Minimal ICO builder
function buildIco(buffers, sizes) {
  const count = buffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  const dataOffset = headerSize + dirSize;

  const offsets = [];
  let offset = dataOffset;
  for (const buf of buffers) {
    offsets.push(offset);
    offset += buf.length;
  }

  const totalSize = offset;
  const ico = Buffer.alloc(totalSize);

  // ICO header
  ico.writeUInt16LE(0, 0);      // reserved
  ico.writeUInt16LE(1, 2);      // type: 1 = ICO
  ico.writeUInt16LE(count, 4);  // image count

  // Directory entries
  for (let i = 0; i < count; i++) {
    const base = headerSize + i * dirEntrySize;
    const s = sizes[i];
    ico.writeUInt8(s === 256 ? 0 : s, base);      // width  (0 = 256)
    ico.writeUInt8(s === 256 ? 0 : s, base + 1);  // height
    ico.writeUInt8(0, base + 2);                   // color count
    ico.writeUInt8(0, base + 3);                   // reserved
    ico.writeUInt16LE(1, base + 4);                // color planes
    ico.writeUInt16LE(32, base + 6);               // bits per pixel
    ico.writeUInt32LE(buffers[i].length, base + 8);
    ico.writeUInt32LE(offsets[i], base + 12);
  }

  // Image data
  for (let i = 0; i < count; i++) {
    buffers[i].copy(ico, offsets[i]);
  }

  return ico;
}

generate().catch(err => { console.error(err); process.exit(1); });
