import { getStore } from '@netlify/blobs';
export default async (request)=>{
 if(request.method!=='GET') return new Response('Método no permitido',{status:405});
 const key=new URL(request.url).searchParams.get('key');
 if(!key||!key.startsWith('products/')) return new Response('No encontrado',{status:404});
 const blob=await getStore({name:'modoshop-media',consistency:'strong'}).get(key,{type:'blob'});
 if(!blob) return new Response('No encontrado',{status:404});
 return new Response(blob,{status:200,headers:{'content-type':blob.type||'application/octet-stream','cache-control':'public,max-age=31536000,immutable'}});
};
export const config={path:'/api/media'};