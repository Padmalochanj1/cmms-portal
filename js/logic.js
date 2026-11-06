(function(g){
const CODES=["INSP_DAILY","INSP_WEEK","MAINT_15D","MAINT_1M","MAINT_3M","MAINT_6M","MAINT_1Y"];
const dn=s=>Date.parse(s)/864e5,iso=d=>new Date(d*864e5).toISOString().slice(0,10),wd=d=>((d+3)%7)+1;
function orders(M,t){const out=[],ymd=iso(t).slice(2).replace(/-/g,"");
 M.equipment.forEach((e,ix)=>{if(e.status==="Inactive"||!e.type)return;const tk=M.ticks[e.type]||[],g0=e.start?dn(e.start):dn(M.settings.defaultStart),w=M.areas[e.loc]||wd(g0);
  tk.forEach((on,i)=>{if(!on||t<g0)return;const n=M.settings.intervals[i];let ok=i===0;
   if(!ok){const b=g0+Math.floor((t-g0)/n)*n;ok=t===b+(((w-wd(b))%7)+7)%7}
   if(ok)out.push({no:`${CODES[i]}-${e.id.slice(-4)}-${ymd}`,e,ix,fi:i,freq:M.settings.freqs[i],due:t})})});
 const r=c=>({High:0,Medium:1,Low:2}[c]??3);return out.sort((a,b)=>r(a.e.crit)-r(b.e.crit)||a.ix-b.ix||a.fi-b.fi)}
const items=(M,o)=>M.library.filter(r=>r.type===o.e.type&&r.freq===o.freq&&r.active==="Yes").sort((a,b)=>a.seq-b.seq);
g.CMMS={dn,iso,wd,orders,items,CODES};if(typeof module!=="undefined")module.exports=g.CMMS})(typeof window!=="undefined"?window:globalThis);
