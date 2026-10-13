// Custom HVAC pictograms. Shared geometry keeps the site consistent without a runtime library.
import fs from 'node:fs';

const drawings = {
  duct: '<path class="icon-surface" d="M4 13 18 5l10 6v14l-14 7-10-6Z"/><path d="M4 13 18 5l10 6v14l-14 7-10-6Zm0 0 10 6 14-8M14 19v13"/><path d="m7 18 4 2.5v6L7 24Z"/><path class="icon-detail" d="m13 8 10 6v13"/>',
  install: '<path class="icon-detail" d="M3 4h26M8 4v9M24 4v9"/><rect class="icon-surface" x="4" y="13" width="24" height="11" rx="2"/><path d="M4 24h24M10 13v11M22 13v11M7 27h18M7 25v4M25 25v4"/>',
  elbow: '<path class="icon-surface" d="M5 5h10v7a5 5 0 0 0 5 5h7v10h-7A15 15 0 0 1 5 12Z"/><path d="M5 5h10v7a5 5 0 0 0 5 5h7v10h-7A15 15 0 0 1 5 12ZM3 5h14M27 15v14"/><path class="icon-detail" d="m7 19 7-6m0 13 5-9"/>',
  cad: '<rect class="icon-surface" x="3" y="4" width="26" height="20" rx="2"/><path d="M3 20h26M12 29h8m-4-5v5"/><path d="m11 10 5-3 5 3v6l-5 3-5-3Zm0 0 5 3 5-3m-5 3v6"/>',
  blueprint: '<path class="icon-surface" d="M6 3h15l5 5v21H6Z"/><path d="M21 3v6h5M10 13h12v9H10Zm4 0v9M10 26h8"/><path class="icon-detail" d="M10 7h6"/>',
  plasma: '<path class="icon-surface" d="M12 3h8v10l-4 5-4-5Z"/><path d="M12 3h8v10l-4 5-4-5ZM8 3h16M3 28h26M16 21v3m-6-6-3 3m15-3 3 3"/><path class="icon-detail" d="M5 25h6m10 0h6"/>',
  clock: '<circle class="icon-surface" cx="16" cy="17" r="11"/><path d="M16 10v7l5 3M12 2h8m-4 0v4m9 1 3 3"/>',
  repeat: '<rect class="icon-surface" x="4" y="12" width="9" height="10" rx="1"/><rect class="icon-surface" x="19" y="12" width="9" height="10" rx="1"/><path d="M7 7h17l-3-3m3 3-3 3M25 27H8l3-3m-3 3 3 3"/>',
  measure: '<path class="icon-surface" d="M5 4h7v16h16v8H5Z"/><path d="M5 4h7v16h16v8H5ZM5 10h3m-3 5h3m-3 5h3m9 0v4m5-4v4"/>',
  sheet: '<rect class="icon-surface" x="4" y="4" width="24" height="24" rx="2"/><path d="M4 14h15V4M14 14v14m5-14h9M19 4v10"/><path class="icon-detail" d="m18 23 3 3 5-6"/>',
  hospital: '<path class="icon-surface" d="M5 11h22v18H5Z"/><path d="M5 11h22v18H5ZM12 29v-7h8v7M16 3v12m-6-6h12"/><path class="icon-detail" d="M9 17h2m10 0h2"/>',
  building: '<path class="icon-surface" d="M7 4h18v25H7Z"/><path d="M7 4h18v25H7ZM13 29v-6h6v6M11 9h2m6 0h2m-10 5h2m6 0h2m-10 5h2m6 0h2"/>',
  factory: '<path class="icon-surface" d="M3 29V15l9-5v7l9-5v17Z"/><path d="M3 29V15l9-5v7l9-5v17ZM21 29h8L27 3h-5l-1 13M7 23h2m7 0h2m7 0h1"/>',
  shop: '<path class="icon-surface" d="M5 14h22v15H5Z"/><path d="M5 14v15h22V14M3 10l3-6h20l3 6v3c-2 3-5 3-7 0-2 3-5 3-7 0-2 3-5 3-7 0-2 3-4 2-5 0Zm9 19V19h8v10"/>',
  bolt: '<path class="icon-surface" d="m10 3 12 0 4 6-4 6H10L6 9Z"/><path d="m10 3 12 0 4 6-4 6H10L6 9ZM13 15v14h6V15M12 20h8m-8 4h8m-8 4h8"/><path class="icon-detail" d="M12 9h8"/>',
  gasket: '<rect class="icon-surface" x="4" y="4" width="24" height="24" rx="3"/><rect x="9" y="9" width="14" height="14" rx="1"/><path class="icon-detail" d="M4 10h5m14 12h5"/>',
  corner: '<path class="icon-surface" d="M5 4h23v8H13v16H5Z"/><path d="M5 4h23v8H13v16H5Z"/><circle cx="9" cy="8" r="1"/><circle cx="23" cy="8" r="1"/><circle cx="9" cy="23" r="1"/>',
  joint: '<path class="icon-surface" d="M3 9h10v14H3m26-14H19v14h10"/><path d="M3 9h10v14H3m26-14H19v14h10M13 5v22m6-22v22M10 5h12M10 27h12"/><path class="icon-detail" d="M16 10v12"/>',
  zeta: '<path d="M3 8h17v16h9M3 12h13v16h13M23 4v15h6"/><path class="icon-detail" d="m9 21-4 4m0-4v4h4"/>',
  flexible: '<path class="icon-surface" d="M4 7h24v18H4Z"/><path d="M4 7h5v18H4Zm19 0h5v18h-5M10 8l3 3-3 5 3 5-3 3m6-16 3 3-3 5 3 5-3 3"/>',
  support: '<path class="icon-surface" d="M5 4h5v20h18v5H5Z"/><path d="M5 4h5v20h18v5H5ZM10 8l16 16"/><path class="icon-detail" d="M5 10h3m-3 8h3m9 6v3"/>',
  tape: '<ellipse class="icon-surface" cx="13" cy="12" rx="9" ry="8"/><ellipse cx="13" cy="12" rx="4" ry="3"/><path d="M4 12v10c0 4 4 7 9 7h14V18H13m9-6v6"/>',
  medal: '<circle class="icon-surface" cx="16" cy="12" r="9"/><path d="m10 20-2 10 8-4 8 4-2-10m-10-8 3 3 6-6"/>',
  shield: '<path class="icon-surface" d="m16 3 11 4v9c0 6-5 10-11 13C10 26 5 22 5 16V7Z"/><path d="m11 16 4 4 7-8"/>',
  target: '<circle class="icon-surface" cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5"/><path d="M16 2v5m0 18v5M2 16h5m18 0h5"/>',
  delivery: '<path class="icon-surface" d="M3 7h17v17H3Z"/><path d="M20 13h5l4 5v6h-9M20 18h9M3 7h17v17H3Z"/><circle cx="8" cy="25" r="3"/><circle cx="24" cy="25" r="3"/>',
  materials: '<path class="icon-surface" d="m3 10 13-7 13 7-13 7Z"/><path d="m3 10 13-7 13 7-13 7Zm0 6 13 7 13-7M3 22l13 7 13-7"/>',
  airflow: '<path class="icon-surface" d="M4 5h10v22H4Z"/><path d="M4 5h10v22H4ZM18 10h11m-3-3 3 3-3 3M18 22h11m-3-3 3 3-3 3"/>',
  compact: '<rect class="icon-surface" x="11" y="9" width="10" height="14" rx="1"/><path d="M3 4v24m26-24v24M3 16h5m-3-3 3 3-3 3m24-3h-5m3-3-3 3 3 3"/>',
  refresh: '<path d="M27 13a11 11 0 0 0-20-5L4 12m0-7v7h7M5 19a11 11 0 0 0 20 5l3-4m0 7v-7h-7"/>',
};

const byLabel = {
  'Fabricación de conductos': 'duct', 'Montaje de conductos': 'install',
  'Piezas y accesorios especiales': 'elbow', 'Diseño y fabricación computarizada': 'cad',
  'CAD y CAM3D': 'cad', 'Corte CNC por plasma': 'plasma', 'CNC por plasma': 'plasma',
  'Menos tiempo improductivo': 'clock', 'Menos tiempos muertos': 'clock',
  '1. Interpretación digital': 'blueprint', '2. Desarrollo y corte': 'plasma',
  '3. Fabricación repetible': 'repeat', 'Series consistentes': 'repeat',
  'Precisión dimensional': 'measure', 'Mejor uso del material': 'sheet',
  'Instalaciones farmacéuticas y hospitalarias': 'hospital', 'Farmacéutico y hospitalario': 'hospital', 'Industria crítica': 'hospital',
  'Edificios de oficina y viviendas': 'building', 'Confort': 'building',
  'Aplicaciones industriales': 'factory', 'Industrial': 'factory', 'Locales comerciales': 'shop',
  'Fijación y sellado': 'bolt', 'Sistemas de unión': 'joint', 'Soporte y remate': 'support',
  'Bulones c/tuerca para esquineros TDC': 'bolt', 'Burletes media caña de alta densidad': 'gasket',
  'Esquineros para sistemas TDC': 'corner', 'Zetas y correderas': 'zeta', 'Collares flexibles': 'flexible',
  'Ménsulas y perfiles (con varillas y brocas)': 'support', 'Cinta aluminizada autoadhesiva': 'tape',
  '15 años': 'medal', 'Fabricación propia': 'factory', 'Solución completa': 'shield',
  'Plano y despiece': 'blueprint', 'Resolución puntual': 'target', 'Fabricación precisa': 'measure',
  '1. Recepción del plano': 'blueprint', '2. Validación técnica': 'shield', '3. Producción y entrega': 'delivery',
  'Rectangulares y circulares': 'duct', 'Cambios y derivaciones': 'elbow', 'Varios materiales': 'materials',
  'Materiales': 'materials', 'Pedidos a medida': 'measure', 'Optimización de recursos': 'sheet',
  'Replanteos inmediatos': 'refresh', 'Montaje garantizado': 'shield', 'Engrame firme': 'joint',
  'Montaje práctico': 'install', 'Sellado recomendado': 'tape', 'Burlete perimetral': 'gasket',
  'Esquineros abulonados': 'corner', 'Montaje simple': 'install', 'Recubrimientos': 'materials', 'Espacios acotados': 'compact',
};

let count = 0;
for (const file of fs.readdirSync('.').filter(file => file.endsWith('.html'))) {
  const source = fs.readFileSync(file, 'utf8');
  const updated = source.replace(/<span class="(preview-icon|mini-icon|hero-aside-icon|strip-icon)"[^>]*>[\s\S]*?<\/span>/g, (original, type, offset) => {
    const after = source.slice(offset + original.length, offset + original.length + 400);
    const label = after.match(/<(?:strong|h3)\b[^>]*>([\s\S]*?)<\/(?:strong|h3)>/)?.[1].replace(/<[^>]+>/g, '').trim();
    const name = byLabel[label];
    // Contact and official social-brand icons are intentionally preserved.
    if (!name) {
      if (file !== 'contacto.html') throw new Error(`Unmapped icon: ${file}: ${label}`);
      return original;
    }
    count++;
    return `<span class="${type}" aria-hidden="true"><svg class="hvac-icon" data-icon="${name}" viewBox="0 0 36 36" aria-hidden="true" focusable="false"><g transform="translate(2 1)">${drawings[name]}</g></svg></span>`;
  });
  if (updated !== source) fs.writeFileSync(file, updated);
}
console.log(`Updated ${count} custom HVAC pictograms.`);
