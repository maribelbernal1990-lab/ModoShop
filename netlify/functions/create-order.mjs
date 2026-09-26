import crypto from 'node:crypto';
import { ordersStore } from './_lib/store.mjs';
import { json } from './_lib/auth.mjs';
import { notifyOrderCreated } from './_lib/notifications.mjs';
const cors={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
const safe=s=>String(s??'').trim();
export default async request=>{
 if(request.method==='OPTIONS')return{statusCode:204,headers:cors,body:''};
 if(request.method!=='POST')return json({error:'Método no permitido'},405,cors);
 try{
  const body=await request.json().catch(()=>({}));
  if(body.website)return json({ok:true},200,cors);
  const items=Array.isArray(body.items)?body.items:[];
  if(!items.length)return json({error:'El carrito está vacío'},400,cors);
  if(items.some(i=>!safe(i.id)||!safe(i.name)||!Number.isFinite(Number(i.price))||Number(i.price)<0||Number(i.qty)<1))return json({error:'El pedido contiene artículos inválidos'},400,cors);
  const c=body.customer||{};
  if(!safe(c.name)||!safe(c.email)||!safe(c.phone)||!safe(c.state)||!safe(c.city)||!safe(c.address))return json({error:'Completa los datos del cliente'},400,cors);
  const p=body.payment||{};
  if(!safe(p.method))return json({error:'Selecciona un método de pago'},400,cors);
  if(!/efectivo/i.test(safe(p.method))&&!safe(p.reference))return json({error:'Indica la referencia del pago después de realizarlo'},400,cors);
  const id=`MS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const s=body.shipping||{};
  const order={id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'pending',customer:{name:safe(c.name),phone:safe(c.phone),email:safe(c.email),state:safe(c.state),city:safe(c.city),address:safe(c.address)},shipping:{carrier:safe(s.carrier)||'MRW',mode:safe(s.mode)||'agencia',agencyId:safe(s.agencyId),agencyName:safe(s.agencyName),agencyAddress:safe(s.agencyAddress),trackingNumber:''},payment:{method:safe(p.method),reference:safe(p.reference)},items:items.map(i=>({id:safe(i.id),name:safe(i.name),qty:Math.max(1,Number(i.qty||1)),price:Number(i.price||0),weight:safe(i.weight)})),totalUsd:Number(body.totalUsd||0),totalBs:Number(body.totalBs||0),exchangeRate:Number(body.exchangeRate||0),shippingEstimate:Number(body.shippingEstimate||0),notifications:[]};
  const store=ordersStore();
  await store.setJSON(id,order);
  const notifications=await notifyOrderCreated(order);
  order.notifications=notifications;
  await store.setJSON(id,order);
  return json({ok:true,orderId:id,status:order.status,notifications:notifications.map(n=>({ok:!!n?.ok,skipped:!!n?.skipped,reason:n?.reason||null}))},201,cors);
 }catch(e){return json({error:'No se pudo crear el pedido'},500,cors)}
};
export const config={path:'/api/orders'};