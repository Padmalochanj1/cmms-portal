// Reads one day of the Coal Washery DPR Excel workbook (.xlsx: sheets "DPR", "RM Daywise", "FG Daywise") in the browser. Nothing is sent anywhere.
(function(g){
const colN=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0),colL=n=>{let s="";while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s};
const rng=(a,b)=>{const o=[];for(let i=colN(a);i<=colN(b);i++)o.push(colL(i));return o};
// DPR sheet: column -> field. Quality columns hold percentages as fractions in Excel (0.0343 = 3.43 %), the website stores 3.43.
const DPR={B:"rb",C:"ro",F:"cc",H:"mr",P:"an",S:"pw",U:"wt",W:"fr",AF:"dtN",AK:"rmk",Y:"dtU",Z:"dtC",AA:"dtE",AB:"dtM",AC:"dtP",AD:"dtO",AE:"dtS"};
const PCT=new Set();rng("AM","AR").forEach((c,i)=>{DPR[c]="rq"+i;if(i<5)PCT.add(c)});rng("AS","AX").forEach((c,i)=>{DPR[c]="cq"+i;if(i<5)PCT.add(c)});rng("AY","BD").forEach((c,i)=>{DPR[c]="mq"+i;if(i<5)PCT.add(c)});
// RM Daywise: opening stock B, receiving D (BCCL) and E (FERRO), interunit transfer H, I, J, K.  FG Daywise: opening B, despatch D (internal) and E (outside); middlings opening I, despatch K (internal) and L (OLD CPP)
const RM={D:"rr",E:"rf",H:"i1",I:"i2",J:"i3",K:"i4"},RMO={B:"orc"};
const FG={D:"fdi",E:"fdo",K:"mdi",L:"mdc"},FGO={B:"ofc",I:"omr"};
const TEXT=new Set(["rmk"]);
async function unzip(buf){if(typeof DecompressionStream==="undefined")throw Object.assign(new Error("browser"),{code:"browser"});
 const dv=new DataView(buf),u8=new Uint8Array(buf),td=new TextDecoder();let e=-1;for(let i=u8.length-22;i>=Math.max(0,u8.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
 if(e<0)throw Object.assign(new Error("format"),{code:"format"});const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const files={};
 for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=td.decode(u8.subarray(p+46,p+46+nl));files[name]={meth,csz,lo};p+=46+nl+xl+cl}
 return{get:async name=>{const f=files[name];if(!f)return null;const nl=dv.getUint16(f.lo+26,true),xl=dv.getUint16(f.lo+28,true),s=f.lo+30+nl+xl,data=u8.subarray(s,s+f.csz);if(f.meth===0)return td.decode(data);if(f.meth!==8)throw Object.assign(new Error("format"),{code:"format"});
  const ds=new DecompressionStream("deflate-raw"),w=ds.writable.getWriter();w.write(data);w.close();return td.decode(await new Response(ds.readable).arrayBuffer())}}}
const xml=s=>new DOMParser().parseFromString(s,"application/xml");
// -> { "DPR": {cells}, "RM Daywise": {cells}, ... } (sheet names trimmed, lower case)
async function load(buf){const z=await unzip(buf),wbx=await z.get("xl/workbook.xml");if(!wbx)throw Object.assign(new Error("format"),{code:"format"});
 const wd=xml(wbx),sheets=[...wd.getElementsByTagName("sheet")].map(s=>({name:s.getAttribute("name"),rid:s.getAttribute("r:id")||s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id")}));
 const rels={};[...xml(await z.get("xl/_rels/workbook.xml.rels")).getElementsByTagName("Relationship")].forEach(r=>rels[r.getAttribute("Id")]=r.getAttribute("Target"));
 const ss=[];const sst=await z.get("xl/sharedStrings.xml");if(sst)[...xml(sst).getElementsByTagName("si")].forEach(si=>ss.push([...si.getElementsByTagName("t")].map(t=>t.textContent).join("")));
 const out={};
 for(const sh of sheets){let tp=rels[sh.rid]||"";tp=tp.replace(/^\//,"");if(!tp.startsWith("xl/"))tp="xl/"+tp;const sd=await z.get(tp);if(!sd)continue;const cells={};
  [...xml(sd).getElementsByTagName("c")].forEach(c=>{const r=c.getAttribute("r"),t=c.getAttribute("t"),vEl=c.getElementsByTagName("v")[0],f=c.getElementsByTagName("f").length>0;let v=null;
   if(t==="inlineStr")v=[...c.getElementsByTagName("t")].map(x=>x.textContent).join("");else if(vEl){const raw=vEl.textContent;v=t==="s"?(ss[+raw]??""):t==="str"||t==="e"?raw:t==="b"?+raw:(raw===""?null:+raw)}
   if(v!==null&&v!=="")cells[r]={v,f}});
  out[sh.name.trim().toLowerCase()]=cells}
 return out}
const date=serial=>new Date(Math.round((serial-25569)*864e5));
const iso=serial=>date(serial).toISOString().slice(0,10);
const r6=x=>Math.round(x*1e6)/1e6;
// -> {ok:true, values, row, sheet, count} or {ok:false, code:"nodata"|"format"|"browser"}
async function readDay(buf,day){let X;try{X=await load(buf)}catch(e){return{ok:false,code:e.code||"format"}}
 const C=X["dpr"];if(!C)return{ok:false,code:"format"};
 const head=[1,2,3].flatMap(r=>Object.keys(C).filter(k=>new RegExp("^[A-Z]+"+r+"$").test(k)).map(k=>String(C[k].v))).join("|").toLowerCase();
 if(!/raw coal charged/.test(head)||!/production/.test(head)||!/down time/.test(head))return{ok:false,code:"format"};
 let row=0;for(let r=4;r<=400;r++){const c=C["A"+r];if(c&&typeof c.v==="number"&&iso(c.v)===day){row=r;break}}
 if(!row)return{ok:false,code:"nodata"};
 const v={};
 Object.entries(DPR).forEach(([col,k])=>{const c=C[col+row];if(!c)return;if(TEXT.has(k)){if(typeof c.v==="string"&&c.v.trim())v[k]=c.v.trim()}
  else if(typeof c.v==="number"&&Number.isFinite(c.v))v[k]=r6(PCT.has(col)&&Math.abs(c.v)<=1.5?c.v*100:c.v)});
 const mg=C["O"+row];if(mg&&!mg.f&&typeof mg.v==="number"&&mg.v>10)v.mg=r6(mg.v);                  // magnetite is a formula in the sheet; only a typed value is taken
 const ah=C["AH"+row];if(ah&&typeof ah.v==="number"&&ah.v!==1440)v.dsd=r6(ah.v);                    // running time: only when it differs from the standard day
 // the stock sheets are matched by the day of the month (their date column may still show the month of the template)
 const dom=+day.slice(8),find=(S,from,to)=>{if(!S)return 0;for(let r=from;r<=to;r++){const c=S["A"+r];if(c&&typeof c.v==="number"&&date(c.v).getUTCDate()===dom)return r}return 0};
 const rmS=X["rm daywise"],fgS=X["fg daywise"],rr=find(rmS,4,40),fr=find(fgS,6,42);
 if(rr){Object.entries(RM).forEach(([col,k])=>{const c=rmS[col+rr];if(c&&typeof c.v==="number")v[k]=r6(c.v)});Object.entries(RMO).forEach(([col,k])=>{const c=rmS[col+rr];if(c&&!c.f&&typeof c.v==="number")v[k]=r6(c.v)})}
 if(fr){Object.entries(FG).forEach(([col,k])=>{const c=fgS[col+fr];if(c&&typeof c.v==="number")v[k]=r6(c.v)});Object.entries(FGO).forEach(([col,k])=>{const c=fgS[col+fr];if(c&&!c.f&&typeof c.v==="number")v[k]=r6(c.v)})}
 const main=["rb","ro","cc","mr","pw","wt","rr","rf","i1","i2","i3","i4","fdi","fdo","mdi","mdc"];
 if(!main.some(k=>v[k]>0))return{ok:false,code:"nodata"};
 return{ok:true,values:v,row,sheet:"DPR",count:Object.keys(v).length}}
g.CWX={readDay,DPR};if(typeof module!=="undefined")module.exports=g.CWX})(typeof window!=="undefined"?window:globalThis);
