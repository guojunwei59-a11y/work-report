// UA is a candidate label only; verification also requires an official IP range.
export const bots=[
 {type:'GPTBot',company:'openai',kind:'training',url:'https://openai.com/gptbot.json'},
 {type:'OAI-SearchBot',company:'openai',kind:'search',url:'https://openai.com/searchbot.json'},
 {type:'ChatGPT-User',company:'openai',kind:'user_fetch',url:'https://openai.com/chatgpt-user.json'},
 {type:'PerplexityBot',company:'perplexity',kind:'search',url:'https://www.perplexity.ai/perplexitybot.json'},
 {type:'Perplexity-User',company:'perplexity',kind:'user_fetch',url:'https://www.perplexity.ai/perplexity-user.json'},
 {type:'Googlebot',company:'google',kind:'search',url:'https://developers.google.com/static/search/apis/ipranges/googlebot.json'},
 {type:'bingbot',company:'microsoft',kind:'search',url:'https://www.bing.com/toolbox/bingbot.json'},
 ...['ClaudeBot','Claude-SearchBot','Claude-User'].map(type=>({type,company:'anthropic',kind:type==='Claude-User'?'user_fetch':type==='ClaudeBot'?'training':'search',url:'https://claude.com/crawling/bots.json'})),
 ...[['KimiBot','training','kimibot'],['Kimi-SearchBot','search','kimi-searchbot'],['Kimi-User','user_fetch','kimi-user']].map(([type,kind,file])=>({type,company:'kimi',kind,url:`https://www.kimi.ai/policies/${file}.json`})),
 {type:'meta-externalagent',company:'meta',kind:'training'},
 {type:'meta-externalfetcher',company:'meta',kind:'user_fetch'}
];
export function candidate(ua){
 const matches=bots.filter(b=>new RegExp('(?:^|[^A-Za-z0-9_-])'+b.type+'(?:[/;\\s)]|$)','i').test(ua));
 if(matches.length>1)return {type:'ambiguous',company:'unknown',kind:'unknown'};
 return matches[0] || (/bot|crawler|spider/i.test(ua)?{type:'unknown',company:'unknown',kind:'unknown'}:null);
}
export function address(input){
 if(typeof input!=='string'||input.includes('%'))throw Error('Invalid IP');
 if(!input.includes(':')){
  const p=input.split('.');if(p.length!==4||p.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255))throw Error('Invalid IPv4');
  return {bits:32,value:p.reduce((a,x)=>(a<<8n)+BigInt(x),0n)};
 }
 let ip=input.toLowerCase();
 if(ip.includes('.')){const pos=ip.lastIndexOf(':');const v=address(ip.slice(pos+1));ip=ip.slice(0,pos)+':'+(v.value>>16n).toString(16)+':'+(v.value&65535n).toString(16);}
 const halves=ip.split('::');if(halves.length>2)throw Error('Invalid IPv6');
 const left=halves[0]?halves[0].split(':'):[];const right=halves.length===2&&halves[1]?halves[1].split(':'):[];
 let p;if(halves.length===1){p=left;if(p.length!==8)throw Error('Invalid IPv6');}else{const missing=8-left.length-right.length;if(missing<1)throw Error('Invalid IPv6');p=[...left,...Array(missing).fill('0'),...right];}
 if(p.some(x=>! /^[0-9a-f]{1,4}$/.test(x)))throw Error('Invalid IPv6');
 return {bits:128,value:p.reduce((a,x)=>(a<<16n)+BigInt('0x'+x),0n)};
}
export function contains(ip,cidr){try{
 const [network,prefix,...extra]=cidr.split('/');if(extra.length)return false;
 const a=address(ip),b=address(network),n=prefix===undefined?b.bits:Number(prefix);
 if(a.bits!==b.bits||!/^\d+$/.test(String(n))||n<0||n>b.bits)return false;
 const shift=BigInt(b.bits-n);return (a.value>>shift)===(b.value>>shift);
}catch{return false;}}
export function parseRanges(json){
 const list=json.prefixes;if(!Array.isArray(list)||!list.length||list.length>5000)throw Error('Invalid official IP list');
 const ranges=list.flatMap(x=>[x.ipv4Prefix,x.ipv6Prefix].filter(Boolean));
 if(!ranges.length||ranges.some(x=>typeof x!=='string'||!x.includes('/')||!contains(x.split('/')[0],x)))throw Error('Invalid official CIDR');
 return ranges;
}
export function identity(bot,ip,ranges,updatedAt,now=Date.now()){
 if(!bot)return null;
 const fresh=Number.isFinite(updatedAt)&&now-updatedAt>=-60000&&now-updatedAt<48*3600000;
 const verified=!!(bot.url&&fresh&&ranges?.some(range=>contains(ip,range)));
 return {...bot,verified,verification:verified?'official-ip-and-ua':'unverified'};
}
