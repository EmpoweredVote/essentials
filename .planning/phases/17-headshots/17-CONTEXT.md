# Phase 17: Headshots - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Find, download, resize, and store official headshot photos for Collin County politicians in Supabase Storage with `politician_images` rows. Tier 1 (Plano, McKinney, Allen, Frisco) requires complete coverage. Tier 2 (Murphy, Celina, Prosper, Richardson) uploads where a public photo exists. Tier 3-4 is a single batch sweep — upload what's found, document what isn't. Profile rendering and compass stances are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Source priority
- Primary source for all tiers: city official bio/council page
- Fallback for Tier 1-2: Ballotpedia → local news/press (in that order)
- Fallback for Tier 3-4: Ballotpedia only — stop after two sources
- LinkedIn is NOT in scope at any tier (not official enough)

### Photo acceptance bar
- Priority order: formal portrait → event/council photo (podium, chamber) → any professional-looking photo
- No other people in the frame; crop to sides of head and shoulders if needed
- No superimposed text, campaign graphics, or banners over the face
- Minimum source resolution: 200px wide — anything smaller will look blurry at 600×750 and should be rejected in favor of the next source
- No age limit — if the city bio page has the photo, use it regardless of apparent age

### Resize and upload spec
- Target: 600×750 (4:5 ratio), Lanczos resampling, q90
- Never change aspect ratio — crop only
- Eyes at approximately 1/3 from top; full head + shoulders visible
- Use `/find-headshots` skill for the find/crop/resize/upload workflow

### Tier 3-4 effort ceiling
- One batch sweep plan covers all 16 Tier 3-4 cities
- Two sources max per politician: city site + Ballotpedia. If neither yields an acceptable photo, document and skip
- Election stubs (rows with no named politician) are skipped entirely — nothing to search for

### Missing photo handling
- No `politician_images` row when no acceptable photo is found — do not insert placeholders or null rows
- Gaps are documented in the plan output section per politician; not in STATE.md or the DB

</decisions>

<specifics>
## Specific Ideas

- The `/find-headshots` skill is already built (`~/.claude/commands/find-headshots.md`) and handles the find/crop/resize/upload workflow well — use it
- Frisco city site is CloudFlare-blocked (confirmed during Phase 14); go straight to Ballotpedia fallback for Frisco politicians

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-headshots*
*Context gathered: 2026-05-01*
