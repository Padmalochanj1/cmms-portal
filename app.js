(()=>{
const C=window.CMMS_CONFIG,L=window.CMMS,$=s=>document.querySelector(s),T=sessionStorage.cmmsToken,U=sessionStorage.cmmsUser,R=sessionStorage.cmmsRole;
if(!T){location.replace("index.html");return}
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const opDay=()=>{const d=new Date(Date.now()-216e5);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5};
let M,TD=opDay(),route=(location.hash||"#dashboard").slice(1),cl={},ms={},cur="",items=[],sub="closure",hist=null,hd=L.iso(TD),dirty=false;
const V={},A={},ROUTES=[["dashboard","Dashboard"],["closing","Order closing"],["checklist","Checklist closing"],["tomorrow","Tomorrow’s orders"]].concat(R==="admin"?[["admin","Admin"]]:[]);
const toast=(m,bad)=>{const t=$("#toast");t.textContent=m;t.className=bad?"bad show":"show";clearTimeout(toast.t);toast.t=setTimeout(()=>t.className="",6000)};
async function call(a,b){let j;try{const r=await fetch(C.url,{method:"POST",body:JSON.stringify({token:T,action:a,...b}),signal:AbortSignal.timeout(45000)});j=await r.json()}
 catch(e){throw new Error("The server did not respond. Check the URL in config.js and that the Apps Script deployment access is set to Anyone.")}
 if(j.error){if(/Session expired/.test(j.error)){sessionStorage.clear();location.replace("index.html")}throw new Error(j.error)}return j}
async function load(){const d=await call("load",{date:L.iso(TD)});if(!d.master)throw new Error("No data received from the server.");M=d.master;cl=Object.fromEntries(d.closures.map(c=>[c.no,c]));ms=Object.fromEntries(d.measurements.map(m=>[m.no,1]));
 $("#sub").textContent=`${U}${R==="admin"?" (admin)":""}  |  Operational date ${L.iso(TD).split("-").reverse().join("/")}`;draw()}
const st=o=>cl[o.no]?cl[o.no].action.toUpperCase():ms[o.no]?"READY TO CLOSE":L.items(M,o).length?"OPEN":"NO CHECKLIST";
const chip=s=>`<span class="chip ${s.replace(/ /g,"_")}">${s}</span>`;
const bars=l=>{const m=Math.max(1,...l.map(x=>x[1]));return l.map(([a,n])=>`<div class="bar2"><span>${a}</span><i style="width:${n/m*100}%"></i><em>${n}</em></div>`).join("")};
const go=r=>{route=r;location.hash=r;draw()};
function draw(){if(!M)return;$("#nav").innerHTML=ROUTES.map(([k,n])=>`<button data-r="${k}" class="${k===route?"on":""}">${n}</button>`).join("");
 const v=$("#view");v.onclick=v.oninput=v.onchange=null;(V[route]||V.dashboard)()}
$("#nav").onclick=e=>{if(e.target.dataset.r)go(e.target.dataset.r)};
$("#refresh").onclick=()=>load().then(()=>toast("Refreshed.")).catch(e=>toast(e.message,1));

V.dashboard=()=>{const os=L.orders(M,TD),c=k=>os.filter(o=>st(o)===k).length,days=[...Array(7)].map((_,i)=>[L.iso(TD+i).slice(5),L.orders(M,TD+i).length]);
 $("#view").innerHTML=`<div class="sum"><div><b>${os.length}</b>due today</div><div><b>${c("CLOSED")}</b>closed</div><div><b>${c("DEFERRED")}</b>deferred</div><div><b>${os.length-c("CLOSED")-c("DEFERRED")}</b>open</div><div><b>${days[1][1]}</b>due tomorrow</div></div>
 <div class="two"><div><h3>Orders due, next 7 days</h3>${bars(days)}</div><div><h3>Today by criticality</h3>${bars(["High","Medium","Low"].map(k=>[k,os.filter(o=>o.e.crit===k).length]))}</div></div>`};

V.closing=()=>{const os=L.orders(M,TD);
 $("#view").innerHTML=`<div class="wrap"><table><thead><tr><th>Order no.</th><th>Equipment</th><th>Criticality</th><th>Status</th><th>Remarks</th><th></th></tr></thead><tbody>${os.map((o,i)=>{const s=st(o),done=!!cl[o.no];
 return`<tr data-i="${i}"><td class="mono">${o.no}</td><td>${esc(o.e.name)}<small>${o.e.id}, ${esc(o.e.type)}, ${esc(o.e.loc)}</small></td><td>${esc(o.e.crit)}</td><td>${chip(s)}</td><td><input data-r value="${esc(cl[o.no]?.rem||"")}"${done?" disabled":""}></td>
 <td>${done?"":`<button class="link" data-a="chk">Checklist</button> <button data-a="Closed"${s==="READY TO CLOSE"?"":" disabled"}>Close</button> <button class="ghost" data-a="Deferred">Defer</button>`}</td></tr>`}).join("")||`<tr><td colspan="6" class="empty">No orders are due today.</td></tr>`}</tbody></table></div>`;
 $("#view").onclick=async e=>{const a=e.target.dataset.a,tr=e.target.closest("tr");if(!a||!tr)return;const o=os[tr.dataset.i];if(a==="chk"){cur=o.no;go("checklist");return}
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
 $("#view").innerHTML=`<p class="hint">${os.length} order(s) due on ${L.iso(TD+1).split("-").reverse().join("/")}</p><div class="wrap"><table><thead><tr><th>Sl.</th><th>Order no.</th><th>Equipment</th><th>Type</th><th>Location</th><th>Criticality</th><th>Frequency</th></tr></thead><tbody>${os.map((o,i)=>`<tr><td>${i+1}</td><td class="mono">${o.no}</td><td>${esc(o.e.name)}<small>${o.e.id}</small></td><td>${esc(o.e.type)}</td><td>${esc(o.e.loc)}</td><td>${esc(o.e.crit)}</td><td>${o.freq}</td></tr>`).join("")||`<tr><td colspan="7" class="empty">No orders due tomorrow.</td></tr>`}</tbody></table></div>`};

const tbl=(h,rows)=>`<div class="wrap"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${h.length}" class="empty">No records.</td></tr>`}</tbody></table></div>`;
const histBar=()=>`<div class="bar"><label>Date <input type="date" id="hd" value="${hd}"></label><button data-load>Load</button></div>`;
A.closure=()=>histBar()+(hist?tbl(["Order no.","Due","EQ ID","Equipment","Frequency","Action","Closed on","Closed by","Remarks"],hist.closures.map(c=>`<tr><td class="mono">${c.no}</td><td>${c.due}</td><td>${c.eq}</td><td>${esc(c.name)}</td><td>${c.freq}</td><td>${chip(c.action.toUpperCase())}</td><td>${c.on}</td><td>${esc(c.by)}</td><td>${esc(c.rem)}</td></tr>`)):`<p class="empty">Pick a date and click Load.</p>`);
A.orders=()=>histBar()+(hist?hist.measurements.map(m=>`<details><summary><b class="mono">${m.no}</b> ${esc(m.name)} (${m.freq}), recorded by ${esc(m.by)} on ${m.on}</summary>${tbl(["Check item","Reading","Mandatory","OK / NOT OK","Result","Notes"],m.items.map(i=>`<tr><td>${esc(i.item)}</td><td>${esc(i.reading)} ${esc(i.unit)}</td><td>${i.mand}</td><td>${i.ok}</td><td>${chip(i.result)}</td><td>${esc(i.notes)}</td></tr>`))}</details>`).join("")||`<p class="empty">No records for this date.</p>`:`<p class="empty">Pick a date and click Load.</p>`);
const sel=(k,i,v,l)=>`<select data-k="${k}" data-i="${i}">${l.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("")}</select>`;
A.equip=()=>`<div class="bar"><button data-add>Add equipment</button><button data-save>Save changes</button><span class="hint">Set an equipment to Inactive instead of deleting it.</span></div>`+tbl(["EQ ID","Name","Type","Location","Status","Criticality","Schedule start","Make / model","Rating","Remarks"],M.equipment.map((e,i)=>`<tr><td class="mono">${esc(e.id)}</td><td><input data-k="name" data-i="${i}" value="${esc(e.name)}"></td><td>${sel("type",i,e.type,["",...M.types])}</td><td>${sel("loc",i,e.loc,["",...Object.keys(M.areas)])}</td><td>${sel("status",i,e.status,["Active","Inactive"])}</td><td>${sel("crit",i,e.crit,["","High","Medium","Low"])}</td><td><input type="date" data-k="start" data-i="${i}" value="${e.start}"></td><td><input data-k="make" data-i="${i}" value="${esc(e.make)}"></td><td><input data-k="rating" data-i="${i}" value="${esc(e.rating)}"></td><td><input data-k="remarks" data-i="${i}" value="${esc(e.remarks)}"></td></tr>`));
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
A.sched=()=>`<div class="bar"><button data-save>Save changes</button><span class="hint">Weekly and longer maintenance for all equipment at a location falls on its assigned day. Changing a day moves the next due dates, so save before using the closing pages.</span></div>
<h3>Assigned day for each location</h3>`+tbl(["Location","Assigned day"],Object.keys(M.areas).map(a=>`<tr><td>${esc(a)}</td><td><select data-area="${esc(a)}">${DAYS.map((d,i)=>`<option value="${i+1}"${+M.areas[a]===i+1?" selected":""}>${d}</option>`).join("")}</select></td></tr>`))+
`<h3 style="margin-top:24px">Frequencies for each equipment type</h3><p class="hint">Tick the frequencies each type needs. Start date and criticality are set per equipment in Equipment details.</p>`+tbl(["Type",...M.settings.freqs],M.types.map(t=>`<tr><td>${esc(t)}</td>${M.settings.freqs.map((f,j)=>`<td><input type="checkbox" data-t="${esc(t)}" data-f="${j}"${(M.ticks[t]||[])[j]?" checked":""}></td>`).join("")}</tr>`));
V.admin=()=>{if(R!=="admin"){$("#view").textContent="Admin access only.";return}
 const show=()=>{$("#view").innerHTML=`<div class="subtabs">${[["closure","Closure history"],["orders","Maintenance order history"],["equip","Equipment details"],["sched","Maintenance scheduling"]].map(([k,n])=>`<button class="ghost${sub===k?" on":""}" data-s="${k}">${n}</button>`).join("")}</div>${A[sub]()}`};show();
 $("#view").oninput=e=>{const d=e.target.dataset;if(d.k&&d.i!==undefined)M.equipment[d.i][d.k]=e.target.value};
 $("#view").onchange=e=>{const d=e.target.dataset;if(d.area!==undefined){M.areas[d.area]=+e.target.value;return}if(d.t){(M.ticks[d.t]=M.ticks[d.t]||Array(7).fill(0))[d.f]=e.target.checked?1:0;return}if(d.k&&d.i!==undefined)M.equipment[d.i][d.k]=e.target.value;if(e.target.id==="hd")hd=e.target.value};
 $("#view").onclick=async e=>{const d=e.target.dataset;
  if(d.s){sub=d.s;show()}
  else if(d.load!==undefined){try{hist=await call("history",{date:hd});show()}catch(x){toast(x.message,1)}}
  else if(d.add!==undefined){const l=M.equipment[M.equipment.length-1]?.id||"EQ-0000",m=/^(.*?)(\d+)$/.exec(l);M.equipment.push({id:m[1]+String(+m[2]+1).padStart(m[2].length,"0"),name:"",type:"",loc:"",make:"",rating:"",install:"",status:"Active",remarks:"",crit:"",start:""});show()}
  else if(d.save!==undefined){e.target.disabled=true;try{await call("master",{master:M});toast("Saved to the data repository.")}catch(x){toast(x.message,1)}e.target.disabled=false}}};

(async()=>{try{await load()}catch(e){$("#view").innerHTML=`<p class="empty">Could not load data: ${esc(e.message)}</p>`}})();
})();
