import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const theme=path.join(root,'theme');
const dist=path.join(root,'dist');
const siteBase=process.env.PUBLIC_SITE_URL||'https://gleaming-brigadeiros-c260a9.netlify.app';

await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});
async function copyTree(from,to){await fs.mkdir(to,{recursive:true});for(const e of await fs.readdir(from,{withFileTypes:true})){if(e.name==='README.md')continue;const a=path.join(from,e.name),b=path.join(to,e.name);if(e.isDirectory())await copyTree(a,b);else await fs.copyFile(a,b);}}
async function write(rel,value){const f=path.join(dist,rel);await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,value);}
async function fetchText(url){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r.text();}
function extractInlineScript(html){const ms=[...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)].filter(m=>!/\\bsrc\\s*=|\\btype=["']application\\/ld\\+json/i.test(m[1])&&m[2].trim());return (ms.at(-1)?.[2]||'').trim();}
function normalize(html){return html.replace(/\\n?\\s*<script[^>]*src=["']assets\\/js\\/[^"']+["'][^>]*><\\/script>/gi,'').replace(/href=["']index\\.html#productos["']/g,'href="/#productos"').replace(/href=["']index\\.html["']/g,'href="/"').replace(/href=["']admin\\.html["']/g,'href="/admin.html"').replace(/href=["']seguimiento\\.html["']/g,'href="/track"').replace(/producto\\.html\\?id=/g,'/products/');}

await copyTree(path.join(theme,'templates'),dist);
await copyTree(path.join(theme,'assets','css'),path.join(dist,'assets','css'));
await copyTree(path.join(theme,'assets','js'),path.join(dist,'assets','js'));
await fs.copyFile(path.join(theme,'data','catalog-fallback.json'),path.join(dist,'assets','catalog-data.json'));

for(const name of ['index.html','admin.html','seguimiento.html','success.html']){const source=await fs.readFile(path.join(root,name),'utf8');const runtime=extractInlineScript(source);if(runtime){const runtimeName=name==='index.html'?'storefront.js':name==='admin.html'?'admin.js':name==='seguimiento.html'?'tracking.js':'success.js';await write('assets/js/'+runtimeName,runtime+'\\n');}}

let productPage='';try{productPage=await fetchText(siteBase+'/assets/product-page.js');}catch{}
if(productPage){productPage=productPage.replace(/^let products = window\\.MODO_DEFAULT_PRODUCTS \\|\\| \\[\\];/m,'let products=[];');productPage=productPage.replace(/fetch\\('https:\\/\\/bcv\\.today\\/api\\/v1\\/rate\\.json',[^;]+;/g,'fetch(\\'/api/rate\\',{cache:\\'default\\'});');productPage=productPage.replace(/const flyer = `assets\\/flyers\\/\\$\\{product\\.id\\}-flyer\\.jpg`;\\n?/g,'');productPage=productPage.replace(/href=\\"producto\\.html\\?id=\\$\\{encodeURIComponent\\(item\\.id\\)\\}\\"/g,'href=\\"\\/products\\/\\${encodeURIComponent(item.id)}\\"');productPage=productPage.replace(/\\s*<div class=\\"card flyerCard\\">[\\s\\S]*?<\\/div>\\s*<\\/section>/,'\\n      <\\/section>');await write('assets/js/product-page.js',productPage+'\\n');}

const originals=['bandolero-usb.jpg','camara-bombillo-360.jpg','camara-dual-6mp.jpg','licuadora-portatil.jpg','masajeador-mini.jpg','microfono-v8.jpg','plancha-vapor-raf.jpg','radios-bf888s.jpg','tensiometro-brazalete.jpg','timbre-camara-wifi.jpg'];
for(const name of originals){const target=path.join(dist,'assets','products',name);await fs.mkdir(path.dirname(target),{recursive:true});try{await fs.access(target);continue}catch{}const r=await fetch(siteBase+'/assets/products/'+name);if(!r.ok)throw new Error('Unable to fetch '+name);await fs.writeFile(target,Buffer.from(await r.arrayBuffer()));}

const scripts={
 'index.html':['catalog-client.js','rate-client.js','reviews.js','media.js','storefront.js'],
 'producto.html':['catalog-client.js','rate-client.js','reviews.js','media.js','product-page.js'],
 'admin.html':['admin.js'],
 'seguimiento.html':['tracking.js'],
 'success.html':['success.js'],
};
for(const [name,list] of Object.entries(scripts)){const f=path.join(dist,name);let html=normalize(await fs.readFile(f,'utf8'));const css=name==='index.html'?'storefront.css':name==='producto.html'?'product.css':name==='admin.html'?'admin.css':name==='seguimiento.html'?'tracking.css':name==='success.html'?'success.css':'legal.css';html=html.replace(/<link rel=\"stylesheet\" href=\"assets\\/css\\/[^\"]+\">/i,'');html=html.replace('</head>','<link rel=\"stylesheet\" href=\"/assets/css/'+css+'\">\\n</head>');html=html.replace('</body>',list.map(src=>'<script src=\"/'+('assets/js/'+src)+'\" defer></script>').join('')+'\\n</body>');await fs.writeFile(f,html);}

console.log('ModoShop theme build complete');