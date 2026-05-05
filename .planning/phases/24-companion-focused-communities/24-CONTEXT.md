# Phase 24: Companion Focused Communities - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create `connect.communities` rows for all 10 new LOCAL compass topics from Phase 23. Populate `fc_community_slug` on each `inform.compass_topics` row. Verify each community renders its 5 stance cards at fc.empowered.vote/[slug]. Content creation (descriptions) and DB migration happen in this phase — no new topics, no frontend code changes.

</domain>

<decisions>
## Implementation Decisions

### Community descriptions
- Match the tone and length of the Phase 23 stance descriptions — same neutral, educational voice
- Topic-only framing: describe the subject matter; do not reference the compass scale (1–5)
- No explicit "local government" call-out needed — the compass UI already shows Federal/State/Local categories
- Claude drafts all 10 descriptions inline in the Plan 1 document for user review before any SQL is written

### Slug naming
- 9 of 10 slugs match the topic_key exactly:
  - `residential-zoning`, `growth-and-development`, `public-safety-approach`, `homelessness-response`
  - `economic-development`, `transportation-priorities`, `local-environment`, `rent-regulation`, `city-sanitation`
- Exception: `local-immigration` → slug = **`immigration-policy`** (drops "local-" prefix for cleaner URL)

### Plan structure
- Two plans, mirroring Phase 23:
  - **Plan 24-01:** Author all 10 descriptions inline in the plan document; include a checkpoint for user approval before any SQL
  - **Plan 24-02:** Apply migration (connect.communities INSERT + fc_community_slug UPDATE) via supabase db push; run verification queries + user spot-check
- Migration target: `C:\Focused Communities\supabase\migrations\` (same project as inform.compass_topics)
- fc_community_slug back-fill runs in the **same migration** as the communities INSERT — one SQL transaction, not a separate step

### Verification scope
- **Claude runs (automated):**
  1. RPC: `get_stances_for_community` for each of the 10 communities returns exactly 5 stances with non-null descriptions
  2. Orphan check: JOIN `connect.communities` → `inform.compass_topics` confirms all 10 `topic_id` values resolve (no orphaned communities)
  3. fc_community_slug check: query `inform.compass_topics` confirms `fc_community_slug` IS NOT NULL for all 10 Phase 23 topics
- **User runs (manual):** Spot-checks 2–3 communities at fc.empowered.vote/[slug] to confirm stance cards render without error

### Claude's Discretion
- Order of the 10 communities in the migration SQL
- Which 2–3 communities to suggest for user spot-check (varied topic types preferred)
- Exact migration timestamp / filename

</decisions>

<specifics>
## Specific Ideas

- Descriptions should feel like the Phase 23 stance text — read the authored stances in the Phase 23 migration SQL to calibrate voice before writing
- The `immigration-policy` slug change is intentional — do not use `local-immigration` as the URL

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 24-companion-focused-communities*
*Context gathered: 2026-05-04*
