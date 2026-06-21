# Phase 149: Pasadena Deep-Seed — Research

**Researched:** 2026-06-20
**Domain:** Pasadena, CA city council reconcile + by-district relabel + headshots + evidence-only stances
**Confidence:** HIGH (DB state DB-verified in CONTEXT.md 2026-06-20; city website NO WAF confirmed; full
7-district roster confirmed via official cityofpasadena.net; June 2026 election results confirmed via LAist +
Pasadena Now; Measure H rent control existence confirmed via official city Rent Stabilization Dept page)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0656000'` on gov `d25619a9`
  (guard `geo_id IS NULL OR geo_id=''`), then merge the two duplicate 'City Council' chambers
  (`2e7f01d0` official_count 8 + `bdd1acad` official_count NULL) into ONE chamber via move-then-delete
  (target by UUID). Wave-1 pre-flight re-confirms both chamber UUIDs, the 8 offices, the roster, and the
  duplicate/defect set before any write.
- **D-05 (cleanup in Wave 1):** Dedupe Jason Lyon's extra image row (657582 has 2 `politician_images`; keep
  exactly one canonical). Ensure Jess Rivas (-700150, office `7bdb4f77`, 0 images/0 stances) is correctly
  linked.
- **D-02 (relabel At-Large → District 1–7):** Relabel the existing wrongly-'At-Large' council district rows
  to `District 1`…`District 7` (LOCAL) and map each seated member to their real district. Keep the
  directly-elected Mayor on the existing `Pasadena Mayor` LOCAL_EXEC district (Victor Gordo, office
  `fc5e372a`). No rebuild.
- **D-03 (current-seated, retire departed):** Verify the roster against the official Pasadena site and seat
  whoever holds each seat today. For any departed member: unlink the office (null the office↔politician link
  / reassign) but keep their politician + stance + photo rows. Mayor Victor Gordo (-200901) verified current
  at research time.
- **D-04 (direct-first, operator fallback):** Try direct curl from cityofpasadena.net official portraits
  first. Every portrait: identity-verified, 4:5 crop first → 600×750 Lanczos q90, uploaded to
  `politician_photos/{uuid}-headshot.jpg`, `type='default'`, `photo_license` matching real source.
- **Stances:** Evidence-only CHAIRS model; 100% citation; no judicial-* topics (appointed City Attorney);
  live non-judicial topics queried at apply time; ONE research agent at a time; no defaulted/neutral values;
  honest blank spokes; blocking human-verify checkpoint.
- **Migration ledger:** Structural migrations register in schema_migrations; headshot + stance = audit-only.
  Next migration ≈ 946 (pre-flight must re-confirm live MAX + on-disk counter before numbering).

### Claude's Discretion
- Exact district→member mapping (research-determined); per-member stance chairs; dedupe mechanics; precise
  reconcile SQL ordering (follow the 147/148 idempotent patterns).

### Deferred Ideas (OUT OF SCOPE)
- Split-section defect sweep for the 5 known LA-area cities (`project_split_section_defects_5_cities`) —
  run Pasadena's own split-section check post-reconcile (expect 0 rows), but the other 5 cities are OOS.
- Phase 157 (Wave-2 close-out) — consumes Pasadena's final per-city counts after all 15 cities seeded.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PASA-01 | Pasadena (0656000) deep-seeded — government + roster + headshots + evidence-only stances | Reconcile confirmed; 7-district directly-elected-mayor structure verified; NO WAF on cityofpasadena.net (all 8 portraits HTTP 200); Measure H rent control DOES exist — rent-regulation topic is live for Pasadena; June 2026 election incumbents all held (D3 Jones / D5 Rivas / D7 Lyon re-elected); D2 Cole + D4 Masuda + D6 Madison + D1 Hampton all current; roster FULLY CONFIRMED; 0 stances DB-confirmed (full research needed) |
</phase_requirements>

---

## Summary

Phase 149 is a reconcile+complete of a partial, structurally-defective Pasadena seed, following the same LA
County Wave-2 playbook as Phases 142–148. Pasadena shares the key structural features of Pomona/Torrance:
a **directly-elected citywide Mayor** (Victor Gordo, LOCAL_EXEC model already correctly modeled in DB) and
**seven single-member council districts** (D1-D7). The CONTEXT.md DB state is confirmed: 8 offices in two
duplicate chambers, all council rows wrongly labeled At-Large.

The **full current roster is confirmed** as of June 2026: Mayor Gordo + D1 Hampton + D2 Cole + D3 Jones +
D4 Masuda + D5 Rivas + D6 Madison + D7 Lyon. D3, D5, and D7 just stood for re-election June 2 2026 — all
three incumbents held. D2, D4, D6, and D1 were elected in the March 2024 primary (Cole replaced Felicia
Williams; Masuda and Madison were re-elected; Hampton was re-elected).

A critical DB/roster mismatch exists: DB external_ids 657581 (Steve Madison) and 657579 (Gene Masuda) are
labeled correctly by person — but the districts will need to be relabeled to the RIGHT district numbers.
Additionally, **Tyron Hampton (-201094)** currently sits in the DOOMED chamber (`bdd1acad`, At-Large) and
needs to move to the survivor; he represents D1. The DB member **Rick Cole (657577)** who is the new D2 rep
replaced Felicia Williams — the question of whether the DB's "Cole" row is Rick Cole (the current D2 member
sworn in December 2024) must be confirmed in pre-flight: if it is the same Rick Cole with the same
politician_id, just repair his link; if the DB row predates his 2024 election, confirm current seating.

Headshot situation is the best yet: **cityofpasadena.net has NO WAF**. All 8 official portrait URLs (Mayor +
D1-D7) returned HTTP 200 in direct curl testing (2026-06-20). Every image is at a `wp-content/uploads/sites/`
WordPress path on the district subdomain. Rivas (D5) has 0 existing images and needs a new upload; Lyon (D7)
has a duplicate image row to clean up.

Pasadena is the first Wave-2 city with active **rent control** (Measure H, effective December 22, 2022) — the
`rent-regulation` compass topic is potentially applicable and should NOT be auto-blanked as it was for Torrance
(which has no RSO). Evidence for per-member stances on Measure H implementation, RSO oversight, and housing
element updates is available through Pasadena Now, LAist, and the Granicus/ww2.cityofpasadena.net agenda
archives.

**Primary recommendation:** Execute as 4 waves mirroring Pomona 147 — Wave 1 reconcile (geo_id + chamber
merge [move Hampton's office from doomed chamber + merge all doomed offices into survivor] + district
relabels D1-D7 + Lyon image dedupe), Wave 2 roster (bidirectional link repairs + confirm each member in their
correct district + official_count=7), Wave 3 headshots (all 8 officials, NO-WAF direct curl), Wave 4 stances
(8 officials, one at a time, non-judicial topics, rent-regulation applies).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber reconcile | Database / Storage | — | SQL migrations via psql + mcp__supabase-local; no frontend change |
| District relabeling (At-Large → D1-D7) + creation | Database | — | UPDATE existing rows + INSERT any missing district rows |
| Roster repair (bidirectional links) + Hampton move from doomed chamber | Database | — | UPDATE offices + politicians rows; doomed chamber office must be moved before chamber delete |
| Mayor seat (LOCAL_EXEC) — already modeled | Database | — | "Pasadena Mayor" district + Gordo office fc5e372a already exist; just consolidate |
| Lyon duplicate image dedupe | Database | — | DELETE the stale politician_images row for Lyon; keep canonical |
| Headshot processing | Local Bash + Pillow | Supabase Storage | curl from cityofpasadena.net (NO WAF) → crop 4:5 → resize 600×750 Lanczos q90 → Storage upload → politician_images INSERT |
| Evidence-only stances | Research agent (one at a time) | Database | Agent mines sources; outputs SQL applied via psql |
| UI rendering | None (existing) | — | Pasadena renders on existing browse/compass UI; Landing.jsx surfacing is Phase 157 |

---

## Live-Data Findings

### 1. Form of Government — CONFIRMED (HIGH confidence)

**Charter City with council-manager form of government.** The City Council sets policy and hires the City
Manager. The City Manager is the chief administrative officer. [VERIFIED: cityofpasadena.net/government/]

**Directly-elected Mayor (citywide, 4-year term):** The Mayor is elected by all registered voters of
Pasadena. Victor M. Gordo has been Mayor since November 2020 (won re-election in the March 5, 2024 primary).
This is the Lancaster/Pomona LOCAL_EXEC model — NOT the Glendale/Palmdale rotational council-selected model.
[VERIFIED: cityofpasadena.net/mayor/]

**Seven by-district councilmembers:** Districts 1-7, each single-member. Confirmed form from official site.
[VERIFIED: cityofpasadena.net/mayor/all-districts/]

**No judicial topics:** The City Attorney is an APPOINTED position — Michele Beal Bagneris, appointed by the
City Council in 1997, currently serving. NOT elected. [VERIFIED: cityofpasadena.net/city-attorney/bio/]

**Vice Mayor:** Jess Rivas (D5) is the current Vice Mayor (January 2025 designation). This is a rotating
council TITLE, not a separate office or district. Do NOT create a Vice Mayor district row.
[VERIFIED: cityofpasadena.net/district5/; pasadenanow.com/main/rivas-becomes-vice-mayor-new-city-council-sworn-in]

### 2. Current Roster — CONFIRMED (HIGH confidence, 2026-06-20)

**June 2, 2026 election:** D3, D5, and D7 were on the June 2 ballot. All three incumbents won:
- D3 Justin Jones: won with 76.33% (1,635 ballots)
- D5 Jess Rivas: ran unopposed, 100% (1,867 ballots)
- D7 Jason Lyon: won with 82.93% (3,041 ballots)

[VERIFIED: LAist laist.com/news/politics/voter-guides/2026-election-california-primary-pasadena-city-council-districts-3-5-7;
Pasadena Now pasadenanow.com/main/no-surprises-in-local-city-council-elections-as-incumbents-sweep]

**March 5, 2024 primary results (D2, D4, D6, Mayor, + D1 per-cycle):**
- Mayor Victor Gordo: re-elected 2024 [CITED: pasadenanow.com Gordo/Cole/Jones/Masuda lead early results]
- D1 Tyron Hampton: re-elected 2024 [CITED: Ballotpedia Tyron Hampton Pasadena 2024]
- D2 Rick Cole: won with 60% replacing Felicia Williams; sworn in December 9, 2024 [CITED: pasadenanow.com/main/councilmember-cole-ceremoniously-sworn-in-before-community; coloradoboulevard.net/meet-the-new-pasadena-city-council]
- D4 Gene Masuda: re-elected 2024 (69.93%, incumbents first returns); 4th term [CITED: pasadenanow.com/main/masuda-qualifies-for-district-4-election]
- D6 Steve Madison: re-elected 2024 unopposed (100%); first elected 1999; consistent District 6 rep [CITED: coloradoboulevard.net/meet-the-new-pasadena-city-council]

**No departed members.** All 7 council seats and Mayor are occupied by current, confirmed seated officials.
No one needs to be "unlinked" (Whittier/Santa Monica pattern). All 8 DB politician rows (Gordo, Hampton,
Cole, Masuda, Jones, Rivas, Lyon, Madison) represent CURRENT seated officials. Wave 2 is roster repair only
(link fixes) — no create-new or unlink-departed operations needed.

### 3. District → DB Member Mapping (AUTHORITATIVE, HIGH confidence)

Cross-referencing the official site roster with CONTEXT.md DB state:

| District | Current Member | DB ext_id | DB office UUID | DB chamber | Action |
|----------|---------------|-----------|----------------|------------|--------|
| Mayor (LOCAL_EXEC) | Victor M. Gordo | -200901 | fc5e372a | bdd1acad (DOOMED → move) | Move to survivor; keep LOCAL_EXEC |
| District 1 | Tyron Hampton | -201094 | 0c357b48 | bdd1acad (DOOMED → move) | Move to survivor; relabel district At-Large→D1 |
| District 2 | Rick Cole | 657577 | 7ab2730c | 2e7f01d0 (SURVIVOR) | Repair bidirectional link; relabel district→D2 |
| District 3 | Justin Jones | 657578 | e3617ff5 | 2e7f01d0 (SURVIVOR) | Repair bidirectional link; relabel district→D3 |
| District 4 | Gene Masuda | 657579 | 0bc62efd | 2e7f01d0 (SURVIVOR) | Repair bidirectional link; relabel district→D4 |
| District 5 | Jess Rivas | -700150 | 7bdb4f77 | 2e7f01d0 (SURVIVOR) | Repair bidirectional link; relabel district→D5; upload headshot (0 images) |
| District 6 | Steve Madison | 657581 | f2cb13dd | 2e7f01d0 (SURVIVOR) | Repair bidirectional link; relabel district→D6 |
| District 7 | Jason Lyon | 657582 | 0cd97f4e | 2e7f01d0 (SURVIVOR) | Repair bidirectional link; relabel district→D7; dedupe images (has 2) |

**Key findings:**
- The DB ext_ids 657577 (Cole), 657578 (Jones), 657579 (Masuda), 657581 (Madison), 657582 (Lyon) all
  match the correct current council members per the official site. No roster turnover surprises.
- Rick Cole (657577) won D2 in March 2024 to replace Felicia Williams. The DB ext_id 657577 may have been
  the original seed under the prior D2 member's slot. Pre-flight must confirm: is the DB politician
  row ext_id=657577 currently showing as Rick Cole by name? If it shows Felicia Williams, it must be updated
  to Rick Cole's name/data. This is the ONLY potential name-refresh risk in the roster.
- Hampton and Gordo are in the DOOMED chamber `bdd1acad` — their offices must be MOVED to the survivor
  `2e7f01d0` as part of the move-then-delete wave 1 operation.
- The doomed chamber `bdd1acad` contains exactly 2 offices: Gordo (LOCAL_EXEC Mayor) + Hampton (D1).
  Both must be moved before the chamber is deleted.
- The survivor chamber `2e7f01d0` currently holds 6 offices (Rivas + Cole + Masuda + Jones + Madison +
  Lyon). After moving Gordo + Hampton: 8 offices total in survivor (all council + Mayor).
  `official_count` should be updated to 7 (council seats only, per prior pattern — Mayor in LOCAL_EXEC
  does not count in official_count).

**No departed members to unlink.** All 8 politician rows are current. This is cleaner than Torrance/Pomona.

### 4. DB State — Pre-Flight Targets (from CONTEXT.md, HIGH confidence)

| Element | Value | Notes |
|---------|-------|-------|
| gov id | d25619a9-7276-4e8b-b7ae-8028e408aee0 | "City of Pasadena, California, US" |
| gov geo_id | NULL | Needs backfill to '0656000'; use `WHERE geo_id IS NULL OR geo_id = ''` guard |
| gov state | CA | Already correct |
| Chamber SURVIVOR | 2e7f01d0-69dd-4301-b24c-58d83eb19f47 | official_count=8; 6 offices: Rivas/Cole/Masuda/Jones/Madison/Lyon |
| Chamber DOOMED | bdd1acad-f22d-4fa3-8ab5-667eed0e3d82 | official_count=NULL; 2 offices: Gordo (Mayor/LOCAL_EXEC) + Hampton (At-Large) |
| Offices to MOVE from doomed to survivor | fc5e372a (Gordo/Mayor) + 0c357b48 (Hampton) | 2 offices (simpler than Pomona's 3); move ALL before assert+delete |
| District rows | 6 At-Large LOCAL rows in survivor + 1 "Pasadena Mayor" LOCAL_EXEC | 6 At-Large must be relabeled D1-D6; D7 may need CREATE (see §5) |
| Lyon images | 2 politician_images rows for 657582 | Dedupe: keep 1 canonical; DELETE the stale duplicate |
| Rivas images | 0 | Needs headshot upload in Wave 3 |
| Stances | 0 for ALL 8 members | Full Wave 4 research needed |
| schema_migrations MAX (pre-phase) | 937 (structural; 938-945 are audit-only) | Torrance ended at 937 structural; on-disk max is 945 |
| Next structural migration | **946** | Pre-flight must re-confirm on-disk MAX |

### 5. District UUID Mapping and Reconcile Plan (MEDIUM-HIGH confidence)

The CONTEXT.md confirms 6 At-Large district rows currently in the survivor chamber and 1 "Pasadena Mayor"
LOCAL_EXEC row. Pasadena has 7 council districts (D1-D7) — this means the 6 At-Large rows need to be
relabeled to D1 through D6, **and a new "District 7" row must be created** for Lyon (similar to how Pomona
needed District 4 and District 5 created). The pre-flight must confirm:
- How many At-Large district rows exist (expected: 6)
- Whether any row labeled "District 7" already exists for geo_id '0656000'
- Whether Hampton (in the doomed chamber) has his own At-Large district row that moves with his office, or
  whether his office in the doomed chamber points at one of the 6 survivor-chamber At-Large rows

The pre-flight must map each At-Large district UUID to its current office occupant to know the correct
relabeling:

| Occupant of office in survivor 2e7f01d0 | Expected district relabel |
|-----------------------------------------|--------------------------|
| Rick Cole (657577, office 7ab2730c) | "District 2" |
| Justin Jones (657578, office e3617ff5) | "District 3" |
| Gene Masuda (657579, office 0bc62efd) | "District 4" |
| Steve Madison (657581, office f2cb13dd) | "District 6" |
| Jess Rivas (-700150, office 7bdb4f77) | "District 5" |
| Jason Lyon (657582, office 0cd97f4e) | "District 7" |

Hampton's office (0c357b48) is in the DOOMED chamber. After moving it to the survivor, it also needs a
district row. The pre-flight must check whether Hampton's office currently points at an At-Large district row
(that moves with the office to the survivor) or at NULL. If Hampton's doomed-chamber office points at one of
the 6 At-Large UUIDs listed above, that UUID also moves with the office and can be relabeled to "District 1"
during the relabeling step. If Hampton's office has its own district row (the 7th), then there are actually 7
At-Large rows (6 in survivor chamber offices + 1 in Hampton's doomed-chamber office), and only a "District 7"
CREATE is needed for Lyon.

**Likely scenario (requiring executor to verify):** The 6 At-Large rows in the survivor chamber cover Cole,
Jones, Masuda, Madison, Rivas, and one of either Hampton or Lyon. The district row for one of them (probably
Hampton, since he's in the doomed chamber) may also be accessible from the doomed chamber. A "District 7"
row likely needs to be CREATED (guarded NOT EXISTS). The executor must run:

```sql
-- Pre-flight: map each office in BOTH chambers to its current district_id + district label
SELECT o.id AS office_id, p.external_id, p.last_name,
       d.id AS district_id, d.label, d.district_type
FROM essentials.offices o
LEFT JOIN essentials.politicians p ON p.id = o.politician_id
LEFT JOIN essentials.districts d ON d.id = o.district_id
WHERE o.chamber_id IN (
  '2e7f01d0-69dd-4301-b24c-58d83eb19f47',  -- survivor
  'bdd1acad-f22d-4fa3-8ab5-667eed0e3d82'   -- doomed
)
ORDER BY d.district_type, d.label;
```

This query is MANDATORY before any write; it determines the exact At-Large UUID → district label mapping.

### 6. Headshot Sources and Status — CONFIRMED (HIGH confidence)

**cityofpasadena.net: NO WAF — all 8 images directly curl-accessible (HTTP 200).**

All images are at WordPress `wp-content/uploads/sites/{N}/` paths on the respective district subdomains.
Each district has its own subdomain under cityofpasadena.net (district1, district2, ..., district7, mayor).

| Member | Official Portrait URL | DB Headshot? | Action |
|--------|----------------------|--------------|--------|
| Victor Gordo (Mayor) | `https://www.cityofpasadena.net/mayor/wp-content/uploads/sites/18/Victor-Gordo-Mayor-682x1024.jpg` | YES (pre-existing) | Verify dimensions; reprocess to 600×750 canonical if needed |
| Tyron Hampton (D1) | `https://www.cityofpasadena.net/district1/wp-content/uploads/sites/5/Tyron-Hampton-District-1.jpg` | YES (pre-existing) | Verify dimensions; reprocess if needed |
| Rick Cole (D2) | `https://www.cityofpasadena.net/district2/wp-content/uploads/sites/6/rick-cole-2024.jpg` | YES (pre-existing, but may be old/pre-2024) | Download → crop 4:5 → 600×750 → upload canonical |
| Justin Jones (D3) | `https://www.cityofpasadena.net/district3/wp-content/uploads/sites/4/Councilmember-Justin-Jones.png` | YES (pre-existing) | Verify dimensions; reprocess if needed |
| Gene Masuda (D4) | `https://www.cityofpasadena.net/district4/wp-content/uploads/sites/7/gene-masuda.jpg` | YES (pre-existing) | Verify dimensions; reprocess if needed |
| Jess Rivas (D5) | `https://www.cityofpasadena.net/district5/wp-content/uploads/sites/8/Jess-Rivas-Councilmember-District-5.jpg` | **NO (0 images)** | Download → crop 4:5 → 600×750 → upload canonical |
| Steve Madison (D6) | `https://www.cityofpasadena.net/district6/wp-content/uploads/sites/9/SteveMadison.jpg` | YES (pre-existing) | Verify dimensions; reprocess if needed |
| Jason Lyon (D7) | `https://www.cityofpasadena.net/district7/wp-content/uploads/sites/10/Councilmember-Jason-Lyon.png` | YES but **2 rows** | Dedupe first (Wave 1); keep canonical; reprocess from official URL |

**All 8 portraits verified HTTP 200 (2026-06-20).** [VERIFIED: direct curl in research session]

**Headshot upload path:** `politician_photos/{politician_uuid}-headshot.jpg`, `type='default'`,
`photo_license='press_use'` (these are official government portrait photos).

**Lyon image dedupe:** Lyon (ext_id 657582, office 0cd97f4e) has 2 `politician_images` rows — dedupe in Wave
1. Identify the stale row (likely the one not at the canonical `{uuid}-headshot.jpg` path or the older/smaller
one) and DELETE it. Keep the canonical `{uuid}-headshot.jpg` row. If neither row is canonical, Wave 3 will
re-upload from the official URL and both stale rows can be removed.

**No fallback needed for any member** — all 8 official portraits are directly accessible without WAF.

### 7. Stance Evidence Sources — Pasadena-Specific (HIGH confidence for existence, MEDIUM for per-member details)

**Authoritative vote record system:**
- **ww2.cityofpasadena.net** — Pasadena's agenda/minutes archive (1998–present); search by date at
  `https://ww2.cityofpasadena.net/` (year-based directory: `2026 Agendas/`, `2025 Agendas/`, etc.)
- **pasadena.granicus.com** — Granicus video/document archive; `ViewPublisher.php?view_id=25` for council
  meetings; searchable by keyword [VERIFIED: pasadena.granicus.com/ViewPublisher.php?view_id=25]
- NOT Legistar — Pasadena uses Granicus + the ww2.cityofpasadena.net archive (NOT OneMeeting/PrimeGov like
  Torrance) [ASSUMED based on search results showing ww2.cityofpasadena.net as the agenda portal]

**Local news sources:**
- **Pasadena Now** (pasadenanow.com) — primary civic news; good per-member vote coverage
- **LAist** (laist.com) — strong election + housing coverage for Pasadena
- **Pasadena Weekly** (pasadenaweekly.com) — alternative weekly; good for policy coverage
- **Colorado Boulevard** (coloradoboulevard.net) — covered the December 2024 swearing-in; good for newer members
- **Local News Pasadena** (localnewspasadena.com) — additional civic coverage

**Key Pasadena-specific compass-mappable issues:**

| Issue | Topic mapping | Evidence tier | Notes |
|-------|---------------|---------------|-------|
| Measure H rent control (Nov 2022, effective Dec 22 2022) | `rent-regulation` | HIGH | Voter-passed charter amendment; council voted 6-0 to create RSO Dept (Nov 2023); council members took positions on implementation independence from City Manager. Applies to pre-1995 multi-unit buildings. NOT an auto-blank — research per member. |
| Housing element / RHNA (9,429 units 2021-2029) | `housing` / `residential-zoning` | HIGH | Strong evidence; Gordo expressed frustration with state mandate removing local discretion (Eaton fire housing vote); Cole made motion to delay SB 79 near Gold Line; Rivas recused (lives in affected zone). |
| SB 79 / Gold Line transit-area housing delay | `housing` / `growth-and-development` | MEDIUM | March 2025 vote; Cole moved to delay implementation; Rivas recused; Gordo joined denial of homeowner appeal for Eaton fire affordable housing [CITED: pasadenanow.com; LAist Eaton fire vote] |
| Police oversight (CPOC established 2020) | `public-safety-approach` | MEDIUM | Community Police Oversight Commission established by council ordinance Oct 2020. Unanimous votes on appointments documented. Individual member positions less documented. |
| Homelessness / unhoused services | `homelessness` / `homelessness-response` | MEDIUM | $6.6M federal homeless grant vote (2025); council members cited as working on year-round shelter. Lyon specifically named as working on shelter funding. |
| 710 Freeway stub (I-710 Northern Extension) | `transportation-priorities` | MEDIUM | Madison pledged to continue 710 stump work. Long-standing Pasadena issue (60+ years). |
| Minimum wage | `minimum-wage` | LOW-MEDIUM | LA County minimum wage ordinance covers unincorporated areas; city council positions on local minimum wage TBD — low likelihood of direct Pasadena council vote (CA state law preempts much) |
| Local environment / Eaton Canyon fire recovery | `local-environment` | MEDIUM | Eaton Canyon fire January 2026 (major local event); council responses to fire recovery housing, environmental cleanup. |
| Community solar / clean energy programs | `climate-change` / `local-environment` | LOW | Pasadena Water and Power (city-owned utility) has clean energy programs; council positions vary |

**Topics expected blank for most members** (no city-council-level record expected): abortion, trans-athletes,
same-sex-marriage, school-vouchers, voting-rights, social-security, medicare/aid, redistricting, tariffs,
AI-regulation, deportation, fossil-fuels, ukraine-support, campaign-finance, religious-freedom, civil-rights
(state/federal), data-centers, childcare (state-level).

**IMPORTANT: Rent-regulation IS applicable for Pasadena.** Measure H passed November 2022 and took effect
December 22, 2022. Unlike Torrance (where no RSO exists and rent-regulation was correctly auto-blanked),
Pasadena HAS an active RSO. Research agents MUST check for evidence of each council member's position on
Measure H, the RSO implementation, the RSO Department creation vote, and the Rental Housing Board. Do NOT
auto-blank rent-regulation for Pasadena members. [VERIFIED: cityofpasadena.net/rent-stabilization/rent-control-overview/]

**Key documented vote anchor:**
- RSO Department creation vote: **6-0** (November 2023) — all 6 council members present voted YES to create
  the city Rent Stabilization Department. (Positions differed on governance structure/independence from City
  Manager.) [CITED: therealdeal.com/la/2023/11/08/pasadena-moves-to-create-rent-stabilization-department/]
- This 6-0 vote suggests uniform support for implementing Measure H structurally, but individual positions on
  specifics (independence, enforcement stringency, etc.) may differentiate members.

**Per-member stance evidence preview:**

| Member | Evidence Expectation | Key Topics |
|--------|---------------------|------------|
| Victor Gordo (Mayor, since 2020) | STRONG — longtime council/mayor; well-documented positions; Eaton fire recovery; housing frustration documented | housing, homelessness, local-environment, public-safety-approach, rent-regulation (RSO creation vote), transportation-priorities |
| Tyron Hampton (D1, since 2015) | STRONG — longest-serving current council member; multiple election cycles | housing, homelessness, public-safety-approach, rent-regulation, local-environment |
| Rick Cole (D2, since Dec 2024) | MODERATE — NEW (sworn Dec 2024); SB 79 delay motion documented; known urban planning background from prior Pasadena service (1983-1995) and West Hollywood/Ventura career | housing (SB 79), growth-and-development, transportation-priorities, rent-regulation |
| Justin Jones (D3, since 2016) | STRONG — longtime member; re-elected 2026; 76% vote; born+raised Pasadena | housing, homelessness, rent-regulation, public-safety-approach |
| Gene Masuda (D4, since 2011) | STRONG — 4th term (2011, 2015, 2019, 2024); longest-serving council member; well-documented | housing, economic-development, growth-and-development, rent-regulation, local-environment |
| Jess Rivas (D5, since Feb 2021) | MODERATE — appointed 2021; won 2022; re-elected 2026 unopposed; recused on SB 79 (lives in affected zone) | housing (recusal documented), homelessness, rent-regulation, public-safety-approach |
| Steve Madison (D6, since 1999) | STRONG — longest-serving council member (since 1999); 710 freeway stump documented; vice mayor 2023 | transportation-priorities, housing, economic-development, growth-and-development, rent-regulation |
| Jason Lyon (D7, since June 2022) | MODERATE — elected 2022; re-elected 2026; on Housing/Homelessness/Planning committee; shelter funding work documented | housing, homelessness, rent-regulation, growth-and-development |

**Research order for Wave 4 (most-documented first, one agent at a time):**
Gordo → Hampton → Masuda → Madison → Jones → Lyon → Rivas → Cole

**Judicial topics — ALL EXCLUDED.** Pasadena is council-manager with an APPOINTED City Attorney (Michele
Beal Bagneris, appointed 1997). Not elected. No judicial topics apply.
[VERIFIED: cityofpasadena.net/city-attorney/bio/]

### 8. Migration Numbering

**On-disk file counter (2026-06-20):** Maximum existing file is `945_aurelio_mattucci_stances.sql`
(Torrance Wave 4 final). [VERIFIED: local filesystem scan]

**Next migration number: 946** (structural reconcile). Pre-flight must re-confirm by running:
```bash
ls C:/EV-Accounts/backend/migrations/ | grep -E "^[0-9]" | sort -n | tail -5
```
and confirming 945 is the last numbered file. The ledger MAX in schema_migrations is 937 (Torrance Wave 2
structural); 938–945 were audit-only and not registered. When authoring migration 946, register it in
`supabase_migrations.schema_migrations` (structural migration pattern).

**Expected migration numbering for Phase 149:**
- **946** — Wave 1: reconcile (geo_id + chamber merge + district relabels + district creates + Lyon dedupe) — STRUCTURAL, registers in schema_migrations
- **947** — Wave 2: roster (bidirectional link repairs + official_count) — STRUCTURAL, registers in schema_migrations
- **948** — Wave 3: headshots — AUDIT-ONLY, does NOT register
- **949–956** — Wave 4: stances (one file per member × 8 members) — AUDIT-ONLY, do NOT register

---

## Architecture Patterns

### Recommended Wave Structure

```
Wave 1 — Reconcile (structural, registers in schema_migrations)
  Migration 946:
  ├── UPDATE essentials.governments SET geo_id='0656000'
  │   WHERE id='d25619a9-...' AND (geo_id IS NULL OR geo_id = '')
  ├── MOVE 2 doomed-chamber offices into survivor:
  │   UPDATE essentials.offices SET chamber_id='2e7f01d0-...'
  │   WHERE chamber_id='bdd1acad-...'
  │   (Moves BOTH: Gordo/Mayor fc5e372a + Hampton/D1 0c357b48)
  ├── Assert doomed chamber has 0 offices (DO $$ block)
  ├── DELETE essentials.chambers WHERE id='bdd1acad-...'
  ├── RELABEL 6 At-Large district rows to D1-D6 (UUID-targeted, from pre-flight mapping)
  ├── CREATE new 'District 7' row (LOCAL, geo_id='0656000', state='CA') for Lyon if not exists
  │   -- (Only if D7 row doesn't already exist — pre-flight determines this)
  ├── DEDUPE Lyon images: DELETE FROM essentials.politician_images WHERE
  │   politician_id = (SELECT id FROM essentials.politicians WHERE external_id=657582)
  │   AND id = '<stale-image-uuid>'  -- keep exactly one canonical row
  └── Register in schema_migrations as version=946

Wave 2 — Roster (structural, registers in schema_migrations)
  Migration 947:
  ├── REPAIR bidirectional links for all 8 members:
  │   UPDATE essentials.politicians SET office_id='<office-uuid>' WHERE external_id=<id>
  │   for each of: Gordo(-200901/fc5e372a), Hampton(-201094/0c357b48), Cole(657577/7ab2730c),
  │   Jones(657578/e3617ff5), Masuda(657579/0bc62efd), Rivas(-700150/7bdb4f77),
  │   Madison(657581/f2cb13dd), Lyon(657582/0cd97f4e)
  ├── CONFIRM Cole's politician row has current name 'Rick Cole' (not Felicia Williams)
  │   -- UPDATE first_name/last_name if the DB row still shows the prior D2 member
  ├── UPDATE official_count=7 on survivor chamber 2e7f01d0
  │   -- 7 = D1 Hampton + D2 Cole + D3 Jones + D4 Masuda + D5 Rivas + D6 Madison + D7 Lyon
  │   -- Mayor Gordo is LOCAL_EXEC, not counted in council official_count (per Wave-2 pattern)
  └── Register in schema_migrations as version=947

Wave 3 — Headshots (audit-only, NOT registered)
  Migration 948 (audit-only):
  ├── Gordo: curl mayor URL → crop 4:5 → 600×750 → assess vs existing; upload canonical if better
  ├── Hampton: curl district1 URL → crop 4:5 → 600×750 → upload/verify
  ├── Cole: curl district2 URL (rick-cole-2024.jpg) → crop 4:5 → 600×750 → upload canonical
  ├── Jones: curl district3 URL → crop 4:5 → 600×750 → upload/verify
  ├── Masuda: curl district4 URL → crop 4:5 → 600×750 → upload/verify
  ├── Rivas: curl district5 URL → crop 4:5 → 600×750 → UPLOAD (no existing image)
  ├── Madison: curl district6 URL → crop 4:5 → 600×750 → upload/verify
  └── Lyon: crop 4:5 → 600×750 → upload canonical (dedupe done in Wave 1)
  All: type='default', photo_license='press_use', canonical path {uuid}-headshot.jpg

Wave 4 — Stances (audit-only, NOT registered; one agent per official)
  Migrations 949–956 (approx):
  ├── Gordo (Mayor since 2020; strong documented record)
  ├── Hampton (D1 since 2015; longest-serving current council member)
  ├── Masuda (D4 since 2011; 4th term; well-documented)
  ├── Madison (D6 since 1999; even longer tenure; well-documented)
  ├── Jones (D3 since 2016; re-elected 2026)
  ├── Lyon (D7 since 2022; re-elected 2026; housing/homelessness committee)
  ├── Rivas (D5 since 2021; re-elected 2026; recusal noted)
  └── Cole (D2 since Dec 2024; newest member; prior urban planning record)
```

### SQL Templates (carry from 926/936 idempotent patterns with Pasadena UUIDs)

**geo_id backfill (with empty-string guard — Torrance Pitfall 8 pattern):**
```sql
UPDATE essentials.governments
SET geo_id = '0656000'
WHERE id = 'd25619a9-7276-4e8b-b7ae-8028e408aee0'
AND (geo_id IS NULL OR geo_id = '');
```

**Move-then-delete (2 offices from doomed chamber — simpler than Pomona/Torrance):**
```sql
-- MOVE both doomed-chamber offices into survivor (Gordo/Mayor + Hampton/D1)
UPDATE essentials.offices
SET chamber_id = '2e7f01d0-69dd-4301-b24c-58d83eb19f47'
WHERE chamber_id = 'bdd1acad-f22d-4fa3-8ab5-667eed0e3d82';

-- Assert doomed chamber is empty before deleting
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices
      WHERE chamber_id = 'bdd1acad-f22d-4fa3-8ab5-667eed0e3d82') > 0 THEN
    RAISE EXCEPTION 'Chamber bdd1acad still has offices — aborting delete';
  END IF;
END $$;

-- Delete the emptied duplicate chamber (UUID-targeted only)
DELETE FROM essentials.chambers WHERE id = 'bdd1acad-f22d-4fa3-8ab5-667eed0e3d82';
```

**District relabeling (6 rows — UUIDs determined by pre-flight query in §5):**
```sql
-- Replace <UUID_Di> with actual UUIDs from pre-flight §5 mapping
-- Example pattern only — executor must use actual pre-flight UUIDs:
UPDATE essentials.districts SET label = 'District 1'
WHERE id = '<UUID_of_Hampton_district>'
  AND label IS DISTINCT FROM 'District 1';

UPDATE essentials.districts SET label = 'District 2'
WHERE id = '<UUID_of_Cole_district>'
  AND label IS DISTINCT FROM 'District 2';
-- ... repeat for D3 (Jones), D4 (Masuda), D5 (Rivas), D6 (Madison)
```

**Create District 7 (for Lyon, if missing — pre-flight determines):**
```sql
INSERT INTO essentials.districts (label, district_type, geo_id, state)
SELECT 'District 7', 'LOCAL', '0656000', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE label = 'District 7' AND geo_id = '0656000'
);
```

**Bidirectional link repair template (Wave 2):**
```sql
-- Repair each politician → office back-pointer (idempotent)
UPDATE essentials.politicians
SET office_id = 'fc5e372a-...'  -- Gordo → Mayor office
WHERE external_id = -200901
  AND office_id IS DISTINCT FROM 'fc5e372a-...';

UPDATE essentials.politicians
SET office_id = '0c357b48-...'  -- Hampton → D1 office
WHERE external_id = -201094
  AND office_id IS DISTINCT FROM '0c357b48-...';
-- ... repeat for all 8 members
```

**Official count (Wave 2):**
```sql
UPDATE essentials.chambers
SET official_count = 7
WHERE id = '2e7f01d0-69dd-4301-b24c-58d83eb19f47'
  AND official_count IS DISTINCT FROM 7;
```

**Lyon image dedupe (Wave 1):**
```sql
-- Pre-flight: find Lyon's 2 politician_images rows:
SELECT id, politician_id, storage_path, type, created_at
FROM essentials.politician_images
WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = 657582)
ORDER BY created_at;
-- Delete the stale one (earlier/non-canonical path); keep the one at {uuid}-headshot.jpg
DELETE FROM essentials.politician_images WHERE id = '<stale-image-uuid>';
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| District relabeling | Complex migration logic | Simple UPDATE by UUID (6 rows) | Known UUIDs from pre-flight query |
| District 7 creation | Complex migration | INSERT ... WHERE NOT EXISTS (same as Pomona D4/D5) | Proven idempotent pattern |
| Move-then-delete | Complex merge | UPDATE chamber_id + DO $$ assert + DELETE (Pomona/Torrance pattern) | Safe, tested; only 2 offices to move here |
| Image crop/resize | Custom script | Reuse Lancaster/Palmdale/Pomona Pillow pipeline (4:5 crop FIRST → 600×750 Lanczos q90) | Tested across phases 142-148 |
| Storage upload | Custom HTTP | Supabase Python client with service-role key from C:/EV-Accounts/backend/.env | Proven across 142-148 |
| Headshot sourcing | Custom download | `curl -L "{url}" -o {filename}` (NO WAF; all cityofpasadena.net portrait URLs HTTP 200) | Verified 2026-06-20 |
| Stance SQL | New template | Copy 935_canales_stances.sql / 945_aurelio_mattucci_stances.sql pattern exactly | Tested across 30+ officials |
| Compass topic lookup | Hardcode UUIDs | Always query WHERE is_live = true at apply time | 6 retired IDs exist; never hardcode |
| Rent-regulation stance | Auto-blank (Torrance) | Research per member — Pasadena HAS active RSO (Measure H) | Unlike Torrance, rent control exists here; auto-blanking would be wrong |

---

## Common Pitfalls

### Pitfall 1: Auto-blanking rent-regulation because Torrance didn't have it
**What goes wrong:** Research agent reads Torrance precedent noting rent-regulation was not applicable, and
applies the same rule to Pasadena — producing zero stances on the rent-regulation topic for all 8 members.
**Why it happens:** Torrance had no RSO; the Torrance RESEARCH.md explicitly noted "no manufactured
rent-regulation." Agents trained on Torrance output generalize this to Pasadena.
**How to avoid:** Pasadena has an ACTIVE RSO (Measure H, effective December 22, 2022). The RSO Department
was created by council vote in November 2023 (6-0). Council members DID take documented positions on Measure H
implementation. Research agents MUST investigate rent-regulation for each Pasadena member. [VERIFIED]
**Warning signs:** Wave 4 outputs showing zero rent-regulation stances for Gordo or Hampton (who have long
records and took positions in 2023).

### Pitfall 2: Confusing D2 (Rick Cole) with the prior D2 member (Felicia Williams)
**What goes wrong:** The DB politician row ext_id=657577 labeled "Rick Cole" was seeded before the 2024
election, possibly showing Felicia Williams (the prior D2 member). Executor repairs the bidirectional link
without updating the name and ends up showing Felicia Williams in D2.
**Why it happens:** The DB was seeded from a bulk import that predates the December 2024 election. The
ext_id range 657577-657582 suggests a pre-existing import. Rick Cole replaced Felicia Williams in December
2024. The DB row may or may not already reflect this change.
**How to avoid:** Pre-flight must SELECT first_name, last_name FROM politicians WHERE external_id=657577.
If it returns 'Felicia Williams', UPDATE the name to 'Rick Cole'. If it already returns 'Rick Cole', the
pre-existing seed was updated. Either way: verify before repairs.
**Warning signs:** Post-Wave-2 SELECT showing last_name='Williams' in D2 council member position.

### Pitfall 3: Confusing Madison's district (D6, not D2)
**What goes wrong:** The DB context lists Madison as ext_id 657581 in the survivor chamber with "At-Large."
An executor unfamiliar with Pasadena might see "Madison" and attempt to map it to D2 based on alphabetical
ordering or a confused district assignment.
**Why it happens:** Steve Madison represents D6 (since 1999). The DB currently lists all council members as
"At-Large" — there's no district number to disambble them by name alone.
**How to avoid:** The roster in §3 is authoritative: Madison = D6. Always use the per-member district mapping
from §3 when relabeling districts. Never infer district from office ordering or alphabetical name sort.
**Warning signs:** Any mapping that assigns Steve Madison to a district other than D6 is wrong.

### Pitfall 4: Creating a "Vice Mayor" office or district row
**What goes wrong:** Executor sees "Vice Mayor Jess Rivas" on the official site and creates a new
LOCAL_EXEC or VICE_MAYOR district row for Rivas.
**Why it happens:** Jess Rivas is designated Vice Mayor — this is prominently displayed on the district5 page
and on the all-districts page.
**How to avoid:** Vice Mayor is a rotating title held by a council member — it is NOT a separately-elected
office. Rivas holds D5 as her seat. The Vice Mayor designation changes periodically by council vote and does
not require a new district/office row. Model Rivas as "Council Member" in D5 (LOCAL district type). No new
office or district row for Vice Mayor. [VERIFIED: title confirmed as rotating designation, not elected office]
**Warning signs:** Any INSERT of a new district row with label='Vice Mayor' or district_type involving
'VICE_MAYOR' is wrong.

### Pitfall 5: Moving only 1 of the 2 doomed-chamber offices (forgetting Gordo/Hampton are BOTH in bdd1acad)
**What goes wrong:** Executor only moves Hampton's office from the doomed chamber, or only moves Gordo's
Mayor office, then attempts to DELETE the doomed chamber — which fails the inline assert (still 1 office).
**Why it happens:** The doomed chamber `bdd1acad` contains 2 offices (Hampton + Gordo). The prior phases
(Pomona: 3 offices, Torrance: 3 offices) all used a single UPDATE WHERE chamber_id='<doomed>' which moves
ALL offices at once. The same pattern applies here — the single UPDATE moves both at once. If an executor
writes individual UPDATE statements per office and misses one, the assert fails.
**How to avoid:** Use a single `UPDATE essentials.offices SET chamber_id='<survivor>' WHERE
chamber_id='<doomed>'` statement — this moves ALL offices in the doomed chamber at once (2 offices here).
The inline DO $$ assert will catch any failure. [Pomona/Torrance pattern]
**Warning signs:** The DO $$ assert raising an exception means offices remain in the doomed chamber.

### Pitfall 6: Setting official_count to 8 (counting Mayor)
**What goes wrong:** Executor counts all 8 officials (7 council + Mayor) and sets official_count=8.
**Why it happens:** 8 officials exist: 7 council + 1 Mayor. Counting all gives 8.
**How to avoid:** Per prior phases (Pomona: official_count=7 for 7 council; Torrance: official_count=7 for
1 Mayor + 6 council), official_count on the City Council chamber counts the council seats only. The Mayor is
in a LOCAL_EXEC district and is NOT counted in the council chamber official_count. Set official_count=7
(reflecting 7 council seats D1-D7). [Pomona/Torrance pattern]
**Warning signs:** official_count=8 is wrong; correct value is 7.

### Pitfall 7: Treating the "District 7" question as pre-determined
**What goes wrong:** Research says "create District 7" and executor creates it without checking whether it
already exists, resulting in a duplicate 'District 7' row (OR misses that it already exists and skips it).
**Why it happens:** The DB pre-check in CONTEXT.md confirms 6 At-Large rows for the 6 survivor-chamber
offices — but Hampton (in the doomed chamber) may have his own At-Large district row OR may share one with a
survivor-chamber member. The pre-flight query in §5 must determine whether exactly 6 or 7 district rows exist.
**How to avoid:** Always INSERT District 7 guarded WHERE NOT EXISTS (label='District 7' AND geo_id='0656000').
If it already exists, the INSERT is a no-op. If it doesn't exist, it's created. Both outcomes are correct.
**Warning signs:** After Wave 1, querying districts for geo_id='0656000' should show exactly 8 rows:
'Pasadena Mayor' (LOCAL_EXEC) + 'District 1' through 'District 7' (all LOCAL).

### Pitfall 8: Not capturing the geo_id empty-string case
**What goes wrong:** Migration 946 uses `WHERE geo_id IS NULL` only, but the DB has an empty string ('')
not NULL for Pasadena's geo_id. The UPDATE runs 0 rows affected.
**Why it happens:** CONTEXT.md says geo_id is NULL for this gov, but the Torrance phase discovered that
empty-string is also possible in this DB. Defensive coding requires both guards.
**How to avoid:** Use `WHERE (geo_id IS NULL OR geo_id = '')` as the guard. [Torrance Pitfall 8 pattern]

---

## Package Legitimacy Audit

Not applicable — this phase installs no new npm/Python packages. Uses existing Pillow + Supabase client
proven across phases 142-148.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| psql | Migration apply | Yes (confirmed phases 142-148) | 18.1 | mcp__supabase-local execute_sql |
| Python Pillow | Headshot crop/resize | Yes (confirmed phases 142-148) | 10.x | pip install Pillow |
| curl | Headshot download | Yes | Bash tool | — |
| Supabase Storage | Headshot upload | Yes | Production | — |
| mcp__supabase-local | Migration apply + verification | Yes | Production | psql fallback |
| cityofpasadena.net | Official portraits (all 8) | **AVAILABLE (HTTP 200, NO WAF)** | All 8 council/mayor portraits confirmed 2026-06-20 | None needed |

**Missing dependencies with no fallback:** None.

**Notes on cityofpasadena.net image access:**
- All 8 portrait URLs confirmed HTTP 200 (2026-06-20 curl test — direct, no WAF/Akamai blocking)
- Images are on WordPress `wp-content/uploads/sites/{N}/` paths on district subdomains
- File types: mix of JPEG and PNG — both are fine for Pillow processing
- Gordo's URL (`682x1024.jpg` in filename) suggests existing dimensions 682×1024 — well above 600×750 minimum
- No checkpoint:human-verify needed for any member (unlike Torrance's Betty Lieu situation)

---

## Validation Architecture

No automated test framework applies (per established CA deep-seed pattern). Verification gates are SQL
assertions run after each migration.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL assertion queries via psql / mcp__supabase-local |
| Config file | none — assertions are inline SQL |
| Quick run command | Individual SELECT queries per wave |
| Full suite command | Full checklist before /gsd:verify-work |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| PASA-01 | gov row has geo_id='0656000' | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id='d25619a9-...'` = '0656000' |
| PASA-01 | Exactly 1 'City Council' chamber for Pasadena | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='d25619a9-...'` = 1 |
| PASA-01 | 8 offices in survivor chamber (7 council + Mayor) | SQL assertion | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='2e7f01d0-...'` = 8 |
| PASA-01 | official_count=7 on council chamber | SQL assertion | `SELECT official_count FROM essentials.chambers WHERE id='2e7f01d0-...'` = 7 |
| PASA-01 | No split-section (section_split_check) | SQL assertion | Section split check query returns 0 rows for Pasadena |
| PASA-01 | 8 district rows: 7 LOCAL (D1-D7) + 1 LOCAL_EXEC (Pasadena Mayor) | SQL assertion | `SELECT label, district_type FROM districts WHERE geo_id='0656000' ORDER BY label` |
| PASA-01 | Doomed chamber deleted | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE id='bdd1acad-...'` = 0 |
| PASA-01 | Gordo seated as Mayor (LOCAL_EXEC office) | SQL assertion | `SELECT p.last_name FROM politicians p JOIN offices o ON o.politician_id=p.id WHERE o.id='fc5e372a-...'` = 'Gordo' |
| PASA-01 | Hampton seated as D1 | SQL assertion | `SELECT d.label FROM offices o JOIN districts d ON d.id=o.district_id WHERE o.id='0c357b48-...'` = 'District 1' |
| PASA-01 | Rivas has at least 1 headshot | SQL assertion | `SELECT COUNT(*) FROM politician_images WHERE politician_id=(SELECT id FROM politicians WHERE external_id=-700150)` >= 1 |
| PASA-01 | Lyon has exactly 1 headshot | SQL assertion | `SELECT COUNT(*) FROM politician_images WHERE politician_id=(SELECT id FROM politicians WHERE external_id=657582)` = 1 |
| PASA-01 | 0 stance rows before Wave 4 (then check > 0 after) | SQL assertion | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id IN (SELECT id FROM politicians WHERE external_id IN (-200901,-201094,657577,657578,657579,-700150,657581,657582))` |
| PASA-01 | 100% citation on all stances | SQL assertion | Every politician_answers row has matching politician_context row |
| PASA-01 | No judicial topic_ids in stances | SQL assertion | Verify no judicial topic_ids appear in politician_answers for Pasadena politicians |

### Wave-by-Wave Verification Checks

**Wave 1 (reconcile):**
- `geo_id = '0656000'` on Pasadena gov row (not empty, not NULL)
- `SELECT COUNT(*) FROM chambers WHERE government_id='d25619a9-...'` = 1
- `SELECT COUNT(*) FROM chambers WHERE id='bdd1acad-...'` = 0 (doomed chamber gone)
- `SELECT COUNT(*) FROM offices WHERE chamber_id='2e7f01d0-...'` = 8 (both Hampton and Gordo moved in)
- District labels: 8 total rows for geo_id='0656000' — 1 LOCAL_EXEC 'Pasadena Mayor' + 7 LOCAL 'District 1' through 'District 7'
- Lyon dedupe: `SELECT COUNT(*) FROM politician_images WHERE politician_id=(SELECT id FROM politicians WHERE external_id=657582)` = 1
- Split-section check: 1 chamber for Pasadena, 0 rows from split-section query
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes 946

**Wave 2 (roster):**
- Each politician's office_id matches their office UUID (8 bidirectional links verified)
- Cole's name is 'Rick Cole' (not 'Felicia Williams')
- `official_count = 7` on chamber 2e7f01d0
- `SELECT MAX(version) FROM supabase_migrations.schema_migrations` includes 947

**Wave 3 (headshots):**
- All 8 active council members have politician_images rows with type='default'
- Rivas: `SELECT COUNT(*) FROM politician_images WHERE politician_id=(...)` >= 1 (was 0)
- Lyon: exactly 1 row (was 2)
- All headshot Storage URLs return HTTP 200
- No 600×750 violations: verify dimensions on new uploads

**Wave 4 (stances):**
- > 0 stance rows exist for each member (honest blanks accepted for thin-record officials)
- 100% citation: every politician_answers row has a matching politician_context row
- No judicial topic UUIDs appear in any Pasadena politician_answers rows
- rent-regulation stances present for at least Gordo, Hampton, Masuda, Madison (all have long records)

---

## Security Domain

This phase has no new external attack surface. All writes are operator-applied SQL migrations to the
production Supabase DB. No untrusted user input crosses any boundary. The real threat surface is accidental
data corruption — mitigated by UUID-targeted writes, inline asserts, idempotent guards, and the STOP-on-drift
pre-flight.

ASVS categories V2/V3/V4 (auth/session/access control): not applicable (no new auth surface).
V5 (input validation): not applicable (no user-facing input in this phase).
V6 (cryptography): not applicable.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DB politician row ext_id=657577 ("Rick Cole") currently shows Rick Cole (not Felicia Williams) | §3 District Mapping | If wrong: Wave 2 must UPDATE first_name/last_name before link repair |
| A2 | All 6 survivor-chamber At-Large district rows each belong to exactly one office in the survivor chamber (no shared districts) | §5 District UUID Mapping | If wrong: need to create additional district rows or resolve shared-district defect (Pomona pattern) |
| A3 | Hampton's doomed-chamber office (0c357b48) has its own At-Large district row (not shared with a survivor-chamber office) | §5 District UUID Mapping | If wrong: the relabeling must handle a shared-district situation; pre-flight §5 query resolves this |
| A4 | A 'District 7' row does NOT currently exist for geo_id='0656000' (needs CREATE) | §5 District UUID Mapping | If wrong: the guarded INSERT is a no-op; no harm |
| A5 | ww2.cityofpasadena.net + pasadena.granicus.com are the vote record archives (not Legistar/OneMeeting) | §7 Stance Evidence | If wrong: stance research agents need different search approach; Pasadena Now + LAist still reliable as fallback |
| A6 | All pre-existing headshot images in DB for Pasadena members (Gordo/Hampton/Cole/Jones/Masuda/Madison/Lyon) are at canonical {uuid}-headshot.jpg paths | §6 Headshot Sources | If wrong: identify stale paths and re-upload from official cityofpasadena.net URLs |

**If any assumption fails:** Stop and re-verify before proceeding. Do NOT apply migrations against moved targets.

---

## Open Questions

1. **Are there exactly 6 or 7 At-Large district rows for geo_id='0656000'?**
   - What we know: CONTEXT.md says 6 offices in survivor chamber. Hampton is in the doomed chamber and also
     needs a district row.
   - What's unclear: Does Hampton's office in the doomed chamber have its own At-Large district row (making 7
     total At-Large rows), or does it share one with a survivor-chamber office?
   - Recommendation: Resolved by the mandatory pre-flight query in §5. The WHERE NOT EXISTS guard on District
     7 CREATE handles either outcome.

2. **Rick Cole: has the DB politician row been updated to reflect his December 2024 election?**
   - What we know: Cole won D2 in March 2024, replacing Felicia Williams. The bulk seed (v7.0) predates this.
   - What's unclear: Whether the seed was updated since v7.0 or whether the row still shows Williams.
   - Recommendation: Pre-flight SELECT first_name, last_name FROM politicians WHERE external_id=657577. Add
     name update step to Wave 2 if needed.

3. **Does any Pasadena official have a more current portrait URL not yet reflected in the district pages?**
   - What we know: All 8 district pages returned HTTP 200 with valid portrait images (2026-06-20).
   - What's unclear: Whether pages will be updated post-June-2026-election (Jones/Rivas/Lyon portraits
     may get refreshed after being sworn in for new terms).
   - Recommendation: Use the current URLs; note that newer photos may be available post-swearing-in.
     Not a blocker.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: cityofpasadena.net/mayor/all-districts/] — full roster D1-D7 + Mayor confirmed 2026-06-20
- [VERIFIED: cityofpasadena.net/district1/ through district7/] — individual headshot URLs + names
- [VERIFIED: cityofpasadena.net/mayor/] — Gordo portrait URL confirmed
- [VERIFIED: direct curl HTTP 200 on all 8 portrait URLs] — no WAF confirmed 2026-06-20
- [VERIFIED: cityofpasadena.net/city-attorney/bio/] — City Attorney Michele Bagneris appointed 1997
- [VERIFIED: cityofpasadena.net/rent-stabilization/rent-control-overview/] — Measure H active RSO

### Secondary (MEDIUM-HIGH confidence)
- [CITED: laist.com/news/politics/voter-guides/2026-election-california-primary-pasadena-city-council-districts-3-5-7] — June 2026 election results D3/D5/D7
- [CITED: pasadenanow.com/main/no-surprises-in-local-city-council-elections-as-incumbents-sweep] — June 2026 incumbents held
- [CITED: pasadenanow.com/main/councilmember-cole-ceremoniously-sworn-in-before-community] — Cole sworn in Dec 2024
- [CITED: coloradoboulevard.net/meet-the-new-pasadena-city-council/] — Dec 2024 council composition
- [CITED: pasadenanow.com/main/masuda-qualifies-for-district-4-election] — Masuda 2024 re-election
- [CITED: therealdeal.com/la/2023/11/08/pasadena-moves-to-create-rent-stabilization-department/] — 6-0 RSO Dept vote Nov 2023
- [CITED: pasadenanow.com/main/pasadena-votes-to-delay-a-state-housing-law-near-the-gold-line-three-top-officials-sit-it-out] — Cole SB 79 motion; Rivas recusal
- [CITED: laist.com/news/housing-homelessness/pasadena-affordable-housing-city-council-design-review-vote-eaton-fire] — Gordo housing vote 2025
- [CITED: pasadena.granicus.com/ViewPublisher.php?view_id=25] — Granicus council meeting archive confirmed

### Tertiary (LOW confidence — for stance research direction only)
- [ASSUMED] ww2.cityofpasadena.net is the primary agenda search portal (not Legistar/OneMeeting)
- [ASSUMED] Per-member positions on specific RSO governance votes (beyond the 6-0 RSO Dept creation)
- [ASSUMED] Hampton and Masuda had documented positions on Measure H beyond the general 6-0 vote

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — proven Pomona/Torrance SQL patterns carry directly
- Roster: HIGH — all 8 members confirmed via official cityofpasadena.net + election results
- District mapping: MEDIUM-HIGH — confirmed per official site; exact At-Large UUID assignment requires pre-flight query
- Headshots: HIGH — all 8 portrait URLs HTTP 200 confirmed; no WAF
- Rent-regulation applicability: HIGH — Measure H existence verified via official city page
- Stance evidence map: MEDIUM — sources identified; per-member vote details require research agent verification
- Pitfalls: HIGH — all directly derived from confirmed Pasadena-specific facts

**Research date:** 2026-06-20
**Valid until:** 2026-07-20 (stable city government; only risk is a surprise vacancy or new council appointment)
