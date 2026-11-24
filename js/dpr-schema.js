// Coke Oven DPR: field list (same order and headings as the Excel sheet "DPR") and all calculations.
// Used by the browser and by the tests. Nothing here talks to the server.
(function(g){
const G9=["(30-90)","(30-100)","(30-70)","(40-90)","(70-100)","(20-80)","(25-90)","(25-70)","90+"];                        // Opening stock, production
const G9C=["(30-90)","(30-100)","(30-70)","(40-90)","(70-100)","(20-80)","(25-80)","(25-70)","90+"];                       // Closing stock, outside sales
const RMHS=["(30-90)","(30-100)","(30-70)","(40-90)","(70-100)","(20-80)","(25-90)","Ramsarup","RMHS","(25-70)","90+"];
const SINT=["(0-15)","RMHS","RAMSARUP","(30-100)","(30-70)","(40-90)","(70-100)","(20-80)","(25-80)","(25-70)","90+"];
const BYP=["Nut Coke (12-25)","Nut Coke (10-30)","Nut Coke (15-25)","Nut Coke (10-40)","BREEZE (0-15)","Coke Fines (MT)"];
const BYS=["Nut Coke (12-25)","Nut Coke (10-30)","Nut Coke (15-25)","RAMSARUP","NUTCOKE RMHS","Consumption to SINTER (0-10)","Nut Coke (15-25) ","BREEZE (0-10)","Coke Fines (MT)","RAMSARUP "];
const BYC=["Nut Coke (12-25)","Nut Coke (10-30)","Nut Coke (10-25)","Nut Coke (10-40)","BREEZE (0-10)","Coke Fines (MT)"];
const COAL=["1. PHCC","2. SHCC","3. SSCC","4. PCI","5. Indigenous"];
const COALN=["Prime Hard Coking Coal","Semi Hard Coking Coal","Semi Soft Coking Coal","PCI Coal & Pet Coke","Indigenous Coking Coal"];
const CQ=["SULPHUR (%)","PHOSPHORUS (%)","Crushing Index (-3 mm)","MOISTURE BEFORE CRUSHER (%)","CHARGING MOISTURE (%)","Bulk Density (T/m3)","CSN","IM (%)","ASH (%)","VM (%)","FC (%)"];
const KQ=["VM (%)","MOISTURE (%)","ASH (%)","CRI (Coke Reactivity Index)","M40 (%)","POROSITY (%)","M10 (%)","CSR (Coke strength after reaction)","Sulphur (%)","Phosphorous (%)","MPS (%)","FC (%)"];
// type: in = typed, ovr = typed to override the carried value, calc = formula, text = typed text. agg: how the month row is made (sum, avg, last, none)
const SEC=[];const F=[];const BY={};
const sec=(id,title,note)=>{const s={id,title,note,f:[]};SEC.push(s);return s};
const add=(s,k,l,o={})=>{const f={k,l,sec:s.id,t:"in",agg:"sum",d:2,...o};s.f.push(f);F.push(f);BY[k]=f;return f};
let s=sec("ofg","Opening Stock of Finished Goods (MT)","Carried from the closing stock of the previous day. Type a value only to correct it.");
G9.forEach((x,i)=>add(s,"op"+i,x,{t:"ovr",agg:"last"}));add(s,"opT","TOTAL Stock (MT)",{t:"calc",agg:"last"});
s=sec("oby","Opening Stock By Product (MT)","Carried from the closing by-product stock of the previous day. Type a value only to correct it.");
BYP.forEach((x,i)=>add(s,"ob"+i,x,{t:"ovr",agg:"last"}));add(s,"obT","Total By Product Stock (MT)",{t:"calc",agg:"last"});add(s,"oT","Total Stock (MT)",{t:"calc",agg:"last"});
s=sec("prd","Production @ 5% Moist (MT)");G9.forEach((x,i)=>add(s,"pr"+i,x));add(s,"prT","TOTAL PROD (MT)",{t:"calc"});
s=sec("bpd","By Product Nut Coke @ 7% & Coke Breeze/Fines @ 10% Moist (MT)");BYP.forEach((x,i)=>add(s,"bp"+i,x));add(s,"bpT","Total By Product (MT)",{t:"calc"});
add(s,"tp","Total Production (MT)",{t:"calc"});add(s,"cum","MTD Production (MT)",{t:"calc",agg:"last"});add(s,"cap","Capacity Utilization (%)",{t:"calc",agg:"avg"});
add(s,"gpo","On Date Gross Coke Prodn/Oven (MT)",{t:"calc",agg:"avg"});add(s,"gpm","MTD Gross Coke Prodn/Oven (MT)",{t:"calc",agg:"last"});
s=sec("drm","Dispatch to RMHS (MT)");RMHS.forEach((x,i)=>add(s,"dr"+i,x));add(s,"drT","Total (MT)",{t:"calc"});
s=sec("dsn","Dispatch to Sinter Plant (MT)");SINT.forEach((x,i)=>add(s,"ds"+i,x));add(s,"dsT","Total (MT)",{t:"calc"});
s=sec("osl","Outside Sales (MT)");G9C.forEach((x,i)=>add(s,"os"+i,x));add(s,"osT","Total (MT)",{t:"calc"});
s=sec("bps","By Product Sales (MT)");BYS.forEach((x,i)=>add(s,"bs"+i,x));
s=sec("tdp","Total Dispatch (MT)");add(s,"tdR","RMHS",{t:"calc"});add(s,"tdS","Sinter",{t:"calc"});add(s,"tdB","By Product Sales",{t:"calc"});add(s,"tdT","Total (MT)",{t:"calc"});
s=sec("cfg","Closing Stock of Finished Goods (MT)");G9C.forEach((x,i)=>add(s,"cl"+i,x,{t:"calc",agg:"last"}));add(s,"clT","Total Stock (MT)",{t:"calc",agg:"last"});
s=sec("cby","Closing Stock By Product (MT)");BYC.forEach((x,i)=>add(s,"cb"+i,x,{t:"calc",agg:"last"}));
s=sec("con","Cokeoven / Self Consumption of Raw Material (MT)","Coal consumed, entered by coal type.");COAL.forEach((x,i)=>add(s,"cc"+i,x,{n:COALN[i]}));add(s,"ccT","TOTAL Cons. (MT)",{t:"calc"});
s=sec("dry","Dry Coal Consumption (MT)");add(s,"dc","Dry Coal Consmp. (MT)");
s=sec("pwr","Power Consumption (KWhr/day)");add(s,"pw1","Coke Oven");add(s,"pws","Specific Power Consump per ton of Production",{t:"calc",agg:"avg"});add(s,"pw2","WHRB");add(s,"pwT","Total",{t:"calc"});add(s,"pwp","Power Consmp. Per ton Coke",{t:"calc",agg:"avg"});
s=sec("wat","Make-up Water Consumption (N-m3)");add(s,"wt","MAKE-UP Water Consumption (N-m3)");
s=sec("stm","Steam");add(s,"sg","Steam Generation (MT)");add(s,"sgt","Steam Generation IN TPH",{t:"calc",agg:"avg"});add(s,"scu","Capacity Utilization (%)",{t:"calc",agg:"avg"});
s=sec("dlp","Delay Report of Coke Oven Plant");add(s,"dpS","Standard Running /Day (1440 min)",{agg:"sum",d:0});add(s,"dpP","PPM (min)",{d:0});add(s,"dpA","Actual Running /Day",{t:"calc",d:0});add(s,"dpT","Total Delay (Min)",{t:"calc",d:0});
add(s,"dpE","Electrical (Min)",{d:0});add(s,"dpM","Mechanical (Min)",{d:0});add(s,"dpO","Operational (Min)",{d:0});add(s,"dpF","Power Failure (Min)",{d:0});add(s,"dpX","Others (Min)",{d:0});add(s,"dpR","Reason for Delay",{t:"text",agg:"none"});
s=sec("dlb","Delay Report of Coke Oven Boiler");add(s,"dbS","Standard Running /Day (1440 min)",{d:0});add(s,"dbA","Actual Running /Day",{t:"calc",d:0});add(s,"dbT","Total Delay (Min)",{t:"calc",d:0});
add(s,"dbE","Electrical (Min)",{d:0});add(s,"dbM","Mechanical (Min)",{d:0});add(s,"dbO","Operational (Min)",{d:0});add(s,"dbF","Power Failure (Min)",{d:0});add(s,"dbX","Others (Min)",{d:0});add(s,"dbR","Reason for Delay",{t:"text",agg:"none"});
s=sec("cql","Charging Coal Quality");CQ.forEach((x,i)=>add(s,"cq"+i,x,{agg:"avg"}));
s=sec("kql","Coke Quality (Finished Goods: BF Grade)");KQ.forEach((x,i)=>add(s,"kq"+i,x,{agg:"avg"}));
s=sec("saf","Safety");add(s,"sf0","NEAR MISS",{d:0});add(s,"sf1","REPORTABLE",{d:0});add(s,"sf2","MINOR & NON REPORTABLE",{d:0});
s=sec("prc","Process");add(s,"pcr","COAL TO COKE RATIO",{t:"calc",agg:"avg",d:3});add(s,"pbl","BURNING LOSS",{agg:"avg"});add(s,"pdy","DRY COKE YIELD",{agg:"avg"});add(s,"ppd","AVERAGE PER OVEN CHARGING-DRY",{agg:"avg"});add(s,"ppw","AVERAGE PER OVEN CHARGING-WET",{agg:"avg"});add(s,"ptp","AVERAGE PROCESS TEMP.",{agg:"avg"});add(s,"pck","AVERAGE COOKING HOURS",{agg:"avg"});add(s,"pnp","No. of PUSHING",{d:0});add(s,"pmp","MTD Pushings",{t:"calc",agg:"last",d:0});add(s,"pnc","No Of Charging",{t:"calc",d:0});
s=sec("bcp","Coke Production (J1 Belt Conveyor)","Initial reading is the final reading of the previous day. Type a value only to correct it.");add(s,"j1i","J1 - Belt Conveyor Reading (Initial)",{t:"ovr",agg:"none"});add(s,"j1f","J1 - Belt Conveyor Reading (Final)",{agg:"last"});add(s,"j1d","Total Difference (MT)",{t:"calc"});add(s,"j1c","Prodn as per Calculation");add(s,"j1p","Change %",{t:"calc",agg:"avg"});add(s,"j1r","Remarks",{t:"text",agg:"none"});
s=sec("bcc","Coal Consumption (M8 and J8 Belt Conveyors)","Initial readings are the final readings of the previous day. Type a value only to correct them.");add(s,"m8i","M8 - Belt Conveyor Reading (Initial)",{t:"ovr",agg:"none"});add(s,"m8f","M8 - Belt Conveyor Reading (Final)",{agg:"last"});add(s,"m8d","Total Difference (MT)",{t:"calc"});add(s,"m8c","Consmp. as per Calculation");add(s,"m8p","Change",{t:"calc",agg:"avg"});
add(s,"j8i","J8 - Belt Conveyor Reading (Initial)",{t:"ovr",agg:"none"});add(s,"j8f","J8 - Belt Conveyor Reading (Final)",{agg:"last"});add(s,"j8d","Total Difference (MT)",{t:"calc"});add(s,"j8r","Remarks",{t:"text",agg:"none"});
const DEF={annualCapacity:250000,steamCapacity:82,standardMinutes:1440,beltResetMonthly:true};
const num=x=>x===""||x==null||x===false?null:(Number.isFinite(+x)?+x:null);
const addDay=(d,n)=>new Date(Date.parse(d)+n*864e5).toISOString().slice(0,10);
const sum=(a)=>a.reduce((s,x)=>s+(x||0),0),div=(a,b)=>b?a/b:null;
// day: raw values typed for that date ({} when nothing was typed); p: calculation of the previous date (or null)
function calcDay(date,raw,p,cfg){const n=k=>num(raw[k])||0,c={},first=!p||date.slice(0,7)!==(p.date||"").slice(0,7);
 for(let i=0;i<9;i++)c["op"+i]=num(raw["op"+i])??(p?p["cl"+i]:0);
 for(let i=0;i<6;i++)c["ob"+i]=num(raw["ob"+i])??(p?p["cb"+i]:0);
 c.opT=sum(G9.map((_,i)=>c["op"+i]));c.obT=sum(BYP.map((_,i)=>c["ob"+i]));c.oT=c.opT+c.obT;
 c.prT=sum(G9.map((_,i)=>n("pr"+i)));c.bpT=sum(BYP.map((_,i)=>n("bp"+i)));c.tp=c.prT+c.bpT;
 c.cum=(first?0:p.cum)+c.tp;c.cap=div(c.tp,cfg.annualCapacity/365)*100;
 c.pnp=n("pnp");c.pnc=c.pnp;c.pmp=(first?0:p.pmp)+c.pnp;
 c.gpo=div(c.tp,c.pnc);c.gpm=div(c.cum,c.pmp);
 c.drT=sum(RMHS.map((_,i)=>n("dr"+i)));c.dsT=sum(SINT.map((_,i)=>n("ds"+i)));c.osT=sum(G9C.map((_,i)=>n("os"+i)));
 c.tdR=n("dr6")+n("dr7")+n("dr8");c.tdS=c.dsT+n("bs8");c.tdB=n("bs2")+n("bs4")+n("bs5");c.tdT=c.osT+c.tdR+c.tdS+c.tdB;
 const rm=[n("dr0"),n("dr1"),n("dr2"),n("dr3"),n("dr4"),n("dr5"),n("dr6")+n("dr7")+n("dr8"),n("dr9"),n("dr10")],sn=[0,n("ds3"),n("ds4"),n("ds5"),n("ds6"),n("ds7"),n("ds8"),n("ds9"),n("ds10")];
 for(let i=0;i<9;i++)c["cl"+i]=c["op"+i]+n("pr"+i)-(rm[i]+sn[i]+n("os"+i));c.clT=sum(G9.map((_,i)=>c["cl"+i]));
 c.cb0=c.ob0+n("bp0")-n("bs0");c.cb1=c.ob1+n("bp1")-n("bs1");c.cb2=c.ob2+n("bp2")-n("bs2")-n("bs3")-n("bs4")-n("bs5");c.cb3=c.ob3+n("bp3")-n("bs6");
 c.cb4=c.ob4+n("bp4")-n("bs7")-n("ds0")-n("ds1")-n("ds2");c.cb5=c.ob5+n("bp5")-n("bs8")-n("bs9");
 c.ccT=sum(COAL.map((_,i)=>n("cc"+i)));
 c.pws=div(n("pw1"),c.tp);c.pwT=n("pw1")+n("pw2");c.pwp=div(c.pwT,c.tp);c.sgt=n("sg")/24;c.scu=c.sgt/cfg.steamCapacity*100;
 c.dpS=num(raw.dpS)??cfg.standardMinutes;c.dpT=n("dpE")+n("dpM")+n("dpO")+n("dpF")+n("dpX");c.dpA=c.dpS-c.dpT-n("dpP");
 c.dbS=num(raw.dbS)??cfg.standardMinutes;c.dbT=n("dbE")+n("dbM")+n("dbO")+n("dbF")+n("dbX");c.dbA=c.dbS-c.dbT;
 c.pcr=div(c.ccT,c.tp);
 const belt=(a,fin)=>num(raw[a])??(p?(first&&cfg.beltResetMonthly?0:(p[fin]!=null?p[fin]:p[a])):0);
 c.j1i=belt("j1i","j1fx");c.m8i=belt("m8i","m8fx");c.j8i=belt("j8i","j8fx");
 c.j1fx=num(raw.j1f)??c.j1i;c.m8fx=num(raw.m8f)??c.m8i;c.j8fx=num(raw.j8f)??c.j8i;   // final reading carried to the next day
 c.j1d=num(raw.j1f)!=null?n("j1f")-c.j1i:0;c.m8d=num(raw.m8f)!=null?n("m8f")-c.m8i:0;c.j8d=num(raw.j8f)!=null?n("j8f")-c.j8i:0;
 c.j1p=n("j1c")?(c.j1d-n("j1c"))/n("j1c")*100:null;c.m8p=n("m8c")?(c.m8d-n("m8c"))/n("m8c")*100:null;
 c.date=date;return c}
// recs: {date: raw values}; returns array of {date,raw,c,has} for every date from the first record to "to" (YYYY-MM-DD)
function build(recs,to,cfg){cfg={...DEF,...(cfg||{})};const dates=Object.keys(recs).sort();if(!dates.length)return[];const out=[];let p=null;
 for(let d=dates[0];d<=to;d=addDay(d,1)){const raw=recs[d]||{},c=calcDay(d,raw,p,cfg);out.push({date:d,raw,c,has:!!recs[d]});p=c}return out}
// value of a field for a built day: the calculated value, else what was typed (numbers) or text
const val=(row,k)=>{const f=BY[k];if(!f)return null;if(f.t==="text")return row.raw[k]||"";if(f.t==="calc"||f.t==="ovr")return row.c[k]!=null?row.c[k]:null;return row.has?num(row.raw[k]):null};
// month row: sums, averages or last value, as in the Excel total row; ratios are made from the totals
function totals(rows,cfg){cfg={...DEF,...(cfg||{})};const r=rows.filter(x=>x.has),T={};if(!r.length)return T;
 F.forEach(f=>{if(f.t==="text"||f.agg==="none")return;const v=r.map(x=>val(x,f.k)).filter(x=>x!=null&&Number.isFinite(x));if(!v.length)return;
  T[f.k]=f.agg==="sum"?sum(v):f.agg==="avg"?sum(v)/v.length:v[v.length-1]});
 const S=k=>T[k]||0;T.cap=div(S("tp"),cfg.annualCapacity/365*r.length)*100;T.gpo=div(S("tp"),S("pnc"));T.pws=div(S("pw1"),S("tp"));T.pwp=div(S("pwT"),S("tp"));T.pcr=div(S("ccT"),S("tp"));
 T.j1p=S("j1c")?(S("j1d")-S("j1c"))/S("j1c")*100:null;T.m8p=S("m8c")?(S("m8d")-S("m8c"))/S("m8c")*100:null;T.sgt=S("sg")/24/r.length;T.scu=T.sgt/cfg.steamCapacity*100;
 T.days=r.length;return T}
g.DPR={SEC,F,BY,DEF,COAL,COALN,G9,G9C,RMHS,SINT,BYP,BYS,BYC,CQ,KQ,build,calcDay,val,totals,num,addDay};
if(typeof module!=="undefined")module.exports=g.DPR})(typeof window!=="undefined"?window:globalThis);
