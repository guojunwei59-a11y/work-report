// IndexNow ownership key is deliberately public, not an API secret.
export const indexKey='9dbc955d8ab848a888c137af02477eb8';
const source='https://guojunwei59-a11y.github.io/work-report/ai-zoo/sitemap.xml';
const pagePath=p=>p==='/'||p==='/history/'||/^\/history\/\d{4}-\d{2}-\d{2}\/$/.test(p);
export function sitemapPages(xml,origin){
 const out=new Map();
 for(const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)){
  try{const u=new URL(m[1]);if(u.origin!==origin||!pagePath(u.pathname)||u.search||u.hash||!/^\d{4}-\d\d-\d\dT/.test(m[2])||!Number.isFinite(Date.parse(m[2])))continue;out.set(u.href,{url:u.href,lastmod:m[2]});}catch{}
 }
 return [...out.values()];
}
export async function discoveryStatus(env){
 const rows=await env.DB.prepare('SELECT url,lastmod,status,submitted_at AS submittedAt FROM indexnow_pages ORDER BY url').all();
 const meta=await env.DB.prepare("SELECT value FROM observer_meta WHERE key='indexnow_status'").first();
 return {indexNow:{keyLocation:`${env.PUBLIC_ORIGIN}/${indexKey}.txt`,lastRun:meta?JSON.parse(meta.value):null,pages:rows.results,meaning:'200 表示已收到，202 表示等待密钥验证；不保证收录。'},google:{configured:!!env.GOOGLE_SITE_VERIFICATION,sitemap:env.PUBLIC_ORIGIN+'/sitemap.xml',note:'需在 Search Console 完成 URL 前缀所有权验证和提交；IndexNow 不面向 Google。'},bing:{configured:!!env.BING_SITE_VERIFICATION,note:'可导入已验证的 Search Console；IndexNow 提交无需此账号。'}};
}
export async function indexNow(env,fetcher=fetch,now=Date.now()){
 // A short durable lease prevents concurrent schedules from submitting the same batch.
 const claim=await env.DB.prepare("INSERT INTO observer_meta(key,value) VALUES('indexnow_lease',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(observer_meta.value AS INTEGER)<? RETURNING value").bind(String(now+300000),now).all();
 if(!claim.results.length)return {skipped:'busy'};
 const save=async value=>{await env.DB.prepare("INSERT INTO observer_meta(key,value) VALUES('indexnow_status',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({at:new Date(now).toISOString(),...value})).run();return value;};
 try{
  const r=await fetcher(source,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'AI-Zoo-Sitemap-Sync/1.4'}});if(!r.ok)throw Error('Sitemap HTTP '+r.status);
  const pages=sitemapPages(await r.text(),env.PUBLIC_ORIGIN);if(!pages.length)return await save({submitted:0,reason:'等待具有真实 lastmod 的 Sitemap'});
  const stored=(await env.DB.prepare('SELECT url,lastmod FROM indexnow_pages').all()).results;
  const changed=pages.filter(p=>!stored.some(x=>x.url===p.url&&x.lastmod===p.lastmod));
  if(!changed.length)return await save({submitted:0,reason:'页面无实际变化'});
  const key=await fetcher(`${env.PUBLIC_ORIGIN}/${indexKey}.txt`,{signal:AbortSignal.timeout(15000)});if(!key.ok||(await key.text()).trim()!==indexKey)throw Error('Public key verification failed');
  // HEAD requests are never recorded as crawler visits.
  const checks=await Promise.all(changed.map(async p=>{try{const h=await fetcher(p.url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});return h.status===200?p:null;}catch{return null;}}));
  const ready=checks.filter(Boolean);if(!ready.length)return await save({submitted:0,reason:'实际页面可达性检查未通过'});
  const response=await fetcher('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:new URL(env.PUBLIC_ORIGIN).hostname,key:indexKey,keyLocation:`${env.PUBLIC_ORIGIN}/${indexKey}.txt`,urlList:ready.map(x=>x.url)}),signal:AbortSignal.timeout(20000)});
  if(![200,202].includes(response.status))throw Error('IndexNow HTTP '+response.status);
  await env.DB.batch(ready.map(p=>env.DB.prepare('INSERT INTO indexnow_pages(url,lastmod,status,submitted_at) VALUES(?,?,?,?) ON CONFLICT(url) DO UPDATE SET lastmod=excluded.lastmod,status=excluded.status,submitted_at=excluded.submitted_at').bind(p.url,p.lastmod,response.status,new Date(now).toISOString())));
  return await save({submitted:ready.length,status:response.status});
 }catch(e){return await save({submitted:0,error:e.message});}
 finally{await env.DB.prepare("DELETE FROM observer_meta WHERE key='indexnow_lease' AND value=?").bind(String(now+300000)).run();}
}
