---
phase: 193
slug: pima-county-board-of-supervisors-deep-seed
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-09
---

# Phase 193 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 6 plans carried `<threat_model>` blocks); this audit
> verified each mitigation exists in the implementation (verify-mode, not retroactive-STRIDE).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Pima GIS MapServer (remote) → loader | Untrusted ArcGIS JSON geometry + attribute strings over HTTP | District geometry/attributes |
| CivicPlus / Wikimedia (remote) → image pipeline | Untrusted remote image bytes over HTTP | Headshot + banner JPEGs |
| loader / migrations → production PostGIS + `inform`/`essentials` | Hand-authored SQL + converted geometry cross into live DB via `psql`/`tsx` (service-role) | Geofences, government/roster, stances |
| image pipeline → Storage | Processed images cross into the `politician_photos` bucket | Headshots, county banner |
| frontend edits → live app | `coverage.js` / `buildingImages.js` ship to Render on push | Coverage chip, banner wiring |
| production DB/CDN + live app → operator | Read-only audit + operator live browse | Observed end-state |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-193-SQLI | Tampering (Injection) | GIS attribute/geometry → INSERT | mitigate | Parameterized binds `$1-$4`; only trusted constants `MTFCC`/`STATE_CODE` interpolated (`load-pima-supervisor-boundaries.ts:265-273`) | closed |
| T-193-PROJ | Tampering | native SRID 2868 vs WGS84 | mitigate | `outSR=4326` mandatory; centroid WGS84 sanity (`loader:55`; audit 193-06) | closed |
| T-193-GEOM | Tampering | invalid/self-intersecting polygon | mitigate | `RETURNING ST_IsValid` + conditional `ST_MakeValid` recheck (`loader:272,285-307`) | closed |
| T-193-MTFCC | Tampering | wrong X-code un-routable | mitigate | `MTFCC='X0019'` (not X0002/X0018) (`loader:57`) | closed |
| T-193-COLL | Spoofing | 04019 3-way geo_id collision | mitigate | Every office↔district join scopes `district_type='LOCAL' AND mtfcc='X0019' AND state='az'`; never bare 04019 (`1288.sql:187-223`) | closed |
| T-193-SPLIT | Tampering | office↔chamber↔gov section-split | mitigate | Chamber scoped to Pima gov id; post-verify DO gate asserts 0 leak (`1288.sql:411-425`; audit g=0) | closed |
| T-193-ROST | Spoofing | roster / appointed rows | mitigate | Only 5 current supervisors; Cano `is_appointed=true`; blocking roster-currency human check performed (193-02-SUMMARY) | closed |
| T-193-CHAIR | Tampering | Chair double-count / mislabel | mitigate | Title annotation only; exactly 5 offices; `(Chair)` on D3/-4007003 only; post-verify gate (f) (`1288.sql:427-453`) | closed |
| T-193-IMG | Tampering | remote CivicPlus image fetch | mitigate | PIL `convert('RGB')` + JPEG re-encode `optimize=True` strips payloads (`_tmp-*.py:248-265`) | closed |
| T-193-BIND | Spoofing | photo↔politician binding | mitigate | Runtime UUID resolution by parameterized `external_id=%s` (`_tmp-*.py:167-177`) | closed |
| T-193-WRONG | Spoofing | wrong-but-present photo | transfer | Deferred to human live-browse spot-check; performed 5/5 correct-person incl. Cano D5 (193-06 Task 2) | closed |
| T-193-CITE | Repudiation | uncited / default stance rows | mitigate | Every answer has a matching context row with non-empty `sources`; no-evidence topics omitted; audit 0 uncited (`1290-1294.sql`) | closed |
| T-193-JUD | Tampering | judicial topics on non-judicial office | mitigate | 8 `judicial-*` keys excluded from all INSERTs; audit 0 judicial rows (`1290-1294.sql`) | closed |
| T-193-TENURE | Spoofing/Repudiation | pre-tenure vote attribution | mitigate | Only in-tenure actions attributed; Cano post-Apr-2025 (`1294.sql`) | closed |
| T-193-BAN | Tampering | remote banner image | mitigate | `process_banner.py` re-encodes JPEG (`107,128`); operator visual QA (193-05) | closed |
| T-193-LIC | Repudiation | banner license provenance | mitigate | Title\|author\|license recorded (WClarke, CC BY-SA 4.0) in attribution comment + SUMMARY (`buildingImages.js:418`) | closed |
| T-193-COVLIE | Tampering | dishonest coverage chip | mitigate | `hasContext:true` backed by 53 seeded stances (`coverage.js:248`) | closed |
| T-193-FALSE | Repudiation | audit false-positive (authored-not-applied) | mitigate | 193-06 audit reads live tables + CDN 200s (not files); 10/10 green | closed |
| T-193-MISFLAG | Tampering | audit misflag (44-vs-36 / 04019) | mitigate | Audit scoped to 36 non-judicial + X0019 LOCAL (Pitfalls 2 & 6) | closed |
| T-193-LSWIPE | Tampering | live-browser localStorage wipe | accept | Read-only operator browse; no Playwright localStorage manipulation (193-06-PLAN) | closed |
| T-193-KEY | Information disclosure | DATABASE_URL / service-role key | mitigate | Read only from gitignored `C:/EV-Accounts/backend/.env`; `_tmp` script gitignored; never hardcoded | closed |
| T-193-SC | Tampering | package installs | accept | No new npm/pip installs; reuses installed pg/tsx/dotenv/Pillow/requests/psycopg2/psql | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-193-LSWIPE | Live-browse verification is read-only + operator-driven; no automated localStorage manipulation on the live page (per `feedback_no_playwright_on_user_live_browser`). | Operator | 2026-07-09 |
| AR-02 | T-193-SC | No new package installs in this phase; reuses already-installed pg/tsx/dotenv/Pillow/requests/psycopg2/psql. Supply-chain surface unchanged. | Operator | 2026-07-09 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-09 | 22 | 22 | 0 | gsd-security-auditor (verify-mode) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-09
