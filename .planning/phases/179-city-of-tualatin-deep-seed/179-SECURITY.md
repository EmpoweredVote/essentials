---
phase: 179
slug: city-of-tualatin-deep-seed
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-03
---

# Phase 179 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 5 plans carried `<threat_model>` blocks); every mitigation
> was executed and evidenced in-session during phase execution (2026-07-02/03).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| operator → live prod DB | Probes (read-only) + structural/headshot/stance migrations applied via psql | Public officials' roster, offices, stances (no PII beyond public record) |
| operator → external web | Roster re-fetch, headshot + banner downloads from tualatinoregon.gov / Wikimedia (no WAF) | Public images + page text |
| operator → Supabase Storage | Processed headshots + banner uploaded to public politician_photos bucket | Public portrait/banner JPEGs |
| research agent → public web | Stance evidence gathered from official/news/campaign sources | Public statements, votes, news coverage |
| build pipeline → prod | coverage.js + buildingImages.js edits shipped via essentials main deploy | Frontend config rows |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-179-01 | Tampering | probe.sql on prod DB | accept | Read-only SELECT/\echo file (verified — no DDL/DML); consumed once | closed |
| T-179-02 | Spoofing | Wrong geo_id 4175200 (phantom seed) | mitigate | Probe A1/A2 ran first: 4175200=0 rows, 4174950=1 row — correction confirmed before any write | closed |
| T-179-03 | Spoofing | Stale roster | mitigate | Same-day direct re-fetch of tualatinoregon.gov/city-council/ — all 7 unchanged | closed |
| T-179-04 | Information Disclosure | topic_key list | accept | Public compass topic keys; no PII | closed |
| T-179-05 | Spoofing | Phantom government (wrong geo_id in 1169) | mitigate | Migration uses only 4174950; in-migration WR-01 geofence assertion passed; E2E gate h re-confirmed (4174950=1, 4175200=0) | closed |
| T-179-06 | Tampering | Duplicate/partial re-seed | mitigate | Pre-flight hard-abort DO block + WHERE NOT EXISTS guards + office guard; single transaction; applied exactly once (gov=1). Residual: ON CONFLICT(external_id) collider case — Probe D verified block free pre-apply; in-file identity gate recommended for Ph180 template (REVIEW WR-02) | closed |
| T-179-07 | Tampering | Dead post-verify gate hides section-split | mitigate | WR-01-fixed independent gates ran inside 1169 (NOTICE passed); independent E2E section-split query = 0 rows | closed |
| T-179-08 | Repudiation | Untracked structural change | mitigate | Version '1169' registered in the migration ledger; committed EV-Accounts 16739ee0 (pushed) | closed |
| T-179-09 | Elevation of Privilege | Roster misrepresentation (wards/appointed mislabels) | mitigate | E2E gates: exactly 2 citywide districts, 7 offices, uniform is_appointed=false — all verified live | closed |
| T-179-10 | Spoofing | Wrong-person headshot | mitigate | Official named-file sources; WR-02 url-embeds-uuid gate passed (7/7); visual identity spot-check performed (Bubenik/Reyes/Pratt; uniform studio batch) | closed |
| T-179-11 | Tampering | Corrupt/404-HTML saved as .jpg | mitigate | Script validated non-zero bytes + PIL open; 7/7 SUCCESS manifest; CDN URLs curl-verified HTTP 200. Residual: script exits 0 on partial failure — latent, didn't manifest; fix in Ph180 template (REVIEW WR-01) | closed |
| T-179-12 | Information Disclosure | Overlaid text/graphics on portraits | mitigate | Visual check clean — no overlays on reviewed portraits; re-encode strips EXIF | closed |
| T-179-13 | Tampering | Uncited/fabricated stance value | mitigate | Full-roster audit: 59 answers = 59 cited context rows (reasoning + sources), one-agent-at-a-time provenance | closed |
| T-179-14 | Tampering | topic_key typo silently drops rows | mitigate | WR-02 answers-count + WR-03 context-parity gates in all 7 files — all passed on apply (10/6/8/9/10/7/9) | closed |
| T-179-15 | Repudiation | Wrong-UUID stance misattribution | mitigate | WR-01 identity gate (UUID→external_id) in all 7 files — all passed on apply | closed |
| T-179-16 | Elevation of Privilege | Judicial topics on non-judicial officials | mitigate | Audit: 0 judicial-* rows across all 7 officials | closed |
| T-179-17 | Spoofing/IP | Unlicensed or AI-generated banner | mitigate | Wikimedia "Tualatin Commons daytime.JPG" — CC BY-SA 3.0 verified via imageinfo API; attribution comment committed; composition human-viewed; no AI imagery | closed |
| T-179-18 | Tampering | Wrong geo_id in coverage.js chip | mitigate | Entry hardcodes 4174950; grep for 4175200 = 0 in both files; live browse resolved the roster post-deploy | closed |
| T-179-19 | Tampering | Malformed frontend edit breaks prod build | mitigate | `npm run build` exit 0 (pre-commit + re-verified); vitest 73/73 | closed |
| T-179-20 | Denial of Service | Windows `\` path crashes Tailwind scan | mitigate | Forward-slash-only edits verified (review + grep); build green; committed docs scanned Tailwind-safe | closed |
| T-179-SC | Tampering | Supply chain (new package installs) | mitigate | Zero new package installs across all 5 plans — pre-existing deps only | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-179-01 | T-179-01 | Read-only probe SQL executed against prod is inherent to the Wave-0 gate design; file verified SELECT-only before run | orchestrator (auto-mode chain) | 2026-07-02 |
| AR-179-02 | T-179-04 | Compass topic keys are public product data; no sensitivity | orchestrator (auto-mode chain) | 2026-07-02 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-03 | 21 | 21 | 0 | /gsd-secure-phase (orchestrator classification; register authored at plan time; evidence from in-session gate runs + 179-REVIEW.md + 179-VERIFICATION.md) |

**Template hardening carried to Phase 180 (latent, non-blocking — from 179-REVIEW.md):**
1. Headshot pipeline script must exit non-zero on any failed upload (T-179-11 residual).
2. Structural migration post-verify should include an in-file external_id identity gate against ON CONFLICT colliders (T-179-06 residual).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-03
