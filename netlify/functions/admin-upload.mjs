import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json, validSession } from './_lib/auth.mjs';
const MAX_BYTES=7*1024*1024, ALLOWED=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['image/gif','gif']]);
export default async request=>{
 if(!validSession(request))return json({error:'No autorizado'},401);
 if(request.method!=='POST')return json({error:'Método no permitido'},405);
 try{
  const form=await request.formData(),file=form.get('file'),productId=String(form.get('productId')||'general').trim().replace(/[^a-zA-Z0-9_-]/g,'');
  if(!(file instanceof File))return json({error:'Selecciona una imagen'},400);
  if(!ALLOWED.has(file.type))return json({error:'Formato no permitido. Usa JPG, PNG, WEBP o GIF.'},400);
  if(file.size>MAX_BYTES)return json({error:'La imagen supera el límite de 7 MB.'},400);
  const ext=ALLOWED.get(file.type),key=`products/${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await getStore({name:'modoshop-media',consistency:'strong'}).set(key,file,{metadata:{contentType:file.type,originalName:file.name}});
  return json({ok:true,key,url:`/api/media?key=${encodeURIComponent(key)}`},201);
 }catch{return json({error:'No se pudo subir la imagen'},500)}
};
export const config={path:'/api/admin/upload'};