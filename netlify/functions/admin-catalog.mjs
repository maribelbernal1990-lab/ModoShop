import { getCatalog, saveCatalog } from './_lib/catalog.mjs';
import { json, validSession } from './_lib/auth.mjs';
export default async (request)=>{
 if(!validSession(request)) return json({error:'No autorizado'},401);
 if(request.method==='GET') return json({products:await getCatalog()});
 if(request.method!=='POST') return json({error:'Método no permitido'},405);
 const body=await request.json().catch(()=>({}));
 if(!Array.isArray(body.products)) return json({error:'products debe ser un array'},400);
 return json({ok:true,products:await saveCatalog(body.products)});
};
export const config={path:'/api/admin/catalog'};
