(()=>{const C=window.CMMS_CONFIG,P=window.CMMS_PLANTS,$=s=>document.querySelector(s),e=s=>String(s).replace(/&/g,"&amp;");
const cur=()=>{const p=P.find(x=>x.id===$("#pl").value)||P[0];return[p,p.sections.find(x=>x.id===$("#sc").value)||p.sections[0]]};
const label=()=>{const[p,s]=cur();return p.name+" "+s.name};
const title=()=>{document.title="Plant Management Portal"};
const secs=()=>{const p=P.find(x=>x.id===$("#pl").value)||P[0],ok=p.sections.filter(s=>!s.soon);
 $("#sc").innerHTML=p.sections.map(s=>`<option value="${s.id}"${s.soon?" disabled":""}>${e(s.name)}${s.soon?" (coming soon)":""}</option>`).join("");
 $("#sc").value=(ok.find(s=>s.id===localStorage.cmmsSection)||ok[0]).id;title(label())};
$("#pl").innerHTML=P.map(p=>`<option value="${p.id}">${e(p.name)}</option>`).join("");$("#pl").value=localStorage.cmmsPlant||P[0].id;if(!$("#pl").value)$("#pl").value=P[0].id;secs();
$("#pl").onchange=()=>{localStorage.cmmsPlant=$("#pl").value;secs()};$("#sc").onchange=()=>{localStorage.cmmsSection=$("#sc").value;title(label())};
const show=()=>{const u=sessionStorage.cmmsUser;$("#login").hidden=!!u;$("#home").hidden=!u;
 $("#unitTag").hidden=!u;if(u){$("#who").textContent=u;$("#unitTag").textContent=sessionStorage.cmmsUnit}title();
 document.querySelectorAll("[data-admin]").forEach(a=>a.hidden=sessionStorage.cmmsRole!=="admin")};
$("#lf").onsubmit=async ev=>{ev.preventDefault();$("#go").disabled=true;$("#err").textContent="";
 try{const r=await fetch(C.url,{method:"POST",body:JSON.stringify({action:"login",plant:$("#pl").value,section:$("#sc").value,username:$("#u").value.trim(),password:$("#p").value})});
  const j=await r.json();if(j.error)throw new Error(j.error);
  sessionStorage.cmmsToken=j.token;sessionStorage.cmmsUser=j.user;sessionStorage.cmmsRole=j.role;sessionStorage.cmmsUnit=j.unit;$("#p").value="";show()}
 catch(x){$("#err").textContent=/fetch|JSON/i.test(x.message)?"Cannot reach the server. Check the URL in config.js.":x.message}
 $("#go").disabled=false};
$("#out").onclick=()=>{sessionStorage.clear();show()};show()})();
