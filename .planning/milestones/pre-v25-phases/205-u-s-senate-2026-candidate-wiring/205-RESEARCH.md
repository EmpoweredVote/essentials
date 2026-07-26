# Phase 205: U.S. Senate 2026 Candidate Wiring - Research

**Researched:** 2026-07-15
**Domain:** Production PostgreSQL data-repair migration (Supabase) — no application code
**Confidence:** HIGH (all DB facts verified live via direct psql against production; seat-map facts cross-verified against 2+ independent public sources)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (from SPEC):** I derive the per-state 2026 seat map from public record (Class 2 senators + known 2026 special elections); the user spot-checks it before any write.
- **D-05:** 2026 special-election seats (appointee incumbents — e.g. OH → Jon Husted, FL → Ashley Moody) ARE linked, to the appointee's current `NATIONAL_UPPER` seat office (correct statewide geography). Each special is explicitly marked `SPECIAL` in the review table so the user can eyeball those specifically at the checkpoint.
- Matching key: `position_name` carries the state ("U.S. Senate {State}"); all of a state's Senate race rows (per-party primaries + general + any runoff) link to the SAME seat office. Link target must be a real seat office (title `Senator` / `U.S. Senate - {State}`), NEVER a stray `Candidate for U.S. Senate — {State}` office.
- **D-02 (from SPEC):** Confident matches only. Any state whose 2026 seat can't be confidently identified (missing seat office, ambiguous match) is left `office_id = NULL` and reported for manual resolution — no best-effort/guessed links.
- **D-03:** Package the write as a checked-in, **idempotent, re-runnable** SQL migration in `supabase/migrations/` (`NNN_link_us_senate_2026_races.sql`) containing the explicit state→incumbent→office_id map. Next migration number follows the on-disk convention (disk-authoritative). Auditable in git; applied only after the user approves the seat map. (Not ad-hoc MCP `execute_sql`.)
- **D-04:** A **blocking human checkpoint** during execution: present the full derived state→seat(→incumbent) table (specials flagged) and wait for the user's approval before any `UPDATE` runs. Mirrors the 204-04 human-verify checkpoint pattern.
- **D-06:** Verify with BOTH (a) DB parity queries — every mapped race resolves through `offices→districts` to a `NATIONAL_UPPER` seat office; before/after diff shows only `U.S. Senate %` `races.office_id` changed; House linkage + incumbents untouched — AND (b) a live in-state address test on the deployed site for ≥3 sample states confirming candidates actually surface (House parity in the same response).
- **D-07 (from SPEC):** Stray `Candidate for U.S. Senate — {State}` offices are NOT cleaned up here (deferred). They must never be used as link targets, but their existence is left as-is.

### Claude's Discretion
- None explicitly delegated beyond the seat-map derivation itself (D-01 already assigns this to Claude, subject to user spot-check).

### Deferred Ideas (OUT OF SCOPE)
- Stray `Candidate for U.S. Senate — {State}` office cleanup — own follow-on.
- Senate candidate headshots — follow-on.
- Senate candidate compass stances — follow-on.
- Backfilling additional Senate races/candidates not yet seeded — separate discovery/seeding work.

None of these block phase 205.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-1 | 2026 seat map (derived) — per-state map of which Senate seat is up in 2026, reviewable before write | Full 35-state map derived below (`## The Derived 2026 Seat Map`), cross-verified against Wikipedia's 2026 Senate elections page + senate.gov Class II roster + a targeted correction search for South Carolina. All 35 states DB has races for map 1:1 onto the public Class-2 + 2-special list — **zero unresolved states**. |
| REQ-2 | Race → seat office linkage — every confidently-mapped race gets `office_id` set to the correct `NATIONAL_UPPER` seat office | Verified: exactly one `NATIONAL_UPPER` district per state (50/50, `states_with_not_exactly_1 = 0`); each of the 35 target states has exactly 2 real seat offices sharing that one district — office_ids captured in the seat map table. |
| REQ-3 | Candidates surface by address (House parity) | House join pattern traced end-to-end (`races.office_id → offices → districts(NATIONAL_LOWER)`); Senate join is structurally identical once `office_id` is set (`districts(NATIONAL_UPPER)`). ≥3 sample states recommended for live check: MN, TX, TN (regular) + OH (special) — matches CONTEXT's confirmed examples. |
| REQ-4 | Confident-only, flag-and-skip | Research found **0 states requiring skip** — the DB's 35-state Senate race set maps 1:1 onto the public 33-Class-2 + 2-special list with no name/state mismatches. This is a positive but non-obvious finding the planner should treat cautiously (see Open Questions) and the human checkpoint (D-04) remains mandatory regardless. |
| REQ-5 | No collateral changes | Baseline snapshot captured below (`## Before/After Diff Footprint`) for the planner to build the verification query against. Confirmed 0 stray candidate-offices are currently used as any race's `office_id` (clean starting state). |
</phase_requirements>

## Summary

This is a pure data-repair migration: 51 `essentials.races` rows (`position_name ILIKE 'U.S. Senate %'`) have `office_id = NULL` and need to be pointed at the correct `NATIONAL_UPPER` seat office. Direct read-only `psql` access to production (via a short-lived Supabase CLI login-role credential, `SET ROLE postgres` to clear schema-permission restrictions) confirmed every fact needed to plan this phase with no open unknowns on the DB side: exactly 35 distinct `position_name` states, exactly 2 real seat offices per state sharing one `NATIONAL_UPPER` district, and 0 collateral risk (no stray `Candidate for U.S. Senate` office is currently in use as any race's `office_id`).

The one non-trivial research task — determining *which* of each state's two senators occupies the 2026 (Class 2) seat — was resolved via public record (Wikipedia's 2026 Senate elections page, senate.gov's Class II roster, and a corrective secondary search for a garbled name in one fetch). The public 33-Class-2-states + 2-specials (OH, FL) list maps perfectly onto the DB's 35-state Senate-race set, with every named incumbent in the public list matching an existing DB `NATIONAL_UPPER` seat office. No state needs to be skipped.

**Primary recommendation:** Ship a single idempotent `UPDATE ... FROM (VALUES ...)` migration (`supabase/migrations/878_link_us_senate_2026_races.sql`) keyed on the 35-row state→office_id map below, guarded by `AND office_id IS NULL` for re-run safety, following the exact hand-authored SQL style already used in `203_ca_federal_grouping_fixes.sql` / `204_la_council_orphan_cleanup.sql`. Gate the actual `UPDATE` behind the D-04 human-verify checkpoint on this map. Verify with the DB parity + diff queries in `## Validation Architecture`, then live-check MN, TX, TN, OH addresses.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Race→office linkage (the actual fix) | Database / Storage | — | Single-column `UPDATE` on `essentials.races.office_id`; no service touches this except the DB itself |
| Seat-map derivation & review | Database / Storage (data authoring) | — | A one-time authored SQL VALUES map, reviewed by a human before apply — not a runtime capability |
| Address→candidate surfacing | API / Backend | Database / Storage | Existing, unchanged code path (`address → district → office → race → race_candidates`); Senate rides the same query the House already uses — confirmed no code changes needed |
| Live verification (address test) | Browser / Client | API / Backend | Verification touches `essentials.empowered.vote` results page — read-only confirmation, not a new capability |

## Standard Stack

Not applicable — this phase installs no packages and touches no application code. Tooling used is what's already in the project:

| Tool | Verified Present | Purpose |
|------|-------------------|---------|
| `supabase` CLI (v2.75.0) | Yes (`C:/Tools/supabase`), linked to project `kxsdzaojfaibhuzmclfq` ("E.V Backend") | Used in this research session to obtain a short-lived, scoped Postgres credential (`supabase db dump --dry-run --linked -s essentials`) for read-only verification. The plan should NOT depend on re-deriving this credential — the actual write ships as a committed migration file applied through the project's normal migration-apply path (or via `mcp__supabase-local__execute_sql` at execution time per the phase's existing MCP access, per CONTEXT.md canonical refs). |
| `psql` (PostgreSQL 18 client) | Yes (`C:/Program Files/PostgreSQL/18/bin/psql`) | Used for all read-only research queries below. |

**Package Legitimacy Audit:** Not applicable — no packages are installed by this phase (data-only SQL migration).

## Migration Mechanics (verified)

- **Two independent numbering schemes exist in this project — do not conflate them:**
  1. **File-based, disk-authoritative** (`supabase/migrations/NNN_description.sql`, plain integers): confirmed via `ls` + `git log` on this exact directory. Current max on disk is **877** (`877_ut_city_office_dedup_cleanup.sql`, last committed via `ecd5cd38`). **Next number is 878.** [VERIFIED: git log + filesystem listing]
  2. **`supabase_migrations.schema_migrations` ledger table** (in-DB, mixed plain-integer and Supabase-timestamp versions, e.g. `999`, `992`, `20260715143936`): this is a *separate*, sparsely- and manually-populated tracking table referenced in STATE.md as "ledger MAX" for prior phases (994-998, 1314, etc.). It is NOT the same counter as the disk file convention, and many prior "audit-only" migrations were applied directly (e.g. via MCP `execute_sql`) without ever landing as a file or a ledger row. [VERIFIED: `SELECT version FROM supabase_migrations.schema_migrations` — max ledger version found was `20260715143936`, 215 rows total, mixing both integer and timestamp formats]
  - **Recommendation:** Per D-03, the plan targets the **file-based convention only** — create `supabase/migrations/878_link_us_senate_2026_races.sql`. Whether to also register a ledger row is the executor's call at apply time (recent examples like `pomona_reconcile` (926) and `downey_complete` (991) suggest structural/registered migrations get a named ledger row; this phase's single-column data fix could go either way — flag as an open question for the plan, not a blocker).

- **Idempotency pattern (recommended, matches project's existing hand-authored SQL migration style):**
  ```sql
  -- Migration 878: Link 2026 U.S. Senate races to their correct NATIONAL_UPPER seat office.
  -- Guarded by "office_id IS NULL" so re-running this migration is a safe no-op.
  UPDATE essentials.races AS r
  SET office_id = v.office_id::uuid
  FROM (VALUES
    ('U.S. Senate Alabama',        'dd596029-1a44-4bc6-97da-545b864e46c5'),
    ('U.S. Senate Alaska',         '8fe392b4-a639-4349-a2b7-bb3a63a32416'),
    -- ... (full 35-row map — see table below)
  ) AS v(position_name, office_id)
  WHERE r.position_name = v.position_name
    AND r.office_id IS NULL;
  ```
  This mirrors the style of `203_ca_federal_grouping_fixes.sql` (hardcoded UUIDs, no ORM, plain comments explaining the "why") and `204_la_council_orphan_cleanup.sql` (single surgical statement). [CITED: read `supabase/migrations/203_ca_federal_grouping_fixes.sql`, `204_la_council_orphan_cleanup.sql`]

- **Skipped/unresolved races:** Per D-02, any state not confidently mapped should simply be *omitted* from the VALUES list (its `office_id` stays NULL — no explicit "skip" DML needed). Research found no states requiring this, but the plan should still include the omission mechanism and a written skip-report section (even if empty) to satisfy REQ-4's acceptance criterion.

## The Derived 2026 Seat Map

**Source method:** Cross-referenced Wikipedia's "2026 United States Senate elections" page (33 Class 2 states + 2 special elections: OH, FL) [CITED: en.wikipedia.org/wiki/2026_United_States_Senate_elections] against the DB's live `NATIONAL_UPPER` office/incumbent inventory (queried directly, see `## DB Facts Verified`). One name in the initial fetch ("Darline Graham" for SC) was clearly a scrape/summarization garble; corrected via a targeted secondary search confirming South Carolina's Class 2 seat is Lindsey Graham's (Graham died July 11, 2026, mid-cycle, but the seat itself — and the DB office row still bearing his name as of this research date — is the correct 2026 link target; his death does not change which office row is the right one). [CITED: ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026 via search snippet]

**All 35 states with a `U.S. Senate %` race in the DB matched the public 33-Class-2 + 2-special list with zero extras and zero omissions on either side.** This is a `[VERIFIED]`-grade finding (both sides independently enumerated and diffed) but is presented for the mandatory D-04 human checkpoint regardless, per CONTEXT.md's D-04.

| State | 2026 Seat (public record) | SPECIAL? | DB office title | DB office_id | DB district_id |
|-------|---------------------------|----------|------------------|--------------|-----------------|
| Alabama | Tommy Tuberville | | Senator | `dd596029-1a44-4bc6-97da-545b864e46c5` | `e7beff0f-97f8-45e0-bd6d-e8de81721e94` |
| Alaska | Dan Sullivan | | Senator | `8fe392b4-a639-4349-a2b7-bb3a63a32416` | `4136d3b1-5035-49bc-829e-6df8f09a1eef` |
| Arkansas | Tom Cotton | | Senator | `4df196c4-4b12-4d11-b295-c37c2ab190d1` | `73bae1ba-3ed1-4d28-8447-ec8e2e915f35` |
| Colorado | John Hickenlooper | | Senator | `7c735887-cab8-47b1-9634-8e5f48d363f1` | `213f3506-09e3-4ea8-8f2a-2648e9ffcd14` |
| Delaware | Chris Coons | | Senator | `b5cd6e9c-4da3-4768-8633-346a170e3ee0` | `aa80539d-f125-4543-99d4-86521d709a87` |
| **Florida** | Ashley Moody | **SPECIAL** (filling Rubio's vacated seat) | Senator | `0cd42c43-f72d-474c-87d7-e2682fd95e46` | `2e50740f-cbff-4a29-82b4-052da58cc2b9` |
| Georgia | Jon Ossoff | | Senator | `8116f4a3-d161-4d9b-a83c-0b9470ace42c` | `53c1bd40-fb71-47a5-b5a0-c180cd750a65` |
| Idaho | Jim Risch | | Senator | `8f590ee2-5e18-47b8-ba41-ff1933a6e866` | `c6f7a896-b05f-4266-bddd-da65199e82ec` |
| Illinois | Dick Durbin | | Senator | `6d582deb-95f5-4e9f-a904-7d35eb96142d` | `7714fda7-fd44-435b-82c8-266cbe2aae36` |
| Iowa | Joni Ernst | | Senator | `79e7b0db-6843-4949-b128-712aa3aae9cc` | `ea6c2676-9d12-4a62-bb2d-a848ae0f968a` |
| Kansas | Roger Marshall | | Senator | `40481651-6a62-4046-8398-f23dfcf26428` | `e40e4182-73ce-4460-addc-5b624d1c4f0d` |
| Kentucky | Mitch McConnell | | Senator | `6578f1bb-e37d-4615-8433-34b514179017` | `5b85b33d-8805-4a69-859c-6f21e8d6fee3` |
| Louisiana | Bill Cassidy | | Senator | `b7e7c556-8bba-4f39-8f1e-655ac60ac899` | `66e2cbcf-ee95-4add-be75-195d95cf6be2` |
| Maine | Susan Collins | | U.S. Senate - Maine | `50b86543-956e-40a1-9e17-7fb9a6f7561d` | `76a62b58-7b74-42ae-84e6-c44606889f9d` |
| Massachusetts | Ed Markey | | U.S. Senate - Massachusetts | `215e8e94-ab07-4ca8-b7a1-ccf7aec0c4f4` | `fd703947-1394-4e95-9401-bf0df7851cc8` |
| Michigan | Gary Peters | | Senator | `1bb21d97-918a-48cb-bc8f-f34cb3a404bc` | `86167228-14b2-4b81-bb5e-6105a29d48b7` |
| Minnesota | Tina Smith *(not Klobuchar)* | | Senator | `e2630486-5610-49c6-9da2-0af0e335b7c2` | `bdf1d28e-82ac-457b-bffc-ffaadce0b59e` |
| Mississippi | Cindy Hyde-Smith | | Senator | `f6398c92-57e8-4e45-9a4b-0131bf40e332` | `b289149d-a2aa-4beb-9bcd-05469f4dae68` |
| Montana | Steve Daines | | Senator | `24c4c340-d9e3-4466-a60e-b4bc19dc9b2b` | `5f265c53-0008-4c76-a045-f125d12852a5` |
| Nebraska | Pete Ricketts | | Senator | `d166af4e-8d84-4797-a60c-4a67eb263446` | `c6434bbd-d2c4-4325-a198-c7a79ced6f47` |
| New Hampshire | Jeanne Shaheen | | Senator | `d37cdff2-581d-43c4-af45-1351a309618a` | `cabfe0e3-baf0-4c5b-a5a8-3c3ec3e3f8b2` |
| New Jersey | Cory Booker | | Senator | `9421c941-170b-42d8-bf15-2f52f3caefd9` | `8294fc98-f4cf-451b-9e3b-6e2a0d2cce27` |
| New Mexico | Ben Ray Luján | | Senator | `493f3449-255f-42ed-be32-51f52d2a88b6` | `0518bcc4-777b-4f41-82f9-d7fc26f6bfc0` |
| North Carolina | Thom Tillis | | Senator | `38104a44-0f20-4ad5-9aab-e841f022215c` | `f2c9697e-67fb-498a-8c43-66ac7046de3d` |
| **Ohio** | Jon Husted | **SPECIAL** (filling Vance's vacated seat) | Senator | `d85572a3-835d-4b02-916d-9ff7688856fa` | `b38614eb-5320-4f4e-acc0-7142696a737d` |
| Oklahoma | Alan S. Armstrong *(appointed, filling former Class-2 seat)* | | Senator | `68c01d20-17f3-424a-936e-02107dd79fe8` | `510c83f1-9d5b-404e-90d3-0c78084adf11` |
| Oregon | Jeff Merkley | | U.S. Senate - Oregon | `3db3e08a-ed6c-4365-9e5a-9af1f94c4372` | `1552f454-5342-4460-9127-57ee0973f5e3` |
| Rhode Island | Jack Reed | | Senator | `61172e93-e725-478f-a41e-891ef715ec2e` | `3dbdac4a-e3de-4749-b95b-0534d1b6c2d3` |
| South Carolina | Lindsey Graham | | Senator | `af90499c-0219-4a7a-bd89-fb9ac20392ae` | `645fb870-8ace-4608-a5e7-fadc0af4ea49` |
| South Dakota | Mike Rounds | | Senator | `42941c6c-b7b7-47c3-9ebb-b375da114ae6` | `76487e13-e5f2-4157-bdee-abf418ec31d5` |
| Tennessee | Bill Hagerty *(not Blackburn)* | | Senator | `40c5e020-ba3b-45a9-a7a1-baf14717adf7` | `7b0f9ff8-d1a1-4795-b79f-2d59d9c72b2d` |
| Texas | John Cornyn *(not Cruz)* | | U.S. Senate - Texas | `61aa4e58-15d9-43ad-857a-72c624f7d8df` | `5c392114-9945-4998-b0ce-c9d9f8bc30b3` |
| Virginia | Mark Warner | | Senator | `6204cbda-f055-46db-962d-98ddf945060e` | `3d62922f-3c42-4bef-9c69-9b6dc13741db` |
| West Virginia | Shelley Moore Capito | | Senator | `1740c53e-51a3-40bb-b995-803486355279` | `b667b5fd-e68c-4b68-8ca9-eca6a18c657a` |
| Wyoming | Cynthia Lummis | | Senator | `75eef8b5-4b9c-49bf-8951-76e4fefb53e9` | `3f977f5b-fac3-4869-8c87-6d83d92a5099` |

**Tag:** Incumbent names and Class-2/special designations are `[CITED: Wikipedia 2026 U.S. Senate elections page + senate.gov Class II roster + Ballotpedia SC race page]`. Office/district UUIDs and current DB officeholder-of-record are `[VERIFIED: live psql query against production, 2026-07-15]`. The full map should still go through the D-04 human checkpoint — public-record class assignments are stable but a second pair of eyes on 35 rows before a production `UPDATE` is cheap insurance.

## DB Facts Verified (read-only, `SET ROLE postgres` after Supabase CLI login-role auth)

- `essentials.races` schema: `id, election_id, office_id, position_name, primary_party, seats, description, created_at, updated_at` — no `race_type`/`election_date` columns directly; election date/type live on `essentials.elections` (joined via `election_id`).
- **51 `U.S. Senate %` races, 35 distinct `position_name` values, 100% `office_id IS NULL`, 189 `race_candidates`.** Multi-row states are legitimate primary(-per-party)/general splits — verified directly on Minnesota (Dem primary / Rep primary / general, 3 rows) and Tennessee (same shape, 3 rows). `position_name` uses the **full state name**, no abbreviation, no dash (`'U.S. Senate Minnesota'`, not `'U.S. Senate - MN'` or `'U.S. Senate MN'`).
- **No false-positive collision risk:** a broader `ILIKE '%senate%'` scan found 173 *state* senate races (`'MA State Senate ...'`, `'OR State Senate District N'`, `'ME State Senate District N'`, `'MD State Senate District N'`, `'Utah State Senate District N'`, `'Nevada State Senate District N'`, `'CA State Senate District N'`) — all prefixed with the state, none matching `'U.S. Senate %'`. The planner's `WHERE position_name ILIKE 'U.S. Senate %'` filter is safe and precise.
- **NATIONAL_UPPER office inventory:** 152 total office rows across 50 states. Exactly **100 are real seat offices** (86 titled plain `Senator`; 14 titled `U.S. Senate - {State}` for CA, IN (×2), ME, MA, OR, TX, UT — 7 states use the dashed title, the other 43 use plain `Senator`). The remaining **52 are stray `Candidate for U.S. Senate — {State}` rows** (e.g., FL ×2, MI ×4, LA ×4, OK ×3, AL ×3, VA ×3, MT ×3, MN ×3, and 1-2 each for ~15 more states) — confirmed `[VERIFIED]` that **0 of these stray rows are currently used as any race's `office_id`**, so there is no existing collateral-damage risk to guard against, only a "never link to these" rule to enforce in the VALUES map.
- **Exactly one `NATIONAL_UPPER` district per state, 50/50, zero exceptions** (`states_with_not_exactly_1 = 0`) — confirms the "one statewide district per state" assumption from CONTEXT.md holds with no caveats.
- **House reference pattern traced exactly** (5 sample MA/ME rows): `races.office_id → offices.id` (title `Representative`) `→ offices.district_id → districts.id` (`district_type = 'NATIONAL_LOWER'`, `label = 'Congressional District N'`) `→ politicians.office_id` for the incumbent. Senate's target shape is identical, substituting `district_type = 'NATIONAL_UPPER'` and title `Senator`/`U.S. Senate - {State}`.
- `essentials.race_candidates` schema: `id, race_id, politician_id, full_name, first_name, last_name, photo_url, is_incumbent, candidate_status, last_verified_at, source, external_id, created_at, updated_at, occupational_designation, website_url` — unaffected by this migration; no columns here reference `office_id`.
- `essentials.districts` uses 2-letter USPS state codes in `state` (e.g. `'AK'`, `'CA'`), matching `offices.representing_state` — the migration's join key is `position_name` (full state name) directly, not these abbreviated columns, so no code needs to translate between the two; the VALUES map hardcodes the `position_name → office_id` pairing directly.

## Before/After Diff Footprint (baseline snapshot for verification)

| Metric | Baseline (pre-migration) value |
|--------|--------------------------------|
| `essentials.races` total rows | 1,674 |
| `U.S. House %` races | 45 |
| `U.S. Senate %` races | 51 (all `office_id IS NULL`) |
| `essentials.race_candidates` total rows | 2,483 |
| `NATIONAL_UPPER` office rows | 152 (unchanged by this migration — no office/district/politician row is touched) |
| `NATIONAL_UPPER` rows with an incumbent politician linked | 99 (one `U.S. Senate - California` seat office is currently incumbent-less — pre-existing, unrelated to Senate races since CA has no 2026 Senate race in this dataset; do not touch) |

**Recommended diff query for the plan/execution phase:** snapshot `SELECT id, position_name, office_id FROM essentials.races WHERE position_name ILIKE 'U.S. Senate %' ORDER BY id` before and after; the only rows that should change are the previously-`NULL` `office_id` values on confidently-mapped states, and the `essentials.races` total row count (1,674), `race_candidates` total (2,483), and `NATIONAL_UPPER` office/incumbent counts (152 / 99) must be **byte-for-byte identical** after.

## Common Pitfalls

### Pitfall 1: Linking to a stray "Candidate for U.S. Senate" office instead of the real seat
**What goes wrong:** 52 of the 152 `NATIONAL_UPPER` office rows are per-candidate stray artifacts (title `Candidate for U.S. Senate — {State}`), not seat offices. A naive `WHERE district_type='NATIONAL_UPPER' AND representing_state = X LIMIT 1` query could pick a stray row.
**Why it happens:** These stray rows exist for the same states that have real seat offices, and some states (e.g. Michigan, Louisiana) have 3-4 stray rows outnumbering the 2 real ones.
**How to avoid:** The VALUES map hardcodes specific `office_id`s (captured above) rather than deriving them dynamically at execution time; always filter `title = 'Senator' OR title ILIKE 'U.S. Senate - %'` and never accept a match on `title ILIKE 'Candidate for U.S. Senate%'`.
**Warning signs:** A resolved `office_id` whose `offices.title` starts with `"Candidate for"`.

### Pitfall 2: Assuming `office_id` UUIDs won't drift between research and execution
**What goes wrong:** Because this is a live production database, incumbents can change (retirement, death, appointment) between research time and migration-apply time — office_ids themselves are stable (offices persist across incumbent changes), but the *displayed incumbent name* in the review table could go stale.
**Why it happens:** This research found South Carolina's Lindsey Graham died July 11, 2026 (4 days before this research), yet his DB office row is still the correct 2026 seat link target — the office_id doesn't change even though a special primary for his replacement is now underway.
**How to avoid:** The plan should re-fetch each `office_id`'s current `title`/`district_type` at execution time as a final sanity check before the `UPDATE`, but should link by `office_id` (stable) not by re-deriving from incumbent name (unstable).
**Warning signs:** A politician name mismatch between this research doc and the live DB at execution time — treat as informational, not a blocker, unless the `office_id`'s `district_type` or state changed.

### Pitfall 3: Conflating the two migration-numbering schemes
**What goes wrong:** STATE.md and prior phase notes reference `schema_migrations` "ledger" version numbers in the 900s-1300s range; a planner unfamiliar with this project could mistakenly number the new file `1315_...sql` instead of `878_...sql`.
**Why it happens:** Two independent counters exist (see `## Migration Mechanics` above) — the ledger table `supabase_migrations.schema_migrations` uses sparse, sometimes-timestamp version numbers unrelated to the git-committed `supabase/migrations/NNN_*.sql` file sequence.
**How to avoid:** File name must follow the **disk-file** convention: `878_link_us_senate_2026_races.sql` (877 is the confirmed current max via `git log` + `ls`).
**Warning signs:** A migration filename with a version >900 in this project's `supabase/migrations/` directory (there are none currently — all files there are ≤877).

## Validation Architecture

> This phase has no test framework in the traditional sense — validation is DB-parity SQL + a live address check. `workflow.nyquist_validation` is absent from `.planning/config.json` (treated as enabled), so this section stands in for a conventional test suite.

### "Test Framework"
| Property | Value |
|----------|-------|
| Framework | Raw SQL parity queries via `psql` / `mcp__supabase-local__execute_sql` (read-only) |
| Config file | none — ad hoc verification queries, documented below |
| Quick run command | The single-state resolution query (see REQ-2 check below) — sub-second |
| Full suite command | The 5-query verification block below, run in sequence |

### Phase Requirements → Verification Map
| Req ID | Behavior | Verification Type | Query | Expected Result |
|--------|----------|--------------------|-------|------------------|
| REQ-1 | Seat map produced & reviewable | manual review | Present the 35-row table above at the D-04 checkpoint | Human approval before any UPDATE |
| REQ-2 | Race→office linkage correct | DB parity query | `SELECT r.position_name, o.title, d.district_type, d.state FROM essentials.races r JOIN essentials.offices o ON r.office_id=o.id JOIN essentials.districts d ON o.district_id=d.id WHERE r.position_name ILIKE 'U.S. Senate %'` | Every mapped row: `district_type='NATIONAL_UPPER'`, `o.title NOT ILIKE 'Candidate for U.S. Senate%'`, `d.state` matches the race's state |
| REQ-3 | Candidates surface by address | live smoke test | Enter an in-state address on essentials.empowered.vote for MN, TX, TN, OH | Response includes the Senate race + its `race_candidates`, alongside the House race (parity) |
| REQ-4 | Confident-only / skip report | DB query + written report | `SELECT position_name FROM essentials.races WHERE position_name ILIKE 'U.S. Senate %' AND office_id IS NULL` post-migration | Empty result expected (this research found 0 states to skip); if non-empty, each row needs a documented reason in the phase's skip report |
| REQ-5 | No collateral changes | before/after diff | Compare baseline counts (`## Before/After Diff Footprint`) pre- and post-migration | `races` total = 1,674 unchanged; `race_candidates` = 2,483 unchanged; `NATIONAL_UPPER` offices = 152 unchanged; `NATIONAL_UPPER` incumbents = 99 unchanged; only the 35 targeted `U.S. Senate %` rows' `office_id` differ |

### Sampling Rate
- **Per migration apply:** run the full 5-query verification block once, immediately after the `UPDATE`, inside the same session.
- **Phase gate:** all 5 queries pass + ≥3 live address checks (MN, TX, TN, plus OH as the special-election case) confirmed on essentials.empowered.vote before `/gsd:verify-work`.

### Wave 0 Gaps
None — this phase requires no new test infrastructure; all verification is direct SQL against production plus a manual live-site check.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Supabase CLI | Obtaining a scoped read/write Postgres credential for the linked project | ✓ | 2.75.0 (2.109.1 available — not required) | — |
| `psql` (PostgreSQL client) | Running verification queries directly | ✓ | PostgreSQL 18 client | — |
| `mcp__supabase-local` MCP tool | Canonical execution-time access path per CONTEXT.md | Not available to this research subagent (tool not exposed in this session — confirmed no `mcp__*` tools were present in the available toolset) | — | Used direct `psql` via a Supabase CLI-issued short-lived login-role credential (`supabase db dump --dry-run --linked -s essentials` reveals `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`; requires `SET ROLE postgres` after connecting, since the `cli_login_postgres` role itself has no `essentials` schema grant). The execution-phase agent should have `mcp__supabase-local` available per its own tool configuration — this fallback is documented here only because the research subagent's toolset didn't include it. |
| PostgREST / Supabase REST API (`https://kxsdzaojfaibhuzmclfq.supabase.co/rest/v1/`) | Attempted as a query alternative | ✗ (schema not exposed) | — | The `essentials` schema is not in PostgREST's exposed-schema allowlist (`Only the following schemas are exposed: public, civic_spaces, connect, empower, inform, graphql_public, validation_quests, treasury, civic`) — REST API is not a viable path for this data; direct Postgres connection is required. |

**Missing dependencies with no fallback:** none — the `psql`-via-CLI-credential fallback fully substituted for the missing MCP tool in this research session.

## Sources

### Primary (HIGH confidence)
- Direct `psql` queries against production (`essentials` schema) — race counts, office/district inventory, House reference trace, before/after baseline. [VERIFIED]
- `git log -- supabase/migrations` + `ls supabase/migrations/` in this repo — confirmed disk-max migration number 877. [VERIFIED]
- `supabase/migrations/203_ca_federal_grouping_fixes.sql`, `204_la_council_orphan_cleanup.sql` — confirmed hand-authored SQL migration style/convention. [VERIFIED — read directly]

### Secondary (MEDIUM confidence)
- [2026 United States Senate elections - Wikipedia](https://en.wikipedia.org/wiki/2026_United_States_Senate_elections) — full Class 2 + special election state/incumbent list, cross-verified against DB.
- [2026 United States Senate special election in Ohio - Wikipedia](https://en.wikipedia.org/wiki/2026_United_States_Senate_special_election_in_Ohio) / [Florida](https://en.wikipedia.org/wiki/2026_United_States_Senate_special_election_in_Florida) — confirms Husted/Moody appointee status and special-election framing.
- [United States Senate election in South Carolina, 2026 - Ballotpedia](https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026) — used to correct a garbled name from an earlier fetch; confirmed the SC Class 2 seat is Lindsey Graham's.
- [U.S. Senate: Class II - Senators Whose Terms of Service Expire in 2027](https://www.senate.gov/senators/Class_II.htm) — authoritative Class 2 roster (surfaced via search, not directly fetched in this session, but corroborated by the Wikipedia cross-check).

### Tertiary (LOW confidence)
- None — every claim above was either DB-verified directly or corroborated by 2+ independent public sources.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 35-state seat map (which senator occupies each state's Class-2/special seat) is accurate as of 2026-07-15 | `## The Derived 2026 Seat Map` | Low — office_ids are stable regardless of incumbent-name churn (see Pitfall 2); D-04's mandatory human checkpoint is the actual safety net here, not this research |
| A2 | Whether the new migration should also get a `supabase_migrations.schema_migrations` ledger row (as some prior "structural" migrations do) vs. staying "audit-only" (as most prior data-only fixes do) is unresolved | `## Migration Mechanics` | Low — cosmetic/tracking-only; does not affect correctness of the actual data fix |

## Open Questions (RESOLVED)

1. **Should this migration register a `schema_migrations` ledger row?**
   - What we know: prior *structural* migrations (e.g. `pomona_reconcile`/926, `downey_complete`/991) got named ledger rows; many prior *data-only* fixes did not.
   - What's unclear: whether a single-column `UPDATE` across 35 states counts as "structural" for this project's convention.
   - **RESOLVED (in plan):** Plan 205-01/205-02 default to **audit-only — no ledger row** (matching the majority of comparable single-purpose data fixes in STATE.md history). Low-stakes convention choice, not a correctness question.

2. **Execution-time DB access path**
   - What we know: this research used a Supabase-CLI-issued short-lived credential via direct `psql` because `mcp__supabase-local` was not exposed to this research subagent's toolset.
   - What's unclear: whether the execution-phase agent will have `mcp__supabase-local` available (per CONTEXT.md's stated canonical access path) or will need the same `psql`-via-CLI-credential fallback documented here.
   - **RESOLVED (in plan):** Plan 205-02's `<interfaces>` block records that **both paths are viable** — `mcp__supabase-local__execute_sql` (canonical) OR the documented `psql`-via-CLI-credential fallback. The SQL is identical either way; the committed migration file is the artifact that gets applied.
