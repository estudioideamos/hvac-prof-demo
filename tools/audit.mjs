import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = process.cwd();
const deps = process.env.HVAC_NODE_MODULES || path.resolve('node_modules');
const { chromium } = require(path.join(deps, 'playwright'));
const label = process.argv[2] || 'after';
fs.mkdirSync('.audit', { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
  if (label === 'after') {
    const csp=fs.readFileSync('.htaccess','utf8').match(/Header always set Content-Security-Policy "([^"]+)"/)?.[1];
    if(csp)res.setHeader('Content-Security-Policy',csp.replace('; upgrade-insecure-requests',''));
  }
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ executablePath: process.env.HVAC_CHROME || undefined, headless: true });
const results = [];
try {
  for (const [name, width, height] of [['mobile', 390, 844], ['desktop', 1366, 768]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.addInitScript(() => {
      window.auditVitals = { lcp: 0, cls: 0 };
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.auditVitals.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.auditVitals.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => ({ ...window.auditVitals, resources: performance.getEntriesByType('resource').map(r => ({ url: r.name, bytes: r.encodedBodySize })), overflow: document.documentElement.scrollWidth > innerWidth, h1: document.querySelectorAll('h1').length }));
    results.push({ name, ...metrics, errors });
    await page.screenshot({ path: `.audit/${label}-${name}.png` });
    await page.close();
  }
  if (label === 'after') {
    for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const failures = [];
      page.on('pageerror', e => failures.push(e.message));
      page.on('console', msg => { if(msg.type()==='error') failures.push(msg.text()); });
      page.on('response', r => { if (r.status() >= 400) failures.push(r.url() + ':' + r.status()); });
      await page.goto(base + '/' + file, { waitUntil: 'networkidle' });
      const data = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, overflow: document.documentElement.scrollWidth > innerWidth, imagesWithoutSize: [...document.images].filter(i => i.getAttribute('src') && (!i.width || !i.hasAttribute('width') || !i.hasAttribute('height'))).map(i=>i.src), schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)['@graph'].length) }));
      if (file === 'union-tdc.html') {
        await page.locator('.union-visual img').first().click();
        if (!await page.locator('.image-lightbox.is-open').count()) failures.push('Lightbox did not open');
        await page.keyboard.press('Escape');
      }
      results.push({ file, ...data, failures });
      await page.close();
    }
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto(base);
    results.push({ noJavaScript: await page.locator('.reveal').first().evaluate(el => getComputedStyle(el).opacity) });
    await page.close();
  }
  fs.writeFileSync(`.audit/${label}.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(r=>r.resources ? {...r, resources:r.resources.length, bytes:r.resources.reduce((s,x)=>s+x.bytes,0)} : r),null,2));
} finally { await browser.close(); server.close(); }
