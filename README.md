# Plant Management Portal (website)

Static website for GitHub Pages. Data is NOT stored here: it lives in the private data repo, reached through the Cloudflare Worker.

```
index.html            Landing page and sign-in (must stay at the top level)
pages/app.html        Work screens: Dashboard, Order closing, Closure report, Checklist, Tomorrow, Notifications, Admin
css/                  style.css (work screens), landing.css (landing page)
js/                   config.js (server address), plants.js (plants and sections), landing.js, app.js, logic.js
server/worker.js      Cloudflare Worker code (for reference; it is deployed in Cloudflare, not here)
```

## Set up
1. Open `js/config.js` and put your Worker address in `url`.
2. Commit everything above to the repo and turn on GitHub Pages (Settings > Pages > main branch, / (root)).

## Common changes
- Add a plant or section: edit `js/plants.js`, then add it to `UNITS` in `server/worker.js` and paste that into the Worker.
- Server settings (GH_TOKEN, GH_REPO, SECRET, USERS, USERS_COKE_OVEN_EI) are in Cloudflare, never in this repo.
- Do not put `master.json` or any records in this repo. This repo is public.
