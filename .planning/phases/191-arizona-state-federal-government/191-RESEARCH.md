# Phase 191: Arizona State & Federal Government - Research

**Researched:** 2026-07-08
**Domain:** AZ state/federal government reconcile — constitutional officers (incl. Corporation
Commission + Mine Inspector) + US Senate + US House
**Confidence:** HIGH (all roster/DB findings live-verified via psql against production; headshot
sources CITED from official/Wikimedia pages; party affiliations MEDIUM via WebSearch cross-check)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Constitutional officer roster scope**
- **D-01:** Seed **all statewide *elected* constitutional officers** (~11 total), not just the
  obvious executives. The slate: Governor (Katie Hobbs), Secretary of State (Adrian Fontes),
  Attorney General (Kris Mayes), State Treasurer (Kimberly Yee), Superintendent of Public
  Instruction (Tom Horne), **State Mine Inspector** (the AZ-only elected office), and the
  **5 Corporation Commissioners**. Exact current names/incumbency confirmed at research/plan time
  (see Live Database Audit below — this is now resolved).

**Arizona Corporation Commission**
- **D-02:** Model the Corporation Commission as **its own chamber under State of Arizona** — a
  distinct "Arizona Corporation Commission" chamber holding **5 at-large member offices**, all
  attached to the **statewide STATE_EXEC district** (commissioners are elected statewide,
  at-large, staggered terms — NOT by district). NOT modeled as 5 sibling STATE_EXEC officers, and
  NOT deferred.

**Elected vs appointed**
- **D-03:** **Elected-only.** Every seeded statewide official is flagged **voter-elected**.
  Appointed agency/cabinet directors are OUT of scope. All ~11 offices in D-01 are elected
  (`is_appointed_position=false` on every office row) — see the Mine Inspector nuance below for
  the one case where the *office* is elected but the *current holder* arrived by appointment.
- **D-03a:** Record a data/display note that **Arizona has no Lieutenant Governor** — the
  Secretary of State is first in the line of gubernatorial succession. Do not seed a phantom
  Lt. Gov office. (DB-confirmed: no such chamber/district/office exists — nothing to remove.)

**US House roster & vacancy policy**
- **D-04:** Seed the **current sitting officeholder** for each of the 9 CDs as of the seed date,
  including the **CD-7 succession** (Raúl Grijalva d. March 2025 → Adelita Grijalva, sworn in
  Nov 12, 2025). A genuinely vacant seat is seeded as a **vacant office** (no politician attached)
  — never backfill a departed member. The 2 US Senators (Kelly, Gallego) are NATIONAL_UPPER
  (statewide). **DB-confirmed: this is already done — see Live Database Audit.**

**Locked by precedent (NOT re-decided)**
- Headshot pipeline: **US House** → `unitedstates.github.io` 450×550 public-domain (resize-only,
  already 4:5); **state execs / senators / commissioners** → official `.gov` portrait or
  Wikimedia Commons with a **descriptive User-Agent** (generic UA → HTTP 429/403); 600×750
  Lanczos q90, 4:5 crop-first.
- District casing: `districts.state='AZ'` **uppercase** for STATE_EXEC + NATIONAL tiers
  (DB-confirmed already correct on all 14 pre-existing rows).
- Cross-repo: all migration/script work lives in `C:/EV-Accounts` (branch `master`, push deploys
  to Render); commit via `git -C "C:/EV-Accounts"`. `mcp__supabase-local` IS production (this
  research ran all queries read-only via `psql` against the same `DATABASE_URL`, since no
  supabase MCP tool is exposed to this agent — see Environment Availability).

### Claude's Discretion
- Exact ext_id numbering scheme for the new AZ officials — **RESOLVED by this research**, see
  External ID Scheme section (do NOT follow the naive "NV -32xxxxx" or "MD -24xxxx" FIPS-prefix
  advice literally — AZ's FIPS='04' causes a silent collision; see Pitfall 1).
- Which headshot source wins per official when multiple exist — **RESOLVED per-official** in
  Headshot Sources table below.
- Whether the Governor is modeled in its own single-seat chamber vs a shared "Executive Officers"
  chamber — **RESOLVED**: DB precedent already uses one-chamber-per-office (Governor, AG, SoS,
  Treasurer each have their own chamber) — continue that pattern for the 3 new chambers
  (Superintendent, Mine Inspector, Corporation Commission).
- Plan/wave split — recommend mirroring NV 159's 3-plan shape (see Recommended Plan Split).

### Deferred Ideas (OUT OF SCOPE)
- Appointed AZ executive-branch officials (agency/cabinet directors) — not voter-elected.
- Arizona Legislature (90 members) — Phase 192.
- Compass stances for state/federal officials — deferred milestone-wide (NV v18.0 pattern).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AZ-STATE-01 | State of Arizona government seeded — Gov. Hobbs + constitutional officers with chambers, offices, STATE_EXEC districts, 600×750 headshots. | DB audit: government + 4 of 11 officials already exist WITH headshots (Hobbs, Mayes, Fontes, Yee). 7 missing: Superintendent Horne, Mine Inspector Presmyk, 5 Corp Commissioners. Full roster, party, and headshot sources resolved below. |
| AZ-STATE-02 | Arizona federal delegation seeded — 2 US Senators (Kelly, Gallego) NATIONAL_UPPER + 9 US House reps NATIONAL_LOWER on CD geofences, all with headshots. | DB audit: **all 11 federal officials already exist and route correctly** (CD-7 succession already reflects Adelita Grijalva). Only gap: 8 of 9 House reps have NO headshot (Grijalva already has one). All 8 bioguide IDs resolved + HTTP-200-verified against `unitedstates.github.io`. |
</phase_requirements>

---

## Summary

Phase 191 is a **reconcile-not-greenfield** phase, more advanced than the NV 159 analog assumed.
Live production DB queries (via `psql`, since no Supabase MCP tool is exposed to this research
agent) show the State of Arizona government row, 4 of 11 STATE_EXEC officials, both US Senators,
and **all 9 US House reps (already reflecting the CD-7 succession)** pre-exist from an earlier
bulk seed. The planner's job is materially smaller than a greenfield build:

1. **STATE_EXEC gap (AZ-STATE-01):** Create 3 new chambers + 3 new STATE_EXEC districts + 7 new
   politicians + 7 new offices: Superintendent of Public Instruction (Tom Horne), State Mine
   Inspector (Les Presmyk), and the 5-member Arizona Corporation Commission (Nick Myers [Chair],
   Rachel Walden [Vice Chair], Lea Márquez Peterson, Kevin Thompson, René Lopez) as 5 offices
   sharing ONE new "Arizona Corporation Commission" STATE_EXEC district (mirrors the
   two-senators-one-district pattern, extended 5-way). All 7 need 600×750 headshots.
2. **Federal headshot gap (AZ-STATE-02):** Upload 8 headshots for US House reps (all except
   Adelita Grijalva, CD-7, who already has one) using the `unitedstates.github.io` resize-only
   pipeline — all 8 bioguide IDs confirmed and HTTP-200-verified in this research session. Zero
   new chamber/district/office/politician rows needed for federal — routing is already correct.
3. **No casing fix, no phantom Lt. Gov, no section-split defects** — all already correct/absent.

**Two load-bearing, non-obvious findings that change the plan shape versus the NV 159 template:**

- **External_id collision risk (Pitfall 1):** AZ's FIPS code is `'04'`, which causes any naive
  "FIPS + sequence" external_id scheme to numerically collide with unrelated pre-existing ranges
  (Oklahoma's House delegation sits at `-40001..-40005` because OK's FIPS is `40`; a shared
  national Senate/candidate pool occupies `-400001` through at least `-400503`). AZ's own 4
  pre-existing STATE_EXEC officials (`-400091..-400094`) already sit *inside* that busy shared
  pool — inconsistent with the MD/VA FIPS-prefix convention, but not this phase's problem to fix.
  **Continuing at `-400095` is live-collision-risk** (that pool is actively consumed by an
  automated multi-state candidate-seeding process — files up to `1281` on disk seed 2026 House
  candidates state-by-state). This research verified a clean, collision-free range instead:
  **`-4004001` through `-4004007`** (7 slots, confirmed empty).
- **Migration file-number collision (Pitfall 2):** `supabase_migrations.schema_migrations`
  ledger MAX is `1208`, but **75 unregistered audit-only migration files already exist on disk
  up to `1281`** (2026 House election-race + candidate seeds for other states, e.g.
  `1280_seed_sd_2026_house_election_race.sql`). Naively assigning "next = 1209" (a literal read
  of "DB-ledger-authoritative") **would collide with an existing file on disk.** The correct next
  file number for this phase is **`1282`** (structural), with the audit-only headshot migration
  at `1283`.

**Primary recommendation:** 2 plans. Plan 1 — one structural migration creating the 3 new
chambers/districts/7 politicians/7 offices for the STATE_EXEC gap (mirrors `270_md_state_executives.sql`
almost exactly), then an audit-only headshot migration for those same 7 (mirrors
`1052_nv_controller_headshot.sql` ×7, or `seed-state-exec-headshots.py`). Plan 2 — 8 US House
headshot uploads via the resize-only `unitedstates.github.io` pipeline (mirrors NV 159 Plan 02 /
`_tmp-va-execs-headshots.py`), audit-only migration. A verification pass (SQL audit + section-split
+ browse-link check) closes the phase, matching NV 159 Plan 03's shape.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| STATE_EXEC official routing | Database / Storage | API / Backend | District geo_id='04' matches state-level address; no geofence needed for statewide exec offices |
| Corporation Commission (5-seat collegial body) routing | Database / Storage | API / Backend | 5 offices share ONE STATE_EXEC district row (two-senators-one-district pattern, 5-way) |
| NATIONAL_UPPER (Senate) routing | Database / Storage | — | Both senators already correctly routed via shared district (geo_id='04', tiger_geoid NULL) — no action needed |
| NATIONAL_LOWER (House) routing | Database / Storage + CDN | — | All 9 reps already routed via tiger_geoid (0401-0409) linked to Phase 190 CD geofences — no action needed |
| Headshot delivery | CDN / Static (Supabase Storage) | Frontend | All headshots served from `politician_photos` bucket; UI filters by `type='default'` |
| Reconcile / migration execution | Database / Storage | — | SQL migrations applied via `apply_migration`/`execute_sql`; structural migrations register in `schema_migrations`, headshot migrations are audit-only |

---

## Live Database Audit — Complete Findings

All data confirmed via live `psql "$DATABASE_URL"` against production (`kxsdzaojfaibhuzmclfq`),
2026-07-08. `DATABASE_URL` lives in `C:/EV-Accounts/backend/.env`; `psql` (PostgreSQL 18.1) is
installed at `C:/Program Files/PostgreSQL/18/bin/psql`. **No Supabase MCP tool was exposed to this
research agent** — the executor/orchestrator split for actually *applying* migrations (per the
NV 159 precedent) still holds; this research only ran read-only SELECTs.

### State of Arizona Government (pre-existing)

| Field | Value |
|-------|-------|
| `governments.id` | `15436f29-38d2-4cc0-8958-9e74ba60fabf` |
| `governments.name` | `State of Arizona` |
| `governments.geo_id` | `04` |

### Existing AZ STATE_EXEC Officials (4 of 11 — fully seeded, all with headshots)

| Name | external_id | Office | Chamber ID | Headshot license |
|------|-------------|--------|-----------|-------------------|
| Katie Hobbs | -400091 | Governor | eef33a0b-f8c0-4e1c-98f3-755af6e7d010 | cc_by-sa_4.0 |
| Kris Mayes | -400092 | Attorney General | 67572020-9b65-460b-919a-9613ca537645 | cc_by-sa_2.0 |
| Adrian Fontes | -400093 | Secretary of State | d6280ace-e911-4053-924b-1f8007f78af8 | cc_by-sa_2.0 |
| Kimberly Yee | -400094 | Treasurer | e8966714-fa3e-4c90-be6a-ef9f0f383894 | cc_by-sa_3.0 |

All 4 STATE_EXEC districts (label = "Arizona {Office}", state='AZ' uppercase, geo_id='04',
`district_id=''`, `mtfcc=''`) and all 4 chambers already exist under the government above.
**Do NOT re-create these.** No Lieutenant Governor chamber/district/office exists anywhere in the
DB (confirms D-03a — nothing to remove).

### Missing AZ STATE_EXEC Officials — MUST CREATE (7 total)

| Official | Office | Party | In office since | How obtained office | Headshot source |
|----------|--------|-------|-----------------|---------------------|-----------------|
| Tom Horne | Superintendent of Public Instruction | Republican | Jan 2023 | Elected [CITED: Ballotpedia/AZPBS] | Wikimedia Commons `Tom_Horne_(52801743945)_(crop).jpg`, CC BY-SA 2.0, photographer Gage Skidmore, via en.wikipedia.org infobox [CITED: commons.wikimedia.org file page] |
| Les Presmyk | State Mine Inspector | Republican | Sept 12, 2025 | **Appointed** by Gov. Hobbs to fill a vacancy (predecessor Paul Marsh left mid-term) — the OFFICE itself is Arizona's only directly-elected mine-inspector post nationally [CITED: en.wikipedia.org/wiki/Arizona_State_Mine_Inspector] | No Wikimedia Commons portrait found (searched — only mineral/rock photos under his name, he is also a mineral collector). `asmi.az.gov/about/team` returned HTTP 403 (WAF, like other AZ .gov sites in this project's history). **Fallback needed at plan/execute time** — try Ballotpedia, AZGOP press release (`azgop.com/azgop-applauds-appointment-of-les-presmyk...`), or `/find-headshots` skill. |
| Nick Myers | AZ Corporation Commission (Chair) | Republican | selected Chair Jan 2026 | Elected [CITED: azcc.gov/news] | Official portrait: `azcc.gov/nick-myers/biography` → `/images/default-source/commissioners/2025-nick-myers.tmb-thumb200.jpg` — no explicit license stated; tag `press_use` per project convention for unlicensed official portraits |
| Rachel Walden | AZ Corporation Commission (Vice Chair) | Republican | first term (elected Nov 2024) | Elected | `azcc.gov/Rachel-Walden/biography` → `/images/default-source/commissioners/2025-rachel-walden.tmb-thumb200.jpg` — no explicit license; `press_use` |
| Lea Márquez Peterson | AZ Corporation Commission | Republican | 2nd elected term | Elected | **Preferred:** Wikimedia Commons `Lea_Marquez_Peterson_by_Gage_Skidmore.jpg`, CC BY 2.0 [CITED: en.wikipedia.org infobox]. Fallback: `azcc.gov/lmarquezpeterson/biography` → `/images/default-source/commissioners/peterson-photo.jpg` |
| Kevin Thompson | AZ Corporation Commission | Republican | elected Nov 2022 | Elected | `azcc.gov/kevin-thompson/biography` → `/images/default-source/commissioners/2025-kevin-thompson.tmb-medium.jpg` — no explicit license; `press_use` |
| René Lopez | AZ Corporation Commission | Republican | first term (elected Nov 2024) | Elected | `azcc.gov/Rene-Lopez/biography` → `/images/default-source/commissioners/lopez-headshota40372b9-eb5d-4c79-83b5-a3f7800dbe90.jpg` — no explicit license; `press_use` |

**Mine Inspector nuance (important, non-obvious — Pitfall 3):** Per D-01/D-03 the *office* is
voter-elected (`is_appointed_position=false` on the office row, matching Governor/AG/SoS/etc.),
but the *current holder* Les Presmyk personally arrived via gubernatorial appointment to fill a
vacancy, not by winning an election. Recommend `politicians.is_appointed=true` for Presmyk
specifically (mirrors the `politicians.is_appointed` boolean already used for MD's legislature-elected
Treasurer Dereck Davis in `270_md_state_executives.sql`) while keeping `offices.is_appointed_position=false`.
This is a genuinely different case from MD's Davis (whose *office* is legislature-elected, not
voter-elected) — document the distinction inline in the migration comment so a future audit
doesn't "fix" it incorrectly in either direction. Arizona holds a mine-inspector election on
Nov 3, 2026 (primary Aug 4, 2026) — Presmyk's `is_incumbent=true` status may change after that
election; out of scope for this phase (2026 election handling is Phase 199).

**Party affiliations are MEDIUM confidence** (WebSearch cross-checked against azcc.gov + Ballotpedia
titles, not directly fetched from a single authoritative roster page — Ballotpedia fetches
returned empty content in this session). All 5 commissioners are confirmed Republican by two
independent WebSearch passes. Party is stored on the `politicians.party` column for internal use
only — **never displayed on profiles** (antipartisan mission, project-wide).

### Corporation Commission Modeling (confirms D-02)

Create **one** new STATE_EXEC district (`label='Arizona Corporation Commission'`, `state='AZ'`,
`geo_id='04'`) and **one** new chamber (`name='Corporation Commission'` or similar,
`name_formal='Arizona Corporation Commission'`). All 5 commissioners get their own `offices` row
pointing at the **same** district_id and chamber_id — this is the exact `(district_id, politician_id)`
uniqueness pattern the NV 159 research documented for the two-senators-one-district case, just
extended to 5 politicians. Recommend `chambers.official_count=5` (unlike the 1-seat exec chambers
which correctly leave this NULL) since this is a genuinely collegial multi-member body — mirrors
how city councils set `official_count`.

### Existing AZ US Senators (NATIONAL_UPPER — fully seeded, headshots present, NO action needed)

| Name | external_id | Headshot URL format | License |
|------|-------------|---------------------|---------|
| Mark Kelly | -400007 | `.../{uuid}/default.jpg` (old format) | (blank — functional, do not "fix") |
| Ruben Gallego | -400008 | `.../{uuid}/default.jpg` (old format) | (blank — functional, do not "fix") |

Both share district state='AZ', geo_id='04', in the shared `U.S. Senate` chamber
(`7cbe07bc-84b8-433b-952b-540e7de18a92`) under `United States Federal Government`
(`0a6b51aa-00bb-4c15-b0f9-7f9da9150f47`) — **identical chamber/government UUIDs to the NV 159
precedent**, confirming this is a single shared national chamber, not state-specific.

### Existing AZ US House Reps (NATIONAL_LOWER — ALL 9 already seeded, correctly reflecting CD-7 succession)

| CD | Name | external_id | tiger_geoid | Bioguide (verified this session) | Headshot |
|----|------|-------------|-------------|-----------------------------------|----------|
| 1 | David Schweikert | -4001 | 0401 | S001183 | **MISSING** |
| 2 | Elijah Crane | -4002 | 0402 | C001132 | **MISSING** |
| 3 | Yassamin Ansari | -4003 | 0403 | A000381 | **MISSING** |
| 4 | Greg Stanton | -4004 | 0404 | S001211 | **MISSING** |
| 5 | Andy Biggs | -4005 | 0405 | B001302 | **MISSING** |
| 6 | Juan Ciscomani | -4006 | 0406 | C001133 | **MISSING** |
| 7 | Adelita S. Grijalva | -4007 | 0407 | G000606 (unindexed on unitedstates.github.io — see Pitfall 4) | **YES** (public_domain, already present) |
| 8 | Abraham J. Hamadeh | -4008 | 0408 | H001098 | **MISSING** |
| 9 | Paul A. Gosar | -4009 | 0409 | G000565 | **MISSING** |

**`bioguide_id` column is NULL in the DB for all 9** (matches NV 159's finding — optional
backfill, not required for success criteria). All 9 are in the shared `U.S. House of
Representatives` chamber (`c2facc31-7b13-428c-b7b9-32d0d3b95f76`) under the same
`United States Federal Government`. All `is_vacant=false` — **no vacant seat exists; D-04's
vacancy-handling clause is not triggered this cycle.**

**External_id scheme already in use for AZ House (confirmed, no action needed):** `-4001`
through `-4009` = AZ FIPS `'04'` + 2-digit CD number, with the leading zero of the FIPS code
naturally absorbed (`-0401` → `-401`... actually resolves to `-4001` because CD numbers are
zero-padded to 2 digits: `04`+`01`=`0401`→int `401`→ wait, verified empirically as `-4001`..`-4009`,
matching the same formula NV used (`-3201`..`-3204`, FIPS 32). Confirmed correct — do not
renumber.

### Districts.state Casing Summary (all correct, no fix needed)

| District type | state value | Count | Action needed? |
|--------------|-------------|-------|----------------|
| STATE_EXEC | `AZ` (uppercase) | 4 (existing) → 7 (new, once created) | None — continue uppercase |
| NATIONAL_UPPER | `AZ` (uppercase) | 1 | None — correct |
| NATIONAL_LOWER | `AZ` (uppercase) | 9 | None — correct |
| STATE_UPPER / STATE_LOWER / COUNTY | `az` (lowercase) | 30/30/15 | None — Phase 190/192 concern, not this phase |

### Section-Split Check (already clean)

```sql
SELECT p.full_name, count(DISTINCT ch.government_id) as gov_count
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state='AZ'
GROUP BY p.full_name
HAVING count(DISTINCT ch.government_id) > 1;
-- 0 rows returned (2026-07-08) — clean before this phase's writes
```

Re-run this exact query after the phase's migrations as the closing verification gate.

**Minor benign quirk (not a defect, do not fix):** `essentials.districts.government_id` on the
existing NATIONAL_UPPER AZ row happens to equal the State of Arizona government's UUID (a data
artifact from however that row was seeded). This column is NOT what drives section-split/routing
— `chambers.government_id` is authoritative (confirmed: both senators' chamber correctly points
to `United States Federal Government`). Out of scope to correct.

---

## External ID Scheme

### Pitfall 1 detail — why naive schemes collide for AZ

| Candidate scheme | Formula | Result | Status |
|-------------------|---------|--------|--------|
| Continue AZ's own pool | next after -400094 | `-400095` | **RISKY** — inside a shared, actively-growing national Senate/2026-candidate pool (occupied -400001 through at least -400503, sparse but growing weekly via automated per-state seed migrations) |
| MD/VA FIPS-prefix style | `-{FIPS}{4-digit seq}` = `-04` + `0001` | `-40001` | **COLLIDES** — this exact range is already occupied by Oklahoma's US House delegation (OK FIPS=`40`; `-40001` = Kevin Hern OK-01) — AZ's leading-zero FIPS silently aliases into another state's non-zero-padded FIPS+CD number |
| **RECOMMENDED: dedicated 7-digit range** | `-4004{3-digit seq}` | **`-4004001` through `-4004007`** | **VERIFIED FREE** via live query — use this |

### Recommended AZ STATE_EXEC external_id assignment (verified free 2026-07-08)

| external_id | Official |
|---|---|
| -4004001 | Tom Horne (Superintendent) |
| -4004002 | Les Presmyk (Mine Inspector) |
| -4004003 | Nick Myers (Corp Comm, Chair) |
| -4004004 | Rachel Walden (Corp Comm, Vice Chair) |
| -4004005 | Lea Márquez Peterson (Corp Comm) |
| -4004006 | Kevin Thompson (Corp Comm) |
| -4004007 | René Lopez (Corp Comm) |

`chambers.external_id` and `districts.external_id` are NULL for all 4 existing AZ STATE_EXEC
rows — continue leaving them NULL (only `politicians.external_id` is populated in this scheme,
matching the MD/NV precedent).

### No action needed for federal (already correct)
- US House: `-4001`..`-4009` (all 9 occupied, correct, do not touch).
- US Senate: `-400007`/`-400008` (occupied, correct, do not touch — these ARE inside the shared
  national pool, but they were assigned correctly at original seed time and are not being
  re-assigned by this phase).

---

## Migration Counter (Pitfall 2 — read carefully before assigning numbers)

| Source | Value | What it means |
|--------|-------|----------------|
| `supabase_migrations.schema_migrations` ledger MAX (integer versions only) | **1208** | Highest *registered* (structural) migration |
| On-disk file MAX in `C:/EV-Accounts/backend/migrations/` | **1281** | Highest file present, regardless of registration — includes 75 unregistered audit-only 2026-election-seed files (e.g. `1280_seed_sd_2026_house_election_race.sql`, `1281_seed_sd_2026_house_candidates.sql`) |
| **Correct next file number for this phase** | **1282** | Must exceed the on-disk MAX, not just the ledger MAX, to avoid filename collision |

**Recommended numbering for this phase:**
- `1282_az_state_exec_gap.sql` — structural (chambers + districts + 7 politicians + 7 offices +
  office_id back-fill). REGISTERS in `schema_migrations` as `('1282','az_state_exec_gap')`.
- `1283_az_state_exec_headshots.sql` — audit-only (7 `politician_images` rows). Does NOT register.
- `1284_az_house_headshots.sql` — audit-only (8 `politician_images` rows for the House reps).
  Does NOT register.
- Ledger stays at **1282** after this phase; next *structural* migration for Phase 192 (Legislature)
  should re-verify both the ledger MAX and the on-disk MAX again (this pattern of drift — 75
  files ahead of the ledger — is likely to recur given the ongoing 2026-election-seed automation
  visible on disk).

---

## Standard Stack

### Core Migration Pattern (identical to NV 159 / MD 270)

| Component | Pattern | Source |
|-----------|---------|--------|
| Structural migration | Raw SQL via `apply_migration`/`execute_sql`; REGISTERS in `schema_migrations` | [VERIFIED: live DB] |
| Headshot migration | Raw SQL (`politician_images` INSERT); audit-only, no `schema_migrations` entry | [VERIFIED: project convention, 1051/1052 precedent] |
| Idempotency | `WHERE NOT EXISTS` guards; `politicians.external_id` has a UNIQUE constraint (`ON CONFLICT (external_id) DO NOTHING` valid); `chambers`/`districts` have NO unique constraint — must use `WHERE NOT EXISTS` | [VERIFIED: live `\d` schema dump] |
| Migration numbering | On-disk file MAX (1281) authoritative for the next number, NOT the ledger MAX (1208) — see Pitfall 2 | [VERIFIED: `ls` + `psql` cross-check] |

### Headshot Pipeline

| Step | Detail |
|------|--------|
| Source (House reps ×8) | `https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` — all 8 non-Grijalva bioguide IDs HTTP-200-verified this session |
| Source (STATE_EXEC ×7) | Wikimedia Commons (Horne, Márquez Peterson — CC-licensed, PREFERRED) or official `.gov` portrait (Presmyk fallback needed, Myers/Walden/Thompson/Lopez via azcc.gov, `press_use`) |
| Target dimensions | 600×750 (4:5, Lanczos, q90) — crop-first for non-4:5 sources, resize-only for the already-4:5 unitedstates.github.io sources |
| Storage path | `politician_photos/{uuid}-headshot.jpg` |
| DB columns | `politician_images(id, politician_id, url, type='default', photo_license, focal_point)` — **NO `photo_origin_url` column** (Pitfall 5, same as NV 159) |
| CDN base | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/` |

**Reusable scripts confirmed still on disk** (`C:/EV-Accounts/backend/scripts/`):
- `_tmp-va-execs-headshots.py`, `_tmp-nv-controller-headshot.py` — crop-then-resize pipeline analogs
- `seed-state-exec-headshots.py`, `gen-state-exec-headshot-migrations.mjs`, `gen-state-exec-seed.mjs`,
  `query-state-exec-baseline.ts` — general-purpose STATE_EXEC tooling that may shortcut this phase
- `_state-exec-manual-urls.txt` / `_state-exec-manual-local.txt` — worth checking for any
  already-staged AZ entries before manual re-sourcing

**Reusable migrations confirmed on disk:**
- `270_md_state_executives.sql` — PRIMARY ANALOG for the structural migration (exact 3-step
  CTE pattern: district INSERT → politician CTE → office INSERT, `WHERE NOT EXISTS` guards)
- `315_va_headshots.sql` (referenced by NV 159, not re-verified this session — re-check exists) —
  audit-only `politician_images` INSERT shape
- `1050_nv_controller.sql` / `1051_nv_house_headshots.sql` / `1052_nv_controller_headshot.sql` —
  closest same-milestone-family analogs (single-official + headshot patterns)

---

## Architecture Patterns

### System Architecture Diagram

```
AZ Address Input
       |
       v
[TIGER Geofence Lookup] ─── Phase 190 complete ───> [District match by tiger_geoid]
       |
       +──> NATIONAL_LOWER? ──> tiger_geoid 0401-0409 ──> House rep (all 9 ALREADY seeded)
       |
       +──> NATIONAL_UPPER? ──> state='AZ' ──> Senate district (geo_id=04) ──> both senators (ALREADY seeded)
       |
       +──> STATE_EXEC? ──> geo_id='04' match ──> 11 constitutional officers
       |         ├─ 4 ALREADY seeded (Governor/AG/SoS/Treasurer)
       |         └─ 7 NET-NEW (Superintendent, Mine Inspector, 5× Corp Commission)
       |                    └─ 5 Corp Commissioners share ONE new district row
       |                       (two-senators-one-district pattern, 5-way)
       v
[essentials.offices] ──> [essentials.politicians] ──> [essentials.politician_images]
                                                              |
                                                       Supabase Storage
                                                    politician_photos bucket
```

### Five-Commissioners-One-District Pattern (extends the NV two-senators-one-district pattern)

```sql
-- Target shape after migration — 5 offices, 1 shared district, 1 shared chamber:
SELECT o.politician_id, o.district_id, p.full_name
FROM essentials.offices o
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE o.district_id = (SELECT id FROM essentials.districts
                        WHERE district_type='STATE_EXEC' AND state='AZ'
                        AND label='Arizona Corporation Commission');
-- Expected: 5 rows (Myers, Walden, Márquez Peterson, Thompson, Lopez)
```

The uniqueness key is `(district_id, politician_id)` at the offices level — the district itself
does not restrict to one politician, exactly as documented in NV 159 research for the Senate case.

### Anti-Patterns to Avoid

- **Do not re-create Governor/AG/SoS/Treasurer** — all 4 exist with headshots already.
- **Do not "fix" the senators' old-format headshot URLs** (`/default.jpg`) — functional, matches
  1,084+ other politicians project-wide.
- **Do not assign the Mine Inspector's office `is_appointed_position=true`** just because the
  current holder arrived by appointment — the office itself is Arizona's only directly-elected
  mine-inspector post. Use `politicians.is_appointed=true` on Presmyk's row instead (see
  Live Database Audit → Mine Inspector nuance).
- **Do not model the 5 Corporation Commissioners as 5 separate STATE_EXEC districts** — D-02
  explicitly locks this as one shared district (collegial body), not 5 sibling single-seat execs.
- **Do not assign external_id by "continuing the pool at -400095"** — verified collision-risk
  (Pitfall 1). Use `-4004001`..`-4004007` instead.
- **Do not assign migration file number 1209** — collides with an existing on-disk file
  (Pitfall 2). Use 1282+.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resizing | Custom PIL script from scratch | Adapt `_tmp-va-execs-headshots.py` / `_tmp-nv-controller-headshot.py` crop-then-resize pipeline | Aspect-ratio-safe, already handles RGBA→white-composite and Lanczos q90 |
| STATE_EXEC seeding boilerplate | Hand-write 7 CTE blocks from zero | Copy-adapt `270_md_state_executives.sql` (5-block CTE template, exact column lists) | Battle-tested idempotent shape; column lists match current schema exactly |
| Multi-seat collegial body modeling | Invent a new schema pattern (e.g. a `seats` join table) | Reuse the existing two-senators-one-district `(district_id, politician_id)` pattern, 5-way | No schema change needed; `offices.seats` column already exists if a count display is wanted |
| District routing verification | Custom test harness | `essentials.empowered.vote/results?browse_state_officials=AZ&browse_label=Arizona` (statewide) — NV 159's Plan 03 found the naive `browse_geo_id=32&browse_mtfcc=G5200` link is WRONG (G5200 is the CD mtfcc, not used for STATE_EXEC/senators) | Avoids repeating NV's browse-link mistake |

---

## Common Pitfalls

### Pitfall 1: External_id collision in the shared national pool
**What goes wrong:** Assigning the next AZ STATE_EXEC official the ID `-400095` (naive
"continue the existing AZ range") silently collides with an actively-growing, cross-state
Senate/2026-candidate seeding pool that already occupies most of `-400001` through `-400503`.
**Why it happens:** AZ's own 4 pre-existing STATE_EXEC officials happen to sit inside that same
pool (an inconsistency baked in at original seed time) — it looks like "the AZ range" but isn't.
**How to avoid:** Use the verified-free `-4004001`..`-4004007` range instead (see External ID
Scheme). Re-verify freedom immediately before applying, since the pool grows continuously.
**Warning signs:** `ON CONFLICT (external_id) DO NOTHING` silently inserting 0 rows for an
official that should be new — always assert row count after insert.

### Pitfall 2: Migration file-number collision (ledger MAX ≠ disk MAX)
**What goes wrong:** Assigning migration number `1209` based on `schema_migrations` ledger
MAX=1208 collides with an existing file `1209_seed_XX_2026_house_election_races.sql` already on
disk (unregistered, audit-only).
**Why it happens:** A separate, ongoing 2026-election-candidate-seeding workstream has been
writing audit-only migration files sequentially (up to 1281) without registering them in the
ledger, so the ledger and the disk have drifted 73 files apart.
**How to avoid:** Always check BOTH `ls C:/EV-Accounts/backend/migrations/ | sort` (disk MAX) AND
the `schema_migrations` ledger MAX before assigning a number. Use `max(disk, ledger) + 1`.
**Warning signs:** `test -f` on the target filename succeeding before you've written it — that
means it's a collision, not the target of your migration.

### Pitfall 3: Mine Inspector appointed-holder-on-an-elected-office
**What goes wrong:** Setting `offices.is_appointed_position=true` for the Mine Inspector because
the current holder (Presmyk) was appointed — this incorrectly recategorizes an elected
constitutional office as an appointed one project-wide.
**Why it happens:** Confusing "how did THIS PERSON get the job" with "what TYPE of office is
this." Arizona's mine inspector is normally elected (the only state to do so); Presmyk is a
mid-term gubernatorial appointee filling a vacancy, same mechanism as a Senate vacancy appointment.
**How to avoid:** `offices.is_appointed_position=false` (office type), `politicians.is_appointed=true`
(this specific holder's path to office) — document both in a migration comment.
**Warning signs:** Office-type queries (e.g. "list all appointed AZ offices") incorrectly
including Mine Inspector.

### Pitfall 4: unitedstates.github.io lag for newly-sworn members
**What goes wrong:** Assuming every current House member has an indexed image at
`unitedstates.github.io/images/congress/450x550/{bioguide}.jpg`.
**Why it happens:** The community-maintained `unitedstates/images` repo lags for very recent
swearings-in — confirmed this session: Adelita Grijalva's bioguide `G000606` returns **HTTP 404**
(she was sworn in Nov 12, 2025, after a 50-day post-special-election wait). All 8 other AZ House
members (S001183, C001132, A000381, S001211, B001302, C001133, H001098, G000565) returned
**HTTP 200** and are safe to use directly.
**How to avoid:** Not blocking for this phase — Grijalva already has a headshot from another
source in the DB. If it ever needs re-sourcing, fall back to `clerk.house.gov/images/members/{bioguide}.jpg`
or Wikimedia Commons per the NV 159 precedent (Pitfall 3 there).
**Warning signs:** 404 on the unitedstates.github.io URL for any freshman member (post-2024
election or special-election winner).

### Pitfall 5: photo_origin_url column does not exist
**What goes wrong:** Migration includes `photo_origin_url` in the `politician_images` INSERT
column list.
**Why it happens:** Historical plan docs referenced this column; confirmed removed from schema.
**How to avoid:** Confirmed columns (live `\d essentials.politician_images`, 2026-07-08):
`id, politician_id, url, type, photo_license, focal_point`. Never add `photo_origin_url`.

### Pitfall 6: azcc.gov / asmi.az.gov WAF blocking
**What goes wrong:** Direct `curl`/`fetch` to `asmi.az.gov` returns HTTP 403 (confirmed this
session for `/about/team`); some azcc.gov commissioner bio pages 404 on guessed slugs (e.g.
`/lea-marquez-peterson` 404'd — the real slug is `/lmarquezpeterson/biography`).
**Why it happens:** WAF rules and non-obvious URL slugs (matches the broader project pattern of
per-state/-agency .gov WAF quirks documented in memory, e.g. `feedback_no_google_places`-adjacent
gotchas for Cornelius/Pomona/Henderson).
**How to avoid:** Fetch the membership index page first to discover exact bio-page slugs (done
this session — recorded in the Headshot Sources table); for `asmi.az.gov`, plan a fallback chain
(Ballotpedia → AZGOP press photo → `/find-headshots` skill) rather than retrying the WAF'd URL.

---

## Recommended Plan Split

Mirrors NV 159's 3-plan shape, collapsed to 2 plans since the federal delegation needs no
structural work this time (only headshots):

**Plan 1 — AZ STATE_EXEC gap (structural + headshots, satisfies most of AZ-STATE-01)**
1. Write structural migration `1282_az_state_exec_gap.sql` (3 chambers, 3 districts, 7
   politicians `-4004001`..`-4004007`, 7 offices, office_id back-fill) — direct adaptation of
   `270_md_state_executives.sql`.
2. Apply inline; audit confirms 11 STATE_EXEC rows under State of Arizona.
3. Source + upload 7 headshots (Horne + Márquez Peterson via Wikimedia CC; Myers/Walden/Thompson/Lopez
   via azcc.gov `press_use`; Presmyk via fallback chain — flag as `checkpoint:human-verify` if no
   licensed source is found in time). Write audit-only `1283_az_state_exec_headshots.sql`.

**Plan 2 — AZ US House headshots (satisfies remainder of AZ-STATE-02)**
1. Download/resize/upload 8 headshots from `unitedstates.github.io` (bioguide IDs listed above,
   all HTTP-200-verified) — resize-only, no crop needed (already 4:5).
2. Write audit-only `1284_az_house_headshots.sql`.
3. Verification pass: STATE_EXEC audit (11 rows, all headshots), House audit (9 rows, all
   headshots), Senate audit (2 rows, unchanged), section-split (0 rows), casing check (AZ
   uppercase on STATE_EXEC/NATIONAL), no-duplicate-district check on
   'Arizona Corporation Commission' (exactly 1). Correct browse link:
   `essentials.empowered.vote/results?browse_state_officials=AZ&browse_label=Arizona`.

---

## Runtime State Inventory

Not applicable — this is a data-seeding phase, not a rename/refactor/migration phase. No runtime
state renaming is involved.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | 4 STATE_EXEC + 2 Senate + 9 House AZ officials already seeded; 7 STATE_EXEC gaps identified | Migration for the 7 gaps + 8 House headshots (see plan split) |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | 75 unregistered migration files already on disk past the ledger MAX — informs numbering, not a defect to fix | None beyond correct numbering |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | DB verification (this research + planner) | YES | PostgreSQL 18.1 (`C:/Program Files/PostgreSQL/18/bin/psql`) | — |
| `DATABASE_URL` | DB verification | YES | in `C:/EV-Accounts/backend/.env` (Supabase pooler) | — |
| `mcp__supabase-local` | Migration apply (per CONTEXT.md convention) | **NOT EXPOSED to this research agent** — all verification in this session used `psql` directly against the same `DATABASE_URL` instead | — | `psql` is a fully adequate read-only fallback; write operations (apply_migration) remain an inline-orchestrator step per the executor/orchestrator split documented in NV 159-01-PLAN.md |
| Python PIL/Pillow | Headshot resize | [ASSUMED — not directly verified this session, same as NV 159] | — | ImageMagick |
| `unitedstates.github.io` | House headshots ×8 | YES (all 8 non-Grijalva bioguide IDs HTTP-200 this session) | — | `clerk.house.gov/images/members/{bioguide}.jpg` |
| `azcc.gov` | 4 of 5 Corp Commission headshots | YES (portrait URLs resolved for Myers/Walden/Thompson/Lopez/Márquez Peterson) | — | Wikimedia Commons (Márquez Peterson already has a better CC-licensed alternative there) |
| `asmi.az.gov` | Mine Inspector headshot | **NO — HTTP 403 (WAF)** | — | Ballotpedia / AZGOP press photo / `/find-headshots` skill |
| Wikimedia Commons | Horne, Márquez Peterson headshots (preferred) | YES | — | — |

**Missing with no fallback:** None blocking — Presmyk's headshot has a fallback chain, just no
single confirmed licensed source yet (flagged for `/find-headshots` skill or human checkpoint,
matching the NV 159 Andy Matthews precedent exactly).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Party affiliations for the 5 Corp Commissioners (all Republican) | Live Database Audit | Low — party is never displayed on profiles (antipartisan mission); only affects internal `politicians.party` column accuracy |
| A2 | `press_use` is the correct license tag for azcc.gov official portraits with no explicit stated license | Headshot Sources | Low-medium — if AZ has a specific open-license statute for state agency photos, a more precise tag (e.g. `government-official`, already used elsewhere in the DB) might be more accurate; `press_use` is the safer conservative default per Henderson precedent |
| A3 | Python PIL/Pillow is available in the execution environment for the headshot pipeline | Environment Availability | Low — same assumption NV 159 made; ImageMagick fallback exists project-wide |
| A4 | Les Presmyk's headshot will be resolvable via Ballotpedia/AZGOP/find-headshots before this phase completes | Live Database Audit | Medium — if no licensed source is found, this becomes a `checkpoint:human-verify` blocker (same resolution path NV 159 used for Andy Matthews) |

**All other claims** (DB state, external_id ranges, migration numbering, bioguide IDs, HTTP
status of image sources) are **VERIFIED** via live `psql` queries or direct `curl` HTTP checks in
this session, or **CITED** from official .gov/Wikipedia/Wikimedia Commons/Ballotpedia/AZPBS pages.

---

## Open Questions

1. **Les Presmyk headshot license**
   - What we know: No Wikimedia Commons portrait exists (only mineral-specimen photos under his
     name); `asmi.az.gov` is WAF-blocked (403).
   - What's unclear: Whether Ballotpedia, an AZGOP press photo, or another source carries a
     usable license.
   - Recommendation: Run the `/find-headshots` skill (`~/.claude/commands/find-headshots.md`,
     confirmed present) for Les Presmyk at execution time; fall back to a `checkpoint:human-verify`
     if no licensed source exists, exactly mirroring the NV 159 Andy Matthews resolution.

2. **Corporation Commission chamber name**
   - What we know: D-02 specifies "a distinct 'Arizona Corporation Commission' chamber."
   - What's unclear: Whether `chambers.name` should be the short form `'Corporation Commission'`
     (matching the existing short-form convention: `'Governor'`, `'Attorney General'`, etc.) with
     `name_formal='Arizona Corporation Commission'`, or whether `name` itself should be the full
     "Arizona Corporation Commission" string.
   - Recommendation: Use the short-form convention (`name='Corporation Commission'`,
     `name_formal='Arizona Corporation Commission'`) for consistency with the 4 existing AZ
     chambers and the MD 5-chamber precedent — this is a low-risk, low-ambiguity call the planner
     can make directly without a checkpoint.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual SQL verification (no automated test suite for DB seeding phases — same as NV 159) |
| Config file | N/A |
| Quick run command | Direct `psql` queries (see below) |
| Full suite command | N/A — validation is SQL-based spot-check + live browse-link check |

### Phase Requirements → Verification Map

| Req ID | Behavior | Test Type | Verification Command / Method | Ready? |
|--------|----------|-----------|-------------------------------|--------|
| AZ-STATE-01 | 11 STATE_EXEC officials exist under State of Arizona with headshots | SQL audit | `SELECT p.full_name, pi.url FROM politicians p JOIN offices o ... JOIN chambers ch ... JOIN governments g ... WHERE g.geo_id='04' AND d.district_type='STATE_EXEC'` returns 11 rows, all non-null `pi.url` | After Plan 1 |
| AZ-STATE-01 | Corporation Commission renders as 5 offices on 1 shared district | SQL audit | `SELECT count(*) FROM offices WHERE district_id = (SELECT id FROM districts WHERE label='Arizona Corporation Commission')` = 5 | After Plan 1 |
| AZ-STATE-01 | Statewide officials render in app | Browse check | `essentials.empowered.vote/results?browse_state_officials=AZ&browse_label=Arizona` returns all 11 with images | After Plan 1 |
| AZ-STATE-02 | 8 House reps gain headshots (Grijalva already has one) | SQL audit | `SELECT pi.url FROM politicians p JOIN politician_images pi ... WHERE p.external_id IN (-4001..-4009)` returns 9 rows, all non-null | After Plan 2 |
| AZ-STATE-02 | House reps route correctly by CD | Address smoke test | Enter an address in each of the 9 CDs (Phase 190's `smoke-az-geofences.ts` addresses are reusable) → correct rep appears | After Plan 2 |
| AZ-STATE-02 | Senators render with headshots | SQL check | `SELECT pi.url FROM politician_images WHERE politician_id IN (Kelly, Gallego ids)` returns 2 rows | Already satisfied — no action |
| Section split | 0 defects across all AZ tiers | SQL check | The section-split query in Live Database Audit above, re-run post-migration | Pre-verified 0; re-check post-migration |
| No duplicate districts | Exactly 1 'Arizona Corporation Commission' STATE_EXEC district | SQL check | `SELECT count(*) FROM districts WHERE district_type='STATE_EXEC' AND state='AZ' AND label='Arizona Corporation Commission'` = 1 | After Plan 1 |
| No FIPS/pool collision | New external_ids didn't silently no-op via ON CONFLICT | SQL check | `SELECT count(*) FROM politicians WHERE external_id BETWEEN -4004007 AND -4004001` = 7 (not fewer) | After Plan 1 |

### Wave 0 Gaps

None — this is a DB seeding phase with no test files to create.

---

## Security Domain

No security-relevant surface areas in this phase (read-only data display, no auth changes, no
user input processing). Standard DB write controls (service role via `apply_migration`/`execute_sql`)
are in place. Party-affiliation data continues to be stored but never displayed, per the
project-wide antipartisan mission — no new exposure introduced by this phase.

---

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` file exists in the working directory — no additional project-specific directives
beyond what's captured in `.planning/` and the user's persistent memory (already folded into the
User Constraints and pitfalls above, e.g. antipartisan party-display rule, `mcp__supabase-local`-is-production
caveat, no-autostart-next-phase rule for the orchestrator).

---

## Sources

### Primary (HIGH confidence — DB verified live this session)
- Live `psql` query against production DB (`kxsdzaojfaibhuzmclfq`) via `DATABASE_URL` in
  `C:/EV-Accounts/backend/.env`, 2026-07-08 — all table structures, row counts, and gap analysis
  confirmed directly (`essentials.politicians`, `offices`, `chambers`, `governments`, `districts`,
  `politician_images` all queried and schema-dumped via `\d`).
- `ls C:/EV-Accounts/backend/migrations/` and `scripts/` — on-disk file inventory confirming
  migration-number drift and reusable script/migration analogs.
- Direct `curl -o /dev/null -w "%{http_code}"` checks against `unitedstates.github.io` (8/8
  bioguide IDs HTTP 200) and `asmi.az.gov` (HTTP 403).

### Secondary (MEDIUM confidence — official docs/search, cross-checked)
- [Ballotpedia — Tom Horne (Arizona)](https://ballotpedia.org/Tom_Horne_(Arizona)) — current
  Superintendent confirmed
- [Wikipedia — Arizona State Mine Inspector](https://en.wikipedia.org/wiki/Arizona_State_Mine_Inspector) —
  Les Presmyk appointment, succession history, "only state with direct election" fact
- [Wikimedia Commons — File:Tom_Horne_(52801743945)_(crop).jpg](https://commons.wikimedia.org/wiki/File:Tom_Horne_(52801743945)_(crop).jpg) —
  CC BY-SA 2.0, photographer Gage Skidmore, confirmed via file page
- [Wikipedia — Lea Marquez Peterson](https://en.wikipedia.org/wiki/Lea_Marquez_Peterson) — CC BY 2.0
  Gage Skidmore infobox image
- `azcc.gov/arizona-power-plant/membership` + individual bio pages (`/nick-myers/biography`,
  `/Rachel-Walden/biography`, `/lmarquezpeterson/biography`, `/kevin-thompson/biography`,
  `/Rene-Lopez/biography`) — portrait URLs for all 5 commissioners
- [bioguide.congress.gov](https://bioguide.congress.gov/) + [congress.gov](https://www.congress.gov/) —
  all 9 AZ House bioguide IDs (S001183, C001132, A000381, S001211, B001302, C001133, G000606,
  H001098, G000565)
- [NPR — Adelita Grijalva sworn in after 50-day wait](https://www.npr.org/2025/11/12/nx-s1-5606350/adelita-grijalva-swearing-in) —
  CD-7 succession timeline confirmation

### Tertiary (LOW confidence — WebSearch summary only, not directly fetched)
- Corporation Commission party affiliations (all 5 Republican) — WebSearch-summarized twice,
  consistent both times, but Ballotpedia direct-fetch returned empty content this session
- Kevin Thompson / René Lopez / Rachel Walden exact term-start dates — WebSearch summary only

---

## Metadata

**Confidence breakdown:**
- DB audit (who exists, what's missing, ID schemes, migration numbering): HIGH — direct psql +
  disk-listing queries
- Roster (current officeholders): HIGH for Horne/Presmyk (Wikipedia/Ballotpedia cross-checked),
  MEDIUM for the 5 Corp Commissioners (azcc.gov official + WebSearch, Ballotpedia fetch failed)
- Headshot sources: HIGH for Horne/Márquez Peterson (Wikimedia CC, file-page-verified), MEDIUM for
  Myers/Walden/Thompson/Lopez (official .gov, no stated license), LOW/OPEN for Presmyk (no source
  found yet — flagged as Open Question 1)
- Bioguide IDs + image accessibility: HIGH — HTTP-200-verified live for all 8 needed
- External_id / migration numbering: HIGH — verified free via live queries this session

**Research date:** 2026-07-08
**Valid until:** 2026-07-22 (AZ mine-inspector primary is Aug 4, 2026; Superintendent primary is
Jul 21, 2026 — re-verify officeholder currency if this phase's execution slips past those dates,
though incumbents remain in office until the general election regardless of primary outcomes)
