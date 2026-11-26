// HOD overview: one screen with the state of every section of the plant (E&I, Mechanical, Operation). Everything is read only.
(()=>{
const C=window.CMMS_CONFIG,L=window.CMMS,D=window.DPR,$=s=>document.querySelector(s),T=sessionStorage.cmmsToken,U=sessionStorage.cmmsUser;
if(!T||sessionStorage.cmmsSection!=="hod"){location.replace("../index.html");return}
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),fmt=(v,d=0)=>v==null||!Number.isFinite(v)?"–":Number(v).toLocaleString("en-IN",{maximumFractionDigits:d,minimumFractionDigits:0}),dmy=s=>s?String(s).split("-").reverse().join("/"):"";
const unit=String(sessionStorage.cmmsUnit||"").replace(/ HOD$/,""),P=window.CMMS_PLANTS||[],plant=P.find(p=>p.id===sessionStorage.cmmsPlant)||P.find(p=>p.name===unit)||{name:unit,sections:[]};
// Keep the HOD navigation buttons and dashboard cards in the requested order.
const SECTION_ORDER={ops:0,ei:1,mech:2};
const SECS=plant.sections.filter(s=>s.id!=="hod"&&!s.soon).sort((a,b)=>(SECTION_ORDER[a.id]??99)-(SECTION_ORDER[b.id]??99)),soon=plant.sections.filter(s=>s.soon);
const opDay=()=>{const d=new Date(Date.now()-216e5);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5};
const toast=(m,bad)=>{const t=$("#toast");t.textContent=m;t.className=bad?"bad show":"show";clearTimeout(toast.t);toast.t=setTimeout(()=>t.className="",6000)};
async function call(a,b){if(!/^https:\/\//i.test(C.url||""))throw new Error("The server address is not set. Open js/config.js and paste your Worker address.");let j;
 try{const r=await fetch(C.url,{method:"POST",body:JSON.stringify({token:T,action:a,...b}),signal:AbortSignal.timeout(45000)});j=await r.json()}catch(e){throw new Error("The server did not respond. Check the Worker address and your network.")}
 if(j.error){if(/Session expired/.test(j.error)){sessionStorage.clear();location.replace("../index.html")}if(/change your password first/i.test(j.error))location.replace("../index.html");throw new Error(j.error)}return j}
const href=s=>s.id==="ops"?"ops.html?sec=ops":"app.html?sec="+s.id,STYLE={ei:["#0866ff","#1877f2"],mech:["#0866ff","#1877f2"],ops:["#1b7f4b","#27ae60"]};
// E&I and Mechanical: orders of today, completion of the last 7 days, notifications of the month, equipment
async function maint(sec){const TD=opDay(),today=L.iso(TD),month=today.slice(0,7);
 const [d,r,n]=await Promise.all([call("load",{sec,date:today}),call("range",{sec,from:L.iso(TD-7),to:L.iso(TD-1)}),call("notif_list",{sec,month})]);const M=d.master,EX=d.extras||[];
 const ordersOn=t=>L.orders(M,t).map(o=>o.no).concat(EX.filter(x=>x.due===L.iso(t)).map(x=>x.no));
 const cl=Object.fromEntries(d.closures.map(c=>[c.no,c.action])),ms=new Set(d.measurements.map(m=>m.no)),due=ordersOn(TD);
 const closed=due.filter(no=>cl[no]==="Closed").length,deferred=due.filter(no=>cl[no]==="Deferred").length,ready=due.filter(no=>!cl[no]&&ms.has(no)).length;
 const past=Object.fromEntries((r.closures||[]).map(c=>[c.no,c.action]));let pd=0,pc=0;for(let k=1;k<=7;k++)ordersOn(TD-k).forEach(no=>{pd++;if(past[no]==="Closed")pc++});
 const by=t=>(n.list||[]).filter(x=>x.type===t).length,eq=M.equipment.filter(e=>e.status!=="Inactive"&&e.type).length;
 return[["Orders due today",due.length,""],["Closed today",closed,due.length?Math.round(closed/due.length*100)+"%":""],["Open today",due.length-closed-deferred-ready,ready?ready+" ready to close":""],["Deferred today",deferred,""],
  ["Completion, last 7 days",pd?Math.round(pc/pd*100)+"%":"–",pd?pc+" of "+pd+" orders":""],["Breakdowns this month",by("Breakdown"),""],["Interruptions this month",by("Interruption"),""],["Attention items this month",by("Attention"),""],["Active equipment",eq,""]]}
// Operation: month to date of the daily production report
async function oper(sec){const m=L.iso(opDay()).slice(0,7),d=await call("dpr_load",{sec,to:m}),recs={};Object.keys(d.months).forEach(k=>Object.entries(d.months[k]).forEach(([dt,x])=>recs[dt]=x.v));
 const last=new Date(Date.UTC(+m.slice(0,4),+m.slice(5),0)).toISOString().slice(0,10),rows=D.build(recs,last,d.settings),mr=rows.filter(r=>r.date.startsWith(m)),has=mr.filter(r=>r.has);if(!has.length)return[["Production this month","no data yet",""]];
 const Tt=D.totals(mr,d.settings),lr=has[has.length-1],close=lr.c.clT+["cb0","cb1","cb2","cb3","cb4","cb5"].reduce((s,k)=>s+lr.c[k],0);
 return[["Production this month",fmt(Tt.tp)+" MT",fmt(Tt.tp/Tt.days,1)+" MT / day"],["Capacity utilisation",fmt(Tt.cap,1)+"%",""],["Total dispatch",fmt(Tt.tdT)+" MT",""],["Closing stock",fmt(close)+" MT","as on "+dmy(lr.date)],["Coal consumed",fmt(Tt.ccT)+" MT","coal / coke "+fmt(Tt.pcr,3)],["Power per tonne coke",fmt(Tt.pwp,1)+" kWh",""],["Steam generation",fmt(Tt.sgt,1)+" TPH","utilisation "+fmt(Tt.scu,1)+"%"],["Latest entry",dmy(lr.date),has.length+" day(s) this month"]]}
const card=(s,kpis,err)=>{const c=STYLE[s.id]||STYLE.ei,links=s.id==="ops"?[["Dashboard","#dashboard"],["Reports","#report"]]:[["Dashboard","#dashboard"],["Closure report","#report"],["Tomorrow’s orders","#tomorrow"],["Notifications","#notifications"],["MTTR / MTBF","#reliability"],["Admin (view)","#admin"]];
 return`<section class="hc"><h3 style="background:linear-gradient(100deg,${c[0]},${c[1]})">${esc(s.name)}<a class="btn" href="${href(s)}">Open full view</a></h3>${err?`<p class="empty">Could not load: ${esc(err)}</p>`:`<div class="hk">${kpis.map(([l,v,sub])=>`<div><small>${esc(l)}</small><b>${esc(v)}</b>${sub?`<span>${esc(sub)}</span>`:""}</div>`).join("")}</div>`}<div class="hl">${links.map(([n,h])=>`<a href="${href(s)}${h}">${n}</a>`).join("")}</div></section>`};
async function show(){$("#unitH").textContent=plant.name+": HOD overview";$("#sub").textContent=`${U} | view only access to every section | ${dmy(L.iso(opDay()))}`;
 $("#nav").innerHTML=`<button class="on">Overview</button>${SECS.map(s=>`<button data-go="${href(s)}">${esc(s.name)}</button>`).join("")}`;$("#nav").onclick=e=>{if(e.target.dataset.go)location.href=e.target.dataset.go};
 const v=$("#view");v.innerHTML=`<p class="hint">Today’s state of every section of ${esc(plant.name)}. Press Open full view for the management pages of a section; they are view only.</p><div class="hgrid">${SECS.map(s=>`<section class="hc"><h3 style="background:linear-gradient(100deg,${(STYLE[s.id]||STYLE.ei)[0]},${(STYLE[s.id]||STYLE.ei)[1]})">${esc(s.name)}</h3><p class="empty">Loading...</p></section>`).join("")}</div>${soon.length?`<p class="hint">Coming soon: ${soon.map(s=>esc(s.name)).join(", ")}.</p>`:""}`;
 const out=await Promise.all(SECS.map(s=>(s.id==="ops"?oper(s.id):maint(s.id)).then(k=>card(s,k),e=>card(s,null,e.message))));v.querySelector(".hgrid").innerHTML=out.join("")}
$("#refresh").onclick=show;show();
})();
