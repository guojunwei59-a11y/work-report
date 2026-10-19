(async()=>{
 const box=document.querySelector('#youtube-content');if(!box||box.dataset.rendered==='true')return;
 const origin=document.querySelector('meta[name="ai-zoo-observer"]')?.content;
 const add=(tag,value,parent)=>{const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;};
 try{
  const r=await fetch(origin+'/api/youtube',{signal:AbortSignal.timeout(20000)}),d=await r.json();
  if(!r.ok||!d.enabled){box.textContent=d.code==='not_configured'?'YouTube 待配置：尚未添加服务端 API 密钥，暂无真实视频数据。':'YouTube 榜单暂不可用，请稍后刷新。';return;}
  box.replaceChildren();add('p',`美国区 · 官方 mostPopular 返回列表 · 采集于 ${new Date(d.fetchedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}（北京时间）；不是全球热搜榜。`,box).className='tiny';
  const list=add('ol','',box);list.className='feed-grid youtube-list';
  for(const v of d.videos){
   const url=new URL(v.url);if(url.origin!=='https://www.youtube.com'||url.pathname!=='/watch')continue;
   const li=add('li','',list);li.className='feed-item';add('span','▶',li).className='rank';const content=add('div','',li);
   const link=add('a',v.title+' ↗',content);link.className='keyword';link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
   const meta=add('div','',content);meta.className='item-meta';add('span','YouTube',meta).className='platform';add('span',v.channelTitle,meta);
  }
 }catch{box.textContent='YouTube 榜单暂不可用，请稍后刷新；暂无可确认的数据。';}
})();
