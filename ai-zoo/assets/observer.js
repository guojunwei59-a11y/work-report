(async()=>{
 const details=document.querySelector('#observer-details');if(!details)return;
 const origin=document.querySelector('meta[name="ai-zoo-observer"]')?.content;
 const fmt=t=>t?new Date(t).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'尚无记录';
 const text=(tag,value,parent)=>{const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;};
 try{
  const r=await fetch(origin+'/api/observation',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Unavailable');const d=await r.json();if(d.error||!d.enabled)throw Error('Unavailable');
  document.querySelector('#verified-count').textContent=String(d.verifiedRequests);
  document.querySelector('#observer-summary').textContent=`${d.day}（北京时间）· ${d.verifiedTypes} 种已验证爬虫类型 · ${d.verifiedRequests} 次已记录请求。不是独立访客人数。`;
  text('p',`仅观察 ${d.entry} 的请求。直接访问 GitHub Pages 不可见。数据自 ${fmt(d.enabledAt)} 起，保留最近 90 天。`,details);
  const verified=d.crawlers.filter(x=>x.verification==='official-ip-and-ua');
  text('h3','今天的已验证请求',details);
  if(!verified.length)text('p','暂未发现经过验证的爬虫请求。等待真实脚印，不添加示例访客。',details);
  else{
   const list=text('ul','',details);
   for(const row of verified)text('li',`${row.crawler} · ${row.kind==='user_fetch'?'用户主动检索':row.kind==='search'?'Google 搜索抓取':'自主爬虫'} · ${row.requests} 次 · 最近 ${fmt(row.lastSeen)}`,list);
  }
  const suspect=d.crawlers.filter(x=>x.verification!=='official-ip-and-ua');
  if(suspect.length){const box=document.createElement('details');details.append(box);text('summary','未验证的疑似请求（不计入动物已验证来访）',box);const ul=text('ul','',box);for(const row of suspect)text('li',`${row.crawler} 自称类型 · ${row.requests} 次 · 最近 ${fmt(row.lastSeen)}；身份未经确认`,ul);}
  if(d.topPages.length){text('h3','今日最受已验证爬虫关注的页面',details);const ul=text('ul','',details);for(const row of d.topPages){const li=text('li','',ul);const a=text('a',row.path,li);a.href=new URL(row.path,origin).href;text('span',` · ${row.requests} 次`,li);}}
  const stale=d.officialLists.filter(x=>!x.fresh);if(stale.length)text('p',`部分官方 IP 清单待刷新：${stale.map(x=>x.crawler).join('、')}。对应类型暂不认定为已验证。`,details);
  text('p','身份验证：官方 IP 范围 + User-Agent。用户触发检索与自主爬虫分别列出；Googlebot 不代表 Gemini。候选请求受限流，计数为已记录的下限。',details);
  for(const card of document.querySelectorAll('[data-company]')){
   const rows=d.totals.filter(x=>x.company===card.dataset.company);const count=rows.reduce((n,x)=>n+x.requests,0);
   const last=rows.map(x=>x.lastSeen).sort().at(-1);
   const recent=rows.some(x=>x.kind!=='user_fetch'&&Date.now()-Date.parse(x.lastSeen)<7*86400000);
   const days=d.activeDays.find(x=>x.company===card.dataset.company)?.days||0;
   card.querySelector('.sleep').textContent=days>=3?'🏠 常驻居民':recent?'🐾 最近出没':'💤 尚未发现';
   const foot=card.querySelector('.resident-foot');foot.replaceChildren();text('div',`最近已验证：${fmt(last)}`,foot);text('div',`90 天内已验证请求：${count} 次`,foot);
   if(rows.some(x=>x.kind==='user_fetch'))text('div','包含用户主动检索（不用于常驻判定）',foot);
  }
 }catch{
  document.querySelector('#observer-state').textContent='已启用 · 统计暂不可用';
  document.querySelector('#observer-summary').textContent='统计服务暂不可用，请稍后刷新；不把读取失败显示成零访问。';
 }
})();
