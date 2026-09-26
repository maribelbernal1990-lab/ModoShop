const b64url=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function sign(value,secret){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return b64url(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
}
function sessionCookie(v){return 'modoshop_admin='+v+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400';}
export default async request=>{
 if(request.method!=='POST') return new Response(JSON.stringify({error:'Método no permitido'}),{status:405,headers:{'content-type':'application/json; charset=utf-8'}});
 const body=await request.json().catch(()=>({}));
 const expected=String(process.env.ADMIN_PASSWORD||'');
 if(!expected) return new Response(JSON.stringify({error:'Configura ADMIN_PASSWORD en Netlify antes de usar el panel.'}),{status:500,headers:{'content-type':'application/json; charset=utf-8'}});
 if(String(body.password||'')!==expected) return new Response(JSON.stringify({error:'Contraseña incorrecta'}),{status:401,headers:{'content-type':'application/json; charset=utf-8'}});
 const payload=Date.now()+':'+b64url(crypto.getRandomValues(new Uint8Array(18)));
 const token=payload+'.'+await sign(payload,process.env.SESSION_SECRET||expected);
 return new Response(JSON.stringify({ok:true}),{status:200,headers:{'content-type':'application/json; charset=utf-8','set-cookie':sessionCookie(token)}});
};