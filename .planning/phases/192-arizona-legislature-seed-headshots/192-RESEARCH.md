# Phase 192: Arizona Legislature (seed + headshots) - Research

**Researched:** 2026-07-08
**Domain:** Data seeding (PostgreSQL/Supabase) — legislative roster + headshot pipeline, mirrors NV Phase 160 nearly 1:1
**Confidence:** HIGH (roster, schema, ext_id ranges, headshot source all directly verified live — DB probes + HTTP probes, not just training knowledge)

## Summary

This phase is a structural+headshot data-seed, not a code-feature build. Nearly every unknown
flagged by the orchestrator was resolved via **live verification** during this research pass:
a direct read-only probe of the production `essentials` schema (via `psql` against
`C:/EV-Accounts/backend/.env` `DATABASE_URL`) confirmed the `offices` table has **no unique
constraint** blocking D-01's two-reps-per-district model, and a direct fetch of the
`azleg.gov` official member roster + HTTP HEAD probes of ~15 sample photo URLs confirmed the
headshot pipeline and the exact live 90-member roster.

**One material discrepancy from the phase framing must be flagged to the planner/operator:**
the phase objective and CONTEXT.md both say "56th Arizona Legislature," but the CURRENTLY
SITTING legislature as of the research date (2026-07-08) is the **57th Arizona Legislature**
(2025-2026 biennium, 2nd Regular Session, adjourned Sine Die June 13, 2026). Arizona's
55th Legislature = 2021-22, 56th = 2023-24, 57th = 2025-26. Since this phase seeds "the
current sitting" roster (D-02), the 57th is unambiguously correct — the "56th" label
elsewhere is a stale/off-by-one reference and should not drive which roster gets seeded.

**Primary recommendation:** Follow the NV 160 three-plan shape (seed → headshots →
verification) almost verbatim, using the AZ 191 conventions already established (collegial-body
office guard, `is_appointed`/`is_appointed_position` split for mid-term appointees, `psql`-only
DB access, audit-only headshot migrations). Source ALL 90 headshots from
`azleg.gov/alisImages/MemberPhotos/57leg/{Senate|House}/{SURNAME}.jpg` — verified 100% coverage
for the current roster, no fallback source needed for any of the 90 members researched.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Legislator roster seed (chambers/offices/politicians) | Database / Storage | — | Pure `essentials` schema writes; no app-tier logic |
| District↔office linkage (SLDU/SLDL) | Database / Storage | — | Consumes Phase 190 geofence/district rows; join-only, no new geometry |
| Headshot acquisition/processing | Database / Storage (pipeline script) | CDN / Static (Supabase Storage) | Script runs outside the request path; output is a static asset served from Storage |
| Profile surfacing (address → officeholder) | API / Backend | Frontend Server (SSR) | Existing `/representatives/me` address-routing logic already resolves via `district_id` — no code change this phase |
| Compass stances | — | — | Explicitly deferred; 0 rows is the required end-state, not a gap |

## User Constraints

<user_constraints>
### Locked Decisions (from 192-CONTEXT.md)

- **D-01 (headline call):** Model the 60 house reps as **two undifferentiated `State
  Representative` offices per legislative district**, both linked to the **same SLDL
  district_id** (`geo_id='040NN'`, `district_type='STATE_LOWER'`). No Seat A/B, no post number,
  no voter-facing seat label. **Live-verified this research session:** `essentials.offices` has
  **no unique constraint** on `district_id`/`chamber_id` (only `offices_pkey` on `id`) — D-01 is
  fully unblocked at the schema level. (See "Package Legitimacy Audit" section — N/A this phase —
  and "Common Pitfalls" below for the guard-key gotcha that still applies despite no DB constraint.)
- **D-02:** Seed the **current sitting Legislature** (57th, per this research — see Summary) as
  of the seed date. A **genuine vacancy** is seeded as a vacant office (no politician attached) —
  never backfilled. Research found **zero genuine current vacancies** — 3 mid-term seats
  (Senate D9, House D3, House D7) had a resignation but each already has a sitting
  successor (see "The Roster" below).
- **D-03:** Target 90/90 headshots at 600×750 (4:5, Lanczos q90, crop-first, no distortion).
  Primary source `azleg.gov` member portraits (format confirmed below). If truly unsourceable,
  pause at an operator-supplied-file checkpoint (191 Presmyk precedent) — research found this
  is **not expected to trigger**: all 90 current members have a working `azleg.gov` photo URL.
- **D-04:** Two chambers under State of Arizona: Senate → `name='State Senate'`,
  `name_formal='Arizona State Senate'`, title `'State Senator'`; House →
  `name='House of Representatives'`, `name_formal='Arizona House of Representatives'`, title
  `'State Representative'`. **Live-verified:** matches the existing AZ chamber naming convention
  exactly (`Governor`/`Governor of Arizona`, `Treasurer`/`Treasurer of Arizona`, etc. — all under
  government_id `15436f29-38d2-4cc0-8958-9e74ba60fabf`, geo_id `04`). No conflicting chamber
  name exists yet (greenfield — 0 rows match `%senate%`/`%house%`/`%representative%` under
  geo_id='04').

### Locked by precedent (NOT re-decided)
- Legislative districts use lowercase `az`. SLDU + SLDL share the geo_id space
  (`04001..04030` both) — `district_type` is MANDATORY in every WHERE.
  **Live-verified:** `SELECT district_type, state, count(*), min(geo_id), max(geo_id) ... →
  STATE_LOWER|az|30|04001|04030` and `STATE_UPPER|az|30|04001|04030`. Labels:
  `essentials.districts.label` = `'State House District N'` / `'State Senate District N'`
  (NOT `name_formal` — that column does not exist on `districts`, confirmed by both this
  session's live schema query and the 160-01 deviation note).
- Party never displays (antipartisan) — legislators are partisan but party is not surfaced.
- Migrations: structural REGISTER, headshot migs are AUDIT-ONLY.
- Migration numbering is DISK-authoritative; never `max(version::int)` (throws on mixed-format
  version strings — reconfirmed this session: `SELECT max(version::int) ...` errors with
  `value "20260602031258" is out of range for type integer`). Use
  `count(*) WHERE version='NNNN'`.
- Cross-repo: all backend/migration work lives in `C:/EV-Accounts` (branch `master`); commit via
  `git -C`. `mcp__supabase-local` IS production.
- `gsd-executor` has NO Supabase MCP — DB probes/applies are inline-orchestrator steps.

### Claude's Discretion (resolved by this research, planner may still adjust)
- **ext_id numbering** — recommend `-4005001..-4005030` (Senate) and `-4006001..-4006060`
  (House). **Live-verified fully clear**: `SELECT count(*) FROM essentials.politicians WHERE
  external_id BETWEEN -4006999 AND -4005001` → **0**. See "Standard Stack"/"ext_id" section below
  for why the NV-style `-3203xxx`/`-3204xxx` literal pattern does NOT transplant to AZ (FIPS
  prefix collision analysis).
- **Plan/wave split** — recommend the NV 160 three-plan shape (seed / headshots / verification);
  see "Common Pitfalls" and "Validation Architecture" for why a Senate-vs-House headshot split is
  NOT needed (single azleg.gov source, uniform pipeline, no per-chamber fallback divergence).
- **Headshot fallback source per member** — not needed; azleg.gov covers all 90 (see "The
  Roster" and "Code Examples").

### Deferred Ideas (OUT OF SCOPE)
- Compass stances for all 90 AZ legislators — deferred milestone-wide (NV v18.0 pattern).
- Legislative committee/leadership structure — not modeled.
- 2026 legislative election race shells — Phase 199.
</user_constraints>

## Phase Requirements

<phase_requirements>
| ID | Description | Research Support |
|----|-------------|------------------|
| AZ-LEG-01 | 30 AZ state senators + 60 house reps (2/district) seeded, offices linked to SLDU/SLDL, 600×750 headshots; compass stances deferred by design | Full 90-member live roster below; confirmed district geo_id/type keying; confirmed offices schema has no blocking constraint; confirmed azleg.gov headshot source covers 90/90; confirmed ext_id block collision-free |
</phase_requirements>

## Standard Stack

This is a data-seed phase — no new libraries. Reuse the exact toolchain already in
`C:/EV-Accounts/backend`:

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| psycopg2 / `psql` | already in repo | DB writes/reads against production | 191/190 precedent |
| Pillow (PIL) | already in repo (12.1.1 confirmed installed) | crop_to_4_5 → resize 600×750 Lanczos → JPEG q90 | 191 `_tmp-az-state-exec-headshots.py` |
| requests | already in repo | HTTP download of azleg.gov portraits | 191 precedent |
| Supabase Storage REST (x-upsert PUT) | n/a | Upload to `politician_photos` bucket | 160-02/191 precedent |

**No new packages.** Package Legitimacy Audit: **N/A this phase** — reuses existing installed
dependencies verbatim (same as every prior legislature/headshot phase in this project's history).

### ext_id range — verified collision-free (why NOT to literally reuse NV's `-3203xxx`/`-3204xxx`)

CONTEXT.md's discretion note says "follow the NV sibling convention (`-3203xxx` Senate /
`-3204xxx` Assembly)" — this means *follow the pattern*, not literally reuse NV's numbers (that
would collide with NV's own 21+42 already-seeded legislators at those exact external_ids).
NV's scheme is `-{FIPS=32}{chamber-code}{member}`; AZ's FIPS is `04`, but this project's
AZ-specific external_ids so far do **not** follow a FIPS-prefixed-millions scheme — they use an
ad hoc `-400Nxxx` family (`-400091..094` legacy AZ execs, `-4001..-4009` US House, `-4004001..007`
STATE_EXEC gap-fill from Phase 191). Live DB probes this session:

```
-- Confirmed occupied (AZ-adjacent zones):
-400091..-400094   Hobbs/Mayes/Fontes/Yee (legacy AZ execs, pre-Phase-191)
-4001..-4009        AZ US House (191-02)
-4004001..-4004007  AZ STATE_EXEC gap-fill (191-01: Horne/Presmyk/5×Corp Comm)
-4000001..-4000004  Oklahoma execs (Stitt/Pinnell/Drummond/Russ) — NOT an AZ range, confirms
                    the "400" 7-digit zone is shared/generic, not exclusively AZ-owned

-- Confirmed CLEAR (this session, full sweep, 0 rows):
SELECT count(*) FROM essentials.politicians WHERE external_id BETWEEN -4006999 AND -4005001;
→ 0
```

**Recommendation:** `-4005001..-4005030` for the 30 Senators (1:1 with LD 1-30, i.e.
`-40050NN` = LD-NN Senator), `-4006001..-4006060` for the 60 House reps (2 consecutive per LD:
`-4006(2·N-1)` and `-4006(2·N)` = the two reps of LD-N; no seat-label meaning attached to which
of the two numbers a given rep gets — D-01 forbids treating them as ordered seats). Both ranges
verified fully clear in the same query above (the -4006999..-4005001 sweep spans both).
**[VERIFIED: live psql query against production]**

## Architecture Patterns

### System Architecture Diagram

```
azleg.gov member roster (HTML)                azleg.gov MemberPhotos (JPEG, per-surname)
        │                                              │
        ▼                                              ▼
 [research: 90-member roster,               [inline orchestrator: download →
  district assignment, party]                crop_to_4_5 → resize 600×750 →
        │                                     upload to Storage x-upsert]
        ▼                                              │
 Structural migration (registered)                     ▼
  essentials.chambers (Senate + House,          Audit-only migration (unregistered)
   under State of Arizona geo_id='04')           essentials.politician_images
        │                                        (id, politician_id, url, type,
        ▼                                         photo_license) — 90 rows
  essentials.politicians (90 rows,                       │
   external_id -4005001..-4006060)                       │
        │                                                 │
        ▼                                                 │
  essentials.offices (90 rows, each                       │
   politician_id + chamber_id +                           │
   district_id[SLDU/SLDL @ state='az'])◄───────────────────┘ (same politician_id join)
        │
        ▼
  office_id back-fill on politicians
        │
        ▼
  Existing /representatives/me address-routing (Phase 190 geofences)
  resolves the correct Senator + 2 Reps for any AZ address — NO code change
```

### Recommended Project Structure (backend repo, unchanged layout)
```
C:/EV-Accounts/backend/
├── migrations/
│   ├── {NEXT}_az_legislature.sql              # structural, registered
│   └── {NEXT+1}_az_legislature_headshots.sql  # audit-only, NOT registered
└── scripts/
    └── _tmp-az-legislature-headshots.py       # gitignored per repo convention (backend/scripts/_*)
```

### Pattern 1: Collegial multi-member district — correct NOT EXISTS guard key

**What:** When N>1 offices legitimately share BOTH `district_id` AND `chamber_id` (AZ's 2
house reps per SLDL district), the migration's own idempotency guard must NOT key on
`(district_id, chamber_id)` — that would silently block the 2nd rep's INSERT even with no DB
constraint forcing it. This is a **documented, recurring project gotcha**, not novel to AZ.

**When to use:** Any office INSERT where 2+ people share one district+chamber pair (AZ House
LD reps here; also MD's 3-per-district delegates, NV/ME's 2-per-state US Senators).

**Example (from this project's own playbook, `LOCATION-ONBOARDING.md`):**
```
[GOTCHA] For bicameral legislatures: senator office uniqueness key is
(district_id, politician_id), NOT (district_id, chamber_id): ... two senators
share the same NATIONAL_UPPER district ... If you model the uniqueness key as
(district_id, chamber_id), the second senator INSERT violates the constraint
because chamber_id is identical for both. The correct key is (district_id, politician_id).
```
```
[GOTCHA] [STATE-SPECIFIC: MD] Multi-member delegate INSERT NOT EXISTS guard must use
(district_id, politician_id) — NOT (district_id, chamber_id): ... most geographic
districts have 3 delegates who all share the same SLDL polygon ... The correct guard
is (district_id, politician_id), which allows multiple delegates per district but
prevents duplicating the same individual.
```
**AZ 191 also already established this exact pattern for a different collegial body**
(Corporation Commission, 5 officers sharing 1 STATE_EXEC district):
`NOT EXISTS (district_id, politician_id)` — confirmed in `191-01-SUMMARY.md`
`patterns-established`. **Apply the identical guard shape to the 60 AZ house offices.**
[VERIFIED: project playbook + live 191 precedent]

### Pattern 2: Appointed-officeholder-on-elected-office flags (mid-term successor)

**What:** For the 3 mid-term successors in the live roster (Kiana Sears SD-9, Cody Reim HD-3,
Sylvia Allen HD-7 — see "The Roster"), set `politicians.is_appointed=true` (their personal path:
county-board appointment to fill a vacancy) while `offices.is_appointed_position=false` (the
seat itself remains a directly-elected office). `is_incumbent=true`, `is_active=true`.

**Example — live-verified from Phase 191's Presmyk precedent (identical flag combination):**
```sql
-- Confirmed via live psql query this session:
-- title='State Mine Inspector', is_appointed_position=f, is_appointed=t,
--   is_incumbent=t, is_active=t  (Les Presmyk, external_id -4004002)
```
Apply the same 4-flag combination to Sears/Reim/Allen. [VERIFIED: live DB query]

### Anti-Patterns to Avoid
- **Seat A/B labeling for house reps:** D-01 explicitly forbids this — Arizona's 2 house seats
  per district are legally undifferentiated (top-two at-large within the LD); do not invent
  `normalized_position_name` values like "Seat 1"/"Post A".
- **Assuming `districts.name_formal` exists:** it does not (confirmed live this session AND by
  the 160-01 deviation note) — use `label`.
- **Literal reuse of NV's `-3203xxx`/`-3204xxx` external_ids for AZ:** those exact integers are
  already occupied by NV's own 63 legislators — a direct copy-paste would either collide or
  silently mis-link if the collision check is skipped.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Crop-to-4:5 + resize pipeline | A new PIL pipeline from scratch | Copy `_tmp-az-state-exec-headshots.py`'s `crop_to_4_5`/`resize_600x750`/`upload_to_storage` functions verbatim | Already handles the "already 4:5, no distortion" case correctly (most azleg.gov photos ARE already 4:5 — see Code Examples) and the low-res-thumbnail upscale case (min_dim=100 threshold, needed for at least 1 of the 3 mid-term appointees) |
| UUID resolution for headshot upload | Hardcoded UUIDs in the script | Runtime `SELECT id FROM essentials.politicians WHERE external_id=%s` | Established pattern in every prior headshot script (160-02, 191-01/02) — avoids wrong-photo binding if migration re-runs generate different UUIDs on a retry |
| Address→officeholder routing | New frontend/API code | Existing `/representatives/me` (already resolves via `district_id`) | No frontend change needed once office+politician+image rows exist — confirmed by every prior legislature phase (159, 160, 191) |

**Key insight:** every piece of this phase — chamber/office/politician shape, headshot pipeline,
migration split, verification SQL shape — already has a working, DB-verified precedent
committed in this repo from Phases 159-191. The only genuinely new work is the 90-row AZ-specific
data (roster + filenames + ext_id block), all captured below.

## Common Pitfalls

### Pitfall 1: Silently blocking the 2nd house rep's INSERT with the wrong guard key
**What goes wrong:** Using `NOT EXISTS (district_id, chamber_id)` for the house-office INSERT
CTE causes the 2nd rep's row to be silently skipped (first rep "wins" the guard).
**Why it happens:** It's the natural, unremarkable-looking guard to write — it works everywhere
else in this codebase where 1 office = 1 district+chamber.
**How to avoid:** Guard on `(district_id, politician_id)` per Pattern 1 above. Post-migration
audit MUST assert `SELECT district_id, count(*) FROM essentials.offices WHERE chamber_id=<house
chamber> GROUP BY 1 HAVING count(*) <> 2` returns 0 rows (every SLDL district has exactly 2).
**Warning signs:** House office count < 60 after migration; a district_id group-by count of 1
instead of 2.

### Pitfall 2: Confusing "56th Legislature" (stale label) with the actual current 57th
**What goes wrong:** Seeding a 2023-24 roster (56th) instead of the current 2025-26 roster
(57th) — wrong people, wrong districts for anyone who moved/lost/won since.
**Why it happens:** The phase objective text and CONTEXT.md both say "56th" — likely a stale
reference carried from earlier milestone planning.
**How to avoid:** D-02 itself says "current sitting ... as of the seed date" — that's the 57th.
This research's roster (below) IS the 57th. Flag the "56th" text as informational/stale, not
a locked decision to re-litigate — the planner should seed the 57th roster regardless of the
label, per D-02's own instruction.
**Warning signs:** None if the planner uses the roster in this document as-is.

### Pitfall 3: Treating a resignation note on azleg.gov as a current vacancy
**What goes wrong:** Seeding a departed member (Chaplik, Marshall, Burch) as the current
officeholder, or seeding their district as vacant, when a successor already sits.
**Why it happens:** azleg.gov's roster page lists BOTH the departed member (with a "resigned"
annotation) AND the successor for the same district — a naive scrape could pick the wrong one,
or a naive "any resignation note = vacant" rule could wrongly vacate a filled seat.
**How to avoid:** This research cross-verified all 3 resignations (Chaplik→Reim HD-3,
Marshall→Allen HD-7, Burch→Sears SD-9) against 3 independent news sources each (KJZZ, AZ Capitol
Times, KTAR/Hoodline/Maricopa County press releases) — all 3 successors are already seated with
no further vacancy. **There are zero genuine vacancies in the current 90-member roster.**
**Warning signs:** A structural migration author sees "resigned" in a manifest and marks
`is_vacant=true` — cross-check against "The Roster" below (which already reflects the resolved
current holder for all 3 seats) before doing so.

### Pitfall 4: `max(version::int)` migration-counter query throws
**What goes wrong:** `SELECT max(version::int) FROM supabase_migrations.schema_migrations`
errors with `value "20260602031258" is out of range for type integer` — reconfirmed live this
session (mixed-format version column, some rows are timestamp-style, not integer).
**How to avoid:** Use `SELECT count(*) FROM supabase_migrations.schema_migrations WHERE
version='NNNN'` per-candidate-number, or `WHERE version ~ '^[0-9]{1,4}$'` with care. On-disk MAX
this session is **1285** (`1285_az_presmyk_headshot.sql`); ledger's highest REGISTERED integer
version is **1282**. **Re-verify both at execute time** — other phases may land migrations
between this research and Phase 192's execution (per 191-03-SUMMARY's own explicit warning that
drift is "expected to recur").

### Pitfall 5: Assuming Sears/Reim/Allen's azleg.gov photo is already 4:5
**What goes wrong:** Skipping the crop step for mid-term-appointee photos because "azleg.gov
photos are already 4:5" (true for most, per Code Examples) causes a distorted stretch for the
exceptions.
**Why it happens:** A quick spot-check of a few long-tenured members' photos (868×1085, 0.8
ratio; 1920×2400, 0.8 ratio) suggests uniform 4:5 sourcing.
**How to avoid:** Live-measured this session: Kiana Sears's photo is **452×632 (ratio 0.715)** —
NOT 4:5. Keep the existing crop_to_4_5-first pipeline (D-03's own lock) rather than switching to
a resize-only pipeline (unlike the US House `unitedstates.github.io` source, which genuinely is
uniformly pre-cropped). Treat crop-first as a safety net that is usually a no-op, not dead code.
**Warning signs:** A stretched/distorted Sears (or any other appointee) headshot on the profile.

### Pitfall 6: Non-ASCII filenames need percent-encoded UTF-8 in the download URL
**What goes wrong:** `requests.get()` with a raw Unicode surname (e.g. `PEÑA.jpg`,
`GABALDÓN.jpg`, `MÁRQUEZ.jpg`, `LUNA-NÁJERA.jpg`) may fail depending on how the URL is
constructed if not properly UTF-8-percent-encoded.
**How to avoid:** Live-verified this session that `requests`/`curl` with percent-encoded UTF-8
bytes works (`PE%C3%91A.jpg` → HTTP 200). Python's `requests` library handles this automatically
when the URL is built via `urllib.parse.quote()` on the raw string, or when `requests` is passed
a `str` URL containing the raw Unicode characters (it percent-encodes non-ASCII automatically in
recent versions) — verify with a dry-run HEAD request per member before the real batch run.
**Warning signs:** 404s specifically on Peña, Gabaldón, Márquez, Luna-Nájera if encoding is wrong.

## Code Examples

### azleg.gov headshot URL pattern — verified this session (HTTP HEAD probes)
```
Pattern: https://www.azleg.gov/alisImages/MemberPhotos/57leg/{Senate|House}/{SURNAME}.jpg
  - SURNAME is UPPERCASE, exact family name, with a disambiguation suffix
    (_A/_C/_L, _N/_P) when 2+ current members in the SAME chamber share a surname.
  - Hyphens preserved for compound surnames (LUNA-NÁJERA).
  - Accented characters (Á, É, Ñ, Ó) appear literally in the HTML <img src>; the live HTTP
    fetch requires UTF-8 percent-encoding (PE%C3%91A.jpg → 200).
  - Chamber-scoped: a Senator's file lives ONLY under /Senate/, a Representative's ONLY
    under /House/ (e.g. House/Sears.jpg → 404; Senate/Sears.jpg → 200, since Sears sits
    in the Senate).

Confirmed HTTP 200 (sample, this session): House/Bliss.jpg, Senate/Finchem.jpg,
Senate/Sears.jpg, House/Reim.jpg, House/Allen.jpg, House/Luna-Najera.jpg (ASCII variant
also resolves — server appears case/accent-tolerant on this one path, but treat the
UTF-8 exact-match form as canonical), House/Marquez.jpg, House/Pena.jpg, Senate/Gonzales.jpg.

Sample dimensions measured (PIL, this session):
  House/Bliss.jpg      868×1085  (ratio 0.800 — already 4:5)
  Senate/Finchem.jpg   1920×2400 (ratio 0.800 — already 4:5)
  House/Chaplik.jpg    868×1085  (ratio 0.800 — already 4:5, departed member, do not use)
  House/Gillette.jpg   826×1033  (ratio 0.800 — already 4:5)
  House/Reim.jpg       864×1080  (ratio 0.800 — already 4:5)
  Senate/Sears.jpg     452×632   (ratio 0.715 — NOT 4:5, needs real crop; mid-term appointee)
```

### The full manifest of photo filenames present on the roster page (this session, exact grep of raw HTML)
```
House (62 files present — 60 current + 2 departed [Chaplik, Marshall], do not use the departed 2):
ABEYTIA AGUILAR ALLEN AUSTIN BIASIUCCI BLACKMAN BLATTMAN BLISS CARBONE
CARTER_N CARTER_P CAVERO CHAPLIK(departed) CONNOLLY CONTRERAS_L CONTRERAS_P CREWS
DE_LOS_SANTOS DIAZ FINK GARCIA GILLETTE GRESS GRIFFIN GUTIERREZ HEAP HENDRIX
HERNANDEZ_A HERNANDEZ_C HERNANDEZ_L KESHEL KOLODIN KUPPER LIGUORI LIVINGSTON LOPEZ
LUNA-NÁJERA MARSHALL(departed) MARTINEZ MATHIS MONTENEGRO MÁRQUEZ NGUYEN OLSON
PESHLAKAI PEÑA PINGERELLI POWELL REIM RIVERO SANDOVAL SIMACEK STAHL_HAMILTON
TAYLOR TRAVERS TSOSIE VILLEGAS VOLK WAY WENINGER WILLOUGHBY WILMETH

Senate (31 files present — 30 current + 1 departed [Burch], do not use the departed 1):
ALSTON ANGIUS BOLICK BRAVO BURCH(departed) CARROLL DIAZ DUNN EPSTEIN FARNSWORTH
FERNANDEZ FINCHEM GABALDÓN GONZALES GOWAN HATATHLIE HOFFMAN KAVANAGH KUBY LEACH
MESNARD MIRANDA ORTIZ PAYNE PETERSEN ROGERS SEARS SHAMP SHOPE SUNDARESHAN WERNER
```
[VERIFIED: direct HTTP fetch of azleg.gov/memberroster/ HTML this session]

## The Roster

**56th vs 57th note:** this is the 57th Arizona Legislature (2025-2026), which is the CURRENT
sitting legislature as of 2026-07-08 — see Summary/Pitfall 2. Party is captured for the
`politicians.party` column (full word, e.g. `'Republican'`) but per antipartisan lock, party
is never surfaced on profiles.

### Senate — 30 members, 1 per district (recommended ext_id `-4005001..-4005030` = LD 1-30)
[MEDIUM-HIGH confidence: azleg.gov official roster, cross-checked against Wikipedia's 57th
Legislature table + 2 independent news sources for the one mid-term change (D9)]

| LD | Name | Party | Notes |
|----|------|-------|-------|
| 1 | Mark Finchem | R | |
| 2 | Shawnna Bolick | R | |
| 3 | John Kavanagh | R | |
| 4 | Carine Werner | R | |
| 5 | Lela Alston | D | |
| 6 | Theresa Hatathlie | D | |
| 7 | Wendy Rogers | R | |
| 8 | Lauren Kuby | D | |
| 9 | **Kiana Sears** | D | Mid-term appointee (Maricopa Co. Bd. of Supervisors, effective ~Mar 2025), replacing Eva Burch (resigned). Set `is_appointed=true` on politician, `is_appointed_position=false` on office. |
| 10 | David C. Farnsworth | R | |
| 11 | Catherine Miranda | D | |
| 12 | Denise "Mitzi" Epstein | D | |
| 13 | J.D. Mesnard | R | |
| 14 | Warren Petersen | R | President |
| 15 | Jake Hoffman | R | |
| 16 | Thomas "T.J." Shope | R | President Pro Tempore |
| 17 | Venden "Vince" Leach | R | |
| 18 | Priya Sundareshan | D | Minority Leader |
| 19 | David Gowan | R | |
| 20 | Sally Ann Gonzales | D | |
| 21 | Rosanna Gabaldón | D | |
| 22 | Eva Diaz | D | |
| 23 | Brian Fernandez | D | |
| 24 | Analise Ortiz | D | |
| 25 | Timothy "Tim" Dunn | R | |
| 26 | Flavio Bravo | D | |
| 27 | Kevin Payne | R | |
| 28 | Frank Carroll | R | |
| 29 | Janae Shamp | R | |
| 30 | Hildy Angius | R | |

### House — 60 members, 2 per district (recommended ext_id `-4006001..-4006060`, 2 consecutive per LD; no seat ordering implied)

| LD | Reps | Party | Notes |
|----|------|-------|-------|
| 1 | Selina Bliss / Quang H Nguyen | R / R | |
| 2 | Stephanie Simacek / Justin Wilmeth | D / R | |
| 3 | Alexander Kolodin / **Cody Reim** | R / R | Reim is mid-term appointee replacing Joseph Chaplik (resigned 3/2/2026 to run for AZ CD-1). `is_appointed=true` on Reim's politician row; office `is_appointed_position=false`. Chaplik's row must NOT be seeded/kept as current. |
| 4 | Pamela Carter / Matt Gress | R / R | |
| 5 | Sarah Liguori / Aaron Márquez | D / D | |
| 6 | Mae Peshlakai / Myron Tsosie | D / D | |
| 7 | **Sylvia Allen** / Walt Blackman | R / R | Allen is mid-term appointee replacing David Marshall Sr. (resigned 4/17/2026, appointed Navajo Co. Recorder). `is_appointed=true` on Allen's politician row; office `is_appointed_position=false`. Marshall's row must NOT be seeded/kept as current. |
| 8 | Janeen Connolly / Brian Garcia | D / D | |
| 9 | Lorena Austin / Seth Blattman | D / D | |
| 10 | Ralph Heap / Justin Olson | R / R | |
| 11 | Junelle Cavero / Oscar De Los Santos | D / D | Minority Leader (De Los Santos) |
| 12 | Patty Contreras / Stacey Travers | D / D | |
| 13 | Jeff Weninger / Julie Willoughby | R / R | Majority Whip (Willoughby) |
| 14 | Laurin Hendrix / Khyl Powell | R / R | |
| 15 | Neal Carter / Michael Way | R / R | Speaker Pro Tempore (N. Carter) |
| 16 | Teresa Martinez / Chris Lopez | R / R | |
| 17 | Rachel Keshel / Kevin Volk | R / D | |
| 18 | Nancy Gutierrez / Christopher Mathis | D / D | Assistant Minority Leader (Gutierrez) |
| 19 | Lupe Diaz / Gail Griffin | R / R | |
| 20 | Alma Hernandez / Betty J Villegas | D / D | |
| 21 | Consuelo Hernandez / Stephanie Stahl Hamilton | D / D | |
| 22 | Lupe Contreras / Elda Luna-Nájera | D / D | |
| 23 | Michele Peña / Mariana Sandoval | R / D | |
| 24 | Anna Abeytia / Lydia Hernandez | D / D | |
| 25 | Michael Carbone / Nick Kupper | R / R | Majority Leader (Carbone) |
| 26 | Cesar Aguilar / Quantá Crews | D / D | Minority Whip (Crews) |
| 27 | Lisa Fink / Tony Rivero | R / R | |
| 28 | David Livingston / Beverly Pingerelli | R / R | |
| 29 | Steve Montenegro / James Taylor | R / R | Speaker (Montenegro) |
| 30 | Leo Biasiucci / John Gillette | R / R | |

**Genuine vacancies found: 0.** All 3 mid-term resignations (Burch/SD9, Chaplik/HD3,
Marshall/HD7) already have a seated successor, each independently confirmed via 2-3 news
sources (KTAR/Hoodline/Maricopa County for Burch→Sears; KJZZ/AZ Capitol Times for
Chaplik→Reim; KJZZ/AZ Medical Association for Marshall→Allen), in addition to azleg.gov's own
roster page. **Recommend a mandatory Wave-0 operator-verification checkpoint** (mirroring NV
160 Task 2) before the structural migration applies — a 90-person roster assembled via
AI-assisted web research (even when cross-verified as here) carries residual risk of a
missed same-day change; the checkpoint is cheap insurance, not a sign this research is
unreliable.

## Package Legitimacy Audit

**N/A this phase** — no new npm/pip/cargo packages. Reuses `psycopg2`/`Pillow`/`requests`
already installed and used by every prior headshot script in `C:/EV-Accounts/backend/scripts/`.

## Runtime State Inventory

**N/A this phase** — this is a greenfield legislative seed (0 legislature chambers/offices/
politicians exist under geo_id='04' today, confirmed live this session), not a rename/refactor/
migration of existing state.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 90-member roster (Senate + House party/district assignments) is fully current as of the seed date | The Roster | A missed same-day resignation/appointment would seed a wrong or stale officeholder for that 1 seat. Mitigated by the recommended Wave-0 checkpoint (mirrors NV 160). |
| A2 | `photo_license='us_government_work'` is the correct license tag for azleg.gov official portraits | (implied in Code Examples / pipeline) | Cosmetic/metadata-only risk — matches the license convention used for every other state-legislature official-portrait source in this project (NV, OR, MD) [ASSUMED — not a legal determination, matches project convention only]. |
| A3 | `num_officials` on the SLDL district rows is not required to be set to 2 | Standard Stack / Architecture | Low risk — this column is sparsely/inconsistently populated across the whole `districts` table (many chamber types have it NULL) and no prior 2-per-district or 3-per-district phase (NV, MD) set it; if a future frontend feature reads it, a follow-up migration can backfill. |

**All ext_id ranges, offices-constraint conclusion, district geo_id/type keying, headshot URL
pattern, and roster-vacancy resolution above are `[VERIFIED]` via live `psql`/`curl` probes run
this session** — not training-data assumptions. Only A1-A3 carry residual uncertainty.

## Open Questions (RESOLVED)

1. **Should the two house offices per district get any distinguishing metadata at all (even
   non-voter-facing)?**
   - What we know: D-01 forbids any voter-facing Seat A/B label. `normalized_position_name` and
     `role_canonical` are both left blank for NV's legislature offices (live-checked this
     session) — so leaving them blank for AZ too matches precedent.
   - What's unclear: Whether a future admin/internal tool would benefit from *some* internal
     tiebreaker (e.g., which of the 2 ext_ids maps to which physical office desk) — not observed
     as a need anywhere else in the codebase.
   - RESOLVED: Leave both columns blank, matching NV precedent exactly. Do not invent a
     new convention for AZ alone. (Implemented in Plan 01 — role_canonical +
     normalized_position_name left NULL.)

2. **Exact migration number to assign.**
   - What we know: on-disk MAX is 1285 this session; ledger's highest registered integer is
     1282 (1283-1285 are audit-only/unregistered, as designed).
   - What's unclear: Whether another phase lands a migration between this research and Phase
     192's execution (191-03-SUMMARY explicitly warns this "is expected to recur").
   - RESOLVED: Re-run both the on-disk `ls backend/migrations | sort` MAX check and the
     ledger `count(*) WHERE version='NNNN'` check as the FIRST inline-orchestrator step of Plan 01
     (Wave-0), exactly as NV 160's Task 2 (P3) did. Provisionally: structural = **1286**,
     audit-only headshots = **1287** — but these numbers are expected to drift; Plans 01/02
     name their files at disk-MAX+1 at execute time and record the ACTUAL numbers in their
     SUMMARYs, and Plan 03 substitutes those actual numbers before its ledger-registration audit.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | DB writes/reads (inline orchestrator) | ✓ | PostgreSQL 18 client (`/c/Program Files/PostgreSQL/18/bin/psql`) | — |
| Python (`py -3` launcher) | headshot pipeline | ✓ | 3.14.3, with Pillow 12.1.1, psycopg2, requests present (confirmed by 191-01-SUMMARY and this session's PIL probe) | `python`/`python3` aliases are Windows Store stubs — use `py -3` |
| `azleg.gov` (headshot + roster source) | D-03, "The Roster" | ✓ | n/a | No fallback needed — 90/90 coverage confirmed |
| `C:/EV-Accounts/backend/.env` (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) | all DB/Storage writes | ✓ | present, loads via `dotenv` | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** none identified — this phase has no environment gaps.

## Validation Architecture

> No traditional unit-test framework applies — this project's "test framework" for data-seed
> phases is a fixed set of `psql`/`curl` audit queries, matching every prior legislature phase
> (159, 160, 191).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (SQL/HTTP audit checks via `psql -tAc` / `curl -sI`, inline orchestrator only) |
| Config file | none — see 160-VALIDATION.md for the exact analog shape to copy |
| Quick run command | per-check `psql "$DATABASE_URL" -tAc "<query>"` |
| Full suite command | the 9-11-check sequence documented in "Phase Requirements → Test Map" below |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AZ-LEG-01 | 30 Senate offices under State Senate chamber @ geo_id='04' | SQL audit | `psql -tAc "SELECT count(*) FROM essentials.offices o JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.name='State Senate'"` → expect 30 | ❌ Wave 0 (write as Task 1 of the verification plan, mirroring 160-03) |
| AZ-LEG-01 | 60 House offices, 2/district, under House chamber @ geo_id='04' | SQL audit | `... GROUP BY district_id HAVING count(*) <> 2` → expect 0 rows | ❌ Wave 0 |
| AZ-LEG-01 | District linkage STATE_UPPER 30 / STATE_LOWER 30 at state='az' | SQL audit | per 160-VALIDATION.md shape | ❌ Wave 0 |
| AZ-LEG-01 | 90/90 headshots, CDN-200 | SQL + HTTP audit | `politician_images` count + `curl -sI` spot-check | ❌ Wave 0 |
| AZ-LEG-01 | 0 compass stances (deferred, verified absent) | SQL audit | `SELECT count(*) FROM inform.politician_answers WHERE politician_id IN (...)` → expect 0 | ❌ Wave 0 |
| AZ-LEG-01 | 0 section-split defects | SQL audit | STATE_UPPER/STATE_LOWER OR-direction query (190-02 Gate 7 shape) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the relevant count/HAVING query for that task's write.
- **Per wave merge:** full 6+-check sequence above.
- **Phase gate:** all checks green + human checkpoint (address routing + correct-person photo
  spot-check, mirroring NV 160 Task 2) before phase close.

### Wave 0 Gaps
- [ ] No `.sql` verification script exists yet — write the check sequence inline in Plan 03
  (or a dedicated verification plan), copying 160-VALIDATION.md's shape with AZ's chamber
  names/ext_id ranges substituted.
- [ ] Framework install: none needed.

## Security Domain

> `security_enforcement` is absent from `.planning/config.json` → treat as enabled. This is a
> backend-only data-seed phase with no new user-facing input surface; the applicable ASVS
> categories are minimal, matching every prior legislature-seed phase in this project.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No new auth surface |
| V3 Session Management | No | No new session surface |
| V4 Access Control | No | Writes are service-role/direct-DB only, not exposed via any new API endpoint |
| V5 Input Validation | Marginal | The roster/headshot data is authored by the migration file itself (static SQL), not runtime user input — standard SQL-injection concerns are N/A for a hand-authored migration; the headshot pipeline script parameterizes its one runtime query (`external_id = %s`) via psycopg2, not string interpolation |
| V6 Cryptography | No | No new secrets; reuses existing `SUPABASE_SERVICE_ROLE_KEY`/`DATABASE_URL` from the gitignored `.env` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Wrong-government section split (office attaches under a non-AZ chamber) | Tampering | Scope every chamber/office subquery to `government_id` WHERE `geo_id='04'`; section-split SQL gate must return 0 rows |
| Silent zero-office no-op from wrong district casing/type in WHERE | Tampering | Every office WHERE uses `state='az'` lowercase + `district_type`; per-chamber count audit asserts 30/60 |
| Malicious image payload (EXIF/stego) from a remote azleg.gov fetch | Tampering | PIL `convert('RGB')` + re-encode JPEG `optimize=True` strips EXIF/embedded data (existing pipeline already does this) |
| Wrong-person / departed-member photo bound to a current politician row | Spoofing | Only fetch the CURRENT roster's surnames (per "The Roster" above); never fetch/attach `CHAPLIK.jpg` or `MARSHALL.jpg` or `BURCH.jpg` (the 3 confirmed-departed filenames still present on azleg.gov); human checkpoint spot-checks a sample including the 3 mid-term appointees |
| Service-role key leakage | Information disclosure | Key read only from gitignored `.env`; script itself gitignored (`backend/scripts/_*`); no key ever appears in a committed migration file |

## Sources

### Primary (HIGH confidence — live-verified this session)
- Live `psql` probes against production `essentials` schema via `C:/EV-Accounts/backend/.env`
  `DATABASE_URL` — table/column introspection (`information_schema.columns`,
  `pg_constraint`/`pg_indexes` on `essentials.offices`), district counts/keying, external_id
  range occupancy, chamber naming precedent, Presmyk flag precedent, ledger mixed-format
  version-column reconfirmation.
- `https://www.azleg.gov/memberroster/` — direct HTML fetch (raw `curl`), grepped for the exact
  `MemberPhotos/57leg/{Senate,House}/{SURNAME}.jpg` manifest (93 filenames total: 90 current +
  3 departed).
- Direct `curl -sI` HTTP HEAD probes (~17 sample URLs) confirming 200 status, no WAF/403, and
  Content-Type/Content-Length for the azleg.gov photo pattern including accented-filename
  percent-encoding.
- PIL `Image.open().size` measurement of 6 sample downloaded photos confirming aspect ratio
  (mostly 4:5 already; 1 mid-term-appointee exception at 0.715).

### Secondary (MEDIUM confidence — WebSearch/WebFetch, cross-verified against 2-3 independent
sources each)
- KTAR, Hoodline, Maricopa County press release — Eva Burch (SD-9) resignation → Kiana Sears
  appointment.
- KJZZ, Arizona Capitol Times — Joseph Chaplik (HD-3) resignation → Cody Reim appointment.
- KJZZ, Arizona Medical Association — David Marshall Sr. (HD-7) resignation → Sylvia Allen
  appointment.
- `en.wikipedia.org/wiki/57th_Arizona_State_Legislature` — baseline 90-member roster (used as
  the pre-vacancy skeleton, then corrected against the 3 primary-source resignations above,
  since Wikipedia's table had not yet been updated for any of the 3 mid-term changes).

### Tertiary (LOW confidence)
- None retained — every WebSearch/WebFetch finding above was either cross-verified against a
  2nd/3rd independent source or superseded by a live HTTP/DB probe.

## Metadata

**Confidence breakdown:**
- Standard stack / ext_id ranges: HIGH — live DB query, zero training-data guessing.
- Architecture (offices constraint, district keying): HIGH — live schema introspection.
- Roster (90 names/districts/party): MEDIUM-HIGH — azleg.gov primary source + Wikipedia
  baseline + 3 independently-sourced vacancy corrections; residual risk is a same-week change
  missed by all sources, mitigated by the recommended Wave-0 operator checkpoint.
- Headshot pipeline/pitfalls: HIGH — direct HTTP/PIL measurement of actual files.

**Research date:** 2026-07-08
**Valid until:** ~14 days for the roster (legislative sessions can see further mid-term
appointments at any time — re-verify against azleg.gov's "current" roster at plan/execute time
if more than ~2 weeks elapse); ~90 days for the schema/architecture findings (stable).
