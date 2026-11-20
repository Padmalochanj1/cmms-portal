(function(g){
const CODES=["INSP_DAILY","INSP_WEEK","MAINT_15D","MAINT_1M","MAINT_3M","MAINT_6M","MAINT_1Y"];
const dn=s=>Date.parse(s)/864e5,iso=d=>new Date(d*864e5).toISOString().slice(0,10),wd=d=>((d+3)%7)+1;
// ONE RULE FOR EVERY PLANT.
// Before settings.balanceFrom (or while it is empty) a plant keeps the original rule: weekly and longer orders fall on the location day.
// From settings.balanceFrom the work is levelled by area: level() lists the equipment area by area, starting with the weekday of the
// selected date, and cuts the list into 7 daily blocks of about equal work, so one area stays together and what does not fit moves on to
// the next day. The weekday of every equipment is kept in e.day. Inside its weekday an equipment is due every WK[i] whole weeks
// (Weekly 1, Fortnightly 2, Monthly 4, Quarterly 13, Half-yearly 26, Yearly 52), in a week that is spread evenly (golden-ratio slot).
const WK=[0,1,2,4,13,26,52],MON0=dn("2026-01-05"),frac=r=>((r*2654435769)>>>0)/4294967296;
const legacyDue=(g0,w,n,t)=>{const b=g0+Math.floor((t-g0)/n)*n;return b+(((w-wd(b))%7)+7)%7};
// weekday of every equipment: its own e.day, else the most used weekday of its area, else the location day
function dayMap(M){const by={};M.equipment.forEach(e=>{if(+e.day){const a=by[e.loc]||(by[e.loc]={});a[e.day]=(a[e.day]||0)+1}});
 const mode=l=>{const a=by[l];if(!a)return 0;return +Object.keys(a).sort((x,y)=>a[y]-a[x]||x-y)[0]};
 return M.equipment.map(e=>(+e.day)||mode(e.loc)||M.areas[e.loc]||1)}
function orders(M,t){const out=[],ymd=iso(t).slice(2).replace(/-/g,""),bf=M.settings.balanceFrom?dn(M.settings.balanceFrom):null,nb=bf!==null&&t>=bf,W=Math.floor((t-MON0)/7);
 const dm=nb?dayMap(M):null,cnt={};
 M.equipment.forEach((e,ix)=>{if(!e.type)return;const tk=M.ticks[e.type]||[];let rk=[];if(nb){const d=dm[ix],c=cnt[d]||(cnt[d]=[0,0,0,0,0,0,0]);rk=tk.map((on,i)=>on?c[i]++:-1)}
  if(e.status==="Inactive")return;const g0=e.start?dn(e.start):dn(M.settings.defaultStart),w=M.areas[e.loc]||wd(g0);
  tk.forEach((on,i)=>{if(!on||t<g0)return;const n=M.settings.intervals[i];let ok=i===0;
   if(!ok){if(nb){const wk=WK[i],slot=Math.floor(frac(rk[i])*wk);ok=wd(t)===dm[ix]&&((((W-slot)%wk)+wk)%wk)===0;
     if(ok&&bf-1>=g0&&t-bf<n/2){let l=legacyDue(g0,w,n,bf-1);if(l>bf-1)l=legacyDue(g0,w,n,l-n-1);if(t-l<n/2)ok=false}}   // no second order right after the last one of the old rule
    else ok=t===legacyDue(g0,w,n,t)}
   if(ok)out.push({no:`${CODES[i]}-${e.id.slice(-4)}-${ymd}`,e,ix,fi:i,freq:M.settings.freqs[i],due:t})})});
 const r=c=>({High:0,Medium:1,Low:2}[c]??3);return out.sort((a,b)=>r(a.e.crit)-r(b.e.crit)||a.ix-b.ix||a.fi-b.fi)}
const items=(M,o)=>M.library.filter(r=>r.type===o.e.type&&r.freq===o.freq&&r.active==="Yes").sort((a,b)=>a.seq-b.seq);
const series=(M,E,H)=>{const a=[];for(let k=0;k<H;k++)a.push(orders(M,E+k).length);return a};
// Sequence the areas from the weekday of day E: returns {day:{equipmentId:weekday}, perDay:[{day,work,areas:[{area,n}]}]}
function level(M,E){const wk=M.settings.intervals.map((_,i)=>WK[i]||0),ai={};Object.keys(M.areas).sort((a,b)=>M.areas[a]-M.areas[b]||Object.keys(M.areas).indexOf(a)-Object.keys(M.areas).indexOf(b)).forEach((a,i)=>ai[a]=i);
 const list=M.equipment.map((e,ix)=>({e,ix})).filter(({e})=>e.status!=="Inactive"&&e.type).map(x=>({...x,a:ai[x.e.loc]??99,w:(M.ticks[x.e.type]||[]).reduce((s,on,i)=>s+(on&&i>0?1/WK[i]:0),0)})).sort((x,y)=>x.a-y.a||x.ix-y.ix);
 const N=list.length,Wt=list.reduce((s,x)=>s+x.w,0),d0=wd(E),res={day:{},perDay:[]};
 if(!N||Wt===0){list.forEach(x=>res.day[x.e.id]=d0);return res}
 const avg=Wt/7,pen=avg*avg*0.2,cost=Array.from({length:N+1},()=>new Array(N+1).fill(0));
 for(let a=0;a<=N;a++){let w=0,ar=0,last=-1;for(let b=a+1;b<=N;b++){const x=list[b-1];w+=x.w;if(x.w>0&&x.a!==last){ar++;last=x.a}cost[a][b]=(w-avg)**2+pen*Math.max(0,ar-2)**2}cost[a][a]=avg*avg}
 const f=Array.from({length:8},()=>new Array(N+1).fill(Infinity)),pr=Array.from({length:8},()=>new Array(N+1).fill(0));f[0][0]=0;
 for(let j=1;j<=7;j++)for(let p=0;p<=N;p++)for(let q=0;q<=p;q++){const c=f[j-1][q]+cost[q][p];if(c<f[j][p]){f[j][p]=c;pr[j][p]=q}}
 const cuts=[N];for(let j=7,p=N;j>=1;j--){p=pr[j][p];cuts.unshift(p)}
 for(let j=0;j<7;j++){const day=((d0-1+j)%7)+1,per={day,work:0,areas:[]},am={};for(let k=cuts[j];k<cuts[j+1];k++){const x=list[k];res.day[x.e.id]=day;per.work+=x.w;if(x.w>0){am[x.e.loc]=(am[x.e.loc]||0)+1}}
  per.areas=Object.keys(am).map(a=>({area:a,n:am[a]}));res.perDay.push(per)}
 return res}
g.CMMS={dn,iso,wd,orders,items,CODES,series,level};if(typeof module!=="undefined")module.exports=g.CMMS})(typeof window!=="undefined"?window:globalThis);
