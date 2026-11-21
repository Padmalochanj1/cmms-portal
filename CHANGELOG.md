# Plant Management Portal: Change Log

Worker = the Cloudflare file `worker.js`. Where a change needs a new Worker, the version is shown.

## 20 Nov 2026
**Order details popup and procedures** (Worker 3.4)
- Every order number is now a link (Dashboard, Order closing, Closure report, Tomorrow's orders, Create order list, Admin histories). Clicking it opens a popup with, in this order: Order No, Equipment details, Order details, Procedure, then two expandable sections: Checklist items and Last order details.
- Checklist items shows the items of the order, with the recorded readings and results once the checklist is saved. Last order details shows the previous order of the same equipment and frequency (for a rescheduled order, the deferred original) with its closure and readings, and loads when you open it.
- Procedures: Admin > Checklist items. Select an equipment type and a frequency, type the procedure and press Save changes. It is shown in the order popup and above the checklist when the order is closed. Management users see it read-only.
- New Worker action `order_detail` (read-only, every role).

**New order type IO - Improvement Order in Create order** (Worker 3.3)
- Types are now PM, CM, IM, OM and IO. An IO order number starts with IO, for example `IO-0001-261121-01`.
- To add another type later, edit two places: `OTYPES` in `js/app.js` (the list shown in the form) and the list `['PM', 'CM', 'IM', 'OM', 'IO']` in `worker.js` (the check when saving).

**Area-wise levelled workload (one rule for every plant)** (website only, no Worker change)
- Admin > Maintenance scheduling > *Level the daily workload*: choose the effective date, Preview, then Apply and save.
- From the effective date the areas are taken in the order of the numbers in "Assigned day for each location" (1 to 7), starting with the weekday of the effective date. An area stays together on a day; when a day is full the rest moves to the next day, so all 7 days carry about the same number of orders.
- New "Day" column in Equipment details ("By area" = follows its area). New equipment follows its area.
- Within its weekday an equipment is due every 1, 2, 4, 13, 26 or 52 whole weeks (Weekly, Fortnightly, Monthly, Quarterly, Half-yearly, Yearly).
- Before the effective date, or while it is empty, the old location-day rule applies, so earlier orders and reports do not change.
- Tested: RMHS 15 to 21 orders a day (was up to 136), Coal Washery 17 to 26 (was 4 to 79), Coke Oven trial 24 to 32 (was 6 to 202). Some days carry 3 areas where small areas cannot fill a day.
- RMHS is already switched on from 20/11/2026.

**New plant RMHS, section E&I** (Worker 3.2)
- Plant added to the sign-in page; users are the Cloudflare secret `USERS_RMHS_EI`; data folder `rmhs-ei/`.
- 181 equipment loaded from your register (EQ-0001 to EQ-0181), "Electrical_Panel" corrected to "Electrical Panel", criticality Medium, schedule start 20/11/2026.

## 19 Nov 2026
**Notification type and order types** (Worker 3.1)
- New notification type **Interruption**.
- Create order now needs a **Type of order**: PM, CM, IM or OM. The type starts the order number, for example `CM-0001-261119-01`.
- MTTR / MTBF source "Additional orders" became "Corrective (CM) orders".

**Password buttons moved into the profile page** (website only)
- "Change password" and "Reset a user's password" are removed from the index page. They are in the profile page, and the forms stay closed until the button is pressed.
- Operation sections get a short profile page (User Type, Username and the two buttons).

## 18 Nov 2026
**MTTR / MTBF tab** (Worker 3.0)
- New tab and index tile, view only for all roles. Monthly and Yearly views, overall, by area and by equipment, with availability.
- Failures from Breakdown notifications (default), Attention-action orders and CM Additional orders. Operating hours per day can be set.

**User profiles, E&I sections only** (Worker 2.9)
- Click your name on the index page to open My profile: Name, Emp. Code, User Type, Department, Function, and the password buttons.
- Only the administrator edits profiles ("Edit user profiles" at the bottom). Details are stored in `profiles.json`.
- The app shows the user's Name; the user type is no longer shown. "Closed by", "Logged by" and "Created by" show names.

**Create order tile on the index page** (website only)

**Deferred orders, Create order tab, corrective orders** (Worker 2.8)
- Defer now needs a **new date**. The deferred order stays DEFERRED on its date and a new order (`-R1`, `-R2`, ...) appears on the new date.
- New **Create order** tab for every role: an additional order without a checklist, closed directly in Order closing.
- An Attention result in a checklist now also creates a corrective order (`ACT-...`, type CM) due on the closing date.
- These orders are stored in `extras/YYYY-MM.json` and appear on the Dashboard, Tomorrow's orders and Closure report.

**Management access to Admin, and the Compliance tab** (Worker 2.7)
- Management users see the Admin tab (view only), except Maintenance scheduling.
- New **Compliance** sub-tab: Weekly, Monthly and Yearly (January to December), by day or week, location and frequency. Compliance counts from the date set in the tab (default 01/11/2026).

## Data and settings added
- Data repo files: `extras/YYYY-MM.json`, `profiles.json`, and the folder `rmhs-ei/`.
- `master.json`: `settings.complianceFrom`, `settings.balanceFrom`, and `day` on each equipment.
- Cloudflare secret: `USERS_RMHS_EI`.

## To do when you upload
- Website repo: upload everything in the `website` folder.
- Cloudflare: paste `cloudflare/worker.js` (version 3.2) and deploy.
- Data repo: upload `data-repo/rmhs-ei/master.json`.
- Coal Washery and Coke Oven: each admin sets the effective date once in Level the daily workload. Coke Oven also needs its frequencies ticked and start dates set.
