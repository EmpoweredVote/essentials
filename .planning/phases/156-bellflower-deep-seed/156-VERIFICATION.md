---
phase: 156
slug: bellflower-deep-seed
status: passed
verified: 2026-06-22
requirements: [BLFL-01]
---

# Phase 156 — Bellflower deep-seed — Verification

**Verdict: PASSED (5/5 success criteria).** Goal-backward verification against the live DB + the rendered browse path. Verdict bar: structure-hard (met in full) / data-soft (headshots complete; stances evidence-only with documented honest blanks).

## Success criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | governments row + chamber(s) + current mayor + full council seated to geo_id 0604982 | ✓ geo_id=0604982; 1 'City Council' chamber (a89b567a); 5 offices, all bidirectional; Mayor (Santa Ines) + 4 council seated |
| 2 | Structure matches real form of government, official-site-verified | ✓ BY-DISTRICT (D1–D5, Ord. 1410) + ROTATIONAL mayor confirmed via bellflower.ca.gov; Dunton's mis-seeded LOCAL_EXEC Mayor office converted to D5 seat; 0 LOCAL_EXEC offices; official_count=5 |
| 3 | Headshots 600×750 for all with an available portrait; gaps documented | ✓ 5/5 default images (600×750, official bellflower.ca.gov source, photo_origin_url set); 0 gaps; operator-approved (correct persons) |
| 4 | Evidence-only stances, 100% citation, honest blanks | ✓ 7 stances (Santa Ines 2, Morse 5); 0 uncited, 0 judicial, 0 retired, 0 empty-source; Dunton/Koops/Sanchez honest blanks (no loadable individual record) |
| 5 | Browse renders roster + photos + stances; no duplicate/stale rows | ✓ single chamber, 5 distinct districts, 0 shared district_id, 0 LOCAL_EXEC, 1 government_bodies row (no split); + Mayor/Mayor-Pro-Tem ordering & label fix (operator-requested) |

## Migrations (on-disk authoritative; next = 1047)
- **Structural (registered):** 1042_bellflower_reconcile, 1043_bellflower_complete
- **Audit-only (NOT registered):** 1044_bellflower_headshots, 1045_bellflower_santa_ines_stances, 1046_bellflower_morse_stances
- All committed to `C:/EV-Accounts`. `supabase_migrations.schema_migrations` MAX unchanged by audit-only files.

## Source code (essentials repo, committed to main)
- `src/lib/groupHierarchy.js` + `src/lib/groupHierarchy.test.js` — Mayor/Mayor-Pro-Tem ordering + exec sub-group label fix (operator-requested during Wave 3 verification; shared logic, benefits all rotational-mayor cities). Lib suite 47/47 pass. **Requires an essentials-app deploy to appear live.**

## Tests
- `npx vitest run src/lib/` → 47/47 pass (no regressions).
- DB-state assertion queries (per 156-VALIDATION.md) → all wave gates pass; split-section check 0 rows.

## Honest gaps (documented, acceptable per data-soft verdict)
- Stances: Dunton (D5), Koops (D2), Sanchez (D4) have no individually-attributable, loadable public-record positions → honest blanks (campaign sites dead/bot-blocked; bios policy-free; Ballotpedia surveys uncompleted; Sanchez platform too vague to chair). Re-visitable if richer sources surface.

## Operator approvals
- Headshots approved 2026-06-22 ("Headshots look good for bellflower").
- Stances approved 2026-06-22 ("Approve — complete Phase 156").
