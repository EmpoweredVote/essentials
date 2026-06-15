# Requirements: v14.0 MA Tier 3 City Coverage

**Defined:** 2026-06-14
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## NEWTON — Newton Deep Seed

- [ ] **NEWTON-01:** A Newton address returns a LOCAL section showing Mayor + Board of Aldermen (or City Council) + School Committee members with correct offices linked to geo_id=2545560
- [ ] **NEWTON-02:** All Newton elected officials (Mayor + council + school committee) have headshots at 600×750 in Supabase Storage (politician_photos bucket); best-effort where official photos unavailable online
- [x] **NEWTON-03:** Compass shows evidence-only stance data for Newton Mayor + council members; sequential research, 100% citation rate, no blank-default values

## SOMERVILLE — Somerville Deep Seed

- [x] **SOMERVILLE-01:** A Somerville address returns a LOCAL section showing Mayor + City Council + School Committee members with correct offices linked to geo_id=2562535
- [x] **SOMERVILLE-02:** All Somerville elected officials have headshots at 600×750 in Supabase Storage; best-effort where official photos unavailable online
- [x] **SOMERVILLE-03:** Compass shows evidence-only stance data for Somerville Mayor + City Councillors; sequential research, 100% citation rate

## LYNN — Lynn Deep Seed

- [ ] **LYNN-01:** A Lynn address returns a LOCAL section showing Mayor + City Council members with correct offices linked to geo_id=2537490
- [ ] **LYNN-02:** Lynn elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage
- [x] **LYNN-03:** Compass shows evidence-only stance data for Lynn Mayor + Council; sequential research, 100% citation rate

## NEWBED — New Bedford Deep Seed

- [ ] **NEWBED-01:** A New Bedford address returns a LOCAL section showing Mayor + City Council members with correct offices linked to New Bedford's geo_id
- [ ] **NEWBED-02:** New Bedford elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage
- [x] **NEWBED-03:** Compass shows evidence-only stance data for New Bedford Mayor + Council; sequential research, 100% citation rate

## FALLRIV — Fall River Deep Seed

- [ ] **FALLRIV-01:** A Fall River address returns a LOCAL section showing Mayor + City Council members with correct offices linked to Fall River's geo_id
- [ ] **FALLRIV-02:** Fall River elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage
- [ ] **FALLRIV-03:** Compass shows evidence-only stance data for Fall River Mayor + Council; sequential research, 100% citation rate

## MEDFORD — Medford Deep Seed

- [ ] **MEDFORD-01:** A Medford address returns a LOCAL section showing Mayor + Board of Aldermen (or City Council) + School Committee members with correct offices linked to Medford's geo_id
- [ ] **MEDFORD-02:** Medford elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage
- [ ] **MEDFORD-03:** Compass shows evidence-only stance data for Medford Mayor + Aldermen/Council; sequential research, 100% citation rate

## WALTHAM — Waltham Deep Seed

- [ ] **WALTHAM-01:** A Waltham address returns a LOCAL section showing Mayor + City Council members with correct offices linked to Waltham's geo_id
- [ ] **WALTHAM-02:** Waltham elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage
- [ ] **WALTHAM-03:** Compass shows evidence-only stance data for Waltham Mayor + Council; sequential research, 100% citation rate

## MA-RETRO — Playbook Retrospective

- [ ] **MA-RETRO-02:** LOCATION-ONBOARDING.md updated with any MA Tier 3 city GOTCHAs (smaller city patterns, headshot sources, government structure variations); 7 new rows added to the Cities Onboarded table

---

## Future Requirements

<!-- Not in this milestone. -->

- School board deep seeds for Tier 3 cities (Newton/Somerville/Lynn/New Bedford/Fall River/Medford/Waltham school committees at G5420 depth)
- Compass UI fixes — spoke accordion, min/max buttons, label sizing, Empowered Compass-style tooltips
- MA Tier 4 cities (under 50k population)
- 2026 city-level election races if any MA Tier 3 city holds elections that cycle

## Out of Scope

- New state or federal coverage — v14.0 is MA-only
- Compass UI changes — deferred; data milestone only
- MA town governments (COUSUB tier) — geofences loaded in v13.0; officials deferred
- Stance research for MA state/federal officials — completed in v13.0 (217 officials)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NEWTON-01 | 117 | ⬜ |
| NEWTON-02 | 117 | ⬜ |
| NEWTON-03 | 122 | ✅ |
| SOMERVILLE-01 | 118 | ✅ |
| SOMERVILLE-02 | 118 | ✅ |
| SOMERVILLE-03 | 122 | ✅ |
| LYNN-01 | 119 | ⬜ |
| LYNN-02 | 119 | ⬜ |
| LYNN-03 | 123 | ✅ |
| NEWBED-01 | 120 | ⬜ |
| NEWBED-02 | 120 | ⬜ |
| NEWBED-03 | 123 | ✅ |
| FALLRIV-01 | 121 | ⬜ |
| FALLRIV-02 | 121 | ⬜ |
| FALLRIV-03 | 124 | ⬜ |
| MEDFORD-01 | 121 | ⬜ |
| MEDFORD-02 | 121 | ⬜ |
| MEDFORD-03 | 124 | ⬜ |
| WALTHAM-01 | 121 | ⬜ |
| WALTHAM-02 | 121 | ⬜ |
| WALTHAM-03 | 124 | ⬜ |
| MA-RETRO-02 | 125 | ⬜ |
