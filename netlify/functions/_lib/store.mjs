import { getStore } from '@netlify/blobs';
export const ordersStore=()=>getStore({name:'modoshop-orders',consistency:'strong'});
export const configStore=()=>getStore({name:'modoshop-config',consistency:'strong'});
export async function getJSON(store,key,fallback=null){const v=await store.get(key,{type:'json'});return v??fallback}
export async function putJSON(store,key,value){await store.setJSON(key,value)}