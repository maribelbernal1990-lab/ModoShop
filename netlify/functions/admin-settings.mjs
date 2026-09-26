import { getPublicSettings, savePublicSettings } from './_lib/catalog.mjs';
import { json, validSession } from './_lib/auth.mjs';
export default async (request)=>{
 if(!validSession(request)) return json({error:'No autorizado'},401);
 if(request.method==='GET') return json({settings:await getPublicSettings()});
 if(request.method!=='POST') return json({error:'Método no permitido'},405);
 const body=await request.json().catch(()=>({}));
 return json({ok:true,settings:await savePublicSettings(body.settings||{})});
};