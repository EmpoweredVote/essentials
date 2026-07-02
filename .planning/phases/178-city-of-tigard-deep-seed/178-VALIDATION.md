---
phase: 178
slug: city-of-tigard-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-02
---

# Phase 178 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data deep-seed** phase — validation is via **SQL audit gates run over the live DB**
> (psql against C:/EV-Accounts/backend/.env DATABASE_URL), not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL audit queries (psql) + live browse check |
| **Config file** | C:/EV-Accounts/backend/.env (DATABASE_URL) — orchestrator applies + audits; executor has NO DB |
| **Quick run command** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers ch ON o.chamber_id=ch.id JOIN essentials.governments g ON ch.government_id=g.id WHERE g.name='City of Tigard, Oregon, US'"` (= 7) |
| **Full suite command** | 9-check E2E gate + banner check (see map below): section-split 0 rows + roster=7 + headshot coverage + stance evidence audit + coverage.js build |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After the structural migration (1159):** run the in-migration DO-block gates (gov + chamber + 2 districts + exactly 7 offices) PLUS the WR-01-fixed independent post-verify section-split query
- **After headshot migration (1160):** run headshot coverage audit (politician_images rows; genuine gaps documented, not silently absent)
- **After each stance migration (1161-1167):** verify WR-02 row-count assertion fired (inserted = expected; bad topic_keys not silently dropped) + 0 uncited answers
- **Before verify:** section-split scan returns 0 rows; live browse shows Mayor Hu first + 6 councilors
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 178-01-* | 01 | 1 | WASH-04 | — | Wave-0 DB probes confirm geo_id 4173650 geofence exists + greenfield (no Tigard gov/chamber), ext_id block -4173651..-4173657 free, disk migration MAX = 1158 (next 1159); fresh roster re-fetch confirms no council change since 2026-02-10 | audit | `psql "$DATABASE_URL" -f _tmp-tigard-wave0-probe.sql` | ❌ W0 | ⬜ pending |
| 178-02-* | 02 | 2 | WASH-04 | T-178-01 | Idempotent seed (WHERE NOT EXISTS on gov; office guard on (district_id, politician_id)); pure at-large model (1 LOCAL_EXEC + 1 LOCAL, no ward geofences, plain 'Mayor'/'Councilor' titles); Hu + Anderson appointed-seat flags; Youth Councilor excluded (exactly 7 offices); representing_city='Tigard' inline; WR-01 independent post-verify, 0 section-split | audit | `psql "$DATABASE_URL" -f 1159_tigard_city_council.sql` + post-verify | ❌ W0 | ⬜ pending |
| 178-03-* | 03 | 3 | WASH-04 | — | Headshots 600×750 (4:5 crop first), canonical {uuid}-headshot.jpg, licensing documented; tigard-or.gov is WAF-403 with NO portal mirror — per-official news-source fallback; genuine gaps honestly documented (partial 5/7-6/7 acceptable), no fabricated/overlaid images | audit | `psql "$DATABASE_URL" -c "SELECT ... FROM essentials.politician_images"` + CDN HTTP 200 | ❌ W0 | ⬜ pending |
| 178-04-* | 04 | 3 | WASH-04 | — | Stances 100% cited; ZERO default/neutral values; honest blanks; topic_id via is_live JOIN; WR-02 row-count assertions; no judicial topics (appointed City Attorney); one research agent at a time | audit | `psql "$DATABASE_URL" -f stance_audit.sql` | ❌ W0 | ⬜ pending |
| 178-05-* | 05 | 4 | WASH-04 | — | Tigard row in coverage.js with hasContext:true + browseGeoId 4173650; cities/tigard.jpg (CC-licensed, no AI) + CURATED_LOCAL 'tigard' key; prod build passes | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] DB probe: re-confirm geo_id 4173650 geofence exists (state='41', mtfcc='G4110') — research verified live, re-verify at execution
- [ ] DB probe: confirm no existing government/chamber rows for Tigard (name + geo_id)
- [ ] DB probe: confirm ext_id range -4173651..-4173657 is unused
- [ ] Disk `ls`: re-confirm migration MAX = 1158 (next 1159)
- [ ] Fresh WebSearch pass for any Tigard council change since 2026-02-10 (roster is volatile: Hu appointed Mayor Oct 2025, Anderson appointed Dec 2025)
- [ ] Per-official headshot search (tigardlife.com / valleytimes.news / Ballotpedia / campaign sites) for the 6 officials beyond Shaw
- [ ] Confirm Wikimedia Commons CC license version for the "Downtown Tigard Oregon.JPG" banner candidate

*Existing OR TIGER city geofence (4173650) and inform/essentials schema cover all infrastructure — no new framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live browse shows Mayor Yi-Kang Hu first + all 6 councilors, no empty/split LOCAL section | WASH-04 | Requires the deployed frontend + live PIP | Browse essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110 |
| Headshots render at 600×750 with no text/graphic overlays | WASH-04 | Visual inspection of mirrored Storage images | Open each official's profile; confirm crop/quality |
| Party never displays (antipartisan) — Anderson/Ghoddusi ARE characterized by party in news coverage | WASH-04 | Visual inspection | Confirm no party label on any Tigard profile |
| Community banner renders (Tigard photo, not tier-gradient fallback) | WASH-04 | Visual inspection | Same browse URL — Local section shows the photo |

---

## Validation Sign-Off

- [ ] All tasks have an automated audit gate or Wave 0 dependency
- [ ] Sampling continuity: every migration followed by an audit
- [ ] Wave 0 covers all DB probes before any write
- [ ] Section-split scan (WR-01-fixed canonical query) returns 0 rows
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
