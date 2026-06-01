# Phase 75: OR State Legislature - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 75 seeds all 30 OR State Senators and 60 OR House Representatives into `essentials.politicians` + `essentials.offices`, links each office to the correct STATE_UPPER (senators) or STATE_LOWER (house) district, and uploads headshots at 600×750 to Supabase Storage. No frontend changes. No elections/races. No compass stances.

</domain>

<decisions>
## Implementation Decisions

### Carried Forward from Phase 73 Context (D-13–D-16)

- **D-01:** 30 OR State Senators → offices linked to STATE_UPPER districts SD-01 through SD-30. `districts.state='or'` (lowercase, TIGER-loader casing).
- **D-02:** 60 OR House Reps → offices linked to STATE_LOWER districts HD-01 through HD-60. `districts.state='or'` (lowercase).
- **D-03:** Primary headshot source: **oregonlegislature.gov**. Researcher must confirm direct URL pattern.
- **D-04:** Migration 225 was audit-only (headshots, Phase 74). Next applied migration number: **226**.

### Headshot Quality + Fallback

- **D-05:** If oregonlegislature.gov provides only low-resolution thumbnails, **upscale using Lanczos to 600×750** — same decision as ME house reps. Executor proceeds without asking again.
- **D-06:** Crop to 4:5 ratio first, THEN resize to 600×750 (Lanczos, q90) — never stretch directly. Established memory rule.
- **D-07:** If a legislator has **no photo at all** on oregonlegislature.gov, document as a known gap in the plan SUMMARY and skip (no placeholder inserted). Same pattern as Collin County and Cambridge.

### Roster Completeness

- **D-08:** Trust **oregonlegislature.gov** as the authoritative roster. Seed every legislator currently listed. If a seat is vacant, it won't appear on the site — treat the resulting count as correct without a separate vacancy check.
- **D-09:** If the site shows fewer than 30 senators or 60 reps, treat it as a blocker and report before writing migrations.

### External ID Scheme for Legislators

- **D-10:** OR state legislators use a dedicated range separate from executives and federal officials:
  - OR State Senators: **`-4110001` through `-4110030`** (senator 1–30, keyed to SD-01–SD-30 ordering)
  - OR House Reps: **`-4120001` through `-4120060`** (rep 1–60, keyed to HD-01–HD-60 ordering)
- **D-11:** Reference for OR executive + federal ranges (Phase 74): executives `-4100001` to `-4100005`; US Senators `-4101001` to `-4101002`; US House reps `-4102001` to `-4102006`. State legislator ranges must not overlap these.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Summaries (confirmed reference values)
- `.planning/phases/72-portland-or/72-02-SUMMARY.md` — confirmed district counts: 30 STATE_UPPER, 60 STATE_LOWER; districts.state='or' lowercase; Portland geo_id='4159000'
- `.planning/phases/73-or-government-db/73-01-SUMMARY.md` — OR chambers confirmed: Oregon Senate + Oregon House of Representatives exist under State of Oregon government row; migration 222 applied
- `.planning/phases/74-or-executives-federal/74-03-SUMMARY.md` — confirms external_id ranges used for Phase 74; migration 225 is audit-only; next applied migration = 226

### Analog Phase Summaries (established patterns)
- `.planning/phases/52-me-state-legislature/` — ME state legislature seeding pattern (senators + house reps in separate migrations, external_id scheme, headshot upscaling approval)
- `.planning/phases/61-ca-state-legislature/` — CA legislature seeding pattern (senate -6001xxx / assembly -6002xxx external_id scheme)

### Key Decisions Table (PROJECT.md)
- `.planning/PROJECT.md` → Key Decisions table — v7.0 (Phase 74) entries: STATE_EXEC districts.state must be uppercase 'OR'; STATE_EXEC district_id must be empty string. **These apply to STATE_EXEC only — not to STATE_UPPER/LOWER districts, which use 'or' lowercase as loaded by TIGER.**

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- **WHERE NOT EXISTS guard on politicians by external_id** — no unique constraint enforced at DB level; guard prevents duplicate inserts on re-run
- **GENERATED ALWAYS slug on politicians/chambers** — never include in INSERT column list
- **government_id via subquery**: `(SELECT id FROM essentials.governments WHERE name='State of Oregon')`
- **chamber_id via subquery**: `(SELECT id FROM essentials.government_bodies WHERE government_id=... AND name='Oregon Senate')` and `...AND name='Oregon House of Representatives'`
- **district_id via subquery**: `(SELECT id FROM essentials.districts WHERE geo_id='SD-01' AND state='or')` — lowercase state casing matches TIGER-loaded rows
- **Section-split check**: run after 75-01 and 75-02; zero rows = clean

### Integration Points
- `essentials.districts` → 30 STATE_UPPER rows (geo_id SD-01–SD-30, state='or') + 60 STATE_LOWER rows (geo_id HD-01–HD-60, state='or') loaded by Phase 72
- `essentials.government_bodies` → Oregon Senate + Oregon House chambers exist from Phase 73
- `essentials.governments` → State of Oregon row (geo_id='41') exists
- `essentials.politician_images` → headshots inserted here after Supabase Storage upload; photo_license='public_domain' (government official photos)

</code_context>

<specifics>
## Specific Ideas

- Oregon Legislature website: **oregonlegislature.gov** — researcher must confirm the headshot URL pattern (direct path vs. member profile page scraping)
- ME house headshot upscaling was approved in Phase 52 as standard for government headshots — same approval applies here (no need to re-ask)
- Headshots plan (75-03) covers all 90 legislators in one plan — no need to split senators/house separately
- Test coordinates for post-seeding verification: Portland City Hall lat=45.5231, lon=-122.6794

</specifics>

<deferred>
## Deferred Ideas

- Oregon elections (2026 races for state legislators) — will follow city/state seeding, analogous to Phase 69 for CA
- Compass stances for OR state legislators — will follow all seeding phases, analogous to Phase 70 for CA
- Portland city deep seed (Phases 76–77) — follows separately after state legislature is complete

</deferred>

---

*Phase: 75-or-state-legislature*
*Context gathered: 2026-05-29*
