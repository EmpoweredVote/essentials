# Phase 82: OR State Legislature Compass Stances — Research

**Researched:** 2026-05-31
**Domain:** Compass stance ingestion — OR state legislature (30 senators + 60 house reps)
**Confidence:** HIGH (architecture, tooling, all 90 UUIDs, all topic IDs verified from live DB)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Primary source: OregonLegislature.gov bill/vote history — official public record; strongest verifiable evidence; best citation quality.
- **D-02:** Secondary source: Oregon Voter's Pamphlet (sos.oregon.gov) + Ballotpedia — uniquely rich for OR candidates who write their own issue statements.
- **D-03:** Tertiary source: Campaign websites + local/regional news (OPB, The Oregonian) — only if primary and secondary yield nothing for a topic.
- **D-04:** Not-found: if all three source tiers yield nothing for a legislator, document as not-found. Zero stances is acceptable and explicitly not a failure.
- **D-05:** Sub-batches of ~10 politicians within each plan (82-01 senators, 82-02 house reps).
- **D-06:** Per-person flow: research agent → CSV rows produced → apply script run against production DB → next person. Live DB updated per-person before proceeding.
- **D-07:** Commit CSV data files and apply script artifacts after each group of ~10 completes.
- **D-08:** One clean numbered SQL migration produced once at the very end of all sub-batches in that plan (migration 242 for senators, migration 243 for house reps).
- **D-09:** All 90 legislators held to same acceptance standard — no tiered effort thresholds.
- **D-10:** Evidence asymmetry expected: Portland-metro/Willamette Valley legislators yield richer records; Eastern Oregon members are expected to yield sparser results. Stop at tertiary sources and document not-found where evidence is absent.
- **D-11:** ONE-AT-A-TIME rule: each stance research agent must run sequentially. NEVER parallel. Hard constraint.
- **D-12:** Evidence-only: no stances without a verifiable, citable public record. No interpolation, no party assumption.
- **D-13:** Value scale: 1=progressive, 5=conservative, integer values 1-5. Half-steps reserved for extreme edge cases only.
- **D-14:** Research ALL compass topics — not just local-scope ones. Aim for 18-21+ stances; record only what has evidence.
- **D-15:** Apply script pattern: TypeScript, CSV input, ON CONFLICT DO UPDATE, parseInt(r.value) direct — no conversion.

### Claude's Discretion

- None specified — all implementation decisions are locked via D-01 through D-15.

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope.
- OR constitutional officers, federal officials, Portland council — covered in Phase 80.
- CA/ME/TX state legislature stances — explicitly deferred to future milestones.
- New state geofences, government body seeding, elections data — Phase 81 dependency already satisfied.
- Any frontend UI changes — compass renders automatically from existing politician_answers rows.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STANCE-01 | All 30 OR state senators have compass stance research completed and values ingested into inform.politician_answers (evidence-only, public record citations required) | All 30 senator UUIDs verified from live DB; 0 existing stance rows confirmed; apply script pattern established |
| STANCE-02 | All 60 OR house reps have compass stance research completed and values ingested into inform.politician_answers (evidence-only, public record citations required) | All 60 house rep UUIDs verified from live DB; 0 existing stance rows confirmed; same apply script pattern applies |
| STANCE-03 | All ingested stance values are written to production via a numbered SQL migration (starting at migration 242) | Migration 241 is confirmed last applied; 242 is next available; migration format established from CA legislature (migrations 233-234) |
| STANCE-04 | Compass renders correctly on at least 3 senator and 3 house rep profile pages without errors (human-verified spot-check) | CompassCard gate logic documented; minimum 1 row in politician_answers triggers render |
| QUALITY-01 | Every ingested stance includes a verifiable citation URL from public record — no stance ingested without evidence | apply-tina-kotek-stances.ts pattern writes politician_context citation rows inline with every answer INSERT |
| QUALITY-02 | Stance research agents run sequentially (one at a time) — never in parallel — per API rate limit enforcement | D-11 hard constraint; enforced by memory entry feedback_stance_research_one_at_a_time.md |
| QUALITY-03 | Legislators with no discoverable public stance record are documented as not-found; zero stances is acceptable | D-04 and D-10 locked decisions; Eastern OR members expected sparse by design |

</phase_requirements>

---

## Summary

Phase 82 ingests compass stances for all 90 OR state legislators: 30 senators (external_ids -4110001 through -4110030) and 60 house representatives (external_ids -4120001 through -4120060). As of 2026-05-31, zero stance rows exist for any of these 90 politicians — confirmed via live DB query. All 90 UUIDs are verified from the live production DB.

The ingestion architecture is identical to Phase 80 (OR constitutional officers + federal + Portland council). No schema changes, no bridge migrations, and no new infrastructure are required. The canonical apply script is `apply-tina-kotek-stances.ts` (Phase 80 pattern) — it writes both `inform.politician_answers` and `inform.politician_context` citation rows inline in a single pass. This is the upgraded pattern over the older `apply-allen-stances.ts` which did not write citations.

Evidence feasibility varies significantly by geography and tenure. Senators and representatives from Portland-metro (SD-17 through SD-25 area, HD-030 through HD-50 range) and Willamette Valley have documented legislative records, Voter's Pamphlet entries, and news coverage. Eastern Oregon and rural members (SD-01, SD-02, SD-05, SD-06, SD-09, SD-16, SD-28, SD-29, SD-30; HD-01 through HD-12, HD-51, HD-55 through HD-60) are expected to yield sparser records per D-10. The sub-batch structure (D-05 through D-08) ensures resilience: production DB is updated per-person and the final migration is produced as a clean end-of-wave artifact.

**Primary recommendation:** Follow the Phase 80 four-wave precedent adapted for 90 legislators: Plan 82-01 (senators, 3 sub-batches of 10), Plan 82-02 (house reps, 6 sub-batches of 10), Plan 82-03 (verification). Use `apply-tina-kotek-stances.ts` as the template for all new apply scripts.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance value storage | Database (inform schema) | — | `inform.politician_answers` is the single source of truth; UUID FK to `essentials.politicians.id` |
| Citation storage | Database (inform schema) | — | `inform.politician_context` (politician_id, topic_id, reasoning, sources[]) — required per answer |
| Compass widget render | Browser / Client | — | CompassCard gates on `politicianIdsWithStances` set; returns null if politician not in set |
| Stance availability signal | API / Backend | — | `GET /compass/politicians` returns politician UUIDs with ≥1 answer |
| CSV-to-DB apply | Backend script (local) | — | `apply-{slug}-stances.ts` runs locally via `npx tsx` against production DB |
| Stance research | Standalone agent (external) | — | Claude research agent reads public sources, outputs CSV; runs ONE AT A TIME per D-11 |
| Final migration | Database (SQL file) | — | One clean `242_or_senate_stances.sql` / `243_or_house_stances.sql` produced after all apply scripts run |

---

## Pre-Condition Verification (Confirmed 2026-05-31)

| Check | Query Result | Status |
|-------|-------------|--------|
| OR senator count (external_id -4110001 to -4110030) | 30 rows | PASS |
| OR house rep count (external_id -4120001 to -4120060) | 60 rows | PASS |
| Existing stance rows for any OR legislator | 0 rows | PASS — clean slate |
| Next migration number | 242 (last is 241_or_discovery_jurisdictions.sql) | VERIFIED |
| Live compass topics | 44 live, 6 retired | VERIFIED from DB |

---

## Definitive Politician Roster

### OR State Senators (30) — Migration 242

All UUIDs verified from live production DB (2026-05-31). Parties from Phase 75 roster.

| external_id | Full Name | UUID | Party | District | Evidence Expectation |
|-------------|-----------|------|-------|----------|---------------------|
| -4110001 | David Brock Smith | 5350c0ba-0ef4-4021-a620-90820df859b7 | Republican | SD-01 | LOW (rural coastal, sparse news) |
| -4110002 | Noah Robinson | 13ce589f-756e-4968-881f-c8cc95dae404 | Republican | SD-02 | LOW (rural southern OR) |
| -4110003 | Jeff Golden | 21b454d4-e6a5-48fe-9bd1-0da84f2a1a39 | Democratic | SD-03 | MEDIUM (Ashland/Medford — active OPB coverage) |
| -4110004 | Floyd Prozanski | b6f5cd9e-a9d2-44ff-9027-0d931765f378 | Democratic | SD-04 | MEDIUM-HIGH (long tenure, Eugene area) |
| -4110005 | Dick Anderson | d9803822-6bf8-437d-aa4b-d7e6b4a67b7c | Republican | SD-05 | LOW (Lincoln County, sparse) |
| -4110006 | Cedric Hayden | d3dedaa7-bda5-4e3d-af18-6214719d6e1e | Republican | SD-06 | LOW (rural southern, limited news trail) |
| -4110007 | James I. Manning Jr. | bef7b04c-a2ba-4daf-9359-ae1ae0e38e9e | Democratic | SD-07 | MEDIUM (Eugene area) |
| -4110008 | Sara Gelser Blouin | 1ca1abf1-9523-499c-b644-0b32c61257c6 | Democratic | SD-08 | HIGH (longtime senator, child welfare/disability advocate) |
| -4110009 | Fred Girod | 6b107b84-afbe-4141-8951-bafb65543dda | Republican | SD-09 | LOW-MEDIUM (Stayton/rural Willamette) |
| -4110010 | Deb Patterson | 631cc414-8793-42ec-b883-594ed7f0b249 | Democratic | SD-10 | MEDIUM (Salem area) |
| -4110011 | Kim Thatcher | b548a0f7-5086-4124-a510-49ef8f60f515 | Republican | SD-11 | MEDIUM (Newberg, documented conservative record) |
| -4110012 | Bruce Starr | 0c228d44-a876-4371-bdfd-13fdfd8ea9b6 | Republican | SD-12 | MEDIUM (Hillsboro area, long tenure) |
| -4110013 | Courtney Neron Misslin | dcdc002c-8fd6-415a-a30a-8fc70c83d9ff | Democratic | SD-13 | MEDIUM (Newberg/Yamhill) |
| -4110014 | Kate Lieber | 529ea93b-c234-4df5-ae22-6ba32d0ae9a4 | Democratic | SD-14 | MEDIUM-HIGH (Beaverton/Portland metro) |
| -4110015 | Janeen Sollman | fa9d50e7-7e9b-4eed-b105-bf8277b51f95 | Democratic | SD-15 | MEDIUM (Hillsboro area) |
| -4110016 | Suzanne Weber | d34df5c8-9534-4472-814d-971adff16f50 | Republican | SD-16 | LOW-MEDIUM (Tillamook/coast) |
| -4110017 | Lisa Reynolds | d910cf6e-7d70-4b0c-b883-2fe2dcb185b6 | Democratic | SD-17 | HIGH (Portland metro, active record) |
| -4110018 | Wlnsvey Campos | 95300e6e-ea4e-47f9-8a24-5f6f762d5c73 | Democratic | SD-18 | MEDIUM (Portland west side) |
| -4110019 | Rob Wagner | 14faa864-de9f-497f-a78a-db41f42ee5e0 | Democratic | SD-19 | HIGH (Lake Oswego/Portland, former Senate President pro tem) |
| -4110020 | Mark Meek | be46ed6d-363e-46f4-89d4-c95d9af67db1 | Democratic | SD-20 | MEDIUM (Clackamas County) |
| -4110021 | Kathleen Taylor | 4b4702e0-3b88-4fd0-aa17-aa379be0dbac | Democratic | SD-21 | MEDIUM (Portland SE) |
| -4110022 | Lew Frederick | ae4b1163-e9a7-4529-a8f2-5610f6c93cbd | Democratic | SD-22 | HIGH (Portland NE, long tenure, civil rights focus) |
| -4110023 | Khanh Pham | 80ed3ab4-f7f6-4738-a9b7-49e6f52ad61e | Democratic | SD-23 | MEDIUM-HIGH (Portland SE, immigrant rights focus) |
| -4110024 | Kayse Jama | a703adb5-1086-471b-ba8b-2dbeddd8102b | Democratic | SD-24 | MEDIUM-HIGH (Portland, refugee/immigration focus) |
| -4110025 | Chris Gorsek | 22a1e980-4f15-435d-a0c4-1a08202d6bb5 | Democratic | SD-25 | MEDIUM (Troutdale/Gresham) |
| -4110026 | Christine Drazan | 402a00be-71c3-4584-b29f-bf493365bffb | Republican | SD-26 | HIGH (former House Minority Leader + 2022 Gov nominee, very documented) |
| -4110027 | Anthony Broadman | 3af0dfad-d1a1-4c91-a859-6f17c5e238b9 | Democratic | SD-27 | MEDIUM (Bend area) |
| -4110028 | Diane Linthicum | 50eab431-7b51-4a56-acaa-61af3509c298 | Republican | SD-28 | LOW (Klamath Falls, rural Eastern OR) |
| -4110029 | Todd Nash | 86d23630-36ff-48a7-b2ac-6071a0cabd64 | Republican | SD-29 | LOW (Enterprise, very rural Eastern OR) |
| -4110030 | Mike McLane | 252a2adf-68a5-4b5a-9024-d5635e2fbd88 | Republican | SD-30 | MEDIUM (Prineville/Central OR, former House Minority Leader) |

**Sub-batch grouping for Plan 82-01 (senators):**
- Sub-batch A: SD-01 through SD-10 (David Brock Smith → Deb Patterson)
- Sub-batch B: SD-11 through SD-20 (Kim Thatcher → Mark Meek)
- Sub-batch C: SD-21 through SD-30 (Kathleen Taylor → Mike McLane)

---

### OR House Representatives (60) — Migration 243

All UUIDs verified from live production DB (2026-05-31). Parties from Phase 75 roster.

| external_id | Full Name | UUID | Party | District | Evidence Expectation |
|-------------|-----------|------|-------|----------|---------------------|
| -4120001 | Court Boice | 0e3b9216-cfb9-411f-b80e-684ccaae593f | Republican | HD-01 | LOW (rural southern coast) |
| -4120002 | Virgle Osborne | 558e9c8c-5e52-4685-9e24-1367810f8030 | Republican | HD-02 | LOW (rural southern OR) |
| -4120003 | Dwayne Yunker | f74bb46f-4e4a-47c0-a3d7-285e57cf8d4d | Republican | HD-03 | LOW (rural Klamath/Jackson) |
| -4120004 | Alek Skarlatos | 35d2729c-b754-4fad-b124-10ee437a116f | Republican | HD-04 | MEDIUM (Roseburg; Medal of Honor/Sgt. story; prior CD-4 Congressional candidate — documented record) |
| -4120005 | Pam Marsh | 03af5908-a069-4ab7-91db-2f388a885bf9 | Democratic | HD-05 | MEDIUM (Ashland/Rogue Valley) |
| -4120006 | Kim Wallan | 3778353d-cbc9-43cf-866a-a7c01397503a | Republican | HD-06 | LOW-MEDIUM (Medford area) |
| -4120007 | John Lively | f2b4e1d0-9603-42fd-b2b7-fefd7905ec3d | Democratic | HD-07 | MEDIUM (Springfield/Eugene area) |
| -4120008 | Lisa Fragala | 763d9c0d-e1a4-4ddd-b919-b1a70d1f99ac | Democratic | HD-08 | MEDIUM (Eugene area) |
| -4120009 | Boomer Wright | d5386673-4244-44ca-8e54-e1af61803f6e | Republican | HD-09 | LOW (rural Lane County) |
| -4120010 | David Gomberg | 00ddecfd-648a-4118-82e6-a60327068b32 | Democratic | HD-10 | MEDIUM (Lincoln County coast) |
| -4120011 | Jami Cate | c854f51f-0ab0-4b46-9397-596501e3ee67 | Republican | HD-11 | LOW (rural Linn/Benton) |
| -4120012 | Darin Harbick | f3fb09eb-adb0-4543-b6a2-32f90003569b | Republican | HD-12 | LOW (rural Lane County) |
| -4120013 | Nancy Nathanson | ca404c61-11af-43d9-9563-07dde3f7b8e7 | Democratic | HD-13 | MEDIUM-HIGH (Eugene, long tenure) |
| -4120014 | Julie Fahey | 24398310-8e0c-487e-a11c-253e3060f77c | Democratic | HD-14 | HIGH (Eugene; former House Majority Leader) |
| -4120015 | Shelly Boshart Davis | 4919fd6a-c250-47b2-a37d-37b1eec8c63d | Republican | HD-15 | MEDIUM (Albany/Linn County) |
| -4120016 | Sarah Finger McDonald | 2a116530-8d06-41b5-b965-50d943eae8c2 | Democratic | HD-16 | MEDIUM (Corvallis area) |
| -4120017 | Ed Diehl | ea9746ba-9fd2-4622-b781-b3ed35d18d17 | Republican | HD-17 | LOW (rural Linn County) |
| -4120018 | Rick Lewis | aa57168d-58b8-4f70-a937-09fdaf18b325 | Republican | HD-18 | LOW (Silverton/Marion County) |
| -4120019 | Tom Andersen | 5b81e68c-3ec3-4c81-9f1b-010db86da9c0 | Democratic | HD-19 | MEDIUM (Corvallis) |
| -4120020 | Paul Evans | e5c0549e-4454-4cea-b7dc-67eb17d28b49 | Democratic | HD-20 | MEDIUM (Monmouth/Mid-Willamette) |
| -4120021 | Kevin Mannix | 2edbb7a5-a798-4088-8939-7b44b51e682c | Republican | HD-21 | MEDIUM-HIGH (Salem; former AG candidate, long political record) |
| -4120022 | Lesly Muñoz | 7360da53-a6df-42d9-89b4-fff76af23de6 | Democratic | HD-22 | MEDIUM (Salem area) |
| -4120023 | Anna Scharf | 0cd6ccff-e02d-4cbe-a1df-381226292840 | Republican | HD-23 | LOW-MEDIUM (rural Marion/Polk) |
| -4120024 | Lucetta Elmer | 7bba19f8-0a1f-4ee2-852f-63bb38ffef6e | Republican | HD-24 | LOW (rural Yamhill) |
| -4120025 | Ben Bowman | 5e29b685-1f2e-4963-83a8-a7bde5b5250e | Democratic | HD-25 | MEDIUM (Tigard area) |
| -4120026 | Sue Rieke Smith | 0d5a4aeb-121f-461c-b379-a8a00c3b1ba1 | Democratic | HD-26 | MEDIUM (Washington County) |
| -4120027 | Ken Helm | 40ecc3a4-ca59-48c4-8b17-634cc385bc9a | Democratic | HD-27 | MEDIUM (Beaverton) |
| -4120028 | Dacia Grayber | c5640f05-239a-47fd-97f3-e284859c1cc9 | Democratic | HD-28 | MEDIUM (Portland west side) |
| -4120029 | Susan McLain | 3fbaa80c-be2d-411f-a3ab-95add9ae6c84 | Democratic | HD-29 | MEDIUM (Forest Grove) |
| -4120030 | Nathan Sosa | f2bc3bbf-0d29-4ad9-b675-9c53cf081969 | Democratic | HD-30 | MEDIUM (Hillsboro/Washington County) |
| -4120031 | Darcey Edwards | eab1011b-0cf3-4538-8842-292e7ab22291 | Republican | HD-31 | LOW (rural Washington/Columbia County) |
| -4120032 | Cyrus Javadi | cd8e1e6b-bd17-44e0-a8a3-deffc2f5982e | Democratic | HD-32 | MEDIUM (St. Helens/Columbia County) |
| -4120033 | Shannon Isadore | 2b9da845-9fab-406f-97c3-1afe895c254b | Democratic | HD-33 | MEDIUM-HIGH (Portland metro) |
| -4120034 | Mari Watanabe | bcc608a3-abf0-4a30-9c4b-0721dcf04be5 | Democratic | HD-34 | MEDIUM (Portland/Multnomah) |
| -4120035 | Farrah Chaichi | 62decede-7149-40a1-a68a-16e2d3eb62a6 | Democratic | HD-35 | MEDIUM (Beaverton/Washington County) |
| -4120036 | Hai Pham | 2e668344-f025-489a-b870-1803269c11fc | Democratic | HD-36 | MEDIUM (Portland/Beaverton) |
| -4120037 | Jules Walters | b5d3a442-3229-412a-8da4-e8eb8b9fdb3a | Democratic | HD-37 | MEDIUM (Portland west) |
| -4120038 | Daniel Nguyễn | 73519742-09c3-4204-871b-076ff1397a14 | Democratic | HD-38 | MEDIUM (Portland/Beaverton) |
| -4120039 | April Dobson | 0bffa985-c83b-41c3-8901-19b7dac86cd7 | Democratic | HD-39 | MEDIUM (Portland) |
| -4120040 | Annessa Hartman | 14896652-e36b-4823-afb0-e92e3338929c | Democratic | HD-40 | MEDIUM (Portland) |
| -4120041 | Mark Gamba | 36db8c55-4b20-408c-bd99-b8488d0ef344 | Democratic | HD-41 | HIGH (Milwaukie; climate champion, documented record) |
| -4120042 | Rob Nosse | c5c49832-aa2d-477e-b44e-d6059a98d426 | Democratic | HD-42 | HIGH (Portland SE; long tenure, LGBTQ+ healthcare focus) |
| -4120043 | Tawna D. Sanchez | 051b4e9a-6966-45b3-9b65-e23ad4672364 | Democratic | HD-43 | HIGH (Portland; tribal/Native American advocate, well documented) |
| -4120044 | Travis Nelson | 0f7439ad-5832-42e9-a1c5-75f1720e14d3 | Democratic | HD-44 | MEDIUM-HIGH (Portland; education/labor focus) |
| -4120045 | Thủy Trần | 9ada0539-e66c-444f-b220-86a8138b5277 | Democratic | HD-45 | MEDIUM (Portland; Vietnamese community rep) |
| -4120046 | Willy Chotzen | d3371858-924e-4f76-b756-f2d7bb3c9b8d | Democratic | HD-46 | MEDIUM (Portland NE) |
| -4120047 | Andrea Valderrama | a5a3918c-3e24-44fa-9573-440436a05b04 | Democratic | HD-47 | MEDIUM-HIGH (Portland; environmental justice focus) |
| -4120048 | Lamar Wise | e0b21a1d-8c55-4aa9-a58a-d6b69db9f716 | Democratic | HD-48 | MEDIUM (Portland SE) |
| -4120049 | Zach Hudson | 37247ac1-5444-4fdd-b58e-123b5db4d0fe | Democratic | HD-49 | MEDIUM (Troutdale/East Metro) |
| -4120050 | Ricki Ruiz | 5e5e267a-808e-4a57-9f80-7c3e47fcb5f6 | Democratic | HD-50 | MEDIUM (Gresham) |
| -4120051 | Matt Bunch | ce386a55-7cc5-4006-89db-97e06e0e0279 | Republican | HD-51 | LOW-MEDIUM (Coos Bay area) |
| -4120052 | Jeff Helfrich | 701f0236-5ca7-4bfa-ab71-8c22bcc5ff8c | Republican | HD-52 | LOW (Hood River/rural Columbia Gorge) |
| -4120053 | Emerson Levy | f1d2cfe6-5e70-42f3-a010-bb58ec6a5d86 | Democratic | HD-53 | MEDIUM (Lake Oswego) |
| -4120054 | Jason Kropf | bbc19752-8675-48ef-87fb-480e3f8bf3f6 | Democratic | HD-54 | MEDIUM (Bend area) |
| -4120055 | E. Werner Reschke | 3c7c9b46-a054-41a7-8752-f0d8706f754d | Republican | HD-55 | LOW (Klamath Falls area) |
| -4120056 | Emily McIntire | 9f9b60c1-483c-4a8e-8221-145098204ced | Republican | HD-56 | LOW (rural Klamath/Lake) |
| -4120057 | Gregory Smith | 81cda574-d820-4ac3-b7fe-0ac3d2638c28 | Republican | HD-57 | LOW (Heppner/rural Eastern OR) |
| -4120058 | Bobby Levy | 05152597-fd40-49bb-bcd3-9e21945ae8b0 | Republican | HD-58 | LOW (rural Eastern OR) |
| -4120059 | Vikki Breese-Iverson | 7f460988-c9a6-4452-a872-441e7c4ac071 | Republican | HD-59 | LOW (Bend/Central OR) |
| -4120060 | Mark Owens | ca7c06f8-d4cf-4bec-947f-fb39a00e2cb1 | Republican | HD-60 | LOW (rural Eastern OR) |

**Sub-batch grouping for Plan 82-02 (house reps):**
- Sub-batch A: HD-01 through HD-10 (Court Boice → David Gomberg)
- Sub-batch B: HD-11 through HD-20 (Jami Cate → Paul Evans)
- Sub-batch C: HD-21 through HD-30 (Kevin Mannix → Nathan Sosa)
- Sub-batch D: HD-31 through HD-40 (Darcey Edwards → Annessa Hartman)
- Sub-batch E: HD-41 through HD-50 (Mark Gamba → Ricki Ruiz)
- Sub-batch F: HD-51 through HD-60 (Matt Bunch → Mark Owens)

---

## Standard Stack

### Core (no changes from Phase 80 — fully established)

| Component | Purpose | Source |
|-----------|---------|--------|
| `inform.politician_answers` | Stores (politician_id, topic_id, value) stance rows — ON CONFLICT DO UPDATE | [VERIFIED: live DB, Phase 18 architecture] |
| `inform.politician_context` | Stores citation (reasoning text + sources[] array) per answer | [VERIFIED: live DB, apply-tina-kotek-stances.ts] |
| TypeScript apply script | CSV → DB ingestion (one per sub-batch or person); runs via `npx tsx` | [VERIFIED: C:/EV-Accounts/backend/scripts/] |
| csv-parse/sync | CSV parsing in apply scripts | [VERIFIED: existing scripts compile and run] |
| pg (node-postgres) | DB connection in apply scripts | [VERIFIED: existing scripts] |
| dotenv/config | DATABASE_URL injection for apply scripts | [VERIFIED: existing scripts] |

### Apply Script Pattern (canonical — Phase 80 upgraded version)

Copy `apply-tina-kotek-stances.ts` (NOT `apply-allen-stances.ts`). The Kotek script is the Phase 80 upgraded pattern that writes `politician_context` citation rows inline. The allen script is an older pattern that only writes `politician_answers`.

```typescript
// Source: C:/EV-Accounts/backend/scripts/apply-tina-kotek-stances.ts (CANONICAL for Phase 82)
import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function extractSource(notes: string): string | null {
  const match = notes.match(/https?:\/\/\S+/);
  return match ? match[0] : null;
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'stance-research', 'YYYY-MM-DD-{first-last}.csv');
  const csv = readFileSync(csvPath, 'utf8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;

  let upserted = 0, skipped = 0;
  for (const r of rows) {
    if (!r.value || r.value === 'null' || r.value === '') { skipped++; continue; }
    await pool.query(
      `INSERT INTO inform.politician_answers (politician_id, topic_id, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value`,
      [r.politician_id, r.topic_id, parseInt(r.value)]
    );
    // Write citation row inline — reasoning from notes, first URL extracted
    const source = extractSource(r.notes);
    const sources = source ? [source] : [];
    await pool.query(
      `INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources`,
      [r.politician_id, r.topic_id, r.notes, sources]
    );
    upserted++;
  }
  console.log(`Done — Upserted: ${upserted}, Skipped: ${skipped}`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
```

**Critical warnings:**
- Do NOT use `apply-allen-stances.ts` as template — it omits citation row writes. [VERIFIED: source file comparison]
- Do NOT use `apply-solis-stances.ts` — it uses `3 - parseInt(r.value)` (scale inversion). This is an outlier; do not copy. [VERIFIED: Phase 80 RESEARCH.md pitfall documentation]
- `parseInt(r.value)` with NO arithmetic — value is 1=progressive, 5=conservative directly from CSV. [VERIFIED: all Phase 80 apply scripts]

### CSV Format (canonical)

```csv
politician_id,topic_id,topic_key,value,notes
5350c0ba-0ef4-4021-a620-90820df859b7,af2fdfd6-02c4-49df-b09c-cf8536f4773f,abortion,2,"Voted YES HB 2002 (reproductive healthcare access 2023); voted YES SB 1 (abortion access funding 2023) https://olis.oregonlegislature.gov/liz/2023R1/Downloads/CommitteeReport/1279"
```

- `politician_id` — `essentials.politicians.id` UUID from the roster tables above (NOT external_id)
- `topic_id` — `inform.compass_topics.id` UUID from the Live Compass Topics table below
- `topic_key` — human-readable slug (auditing only; not used by apply script)
- `value` — integer 1-5 (1=progressive, 5=conservative)
- `notes` — citation text including at least one URL from public record (URL is extracted by apply script for `politician_context.sources`)
- Empty/null `value` rows are skipped by apply script

### CSV Naming Convention

Pattern: `YYYY-MM-DD-{first-last}.csv`

Examples for Phase 82:
- `2026-05-31-david-brock-smith.csv`
- `2026-05-31-sara-gelser-blouin.csv`
- `2026-05-31-court-boice.csv`
- `2026-05-31-julie-fahey.csv`

Location: `C:/EV-Accounts/backend/data/stance-research/`

### Final Migration Structure (based on 233_ca_assembly_stances.sql pattern)

The final migration (242 for senators, 243 for house reps) consolidates all stance values written during sub-batch apply runs into a single idempotent SQL file. Pattern from migration 233 (CA Assembly stances):

```sql
-- ============================================================================
-- Migration 242: OR State Senate Stances — 30 Senators
-- ============================================================================
-- Purpose: Insert/upsert stance data for all 30 OR state senators.
-- Idempotency: ON CONFLICT DO UPDATE on both tables.
-- ============================================================================

BEGIN;

-- {senator full_name}, SD-{N}
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{uuid}', '{topic_id}', {value})
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{uuid}', '{topic_id}',
        $${reasoning text}$$,
        ARRAY['{citation_url}']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- ... all rows ...

COMMIT;
```

**Migration naming:** `242_or_senate_stances.sql` and `243_or_house_stances.sql`

---

## Live Compass Topics (44 topics — verified from DB 2026-05-31)

Use ONLY these IDs. Six retired IDs must never appear in new stance rows.

| topic_key | topic_id (UUID) | Title |
|-----------|-----------------|-------|
| abortion | af2fdfd6-02c4-49df-b09c-cf8536f4773f | Reproductive Rights and Abortion Access |
| ai-regulation | 666bf03d-81fc-4138-ab15-69ae734c9023 | Artificial Intelligence Oversight |
| campaign-finance | 92730f69-ae57-401c-8ad1-2d07834a895d | Campaign Finance Reform |
| childcare | c1ac1330-47f7-44ec-baf3-c913d926b97c | Childcare Affordability & Access |
| city-sanitation | 7687de4f-4d0b-462a-b803-bdfb23b16b42 | City Sanitation and Cleanliness |
| civil-rights | 0bc588c6-39e1-4084-b5de-cac909b8b762 | Civil Rights and Social Justice |
| climate-change | f1e44d66-5d27-4b51-b54f-b7ace86f6a3c | Climate Change and Environmental Protection |
| data-centers | 4559b513-0fd8-4ed1-babd-f3b554162f40 | Data Center Development & Energy Costs |
| deportation | 44905f3b-e105-4f6c-afc7-5d223813dbac | Deportation Priorities |
| economic-development | eb3d1247-0de1-4b7f-baec-7259861efd53 | Economic Development Incentives |
| fossil-fuels | a22215c3-6693-4bc2-b248-01aebba14570 | Fossil Fuel Policy |
| growth-and-development | fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4 | Growth and Development Pace |
| healthcare | e8dad4a8-eb93-4931-91f5-d8fb5d7dd529 | Healthcare Access |
| homelessness | 4938766b-b45a-46e3-93bd-b8b30651271a | Criminalization of Homelessness |
| homelessness-response | 6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f | Homelessness Response |
| housing | 669cac97-66a6-4087-b036-936fbe62efb3 | Affordable Housing |
| immigration | 4e2c69ce-591e-4197-9cd5-7aceff79d390 | Immigration and Treatment of Immigrants |
| jail-capacity | c267e137-0ff9-4e7d-9d13-e3cea1756cd0 | Jail Capacity and Incarceration Alternatives |
| judicial-access-to-justice | 9d45acaf-1ba4-4cb8-95e1-5ed985223b91 | Access to Justice |
| judicial-bail-pretrial | 1fab5edf-6151-4da0-9704-a7f2113ba54c | Bail and Pretrial Decisions |
| judicial-criminal-justice | 9db07b16-1076-4b7d-ad89-ebe7b51f4336 | Criminal Justice Approach |
| judicial-government-deference | e5e48f0e-8f3a-40e1-8080-889fea389603 | Judicial & Prosecutorial Discretion |
| judicial-interpretation | 448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee | Judicial Interpretation |
| judicial-police-accountability | 7bad33eb-e93e-4d94-8822-97212d49bde5 | Police Accountability |
| judicial-prosecution-priorities | abb99d95-cbb1-4617-8f8b-f220ef6028ca | Prosecution Priorities |
| judicial-transparency | 6674d87e-999d-433a-aab7-3f626f59fd5f | Transparency in Legal Proceedings |
| local-environment | 1935979c-b290-42e4-baa5-8cb0138b4ffa | Environmental Protection vs. Development |
| local-immigration | b9ccee94-ad96-4f10-b655-889d8e5abe92 | Local Immigration Enforcement |
| medicare/aid | cab61e8a-64fe-4bbd-bc08-fe9914d0091b | Medicare / Medicaid |
| misinformation | ddd65d64-9dc7-4208-a30f-59f4b9c0653d | Misinformation and the Role of Algorithms in Democracy |
| public-safety-approach | e9ebefcd-c496-45e8-b816-a79f8442ba85 | Public Safety Approach |
| redistricting | 48cc9585-ec22-4f53-8d42-6839828dd36f | State Redistricting and Gerrymandering |
| religious-freedom | 6b9ba6d9-1001-43f5-b073-4d37130696fd | Religious Freedom |
| rent-regulation | c308e8e8-caac-44f5-ab04-dbfecf40bbe2 | Rent Regulation |
| residential-zoning | d4f18138-a2e0-4110-b925-7387d9d0d16d | Residential Zoning |
| same-sex-marriage | c5ab4eab-702f-49b8-9277-8ea53f3835c6 | Same-Sex Marriage |
| school-vouchers | 00b95a6a-75db-4521-b523-3326bba938de | School Vouchers & Public Education Funding |
| social-security | 87d20824-a6e9-407b-983c-65440084a0ab | Social Security |
| tariffs | 683c8084-2281-4920-a07c-18439b2dd413 | United States Tariff Policy |
| taxes | f7e5678d-dadd-4556-a2fc-446e24642ceb | Taxation and Public Spending |
| trans-athletes | d1618b9c-0b9e-45af-b986-bb33d270b8e4 | Transgender Athletes |
| transportation-priorities | ba59337e-30e2-4aba-a39a-426b3366eb27 | Transportation Priorities |
| ukraine-support | 24e9212c-b011-422a-865c-093e35050901 | Ukraine - Russia Conflict |
| voting-rights | d1792200-1d3b-4955-a0b7-0e6980d7a7b2 | Voting Rights and Electoral Integrity |

**Retired IDs — NEVER USE in new migrations (6 retired topics still exist in DB but is_live=false):**
- `f2a62698-...` — ai-regulation (old title: "Artificial Intelligence Regulation")
- `83eeb217-...` — deportation (old title: "Deportation of Immigrants")
- `be60844f-...` — healthcare (old title: "Healthcare Access and Affordability")
- `a9f53bc4-...` — housing (old title: "Affordable Housing and Homelessness")
- `c6957429-...` — immigration (old title: "Immigration Policy")
- `45ca4740-...` — taxes (old title: "Taxation and Government Spending")

**Note on judicial-* topics for state legislators:** These are designed primarily for judges and prosecutors, not legislators. Research agents should skip judicial-transparency, judicial-interpretation, judicial-government-deference, and judicial-bail-pretrial for most legislators — only include if there is direct, specific evidence (e.g., a senator who chairs the judiciary committee and has documented positions on these exact topics). Judicial-police-accountability, judicial-criminal-justice, public-safety-approach, and jail-capacity are broader in scope and may apply to legislators who have voted on criminal justice bills.

---

## Architecture Patterns

### System Architecture Diagram

```
Research agent (one at a time — D-11 HARD CONSTRAINT)
  → Reads OregonLegislature.gov bill/vote history (primary)
  → Reads Oregon Voter's Pamphlet + Ballotpedia (secondary)
  → Reads campaign sites + OPB/Oregonian (tertiary)
  → Outputs CSV: politician_id, topic_id, topic_key, value, notes
  → Saved to C:/EV-Accounts/backend/data/stance-research/YYYY-MM-DD-{first-last}.csv

Apply script (per person / per sub-batch)
  → npx tsx C:/EV-Accounts/backend/scripts/apply-{slug}-stances.ts
  → Reads CSV via csv-parse/sync
  → INSERT INTO inform.politician_answers ON CONFLICT DO UPDATE (value)
  → INSERT INTO inform.politician_context ON CONFLICT DO UPDATE (reasoning, sources)
  → Logs: "Done — Upserted: N, Skipped: M"
  → Commit CSV + script to git after sub-batch of ~10 complete (D-07)

Final migration (once per wave — D-08)
  → Consolidate ALL stance rows from sub-batch apply runs
  → Write 242_or_senate_stances.sql / 243_or_house_stances.sql
  → Apply via Supabase migration API
  → Log migration version in ledger

Compass render (automatic — no frontend changes needed)
  → GET /compass/politicians → returns politician UUIDs with ≥1 answer
  → CompassCard checks politicianIdsWithStances.has(politicianId)
  → If match: renders radar chart + StanceAccordion
```

### How Compass Renders (Gate Logic)

The compass widget will NOT render for a politician unless they have at least 1 row in `inform.politician_answers`. Minimum to trigger: 1 answer on any topic. [VERIFIED: 18-RESEARCH.md, CompassCard.jsx pattern]

```javascript
// CompassCard.jsx
if (!politicianIdsWithStances.has(politicianId)) return null;
```

### Recommended Project Structure

No new directories needed. All files go to existing locations:

```
C:/EV-Accounts/backend/
├── data/stance-research/          # CSV files: 2026-05-31-{first-last}.csv
├── scripts/                       # apply-{slug}-stances.ts scripts
└── migrations/
    ├── 242_or_senate_stances.sql  # End-of-wave migration (senators)
    └── 243_or_house_stances.sql   # End-of-wave migration (house reps)
```

### Per-Person Sub-Batch Flow (D-06 pattern)

```
FOR each senator/rep in sub-batch:
  1. Research agent runs (reads public sources, outputs CSV)
  2. CSV saved to data/stance-research/YYYY-MM-DD-{name}.csv
  3. New apply script created: scripts/apply-{slug}-stances.ts
  4. Apply script run: cd C:/EV-Accounts/backend && npx tsx scripts/apply-{slug}-stances.ts
  5. Verify: stance count logged to console
  6. Next person (NEVER parallel)

AFTER sub-batch of ~10 complete:
  7. Commit CSV files + apply scripts to git (D-07)

AFTER all sub-batches in wave complete:
  8. Produce final migration SQL (242 or 243)
  9. Apply migration via Supabase API
  10. Log in migration ledger
```

---

## Evidence Feasibility by Group

### Senators — Evidence Expectations

**HIGH confidence of 10+ stances:**
- SD-08 Sara Gelser Blouin (long-serving, disability rights, child welfare — extensive documented record)
- SD-14 Kate Lieber (Portland metro, progressive legislative record)
- SD-17 Lisa Reynolds (Portland metro, active public record)
- SD-19 Rob Wagner (Lake Oswego/Portland, former Senate President pro tem)
- SD-22 Lew Frederick (Portland NE, civil rights focus, long tenure)
- SD-26 Christine Drazan (former House Minority Leader + 2022 gubernatorial candidate — the most documented OR Republican legislator)

**MEDIUM confidence of 5-10 stances:**
- SD-03 Jeff Golden (Ashland/Rogue Valley — active OPB coverage)
- SD-04 Floyd Prozanski (Eugene, long tenure, judiciary chair experience)
- SD-10 Deb Patterson (Salem, healthcare background)
- SD-11 Kim Thatcher (Newberg, documented conservative positions)
- SD-12 Bruce Starr (Hillsboro, long tenure)
- SD-14/15/18/20/21/23/24/25/27/30 — Willamette Valley/metro Democrats and Republicans with findable records

**LOW confidence (Eastern OR, rural, sparse news trail):**
- SD-01 David Brock Smith, SD-02 Noah Robinson, SD-05 Dick Anderson, SD-06 Cedric Hayden, SD-09 Fred Girod, SD-16 Suzanne Weber, SD-28 Diane Linthicum, SD-29 Todd Nash

### House Reps — Evidence Expectations

**HIGH confidence of 10+ stances:**
- HD-14 Julie Fahey (former House Majority Leader — very documented)
- HD-41 Mark Gamba (climate champion, Milwaukie)
- HD-42 Rob Nosse (Portland SE, LGBTQ+/healthcare focus, long tenure)
- HD-43 Tawna D. Sanchez (tribal advocate, well documented)

**MEDIUM confidence of 5-10 stances:**
- Most Willamette Valley and Portland-area house members (HD-13 through HD-50 range)
- HD-04 Alek Skarlatos (prior Congressional candidate — documented record)
- HD-21 Kevin Mannix (former AG candidate, long political record)

**LOW confidence (Eastern OR, rural):**
- HD-01 through HD-12 (mostly rural southern/coastal/Willamette Valley Republican members)
- HD-51 through HD-60 (Coos Bay through Eastern Oregon)

### Primary Evidence Sources for OR State Legislature

| Source | Use | Access |
|--------|-----|--------|
| **Oregon Legislature OLIS** (olis.oregonlegislature.gov) | Bill text, vote records by member, bill history | Free public access; search by member name or bill number |
| **Oregon Voter's Pamphlet** (sos.oregon.gov/elections/pages/voters-pamphlet.aspx) | Candidate statements — legislators write their own policy positions | Free; search by year and jurisdiction |
| **Ballotpedia** (ballotpedia.org) | Biographical summaries, election history, committee assignments | Free |
| **OPB News** (opb.org) | Regional news coverage of OR legislature; particularly strong for rural/Eastern OR members | Free |
| **The Oregonian/OregonLive** (oregonlive.com) | Metro Portland coverage; candidate Q&As; legislative session reporting | Free (limited articles) |
| **Campaign websites** | Issue positions, endorsements | Individual URLs |
| **Oregon Secretary of State Candidate Filing** (sos.oregon.gov) | Candidate contact info, party registration | Free |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV → DB ingestion | Custom SQL script | Copy `apply-tina-kotek-stances.ts` exactly | Pattern handles ON CONFLICT, citation rows, skip-empty logic |
| Topic ID lookup | DB query at runtime | Topic IDs table in this document | Already verified from live DB; hardcode in CSV |
| Politician ID lookup | DB query at runtime | UUID roster tables in this document | Already verified from live DB; hardcode in CSV |
| Bridge between schemas | FK migration | Not needed | `essentials.politicians.id` UUIDs used directly in `inform.politician_answers` |
| Value scale inversion | `3 - parseInt()` | `parseInt(r.value)` directly | solis script is an outlier; direct is canonical |
| Parallel research | Running 2+ agents at once | Sequential, one at a time | Rate limit exhaustion; D-11 hard constraint |

---

## Common Pitfalls

### Pitfall 1: Using apply-allen-stances.ts as Template (NEW for Phase 82)

**What goes wrong:** `apply-allen-stances.ts` does not write `politician_context` rows. Using it as template means all stance values are ingested but no citations are written — QUALITY-01 failure.

**Why it happens:** It is the most referenced example in prior documentation. Phase 80 introduced the upgraded pattern that writes citations inline.

**How to avoid:** Copy `apply-tina-kotek-stances.ts` (the most recent Phase 80 script). It writes both `politician_answers` and `politician_context` in a single pass.

**Warning signs:** Apply script logs "Upserted: N" but `SELECT COUNT(*) FROM inform.politician_context WHERE politician_id = '...'` returns 0.

### Pitfall 2: Parallel Research Agents

**What goes wrong:** Running multiple research agents simultaneously exhausts the Anthropic rate-limit quota; all runs fail or produce garbage.

**Why it happens:** Desire to speed up 90-person research by parallelizing.

**How to avoid:** Every plan task invoking a research agent must execute sequentially. No parallel research tasks. D-11 is absolute.

**Warning signs:** Rate limit errors mid-research; truncated or empty CSV output.

### Pitfall 3: Using apply-solis-stances.ts as Template

**What goes wrong:** `apply-solis-stances.ts` uses `3 - parseInt(r.value)` which inverts the value scale. A value of 1 becomes 2, value of 5 becomes -2 (mathematically wrong). Produces completely incorrect stances.

**How to avoid:** Never copy this script. Use `apply-tina-kotek-stances.ts`.

**Warning signs:** Compass shows progressive politicians as conservative and vice versa.

### Pitfall 4: Using Retired Topic IDs

**What goes wrong:** Using one of the 6 retired topic IDs (a9f53bc4, 45ca4740, f2a62698, 83eeb217, be60844f, c6957429) creates rows that point to is_live=false topics. The compass widget may not render these correctly.

**Why it happens:** Training data or old documentation references old topic IDs for housing, taxes, ai-regulation, deportation, healthcare, or immigration.

**How to avoid:** Use ONLY the 44 live topic IDs from the verified table in this document. The 6 retired topics have is_live=false and exist only due to topic_rewrites FK constraints.

**Warning signs:** SQL INSERT fails with FK violation, or topic appears blank on compass.

### Pitfall 5: Wrong UUID Type (external_id vs. politician UUID)

**What goes wrong:** Using `external_id` (integer like -4110001) in the CSV `politician_id` column instead of the `essentials.politicians.id` UUID (like 5350c0ba-...). Apply script fails with FK violation.

**How to avoid:** All CSV files must use UUID values from the roster tables in this document. The external_id is for human identification only.

**Warning signs:** FK violation or "invalid input syntax for type uuid" error in apply script.

### Pitfall 6: Fabricating Stances Without Evidence

**What goes wrong:** Research agent assigns values based on party affiliation ("Republican → value=4") rather than documented positions. Violates D-12 and QUALITY-01.

**How to avoid:** Every stance row must cite a specific source (OLIS bill URL, Voter's Pamphlet URL, news article URL). If no source exists for a topic, no row is produced — D-04 not-found is acceptable.

**Warning signs:** Notes column is empty, generic, or contains only party inference language.

### Pitfall 7: Applying Sub-Batch Stances Before Previous Sub-Batch Completes

**What goes wrong:** D-06 mandates per-person apply → next person. Skipping an apply run and applying in bulk at end means a mid-session crash loses work that could have been incrementally committed.

**How to avoid:** Each CSV must be applied immediately after research completes for that person before moving to the next person. Apply scripts are idempotent (ON CONFLICT DO UPDATE) — re-running is safe.

---

## Verification Architecture

`workflow.nyquist_validation` is absent from config.json — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual SQL + spot-checks (no automated test framework for stance ingestion) |
| Config file | None |
| Quick run command | SQL query via mcp__supabase-local |
| Full suite command | SQL count queries + browser profile spot-check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | SQL Command |
|--------|----------|-----------|-------------|
| STANCE-01 | All 30 senators have ≥0 stances (non-found documented) | SQL count | `SELECT p.full_name, COUNT(pa.politician_id) FROM essentials.politicians p LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id WHERE p.external_id BETWEEN -4110030 AND -4110001 GROUP BY p.id, p.full_name ORDER BY p.external_id DESC` |
| STANCE-02 | All 60 house reps have ≥0 stances (non-found documented) | SQL count | Same query with `BETWEEN -4120060 AND -4120001` |
| STANCE-03 | Migration 242 and 243 applied and idempotent | SQL / migration ledger | `SELECT version FROM migrations WHERE version IN ('242', '243')` |
| STANCE-04 | Compass renders on ≥3 senator + ≥3 house rep profiles | Browser spot-check | Navigate to profile pages; confirm CompassCard visible |
| QUALITY-01 | Every stance row has a citation (politician_context not null) | SQL count | `SELECT COUNT(*) FROM inform.politician_answers pa LEFT JOIN inform.politician_context pc ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id JOIN essentials.politicians p ON p.id = pa.politician_id WHERE p.external_id BETWEEN -4120060 AND -4110001 AND pc.politician_id IS NULL` — expect 0 |
| QUALITY-02 | Sequential execution (one-at-a-time) | Process audit | Manual — log each research run start/end time |
| QUALITY-03 | Not-found politicians documented | Documentation check | Review plan task outputs for explicit not-found notation per legislator |

### Coverage Summary Query (run after each wave completes)

```sql
-- Senator coverage gate
SELECT 
  p.full_name,
  p.external_id,
  COUNT(pa.politician_id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -4110030 AND -4110001
GROUP BY p.id, p.full_name, p.external_id
ORDER BY p.external_id DESC;
-- Expected: 30 rows; stance_count >= 0 for all (zero is acceptable per D-04)
```

```sql
-- Value range verification (all ingested values must be integers 1-5)
SELECT pa.value, COUNT(*) 
FROM inform.politician_answers pa
JOIN essentials.politicians p ON p.id = pa.politician_id
WHERE p.external_id BETWEEN -4120060 AND -4110001
GROUP BY pa.value
ORDER BY pa.value;
-- Expected: only values 1, 2, 3, 4, or 5 — no decimals, no out-of-range
```

```sql
-- Citation coverage verification (every answer must have a context row)
SELECT COUNT(*) AS missing_citations
FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc 
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
JOIN essentials.politicians p ON p.id = pa.politician_id
WHERE p.external_id BETWEEN -4120060 AND -4110001
  AND pc.politician_id IS NULL;
-- Expected: 0
```

### Spot-Check Targets for Plan 82-03 (Verification)

| Politician | Group | UUID | Check |
|-----------|-------|------|-------|
| Sara Gelser Blouin | Senator (HIGH evidence) | 1ca1abf1-9523-499c-b644-0b32c61257c6 | COUNT(stances) ≥ 8; compass renders at profile URL |
| Christine Drazan | Senator (R, HIGH evidence) | 402a00be-71c3-4584-b29f-bf493365bffb | COUNT(stances) ≥ 5; values skew 3-5; compass renders |
| Todd Nash | Senator (LOW evidence, Eastern OR) | 86d23630-36ff-48a7-b2ac-6071a0cabd64 | stance_count may be 0 — acceptable; document not-found |
| Julie Fahey | House rep (HIGH evidence) | 24398310-8e0c-487e-a11c-253e3060f77c | COUNT(stances) ≥ 8; compass renders |
| Rob Nosse | House rep (HIGH evidence) | c5c49832-aa2d-477e-b44e-d6059a98d426 | COUNT(stances) ≥ 6; compass renders |
| Mark Owens | House rep (LOW evidence, Eastern OR) | ca7c06f8-d4cf-4bec-947f-fb39a00e2cb1 | stance_count may be 0 — acceptable; document not-found |

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Apply scripts wrote only politician_answers rows | apply-tina-kotek-stances.ts writes politician_context citations inline | Phase 80 (2026-05-30) | Must use Kotek pattern for Phase 82; allen pattern is insufficient |
| Assumed essentials schema bridge needed | essentials.politicians.id UUIDs used directly in inform.politician_answers | Phase 18 (confirmed) | No bridge migration needed |
| apply-solis-stances.ts value inversion | parseInt(r.value) direct, no conversion | Corrected post-Phase 18 | CSV values must be 1=progressive, 5=conservative directly |
| Compass phases used 3-plan structure (Phase 70 CA) | Phase 82 uses 3-plan wave structure (senators/house reps/verification) | Phase 80 precedent | 3 plans total (82-01 through 82-03) |
| 6 topic IDs retired via topic_rewrites migration | 44 live topics; retired IDs still exist in DB but is_live=false | Migration 102 (2026-04-14) | Must use live IDs only; memory entry project_compass_live_topic_ids.md confirmed against live DB |

---

## Package Legitimacy Audit

No new packages are installed in this phase. All apply script dependencies (csv-parse, pg, dotenv) were installed in prior phases and are present in `C:/EV-Accounts/backend/package.json`. [VERIFIED: existing apply scripts compile and run successfully]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `DATABASE_URL` env var | apply scripts | Verified (Phase 80 scripts ran 2026-05-30) | — | — |
| csv-parse/sync | apply scripts | Verified (Phase 80 scripts ran) | installed | — |
| pg (node-postgres) | apply scripts | Verified (Phase 80 scripts ran) | installed | — |
| dotenv/config | apply scripts | Verified (Phase 80 scripts ran) | installed | — |
| mcp__supabase-local | verification SQL | Verified (live remote prod DB) | — | — |
| Anthropic API | stance research agents | Available | — | None; rate-limit enforced by one-at-a-time rule |
| OregonLegislature.gov OLIS | primary evidence source | Public web access | — | Ballotpedia as secondary |

No missing dependencies. All tooling established and verified in prior phases.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Evidence asymmetry (Eastern OR vs. Portland metro) matches training knowledge pattern | Evidence Feasibility | If Eastern OR members have more documented positions than expected, stance count is higher (positive surprise); plan already accepts zero stances so no failure case |
| A2 | Christine Drazan's gubernatorial candidate record (2022) makes her the most-documented OR Republican legislator | Evidence Feasibility | If record is harder to find, fall back to Ballotpedia and legislative vote history; MEDIUM floor still achievable |
| A3 | OLIS (olis.oregonlegislature.gov) provides searchable vote records by member for the current and prior session | Evidence Sources | If OLIS search is down or structure changed, fall back to individual member pages on oregonlegislature.gov |
| A4 | judicial-* topics are generally not applicable to state legislators unless directly evidenced | Topic Guidance | If a legislator chairs judiciary committee and has documented positions, judicial-criminal-justice / judicial-police-accountability may apply; research agent should use judgment |

**If this table is empty:** All claims in this research were verified or cited. The 4 assumptions above are LOW-risk and do not affect architecture decisions.

---

## Open Questions

1. **HD-22 Lesly Muñoz / HD-38 Daniel Nguyễn — Unicode in CSV**
   - What we know: These names contain Unicode diacriticals (ñ, ễ) that caused PowerShell encoding issues in Phase 75 generator scripts.
   - What's unclear: Whether CSV files with Unicode in the `notes` column will parse correctly via csv-parse/sync on Windows.
   - Recommendation: CSV `notes` column should use ASCII-safe citation text. The `politician_id` and `topic_id` columns are UUIDs — no Unicode risk. If agent produces Unicode in notes, it will pass through correctly since Node.js reads UTF-8 by default; no action needed.

2. **Migration 242/243 — Decimal vs. Integer values**
   - What we know: Migration 233 (CA Assembly) used `2.0` float notation; apply scripts use `parseInt()` which rounds to integer.
   - What's unclear: Whether the final migration SQL should use `2` (integer) or `2.0` (float) notation.
   - Recommendation: Use integer notation (`2` not `2.0`) in migration SQL to match the apply script behavior and keep values semantically clean. The `politician_answers.value` column accepts both; integers are canonical.

---

## Sources

### Primary (HIGH confidence — verified from live systems 2026-05-31)

- Live production DB (mcp__supabase-local) — all 90 UUIDs, zero existing stances, 44 live topic IDs, next migration = 242
- `C:/EV-Accounts/backend/scripts/apply-tina-kotek-stances.ts` — canonical apply script pattern (Phase 80 upgraded version with inline citation writes)
- `C:/EV-Accounts/backend/scripts/apply-allen-stances.ts` — prior pattern (citations omitted); confirmed as insufficient for Phase 82
- `C:/EV-Accounts/backend/migrations/` — filesystem listing confirms 241 is last migration
- `.planning/milestones/v8.0-phases/75-or-state-legislature/75-01-SUMMARY.md` — 30 senator UUIDs (cross-referenced against live DB)
- `.planning/milestones/v8.0-phases/75-or-state-legislature/75-02-SUMMARY.md` — 60 house rep UUIDs (cross-referenced against live DB)
- `.planning/milestones/v8.0-phases/80-or-compass-stances/80-RESEARCH.md` — apply script pattern, pitfalls, architecture (direct Phase 80 predecessor)
- `.planning/phases/82-or-state-legislature-compass-stances/82-CONTEXT.md` — locked decisions D-01 through D-15

### Secondary (MEDIUM confidence — referenced from canonical research)

- `C:/EV-Accounts/backend/migrations/233_ca_assembly_stances.sql` — final migration format pattern (politician_answers + politician_context ON CONFLICT DO UPDATE)
- `project_compass_live_topic_ids.md` (memory) — 6 retired topic IDs cross-referenced against live DB query result

### Tertiary (LOW / [ASSUMED])

- Evidence feasibility assessments per senator/rep — [ASSUMED] based on training knowledge of OR political geography and legislative history; verify during execution via OLIS and Ballotpedia

---

## Metadata

**Confidence breakdown:**
- Architecture (apply script, DB schema, widget gate): HIGH — confirmed from live source files and Phase 80 precedent
- Politician UUIDs: HIGH — verified from live production DB (2026-05-31)
- Topic IDs (all 44 live): HIGH — verified from live production DB (2026-05-31)
- Migration number (242 next): HIGH — filesystem listing of C:/EV-Accounts/backend/migrations/
- Plan structure (3 waves): HIGH — follows Phase 80 four-plan + Phase 70 three-plan precedent
- Evidence feasibility (senators/reps): LOW-MEDIUM — [ASSUMED] from training knowledge of OR political geography; Eastern OR low confidence is the known pattern per D-10

**Research date:** 2026-05-31
**Valid until:** 2026-07-31 (architecture is stable; UUIDs are stable; topic IDs are stable; evidence sources may evolve but established pattern holds)
