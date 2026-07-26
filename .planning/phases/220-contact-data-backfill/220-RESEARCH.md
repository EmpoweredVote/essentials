# Phase 220: Contact Data Backfill - Research

**Researched:** 2026-07-24
**Domain:** Municipal contact-data sourcing (Texas general-law cities) — this phase's research IS a web-sourcing sweep. The DB write mechanics (idempotent SQL migrations against `essentials.politicians`, same 23-gov brownfield model as Phases 218/219) are already locked in CONTEXT.md; the unknown this document resolves is the **actual, citable `web_form_url` and `email_addresses` value per city**, because gsd-executor has no web tools.
**Confidence:** HIGH on the 21 cities with a direct primary-source fetch (city's own council roster page + form page, this session); LOW/GAP on 3 cities (Josephine, Plano, Richardson) whose official sites blocked automated fetch — flagged explicitly below, not guessed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (web_form_url):** Source the city's SINGLE official contact-form URL (CivicPlus
  `/FormCenter`, a "Contact the City Council" form, or the most official/durable published
  submittable form). This one URL applies to EVERY official of that city. A plain
  contact/listing/mailto page does NOT qualify (D-04) — only a submittable form. Blank only
  where the city publishes no form at all.
- **D-02 (email):** Seat-specific / role aliases YES (e.g. `District1@city.org`,
  `mayor@city.org`) and published personal addresses YES. Generic city catch-alls (`info@`,
  `council@`, `cityhall@`) NO — do not record those as an official's email. Where only a
  generic alias exists, record "no qualifying email; rely on form."
- **D-03 (valid_to):** Already ~100% populated from 218/219 seeding; NOT a sourcing target.
  Only a light spot-check approach (representative sample) is needed — see Spot-Check section
  below.
- **D-05:** Evidence-only, cited. NEVER fabricate a URL or email. Honest-blank where nothing
  qualifying is published.

### Claude's Discretion
- Per-city sourcing order, and which of the 9 fully-missing email cities to work first —
  planner/researcher choose. (This research worked the 9 fully-missing cities first, then the
  6 partials, then the remaining 9 — see Per-City table for the exact order.)
- Exact `web_form_url` value per city (top-level `/FormCenter`, a specific "Contact the City
  Council" form, or the department form) — pick the most official/durable published form URL.
  Judgment calls made this session are flagged inline in the Per-City table.
- How thoroughly to spot-check `valid_to` (D-03) — see Spot-Check section (5-city sample).

### Deferred Ideas (OUT OF SCOPE)
- `urls[]` backfill — already broadly populated, not a phase deliverable.
- Compass stances — deferred this milestone (local-compass-question lock).
- Collin County Headshots → Phase 221.
- Collin County Stances → Phase 222.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLLIN-CONTACT-01 | `web_form_url` populated where the city publishes a contact form or official contact page. | Per-City table gives a sourced form URL (or documented NONE FOUND) for all 24 rows; Pattern 1 gives the seeding recipe; Pitfall 1 explains the mailto-vs-form distinction that disqualifies several candidates. |
| COLLIN-CONTACT-02 | Email addresses filled for the fully-missing/partial cities where publicly listed. | Per-City table gives every sourced seat→email mapping (or documented NONE PUBLISHED) with source URL; Pattern 2 gives the seat-alias-vs-personal-vs-generic sourcing rule; Pitfall 2 (Cloudflare/JS obfuscation) explains how several "hidden" emails were recovered. |
| COLLIN-CONTACT-03 | `valid_to` populated where publicly documented. | Spot-Check section gives a 5-city sample plan and one live-caught discrepancy (Saint Paul roster reshuffle) that the planner should fold into the sample. |
</phase_requirements>

## Summary

Every requirement in this phase reduces to one activity: read each of the 24 browse cities'
official website and record what it actually publishes. There is no framework, library, or
architecture decision to make — the schema and write path are already fully specified in
CONTEXT.md and proven by Phases 218/219 (idempotent `UPDATE ... WHERE NOT EXISTS`-style seeding
against `essentials.politicians.web_form_url` / `email_addresses`, scoped by
`governments(geo_id) → chambers → offices → politicians`). This session did the sourcing sweep
directly (WebSearch + WebFetch + raw `curl`/Node decoding where a site obfuscates emails) so the
planner and executor deal only in citable per-city facts, not TODOs.

**Result: 21 of 24 cities are fully or mostly resolved this session** (either a real form URL, a
real batch of seat-specific emails, or a documented honest-blank for both). **3 cities blocked
automated fetch entirely** — Josephine (Cloudflare 307 redirect loop), Plano (JS-rendered
CivicPlus "content.civicplus.com" platform, roster loads via an unauthenticated API this session
couldn't reverse-engineer), and Richardson (403 WAF on every path tried). These three need a
JS-capable fetch (Playwright, matching the established `/find-headshots` WAF-fallback pattern
used repeatedly in this milestone) at execute time or by the human operator — **not** by
gsd-executor, which has no web tools at all.

**A second, more consequential finding surfaced mid-sourcing:** live-fetching Frisco's own
`friscotexas.gov/1970/Jared-Elad-Place-4` bio page today (2026-07-24) states Jared Elad is the
**current sitting** Place 4 councilmember ("Elected to Frisco City Council: 2025... Current Term
Expires: May 2028"), and Ballotpedia's summary of the June 2025 runoff agrees ("Elad held the
Place 4 seat after besting... Gopal Ponangi"). This **directly contradicts** migration `1404`
(applied 2026-07-24, this same day, as part of the Phase 219 close), which cites the Collin County
official canvass PDF/xlsx to seat **Ponangi** as the winner (3,826–3,274, 53.89%) and retire Elad
as the loser. This is flagged as a high-priority open question, not resolved by this research —
see Pitfall 3.

**Primary recommendation:** Group migrations by field, not by city — one migration seeding
`web_form_url` across every city with a sourced form (idempotent, single `UPDATE ... FROM
(VALUES ...)` keyed on `governments.geo_id`), and one migration (or a couple, split by whether
the value is a seat alias vs. a personal address) seeding `email_addresses` per office. Resolve
the Frisco Place 4 officeholder discrepancy (Pitfall 3) as a `checkpoint:human-verify` gate
**before** writing Frisco's contact data, so contact info doesn't get attached to a possibly-wrong
`politician_id`. Treat Josephine/Plano/Richardson as a third, smaller migration deferred until a
Playwright-capable session (or the human operator) confirms their data — don't block the other 21
cities on these 3.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Contact-data research (which form URL, which emails) | External research (city websites, this session) | — | Ground-truth civic data; not derivable from code or the existing DB |
| Contact-data row seeding | Database (`essentials.politicians.web_form_url` / `.email_addresses`, Supabase Postgres) | — | Idempotent SQL migrations against production via `C:/EV-Accounts` |
| Display of seeded contact data | Frontend (`@empoweredvote/ev-ui` `PoliticianProfile` component, npm-installed, NOT in `essentials/src`) | `essentials/src/pages/Profile.jsx` (passes `pol` straight through, zero mapping) | **Verified this session** (see Display Verification below): the installed `ev-ui@0.10.1` bundle reads `pol.web_form_url` (renders as a prominent CTA button) and `pol.email_addresses` (renders in a "Contact Information" section) directly off the politician object. No frontend code change needed — the fields already display the instant they're populated. |
| Officeholder identity (who currently holds a given office) | Database (`essentials.politicians`, seeded by Phases 218/219) | — | Phase 220 assumes the correct person is already seated; Pitfall 3 flags one case where this assumption may be wrong |

**No frontend or backend code changes are required or in scope for this phase** — 100% SQL data
migrations against production via `C:/EV-Accounts`, confirmed against the actual installed UI
bundle (not assumed).

### Display Verification (resolves the CONTEXT.md canonical_refs open item)

CONTEXT.md's canonical_refs section asked research to "confirm which fields the profile UI
surfaces... to ensure D-04's 'working method' actually displays." Grepping `essentials/src` for
`web_form_url`/`email_addresses` returns **zero matches** — because the rendering logic lives
inside the installed `node_modules/@empoweredvote/ev-ui` package (imported as
`<PoliticianProfile politician={pol} .../>` in `src/pages/Profile.jsx:97`), not in this repo.
Decompiling the installed bundle (`node_modules/@empoweredvote/ev-ui/dist/index.js`, v0.10.1)
confirms:

```js
// pol.web_form_url renders as a styled CTA link near the top of the profile:
pol.web_form_url && React.createElement("a", { href: pol.web_form_url, target: "_blank", ... })

// pol.email_addresses renders in the "Contact Information" section:
(pol.email_addresses || []).forEach((email) => {
  if (email && email.trim()) { emailsByType["General"].push(email.trim()); }
});
```

Both fields are read directly off the politician object with no transformation — **confirmed:
no frontend change needed this phase**, matching CONTEXT.md's premise. [VERIFIED: installed
ev-ui 0.10.1 bundle, decompiled this session]

## Standard Stack

Not applicable in the traditional sense — no libraries/frameworks installed. The "stack" is the
established brownfield migration toolchain, unchanged from Phases 218/219.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Raw SQL migrations (`C:/EV-Accounts/backend/migrations/NNNN_*.sql`) | Next available: **1405** (last applied = 1404, `frisco_place4_seat_gopal_ponangi.sql`, verify at execute time in case a quick task lands in between) | Idempotent contact-field seeding | Same mechanism as every prior deep-seed/backfill phase (218, 219) |
| `npx tsx scripts/_apply-migration-NNNN_*.ts` (run from `C:/EV-Accounts/backend`) | — | Apply + inline SQL-gate verification | 218/219 convention; gsd-executor has no Supabase MCP |
| `git -C "C:/EV-Accounts" push origin master` | — | Deploy (Render auto-deploy) | [[no_git_in_ev_accounts]] / [[backend_architecture]] |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `WebSearch` / `WebFetch` | Roster/form discovery | Already executed this session for 21/24 cities |
| Raw `curl -L -A "Mozilla/5.0"` + a small Node XOR-decode script | Recover Cloudflare `/cdn-cgi/l/email-protection` obfuscated emails, and inspect raw HTML the WebFetch markdown conversion silently drops (e.g. JS `document.write` email assembly) | Frisco, McKinney, Celina, Parker all used this — see Pitfall 2 |
| Playwright (via `/find-headshots`-style fallback) | Recover Josephine (307 loop), Plano (JS-rendered roster), Richardson (403 WAF) | Execute time, or a human operator session — NOT gsd-executor (no web tools at all) |

## Per-City Sourcing Table

Legend: **Form** = `web_form_url` candidate. **Emails** = sourced seat→email mappings.
**Src** = the exact page(s) read. Cities are grouped in the priority order CONTEXT.md specified.

### Group 1 — Fully-missing email (9 cities, worked first)

| City (geo_id) | Form (web_form_url) | Emails found | Source(s) |
|---|---|---|---|
| **Anna** (4803300) | Borderline: only submittable form found is **"Request to Contact Mayor Cain"** — `https://www.annatexas.gov/FormCenter/City-Secretarys-Office-6/Request-to-Contact-Mayor-Cain-38`. This is mayor-named, not a general council form — planner should decide whether to apply it to the Mayor seat only (safer) or treat as NONE FOUND city-wide (D-01 wants one form for **every** official; a mayor-only form arguably doesn't qualify). No page found offering a broader form. | **None published.** Council roster page and staff directory list all 7 names (Mayor Pete Cain, Places 1–6) with no email column at all — only phone/mail. | `annatexas.gov/319/City-Council`, `/directory.aspx?did=4`, `/FormCenter`, `/FormCenter/City-Secretarys-Office-6` |
| **Farmersville** (4825488) | **`https://www.farmersvilletx.com/contact-us`** — confirmed via raw HTML: an embedded Drupal Webform (`webform-submission-general-contact-add-form`, action=`/contact-us`, reCAPTCHA-protected) titled "Submit A Request." Genuine city-wide submittable form. | **None published as plain text.** The council-roster page (`/city-council`) links each of 6 members (Mayor Overstreet + Places 1–5) via `/email-contact/node/N/field_email` — a Drupal anti-spam **click-to-message form per person**, not an exposed address. No raw email string exists in the HTML to record. | `farmersvilletx.com/contact-us` (raw HTML), `/city-council` |
| **Frisco** (4827684) | **NONE FOUND.** FormCenter has only "Mayor/Council Member Appearance Request" and "Document of Recognition Request" (both ceremonial, not general contact) — no city-wide contact form exists. | **All 7 sourced**, personal pattern `{firstinitial}{lastname}@friscotexas.gov` (Cloudflare-obfuscated on the page; decoded via raw HTML + Node XOR script — see Pitfall 2): Mayor Mark Hill `mhill@friscotexas.gov`; Place 1 Ann Anderson `aanderson@friscotexas.gov`; Place 2 Burt Thakur `bthakur@friscotexas.gov`; Place 3 Angelia Pelham `apelham@friscotexas.gov`; **Place 4 — SEE PITFALL 3, do not seed until resolved**; Place 5 Laura Rummel `lrummel@friscotexas.gov`; Place 6 Brittany Colberg `bcolberg@friscotexas.gov`. | `friscotexas.gov/directory.aspx?did=38` (raw HTML), `/FormCenter`, `/FormCenter/City-Managers-Office-27` |
| **Lavon** (4841800) | **`https://lavontx.gov/contact-us/`** — general contact form with Name/Phone/Email/Street Address/Department dropdown/Subject/Message; dropdown includes a council-member option per WebFetch. Genuine city-wide form. | **None published.** Both the current `lavontx.gov/city-council/` roster and the legacy `cityoflavon.com` mirror (301-redirects to the same site) show only names/titles, no addresses. | `lavontx.gov/contact-us/`, `/city-council/` |
| **Longview** (4843888, Gregg Co. but in-scope) | **`https://longviewtexas.gov/FormCenter/Contact-Us-5/City-Council-44`** — confirmed genuine "City Council" contact form (First/Last Name, Email\*, Phone, Street Address\*, Question/Comment\*, reCAPTCHA). | **None published individually** — the council page (`/2198/City-Council`) shows only a general "Email" link for the office as a whole (a group alias, excluded per D-02). **Note:** this same page confirms **Brandon Smith is now shown as District 3** (matches migration 1400's fix; Wray Wade does not appear) — no discrepancy here, unlike Frisco. | `longviewtexas.gov/2198/City-Council`, `/FormCenter/Contact-Us-5/City-Council-44` |
| **Murphy** (4850100) | **`https://www.murphytx.org/1967/Contact-Council`** — hosts a genuine "Public Comment Form" via CognitoForms (`cognitoforms.com/CityOfMurphy1/PublicCommentForm`); cite the city page as the durable URL. | **None published.** `Directory.aspx?DID=5` lists Mayor Scott Bradley + Places 1–6 with zero emails shown. | `murphytx.org/1967/Contact-Council`, `/Directory.aspx?DID=5` |
| **Princeton** (4859576) | **`https://princetontx.gov/FormCenter/Contact-Us-4/Contact-Us-46`** ("Tell Us" form) — confirmed general contact form. | **All 8 sourced**, personal pattern `{firstinitial}{lastname}@princetontx.us` (note `.us` domain, not `.gov`): Mayor Eugene Escobar Jr. `eescobar@princetontx.us`; Place 1 Terrance Johnson `tjohnson@princetontx.us`; Place 2 Cristina Todd `ctodd@princetontx.us`; Place 3 Bryan Washington `BWashington@princetontx.us`; Place 4 Jaisen Rutledge `jrutledge@princetontx.us`; Place 5 Steven Deffibaugh `SDeffibaugh@princetontx.us`; Place 6 Ben Long `blong@princetontx.us`; Place 7 Carolyn David-Graves `cgraves@princetontx.us`. | `princetontx.gov/732/Terrance-Johnson` through `/738/...` (individual bio pages, raw HTML `mailto:`), `/721/Office-of-the-Mayor`, `/FormCenter/Contact-Us-4/Contact-Us-46` |
| **Prosper** (4859696) | **`https://www.prospertx.gov/FormCenter/Town-Secretary-14/Public-Comment-Request-Form-83`** ("Public Comment Request Form" — for addressing Town Council). | **All 7 sourced**, personal pattern `{initial}{lastname}@prospertx.gov` (JS `document.write` assembly, plain in raw HTML, no obfuscation needed): Mayor David F. Bristol `dbristol@prospertx.gov`; Place 1 Marcus E. Ray `mray@prospertx.gov`; Place 2 Craig Andres `craig_andres@prospertx.gov`; Place 3 (Mayor Pro-Tem) Amy Bartley `Abartley@prospertx.gov`; Place 4 (Deputy Mayor Pro-Tem) Chris Kern `ckern@prospertx.gov`; Place 5 Doug Charles `dcharles@prospertx.gov`; Place 6 Cameron Reeves `creeves@prospertx.gov`. | `prospertx.gov/directory.aspx?did=20` (raw HTML), `/formcenter`, `/FormCenter/Town-Secretary-14` |
| **Van Alstyne** (4874924) | **`https://cityofvanalstyne.us/contactus`** — confirmed via raw HTML: page embeds a genuine `mwjsForm` (Membershipware CMS) contact-form widget. | **None published.** The site's own public roster API (`app.membershipware.com/api/public/mwjsPeople`) returns `"personEmail":""` for every council member — confirmed empty at the data-source level, not just hidden in markup. | `cityofvanalstyne.us/council` (raw HTML + underlying `mwjsPeople` JSON API), `/contactus` |

### Group 2 — Partial email coverage (6 cities)

| City (geo_id) | Form (web_form_url) | Emails found | Source(s) |
|---|---|---|---|
| **Allen** (4801924) | **Ambiguous/likely NONE.** No dedicated contact form on `/services/contact_us.php`; the closest thing is **"MyAllen" / CitySourced** (`allentx.citysourced.com`), a 311-style service-request app (code violations, potholes) that requires account creation for most features — not a general "contact the council" form. Recommend NOT treating this as a qualifying D-01 form unless the planner judges the 311 app close enough; document as NONE FOUND with this caveat. | **All 7 sourced**, personal pattern `{firstinitial}{lastname}@allentx.gov` — **note domain is `allentx.gov`, not `cityofallen.org`** (the marketing/search-indexed domain): Mayor Chris Schulmeister `cschulmeister@allentx.gov`; Place 1 Michael Schaeffer `michael.schaeffer@allentx.gov`; Place 2 Tommy Baril `tommy.baril@allentx.gov`; Place 3 Ken Cook `ken.cook@allentx.gov`; Place 4 Amy Gnadt `amy.gnadt@allentx.gov`; Place 5 (Mayor Pro Tem) Carl Clemencich `carl.clemencich@allentx.gov`; Place 6 Ben Trahan `ben.trahan@allentx.gov`. | `cityofallen.org/917/Allen-City-Council` (resolves to allentx.gov content), `allentx.gov/services/contact_us.php` |
| **Fairview** (4825224) | **`https://fairviewtexas.org/contact-us/`** — confirmed via raw HTML: embeds a genuine WordPress **Ninja Forms** contact form. (Note: several stale/cached URLs from search, e.g. `/contact-us-form.html` and `/government/town-council.html`, now 404 — the site was rebuilt; use the paths in this row.) | **All 7 sourced** (previously 4/7 — now complete), personal pattern `{firstinitial}{lastname}@fairviewtexas.org`: Mayor John Hubbard `Mayor@FairviewTexas.org`; Seat 1 (Mayor Pro Tem) Rich Connelly `RConnelly@FairviewTexas.org`; Seat 2 Joe Boggs `JBoggs@FairviewTexas.org`; Seat 3 Jill Hawkins `JHawkins@FairviewTexas.org`; Seat 4 John Stanley `JStanley@FairviewTexas.org`; Seat 5 (Deputy Mayor Pro Tem) Pat Sheehan `PSheehan@FairviewTexas.org`; Seat 6 Lakia Works `LWorks@FairviewTexas.org`. | `fairviewtexas.org/government/mayor-town-council/`, `/contact-us/` (raw HTML for the Ninja Forms confirmation) |
| **Parker** (4855152) | **NONE FOUND.** Only a shared mailto `publiccomments@parkertexas.us` is published (generic alias — excluded per D-02, and a mailto is not a form per D-04). No FormCenter/submittable form found on `/444/Contact` or elsewhere. | **All 6 sourced** (previously 3/6 — now complete), personal pattern `{firstinitial}{lastname}@parkertexas.us` (Cloudflare-obfuscated, decoded): Mayor Lee Pettle `lpettle@parkertexas.us`; Place 1 Roxanne Bogdan `rbogdan@parkertexas.us`; Place 2 Colleen Halbert `chalbert@parkertexas.us`; Place 3 (Deputy Mayor Pro Tem) — email confirmed present but name/place mapping should be re-verified at execute (page ordering was ambiguous between two fetches); Place 4 Darrel Sharpe `dsharpe@parkertexas.us`; Place 6 (Mayor Pro Tem) Buddy Pilgrim `bpilgrim@parkertexas.us`; Billy Barron `bbarron@parkertexas.us`. | `parkertexas.us/76/City-Council` (raw HTML, Cloudflare-decoded), `/444/Contact` |
| **Saint Paul** (4864220) | **NONE FOUND.** `stpaultexas.us/docs/form_list.php` lists only **downloadable PDF forms** (Citizen Concern Form, Public Information Request) — these require printing/mailing, not online submission; do not count as a D-01 form. | **All 6 sourced** (previously 4/6 — now complete), personal pattern `{firstname}.{lastname}@stpaultexas.us`: Mayor JT Trevino `JT.trevino@stpaultexas.us` (confirmed directly on `/local_government/elected_officials/mayor.php`); Seat 1 Larry Nail `larry.nail@stpaultexas.us`; Seat 2 (Mayor Pro-tem) David Dryden `david.dryden@stpaultexas.us`; Seat 3 Gregory Pierson `greg.pierson@stpaultexas.us`; Seat 4 Kristen Bewley `kristen.bewley@stpaultexas.us`; Seat 5 Robert Simmons `robert.simmons@stpaultexas.us`. **Roster-reshuffle note:** an earlier WebSearch snapshot showed different Seat 3/4 occupants (Justin Graham, J.T. Trevino as alderman) — the direct page fetch above is the current ground truth and should be trusted over cached search summaries; fold into the Phase 220 valid_to spot-check (see below). | `stpaultexas.us/local_government/elected_officials/seats_1-5.php`, `/mayor.php`, `/docs/form_list.php` |
| **Weston** (4877740) | **NONE FOUND.** Only a generic mailto `cityhall@westontexas.com` / `TownHall@westontexas.com` published — excluded per D-02/D-04 (generic + not a form). | **All 6 sourced** (previously 5/6 — now complete), personal pattern `{firstinitial}{lastname}@westontexas.com`: Mayor Matt Marchiori `mmarchiori@westontexas.com`; Jeff Metzger `jmetzger@westontexas.com`; Patti Harrington `pharrington@westontexas.com`; Mike Hill `mhill@westontexas.com`; Marla Johnston `mjohnston@westontexas.com`; Brian Roach `broach@westontexas.com`. **Minor note:** two fetches disagreed on which of Metzger/Roach holds the "Mayor Pro Tem" title — doesn't affect the email value, flag for execute-time title confirm only. | `westontexas.com/page/Mayor_Aldermen`, `/page/contact_us` |
| **Celina** (4813684) | **NONE FOUND.** Checked FormCenter root + City Secretary + City Manager's Office categories — only department-specific forms (Proclamations, Youth Council application), no general contact/council form. | **All 7 sourced** (previously 1/7 — now complete), personal pattern `{firstinitial}{lastname}@celina-tx.gov` (Cloudflare-obfuscated, decoded): Mayor Ryan Tubbs `rtubbs@celina-tx.gov`; Place 1 Philip Ferguson `pferguson@celina-tx.gov`; Place 2 Eddie Cawlfield `ecawlfield@celina-tx.gov`; Place 3 (Deputy Mayor Pro Tem) Andy Hopkins `ahopkins@celina-tx.gov`; Place 4 Shea B. Scott `sbscott@celina-tx.gov`; Place 5 Shane R. Lambert `rlambert@celina-tx.gov`; Place 6 (Mayor Pro Tem) Brandon Grumbles `bgrumbles@celina-tx.gov`. | `celina-tx.gov/Directory.aspx?did=4` (raw HTML, Cloudflare-decoded), `/FormCenter`, `/FormCenter/City-Secretary-11`, `/FormCenter/City-Managers-Office-16` |

### Group 3 — Remaining cities (9, form URL still needed for all)

| City (geo_id) | Form (web_form_url) | Emails found | Source(s) |
|---|---|---|---|
| **Blue Ridge** (4808872) | **`https://blueridgecity.com/contact-us`** — confirmed general form with department dropdown (Name/Email/Phone/Subject/Message). | **All 6 sourced**, genuine **seat-alias** pattern (qualifies per D-02's own example): Mayor Rhonda Williams `mayor@blueridgecity.com`; David Apple `council1@blueridgecity.com`; Linda Braly (Mayor Pro Tem) `council2@blueridgecity.com`; Trenton Sissom `council3@blueridgecity.com`; Wendy Mattingly `council4@blueridgecity.com`; Keith Chitwood `council5@blueridgecity.com`. | `blueridgecity.com/council`, `/contact-us` |
| **Josephine** (4838068) | **GAP — site WAF-blocks automated fetch.** `cityofjosephinetx.com/government/city-council/` and `/contact-us/` both returned an HTTP 307 redirect loop to every fetch attempt (WebFetch and raw `curl -L`, standard + browser UA) — consistent with a Cloudflare/bot-challenge. Not attempted further this session. | **GAP — same block.** WebSearch confirms current roster names only (Mayor Jason Turney; Places 1–5: April Aurand, Jane Ridgway, Alex Esquivel, Pam Sardo, Gary Chappell — one search snapshot showed a different Place 1/2 pairing, Doug Ewing/Brad Ahlfingers, so **re-verify the current roster at execute time too**), no emails recoverable. Only a generic `ub@cityofjosephinetx.com` (utility billing) surfaced — excluded per D-02 regardless. | WebSearch snapshots only; direct fetch failed (307 loop) on `cityofjosephinetx.com/*` |
| **Lowry Crossing** (4844308) | **NONE FOUND.** `/contact/report_a_concern.php` links only a **downloadable PDF** ("Citizens-Complaint-Form.pdf") — not a submittable web form. `/contact/_city_hall.php` has emails/phone but no form. | **All 9 sourced** (Mayor + 4 wards × 2 each), personal addresses (mixed `.org`/`.com` — note the exact TLD per person): Mayor Pat Kelly `pkelly@lowrycrossingtexas.org`; Ward 1: Scott Pitchure `spitchure@lowrycrossingtexas.org`, Chris Madrid `cmadrid@lowrycrossingtexas.org`; Ward 2: Tammy Hodges (Mayor Pro Tem) `thodges@lowrycrossingtexas.org`, Agur Rios `agur@lowrycrossingtexas.org`; Ward 3: Eusebio "Joe" Trujillo III `etrujillo@lowrycrossingtexas.org`, Cindy Cash `ccash@lowrycrossingtexas.org`; Ward 4: Muhanad "G" Hijazen `ghijazen@lowrycrossingtexas.**com**`, Ollie Simpson `osimpson@lowrycrossingtexas.**com**`. | `lowrycrossingtexas.org/operations/city_council.php`, `/contact/_city_hall.php`, `/contact/report_a_concern.php` |
| **Lucas** (4845012) | **NONE FOUND.** Checked `/142/Contact` and FormCenter (`General-Forms-4`, ADA forms only) — no general contact form; only a "Request to Speak" meeting-specific process. | **All 7 sourced**, personal pattern `{firstinitial}{lastname}@lucastexas.us`: Mayor Dusty Kuykendall `dkuykendall@lucastexas.us`; Seat 1 Jonathan Underhill `JUnderhill@lucastexas.us`; Seat 2 Rebecca Orr `rOrr@lucastexas.us`; Seat 3 Chris Bierman `cbierman@lucastexas.us`; Seat 4 Phil Lawrence `plawrence@lucastexas.us`; Seat 5 (Mayor Pro Tem) Debbie Fisher `dfisher@lucastexas.us`; Seat 6 Neil Peterson `npeterson@lucastexas.us`. | `lucastexas.us/164/City-Council`, `/142/Contact`, `/FormCenter/General-Forms-4` |
| **McKinney** (4845744, reference model) | **Candidate: `https://www.mckinneytexas.org/FormCenter/City-Manager-18/Public-Feedback-Form-250`** ("Public Feedback Form," addressed to the City Manager's Office, not literally "council" — the FAQ page explicitly says to email councilmembers directly instead of using a form. Weakest-fit form of any city sourced this session; planner may prefer NONE FOUND here since McKinney's officials already have qualifying personal/seat emails covering the D-04 bar independently.) | **Reference pattern confirmed exactly as CONTEXT.md described**, already ~complete per baseline (not a sourcing gap, included for confirmation): Mayor Bill Cox `Mayor@mckinneytexas.org`; District 4 (Mayor Pro Tem) Rick Franklin `District4@mckinneytexas.org`; District 1 Justin Beller `District1@McKinneyTexas.org`; District 2 Patrick Cloutier `District2@mckinneytexas.org`; District 3 Geré Feltus `District3@mckinneytexas.org`; At Large 1 Ernest Lynch `Atlarge1@mckinneytexas.org`; At Large 2 Michael Jones `Atlarge2@mckinneytexas.org`. | `mckinneytexas.org/1167/Council-Members` (raw HTML, Cloudflare-decoded), `/FAQ.aspx?QID=1136`, `/FormCenter` |
| **Melissa** (4847496) | **`https://www.cityofmelissa.com/FormCenter/Contact-Us-12/Contact-Us-60`** — confirmed general "Contact Us" form category exists in FormCenter. | **All 7 sourced**, genuine **seat-alias** pattern (same shape as McKinney/Blue Ridge): Mayor Jay Northcut `mayor@cityofmelissa.com`; Place 1 Preston Taylor `place1@cityofmelissa.com`; Place 2 Rendell Hendrickson `place2@cityofmelissa.com`; Place 3 Dana Conklin `place3@cityofmelissa.com`; Place 4 Joseph Armstrong `place4@cityofmelissa.com`; Place 5 Craig Ackerman `cackerman@cityofmelissa.com` (personal, breaks the placeN@ pattern); Place 6 Sean Lehr `place6@cityofmelissa.com`. | `cityofmelissa.com/202/City-Council`, `/FormCenter` |
| **Nevada** (4850760) | **`https://cityofnevadatx.org/contact_us/index.php`** — confirmed "General Contact Form" (Name/Address/Phone/Email required, Questions/Comments). | **All 6 sourced**, genuine seat-alias pattern: Mayor Donald Deering `mayor@cityofnevadatx.org`; Place 1 Mike Laye `councilman1@cityofnevadatx.org`; Place 2 Paul Baker `councilman2@cityofnevadatx.org`; Place 3 (Mayor Pro Tem) Amanda Wilson `councilman3@cityofnevadatx.org`; Place 4 Clayton Laughter `councilman4@cityofnevadatx.org`; Place 5 Derrick Little `councilman5@cityofnevadatx.org`. | `cityofnevadatx.org/government/city_council.php`, `/contact_us/index.php` |
| **Plano** (4858016) | **GAP — modern JS-rendered CivicPlus platform (`content.civicplus.com`) blocks static fetch.** Best candidate: **`https://www.plano.gov/1859/Mayor-and-City-Council-Request-Form`** ("Mayor and City Council Request Form") — title strongly matches D-01's intent but this session could not confirm actual form fields (page loads content via an unauthenticated widget API this session couldn't locate). **Needs a JS-capable (Playwright) confirm at execute time.** | **GAP — same platform block.** Roster names confirmed via WebSearch only: Mayor John Muns; Place 1 (Deputy Mayor Pro Tem) Maria Tu; Place 2 Bob Kehr; Place 3 Rick Horne; Place 4 Chris Downs; Place 5 Steve Lavine; Place 7 Shun Thomas; Place 8 Vidal Quintanilla. No emails recoverable this session — do not guess a `@plano.gov` pattern without confirming it. | WebSearch snapshots + `plano.gov/1350/Contact-Mayor-and-City-Council` (JS-rendered, content not retrievable); a static CivicPlus mirror `tx-plano2.civicplus.com/1786/Mayor-City-Council` exists but errored (`ECONNRESET`) this session — worth retrying at execute time |
| **Richardson** (4861796) | **GAP — `cor.net` returns HTTP 403 on every path/UA tried (WebFetch and raw curl).** Best candidate: **"City Council Public Comment Form"** at `cor.net/government/boards-commissions-meetings/submit-public-comment-form/city-council-public-comment-form` (title confirms it exists per WebSearch, content not retrievable to verify the exact URL slug). | **GAP — same WAF block.** Roster names + one confirmed email pattern via WebSearch only: Mayor Amir Omar; Place 1 Curtis Dorian; Place 2 Jennifer Justice; Place 3 Dan Barrios (confirmed email format `Dan.Barrios@cor.gov` — **note domain is `cor.gov`, not `cor.net`**); Place 4 Joe Corcoran; Place 5 (Mayor Pro Tem) Ken Hutchenrider; Place 6 Arefin Shamsul. Pattern is plausibly `{Firstname}.{Lastname}@cor.gov` for the rest but **do not seed unconfirmed — only Barrios's is directly sourced.** | WebSearch snapshots only; direct fetch 403 on `cor.net/*` |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recovering an obfuscated email from a city website | A generic "email scraper" tool/library | The two patterns actually seen this session: (1) Cloudflare `/cdn-cgi/l/email-protection#<hex>` — decode with a 6-line XOR script (first byte is the key, XOR every subsequent byte pair); (2) JS `document.write("mailto:" + w + '@' + x)` assembly — the plaintext parts (`w`, `x`) are sitting in the raw HTML as `var` declarations, just grep them | Both patterns are simple and fully offline; no library needed, and a generic scraper would still need per-CMS logic anyway |
| Distinguishing a "real" contact form from a mailto/PDF/311-app | Guessing based on URL shape (`/contact*`, `/FormCenter/*`) | Read the raw HTML for an actual `<form>` tag with an `action=`/submit button, OR confirm the page explicitly says "fill out and submit" — several `/contact*`-named pages this session turned out to be mailto-only or PDF-only (Saint Paul, Lucas, Lowry Crossing) | A URL name alone is not evidence; several TX cities publish a "Contact Us" *page* that is not a *form* |

**Key insight:** Every city in this milestone uses one of three CMS families — CivicPlus/CivicEngage (majority; either static-HTML with Cloudflare email protection, or the newer JS-rendered `content.civicplus.com` platform seen on Plano), a WordPress-derivative (Farmersville/Drupal, Fairview/Ninja Forms), or a smaller niche CMS (Van Alstyne's Membershipware, `municode`-branded Farmersville). Once a city's CMS family is identified, the sourcing approach for the rest of that CMS's cities is predictable — this table already demonstrates the pattern for every CMS present in this milestone.

## Common Pitfalls

### Pitfall 1: A "Contact Us" URL is not evidence of a qualifying form
**What goes wrong:** Assuming any page named `/contact`, `/contact-us`, or `/FormCenter/*` satisfies
D-01 without reading its actual content.
**Why it happens:** Many TX municipal CMS installs publish a "Contact Us" *page* that is really
just a phone number, mailing address, and staff-directory link — or a **downloadable PDF form**
(print-and-mail) — not an online-submittable form.
**How to avoid:** Confirm an actual `<form>` element with a submit action exists (raw HTML, not
just the WebFetch markdown summary — markdown conversion sometimes drops form markup silently).
**Warning signs:** The page mentions "form" but provides only a PDF link, a mailto link, or a
link to a 311-style service-request app (Allen's MyAllen) that isn't about contacting elected
officials specifically.

### Pitfall 2: Emails are frequently obfuscated, not absent
**What goes wrong:** WebFetch's markdown conversion often renders an obfuscated email as a bare
"[Email](/cdn-cgi/l/email-protection#<hex>)" link or an empty `mailto:` href, which reads as "no
email published" if you stop there.
**Why it happens:** Cloudflare's email-protection feature (CivicPlus sites) and inline JS
`document.write` assembly (Prosper/similar) both hide the address from static scrapers and from
WebFetch's summarization, but the underlying data is fully present and recoverable in the raw
HTML.
**How to avoid:** When WebFetch shows an "Email"-labeled link with no visible address, `curl -L
-A "Mozilla/5.0"` the same URL and grep for `cdn-cgi/l/email-protection#` or `document.write`;
decode the former with a small XOR script (first hex byte = key), read the latter's `var`
declarations directly.
**Warning signs:** A council roster table where every row says "Email" as the link text instead
of showing an address — that's the obfuscation, not a genuine gap. (This recovered real emails
for Frisco, McKinney, Celina, and Parker that would otherwise have been wrongly marked
honest-blank.)

### Pitfall 3: Frisco Place 4 officeholder discrepancy — HIGH PRIORITY, unresolved
**What goes wrong:** Migration `1404` (applied 2026-07-24, same day as this research, closing out
Phase 219) seats **Gopal Ponangi** as Frisco's Place 4 councilmember, citing the Collin County
official canvass PDF/xlsx for the June 7, 2025 runoff (Ponangi won 3,826–3,274, 53.89%–46.11%,
per the migration's own header comment). But this session's **live** fetch of Frisco's own
official bio page (`friscotexas.gov/1970/Jared-Elad-Place-4`) states: *"Elected to Frisco City
Council: 2025... Current Term Expires: May 2028"* — i.e., the city's own website currently shows
**Jared Elad**, not Ponangi, as the sitting Place 4 member. A WebSearch summary of Ballotpedia's
page independently states *"Elad held the Place 4 seat after besting... Gopal Ponangi"* in the
runoff — the opposite outcome from the migration's cited canvass.
**Why it happens:** Unclear — could be (a) the city's bio page is stale and simply hasn't been
updated more than a year after the actual (correctly-cited) election, or (b) the migration's
canvass citation is mistaken/mis-scraped, or (c) some other reconciling event (contested result,
subsequent appointment) that neither source captures. This research does not have enough
evidence to adjudicate — it surfaces the conflict rather than resolving it, per the "no
fabrication" mandate.
**How to avoid:** Insert a `checkpoint:human-verify` task before Phase 220 writes ANY contact
data (email or form) to whichever `politician_id` currently sits in Frisco's Place 4 office —
attaching a real, working contact method to the wrong person is worse than leaving it blank.
Recommend the operator either (1) re-pull the Collin County canvass PDF directly to double-check
migration 1404's transcription, or (2) call/email the Frisco City Secretary's office to confirm
the current officeholder, before proceeding.
**Warning signs:** None further needed — this is already confirmed as a live discrepancy between
two authoritative-looking sources (a government canvass migration vs. the city's own official
website), not a hypothetical.

## Spot-Check: `valid_to` (D-03)

CONTEXT.md documents `valid_to` as already ~100% populated and not a sourcing target this phase —
only a representative spot-check is needed. Recommend a 5-city sample drawn from cities this
session's roster-fetching already surfaced fresh term data for (no extra research trips needed):

| City | What this session's fetch shows | Spot-check action |
|------|----------------------------------|--------------------|
| Allen | Terms shown per-seat on the roster page (e.g. Mayor Schulmeister 2026-2029, Place 2 Baril 2026-2029 — recently elected) | Confirm DB `valid_to` matches these end years |
| Frisco | Jared Elad "Current Term Expires: May 2028" (bio page) — **entangled with Pitfall 3**, don't spot-check in isolation | Resolve Pitfall 3 first, then re-derive `valid_to` for whichever person is confirmed correct |
| Saint Paul | Live roster differs from an earlier cached search snapshot (Pierson/Bewley vs. Graham/Trevino-as-alderman) — a real reshuffle, not a research error | Confirm DB reflects the **current** Seat 3/4 occupants and their `valid_from` dates, not stale ones |
| Princeton | All 8 terms/places freshly confirmed via individual bio pages this session | Quick confirm only — low risk |
| Nevada | All 6 terms confirmed via roster table this session (2024-2027 style terms shown) | Quick confirm only — low risk |

## Recommended Migration Grouping

Group by **field**, not by city, mirroring the Phase 218/219 idiom of one migration per logical
unit of work:

1. **Migration A — `web_form_url` batch.** One idempotent `UPDATE ... FROM (VALUES (geo_id,
   url), ...) AS v(geo_id, url) WHERE g.geo_id = v.geo_id AND p.web_form_url IS NULL` (or
   equivalent per-office join) covering every city with a sourced form in the Per-City table.
   Skip Anna (mayor-only form — needs a planner decision on scope) and the three GAP cities
   (Josephine/Plano/Richardson) until confirmed.
2. **Migration B — `email_addresses` batch, split in two sub-migrations if helpful:**
   - B1: cities with **seat-alias** emails (Blue Ridge, Nevada, Melissa, McKinney-reference) —
     these attach to the *office*, so they're safe to seed even across an officeholder change.
   - B2: cities with **personal** emails (Frisco, Princeton, Prosper, Allen, Fairview, Parker,
     Saint Paul, Weston, Celina, Lowry Crossing, Lucas) — attach to the *politician_id* of
     whoever is currently and correctly seated; **hold Frisco Place 4 out of this batch** until
     Pitfall 3 resolves.
3. **Migration C — deferred GAP-city batch** (Josephine, Plano, Richardson) once a
   Playwright-capable session or the human operator confirms their form URL and roster
   emails. Do not block Migrations A/B on this.
4. A `checkpoint:human-verify` task ahead of Migration B2's Frisco row, addressing Pitfall 3.

## Validation Architecture

No automated JS/TS test framework covers civic-data seeding in this codebase — every prior
deep-seed/backfill phase (100, 187, 199, 206, 218, 219) validates via inline SQL gates +
apply-script assertions + a live browse/profile spot-check, not a unit-test suite. This phase
follows the identical pattern.

### "Test" Framework
| Property | Value |
|----------|-------|
| Framework | In-transaction/apply-script `DO $$ ... RAISE EXCEPTION`-style gates + post-apply SQL assertions (218/219-series convention) |
| Config file | None — per-migration apply script in `C:/EV-Accounts/backend/scripts` |
| Quick run command | `npx tsx scripts/_apply-migration-<NNNN>_<slug>.ts` (from `C:/EV-Accounts/backend`) |
| Full suite command | Re-apply every phase migration → assert idempotent net-zero on a second run |

### Phase Requirements → Verification Map
| Req ID | Behavior | Check | Automated command |
|--------|----------|-------|-------------------|
| COLLIN-CONTACT-01 | `web_form_url` populated for every city with a sourced form | Per-government non-null count matches the Per-City table's sourced-form list | `SELECT g.name, COUNT(*) FILTER (WHERE p.web_form_url IS NOT NULL) FROM essentials.governments g JOIN essentials.chambers ch ON ch.government_id=g.id JOIN essentials.offices o ON o.chamber_id=ch.id JOIN essentials.politicians p ON p.id=o.politician_id WHERE g.geo_id IN (<24 geo_ids>) GROUP BY g.name;` — every sourced-city row's count should equal its seat count |
| COLLIN-CONTACT-02 | `email_addresses` populated where sourced, honest-blank elsewhere, no generic catch-alls | Reconcile against the Per-City table's sourced emails; a manual grep-for-generic check (`info@`, `council@`, `cityhall@` should never appear in a seeded `email_addresses` row) | `SELECT full_name, email_addresses FROM essentials.politicians WHERE email_addresses::text ILIKE ANY(ARRAY['%info@%','%cityhall@%','%contact@%']);` must return 0 rows |
| COLLIN-CONTACT-03 | `valid_to` spot-check clean | 5-city sample (see Spot-Check section) manually reconciled against live sources | Manual — no automated query, per D-03's "light spot-check" scope |
| Success Criterion #4 (working contact method) | Every seeded official has `web_form_url` OR `email_addresses` non-empty | `SELECT p.full_name, g.name FROM essentials.politicians p JOIN essentials.offices o ON o.id = p.office_id JOIN essentials.chambers ch ON ch.id = o.chamber_id JOIN essentials.governments g ON g.id = ch.government_id WHERE g.geo_id IN (<24 geo_ids>) AND p.is_active = true AND p.web_form_url IS NULL AND (p.email_addresses IS NULL OR array_length(p.email_addresses,1) IS NULL);` — every remaining row must be a **documented** honest-blank (Anna, Farmersville, Lavon, Longview, Murphy, Van Alstyne if the city truly has no qualifying form/email; Josephine/Plano/Richardson pending Migration C) |

Also run the standing **split-section SQL check** ([[section_split_check]]) after seeding, per
milestone-wide convention — this phase only UPDATEs existing rows, so a split-section regression
would indicate an unrelated bug, but the check should still run clean.

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| `WebSearch`/`WebFetch` (this research session) | Sourcing 21/24 cities | ✓ | Sufficient for the majority |
| Raw `curl` + Node (this research session) | Recovering Cloudflare/JS-obfuscated emails | ✓ | Used successfully on Frisco, McKinney, Celina, Parker |
| Playwright / JS-capable browser | Josephine (307 loop), Plano (JS-rendered), Richardson (403 WAF) | ✗ this session | Fallback: a human operator session, or a future research pass with Playwright access, before Migration C |
| gsd-executor web tools | N/A — executor has none | ✗ (by design) | This is exactly why this RESEARCH.md exists — all facts are pre-sourced here |

**Missing dependencies with no fallback:** none — the 3 GAP cities have a clear fallback path
(Playwright/operator), they're just not resolvable by this research session or by gsd-executor.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Anna's "Request to Contact Mayor Cain" form is the city's only submittable form and doesn't extend to other officials | Per-City table, Anna row | Low — worst case, Anna's `web_form_url` stays blank for non-Mayor seats, which is the safe default anyway |
| A2 | The Collin County canvass cited in migration 1404 is correct and Frisco's own website is simply stale (vs. the reverse) | Pitfall 3 | **High** — if the migration is wrong, Phase 220 would attach real contact info to the wrong `politician_id`. This research does NOT assume either direction is correct — flagged as `checkpoint:human-verify`, not resolved |
| A3 | Richardson's remaining 5 councilmembers follow the `{Firstname}.{Lastname}@cor.gov` pattern confirmed for Dan Barrios | Per-City table, Richardson row | Medium — explicitly NOT recommended for seeding without direct confirmation; flagged as unconfirmed |
| A4 | Plano's "Mayor and City Council Request Form" is a genuine submittable contact form (title-only match, content unconfirmed) | Per-City table, Plano row | Medium — flagged as needing execute-time confirmation, not to be seeded on title alone |

## Open Questions

1. **Frisco Place 4: Ponangi or Elad?**
   - What we know: Migration 1404 (2026-07-24) cites an official Collin County canvass PDF/xlsx
     naming Ponangi the winner. Frisco's own live bio page and a Ballotpedia summary both say
     Elad currently holds the seat.
   - What's unclear: Which source is stale/wrong, or whether a subsequent event (contest, recount,
     appointment) reconciles them.
   - Recommendation: `checkpoint:human-verify` before writing any Frisco Place 4 contact data;
     do not let Phase 220 silently pick a side.

2. **Josephine / Plano / Richardson data recovery**
   - What we know: all three have a plausible form-URL candidate and (for Richardson) a partial
     email pattern, but none could be confirmed by this session's tools.
   - What's unclear: whether a Playwright pass would cleanly recover the missing data or whether
     these sites need a different approach (e.g., a phone call to the city secretary).
   - Recommendation: schedule as Migration C, deferred from the main phase execution; don't block
     the other 21 cities.

3. **Allen's MyAllen 311 app — does it count as D-01's form?**
   - What we know: it's the only online submission mechanism Allen publishes, but it's a
     service-request tool (potholes, code violations), not a "contact your councilmember" form,
     and requires account creation for most features.
   - What's unclear: whether the planner/operator considers this close enough to satisfy D-01's
     spirit.
   - Recommendation: default to NONE FOUND for Allen's `web_form_url` (Allen's officials already
     have qualifying personal emails, so Success Criterion #4 is met regardless).

## Sources

### Primary (HIGH confidence — direct fetch of the city's own official page, this session)
- `annatexas.gov`, `farmersvilletx.com`, `friscotexas.gov`, `lavontx.gov`, `longviewtexas.gov`,
  `murphytx.org`, `princetontx.gov`, `prospertx.gov`, `cityofvanalstyne.us`, `cityofallen.org` /
  `allentx.gov`, `fairviewtexas.org`, `parkertexas.us`, `stpaultexas.us`, `westontexas.com`,
  `celina-tx.gov`, `blueridgecity.com`, `lowrycrossingtexas.org`, `lucastexas.us`,
  `mckinneytexas.org`, `cityofmelissa.com`, `cityofnevadatx.org` — each cited inline in the
  Per-City table with the exact page path read.

### Secondary (MEDIUM confidence — WebSearch summary, cross-checked where possible)
- TML City Officials Directory entries (`directory.tml.org/profile/city/*`) — used only to
  cross-check roster names, not as a primary email/form source.
- Ballotpedia (Frisco Place 4 race page) — cross-referenced in Pitfall 3.

### Tertiary (LOW confidence — flagged as GAP, not used to seed anything)
- Josephine, Plano, Richardson: WebSearch-derived roster names only; no email/form data was
  written to this research as fact from these sources — all marked GAP explicitly.

## Metadata

**Confidence breakdown:**
- Standard stack / migration mechanics: HIGH — unchanged, proven pattern from Phases 218/219.
- Per-city sourcing (21/24 cities): HIGH — direct primary-source fetch this session, with raw-HTML
  cross-checks where obfuscation was suspected.
- Per-city sourcing (3/24 cities — Josephine/Plano/Richardson): LOW/GAP — explicitly flagged, not
  guessed.
- Frisco Place 4 officeholder identity: UNRESOLVED — flagged as a blocking open question, not a
  confidence level.

**Research date:** 2026-07-24
**Valid until:** ~30 days for the sourced form URLs/emails (municipal sites change
infrequently); the Frisco Place 4 discrepancy and the 3 GAP cities should be re-checked
immediately at execute time, not on the 30-day cycle.

## RESEARCH COMPLETE
