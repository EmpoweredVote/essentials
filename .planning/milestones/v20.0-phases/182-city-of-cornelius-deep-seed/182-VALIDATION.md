---
phase: 182
slug: city-of-cornelius-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-03
---

# Phase 182 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data deep-seed** phase — validation is via **SQL audit gates run over the live DB**
> (psql against C:/EV-Accounts/backend/.env DATABASE_URL), not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL audit queries (psql) + live browse check |
| **Config file** | C:/EV-Accounts/backend/.env (DATABASE_URL) — orchestrator applies + audits; executor has NO DB |
| **Quick run command** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON o.chamber_id=ch.id JOIN essentials.governments g ON ch.government_id=g.id WHERE g.name='City of Cornelius, Oregon, US'"` (= 5 if vacant seat seeded per TX-23 precedent, 4 if omitted — planner decision) |
| **Full suite command** | E2E gate + banner check (see map below): geo_id **4115550** geofence existence-AND-NAME check (NOT the stated 4115350 — that is Coquille) + section-split 0 rows + roster audit + headshot coverage (4/4 filled seats) + stance evidence audit + coverage.js build |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After the structural migration (1196):** run the in-migration DO-block gates (gov + chamber + 2 districts + office count) PLUS the independent post-verify section-split query AND the **pairwise `(external_id, full_name)` identity gate** (Sherwood 1187 template — verbatim clone of the gate shape, with D-16's chamber-lookup CTE hoist applied)
- **After headshot migration:** run headshot coverage audit (politician_images rows; research confirmed 4/4 filled-seat portraits directly downloadable from corneliusor.gov — investigate any shortfall as a regression, not an expected gap; the vacant seat has NO photo by definition — never force a former officeholder's image)
- **After each stance migration:** verify the four-gate DO block fired (row-count parity + bidirectional topic_id set-equality + non-empty evidence — strengthened Sherwood 1189–1195 template) + 0 uncited answers
- **Before verify:** section-split scan returns 0 rows; live browse shows the Mayor first + councilors
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 182-01-* | 01 | 1 | WASH-08 | — | Wave-0 DB probes confirm geo_id **4115550** (research-CORRECTED from stated 4115350, which resolves to **Coquille** — a DIFFERENT real city; existence-only probes pass incorrectly, so the probe MUST assert `name` ILIKE 'Cornelius%' on the G4110 row) + greenfield (no Cornelius gov/chamber), ext_id block -4115551..-4115555 free, disk migration MAX = 1195 (next 1196; ledger MAX 1187 is the trap — on-disk counter authoritative); fresh roster re-fetch confirms 4 filled seats + 1 vacancy unchanged (vacancy application window closes 2026-07-22 — roster may change; re-verify at execution); all 4 headshot ImageRepository URLs re-confirmed HTTP 200 | audit | `psql "$DATABASE_URL" -f _tmp-cornelius-wave0-probe.sql` | ❌ W0 | ⬜ pending |
| 182-02-* | 02 | 2 | WASH-08 | T-182-01 | Idempotent seed (WHERE NOT EXISTS on gov; office guard); Beaverton/Tualatin/Forest Grove/Sherwood shape (1 LOCAL_EXEC Mayor district + 1 LOCAL at-large district, both geo_id 4115550 state='or', no ward geofences — pure at-large VERIFIED from Charter §7 primary text); plain-title convention ('Mayor'/'Councilor' — §24 "by position" is staggering only, no public numbered seats); Council President Godinez Valencia = title-on-seat (plain 'Councilor' in DB); Mayor = 2-YEAR term (§25); Baker + López flagged appointed per city bio pages; vacant 5th seat handled per explicit planner decision (TX-23 `politician_id=NULL, is_vacant=true` precedent recommended — NEVER a placeholder person); **PITFALL: Citlalli Nuñez-Barragán must NOT be seated** (stale alt-text only; seat confirmed vacant); Edén López = first accented UTF-8 name in the WashCo chain (file saved UTF-8 no BOM); representing_city='Cornelius' inline; chamber-lookup CTE hoist (D-16/IN-01); independent post-verify, 0 section-split | audit | `psql "$DATABASE_URL" -f 1196_cornelius_city_council.sql` + post-verify | ❌ W0 | ⬜ pending |
| 182-03-* | 03 | 3 | WASH-08 | — | Headshots: 4 source PNGs are 1600×2000 EXACT 4:5 transparent circle-cutouts → **white-background composite (Henderson RGBA precedent) then straight resize to 600×750** (no crop judgment needed), Lanczos q90, canonical {uuid}-headshot.jpg, photo_license per actual source (official city portraits); WR-01: script exits non-zero on ANY upload failure; WR-C: empty-roster guard; WR-02: prefetched_bytes guard reused — clone from `_tmp-sherwood-headshots.py` ONLY (gitignored file carries the fixes); 4/4 expected — any gap is a regression; vacant seat = documented genuine gap | audit | `psql "$DATABASE_URL" -c "SELECT ... FROM essentials.politician_images"` + CDN HTTP 200 | ❌ W0 | ⬜ pending |
| 182-04-* | 04 | 3 | WASH-08 | — | Stances 100% cited; ZERO default/neutral values; honest blanks; topic_id via is_live JOIN; four-gate DO block (strengthened Sherwood 1189–1195 template); no judicial topics; one research agent at a time on **model=sonnet**, agents author their own migration files; Pamplin/News-Times content via search-index extraction only, cited to original URLs; **Spanish-language sources ADMISSIBLE per D-15** (cite original Spanish URL, faithful English reasoning); Nov 17 2025 council-minutes immigration/Equity Corps anchor attributable to Dalin + Godinez Valencia (curl+pdftotext for minutes PDFs — WebFetch OCR fails); appointee-heavy roster (Baker seated June 2026) → expect low evidence yield for newest members; depth is evidence-bounded, never padded | audit | `psql "$DATABASE_URL" -f stance_audit.sql` | ❌ W0 | ⬜ pending |
| 182-05-* | 05 | 4 | WASH-08 | — | Cornelius row in coverage.js Oregon block with hasContext:true + browseGovernmentList ['4115550'] (alphabetical among OR cities); cities/cornelius.jpg — leading candidate "Cornelius Civic Center - Oregon.JPG" (Public Library/City Hall, D-14's named alternate; CC BY-SA 3.0, M.O. Stevens; native 1679×1412 → materially heavy crop to 1700×540, present crop preview to operator) + CURATED_LOCAL `{ state: 'OR', src }` entry (post-WR-03 format) key `cornelius` + attribution; prod build passes; **deploy verified by bundle CONTENT grep (geo_id 4115550 / asset path in served JS), NEVER by hash** (D-16) | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] DB probe (run FIRST): confirm geo_id **4115550** has exactly 1 G4110 row AND its `name` matches 'Cornelius city' — existence alone is INSUFFICIENT (stated 4115350 exists but is Coquille)
- [ ] DB probe: confirm no existing government/chamber rows for Cornelius (name + geo_id) — research found 0 (greenfield)
- [ ] DB probe: confirm ext_id range -4115551..-4115555 is unused — research found 0 rows
- [ ] Disk `ls`: re-confirm migration MAX = 1195 (next 1196) — other workstreams consume the shared counter; ledger MAX 1187 is the trap
- [ ] Fresh fetch of corneliusor.gov/267/City-Council to re-confirm 4 filled seats + 1 vacancy unchanged (application window closes 2026-07-22 — if a 5th member has been seated, STOP and re-research the roster)
- [ ] Re-download all 4 headshot ImageRepository URLs (documentIDs 2325, 1977, 2324, 1979) to confirm continued availability + transparent-PNG format unchanged
- [ ] View "Cornelius Civic Center - Oregon.JPG" at the 3.15:1 crop before presenting to the operator (native 1679×1412 — the heaviest aspect compression of the milestone; compositional judgment untested until execution); optionally deepen the Commons search (Washington County subcategories) for a street-level alternative
- [ ] Confirm the vacant-seat modeling decision is recorded in the structural plan (TX-23 precedent option (a) vs omit option (b)) before the migration is written

*Existing psql/pipeline infrastructure covers all phase requirements — no new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mayor-first ordering + no party label on live browse | WASH-08 | Rendering behavior (groupHierarchy.js + antipartisan display) only observable in the deployed UI | Open `essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110`; confirm Mayor first, councilors after, no party anywhere |
| Community banner renders (not gradient fallback) | WASH-08 | CURATED_LOCAL key match + representing_city derivation only observable in the deployed UI | Same browse URL; Local section shows the Cornelius photo banner |
| Compass stances visible on official profiles | WASH-08 | Spoke rendering is UI behavior | Open 2–3 official profiles from the browse list; confirm cited stances render, honest blank spokes present |
| Vacant seat display (if seeded with is_vacant=true) | WASH-08 | First vacant office row in the WashCo chain — frontend handling unverified | Same browse URL; confirm the vacant seat either renders acceptably or is cleanly absent — no broken card, no placeholder person |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
