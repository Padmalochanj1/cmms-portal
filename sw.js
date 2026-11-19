// Service worker: makes the site installable and keeps the pages available when the signal is weak.
// Pages are fetched from the network first (so updates appear straight away) and the saved copy is used only when offline.
// Data requests go to the Cloudflare Worker (another address) and are never touched here.
const V = "plant-portal-v8";
const SHELL = ["./", "index.html", "pages/app.html", "pages/ops.html", "css/landing.css", "css/style.css", "css/ops.css", "js/config.js", "js/plants.js", "js/landing.js", "js/app.js", "js/logic.js", "js/ops.js", "js/ops-logic.js", "js/pwa.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/logo.png", "icons/favicon-32.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r.mode === "navigate" ? r : new Request(r, { cache: "no-cache" }))
    .then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
