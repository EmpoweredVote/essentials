---
phase: 181-city-of-sherwood-deep-seed
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql
  - C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql
  - C:/EV-Accounts/backend/migrations/1189_rosener_stances.sql
  - C:/EV-Accounts/backend/migrations/1190_young_stances.sql
  - C:/EV-Accounts/backend/migrations/1191_brouse_stances.sql
  - C:/EV-Accounts/backend/migrations/1192_giles_stances.sql
  - C:/EV-Accounts/backend/migrations/1193_mays_stances.sql
  - C:/EV-Accounts/backend/migrations/1194_scott_stances.sql
  - C:/EV-Accounts/backend/migrations/1195_standke_stances.sql
  - C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py
  - C:/EV-Accounts/backend/scripts/_tmp-sherwood-wave0-probe.sql
  - src/lib/coverage.js
  - src/lib/buildingImages.js
findings:
  critical: 0
  warning: 4
  info: 1
  total: 5
fixed: 4
status: issues_found_fixed
---

# Phase 181: Code Review Report

**Reviewed:** 2026-07-03
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found_fixed (4/4 in-scope warnings fixed; IN-01 out of scope, unaddressed)

## Summary

Reviewed the City of Sherwood, OR deep-seed: structural migration 1187 (government + chamber + 2 districts + 7 offices), audit headshot migration 1188, seven audit-only stance migrations (1189–1195), the two `_tmp-*` orchestrator helpers, and the two frontend surfacing files.

Traced every UUID, external_id, and geo_id (`4167100`) across all 9 SQL files and both `_tmp-*` helpers — all cross-references are internally consistent (no name/UUID/external_id transpositions found). The `districts.state`/`governments.state`/`offices.representing_state` casing convention (lowercase vs. uppercase) is followed correctly. The prior-phase template fixes this phase claims to carry forward were verified present and correctly implemented:
- **WR-01** (upload-failure exit code) — present in `_tmp-sherwood-headshots.py` `main()`.
- **WR-B / D-15 pairwise identity gate** — present in migration 1187's post-verification block.
- **WR-A** (expected-count-sync note) — present in migration 1188's header.
- **WR-C** (empty-roster guard before `OFFICIALS[0]` indexing) — present in `_tmp-sherwood-headshots.py`.
- **WR-03** (context/answers row-count parity gate) — present in all 7 stance migrations.

No SQL syntax defects were found (grepped every stance migration for un-escaped apostrophes inside string literals — all apostrophes in the prose are correctly doubled; the single unescaped instances found are inside `--` comments, which don't require escaping). Stance counts declared in each file's header match the number of `VALUES` rows and match the hardcoded `IF n <> N` gate in each file's DO block.

No BLOCKER-level defects were found. The issues below are latent template/code-quality defects — several would propagate unchanged into Phase 182 (Cornelius) if these files are cloned as a starting point, per the review brief.

## Warnings

### WR-01: Module-level `assert` statements are silently disabled under `python -O`

**File:** `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py:141-143`
**Issue:** The roster-integrity guards —
```python
assert len({m['ext_id'] for m in OFFICIALS}) == len(OFFICIALS), 'external_ids must be unique'
assert len(OFFICIALS) == 7, 'expect a full 7/7 outcome given confirmed direct-download sourcing'
assert all(m['license'] for m in OFFICIALS), 'every official must carry a license string'
```
are plain `assert` statements. Python strips all `assert` statements when run with `-O` or with `PYTHONOPTIMIZE` set (a common flag in some CI/production wrappers). If this script is ever invoked in an optimized interpreter, all three roster-integrity checks silently vanish — a duplicated `ext_id`, a roster short of 7, or a blank `license` field would go undetected and the pipeline would proceed to write photos under wrong/missing metadata. This is a template pattern that will be cloned verbatim into Phase 182's script.
**Fix:** Replace the `assert` guards with explicit `if ...: raise ValueError(...)` checks so validation runs regardless of interpreter optimization level:
```python
if len({m['ext_id'] for m in OFFICIALS}) != len(OFFICIALS):
    raise ValueError('external_ids must be unique')
if len(OFFICIALS) != 7:
    raise ValueError('expect a full 7/7 outcome given confirmed direct-download sourcing')
if not all(m['license'] for m in OFFICIALS):
    raise ValueError('every official must carry a license string')
```

**Status:** fixed on disk (gitignored template — not committed; propagates when Phase 182 clones the script). Converted all three roster-integrity `assert` statements to explicit `if: raise ValueError(...)` checks in `_tmp-sherwood-headshots.py`.

### WR-02: Test-download guard re-fetches the same URL that `process_member` fetches again, independently

**File:** `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py:407-408, 320, 362`
**Issue:** `main()` calls `test_download_guard(OFFICIALS[0])`, which downloads `OFFICIALS[0]['url']` and discards the bytes (only prints pass/fail). Moments later, the loop over `OFFICIALS` calls `process_member()` for the same official, which calls `download_image()` again on the identical URL — a second, independent HTTP round-trip. Beyond the redundant network call, this means the bytes that were "verified" by the guard are never the bytes that actually get cropped/resized/uploaded; if the origin server returns different content between the two requests (edge-cache miss, mid-deployment content swap, etc.), the guard's PASS gives no real assurance about what is actually processed.
**Fix:** Have `test_download_guard` return the downloaded bytes (or refactor so `process_member` for `OFFICIALS[0]` reuses the guard's already-downloaded bytes) instead of discarding them:
```python
def test_download_guard(member: dict):
    ...
    raw_bytes = download_image(member['url'])
    ...
    return raw_bytes  # reuse in process_member instead of re-downloading
```

**Status:** fixed on disk (gitignored template — not committed; propagates when Phase 182 clones the script). `test_download_guard()` now returns the verified bytes (or `None`); `main()` captures them and passes them to `process_member()` via a new `prefetched_bytes` param, which is used only for the first official (idx 0) so the exact bytes the guard verified are the bytes actually processed.

### WR-03: `getBuildingImages()` Local-image matching is unscoped by state, and the new `sherwood` key inherits the collision risk

**File:** `src/lib/buildingImages.js:206-215`
**Issue:**
```js
const city = (representingCity || '').toLowerCase();
let localImage = null;
for (const [key, src] of Object.entries(CURATED_LOCAL)) {
  if (city.includes(key)) {
    localImage = src;
    break;
  }
}
```
This substring-matches `representingCity` against `CURATED_LOCAL` keys with no `stateAbbrev` disambiguation, even though `getBuildingImages(representingCity, stateAbbrev)` already receives the state. Sherwood is not a uniquely-named city — Sherwood, AR (Little Rock metro) is a real, well-known locality, and `STATE_PANORAMAS` already includes `AR`, meaning an Arkansas-representing official could plausibly reach this function. Any official whose `representing_city` resolves to "Sherwood" outside Oregon would incorrectly render the City of Sherwood, OR banner. This is a pre-existing architectural gap in the function (the same issue already exists for `'glendale'`, which collides with Glendale, AZ), but Phase 181 adds a new key to the same unscoped map, extending the defect's surface area without adding a guard.
**Fix:** Thread `stateAbbrev` into the Local lookup, e.g. store `CURATED_LOCAL` entries as `{ state: 'OR', src: '...' }` and require a state match in addition to the substring match:
```js
const CURATED_LOCAL = {
  sherwood: { state: 'OR', src: '.../cities/sherwood.jpg' },
  // ...
};
for (const [key, entry] of Object.entries(CURATED_LOCAL)) {
  if (city.includes(key) && (!entry.state || entry.state === abbrev)) {
    localImage = entry.src;
    break;
  }
}
```

**Status:** fixed (commit `6999052` in essentials repo). `CURATED_LOCAL` entries restructured to `{ state, src }`; the match loop now requires `entry.state === abbrev` unless the caller passes no state or the entry has none (backward-compatible — missing caller state is match-allowed). `npm run build` passes. All 19 existing keys retain their original state assignment (bloomington IN; beaverton/hillsboro/tigard/tualatin/'forest grove'/sherwood OR; the 10 LA-county keys CA).

### WR-04: Answers/context row-count parity gate does not detect content drift between the two hand-duplicated VALUES blocks

**File:** `C:/EV-Accounts/backend/migrations/1189_rosener_stances.sql:48-58` (same pattern in 1190–1195)
**Issue:** Each stance migration maintains two independently-typed, verbatim-duplicated `VALUES` lists — one feeding `inform.politician_answers` (topic_key, value) and one feeding `inform.politician_context` (topic_key, reasoning, sources). The WR-03 gate only asserts `COUNT(answers) == COUNT(context) == N`. If a future hand-edit changes the chair `value` in the answers block (e.g. correcting a mis-scored stance) without mirroring the same reasoning-implied change in the context block, or vice versa, the row counts stay identical and the gate passes silently even though the two tables now disagree about what evidence supports the value. This is a design limitation of the entire audit-migration convention (not unique to Sherwood) but is present in every file this phase adds and will be cloned into Phase 182.
**Fix:** Not necessarily fixable within a single migration file's scope, but worth carrying forward as a known gap: consider a stronger gate that checks per-topic_key value/topic pairing between the two tables (e.g. `SELECT COUNT(*) FROM politician_answers a JOIN politician_context c USING (politician_id, topic_id) WHERE ...` to at least confirm both a value and reasoning exist for the exact same topic set), rather than two independent scalar counts.

**Status:** fixed (commit `0946233c` in EV-Accounts repo, migrations 1189–1195). Added a fourth gate to each file's DO block: a `NOT EXISTS` check asserting every `politician_answers` row has a matching `politician_context` row (same `politician_id`/`topic_id`) with non-empty `reasoning` and non-empty `sources`, and the reverse check that no `politician_context` row references a `topic_id` absent from `politician_answers` — i.e. set equality on `topic_id` plus a non-empty-evidence requirement. Migrations were NOT re-run against any database (already applied in production); only the on-disk files were edited so future clones (e.g. Phase 182) inherit the stronger gate. Verified no `slug`, `photo_origin_url`, or `schema_migrations` strings were introduced. Post-fix verification (orchestrator, 2026-07-03): all 7 strengthened migrations were re-applied against production — safe by design (audit-only, ON CONFLICT DO UPDATE idempotent, gates RAISE-and-rollback on failure). Every file's four-gate DO block executed cleanly (DO + COMMIT on 1189–1195), confirming the new PL/pgSQL parses and passes against live data. **Status upgraded: fixed and verified** — safe as the Phase 182 template.

## Info

### IN-01: Repeated chamber-lookup subquery in every office INSERT

**File:** `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql:120-123, 156-159, 189-192, 222-225, 258-261, 291-294, 324-327`
**Issue:** The same nested subquery (`SELECT id FROM essentials.chambers WHERE name = 'City Council' AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Sherwood, Oregon, US')`) is repeated verbatim in all 7 office INSERT statements. Purely stylistic — correctness is unaffected since the migration runs once and the chamber row is stable within the transaction — but a single copy-paste typo in any one of the 7 repetitions (e.g. a stray character in the government name) would silently produce a `NULL` chamber_id for just that one officer, which the post-verification office-count gate would still likely catch (count would be 7 but with a NULL chamber_id) since a NULL FK would normally fail a NOT NULL constraint at insert time — so failure mode is loud, not silent. Noting for readability only.
**Fix:** Consider hoisting the chamber lookup into a single CTE at the top of the migration (`WITH chamber AS (SELECT id FROM essentials.chambers WHERE ...)`) referenced by each subsequent office INSERT, reducing duplication.

---

_Reviewed: 2026-07-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
