// SETUP: script.google.com > New project > paste this file. Project Settings > Script properties, add:
//   GH_TOKEN = fine-grained GitHub token (only repo cmms-data, Contents: Read and write)
//   GH_REPO  = your-github-username/cmms-data   (private repo containing master.json)
// Then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone). Copy the /exec URL to config.js.
// After editing USERS: Deploy > Manage deployments > Edit > New version.
const USERS = {   // username: [password, role]
  admin: ['Admin-ChangeMe', 'admin'],
  user01: ['ChangeMe-01', 'user'], user02: ['ChangeMe-02', 'user'], user03: ['ChangeMe-03', 'user'], user04: ['ChangeMe-04', 'user'], user05: ['ChangeMe-05', 'user'],
  user06: ['ChangeMe-06', 'user'], user07: ['ChangeMe-07', 'user'], user08: ['ChangeMe-08', 'user'], user09: ['ChangeMe-09', 'user'], user10: ['ChangeMe-10', 'user']
};
const json = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const prop = k => PropertiesService.getScriptProperties().getProperty(k);
function gh(method, path, body) {
  return UrlFetchApp.fetch('https://api.github.com/repos/' + prop('GH_REPO') + '/contents/' + path, { method, muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + prop('GH_TOKEN'), Accept: 'application/vnd.github+json' }, payload: body && JSON.stringify(body) });
}
function read(path) {
  const r = gh('get', path); if (r.getResponseCode() === 404) return { data: null };
  if (r.getResponseCode() >= 300) throw new Error('GitHub read failed: ' + r.getResponseCode());
  const j = JSON.parse(r.getContentText()), raw = j.content ? Utilities.base64Decode(j.content.replace(/\n/g, '')) : null;
  return { data: raw ? JSON.parse(Utilities.newBlob(raw).getDataAsString()) : null, sha: j.sha };
}
function write(path, obj, sha, msg) {
  const r = gh('put', path, { message: msg, sha, content: Utilities.base64Encode(Utilities.newBlob(JSON.stringify(obj)).getBytes()) });
  if (r.getResponseCode() >= 300) throw new Error('GitHub write failed: ' + r.getContentText().slice(0, 160));
}
function login(u, p) {
  const c = CacheService.getScriptCache(), fk = 'fail:' + String(u).toLowerCase(), fails = Number(c.get(fk) || 0);
  if (fails >= 5) throw new Error('Too many wrong attempts. Try again in 10 minutes.');
  if (!Object.prototype.hasOwnProperty.call(USERS, u) || USERS[u][0] !== p) { c.put(fk, String(fails + 1), 600); throw new Error('Wrong username or password'); }
  c.remove(fk); const t = Utilities.getUuid() + Utilities.getUuid(); c.put('t:' + t, JSON.stringify({ user: u, role: USERS[u][1] }), 21600);
  return { token: t, user: u, role: USERS[u][1] };
}
function who(t) { const s = t && CacheService.getScriptCache().get('t:' + t); if (!s) throw new Error('Session expired. Please sign in again.'); return JSON.parse(s); }
function addRecord(dir, rec, me) {
  const path = dir + '/' + rec.due + '.json', f = read(path), list = f.data || [];
  if (list.some(x => x.no === rec.no)) return { duplicate: true };
  if (dir === 'closures' && rec.action === 'Closed') {
    const m = read('measurements/' + rec.due + '.json').data || [];
    if (!m.some(x => x.no === rec.no)) throw new Error('Save the checklist before closing this order.');
  }
  rec.by = me.user; rec.at = new Date().toISOString(); list.push(rec);
  write(path, list, f.sha, dir + ' ' + rec.no); return { ok: true };
}
function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.action === 'login') return json(login(b.username, b.password));
    const me = who(b.token), admin = me.role === 'admin';
    if (b.action === 'load') return json({ master: read('master.json').data,
      closures: read('closures/' + b.date + '.json').data || [], measurements: (read('measurements/' + b.date + '.json').data || []).map(m => ({ no: m.no })) });
    if (b.action === 'closure') return json(addRecord('closures', b.rec, me));
    if (b.action === 'measurement') return json(addRecord('measurements', b.rec, me));
    if (!admin) throw new Error('Admin access only.');
    if (b.action === 'history') return json({ closures: read('closures/' + b.date + '.json').data || [], measurements: read('measurements/' + b.date + '.json').data || [] });
    if (b.action === 'master') { if (!b.master || !Array.isArray(b.master.equipment)) throw new Error('Invalid data'); write('master.json', b.master, read('master.json').sha, 'master by ' + me.user); return json({ ok: true }); }
    throw new Error('Unknown action');
  } catch (x) { return json({ error: String(x.message || x) }); } finally { lock.releaseLock(); }
}
