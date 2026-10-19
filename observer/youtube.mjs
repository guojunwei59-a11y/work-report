export const youtubeCron='30 4,10,16,22 * * *';
const lifetime=6*3600000;
export class YouTubeError extends Error {constructor(code,status=503){super(code);this.code=code;this.status=status;}}
export function videosFromApi(data){
 if(!Array.isArray(data.items))throw new YouTubeError('invalid_response',502);
 const seen=new Set(),videos=[];
 for(const row of data.items){
  if(!/^[A-Za-z0-9_-]{11}$/.test(row.id)||typeof row.snippet?.title!=='string'||!row.snippet.title.trim()||seen.has(row.id))continue;
  seen.add(row.id);videos.push({id:row.id,title:row.snippet.title.slice(0,500),channelTitle:String(row.snippet.channelTitle||'').slice(0,200),url:'https://www.youtube.com/watch?v='+row.id});
  if(videos.length===30)break;
 }
 if(!videos.length)throw new YouTubeError('empty_chart',502);
 return videos;
}
export async function youtubeSnapshot(env,{force=false,fetcher=fetch,now=Date.now()}={}){
 if(!env.YOUTUBE_API_KEY)throw new YouTubeError('not_configured');
 const row=await env.DB.prepare("SELECT snapshot_json,updated_at FROM youtube_cache WHERE id='US'").first();
 if(!force&&row?.snapshot_json&&now-row.updated_at<lifetime)return JSON.parse(row.snapshot_json);
 await env.DB.prepare("INSERT INTO youtube_cache(id,updated_at,lease_until) VALUES('US',0,0) ON CONFLICT(id) DO NOTHING").run();
 const lease=await env.DB.prepare("UPDATE youtube_cache SET lease_until=? WHERE id='US' AND lease_until<?").bind(now+60000,now).run();
 if(lease.meta.changes!==1)throw new YouTubeError('refresh_pending');
 try{
  const url=new URL('https://www.googleapis.com/youtube/v3/videos');
  url.search=new URLSearchParams({part:'snippet',chart:'mostPopular',regionCode:'US',maxResults:'30',fields:'items(id,snippet(title,channelTitle))'}).toString();
  const r=await fetcher(url.href,{headers:{'X-Goog-Api-Key':env.YOUTUBE_API_KEY},redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new YouTubeError(r.status===403?'authorization_or_quota_error':'upstream_error',502);
  const snapshot={enabled:true,provider:'YouTube Data API v3',region:'US',chart:'mostPopular',fetchedAt:new Date(now).toISOString(),videos:videosFromApi(await r.json())};
  await env.DB.prepare("UPDATE youtube_cache SET snapshot_json=?,updated_at=?,lease_until=? WHERE id='US'").bind(JSON.stringify(snapshot),now,now+60000).run();
  return snapshot;
 }catch(e){
  await env.DB.prepare("UPDATE youtube_cache SET lease_until=? WHERE id='US'").bind(now+10*60000).run();
  if(e instanceof YouTubeError)throw e;
  throw new YouTubeError('upstream_unavailable',502);
 }
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function youtubeHtml(data){
 return `<p class="tiny">美国区 · 官方 mostPopular 返回列表 · 采集于 ${esc(data.fetchedAt)}；不是全球热搜榜。</p><ol class="feed-grid youtube-list">${data.videos.map(v=>`<li class="feed-item"><span class="rank" aria-hidden="true">▶</span><div><a class="keyword" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.title)} ↗</a><div class="item-meta"><span class="platform">YouTube</span><span>${esc(v.channelTitle)}</span></div></div></li>`).join('')}</ol>`;
}
export function youtubeMessage(error){return error?.code==='not_configured'?'YouTube 待配置：尚未添加服务端 API 密钥，暂无真实视频数据。':'YouTube 榜单暂不可用，请稍后刷新；没有填入示例视频。';}
