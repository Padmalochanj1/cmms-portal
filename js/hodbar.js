// Header links for the HOD: the sections of the plant and the way back to the HOD overview.
(function(g){g.HODBAR={mount(cur){const h=document.querySelector(".hdr");if(!h)return;const unit=String(sessionStorage.cmmsUnit||"").replace(/ HOD$/,""),P=g.CMMS_PLANTS||[],pl=P.find(p=>p.id===sessionStorage.cmmsPlant)||P.find(p=>p.name===unit);
 const home=h.querySelector("a");home.href="hod.html";home.textContent="HOD home";
 (pl?pl.sections.filter(s=>s.id!=="hod"&&!s.soon):[]).forEach(s=>{const a=document.createElement("a");a.className="btn ghost";a.textContent=s.name;a.href=s.id==="ops"?"ops.html?sec=ops":"app.html?sec="+s.id;if(s.id===cur){a.style.background="rgba(255,255,255,.3)";a.style.fontWeight="700"}h.insertBefore(a,home)})}}})(window);
