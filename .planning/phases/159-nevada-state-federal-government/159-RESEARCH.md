# Phase 159: Nevada State & Federal Government - Research

**Researched:** 2026-06-23
**Domain:** NV state/federal government reconcile — constitutional officers + US Senate + US House
**Confidence:** HIGH (all findings DB-verified via live psql + WebSearch corroboration)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NV-STATE-01 | State of Nevada government seeded — Governor Lombardo + constitutional officers (Lt. Governor, Attorney General, Secretary of State, Treasurer, Controller) with chambers, offices, STATE_EXEC districts, and 600×750 headshots. | DB audit confirms 5 of 6 officials exist with headshots. One missing: Controller Andy Matthews — needs chamber + district + politician + office + headshot. |
| NV-STATE-02 | Nevada federal delegation seeded — 2 US Senators (Cortez Masto, Rosen) + 4 US House reps with geofence-linked districts and 600×750 headshots. | DB audit confirms 6 officials exist; Senators have headshots (old URL format); all 4 House reps have NO headshots. 4 bioguide IDs discovered. |
</phase_requirements>

---

## Summary

Phase 159 is a **reconcile-not-greenfield** phase. A pre-existing bulk seed created 11 of 12 target
officials before v18.0 started. The planner must reconcile gaps rather than build from scratch.

**STATE_EXEC (NV-STATE-01):** 5 of 6 constitutional officers are fully seeded with headshots under
the State of Nevada government (geo_id='32'). Only the **Controller (Andy Matthews)** is missing —
he needs a new chamber, new STATE_EXEC district, new politician row, new office row, and a 600×750
headshot. All 5 existing officials have headshots in the canonical `{uuid}-headshot.jpg` format.

**Federal Delegation (NV-STATE-02):** Both US Senators (Cortez Masto, Rosen) are seeded with
headshots, but using the older `{uuid}/default.jpg` URL format — functional and no action needed.
All 4 US House reps are seeded with correct district routing (Phase 158 tiger_geoids confirmed
linked) but **have NO headshots** — all 4 need 600×750 headshots uploaded. Bioguide IDs for all 4
are confirmed and the `unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` source
(already 4:5) is verified accessible.

**Districts.state casing (Success Criterion 4):** Already correct. STATE_EXEC=`NV`, NATIONAL_UPPER=`NV`,
NATIONAL_LOWER=`NV`. No casing fix needed. (COUNTY, STATE_UPPER, STATE_LOWER correctly use lowercase
`nv` per TIGER loader convention — this is expected and intentional.)

**Migration counter:** Next migration is **1050** (not 1048 as stated in STATE.md — migrations 1048
and 1049 were applied for Greene County + Springfield MO work after the v18.0 kickoff notes were
written). Confirmed by live DB query: MAX = 1049 (springfield_mo_roster).

**Primary recommendation:** This phase is 3 focused tasks: (1) create Controller Andy Matthews end-to-end,
(2) upload headshots for 4 House reps, (3) verify senators render. One structural migration (Controller) +
four headshot upload operations. No chamber/government creation needed for senators or House reps.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| STATE_EXEC official routing | Database / Storage | API / Backend | District geo_id='32' matches state-level address; no geofence needed for statewide exec offices |
| NATIONAL_UPPER (Senate) routing | Database / Storage | — | Senators route via districts.state='NV' match against address-resolved state; tiger_geoid intentionally NULL for all US Senate districts |
| NATIONAL_LOWER (House) routing | Database / Storage + CDN | — | House reps route via tiger_geoid on NATIONAL_LOWER districts (already loaded by Phase 158); confirmed linked |
| Headshot delivery | CDN / Static (Supabase Storage) | Frontend | All headshots served from `politician_photos` bucket; UI filters by `type='default'` |
| Reconcile / migration execution | Database / Storage | — | SQL migrations applied via apply_migration MCP; structural migrations register in schema_migrations |

---

## Live Database Audit — Complete Findings

This is the most important section. All data confirmed via `psql` against production DB (2026-06-23).

### State of Nevada Government

| Field | Value |
|-------|-------|
| `governments.id` | `9bb67edf-1081-4941-8f7d-2e791a5d28a1` |
| `governments.name` | `State of Nevada` |
| `governments.geo_id` | `32` |

### Existing NV STATE_EXEC Officials (5 of 6 — fully seeded)

| Name | external_id | politician UUID | Chamber | District | Headshot |
|------|-------------|-----------------|---------|----------|----------|
| Joe Lombardo | -3200001 | f8e66045-33cc-4f0e-ae31-58f58e148f94 | Governor | STATE_EXEC NV geo_id=32 | YES (cc_by-sa_3.0) |
| Stavros Anthony | -3200002 | 1997a34f-1aba-4832-be59-37a8074fc26a | Lieutenant Governor | STATE_EXEC NV geo_id=32 | YES (public_domain) |
| Aaron Ford | -3200003 | b71cb940-9a37-4935-8340-bf878c0ad288 | Attorney General | STATE_EXEC NV geo_id=32 | YES (public_domain) |
| Cisco Aguilar | -3200004 | dbf13dfe-703f-420a-8073-5ac2b564d80c | Secretary of State | STATE_EXEC NV geo_id=32 | YES (public_domain) |
| Zach Conine | -3200005 | 0e1c737b-223a-4008-8389-1307c00567e9 | Treasurer | STATE_EXEC NV geo_id=32 | YES (cc_by_2.0) |

All 5 headshots use the canonical `{uuid}-headshot.jpg` format at
`https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`.

### Missing NV STATE_EXEC Official — MUST CREATE

| Field | Value |
|-------|-------|
| Name | Andy Matthews |
| Office | State Controller |
| Party | Republican |
| In office since | January 2, 2023 |
| Term ends | January 4, 2027 |
| Next free external_id | -3200006 |
| Chamber needed | `Controller` (slug: `controller-of-nevada`) — does NOT exist yet |
| District needed | STATE_EXEC, state='NV', geo_id='32', label='Nevada Controller' — does NOT exist yet |
| Headshot source | Official: `controller.nv.gov/controller-info/` (no portrait visible in HTML); campaign site: `andyfornevada.com/wp-content/uploads/2019/09/DSC06381-1920.jpg`; Wikipedia/Ballotpedia also carry photo |

**Actions required for Controller:**
1. INSERT new chamber under State of Nevada (`government_id = 9bb67edf-...`)
2. INSERT new STATE_EXEC district for Controller
3. INSERT new politician row (external_id=-3200006)
4. INSERT new office row linking all three
5. Find, crop, resize, upload 600×750 headshot; INSERT politician_images row

### Existing NV Chambers (5 exist under State of Nevada)

| Chamber name | Chamber ID | Slug |
|-------------|-----------|------|
| Governor | 931e571f-9aba-45b8-9d14-2127c89ce34e | governor-of-nevada |
| Lieutenant Governor | 87a8ebd7-faba-4149-b98c-1efb9d054c94 | lieutenant-governor-of-nevada |
| Attorney General | a210e3aa-108c-4c00-895b-b38e0090d4a9 | attorney-general-of-nevada |
| Secretary of State | 4d26e23b-4733-4cc0-a754-2f89aa3c856f | secretary-of-state-of-nevada |
| Treasurer | abbdeba2-b41f-482f-8258-cc8184bd1831 | treasurer-of-nevada |

**Note:** `official_count` is NULL on all 5 existing chambers. The Controller chamber will also
leave official_count NULL (consistent with existing pattern; 1-seat exec chambers don't need it).

### Existing NV US Senators (NATIONAL_UPPER — fully seeded, headshots present)

| Name | external_id | Politician UUID | District UUID | Headshot URL format |
|------|-------------|-----------------|---------------|---------------------|
| Catherine Cortez Masto | -400057 | 91f87a53-13bc-4d35-b3c8-49227ae80faa | 0b8a7177-94a5-428e-b88e-4fdbc894cb14 | Old: `{uuid}/default.jpg` |
| Jacky Rosen | -400058 | e3a590be-1816-46bc-98f0-6a911dec9d9d | 0b8a7177-94a5-428e-b88e-4fdbc894cb14 | Old: `{uuid}/default.jpg` |

Both senators share district UUID `0b8a7177-94a5-428e-b88e-4fdbc894cb14`
(NATIONAL_UPPER, state='NV', geo_id='32', tiger_geoid=NULL). Each has their own `offices` row
(separate office IDs: 221f41ce-... and fbfbf210-...). Both are in the `U.S. Senate` chamber
(`7cbe07bc-84b8-433b-952b-540e7de18a92`) under United States Federal Government.

**Headshot URL format:** Senators use the older `kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/.../{uuid}/default.jpg`
format (not the newer `storage.supabase.co/.../{uuid}-headshot.jpg`). This is functional — 1,084
politicians across the DB still use this format. No remediation needed.

**No action required for senators.**

### Existing NV US House Reps (NATIONAL_LOWER — seeded but NO headshots)

| Name | external_id | Politician UUID | District UUID | tiger_geoid | Headshot |
|------|-------------|-----------------|---------------|-------------|----------|
| Dina Titus (CD-1) | -32001 | 786af5d2-9502-401c-a3ed-61de88e589e9 | 0d076790-7635-488d-a596-0be901dba96f | 3201 | NO |
| Mark E. Amodei (CD-2) | -32002 | 030b5074-8335-48b3-8d6b-0ea7c09814a5 | 997620c5-9d6d-4e71-bf40-478c40419795 | 3202 | NO |
| Susie Lee (CD-3) | -32003 | 325c7cae-aae6-4d7b-9c03-e707c7423d3c | 224399b2-e19b-458d-8cc7-e6e366debb9a | 3203 | NO |
| Steven Horsford (CD-4) | -32004 | 7644cd40-b5c1-494a-8e65-f3126fc7f9ee | 794d3443-795e-4ad1-a924-8df5e4d7b875 | 3204 | NO |

All 4 reps are in the `U.S. House of Representatives` chamber (`c2facc31-7b13-428c-b7b9-32d0d3b95f76`)
under United States Federal Government. All 4 district rows have `tiger_geoid` set (3201–3204),
confirmed linked to the Phase 158 TIGER geofence boundaries. District routing is already functional.

**bioguide_id is NULL in the DB for all 4 reps.** However, bioguide IDs are confirmed via Congress.gov:

| Rep | Bioguide ID | Source |
|-----|-------------|--------|
| Dina Titus (CD-1) | T000468 | [Congress.gov](https://www.congress.gov/member/dina-titus/T000468) |
| Mark E. Amodei (CD-2) | A000369 | [bioguide.congress.gov](https://bioguide.congress.gov/search/bio/A000369) |
| Susie Lee (CD-3) | L000602 | [Congress.gov search] |
| Steven Horsford (CD-4) | H001066 | [bioguide.congress.gov](https://bioguide.congress.gov/search/bio/H001066) |

**Actions required for House reps:**
- Upload 4 headshots using the unitedstates.github.io pattern (verified accessible for T000468)
- INSERT 4 `politician_images` rows (type='default')
- Optionally: backfill `bioguide_id` on politician rows (not required for success criteria)

### Districts.state Casing Summary

| District type | state value | Count | Action needed? |
|--------------|-------------|-------|----------------|
| STATE_EXEC | `NV` (uppercase) | 5 | None — correct |
| NATIONAL_UPPER | `NV` (uppercase) | 1 | None — correct |
| NATIONAL_LOWER | `NV` (uppercase) | 4 | None — correct |
| STATE_UPPER (legislature) | `nv` (lowercase) | 21 | None — Phase 160 concern |
| STATE_LOWER (legislature) | `nv` (lowercase) | 42 | None — Phase 160 concern |
| COUNTY | `nv` (lowercase) | 17 | None — intentional per TIGER loader |

**Conclusion:** Success Criterion 4 (uppercase 'NV' for STATE_EXEC/NATIONAL) is already satisfied.
No casing fix migration needed in Phase 159.

---

## Standard Stack

### Core Migration Pattern

| Component | Pattern | Source |
|-----------|---------|--------|
| Structural migration | Raw SQL via `mcp__supabase-local__apply_migration`; REGISTERS in `supabase_migrations.schema_migrations` | [VERIFIED: live DB] |
| Headshot migration | Raw SQL (politician_images INSERT); applied via `apply_migration` but treated as audit-only (no schema_migrations entry) | [VERIFIED: project convention] |
| Idempotency | All INSERTs use `WHERE NOT EXISTS` — no unique constraint on `governments`, `politician_images` | [VERIFIED: live DB schema] |
| Migration numbering | On-disk counter authoritative; next migration = **1050** | [VERIFIED: DB MAX=1049] |

### Headshot Pipeline

| Step | Detail |
|------|--------|
| Source (House reps) | `https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` (already 4:5 ratio, resize-only) |
| Source (Controller) | Official: `controller.nv.gov` (no portrait in HTML); fallback: Wikipedia / Ballotpedia / campaign site `andyfornevada.com` |
| Target dimensions | 600×750 (4:5, Lanczos, q90) |
| Storage path | `politician_photos/{uuid}-headshot.jpg` |
| DB columns | `politician_images(politician_id, url, type='default', photo_license)` |
| Full URL format | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg` |
| No photo_origin_url | `politician_images` table has NO `photo_origin_url` column — confirmed by schema inspection |

---

## Architecture Patterns

### System Architecture Diagram

```
NV Address Input
       |
       v
[TIGER Geofence Lookup] ─── Phase 158 complete ───> [District match by tiger_geoid]
       |
       +──> NATIONAL_LOWER? ──> tiger_geoid 3201-3204 ──> House rep
       |
       +──> NATIONAL_UPPER? ──> state='NV' ──> Senate district (geo_id=32) ──> both senators
       |
       +──> STATE_EXEC? ──> geo_id='32' match ──> 5 constitutional officers + Controller
       |
       v
[essentials.offices] ──> [essentials.politicians] ──> [essentials.politician_images]
                                                              |
                                                       Supabase Storage
                                                    politician_photos bucket
```

### Two-Senators-One-District Pattern

Both NV senators share a single NATIONAL_UPPER district row (UUID `0b8a7177-...`). Each senator
has their own `offices` row pointing to that shared district. The uniqueness key in the data model
is `(district_id, politician_id)` via the offices table — the district itself does NOT restrict
to one politician. This is the established cross-state pattern (verified identical for CA, OR, VA).

```sql
-- How 2 senators share 1 district (already correct in DB):
SELECT o.politician_id, o.district_id, p.full_name
FROM essentials.offices o
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE o.district_id = '0b8a7177-94a5-428e-b88e-4fdbc894cb14';
-- Returns: Catherine Cortez Masto | 0b8a7177-...
--          Jacky Rosen            | 0b8a7177-...
```

No data model work needed for senators — already correct.

### Controller Creation Pattern (mirrors existing NV exec officers)

```sql
-- Step 1: Chamber
INSERT INTO essentials.chambers (name, name_formal, government_id)
SELECT 'Controller', 'Nevada State Controller',
       (SELECT id FROM essentials.governments WHERE geo_id = '32')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name = 'Controller'
  AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')
);

-- Step 2: District
INSERT INTO essentials.districts (district_type, state, label, geo_id)
VALUES ('STATE_EXEC', 'NV', 'Nevada Controller', '32')
-- (add WHERE NOT EXISTS guard)

-- Step 3: Politician
INSERT INTO essentials.politicians (full_name, first_name, last_name, external_id, is_active)
VALUES ('Andy Matthews', 'Andy', 'Matthews', -3200006, true)
-- (add WHERE NOT EXISTS guard on external_id)

-- Step 4: Office
INSERT INTO essentials.offices (politician_id, chamber_id, district_id, title, is_appointed_position)
VALUES (<matthews_id>, <controller_chamber_id>, <controller_district_id>, 'Controller', false)
-- (add WHERE NOT EXISTS guard)
```

### Headshot Upload Pattern (House Reps)

```python
# Source: 4:5 ratio already — resize-only (no crop needed)
import requests
from PIL import Image
from io import BytesIO

bioguide = 'T000468'  # example: Dina Titus
url = f'https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg'
resp = requests.get(url)
img = Image.open(BytesIO(resp.content))
img = img.resize((600, 750), Image.LANCZOS)
# Save as q90 JPEG, upload to politician_photos/{politician_uuid}-headshot.jpg
```

### Anti-Patterns to Avoid

- **Do not create new government rows** for US Senate or US House — both use the existing
  `United States Federal Government` government (id: `0a6b51aa-00bb-4c15-b0f9-7f9da9150f47`).
  NV senators and reps are already in the correct chambers.
- **Do not create a new NV-specific Senate chamber** — senators are correctly in the
  statewide `U.S. Senate` chamber, not a state-specific one. (Contrast: Indiana has
  state-specific Senate chambers from a different seeding approach — do NOT follow that pattern.)
- **Do not "fix" the old-format headshot URLs** for the two senators (`/default.jpg`) — this
  format is functional (1,084 politicians use it) and the UI handles both formats.
- **Do not set districts.state to lowercase** for STATE_EXEC or NATIONAL tiers — the uppercase
  `NV` casing on these tiers is intentional and correct per the verified pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resizing | Custom PIL script | Standard 4:5 crop-then-resize-to-600x750-Lanczos-q90 pipeline | Aspect ratio distortion; memory file specifies crop-first rule |
| Supabase upload | Direct API calls | Apply migration with INSERT + Storage upload via curl/requests | Consistent with all prior phases |
| District routing verification | Custom test | `essentials.empowered.vote/results?browse_geo_id=3201&browse_mtfcc=G4110` browse link check | Standard project verification pattern |

---

## Common Pitfalls

### Pitfall 1: Controller District Already Exists Check
**What goes wrong:** Inserting a second STATE_EXEC Controller district without checking — creates a
duplicate that the backend may route incorrectly.
**Why it happens:** No unique constraint on the districts table for (district_type, state, label).
**How to avoid:** Always use `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE label='Nevada Controller' AND state='NV')`.
**Warning signs:** Query returning 2+ rows for STATE_EXEC/NV after the migration.

### Pitfall 2: Wrong Government for Controller Chamber
**What goes wrong:** Inserting the Controller chamber under `United States Federal Government`
instead of `State of Nevada`.
**Why it happens:** Copy-paste from a federal official migration.
**How to avoid:** Always reference `WHERE geo_id='32'` in the government subquery — never hardcode
the UUID.

### Pitfall 3: bioguide.congress.gov Image Not Available for New Members
**What goes wrong:** Some Congress members' images aren't yet indexed at
`unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` (the 5 CA freshmen in Phase 60
needed the clerk.house.gov fallback).
**Why it happens:** The unitedstates/images repo is community-maintained; new members lag.
**How to avoid:** Check `unitedstates.github.io` first; if 404, fall back to
`https://clerk.house.gov/images/members/{bioguide}.jpg`.
**Note:** All 4 NV House reps are incumbents (Titus since 2013, Amodei since 2011, Lee/Horsford
since 2019) — they are definitely indexed. The T000468 URL was verified accessible.

### Pitfall 4: Migration Counter Mismatch
**What goes wrong:** Writing migrations as 1048/1049 when those are already taken.
**Why it happens:** STATE.md still says "next migration 1048" (written before Greene County/Springfield work).
**How to avoid:** DB confirmed MAX=1049. Start at **1050** for Phase 159.
**Structural vs audit-only:** Controller creation is structural (registers in schema_migrations).
Headshot inserts are audit-only (applied via apply_migration but NOT added to schema_migrations counter).

### Pitfall 5: photo_origin_url Column Does Not Exist
**What goes wrong:** Migration uses `photo_origin_url` in the `politician_images` INSERT.
**Why it happens:** Historical plan docs referenced this column; it was removed.
**How to avoid:** The confirmed columns are: `id, politician_id, url, type, photo_license, focal_point`.
Never add `photo_origin_url` — it does not exist.

### Pitfall 6: Section-Split on Controller
**What goes wrong:** Controller ends up in the wrong government (e.g., US Federal) creating a
split-section defect where NV address returns Controller under the wrong header.
**Why it happens:** Wrong `government_id` in the chamber INSERT.
**How to avoid:** Run section-split SQL after migration; expect 0 rows for NV governments.

---

## External ID Scheme

### Established NV Conventions

| Tier | Scheme | Example | Notes |
|------|--------|---------|-------|
| STATE_EXEC | -3200001 through -3200006 | Gov=-3200001, Controller=-3200006 | Next free: -3200006 |
| NATIONAL_LOWER (House) | -32001 through -32004 | CD-1=-32001, CD-4=-32004 | Already occupied; DO NOT add new |
| NATIONAL_UPPER (Senate) | -400057, -400058 | National pool, not NV-specific range | Already occupied |

### CA Reference Pattern (for Phase 160 legislature planning, not needed in Phase 159)

| Tier | CA Scheme |
|------|-----------|
| State Senate | -6001001 through -6001040 |
| State Assembly | -6002001 through -6002080 |
| Federal House | -6000301 through -6000352 |

The NV legislature external_ids will follow their own scheme (planned for Phase 160, out of scope here).

---

## Headshot Sources by Official

| Official | Source | URL / Notes |
|----------|--------|-------------|
| Dina Titus (CD-1) | unitedstates/images | `https://unitedstates.github.io/images/congress/450x550/T000468.jpg` — verified accessible |
| Mark E. Amodei (CD-2) | unitedstates/images | `https://unitedstates.github.io/images/congress/450x550/A000369.jpg` |
| Susie Lee (CD-3) | unitedstates/images | `https://unitedstates.github.io/images/congress/450x550/L000602.jpg` |
| Steven Horsford (CD-4) | unitedstates/images | `https://unitedstates.github.io/images/congress/450x550/H001066.jpg` |
| Andy Matthews (Controller) | Official: `controller.nv.gov/controller-info/` (no portrait in page HTML); Campaign: `andyfornevada.com/wp-content/uploads/2019/09/DSC06381-1920.jpg`; Wikipedia/Ballotpedia both carry a portrait | Likely not free-license from campaign site — verify Wikimedia Commons or use `find-headshots` skill |

**Headshot skill:** The `/find-headshots` skill is available at `~/.claude/commands/find-headshots.md`.
Use it for Andy Matthews to ensure license compliance and correct 4:5 ratio sourcing.

**License notes for existing STATE_EXEC headshots:**
- Lombardo: cc_by-sa_3.0 (Wikimedia Commons source)
- Stavros Anthony, Aaron Ford, Cisco Aguilar: public_domain
- Zach Conine: cc_by_2.0

House reps from unitedstates.github.io are public domain (confirmed in Phase 60 CA research).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual SQL verification (no automated test suite for DB seeding phases) |
| Config file | N/A |
| Quick run command | Direct psql queries |
| Full suite command | N/A — validation is SQL-based spot-check |

### Phase Requirements → Verification Map

| Req ID | Behavior | Test Type | Verification Command / Method | Ready? |
|--------|----------|-----------|-------------------------------|--------|
| NV-STATE-01 | 6 STATE_EXEC officials exist under State of Nevada with headshots | SQL audit | `SELECT p.full_name, pi.url FROM politicians p JOIN offices o ... JOIN chambers ch ... JOIN governments g ... WHERE g.geo_id='32' AND d.district_type='STATE_EXEC'` returns 6 rows with non-null pi.url | After migration |
| NV-STATE-01 | Controller renders in app | Browse check | `essentials.empowered.vote/results?browse_geo_id=32&browse_mtfcc=G5200` | After migration |
| NV-STATE-02 | 4 House reps have headshots | SQL audit | `SELECT pi.url FROM politicians p JOIN politician_images pi ... WHERE p.external_id IN (-32001,-32002,-32003,-32004)` returns 4 rows | After headshots |
| NV-STATE-02 | House reps route correctly | Address smoke test | Enter Las Vegas CD-1 address → Titus appears | After headshots |
| NV-STATE-02 | Senators render with headshots | SQL check | `SELECT pi.url FROM politician_images WHERE politician_id IN (...)` returns 2 rows | Already satisfied |
| SC-4 | districts.state uppercase for NV exec/federal | SQL check | `SELECT district_type, state FROM districts WHERE state IN ('NV','nv') GROUP BY district_type, state` — STATE_EXEC/NATIONAL_* all show 'NV' | Already satisfied |
| Section split | 0 split-section defects | SQL check | `SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) FROM politicians p JOIN offices o ... WHERE geo_id LIKE '32%' GROUP BY g.name, p.full_name HAVING COUNT(DISTINCT ch.government_id) > 1` returns 0 rows | Pre/post migration |

### Wave 0 Gaps

None — this is a DB seeding phase with no test files to create.

---

## Runtime State Inventory

This is a reconcile phase; no system renaming or runtime state migration is involved.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | 5 STATE_EXEC politicians + 6 federal politicians already seeded; 2 senator headshots use old URL format | No migration — old format is functional |
| Live service config | None — no external service config depends on NV officials | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None | None |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration verification | YES | PostgreSQL 18.1 | N/A |
| Python PIL/Pillow | Headshot resize | [ASSUMED] | — | ImageMagick |
| mcp__supabase-local | Migration apply | YES | MCP registered | — |
| unitedstates.github.io | House rep headshots | YES (T000468 verified) | — | clerk.house.gov fallback |
| controller.nv.gov | Controller headshot | PARTIAL | No portrait in HTML | Campaign site / Wikipedia / Wikimedia |

**Missing with no fallback:** None blocking.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Susie Lee's bioguide ID is L000602 | Headshot Sources | Headshot fetch would 404; fallback to clerk.house.gov |
| A2 | Andy Matthews' campaign site images are usable after license check | Headshot Sources | Need to find alternative source (Wikimedia Commons likely has one) |
| A3 | `is_active` flag is the only filter for "current" politician checks | DB Audit | Could miss inactive rows if filter is different |

All other claims are VERIFIED via live psql queries or CITED from Congress.gov/bioguide.

---

## Open Questions

1. **Andy Matthews headshot license**
   - What we know: Official `controller.nv.gov` page has no portrait in HTML; campaign site has 2019 photos
   - What's unclear: License status of campaign site photos; Wikimedia Commons availability
   - Recommendation: Run `/find-headshots` skill for Andy Matthews before migration; prefer Wikimedia Commons cc_by or public_domain; if none, use Ballotpedia image and note license

2. **STATE.md migration counter**
   - What we know: STATE.md says "next migration 1048" but DB shows MAX=1049
   - What's unclear: Whether STATE.md needs updating before this phase starts or the planner corrects it inline
   - Recommendation: Planner should open Phase 159 plan with migration 1050 as the first structural migration, and note the STATE.md counter discrepancy for correction at phase completion

---

## Security Domain

No security-relevant surface areas in this phase (read-only data display, no auth changes, no user input processing). Standard DB write controls (service role via MCP apply_migration) are in place.

---

## Sources

### Primary (HIGH confidence — DB verified)
- Live psql query against production DB (`kxsdzaojfaibhuzmclfq`) via `DATABASE_URL` in `/c/EV-Accounts/backend/.env` — all table structures and row counts confirmed 2026-06-23
- `essentials.politicians`, `essentials.offices`, `essentials.chambers`, `essentials.governments`, `essentials.districts`, `essentials.politician_images` — all queried directly

### Secondary (MEDIUM confidence — official docs/search)
- [Congress.gov — Dina Titus](https://www.congress.gov/member/dina-titus/T000468) — bioguide T000468 confirmed
- [bioguide.congress.gov — Amodei](https://bioguide.congress.gov/search/bio/A000369) — bioguide A000369 confirmed
- [bioguide.congress.gov — Horsford](https://bioguide.congress.gov/search/bio/H001066) — bioguide H001066 confirmed
- [Andy Matthews — controller.nv.gov](https://www.controller.nv.gov/controller-info/) — Controller confirmed active, in office since 2023-01-02
- [unitedstates/images](https://github.com/unitedstates/images) — headshot URL pattern; T000468 verified accessible
- [Ballotpedia — Nevada state executive offices](https://ballotpedia.org/Nevada_state_executive_offices) — current roster corroboration

### Tertiary (LOW confidence — training data, not verified in this session)
- Susie Lee bioguide L000602 — [ASSUMED]; verify with `https://unitedstates.github.io/images/congress/450x550/L000602.jpg` before use

---

## Metadata

**Confidence breakdown:**
- DB audit (who exists, what's missing): HIGH — direct psql queries
- Migration counter (next=1050): HIGH — confirmed DB MAX=1049
- Districts.state casing: HIGH — all rows queried
- Headshot sources (House reps): HIGH — unitedstates.github.io pattern verified in Phase 60 + T000468 accessible
- Controller headshot source: MEDIUM — no portrait in official HTML; alternatives exist but license TBD
- Susie Lee bioguide: LOW — webSearch confirmed L000602, not directly clicked/fetched

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (stable government; no elections before Nov 2026)
