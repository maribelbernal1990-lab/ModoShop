import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const theme=path.join(root,'theme');
const dist=path.join(root,'dist');

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
  const css=page==='index.html'?'storefront.css':page==='producto.html'?'product.css':page==='admin.html'?'admin.css':page==='seguimiento.html'?'tracking.css':page==='success.html'?'success.css':'legal.css';
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/'+css+'">\n</head>');
  html=html.replace(/<script[^>]*src=["']assets\/js\/[^"']+["'][^>]*>\s*<\/script>/gi,'');
  html=html.replace('</body>',assets.map(name=>'<script src="/assets/js/'+name+'" defer></script>').join('')+'\n</body>');
  await fs.writeFile(file,html);
}

console.log('ModoShop 3.0 build complete');
