import pkg from 'pg'; const {Client}=pkg;
import {readFileSync} from 'fs'; import {join,dirname} from 'path'; import {fileURLToPath} from 'url';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const raw=readFileSync(join(ROOT,'.env.local'),'utf8');
for(const l of raw.split('\n')){const eq=l.indexOf('=');if(eq>0)process.env[l.slice(0,eq).trim()]=l.slice(eq+1).trim();}
const c=new Client({connectionString:'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres'});
await c.connect();
const r=await c.query("SELECT name, website_url FROM public.tools WHERE pricing_model='unknown' AND status='published' ORDER BY name");
console.log(`${r.rows.length} tools with unknown pricing:\n`);
r.rows.forEach((t,i)=>console.log(`${i+1}. ${t.name} | ${t.website_url}`));
await c.end();
