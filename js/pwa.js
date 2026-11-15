
(() => {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./sw.js",
        { scope: "./" }
      );

      console.log(
        "CMMS PWA service worker registered:",
        registration.scope
      );
    } catch (error) {
      console.error("CMMS PWA registration failed:", error);
    }
  });
})();
