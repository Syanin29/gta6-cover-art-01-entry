const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 34574;
const APP_DIR = path.join(__dirname, 'app');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(APP_DIR, urlPath === '/' ? 'index.html' : urlPath);
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(APP_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(normalizedPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found: ' + urlPath);
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

async function takeScreenshot() {
  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    // Use pier sample with golden grade, single layout (full bleed)
    const response = await page.goto(`http://127.0.0.1:${PORT}/?shot=editor&photo=pier&layout=single&grade=golden&size=1920x1080&intensity=100&vignette=false&grain=false`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    console.log('Response status:', response.status());
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check the actual canvas pixel data
    const canvasBrightness = await page.evaluate(() => {
      const canvas = document.getElementById('preview');
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let sum = 0, max = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = 0.299*r + 0.587*g + 0.114*b;
        sum += brightness;
        max = Math.max(max, brightness);
        count++;
      }
      return { mean: sum/count, max, count };
    });
    console.log('Canvas brightness:', canvasBrightness);
    
    const controlsDisplay = await page.evaluate(() => {
      const el = document.querySelector('.controls');
      return el ? window.getComputedStyle(el).display : 'not found';
    });
    console.log('controls display:', controlsDisplay);
    
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/2-editor.jpg'),
      type: 'jpeg',
      quality: 85,
      fullPage: false,
    });

    console.log('Screenshot saved to screenshots/2-editor.jpg');
  } finally {
    await browser.close();
    server.close();
  }
}

takeScreenshot().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});
