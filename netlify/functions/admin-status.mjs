import { ordersStore, getJSON } from './_lib/store.mjs';
import { json, validSession } from './_lib/auth.mjs';
export default async request=>{
 if(!validSession(request)) return json({error:'No autorizado'},401);
 if(request.method==='GET') return json({ok:true},200);
 if(request.method!=='POST') return json({error:'Método no permitido'},405);
 const {id,status,trackingNumber,carrier}=await request.json().catch(()=>({}));
 const store=ordersStore(), order=await getJSON(store,id);
 if(!order) return json({error:'Pedido no encontrado'},404);
 const allowed=['pending','confirmed','processing','shipped','delivered','cancelled'];
 if(!allowed.includes(status)) return json({error:'Estado inválido'},400);
 order.status=status; order.updatedAt=new Date().toISOString();
 order.shipping=order.shipping||{};
 if(carrier) order.shipping.carrier=carrier;
 if(trackingNumber!==undefined) order.shipping.trackingNumber=String(trackingNumber);
 await store.setJSON(id,order);
 return json({ok:true,order});
};
export const config={path:'/api/admin/status'};