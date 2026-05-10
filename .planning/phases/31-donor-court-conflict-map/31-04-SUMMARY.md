---
phase: 31-donor-court-conflict-map
plan: "04"
subsystem: profile-ui
tags: [backend, frontend, campaign-finance, legal, react, typescript, express]
completed: 2026-05-09
duration: ~25 minutes

decisions:
  - id: D1
    decision: Pivoted from Donor-Court Conflicts (original 31-04) to Legal Donor Activity (Option C)
    rationale: Original plan required manual lacourt.org court research; Option C shows only firm-grouped donor data — simpler, no migration, immediate value
    impact: No DB migration; contributions queried at runtime; no conflict computation
  - id: D2
    decision: isLegalCandidate derived at render time from pol state rather than in useEffect only
    rationale: useEffect computed it internally but render tree couldn't access it; derived from same pol object already in state
    impact: Minor CandidateProfile.jsx change; no extra API call; clean render gate
  - id: D3
    decision: LIMIT 50 on legal donor firms query
    rationale: Some candidates (Feldstein Soto) have 200+ distinct legal employer values; top 50 by donation amount is sufficient for voter context
    impact: Endpoint always fast; zero pagination needed for MVP

key-files:
  created:
    - C:/Transparent Motivations/essentials/src/components/LegalDonorActivitySection.jsx
  modified:
    - C:/EV-Accounts/backend/src/lib/essentialsProfileService.ts
    - C:/EV-Accounts/backend/src/routes/essentialsPoliticians.ts
    - C:/Transparent Motivations/essentials/src/lib/api.jsx
    - C:/Transparent Motivations/essentials/src/pages/CandidateProfile.jsx
---

# Phase 31 Plan 04: Legal Donor Activity Summary

**One-liner:** Runtime-queried legal donor firm section for judicial/city attorney profiles — occupation-filtered, firm-grouped, displayed as sorted card list.

## What Was Built

### API Endpoint

`GET /api/essentials/politicians/:id/legal-donor-activity`

- Queries `transparent_motivations.contributions` joined to `politician_sources` at runtime
- Filters to donations where `contributor_occupation` / `con_occp` matches legal keywords (attorney, lawyer, counsel, partner, esquire, esq, solicitor, litigator, paralegal, public defender, district attorney, prosecutor)
- Groups by normalized employer (`contributor_employer` / `con_empr`, fallback `'Unknown Firm'`)
- Sorts by `total_donated DESC`, `LIMIT 50`
- Returns `occupations_seen[]` (aggregated distinct occupation strings per firm)
- No migration needed — pure read against existing contributions data

**Sample response (Ashouri, 0f6484bd-2fc1-4071-9648-d7b8a950d29c):**
```json
{
  "politician_id": "0f6484bd-2fc1-4071-9648-d7b8a950d29c",
  "firms": [
    {
      "firm_name": "Life Sciences Patent Law Firm",
      "total_donated": 300,
      "donor_count": 1,
      "occupations_seen": ["ATTORNEY"]
    },
    {
      "firm_name": "Goodwin Procter",
      "total_donated": 143,
      "donor_count": 1,
      "occupations_seen": ["ATTORNEY"]
    }
  ],
  "total_legal_donors": 8
}
```

### Backend Service

`getLegalDonorFirms(politicianId)` in `essentialsProfileService.ts`:
- Exports `LegalDonorFirm` and `LegalDonorActivityResult` interfaces
- `total_donated` cast to `float8` so JSON serializes as number not Decimal string
- Returns `{ politician_id, firms: [], total_legal_donors: 0 }` on zero rows

### Frontend Component

`LegalDonorActivitySection.jsx`:
- Props: `{ politicianId }`
- Fetches on mount via `fetchLegalDonorActivity()`; returns `null` while loading (silent)
- **Zero state**: heading + subheading + "No legal professional donor data available for this candidate."
- **With firms**: card list sorted by `total_donated DESC`
  - Firm name (raw, no normalization shown)
  - Total donated formatted as `$X,XXX`
  - Donor count with plural handling
  - Occupation tags (up to 3 visible + "+N more" overflow badge)
  - Footer note "Showing top 50 by amount donated." if `firms.length === 50`
- Neutral teal accent (`#1a6b5e`) — no amber/conflict coloring

### Profile Page Integration

`CandidateProfile.jsx` renders section between `BarEvaluationSection` and `CampaignFinanceSection`:

```jsx
<BarEvaluationSection judicialRecord={judicialRecord} />
{polId && isLegalCandidate && (
  <LegalDonorActivitySection politicianId={polId} />
)}
{polId && (
  <div className="mt-6">
    <CampaignFinanceSection politicianId={polId} />
  </div>
)}
```

**isLegalCandidate gate:**
```js
const isLegalCandidate = (
  pol?.district_type === 'JUDICIAL' ||
  pol?.district_type === 'NATIONAL_JUDICIAL' ||
  (pol?.office_title || '').toLowerCase().includes('city attorney') ||
  (pol?.office_title || '').toLowerCase().includes('district attorney')
);
```

Section is hidden on all non-legal candidate profiles (city council, state leg, federal, etc).

## Commits

| Repo     | Commit  | Message                                                              |
|----------|---------|----------------------------------------------------------------------|
| Backend  | 43c757b | feat(31-04): add getLegalDonorFirms service + legal-donor-activity route |
| Frontend | e466d42 | feat(31-04): add LegalDonorActivitySection for legal candidate profiles  |

## Deploy Status

- Backend: pushed to `master` → Render auto-deploy; smoke tested `/api/essentials/politicians/0f6484bd-.../legal-donor-activity` → 200 with firms array
- Frontend: pushed to `main` → Render auto-deploy triggered

## Deviations from Plan

None — plan executed exactly as written. `isLegalCandidate` was already computed inside `useEffect` for the `judicialRecord` fetch gate; it was also derived at render time (same expression, same `pol` state object) to serve as the JSX render gate — this is the natural React pattern, not a deviation.

## Next Phase Readiness

Phase 31 (Donor-Court Conflict Map) is complete:
- Plan 01: Identify legal donors — done
- Plan 02: Court research — skipped (Option C pivot)
- Plan 03: Migration 122 + loader — skipped (Option C pivot)
- Plan 04: Legal Donor Activity UI — done

Next work for the legal profile area: none scheduled. Migration 122 remains unassigned.
