import test from 'node:test';
import assert from 'node:assert/strict';
import {candidate,contains,identity,parseRanges} from './identity.mjs';
import {record,observedPath,cstDay} from './worker.mjs';
import {indexNow,indexKey,sitemapPages} from './discovery.mjs';
import {category,residentStatus} from '../shared/observation.mjs';
test('IPv4/IPv6 CIDR boundaries and malformed addresses',()=>{
 assert(contains('192.0.2.0','192.0.2.0/24'));assert(contains('192.0.2.255','192.0.2.0/24'));assert(!contains('192.0.3.0','192.0.2.0/24'));
 assert(contains('2001:db8::ffff','2001:db8::/32'));assert(!contains('2001:db9::1','2001:db8::/32'));
 assert(contains('::ffff:192.0.2.1','::ffff:c000:200/120'));
 assert(!contains('garbage','0.0.0.0/0'));assert(!contains('2001:::1','::/0'));assert(!contains('192.0.2.1','::/0'));assert(!contains('1.2.3.4','1.2.3.0/99'));
});
test('classification never turns user fetch or search engines into autonomous AI discovery',()=>{
 assert.equal(category({crawler:'ChatGPT-User',kind:'user_fetch',verification:'official-ip-and-ua'}),'A');
 assert.equal(category({crawler:'KimiBot',kind:'training',verification:'official-ip-and-ua'}),'C');
 assert.equal(category({crawler:'KimiBot',kind:'training',verification:'unverified'}),'D');
 assert.equal(category({crawler:'unknown',verification:'unverified'}),'E');
 const d={totals:[{company:'openai',kind:'user_fetch',requests:10,lastSeen:new Date().toISOString()}],activeDays:[]};
 assert.equal(residentStatus(d,'openai').state,'💤 尚未发现');assert.equal(residentStatus(d,'openai').requests,10);
});
test('IndexNow submits live changed pages once, validates key, excludes empty/foreign/404 URLs',async()=>{
 const origin='https://example.org',xml='<urlset>'+['/','/history/','/history/2026-10-20/'].map(p=>`<url><loc>${origin+p}</loc><lastmod>2026-10-20T00:00:00Z</lastmod></url>`).join('')+'<url><loc>https://evil.example/</loc><lastmod>2026-10-20T00:00:00Z</lastmod></url></urlset>';
 assert.equal(sitemapPages(xml,origin).length,3);assert.equal(sitemapPages('<url><loc>https://example.org/</loc></url>',origin).length,0);
 const stored=new Map(),posts=[];let keyGood=true;
 const env={PUBLIC_ORIGIN:origin,DB:{prepare(sql){let args=[];const q={bind(...a){args=a;return q;},async all(){return {results:sql.includes('RETURNING')?[{value:args[0]}]:[...stored.values()]};},async run(){if(sql.startsWith('INSERT INTO indexnow_pages'))stored.set(args[0],{url:args[0],lastmod:args[1]});return {};}};return q;},async batch(q){return Promise.all(q.map(x=>x.run()));}}};
 const fetcher=async(url,options={})=>{if(url.includes('sitemap.xml'))return new Response(xml);if(url.endsWith(indexKey+'.txt'))return new Response(keyGood?indexKey:'wrong');if(options.method==='HEAD')return new Response(null,{status:url.endsWith('/history/')?404:200});if(options.method==='POST'){posts.push(JSON.parse(options.body));return new Response(null,{status:202});}throw Error('Unexpected request');};
 const first=await indexNow(env,fetcher);assert.equal(first.submitted,2);assert.equal(first.status,202);assert(!posts[0].urlList.includes(origin+'/history/'));
 const second=await indexNow(env,fetcher);assert.equal(second.submitted,0);assert.equal(posts.length,1);
 stored.clear();keyGood=false;const failed=await indexNow(env,fetcher);assert.match(failed.error,/key verification/);assert.equal(posts.length,1);
});
test('UA alone never verifies; stale lists fail closed; different types stay distinct',()=>{
 const now=Date.now(),bot=candidate('Mozilla/5.0 (compatible; GPTBot/1.4; +https://openai.com/gptbot)');
 assert.equal(bot.type,'GPTBot');assert.equal(candidate('normal browser'),null);
 assert.equal(identity(bot,'192.0.2.1',null,null,now).verified,false);
 assert.equal(identity(bot,'192.0.2.1',['192.0.2.0/24'],now,now).verified,true);
 assert.equal(identity(bot,'192.0.2.1',['192.0.2.0/24'],now-49*3600000,now).verified,false);
 assert.equal(identity(bot,'198.51.100.1',['192.0.2.0/24'],now,now).verified,false);
 assert.equal(candidate('ChatGPT-User/1.0').kind,'user_fetch');
 assert.equal(candidate('Googlebot/2.1').kind,'search');
 assert.equal(candidate('GPTBot/1.0 PerplexityBot/1.0').company,'unknown');
 assert.equal(identity(candidate('ClaudeBot/1.0'),'192.0.2.1',['192.0.2.0/24'],now,now).verified,true);
 assert.equal(candidate('KimiBot/1.0').kind,'training');assert.equal(candidate('Kimi-SearchBot/1.0').kind,'search');
 assert.equal(candidate('Kimi-User/1.0').kind,'user_fetch');assert.equal(candidate('Bytespider/1.0').company,'unknown');
 assert.equal(candidate('DeepSeekBot/1.0').company,'unknown');assert.equal(candidate('GrokBot/1.0').company,'unknown');
 assert.throws(()=>parseRanges({prefixes:[]}));assert.equal(parseRanges({prefixes:[{ipv4Prefix:'192.0.2.0/24'}]}).length,1);
});
test('record stores only aggregate fields, never IP/UA/query; ordinary requests are ignored',async()=>{
 const writes=[];const env={DB:{prepare(sql){return {bind(...args){return {async first(){return {ranges_json:'["192.0.2.0/24"]',updated_at:Date.now()};},async run(){writes.push({sql,args});}};}};}}};
 const request=ua=>({method:'GET',cf:{},headers:new Headers({'User-Agent':ua,'CF-Connecting-IP':'192.0.2.1'})});
 await record(request('normal browser'),env,'/');assert.equal(writes.length,0);
 await record(request('GPTBot/1.4'),env,'/');assert.equal(writes.length,1);
 assert.equal(writes[0].args[4],'official-ip-and-ua');assert(!JSON.stringify(writes).includes('192.0.2.1'));assert(!JSON.stringify(writes).includes('GPTBot/1.4'));
 await record(request('GPTBot/1.4'),env,'/arbitrary');assert.equal(writes.length,1);
 const fake=request('GPTBot/1.4');delete fake.cf;await record(fake,env,'/');assert.equal(writes.length,1);
 assert(!observedPath('/history/not-a-date/'));assert.equal(cstDay(Date.parse('2026-10-19T16:30:00Z')),'2026-10-20');
});
