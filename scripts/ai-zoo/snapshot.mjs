import fs from 'node:fs/promises';
import path from 'node:path';
// No IPs, User-Agents or YouTube API data are copied into the repository.
export async function syncObservation(root,fetcher=fetch){
 const file=path.join(root,'ai-zoo/data/observation-snapshot.json');
 try{
  const r=await fetcher('https://ai-zoo-observer.workers-bridge.workers.dev/api/observation',{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(!d.enabled||d.error||!d.daily||!d.history)throw Error('Invalid observation snapshot');
  const value=Object.fromEntries(['enabled','day','generatedAt','enabledAt','entry','retentionDays','verifiedTypes','verifiedRequests','crawlers','totals','activeDays','topPages','daily','history','comparison','firstSeenNote'].map(k=>[k,d[k]]));
  let old;try{old=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
  const signature=x=>JSON.stringify({...x,generatedAt:undefined});
  if(signature(old||{})!==signature(value))await fs.writeFile(file,JSON.stringify(value,null,2)+'\n');
  return true;
 }catch{console.warn('观察快照同步失败，保留上次成功快照及其原时间。');return false;}
}
