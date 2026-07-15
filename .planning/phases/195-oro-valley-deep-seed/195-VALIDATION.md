---
phase: 195
slug: oro-valley-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-10
---

# Phase 195 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3 (project-wide `npm run test` → `vitest run`) + in-migration `DO $$ … RAISE EXCEPTION` post-verify gates + inline-orchestrator `psql` audit SELECTs |
| **Config file** | none (Vitest project default) |
| **Quick run command** | `npx vitest run src/lib/buildingImages.test.js` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds (Vitest); SQL gates run inline at apply time |

---

## Sampling Rate

- **After every task commit:** Backend → the migration's own `DO $$` post-verify gate (row counts, casing, section-split, Vice-Mayor annotation, party-NULL). Frontend → `node --input-type=module -e "import('./src/lib/coverage.js')"` parse-check.
- **After every plan wave:** Full `psql` audit suite (row counts, casing, section-split) + `npx vitest run src/lib/buildingImages.test.js`
- **Before `/gsd:verify-work`:** All SQL post-verify gates green + **operator-approved substantive roster-currency checkpoint** (see Manual-Only) + `npm run test` green
- **Max feedback latency:** ~15 seconds (frontend); inline (backend gates)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 195-01-* | 01 | 1 | SUB-01 (govt/roster) | T-195-01 (section-split) / T-195-02 (wrong-district attach) | Chamber scoped to `government_id` subquery; every office↔district join scoped by `district_type` AND `state='az'` AND `geo_id='0451600'`; `party` NULL for all 7; 0 section-split rows | integration | in-migration `DO $$` gate + `psql -c "SELECT …"` audits | ✅ pattern exists (Torrance/Beaverton) | ⬜ pending |
| 195-02-* | 02 | 2 | SUB-01 (headshots) | — | Public-read RLS already in place | smoke | Python pipeline HTTP-200 pre-check + post-upload CDN HTTP 200 + PIL `(600,750)` assertion | ✅ pattern exists | ⬜ pending |
| 195-03-* | 03 | 3 | SUB-01 (stances) | T-195-04 (roster honesty) | 100% cited, no defaults, honest blanks, 36 non-judicial topics | manual + integration | `psql` citation-completeness + row-count audit | ✅ pattern exists | ⬜ pending |
| 195-04-* | 04 | 4 | BANR-01 | — | Licensed, non-AI, non-aerial banner; distinct from Pima/Tucson/AZ-state | unit + smoke | `npx vitest run src/lib/buildingImages.test.js` + `curl -I …/cities/oro-valley.jpg` | ✅ `buildingImages.test.js` exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*(Task IDs are placeholders keyed to plan number; the planner sets exact task IDs.)*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Same established non-gaps as every prior deep-seed phase: no dedicated `coverage.test.js` exists for any prior county/city addition (established non-gap); `buildingImages.test.js` already exercises `CURATED_LOCAL` generically. No framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **Roster currency during active 2026 election** | SUB-01 | Oro Valley is mid-way through a contested 2026 municipal election (Mayor + 3 council seats; primary date itself unresolved — July 21 vs Aug 4 2026; general Nov 3 2026). Sources conflict on incumbent re-election intent. Roster facts are `≤7 days` valid. | At execute time, BLOCKING: (a) attempt fresh Playwright fetch of `orovalleyaz.gov` Town-Clerk elections page (WAF-blocked to curl/WebFetch) OR fresh news search for authoritative primary/general dates + candidate list; (b) check whether primary results are certified; (c) if certified, explicitly decide with the operator whether to seed outgoing or incoming officeholder(s). Do NOT assume "no change since research." |
| **Compass stance evidence quality** | SUB-01 (stances) | Evidence-only stances require human/agent judgment on citation adequacy; no default values permitted. | Each seeded stance row has a citation; blanks are honest (no evidence = no row); researched against the 36 non-judicial live compass topics only. |
| **Banner visual distinctiveness** | BANR-01 | Whether the Oro Valley banner reads as too similar to Pima's already-shipped Catalina-range banner is a subjective visual call. | One-at-a-time sourcing pass reviews the candidate against sibling AZ banners (Pima Catalinas, Tucson streetscape, AZ-state Phoenix skyline); prefer a visually distinct subject if the shortlisted Pusch-Ridge candidates read too similar to Pima's. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (SQL `DO`-gate / `psql` audit / Vitest / CDN smoke) or a documented Manual-Only entry
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none — established infra)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
