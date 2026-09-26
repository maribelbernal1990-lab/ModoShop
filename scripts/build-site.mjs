import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import * as esbuild from 'esbuild';

const exec=promisify(execFile);
const root=process.cwd(), theme=path.join(root,'theme'), dist=path.join(root,'dist');
const assetOrigin=(process.env.MODOSHOP_ASSET_ORIGIN||'https://gleaming-brigadeiros-c260a9.netlify.app').replace(/\/$/,'');
const layout=await fs.readFile(path.join(theme,'layout','theme.html'),'utf8');

async function copyTree(from,to){await fs.mkdir(to,{recursive:true});for(const e of await fs.readdir(from,{withFileTypes:true})){if(e.name==='README.md')continue;const s=path.join(from,e.name),d=path.join(to,e.name);if(e.isDirectory())await copyTree(s,d);else await fs.copyFile(s,d)}}
const read=rel=>fs.readFile(path.join(theme,rel),'utf8');
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const route=v=>'/'+String(v||'').replace(/^\/+/,'');

await fs.rm(dist,{recursive:true,force:true});
await copyTree(path.join(theme,'assets'),path.join(dist,'assets'));
await fs.copyFile(path.join(theme,'data','catalog-fallback.json'),path.join(dist,'assets','catalog-data.json'));

const required=['logo.png','hero-tech.png','hero-family.png','products/bandolero-usb.jpg','products/camara-bombillo-360.jpg','products/camara-dual-6mp.jpg','products/licuadora-portatil.jpg','products/masajeador-mini.jpg','products/microfono-v8.jpg','products/plancha-vapor-raf.jpg','products/radios-bf888s.jpg','products/tensiometro-brazalete.jpg','products/timbre-camara-wifi.jpg'];
for(const rel of required){const target=path.join(dist,'assets',rel);try{await fs.access(target)}catch{await fs.mkdir(path.dirname(target),{recursive:true});await exec('curl',['-fsSL','--retry','3','--connect-timeout','15',assetOrigin+'/assets/'+rel,'-o',target])}}

const images=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(png|jpe?g)$/i.test(e.name))images.push(p)}}
await walk(path.join(dist,'assets'));
for(const file of images){const ext=path.extname(file),webp=file.slice(0,-ext.length)+'.webp';try{const meta=await sharp(file,{failOn:'none'}).metadata();await sharp(file,{failOn:'none'}).rotate().resize({width:Math.min(Number(meta.width||1600),1600),withoutEnlargement:true}).webp({quality:82}).toFile(webp+'.tmp');await fs.rename(webp+'.tmp',webp)}catch{}}

const textExt=/\.(html|css|js|json|mjs)$/i;
async function rewrite(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await rewrite(p);else if(textExt.test(e.name)){let s=await fs.readFile(p,'utf8');s=s.replace(/(assets\/[^"'\s)<>]+)\.(png|jpe?g)(?=["'\s)<>])/gi,'$1.webp');await fs.writeFile(p,s,'utf8')}}}
await rewrite(dist);

for(const file of await fs.readdir(path.join(dist,'assets','css'))){if(file.endsWith('.css')){const p=path.join(dist,'assets','css',file),s=await fs.readFile(p,'utf8'),o=await esbuild.transform(s,{loader:'css',minify:true,legalComments:'none'});await fs.writeFile(p,o.code,'utf8')}}
for(const file of await fs.readdir(path.join(dist,'assets','js'))){if(file.endsWith('.js')){const p=path.join(dist,'assets','js',file),s=await fs.readFile(p,'utf8'),o=await esbuild.transform(s,{loader:'js',minify:true,legalComments:'none',target:'es2020'});await fs.writeFile(p,o.code,'utf8')}}

const manifests=(await fs.readdir(path.join(theme,'templates'))).filter(x=>x.endsWith('.json'));
async function part(rel){return rel?await read(rel):''}
function head(m){
 const font=m.font||'Poppins:wght@400;500;600;700;800';
 const preload=(m.preload||[]).map(x=>'<link rel="preload" as="image" href="'+route(x)+'" fetchpriority="high">').join('');
 return '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="'+esc(m.themeColor||'#111318')+'"><meta name="description" content="'+esc(m.description||'')+'"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family='+font+'&display=swap" rel="stylesheet"><title>'+esc(m.title||'ModoShop Venezuela')+'</title>'+preload+'<link rel="stylesheet" href="/assets/css/'+esc(m.css)+'">';
}
for(const file of manifests){
 const m=JSON.parse(await fs.readFile(path.join(theme,'templates',file),'utf8'));
 const header=await part(m.header&&'snippets/'+m.header);
 const content=await Promise.all((m.content||[]).map(x=>part('sections/'+x)));
 const footer=await part(m.footer&&'snippets/'+m.footer);
 const overlays=await part(m.overlays&&'snippets/'+m.overlays);
 const scripts=(m.scripts||[]).map(x=>'<script src="/assets/js/'+x+'" defer></script>').join('');
 let html=layout.replace('{{HEAD}}',head(m)).replace('{{HEADER}}','').replace('{{CONTENT}}',header+content.join('')).replace('{{FOOTER}}',footer).replace('{{OVERLAYS}}',overlays).replace('{{SCRIPTS}}',scripts);
 await fs.writeFile(path.join(dist,m.output),html.replace(/<base href="[^"]*">/gi,'').replace(/\n\s*\n/g,'\n'),'utf8');
}
await rewrite(dist);
console.log('ModoShop theme build complete');
