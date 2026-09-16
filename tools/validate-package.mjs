import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const deps=process.env.HVAC_NODE_MODULES || path.resolve('node_modules');
const JSZip=require(path.join(deps,'jszip'));
const filename='HVAC-PROF-public_html-optimizado.zip';
const zip=await JSZip.loadAsync(fs.readFileSync(filename));
const names=Object.keys(zip.files).filter(n=>!zip.files[n].dir);
if(names.some(n=>/^(tools|\.audit|\.git)\//.test(n)||/\.(zip|pem|key|wpress|md|mjs|ps1)$/.test(n)))throw Error('Private file in archive');
const csp=await zip.file('.htaccess').async('string');
for(const n of names.filter(n=>n.endsWith('.html'))){
  const html=await zip.file(n).async('string');
  if((html.match(/<h1[ >]/g)||[]).length!==1)throw Error('Heading '+n);
  for(const match of html.matchAll(/(?:src|href|data-src)="([^"]+)"/g)){
    const p=match[1].split(/[?#]/)[0].replace(/^\//,'');
    if(!p||p==='.'||p==='./'||/^[a-z]+:/i.test(p))continue;
    if(!zip.file(p))throw Error('Missing '+p+' in '+n);
  }
  for(const match of html.matchAll(/(?:srcset|data-srcset|imagesrcset)="([^"]+)"/g))for(const candidate of match[1].split(','))if(!zip.file(candidate.trim().split(/\s+/)[0]))throw Error('Missing responsive image');
  const json=html.match(/<script type="application\/ld\+json" data-seo-schema="">([\s\S]*?)<\/script>/)?.[1];
  if(json){JSON.parse(json);if(!csp.includes(createHash('sha256').update(json).digest('base64')))throw Error('CSP mismatch '+n);}
}
console.log(JSON.stringify({files:names.length,pages:names.filter(n=>n.endsWith('.html')).length,archiveBytes:fs.statSync(filename).size,localLinks:'valid',schemaHashes:'valid',privateFiles:'excluded'}));
