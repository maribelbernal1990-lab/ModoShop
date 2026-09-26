import { ordersStore,getJSON } from './_lib/store.mjs';
import { json } from './_lib/auth.mjs';
export default async request=>{
 if(request.method!=='GET')return json({error:'Método no permitido'},405);
 const id=new URL(request.url).searchParams.get('id');if(!id)return json({error:'Falta el identificador del pedido'},400);
 const order=await getJSON(ordersStore(),id);if(!order)return json({error:'Pedido no encontrado'},404);
 return json({id:order.id,createdAt:order.createdAt,updatedAt:order.updatedAt,status:order.status,items:(order.items||[]).map(({id,name,qty})=>({id,name,qty})),totalUsd:order.totalUsd,totalBs:order.totalBs,carrier:order.shipping?.carrier,trackingNumber:order.shipping?.trackingNumber,shippingMode:order.shipping?.mode,agencyName:order.shipping?.agencyName,agencyAddress:order.shipping?.agencyAddress,address:order.shipping?.mode==='direccion'?order.customer?.address:''});
};
export const config={path:'/api/track'};