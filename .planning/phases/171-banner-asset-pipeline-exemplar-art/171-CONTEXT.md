# Phase 171: Banner Asset Pipeline & Exemplar Art - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the two exemplar banner sets **real art** and write a **repeatable procedure** so the
~10 remaining covered states (and new cities) can be filled in later without re-deriving the
process. Requirements: **ASST-01, ASST-02**.

**CRITICAL framing — most of ASST-01 is already done by Phase 170's UAT.** During 170's live
sign-off, art sourcing went far beyond 170's scope. Already live in production Supabase Storage
(`politician_photos` bucket) and wired into `buildingImages.js`:
- **California** state panorama (Golden Gate / SF), **Indiana** state panorama (Indianapolis
  skyline), and all **50 state panoramas** (daytime-corrected).
- **US federal** banner (`national/us-capitol-banner.jpg`).
- **LA** city skyline (`la_county/.../0644000-skyline.jpg`) + 10 other LA-county city skylines.
- Graceful `onError` → tier-gradient fallback (criterion 4 already satisfied).

So 171 reduces to: **(1) produce the Bloomington exemplar** (the one genuine art gap),
**(2) reconcile storage consistency + remove dead code**, and **(3) write the ASST-02 procedure
doc + a reusable sourcing/upload script** capturing the workflow already proven in 170.

**NOT this phase:** re-doing the 49 existing state/federal/LA assets (already live); Elections-page
parity (Phase 172); live banner stats / feature-icon links (deferred future milestone); any
`SectionBanner` component/layout change (locked in 170); backend/DB schema; AI image generation
(explicitly dropped — see D-09).
</domain>

<decisions>
## Implementation Decisions

### Bloomington exemplar art (ASST-01)
- **D-01:** **Re-source the Bloomington city banner** and store it in **Supabase Storage** (alongside
  the LA exemplar), replacing the old local `public/images/bloomington-city-hall.jpg`. Apply the same
  dark-overlay panoramic treatment as the other banners, then rewire `buildingImages.js` to the new
  Storage URL. This also makes Bloomington the live test of the ASST-02 procedure.
- **D-02:** **Subject direction (user's words):** a **wide view of Bloomington the CITY taken from an
  IU vantage point** — e.g. looking out from the Sample Gates / a campus rise over the town — where
  the **city/downtown is the subject and the IU campus is only the foreground or framing**, NOT a
  campus-architecture shot. Prioritize a well-licensed wide shot matching that "city seen from the
  gate" framing. **Fallback if no such usable-license shot exists:** a downtown / Monroe County
  Courthouse-square wide view.

### Storage consistency + cleanup (ASST-01)
- **D-03:** **Supabase Storage (`politician_photos` bucket) is the canonical home for ALL banner art.**
  Bloomington moves there (D-01); no banner art stays on `/public/images`.
- **D-04:** **Delete confirmed-dead local assets + code:** the local `public/images/state-capitols/*.jpg`
  set and the `STATE_CAPITOLS` fallback branch in `buildingImages.js` are now unreachable (all 50
  states resolve to `STATE_PANORAMAS` in Storage). Also sweep the unused `FALLBACK_LOCAL` /
  `FALLBACK_STATE` constants + their generic SVGs (`city-hall-generic.svg`,
  `state-capitol-generic.svg`) **if** equally unreachable. Planner: verify unreachability before
  deleting; don't leave dead branches.
- **D-05:** **Define a Storage path convention for standalone cities** (cities not under the
  `states/`, `national/`, or `la_county/building_photos/` schemes — Bloomington is the first). Pick a
  clean, documented prefix (planner discretion, e.g. `cities/<slug>.jpg`) and record it in the
  procedure doc so future non-LA-county cities follow it.

### Procedure doc — ASST-02 (core deliverable)
- **D-06:** Produce **a written procedure AND a committed, reusable script** — not doc-only. The
  script captures the 170 workflow (resize/optimize to banner dimensions via **PIL**, apply
  dark-overlay if needed, upload to Supabase Storage). Future states/cities become near-mechanical.
- **D-07:** **Locations (both in the Essentials repo):** doc at **`docs/banner-asset-pipeline.md`**,
  script under **`scripts/banners/`**. Co-located with the `buildingImages.js` they serve, committed
  to the frontend repo, and outside Tailwind's root/`.planning` scan paths.
- **D-08:** The upload script must read the **Supabase service-role key from an env var** (operator
  points it at the EV-Accounts `.env`), NOT hardcode it. The procedure documents this. **Hazard:** any
  committed doc/script referencing Windows paths (e.g. the EV-Accounts `.env` location) MUST keep them
  in code fences / use forward slashes — raw `C:\...` backslash paths have crashed the Tailwind v4 prod
  build before (see memory `feedback_tailwind_scans_planning_md`).
- **Procedure must cover (end to end):** image sourcing (Wikimedia / Unsplash real licensed photos) →
  dark-overlay treatment → PIL optimization + banner dimensions → upload to Storage (with the path
  conventions incl. D-05 standalone-city) → wiring `buildingImages.js` → **attribution tracking**
  (mirror the existing Wikimedia "title | author | license" comment convention in `buildingImages.js`).

### AI fallback
- **D-09:** **AI image generation is DROPPED entirely.** The pipeline is real licensed photos
  (Wikimedia / Unsplash) → graceful tier-gradient fallback only. No AI tooling, no AI art, AI not
  included in the procedure. Rationale: real photos are strictly better for civic legitimacy; an
  AI-fabricated cityscape of a real place risks inventing landmarks; every covered jurisdiction has a
  real photo today. **NOTE — intentional divergence from ASST-01 requirement text** (which names
  "AI fallback"); flagged here so the verifier does not read its absence as a gap.

### Claude's Discretion
- Exact standalone-city Storage path prefix within D-05 (e.g. `cities/<slug>.jpg`).
- Exact script language/structure under `scripts/banners/` (Python+PIL implied by 170's tooling) and
  its CLI/arg shape.
- Whether the generic-SVG / `FALLBACK_*` cleanup (D-04) is in-scope after unreachability verification.
- Bloomington banner exact dimensions/aspect — should match the existing state-panorama banner
  dimensions for visual consistency (planner: confirm the panorama dims and reuse them).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase specs (this milestone)
- `.planning/REQUIREMENTS.md` — v19.0 requirements; **ASST-01, ASST-02** are this phase. See also
  the deferred "Banner art for all remaining covered states" note.
- `.planning/ROADMAP.md` §"Phase 171" (lines ~84-97) — goal + 4 success criteria.

### Prior phase (what was actually built — read before assuming art is missing)
- `.planning/phases/170-section-banners-continuous-scroll-results/170-04-SUMMARY.md` — documents the
  UAT art expansion: all 50 state panoramas, federal Capitol, LA skyline + 11 LA-county photos,
  daytime corrections, `onError` gradient fallback, the storage migration off the paused secondary
  project. **This is why most of ASST-01 is already done.**
- `.planning/phases/170-section-banners-continuous-scroll-results/170-CONTEXT.md` — locked
  `SectionBanner` treatment + the explicit hand-off "actual banner art + sourcing pipeline → Phase 171".

### Code to extend / modify
- `src/lib/buildingImages.js` — `CURATED_LOCAL` (Bloomington entry → rewire to Storage, D-01),
  `STATE_PANORAMAS` + `STATE_PANORAMA_BASE` (the live panorama set), `FEDERAL_IMAGE`, the dead
  `STATE_CAPITOLS` fallback branch + `FALLBACK_LOCAL`/`FALLBACK_STATE` (D-04 cleanup), and the
  Wikimedia attribution comment convention (mirror it for Bloomington).
- `src/components/SectionBanner.jsx` — consumer of the image URLs (do NOT change its layout; locked
  in 170). Confirms banner dimensions for matching Bloomington art.

### Assets to remove (after verifying unreachable — D-04)
- `public/images/state-capitols/*.jpg` (50 files, superseded by Storage panoramas).
- `public/images/bloomington-city-hall.jpg` (replaced by the Storage Bloomington banner, D-01).
- `public/images/city-hall-generic.svg`, `public/images/state-capitol-generic.svg` (if `FALLBACK_*`
  truly unreferenced).

### External infra (operator-side, keep paths in code fences — D-08)
- `C:/EV-Accounts/backend/.env` — holds the Supabase **service-role key** used to upload to the
  `politician_photos` bucket. The `scripts/banners/` upload script reads this via an env var.
- Production Supabase Storage base:
  `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`.

### Memory / project rules (apply)
- `feedback_tailwind_scans_planning_md` — Tailwind v4 scans `.planning/*.md` + root docs; raw Windows
  backslash paths crash the prod build. Keep `C:\...`-style paths in code fences / forward slashes
  (relevant to D-07/D-08 since the doc lives in `docs/`, not root, but still cautious).
- `project_phase170_complete` — PIL-only tooling (no ImageMagick); prod upload uses service-role key
  in `C:/EV-Accounts/backend/.env`; the paused secondary project `zlbutxtrjcixpdgfzrgv` is orphaned
  (do not depend on it).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`getBuildingImages(city, state)`** (`src/lib/buildingImages.js`) — the location→art bridge;
  already returns Storage URLs for states/federal/LA and `null` otherwise. Bloomington just needs its
  `CURATED_LOCAL` entry pointed at a Storage URL (D-01).
- **`STATE_PANORAMAS` set + `STATE_PANORAMA_BASE`** — the established Storage convention
  (`states/<ABBR>.jpg`) and attribution-comment pattern the procedure should generalize.
- **`SectionBanner.jsx`** — renders the image with `onError` → gradient fallback (built in 170);
  consumes whatever URL `buildingImages.js` provides. No change needed beyond confirming dims.
- **170's proven workflow** — Wikimedia source → PIL optimize (~19MB→2.3MB observed) → upload to
  `politician_photos/...` → wire `buildingImages.js`. The ASST-02 script formalizes exactly this.

### Established Patterns
- Storage path schemes already in use: `states/<ABBR>.jpg`, `national/us-capitol-banner.jpg`,
  `la_county/building_photos/<geoid>.jpg`. D-05 adds a standalone-city scheme.
- Attribution tracked as inline `// AB - Title | Author | License` comments above the panorama set —
  the procedure should keep this convention for every new asset.

### Integration Points
- The Bloomington art flows: Storage upload → `CURATED_LOCAL['bloomington']` URL →
  `getBuildingImages` → `SectionBanner` on the live Results page (criterion 2 verification: browse a
  Bloomington address, confirm the new banner renders, not the gradient fallback).
- Browse link for live verification:
  `essentials.empowered.vote/results?...` for a Bloomington address (and an LA address for the
  already-live LA set).
</code_context>

<specifics>
## Specific Ideas

- Bloomington banner north star (user): "a beautiful shot of a city from the gate of IU, but of
  Bloomington more than the college" — city-as-subject, campus-as-framing.
- Both exemplars (Bloomington + LA) should read as members of the same unified panoramic
  dark-overlay family as the 50 state banners — consistent dimensions and treatment.
- The procedure doc is explicitly meant to let the ~10 remaining covered states get filled in later
  "without re-deriving the process" — write it for an operator repeating the task, not as prose.
</specifics>

<deferred>
## Deferred Ideas

- Banner art for the remaining covered states (OR, ME, MA, MD, VA, UT, TX, NV, others) — actually,
  all 50 states are ALREADY done (170); the procedure doc serves any *future* states/cities and any
  re-sourcing. No outstanding state-art work.
- Live banner stats (population / electoral count) + feature-icon links (treasury-tracker) → future
  milestone (BANR-04 slots are structure-only).
- Elections-page dark treatment + same banner dividers (DARK-03 / BANR-05) → **Phase 172**.
- Landing page + politician profile pages to the dark treatment → future milestone.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 171-banner-asset-pipeline-exemplar-art*
*Context gathered: 2026-06-27*
