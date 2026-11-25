// Reads one day of the Coke Oven DPR Excel sheet (.xlsx, same layout as Coke_Oven_DPR.xlsx) in the browser. Nothing is sent anywhere.
(function(g){
const colN=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0),colL=n=>{let s="";while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s};
const rng=(a,b)=>{const o=[];for(let i=colN(a);i<=colN(b);i++)o.push(colL(i));return o};
const MAP={};const seq=(p,cols)=>cols.forEach((c,i)=>MAP[c]=p+i);
seq("pr",rng("T","AB"));seq("bp",rng("AD","AI"));seq("dr",rng("AP","AZ"));seq("ds",rng("BB","BL"));seq("os",rng("BN","BV"));seq("bs",rng("BX","CG"));seq("cq",rng("GS","HC"));seq("kq",rng("HE","HP"));seq("sf",rng("HR","HT"));
Object.assign(MAP,{FL:"dc",FM:"pw1",FO:"pw2",FR:"wt",FS:"sg",FW:"dpS",FX:"dpP",GB:"dpE",GC:"dpM",GD:"dpO",GE:"dpF",GF:"dpX",GG:"dpR",GI:"dbS",GL:"dbE",GM:"dbM",GN:"dbO",GO:"dbF",GP:"dbX",GQ:"dbR",HW:"pbl",HX:"pdy",HY:"ppd",HZ:"ppw",IA:"ptp",IB:"pck",IC:"pnp",IG:"j1f",II:"j1c",IK:"j1r",IM:"m8f",IO:"m8c",IS:"j8f",IU:"j8r"});
// coal columns of the Excel sheet (DC to FJ) added up into the five coal types: 1 PHCC, 2 SHCC, 3 SSCC, 4 PCI, 5 Indigenous
const COAL=[["DE","DF","DG","DH","DI","DP","DQ","DR","DY","DZ","EA","EH","EI","EJ"],["DJ","DK","DL","DS","DT","DU","EB","EC","ED","EK","EL","EM","EN","EO","EP","EQ","ER","ES","ET",...rng("EU","FC")],["DC","DD","DV","DW","DX","EE","EF","EG",...rng("FG","FJ")],["FD","FE","FF"],["DM","DN","DO"]];
// opening stocks and first belt readings: used only when they are typed in the Excel sheet (not carried by a formula)
const OPEN={IF:"j1i",IL:"m8i",IR:"j8i"};rng("B","J").forEach((c,i)=>OPEN[c]="op"+i);rng("L","Q").forEach((c,i)=>OPEN[c]="ob"+i);
const TEXT=new Set(["dpR","dbR","j1r","j8r"]);
async function unzip(buf){if(typeof DecompressionStream==="undefined")throw Object.assign(new Error("browser"),{code:"browser"});
 const dv=new DataView(buf),u8=new Uint8Array(buf),td=new TextDecoder();let e=-1;for(let i=u8.length-22;i>=Math.max(0,u8.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
 if(e<0)throw Object.assign(new Error("format"),{code:"format"});const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const files={};
 for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=td.decode(u8.subarray(p+46,p+46+nl));files[name]={meth,csz,lo};p+=46+nl+xl+cl}
 return{get:async name=>{const f=files[name];if(!f)return null;const nl=dv.getUint16(f.lo+26,true),xl=dv.getUint16(f.lo+28,true),s=f.lo+30+nl+xl,data=u8.subarray(s,s+f.csz);if(f.meth===0)return td.decode(data);if(f.meth!==8)throw Object.assign(new Error("format"),{code:"format"});
  const ds=new DecompressionStream("deflate-raw"),w=ds.writable.getWriter();w.write(data);w.close();return td.decode(await new Response(ds.readable).arrayBuffer())}}}
const xml=s=>new DOMParser().parseFromString(s,"application/xml");
async function load(buf){const z=await unzip(buf),wbx=await z.get("xl/workbook.xml");if(!wbx)throw Object.assign(new Error("format"),{code:"format"});
 const wd=xml(wbx),sheets=[...wd.getElementsByTagName("sheet")].map(s=>({name:s.getAttribute("name"),rid:s.getAttribute("r:id")||s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id")}));
 const rels={};[...xml(await z.get("xl/_rels/workbook.xml.rels")).getElementsByTagName("Relationship")].forEach(r=>rels[r.getAttribute("Id")]=r.getAttribute("Target"));
 const sh=sheets.find(s=>/^dpr$/i.test(s.name))||sheets[0];if(!sh)throw Object.assign(new Error("format"),{code:"format"});let tp=rels[sh.rid]||"worksheets/sheet1.xml";tp=tp.replace(/^\//,"");if(!tp.startsWith("xl/"))tp="xl/"+tp;
 const ss=[];const sst=await z.get("xl/sharedStrings.xml");if(sst)[...xml(sst).getElementsByTagName("si")].forEach(si=>ss.push([...si.getElementsByTagName("t")].map(t=>t.textContent).join("")));
 const sd=await z.get(tp);if(!sd)throw Object.assign(new Error("format"),{code:"format"});const cells={};
 [...xml(sd).getElementsByTagName("c")].forEach(c=>{const r=c.getAttribute("r"),t=c.getAttribute("t"),vEl=c.getElementsByTagName("v")[0],f=c.getElementsByTagName("f").length>0;let v=null;
  if(t==="inlineStr")v=[...c.getElementsByTagName("t")].map(x=>x.textContent).join("");else if(vEl){const raw=vEl.textContent;v=t==="s"?(ss[+raw]??""):t==="str"||t==="e"?raw:t==="b"?+raw:(raw===""?null:+raw)}
  if(v!==null&&v!=="")cells[r]={v,f}});
 return{cells,sheet:sh.name}}
const iso=serial=>new Date(Math.round((serial-25569)*864e5)).toISOString().slice(0,10);
// -> {ok:true, values, row, sheet, count} or {ok:false, code:"nodata"|"format"|"browser"}
async function readDay(buf,date){let X;try{X=await load(buf)}catch(e){return{ok:false,code:e.code||"format"}}
 const C=X.cells,head=[1,2,3].flatMap(r=>Object.keys(C).filter(k=>new RegExp("^[A-Z]+"+r+"$").test(k)).map(k=>String(C[k].v))).join("|").toLowerCase();
 if(!/production/.test(head)||!/dispatch/.test(head)||!/opening stock/.test(head))return{ok:false,code:"format"};
 let row=0;for(let r=4;r<=400;r++){const c=C["A"+r];if(c&&typeof c.v==="number"&&iso(c.v)===date){row=r;break}}
 if(!row)return{ok:false,code:"nodata"};
 const v={};Object.entries(MAP).forEach(([col,k])=>{const c=C[col+row];if(!c)return;if(TEXT.has(k)){if(typeof c.v==="string"&&c.v.trim())v[k]=c.v.trim()}else if(typeof c.v==="number"&&Number.isFinite(c.v))v[k]=Math.round(c.v*1e6)/1e6});
 let anyc=false;const cc=COAL.map(cols=>cols.reduce((s,col)=>{const c=C[col+row];if(c&&typeof c.v==="number"){anyc=true;return s+c.v}return s},0));if(anyc)cc.forEach((x,i)=>v["cc"+i]=Math.round(x*1e6)/1e6);
 Object.entries(OPEN).forEach(([col,k])=>{const c=C[col+row];if(c&&!c.f&&typeof c.v==="number")v[k]=Math.round(c.v*1e6)/1e6});
 const main=Object.keys(v).filter(k=>/^(pr|bp|dr|ds|os|bs|cc)\d/.test(k)||["pw1","sg","j1f","m8f"].includes(k));
 if(!main.some(k=>v[k]>0))return{ok:false,code:"nodata"};
 return{ok:true,values:v,row,sheet:X.sheet,count:Object.keys(v).length}}
g.DPRX={readDay,MAP};if(typeof module!=="undefined")module.exports=g.DPRX})(typeof window!=="undefined"?window:globalThis);
