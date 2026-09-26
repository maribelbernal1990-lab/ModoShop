import { ordersStore } from './_lib/store.mjs';
import { json, validSession } from './_lib/auth.mjs';
export default async (request)=>{
 if(!validSession(request)) return json({error:'No autorizado'},401);
 const store=ordersStore(); const list=await store.list({prefix:'MS-'}); const orders=[];
 for(const item of list.blobs){const o=await store.get(item.key,{type:'json'});if(o)orders.push(o)}
 orders.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
 return json({orders});
};