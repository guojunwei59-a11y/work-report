import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSource,platforms} from './sources.mjs';
import {build} from './website.mjs';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const dayOf = time => new Date(new Date(time).getTime()+8*3600000).toISOString().slice(0,10);
export const previousDay = day => new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
export function merge(previous, results, time) {
  const state = structuredClone(previous || {version:1,platforms:{}});
  for (const [i,id] of Object.keys(platforms).entries()) {
    const r = results[i];
    const old = state.platforms[id];
    if (r.status === 'fulfilled') {
      const signature = items => JSON.stringify(items.map(({keyword,url,rank})=>({keyword,url,rank})));
      const same = old?.items?.length && dayOf(old.items[0].collectedAt)===dayOf(time) && signature(old.items)===signature(r.value);
      state.platforms[id] = {status:'ok',items:same?old.items:r.value};
    } else {
      state.platforms[id] = {status:'unavailable',error:r.reason?.message?.startsWith('HTTP ')?r.reason.message:'接口不可用、返回空榜单或结构变化',items:old?.items || []};
    }
  }
  if (JSON.stringify(state.platforms)!==JSON.stringify(previous?.platforms)) state.updatedAt = time;
  return state;
}
async function readJson(file, fallback) {try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
async function writeJson(file, value) {await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(value,null,2)+'\n');}
export async function update({time=new Date().toISOString(),collector=collectSource,project=root}={}) {
  const dir = path.join(project,'ai-zoo/data');
  const previous = await readJson(path.join(dir,'latest.json'),null);
  const results = await Promise.allSettled(Object.keys(platforms).map(id=>collector(id,time)));
  const state = merge(previous,results,time);
  const day = dayOf(time);
  const archive = await readJson(path.join(dir,`${day}.json`),{date:day,platforms:{}});
  for (const [id,p] of Object.entries(state.platforms)) {
    if (p.items.length && dayOf(p.items[0].collectedAt)===day) archive.platforms[id]={items:p.items};
    console.log(`${platforms[id]}: ${p.status}, ${p.items.length} 条${p.status==='ok'?'':`（保留上次成功数据；${p.error}）`}`);
  }
  await writeJson(path.join(dir,'latest.json'),state);
  if (Object.keys(archive.platforms).length) await writeJson(path.join(dir,`${day}.json`),archive);
  const cutoff=new Date(Date.parse(day+'T00:00:00Z')-89*86400000).toISOString().slice(0,10);
  for(const name of await fs.readdir(dir)) if(/^\d{4}-\d{2}-\d{2}\.json$/.test(name) && name.slice(0,10)<cutoff) await fs.unlink(path.join(dir,name));
  await build(project,day,state);
  const succeeded=results.filter(x=>x.status==='fulfilled').length;
  if (!succeeded) console.error('::warning::全部平台采集失败，已保留上次成功数据');
  return {succeeded,state};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await update();
