// Read-only release checks against the public origin; never submits the contact form.
import fs from 'node:fs';
import { request } from 'playwright';

const origin = 'https://hvacprof.com.ar';
const client = await request.newContext({ timeout: 30000, extraHTTPHeaders: { Accept: 'application/json, text/html;q=0.9' } });
const results = { checkedAt: new Date().toISOString(), pages: [], redirects: [], failures: [] };
try {
  const sitemap = await client.get(`${origin}/sitemap.xml`);
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (sitemap.status() !== 200 || urls.length !== 13) results.failures.push('Invalid sitemap');
  const titles = new Set();
  const internal = new Set();
  for (const url of urls) {
    const response = await client.get(url);
    const html = await response.text();
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)?.[1];
    const h1 = (html.match(/<h1\b/g) || []).length;
    const issues = [];
    if (response.status() !== 200) issues.push(`HTTP ${response.status()}`);
    if (!title || titles.has(title)) issues.push('Missing or duplicated title');
    titles.add(title);
    if (!description) issues.push('Missing description');
    if (canonical !== url) issues.push(`Canonical mismatch: ${canonical}`);
    if (h1 !== 1) issues.push(`H1 count ${h1}`);
    if (/noindex/i.test(response.headers()['x-robots-tag'] || '') || /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html)) issues.push('Unexpected noindex');
    for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) JSON.parse(match[1]);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const target = new URL(match[1].replaceAll('&amp;', '&'), url);
      if (target.origin === origin && !target.pathname.startsWith('/assets/')) internal.add(target.origin + target.pathname);
    }
    results.pages.push({ url, title, canonical, h1, issues });
    results.failures.push(...issues.map(issue => `${url}: ${issue}`));
  }
  for (const url of internal) {
    const response = await client.get(url);
    if (response.status() >= 400) results.failures.push(`Broken internal link: ${url}`);
  }
  for (const [path, destination] of Object.entries({ '/index.html': '/', '/nosotros/': '/nosotros.html', '/productos-y-servicios/': '/productos.html', '/fabricacion-de-conductos/': '/productos.html', '/montaje-de-conductos/': '/servicios.html', '/trabajos-realizados/': '/proyectos.html', '/contacto/': '/contacto.html' })) {
    const response = await client.get(origin + path, { maxRedirects: 0 });
    const location = response.headers().location;
    const valid = response.status() === 301 && new URL(location, origin).href === origin + destination;
    results.redirects.push({ path, status: response.status(), location, valid });
    if (!valid) results.failures.push(`Redirect: ${path}`);
  }
  for (const [url, status] of [[origin + '/hvac-nonexistent-qa-path', 404], [origin + '/enviar-contacto.php', 405], [origin + '/test.BAK', 403]]) {
    const response = await client.get(url);
    if (response.status() !== status) results.failures.push(`Expected ${status}: ${url}`);
  }
  const robots = await client.get(origin + '/robots.txt');
  if (!(await robots.text()).includes(`Sitemap: ${origin}/sitemap.xml`)) results.failures.push('Missing sitemap discovery');
  results.internalLinksChecked = internal.size;
} finally {
  await client.dispose();
  fs.mkdirSync('.audit', { recursive: true });
  fs.writeFileSync('.audit/public-checks.json', JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results, null, 2));
if (results.failures.length) process.exitCode = 1;
