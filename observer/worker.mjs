import {bots,candidate,identity,parseRanges} from './identity.mjs';
import {youtubeSnapshot,youtubeHtml,youtubeMessage,youtubeCron} from './youtube.mjs';
const upstream='https://guojunwei59-a11y.github.io/work-report/ai-zoo/';
export const cstDay=(now=Date.now())=>new Date(now+28800000).toISOString().slice(0,10);
const rangeCache=new Map();
export function observedPath(p){return p==='/'||p==='/history/'||p==='/robots.txt'||p==='/sitemap.xml'||/^\/history\/\d{4}-\d{2}-\d{2}\/$/.test(p);}
const allowedPath=p=>observedPath(p)||/^\/assets\/[a-z0-9.-]+$/.test(p)||/^\/data\/(latest|\d{4}-\d{2}-\d{2})\.json$/.test(p);
function cors(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Cache-Control':'public, max-age=60','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};}
async function ranges(env,bot){
 if(!bot.url)return null;
 const cached=rangeCache.get(bot.type);if(cached&&Date.now()-cached.loaded<3600000)return cached;
 const row=await env.DB.prepare('SELECT ranges_json,updated_at FROM official_ranges WHERE crawler=?').bind(bot.type).first();
 const value=row?{ranges:JSON.parse(row.ranges_json),updated:row.updated_at,loaded:Date.now()}:null;
 if(value)rangeCache.set(bot.type,value);return value;
}
export async function refreshRanges(env,fetcher=fetch){
 const results=await Promise.allSettled(bots.filter(b=>b.url).map(async b=>{
  let target=b.url,r;
  const allowed=new Set(b.company==='openai'?['openai.com','www.openai.com']:b.company==='perplexity'?['www.perplexity.ai','www.perplexity.com']:['developers.google.com']);
  for(let step=0;step<3;step++){
   r=await fetcher(target,{redirect:'manual',signal:AbortSignal.timeout(15000)});
   if(r.status<300||r.status>=400)break;
   const next=new URL(r.headers.get('Location'),target);if(next.protocol!=='https:'||!allowed.has(next.hostname))throw Error('Unexpected official redirect');target=next.href;
  }
  if(!r.ok)throw Error('Official source HTTP '+r.status);
  const list=parseRanges(await r.json());
  await env.DB.prepare('INSERT INTO official_ranges(crawler,ranges_json,updated_at) VALUES(?,?,?) ON CONFLICT(crawler) DO UPDATE SET ranges_json=excluded.ranges_json,updated_at=excluded.updated_at').bind(b.type,JSON.stringify(list),Date.now()).run();
  rangeCache.delete(b.type);
 }));
 return results.map((r,i)=>({crawler:bots.filter(b=>b.url)[i].type,ok:r.status==='fulfilled',...(r.status==='rejected'?{error:r.reason?.message||'Refresh failed'}:{})}));
}
export async function record(request,env,path,now=Date.now()){
 if(!request.cf||request.method!=='GET'||!observedPath(path))return;
 const bot=candidate(request.headers.get('User-Agent')||'');if(!bot)return;
 const ip=request.headers.get('CF-Connecting-IP')||'';
 const list=await ranges(env,bot);
 const id=identity(bot,ip,list?.ranges,list?.updated,now);
 // Edge rate limits bound write pressure. Ordinary visitors never enter this branch.
 if(env.CANDIDATE_LIMIT){const limit=await env.CANDIDATE_LIMIT.limit({key:id.verified?'verified-candidates':'suspected-candidates'});if(!limit.success)return;}
 await env.DB.prepare('INSERT INTO crawler_counts(day,crawler,company,kind,verification,path,request_count,last_seen_at) VALUES(?,?,?,?,?,?,1,?) ON CONFLICT(day,crawler,verification,path) DO UPDATE SET request_count=request_count+1,last_seen_at=excluded.last_seen_at')
  .bind(cstDay(now),id.type,id.verified?id.company:'unknown',id.kind,id.verification,path,new Date(now).toISOString()).run();
}
async function statistics(env){
 const day=cstDay(),cutoff=new Date(Date.now()-89*86400000+28800000).toISOString().slice(0,10);
 const [today,totals,days,pages,health,meta]=await env.DB.batch([
  env.DB.prepare('SELECT crawler,company,kind,verification,SUM(request_count) AS requests,MAX(last_seen_at) AS lastSeen FROM crawler_counts WHERE day=? GROUP BY crawler,company,kind,verification').bind(day),
  env.DB.prepare("SELECT company,kind,SUM(request_count) AS requests,MAX(last_seen_at) AS lastSeen FROM crawler_counts WHERE day>=? AND verification='official-ip-and-ua' GROUP BY company,kind").bind(cutoff),
  env.DB.prepare("SELECT company,COUNT(DISTINCT day) AS days FROM crawler_counts WHERE day>=? AND verification='official-ip-and-ua' AND kind='autonomous' GROUP BY company").bind(new Date(Date.now()-6*86400000+28800000).toISOString().slice(0,10)),
  env.DB.prepare("SELECT path,SUM(request_count) AS requests FROM crawler_counts WHERE day=? AND verification='official-ip-and-ua' GROUP BY path ORDER BY requests DESC LIMIT 5").bind(day),
  env.DB.prepare('SELECT crawler,updated_at FROM official_ranges'),
  env.DB.prepare("SELECT value FROM observer_meta WHERE key='enabled_at'")
 ]);
 const valid=today.results.filter(x=>x.verification==='official-ip-and-ua');
 return {enabled:true,day,generatedAt:new Date().toISOString(),enabledAt:meta.results[0]?.value||null,entry:env.PUBLIC_ORIGIN+'/',scope:'仅统计经过观察入口的请求；直接访问 GitHub Pages 不可见',retentionDays:90,verifiedTypes:valid.length,verifiedRequests:valid.reduce((s,x)=>s+x.requests,0),crawlers:today.results,totals:totals.results,activeDays:days.results,topPages:pages.results,officialLists:health.results.map(x=>({crawler:x.crawler,updatedAt:new Date(x.updated_at).toISOString(),fresh:Date.now()-x.updated_at<48*3600000})),sampling:'候选爬虫请求受边缘限流，统计为实际记录的请求下限，不是独立访客人数'};
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),origin=env.PUBLIC_ORIGIN;
  if(url.pathname==='/api/youtube'){
   if(request.method==='OPTIONS')return new Response(null,{headers:cors()});
   if(request.method!=='GET')return new Response('Method not allowed',{status:405});
   try{return Response.json(await youtubeSnapshot(env),{headers:{...cors(),'Cache-Control':'public, max-age=300'}});}
   catch(e){return Response.json({enabled:false,code:e.code||'unavailable',message:youtubeMessage(e)},{status:e.status||503,headers:{...cors(),'Cache-Control':'no-store'}});}
  }
  if(url.pathname==='/internal/refresh'){
   if(request.method!=='POST'||!env.BOOTSTRAP_TOKEN||request.headers.get('Authorization')!=='Bearer '+env.BOOTSTRAP_TOKEN)return new Response('Not found',{status:404});
   return Response.json(await refreshRanges(env));
  }
  if(url.pathname==='/api/observation'){
   if(request.method==='OPTIONS')return new Response(null,{headers:cors()});
   if(request.method!=='GET')return new Response('Method not allowed',{status:405});
   try{return Response.json(await statistics(env),{headers:cors()});}catch{return Response.json({enabled:true,error:'Statistics temporarily unavailable'},{status:503,headers:{...cors(),'Cache-Control':'no-store'}});}
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(!allowedPath(url.pathname))return new Response('Not found',{status:404});
  let response;
  if(url.pathname==='/robots.txt')response=new Response(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
  else{
   const target=new URL(url.pathname.slice(1),upstream);
   const fetched=await fetch(target,{method:request.method,headers:{'User-Agent':'AI-Zoo-Observer-Origin/1.0'},redirect:'manual',cf:{cacheTtl:120,cacheEverything:true}});
   response=new Response(fetched.body,{status:fetched.status,headers:fetched.headers});
   response.headers.delete('Set-Cookie');response.headers.set('X-Content-Type-Options','nosniff');
   if(response.status>=300&&response.status<400){const location=response.headers.get('Location');if(location?.startsWith(upstream))response.headers.set('Location',origin+'/'+location.slice(upstream.length));else response.headers.delete('Location');}
   if(url.pathname==='/sitemap.xml'&&response.ok)response=new Response((await response.text()).replaceAll(upstream,origin+'/'),{headers:{'Content-Type':'application/xml; charset=utf-8'}});
   else if(response.headers.get('Content-Type')?.includes('text/html')){
    const rewrite=new HTMLRewriter().on('link[rel="canonical"]',{element(el){el.setAttribute('href',origin+url.pathname);}});
    if(url.pathname==='/'){
     let html;try{html=youtubeHtml(await youtubeSnapshot(env));}catch(e){html='<p class="muted">'+youtubeMessage(e)+'</p>';}
     rewrite.on('#youtube-content',{element(el){el.setAttribute('data-rendered','true');el.setInnerContent(html,{html:true});}});
    }
    response=rewrite.transform(response);
   }
  }
  if(response.status===200&&request.method==='GET'&&observedPath(url.pathname))ctx.waitUntil(record(request,env,url.pathname).catch(()=>{}));
  return response;
 },
 async scheduled(event,env,ctx){
  ctx.waitUntil((async()=>{
   if(event.cron===youtubeCron){try{await youtubeSnapshot(env,{force:true});}catch{}return;}
   await refreshRanges(env);
   const cutoff=new Date(Date.now()-89*86400000+28800000).toISOString().slice(0,10);
   await env.DB.prepare('DELETE FROM crawler_counts WHERE day<?').bind(cutoff).run();
   await env.DB.prepare('DELETE FROM youtube_cache WHERE updated_at<?').bind(Date.now()-29*86400000).run();
  })());
 }
};
