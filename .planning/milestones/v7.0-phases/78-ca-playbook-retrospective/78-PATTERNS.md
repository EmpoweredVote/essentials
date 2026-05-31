# Phase 78: CA Playbook Retrospective — Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 4 (1 primary deliverable + 3 milestone closure files)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `LOCATION-ONBOARDING.md` | documentation | transform (GOTCHA injection + table append + new section) | `LOCATION-ONBOARDING.md` at Phase 56 state (Phase 56-01-PLAN.md defines the update pattern) | exact — same file, same operation type |
| `.planning/ROADMAP.md` | documentation | transform (status flag update) | `.planning/ROADMAP.md` Phase 56 closure (v6.0 milestone shipped line) | exact |
| `.planning/STATE.md` | documentation | transform (last_activity + Current Position update) | `.planning/STATE.md` Phase 56 closure (last_activity update) | exact |
| `.planning/PROJECT.md` | documentation | transform (Validated list extension) | `.planning/PROJECT.md` v6.0 entries (ME Playbook retrospective bullet) | exact |

---

## Pattern Assignments

### `LOCATION-ONBOARDING.md` (documentation, transform)

**Analog:** Phase 56-01-PLAN.md documents the exact operation pattern for this file type.
**Primary source for format conventions:** `LOCATION-ONBOARDING.md` lines 1–374 (read in full above).

**GOTCHA format pattern** (lines 163–167 of current file):
```markdown
> [GOTCHA] **[STATE-SPECIFIC] TIGER congressional file naming varies by state:** The loader key may not be `cd` — always browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` and check the actual filename for your state FIPS before configuring `STATE_LAYER_ALLOWLIST`. In Maine, the congressional file is `tl_2024_23_cd119.zip` — the correct loader key is `cd119`, not `cd`. Using the wrong key causes a silent no-op: the loader runs without error but loads zero boundaries.
```

Pattern rules extracted:
- Begins with `> [GOTCHA]`
- Bold label: `**[Optional tag] Short description:**`
- Body: problem description first, then solution, then state example inline
- `[STATE-SPECIFIC]` prefix tag used when the GOTCHA is state-specific (not universal)
- New CA GOTCHAs use `[STATE-SPECIFIC: CA]` tag (per RESEARCH.md code examples)

**CA GOTCHA format example** (from RESEARCH.md lines 533–535):
```markdown
> [GOTCHA] **[STATE-SPECIFIC: CA] AEM/CQ5 CMS embeds headshots in CSS `background-image`, not `<img>` tags:** Sacramento's cityofsacramento.gov uses Adobe Experience Manager (CQ5). Official headshots appear in `style="background-image:url(...)"` attributes — WebFetch and standard HTML parsers cannot extract them. Use raw curl + grep: `curl -s "https://www.cityofsacramento.gov/mayor-council/mayor" | grep -o 'background-image:url([^)]+)'`. This returns paths like `/content/dam/portal/mayor-council/...` which must be prepended with `https://www.cityofsacramento.gov`. Square CMS renditions (514×514 or 500×500): center-crop to 4:5 ratio, then resize 600×750 Lanczos q90. Phase 66 confirmed all 9 Sacramento officials were sourced this way.
```

**Cities Onboarded table format** (lines 29–38 of current file):
```markdown
| City | State | Onboarded | Election method | Notable patterns |
|------|-------|-----------|-----------------|-----------------|
| Cambridge | MA | 2026-05-17 | stv_proportional | Council-Manager; odd-year (next: 2027-11-02); 17 offices (9 councillors + 1 Mayor + 1 City Manager + 6 School Committee); STV since 1941 |
| Portland | ME | 2026-05-19 | rcv | RCV for Mayor, Auditor, and at-large Council; 18 officials seeded (Phase 53); CivicPlus API + portlandmaine.gov headshot source; Finalsite CDN for school board |
```

Pattern rules:
- City name only (no state suffix), state in separate column
- Onboarded = ISO date of the phase that completed the seed
- Election method = plain text value matching DB `election_method` column; parenthetical clarification when scoped
- Notable patterns column: pipe-delimited list of the 3–5 most borrowable facts; keep tight

**New CA rows to append** (7 rows, from RESEARCH.md lines 396–402 — exact content to use verbatim):

Row ordering: California (state) → San Francisco → San Jose → San Diego → Sacramento → Fremont → Berkeley (chronological by onboarding; matches D-05 decision)

**Step structure for inline GOTCHA placement** (from RESEARCH.md lines 437–454, placement map):

| GOTCHA | Step | Insertion approach |
|--------|------|--------------------|
| CA-1: Pre-existing seed | Step 1 required-questions list; Step 5 GOTCHA callout | New `> [GOTCHA]` inline in Step 1 + Step 5 |
| CA-2: districts.state casing (uppercase 'CA') | Step 3 after existing districts.state GOTCHA | CA annotation appended to existing `[GOTCHA]` rather than new one |
| CA-3: mtfcc swap | Step 3 new inline | New `> [GOTCHA]` |
| CA-4: External ID collision | Step 5 GOTCHA callout | New `> [GOTCHA]` |
| CA-5: DataSF vs ArcGIS outSR | Step 3 new inline | New `> [GOTCHA]` |
| CA-6: SF consolidated city-county | Step 3 new inline | New `> [GOTCHA]` |
| CA-7: CA COUSUB = CCDs | Step 3 adjacent to existing cousub GOTCHA | CA annotation to existing cousub `[GOTCHA]` |
| CA-8: CA jungle primary | Step 2 new inline | New `> [GOTCHA]` |
| CA-9: Berkeley/SF RCV at seed time | Step 2 adjacent to existing RCV GOTCHA | CA note added to existing RCV `[GOTCHA]` |
| CA-10: AEM/CQ5 headshots | Step 4 new inline callout + Step 7 pitfall table | New `> [GOTCHA]` in Step 4 + new pitfall table row |
| CA-11: lavote.gov election ID | Step 2 new inline | New `> [GOTCHA]` |

**California Quick Reference block** (new section, between Cities Onboarded table and Step 1):

Format derived from Step 8's verification checklist and RESEARCH.md lines 414–432. Use a table:
```markdown
## California Quick Reference

**Read this before starting any CA city.** These traps are CA-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Pre-existing CA seed | Step 1, Step 5 | CA govt row + 8 chambers + 8 politicians pre-existed; always pre-check before writing any CA state-level INSERT |
| districts.state casing | Step 3, Step 6 | Pre-existing CA districts use state='CA' (uppercase); lowercase 'ca' returns 0 rows |
| mtfcc swap | Step 3 | CA STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse); do NOT join on d.mtfcc — routing uses gb.mtfcc |
| External ID range collision | Step 5 | -1000xx range occupied by CA Assembly; CA House reps use -60003xx; always pre-check range |
| DataSF vs ArcGIS (outSR) | Step 3 | SF/Berkeley use Socrata (native WGS84, no outSR); LA/Sacramento/SD/Fremont/SJ use ArcGIS (must add outSR=4326) |
| SF consolidated city-county | Step 3 | SF returns G4110 + G4020 for any address — assert BOTH in smoke tests |
| CA COUSUB = CCDs | Step 3 | CA G4040 are all FUNCSTAT='S'; do NOT add CA to COUSUB_FUNCSTAT_STATES |
| CA jungle primary | Step 2 | ONE unified primary race row for ALL candidates; sos.ca.gov is authoritative (not Ballotpedia) |
| RCV at seed time | Step 2, Step 6 | Set election_method='rcv' on chamber row during structure migration — not as a follow-up TODO |
| AEM/CQ5 headshots (Sacramento) | Step 4 | cityofsacramento.gov embeds headshots in CSS background-image — use curl+grep, not WebFetch |
| lavote.gov election ID | Step 2 | ID changes per cycle (June + November); update discovery_jurisdictions row manually after each election |
```

**Step 7 pitfall table format** (lines 297–315 of current file):
```markdown
| Pitfall | How to Catch It |
|---------|----------------|
| Mayor modeled as LOCAL_EXEC when actually council-selected | Verify: does the Mayor appear on the ballot as a standalone race? If no — use LOCAL + is_appointed_position = true |
```

New CA rows to add (from RESEARCH.md lines 539–543):
```markdown
| CA jungle primary modeled as separate D/R primaries | CA uses top-two jungle primary — ONE unified race row for ALL candidates regardless of party; sos.ca.gov is authoritative |
| CA pre-existing seed silently duplicated | Before any CA state-level INSERT, run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`; if geo_id IS NULL, UPDATE — do not INSERT |
| ArcGIS outSR=4326 omitted for CA city boundaries | CA State Plane feet (SRID 2229) looks valid to PostGIS but ST_Covers returns 0 rows for all addresses — always add outSR=4326 to ArcGIS MapServer queries for CA cities |
| AEM/CQ5 CMS headshots not extractable by WebFetch | Sacramento cityofsacramento.gov uses CSS background-image — use curl+grep pattern |
| CA external_id range -1000xx occupied | CA Assembly pre-existing seed occupied -1000xx; CA House reps use -60003xx scheme |
```

**Edit approach (NOT full rewrite):** Per Phase 56-01-PLAN.md precedent (line 108: "Use the Edit tool for targeted changes; do NOT use Write to overwrite the whole file"), all changes to LOCATION-ONBOARDING.md must use the Edit tool for targeted insertions. The file is ~374 lines of working content.

---

### `.planning/ROADMAP.md` (documentation, transform)

**Analog:** Existing shipped milestone lines in ROADMAP.md (lines 5–13 of current file).

**Shipped milestone format** (lines 5–13):
```markdown
- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- ✅ **v6.0 Maine Essentials** — Phases 49-56 (shipped 2026-05-20) — [archive](milestones/v6.0-ROADMAP.md)
```

**Current v7.0 line** (line 14):
```markdown
- 🚧 **v7.0 California** — Phases 57-70, 78 (in progress)
```

**Target v7.0 line** (copy format from v6.0 shipped line — no archive link since none exists yet):
```markdown
- ✅ **v7.0 California** — Phases 57-70, 78 (shipped 2026-05-29)
```

**Phase 78 progress table row** (line 790):
```markdown
| 78. CA Playbook Retrospective | v7.0 | 0/1 | Pending | - |
```

Target:
```markdown
| 78. CA Playbook Retrospective | v7.0 | 1/1 | Complete | 2026-05-29 |
```

**Phase 78 plans section** (lines 546–547):
```markdown
Plans:

- [ ] 78-01-PLAN.md — Playbook retrospective: audit all v7.0 phase summaries for GOTCHAs; write CA section in LOCATION-ONBOARDING.md; close v7.0 milestone
```

Target (mark plan complete):
```markdown
Plans:

- [x] 78-01-PLAN.md — Playbook retrospective: audit all v7.0 phase summaries for GOTCHAs; write CA section in LOCATION-ONBOARDING.md; close v7.0 milestone
```

The v7.0 summary `<details>` block header (line 253) should also update from `🚧` to `✅`:
```markdown
<summary>✅ v7.0 California (Phases 57-70, 78) — SHIPPED 2026-05-29</summary>
```

---

### `.planning/STATE.md` (documentation, transform)

**Analog:** STATE.md Phase 56 closure (the last_activity and Current Position update pattern).

**current last_activity** (line 7):
```
last_activity: 2026-05-29 -- Phase 78 context gathered — CA Playbook Retrospective
```

**Target last_activity:**
```
last_activity: 2026-05-29 -- Phase 78 complete — CA Playbook Retrospective; v7.0 milestone shipped
```

**Current Position section** (lines 20–25):
```markdown
## Current Position

Phase: 77
Plan: All complete
Status: Complete
Last activity: 2026-05-29 -- Phase 77 complete
```

Target Current Position (update phase number and last activity; leave Phase 75/68/62/55 context lines untouched — they are reference notes not status):
```markdown
## Current Position

Phase: 78
Plan: 01 complete
Status: Complete
Last activity: 2026-05-29 -- Phase 78 complete; v7.0 milestone shipped
```

Note: RESEARCH.md open question A2 (line 562) confirms the `milestone: v2.2` YAML field should NOT be updated — it tracks the parked v2.2 milestone, not the active v7.0 work. Only `last_activity` and the `## Current Position` body are correct update targets.

---

### `.planning/PROJECT.md` (documentation, transform)

**Analog:** v6.0 Maine Essentials validated entry pattern (lines 83–89 of current file).

**v6.0 entry format** (lines 83–89):
```markdown
- ✓ Maine TIGER geofences — 23 G4110 cities + 2 CD + 35 SLDU + 151 SLDL + 16 G4020 counties; any ME address routes to correct federal, state, and city representatives — v6.0
- ✓ Maine state + federal government DB — Governor Mills, legislature-elected AG/SoS/Treasurer (is_appointed_position=true), Collins + King (NATIONAL_UPPER), Pingree (ME-01) + Golden (ME-02); 6 chambers, all with headshots at 600×750 — v6.0
- ✓ 35 ME state senators + 151 ME house reps with offices linked to geofence districts; 185/185 headshots (senators full-res, house upscaled from 152×202 with approval) — v6.0
- ✓ All 23 ME city governments scaffolded; Portland deep seed (18 officials, RCV chambers, headshots); 5 Tier 2 cities (Lewiston/Bangor/South Portland/Auburn/Biddeford) with incumbents; 18 skeletal cities documented as known gaps — v6.0
- ✓ 380 ME race rows for 2026 elections — 13 Governor candidates (open seat, SOS-verified), US Senate (Collins + 2 challengers), 2 US House races, 372 legislative scaffold rows; discovery cron armed for 2026-06-09 + 2026-11-03 — v6.0
- ✓ ME Playbook retrospective — 9 Maine GOTCHAs added to LOCATION-ONBOARDING.md; 5 templates updated (legislature headshots, multi-tier seeding, PowerShell generator, RCV chamber, legislature-elected=appointed) — v6.0
- ✓ Landing.jsx Maine entry — Portland city browse (browseGovernmentList=['2360545']) + ME state browse (browseStateAbbrev='ME') — v6.0
```

Pattern rules:
- Each bullet = one distinct capability/deliverable, not a phase
- Format: `- ✓ [Capability description] — [key numbers or facts] — v[milestone]`
- Grouped by domain (geofences → state DB → legislature → cities → elections → playbook → landing)
- Current milestone section (lines 91–114) has the `### Current Milestone: v7.0 California` heading with active/unchecked items

**What changes in PROJECT.md:**
1. The `### Current Milestone: v7.0 California` section becomes a Validated block — the heading and `### Active` subsection with unchecked requirements get replaced with v7.0 bullet entries under `### Validated`
2. New `### Current Milestone` section is needed for v8.0 Oregon (or left blank until a new discuss-phase)

**Target v7.0 Validated bullets** (from RESEARCH.md lines 476–485 — exact scope):
```markdown
- ✓ CA TIGER geofences — 482 G4110 cities + 404 G4040 CCDs + 80 SLDU + 40 SLDL + 52 CD + 58 G4020 counties; SF consolidated city-county (G4110+G4020 both returned); any CA address routes to correct tiers — v7.0
- ✓ LAUSD board district geofences (7 districts, mtfcc=G5420) + 7 LAUSD board member officials with offices linked to sub-district boundaries; LA address returns correct LAUSD board member — v7.0
- ✓ State of California government DB — 8 constitutional officers (pre-existing seed fixed: NULL geo_id updated to '06'); 120 CA state legislators (40 senators + 80 assembly); 54 federal officials (2 senators + 52 US House reps) — all with headshots at 600×750 — v7.0
- ✓ LA backlog closure — CA Governor 2026 race with all SOS-verified challenger candidates; lavote.gov election ID current (id=4338); LAUSD officials seeded; LA city structure gaps closed — v7.0
- ✓ 6 CA city deep seeds at full Tier 1 depth — SF (20 officials, 10 chambers, RCV, DataSF Socrata loader), San Jose (11 officials, RCV, ArcGIS DISTRICTINT), San Diego (11 officials, ArcGIS WKID 2230), Sacramento (9 officials, AEM/CQ5 curl+grep headshots), Fremont (7 officials, fremont.gov 403 workaround), Berkeley (10 officials, RCV, Socrata 'district' field) — v7.0
- ✓ CA 2026 elections — Governor race + 52 US House races + discovery pipeline armed (cron_active=true); lavote.gov discovery row; 7 CA city discovery_jurisdictions rows — v7.0
- ✓ 965 compass stances across 68 CA officials — SF 366, San Diego 164, Berkeley 126, San Jose 133, Sacramento 120, Fremont 56; all cited from public record — v7.0
- ✓ CA Playbook retrospective — 11 CA-specific GOTCHAs added to LOCATION-ONBOARDING.md; California Quick Reference block added; 7 new rows in Cities Onboarded table; v7.0 milestone closed — v7.0
```

---

## Shared Patterns

### Edit-not-Write rule (applies to ALL files in this phase)
**Source:** Phase 56-01-PLAN.md line 108, line 196 ("Use Edit tool for targeted changes; do NOT use Write")
**Apply to:** All four files — LOCATION-ONBOARDING.md, ROADMAP.md, STATE.md, PROJECT.md
All are existing files with content that must be preserved. Only targeted edits. The Write tool would overwrite.

### GOTCHA tag taxonomy
**Source:** `LOCATION-ONBOARDING.md` (current file, multiple lines)
**Apply to:** All new CA GOTCHAs in LOCATION-ONBOARDING.md
```markdown
> [GOTCHA] **[Universal description]:**          ← no state prefix, applies everywhere
> [GOTCHA] **[STATE-SPECIFIC] ME-specific:**     ← existing Maine GOTCHAs tag pattern
> [GOTCHA] **[STATE-SPECIFIC: CA] CA-specific:** ← new pattern for CA GOTCHAs (from RESEARCH.md)
```

### Milestone emoji encoding
**Source:** ROADMAP.md lines 5–14
**Apply to:** ROADMAP.md milestone header and `<details>` summary tag
- In-progress = `🚧`
- Shipped = `✅`
- Parked = `🚧` (same as in-progress, just noted in text)
- The emoji characters must be used exactly — no ASCII substitutes

### Checkbox format for plan rows
**Source:** ROADMAP.md plans sections throughout
**Apply to:** Phase 78 plans section in ROADMAP.md
- Incomplete: `- [ ]`
- Complete: `- [x]`

---

## No Analog Found

None. All four files have exact analogs in the codebase (prior playbook retrospective Phase 56 established every pattern used here).

---

## Metadata

**Analog search scope:** `LOCATION-ONBOARDING.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `.planning/phases/56-me-playbook-retrospective/56-01-PLAN.md`
**Files scanned:** 7 (CONTEXT.md, RESEARCH.md, LOCATION-ONBOARDING.md, ROADMAP.md, STATE.md, PROJECT.md, 56-01-PLAN.md)
**Pattern extraction date:** 2026-05-29
