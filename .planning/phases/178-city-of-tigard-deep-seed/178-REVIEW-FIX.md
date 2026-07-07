---
phase: 178-city-of-tigard-deep-seed
fixed_at: 2026-07-03T00:11:21Z
review_path: C:/Transparent Motivations/essentials/.planning/phases/178-city-of-tigard-deep-seed/178-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 178: Code Review Fix Report

**Fixed at:** 2026-07-03T00:11:21Z
**Source review:** C:/Transparent Motivations/essentials/.planning/phases/178-city-of-tigard-deep-seed/178-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (WR-01 through WR-05; fix_scope=critical_warning, 6 Info findings excluded)
- Fixed: 5
- Skipped: 0

All fixes live in the **EV-Accounts repo** (`C:/EV-Accounts`, branch `master`), not the
essentials repo. Migrations 1160-1167 were already applied to production; these fixes are
file-level hardening (added assertion gates) verified to PASS against the current
production state (7 politicians ext_ids -4173651..-4173657; stance counts Hu 7 /
Anderson 4 / Ghoddusi 7 / Robbins 6 / Schlack 6 / Shaw 8 / Wolf 10; 7 politician_images
rows whose url embeds the politician UUID). All migrations remain idempotent-safe
(ON CONFLICT DO UPDATE / WHERE NOT EXISTS), so re-applying them will exercise and prove
the new gates. Migration 1159 was untouched (no findings). No `slug` /
`photo_origin_url` literals were introduced into migration comments (VERIFY-GATE
HYGIENE preserved).

## Fixed Issues

### WR-01: Stance migrations hardcode politician UUIDs with no assertion tying UUID to external_id

**Files modified:** `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql`, `1162_anderson_stances.sql`, `1163_ghoddusi_stances.sql`, `1164_robbins_stances.sql`, `1165_schlack_stances.sql`, `1166_shaw_stances.sql`, `1167_wolf_stances.sql`
**Commit:** 33c7f9f0 (EV-Accounts)
**Applied fix:** Added an identity gate at the top of each file's verification DO block: `SELECT external_id INTO v_ext ... WHERE id = '<uuid>'` followed by `IF v_ext IS DISTINCT FROM <expected ext_id> THEN RAISE EXCEPTION`. Per-file pairings: 1161 → -4173651 (Yi-Kang Hu), 1162 → -4173652 (Tom Anderson), 1163 → -4173653 (Faraz Ghoddusi), 1164 → -4173654 (Heather Robbins), 1165 → -4173655 (Jake Schlack), 1166 → -4173656 (Jeanette Shaw), 1167 → -4173657 (Maureen Wolf). `IS DISTINCT FROM` also trips on a nonexistent UUID (NULL), so both wrong-UUID modes now fail loudly. Pairings match the UUID↔ext_id map corroborated by 1160's storage URLs, so the gates pass on the current production rows.

### WR-02: Migration 1160 has no post-verification gate; NULL-subselect and URL/UUID mismatch failure modes are unchecked

**Files modified:** `C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql`
**Commit:** 6c96aef5 (EV-Accounts)
**Applied fix:** Appended a post-verification DO block before COMMIT asserting exactly 7 `essentials.politician_images` rows joined to politicians with `external_id BETWEEN -4173657 AND -4173651` where `pi.url LIKE '%' || pi.politician_id::text || '%'` — catching both orphan rows from a NULL politician subselect and hand-pasted url UUID segments that mismatch the row's politician. Kept the file's orchestrator-note convention: a comment instructs lowering the expected count if an INSERT block is deleted for a GAP official. Current production state (7/7 rows, urls carry the UUID) satisfies the gate.

### WR-03: Verbatim-duplicated VALUES lists between answers and context inserts, with only the answers side gated

**Files modified:** `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql`, `1162_anderson_stances.sql`, `1163_ghoddusi_stances.sql`, `1164_robbins_stances.sql`, `1165_schlack_stances.sql`, `1166_shaw_stances.sql`, `1167_wolf_stances.sql`
**Commit:** 3368c804 (EV-Accounts)
**Applied fix:** Extended each verification DO block with a context-parity gate counting `inform.politician_context` rows for the same UUID against the same expected count as the answers gate (Hu 7, Anderson 4, Ghoddusi 7, Robbins 6, Schlack 6, Shaw 8, Wolf 10); a single-sided edit of either VALUES list now raises. The reviewer's "better" alternative (single shared CTE feeding both INSERTs) was not adopted for these already-applied files to keep the diff additive; it remains a template suggestion for the next city.

### WR-04: Wolf fallback_url is an HTML homepage, not an image; license would be wrong if it ever succeeded

**Files modified:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py`
**Commit:** not committed (gitignored `_tmp-*` helper, per repo policy)
**Applied fix:** Set Wolf's `'fallback_url'` from `'https://maureenwolf.com'` to `None` with a comment explaining both failure modes (HTML page can never decode as an image; and had it served one, the per-official `press_use` license would be wrong for a campaign-site photo) and directing future fallbacks from differently-licensed sources to carry `(url, license)` pairs. Verified with `py -c "import ast; ast.parse(...)"` — syntax OK.

### WR-05: CDN_BASE hardcodes the project ref while the upload endpoint derives from env — silent URL/host divergence possible

**Files modified:** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py`
**Commit:** not committed (gitignored `_tmp-*` helper, per repo policy)
**Applied fix:** Replaced the hardcoded `CDN_BASE` constant with a derivation from `SUPABASE_URL`: a startup assert validates `SUPABASE_URL` shape, extracts the project ref, and builds `https://{ref}.storage.supabase.co/storage/v1/object/public/{BUCKET}`. Upload endpoint and manifest CDN URLs now share one source of truth, so env/constant divergence is impossible. Verified the derived value against the actual `.env` (`SUPABASE_URL=https://kxsdzaojfaibhuzmclfq.supabase.co`) — the derived CDN base is byte-identical to the previous hardcode, so behavior is unchanged for the current environment. Syntax-checked via `ast.parse` — OK.

## Verification notes

- **Tier 1:** every modified section re-read after edit; gate text present, surrounding SQL/Python intact.
- **Tier 2:** Python helper passed `ast.parse`. No local SQL parser is available for the plpgsql DO blocks (Tier 3 fallback); the gate shapes mirror the reviewer's suggested SQL and the existing (production-proven) DO-block pattern in the same files. The orchestrator's planned idempotent re-apply of 1160-1167 will exercise all new gates against production and constitutes the definitive check.
- **Repo state:** EV-Accounts working tree clean of these changes after commits 33c7f9f0, 3368c804, 6c96aef5 (only the gitignored helper differs, intentionally). Commits are on `master` but NOT pushed — Render deploys on push, and migrations are applied manually, so no deploy was triggered.

---

_Fixed: 2026-07-03T00:11:21Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
