// One-time bulk migration for the existing static pages. Run before packaging.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const deps = process.env.HVAC_NODE_MODULES || path.resolve('node_modules');
const sharp = require(path.join(deps, 'sharp'));
const { chromium } = require(path.join(deps, 'playwright'));
const root = process.cwd();
fs.mkdirSync('assets/fonts', { recursive: true });
fs.mkdirSync('assets/images/responsive', { recursive: true });
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const fontUrl = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400..800&display=swap';
const fontResponse = await fetch(fontUrl, { headers: { 'User-Agent': userAgent } });
if (!fontResponse.ok) throw new Error('Font stylesheet download failed');
const fontCss = await fontResponse.text();
const fontRules = [];
const fontFiles = new Map();
for (const match of fontCss.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)) {
  let rule = match[1];
  const url = rule.match(/url\(([^)]+)\)/)?.[1];
  if (!url || !url.includes('.woff2')) throw new Error('Expected Latin WOFF2 font');
  let file = fontFiles.get(url);
  if (!file) {
    const family = rule.includes('Barlow') ? 'barlow-condensed' : 'plus-jakarta-sans';
    const weight = rule.match(/font-weight:\s*([^;]+)/)[1].replaceAll(' ', '-');
    file = `assets/fonts/${family}-${weight}.woff2`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Font download failed');
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    fontFiles.set(url, file);
  }
  rule = rule.replace(url, file);
  fontRules.push(rule);
}
if (!fontRules.length) throw new Error('No fonts found');
fs.writeFileSync('assets/fonts/fonts.css', fontRules.join('\n'));
for (const [family, repo] of [['barlow-condensed', 'barlowcondensed'], ['plus-jakarta-sans', 'plusjakartasans']]) {
  const response = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${repo}/OFL.txt`);
  if (!response.ok) throw new Error('Font license unavailable');
  fs.writeFileSync(`assets/fonts/${family}-OFL.txt`, await response.text());
}
const metadata = {};
const responsive = {};
function inventory(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const f=dir+'/'+entry.name; if(entry.isDirectory()) { if(entry.name!=='responsive') inventory(f); } else if(/\.(png|webp|jpg|jpeg)$/.test(f)) metadata[f]=null; } }
inventory('assets/images');
for (const file of Object.keys(metadata)) {
  let m;
  try { m = await sharp(file).metadata(); }
  catch (error) {
    if (fs.readdirSync(root).filter(f=>f.endsWith('.html')).some(f=>fs.readFileSync(f,'utf8').includes(file))) throw error;
    delete metadata[file];
    console.log('Unused invalid image excluded: '+file);
    continue;
  }
  metadata[file] = { width: m.width, height: m.height };
  if (m.width >= 900 && !file.includes('og-hvacprof') && !file.includes('logo-')) {
    const candidates = [];
    for (const width of [480, 800, 1200]) {
      if (width >= m.width) continue;
      const target = `assets/images/responsive/${path.basename(file,path.extname(file))}-${width}.webp`;
      await sharp(file).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
      candidates.push(`${target} ${width}w`);
    }
    candidates.push(`${file} ${m.width}w`);
    responsive[file] = candidates.join(', ');
  }
}
const titles = {
  'index.html': 'Fabricación y montaje de conductos HVAC | HVAC PROF',
  'nosotros.html': 'Fabricación propia de conductos en Quilmes | HVAC PROF',
  'servicios.html': 'Montaje, aislación y sellado de conductos | HVAC PROF',
  'productos.html': 'Conductos, piezas y sistemas de unión HVAC | HVAC PROF',
  'contacto.html': 'Contacto y presupuesto de conductos HVAC | HVAC PROF',
  'piezas-estandares.html': 'Piezas estándares para conductos de aire | HVAC PROF',
  'piezas-especiales.html': 'Piezas especiales para conductos a medida | HVAC PROF',
  'insumos-de-montaje.html': 'Insumos y kits de montaje de conductos | HVAC PROF',
  'union-tdc.html': 'Sistema de unión TDC para conductos | HVAC PROF',
  'union-marco-pestana.html': 'Unión Marco-Pestaña para conductos HVAC | HVAC PROF',
  'union-zeta-corredera.html': 'Unión Zeta-Corredera para conductos | HVAC PROF',
};
const org = { '@type': 'Organization', '@id': 'https://hvacprof.com.ar/#organization', name: 'HVAC PROF', url: 'https://hvacprof.com.ar/', logo: 'https://hvacprof.com.ar/assets/images/logo-hvacprof.png', telephone: '+54 9 11 2511 2777', email: 'info@hvacprof.com.ar', address: { '@type': 'PostalAddress', addressLocality: 'Quilmes', addressRegion: 'Buenos Aires', addressCountry: 'AR' }, sameAs: ['https://www.instagram.com/hvacprof/', 'https://www.linkedin.com/company/hvacprof/'] };
const hashes = [];
const summaries = [];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/*', route=>route.abort());
  for (const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))) {
    const original = fs.readFileSync(file, 'utf8');
    if (original.includes('data-seo-schema')) throw new Error('Migration already applied; do not run twice');
    await page.setContent(original, { waitUntil: 'domcontentloaded' });
    const data = await page.evaluate(({ metadata, responsive, title, file, org }) => {
      if (title) {
        document.title=title;
        for (const sel of ['meta[property="og:title"]','meta[name="twitter:title"]']) document.querySelector(sel)?.setAttribute('content',title);
      }
      document.querySelectorAll('link[href*="fonts.googleapis"],link[href*="fonts.gstatic"]').forEach(el=>el.remove());
      document.querySelector('meta[http-equiv="Permissions-Policy"]')?.remove();
      document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.remove();
      document.documentElement.lang='es-AR';
      document.querySelector('main')?.setAttribute('id','contenido');
      const skip=document.createElement('a');skip.href='#contenido';skip.className='skip-link';skip.textContent='Saltar al contenido';document.body.prepend(skip);
      document.querySelectorAll('a[href="index.html"]').forEach(a=>a.href='./');
      document.querySelectorAll('script[src]').forEach(s=>s.defer=true);
      let hero = null;
      for (const img of document.images) {
        const src=img.getAttribute('src'); const size=metadata[src];
        if(size) { img.width=size.width;img.height=size.height; }
        img.decoding='async';
        const isHero=!!img.closest('.hero-slide-media, .hero-media');
        // Internal hero markup uses page-hero-media on some pages.
        const topImage=isHero || (src && /\/hero-[^/]+\.webp$/.test(src));
        if(topImage && !hero) { hero=img; img.loading='eager';img.setAttribute('fetchpriority','high'); }
        else if(!img.closest('.site-header') && !src?.includes('logo-ideamos')) { img.loading='lazy'; }
        if(responsive[src]) { img.srcset=responsive[src]; img.sizes=topImage ? '100vw' : '(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 620px'; }
        if(topImage && img!==hero && img.closest('[data-hero-slide]')) {
          img.dataset.src=src;img.removeAttribute('src');
          if(img.srcset) {img.dataset.srcset=img.srcset;img.removeAttribute('srcset');}
        }
      }
      if (hero) {
        const preload=document.createElement('link');preload.rel='preload';preload.as='image';preload.href=hero.getAttribute('src');preload.setAttribute('fetchpriority','high');
        if(hero.srcset){preload.setAttribute('imagesrcset',hero.srcset);preload.setAttribute('imagesizes',hero.sizes);}
        document.head.append(preload);
      }
      if(file==='404.html') {
        document.querySelectorAll('[src],[href]').forEach(el=>{for(const a of ['src','href']){const v=el.getAttribute(a);if(v && /^(assets\/|styles\.css|script\.js|[a-z-]+\.html|\.\/)/.test(v))el.setAttribute(a,'/'+v.replace(/^\.\//,''));}});
        return { html:document.documentElement.outerHTML, schema:null };
      }
      const canonical=document.querySelector('link[rel="canonical"]').getAttribute('href');
      const description=document.querySelector('meta[name="description"]').content;
      const name=document.title.replace(/\s*\| HVAC PROF$/,'');
      const graph=[org,{'@type':'WebSite','@id':'https://hvacprof.com.ar/#website',url:'https://hvacprof.com.ar/',name:'HVAC PROF',inLanguage:'es-AR',publisher:{'@id':org['@id']}},{'@type':file==='contacto.html'?'ContactPage':file==='nosotros.html'?'AboutPage':'WebPage','@id':canonical+'#webpage',url:canonical,name,description,inLanguage:'es-AR',isPartOf:{'@id':'https://hvacprof.com.ar/#website'},about:{'@id':org['@id']}}];
      if(file!=='index.html') graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:'https://hvacprof.com.ar/'},{'@type':'ListItem',position:2,name,item:canonical}]});
      if(['servicios.html','diseno-fabricacion-computarizada.html','piezas-especiales.html'].includes(file))graph.push({'@type':'Service','@id':canonical+'#service',url:canonical,name,description,provider:{'@id':org['@id']}});
      const schema=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
      const el=document.createElement('script');el.type='application/ld+json';el.setAttribute('data-seo-schema','');el.textContent=schema;document.head.append(el);
      const robots=document.createElement('meta');robots.name='robots';robots.content='index, follow, max-image-preview:large';document.head.append(robots);
      const llms=document.createElement('link');llms.rel='alternate';llms.type='text/plain';llms.href='/llms.txt';llms.title='Información de HVAC PROF para asistentes';document.head.append(llms);
      return { html:document.documentElement.outerHTML,schema,name,description,canonical };
    }, { metadata, responsive, title:titles[file], file, org });
    fs.writeFileSync(file, '<!DOCTYPE html>\n<!-- Sitio desarrollado por Estudio Ideamos | https://ideamos.com.ar -->\n'+data.html+'\n');
    if(data.schema){hashes.push("'sha256-"+createHash('sha256').update(data.schema).digest('base64')+"'");summaries.push(data);}
  }
} finally {await browser.close();}
fs.writeFileSync('.audit/schema-hashes.json',JSON.stringify(hashes));
fs.writeFileSync('llms.txt', '# HVAC PROF\n\n> Fabricación y montaje de conductos de aire acondicionado, ventilación y extracción.\n\n## Empresa y contacto\n\nHVAC PROF tiene su ubicación en Quilmes, provincia de Buenos Aires, Argentina. Ofrece fabricación propia, montaje de conductos, piezas estándares y especiales, sistemas de unión e insumos de montaje.\n\n- Sitio oficial: https://hvacprof.com.ar/\n- Email: info@hvacprof.com.ar\n- WhatsApp: +54 9 11 2511 2777\n- Los presupuestos y las especificaciones se confirman mediante consulta técnica.\n\n## Páginas\n\n'+summaries.map(p=>`- [${p.name}](${p.canonical}): ${p.description}`).join('\n')+'\n');
// The sitemap omits speculative lastmod dates; update dates only after verified content changes.
fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+summaries.map(p=>`  <url><loc>${p.canonical}</loc></url>`).join('\n')+'\n</urlset>\n');
console.log(JSON.stringify({pages:summaries.length,fonts:fontFiles.size,responsiveImages:Object.keys(responsive).length}));
