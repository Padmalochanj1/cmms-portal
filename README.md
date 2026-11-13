# Plant Management Portal (website)

Static website for GitHub Pages. Data is NOT stored here: it lives in the private data repo, reached through the Cloudflare Worker.

```
index.html            Landing page and sign-in (must stay at the top level)
pages/app.html        E&I screens: Dashboard, Order closing, Closure report, Checklist, Tomorrow, Notifications, Admin
pages/ops.html        Operation screens (Coke Oven): Management dashboard, Data entry, Records, Reports, Settings
css/                  style.css (E&I screens), ops.css (Operation screens), landing.css (landing page)
js/                   config.js (server address), plants.js (plants and sections), landing.js,
                      app.js + logic.js (E&I screens), ops.js + ops-logic.js (Operation screens)
server/worker.js      Cloudflare Worker code (for reference; it is deployed in Cloudflare, not here)
```

## Set up
1. Open `js/config.js` and put your Worker address in `url`.
2. Commit everything above to the repo and turn on GitHub Pages (Settings > Pages > main branch, / (root)).

## Common changes
- Add a plant or section: edit `js/plants.js`, then add it to `UNITS` in `server/worker.js` and paste that into the Worker.
- Server settings (GH_TOKEN, GH_REPO, SECRET, USERS, USERS_COKE_OVEN_EI) are in Cloudflare, never in this repo.
- Do not put `master.json` or any records in this repo. This repo is public.

## User roles
- E&I sections (Coal Washery and Coke Oven): `admin` (full access, admin pages), `user` (closing, checklist, notifications), `mgmt` (Management: view only - Dashboard, Closure report, Tomorrow's orders, Notifications list).
- Operation section: `admin` (Administrator), `entry` (Data entry), `mgmt` (Management).
- Roles are set in the Cloudflare secret next to each password, for example {"admin":["pw1","admin"],"user01":["pw2","user"],"manager":["pw3","mgmt"]}.

## Start and end time (E&I)
Every maintenance order has a Start time and End time on Order closing and Closure report. Both are required to Close an order (optional when deferring). They are saved with the closure record and shown in the Admin closure history with the duration. A time typed but not yet saved is kept in the browser on the same computer.
