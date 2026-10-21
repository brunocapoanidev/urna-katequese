import { getStore } from '@netlify/blobs';
import presidentsSeed from '../../data/presidents.json' with { type: 'json' };
import deputiesSeed from '../../data/deputies.json' with { type: 'json' };
import votersSeed from '../../data/voters.json' with { type: 'json' };
export const store=getStore('urna-katequese-v1');
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export const bad=(message,status=400)=>json({error:message},status);
export async function config(){let x=await store.get('config',{type:'json'}); if(!x){x={status:'closed',tieBreak:'candidate-number',seats:3}; await store.setJSON('config',x,{onlyIfNew:true});} return x}
export async function collection(name, seed){let x=await store.get(`lists/${name}`,{type:'json'}); if(!x){x=seed; await store.setJSON(`lists/${name}`,x,{onlyIfNew:true});} return x}
export const data=async()=>({presidents:await collection('presidents',presidentsSeed),deputies:await collection('deputies',deputiesSeed),voters:await collection('voters',votersSeed),config:await config()});
const enc=new TextEncoder(); const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function digest(s){return hex(await crypto.subtle.digest('SHA-256',enc.encode(s)))}
export async function sign(s){let k=await crypto.subtle.importKey('raw',enc.encode(process.env.AUTH_SECRET||'dev-only-change-me-please-123456789'),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',k,enc.encode(s)))}
export async function token(payload){let raw=btoa(JSON.stringify({...payload,exp:Date.now()+900000}));return `${raw}.${await sign(raw)}`}
export async function auth(req,role='admin'){let h=req.headers.get('authorization')||'';let [raw,sig]=h.replace('Bearer ','').split('.');if(!raw||sig!==await sign(raw))return null;try{let p=JSON.parse(atob(raw));return p.role===role&&p.exp>Date.now()?p:null}catch{return null}}
