(async()=>{
 const details=document.querySelector('#observer-details');if(!details)return;
 if(document.querySelector('meta[name="ai-zoo-mode"]')?.content==='static-mirror'){document.querySelector('#observer-state').textContent='静态快照 · 非实时';return;}
 const origin=document.querySelector('meta[name="ai-zoo-observer"]')?.content;
 const fmt=t=>t?new Date(t).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未记录 / 旧记录缺失';
 const text=(tag,value,parent)=>{const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;};
 const labels={A:'用户主动请求',B:'已验证搜索爬虫',C:'已验证训练爬虫',D:'自报身份但未验证',E:'未知自动化来源'};
 try{
  const r=await fetch(origin+'/api/observation',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Unavailable');const d=await r.json();if(d.error||!d.enabled)throw Error('Unavailable');
  details.replaceChildren();document.querySelector('#verified-count').textContent=String(d.verifiedRequests);document.querySelector('#observer-state').textContent='已启用 ●';
  document.querySelector('#observer-summary').textContent=`${d.day}（北京时间）· ${d.verifiedTypes} 种已验证类型 · ${d.verifiedRequests} 次请求。不是独立访客人数。`;
  text('p',`仅观察 ${d.entry}；直接访问备用页不可见。统计自 ${fmt(d.enabledAt)} 起，保留最近 90 天。`,details);
  text('h3','今天的真实类型与分类',details);const list=text('ul','',details);
  for(const row of d.crawlers)text('li',`${row.crawler} · ${labels[row.category]||'未知'} · ${row.requests} 次 · 最近 ${fmt(row.lastSeen)}`,list);
  if(!d.crawlers.length)text('li','今天尚无已记录的候选爬虫请求。',list);
  text('h3','按日期统计',details);const daily=text('ul','',details);
  for(const row of d.daily||[])text('li',`${row.day} · ${row.crawler} · ${labels[row.category]} · ${row.requests} 次`,daily);
  text('h3','页面与首次发现',details);const history=text('ul','',details);
  for(const row of d.history||[])text('li',`${row.crawler} · ${row.path} · ${row.requests} 次 · 首次 ${fmt(row.firstSeen)} · 最近 ${fmt(row.lastSeen)}`,history);
  if(d.topPages.length){text('h3','今日最受已验证爬虫关注的页面',details);const ul=text('ul','',details);for(const row of d.topPages){const li=text('li','',ul);const a=text('a',row.path,li);a.href=new URL(row.path,origin).href;text('span',` · ${row.requests} 次`,li);}}
  if(d.comparison)text('p',`优化前基线（${fmt(d.comparison.baselineAt)}）：${d.comparison.before} 次；之后新增 ${d.comparison.additional} 次已验证请求。不能证明由优化引起。`,details);
  const stale=d.officialLists.filter(x=>!x.fresh);if(stale.length)text('p',`官方清单待刷新：${stale.map(x=>x.crawler).join('、')}；对应身份暂不验证。`,details);
  text('p','A 用户请求不代表主动发现；B 搜索和 C 训练分别记录，触发原因未知。D/E 不计入已验证来访。Googlebot/Bingbot 仅代表搜索引擎，不等于 Gemini/Copilot。官方 IP + UA 联合验证；限流使统计成为已记录下限。',details);
  for(const card of document.querySelectorAll('[data-company]')){
   const rows=d.totals.filter(x=>x.company===card.dataset.company),count=rows.reduce((n,x)=>n+x.requests,0),last=rows.map(x=>x.lastSeen).sort().at(-1);
   const recent=rows.some(x=>['search','training'].includes(x.kind)&&Date.now()-Date.parse(x.lastSeen)<7*86400000),days=d.activeDays.find(x=>x.company===card.dataset.company)?.days||0;
   card.querySelector('.sleep').textContent=days>=3?'🏠 常驻居民':recent?'🐾 最近出没':'💤 尚未发现';
   const foot=card.querySelector('.resident-foot');foot.replaceChildren();text('div',`最近已验证：${fmt(last)}`,foot);text('div',`90 天内已验证请求：${count} 次`,foot);
   if(rows.some(x=>x.kind==='user_fetch'))text('div','含用户主动请求（不用于常驻判定）',foot);
   if(card.dataset.company==='google')text('div','仅代表 Google 搜索，不代表 Gemini。',foot);
  }
 }catch{document.querySelector('#observer-state').textContent='已启用 · 统计暂不可用';document.querySelector('#observer-summary').textContent='实时统计读取失败；下方保留标有时间的静态快照，不把失败算作零访问。';}
})();
