# Phase 104: VA Headshots - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Download, process, and upload headshots for all 156 seeded VA officials (3 state execs + 40 senators + 100 delegates + 2 US senators + 11 House reps), then write one AUDIT-ONLY migration (315) recording all `politician_images` INSERTs. Scope is strictly headshot coverage — no politician row changes, no new office or district rows.

</domain>

<decisions>
## Implementation Decisions

### Script Structure
- **D-01:** **4 separate Python scripts**, one per group: `_tmp-va-execs-headshots.py`, `_tmp-va-senators-headshots.py`, `_tmp-va-delegates-headshots.py`, `_tmp-va-federal-headshots.py`. Matches the per-group separation used across Alexandria (council vs ACPS board scripts) and the principle that each group has a distinct source domain and URL pattern.
- **D-02:** Scripts are structured identically to `_tmp-alexandria-headshots.py` (PIL LANCZOS q90, Supabase Storage upload, crop-then-resize pipeline, browser User-Agent headers).

### Delegate Headshot Source
- **D-03:** Primary source: `https://vga.virginia.gov/delegate_photos/{H0000}.jpg` — bulk-fetchable pattern where `{H0000}` is the delegate number zero-padded to 4 digits (e.g., HD-1 → `H0001`, HD-50 → `H0050`, HD-100 → `H0100`). Researcher MUST verify this pattern at phase time before writing script.
- **D-04:** HD-20 is VACANT (`is_vacant=true`, `is_active=false` per migration 308) — skip, do not insert a `politician_images` row.

### Senate Headshot Source + Discovery
- **D-05:** Base URL: `https://apps.senate.virginia.gov/Senator/images/member_photos/{LastName}{district}` — no file extension. Discovery method: construct the `{LastName}{district}` filename for each senator, then try common extensions (`.jpg`, `.png`, `.webp`) via HTTP HEAD requests; take the first 200 OK. Automatable in the download script.
- **D-06:** Fallback for senators where the apps.senate.virginia.gov URL pattern fails (new senator, anomaly): Wikipedia Commons first, then the senator's official senate.virginia.gov profile page. Flag any fallback cases in migration comments.

### Federal Headshot Sources
- **D-07:** Primary source for all 13 federal officials (Warner, Kaine, 11 House reps): **Congress.gov official portraits** — `https://www.congress.gov/img/member/{bioguide_id}.jpg`. Researcher must look up each member's bioguide ID before writing the script. This matches the CA and MD federal headshot patterns.
- **D-08:** Federal headshots are a dedicated script (`_tmp-va-federal-headshots.py`), separate from state scripts. Congress.gov bioguide URLs are a different source domain than VA state government sites.

### Migration Structure
- **D-09:** **One migration file: `315_va_headshots.sql`** (AUDIT-ONLY). Matches the pattern of all prior headshot migrations (271, 255, 258, 314). Scripts do the live writes; the migration records them. Do NOT apply via Supabase MCP ledger.
- **D-10:** Migration header MUST include per-official source URLs, original image dimensions, crop dimensions, and resize dimensions — matching the documentation style of `314_alexandria_headshots.sql`.

### Shared Pipeline Rules (carried from prior phases)
- **D-11:** `politician_images.type = 'default'` (never 'headshot') — UI filters with `.find(img => img.type === 'default')`.
- **D-12:** Crop to 4:5 ratio FIRST, THEN resize to 600×750 Lanczos q90 — never stretch directly.
- **D-13:** Storage bucket: `politician_photos` (NOT 'politician-headshots'). Path: `{politician_id}-headshot.jpg`.
- **D-14:** Column name is `url` (NOT `storage_url`).
- **D-15:** `WHERE NOT EXISTS` guard on every `politician_images` INSERT (idempotent).
- **D-16:** `photo_license = 'public_domain'` for all government-sourced official photos.
- **D-17:** Skip any official where `is_vacant=true` — do not insert a placeholder image.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 104 — Goal, URL patterns (delegate + senate), success criteria (156-official count breakdown)
- `.planning/REQUIREMENTS.md` §VA-GOV-06 — headshot coverage requirement

### Pattern Reference Scripts
- `C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py` — **closest script analog** (PIL pipeline, Supabase Storage upload, browser headers, crop-then-resize, WHERE NOT EXISTS guard logic). Copy structure for all 4 VA scripts.

### Pattern Reference Migrations
- `C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql` — **closest migration analog** (AUDIT-ONLY pattern, per-official source comments, WHERE NOT EXISTS guard, `type='default'`, `url` column)
- `C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql` — secondary AUDIT-ONLY reference (exec officials pattern)

### VA Officials Seeded By
- `C:/EV-Accounts/backend/migrations/306_va_state_executives.sql` — 3 execs (Spanberger, Hashmi, Jones); external_id scheme
- `C:/EV-Accounts/backend/migrations/307_va_state_senators.sql` — 40 senators; external_ids -5110001..-5110040; geo_id = '51' + district.PadLeft(3,'0')
- `C:/EV-Accounts/backend/migrations/308_va_delegates.sql` — 100 delegates; external_ids -5120001..-5120100; HD-20 VACANT
- `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql` — Warner (-400080) + Kaine (-400079) + 11 House reps (-5102001..-5102011)

### Prior VA Context
- `.planning/phases/103-alexandria-deep-seed/103-CONTEXT.md` — D-11 through D-18 (VA conventions, type='default', bucket name, url column, crop-first rule)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py` — Full template for crop/resize/upload pipeline. Copy the `process_and_upload()` function, Supabase Storage client setup, PIL LANCZOS crop logic, and `.env` loading pattern for all 4 VA scripts.

### Established Patterns
- **AUDIT-ONLY migration:** Headshot migrations are never applied via Supabase MCP — they record what the scripts did. See comment block in `314_alexandria_headshots.sql` for the exact AUDIT-ONLY header wording.
- **`type='default'`:** The UI queries `politician_images` with `.find(img => img.type === 'default')`. Using any other type value means the headshot will never appear.
- **HD-20 vacant:** Migration 308 seeded HD-20 (`external_id=-5120020`) as `is_vacant=true, is_active=false`. Scripts must skip this external_id entirely (no download, no upload, no INSERT).
- **Section-split check:** After headshot INSERTs, run the section-split detection query (from `feedback_section_split_check.md` memory) to confirm zero rows — headshot migrations don't affect government_bodies but the check is a good post-migration hygiene step.

### Integration Points
- `essentials.politician_images` — target table; `(politician_id)` uniqueness is enforced by WHERE NOT EXISTS guard, not a DB constraint
- `essentials.politicians` — looked up by `external_id` to resolve `politician_id` UUIDs in INSERT SELECT subqueries

</code_context>

<specifics>
## Specific Ideas

- Researcher MUST verify the `{H0000}` delegate URL pattern at phase time before writing the script — specifically whether the padding is 4 digits (H0001) or another format.
- Senate `{LastName}{district}` — researcher should check 2-3 known senators manually (e.g., French SD-1 → `French1` or `French01`?) to nail the exact format before scripting all 40.
- Congress.gov bioguide IDs needed for all 13 federal officials — researcher should compile this lookup table as part of research output.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 104-VA Headshots*
*Context gathered: 2026-06-08*
