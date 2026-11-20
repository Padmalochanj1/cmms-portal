// Version 3.2, 19.11.2026
// New plant RMHS, section E&I (folder rmhs-ei/, users secret USERS_RMHS_EI)
// Version 3.1, 19.11.2026
// Notification type Interruption; additional orders carry a type (PM, CM, IM, OM) that is also the start of the order number
// MTTR / MTBF: reliability_range returns Breakdown notifications and corrective orders (Attention actions, Additional orders) with their repair times
// E&I user profiles (name, employee code, department, function) in profiles.json, edited by the administrator
// Deferred orders are rescheduled to a new date; additional orders; Attention creates a corrective order (all stored in extras/YYYY-MM.json)
// Management users can read the Admin history; new Compliance range action (admin and management)
// Start and End time given in order closing
// Variables (Worker > Settings > Variables and Secrets): GH_TOKEN (secret), GH_REPO, SECRET (secret, long random text),
// USERS (secret, JSON like {"admin":["Admin-ChangeMe","admin"],"user01":["ChangeMe-01","user"]}), ALLOWED_ORIGIN (optional, e.g. https://yourname.github.io)
const enc = new TextEncoder(), dec = new TextDecoder();
const bin = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return s; };
const b64u = u8 => btoa(bin(u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function sign(env, data) {
  const k = await crypto.subtle.importKey('raw', enc.encode(env.SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data))));
}
async function who(env, t) {
  const [p, s] = String(t || '').split('.');
  if (!p || !s || s !== await sign(env, p)) throw new Error('Session expired. Please sign in again.');
  const o = JSON.parse(dec.decode(unb64(p.replace(/-/g, '+').replace(/_/g, '/'))));
  if (o.exp < Date.now()) throw new Error('Session expired. Please sign in again.');
  const key = o.k || 'coal-washery:ei';
  return { user: o.u, role: o.r, key, mc: !!o.mc, unit: UNITS[key] };
}
async function issue(env, u, role, key, mc) {
  const payload = b64u(enc.encode(JSON.stringify({ u, r: role, k: key, mc: mc ? 1 : 0, exp: Date.now() + 216e5 })));   // session lasts 6 hours
  return payload + '.' + await sign(env, payload);
}
// ---------- Passwords: the Cloudflare secret holds the first password; a changed or reset password is stored hashed in users.json
const PBKDF2_ITER = 10000;
const unb64u = s => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4));
async function hashPw(pw, salt, iter) { const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']); return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, k, 256)); }
async function makeEntry(pw, extra) { const salt = crypto.getRandomValues(new Uint8Array(16)); return { s: b64u(salt), h: b64u(await hashPw(pw, salt, PBKDF2_ITER)), i: PBKDF2_ITER, ...extra }; }
const verifyPw = async (pw, e) => b64u(await hashPw(pw, unb64u(e.s), e.i)) === e.h;
const pwOk = s => typeof s === 'string' && s.length >= 8 && s.length <= 64 && /[A-Za-z]/.test(s) && /\d/.test(s);
function tempPw() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let p; do { p = Array.from(crypto.getRandomValues(new Uint8Array(10)), x => A[x % A.length]).join(''); } while (!pwOk(p)); return p; }
const usersOf = (env, unit) => { try { return JSON.parse(env[unit.users] || '{}'); } catch (_) { throw new Error('The user list for this section is not valid. Check the ' + unit.users + ' setting in Cloudflare.'); } };
async function setPassword(env, username, entryFn) {
  for (let i = 0; i < 4; i++) {
    const f = await read(env, 'users.json'), d = f.data || { users: {} }; d.users = d.users || {};
    d.users[username] = await entryFn(); const r = await write(env, 'users.json', d, f.sha, 'password ' + username);
    if (r.ok) return; if (r.status !== 409 && r.status !== 422) throw new Error('GitHub write failed: ' + r.status);
  }
  throw new Error('The server is busy. Please try again.');
}
async function changePassword(env, b, me) {
  if (!pwOk(b.newPassword)) throw new Error('The new password must be 8 to 64 characters and contain a letter and a number.');
  if (b.newPassword === b.oldPassword) throw new Error('Choose a password different from the current one.');
  const users = usersOf(env, me.unit), ov = ((await read(env, 'users.json')).data || {}).users?.[me.user];
  if (!(ov ? await verifyPw(String(b.oldPassword || ''), ov) : users[me.user] && users[me.user][0] === b.oldPassword)) throw new Error('The current password is wrong.');
  await setPassword(env, me.user, () => makeEntry(b.newPassword, { mc: 0, at: new Date().toISOString(), by: me.user }));
  return { ok: true, token: await issue(env, me.user, me.role, me.key, false) };
}
// ---------- User profiles (E&I sections only): profiles.json = { profiles: { username: { name, empCode, department, function } } } ----------
const PROFILE_FIELDS = { name: 60, empCode: 20, department: 60, function: 60 };
const profilesOf = async env => ((await read(env, 'profiles.json')).data || {}).profiles || {};
async function profileGet(env, me) {
  const P = await profilesOf(env), out = { user: me.user, role: me.role, profile: P[me.user] || {} };
  if (me.role === 'admin') { const users = usersOf(env, me.unit); out.users = Object.keys(users).map(u => ({ username: u, role: users[u][1], profile: P[u] || {} })); }
  return out;
}
async function profileSave(env, b, me) {
  if (me.role !== 'admin') throw new Error('Admin access only.');
  if (!Object.prototype.hasOwnProperty.call(usersOf(env, me.unit), b.username)) throw new Error('Unknown user.');
  const src = b.profile || {}, prof = {}; for (const k of Object.keys(PROFILE_FIELDS)) prof[k] = String(src[k] == null ? '' : src[k]).trim().slice(0, PROFILE_FIELDS[k]);
  for (let i = 0; i < 4; i++) {
    const f = await read(env, 'profiles.json'), d = f.data || { profiles: {} }; d.profiles = d.profiles || {};
    d.profiles[b.username] = prof;
    const r = await write(env, 'profiles.json', d, f.sha, 'profile ' + b.username + ' by ' + me.user);
    if (r.ok) return { ok: true, profile: prof };
    if (r.status !== 409 && r.status !== 422) throw new Error('GitHub write failed: ' + r.status);
  }
  throw new Error('The server is busy. Please try again.');
}
async function adminUsers(env, me) {
  if (me.role !== 'admin') throw new Error('Admin access only.');
  const users = usersOf(env, me.unit), ov = ((await read(env, 'users.json')).data || {}).users || {};
  return { users: Object.keys(users).map(u => ({ username: u, role: users[u][1], custom: !!ov[u], mustChange: !!(ov[u] && ov[u].mc) })) };
}
async function adminReset(env, b, me) {
  if (me.role !== 'admin') throw new Error('Admin access only.');
  if (!Object.prototype.hasOwnProperty.call(usersOf(env, me.unit), b.username)) throw new Error('Unknown user.');
  const temp = tempPw();
  await setPassword(env, b.username, () => makeEntry(temp, { mc: 1, at: new Date().toISOString(), by: me.user }));
  return { ok: true, username: b.username, temp };
}
// Plant + section units. Add a line here (and a USERS secret) to open a new section, e.g. Operation.
const UNITS = {
  'coal-washery:ei': { name: 'Coal Washery E&I', folder: 'coal-washery-ei/', folderVar: 'CW_FOLDER', users: 'USERS', roles: ['admin', 'user', 'mgmt'] },   // CW_FOLDER = root keeps the data at the repo top level
  'coke-oven:ei': { name: 'Coke Oven E&I', folder: 'coke-oven-ei/', users: 'USERS_COKE_OVEN_EI', roles: ['admin', 'user', 'mgmt'] },
  'rmhs:ei': { name: 'RMHS E&I', folder: 'rmhs-ei/', users: 'USERS_RMHS_EI', roles: ['admin', 'user', 'mgmt'] },
  'coke-oven:ops': { name: 'Coke Oven Operation', folder: 'coke-oven-ops/', users: 'USERS_COKE_OVEN_OPS', type: 'ops', roles: ['admin', 'entry', 'mgmt'] }   // roles: admin = Administrator, entry = Data Entry, mgmt = Management
  // 'coal-washery:ops': { name: 'Coal Washery Operation', folder: 'coal-washery-ops/', users: 'USERS_COAL_WASHERY_OPS' },
};
const folderOf = (env, unit) => { const v = unit.folderVar && env[unit.folderVar]; return v ? (v === 'root' ? '' : String(v).replace(/\/*$/, '/')) : unit.folder; };
async function login(env, plant, section, u, p) {
  const key = plant + ':' + section, unit = Object.prototype.hasOwnProperty.call(UNITS, key) && UNITS[key];
  if (!unit) throw new Error('Choose a valid plant and section.');
  if (!env[unit.users]) throw new Error('This section is not set up yet.');
  const users = usersOf(env, unit), E = { ...env, F: folderOf(env, unit) }, fk = 'fail:' + key + ':' + String(u).toLowerCase(), fails = env.KV ? +(await env.KV.get(fk) || 0) : 0;
  if (fails >= 5) throw new Error('Too many wrong attempts. Try again in 10 minutes.');
  const bad = async () => { if (env.KV) await env.KV.put(fk, String(fails + 1), { expirationTtl: 600 }); throw new Error('Wrong username or password'); };
  if (!Object.prototype.hasOwnProperty.call(users, u)) return bad();
  const ov = ((await read(E, 'users.json')).data || {}).users?.[u];       // set by the user or by the administrator
  if (!(ov ? await verifyPw(String(p), ov) : users[u][0] === p)) return bad();
  if (unit.roles && !unit.roles.includes(users[u][1])) throw new Error('This user has no valid role. Use one of: ' + unit.roles.join(', ') + '.');
  const name = unit.type === 'ops' ? '' : ((await profilesOf(E))[u] || {}).name || '';
  return { token: await issue(env, u, users[u][1], key, ov && ov.mc), user: u, role: users[u][1], unit: unit.name, name, mustChange: !!(ov && ov.mc) };
}
const gh = (env, method, path, body) => fetch('https://api.github.com/repos/' + env.GH_REPO + '/contents/' + path, { method, body: body && JSON.stringify(body),
  headers: { Authorization: 'Bearer ' + env.GH_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'cmms-worker', 'X-GitHub-Api-Version': '2022-11-28' } });
async function read(env, path) {
  const r = await gh(env, 'GET', (env.F || '') + path); if (r.status === 404) return { data: null };
  if (!r.ok) throw new Error('GitHub read failed: ' + r.status);
  const j = await r.json(); return { data: j.content ? JSON.parse(dec.decode(unb64(j.content.replace(/\n/g, '')))) : null, sha: j.sha };
}
const write = (env, path, obj, sha, msg) => gh(env, 'PUT', (env.F || '') + path, { message: msg, sha, content: btoa(bin(enc.encode(JSON.stringify(obj)))) });
// ---------- Extra orders: rescheduled (deferred), additional, and corrective (from Attention). Stored per month in extras/YYYY-MM.json ----------
const monthsBetween = (a, b) => { const out = [], end = b.slice(0, 7), d = new Date(a.slice(0, 7) + '-01T00:00:00Z'); for (;;) { const m = d.toISOString().slice(0, 7); out.push(m); if (m >= end) break; d.setUTCMonth(d.getUTCMonth() + 1); } return out; };
const isoDay = t => new Date(t).toISOString().slice(0, 10);
async function readExtras(env, months) { const out = []; await Promise.all(months.map(async m => { out.push(...(((await read(env, 'extras/' + m + '.json')).data) || [])); })); return out; }
async function addExtra(env, rec) {            // idempotent: an order number is stored once
  const path = 'extras/' + rec.due.slice(0, 7) + '.json';
  for (let i = 0; i < 4; i++) {
    const f = await read(env, path), list = f.data || [];
    if (list.some(x => x.no === rec.no)) return { duplicate: true };
    list.push(rec);
    const r = await write(env, path, list, f.sha, 'extra order ' + rec.no);
    if (r.ok) return { ok: true };
    if (r.status !== 409 && r.status !== 422) throw new Error('GitHub write failed: ' + r.status);
  }
  throw new Error('The server is busy. Please try again.');
}
async function ensureResched(env, rec, me) {   // rec = the Deferred closure record (has newDate)
  const master = (await read(env, 'master.json')).data || {}, e = (master.equipment || []).find(x => x.id === rec.eq) || {};
  const src = (await readExtras(env, [rec.due.slice(0, 7)])).find(x => x.no === rec.no);
  const m = /-R(\d+)$/.exec(rec.no), root = rec.no.replace(/-R\d+$/, ''), no = root + '-R' + (m ? +m[1] + 1 : 1);
  return addExtra(env, { no, due: rec.newDate, eq: rec.eq, name: e.name || rec.name, loc: e.loc || '', crit: e.crit || '', type: e.type || '', freq: rec.freq, kind: 'resched', otype: src ? src.otype || '' : '',
    chk: src ? src.chk !== false : true, title: src ? src.title || '' : '', desc: src ? src.desc || '' : '', src: rec.no, by: me.user, at: new Date().toISOString() });
}
async function addAdditional(env, r, me) {
  const s = (x, n) => String(x == null ? '' : x).trim().slice(0, n);
  if (!DATE_RE.test(String(r.due))) throw new Error('Select the due date.');
  if (r.due < isoDay(Date.now() - 864e5)) throw new Error('The due date cannot be in the past.');
  if (!['PM', 'CM', 'IM', 'OM'].includes(r.otype)) throw new Error('Select the type of order.');
  const title = s(r.title, 120); if (!title) throw new Error('Enter a job title.');
  const master = (await read(env, 'master.json')).data || {}, e = (master.equipment || []).find(x => x.id === r.eq);
  if (!e) throw new Error('Select the equipment.'); if (e.status === 'Inactive') throw new Error('This equipment is inactive.');
  const path = 'extras/' + r.due.slice(0, 7) + '.json';
  for (let i = 0; i < 4; i++) {
    const f = await read(env, path), list = f.data || [];
    const pre = r.otype + '-' + String(e.id).slice(-4) + '-' + r.due.slice(2).replace(/-/g, '') + '-';
    const seq = list.filter(x => String(x.no).startsWith(pre)).length + 1;
    const rec = { no: pre + String(seq).padStart(2, '0'), otype: r.otype, due: r.due, eq: e.id, name: e.name || '', loc: e.loc || '', crit: e.crit || '', type: e.type || '',
      freq: 'Additional', kind: 'additional', chk: false, title, desc: s(r.desc, 2000), by: me.user, at: new Date().toISOString() };
    list.push(rec);
    const res = await write(env, path, list, f.sha, 'additional order ' + rec.no);
    if (res.ok) return { ok: true, no: rec.no };
    if (res.status !== 409 && res.status !== 422) throw new Error('GitHub write failed: ' + res.status);
  }
  throw new Error('The server is busy. Please try again.');
}
async function ensureAttentionNotification(env, closure, measurement) {
  const attentionItems = (measurement.items || []).filter(x => String(x.result || '').toUpperCase() === 'ATTENTION');
  if (!attentionItems.length) return false;

  const date = String(closure.on || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid closure date for Attention notification.');
  await addExtra(env, { no: 'ACT-' + String(closure.no).slice(0, 52), due: date, eq: String(closure.eq || measurement.eq || ''), name: String(closure.name || measurement.name || ''), loc: String(measurement.loc || ''), crit: String(measurement.crit || ''), type: String(measurement.type || ''),
    freq: 'Corrective', kind: 'attention', otype: 'CM', chk: false, title: 'Attention items from ' + closure.no, desc: attentionItems.map(x => String(x.item || '').trim()).filter(Boolean).join('; ').slice(0, 1500), src: String(closure.no), by: 'System', at: new Date().toISOString() });
  const path = 'notifications/' + date.slice(0, 7) + '.json';
  const names = attentionItems.map(x => String(x.item || '').trim()).filter(Boolean);
  const description = 'Maintenance order ' + closure.no + ' for ' + closure.name +
    ' was closed with ' + attentionItems.length + ' Attention item(s).' +
    (names.length ? ' Items: ' + names.join('; ') : '');

  for (let i = 0; i < 4; i++) {
    const f = await read(env, path), list = f.data || [];
    if (list.some(x => x.autoSource === 'closure-attention' && x.orderNo === closure.no)) return true;

    const rec = {
      id: crypto.randomUUID(),
      no: 'ATT-' + String(closure.no).replace(/[^A-Za-z0-9-]/g, '').slice(-40),
      date,
      area: String(measurement.loc || ''),
      eq: String(closure.eq || measurement.eq || ''),
      eqName: String(closure.name || measurement.name || ''),
      type: 'Attention',
      title: String(closure.no) + ' closed with Attention',
      desc: description,
      team: '',
      by: 'System',
      at: new Date().toISOString(),
      orderNo: String(closure.no),
      autoSource: 'closure-attention'
    };
    list.push(rec);
    const result = await write(env, path, list, f.sha, 'automatic Attention notification for ' + closure.no);
    if (result.ok) return true;
    if (result.status !== 409 && result.status !== 422) throw new Error('Could not save automatic Attention notification: ' + result.status);
  }
  throw new Error('The server is busy. Please try again.');
}

async function addRecord(env, dir, rec, me) {
  let measurementForClosure = null;
  if (dir === 'closures') {                       // keep only known fields; start and end times are required to close an order
    const s = (x, n) => String(x == null ? '' : x).slice(0, n), T = /^([01]\d|2[0-3]):[0-5]\d$/;
    const r2 = { no: s(rec.no, 60), due: rec.due, eq: s(rec.eq, 40), name: s(rec.name, 120), freq: s(rec.freq, 20), action: rec.action, on: s(rec.on, 10), rem: s(rec.rem, 500), start: s(rec.start, 5), end: s(rec.end, 5), newDate: rec.action === 'Deferred' ? s(rec.newDate, 10) : undefined };
    if (!['Closed', 'Deferred'].includes(r2.action)) throw new Error('Invalid action.');
    if (r2.action === 'Deferred' && (!/^\d{4}-\d{2}-\d{2}$/.test(r2.newDate) || r2.newDate <= r2.due || r2.newDate < r2.on)) throw new Error('Select the new date for the deferred order. It must be after the due date and not in the past.');
    if ((r2.start && !T.test(r2.start)) || (r2.end && !T.test(r2.end))) throw new Error('Enter the times as hours and minutes.');
    if (r2.action === 'Closed' && (!r2.start || !r2.end)) throw new Error('Enter the start time and end time before closing the order.');
    rec = r2;
  } else rec = clean(rec);

  for (let i = 0; i < 4; i++) {
    const path = dir + '/' + rec.due + '.json', f = await read(env, path), list = f.data || [];
    const existing = list.find(x => x.no === rec.no);

    if (existing) {
      if (dir === 'closures' && existing.action === 'Closed') {
        try {
          const m = (await read(env, 'measurements/' + rec.due + '.json')).data || [];
          const measurement = m.find(x => x.no === rec.no);
          if (measurement && (measurement.items || []).some(x => String(x.result || '').toUpperCase() === 'ATTENTION')) {
            await ensureAttentionNotification(env, existing, measurement);
            return { duplicate: true, attentionNotification: true };
          }
        } catch (_) {
          return { duplicate: true, attentionNotificationPending: true };
        }
      }
      return { duplicate: true };
    }

    if (dir === 'closures' && rec.action === 'Closed') {
      const xo = (await readExtras(env, [rec.due.slice(0, 7)])).find(x => x.no === rec.no);   // extra orders without a checklist are closed directly
      if (!(xo && xo.chk === false)) {
        const m = (await read(env, 'measurements/' + rec.due + '.json')).data || [];
        measurementForClosure = m.find(x => x.no === rec.no) || null;
        if (!measurementForClosure) throw new Error('Save the checklist before closing this order.');
      }
    }
    if (dir === 'closures' && rec.action === 'Deferred') await ensureResched(env, rec, me);     // new order on the new date first; safe to repeat

    rec.by = me.user;
    rec.at = new Date().toISOString();
    list.push(rec);
    const r = await write(env, path, list, f.sha, dir + ' ' + rec.no);
    if (r.ok) {
      if (dir === 'closures' && rec.action === 'Closed' && measurementForClosure &&
          (measurementForClosure.items || []).some(x => String(x.result || '').toUpperCase() === 'ATTENTION')) {
        try {
          await ensureAttentionNotification(env, rec, measurementForClosure);
          return { ok: true, attentionNotification: true };
        } catch (_) {
          // The order closure is already saved. Return its success and let a retry complete the alert.
          return { ok: true, attentionNotificationPending: true };
        }
      }
      return { ok: true };
    }
    if (r.status !== 409 && r.status !== 422) throw new Error('GitHub write failed: ' + r.status);
  }
  throw new Error('The server is busy. Please try again.');
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
async function addNotif(env, r, me) {
  const s = (x, n) => String(x || '').trim().slice(0, n);
  if (!DATE_RE.test(String(r.date))) throw new Error('Invalid date');
  const rec = { date: r.date, area: s(r.area, 80), eq: s(r.eq, 40), eqName: s(r.eqName, 120), type: r.type, title: s(r.title, 120), desc: s(r.desc, 2000), team: s(r.team, 300) };
  if (!['Planned', 'Breakdown', 'Improvement', 'Interruption'].includes(rec.type)) throw new Error('Choose a notification type.');
  if (!rec.area || !rec.eq || !rec.title || !rec.desc) throw new Error('Area, equipment, title and description are required.');
  if (rec.type === 'Breakdown') {
    const h = Number(r.delayHours), m = Number(r.delayMinutes);
    if (r.delayHours == null || r.delayMinutes == null || !Number.isInteger(h) || h < 0 || !Number.isInteger(m) || m < 0 || m > 59) throw new Error('Enter valid breakdown hours and minutes (minutes must be 0-59).');
    rec.delayHours = h; rec.delayMinutes = m; rec.delay = h * 60 + m;
  }
  if (rec.type === 'Improvement') { const k = [...new Set((Array.isArray(r.kpis) ? r.kpis : []).filter(x => 'PQCDSM'.includes(x) && x.length === 1))]; if (!k.length) throw new Error('Select at least one KPI.'); rec.kpis = k; }
  rec.id = crypto.randomUUID(); rec.by = me.user; rec.at = new Date().toISOString();
  const path = 'notifications/' + rec.date.slice(0, 7) + '.json';
  for (let i = 0; i < 4; i++) {
    const f = await read(env, path), list = f.data || [];
    const seq = list.filter(x => x.eq === rec.eq && x.date === rec.date).length + 1;   // same equipment and date: 01, 02, ...
    rec.no = 'NTF-' + rec.eq.slice(-4) + '-' + rec.date.slice(2).replace(/-/g, '') + '-' + String(seq).padStart(2, '0'); list.push(rec);
    const res = await write(env, path, list, f.sha, 'notification ' + rec.no);
    if (res.ok) return { ok: true, no: rec.no };
    if (res.status !== 409 && res.status !== 422) throw new Error('GitHub write failed: ' + res.status);
  }
  throw new Error('The server is busy. Please try again.');
}
// ---------- Operation sections (Data Entry / Management / Administrator) ----------
function clean(v, d = 0) {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') return v.slice(0, 500);
  if (d > 4) return null;
  if (Array.isArray(v)) return v.slice(0, 100).map(x => clean(x, d + 1));
  if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).slice(0, 60)) o[String(k).slice(0, 40)] = clean(v[k], d + 1); return o; }
  return null;
}
const flat = (o, p = '', m = {}) => { if (o !== null && typeof o === 'object') for (const k of Object.keys(o)) flat(o[k], p ? p + '.' + k : k, m); else m[p] = JSON.stringify(o); return m; };
const REC_KEYS = ['date', 'shift', 'enteredBy', 'department', 'remarks', 'coal', 'coke', 'temps', 'elec', 'equip', 'inv'];
async function opsSave(env, r, submit, reason, me) {
  if (me.role !== 'admin' && me.role !== 'entry') throw new Error('You do not have permission to enter data.');
  if (!r || !DATE_RE.test(String(r.date)) || !['A', 'B', 'C'].includes(r.shift)) throw new Error('Choose a valid date and shift.');
  const rec = {}; REC_KEYS.forEach(k => { if (r[k] !== undefined) rec[k] = clean(r[k]); });
  const path = 'records/' + rec.date + '.json';
  for (let i = 0; i < 4; i++) {
    const f = await read(env, path), list = f.data || [], ix = list.findIndex(x => x.shift === rec.shift), old = ix >= 0 ? list[ix] : null, now = new Date().toISOString();
    let out;
    if (!old) { out = { ...rec, status: submit ? 'submitted' : 'draft', createdAt: now, updatedAt: now, audit: [{ at: now, by: me.user, action: submit ? 'submitted' : 'draft created' }] }; list.push(out); }
    else if (old.status === 'draft') { out = { ...rec, status: submit ? 'submitted' : 'draft', createdAt: old.createdAt, updatedAt: now, audit: [...old.audit, { at: now, by: me.user, action: submit ? 'submitted' : 'draft saved' }] }; list[ix] = out; }
    else {
      if (me.role !== 'admin') throw new Error('This date and shift is already submitted. Ask the administrator to correct it.');
      if (String(reason || '').trim().length < 5) throw new Error('Enter a reason for the correction.');
      const a = flat(old), b = flat(rec), ch = [];
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { if (['audit', 'status', 'createdAt', 'updatedAt', 'sample'].includes(k.split('.')[0])) continue; if (a[k] !== b[k]) ch.push({ f: k, old: a[k] ?? null, new: b[k] ?? null }); }
      out = { ...old, ...rec, updatedAt: now, audit: [...old.audit, { at: now, by: me.user, action: 'correction', reason: String(reason).slice(0, 300), changes: ch.slice(0, 40), more: Math.max(0, ch.length - 40) }] }; list[ix] = out;
    }
    const res = await write(env, path, list, f.sha, 'ops ' + rec.date + ' ' + rec.shift);
    if (res.ok) return { ok: true, status: out.status };
    if (res.status !== 409 && res.status !== 422) throw new Error('GitHub write failed: ' + res.status);
  }
  throw new Error('The server is busy. Please try again.');
}
async function opsHandle(env, b, me) {
  if (b.action === 'ops_range') {            // up to 31 days = 31 reads (free plan allows 50)
    if (!DATE_RE.test(String(b.from)) || !DATE_RE.test(String(b.to))) throw new Error('Invalid date');
    const days = []; for (let t = Date.parse(b.from); t <= Date.parse(b.to); t += 864e5) days.push(new Date(t).toISOString().slice(0, 10));
    if (!days.length || days.length > 31) throw new Error('Choose a period of 1 to 31 days.');
    const recs = []; await Promise.all(days.map(async d => { recs.push(...((await read(env, 'records/' + d + '.json')).data || [])); }));
    return { records: me.role === 'mgmt' ? recs.filter(r => r.status === 'submitted') : recs, config: (await read(env, 'config.json')).data, role: me.role };
  }
  if (b.action === 'ops_save') return opsSave(env, b.rec, !!b.submit, b.reason, me);
  if (b.action === 'ops_config_save') {
    if (me.role !== 'admin') throw new Error('Admin access only.');
    const c = clean(b.config); if (!c || typeof c !== 'object' || !Array.isArray(c.equipment)) throw new Error('Invalid settings');
    const f = await read(env, 'config.json'), r = await write(env, 'config.json', c, f.sha, 'config by ' + me.user);
    if (!r.ok) throw new Error('Settings were changed by someone else. Reload and try again.'); return { ok: true };
  }
  throw new Error('Unknown action');
}
async function handle(env, b) {
  if (b.action === 'login') return login(env, b.plant || 'coal-washery', b.section || 'ei', b.username, b.password);
  const me = await who(env, b.token);
  if (!me.unit) throw new Error('Session expired. Please sign in again.');
  if (me.mc && b.action !== 'change_password') throw new Error('Please change your password first.');
  env = { ...env, F: folderOf(env, me.unit) };
  if (me.role === 'mgmt' && me.unit.type !== 'ops' && ['closure', 'measurement', 'notif_add'].includes(b.action)) throw new Error('Management users have view-only access.');
  if (b.action === 'change_password') return changePassword(env, b, me);
  if (b.action === 'admin_users') return adminUsers(env, me);
  if (b.action === 'admin_reset_password') return adminReset(env, b, me);
  if (me.unit.type === 'ops') return opsHandle(env, b, me);      // every file for this plant and section lives under its own folder
  if (b.action === 'notif_list') { if (!/^\d{4}-\d{2}$/.test(String(b.month))) throw new Error('Invalid month'); return { list: (await read(env, 'notifications/' + b.month + '.json')).data || [] }; }
  if (b.action === 'reliability_range') {      // read-only, every role; 31 days at most per request
    if (!DATE_RE.test(String(b.from)) || !DATE_RE.test(String(b.to))) throw new Error('Invalid date');
    const nd = Math.round((Date.parse(b.to) - Date.parse(b.from)) / 864e5) + 1;
    if (nd < 1 || nd > 31) throw new Error('Choose a period of 1 to 31 days.');
    const months = monthsBetween(b.from, b.to), breakdowns = [];
    await Promise.all(months.map(async m => { for (const x of ((await read(env, 'notifications/' + m + '.json')).data || [])) if (x.type === 'Breakdown' && x.date >= b.from && x.date <= b.to) breakdowns.push({ no: x.no, date: x.date, eq: x.eq, name: x.eqName, area: x.area, mins: Number(x.delay) || 0 }); }));
    const ex = (await readExtras(env, months)).filter(x => (x.kind === 'attention' || x.kind === 'additional') && x.due >= b.from && x.due <= b.to);
    const cl = {}; await Promise.all([...new Set(ex.map(x => x.due))].map(async d => { for (const c of ((await read(env, 'closures/' + d + '.json')).data || [])) cl[c.no] = c; }));
    const hm = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; };
    const orders = ex.map(x => { const c = cl[x.no], a1 = c ? hm(c.start) : null, b1 = c ? hm(c.end) : null;
      return { no: x.no, due: x.due, eq: x.eq, name: x.name, area: x.loc, kind: x.kind, otype: x.otype || '', state: !c ? 'open' : c.action === 'Closed' ? 'closed' : 'deferred', mins: c && c.action === 'Closed' && a1 != null && b1 != null ? (b1 >= a1 ? b1 - a1 : b1 + 1440 - a1) : null }; });
    return { breakdowns, orders };
  }
  if (b.action === 'profile_get') return profileGet(env, me);
  if (b.action === 'profile_save') return profileSave(env, b, me);
  if (b.action === 'notif_add') return addNotif(env, b.rec, me);
  if (b.action === 'order_add') return addAdditional(env, b.rec, me);       // every role, including Management
  if (['load', 'history'].includes(b.action) && !DATE_RE.test(String(b.date))) throw new Error('Invalid date');
  if (['closure', 'measurement'].includes(b.action) && !DATE_RE.test(String(b.rec && b.rec.due))) throw new Error('Invalid date');
  if (b.action === 'load') {
    const m = (await read(env, 'master.json')).data;
    if (!m) throw new Error((env.F || '') + 'master.json not found in repo "' + env.GH_REPO + '". Check GH_REPO, that master.json is in the repo root, and that the token has access to this repo.');
    return { master: m, closures: (await read(env, 'closures/' + b.date + '.json')).data || [], measurements: ((await read(env, 'measurements/' + b.date + '.json')).data || []).map(x => ({ no: x.no })),
      names: Object.fromEntries(Object.entries(await profilesOf(env)).filter(([, v]) => v && v.name).map(([k, v]) => [k, v.name])),
      extras: await readExtras(env, monthsBetween(isoDay(Date.parse(b.date) - 14 * 864e5), isoDay(Date.parse(b.date) + 7 * 864e5))) };
  }
  if (b.action === 'range') {         // closures and saved checklists for a past period (max 14 days = 28 GitHub reads, within the free plan limit)
    if (!DATE_RE.test(String(b.from)) || !DATE_RE.test(String(b.to))) throw new Error('Invalid date');
    const days = []; for (let t = Date.parse(b.from); t <= Date.parse(b.to); t += 864e5) days.push(new Date(t).toISOString().slice(0, 10));
    if (!days.length || days.length > 14) throw new Error('Choose a period of 1 to 14 days.');
    const cl = [], ms = [];
    await Promise.all(days.map(async d => {
      cl.push(...((await read(env, 'closures/' + d + '.json')).data || []));
      ms.push(...((await read(env, 'measurements/' + d + '.json')).data || []).map(x => ({ no: x.no })));
    }));
    return { closures: cl, measurements: ms };
  }
  if (b.action === 'closure') return addRecord(env, 'closures', b.rec, me);
  if (b.action === 'measurement') return addRecord(env, 'measurements', b.rec, me);
  if (b.action === 'history' || b.action === 'compliance_range') {      // read-only: administrator and management
    if (me.role !== 'admin' && me.role !== 'mgmt') throw new Error('Admin or management access only.');
    if (b.action === 'history') return { closures: (await read(env, 'closures/' + b.date + '.json')).data || [], measurements: (await read(env, 'measurements/' + b.date + '.json')).data || [] };
    if (!DATE_RE.test(String(b.from)) || !DATE_RE.test(String(b.to))) throw new Error('Invalid date');
    const days = []; for (let t = Date.parse(b.from); t <= Date.parse(b.to); t += 864e5) days.push(new Date(t).toISOString().slice(0, 10));
    if (!days.length || days.length > 31) throw new Error('Choose a period of 1 to 31 days.');       // 31 reads, under the Worker limit of 50 per request
    const cl = [];
    await Promise.all(days.map(async d => { for (const x of ((await read(env, 'closures/' + d + '.json')).data || [])) cl.push({ no: x.no, due: x.due, action: x.action, on: x.on }); }));
    const ex = (await readExtras(env, monthsBetween(b.from, b.to))).filter(x => x.due >= b.from && x.due <= b.to).map(x => ({ no: x.no, due: x.due, kind: x.kind }));
    return { closures: cl, extras: ex };
  }
  if (me.role !== 'admin') throw new Error('Admin access only.');
  if (b.action === 'history') return { closures: (await read(env, 'closures/' + b.date + '.json')).data || [], measurements: (await read(env, 'measurements/' + b.date + '.json')).data || [] };
  if (b.action === 'master') {
    if (!b.master || !Array.isArray(b.master.equipment)) throw new Error('Invalid data');
    const r = await write(env, 'master.json', b.master, (await read(env, 'master.json')).sha, 'master by ' + me.user);
    if (!r.ok) throw new Error('GitHub write failed: ' + r.status); return { ok: true };
  }
  throw new Error('Unknown action');
}
async function route(req, env) {
    const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
    const out = o => new Response(JSON.stringify(o), { headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method === 'GET') return out({ ok: true, status: 'running' });
    try { return out(await handle(env, await req.json())); } catch (x) { return out({ error: String(x.message || x) }); }
  }
export default {          // always answer in JSON, even if something unexpected fails
  async fetch(req, env) {
    try { return await route(req, env); }
    catch (x) { return new Response(JSON.stringify({ error: String(x.message || x) }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
  }
};