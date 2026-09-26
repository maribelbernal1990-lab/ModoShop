import { json, clearCookie } from './_lib/auth.mjs';
export default async ()=>json({ok:true},200,{'set-cookie':clearCookie()});
export const config={path:'/api/admin/logout'};
