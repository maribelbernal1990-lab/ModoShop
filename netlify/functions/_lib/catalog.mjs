import { configStore } from './store.mjs';
import { DEFAULT_PRODUCTS } from './default-products.mjs';
export const CATALOG_KEY='products', SETTINGS_KEY='settings';
const clone=v=>JSON.parse(JSON.stringify(v));
const optimizeLocalAsset=v=>{const s=String(v??'');return /^\/?assets\/.+\.(?:png|jpe?g)$/i.test(s)?s.replace(/\.(png|jpe?g)$/i,'.webp'):s};
export async function getCatalog(){
 const store=configStore(),saved=await store.get(CATALOG_KEY,{type:'json'});
 if(Array.isArray(saved)&&saved.length){
   const migrated=saved.map(p=>{
     const g=Array.isArray(p.gallery)?p.gallery:[];
     const hasLegacyAlternates=g.some(x=>/-vista[234]\.jpg$/i.test(String(x))||/masajeador-ficha/i.test(String(x)));
     return hasLegacyAlternates ? {...p,gallery:p.img?[String(p.img)]:[]} : p;
   });
   const normalized=migrated.map(p=>({...p,img:optimizeLocalAsset(p.img),gallery:Array.isArray(p.gallery)?p.gallery.map(optimizeLocalAsset):[]}));
   if(JSON.stringify(normalized)!==JSON.stringify(saved)) await store.setJSON(CATALOG_KEY,normalized);
   return normalized;
 }
 const seeded=DEFAULT_PRODUCTS.map(p=>({...p,active:true,stock:typeof p.stock==='number'?p.stock:25,sku:p.sku||p.id.toUpperCase(),compareAt:p.compareAt||null,tags:Array.isArray(p.tags)?p.tags:[p.tag].filter(Boolean),seoTitle:p.seoTitle||p.name,seoDescription:p.seoDescription||p.desc}));
 const optimized=seeded.map(p=>({...p,img:optimizeLocalAsset(p.img),gallery:Array.isArray(p.gallery)?p.gallery.map(optimizeLocalAsset):[]}));
 await store.setJSON(CATALOG_KEY,optimized);
 return optimized;
}
export async function saveCatalog(products){
 const sanitized=clone(products).map(p=>({...p,id:String(p.id||'').trim(),name:String(p.name||'').trim(),price:Number(p.price||0),category:String(p.category||'General').trim(),desc:String(p.desc||'').trim(),features:Array.isArray(p.features)?p.features.map(String).filter(Boolean):[],bullets:Array.isArray(p.bullets)?p.bullets.map(String).filter(Boolean):[],use:Array.isArray(p.use)?p.use.map(String).filter(Boolean):[],gallery:Array.isArray(p.gallery)?p.gallery.map(String).filter(Boolean):[],active:p.active!==false,stock:Math.max(0,Math.floor(Number(p.stock??0))),sku:String(p.sku||p.id||'').trim().slice(0,80),compareAt:p.compareAt==null||p.compareAt===''?null:Number(p.compareAt),tags:Array.isArray(p.tags)?p.tags.map(String).filter(Boolean).slice(0,20):[]})).filter(p=>p.id&&p.name);
 const optimized=sanitized.map(p=>({...p,img:optimizeLocalAsset(p.img),gallery:Array.isArray(p.gallery)?p.gallery.map(optimizeLocalAsset):[]})); await configStore().setJSON(CATALOG_KEY,optimized); return optimized;
}
export async function getPublicSettings(){
 return await configStore().get(SETTINGS_KEY,{type:'json'})||{
 storeName:'ModoShop Venezuela',whatsapp:'584262993765',ticker:'🚚 Envíos nacionales por MRW y ZOOM · 💳 Pago Móvil · Zelle · Zinli · USDT · Compra segura',paymentInfo:'',freeShippingThreshold:0,currency:'USD',
 payments:{'Pago Móvil':true,'Transferencia bancaria':true,'Zelle':true,'Zinli':true,'USDT / Binance':true,'Tarjeta internacional':false,'Efectivo contra entrega':false}
 };
}
const cleanText=(v,max=5000)=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,max);
const cleanHex=(v,f)=>/^#[0-9a-fA-F]{6}$/.test(String(v||''))?String(v):f;
const allowedFonts=['Poppins','Inter','Montserrat','Nunito','DM Sans','Manrope','Roboto','Outfit'];
const normalizeEditor=(incoming,base)=>{
 const v=incoming&&typeof incoming==='object'?incoming:{},b=base&&typeof base==='object'?base:{};
 const design={...(b.design||{}),...(v.design||{})};
 design.font=allowedFonts.includes(String(design.font))?String(design.font):(b.design?.font||'Poppins');
 design.accent=cleanHex(design.accent,b.design?.accent||'#ed1c24'); design.accent2=cleanHex(design.accent2,b.design?.accent2||'#ff6b35');
 design.background=cleanHex(design.background,b.design?.background||'#f7f7f5'); design.card=cleanHex(design.card,b.design?.card||'#ffffff');
 design.ink=cleanHex(design.ink,b.design?.ink||'#111318'); design.muted=cleanHex(design.muted,b.design?.muted||'#68707f'); design.soft=cleanHex(design.soft,b.design?.soft||'#fff1f1');
 design.radius=Math.min(40,Math.max(6,Number(design.radius??b.design?.radius??18))); design.shadow=design.shadow==='flat'?'flat':'soft'; design.vibrateButtons=design.vibrateButtons!==false;
 const cleanObj=(obj,depth=0)=>{if(depth>3||!obj||typeof obj!=='object'||Array.isArray(obj))return{};const r={};for(const [k,val] of Object.entries(obj).slice(0,80)){const key=cleanText(k,80);if(typeof val==='string')r[key]=cleanText(val,3000);else if(typeof val==='number'&&Number.isFinite(val))r[key]=val;else if(typeof val==='boolean')r[key]=val;else if(Array.isArray(val))r[key]=val.slice(0,30).map(x=>typeof x==='string'?cleanText(x,1000):x);else if(val&&typeof val==='object')r[key]=cleanObj(val,depth+1);}return r};
 const home=cleanObj({...((b.home)||{}),...((v.home)||{})}),header=cleanObj({...((b.header)||{}),...((v.header)||{})}),footer=cleanObj({...((b.footer)||{}),...((v.footer)||{})}),seo=cleanObj({...((b.seo)||{}),...((v.seo)||{})}),visibility=cleanObj({...((b.visibility)||{}),...((v.visibility)||{})});
 const customBlocks=Array.isArray(v.customBlocks)?v.customBlocks.slice(0,30).map(x=>({id:cleanText(x?.id,80)||('b-'+Math.random().toString(36).slice(2,8)),title:cleanText(x?.title,160),text:cleanText(x?.text,1500),image:cleanText(x?.image,1000),buttonText:cleanText(x?.buttonText,80),buttonUrl:cleanText(x?.buttonUrl,1000),active:x?.active!==false})):(Array.isArray(b.customBlocks)?b.customBlocks:[]);
 const navOrder=Array.isArray(v.navOrder)?v.navOrder.filter(x=>['productos','como-comprar','pagos','envios','preguntas','fuentes','reciente','custom'].includes(String(x))).slice(0,12):(Array.isArray(b.navOrder)?b.navOrder:[]);
 return {...cleanObj(v),design,home,header,footer,seo,visibility,customBlocks,navOrder};
};
export async function savePublicSettings(value){
 const current=await getPublicSettings(),v=value&&typeof value==='object'?value:{},normalized=normalizeEditor(v,current);
 const next={...current,...normalized,storeName:cleanText(v.storeName||current.storeName||'ModoShop Venezuela',120).trim(),whatsapp:String(v.whatsapp||current.whatsapp||'584262993765').replace(/\D/g,''),ticker:cleanText(v.ticker??current.ticker??'',500).trim(),paymentInfo:cleanText(v.paymentInfo??current.paymentInfo??'',5000).trim(),payments:(v.payments&&typeof v.payments==='object')?Object.fromEntries(Object.entries(v.payments).map(([k,val])=>[cleanText(k,120),!!val]).slice(0,20)):(current.payments||{}),freeShippingThreshold:Math.max(0,Number(v.freeShippingThreshold??current.freeShippingThreshold??0)),currency:'USD'};
 await configStore().setJSON(SETTINGS_KEY,next); return next;
}