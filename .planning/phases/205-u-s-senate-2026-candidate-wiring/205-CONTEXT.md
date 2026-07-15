# Phase 205: U.S. Senate 2026 Candidate Wiring - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Production data-repair migration: link each orphaned 2026 U.S. Senate race (`essentials.races` where `position_name ILIKE 'U.S. Senate %'`, 51 races / 189 candidates / all `office_id = NULL`) to the correct `NATIONAL_UPPER` seat office (the specific 2026 Class seat, incl. specials) so candidates surface by address exactly like House candidates already do. Data-only — no application code changes.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `205-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `205-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Derive the per-state 2026 Senate seat map (Class 2 + 2026 specials) and surface it for spot-check.
- Set `essentials.races.office_id` for confidently-mapped `U.S. Senate %` races to the correct `NATIONAL_UPPER` seat office (production migration).
- Verify candidates surface by address for a sample of mapped states (House parity).
- A report of skipped/unresolved races.

**Out of scope (from SPEC.md):**
- Cleaning up the stray `Candidate for U.S. Senate — {State}` office rows — deferred follow-on.
- Senate candidate headshots — follow-on.
- Senate candidate compass stances — follow-on.
- Any frontend/API code changes — House path already works; data-only.
- Backfilling additional Senate races/candidates beyond what is already seeded.

</spec_lock>

<decisions>
## Implementation Decisions

### Seat mapping (source of truth)
- **D-01 (from SPEC):** I derive the per-state 2026 seat map from public record (Class 2 senators + known 2026 special elections); the user spot-checks it before any write.
- **D-05:** 2026 special-election seats (appointee incumbents — e.g. OH → Jon Husted, FL → Ashley Moody) ARE linked, to the appointee's current `NATIONAL_UPPER` seat office (correct statewide geography). Each special is explicitly marked `SPECIAL` in the review table so the user can eyeball those specifically at the checkpoint.
- Matching key: `position_name` carries the state ("U.S. Senate {State}"); all of a state's Senate race rows (per-party primaries + general + any runoff) link to the SAME seat office. Link target must be a real seat office (title `Senator` / `U.S. Senate - {State}`), NEVER a stray `Candidate for U.S. Senate — {State}` office.

### Confidence / ambiguity handling
- **D-02 (from SPEC):** Confident matches only. Any state whose 2026 seat can't be confidently identified (missing seat office, ambiguous match) is left `office_id = NULL` and reported for manual resolution — no best-effort/guessed links.

### Migration packaging
- **D-03:** Package the write as a checked-in, **idempotent, re-runnable** SQL migration in `supabase/migrations/` (`NNN_link_us_senate_2026_races.sql`) containing the explicit state→incumbent→office_id map. Next migration number follows the on-disk convention (disk-authoritative). Auditable in git; applied only after the user approves the seat map. (Not ad-hoc MCP `execute_sql`.)

### Review gate
- **D-04:** A **blocking human checkpoint** during execution: present the full derived state→seat(→incumbent) table (specials flagged) and wait for the user's approval before any `UPDATE` runs. Mirrors the 204-04 human-verify checkpoint pattern.

### Verification depth
- **D-06:** Verify with BOTH (a) DB parity queries — every mapped race resolves through `offices→districts` to a `NATIONAL_UPPER` seat office; before/after diff shows only `U.S. Senate %` `races.office_id` changed; House linkage + incumbents untouched — AND (b) a live in-state address test on the deployed site for ≥3 sample states confirming candidates actually surface (House parity in the same response).

### Scope guard
- **D-07 (from SPEC):** Stray `Candidate for U.S. Senate — {State}` offices are NOT cleaned up here (deferred). They must never be used as link targets, but their existence is left as-is.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/phases/205-u-s-senate-2026-candidate-wiring/205-SPEC.md` — Locked requirements, boundaries, acceptance criteria. MUST read before planning.

### Data model / migration
- `supabase/migrations/` — on-disk migration convention (`NNN_description.sql`); next number is disk-authoritative. New migration lands here.
- Working reference pattern (House): a `NATIONAL_LOWER` race has `races.office_id` → incumbent seat office (title `Representative`) whose `district_id` is the district; candidates live in `essentials.race_candidates`. Senate must mirror this with the `NATIONAL_UPPER` seat office.

### Production access
- `mcp__supabase-local` IS production (writes are live) — used for derivation/verification queries; the actual write ships as the committed SQL migration applied after approval.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The entire address→candidates surfacing path already works for the House — no new code. Correctness = parity with `NATIONAL_LOWER` race linkage.
- `mcp__supabase-local__execute_sql` for read-only derivation + before/after verification.

### Established Patterns
- Address surfacing chain: `address → district → office → race → race_candidates`. The only broken link for Senate is `races.office_id`.
- Migrations are tracked on disk in `supabase/migrations/`; migration numbering is disk-authoritative (per project convention / prior-phase notes).
- Human-verify blocking checkpoint pattern (as used in phase 204-04) for the seat-map approval gate.

### Integration Points
- `essentials.races.office_id` (the single column mutated) → `essentials.offices` (seat office, `district_id` → `essentials.districts` where `district_type = 'NATIONAL_UPPER'`, one statewide district per state).
- Verification touches the live deployed results/address path (essentials.empowered.vote) for the sample-state check.

</code_context>

<specifics>
## Specific Ideas

- Confirmed correct example links (from scouting): MN → Tina Smith (not Klobuchar), TX → John Cornyn (not Cruz), TN → Bill Hagerty (not Blackburn), OH → Jon Husted (special), FL → Ashley Moody (special).
- Diagnosis snapshot (2026-07-15): 51 orphaned `U.S. Senate %` races, 189 candidates, 35 states; multi-race states are primary(per-party)/general splits, not duplicates.
- The seat-map review table should flag SPECIAL seats distinctly.

</specifics>

<deferred>
## Deferred Ideas

- **Stray `Candidate for U.S. Senate — {State}` office cleanup** — data-hygiene pass; own follow-on (doesn't block surfacing).
- **Senate candidate headshots** — follow-on (find-headshots).
- **Senate candidate compass stances** — follow-on.
- **Backfill any Senate races/candidates not yet seeded** — separate discovery/seeding work; 205 wires up existing data only.

None of these block phase 205.

</deferred>

---

*Phase: 205-u-s-senate-2026-candidate-wiring*
*Context gathered: 2026-07-15*
