// Produces a public-files-only ZIP. Development tools are never deployed.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const deps = process.env.HVAC_NODE_MODULES || path.resolve('node_modules');
const JSZip = require(path.join(deps, 'jszip'));
const digest = input=>createHash('sha256').update(input).digest('hex').slice(0,12);
const fonts=fs.readFileSync('assets/fonts/fonts.css','utf8').replaceAll('assets/fonts/','fonts/');
const css=fonts+'\n'+fs.readFileSync('styles.css','utf8');
const js=fs.readFileSync('script.js','utf8');
const cssPath=`assets/site.${digest(css)}.css`;
const jsPath=`assets/site.${digest(js)}.js`;
fs.writeFileSync(cssPath,css);fs.writeFileSync(jsPath,js);
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html'));
const hashes=[];
for(const file of pages){
  let html=fs.readFileSync(file,'utf8').replace(/[ \t]+$/gm, '');
  html=html.replace(/(?:\/)?(?:styles\.css|assets\/site\.[a-f0-9]+\.css)/g,(file==='404.html'?'/':'')+cssPath);
  html=html.replace(/(?:\/)?(?:script\.js|assets\/site\.[a-f0-9]+\.js)/g,(file==='404.html'?'/':'')+jsPath);
  const schema=html.match(/<script type="application\/ld\+json" data-seo-schema="">([\s\S]*?)<\/script>/)?.[1];
  if(schema) hashes.push("'sha256-"+createHash('sha256').update(schema).digest('base64')+"'");
  fs.writeFileSync(file,html);
}
let htaccess=fs.readFileSync('.htaccess','utf8');
const csp="default-src 'self'; script-src 'self' "+hashes.join(' ')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; frame-ancestors 'none'; manifest-src 'self'; upgrade-insecure-requests";
htaccess=htaccess.replace(/Header always set Content-Security-Policy "[^"]*"/,`Header always set Content-Security-Policy "${csp}"`);
fs.writeFileSync('.htaccess',htaccess);
const zip=new JSZip();
const added=new Set();
function add(file){
  file=file.replaceAll('\\','/');if(added.has(file))return;
  if(!fs.existsSync(file))throw new Error('Missing release file: '+file);
  zip.file(file,fs.readFileSync(file));added.add(file);
}
for(const file of [...pages,'.htaccess','enviar-contacto.php','robots.txt','sitemap.xml','llms.txt',cssPath,jsPath,'assets/site.webmanifest'])add(file);
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/(?:src|href|data-src)="\/?(assets\/[^"?#]+)"/g))add(match[1]);
  for(const match of html.matchAll(/(?:srcset|data-srcset|imagesrcset)="([^"]+)"/g))for(const candidate of match[1].split(','))add(candidate.trim().split(/\s+/)[0]);
}
for(const m of css.matchAll(/url\((?:['"])?(fonts\/[^)'" ]+)/g))add('assets/'+m[1]);
for(const f of fs.readdirSync('assets/fonts').filter(f=>f.endsWith('OFL.txt')))add('assets/fonts/'+f);
for(const icon of JSON.parse(fs.readFileSync('assets/site.webmanifest','utf8')).icons || [])add('assets/'+icon.src.replace(/^\.\//,''));
add('assets/images/og-hvacprof.jpg');
add('assets/icons/LICENSE.txt');
const output='HVAC-PROF-public_html-optimizado.zip';
await fs.promises.writeFile(output,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:9}}));
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,files:added.size,css:cssPath,js:jsPath}));
