import fs from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root=process.cwd();
const theme=path.join(root,'theme');
const dist=path.join(root,'dist');
const layout=await fs.readFile(path.join(theme,'layout','theme.html'),'utf8');
const legacyAssets='https://55d7d1a6652f926b7952058d16423d301a086ff6--gleaming-brigadeiros-c260a9.netlify.app/assets';
const optimizer='https://wsrv.nl/?url=';

async function copyTree(from,to){
  await fs.mkdir(to,{recursive:true});
  for(const entry of await fs.readdir(from,{withFileTypes:true})){
    const src=path.join(from,entry.name), dst=path.join(to,entry.name);
    if(entry.isDirectory()) await copyTree(src,dst);
    else await fs.copyFile(src,dst);
  }
}
async function readTheme(rel){return fs.readFile(path.join(theme,rel),'utf8');}
function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});
await copyTree(path.join(theme,'assets'),path.join(dist,'assets'));
await fs.copyFile(path.join(theme,'data','catalog-fallback.json'),path.join(dist,'assets','catalog-data.json'));

async function rewriteImageRefs(dir){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()){await rewriteImageRefs(p);continue;}
    if(!/\.(html|css|js|json|mjs)$/i.test(entry.name))continue;
    let s=await fs.readFile(p,'utf8');
    s=s.replace(/(["'(=])\/?assets\/([^"'()\s<>]+\.(?:png|jpe?g|gif|webp))/gi,(m,prefix,file)=>{
      const source=legacyAssets+'/'+file;
      const optimized=optimizer+encodeURIComponent(source)+'&w=1600&fit=cover&output=webp&q=82';
      return prefix+optimized;
    });
    await fs.writeFile(p,s,'utf8');
  }
}
await rewriteImageRefs(path.join(dist,'assets'));

for(const file of await fs.readdir(path.join(dist,'assets','css'))){
  if(!file.endsWith('.css'))continue;
  const p=path.join(dist,'assets','css',file);
  const out=await esbuild.transform(await fs.readFile(p,'utf8'),{loader:'css',minify:true,legalComments:'none'});
  await fs.writeFile(p,out.code,'utf8');
}
for(const file of await fs.readdir(path.join(dist,'assets','js'))){
  if(!file.endsWith('.js'))continue;
  const p=path.join(dist,'assets','js',file);
  const out=await esbuild.transform(await fs.readFile(p,'utf8'),{loader:'js',minify:true,legalComments:'none',target:'es2020'});
  await fs.writeFile(p,out.code,'utf8');
}

const templates=path.join(theme,'templates');
for(const file of (await fs.readdir(templates)).filter(x=>x.endsWith('.json'))){
  const m=JSON.parse(await fs.readFile(path.join(templates,file),'utf8'));
  const readPart=rel=>rel?readTheme(rel):Promise.resolve('');
  const header=await readPart(m.header&&'snippets/'+m.header);
  const content=await Promise.all((m.content||[]).map(x=>readPart('sections/'+x)));
  const footer=await readPart(m.footer&&'snippets/'+m.footer);
  const overlays=await readPart(m.overlays&&'snippets/'+m.overlays);
  const scripts=(m.scripts||[]).map(x=>'<script src="/assets/js/'+esc(x)+'" defer></script>').join('');
  const font=m.font||'Poppins:wght@400;500;600;700;800';
  const preload=(m.preload||[]).map(x=>{
    const clean=String(x).replace(/^\//,'');
    const src=legacyAssets+'/'+clean;
    return '<link rel="preload" as="image" href="'+optimizer+encodeURIComponent(src)+'&w=1600&fit=cover&output=webp&q=82" fetchpriority="high">';
  }).join('');
  const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="'+esc(m.themeColor||'#111318')+'"><meta name="description" content="'+esc(m.description||'')+'"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family='+font+'&display=swap" rel="stylesheet"><title>'+esc(m.title||'ModoShop Venezuela')+'</title>'+preload+'<link rel="stylesheet" href="/assets/css/'+esc(m.css)+'">';
  const html=layout.replace('{{HEAD}}',head).replace('{{HEADER}}','').replace('{{CONTENT}}',header+content.join('')).replace('{{FOOTER}}',footer).replace('{{OVERLAYS}}',overlays).replace('{{SCRIPTS}}',scripts);
  await fs.writeFile(path.join(dist,m.output),html,'utf8');
}
console.log('ModoShop Shopify-inspired theme build complete');
