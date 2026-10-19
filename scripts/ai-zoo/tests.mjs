import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {normalize,collectSource,platforms} from './sources.mjs';
import {merge,update,dayOf,previousDay} from './update.mjs';
const time='2026-10-20T04:30:00.000Z';
const row={keyword:'测试词',rank:1,url:'https://example.com/'};
// Synthetic fixture data stays in temporary test folders and is never published.
test('deduplicate normalized platform keywords, reject unsafe URLs',()=>{
 const data=normalize([row,{...row,keyword:' 测试词 '},{...row,keyword:'bad',url:'javascript:alert(1)'},{...row,keyword:'other',rank:0}], 'baidu',time);
 assert.equal(data.length,1);assert.equal(data[0].platform,'baidu');assert.equal(data[0].collectedAt,time);
});
test('blocked and empty responses fail without fallback fabrication',async()=>{
 await assert.rejects(collectSource('weibo',time,async()=>new Response('',{status:403})),/HTTP 403/);
 await assert.rejects(collectSource('douyin',time,async()=>new Response('')),/空内容/);
});
test('one failed platform preserves its timestamp; unchanged snapshots do not change state',()=>{
 const results=Object.keys(platforms).map(id=>({status:'fulfilled',value:normalize([row],id,time)}));
 const first=merge(null,results,time);
 const failed=[{status:'rejected',reason:new Error('HTTP 403')},...results.slice(1)];
 const second=merge(first,failed,'2026-10-20T10:30:00.000Z');
 assert.deepEqual(second.platforms.weibo.items,first.platforms.weibo.items);
 assert.equal(second.platforms.baidu.items[0].collectedAt,time);
 assert.deepEqual(merge(first,results,'2026-10-20T10:30:00.000Z'),first);
 assert.equal(dayOf('2026-10-19T16:30:00Z'),'2026-10-20');assert.equal(previousDay('2026-10-20'),'2026-10-19');
});
test('date archives link to real files; all failures preserve data; retention stays bounded',async()=>{
 const project=await fs.mkdtemp(path.join(os.tmpdir(),'ai-zoo-test-'));
 try{
   await update({project,time:'2026-07-01T04:30:00Z',collector:async(id,t)=>normalize([row],id,t)});
   await update({project,time:'2026-10-19T04:30:00Z',collector:async(id,t)=>normalize([row],id,t)});
   const {state}=await update({project,time,collector:async(id,t)=>{if(id==='weibo')throw Error('blocked');return normalize([{...row,keyword:'<script>& 测试'}],id,t);}});
   const html=await fs.readFile(path.join(project,'ai-zoo/index.html'),'utf8');
   assert(html.includes('&lt;script&gt;&amp; 测试'));assert(html.includes('观察系统已启用'));
   assert(html.includes('history/2026-10-19/'));assert(html.includes('datetime="2026-10-19T04:30:00Z"'));
   assert(!html.includes('<script>& 测试'));
   await fs.access(path.join(project,'ai-zoo/history/2026-10-20/index.html'));
   await assert.rejects(fs.access(path.join(project,'ai-zoo/data/2026-07-01.json')));
   await assert.rejects(fs.access(path.join(project,'ai-zoo/history/2026-07-01/')));
   const failed=await update({project,time,collector:async()=>{throw Error('offline');}});
   assert.deepEqual(failed.state.platforms.baidu.items,state.platforms.baidu.items);
   assert.equal(failed.succeeded,0);
 }finally{await fs.rm(project,{recursive:true,force:true});}
});
