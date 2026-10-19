// Independent public endpoints. No cookies, login or challenge bypass.
export const platforms = { weibo: '微博', baidu: '百度', bilibili: 'B站', zhihu: '知乎', douyin: '抖音', kuaishou: '快手' };
export const endpoints = {
  weibo: 'https://weibo.com/ajax/side/hotSearch',
  baidu: 'https://top.baidu.com/board?tab=realtime',
  bilibili: 'https://s.search.bilibili.com/main/hotword?limit=30',
  zhihu: 'https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true',
  douyin: 'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1',
  kuaishou: 'https://www.kuaishou.com/?isHome=1',
};
export function parseSource(id, text) {
  let rows;
  const json = () => JSON.parse(text);
  if (id === 'baidu') {
    const embedded = text.match(/<!--s-data:([\s\S]*?)-->/)?.[1];
    if (!embedded) throw new Error('公开页面未包含榜单');
    rows = JSON.parse(embedded).data.cards[0].content.filter(x => !x.isTop).map((x,i) => ({keyword:x.word,url:x.rawUrl,rank:i+1}));
  } else if (id === 'bilibili') {
    rows = json().list.map((x,i) => ({keyword:x.show_name || x.keyword,url:`https://search.bilibili.com/all?keyword=${encodeURIComponent(x.keyword)}`,rank:i+1}));
  } else if (id === 'zhihu') {
    rows = json().data.map((x,i) => ({keyword:x.target.title_area.text,url:x.target.link.url,rank:i+1}));
  } else if (id === 'weibo') {
    rows = json().data.realtime.filter(x => !x.is_ad).map((x,i) => ({keyword:x.word,url:`https://s.weibo.com/weibo?q=${encodeURIComponent(x.word)}`,rank:Number.isInteger(x.realpos)&&x.realpos>0?x.realpos:i+1}));
  } else if (id === 'douyin') {
    rows = json().data.word_list.map((x,i) => ({keyword:x.word,url:`https://www.douyin.com/hot/${x.sentence_id}`,rank:Number.isInteger(x.position)&&x.position>0?x.position:i+1}));
  } else if (id === 'kuaishou') {
    const embedded = text.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]+?});/)?.[1];
    if (!embedded) throw new Error('公开页面未包含榜单');
    const c = JSON.parse(embedded).defaultClient;
    const ref = c.ROOT_QUERY['visionHotRank({"page":"home"})'];
    rows = c[ref.id].items.filter(x => c[x.id].tagType !== '置顶').map((x,i) => ({keyword:c[x.id].name,url:`https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(c[x.id].name)}`,rank:i+1}));
  }
  return rows;
}
export function normalize(rows, platform, collectedAt) {
  if (!Array.isArray(rows)) throw new Error('榜单结构变化');
  const seen = new Set();
  const items = [];
  for (const row of rows) {
    const keyword = typeof row.keyword === 'string' ? row.keyword.normalize('NFKC').trim().replace(/\s+/g,' ') : '';
    const key = keyword.toLocaleLowerCase('zh-CN');
    let url;
    try { url = new URL(row.url); } catch { continue; }
    if (!keyword || keyword.length > 500 || seen.has(key) || !['http:','https:'].includes(url.protocol) || !Number.isInteger(row.rank) || row.rank < 1) continue;
    seen.add(key);
    items.push({keyword,platform,rank:row.rank,collectedAt,url:url.href});
    if (items.length === 30) break;
  }
  if (!items.length) throw new Error('未获得可用公开榜单');
  return items;
}
export async function collectSource(id, time, fetcher=fetch) {
  const r = await fetcher(endpoints[id], {signal:AbortSignal.timeout(20000),headers:{'User-Agent':'AI-Zoo/1.0 (public trending observation; 4 requests/day/source)','Accept':'application/json,text/html;q=0.9'}});
  if (!r.ok) throw new Error(`HTTP ${r.status}（未绕过访问限制）`);
  const text = await r.text();
  if (!text.trim()) throw new Error('公开接口返回空内容');
  return normalize(parseSource(id,text),id,time);
}
