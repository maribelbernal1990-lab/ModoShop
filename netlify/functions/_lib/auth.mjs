import crypto from 'node:crypto';
const secret=()=>process.env.SESSION_SECRET||process.env.ADMIN_PASSWORD||'CHANGE-ME-SESSION-SECRET',cookieName='modoshop_admin';
const sign=p=>crypto.createHmac('sha256',secret()).update(p).digest('base64url');
export const makeSession=()=>{const p=`${Date.now()}:${crypto.randomBytes(18).toString('base64url')}`;return `${p}.${sign(p)}`};
export function validSession(request){const raw=request.headers.get('cookie')||'',m=raw.match(new RegExp(`${cookieName}=([^;]+)`));if(!m)return false;const [p,s]=m[1].split('.');if(!p||!s)return false;try{return crypto.timingSafeEqual(Buffer.from(s),Buffer.from(sign(p)))}catch{return false}}
export const sessionCookie=v=>`${cookieName}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;
export const clearCookie=()=>`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
export const json=(data,status=200,headers={})=>({statusCode:status,headers:{'content-type':'application/json; charset=utf-8',...headers},body:JSON.stringify(data)});