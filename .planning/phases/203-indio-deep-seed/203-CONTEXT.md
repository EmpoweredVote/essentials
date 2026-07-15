# Phase 203: Indio Deep-Seed - Context

**Gathered:** 2026-07-13 (updated; original recon compiled 2026-07-12)
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep-seed the **City of Indio, CA** (geo_id `0636448`) so any Indio address routes to the
correct district councilmember and the city surfaces with an evidence-only compass.

Unit of work (locked pattern, same shape as Phases 201/202):
government (WHERE NOT EXISTS) + City Council chamber → 5 district X-geofences → roster
(rotational Mayor/MPT as **seat titles**, not separate LOCAL_EXEC rows) → 600×750 headshots →
evidence-only stances (ONE agent at a time, all live topics, 100% cited, no defaults, honest
blanks) → licensed banner (one at a time) → surface in `src/lib/coverage.js` → split-section
check (expect 0).

**Out of scope:** at-large seat (none exists), constitutional/appointed officers, school
boards, legislative stances — consistent with the Coachella Valley track.

</domain>

<decisions>
## Implementation Decisions

### Banner sourcing
- **D-01:** Source an **Indio-specific licensed photo** — do NOT reuse the Coachella Valley /
  Mission Inn banner used in Phases 201 & 202. Addresses the open city-banner follow-up.
- **D-02:** Preferred subject = **Old Town / downtown Indio streetscape** (reads clearly as a
  city). Date-palm / festival-heritage imagery is an acceptable second choice if a clean
  downtown photo isn't licensable.
- **D-03:** Real photo only — **no AI, no aerial/satellite**. Source **one at a time**
  (sequential, per banner-sourcing quota rule). Reuse the CV banner only as a last resort if
  nothing usable/licensable is found.

### Roster
- **D-04:** Keep the Dec-2025 post-rotation roster (below) as the working table, but the
  executor **MUST reconfirm each member live** against a primary source (indio.civicweb.net /
  indio.org) before seeding — do not seed from the table alone.
- **D-05:** **Rotational mayor** — Council selects Mayor + Mayor Pro Tem from members each
  December. Apply the **by-district relabel pattern**: Mayor/MPT are titles on their district
  seats, NOT separate rows.
- **D-06:** Reconfirm **Benjamin Guitron IV** full name against the live profile (CivicWeb
  lists "IV"; some snippets show only "Benjamin"). Part of the D-04 live reconfirm.

Working roster (verify at execute time):
| District | Full name | Title |
|---|---|---|
| 1 | Glenn Miller | Councilmember (outgoing Mayor, passed gavel Dec 2025) |
| 2 | Waymond Fermon | **Mayor Pro Tem** |
| 3 | **Elaine Holmes** | **Mayor** (selected Dec 2025; prior mayoral terms 2013/2017/2021) |
| 4 | Oscar Ortiz | Councilmember |
| 5 | Benjamin Guitron IV | Councilmember ⚠ reconfirm full name |

### Geofences (5 council-district X-polygons)
- **D-07:** **Primary source = city self-hosted ArcGIS REST** —
  `https://gis.indio.org/arcgis/rest/services/`. Find the Boundaries/Districts
  FeatureServer/MapServer layer, pull `?f=geojson`.
- **D-08:** **Cross-check:** feature count = 5 and a district-number attribute is present.
  Districts defined by **Ordinance No. 1775** (Official Council District Map).
- **D-09:** **Fallback only** (if ArcGIS layer missing/unusable): digitize from the Ord. 1775
  PDF (behind WAF at /departments/city-manager/city-maps).
- Only NEW geofences needed = these 5 X-prefixed polygons. The Indio **city** boundary is
  already loaded (TIGER 2024, `state='06'`): geo_id `0636448`, mtfcc `G4110`.

### Headshots (indio.org returns WAF-403)
- **D-10:** **Primary source = `indio.civicweb.net/portal/members.aspx?id=10`** (responded to
  bots in recon; carries member photos).
- **D-11:** For gaps, hit **indio.org CivicPlus StaffDirectory** (component id 38, e.g. Holmes =
  /Home/Components/StaffDirectory/StaffDirectory/38/181) via **Browser-UA / Playwright** to get
  past the CivicPlus WAF.
- **D-12:** Pipeline: **4:5 crop FIRST → 600×750 Lanczos q90**, `press_use`, `type='default'`.

### DB pre-check (read-only, 2026-07-12)
- **Greenfield**: no `essentials.governments` row for Indio → seed `WHERE NOT EXISTS`.

### Claude's Discretion
- Exact banner photo selection within the Old Town/downtown preference (subject to licensing +
  no-AI/no-aerial constraints).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Structure & prior-phase pattern
- `.planning/phases/202-palm-springs-deep-seed/202-CONTEXT.md` — immediately-prior CV city
  deep-seed; same by-district + rotational-mayor shape.
- `.planning/phases/201-riverside-county-bos-deep-seed/201-CONTEXT.md` — CV track opener
  (X0021 geofences, banner precedent).
- `.planning/ROADMAP.md` §"Appended: Coachella Valley, CA (Phases 201-203)" and §"Phase 203:
  Indio Deep-Seed" — goal, depends-on, success criteria (CV-03, BANR-01).

### Code
- `src/lib/coverage.js` — surfacing / browse-chip registration for the seeded city.

### External sources (verify current at execute time)
- `https://indio.civicweb.net/portal/members.aspx?id=10` — headshots (primary).
- `https://indio.org/departments/city-council/meet-your-representatives` — StaffDirectory
  (403 to bots; Browser-UA/Playwright).
- `https://gis.indio.org/arcgis/rest/services/` — district geofences (ArcGIS REST).
- ArcGIS Experience map portal: `experience.arcgis.com/experience/c7f7f2efba5f4f2fabd9210b3ceafa4e`
- `ballotpedia.org/Indio,_California` — roster/structure cross-check.
- `theindiopost.com` — Holmes Dec-2025 mayoral installation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **By-district relabel pattern** (project memory `project_by_district_relabel_pattern`):
  relabel seats to occupants; rotational mayor = title on seat.
- **Coachella Valley track precedents** (201/202): X-geofence loading, ext_id ranges, banner
  storage no-cache overwrite, split-section check SQL.
- `src/lib/coverage.js` COVERAGE surfacing block (browse chip committed for prior CV cities).

### Established Patterns
- Evidence-only stances: ONE agent at a time, all live compass topics, 100% cited, honest
  blanks, never default a stance (project memory feedback).
- Headshot sizing 600×750 (4:5, Lanczos, q90); crop only, eyes ~1/3 from top.
- Verify-greps forbid forbidden tokens in comments too (GOTCHA from Ph202).

### Integration Points
- New government row + City Council chamber; 5 X-geofences; roster seats; coverage chip;
  split-section check must return 0.

</code_context>

<specifics>
## Specific Ideas

- Indio = "City of Festivals" / date-growing capital — heritage imagery available but the
  banner should read as a **city** (Old Town / downtown streetscape) first.
- Council moved from at-large to by-district in the late-2010s to settle a CVRA challenge —
  there is **no at-large seat**.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (School boards, legislative stances, and
constitutional officers remain deferred per the CV track, not raised here.)

</deferred>

---

*Phase: 203-indio-deep-seed*
*Context gathered: 2026-07-13*
