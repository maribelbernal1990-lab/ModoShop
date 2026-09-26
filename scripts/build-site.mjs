import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import * as esbuild from 'esbuild';

const root=process.cwd();
const theme=path.join(root,'theme');
const dist=path.join(root,'dist');
const layout=await fs.readFile(path.join(theme,'layout','theme.html'),'utf8');
const mediaPack=path.join(theme,'media','source-images.zip');
const tmpMedia=path.join(root,'.modoshop-media-build');
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function copyTree(from,to){
  await fs.mkdir(to,{recursive:true});
  for(const e of await fs.readdir(from,{withFileTypes:true})){
    if(e.name==='README.md')continue;
    const s=path.join(from,e.name),d=path.join(to,e.name);
    if(e.isDirectory())await copyTree(s,d);else await fs.copyFile(s,d);
  }
}
const readTheme=rel=>fs.readFile(path.join(theme,rel),'utf8');

await fs.rm(dist,{recursive:true,force:true});
await fs.rm(tmpMedia,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});
await fs.mkdir(tmpMedia,{recursive:true});
await copyTree(path.join(theme,'assets'),path.join(dist,'assets'));

new AdmZip(mediaPack).extractAllTo(tmpMedia,true);
const srcRoot=path.join(tmpMedia,'assets');

const imagePlan=[
  ['logo.webp','logo.webp',512],
  ['hero-family.webp','hero-family.webp',1400],
  ['hero-tech.webp','hero-tech.webp',1400],
  ['products/masajeador-mini.webp','products/masajeador-mini.webp',900],
  ['products/radios-bf888s.webp','products/radios-bf888s.webp',900],
  ['products/timbre-camara-wifi.webp','products/timbre-camara-wifi.webp',900],
  ['products/bandolero-usb.webp','products/bandolero-usb.webp',900],
  ['products/microfono-v8.webp','products/microfono-v8.webp',900],
  ['products/plancha-vapor-raf.webp','products/plancha-vapor-raf.webp',900],
  ['products/tensiometro-brazalete.webp','products/tensiometro-brazalete.webp',900],
  ['products/camara-bombillo-360.webp','products/camara-bombillo-360.webp',900],
  ['products/camara-dual-6mp.webp','products/camara-dual-6mp.webp',900],
  ['products/licuadora-portatil.webp','products/licuadora-portatil.webp',900]
];

for(const [srcRel,outRel,width] of imagePlan){
  const src=path.join(srcRoot,srcRel);
  const out=path.join(dist,'assets',outRel);
  await fs.mkdir(path.dirname(out),{recursive:true});
  await sharp(src)
    .rotate()
    .resize({width,withoutEnlargement:true,fit:'inside'})
    .webp({quality:82,effort:6})
    .toFile(out);
}

for(const file of await fs.readdir(path.join(dist,'assets','css'))){
  if(!file.endsWith('.css'))continue;
  const p=path.join(dist,'assets/css',file);
  const o=await esbuild.transform(await fs.readFile(p,'utf8'),{loader:'css',minify:true,legalComments:'none'});
  await fs.writeFile(p,o.code,'utf8');
}
for(const file of await fs.readdir(path.join(dist,'assets','js'))){
  if(!file.endsWith('.js'))continue;
  const p=path.join(dist,'assets/js',file);
  const o=await esbuild.transform(await fs.readFile(p,'utf8'),{loader:'js',minify:true,legalComments:'none',target:'es2020'});
  await fs.writeFile(p,o.code,'utf8');
}

const templates=path.join(theme,'templates');
for(const file of (await fs.readdir(templates)).filter(x=>x.endsWith('.json'))){
  const m=JSON.parse(await fs.readFile(path.join(templates,file),'utf8'));
  const part=rel=>rel?readTheme(rel):Promise.resolve('');
  const header=await part(m.header&&'snippets/'+m.header);
  const sections=await Promise.all((m.content||[]).map(x=>part('sections/'+x)));
  const footer=await part(m.footer&&'snippets/'+m.footer);
  const overlays=await part(m.overlays&&'snippets/'+m.overlays);
  const scripts=(m.scripts||[]).map(x=>'<script src="/assets/js/'+esc(x)+'" defer></script>').join('');
  const font=m.font||'Poppins:wght@400;500;600;700;800';
  const preload=(m.preload||[]).map(x=>{
    const clean=String(x).replace(/^\//,'');
    return '<link rel="preload" as="image" href="'+esc(clean)+'" fetchpriority="high">';
  }).join('');
  const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="'+esc(m.themeColor||'#111318')+'"><meta name="description" content="'+esc(m.description||'')+'"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family='+font+'&display=swap" rel="stylesheet"><title>'+esc(m.title||'ModoShop Venezuela')+'</title>'+preload+'<link rel="stylesheet" href="/assets/css/'+esc(m.css)+'">';
  const html=layout.replace('{{HEAD}}',head).replace('{{HEADER}}',header).replace('{{CONTENT}}',sections.join('')).replace('{{FOOTER}}',footer).replace('{{OVERLAYS}}',overlays).replace('{{SCRIPTS}}',scripts);
  await fs.writeFile(path.join(dist,m.output),html,'utf8');
}

await fs.writeFile(
  path.join(dist,'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: '+(process.env.URL||'https://gleaming-brigadeiros-c260a9.netlify.app')+'/sitemap.xml\n',
  'utf8'
);
await fs.rm(tmpMedia,{recursive:true,force:true});
console.log('ModoShop build: local media restored, Sharp WebP optimization enabled, CSS/JS minified.');