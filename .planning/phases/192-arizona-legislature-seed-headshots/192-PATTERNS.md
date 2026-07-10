# Phase 192: Arizona Legislature (seed + headshots) - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 4 (structural migration, audit-only headshot migration, headshot Python script, verification audit block)
**Analogs found:** 4 / 4 (all strong matches; no gaps)

This phase creates **no application source files** in `essentials` — it writes SQL migrations
and a gitignored Python script in the separate backend repo `C:/EV-Accounts`. Officials become
profile-visible automatically once DB rows exist (existing `/representatives/me` address-routing
resolves via `district_id` — confirmed by 190/191/160 precedent, no frontend change this phase).

## File Classification

| New File (backend repo) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/migrations/{NEXT}_az_legislature.sql` (structural, registered) | migration | CRUD (batch INSERT) | `backend/migrations/1053_nv_legislature.sql` (2-chamber legislature seed, exact shape) + `backend/migrations/1282_az_state_exec_gap.sql` (AZ conventions + collegial-body guard) | exact (role+flow) |
| `backend/migrations/{NEXT+1}_az_legislature_headshots.sql` (audit-only, unregistered) | migration | batch (audit INSERT) | `backend/migrations/1284_az_house_headshots.sql` (AZ 191's audit-only `politician_images` shape) | exact |
| `backend/scripts/_tmp-az-legislature-headshots.py` (gitignored) | utility (pipeline script) | file-I/O (fetch→transform→upload) | `backend/scripts/_tmp-az-state-exec-headshots.py` (AZ 191's crop-4:5→600x750→Storage pipeline) | exact |
| Verification audit (inline `psql` block, recorded in a `192-0N-SUMMARY.md`, not a tracked file) | test (SQL audit) | request-response (read-only assertions) | `191-03-PLAN.md` Task 1 audit block + `160-VALIDATION.md` Per-Task Verification Map | exact |

## Pattern Assignments

### `backend/migrations/{NEXT}_az_legislature.sql` (migration, CRUD/batch)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1053_nv_legislature.sql` (2131 lines — Phase 160, NV Legislature, 2 chambers + 63 legislators)
**Secondary analog (AZ conventions + the critical guard-key divergence):** `C:/EV-Accounts/backend/migrations/1282_az_state_exec_gap.sql`

**Header/pre-flight pattern** (1053, lines 1-56):
```sql
-- Migration 1053: Nevada State Legislature (structural seed)
--
-- Phase 160 (NV-LEG-01 / NV-LEG-02). STRUCTURAL migration (registered in the
-- migration ledger OUTSIDE the transaction at the bottom of this file).
--
-- Creates two chambers under the State of Nevada government (geo_id = '32'):
--   - Nevada State Senate    (parent of 21 STATE_UPPER offices, SD-1..SD-21)
--   - Nevada Assembly        (parent of 42 STATE_LOWER offices, AD-1..AD-42)
-- ...
BEGIN;

-- ============================================================
-- Pre-flight: assert the State of Nevada government exists
-- ============================================================
DO $$
DECLARE
  gov_count integer;
BEGIN
  SELECT COUNT(*) INTO gov_count
  FROM essentials.governments
  WHERE geo_id = '32';
  IF gov_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 government with geo_id=32, found %', gov_count;
  END IF;
END $$;
```
**AZ divergence:** swap `geo_id = '32'` → `geo_id = '04'`; the pre-flight in 1282 ALSO asserts the
4 pre-existing AZ STATE_EXEC officials still exist (lines 55-60 of 1282) — for 192 the equivalent
guard is "assert 0 legislative chambers/offices/politicians exist yet" (greenfield, per CONTEXT.md
"Reconcile check done").

**Chamber INSERT pattern** (1053, lines 58-81 — idempotent, excludes the GENERATED ALWAYS path column):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Nevada State Senate',
       'Nevada State Senate',
       (SELECT id FROM essentials.governments WHERE geo_id = '32')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Nevada State Senate'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Nevada Assembly',
       'Nevada State Assembly',
       (SELECT id FROM essentials.governments WHERE geo_id = '32')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Nevada Assembly'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')
);
```
**AZ substitution (per D-04):** `geo_id='04'`; Senate → `name='State Senate'` / `name_formal='Arizona State Senate'`; House → `name='House of Representatives'` / `name_formal='Arizona House of Representatives'`.

**Per-legislator politician+office CTE pattern — 1-per-district (Senate shape)** (1053, lines 87-117, SD-1):
```sql
-- ===== SD-1 (32001): Michelee "Shelly" Cruz-Crawford (Democratic) =====
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michelee "Shelly" Cruz-Crawford', 'Michelee "Shelly"', 'Cruz-Crawford', 'Democratic',
          true, false, false, true, -3203001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Nevada State Senate'
          AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')),
       p.id,
       'State Senator', 'NV', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '32001' AND d.district_type = 'STATE_UPPER' AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                           WHERE name = 'Nevada State Senate'
                             AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32'))
  );
```
**Use this shape verbatim for all 30 AZ Senate offices** (1 per SLDU district). Substitute
`d.geo_id='040NN'`, `d.district_type='STATE_UPPER'`, `d.state='az'` (lowercase), chamber name
`'State Senate'`, title `'State Senator'`, `representing_state='AZ'`, external_id
`-4005001..-4005030`.

**CRITICAL DIVERGENCE — House offices are 2-per-district (D-01), so the guard key MUST change.**
NV's Assembly offices (1 per AD) use the SAME `(district_id, chamber_id)` NOT EXISTS guard as
Senate (1053 lines 759-789, AD-1) — that guard is **WRONG for AZ House** because it would silently
suppress the 2nd rep's INSERT. The correct guard is the collegial-body pattern AZ 191 already
established for the 5-seat Corporation Commission (1282, lines 197-224, BLOCK 1 Nick Myers):
```sql
-- BLOCK 1: Nick Myers (-4004003) [Chair — title-on-seat, no role_canonical]
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Nick Myers', 'Nick', 'Myers', 'Republican',
          true, false, false, true, -4004003)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Corporation Commission'
          AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '04')),
       p.id,
       'Commissioner', 'AZ', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'AZ' AND d.label = 'Arizona Corporation Commission'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id   -- <-- guard key: (district_id, politician_id), NOT (district_id, chamber_id)
  );
```
**For each of AZ's 60 House offices, guard on `o.district_id = d.id AND o.politician_id = p.id`**
(not `o.chamber_id = ...`) — this is what allows both reps of a given SLDL district to insert onto
the same `district_id`+`chamber_id` pair without either INSERT silently no-op'ing the other. Title
`'State Representative'` for both (no Seat A/B per D-01), `d.district_type='STATE_LOWER'`,
`d.geo_id='040NN'`, `d.state='az'`, external_id `-4006001..-4006060` (2 consecutive per LD).

**Appointed-holder flag pattern** (for Sears/Reim/Allen — mid-term successors), verified live
against Presmyk (1282 lines 140-145 comment + politicians INSERT VALUES):
```sql
VALUES (gen_random_uuid(), 'Les Presmyk', 'Les', 'Presmyk', 'Republican',
        true, true, false, true, -4004002)
--                          ^^^^ is_appointed=true (politician's personal path)
```
and the office row keeps `is_appointed_position=false` (the office itself is elected). Apply the
identical 4-flag combination (`is_appointed=true` on the politician, `is_appointed_position=false`
on the office, `is_incumbent=true`, `is_active=true`) to Sears (SD-9), Reim (HD-3), Allen (HD-7).

**office_id back-fill pattern** (1282, lines 342-350 — STEP 4):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -4004007 AND -4004001
  AND p.office_id IS NULL;
```
Use two back-fills (Senate range `-4005030..-4005001`, House range `-4006060..-4006001`), mirroring
1053's two-range back-fill (Senate then Assembly).

**Post-verification `DO $$` gate pattern** (1282, lines 355-423 — roll back the whole transaction
on any failure; adapt the assertions to 30 Senate / 60 House / district-linkage / section-split):
```sql
DO $$
DECLARE
  v_new_pol_count INTEGER;
  ...
BEGIN
  SELECT COUNT(*) INTO v_new_pol_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -4004007 AND -4004001;

  IF v_new_pol_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 7 new AZ politicians (-4004001..-4004007), found %', v_new_pol_count;
  END IF;
  ...
  SELECT COUNT(*) INTO v_split_count
  FROM (
    SELECT p.full_name, count(DISTINCT ch.government_id) as gov_count
    FROM essentials.politicians p
    JOIN essentials.offices o ON o.politician_id = p.id
    JOIN essentials.chambers ch ON ch.id = o.chamber_id
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE d.state = 'AZ'
    GROUP BY p.full_name
    HAVING count(DISTINCT ch.government_id) > 1
  ) sub;

  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % rows for AZ', v_split_count;
  END IF;
  ...
END $$;

COMMIT;
```
**AZ 192 note:** this section-split query uses `d.state = 'AZ'` UPPERCASE because 1282's districts
are STATE_EXEC tier (uppercase per that tier's own convention). For 192's legislative districts, use
lowercase `d.state = 'az'` (per CONTEXT.md's locked casing rule) — copy 160-VALIDATION.md's
section-split query instead (below, under Verification Audit) which already uses the correct
lowercase `state='nv'` for the legislature tier; substitute `state='az'`.

**Structural ledger registration** (1282, lines 427-433 — OUTSIDE the BEGIN/COMMIT):
```sql
-- =============================================================================
-- Structural registration (OUTSIDE the transaction block)
-- =============================================================================
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1282', 'az_state_exec_gap')
ON CONFLICT (version) DO NOTHING;
```
Substitute the disk-authoritative next number (re-verify at execute time per RESEARCH Pitfall 4/
Open Question 2 — provisionally 1286) and name (`az_legislature`).

---

### `backend/migrations/{NEXT+1}_az_legislature_headshots.sql` (migration, audit-only batch)

**Analog:** `C:/EV-Accounts/backend/migrations/1284_az_house_headshots.sql` (AZ 191 Plan 02 — 8 US
House headshot rows, audit-only, unregistered)

**Header pattern** (lines 1-22):
```sql
-- 1284_az_house_headshots.sql
-- Phase 191 Plan 02 (AZ-STATE-02): AUDIT-ONLY — politician_images rows for 8 of the 9
-- Arizona US House reps. NOT registered in the migration ledger; the ledger stays unchanged.
-- Applied via psql -f (not apply_migration) AFTER the script
--   (_tmp-az-house-headshots.py) uploads all 8 images to Storage.
-- Source: https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg (4:5, public_domain).
-- Already 4:5 — resize-only to 600x750 Lanczos q90 (no crop step needed).
-- Storage path: politician_photos/{politician_uuid}-headshot.jpg
-- Columns: exactly (id, politician_id, url, type, photo_license) — no photo_origin_url (removed).
```
**AZ 192 divergence:** the header must say the source is `azleg.gov/alisImages/MemberPhotos/57leg/
{Senate|House}/{SURNAME}.jpg`, and — unlike the House-headshot source, which is "already 4:5" — most
azleg.gov photos are ALSO already 4:5 EXCEPT at least one mid-term appointee (Sears, 452×632,
ratio 0.715, per RESEARCH Pitfall 5) — the header comment should say "mostly already 4:5, crop-first
kept as a safety net" rather than "no crop step needed."

**Per-row INSERT pattern** (lines 24-33, one member):
```sql
-- David Schweikert (CD-1, external_id=-4001)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/17e59190-17e2-4a90-8353-b5ea8d083480-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4001)
);
```
Repeat 90 times (30 Senate + 60 House), substituting the external_id, the politician UUID captured
from the structural migration's actual `gen_random_uuid()` output (NOT invented ahead of time — see
191-01's own comment: "politician UUIDs ... captured from migration 1282's actual INSERT output ...
so they cannot be hardcoded ahead of the migration running"), and `photo_license` per source
(recommend `'us_government_work'` for azleg.gov official portraits, matching every other state
legislature's official-portrait convention per RESEARCH A2 — or `'operator_supplied'` for any
checkpoint-provided file per D-03/191 Presmyk precedent).

---

### `backend/scripts/_tmp-az-legislature-headshots.py` (utility, file-I/O pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-az-state-exec-headshots.py` (AZ 191 Plan 01 — 7-official crop→resize→upload pipeline; reuse verbatim, per RESEARCH "Don't Hand-Roll")

**Config/env-load pattern** (lines 29-63):
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            _env[k.strip()] = v.strip()

SUPABASE_URL = _env.get('SUPABASE_URL', '')
SERVICE_KEY = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
BUCKET = 'politician_photos'
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'

TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS

# Wikimedia/azcc.gov reject generic browser UAs — descriptive UA required.
HEADERS = {
    'User-Agent': 'EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)',
    'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
}
DOWNLOAD_TIMEOUT = 30
```
**AZ 192 divergence:** azleg.gov did not require special headers in RESEARCH's HTTP HEAD probes, but
keep the descriptive UA anyway (defensive, matches every prior pipeline; costs nothing). Add
`urllib.parse.quote()` handling for the 4 accented surnames (Peña, Gabaldón, Márquez, Luna-Nájera)
per RESEARCH Pitfall 6 — this is new relative to the 191 analog (no accented filenames there).

**Crop-then-resize pipeline (copy verbatim — D-03 locks crop-first)** (lines 148-176):
```python
def crop_to_4_5(img: Image.Image) -> Image.Image:
    """Crop image to 4:5 aspect ratio (eyes at ~1/3 from top, full head+shoulders).
    - Wider than 4:5: center-crop width, keep full height.
    - Taller than 4:5: top-crop (keep head at top, crop bottom).
    NEVER stretch or change aspect ratio by distortion."""
    w, h = img.size
    target_ratio = 4.0 / 5.0  # 0.8
    current_ratio = w / h
    if abs(current_ratio - target_ratio) < 0.001:
        return img
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        cropped = img.crop((left, 0, left + new_w, h))
        return cropped
    else:
        new_h = int(w / target_ratio)
        cropped = img.crop((0, 0, w, new_h))
        return cropped


def resize_600x750(img: Image.Image) -> Image.Image:
    """Resize image to exactly 600x750 using Lanczos resampling."""
    resized = img.resize(TARGET_SIZE, RESAMPLE)
    return resized
```

**Storage upload pattern** (lines 178-192):
```python
def upload_to_storage(politician_uuid: str, jpeg_bytes: bytes) -> str:
    """Upload JPEG to politician_photos/{uuid}-headshot.jpg (x-upsert). Returns CDN URL."""
    filename = f'{politician_uuid}-headshot.jpg'
    url = f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}'
    headers = {
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
    }
    resp = requests.put(url, data=jpeg_bytes, headers=headers, timeout=60)
    if resp.status_code not in (200, 201):
        raise Exception(f'Storage upload failed: {resp.status_code} {resp.text}')
    cdn_url = f'{CDN_BASE}/{filename}'
    return cdn_url
```

**Error/small-image handling + required-vs-optional gating** (lines 195-262 `main()`): keep the
`min_dim = 100` floor (lowered from 150 in 191 precisely because AZ official portraits can be
small-but-legitimate thumbnails), the per-member `is_required` flag (all 90 should be `True` here —
RESEARCH found 90/90 coverage, so no "deferred, non-required" members are expected, unlike
Presmyk in 191), the manifest print block, and the `sys.exit(1)` on any required failure so the
orchestrator can catch a partial run before writing the audit migration.

**ROSTER structure to build** (lines 69-133 shape — one dict per member): fields `external_id`,
`full_name`, `politician_id` (captured post-apply from the structural migration, NOT invented),
`title`, `source_url` (azleg.gov pattern per RESEARCH Code Examples,
`https://www.azleg.gov/alisImages/MemberPhotos/57leg/{Senate|House}/{SURNAME}.jpg`, UTF-8
percent-encoded for the 4 accented names), `photo_license`, `is_required`.

---

### Verification audit (inline `psql` block, recorded in SUMMARY — not a tracked source file)

**Analog 1 (AZ-specific, single-pass audit query style):** `191-03-PLAN.md` Task 1 (lines 57-91)
**Analog 2 (Per-Task Verification Map table + section-split SQL, the exact NV legislature shape):** `160-VALIDATION.md`

**Section-split verification SQL** (160-VALIDATION.md lines 53-64 — copy verbatim, substitute state):
```sql
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o   ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state = 'nv' AND d.district_type IN ('STATE_UPPER','STATE_LOWER')
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
```
**AZ 192 substitution:** `d.state = 'az'` (lowercase — legislature tier, NOT the uppercase 'AZ' used
by 1282's STATE_EXEC section-split query). Expect 0 rows.

**Per-Task Verification Map shape** (160-VALIDATION.md lines 39-49 — build the AZ 192 equivalent
table with these rows):

| Check | Requirement | Expected |
|---|---|---|
| Senate count | AZ-LEG-01 | offices in chamber 'State Senate' @ geo_id='04' = 30 |
| House count | AZ-LEG-01 | offices in chamber 'House of Representatives' @ geo_id='04' = 60 |
| House 2-per-district | AZ-LEG-01 (D-01) | `GROUP BY district_id HAVING count(*) <> 2` on House offices → 0 rows |
| District linkage | AZ-LEG-01 | offices→districts GROUP BY district_type at state='az' → STATE_UPPER 30, STATE_LOWER 60-worth-of-links-on-30-districts |
| Headshots present | AZ-LEG-01 | politician_images for the 90 ext_ids → 90 |
| Headshots serve | AZ-LEG-01 | `curl -sI <CDN url>` spot-check → 200 |
| Stances absent | SC#4 | `inform.politician_answers` for the 90 ext_ids → 0 |
| Casing correct | SC (geo) | DISTINCT state on linked districts → only 'az' |
| Section-split clean | cross-cutting | section-split query above → 0 rows |
| Ledger | structural | versions IN (structural, audit) → only the structural one registered |

**191-specific single-query audit style** (191-03-PLAN.md line 80, the compact multi-assertion
`psql -tAc` shape to adapt for the "automated verify" line of the equivalent AZ 192 task):
```
psql "$DATABASE_URL" -tAc "SELECT (SELECT count(*) FROM essentials.offices o JOIN essentials.chambers ch ON ch.id=o.chamber_id JOIN essentials.governments g ON g.id=ch.government_id JOIN essentials.districts d ON d.id=o.district_id WHERE g.geo_id='04' AND d.district_type='STATE_EXEC')=11 AND ..."
```
Adapt to AZ 192's counts (30 Senate / 60 House / 90 headshots / 0 stances / 0 section-split) inside
one boolean-AND SELECT, matching the pattern's compactness.

## Shared Patterns

### Collegial multi-member district guard (the single most important cross-cutting pattern for this phase)
**Source:** `1282_az_state_exec_gap.sql` (5-seat Corporation Commission) + project playbook
`LOCATION-ONBOARDING.md` (senator/MD-delegate precedent, quoted in 192-RESEARCH.md "Pattern 1")
**Apply to:** every one of the 60 House office INSERTs.
```
[GOTCHA] For bicameral legislatures / multi-member districts: the office uniqueness key is
(district_id, politician_id), NOT (district_id, chamber_id) — N>1 officeholders legitimately
share the same district+chamber pair. Guarding on (district_id, chamber_id) silently blocks
every INSERT after the first.
```

### Structural vs audit-only migration split
**Source:** `1282_az_state_exec_gap.sql` (structural, registered) vs `1284_az_house_headshots.sql`
(audit-only, unregistered)
**Apply to:** the two new migration files this phase produces — structural registers via
`INSERT INTO supabase_migrations.schema_migrations ... ON CONFLICT (version) DO NOTHING` OUTSIDE
the `BEGIN/COMMIT`; headshots migration has NO such registration line and is applied via
`psql -f`, not `apply_migration`.

### Crop-first 600x750 headshot pipeline
**Source:** `_tmp-az-state-exec-headshots.py` `crop_to_4_5` / `resize_600x750` / `upload_to_storage`
**Apply to:** `_tmp-az-legislature-headshots.py` — reuse verbatim per RESEARCH "Don't Hand-Roll";
keep crop-first even though most azleg.gov sources are already 4:5 (Sears is the confirmed exception).

### Appointed-holder-on-elected-office flag combination
**Source:** `1282_az_state_exec_gap.sql` (Les Presmyk: `is_appointed=true` on the politician,
`is_appointed_position=false` on the office)
**Apply to:** Kiana Sears (SD-9), Cody Reim (HD-3), Sylvia Allen (HD-7) — the 3 mid-term successors.

### Migration counter re-verification
**Source:** `191-01-SUMMARY.md` "Next Phase Readiness" (explicit warning: "re-verify both ledger MAX
and on-disk MAX before assigning ... drift is expected to recur") + RESEARCH.md Pitfall 4/Open
Question 2.
**Apply to:** the first inline-orchestrator step of Plan 01 — re-run `ls backend/migrations | sort`
disk-MAX and `count(*) WHERE version='NNNN'` ledger check before finalizing the structural
migration's filename/registration number (provisionally 1286/1287, per RESEARCH — but re-verify).

## No Analog Found

None — every target file has a strong (exact role+flow) analog in the codebase. This phase is a
close-to-1:1 structural/headshot/verification mirror of NV Phase 160, refined by AZ Phase 191's
own precedent for this project's AZ-specific conventions.

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (NV 1053/1054, AZ 1282/1283/1284),
`C:/EV-Accounts/backend/scripts/` (`_tmp-az-state-exec-headshots.py`, `_tmp-nv-legislature-headshots.py`
sibling not read directly — the fresher AZ 191 script was sufficient and shares the identical
crop/resize/upload functions), `.planning/milestones/v18.0-phases/160-nevada-legislature-seed-headshots/`
(160-01-PLAN.md, 160-VALIDATION.md), `.planning/phases/191-arizona-state-federal-government/`
(191-01-SUMMARY.md, 191-03-PLAN.md).
**Files scanned:** 8 read in full/targeted sections (1282.sql, 1284.sql, 1053.sql lines 1-1139,
_tmp-az-state-exec-headshots.py, 160-01-PLAN.md, 160-VALIDATION.md, 191-01-SUMMARY.md, 191-03-PLAN.md).
**Pattern extraction date:** 2026-07-08
