---
phase: 184
phase_name: "school-boards-wave-2-tigard-tualatin-sd-23j-forest-grove-sd-"
project: "Empowered Essentials"
generated: "2026-07-04"
counts:
  decisions: 6
  lessons: 5
  patterns: 6
  surprises: 4
missing_artifacts:
  - "184-VERIFICATION.md"
  - "184-UAT.md"
---

# Phase 184 Learnings: School Boards Wave 2 (Tigard-Tualatin / Forest Grove / Sherwood)

## Decisions

### Renumber migrations 1206/1207 → 1208/1209 (on-disk MAX authoritative)
At Wave-0, a concurrent Missouri 2026-House workstream had already committed `1206_seed_mo_2026_house_elections_races.sql` and `1207_seed_mo_2026_house_candidates.sql`. The structural migration shipped as 1208 and the headshot migration as 1209, per the on-disk-`ls`-MAX rule (the DB ledger MAX was 1203 — a trap).

**Rationale:** Filename collisions are decided by on-disk files, not the ledger; using the planned numbers would have overwritten another team's committed work. Deterministic rule, no user decision needed.
**Source:** 184-01-SUMMARY.md, 184-02-SUMMARY.md

### Linda Harrington (FGSD Position 4) ships as a documented gap, not a placeholder
Her seat is seeded (office row exists) but no `politician_images` row was inserted. The district's own image is a "Coming Soon" placeholder; the one local-news photo was a two-person scene shot.

**Rationale:** D-R5 — document genuine gaps, never fabricate or ship a placeholder/ambiguous crop. Renders as a clean initials avatar live.
**Source:** 184-03-SUMMARY.md

### 183-REVIEW fixes (WR-01/02/03, IN-01/03) baked in from first authoring, not cloned-then-patched
The 1208/1209 migrations and the ETL were authored with the fixed shapes directly (pol-union CTE, chamber_id-NOT-NULL gate, FROM-politicians-p headshot INSERT, quote-stripping .env parser, both-bound ext-id probe margins).

**Rationale:** D-F1 required the Wave-1 latent defects fixed at authoring time so the clones are self-healing/idempotent from day one.
**Source:** 184-02-PLAN.md, 184-03-PLAN.md

### All counts 5-seat / 15-total (not 7 like Wave 1)
`official_count=5`, 15 office CTEs (5/5/5), 5-wide ext-id blocks, post-verify expects 5 per board.

**Rationale:** Live-verification overturned the CONTEXT "commonly 7-director" assumption — all three boards are 5-member.
**Source:** 184-01-SUMMARY.md, 184-02-PLAN.md

### Ledger registration is version-only, placed before COMMIT
Followed the actual 1203 file convention (version-only INSERT inside the transaction, matching 1159/1178/1196) rather than the plan text's older (version, name)-after-COMMIT description.

**Rationale:** Match the freshest west-metro precedent observed in the analog file, not the stale plan-text guidance.
**Source:** 184-02-SUMMARY.md (deviation note)

### Sherwood office titles use the district's verbatim literal Chair/VC strings
`Board Chair/Director, Position 1` (Carson) and `Board Vice Chair/Director, Position 3` (Hawkins) — not a generic "(Chair)"/"(Vice Chair)" suffix.

**Rationale:** D-R2 — Sherwood's own page uses these exact strings (HIGH confidence); TTSD/FGSD use the suffix form.
**Source:** 184-01-SUMMARY.md, 184-02-PLAN.md

---

## Lessons

### Migration-number collisions are real and recurring — re-probe immediately before authoring each file
Two consecutive waves were hit: 183 (planned 1204 → shipped 1205, AZ workstream) and 184 (planned 1206/1207 → shipped 1208/1209, MO workstream, both numbers taken).

**Context:** Multiple workstreams commit to the shared EV-Accounts repo concurrently. The on-disk MAX must be re-checked right before authoring each migration, not just once at phase start.
**Source:** 184-01-SUMMARY.md

### School-board director cards render as `.ev-politician-card` divs, not `<a>` links
Live-verify selectors targeting `a > h3` found zero cards on the FGSD/SSD pages even though the boards rendered correctly; the correct selector is `.ev-politician-card`.

**Context:** Discovered during Playwright verification — the browsed-district "highlight" group and the in-locality subgroup render with different DOM wrappers. Verification tooling must target the stable class, not the link wrapper.
**Source:** 184-04-SUMMARY.md

### District board pages render rosters client-side — raw curl won't show Chair/VC
The TTSD and FGSD board pages return HTTP 200 but the roster/title data is injected by client-side JS; a plain `curl | grep` for "Chair" returns nothing. The A3 same-day Chair/Vice-Chair re-verify required a rendered fetch (WebFetch).

**Context:** Wave-0 roster re-verification for JS-rendered district sites needs a rendering fetch, not raw HTML.
**Source:** 184-01-SUMMARY.md

### Bare `python`/`python3` is a non-functional Windows Store stub — use the `py` launcher
The WP-REST parse failed under bare `python`; re-running under `py` succeeded. The ETL must be invoked via `py`.

**Context:** Standing environment fact, re-confirmed this phase during Wave-0 and ETL execution.
**Source:** 184-01-SUMMARY.md, 184-03-SUMMARY.md

### The browsed school-district accordion default-collapses on SPA in-tab navigation
TTSD auto-expanded on fresh page load; FGSD/SSD required a click to expand when reached by in-tab navigation from another browse URL.

**Context:** Auto-expand appears to fire only on fresh mount, not on subsequent client-side route changes. Pre-existing behavior, not introduced by this phase; candidate for a future polish pass.
**Source:** 184-04-SUMMARY.md

---

## Patterns

### WordPress "Fly Dynamic Image Resizer" original-recovery via WP REST API
For self-hosted WordPress sites whose on-page images are `/app/uploads/fly-images/{id}/...` transform outputs, fetch `GET /wp-json/wp/v2/media/{id}` and read `media_details.sizes.large.source_url` (fall back to `source_url`). Never download the on-page fly-images URL directly.

**When to use:** Any future district/city headshot sourcing from a WordPress + fly-images site (URL signature `/app/uploads/fly-images/{id}/`). Helper: `resolve_wp_media_large_url()`.
**Source:** 184-03-PLAN.md, 184-03-SUMMARY.md

### WR-01 politician-id resolution via `pol` union CTE
`pol AS (SELECT id FROM ins_p UNION SELECT id FROM politicians WHERE external_id = -N)`, then `CROSS JOIN pol` on the office INSERT — makes the office `NOT EXISTS` guard genuinely live on a re-run (a raw `CROSS JOIN ins_p` yields 0 rows when the politician already exists).

**When to use:** Every politician+office CTE in a structural deep-seed migration.
**Source:** 184-02-PLAN.md

### WR-03 headshot INSERT via `FROM politicians p WHERE external_id`
`INSERT ... SELECT gen_random_uuid(), p.id, ... FROM politicians p WHERE p.external_id = -N AND NOT EXISTS (...)` — a missing politician skips the block entirely instead of degrading to a NULL politician_id.

**When to use:** Every `politician_images` INSERT in an audit-only headshot migration.
**Source:** 184-03-PLAN.md

### uuid-embed post-verify gate (identity set = the same uuid literals as the INSERTs)
The gate's VALUES list is the exact set of UUIDs the INSERTs target, so a clone that edits the INSERT uuids but forgets the gate fails loudly instead of passing vacuously against a prior seed's rows.

**When to use:** Audit-only headshot migrations that hardcode Storage UUIDs.
**Source:** 184-03-PLAN.md

### Deploy verification by bundle CONTENT, never by hash
Poll the live site for a new bundle hash AND grep the served JS for the new labels. Render's build hash differs from the local hash (known false-negative), so hash comparison is unreliable.

**When to use:** Confirming any frontend deploy landed on Render.
**Source:** 184-04-SUMMARY.md

### fetch/rebase-before-push discipline for concurrent multi-clone work
Before every push to either shared repo, `git fetch` + rebase onto the remote and stage only your own files (never `git add -A`), so a parallel session's committed and untracked files are never swept up or clobbered.

**When to use:** Any phase where another agent/session is committing to the same repo(s) concurrently.
**Source:** 184-04-SUMMARY.md

---

## Surprises

### Both planned migration numbers were claimed mid-execution, not just one
The MO workstream took 1206 AND 1207, forcing a double renumber to 1208/1209.

**Impact:** Reinforced that the on-disk re-probe must happen per-file and that plan-doc migration numbers are advisory; recorded the real numbers in every summary and in memory (next free = 1210).
**Source:** 184-01-SUMMARY.md

### All three boards are 5-seat, overturning the CONTEXT "commonly 7-director" assumption
Wave 1's two boards were 7-seat; Wave 2's three are all 5-seat (live-verified).

**Impact:** Every count literal changed from 7/21 to 5/15; copying the Wave-1 gate literal verbatim would have raised a false post-verify exception.
**Source:** 184-01-SUMMARY.md

### The only available Linda Harrington news photo was a two-person scene shot
The Forest Grove News-Times appointment article's sole image (648×486) shows two people in a ceremony, faces small and ambiguous — not a usable single-face portrait.

**Impact:** Confirmed the honest-gap decision (no fabrication); she renders as a clean "LH" initials avatar rather than a broken/placeholder image.
**Source:** 184-03-SUMMARY.md

### Board director cards mount lazily / differ in DOM wrapper by section
Verification initially reported zero FGSD cards because the section was collapsed and the cards use `.ev-politician-card` (not link) wrappers — the data was correct all along.

**Impact:** Wasted a few verification cycles chasing a non-bug; the fix was selector/expand-state handling, and the boards were correct. Informs future live-verify tooling.
**Source:** 184-04-SUMMARY.md
