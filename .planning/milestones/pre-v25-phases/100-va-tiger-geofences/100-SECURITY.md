---
phase: 100
slug: 100-va-tiger-geofences
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-08
---

# Phase 100 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| TIGER scripts → filesystem | Script files written to EV-Accounts/backend/scripts/ | Source code only — no credentials or PII |
| loader → census.gov | HTTPS download of TIGER zip files (read-only) | Public geospatial data |
| loader → Supabase production | Live upserts to geofence_boundaries and districts (Plan 02 only) | Public geospatial boundaries; no PII |
| smoke test → Supabase production | Read-only spatial queries via DATABASE_URL | Read-only; public boundary data |
| dry-run MtfccAssertionError output → code edits | Actual sldl/place counts surface in error messages, flow into code as integer literals | Non-sensitive count values |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-100-01 | Tampering | load-state-tiger-boundaries.ts edits | mitigate | 4 additive inserts only; existing MD/OR/ME blocks preserved verbatim; `tsc --noEmit` compile gate on Task 1 acceptance | closed |
| T-100-02 | Information Disclosure | DATABASE_URL in smoke test | accept | dotenv.config() pattern; established in existing OR/MD smoke tests; no new exposure surface; Plan 01 does not run smoke against production | closed |
| T-100-03 | Denial of Service | sentinel 0 in sldl/place without follow-up | mitigate | Task 3 gates: 5-layer dry-run must print 5 PASSED lines before Plan 01 done; sentinel 0 left in place fails Plan 02 immediately on first layer | closed |
| T-100-04 | Integrity | Wrong sldl/place count written if out of range | mitigate | Range gate: sldl N must be in [95,105]; place N must be in [50,450]; executor halts on out-of-range before edit | closed |
| T-100-05 | Tampering | TIGER zip files from census.gov | accept | census.gov is authoritative US government source; HTTPS download; files are read-only during dry-run; no DB writes in Plan 01 | closed |
| T-100-SC | Tampering | npm/pip/cargo package installs | accept | No new packages installed; all dependencies pre-existing in EV-Accounts/backend (pg, dotenv, shapefile, adm-zip) | closed |
| T-100-06 | Integrity | Live load with stale sentinel 0 in EXPECTED_VA_MTFCC | mitigate | Task 1 requires executor to confirm non-zero EXPECTED_VA_MTFCC.sldl/place before running live; pre-flight assertion blocks any DB write on count mismatch | closed |
| T-100-07 | Integrity | ON CONFLICT DO NOTHING silently drops rows | accept | Established loader pattern; EXPECTED_VA_MTFCC pre-flight validates shapefile count before upsert; post-load Gate 3 SQL verifies DB counts match expected | closed |
| T-100-08 | Integrity | Wrong district state casing (VA vs va) | mitigate | Gate 5 SQL verifies both `state='va'` (STATE/COUNTY tiers) and `state='VA'` (NATIONAL_LOWER); mismatch caught before phase marked complete | closed |
| T-100-09 | Integrity | Alexandria dual-tier failure (missing G4020 or G4110) | mitigate | Gate 4 SQL asserts exactly 2 rows for geo_id IN ('5101000','51510'); smoke test SC1 independently asserts both geo_ids | closed |
| T-100-10 | Availability | 80MB national county zip causes timeout/OOM | accept | tl_2024_us_county.zip is national file; established pattern from OR/MD phases without issue; filtered by STATEFP='51' before upsert | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-100-01 | T-100-02 | DATABASE_URL exposure in smoke test — dotenv.config() pattern matches existing OR/MD smoke tests; no new attack surface; Plan 01 runs dry-run only | project team | 2026-06-08 |
| AR-100-02 | T-100-05 | TIGER zip integrity from census.gov — HTTPS enforced; files are read-only public geospatial data; census.gov is the authoritative source; file tampering risk is negligible | project team | 2026-06-08 |
| AR-100-03 | T-100-SC | No new packages — all loader dependencies (pg, dotenv, shapefile, adm-zip) were pre-existing in EV-Accounts/backend | project team | 2026-06-08 |
| AR-100-04 | T-100-07 | ON CONFLICT DO NOTHING — EXPECTED_VA_MTFCC pre-flight assertion validates shapefile count before any upsert; Gate 3 SQL post-load confirmation; idempotency is a feature, not a gap | project team | 2026-06-08 |
| AR-100-05 | T-100-10 | 80MB county zip — established pattern used by OR, MD, MA without incident; runtime OOM risk is negligible on the EV-Accounts loader environment | project team | 2026-06-08 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-08 | 11 | 11 | 0 | Claude (gsd-security-auditor, register_authored_at_plan_time: true) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-08
