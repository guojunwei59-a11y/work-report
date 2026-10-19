import test from 'node:test';
import assert from 'node:assert/strict';
import {videosFromApi,youtubeSnapshot,youtubeHtml} from './youtube.mjs';
const item={id:'AbcDefGh123',snippet:{title:'<test> & title',channelTitle:'Fixture channel'}};
function mockDb(){let row=null;return {prepare(sql){const make=args=>({async first(){return row;},async run(){if(sql.startsWith('INSERT'))row??={updated_at:0,lease_until:0};else if(sql.includes('WHERE id=\'US\' AND lease_until')){if(row.lease_until>=args[1])return {meta:{changes:0}};row.lease_until=args[0];}else if(sql.includes('SET snapshot_json')){row={snapshot_json:args[0],updated_at:args[1],lease_until:args[2]};}else row.lease_until=args[0];return {meta:{changes:1}};}});return {...make([]),bind(...args){return make(args);}};}};}
test('unconfigured key never calls Google or pretends to have data',async()=>{
 let called=false;await assert.rejects(youtubeSnapshot({}, {fetcher:async()=>{called=true;}}),e=>e.code==='not_configured');assert.equal(called,false);
});
test('safe metadata, no credentials in URLs or snapshots, cached requests avoid quota',async()=>{
 const env={YOUTUBE_API_KEY:'synthetic-key-not-real',DB:mockDb()};let calls=0;
 const fetcher=async(url,options)=>{calls++;assert(!url.includes(env.YOUTUBE_API_KEY));assert.equal(options.headers['X-Goog-Api-Key'],env.YOUTUBE_API_KEY);assert.equal(new URL(url).searchParams.get('regionCode'),'US');return Response.json({items:[item,item,{id:'invalid',snippet:{title:'bad'}}]});};
 const first=await youtubeSnapshot(env,{fetcher,now:1000000});const second=await youtubeSnapshot(env,{fetcher,now:1000001});
 assert.equal(calls,1);assert.deepEqual(second,first);assert.equal(first.videos.length,1);assert(!JSON.stringify(first).includes(env.YOUTUBE_API_KEY));
 const html=youtubeHtml(first);assert(html.includes('&lt;test&gt; &amp; title'));assert(!html.includes('<test>'));
 await assert.rejects(youtubeSnapshot(env,{now:1000000+7*3600000,fetcher:async()=>{throw Error('URL might contain '+env.YOUTUBE_API_KEY);}}),e=>e.code==='upstream_unavailable'&&!e.message.includes(env.YOUTUBE_API_KEY));
});
test('official list shape and length are validated',()=>{
 assert.throws(()=>videosFromApi({items:[]}));assert.throws(()=>videosFromApi({error:'blocked'}));
 assert.equal(videosFromApi({items:Array.from({length:50},(_,i)=>({id:'video'+String(i).padStart(6,'0'),snippet:{title:'fixture'}}))}).length,30);
});
