document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const id=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  let count=0;
  document.querySelectorAll('.feed-item').forEach(row=>{row.hidden=id!=='all'&&row.dataset.platform!==id;if(!row.hidden)count++;});
  const empty=document.querySelector('.filter-empty');if(empty)empty.hidden=count>0;
}));
const dateNode=document.querySelector('[data-build-day]');
if(dateNode){const today=new Date(Date.now()+28800000).toISOString().slice(0,10);if(today!==dateNode.dataset.buildDay)document.querySelector('.stale-date').hidden=false;}
