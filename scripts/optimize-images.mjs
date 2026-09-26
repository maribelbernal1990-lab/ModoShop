import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT=path.resolve('assets');
const IMAGE_EXT=/\.(png|jpe?g|webp)$/i;
const SKIP=/\/catalog-data\.json$/;
async function walk(dir){
  const out=[];
  for(const name of await fs.readdir(dir)){
    const p=path.join(dir,name);
    const st=await fs.stat(p);
    if(st.isDirectory()) out.push(...await walk(p));
    else if(IMAGE_EXT.test(p)&&!SKIP.test(p)) out.push(p);
  }
  return out;
}
const files=await walk(ROOT);
for(const file of files){
  const ext=path.extname(file).toLowerCase();
  const base=file.slice(0,-ext.length);
  const input=sharp(file,{failOn:'none'});
  const meta=await input.metadata();
  const width=Math.min(meta.width||2000,1600);
  if(ext==='.png'){
    await input.resize({width,withoutEnlargement:true}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(file+'.tmp');
    await fs.rename(file+'.tmp',file);
  }else{
    await input.resize({width,withoutEnlargement:true}).jpeg({quality:82,mozjpeg:true}).toFile(file+'.tmp');
    await fs.rename(file+'.tmp',file);
  }
}
// Generate WebP copies for the large photographic PNGs and update references in repository text.
for(const name of ['logo.png','hero-family.png','hero-tech.png','auriculares.png','camara.png','licuadora.png']){
  const file=path.join(ROOT,name);
  try{
    await sharp(file).resize({width:1600,withoutEnlargement:true}).webp({quality:82}).toFile(file.replace(/\.png$/i,'.webp'));
  }catch{}
}
const textFiles=['index.html','producto.html','admin.html','success.html','legal.html','seguimiento.html'];
for(const rel of textFiles){
  const p=path.resolve(rel);
  try{
    let s=await fs.readFile(p,'utf8');
    s=s.replace(/assets\/(logo|hero-family|hero-tech|auriculares|camara|licuadora)\.png/g,'assets/$1.webp');
    await fs.writeFile(p,s,'utf8');
  }catch{}
}
console.log(`Optimized ${files.length} raster assets`);