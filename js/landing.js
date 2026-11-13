(()=>{let panel="";const C=window.CMMS_CONFIG,P=window.CMMS_PLANTS,$=s=>document.querySelector(s),e=s=>String(s).replace(/&/g,"&amp;");
const cur=()=>{const p=P.find(x=>x.id===$("#pl").value)||P[0];return[p,p.sections.find(x=>x.id===$("#sc").value)||p.sections[0]]};
const label=()=>{const[p,s]=cur();return p.name+" "+s.name};
const title=()=>{document.title="Plant Management Portal"};
const secs=()=>{const p=P.find(x=>x.id===$("#pl").value)||P[0],ok=p.sections.filter(s=>!s.soon);
 $("#sc").innerHTML=p.sections.map(s=>`<option value="${s.id}"${s.soon?" disabled":""}>${e(s.name)}${s.soon?" (coming soon)":""}</option>`).join("");
 $("#sc").value=(ok.find(s=>s.id===localStorage.cmmsSection)||ok[0]).id;title(label())};
$("#pl").innerHTML=P.map(p=>`<option value="${p.id}">${e(p.name)}</option>`).join("");$("#pl").value=localStorage.cmmsPlant||P[0].id;if(!$("#pl").value)$("#pl").value=P[0].id;secs();
$("#pl").onchange=()=>{localStorage.cmmsPlant=$("#pl").value;secs()};$("#sc").onchange=()=>{localStorage.cmmsSection=$("#sc").value;title(label())};
const show=()=>{const u=sessionStorage.cmmsUser;$("#login").hidden=!!u;const must=u&&sessionStorage.cmmsMust==="1";$("#home").hidden=!u||!!panel||!!must;$("#pwBox").hidden=!(u&&(panel==="pw"||must));$("#admBox").hidden=!(u&&panel==="adm"&&!must);$("#admBtn").hidden=sessionStorage.cmmsRole!=="admin";$("#pcancel").hidden=!!must;$("#pwNote").textContent=must?"Your password was reset by the administrator. Please choose a new password to continue.":"";
 $("#unitTag").hidden=!u;if(u){$("#who").textContent=u;$("#unitTag").textContent=sessionStorage.cmmsUnit}title();
 document.querySelectorAll("[data-sec]").forEach(a=>{const role=sessionStorage.cmmsRole;a.hidden=a.dataset.sec!==(sessionStorage.cmmsSection||"ei")||(a.dataset.roles&&!a.dataset.roles.split(",").includes(role))||(a.hasAttribute("data-admin")&&role!=="admin")})};
$("#lf").onsubmit=async ev=>{ev.preventDefault();$("#go").disabled=true;$("#err").textContent="";
 try{let r,j;
  if(!/^https:\/\//i.test(C.url||""))throw new Error("The server address is not set. Open js/config.js and paste your Worker address (it starts with https://).");
  try{r=await fetch(C.url,{method:"POST",body:JSON.stringify({action:"login",plant:$("#pl").value,section:$("#sc").value,username:$("#u").value.trim(),password:$("#p").value})})}
  catch(_){throw new Error("Cannot reach the server. Check the URL in config.js and your network connection.")}
  try{j=await r.json()}catch(_){throw new Error("The server sent an unexpected reply (HTTP "+r.status+"). Check the Worker address in js/config.js, and that the Worker is deployed.")}
  if(j.error)throw new Error(j.error);
  sessionStorage.cmmsToken=j.token;sessionStorage.cmmsUser=j.user;sessionStorage.cmmsRole=j.role;sessionStorage.cmmsUnit=j.unit;sessionStorage.cmmsMust=j.mustChange?"1":"";sessionStorage.cmmsSection=$("#sc").value;$("#p").value="";show()}
 catch(x){$("#err").textContent=x.message}
 $("#go").disabled=false};
$("#out").onclick=()=>{sessionStorage.clear();panel="";show()};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const flash=m=>{$("#flash").textContent=m;setTimeout(()=>$("#flash").textContent="",5000)};
const api=async(a,b)=>{let r,j;try{r=await fetch(C.url,{method:"POST",body:JSON.stringify({token:sessionStorage.cmmsToken,action:a,...b})})}catch(_){throw new Error("Cannot reach the server.")}
 try{j=await r.json()}catch(_){throw new Error("The server sent an unexpected reply.")}
 if(j.error){if(/Session expired/.test(j.error)){sessionStorage.clear();panel="";show()}throw new Error(j.error)}return j};
$("#forgot").onclick=ev=>{ev.preventDefault();$("#fnote").hidden=!$("#fnote").hidden};
$("#cpw").onclick=()=>{panel="pw";$("#perr").textContent="";$("#pf").reset();show()};
$("#pcancel").onclick=()=>{panel="";show()};
$("#pf").onsubmit=async ev=>{ev.preventDefault();$("#perr").textContent="";
 if($("#pn").value!==$("#pc").value){$("#perr").textContent="The new password and its confirmation do not match.";return}
 $("#pgo").disabled=true;
 try{const j=await api("change_password",{oldPassword:$("#po").value,newPassword:$("#pn").value});sessionStorage.cmmsToken=j.token;sessionStorage.cmmsMust="";panel="";$("#pf").reset();show();flash("Password changed.")}
 catch(x){$("#perr").textContent=x.message}$("#pgo").disabled=false};
const ulist=async()=>{try{const j=await api("admin_users");$("#ul").innerHTML=j.users.map(u=>`<tr><td>${esc(u.username)}</td><td>${esc(u.role)}</td><td>${u.mustChange?"Temporary password, must change":u.custom?"Own password":"Initial password"}</td><td><button class="ghost" data-u="${esc(u.username)}">Reset</button></td></tr>`).join("")}catch(x){$("#aerr").textContent=x.message}};
$("#admBtn").onclick=()=>{panel="adm";$("#aerr").textContent="";$("#temp").hidden=true;show();ulist()};
$("#acancel").onclick=()=>{panel="";show()};
$("#ul").onclick=async ev=>{const u=ev.target.dataset.u;if(!u||!confirm(`Reset the password for ${u}? A new temporary password will be created.`))return;$("#aerr").textContent="";
 try{const j=await api("admin_reset_password",{username:u});$("#temp").hidden=false;$("#temp").innerHTML=`Temporary password for <b>${esc(j.username)}</b>: <code>${esc(j.temp)}</code><br><small>Give it to the user. It is shown only once. They must choose a new password when they sign in.</small>`;ulist()}catch(x){$("#aerr").textContent=x.message}};
show()})();
