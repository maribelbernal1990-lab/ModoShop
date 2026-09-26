import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec=promisify(execFile);
const root=process.cwd();
const theme=path.join(root,'theme');
const dist=path.join(root,'dist');
const legacy='https://55d7d1a6652f926b7952058d16423d301a086ff6--gleaming-brigadeiros-c260a9.netlify.app';

await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});

async function copyTree(from,to){
  await fs.mkdir(to,{recursive:true});
  for(const entry of await fs.readdir(from,{withFileTypes:true})){
    if(entry.name==='README.md')continue;
    const src=path.join(from,entry.name);
    const dst=path.join(to,entry.name);
    if(entry.isDirectory())await copyTree(src,dst);
    else await fs.copyFile(src,dst);
  }
}

await copyTree(path.join(theme,'templates'),dist);
await copyTree(path.join(theme,'assets'),path.join(dist,'assets'));
await fs.copyFile(path.join(theme,'data','catalog-fallback.json'),path.join(dist,'assets','catalog-data.json'));

const required=[
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
for(const [remotePath,localPath] of required){
 const target=path.join(dist,localPath);
 try{await fs.access(target);continue}catch{}
 await fs.mkdir(path.dirname(target),{recursive:true});
 await exec('curl',['-fsSL','--retry','3','--connect-timeout','15',legacy+'/assets/'+remotePath,'-o',target]);
}

const scripts={
 'index.html':['media.js','catalog-client.js','rate-client.js','reviews.js','storefront.js'],
 'producto.html':['media.js','catalog-client.js','rate-client.js','reviews.js','product-page.js'],
 'admin.html':['admin.js'],
 'seguimiento.html':['tracking.js'],
 'success.html':['success.js']
};
for(const [page,assets] of Object.entries(scripts)){
 const file=path.join(dist,page);
 let html=await fs.readFile(file,'utf8');
 html=html.replace(/<link rel="stylesheet" href="assets\/css\/[^"]+"\s*\/?>/i,'');
 const css=page==='index.html'?'storefront.css':page==='producto.html'?'product.css':page==='admin.html'?'admin.css':page==='seguimiento.html'?'tracking.css':page==='success.html'?'success.css':'legal.css';
 html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/'+css+'">\n</head>');
 html=html.replace(/<script[^>]*src=["']assets\/js\/[^"']+["'][^>]*>\s*<\/script>/gi,'');
 html=html.replace('</body>',assets.map(name=>'<script src="/assets/js/'+name+'" defer></script>').join('')+'\n</body>');
 await fs.writeFile(file,html,'utf8');
}
console.log('ModoShop 3.0 build complete');
