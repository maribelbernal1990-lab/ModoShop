function env(name){return (process.env[name]||'').trim();}
export async function notifyOrderCreated(order){
 const out=[];
 if(env('WHATSAPP_ACCESS_TOKEN')&&env('WHATSAPP_PHONE_NUMBER_ID')&&env('ADMIN_WHATSAPP_NUMBER')){
  try{
   const phone=env('ADMIN_WHATSAPP_NUMBER').replace(/\D/g,'');
   const body=`🛒 NUEVO PEDIDO ${order.id}\nCliente: ${order.customer.name}\nWhatsApp: ${order.customer.phone}\nTotal: $${Number(order.totalUsd||0).toFixed(2)} / ${Number(order.totalBs||0).toFixed(2)} Bs.\nPago: ${order.payment?.method||'No indicado'}`;
   const r=await fetch(`https://graph.facebook.com/v23.0/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`,{method:'POST',headers:{Authorization:`Bearer ${env('WHATSAPP_ACCESS_TOKEN')}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:phone,type:'text',text:{preview_url:false,body}})});
   out.push({ok:r.ok,channel:'whatsapp',data:await r.json().catch(()=>({}))});
  }catch(e){out.push({ok:false,channel:'whatsapp',error:String(e)})}
 }else out.push({ok:false,skipped:true,reason:'whatsapp_not_configured'});
 return out;
}
export async function notifyStatus(order){return [{ok:false,skipped:true,reason:'status_notifications_not_configured'}];}
