import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);

const root=process.cwd();
const theme=path.join(root,'theme');
const dist=path.join(root,'dist');
const base=process.env.PUBLIC_SITE_URL||'https://gleaming-brigadeiros-c260a9.netlify.app';

await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});

async function copyTree(from,to){
  await fs.mkdir(to,{recursive:true});
  for(const entry of await fs.readdir(from,{withFileTypes:true})){
    if(entry.name==='README.md') continue;
    const src=path.join(from,entry.name);
    const dst=path.join(to,entry.name);
    if(entry.isDirectory()) await copyTree(src,dst);
    else await fs.copyFile(src,dst);
  }
}

async function writeFile(rel,data){
  const file=path.join(dist,rel);
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,data);
}

function extractInline(html){
  const matches=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m=>!/\bsrc\s*=/.test(m[1])&&!/application\/ld\+json/i.test(m[1])&&m[2].trim());
  return matches.at(-1)?.[2]?.trim()||'';
}

const routeRuntime=[
  ['admin.html','admin.js'],
  ['seguimiento.html','tracking.js'],
];

await copyTree(path.join(theme,'templates'),dist);
await copyTree(path.join(theme,'assets'),path.join(dist,'assets'));
await fs.copyFile(path.join(theme,'data','catalog-fallback.json'),path.join(dist,'assets','catalog-data.json'));

for(const [page,runtime] of routeRuntime){
  const themeRuntime=path.join(theme,'assets','js',runtime);
  try{await fs.access(themeRuntime);continue}catch{}
  const html=await fs.readFile(path.join(root,page),'utf8');
  const code=extractInline(html);
  if(code) await writeFile('assets/js/'+runtime,code+'\n');
}

const requiredAssets=[
  ['logo.png','assets/logo.png'],
  ['hero-tech.png','assets/hero-tech.png'],
  ['hero-family.png','assets/hero-family.png'],
  ['products/bandolero-usb.jpg','assets/products/bandolero-usb.jpg'],
  ['products/camara-bombillo-360.jpg','assets/products/camara-bombillo-360.jpg'],
  ['products/camara-dual-6mp.jpg','assets/products/camara-dual-6mp.jpg'],
  ['products/licuadora-portatil.jpg','assets/products/licuadora-portatil.jpg'],
  ['products/masajeador-mini.jpg','assets/products/masajeador-mini.jpg'],
  ['products/microfono-v8.jpg','assets/products/microfono-v8.jpg'],
  ['products/plancha-vapor-raf.jpg','assets/products/plancha-vapor-raf.jpg'],
  ['products/radios-bf888s.jpg','assets/products/radios-bf888s.jpg'],
  ['products/tensiometro-brazalete.jpg','assets/products/tensiometro-brazalete.jpg'],
  ['products/timbre-camara-wifi.jpg','assets/products/timbre-camara-wifi.jpg'],
];

for(const [remotePath,localPath] of requiredAssets){
  const target=path.join(dist,localPath);
  try{await fs.access(target);continue}catch{}
  await fs.mkdir(path.dirname(target),{recursive:true});
  await exec('curl',['-fsSL','--retry','3','--connect-timeout','15',base+'/assets/'+remotePath,'-o',target]);
}

const scripts={
  'index.html':['catalog-client.js','rate-client.js','reviews.js','storefront.js'],
  'producto.html':['catalog-client.js','rate-client.js','reviews.js','product-page.js'],
  'admin.html':['admin.js'],
  'seguimiento.html':['tracking.js'],
  'success.html':['success.js'],
};

for(const [page,assets] of Object.entries(scripts)){
  const file=path.join(dist,page);
  let html=await fs.readFile(file,'utf8');
  html=html.replace(/<link rel="stylesheet" href="assets\/css\/[^"]+"\s*\/?>/i,'');
  const css=page==='index.html'?'storefront.css':
    page==='producto.html'?'product.css':
    page==='admin.html'?'admin.css':
    page==='seguimiento.html'?'tracking.css':
    page==='success.html'?'success.css':'legal.css';
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/'+css+'">\n</head>');
  html=html.replace(/<script[^>]*src=["']assets\/js\/[^"']+["'][^>]*>\s*<\/script>/gi,'');
  html=html.replace('</body>',assets.map(name=>'<script src="/assets/js/'+name+'" defer></script>').join('')+'\n</body>');
  await fs.writeFile(file,html);
}

console.log('ModoShop 3.0 build complete');
