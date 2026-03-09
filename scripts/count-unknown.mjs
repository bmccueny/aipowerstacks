import pkg from 'pg'; const {Client}=pkg;
import {readFileSync} from 'fs'; import {join,dirname} from 'path'; import {fileURLToPath} from 'url';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const raw=readFileSync(join(ROOT,'.env.local'),'utf8');
for(const l of raw.split('\n')){const eq=l.indexOf('=');if(eq>0)process.env[l.slice(0,eq).trim()]=l.slice(eq+1).trim();}
const c=new Client({connectionString:'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres'});
await c.connect();
const r=await c.query("SELECT COUNT(*) FROM public.tools WHERE pricing_model='unknown' AND status='published'");
console.log('Unknown pricing (published):', r.rows[0].count);
const s=await c.query("SELECT name, website_url FROM public.tools WHERE pricing_model='unknown' AND status='published' LIMIT 5");
s.rows.forEach(r=>console.log(' ',r.name,'|',r.website_url));
await c.end();
