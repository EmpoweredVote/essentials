# Phase 168: NV 2026 Candidate Population — Statewide & US House - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Populate `essentials.race_candidates` rows for the **10 high-visibility NV 2026 general-election
races** seeded in Phase 167 — the **6 statewide constitutional executives** (Governor, Lt. Governor,
Attorney General, Secretary of State, Treasurer, Controller) and the **4 US House districts**
(NV-01…NV-04) — with the curated, verified Nov-3, 2026 general-election field (the decided June 9
primary winners + certified independents/minor-party candidates), plus headshots for new challengers,
so a NV address on `/elections` shows real candidates instead of "No candidates have filed."

**In scope:**
- `essentials.race_candidates` rows for the 10 statewide+US-House races, bound to the Phase 167
  `race_id`s, sourced from the verified Nov-3 general field, evidence-cited.
- Linking candidates who already have an NV politician record (`politician_id`).
- Headshots (`race_candidates.photo_url` and/or via the linked politician) for new challengers.

**Out of scope (belongs elsewhere):**
- The **53 legislative races** (11 State Senate + 42 State Assembly) — deferred to a separate
  follow-up phase (explicit per ROADMAP scope note).
- Compass stances for candidates — downstream, not this phase.
- Re-seeding elections/races (done in Phase 167).
- Importing the 32 `candidate_staging` discovery leads wholesale — reference only (see D-06).

</domain>

<decisions>
## Implementation Decisions

### Candidate field breadth
- **D-01:** Seed **all certified Nov-3 general candidates** per race — major-party nominees **plus**
  certified independents / minor-party / nonpartisan candidates (not just D+R). Matches the `1072`
  analog (e.g. MD Gov seeded Moore + Cox + independent Andy Ellis) and the nonpartisan ethos of
  showing the full real ballot.

### Politician linking
- **D-02:** Set `race_candidates.politician_id` for **any candidate who matches an existing NV
  politician record** (seeded Phases 159–160), not only the sitting incumbent of the contested seat
  — this includes cross-office records (e.g. Zach Conine, currently Treasurer, running for AG).
  Challengers with no existing record stay `politician_id = NULL`. Linking makes the linked
  candidate's headshot/profile render immediately (the card reads `COALESCE(rc.photo_url, pi.url)`;
  see `candidatePhoto.js` fallback).

### Challenger headshots
- **D-03:** **Fetch headshots now** (this phase) for new challengers (those with no politician
  record) via the `find-headshots` flow. Where no usable photo exists from an official/Ballotpedia
  source, record an **honest-skip** (placeholder/initials) rather than forcing a low-quality image —
  matching the CA/TX/NY "{N} imaged, {M} gate-pinned honest-skips" pattern. Headshots MUST follow the
  project rules: 600×750 (4:5, Lanczos, q90), crop-not-stretch, eyes ~⅓ from top, no superimposed
  text/graphics over the face. *(User chose fetch-now over the defer recommendation — headshot work
  is in-scope.)*

### Uncertain-field handling
- **D-04:** Seed **only confirmed/certified Nov-3 general candidates** (evidence-only). Explicitly
  **hold back** late-filing / not-yet-certified independents or minor-party candidates and note them
  in the migration comments, accepting the field fills in later (matches `1072`'s "held back" block).
  The June 9 primary is concluded, so the major-party nominees are known; the residual uncertainty is
  late independents / certification timing.

### Carried forward (locked — do not re-derive)
- **D-05 (scope):** Exactly the **10 races** — 6 statewide execs + 4 US House. Legislative races
  (Senate + Assembly) are OUT of scope, deferred to a follow-up.
- **D-06 (mechanics, from `1072` + Phase 167 D-08):** Migration in `C:/EV-Accounts/backend/migrations/`,
  **next counter = 1114**; paired `_apply-migration-1114.ts` smoke harness; idempotent via
  `WHERE NOT EXISTS (race_id, full_name)`; `candidate_status='active'`; **party never stored**
  (antipartisan); `source` = the citation URL (official NV / Ballotpedia / state press) per candidate;
  no `schema_migrations` ledger row (on-disk counter authoritative). The 32 `candidate_staging` rows
  from discovery run `1e5a2041` are **reference leads only** (primary-heavy, 0 matched a `race_id`,
  ~3 dupes, Governor missing) — verify candidates against official sources, do NOT bulk-import.

### Claude's Discretion
- Whether the 10 races land in one migration or split (e.g. statewide vs US House) — planner's call,
  idempotent either way. The `find-headshots` work likely warrants its own plan/wave after the
  candidate-seeding migration.
- `first_name`/`last_name` split convention and `external_id`/`source` string formatting (follow the
  `1072` shapes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement & roadmap
- `.planning/ROADMAP.md` §"Phase 168: NV 2026 Candidate Population — Statewide & US House" — goal + 4 success criteria + scope note.
- `.planning/REQUIREMENTS.md` → **NV-CAND-01** — the binding requirement.
- `.planning/phases/167-nv-2026-elections-discovery/167-CONTEXT.md` — upstream decisions (D-08 mechanics, antipartisan NULL party, mixed-case `nv`/`NV`, race anchoring).

### CURRENT canonical prior-art (mirror THIS — read FIRST)
- `C:/EV-Accounts/backend/migrations/1072_seed_2026_statewide_general_candidates.sql` — **the analog**: Nov-3 2026 general candidates for empty statewide races (MD/ME/OR/VA). Authoritative for the `race_candidates` VALUES shape `(race_id, politician_id, full_name, first_name, last_name, is_incumbent, source)`, `candidate_status='active'`, incumbents-linked / challengers-NULL, party-not-stored, confirmed-only + held-back block, idempotent `NOT EXISTS (race_id, full_name)`. **Read this FIRST.**
- `C:/EV-Accounts/backend/migrations/1091_seed_ca_2026_house_candidates.sql` + `1110_seed_tx_2026_house_candidates.sql` + `1111_seed_ny_2026_house_candidates.sql` — **US House** candidate-seeding analogs (per-district race_candidates).
- `C:/EV-Accounts/backend/migrations/196_us_senate_candidates_2026.sql` — federal statewide candidate analog.

### race_candidates schema (verified live 2026-06-29)
- Columns: `id, race_id (NOT NULL → essentials.races), politician_id (nullable → essentials.politicians),
  full_name (NOT NULL), first_name, last_name, photo_url, is_incumbent (NOT NULL bool),
  candidate_status (NOT NULL; use 'active'), last_verified_at, source, external_id,
  occupational_designation, website_url, created_at, updated_at`.
- **`politician_id` is nullable** — challengers are full_name-only; existing rows (CA/TX/NY) leave it NULL.

### Frontend rendering (so seeded fields actually surface)
- `src/components/ElectionsView.jsx` — renders candidates per race; "No candidates have filed" empty
  state (line ~668); withdrawn/unopposed/incumbent badges; filters on `candidate_status`.
- `src/lib/candidatePhoto.js` — `withCandidatePhotoFallback`: card reads `rc.photo_url`, profile reads
  the politician record — explains why linking incumbents (D-02) yields a photo and why challenger
  `photo_url` matters (D-03).
- `src/lib/api.jsx` (~line 448) — single race-candidate fetch by `race_candidates` UUID.

### NV records already in DB (link targets — D-02)
- Project memory `project_phase159_complete.md` — statewide execs + Gov + 4 US House (Controller Andy Matthews ext_id -3200006; House -60003xx scheme).
- Project memory `project_phase160_complete.md` — 63 legislators (not link targets here, but confirms `nv` lowercase + ext_id schemes).

### External (authoritative for candidate facts)
- `https://ballotpedia.org/Nevada_elections,_2026` and per-office Ballotpedia pages — general field / primary winners.
- NV Secretary of State `nvsos.gov` — official candidate list (403 to automated fetch; cite as source even if fetched manually).

### Headshot rules (D-03)
- `find-headshots` skill at `~/.claude/commands/find-headshots.md`.
- Project memories: `feedback_headshot_image_sizing` (600×750), `feedback_headshot_cropping`, `feedback_headshot_resize_no_distort`, `feedback_headshot_no_graphics`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Migration `1072` (statewide general candidates) — copy-near-verbatim template for the NV INSERT.
- `1091/1110/1111` — US House candidate-seeding templates.
- `_apply-migration-NNN.ts` smoke-harness pattern (per-race count assertions + idempotency re-run).
- All 10 NV race `race_id`s exist (Phase 167); incumbent/cross-office politician records exist (159–160).
- `find-headshots` flow + Supabase Storage mirroring pattern for challenger photos.

### Established Patterns
- `race_candidates` INSERT … SELECT FROM (VALUES …) WHERE NOT EXISTS (race_id, full_name); idempotent.
- Incumbent photo surfacing via `COALESCE(rc.photo_url, pi.url)` + `withCandidatePhotoFallback`.
- Honest-skip gate for un-findable headshots (CA/TX/NY precedent).

### Integration Points
- `essentials.races` (Phase 167) ← `essentials.race_candidates.race_id`.
- `essentials.politicians` (Phases 159–160) ← `race_candidates.politician_id` (optional link).
- `/elections` (`ElectionsView.jsx`) reads race_candidates per jurisdiction → user-facing acceptance (SC #3).

</code_context>

<specifics>
## Specific Ideas

- The **Governor of Nevada** race is the headline gap (screenshot showed it blank; discovery found
  zero Gov candidates). Research it carefully: incumbent Joe Lombardo (R) is up for re-election 2026
  vs. the Democratic nominee from the June 9 primary. Do NOT leave Governor empty.
- Resolve each candidate's `race_id` explicitly against the Phase 167 races (by `position_name` /
  office) — the discovery `race_hint` text did NOT bind to a `race_id` (all 32 had NULL).
- US House candidates need correct **district** mapping (NV-01…04) — the 3 discovery US House leads
  had no district and looked partial; re-verify the full 4-district field.

</specifics>

<deferred>
## Deferred Ideas

- **Legislative candidate population** (11 State Senate + 42 State Assembly races) — explicit follow-up
  phase after this one.
- **Candidate compass stances** — downstream of candidate population.
- Bulk-promotion tooling for `candidate_staging` → `race_candidates` (the discovery review/promote
  workflow) — not built here; this phase curates manually.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 168-nv-2026-candidate-population-statewide-us-house*
*Context gathered: 2026-06-29*
