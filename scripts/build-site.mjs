import fs from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root=process.cwd(),theme=path.join(root,'theme'),dist=path.join(root,'dist');
const layout=await fs.readFile(path.join(theme,'layout','theme.html'),'utf8');
const legacyAssets='https://55d7d1a6652f926b7952058d16423d301a086ff6--gleaming-brigadeiros-c260a9.netlify.app/assets';
const optimizer='https://wsrv.nl/?url=';
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function copyTree(from,to){await fs.mkdir(to,{recursive:true});for(const e of await fs.readdir(from,{withFileTypes:true})){if(e.name==='README.md')continue;const s=path.join(from,e.name),d=path.join(to,e.name);if(e.isDirectory())await copyTree(s,d);else await fs.copyFile(s,d)}}
const readTheme=rel=>fs.readFile(path.join(theme,rel),'utf8');
await fs.rm(dist,{recursive:true,force:true});await fs.mkdir(dist,{recursive:true});
await copyTree(path.join(theme,'assets'),path.join(dist,'assets'));
await fs.copyFile(path.join(theme,'data','catalog-fallback.json'),path.join(dist,'assets','catalog-data.json'));

async function rewriteImages(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()){await rewriteImages(p);continue}
    if(!/\.(html|css|js|json|mjs)$/i.test(e.name))continue;
    let s=await fs.readFile(p,'utf8');
    s=s.replace(/(["'(=])\/?assets\/([^"'()\s<>]+\.(?:png|jpe?g|gif|webp))/gi,(m,prefix,file)=>prefix+optimizer+encodeURIComponent(legacyAssets+'/'+file)+'&w=1600&fit=cover&output=webp&q=82');
    await fs.writeFile(p,s,'utf8');
  }
}
await rewriteImages(path.join(dist,'assets'));
for(const file of await fs.readdir(path.join(dist,'assets','css'))){if(!file.endsWith('.css'))continue;const p=path.join(dist,'assets/css',file),o=await esbuild.transform(await fs.readFile(p,'utf8'),{loader:'css',minify:true,legalComments:'none'});await fs.writeFile(p,o.code,'utf8')}
for(const file of await fs.readdir(path.join(dist,'assets','js'))){if(!file.endsWith('.js'))continue;const p=path.join(dist,'assets/js',file),o=await esbuild.transform(await fs.readFile(p,'utf8'),{loader:'js',minify:true,legalComments:'none',target:'es2020'});await fs.writeFile(p,o.code,'utf8')}

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
  const preload=(m.preload||[]).map(x=>{const clean=String(x).replace(/^\//,'');return '<link rel="preload" as="image" href="'+optimizer+encodeURIComponent(legacyAssets+'/'+clean)+'&w=1600&fit=cover&output=webp&q=82" fetchpriority="high">'}).join('');
  const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="'+esc(m.themeColor||'#111318')+'"><meta name="description" content="'+esc(m.description||'')+'"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family='+font+'&display=swap" rel="stylesheet"><title>'+esc(m.title||'ModoShop Venezuela')+'</title>'+preload+'<link rel="stylesheet" href="/assets/css/'+esc(m.css)+'">';
  const html=layout.replace('{{HEAD}}',head).replace('{{HEADER}}',header).replace('{{CONTENT}}',sections.join('')).replace('{{FOOTER}}',footer).replace('{{OVERLAYS}}',overlays).replace('{{SCRIPTS}}',scripts);
  await fs.writeFile(path.join(dist,m.output),html,'utf8');
}
await fs.writeFile(path.join(dist,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+(process.env.URL||'https://gleaming-brigadeiros-c260a9.netlify.app')+'/sitemap.xml\n','utf8');
console.log('ModoShop Shopify-inspired theme build complete');