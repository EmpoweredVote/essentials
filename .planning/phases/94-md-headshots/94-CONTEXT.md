# Phase 94: MD Headshots - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify 100% headshot coverage across all non-vacant MD officials seeded in Phases 92–93 and gap-fill the one known gap: 10 federal officials (Van Hollen, Alsobrooks, 8 MD House reps) have no headshot script yet.

Current status going into this phase:
- Exec (5/5): Done — tmp_md_exec_headshots has 5 files, all uploaded
- Senators (47/47): Done — tmp_md_senators_headshots has 47 files, all uploaded
- Delegates (140/140 non-vacant): Done — 42A is vacant (is_vacant=true), excluded
- Federal (0/10): Missing — no script, no tmp dir

This phase delivers: `md_federal_officials_headshots.py` + all 10 federal headshots in Storage + a gap-check DB query confirming 100% coverage + UI spot-check of 5+ profile pages.

</domain>

<decisions>
## Implementation Decisions

### Federal Headshot Sources

- **D-01:** Primary source is `congress.gov` official directory photos — public domain, consistent URL pattern, matches CA/OR/ME federal headshot precedent. Script uses same URL structure as existing federal headshot scripts.
- **D-02:** Fallback: Wikimedia Commons — consistent with exec headshot pattern (used for MD Governor/AG in Phase 92). Script logs the official name and politician_id if congress.gov fails; falls back to Wikimedia. Does NOT halt.

### Verification Approach

- **D-03:** Verification sweep = DB gap-check query + UI spot-check only. Query `politician_images` for all non-vacant MD officials and report any missing rows by name. Then manually verify 5+ politician profile pages in the running app. No automated HTTP HEAD ping of storage URLs (matches CA/OR/ME precedent; we've had no phantom-row failures in prior phases).
- **D-04:** Vacant placeholder (District 42A, is_vacant=true) is excluded from the gap-check. The query should filter out vacant politicians.

### Plan Structure

- **D-05:** Two plans:
  - **Plan 94-01:** Write and run `md_federal_officials_headshots.py` — source + process + upload 10 federal official headshots (2 US senators + 8 US House reps)
  - **Plan 94-02:** Verification sweep — run DB gap-check query across all 201 non-vacant MD officials (5 exec + 47 senators + 140 delegates + 10 federal - 1 vacant 42A), fix any gaps found, then UI spot-check 5+ profile pages
  
  This mirrors the Phase 93 pattern of seeding plans followed by verification plans.

### Claude's Discretion

- Script structure for `md_federal_officials_headshots.py`: follow `md_executives_headshots.py` as the closest template (same source mix of congress.gov + Wikimedia fallback). External IDs for federal officials: US senators are `-2430001` and `-2430002`; US House reps are `-2440001..-2440008` (per Phase 93 context).
- The gap-check query: `SELECT p.id, p.full_name FROM essentials.politicians p LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id WHERE p.representing_state = 'MD' AND p.is_vacant IS NOT TRUE AND pi.id IS NULL ORDER BY p.full_name` — reports missing rows by name.
- Photo license for congress.gov photos: `'public_domain'` (same as mgaleg and exec sources).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-GOV-06 (headshot coverage requirement); Phase 94 success criteria
- `.planning/ROADMAP.md` §Phase 94 — 3 success criteria: (1) all politician_images rows with type='default' and resolvable URL, (2) 600×750 JPEG q90, (3) spot-check 5+ profile pages

### Existing MD Headshot Scripts (templates for federal script)
- `scripts/md_executives_headshots.py` — CLOSEST template for federal script; uses congress.gov + Wikimedia mix; shows idempotent insert pattern, crop-first-then-resize, politician_photos bucket path
- `scripts/md_senators_headshots.py` — mgaleg source; shows external_id range query, processing loop structure
- `scripts/md_delegates_headshots.py` — mgaleg source; same structure as senators script

### Prior Federal Seeding Patterns
- `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` — The migration that seeded MD federal officials; contains the 10 politician_ids needed by the headshot script
- `C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql` — ME federal officials migration; shows representing_state='MD' pattern (use 'MD' not 'me')

### DB Schema
- `essentials.politician_images` — type='default' (not 'headshot'), photo_license, politician_id FK; INSERT with WHERE NOT EXISTS guard (idempotent)
- `essentials.politicians` — is_vacant column; external_id range for federals: -2430001..-2430002 (US senators), -2440001..-2440008 (US House reps)
- Supabase Storage bucket: `politician_photos` (NOT 'politician-headshots'); path: `{politician_id}-headshot.jpg`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/md_executives_headshots.py` — Full template: Supabase REST upload, Pillow processing (crop 4:5 → resize 600×750 Lanczos q90), psycopg2 DB insert, idempotent NOT EXISTS check, congress.gov + Wikimedia URL patterns
- `scripts/md_senators_headshots.py` — Shows external_id range query to get politician_ids from DB without hardcoding UUIDs

### Established Patterns
- Headshot processing: crop to 4:5 FIRST (center crop if wider, top crop if taller — never stretch), THEN resize to 600×750 Lanczos, JPEG quality=90
- politician_images.type MUST be 'default' (UI filters with `.find(img => img.type === 'default')`)
- Bucket: `politician_photos`; path: `{politician_id}-headshot.jpg`
- Script halts on missing env var (SUPABASE_SERVICE_ROLE_KEY), skips on upload/download failure (logs name, continues)
- Idempotent: `SELECT id FROM essentials.politician_images WHERE politician_id = %s AND type = 'default'` before insert

### Integration Points
- Phase 96 (MD Elections): headshots are display-only; no FK dependency but coverage improves candidate card quality
- UI: `PoliticianProfile` and candidate cards consume `politician_images` rows — profile pages are the spot-check target

</code_context>

<specifics>
## Specific Ideas

- The 10 federal officials seeded in migration 275 have external_ids: Van Hollen (-2430001), Alsobrooks (-2430002), 8 House reps (-2440001..-2440008). The headshot script should query by external_id range to get UUIDs dynamically rather than hardcoding.
- The gap-check query in Plan 94-02 must exclude the District 42A vacant placeholder (is_vacant=true) — otherwise it will show up as missing and be misleading.
- congress.gov URL pattern for member photos: `https://www.congress.gov/img/member/{bioguide_id}.jpg` — bioguide IDs for MD reps are available at congress.gov and in the mgaleg roster.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 94-MD Headshots*
*Context gathered: 2026-06-05*
