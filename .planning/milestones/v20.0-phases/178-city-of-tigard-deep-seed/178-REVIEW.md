---
phase: 178-city-of-tigard-deep-seed
reviewed: 2026-07-02T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/1159_tigard_city_council.sql
  - C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql
  - C:/EV-Accounts/backend/migrations/1161_hu_stances.sql
  - C:/EV-Accounts/backend/migrations/1162_anderson_stances.sql
  - C:/EV-Accounts/backend/migrations/1163_ghoddusi_stances.sql
  - C:/EV-Accounts/backend/migrations/1164_robbins_stances.sql
  - C:/EV-Accounts/backend/migrations/1165_schlack_stances.sql
  - C:/EV-Accounts/backend/migrations/1166_shaw_stances.sql
  - C:/EV-Accounts/backend/migrations/1167_wolf_stances.sql
  - C:/EV-Accounts/backend/scripts/_tmp-tigard-wave0-probe.sql
  - C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py
  - C:/Transparent Motivations/essentials/src/lib/buildingImages.js
  - C:/Transparent Motivations/essentials/src/lib/coverage.js
findings:
  critical: 0
  warning: 5
  info: 6
  total: 11
status: issues_found
---

# Phase 178: Code Review Report

**Reviewed:** 2026-07-02
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the City of Tigard deep-seed: structural migration 1159 (gov + chamber + 2 districts + 7 officials + 7 offices), audit headshot migration 1160, seven stance migrations (1161-1167), two gitignored one-shot orchestrator helpers, and the 3-line surfacing change in the essentials frontend (CURATED_LOCAL banner key + coverage entry).

Cross-file consistency checks all pass: the politician UUID set is internally consistent across 1160's storage URLs and the seven stance migrations' hardcoded `politician_id` values (Hu `6701cd53…`, Anderson `af1382e1…`, Ghoddusi `53570d0d…`, Robbins `18896554…`, Schlack `ffd6a403…`, Shaw `9e4d8f47…`, Wolf `4994a44e…`); external_id block -4173651..-4173657 is used consistently in 1159, 1160, and the Python roster; stance-count gates match their VALUES lists exactly (7/4/7/6/6/8/10); no VALUES list contains a duplicate topic_key (which would have triggered an ON CONFLICT "cannot affect row a second time" error); the coverage.js entry uses the correct geo_id `4173650`, alphabetical position, and `hasContext: true`; buildingImages.js `tigard` key carries the required license attribution (Public Domain, no AI image). Migration 1159 applies the WR-01 fix correctly (independent geofence assertion + canonical GROUP BY/HAVING section-split gate), the negative-range `BETWEEN -4173657 AND -4173651` in gate (f) is ordered correctly, per-project casing rules (districts `'or'` lowercase, governments/offices `'OR'` uppercase) are respected, and 1159 registers the ledger while 1160-1167 stay audit-only per convention.

No blockers found. Five warnings concern latent robustness gaps — silent-misattribution and silent-divergence failure modes that current verification gates cannot catch — plus six informational items.

## Warnings

### WR-01: Stance migrations hardcode politician UUIDs with no assertion tying UUID to external_id

**File:** `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql:18` (same pattern in 1162:16, 1163:18, 1164:17, 1165:17, 1166:19, 1167:21)
**Issue:** Each stance migration hardcodes the politician UUID (e.g., `'6701cd53-e7fb-491c-9b45-d0474705349e'::uuid`). The headers say "no hardcoded topic UUIDs" — true — but the politician UUID is hardcoded with no gate proving it belongs to the intended official. If a wrong-but-existing UUID were pasted (e.g., copied from the wrong manifest line), the FK would still satisfy, the answer-count gate (`n <> 7`) would still pass, and stances would be silently attributed to a different politician. A nonexistent UUID fails loudly (FK violation), but the misattribution case is undetectable by the current gates. The pattern in 1160 (resolve by `external_id` subselect) is strictly safer.
**Fix:** Resolve the id at apply time, or assert the pairing in the DO gate:
```sql
DO $$
BEGIN
  IF (SELECT external_id FROM essentials.politicians
      WHERE id = '6701cd53-e7fb-491c-9b45-d0474705349e') <> -4173651 THEN
    RAISE EXCEPTION 'UUID does not belong to external_id -4173651 (Yi-Kang Hu)';
  END IF;
END $$;
```
For the applied migrations, the UUID set is internally consistent with 1160's storage URLs, so production correctness is corroborated — this is a template hardening item for the next city.

### WR-02: Migration 1160 has no post-verification gate; NULL-subselect and URL/UUID mismatch failure modes are unchecked

**File:** `C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql:25-105`
**Issue:** Unlike 1159 and the stance migrations, 1160 has no verification DO block. Two unchecked failure modes: (a) if a politician row were missing, `(SELECT id FROM essentials.politicians WHERE external_id = …)` returns NULL and the INSERT either errors (if `politician_id` is NOT NULL) or silently inserts an orphan image row; (b) the `{uuid}` segment of each `url` is hand-pasted, while the pipeline uploads to a runtime-resolved path — a paste error would produce a DB row whose URL 404s, and nothing asserts `url` contains `politician_id`.
**Fix:** Append a gate:
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -4173657 AND -4173651
    AND pi.url LIKE '%' || pi.politician_id::text || '%';
  IF n <> 7 THEN
    RAISE EXCEPTION 'Expected 7 Tigard image rows with matching URL uuid, found %', n;
  END IF;
END $$;
```
(Adjust the expected count downward per manifest gaps when blocks are deleted.)

### WR-03: Verbatim-duplicated VALUES lists between answers and context inserts, with only the answers side gated

**File:** `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql:7-35` (same pattern in 1162-1167)
**Issue:** Each stance migration duplicates the entire `s(topic_key, val, reasoning, sources)` VALUES list verbatim — once for `inform.politician_answers`, once for `inform.politician_context`. The verification DO block counts only `politician_answers` rows; `politician_context` is never counted. A single-sided edit (e.g., a topic_key typo introduced only in the second block) or a divergent reasoning update would drop/skew context rows without tripping any gate, leaving a stance value displayed with missing or stale reasoning/sources. In the reviewed files the two blocks are currently byte-identical per file, so no live defect — but the template invites divergence.
**Fix:** Gate both tables:
```sql
SELECT COUNT(*) INTO n FROM inform.politician_context WHERE politician_id = '…';
IF n <> 7 THEN RAISE EXCEPTION 'Expected 7 context rows, found %', n; END IF;
```
Better: define the VALUES CTE once and feed both INSERTs from it in one statement chain (`WITH s AS (…), ins_answers AS (INSERT … RETURNING 1) INSERT INTO … context …`).

### WR-04: Wolf fallback_url is an HTML homepage, not an image; license would be wrong if it ever succeeded

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py:129`
**Issue:** `'fallback_url': 'https://maureenwolf.com'` points at a campaign-site homepage. As written the fallback can never work — `download_image` accepts any HTTP-200 body (no Content-Type check), so the HTML downloads "successfully" and only fails later in `PIL.Image.open` with a misleading "cannot identify image file" error, then correctly SKIPs as a gap. Worse, if that URL ever served an image, the manifest would record `license='press_use'` (line 128) for a campaign-site photo — `license` is per-official, not per-source, so the fallback path can emit a wrong license.
**Fix:** Set `fallback_url` to a direct image URL or `None`; if fallbacks can come from a differently-licensed source, carry `(url, license)` pairs so `source_used` selects the matching license for the manifest.

### WR-05: CDN_BASE hardcodes the project ref while the upload endpoint derives from env — silent URL/host divergence possible

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py:160` (vs upload at line 256)
**Issue:** Uploads go to `f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/…'` (env-derived), but the manifest CDN URLs — which are pasted into migration 1160 — come from a hardcoded `CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/…'`. If `.env` ever pointed at a different project (staging, rotated ref), the script would upload to one host while the manifest and 1160 record URLs on another, with no error anywhere. It worked here because env and constant happen to agree, but nothing enforces that.
**Fix:** Derive the CDN base from the env value, e.g. extract the project ref from `SUPABASE_URL` and build `{ref}.storage.supabase.co/storage/v1/object/public/{BUCKET}`, or assert the ref embedded in `CDN_BASE` appears in `SUPABASE_URL` at startup.

## Info

### IN-01: 1160 idempotency guard keys on "any image row exists," not on type

**File:** `C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql:30-33`
**Issue:** `WHERE NOT EXISTS (SELECT 1 FROM essentials.politician_images WHERE politician_id = …)` skips the insert if the politician has any image of any `type`, not just an existing `'default'`. Harmless on this greenfield seed; would silently no-op if a non-default image type were ever seeded first.
**Fix:** Add `AND type = 'default'` to the guard subquery in future templates.

### IN-02: Naive .env parser — no quote stripping or `export` handling

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py:147-154`
**Issue:** The parser keeps surrounding quotes in values (`KEY="value"` yields `"value"` including quotes) and ignores `export KEY=…` lines. A quoted `SUPABASE_SERVICE_ROLE_KEY` would produce confusing 401s. Worked against the actual .env, but fragile.
**Fix:** Strip matching quotes: `v = v.strip().strip('\'"')`, and `line.removeprefix('export ')`.

### IN-03: MIN_DIM=100 permits up to 6x upscaling to 600x750

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py:176`
**Issue:** A 100x125 source would pass the guard and be Lanczos-upscaled 6x, well below the quality bar the pipeline aims for. The actual Tigard sources (509x815 to 1536x1020) upscale at most ~1.1x after the 4:5 crop, so no live impact.
**Fix:** Raise the floor (e.g., `MIN_DIM = 300`) or warn when the post-crop dimensions are below 600x750.

### IN-04: download_image does not validate Content-Type

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py:195-211`
**Issue:** An HTTP-200 HTML error/consent page passes the download step and only fails in PIL with an opaque error. Handled safely (results in a GAP), but the manifest error message points at PIL rather than the real cause.
**Fix:** `if 'image' not in resp.headers.get('content-type', ''): raise Exception(...)` after the status check.

### IN-05: Descriptive-UA contact address may not be a real mailbox

**File:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py:171`
**Issue:** The polite User-Agent advertises `contact alincoln@empowered.vote`. The project's known contact is chris@empowered.vote; if `alincoln@` is not a monitored alias, the contact string defeats the purpose of a descriptive UA (site operators cannot actually reach anyone).
**Fix:** Use a monitored address in the pipeline template.

### IN-06: CURATED_LOCAL lookup is substring-based; new `tigard` key participates in `includes()` matching

**File:** `C:/Transparent Motivations/essentials/src/lib/buildingImages.js:110-126, 202-207`
**Issue:** `getBuildingImages` matches with `city.includes(key)`, so any `representing_city` containing "tigard" as a substring gets the Tigard banner. No real-world US place name collides with "tigard" today, and this is the pre-existing pattern (out of this diff's scope beyond the added key) — noting so the substring semantics are a conscious choice as more keys accumulate (first-match wins in insertion order).
**Fix:** None required now; consider exact-match or word-boundary matching if a collision-prone key is ever added.

## Clean areas verified

- **1159 structural migration:** pre-flight hard-abort guard, single-transaction atomicity, correct districts/governments casing split, inline `representing_city` (no backfill needed), title-on-seat handling for Wolf (one office row), Youth Councilor correctly excluded (official_count=7), appointed-seat flags (Hu, Anderson: `is_appointed`/`is_appointed_position` true; other five false), independent geofence gate and canonical section-split gate both genuinely independent of the same-transaction inserts, negative BETWEEN ranges ordered correctly, ledger registration for structural only.
- **Stance content rules:** all 48 stance rows across 7 officials carry non-empty reasoning + sources arrays (evidence-only, no defaulted values); blank spokes omitted per project rule; topic_ids resolved live via `topic_key AND is_live = true` (no retired topic UUIDs hardcoded); per-file answer-count gates match the VALUES lists exactly.
- **Wave-0 probe:** read-only SELECT/echo only, no transaction wrapper, correct geo_id and ext_id block checks.
- **Frontend surfacing:** coverage.js Tigard entry (geo_id `4173650`, `hasContext: true`, alphabetical order) and buildingImages.js `tigard` CURATED_LOCAL key with licensed-banner attribution both correct; no Windows backslash paths introduced (Tailwind v4 planning-scan hazard avoided).

---

_Reviewed: 2026-07-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
