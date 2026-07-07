---
phase: 180
slug: city-of-forest-grove-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-03
---

# Phase 180 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data deep-seed** phase — validation is via **SQL audit gates run over the live DB**
> (psql against C:/EV-Accounts/backend/.env DATABASE_URL), not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL audit queries (psql) + live browse check |
| **Config file** | C:/EV-Accounts/backend/.env (DATABASE_URL) — orchestrator applies + audits; executor has NO DB |
| **Quick run command** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON o.chamber_id=ch.id JOIN essentials.governments g ON ch.government_id=g.id WHERE g.name='City of Forest Grove, Oregon, US'"` (= 7) |
| **Full suite command** | 9-check E2E gate + banner check (see map below): geo_id 4126200 geofence check + section-split 0 rows + roster=7 + headshot coverage + stance evidence audit + coverage.js build |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After the structural migration (1178):** run the in-migration DO-block gates (gov + chamber + 2 districts + exactly 7 offices) PLUS the independent post-verify section-split query AND the D-14 WR-02 in-file identity gate (seated names match the researched roster)
- **After headshot migration:** run headshot coverage audit (politician_images rows; genuine-gap risk flagged — document actual outcome honestly, do NOT hard-assert 7/7 up front)
- **After each stance migration:** verify row-count assertion fired (inserted = expected; bad topic_keys not silently dropped) + 0 uncited answers
- **Before verify:** section-split scan returns 0 rows; live browse shows Mayor Wenzl first + 6 councilors
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 180-01-* | 01 | 1 | WASH-06 | — | Wave-0 DB probes confirm geo_id 4126200 (research-confirmed CORRECT, first unchanged stated value in the milestone — re-verify regardless) has exactly 1 G4110 geofence + greenfield (no Forest Grove gov/chamber), ext_id block -4126201..-4126207 free, disk migration MAX = 1177 (next 1178; ledger MAX 1169 is a trap — on-disk counter authoritative); fresh roster re-fetch confirms 7 members unchanged (esp. close Schimmel/Truax 2024 seat); JS-capable headshot fetch attempted before D-16 fallback; City Attorney/Municipal Judge appointment confirmed Forest-Grove-specifically | audit | `psql "$DATABASE_URL" -f _tmp-forestgrove-wave0-probe.sql` | ❌ W0 | ⬜ pending |
| 180-02-* | 02 | 2 | WASH-06 | T-180-01 | Idempotent seed (WHERE NOT EXISTS on gov; office guard); Beaverton/Tualatin shape (1 LOCAL_EXEC Mayor district + 1 LOCAL at-large district, both geo_id 4126200 state='or', no ward geofences); Tigard plain-title convention (no numbered positions); Valenzuela = Council President title-on-seat (no separate office row); all 7 is_appointed=false; representing_city='Forest Grove' inline; **D-14 WR-02: in-file identity gate on ON CONFLICT (external_id) path** — post-verify asserts seated names match researched roster; independent post-verify, 0 section-split | audit | `psql "$DATABASE_URL" -f 1178_forest_grove_city_council.sql` + post-verify | ❌ W0 | ⬜ pending |
| 180-03-* | 03 | 3 | WASH-06 | — | Headshots 600×750 (4:5 crop first, Lanczos q90), canonical {uuid}-headshot.jpg, photo_license per actual source; city photos are JS-rendered (not WAF) — JS-capable fetch first, then D-16 chain (Ballotpedia/Wikimedia → local-news last resort); **D-14 WR-01: pipeline script exits non-zero on ANY upload failure**; genuine gaps documented, no fabrication | audit | `psql "$DATABASE_URL" -c "SELECT ... FROM essentials.politician_images"` + CDN HTTP 200 | ❌ W0 | ⬜ pending |
| 180-04-* | 04 | 3 | WASH-06 | — | Stances 100% cited; ZERO default/neutral values; honest blanks; topic_id via is_live JOIN; row-count assertions; no judicial topics (appointed City Attorney/Municipal Judge — Wave-0-confirmed); one research agent at a time, agents author their own migration files | audit | `psql "$DATABASE_URL" -f stance_audit.sql` | ❌ W0 | ⬜ pending |
| 180-05-* | 05 | 4 | WASH-06 | — | Forest Grove row in coverage.js Oregon block with hasContext:true + browseGovernmentList ['4126200']; cities/forest-grove.jpg (Old College Hall CC BY 3.0 priority or Downtown PD alternate, no AI) + CURATED_LOCAL key with **two-word city name format verified against getBuildingImages() match loop** + attribution; prod build passes | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] DB probe (run FIRST): confirm geo_id 4126200 has exactly 1 G4110 row (research found it correct — re-verify regardless; 2 of 6 stated geo_ids this milestone were wrong)
- [ ] DB probe: confirm no existing government/chamber rows for Forest Grove (name + geo_id)
- [ ] DB probe: confirm ext_id range -4126201..-4126207 is unused
- [ ] Disk `ls`: re-confirm migration MAX = 1177 (next 1178) — other workstreams consume the shared counter; re-verify carefully; ledger MAX 1169 is a trap
- [ ] Fresh fetch of forestgrove-or.gov/611/Meet-the-Council to re-confirm the 7-member roster unchanged, especially the close Schimmel/Truax 2024 seat outcome
- [ ] Attempt a JS-capable fetch of the Staff Directory / Meet the Council photo widgets for all 7 officials BEFORE invoking the D-16 external fallback chain
- [ ] Confirm City Attorney/Municipal Court Judge are appointed for Forest Grove specifically (research assumption A7 — gates the no-judicial-topics stance rule)
- [ ] View the Old College Hall (3 angles) and Downtown Forest Grove images directly before finalizing the banner choice — 3.15:1 crop composition untested
- [ ] Verify the exact `CURATED_LOCAL` key format for a two-word city name (`'forest grove'` vs `'forest-grove'`) against the live `getBuildingImages()` match-loop code

*Existing OR TIGER city geofence (4126200) and inform/essentials schema cover all infrastructure — no new framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live browse shows Mayor Malynda Wenzl first + all 6 councilors, no empty/split LOCAL section | WASH-06 | Requires the deployed frontend + live PIP | Browse essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110 |
| Headshots render at 600×750 with no text/graphic overlays | WASH-06 | Visual inspection of mirrored Storage images | Open each official's profile; confirm crop/quality |
| Party never displays (antipartisan) | WASH-06 | Visual inspection | Confirm no party label on any Forest Grove profile |
| Community banner renders (Forest Grove photo, not tier-gradient fallback) | WASH-06 | Visual inspection | Same browse URL — Local section shows the photo (watch the two-word CURATED_LOCAL key trap) |

---

## Validation Sign-Off

- [ ] All tasks have an automated audit gate or Wave 0 dependency
- [ ] Sampling continuity: every migration followed by an audit
- [ ] Wave 0 covers all DB probes before any write
- [ ] Section-split scan (canonical query) returns 0 rows
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
