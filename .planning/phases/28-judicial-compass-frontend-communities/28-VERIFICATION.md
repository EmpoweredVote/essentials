---
phase: 28
status: passed
---

# Phase 28 Verification

**Phase Goal:** Legal candidate profile pages in the essentials frontend surface judicial compass topics, and 8 companion Focused Communities are seeded for the new judicial topics.

**Verified:** 2026-05-07

## Must-Haves

| # | Must-Have | Status | Evidence |
|---|-----------|--------|----------|
| 1 | JUDICIAL district_type profile renders judicial compass topics (not standard legislative topics) | ✓ VERIFIED | Profile.jsx lines 197–214: districtScope IIFE maps `dt === 'JUDICIAL' || dt === 'NATIONAL_JUDICIAL'` to `'judicial'`, then routes to `JudicialCompassSection` instead of `CompassCard`. CompassCard is never rendered for judicial profiles. |
| 2 | City Attorney/DA profile renders 4 universal + 2 City Attorney/DA-specific topics (6 total) | ✓ VERIFIED | `deriveJudicialSubRole` returns `'city_attorney_da'` for titles containing 'city attorney' or 'district attorney'. `filterJudicialTopics` keeps topics where `judicial_role === null` (4 universal: access-to-justice, criminal-justice, government-deference, transparency) or `judicial_role === 'city_attorney_da'` (police-accountability, prosecution-priorities) = 6 topics. |
| 3 | Judge profile renders 4 universal + 2 judge-specific topics (6 total) | ✓ VERIFIED | `deriveJudicialSubRole` returns `'judge'` for titles containing 'judge'. `filterJudicialTopics` keeps topics where `judicial_role === null` (4 universal) or `judicial_role === 'judge'` (bail-pretrial, interpretation) = 6 topics. City Attorney/DA topics excluded. |
| 4 | All 8 judicial compass topics have a companion `connect.communities` row with authored description, and `fc_community_slug` populated | ✓ VERIFIED | DB query: 8/8 community slugs present; all 8 have authored plain-language descriptions. DB query: all 8 `judicial-*` live topics have `fc_community_slug` populated. |

## Artifact Verification

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/JudicialCompassSection.jsx` | VERIFIED | 159 lines; exports default function; `deriveJudicialSubRole` and `filterJudicialTopics` implemented correctly; filters by `applies_judicial === true` then by `judicial_role` |
| `src/pages/Profile.jsx` | VERIFIED | `isJudge` guard absent (grep confirmed no match); `JudicialCompassSection` imported (line 8) and rendered when `districtScope === 'judicial'` (lines 207–214) |
| `src/pages/CandidateProfile.jsx` | VERIFIED | `JudicialCompassSection` imported (line 7); JUDICIAL arm (`dt === 'JUDICIAL' || dt === 'NATIONAL_JUDICIAL'`) evaluated before `dt.startsWith('NATIONAL_')` check (lines 169–180); renders `JudicialCompassSection` with `officeTitle` fallback to `candidateData?.position_name` |
| `C:/EV-Accounts/backend/src/lib/compassService.ts` | VERIFIED | `getCompassTopics()` SELECT string (line 111) includes `judicial_role`; `applies_judicial` correctly defaults to `false` for cross-cutting topics (line 160) |

## Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `Profile.jsx` | `JudicialCompassSection` | import + conditional render on `districtScope === 'judicial'` | WIRED |
| `CandidateProfile.jsx` | `JudicialCompassSection` | import + conditional render when `dScope === 'judicial'` | WIRED |
| `JudicialCompassSection` | compass topics | `useCompass()` → `allTopics.filter(t => t.applies_judicial === true)` | WIRED |
| `JudicialCompassSection` | sub-role filtering | `deriveJudicialSubRole(officeTitle)` → `filterJudicialTopics` | WIRED |
| `compassService.ts` | `judicial_role` column | included in Supabase `.select(...)` string | WIRED |
| `connect.communities` | `inform.compass_topics` | `fc_community_slug` populated on all 8 judicial topic rows | WIRED |

## DB State

- 8/8 expected community slugs present in `connect.communities`
- All 8 have authored plain-language descriptions (non-empty, non-placeholder)
- 8/8 live `judicial-*` topics have `fc_community_slug` set
- `judicial_role` distribution: 4 rows `NULL` (universal), 2 `judge`, 2 `city_attorney_da`

## Summary

All four must-haves are fully verified. The frontend routing correctly funnels JUDICIAL district_type profiles to `JudicialCompassSection` in both `Profile.jsx` and `CandidateProfile.jsx`. Sub-role filtering logic in `JudicialCompassSection` correctly produces 6 topics for both judge and city_attorney_da sub-roles and 8 topics for the null/unknown fallback. The backend `compassService.ts` includes `judicial_role` in its SELECT, ensuring the field reaches the frontend. All 8 companion Focused Communities exist in the DB with authored descriptions, and all 8 judicial compass topics have `fc_community_slug` populated.

---

_Verified: 2026-05-07_
_Verifier: Claude (gsd-verifier)_
