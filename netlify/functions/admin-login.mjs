import { json, makeSession, sessionCookie } from './_lib/auth.mjs';
export default async (request)=>{
 if(request.method!=='POST') return json({error:'Método no permitido'},405);
 const {password}=await request.json().catch(()=>({}));
 const expected=process.env.ADMIN_PASSWORD;
 if(!expected) return json({error:'Configura ADMIN_PASSWORD en Netlify antes de usar el panel.'},500);
 if(String(password||'')!==expected) return json({error:'Contraseña incorrecta'},401);
 return json({ok:true},200,{'set-cookie':sessionCookie(makeSession())});
};
export const config={path:'/api/admin/login'};
