# 145-02 Summary — Lancaster Wave 2 (roster turnover)

**Status:** ✅ Complete · **Applied to production** 2026-06-20 · **Migration:** 911 (structural, registered)

## What was done
Migration `911_lancaster_complete.sql` applied to the live DB:
- **Retired** (preserve rows, NOT deleted; free their offices): Raj Malhi `-201280` (lost April 2026) and Marvin Crist `686320` (did not file) → `is_active=false`, `office_id=NULL`; offices `03a0dae7` + `afd045ec` freed.
- **Created** the two April-2026 winners: Cedric White `-700655`, Rocio Castellanos `-700656` (`source='cityoflancasterca.org'`, active/incumbent).
- **Seated** White → office `03a0dae7` (ex-Malhi), Castellanos → office `afd045ec` (ex-Crist), syncing BOTH `offices.politician_id` and `politicians.office_id`.

## Verification (all green)
Final survivor-chamber roster — 5/5 filled, every `back_pointer_ok=true`:
- Mayor: R. Rex Parris (-200795)
- Council: Lauren Hughes-Leslie (-201279), Ken Mann (-201281), Cedric White (-700655, new), Rocio Castellanos (-700656, new)
- Malhi (-201280) + Crist (686320): `is_active=false`, `office_id=NULL` (preserved, not deleted)
- 5/5 offices filled; migrations 910+911 both registered

## Deviations
None. Pre-flight confirmed Malhi+Crist as retire targets, ext_ids -700655/-700656 free, and no pre-existing real "Cedric White"/"Rocio Castellanos" official (same-name rows are unrelated people/committees).

## Remaining for LANC-01
- **Wave 3 (headshots, mig 912 audit-only):** fill gaps for current 5 (only 2/5 have images). cityoflancasterca.org is WAF-403 → needs human-verify/browser; Parris via Wikimedia. **Blocked on user for WAF-sourced portraits.**
- **Wave 4 (stances, mig 913–917 audit-only):** evidence-only chairs stances for the 5 current members, one research agent at a time, no judicial topics. Not yet started.
