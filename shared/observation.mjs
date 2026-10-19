export const labels={A:'用户主动通过 AI 请求',B:'已验证搜索爬虫',C:'已验证训练爬虫',D:'自报身份但未验证',E:'未知自动化来源'};
export function category(row){return row.verification!=='official-ip-and-ua'?(row.crawler==='unknown'||row.crawler==='ambiguous'?'E':'D'):({user_fetch:'A',search:'B',training:'C'}[row.kind]||'E');}
export function residentStatus(data,id,now=Date.now()){
 const rows=(data?.totals||[]).filter(x=>x.company===id),requests=rows.reduce((n,x)=>n+x.requests,0);
 const lastSeen=rows.map(x=>x.lastSeen).filter(Boolean).sort().at(-1);
 const recent=rows.some(x=>['search','training'].includes(x.kind)&&now-Date.parse(x.lastSeen)<7*86400000);
 const days=data?.activeDays?.find(x=>x.company===id)?.days||0;
 return {requests,lastSeen,state:days>=3?'🏠 常驻居民':recent?'🐾 最近出没':'💤 尚未发现',userFetch:rows.some(x=>x.kind==='user_fetch')};
}
