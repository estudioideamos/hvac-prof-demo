// Use recognizable brand SVGs from Bootstrap Icons, served locally.
import fs from 'node:fs';
fs.mkdirSync('assets/icons', {recursive:true});
for (const name of ['instagram','linkedin','whatsapp']) {
  const response = await fetch(`https://raw.githubusercontent.com/twbs/icons/v1.13.1/icons/${name}.svg`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  const svg = await response.text();
  if (!svg.includes('<svg')) throw new Error(`Invalid SVG: ${name}`);
  fs.writeFileSync(`assets/icons/${name}.svg`, svg);
  for (const file of fs.readdirSync('.').filter(file => file.endsWith('.html'))) {
    let html = fs.readFileSync(file, 'utf8');
    const label = name === 'linkedin' ? 'LinkedIn' : name === 'whatsapp' ? 'WhatsApp' : 'Instagram';
    const pattern = new RegExp(`(<a class="footer-social"[^>]*title="${label}"[^>]*>)[\\s\\S]*?(</a>)`, 'g');
    html = html.replace(pattern, `$1\n              ${svg.replace(/<svg[^>]*>/, '<svg viewBox="0 0 16 16" aria-hidden="true" class="brand-icon">')}\n            $2`);
    fs.writeFileSync(file, html);
  }
}
const license = await fetch('https://raw.githubusercontent.com/twbs/icons/v1.13.1/LICENSE');
if (!license.ok) throw new Error('License download failed');
fs.writeFileSync('assets/icons/LICENSE.txt', await license.text());
