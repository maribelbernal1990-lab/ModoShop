import { getStore } from '@netlify/blobs';
import { json, validSession } from './_lib/auth.mjs';
const store=()=>getStore({name:'modoshop-reviews',consistency:'strong'});
const key=id=>`product/${id}`;
export default async (request)=>{
 if(!validSession(request)) return json({error:'No autorizado'},401);
 const s=store();
 if(request.method==='GET'){
  const list=await s.list({prefix:'product/'}); const reviews=[];
  for(const item of list.blobs||[]){const data=await s.get(item.key,{type:'json'})||[];if(Array.isArray(data))reviews.push(...data)}
  reviews.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); return json({reviews});
 }
 if(request.method!=='POST') return json({error:'Método no permitido'},405);
 const body=await request.json().catch(()=>({})); const id=String(body.id||''); const status=['pending','approved','rejected'].includes(body.status)?body.status:''; const productId=String(body.productId||'');
 if(!id||!status||!productId) return json({error:'Datos incompletos'},400);
 const items=await s.get(key(productId),{type:'json'})||[]; const next=Array.isArray(items)?items.map(r=>r.id===id?{...r,status}:r):items; await s.setJSON(key(productId),next); return json({ok:true});
};
export const config={path:'/api/admin/reviews'};
