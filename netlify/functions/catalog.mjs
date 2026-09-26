import { getCatalog, getPublicSettings } from './_lib/catalog.mjs';
export default async (request) => {
 if (request.method !== 'GET') return new Response(JSON.stringify({error:'Método no permitido'}),{status:405,headers:{'content-type':'application/json'}});
 const [products,settings]=await Promise.all([getCatalog(),getPublicSettings()]);
 return Response.json({products:products.filter(p=>p.active!==false),settings},{headers:{'cache-control':'no-store'}});
};
export const config={path:'/api/catalog'};