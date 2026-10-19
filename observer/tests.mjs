import test from 'node:test';
import assert from 'node:assert/strict';
import {candidate,contains,identity,parseRanges} from './identity.mjs';
import {record,observedPath,cstDay} from './worker.mjs';
test('IPv4/IPv6 CIDR boundaries and malformed addresses',()=>{
 assert(contains('192.0.2.0','192.0.2.0/24'));assert(contains('192.0.2.255','192.0.2.0/24'));assert(!contains('192.0.3.0','192.0.2.0/24'));
 assert(contains('2001:db8::ffff','2001:db8::/32'));assert(!contains('2001:db9::1','2001:db8::/32'));
 assert(contains('::ffff:192.0.2.1','::ffff:c000:200/120'));
 assert(!contains('garbage','0.0.0.0/0'));assert(!contains('2001:::1','::/0'));assert(!contains('192.0.2.1','::/0'));assert(!contains('1.2.3.4','1.2.3.0/99'));
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
 assert.equal(identity(candidate('ClaudeBot/1.0'),'192.0.2.1',['192.0.2.0/24'],now,now).verified,false);
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
