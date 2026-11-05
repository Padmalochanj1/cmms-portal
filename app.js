(()=>{
const C=window.CMMS_CONFIG,L=window.CMMS,$=s=>document.querySelector(s),T=sessionStorage.cmmsToken,U=sessionStorage.cmmsUser,R=sessionStorage.cmmsRole;
if(!T){location.replace("index.html");return}
const UN=sessionStorage.cmmsUnit||"Coal Washery E&I";$("#unitH").textContent=UN+" maintenance management";document.title=UN+" Maintenance Management Portal";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const opDay=()=>{const d=new Date(Date.now()-216e5);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5};
let M,TD=opDay(),route=(location.hash||"#dashboard").slice(1),cl={},ms={},cur="",items=[],sub="closure",hist=null,hd=L.iso(TD),dirty=false;
const V={},A={},ROUTES=[["dashboard","Dashboard"],["closing","Order closing"],["checklist","Checklist closing"],["tomorrow","Tomorrow’s orders"],["notifications","Notifications"]].concat(R==="admin"?[["admin","Admin"]]:[]);
const toast=(m,bad)=>{const t=$("#toast");t.textContent=m;t.className=bad?"bad show":"show";clearTimeout(toast.t);toast.t=setTimeout(()=>t.className="",6000)};
async function call(a,b){let j;try{const r=await fetch(C.url,{method:"POST",body:JSON.stringify({token:T,action:a,...b}),signal:AbortSignal.timeout(45000)});j=await r.json()}
 catch(e){throw new Error("The server did not respond. Check the URL in config.js and that the Apps Script deployment access is set to Anyone.")}
 if(j.error){if(/Session expired/.test(j.error)){sessionStorage.clear();location.replace("index.html")}throw new Error(j.error)}return j}
async function load(){const d=await call("load",{date:L.iso(TD)});if(!d.master)throw new Error("No data received from the server.");M=d.master;cl=Object.fromEntries(d.closures.map(c=>[c.no,c]));ms=Object.fromEntries(d.measurements.map(m=>[m.no,1]));
 $("#sub").textContent=`${U}${R==="admin"?" (admin)":""}  |  Operational date ${L.iso(TD).split("-").reverse().join("/")}`;draw()}
const st=o=>cl[o.no]?cl[o.no].action.toUpperCase():ms[o.no]?"READY TO CLOSE":L.items(M,o).length?"OPEN":"NO CHECKLIST";
const PH=t=>`<div class="phead"><b>${esc(UN)} Maintenance Management Portal</b><span>${t}</span><small>Printed ${new Date().toLocaleString("en-GB")} by ${esc(U)}</small></div>`;
const PB=`<div class="bar noprint"><button class="ghost" data-print>Print</button></div>`;
window.onbeforeprint=()=>document.querySelectorAll("details").forEach(d=>d.open=true);
const chip=s=>`<span class="chip ${s.replace(/ /g,"_")}">${s}</span>`;
const bars=l=>{const m=Math.max(1,...l.map(x=>x[1]));return l.map(([a,n])=>`<div class="bar2"><span>${a}</span><i style="width:${n/m*100}%"></i><em>${n}</em></div>`).join("")};
const go=r=>{route=r;location.hash=r;draw()};
function draw(){if(!M)return;$("#nav").innerHTML=ROUTES.map(([k,n])=>`<button data-r="${k}" class="${k===route?"on":""}">${n}</button>`).join("");
 const v=$("#view");v.oninput=v.onchange=null;v.onclick=e=>{if(e.target.dataset.print!==undefined)window.print()};(V[route]||V.dashboard)()}
$("#nav").onclick=e=>{if(e.target.dataset.r)go(e.target.dataset.r)};
$("#refresh").onclick=()=>load().then(()=>toast("Refreshed.")).catch(e=>toast(e.message,1));

const COL={blue:"#2f7fd1",green:"#2e9e6b",amber:"#e09a1a",red:"#d9473f",violet:"#7a5bd0",teal:"#1aa3b5",slate:"#6b7c8a"};
const CC={High:COL.red,Medium:COL.amber,Low:COL.green};
const by=(a,f)=>{const m={};a.forEach(x=>{const k=f(x)||"Not set";m[k]=(m[k]||0)+1});return Object.entries(m).sort((x,y)=>y[1]-x[1])};
const hb=(l,c)=>{const m=Math.max(1,...l.map(x=>x[1]));return l.map(([a,n],i)=>`<div class="bar2"><span title="${esc(a)}">${esc(a)}</span><i style="width:${n/m*100}%;background:${typeof c==="function"?c(a,i):c}"></i><em>${n}</em></div>`).join("")||`<p class="empty">No orders.</p>`};
const donut=(parts,mid)=>{const tot=parts.reduce((a,p)=>a+p[1],0)||1;let off=0;return`<svg viewBox="0 0 120 120" class="donut"><circle cx="60" cy="60" r="46" fill="none" stroke="var(--line)" stroke-width="16"/>${parts.map(([n,v,c])=>{const len=v/tot*289;const e=`<circle cx="60" cy="60" r="46" fill="none" stroke="${c}" stroke-width="16" stroke-dasharray="${len} ${289-len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;off+=len;return e}).join("")}<text x="60" y="62" text-anchor="middle" class="dn">${mid}</text><text x="60" y="78" text-anchor="middle" class="dl">complete</text></svg>`};
const card=(t,body,c)=>`<section class="dc" style="--c:${c||COL.teal}"><h3>${t}</h3>${body}</section>`;
V.dashboard=()=>{const os=L.orders(M,TD),tm=L.orders(M,TD+1),n=k=>os.filter(o=>st(o)===k).length,closed=n("CLOSED"),def=n("DEFERRED"),ready=n("READY TO CLOSE"),open=os.length-closed-def,pct=os.length?Math.round((closed+def)/os.length*100):0;
 const wk=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],days=[...Array(7)].map((_,i)=>[wk[new Date((TD+i)*864e5).getUTCDay()]+" "+L.iso(TD+i).slice(8),L.orders(M,TD+i).length,i===0]),mx=Math.max(1,...days.map(d=>d[1]));
 const kp=(v,l,c,sub)=>`<div class="kpi" style="--c:${c}"><b>${v}</b><span>${l}</span>${sub?`<small>${sub}</small>`:""}</div>`;
 const hr=new Date().getHours(),act=M.equipment.filter(e=>e.status!=="Inactive").length;
 const hi=os.filter(o=>o.e.crit==="High"&&!cl[o.no]).slice(0,8),rec=Object.values(cl).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,8);
 $("#view").innerHTML=`<p class="greet">${hr<12?"Good morning":hr<17?"Good afternoon":"Good evening"}, ${esc(U)}. Here is the maintenance picture for ${L.iso(TD).split("-").reverse().join("/")}.</p>
 <div class="kpis">${kp(os.length,"Due today",COL.blue,`${Object.keys(by(os,o=>o.e.loc)).length} locations`)}${kp(closed,"Closed",COL.green,pct+"% of today’s orders done")}${kp(def,"Deferred",COL.amber)}${kp(open,"Still open",COL.red,`${ready} ready to close`)}${kp(Object.keys(ms).length,"Checklists saved",COL.teal,"today")}${kp(tm.length,"Due tomorrow",COL.violet,`${tm.filter(o=>o.e.crit==="High").length} high priority`)}</div>
 <div class="dgrid">
 ${card("Completion today",`<div class="dflex">${donut([["Closed",closed,COL.green],["Deferred",def,COL.amber],["Open",open,COL.red]],pct+"%")}<ul class="leg"><li><i style="background:${COL.green}"></i>Closed <b>${closed}</b></li><li><i style="background:${COL.amber}"></i>Deferred <b>${def}</b></li><li><i style="background:${COL.red}"></i>Open <b>${open}</b></li></ul></div>`,COL.green)}
 ${card("Orders due, next 7 days",`<div class="cols">${days.map(([d,v,t])=>`<div><em>${v}</em><i style="height:${Math.max(3,v/mx*130)}px;background:${t?COL.blue:COL.violet}"></i><span>${d}</span></div>`).join("")}</div>`,COL.violet)}
 ${card("Today by criticality",["High","Medium","Low"].map(k=>{const t=os.filter(o=>o.e.crit===k),d=t.filter(o=>cl[o.no]).length;return`<div class="stk"><span>${k}</span><div style="--c:${CC[k]}"><i style="width:${t.length?d/t.length*100:0}%"></i></div><em>${d}/${t.length}</em></div>`}).join("")+`<p class="hint">Done / due, by criticality</p>`,COL.red)}
 ${card("Today by frequency",hb(by(os,o=>o.freq),COL.blue),COL.blue)}
 ${card("Today by location",hb(by(os,o=>o.e.loc).slice(0,7),COL.teal),COL.teal)}
 ${card("Today by equipment type",hb(by(os,o=>o.e.type),(a,i)=>[COL.violet,COL.amber,COL.green,COL.blue,COL.red,COL.teal,COL.slate][i%7]),COL.amber)}
 ${card("High priority, still open",hi.length?`<ul class="lst">${hi.map(o=>`<li><b class="mono">${o.no}</b> ${esc(o.e.name)} ${chip(st(o))}</li>`).join("")}</ul>`:`<p class="empty">No high priority orders are waiting.</p>`,COL.red)}
 ${card("Recent closures today",rec.length?`<ul class="lst">${rec.map(c=>`<li><b class="mono">${esc(c.no)}</b> ${chip(c.action.toUpperCase())} <small>${esc(c.by)}, ${c.at?new Date(c.at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):""}</small></li>`).join("")}</ul>`:`<p class="empty">Nothing closed yet today.</p>`,COL.green)}
 ${card("Equipment register",`<div class="eq"><div><b>${M.equipment.length}</b><span>Total</span></div><div><b>${act}</b><span>Active</span></div><div><b>${M.equipment.length-act}</b><span>Inactive</span></div><div><b>${M.types.length}</b><span>Types</span></div><div><b>${Object.keys(M.areas).length}</b><span>Locations</span></div></div>`,COL.slate)}
 </div>`};

V.closing=()=>{const os=L.orders(M,TD);
 $("#view").innerHTML=PH("Order closing, "+L.iso(TD).split("-").reverse().join("/"))+PB+`<div class="wrap"><table><thead><tr><th>Order no.</th><th>Equipment</th><th>Criticality</th><th>Status</th><th>Remarks</th><th class="noprint"></th></tr></thead><tbody>${os.map((o,i)=>{const s=st(o),done=!!cl[o.no];
 return`<tr data-i="${i}"><td class="mono">${o.no}</td><td>${esc(o.e.name)}<small>${o.e.id}, ${esc(o.e.type)}, ${esc(o.e.loc)}</small></td><td>${esc(o.e.crit)}</td><td>${chip(s)}</td><td><input data-r value="${esc(cl[o.no]?.rem||"")}"${done?" disabled":""}></td>
 <td class="noprint">${done?"":`<button class="link" data-a="chk">Checklist</button> <button data-a="Closed"${s==="READY TO CLOSE"?"":" disabled"}>Close</button> <button class="ghost" data-a="Deferred">Defer</button>`}</td></tr>`}).join("")||`<tr><td colspan="6" class="empty">No orders are due today.</td></tr>`}</tbody></table></div>`;
 $("#view").onclick=async e=>{const a=e.target.dataset.a,tr=e.target.closest("tr");if(e.target.dataset.print!==undefined)return window.print();if(!a||!tr)return;const o=os[tr.dataset.i];if(a==="chk"){cur=o.no;go("checklist");return}
  const rem=tr.querySelector("[data-r]").value.trim();if(a==="Deferred"&&!rem)return toast("Enter a remark to defer an order.",1);e.target.disabled=true;
  try{await call("closure",{rec:{no:o.no,due:L.iso(o.due),eq:o.e.id,name:o.e.name,freq:o.freq,action:a,on:L.iso(TD),rem}});toast(`${o.no} ${a==="Closed"?"closed":"deferred"}.`);await load()}catch(x){toast(x.message,1);e.target.disabled=false}}};

const res=i=>!i.ok?"":i.ok==="OK"?"PASS":i.notes.trim().length>20?"ATTENTION":"FAIL";
V.checklist=()=>{const os=L.orders(M,TD),o=os.find(x=>x.no===cur),done=o&&(ms[o.no]||cl[o.no]);items=o&&!done?L.items(M,o).map(r=>({r,reading:"",ok:"",notes:""})):[];
 $("#view").innerHTML=`<label class="pick">Maintenance order <select id="ord"><option value="">Select the order number</option>${os.map(x=>`<option${x.no===cur?" selected":""}>${x.no}</option>`).join("")}</select></label>`+
 (o?`<div class="grid">${[["EQ ID",o.e.id],["Equipment",o.e.name],["Type",o.e.type],["Frequency",o.freq],["Location",o.e.loc],["Criticality",o.e.crit],["Status",st(o)]].map(([a,b])=>`<div><span>${a}</span>${esc(b)}</div>`).join("")}</div>`:"")+
 (done?`<p class="empty">The checklist for this order is already saved.</p>`:o&&!items.length?`<p class="empty">No active checklist items for ${esc(o.e.type)} / ${esc(o.freq)}.</p>`:o?`<div class="wrap"><table><thead><tr><th>Seq.</th><th>Check item</th><th>Actual reading</th><th>Mandatory</th><th>Acceptance criteria</th><th>OK / NOT OK</th><th>Notes</th><th>Result</th></tr></thead><tbody>${items.map(({r},i)=>`<tr data-i="${i}"><td>${r.seq}</td><td>${esc(r.item)}<small>${esc(r.id)}</small></td><td>${r.readReq==="Yes"?`<input data-k="reading" size="7"> ${esc(r.unit)}`:"Not required"}</td><td>${esc(r.mand)}</td><td>${esc(r.criteria)}</td><td><select data-k="ok"><option></option><option>OK</option><option>NOT OK</option></select></td><td><input data-k="notes" placeholder="Required if NOT OK (more than 20 characters)"></td><td class="r"></td></tr>`).join("")}</tbody></table></div><div class="bar"><b id="ckState"></b><button id="saveCk" disabled>Save checklist</button></div>`:"");
 const upd=()=>{items.forEach((it,i)=>{const t=res(it),c=$("#view").querySelectorAll("tbody .r")[i];if(c)c.innerHTML=t?chip(t):""});const rs=items.map(res),n=rs.filter(x=>x==="PASS"||x==="ATTENTION").length,ok=items.length&&n===items.length;
  const s=$("#ckState");if(s){s.textContent=ok?(rs.includes("ATTENTION")?"Complete, with attention items":"Complete, all pass"):`${n} of ${items.length} items done`;$("#saveCk").disabled=!ok}};
 $("#view").onchange=$("#view").oninput=e=>{if(e.target.id==="ord"){if(e.type==="change"){cur=e.target.value;V.checklist()}return}const tr=e.target.closest("tr"),k=e.target.dataset.k;if(tr&&k){items[tr.dataset.i][k]=e.target.value;upd()}};
 $("#view").onclick=async e=>{if(e.target.id!=="saveCk")return;e.target.disabled=true;
  try{const r=await call("measurement",{rec:{no:o.no,due:L.iso(o.due),eq:o.e.id,name:o.e.name,type:o.e.type,freq:o.freq,loc:o.e.loc,crit:o.e.crit,on:L.iso(TD),
   items:items.map(({r,reading,ok,notes})=>({id:r.id,item:r.item,unit:r.unit||"",reading:reading===""?"":isNaN(reading)?reading:Number(reading),mand:r.mand,criteria:r.criteria,ok,result:res({ok,notes}),notes:notes.trim()}))}});
   if(r.duplicate)toast("This order’s checklist is already saved.",1);else toast(`Checklist saved for ${o.no}.`);cur="";await load()}catch(x){toast(x.message,1);e.target.disabled=false}};
 if(items.length)upd()};

V.tomorrow=()=>{const os=L.orders(M,TD+1);
 $("#view").innerHTML=PH("Tomorrow’s maintenance orders, "+L.iso(TD+1).split("-").reverse().join("/"))+PB+`<p class="hint">${os.length} order(s) due on ${L.iso(TD+1).split("-").reverse().join("/")}</p><div class="wrap"><table><thead><tr><th>Sl.</th><th>Order no.</th><th>Equipment</th><th>Type</th><th>Location</th><th>Criticality</th><th>Frequency</th></tr></thead><tbody>${os.map((o,i)=>`<tr><td>${i+1}</td><td class="mono">${o.no}</td><td>${esc(o.e.name)}<small>${o.e.id}</small></td><td>${esc(o.e.type)}</td><td>${esc(o.e.loc)}</td><td>${esc(o.e.crit)}</td><td>${o.freq}</td></tr>`).join("")||`<tr><td colspan="7" class="empty">No orders due tomorrow.</td></tr>`}</tbody></table></div>`};

const KPI={P:"Production",Q:"Quality",C:"Cost",D:"Delivery",S:"Safety",M:"Morale"},NT=["Planned","Breakdown","Improvement"];
let nm=L.iso(TD).slice(0,7),nl=null,nf={type:"",area:"",q:""};
async function nload(){try{nl=(await call("notif_list",{month:nm})).list}catch(x){toast(x.message,1);nl=[]}if(route==="notifications")draw()}
const nfilt=()=>nl.filter(n=>(!nf.type||n.type===nf.type)&&(!nf.area||n.area===nf.area)&&(!nf.q||[n.no,n.title,n.desc,n.eqName,n.eq,n.team].join(" ").toLowerCase().includes(nf.q.toLowerCase()))).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
const nrows=()=>{const f=nfilt(),dl=f.reduce((a,n)=>a+(n.delay||0),0);
 return`<p class="hint">${f.length} notification(s)${f.some(n=>n.type==="Breakdown")?` | Total breakdown delay: ${dl} min (${(dl/60).toFixed(1)} h)`:""}</p>`+tbl(["Notification no.","Date","Type","Area","Equipment","Title and description","Delay","KPIs","Team members","Logged by"],f.map(n=>`<tr><td class="mono">${esc(n.no||"")}</td><td class="mono">${n.date.split("-").reverse().join("/")}</td><td>${chip(n.type.toUpperCase())}</td><td>${esc(n.area)}</td><td>${esc(n.eqName)}<small>${esc(n.eq)}</small></td><td><b>${esc(n.title)}</b><br>${esc(n.desc)}</td><td>${n.type==="Breakdown"?n.delay+" min":""}</td><td>${(n.kpis||[]).map(k=>`<span class="chip KPIC" title="${KPI[k]}">${k}</span>`).join(" ")}</td><td>${esc(n.team)}</td><td>${esc(n.by)}</td></tr>`))};
V.notifications=()=>{if(nl===null){nload();$("#view").innerHTML=`<p class="empty">Loading notifications...</p>`;return}
 const areas=Object.keys(M.areas),v=$("#view");
 v.innerHTML=PH("Notifications, "+nm.split("-").reverse().join("/"))+`<section class="dc noprint" style="--c:#2f7fd1"><h3>Log a notification</h3><div class="nform">
 <label>Date <input type="date" id="nd" value="${L.iso(TD)}"></label>
 <label>Area <select id="na"><option value="">Select area</option>${areas.map(a=>`<option>${esc(a)}</option>`).join("")}</select></label>
 <label>Equipment <select id="ne"><option value="">Select area first</option></select></label>
 <label>Notification type <select id="nt"><option value="">Select type</option>${NT.map(t=>`<option>${t}</option>`).join("")}</select></label>
 <label class="wide">Heading / title <input id="ntl" maxlength="120"></label>
 <label class="wide">Description <textarea id="nds" rows="4" maxlength="2000"></textarea></label>
 <label id="ndw" hidden>Delay time (minutes) <input type="number" id="ndl" min="0" step="1"></label>
 <fieldset id="nkw" class="wide" hidden><legend>KPIs affected</legend>${Object.entries(KPI).map(([k,n])=>`<label class="pill"><input type="checkbox" value="${k}"> ${k} - ${n}</label>`).join("")}</fieldset>
 <label class="wide">Team members <input id="ntm" maxlength="300" placeholder="Names separated by commas"></label></div>
 <div class="bar"><button id="nsave">Save notification</button></div></section>
 <div class="bar noprint"><label>Month <input type="month" id="nmth" value="${nm}"></label><label>Type <select id="fT"><option value="">All</option>${NT.map(t=>`<option${nf.type===t?" selected":""}>${t}</option>`).join("")}</select></label>
 <label>Area <select id="fA"><option value="">All</option>${areas.map(a=>`<option${nf.area===a?" selected":""}>${esc(a)}</option>`).join("")}</select></label><label>Search <input id="fQ" value="${esc(nf.q)}"></label><button class="ghost" data-print>Print</button></div><div id="nlist">${nrows()}</div>`;
 v.oninput=v.onchange=e=>{const id=e.target.id;
  if(id==="nt"){$("#ndw").hidden=e.target.value!=="Breakdown";$("#nkw").hidden=e.target.value!=="Improvement"}
  else if(id==="na"){$("#ne").innerHTML=e.target.value?`<option value="">Select equipment</option>`+M.equipment.filter(x=>x.loc===e.target.value&&x.status!=="Inactive").map(x=>`<option value="${esc(x.id)}">${esc(x.id)} - ${esc(x.name)}</option>`).join(""):`<option value="">Select area first</option>`}
  else if(id==="nmth"&&e.type==="change"&&e.target.value){nm=e.target.value;nl=null;V.notifications()}
  else if(id==="fT"||id==="fA"||id==="fQ"){nf={type:$("#fT").value,area:$("#fA").value,q:$("#fQ").value};$("#nlist").innerHTML=nrows()}};
 v.onclick=async e=>{if(e.target.dataset.print!==undefined)return window.print();if(e.target.id!=="nsave")return;
  const g=i=>$("#"+i).value.trim(),type=g("nt"),eq=M.equipment.find(x=>x.id===g("ne")),kp=[...v.querySelectorAll("#nkw input:checked")].map(x=>x.value);
  if(!g("na")||!eq||!type||!g("ntl")||!g("nds"))return toast("Select area, equipment and type, and enter a title and description.",1);
  if(type==="Breakdown"&&g("ndl")==="")return toast("Enter the delay time in minutes.",1);
  if(type==="Improvement"&&!kp.length)return toast("Select at least one KPI.",1);
  e.target.disabled=true;try{const r=await call("notif_add",{rec:{date:g("nd"),area:g("na"),eq:eq.id,eqName:eq.name,type,title:g("ntl"),desc:g("nds"),delay:g("ndl"),kpis:kp,team:g("ntm")}});
   toast(`Notification ${r.no} saved.`);nm=g("nd").slice(0,7);nl=null;V.notifications()}catch(x){toast(x.message,1);e.target.disabled=false}}};

const tbl=(h,rows)=>`<div class="wrap"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${h.length}" class="empty">No records.</td></tr>`}</tbody></table></div>`;
const histBar=()=>`<div class="bar noprint"><label>Date <input type="date" id="hd" value="${hd}"></label><button data-load>Load</button><button class="ghost" data-print>Print</button></div>`;
A.closure=()=>PH("Closure history, "+hd.split("-").reverse().join("/"))+histBar()+(hist?tbl(["Order no.","Due","EQ ID","Equipment","Frequency","Action","Closed on","Closed by","Remarks"],hist.closures.map(c=>`<tr><td class="mono">${c.no}</td><td>${c.due}</td><td>${c.eq}</td><td>${esc(c.name)}</td><td>${c.freq}</td><td>${chip(c.action.toUpperCase())}</td><td>${c.on}</td><td>${esc(c.by)}</td><td>${esc(c.rem)}</td></tr>`)):`<p class="empty">Pick a date and click Load.</p>`);
A.orders=()=>PH("Maintenance order history, "+hd.split("-").reverse().join("/"))+histBar()+(hist?hist.measurements.map(m=>`<details><summary><b class="mono">${m.no}</b> ${esc(m.name)} (${m.freq}), recorded by ${esc(m.by)} on ${m.on}</summary>${tbl(["Check item","Reading","Mandatory","OK / NOT OK","Result","Notes"],m.items.map(i=>`<tr><td>${esc(i.item)}</td><td>${esc(i.reading)} ${esc(i.unit)}</td><td>${i.mand}</td><td>${i.ok}</td><td>${chip(i.result)}</td><td>${esc(i.notes)}</td></tr>`))}</details>`).join("")||`<p class="empty">No records for this date.</p>`:`<p class="empty">Pick a date and click Load.</p>`);
const sel=(k,i,v,l)=>`<select data-k="${k}" data-i="${i}">${l.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("")}</select>`;
A.equip=()=>`<div class="bar"><button data-add>Add equipment</button><button data-save>Save changes</button><span class="hint">Set an equipment to Inactive instead of deleting it.</span></div>`+tbl(["EQ ID","Name","Type","Location","Status","Criticality","Schedule start","Make / model","Rating","Remarks"],M.equipment.map((e,i)=>`<tr><td class="mono">${esc(e.id)}</td><td><input data-k="name" data-i="${i}" value="${esc(e.name)}"></td><td>${sel("type",i,e.type,["",...M.types])}</td><td>${sel("loc",i,e.loc,["",...Object.keys(M.areas)])}</td><td>${sel("status",i,e.status,["Active","Inactive"])}</td><td>${sel("crit",i,e.crit,["","High","Medium","Low"])}</td><td><input type="date" data-k="start" data-i="${i}" value="${e.start}"></td><td><input data-k="make" data-i="${i}" value="${esc(e.make)}"></td><td><input data-k="rating" data-i="${i}" value="${esc(e.rating)}"></td><td><input data-k="remarks" data-i="${i}" value="${esc(e.remarks)}"></td></tr>`));
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
A.sched=()=>`<div class="bar"><button data-save>Save changes</button><span class="hint">Weekly and longer maintenance for all equipment at a location falls on its assigned day. Changing a day moves the next due dates, so save before using the closing pages.</span></div>
<h3>Assigned day for each location</h3>`+tbl(["Location","Assigned day"],Object.keys(M.areas).map(a=>`<tr><td>${esc(a)}</td><td><select data-area="${esc(a)}">${DAYS.map((d,i)=>`<option value="${i+1}"${+M.areas[a]===i+1?" selected":""}>${d}</option>`).join("")}</select></td></tr>`))+
`<h3 style="margin-top:24px">Frequencies for each equipment type</h3><p class="hint">Tick the frequencies each type needs. Start date and criticality are set per equipment in Equipment details.</p>`+tbl(["Type",...M.settings.freqs],M.types.map(t=>`<tr><td>${esc(t)}</td>${M.settings.freqs.map((f,j)=>`<td><input type="checkbox" data-t="${esc(t)}" data-f="${j}"${(M.ticks[t]||[])[j]?" checked":""}></td>`).join("")}</tr>`));
let ct="",cf="";
A.checklist=()=>{const rows=M.library.map((r,i)=>[r,i]).filter(([r])=>(!ct||r.type===ct)&&(!cf||r.freq===cf)).sort((a,b)=>a[0].type.localeCompare(b[0].type)||M.settings.freqs.indexOf(a[0].freq)-M.settings.freqs.indexOf(b[0].freq)||a[0].seq-b[0].seq);
 const yn=(k,i,v)=>`<select data-lk="${k}" data-li="${i}"><option${v==="Yes"?" selected":""}>Yes</option><option${v==="Yes"?"":" selected"}>No</option></select>`;
 return`<div class="bar"><label>Equipment type <select id="ct"><option value="">All</option>${M.types.map(t=>`<option${t===ct?" selected":""}>${esc(t)}</option>`).join("")}</select></label><label>Frequency <select id="cf"><option value="">All</option>${M.settings.freqs.map(f=>`<option${f===cf?" selected":""}>${f}</option>`).join("")}</select></label><button data-addchk>Add item</button><button data-save>Save changes</button></div>
 <p class="hint">Choose an equipment type and a frequency to add an item to that checklist. Set Active to No to hide an item without deleting it. Changes apply to new checklists only.</p>`+
 tbl(["ID","Seq.","Check item","Reading required","Unit","Acceptance criteria","Mandatory","Active",""],rows.map(([r,i])=>`<tr><td class="mono">${esc(r.id)}<small>${esc(r.type)}, ${esc(r.freq)}</small></td><td><input type="number" style="width:60px" data-lk="seq" data-li="${i}" value="${r.seq}"></td><td><input data-lk="item" data-li="${i}" value="${esc(r.item)}"></td><td>${yn("readReq",i,r.readReq)}</td><td><input style="width:70px" data-lk="unit" data-li="${i}" value="${esc(r.unit)}"></td><td><input data-lk="criteria" data-li="${i}" value="${esc(r.criteria)}"></td><td>${yn("mand",i,r.mand)}</td><td>${yn("active",i,r.active)}</td><td><button class="ghost" data-delchk="${i}">Delete</button></td></tr>`))};
V.admin=()=>{if(R!=="admin"){$("#view").textContent="Admin access only.";return}
 const show=()=>{$("#view").innerHTML=`<div class="subtabs">${[["closure","Closure history"],["orders","Maintenance order history"],["equip","Equipment details"],["sched","Maintenance scheduling"],["checklist","Checklist items"]].map(([k,n])=>`<button class="ghost${sub===k?" on":""}" data-s="${k}">${n}</button>`).join("")}</div>${A[sub]()}`};show();
 $("#view").oninput=e=>{const d=e.target.dataset;if(d.lk!==undefined){M.library[d.li][d.lk]=d.lk==="seq"?+e.target.value:e.target.value;return}if(d.k&&d.i!==undefined)M.equipment[d.i][d.k]=e.target.value};
 $("#view").onchange=e=>{const d=e.target.dataset;if(e.target.id==="ct"||e.target.id==="cf"){if(e.target.id==="ct")ct=e.target.value;else cf=e.target.value;show();return}if(d.lk!==undefined){M.library[d.li][d.lk]=d.lk==="seq"?+e.target.value:e.target.value;return}if(d.area!==undefined){M.areas[d.area]=+e.target.value;return}if(d.t){(M.ticks[d.t]=M.ticks[d.t]||Array(7).fill(0))[d.f]=e.target.checked?1:0;return}if(d.k&&d.i!==undefined)M.equipment[d.i][d.k]=e.target.value;if(e.target.id==="hd")hd=e.target.value};
 $("#view").onclick=async e=>{const d=e.target.dataset;
  if(d.print!==undefined)window.print();
  else if(d.s){sub=d.s;show()}
  else if(d.load!==undefined){try{hist=await call("history",{date:hd});show()}catch(x){toast(x.message,1)}}
  else if(d.add!==undefined){const l=M.equipment[M.equipment.length-1]?.id||"EQ-0000",m=/^(.*?)(\d+)$/.exec(l);M.equipment.push({id:m[1]+String(+m[2]+1).padStart(m[2].length,"0"),name:"",type:"",loc:"",make:"",rating:"",install:"",status:"Active",remarks:"",crit:"",start:""});show()}
  else if(d.addchk!==undefined){if(!ct||!cf)return toast("Select an equipment type and a frequency first.",1);
   const pre=ct.slice(0,4).toUpperCase().replace(/[^A-Z]/g,"")+"-"+cf.slice(0,3).toUpperCase()+"-",nums=M.library.filter(r=>r.id.startsWith(pre)).map(r=>+r.id.slice(pre.length)||0),seqs=M.library.filter(r=>r.type===ct&&r.freq===cf).map(r=>+r.seq||0);
   M.library.push({id:pre+String(Math.max(0,...nums)+1).padStart(2,"0"),type:ct,freq:cf,seq:Math.max(0,...seqs)+1,item:"",readReq:"No",unit:"",criteria:"",mand:"Yes",active:"Yes",ref:""});show()}
  else if(d.delchk!==undefined){if(confirm("Delete this checklist item? Records already saved are not affected.")){M.library.splice(+d.delchk,1);show()}}
  else if(d.save!==undefined){if(sub==="checklist"&&M.library.some(r=>!String(r.item).trim()))return toast("Fill in or delete the empty checklist items first.",1);e.target.disabled=true;try{await call("master",{master:M});toast("Saved to the data repository.")}catch(x){toast(x.message,1)}e.target.disabled=false}}};

(async()=>{try{await load()}catch(e){$("#view").innerHTML=`<p class="empty">Could not load data: ${esc(e.message)}</p>`}})();
})();
