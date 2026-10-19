document.documentElement.classList.add('js');
const smallScreen=matchMedia('(max-width:680px)');
function paginate(container,id){
 const toolbar=document.querySelector(`[data-pager="${id}"]`);if(!container||!toolbar)return null;
 let page=0,filter='all';
 function render(){
  const rows=[...container.querySelectorAll('.feed-item')];
  const matched=rows.filter(row=>filter==='all'||row.dataset.platform===filter);
  const size=id==='international'?(smallScreen.matches?4:6):(smallScreen.matches?6:12);
  const pages=Math.max(1,Math.ceil(matched.length/size));page=Math.max(0,Math.min(page,pages-1));
  const visible=new Set(matched.slice(page*size,(page+1)*size));rows.forEach(row=>row.hidden=!visible.has(row));
  toolbar.hidden=matched.length===0;
  toolbar.querySelector('.page-info').textContent=`共 ${matched.length} 条 · ${page+1} / ${pages} 页`;
  toolbar.querySelector('[data-page="prev"]').disabled=page===0;
  toolbar.querySelector('[data-page="next"]').disabled=page>=pages-1;
  const empty=container.closest('.feed-panel')?.querySelector('.filter-empty');if(empty)empty.hidden=matched.length>0;
 }
 toolbar.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page+=b.dataset.page==='next'?1:-1;render();}));
 smallScreen.addEventListener('change',()=>{page=0;render();});render();
 return {filter(value){filter=value;page=0;render();},refresh(){page=0;render();}};
}
const domesticPager=paginate(document.querySelector('.domestic-list'),'domestic');
document.querySelectorAll('.filters').forEach(group=>{
 const scope=group.closest('.feed-panel')||group.closest('section');
 group.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.filter;
  group.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  if(scope.id==='domestic-panel'&&domesticPager){domesticPager.filter(id);return;}
  let count=0;scope.querySelectorAll('.feed-item').forEach(row=>{row.hidden=id!=='all'&&row.dataset.platform!==id;if(!row.hidden)count++;});
  const empty=scope.querySelector('.filter-empty');if(empty)empty.hidden=count>0;
 }));
});
const youtubeBox=document.querySelector('#youtube-content');
const internationalPager=paginate(youtubeBox,'international');
if(youtubeBox&&internationalPager)new MutationObserver(()=>internationalPager.refresh()).observe(youtubeBox,{childList:true,subtree:true});
const tabs=[...document.querySelectorAll('[data-region]')];
function selectRegion(region){
 tabs.forEach(tab=>{const active=tab.dataset.region===region;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;});
}
if(tabs.length){
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectRegion(tab.dataset.region));
  tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectRegion(tabs[next].dataset.region);tabs[next].focus();});
 });
 selectRegion(location.hash==='#youtube'?'international':'domestic');
 addEventListener('hashchange',()=>{if(location.hash==='#youtube')selectRegion('international');});
}
function bindAnimal(host,button,className){
 let beforePointer=false;
 const set=open=>{host.classList.toggle(className,open);button.setAttribute('aria-expanded',String(open));};
 host.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')set(true);});
 host.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!host.contains(document.activeElement))set(false);});
 button.addEventListener('focus',()=>set(true));
 host.addEventListener('focusout',e=>{if(!host.contains(e.relatedTarget))set(false);});
 button.addEventListener('pointerdown',()=>{beforePointer=host.classList.contains(className);});
 button.addEventListener('click',e=>{if(e.detail===0)set(!host.classList.contains(className));else set(!beforePointer);});
 button.addEventListener('keydown',e=>{if(e.key==='Escape')set(false);});
}
document.querySelectorAll('.zoo-animal').forEach(button=>bindAnimal(button,button,'is-active'));
document.querySelectorAll('.enclosure').forEach(card=>bindAnimal(card,card.querySelector('.resident-toggle'),'is-open'));
const dateNode=document.querySelector('[data-build-day]');
if(dateNode){const today=new Date(Date.now()+28800000).toISOString().slice(0,10);if(today!==dateNode.dataset.buildDay)document.querySelector('.stale-date').hidden=false;}
