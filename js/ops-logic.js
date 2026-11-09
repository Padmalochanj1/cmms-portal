// Coke Oven Operation: calculation engine. Pure functions, no screen code. Blank (null) is never treated as zero.
(function (g) {
const num = v => v === "" || v == null || (typeof v === "string" && !v.trim()) ? null : isFinite(+v) ? +v : null;
const vals = a => a.filter(v => v != null), sum = a => { const x = vals(a); return x.length ? x.reduce((p, c) => p + c, 0) : null; };
const mx = a => { const x = vals(a); return x.length ? Math.max(...x) : null; }, mn = a => { const x = vals(a); return x.length ? Math.min(...x) : null; }, av = a => { const x = vals(a); return x.length ? sum(x) / x.length : null; };
const div = (a, b) => a == null || b == null || b === 0 ? null : a / b, pct = (a, b) => { const d = div(a, b); return d == null ? null : d * 100; };
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const CATS = ["Crusher breakdown", "Conveyor breakdown", "Coal charging delay", "Carbonisation / pushing delay", "Quenching interruption", "ID / FD fan issues", "Other operational restrictions"];
const PROC = { [CATS[0]]: "Coal crushing", [CATS[1]]: "Coal conveying", [CATS[2]]: "Coal charging", [CATS[3]]: "Carbonisation / pushing", [CATS[4]]: "Quenching", [CATS[5]]: "Carbonisation / pushing", [CATS[6]]: "Other" };
const BASIS = { pushed: "Pushed coke", quenched: "Quenched coke", screened: "Screened coke", saleable: "Saleable coke" };
const defaultConfig = () => ({
  targets: { coalReceive: null, coalCharge: null, coke: null, yield: null, dispatch: null },   // per day; set by the administrator
  thresholds: { achieveWarn: null, achieveCrit: null, availWarn: null, availCrit: null, coverWarnDays: null },
  yieldBasis: "saleable",
  depts: ["Coal handling", "Coal crushing", "Coke oven / battery", "ID and FD fans", "Quenching", "Coke handling", "Lighting and others"],
  sizes: ["+80 mm", "40-80 mm", "25-40 mm", "10-25 mm", "-10 mm"],
  equipment: [["Crusher 1", 0, "Coal crushing"], ["Crusher 2", 0, "Coal crushing"], ["Crusher 3", 0, "Coal crushing"], ["Conveyors", 1, "Coal handling"], ["Coal handling system", 6, "Coal handling"],
    ["ID fans", 5, "ID and FD fans"], ["FD fans", 5, "ID and FD fans"], ["Quenching pumps", 4, "Quenching"], ["Coke handling system", 6, "Coke handling"]].map(([name, c, dept]) => ({ name, category: CATS[c], dept })),
  tempLocations: [{ name: "Battery temperature", type: "Battery", ref: null, low: null, high: null }, { name: "Flue-gas temperature", type: "Flue gas", ref: null, low: null, high: null }],
  design: { voltage: "6.6 kV and 415 V", transformers: "2 x 2 MVA (Coke Oven LT)", crushers: "3 x 600 kW at 6.6 kV", hours: "24 hours/day" }
});
const elecTotal = r => { const e = r.elec || {}, t = num(e.total); if (t != null) return t; const o = num(e.open), c = num(e.close); return o != null && c != null ? c - o : null; };
function aggregate(R, cfg, basis, nDays) {
  R = [...R].sort((a, b) => (a.date + a.shift).localeCompare(b.date + b.shift)); basis = basis || cfg.yieldBasis || "saleable";
  const f = R[0], l = R[R.length - 1], C = r => r.coal || {}, K = r => r.coke || {}, I = r => r.inv || {}, E = r => r.elec || {}, T = cfg.targets || {}, a = { n: R.length, dates: [...new Set(R.map(r => r.date))] };
  a.coalOpen = f ? num(C(f).opening) : null; a.coalRecv = sum(R.map(r => num(C(r).received))); a.coalCrush = sum(R.map(r => num(C(r).crushed))); a.coalCons = sum(R.map(r => num(C(r).consumed)));
  a.coalClose = l ? num(C(l).closing) : null; a.interrupt = sum(R.map(r => num(C(r).interruptions)));
  a.coalCloseCalc = a.coalOpen != null && a.coalRecv != null && a.coalCons != null ? a.coalOpen + a.coalRecv - a.coalCons : null;
  ["ovensCharged", "ovensPushed", "pushed", "quenched", "screened", "saleable", "delayedPushing", "pushDelayLoss"].forEach(k => a[k] = sum(R.map(r => num(K(r)[k]))));
  a.carb = av(R.map(r => num(K(r).avgCarbTime))); a.battAvail = av(R.map(r => num(K(r).batteryAvail)));
  a.prod = a[basis]; const te = sum(R.map(r => num(K(r).target)));
  a.tCoke = te != null ? te : T.coke != null ? T.coke * nDays : null; a.tCoal = T.coalCharge != null ? T.coalCharge * nDays : null; a.tRecv = T.coalReceive != null ? T.coalReceive * nDays : null; a.tDisp = T.dispatch != null ? T.dispatch * nDays : null; a.tYield = T.yield ?? null;
  a.yield = pct(a.prod, a.coalCons); a.ach = pct(a.prod, a.tCoke);
  a.kwh = sum(R.map(elecTotal)); a.maxD = mx(R.map(r => num(E(r).maxDemand))); a.avgD = av(R.map(r => num(E(r).avgDemand))); a.pf = av(R.map(r => num(E(r).pf))); a.trL = mx(R.map(r => num(E(r).trLoading))); a.spec = div(a.kwh, a.prod);
  a.dept = {}; R.forEach(r => (E(r).dept || []).forEach(d => { const v = num(d.kwh); if (v != null && d.name) a.dept[d.name] = (a.dept[d.name] || 0) + v; }));
  a.equip = {}; const ec = n => (cfg.equipment || []).find(e => e.name === n) || {}; const rows = [];
  R.forEach(r => (r.equip || []).forEach(q => { if (!q.name) return; const o = a.equip[q.name] = a.equip[q.name] || { run: null, bd: null, count: null, loss: null };
    const ru = num(q.run), bd = num(q.bd), ct = num(q.count), ls = num(q.lossMT);
    o.run = sum([o.run, ru]); o.bd = sum([o.bd, bd]); o.count = sum([o.count, ct]); o.loss = sum([o.loss, ls]);
    if ((bd || 0) > 0 || (ls || 0) > 0) rows.push({ date: r.date, shift: r.shift, name: q.name, cat: ec(q.name).category || CATS[6], dept: ec(q.name).dept || "", bd, loss: ls, reason: q.reason || "", action: q.action || "", status: q.status || "", at: r.updatedAt }); }));
  Object.values(a.equip).forEach(o => o.avail = o.run != null && o.bd != null ? pct(o.run, o.run + o.bd) : null);
  const lc = {}; CATS.forEach(c => lc[c] = { cat: c, bd: null, loss: null, dept: new Set() });
  rows.forEach(x => { const o = lc[x.cat] || lc[CATS[6]]; o.bd = sum([o.bd, x.bd]); o.loss = sum([o.loss, x.loss]); if (x.dept) o.dept.add(x.dept); });
  if (a.pushDelayLoss != null) lc[CATS[3]].loss = sum([lc[CATS[3]].loss, a.pushDelayLoss]);
  a.lossCats = Object.values(lc).map(o => ({ ...o, dept: [...o.dept].join(", "), process: PROC[o.cat] })).filter(o => o.loss != null || o.bd != null).sort((x, y) => (y.loss || 0) - (x.loss || 0)); a.lossRows = rows;
  a.cokeOpen = f ? num(I(f).cokeOpening) : null; a.disp = sum(R.map(r => num(I(r).cokeDispatch))); a.adj = sum(R.map(r => num(I(r).adjust))); a.cokeClose = l ? num(I(l).cokeClosing) : null;
  a.cokeCloseCalc = a.cokeOpen != null && a.saleable != null && a.disp != null ? a.cokeOpen + a.saleable - a.disp + (a.adj || 0) : null;
  a.sizes = {}; R.forEach(r => (I(r).sizes || []).forEach(s => { const v = num(s.qty); if (v != null && s.size) a.sizes[s.size] = (a.sizes[s.size] || 0) + v; }));
  const cc = a.coalClose != null ? a.coalClose : a.coalCloseCalc; a.coverage = div(cc, div(a.coalCons, a.dates.length));
  a.temps = []; R.forEach(r => (r.temps || []).forEach(t => { const v = num(t.value); if (v == null) return; const L = (cfg.tempLocations || []).find(x => x.name === t.location) || {}; const lo = num(L.low), hi = num(L.high);
    a.temps.push({ date: r.date, shift: r.shift, time: t.time || "", loc: t.location || "", type: t.type || "", v, ref: num(t.ref) ?? num(L.ref), dev: hi != null && v > hi ? "High" : lo != null && v < lo ? "Low" : "" }); }));
  return a;
}
const select = (recs, o) => recs.filter(r => r.status === "submitted" && (!o.from || r.date >= o.from) && (!o.to || r.date <= o.to) && (!o.shift || o.shift === "All" || r.shift === o.shift));
const entryStatus = (recs, date) => ["A", "B", "C"].map(s => { const r = recs.find(x => x.date === date && x.shift === s); return { shift: s, status: r ? r.status : "missing" }; });
const NUMS = { coal: ["opening", "received", "crushed", "consumed", "closing", "interruptions"], coke: ["ovensCharged", "ovensPushed", "pushed", "quenched", "screened", "saleable", "target", "delayedPushing", "pushDelayLoss", "avgCarbTime", "batteryAvail"], elec: ["open", "close", "total", "maxDemand", "avgDemand", "pf", "trLoading"], inv: ["cokeOpening", "cokeProd", "cokeDispatch", "cokeClosing"] };
const REQ = [["coal", "opening", "Opening coal stock"], ["coal", "received", "Coal received"], ["coal", "consumed", "Coal consumed / charged"], ["coal", "closing", "Closing coal stock"], ["coke", "ovensCharged", "Ovens charged"], ["coke", "ovensPushed", "Ovens pushed"], ["coke", "pushed", "Pushed coke"], ["inv", "cokeOpening", "Opening coke stock"], ["inv", "cokeDispatch", "Coke dispatch"]];
function validate(r) {
  const errors = [], warnings = [], missing = [], g = (s, k) => num((r[s] || {})[k]);
  if (!r.date) errors.push("Choose the date."); if (!["A", "B", "C"].includes(r.shift)) errors.push("Choose the shift.");
  if (!String(r.enteredBy || "").trim()) missing.push("Entered by"); if (!String(r.department || "").trim()) missing.push("Department");
  REQ.forEach(([s, k, n]) => { if (g(s, k) == null) missing.push(n); });
  Object.entries(NUMS).forEach(([s, ks]) => ks.forEach(k => { const raw = (r[s] || {})[k]; if (raw != null && raw !== "" && num(raw) == null) errors.push(k + " must be a number."); else if (num(raw) != null && num(raw) < 0) errors.push(k + " cannot be negative."); }));
  ["ovensCharged", "ovensPushed", "delayedPushing"].forEach(k => { const v = g("coke", k); if (v != null && !Number.isInteger(v)) errors.push(k + " must be a whole number."); });
  const pf = g("elec", "pf"); if (pf != null && pf > 1) errors.push("Power factor must be between 0 and 1, for example 0.95.");
  const eo = g("elec", "open"), ec = g("elec", "close"); if (eo != null && ec != null && ec < eo) errors.push("Energy meter closing is lower than opening.");
  const cc = g("coal", "opening") != null && g("coal", "received") != null && g("coal", "consumed") != null ? g("coal", "opening") + g("coal", "received") - g("coal", "consumed") : null;
  if (cc != null && g("coal", "closing") != null && Math.abs(cc - g("coal", "closing")) > 0.5) warnings.push(`Closing coal stock entered (${g("coal", "closing")}) differs from opening + received - consumed (${cc.toFixed(1)}).`);
  const kc = g("inv", "cokeOpening") != null && g("coke", "saleable") != null && g("inv", "cokeDispatch") != null ? g("inv", "cokeOpening") + g("coke", "saleable") - g("inv", "cokeDispatch") + (g("inv", "adjust") || 0) : null;
  if (kc != null && g("inv", "cokeClosing") != null && Math.abs(kc - g("inv", "cokeClosing")) > 0.5) warnings.push(`Closing coke stock entered (${g("inv", "cokeClosing")}) differs from opening + saleable - dispatch + adjustment (${kc.toFixed(1)}).`);
  return { errors, warnings, missing };
}
g.OPS = { num, sum, av, mx, mn, div, pct, addDays, CATS, PROC, BASIS, defaultConfig, aggregate, select, entryStatus, validate, elecTotal, NUMS };
if (typeof module !== "undefined") module.exports = g.OPS;
})(typeof window !== "undefined" ? window : globalThis);
