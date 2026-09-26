import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const requiredPages=['index.html','producto.html','admin.html','seguimiento.html','success.html','legal.html'];
const requiredFunctions=['admin-login','catalog','create-order','track-order','reviews','admin-catalog','admin-settings','admin-upload'];

for(const page of requiredPages){
  const p=path.join(root,'dist',page);
  const html=await fs.readFile(p,'utf8');
  if(!html.includes('<!doctype html>')) throw new Error('Invalid HTML output: '+page);
  if(/src=["'](?:\.\.\/)?assets\//i.test(html)) throw new Error('Unresolved local asset reference: '+page);
}
for(const fn of requiredFunctions){
  const p=path.join(root,'netlify','functions',fn+'.mjs');
  await fs.access(p);
}
console.log('ModoShop build verification passed');
