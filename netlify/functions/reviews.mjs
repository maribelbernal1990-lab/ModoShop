import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';
const store=()=>getStore({name:'modoshop-reviews',consistency:'strong'}), key=id=>`product/${id}`, safe=s=>String(s??'').trim();
export default async request=>{
 try{
  const id=safe(new URL(request.url).searchParams.get('id'));
  if(request.method==='GET'){if(!id)return Response.json({error:'Falta id'},{status:400});const items=await store().get(key(id),{type:'json'})||[];return Response.json({reviews:Array.isArray(items)?items.filter(r=>r.status==='approved').slice(0,100):[]},{headers:{'cache-control':'no-store'}})}
  if(request.method==='POST'){const b=await request.json().catch(()=>({})),productId=safe(b.productId),name=safe(b.name)||'Cliente',comment=safe(b.comment),stars=Number(b.stars);if(!productId||comment.length<5||comment.length>600||!Number.isInteger(stars)||stars<1||stars>5)return Response.json({error:'Completa la valoración correctamente.'},{status:400});const s=store(),list=await s.get(key(productId),{type:'json'})||[],next={id:crypto.randomUUID(),productId,name:name.slice(0,80),comment,stars,createdAt:new Date().toISOString(),status:'pending'};await s.setJSON(key(productId),[next,...(Array.isArray(list)?list:[])].slice(0,200));return Response.json({ok:true,status:'pending'},{status:201})}
  return new Response('Método no permitido',{status:405});
 }catch{return Response.json({error:'No se pudo procesar la reseña'},{status:500})}
};