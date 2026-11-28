# Plant Management Portal: Change Log

Worker = the Cloudflare file `worker.js`. Where a change needs a new Worker, the version is shown.

## 28 Nov 2026 (4)
**Operation dashboard: coloured top tiles** (new website files; the Worker is unchanged)
- The tiles at the top of the Operation dashboard (Coke Oven and Coal Washery) now take the colour of the section and charts they open, the same colours as the charts of that section (for example Production green, Stock blue, Dispatch orange, Quality violet, Delay red). Each section heading below has a bar of the same colour. Clicking a tile still jumps to its section.

## 28 Nov 2026 (3)
**Analytics: targets, trends, bad actors, work mix, CSV** (new website files; the Worker is unchanged)
- **Trends** (Yearly): MTTR, MTBF, availability and failures month by month, for all areas or one area, with a dashed target line. Points that miss the target are red. The administrator sets the targets (MTTR maximum, MTBF minimum, availability minimum) and the repeat failure rule; they are stored in the portal data (`master.json`, settings) and every table of the page shows a figure that misses its target in red.
- **Bad actors:** top 10 equipment by downtime and by failures, a ranked list with MTTR and MTBF, and a **repeat failure** flag (default: 3 or more failures within 30 days), with a filter to show only those.
- **Work mix:** breakdown notifications, attention action orders, corrective (CM) orders and other additional orders per area, and how many orders are not closed.
- **Download CSV:** the period's area table, equipment table and the list of failures as a file for Excel. **Print** gives the printable page as before.
- **HOD overview:** every maintenance card now also shows the MTTR and MTBF of the month so far.

## 28 Nov 2026 (2)
**MTTR / MTBF page renamed Analytics, with an area view** (new website files; the Worker is unchanged)
- The tab, the landing tile, the HOD overview link and the printed heading now say **Analytics**. The page address (`#reliability`) is unchanged, so saved links still work.
- New switch **By equipment / By area**. The area view compares all areas (failures, downtime, MTTR and MTBF as bars, longest repair and shortest MTBF first), lists them with share of downtime and availability, and has an **Area detail** selector: KPIs of the chosen area, its month by month figures (Yearly) and its equipment.
- Same period, operating hours and failure sources as before; the figures of an area use the same formulas as the overview.

## 28 Nov 2026
**Operation Dashboard link for every user of the plant** (Worker 4.9, new website files)
- After sign-in, every user of Coal Washery and Coke Oven (Electrical, Mechanical, Operation and HOD) sees a tile **Operation Dashboard**. Electrical and Mechanical users get the Dashboard page only, view only: no entry, reports or settings, whatever their role in their own section. Operation users and HODs open the Operation dashboard of their own access. RMHS has no Operation section, so it shows no tile.
- Worker: `dpr_load` with `sec: "ops"` is now answered for Electrical and Mechanical users, read only. Every other Operation action is still refused for them.

## 27 Nov 2026 (3)
**E&I renamed to Electrical** (Worker 4.8, new website files)
- The section is now called "Electrical" everywhere it is shown: sign-in section list, page headings and titles, the HOD overview, and the unit names the Worker reports (Coal Washery Electrical, Coke Oven Electrical, RMHS Electrical). Internal names (section id `ei`, data folders `*-ei/`, secrets `USERS_*_EI`) are unchanged, so no data or secret has to be moved.
- Worker: login-log entries written from now on use the new unit names. Older log lines keep "E&I".

## 27 Nov 2026 (2)
**Coal Washery Operation: Daily Production Report and dashboard** (Worker 4.7, new website files)
- Coal Washery now has the same Operation section as Coke Oven: Dashboard, Daily entry, Reports and Settings, built from `Coal_Washery_DPR_-NOVEMBER-2026.xlsx` (new files `pages/cw-ops.html`, `js/cw-schema.js`, `js/cw-dpr.js`, `js/cw-xlsx.js`). Roles: Administrator, Data Entry, Management and HOD.
- **Dashboard:** Production and Process are the first two sections. Production: raw coal charged, clean coal, middlings / rejects, month to date. Process: clean coal yield (moisture adjusted), process loss and balancing, feed rate, magnetite and anionic, running time. Then raw coal receipt and stock, clean coal and middlings stock and despatch, power and water, quality (raw coal, clean coal, middlings) and the delay report.
- **Daily entry** follows the Excel columns (Raw Coal Charged, Production, Yield, Chemicals, Utility, Down time, Quality) and adds the stock sheets (RM Daywise: receiving and interunit transfer; FG Daywise: clean coal and middlings despatch). Stocks carry from day to day. "Upload DPR Excel" reads one date from the workbook (sheets DPR, RM Daywise, FG Daywise).
- Settings: raw coal capacity per day (0 = not set), standard running minutes, process loss % (0.5) and magnetite factor (1.19).
- Setup: `USERS_COAL_WASHERY_OPS` now holds the Operation users of all roles (admin, entry, mgmt, hod). Data folder `coal-washery-ops/` in the data repo; the files `settings.json` and `data/2026-11.json` (the 25 days of November from the sheet) are supplied.
- The HOD overview shows a Coal Washery Operation card, and the HOD can open the full Operation pages.

## 27 Nov 2026
**HOD moved into the Operation section as a user type** (Worker 4.6, new website files)
- The sign-in section "HOD (all sections)" is removed. An HOD now selects the plant and **Operation**, and signs in with a user of type **HOD**. After sign-in the HOD sees the same HOD overview as before (every section of the plant, view only).
- Users: put the HOD users in `USERS_COKE_OVEN_OPS` with role `hod`, e.g. `"hod01":["ChangeMe-01","hod"]`. For Coal Washery use the new secret `USERS_COAL_WASHERY_OPS` (HOD users only; the Coal Washery Operation section itself is still coming soon). The secrets `USERS_COKE_OVEN_HOD` and `USERS_COAL_WASHERY_HOD` are no longer used and can be deleted.
- The Worker still refuses every write action for an HOD. The Operation administrator sees HOD users in the profile and password-reset lists.

## 26 Nov 2026
**HOD interface for Coke Oven and Coal Washery** (Worker 4.2, new website files)
- New sign-in section "HOD (all sections)" for both plants. One HOD overview page shows the state of E&I, Mechanical and Operation (Coal Washery: E&I and Mechanical), and "Open full view" opens the management pages of each section. Everything is view only for the HOD.
- The HOD reads each section as a management user; the Worker refuses every write action and every other plant. Users are the secrets `USERS_COKE_OVEN_HOD` and `USERS_COAL_WASHERY_HOD` (role `hod`). See `HOD-SETUP.txt`.

## 25 Nov 2026
**Excel upload in Coke Oven Operation > Daily entry** (website only, no Worker change)
- New button "Upload DPR Excel" next to the date. Choose the date, press the button and pick your DPR Excel sheet (.xlsx, same layout as the sheet you gave me). The row of that date is read in the browser and the entry screen is filled; the file is not sent anywhere.
- If the date is not in the sheet, or its row has no data, a message pops up: "Please upload updated DPR sheet".
- The user then checks the values, changes anything if required and presses Save. Nothing is saved by the upload itself. Opening stock and belt initial readings are taken only where they are typed in the Excel sheet; the five coal columns are the sum of the Excel coal columns of each coal type.
- A file that is not in the DPR layout is refused with a message.

## 24 Nov 2026 (2)
**New section Mechanical for Coal Washery and Coke Oven** (Worker 4.1, new website files)
- Both plants now show E&I, Mechanical and Operation on the sign-in page. Each Mechanical section is separate from E&I: its own users (secrets `USERS_COAL_WASHERY_MECH` and `USERS_COKE_OVEN_MECH`), its own data folder (`coal-washery-mech/`, `coke-oven-mech/`), orders, notifications, checklists, profiles and login history.
- Same pages, layout and logic as E&I. Equipment types, areas and equipment are loaded later by replacing the section's `master.json` with the JSON converted from Excel (layout in `MASTER-FORMAT.md`). Until then every page opens with an empty list.

## 24 Nov 2026
**Fix: saving a checklist failed with "clean is not defined"** (Worker 4.0.1, no website change)
- When the old Coke Oven Operation code was removed in Worker 4.0, a helper that E&I also uses to save closures and checklists was removed with it. It is restored. Saving a checklist and closing an order work again in all E&I plants; checked with order `INSP_WEEK-0044-261124`.
- Worker 4.0 must be replaced by 4.0.1; only the Worker needs to be redeployed.

## 23 Nov 2026
**Coke Oven Operation rebuilt as the Daily Production Report (DPR) from your Excel sheet** (Worker 4.0, new website files)
- The old Coke Oven Operation screens, settings and back end are removed (`ops.js`, `ops-logic.js`, `ops.css` and the old Worker code). The data folder is now `coke-oven-dpr/`; delete the old `coke-oven-ops/` folder in the data repo. Users and roles (`USERS_COKE_OVEN_OPS`: admin, entry, mgmt) are unchanged.
- **Daily entry:** the same sections and headings as the Excel sheet, in the same order. Blue cells are calculated live as you type, white cells are typed. Opening stocks and initial belt readings carry over from the previous day (type a value only to correct them).
- **Cokeoven / Self Consumption of Raw Material (MT):** the coal columns are now 1. PHCC, 2. SHCC, 3. SSCC, 4. PCI, 5. Indigenous, with TOTAL Cons. as their sum, as in the Excel formula.
- **Reports:** Month sheet (every section, days as rows, calculated columns shaded, month total/average/last row), Day report (all sections of one date), Month summary (finished goods summary as in the Excel summary block, plus every month figure), CSV download of the whole sheet, and Print.
- **Dashboard:** KPI cards and 11 sections in the Excel order (stock, production, dispatch, raw material, power/water/steam, delay, charging coal quality, coke quality, safety, process, belt readings) with interactive charts, tooltips, legend toggles and a month selector.
- **Settings (admin):** annual capacity (250,000), steam capacity (82 TPH), standard running minutes (1440), monthly belt reset, and removal of a day.
- Excel data of 1 to 20 November 2026 is loaded (`data-repo/coke-oven-dpr/`). The calculations were checked against 1,360 Excel values; the only differences are 3 cells that are typed numbers in the Excel sheet.

## 21 Nov 2026
**Login log for the whole website** (Worker 3.5, no change in the website)
- Every sign-in attempt for every plant and section is written to the data repo: `logs/login-YYYY-MM-DD.json` at the top of the repo, one file per day (Indian date), newest entry last. There is no screen for it in the website.
- Each entry has: Indian time (`ist`) and UTC time (`t`), plant, section, user name as typed, result (success or failed), reason for a failure (wrong password, unknown user, locked after too many wrong attempts, no valid role), role and unit for a success, IP address, country, browser, and whether a password change was required. Passwords are never written.
- A problem with writing the log never stops a sign-in. A file holds at most 3000 entries a day.

## 20 Nov 2026
**Back to Order closing after saving a checklist** (website only)
- When the checklist is opened from Order closing (Checklist button), saving it returns to Order closing, where the order is ready to close. A checklist opened from the Closure report returns to the Closure report. A checklist chosen from the Checklist closing tab stays on that tab.

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
