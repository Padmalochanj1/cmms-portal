// Coal Washery DPR: field list (same order and headings as the Excel sheet "DPR", plus the stock sheets "RM Daywise" and "FG Daywise") and all calculations.
// Used by the browser and by the tests. Nothing here talks to the server.
(function(g){
const QN=["Moisture (%)","Ash (%)","FC (%)","VM (%)","Sulphur (%)","GCV (kcal/kg)"];
// type: in = typed, ovr = typed to override the carried or calculated value, calc = formula, text = typed text. agg: how the month row is made (sum, avg, last, none)
const SEC=[],F=[],BY={};
const sec=(id,title,note)=>{const s={id,title,note,f:[]};SEC.push(s);return s};
const add=(s,k,l,o={})=>{const f={k,l,sec:s.id,t:"in",agg:"sum",d:2,...o};s.f.push(f);F.push(f);BY[k]=f;return f};
let s=sec("raw","Raw Coal Charged (MT)");add(s,"rb","BCCL Coal (MT)");add(s,"ro","Other Sources (MT)");add(s,"rT","Total (MT)",{t:"calc"});add(s,"cap","Capacity Utilisation (%)",{t:"calc",agg:"avg",d:1});
s=sec("prd","Production (MT)");add(s,"cc","Clean Coal (MT)");add(s,"mr","Middlings / Rejects (MT)");add(s,"pl","Process Loss (MT)",{t:"calc"});add(s,"bl","Balancing (MT)",{t:"calc",d:3});add(s,"cum","MTD Clean Coal (MT)",{t:"calc",agg:"last"});
s=sec("yld","Yield %");add(s,"ccm","Clean Coal (Moisture Adjusted)",{t:"calc"});add(s,"yl","Clean Coal Yield %",{t:"calc",agg:"avg"});add(s,"ymr","Middlings / Rejects %",{t:"calc",agg:"avg"});
s=sec("chm","Chemicals","Magnetite is worked out as raw coal charged x the magnetite factor (Settings). Type a value only to correct it.");add(s,"mg","Magnetite (KG)",{t:"ovr"});add(s,"an","Anionic (KG)");
s=sec("utl","Utility");add(s,"pw","Power Consumption (KWH)");add(s,"pwp","Power (KWH) / MT",{t:"calc",agg:"avg"});add(s,"wt","Water Consumption (M3)");add(s,"wtp","Water (M3) / MT",{t:"calc",agg:"avg",d:3});
s=sec("fdr","Avg Feed Rate (TPH)","Worked out as raw coal charged / actual running hours. Type a value only to correct it.");add(s,"fr","Avg Feed Rate (TPH)",{t:"ovr",agg:"avg",d:1});
s=sec("dly","Down time Report (in mins)","Running time is the standard minutes of the day (Settings) unless a value is typed.");
[["dtU","Utility"],["dtC","CPP"],["dtE","Elect"],["dtM","Mech"],["dtP","Process"],["dtO","Others"],["dtS","Shut Down"]].forEach(([k,l])=>add(s,k,l,{d:0}));
add(s,"dtT","Total Delay",{t:"calc",d:0});add(s,"dtN","PPM",{d:0});add(s,"dsd","Running Time",{t:"ovr",d:0});add(s,"dar","Actual Running Time (MIN)",{t:"calc",d:0});add(s,"rn","Running (%)",{t:"calc",agg:"avg",d:1});add(s,"rmk","Remarks",{t:"text",agg:"none"});
const quality=(id,title,p)=>{const q=sec(id,title);QN.forEach((n,i)=>add(q,p+i,n,{agg:"avg"}))};
quality("rql","Quality Report - Raw Material Charged","rq");quality("cql","Quality Report & Size - Product - Clean Coal","cq");quality("mql","Quality Report & Size - Middlings / Rejects","mq");
s=sec("rcs","Raw Coal Stock (MT)","Opening stock is carried from the closing stock of the previous day. Type a value only to correct it.");
add(s,"orc","Opening Stock - BCCL Coal",{t:"ovr",agg:"last"});add(s,"rr","Receiving - BCCL Coal");add(s,"rf","Receiving - FERRO");add(s,"i1","Interunit Transfer - Coke Oven");add(s,"i2","Interunit Transfer - Coke Oven Chimney");add(s,"i3","Interunit Transfer - FERRO");add(s,"i4","Interunit Transfer - MANGALPUR (FERRO)");
add(s,"itT","Total Interunit Transfer",{t:"calc"});add(s,"rcn","Consumption at Coal Washery",{t:"calc"});add(s,"crc","Closing Stock - BCCL Coal",{t:"calc",agg:"last"});
s=sec("fcs","Fresh (Clean) Coal Stock (MT)","Opening stock is carried from the closing stock of the previous day. Type a value only to correct it.");
add(s,"ofc","Opening Stock",{t:"ovr",agg:"last"});add(s,"fp","Production",{t:"calc"});add(s,"fdi","Despatch - Internal (Coke Oven)");add(s,"fdo","Despatch - Outside");add(s,"cfc","Closing Stock",{t:"calc",agg:"last"});
s=sec("mrs","Rejects / Middlings Stock (MT)","Opening stock is carried from the closing stock of the previous day. Type a value only to correct it.");
add(s,"omr","Opening Stock",{t:"ovr",agg:"last"});add(s,"mp","Production",{t:"calc"});add(s,"mdi","Despatch - Internal");add(s,"mdc","Despatch - OLD CPP");add(s,"cmr","Closing Stock",{t:"calc",agg:"last"});
// dailyCapacity = raw coal MT per day (0 = not set); processLossPct = process loss as % of raw coal charged (Excel: 0.5%); magnetiteFactor = KG magnetite per MT of raw coal (Excel: 1.19)
const DEF={dailyCapacity:0,standardMinutes:1440,processLossPct:0.5,magnetiteFactor:1.19};
const num=x=>x===""||x==null||x===false?null:(Number.isFinite(+x)?+x:null);
const addDay=(d,n)=>new Date(Date.parse(d)+n*864e5).toISOString().slice(0,10);
const sum=a=>a.reduce((s,x)=>s+(x||0),0),div=(a,b)=>b?a/b:null;
const DELAY=["dtU","dtC","dtE","dtM","dtP","dtO","dtS"];
// raw: values typed for that date ({} when nothing was typed); p: calculation of the previous date (or null)
function calcDay(date,raw,p,cfg){const n=k=>num(raw[k])||0,c={},first=!p||date.slice(0,7)!==(p.date||"").slice(0,7);
 c.rT=n("rb")+n("ro");c.cap=cfg.dailyCapacity>0&&c.rT>0?c.rT/cfg.dailyCapacity*100:null;
 c.pl=c.rT*cfg.processLossPct/100;c.bl=c.rT-n("cc")-n("mr")-c.pl;c.cum=(first?0:p.cum)+n("cc");
 c.ccm=n("cc")*(1-n("cq0")/100)*(1+n("rq0")/100);c.yl=n("cc")>0&&c.rT>0?c.ccm/c.rT*100:null;c.ymr=n("cc")>0&&c.rT>0?n("mr")/c.rT*100:null;
 c.mg=num(raw.mg)??c.rT*cfg.magnetiteFactor;
 c.pwp=n("cc")>0?n("pw")/n("cc"):null;c.wtp=n("cc")>0?n("wt")/n("cc"):null;
 c.dtT=sum(DELAY.map(k=>n(k)));c.dsd=num(raw.dsd)??cfg.standardMinutes;c.dar=c.dsd-c.dtT-n("dtN");c.rn=c.dsd?c.dar/c.dsd*100:null;
 c.fr=num(raw.fr)??(c.dar>0&&c.rT>0?c.rT/(c.dar/60):null);
 c.orc=num(raw.orc)??(p?p.crc:0);c.itT=n("i1")+n("i2")+n("i3")+n("i4");c.rcn=n("rb");c.crc=c.orc+n("rr")+n("rf")-c.rcn-c.itT;
 c.ofc=num(raw.ofc)??(p?p.cfc:0);c.fp=n("cc");c.cfc=c.ofc+c.fp-n("fdi")-n("fdo");
 c.omr=num(raw.omr)??(p?p.cmr:0);c.mp=n("mr");c.cmr=c.omr+c.mp-n("mdi")-n("mdc");
 c.date=date;return c}
// recs: {date: raw values}; returns array of {date,raw,c,has} for every date from the first record to "to" (YYYY-MM-DD)
function build(recs,to,cfg){cfg={...DEF,...(cfg||{})};const dates=Object.keys(recs).sort();if(!dates.length)return[];const out=[];let p=null;
 for(let d=dates[0];d<=to;d=addDay(d,1)){const raw=recs[d]||{},c=calcDay(d,raw,p,cfg);out.push({date:d,raw,c,has:!!recs[d]});p=c}return out}
// value of a field for a built day: the calculated value, else what was typed (numbers) or text
const val=(row,k)=>{const f=BY[k];if(!f)return null;if(f.t==="text")return row.raw[k]||"";if(f.t==="calc"||f.t==="ovr")return row.c[k]!=null?row.c[k]:null;return row.has?num(row.raw[k]):null};
// month row: sums, averages or last value; ratios are made from the totals of the days that have production
function totals(rows,cfg){cfg={...DEF,...(cfg||{})};const r=rows.filter(x=>x.has),T={};if(!r.length)return T;
 F.forEach(f=>{if(f.t==="text"||f.agg==="none")return;const v=r.map(x=>val(x,f.k)).filter(x=>x!=null&&Number.isFinite(x));if(!v.length)return;
  T[f.k]=f.agg==="sum"?sum(v):f.agg==="avg"?sum(v)/v.length:v[v.length-1]});
 const pr=r.filter(x=>x.c.rT>0&&num(x.raw.cc)>0),sm=(a,fn)=>a.reduce((s,x)=>s+fn(x),0),rw=(x,k)=>num(x.raw[k])||0;
 T.pdays=r.filter(x=>x.c.rT>0).length;T.days=r.length;T.ylA=(()=>{const v=pr.map(x=>x.c.yl).filter(x=>x>0);return v.length?sum(v)/v.length:null})();   // simple average of the daily yields, as in the Excel total row
 T.yl=pr.length?sm(pr,x=>x.c.ccm)/sm(pr,x=>x.c.rT)*100:null;T.ymr=pr.length?sm(pr,x=>rw(x,"mr"))/sm(pr,x=>x.c.rT)*100:null;
 T.pwp=pr.length?sm(pr,x=>rw(x,"pw"))/sm(pr,x=>rw(x,"cc")):null;T.wtp=pr.length?sm(pr,x=>rw(x,"wt"))/sm(pr,x=>rw(x,"cc")):null;
 T.cap=cfg.dailyCapacity>0&&T.pdays?(T.rT||0)/(cfg.dailyCapacity*T.pdays)*100:null;
 T.fr=(()=>{const v=r.map(x=>x.c.fr).filter(x=>x!=null&&Number.isFinite(x));return v.length?sum(v)/v.length:null})();
 return T}
g.CWDPR={SEC,F,BY,DEF,QN,build,calcDay,val,totals,num,addDay};
if(typeof module!=="undefined")module.exports=g.CWDPR})(typeof window!=="undefined"?window:globalThis);
