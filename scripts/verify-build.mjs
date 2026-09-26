import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const requiredPages=['index.html','producto.html','admin.html','seguimiento.html','success.html','legal.html'];
const requiredFunctions=['admin-login','catalog','create-order','track-order','reviews','admin-catalog','admin-settings','admin-upload'];
for(const page of requiredPages){const html=await fs.readFile(path.join(root,'dist',page),'utf8');if(!html.includes('<!doctype html>'))throw new Error('Invalid HTML output: '+page);if(html.includes('wsrv.nl')===false&&page==='index.html')throw new Error('Image optimizer missing: '+page)}
for(const fn of requiredFunctions)await fs.access(path.join(root,'netlify','functions',fn+'.mjs'));
await fs.access(path.join(root,'dist','robots.txt'));
console.log('ModoShop build verification passed');