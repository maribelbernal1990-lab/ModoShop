import { json } from './_lib/auth.mjs';
export default async ()=>{const key=(process.env.GOOGLE_MAPS_BROWSER_KEY||'').trim();return json({key,configured:Boolean(key)},200,{'cache-control':'no-store'})};
export const config={path:'/api/maps-config'};