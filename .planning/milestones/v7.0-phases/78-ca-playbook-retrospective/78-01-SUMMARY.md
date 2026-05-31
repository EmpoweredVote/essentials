---
plan: 78-01
phase: 78-ca-playbook-retrospective
status: complete
completed: 2026-05-29
---

## Summary

Updated LOCATION-ONBOARDING.md with all California-specific GOTCHAs discovered during the v7.0 milestone (Phases 57–70), a California Quick Reference block, 7 new Cities Onboarded rows, and 5 new Step 7 pitfall rows.

## Key Artifacts

- **LOCATION-ONBOARDING.md** — primary deliverable; updated from 373 to 424 lines (+51)

## Deliverable Details

### Cities Onboarded Table (7 new rows)

| Row | City | Onboarded |
|-----|------|-----------|
| 1 | California (state) | 2026-05-21 |
| 2 | San Francisco | 2026-05-22 |
| 3 | San Jose | 2026-05-23 |
| 4 | San Diego | 2026-05-22 |
| 5 | Sacramento | 2026-05-28 |
| 6 | Fremont | 2026-05-22 |
| 7 | Berkeley | 2026-05-22 |

Order: chronological by onboarding date (CA state → SF → San Jose → San Diego → Sacramento → Fremont → Berkeley).

### California Quick Reference Block

Inserted as `## California Quick Reference` H2 section immediately after the Cities Onboarded table `---` separator and before `## Step 1: Government Structure Research`. Contains an 11-row trap table with columns: Trap | See Step | One-Line Summary.

### CA GOTCHAs — Inline Placements (CA-1 through CA-11)

| GOTCHA | Step | Format |
|--------|------|--------|
| CA-1: Pre-existing CA seed | Step 1 (Required Questions) | New `> [GOTCHA]` |
| CA-2: districts.state='CA' uppercase | Step 3 (districts.state casing GOTCHA) | Annotation appended |
| CA-3: mtfcc swap (G5220/G5210) | Step 3 (after districts.state GOTCHA) | New `> [GOTCHA]` |
| CA-4: External ID range collision | Step 5 (after senator uniqueness GOTCHA) | New `> [GOTCHA]` |
| CA-5: DataSF vs ArcGIS outSR | Step 3 (after COUSUB GOTCHA) | New `> [GOTCHA]` |
| CA-6: SF consolidated city-county | Step 3 (after CA-5) | New `> [GOTCHA]` |
| CA-7: CA COUSUB = CCDs | Step 3 (Maine COUSUB GOTCHA) | Annotation appended |
| CA-8: CA jungle primary | Step 2 (after RCV GOTCHA) | New `> [GOTCHA]` |
| CA-9: RCV at seed time | Step 2 (RCV GOTCHA) | Annotation appended |
| CA-10: AEM/CQ5 headshots | Step 4 (after Cambridge example) | New `> [GOTCHA]` |
| CA-11: lavote.gov election ID | Step 2 (after jungle primary GOTCHA) | New `> [GOTCHA]` |

Also inserted CA-1 second callout in Step 5 (pre-existing seed reminder for schema phase). Total `[STATE-SPECIFIC: CA]` count: 12 (all 11 required + 1 from Step 5 second callout).

### Step 7 Pitfall Table (5 new rows)

- `| CA jungle primary modeled as separate D/R primaries |`
- `| CA pre-existing seed silently duplicated |`
- `| ArcGIS outSR=4326 omitted for CA city boundaries |`
- `| AEM/CQ5 CMS headshots not extractable by WebFetch |`
- `| CA external_id range -1000xx occupied |`

### Verification Results

All acceptance criteria passed:
- `STATE-SPECIFIC: CA` count: 12 (≥11 required)
- California Quick Reference: exactly 1 occurrence
- All 7 Cities Onboarded rows present
- All 5 new pitfall rows present
- CA-1 SQL pre-check string present (`SELECT id, geo_id FROM essentials.governments`)
- CA-8 sos.ca.gov authoritative source present
- CA-10 curl+grep command present (`grep -o 'background-image:url`)
- CA-11 lavote.gov present
- Cambridge content preserved (Cambridge still present, cd119 present)
- Maine officials preserved (Frey/Bellows still present)
- Final line count: 424 (>373 baseline)

### Deviations

None. All 11 GOTCHAs placed per the RESEARCH.md placement map. CA-1 has two callouts (Step 1 and Step 5) as planned. CA-2, CA-7, CA-9 are annotations; all others are new `> [GOTCHA]` blockquotes.

## Self-Check: PASSED

All tasks complete, commit created, verification passed.
