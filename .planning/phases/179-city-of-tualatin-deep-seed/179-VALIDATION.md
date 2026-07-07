---
phase: 179
slug: city-of-tualatin-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-02
---

# Phase 179 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data deep-seed** phase — validation is via **SQL audit gates run over the live DB**
> (psql against C:/EV-Accounts/backend/.env DATABASE_URL), not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL audit queries (psql) + live browse check |
| **Config file** | C:/EV-Accounts/backend/.env (DATABASE_URL) — orchestrator applies + audits; executor has NO DB |
| **Quick run command** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON o.chamber_id=ch.id JOIN essentials.governments g ON ch.government_id=g.id WHERE g.name='City of Tualatin, Oregon, US'"` (= 7) |
| **Full suite command** | 9-check E2E gate + banner check (see map below): geo_id 4174950 geofence check + section-split 0 rows + roster=7 + headshot coverage + stance evidence audit + coverage.js build |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After the structural migration (1169):** run the in-migration DO-block gates (gov + chamber + 2 districts + exactly 7 offices) PLUS the independent post-verify section-split query (WR-01-fixed canonical version)
- **After headshot migration (1170):** run headshot coverage audit (politician_images rows; expect 7/7 — all sources confirmed retrievable at research time)
- **After each stance migration (1171–1177):** verify row-count assertion fired (inserted = expected; bad topic_keys not silently dropped) + 0 uncited answers
- **Before verify:** section-split scan returns 0 rows; live browse shows Mayor Bubenik first + 6 councilors
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 179-01-* | 01 | 1 | WASH-05 | — | Wave-0 DB probes confirm **corrected geo_id 4174950** (NOT the 4175200 in ROADMAP/CONTEXT — 0 rows) has exactly 1 G4110 geofence + greenfield (no Tualatin gov/chamber), ext_id block -4174951..-4174957 free, disk migration MAX = 1168 (next 1169; ledger MAX 1159 is a trap — on-disk counter authoritative); fresh roster re-fetch confirms 7 members unchanged since 2026-07-02 | audit | `psql "$DATABASE_URL" -f _tmp-tualatin-wave0-probe.sql` | ❌ W0 | ⬜ pending |
| 179-02-* | 02 | 2 | WASH-05 | T-179-01 | Idempotent seed (WHERE NOT EXISTS on gov; office guard on (district_id, politician_id)); Beaverton shape (1 LOCAL_EXEC Mayor district + 1 LOCAL at-large district, both geo_id 4174950 state='or', no ward geofences); numbered Position 1–6 titles; Pratt = Council President title-on-seat (no separate office row); all 7 is_appointed=false; representing_city='Tualatin' inline; independent post-verify, 0 section-split | audit | `psql "$DATABASE_URL" -f 1169_tualatin_city_council.sql` + post-verify | ❌ W0 | ⬜ pending |
| 179-03-* | 03 | 3 | WASH-05 | — | Headshots 600×750 (4:5 crop first, Lanczos q90), canonical {uuid}-headshot.jpg, photo_license='press_use'; all 7 direct from tualatinoregon.gov (no WAF, no fallback chain needed — D-16 unused, documented); no overlays/fabrication | audit | `psql "$DATABASE_URL" -c "SELECT ... FROM essentials.politician_images"` + CDN HTTP 200 | ❌ W0 | ⬜ pending |
| 179-04-* | 04 | 3 | WASH-05 | — | Stances 100% cited; ZERO default/neutral values; honest blanks; topic_id via is_live JOIN; row-count assertions; no judicial topics (appointed City Attorney/Municipal Judge); one research agent at a time | audit | `psql "$DATABASE_URL" -f stance_audit.sql` | ❌ W0 | ⬜ pending |
| 179-05-* | 05 | 4 | WASH-05 | — | Tualatin row in coverage.js Oregon block with hasContext:true + browseGovernmentList ['4174950'] (corrected geo_id); cities/tualatin.jpg (Tualatin Commons, CC BY-SA 3.0, no AI) + CURATED_LOCAL 'tualatin' key + attribution; prod build passes | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **DB probe (run FIRST): confirm geo_id 4174950 (NOT 4175200) has exactly 1 G4110 row** — research found the ROADMAP/CONTEXT value wrong (phantom-seed risk); re-verify the correction before any write
- [ ] DB probe: confirm no existing government/chamber rows for Tualatin (name + corrected geo_id 4174950)
- [ ] DB probe: confirm ext_id range -4174951..-4174957 is unused
- [ ] Disk `ls`: re-confirm migration MAX = 1168 (next 1169) — unrelated NC migration 1168 shows other workstreams consume the shared counter; re-verify carefully
- [ ] Fresh fetch of tualatinoregon.gov/city-council/ to re-confirm the 7-member roster unchanged since 2026-07-02 (no appointment churn found, lower risk than Tigard)
- [ ] Spot-check 2–3 of the 7 headshot URLs for continued retrievability (site is mid-redesign; /app/uploads/2025/09/ batch)
- [ ] View "Tualatin Commons daytime.JPG" directly before finalizing the banner choice (research judged by metadata only)

*Existing OR TIGER city geofence (4174950) and inform/essentials schema cover all infrastructure — no new framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live browse shows Mayor Frank Bubenik first + all 6 councilors (Positions 1–6), no empty/split LOCAL section | WASH-05 | Requires the deployed frontend + live PIP | Browse essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110 |
| Headshots render at 600×750 with no text/graphic overlays | WASH-05 | Visual inspection of mirrored Storage images | Open each official's profile; confirm crop/quality |
| Party never displays (antipartisan) | WASH-05 | Visual inspection | Confirm no party label on any Tualatin profile |
| Community banner renders (Tualatin Commons photo, not tier-gradient fallback) | WASH-05 | Visual inspection | Same browse URL — Local section shows the photo |

---

## Validation Sign-Off

- [ ] All tasks have an automated audit gate or Wave 0 dependency
- [ ] Sampling continuity: every migration followed by an audit
- [ ] Wave 0 covers all DB probes before any write
- [ ] Section-split scan (WR-01-fixed canonical query) returns 0 rows
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
