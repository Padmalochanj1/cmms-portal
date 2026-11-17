// Registers the service worker and shows an "Install app" notice on phones.
(() => {
  const src = document.currentScript.src;
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
    navigator.serviceWorker.register(new URL("../sw.js", src).href, { scope: new URL("../", src).href }).catch(() => {});
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const phone = (/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || matchMedia("(pointer: coarse)").matches) && Math.min(screen.width, screen.height) <= 900;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream, KEY = "pwaDismissedAt";
  const recent = () => Date.now() - (+localStorage[KEY] || 0) < 7 * 864e5;      // after "Not now", ask again after 7 days
  let ev = null, box = null;
  const hide = () => { if (box) { box.remove(); box = null; } };
  const dismiss = () => { try { localStorage[KEY] = Date.now(); } catch (_) {} hide(); };
  function show(isIos) {
    if (box || standalone || !phone || recent()) return;
    const st = document.createElement("style");
    st.textContent = "#pwa{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:99999;background:#fff;color:#12283d;border:1px solid #d6e1ed;border-radius:14px;box-shadow:0 10px 34px rgba(18,40,61,.28);padding:12px;display:flex;gap:12px;align-items:center;font:14px/1.4 system-ui,sans-serif}#pwa img{width:44px;height:44px;border-radius:10px;flex:none}#pwa .t{flex:1}#pwa b{display:block}#pwa span{color:#4d6781;font-size:13px}#pwa button{font:inherit;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}#pwa .i{background:#ff9d2e;color:#2a1600;font-weight:600}#pwa .x{background:transparent;color:#4d6781}";
    box = document.createElement("div"); box.id = "pwa"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Install app"); box.appendChild(st);
    box.insertAdjacentHTML("beforeend", `<img src="${new URL("../icons/icon-192.png", src).href}" alt=""><div class="t"><b>Install Plant Portal</b><span>${isIos ? "Tap Share, then Add to Home Screen." : "Add it to your home screen for quick access."}</span></div>${isIos ? "" : '<button class="i" type="button">Install</button>'}<button class="x" type="button">${isIos ? "Close" : "Not now"}</button>`);
    box.querySelector(".x").onclick = dismiss;
    const b = box.querySelector(".i");
    if (b) b.onclick = async () => { if (!ev) return hide(); ev.prompt(); const r = await ev.userChoice.catch(() => ({})); ev = null; hide(); if (r.outcome !== "accepted") dismiss(); };
    document.body.appendChild(box);
  }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); ev = e; show(false); });
  window.addEventListener("appinstalled", () => { ev = null; hide(); });
  if (ios && !standalone) setTimeout(() => show(true), 1500);
})();
