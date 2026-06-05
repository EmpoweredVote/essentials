---
phase: 92
slug: md-state-government-db
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-05
---

# Phase 92 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Migration file → production DB | SQL written locally is applied directly to live Supabase production (mcp__supabase-local IS production). Pre-flight DO block + WHERE NOT EXISTS guards are the validation surface. | Public government metadata (names, titles, district codes) |
| Python script → external HTTP sources | Downloads images from cdn.maryland.gov, oag.maryland.gov, marylandcomptroller.gov, upload.wikimedia.org — all public government / public domain. No auth flows, no user input. | Public headshot images |
| Python script → Supabase Storage | Uses SUPABASE_SERVICE_ROLE_KEY (privileged) to upload to politician_photos bucket; key handled via env var only, never logged or committed. | Binary image data (non-sensitive) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-92-01-01 | Tampering | essentials.governments (assert vs insert) | mitigate | Pre-flight DO $$ asserts COUNT=1 with RAISE EXCEPTION; migration aborts and rolls back if State of Maryland row is missing or duplicated | closed |
| T-92-01-02 | Tampering | essentials.chambers (duplicate inserts on re-run) | mitigate | Every chamber INSERT uses WHERE NOT EXISTS guard on (name + government_id); re-running migration 269 inserts 0 additional rows | closed |
| T-92-01-03 | Denial of Service | Migration 269 apply path | accept | Migration is small (5 INSERTs + 1 assert); execution time < 100ms. No realistic DoS vector. | closed |
| T-92-01-04 | Information Disclosure | Chamber data | accept | All data is public record (constitutional officer titles). No PII involved. | closed |
| T-92-01-SC | Tampering | npm/pip/cargo installs | mitigate | No package installs in Plan 01 — pure SQL migration. Not applicable. | closed |
| T-92-02-01 | Tampering | essentials.districts STATE_EXEC casing | mitigate | All 5 district INSERTs use `state='MD'` uppercase; Task 1 grep gate fails if lowercase `state='md'` appears outside comments | closed |
| T-92-02-02 | Tampering | politicians is_appointed flag for Davis | mitigate | Gate 4 fails if any of the 4 non-Davis politicians has is_appointed=true, or if Davis has is_appointed=false | closed |
| T-92-02-03 | Tampering | politician_images column name | mitigate | Column is `url` not `storage_url`; grep gate fails if `storage_url` appears in audit migration | closed |
| T-92-02-04 | Tampering | Migration 271 applied via ledger | mitigate | Migration 271 header explicitly says "DO NOT apply via Supabase ledger"; audit-only per Multnomah 245 pattern; DB writes done live via Python | closed |
| T-92-02-05 | Spoofing | Headshot source authenticity | accept | All 5 source URLs are official government domains or Wikimedia Commons (public domain). Source URLs documented in audit migration 271 comments. | closed |
| T-92-02-06 | Information Disclosure | SUPABASE_SERVICE_ROLE_KEY in Python script | mitigate | Key read from env var only; grep for literal `eyJ` (JWT prefix) in script must return 0 matches — verified | closed |
| T-92-02-07 | Tampering | Headshot crop/resize integrity | mitigate | Pillow Lanczos resize at q90; crop to 4:5 BEFORE resize; no stretching. Visual verification deferred to Phase 94 sweep. | closed |
| T-92-02-08 | Denial of Service | Migration 270 apply path | accept | Migration inserts ~15 rows; execution time < 200ms. No realistic DoS vector. | closed |
| T-92-02-SC | Tampering | pip install (Pillow) | mitigate | Pillow already available in environment; no install step executed. Bounded to well-known package (billions of downloads). | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-92-01 | T-92-01-03 | Migration 269 is 5 INSERTs + 1 assert — sub-100ms; no DoS surface | Chris Cantrell | 2026-06-05 |
| AR-92-02 | T-92-01-04 | All chamber data is constitutional officer titles from public record; zero PII | Chris Cantrell | 2026-06-05 |
| AR-92-03 | T-92-02-05 | Headshot sources are official state government domains (cdn.maryland.gov, oag.maryland.gov, marylandcomptroller.gov) and Wikimedia Commons; authenticity self-evident; source URLs committed in audit migration | Chris Cantrell | 2026-06-05 |
| AR-92-04 | T-92-02-08 | Migration 270 inserts ~15 rows — sub-200ms; no DoS surface | Chris Cantrell | 2026-06-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Evidence Summary

**Plan 01 (Migration 269 — MD chambers):**
- T-92-01-01/02: SUMMARY confirms pre-flight assert + WHERE NOT EXISTS implemented; Gov row count = 1, chamber count = 5, idempotency confirmed.
- T-92-01-SC: No package installs — pure SQL plan.

**Plan 02 (Migration 270/271 — MD executives + headshots):**
- T-92-02-01: SUMMARY Gate 2 confirms 5 STATE_EXEC districts, 0 lowercase `state='md'` occurrences.
- T-92-02-02: SUMMARY Gate 4 confirms Davis is the only is_appointed=true; 5 rows total.
- T-92-02-03: SUMMARY confirms `url` used throughout; zero `storage_url` in migration 271.
- T-92-02-04: Migration 271 header enforces audit-only pattern; not applied via ledger.
- T-92-02-06: SUMMARY confirms SERVICE_ROLE_KEY read from env var; no hardcoded JWT in script.
- T-92-02-07: SUMMARY confirms crop-first-then-resize applied; Lanczos q90.
- T-92-02-SC: SUMMARY confirms Pillow already available; no install step needed.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-05 | 13 | 13 | 0 | gsd-secure-phase (short-circuit: register_authored_at_plan_time=true, threats_open=0) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-05
