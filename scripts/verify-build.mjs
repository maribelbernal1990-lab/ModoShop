import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const requiredPages=['index.html','producto.html','admin.html','seguimiento.html','success.html','legal.html'];
const requiredFunctions=['admin-login','catalog','create-order','track-order','reviews','admin-catalog','admin-settings','admin-upload'];
const requiredAssets=[
  'logo.webp','hero-family.webp','hero-tech.webp',
  'products/masajeador-mini.webp','products/radios-bf888s.webp','products/timbre-camara-wifi.webp',
  'products/bandolero-usb.webp','products/microfono-v8.webp','products/plancha-vapor-raf.webp',
  'products/tensiometro-brazalete.webp','products/camara-bombillo-360.webp','products/camara-dual-6mp.webp',
  'products/licuadora-portatil.webp'
];
for(const page of requiredPages){
  const html=await fs.readFile(path.join(root,'dist',page),'utf8');
  if(!html.startsWith('<!doctype html>'))throw new Error('Invalid HTML output: '+page);
  if(html.includes('55d7d1a6652f926b7952058d16423d301a086ff6'))throw new Error('Legacy asset host leaked into '+page);
}
for(const asset of requiredAssets)await fs.access(path.join(root,'dist','assets',asset));
for(const fn of requiredFunctions)await fs.access(path.join(root,'netlify','functions',fn+'.mjs'));
await fs.access(path.join(root,'dist','robots.txt'));
console.log('ModoShop build verification passed: pages, functions and local WebP assets are present.');