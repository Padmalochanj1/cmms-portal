(function(g){
const CODES=["INSP_DAILY","INSP_WEEK","MAINT_15D","MAINT_1M","MAINT_3M","MAINT_6M","MAINT_1Y"];
const dn=s=>Date.parse(s)/864e5,iso=d=>new Date(d*864e5).toISOString().slice(0,10),wd=d=>((d+3)%7)+1;
// ONE RULE FOR EVERY PLANT.
// Before settings.balanceFrom (or when it is empty) a plant keeps the original rule: weekly and longer orders fall on the location day.
// From settings.balanceFrom the daily workload is levelled: every equipment gets a fixed slot inside each frequency cycle, taken from its place
// in the equipment list (golden-ratio spread, so the slots stay even for any number of equipment and never move when equipment is added at the end).
// Frequency cycle of n days is counted from settings.defaultStart; an order is due on every day with (day - start - slot) divisible by n.
const slotOf=(r,n)=>Math.floor((((r*2654435769)>>>0)/4294967296)*n);
function legacyDue(g0,w,n,t){const b=g0+Math.floor((t-g0)/n)*n;return b+(((w-wd(b))%7)+7)%7}
function orders(M,t){const out=[],ymd=iso(t).slice(2).replace(/-/g,""),bf=M.settings.balanceFrom?dn(M.settings.balanceFrom):null,nb=bf!==null&&t>=bf,G=dn(M.settings.defaultStart||"2026-01-01"),cnt=[0,0,0,0,0,0,0];
 M.equipment.forEach((e,ix)=>{if(!e.type)return;const tk=M.ticks[e.type]||[],rk=tk.map((on,i)=>on?cnt[i]++:-1);if(e.status==="Inactive")return;
  const g0=e.start?dn(e.start):dn(M.settings.defaultStart),w=M.areas[e.loc]||wd(g0);
  tk.forEach((on,i)=>{if(!on||t<g0)return;const n=M.settings.intervals[i];let ok=i===0;
   if(!ok){if(nb){ok=(((t-G-slotOf(rk[i],n))%n)+n)%n===0;
     if(ok&&bf-1>=g0&&t-bf<n/2){let l=legacyDue(g0,w,n,bf-1);if(l>bf-1)l=legacyDue(g0,w,n,l-n-1);if(t-l<n/2)ok=false}}   // no second order right after the last one of the old rule
    else ok=t===legacyDue(g0,w,n,t)}
   if(ok)out.push({no:`${CODES[i]}-${e.id.slice(-4)}-${ymd}`,e,ix,fi:i,freq:M.settings.freqs[i],due:t})})});
 const r=c=>({High:0,Medium:1,Low:2}[c]??3);return out.sort((a,b)=>r(a.e.crit)-r(b.e.crit)||a.ix-b.ix||a.fi-b.fi)}
const items=(M,o)=>M.library.filter(r=>r.type===o.e.type&&r.freq===o.freq&&r.active==="Yes").sort((a,b)=>a.seq-b.seq);
const series=(M,E,H)=>{const a=[];for(let k=0;k<H;k++)a.push(orders(M,E+k).length);return a};
g.CMMS={dn,iso,wd,orders,items,CODES,series};if(typeof module!=="undefined")module.exports=g.CMMS})(typeof window!=="undefined"?window:globalThis);
