# Phase 98: MD Compass Stances — House Delegates (Wave 2) - Research

**Researched:** 2026-06-07
**Domain:** Compass stance research + SQL migration ingestion for 141 MD House Delegates
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** 141 delegates split across **7 plans of ~20 delegates each**. Migration numbering starts at 286 and runs through 292.

**D-02:** Batch boundaries align with MD legislative district numbers. Exact cutpoints are researcher's call after querying the DB.

**D-03:** Rolling migrations — one migration per plan:
- Migration 286: delegates batch A (~20 delegates, districts 1–~7)
- Migration 287: delegates batch B (~20 delegates)
- Migration 288: delegates batch C (~20 delegates)
- Migration 289: delegates batch D (~20 delegates)
- Migration 290: delegates batch E (~20 delegates)
- Migration 291: delegates batch F (~20 delegates)
- Migration 292: delegates batch G (~20 delegates) + compass render verification

**D-04:** Each migration generated via `gen_migration.py` (in `C:/EV-Accounts/backend/data/stance-research/`). Applied via `mcp__supabase-local__apply_migration`.

**D-05:** Embed verification in the **last batch plan (Plan 98-07)**. After migration 292 is applied, verify compass renders correctly on at least 3 senators (from Phase 97 data) + 3 delegates (from Phase 98 data).

**D-06:** Same as Phase 97 senators — EXCLUDED_TOPICS_FEDERAL applies: `data-centers`, `local-immigration`, `transportation-priorities` excluded. All other compass topics are in scope. Aim for 15-20+ covered topics per delegate using evidence-only stances.

**D-07:** One research agent per delegate, sequential. Never parallel.

**D-08:** Evidence-only constraint — every stance row must have at least one non-null `source_url`.

**D-09:** Not-found delegates documented as `-- NOTE: No stances found in CSV for {name} ({pid})` within the generated migration SQL.

**D-10:** CSV format: `full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3` — no politician_id in CSV; politician_id comes from the candidate_inventory list in gen_migration.py.

### Claude's Discretion

- **Exact district-range batch boundaries:** Researcher queries DB to determine batch boundaries; splits aim for ~20 delegates per plan.
- **A/B subdistrict handling:** Some MD districts have A/B subdistricts (e.g., 3A, 3B with 2 delegates each instead of 3). Researcher groups these within the same batch as their parent district number.
- **Primary sources for delegates:** mgaleg.maryland.gov (voting record), ballotpedia.org, ontheissues.org. For delegates with minimal online presence, fewer stances are acceptable — cite what exists; don't fabricate.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-STANCES-03 | Compass stances for all 141 MD house delegates, one agent at a time, evidence-only | Full delegate roster with politician_ids verified from DB; batch boundaries defined below |
| MD-STANCES-04 | Compass renders correctly on spot-checked MD official profiles (human-verified) | Embed in Plan 98-07 after migration 292; spot-check 3 senators + 3 delegates |
</phase_requirements>

---

## Summary

Phase 98 is a pure data-ingestion phase: research compass stances for all 141 MD House Delegates (one research agent per delegate, sequential) and ingest them via 7 numbered SQL migrations (286–292). The pattern is identical to Phase 97 senators — same gen_migration.py tool, same CSV format, same EXCLUDED_TOPICS_FEDERAL exclusion set, same evidence-only constraint.

The delegate roster has been queried from production and all 141 politician_ids are confirmed. The 141 delegates span 47 districts in 3 structural categories: whole districts (geo_ids 24003–24047, 3 delegates each), A/B/C tripartite subdistricts (geo_ids 24xxA/B/C, 1 delegate each), and A/B split subdistricts (geo_ids 24xxA/B, 2+1 or 1+2 splits). District 42A is vacant (is_vacant=true) and is skipped for research but must appear in the candidate_inventory with a not-found comment.

The next migration is 286 (confirmed: migrations 282–285 were the last applied in Phase 97). Zero MD delegate stances exist in production (confirmed by query). The compass-topics-reference.md file covering all 41 applicable topics already exists at `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md`.

**Primary recommendation:** Follow the Phase 97 pattern exactly. The only work unique to this phase is (1) adding 7 MD delegate batch sections to gen_migration.py, (2) running 140 sequential research agents, and (3) generating + applying 7 migrations.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance research (per delegate) | Research agent (Claude) | — | Sequential invocation; one agent per delegate; no automation |
| CSV production | Research agent writes CSV | gen_migration.py reads | CSV is the handoff artifact between research and ingestion |
| SQL migration generation | gen_migration.py (Python) | — | Batches CSVs per plan into idempotent SQL |
| Migration application | mcp__supabase-local__apply_migration | — | Writes directly to production Supabase DB |
| Compass render | Frontend (existing) | API / inform schema | No UI changes; reads inform.politician_answers automatically |

---

## Standard Stack

### Core Tools (no new installs)
| Tool | Location | Purpose |
|------|----------|---------|
| gen_migration.py | `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` | Generates idempotent SQL from CSVs |
| compass-topics-reference.md | `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md` | 41-topic reference for research agents |
| psql | system | Direct DB verification |
| mcp__supabase-local__apply_migration | MCP tool | Applies .sql files to production |

No new packages to install. This phase uses only existing tooling.

---

## Package Legitimacy Audit

No external packages are installed in this phase. All tooling (gen_migration.py, psql, Supabase MCP) is pre-existing. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Research Agent (1 per delegate, sequential)
       |
       v
CSV file (2026-06-07-md-delegate-dNN-[lastname].csv)
  [full_name, topic_key, value, reasoning, source_url_1, source_url_2, source_url_3]
       |
       v (after all ~20 delegates in batch complete)
gen_migration.py
  candidate_inventory: [(full_name, politician_uuid), ...]
  csv_files: [list of CSV paths for batch]
  excluded_topics: EXCLUDED_TOPICS_FEDERAL
       |
       v
286_md_delegates_batch_a.sql (through 292_md_delegates_batch_g.sql)
  BEGIN;
    -- Per-delegate block (name + pid header)
    INSERT INTO inform.politician_answers ... ON CONFLICT DO UPDATE
    INSERT INTO inform.politician_context ... ON CONFLICT DO UPDATE
    -- (or NOTE: No stances found if no CSV rows)
  COMMIT;
       |
       v
mcp__supabase-local__apply_migration
       |
       v
inform.politician_answers + inform.politician_context (production)
       |
       v (Plan 98-07 only)
Human spot-check: compass renders on 3 senator + 3 delegate profiles
```

### Recommended CSV File Naming
```
C:/EV-Accounts/backend/data/stance-research/
├── 2026-06-07-md-delegate-d01a-hinebaugh.csv
├── 2026-06-07-md-delegate-d01b-buckel.csv
...
├── 2026-06-07-md-delegate-d47b-taveras.csv
```

---

## Critical Data: Complete Delegate Roster with Politician IDs

**Source:** [VERIFIED: production DB query executed 2026-06-07]
**Total:** 141 rows (140 active + 1 vacant at HD-42A)
**Migration count confirmed:** 285 is last applied; next is 286.
**Delegate stances in production:** 0 (confirmed by query)

### Full Roster — Sorted by geo_id (District Order)

| geo_id | District Label | Full Name | Politician ID | Vacant |
|--------|----------------|-----------|---------------|--------|
| 2401A | HD-1A | Jim Hinebaugh, Jr. | 3817ad52-3f43-4bd3-8525-e7dcd0816153 | no |
| 2401B | HD-1B | Jason C. Buckel | 5260bd6f-e70a-46f1-aa7d-49eaf22192cf | no |
| 2401C | HD-1C | Terry L. Baker | d049cf3e-6577-4f8d-ba7e-768ac2b78d66 | no |
| 2402A | HD-2A | William Valentine | cdf746c1-8311-416b-9ad3-2684a83b6992 | no |
| 2402A | HD-2A | William J. Wivell | df6fe96f-7795-4934-9acc-2b9f8f0aa8f7 | no |
| 2402B | HD-2B | Matthew J. Schindler | 18c6abb4-7b4b-4e21-a7fe-008e43d6f3e5 | no |
| 24003 | HD-3 | Kris Fair | dfb9ae21-4605-4c58-94e8-84b1eb1a30c1 | no |
| 24003 | HD-3 | Kenneth Kerr | c0abb4fa-be8d-4fbe-9b6d-6319a8ecd255 | no |
| 24003 | HD-3 | Karen Simpson | 5946ad0c-ddf5-4674-840e-6968105042cd | no |
| 24004 | HD-4 | Barrie S. Ciliberti | 00a1eaeb-157c-42f8-a6e5-9a9d02decbe9 | no |
| 24004 | HD-4 | April Miller | b389687f-817b-4fda-8770-a888029f4629 | no |
| 24004 | HD-4 | Jesse T. Pippy | ce2fc441-abd5-4d8f-9c56-114e31c4d43c | no |
| 24005 | HD-5 | Christopher Eric Bouchat | c12bb600-318a-4541-bcdd-8260f1ba172e | no |
| 24005 | HD-5 | April Rose | 5967c703-2583-466f-a438-c3ac182111d5 | no |
| 24005 | HD-5 | Chris Tomlinson | 6e5ac4b7-73fd-497d-a4e9-7d5124c3d904 | no |
| 24006 | HD-6 | Robin L. Grammer, Jr. | 0608cc7a-72ed-4d24-b966-3eee82075bf1 | no |
| 24006 | HD-6 | Robert B. Long | eadb65c9-74b6-40c3-b9e7-159c5734c59f | no |
| 24006 | HD-6 | Ric Metzgar | ba85b633-32cf-4617-923c-3a325f39894e | no |
| 2407A | HD-7A | Ryan Nawrocki | f5224e0c-0761-4ca7-a889-ed44517e2b91 | no |
| 2407A | HD-7A | Kathy Szeliga | 0945acd2-cb51-49ad-a22f-6043d2e61520 | no |
| 2407B | HD-7B | Lauren Arikan | 6a04e5b9-d532-4e80-bbca-6677a35620e5 | no |
| 24008 | HD-8 | Nick Allen | a1f58b34-76ee-43ce-b152-4843c42f4f79 | no |
| 24008 | HD-8 | Harry Bhandari | 6d95657c-6c46-4aab-886f-f9688adc7b33 | no |
| 24008 | HD-8 | Kim Ross | 5d17e3ea-9d63-4a96-8848-9e293ac05fdb | no |
| 2409A | HD-9A | Chao Wu | 7ced90a8-39dc-447e-ba33-e3af4cd47473 | no |
| 2409A | HD-9A | Natalie Ziegler | 38b5030a-aa8b-4363-8b62-3ec384d22088 | no |
| 2409B | HD-9B | Courtney Watson | a4b61b58-9006-4e58-952d-abeb2521cda0 | no |
| 24010 | HD-10 | Adrienne A. Jones | 760cd4a7-235c-472f-a0ba-fb07098dfd57 | no |
| 24010 | HD-10 | N. Scott Phillips | 04eb4549-ad64-4ddc-ad53-8f90217f905f | no |
| 24010 | HD-10 | Jennifer White Holland | d80816fc-da1d-48f4-95c9-467f8831933c | no |
| 2411A | HD-11A | Cheryl E. Pasteur | b5aee428-9b2e-4c87-9a5c-63d44f58e1d8 | no |
| 2411B | HD-11B | Jon S. Cardin | 631dac5c-fb86-41f5-a82d-5963164a9142 | no |
| 2411B | HD-11B | Dana Stein | e94337e1-4776-4058-87b4-32dfeb7732a0 | no |
| 2412A | HD-12A | Jessica Feldmark | fdb9f7d3-93db-4436-bd82-5d7fd853f05e | no |
| 2412A | HD-12A | Terri L. Hill | f6a237a0-34ff-4a93-b05a-335ec38b6da3 | no |
| 2412B | HD-12B | Gary Simmons | 69cbeb94-6978-4f3f-b8b7-735f789c6d3c | no |
| 24013 | HD-13 | Pam Lanman Guzzone | 589ed7af-602a-4ec9-8072-448b05446772 | no |
| 24013 | HD-13 | Gabriel M. Moreno | c0ec0d09-db8f-49fe-b4b6-0221a59ab7ec | no |
| 24013 | HD-13 | Jen Terrasa | f45e2178-2a05-4974-8af8-379662412060 | no |
| 24014 | HD-14 | Anne R. Kaiser | bfd0f15f-abb1-4d28-b1f4-e06875adce16 | no |
| 24014 | HD-14 | Bernice Mireku-North | 8abee534-5db0-4950-a2b9-d0d1e8088cc7 | no |
| 24014 | HD-14 | Pam Queen | a11c027a-ef25-4a09-8df7-e9b7c60bea90 | no |
| 24015 | HD-15 | Linda Foley | b80a680a-9f79-4d56-994b-00ce24ec7ef3 | no |
| 24015 | HD-15 | David Fraser-Hidalgo | ab8aa19a-42c3-445e-9632-a5c7f05458ee | no |
| 24015 | HD-15 | Lily Qi | e00e72f9-6b53-46a7-a1e4-74ab7b91d68d | no |
| 24016 | HD-16 | Marc Korman | e76d0654-b0c6-43dc-9159-e929e480d070 | no |
| 24016 | HD-16 | Sarah Wolek | 4db476f3-bc84-484c-9440-666028942469 | no |
| 24016 | HD-16 | Teresa Woorman | 36171e41-704b-4bf9-b300-755afe4ee06f | no |
| 24017 | HD-17 | Julie Palakovich Carr | 70d58d4b-4203-4fc2-b36f-32e6231c4339 | no |
| 24017 | HD-17 | Ryan Spiegel | 203a0228-7a63-4a6a-b26d-fa45ba139472 | no |
| 24017 | HD-17 | Joe Vogel | 458a60ba-a235-4b36-80bb-8b537375a4ff | no |
| 24018 | HD-18 | Aaron M. Kaufman | bc703231-6af8-48c6-8ae6-4a93fc60b18f | no |
| 24018 | HD-18 | Emily Shetty | d1a30768-52e8-4a0d-badc-3e5f2f5792c7 | no |
| 24018 | HD-18 | Jared Solomon | c0bf0c64-6254-40a7-b810-8717977759dd | no |
| 24019 | HD-19 | Charlotte Crutchfield | 98d6a17e-59dc-4d11-a342-869603862f10 | no |
| 24019 | HD-19 | Bonnie Cullison | 17c22fec-63a4-4f5d-8607-0c364ddffd71 | no |
| 24019 | HD-19 | Vaughn Stewart | ac558ee8-ecae-47b6-a25e-46307521b4af | no |
| 24020 | HD-20 | Lorig Charkoudian | 9c5e1ac7-8a39-4c6e-8b20-0788a92f8607 | no |
| 24020 | HD-20 | David Moon | 96876928-53f8-4ed5-b2de-deab3a456d83 | no |
| 24020 | HD-20 | Jheanelle K. Wilkins | cf68a5cd-f375-4296-8a87-1828d903baea | no |
| 24021 | HD-21 | Ben Barnes | 590b56b2-1473-4e86-ba96-0490e172f6ff | no |
| 24021 | HD-21 | Mary A. Lehman | 251a2047-372b-480e-aa09-231f9a5edeca | no |
| 24021 | HD-21 | Joseline Peña-Melnyk | 00cd05cc-75de-4d9a-ab23-9f53441bc186 | no |
| 24022 | HD-22 | Anne Healey | 4436b432-a63f-4946-919a-f30c41f899e4 | no |
| 24022 | HD-22 | Ashanti Martinez | d8eee978-cec3-492d-9867-9d40b2a50a9d | no |
| 24022 | HD-22 | Nicole A. Williams | 5c24446e-c9d6-4dda-9703-e3c049798315 | no |
| 24023 | HD-23 | Adrian Boafo | 1da26040-98b4-4eb0-aa1f-3ec05b297a29 | no |
| 24023 | HD-23 | Marvin E. Holmes, Jr. | b8e331fa-d58e-479f-b076-8fda0b0604c5 | no |
| 24023 | HD-23 | Kym Taylor | 9273ed81-2052-428a-b39d-849abeef270b | no |
| 24024 | HD-24 | Tiffany T. Alston | 2e809682-2d95-480c-885e-d2174b811cfe | no |
| 24024 | HD-24 | Derrick Coley | 8fab5ff7-603d-4ab0-a05c-a7070d187a48 | no |
| 24024 | HD-24 | Andrea Fletcher Harrison | d61a670a-7626-4464-93dc-c1e21d7b26da | no |
| 24025 | HD-25 | Kent Roberson | 338210ee-b9ab-4820-bfce-98f5354837af | no |
| 24025 | HD-25 | Denise Roberts | d5999df9-83b8-4870-a170-4d13f40473e2 | no |
| 24025 | HD-25 | Karen Toles | cd422f8c-913b-4280-987b-9383ead34e85 | no |
| 24026 | HD-26 | Veronica Turner | 7a76712a-38cd-41de-b260-cd0127284f16 | no |
| 24026 | HD-26 | Kriselda Valderrama | 768ac1cf-a599-4ddb-943c-c985fafb2607 | no |
| 24026 | HD-26 | Jamila J. Woods | 916afe40-4061-476f-9a54-b271b32778d2 | no |
| 2427A | HD-27A | Darrell Odom | 0e238dbf-5b4e-4e95-8a94-e02d97a136f5 | no |
| 2427B | HD-27B | Jeffrie E. Long, Jr. | 70f63959-f51d-4411-adc1-f1c429bbc397 | no |
| 2427C | HD-27C | Mark N. Fisher | 71542618-59c8-4b06-a765-e3df60cca763 | no |
| 24028 | HD-28 | Debra Davis | 1cc5a555-4b8a-4573-8525-9ad2c7c0bf46 | no |
| 24028 | HD-28 | Edith J. Patterson | b9c61fea-fcb1-45cc-8e2c-e5b3046b7266 | no |
| 24028 | HD-28 | C. T. Wilson | 69870c10-cea2-43c2-8cf9-bfcaf0b82265 | no |
| 2429A | HD-29A | Matthew Morgan | c4e4d811-1e14-45fe-9335-7521f1603856 | no |
| 2429B | HD-29B | Brian M. Crosby | 898845f9-cb93-4162-b0ed-6842eacda5d6 | no |
| 2429C | HD-29C | Todd B. Morgan | 7d79931f-101c-415b-a6a0-b7a919f70905 | no |
| 2430A | HD-30A | Dylan Behler | 3f45bad5-b856-4d8e-b3d9-8c03623e030a | no |
| 2430A | HD-30A | Dana Jones | d8eabd9b-2aa8-40de-94ce-06ce6ef167cf | no |
| 2430B | HD-30B | Seth A. Howard | 2fe3f655-c28e-40c3-a2f9-48ea9eb8b498 | no |
| 24031 | HD-31 | Brian Chisholm | cfc704da-dd6c-40b0-97fa-0c5ece8d3976 | no |
| 24031 | HD-31 | Nicholaus R. Kipke | 0e0bdc53-b5a2-4292-aeb7-341a4c5bed08 | no |
| 24031 | HD-31 | LaToya Nkongolo | 13462ee2-0dd9-4f70-809f-a813c23951d4 | no |
| 24032 | HD-32 | J. Sandy Bartlett | 7d818044-a989-47e1-b6cf-d482ebad0600 | no |
| 24032 | HD-32 | Mark S. Chang | 4a409af4-8568-42c3-bb72-7bb7500c96ce | no |
| 24032 | HD-32 | Mike Rogers | 24980735-6a39-4e48-94b0-7318cac8dfde | no |
| 2433A | HD-33A | Andrew C. Pruski | ddfd43d3-023d-417e-9b68-af5a693e601e | no |
| 2433B | HD-33B | Stuart Michael Schmidt, Jr. | 55d9d0b6-78a3-460b-97b9-87913ffc8e85 | no |
| 2433C | HD-33C | Heather Bagnall | 41749b94-11b8-4047-8421-95db0900d4b2 | no |
| 2434A | HD-34A | Andre V. Johnson, Jr. | b592e432-6411-48b3-bca3-d5596d0d81e9 | no |
| 2434A | HD-34A | Steve Johnson | dbb1c600-c87b-449c-bd3b-1c236287c00f | no |
| 2434B | HD-34B | Susan K. McComas | 58d0ff82-631f-475f-889a-9a4ebb39fc07 | no |
| 2435A | HD-35A | Mike Griffith | 0c789b27-d50c-4822-95ff-409ecb7db08a | no |
| 2435A | HD-35A | Teresa E. Reilly | 547841f2-3476-4e83-9344-0cac984d44e8 | no |
| 2435B | HD-35B | Kevin B. Hornberger | 96a6d696-50fd-4393-a0f6-19e69dc15716 | no |
| 24036 | HD-36 | Steven J. Arentz | fee8a413-a3a8-4568-ad9b-db00f94f5ac2 | no |
| 24036 | HD-36 | Jefferson L. Ghrist | eca530ff-628d-417d-a3dc-b858dc7c2376 | no |
| 24036 | HD-36 | Jay A. Jacobs | 8b43dd9c-26c3-48bb-ac60-d95f8a39349a | no |
| 2437A | HD-37A | Sheree Sample-Hughes | a1c2b55c-df7d-487c-ad90-7f7e2c2e6951 | no |
| 2437B | HD-37B | Christopher T. Adams | 1eada938-f28c-46b9-bd21-df241656cd2b | no |
| 2437B | HD-37B | Thomas S. Hutchinson | fb1fe811-b340-42d3-88ee-97b5364117cd | no |
| 2438A | HD-38A | H. Kevin Anderson | d17104a7-8a35-4bcd-8879-76ceb997df6a | no |
| 2438B | HD-38B | Barry Beauchamp | bc7ee014-a452-4eaf-81e9-2f4c55d3eaea | no |
| 2438C | HD-38C | Wayne A. Hartman | 1ff2bb96-0e55-4893-8a4c-b675dfbb79f6 | no |
| 24039 | HD-39 | Gabriel Acevero | e1b53b61-d4f7-4d10-bdb3-2a8dcfb12820 | no |
| 24039 | HD-39 | Lesley J. Lopez | 2fa68ca4-00b5-4518-a692-d12447d7fec3 | no |
| 24039 | HD-39 | Greg Wims | b7e2aa8f-a301-4004-81e9-d1f857c81075 | no |
| 24040 | HD-40 | Marlon Amprey | 62bed8b6-beb2-4c41-b234-dc6427bfc9c0 | no |
| 24040 | HD-40 | Frank M. Conaway, Jr. | 94855fb3-0e08-45ac-8c67-ba668ef67c4b | no |
| 24040 | HD-40 | Melissa Wells | 7217c1b4-6fae-447d-9566-f2513319fa94 | no |
| 24041 | HD-41 | Samuel I. Rosenberg | 36eecaff-4677-441a-b36e-a323e87d9158 | no |
| 24041 | HD-41 | Malcolm P. Ruff | 7e1dfb66-1eff-4c8d-b3fe-d39f990b99c4 | no |
| 24041 | HD-41 | Sean A. Stinnett | 012af8f7-693a-4ddc-b0bc-953dae8d2bc2 | no |
| 2442A | HD-42A | Vacant (skip research) | 67acad60-5839-4a8a-95ac-c881c3ca39a9 | YES |
| 2442B | HD-42B | Michele Guyton | bb180c23-b965-4bba-a2b9-73febd484d21 | no |
| 2442C | HD-42C | Joshua J. Stonko | 656a8bc9-348e-4ffc-819c-2f4611b3ddc8 | no |
| 2443A | HD-43A | Regina T. Boyce | 027a2610-1160-4525-a5c1-469fe85d46e1 | no |
| 2443A | HD-43A | Elizabeth Embry | 03a161cf-1da8-4c34-9c08-d91bbf958987 | no |
| 2443B | HD-43B | Catherine M. Forbes | c017b328-4469-45c4-aa8a-7b9035c77e22 | no |
| 2444A | HD-44A | Eric Ebersole | 22610d7f-eaca-4802-b486-0e48544e6e7d | no |
| 2444B | HD-44B | Aletheia McCaskill | fcfa1844-032e-4dba-9ae0-c52b82447fa8 | no |
| 2444B | HD-44B | Sheila Ruth | df1a05a1-2a70-4e40-a0c6-5b3f81632c7e | no |
| 24045 | HD-45 | Jackie Addison | 01aaf4ba-c8ec-4a50-bd56-8d181d35e903 | no |
| 24045 | HD-45 | Stephanie Smith | 848ac881-004b-436a-9a17-dfacbd33de5a | no |
| 24045 | HD-45 | Caylin Young | 92075c9b-6c7e-4763-981f-5a42a8afddf5 | no |
| 24046 | HD-46 | Luke Clippinger | ad1aaa25-0ef6-4c88-9d78-d75aec7398c7 | no |
| 24046 | HD-46 | Mark Edelson | bec4b395-bb4b-4740-ac1c-8e89f12608a2 | no |
| 24046 | HD-46 | Robbyn Lewis | 9285f590-79b5-48de-a1c0-a022629e6ebb | no |
| 2447A | HD-47A | Diana M. Fennell | 192e8ffb-e576-41f1-915a-dbc0c30d4769 | no |
| 2447A | HD-47A | Julian Ivey | 69bf6043-4546-4804-ae04-311cff54a986 | no |
| 2447B | HD-47B | Deni Taveras | a92085b6-642a-4cf6-a73e-c985a6fd09fa | no |

---

## Batch Boundaries (7 Plans of ~20 Delegates Each)

District boundary rules applied:
- A/B/C subdistricts kept within same batch as their parent district number
- Batches split between whole districts to avoid splitting a single district across plans
- HD-42A (Vacant) included in candidate_inventory for batch F but receives not-found comment (no research agent)

### Batch A — Migration 286 — Plan 98-01 (20 delegates, Districts 1–7B)
HD-1A, HD-1B, HD-1C, HD-2A(x2), HD-2B, HD-3(x3), HD-4(x3), HD-5(x3), HD-6(x3), HD-7A(x2), HD-7B

| Full Name | Politician ID |
|-----------|---------------|
| Jim Hinebaugh, Jr. | 3817ad52-3f43-4bd3-8525-e7dcd0816153 |
| Jason C. Buckel | 5260bd6f-e70a-46f1-aa7d-49eaf22192cf |
| Terry L. Baker | d049cf3e-6577-4f8d-ba7e-768ac2b78d66 |
| William Valentine | cdf746c1-8311-416b-9ad3-2684a83b6992 |
| William J. Wivell | df6fe96f-7795-4934-9acc-2b9f8f0aa8f7 |
| Matthew J. Schindler | 18c6abb4-7b4b-4e21-a7fe-008e43d6f3e5 |
| Kris Fair | dfb9ae21-4605-4c58-94e8-84b1eb1a30c1 |
| Kenneth Kerr | c0abb4fa-be8d-4fbe-9b6d-6319a8ecd255 |
| Karen Simpson | 5946ad0c-ddf5-4674-840e-6968105042cd |
| Barrie S. Ciliberti | 00a1eaeb-157c-42f8-a6e5-9a9d02decbe9 |
| April Miller | b389687f-817b-4fda-8770-a888029f4629 |
| Jesse T. Pippy | ce2fc441-abd5-4d8f-9c56-114e31c4d43c |
| Christopher Eric Bouchat | c12bb600-318a-4541-bcdd-8260f1ba172e |
| April Rose | 5967c703-2583-466f-a438-c3ac182111d5 |
| Chris Tomlinson | 6e5ac4b7-73fd-497d-a4e9-7d5124c3d904 |
| Robin L. Grammer, Jr. | 0608cc7a-72ed-4d24-b966-3eee82075bf1 |
| Robert B. Long | eadb65c9-74b6-40c3-b9e7-159c5734c59f |
| Ric Metzgar | ba85b633-32cf-4617-923c-3a325f39894e |
| Ryan Nawrocki | f5224e0c-0761-4ca7-a889-ed44517e2b91 |
| Kathy Szeliga | 0945acd2-cb51-49ad-a22f-6043d2e61520 |
| Lauren Arikan | 6a04e5b9-d532-4e80-bbca-6677a35620e5 |

**Count: 21 delegates** (Districts 1–7 all subdistricts together; slight overrun to keep district 7 intact)

### Batch B — Migration 287 — Plan 98-02 (21 delegates, Districts 8–13)
HD-8(x3), HD-9A(x2), HD-9B, HD-10(x3), HD-11A, HD-11B(x2), HD-12A(x2), HD-12B, HD-13(x3)

| Full Name | Politician ID |
|-----------|---------------|
| Nick Allen | a1f58b34-76ee-43ce-b152-4843c42f4f79 |
| Harry Bhandari | 6d95657c-6c46-4aab-886f-f9688adc7b33 |
| Kim Ross | 5d17e3ea-9d63-4a96-8848-9e293ac05fdb |
| Chao Wu | 7ced90a8-39dc-447e-ba33-e3af4cd47473 |
| Natalie Ziegler | 38b5030a-aa8b-4363-8b62-3ec384d22088 |
| Courtney Watson | a4b61b58-9006-4e58-952d-abeb2521cda0 |
| Adrienne A. Jones | 760cd4a7-235c-472f-a0ba-fb07098dfd57 |
| N. Scott Phillips | 04eb4549-ad64-4ddc-ad53-8f90217f905f |
| Jennifer White Holland | d80816fc-da1d-48f4-95c9-467f8831933c |
| Cheryl E. Pasteur | b5aee428-9b2e-4c87-9a5c-63d44f58e1d8 |
| Jon S. Cardin | 631dac5c-fb86-41f5-a82d-5963164a9142 |
| Dana Stein | e94337e1-4776-4058-87b4-32dfeb7732a0 |
| Jessica Feldmark | fdb9f7d3-93db-4436-bd82-5d7fd853f05e |
| Terri L. Hill | f6a237a0-34ff-4a93-b05a-335ec38b6da3 |
| Gary Simmons | 69cbeb94-6978-4f3f-b8b7-735f789c6d3c |
| Pam Lanman Guzzone | 589ed7af-602a-4ec9-8072-448b05446772 |
| Gabriel M. Moreno | c0ec0d09-db8f-49fe-b4b6-0221a59ab7ec |
| Jen Terrasa | f45e2178-2a05-4974-8af8-379662412060 |

**Count: 18 delegates** (Districts 8–13)

### Batch C — Migration 288 — Plan 98-03 (20 delegates, Districts 14–20)
HD-14(x3), HD-15(x3), HD-16(x3), HD-17(x3), HD-18(x3), HD-19(x3), HD-20(x3) = 21

| Full Name | Politician ID |
|-----------|---------------|
| Anne R. Kaiser | bfd0f15f-abb1-4d28-b1f4-e06875adce16 |
| Bernice Mireku-North | 8abee534-5db0-4950-a2b9-d0d1e8088cc7 |
| Pam Queen | a11c027a-ef25-4a09-8df7-e9b7c60bea90 |
| Linda Foley | b80a680a-9f79-4d56-994b-00ce24ec7ef3 |
| David Fraser-Hidalgo | ab8aa19a-42c3-445e-9632-a5c7f05458ee |
| Lily Qi | e00e72f9-6b53-46a7-a1e4-74ab7b91d68d |
| Marc Korman | e76d0654-b0c6-43dc-9159-e929e480d070 |
| Sarah Wolek | 4db476f3-bc84-484c-9440-666028942469 |
| Teresa Woorman | 36171e41-704b-4bf9-b300-755afe4ee06f |
| Julie Palakovich Carr | 70d58d4b-4203-4fc2-b36f-32e6231c4339 |
| Ryan Spiegel | 203a0228-7a63-4a6a-b26d-fa45ba139472 |
| Joe Vogel | 458a60ba-a235-4b36-80bb-8b537375a4ff |
| Aaron M. Kaufman | bc703231-6af8-48c6-8ae6-4a93fc60b18f |
| Emily Shetty | d1a30768-52e8-4a0d-badc-3e5f2f5792c7 |
| Jared Solomon | c0bf0c64-6254-40a7-b810-8717977759dd |
| Charlotte Crutchfield | 98d6a17e-59dc-4d11-a342-869603862f10 |
| Bonnie Cullison | 17c22fec-63a4-4f5d-8607-0c364ddffd71 |
| Vaughn Stewart | ac558ee8-ecae-47b6-a25e-46307521b4af |
| Lorig Charkoudian | 9c5e1ac7-8a39-4c6e-8b20-0788a92f8607 |
| David Moon | 96876928-53f8-4ed5-b2de-deab3a456d83 |
| Jheanelle K. Wilkins | cf68a5cd-f375-4296-8a87-1828d903baea |

**Count: 21 delegates** (Districts 14–20)

### Batch D — Migration 289 — Plan 98-04 (21 delegates, Districts 21–27C)
HD-21(x3), HD-22(x3), HD-23(x3), HD-24(x3), HD-25(x3), HD-26(x3), HD-27A/B/C(x3)

| Full Name | Politician ID |
|-----------|---------------|
| Ben Barnes | 590b56b2-1473-4e86-ba96-0490e172f6ff |
| Mary A. Lehman | 251a2047-372b-480e-aa09-231f9a5edeca |
| Joseline Peña-Melnyk | 00cd05cc-75de-4d9a-ab23-9f53441bc186 |
| Anne Healey | 4436b432-a63f-4946-919a-f30c41f899e4 |
| Ashanti Martinez | d8eee978-cec3-492d-9867-9d40b2a50a9d |
| Nicole A. Williams | 5c24446e-c9d6-4dda-9703-e3c049798315 |
| Adrian Boafo | 1da26040-98b4-4eb0-aa1f-3ec05b297a29 |
| Marvin E. Holmes, Jr. | b8e331fa-d58e-479f-b076-8fda0b0604c5 |
| Kym Taylor | 9273ed81-2052-428a-b39d-849abeef270b |
| Tiffany T. Alston | 2e809682-2d95-480c-885e-d2174b811cfe |
| Derrick Coley | 8fab5ff7-603d-4ab0-a05c-a7070d187a48 |
| Andrea Fletcher Harrison | d61a670a-7626-4464-93dc-c1e21d7b26da |
| Kent Roberson | 338210ee-b9ab-4820-bfce-98f5354837af |
| Denise Roberts | d5999df9-83b8-4870-a170-4d13f40473e2 |
| Karen Toles | cd422f8c-913b-4280-987b-9383ead34e85 |
| Veronica Turner | 7a76712a-38cd-41de-b260-cd0127284f16 |
| Kriselda Valderrama | 768ac1cf-a599-4ddb-943c-c985fafb2607 |
| Jamila J. Woods | 916afe40-4061-476f-9a54-b271b32778d2 |
| Darrell Odom | 0e238dbf-5b4e-4e95-8a94-e02d97a136f5 |
| Jeffrie E. Long, Jr. | 70f63959-f51d-4411-adc1-f1c429bbc397 |
| Mark N. Fisher | 71542618-59c8-4b06-a765-e3df60cca763 |

**Count: 21 delegates** (Districts 21–27)

### Batch E — Migration 290 — Plan 98-05 (21 delegates, Districts 28–33C)
HD-28(x3), HD-29A/B/C(x3), HD-30A(x2)/30B, HD-31(x3), HD-32(x3), HD-33A/B/C(x3)

| Full Name | Politician ID |
|-----------|---------------|
| Debra Davis | 1cc5a555-4b8a-4573-8525-9ad2c7c0bf46 |
| Edith J. Patterson | b9c61fea-fcb1-45cc-8e2c-e5b3046b7266 |
| C. T. Wilson | 69870c10-cea2-43c2-8cf9-bfcaf0b82265 |
| Matthew Morgan | c4e4d811-1e14-45fe-9335-7521f1603856 |
| Brian M. Crosby | 898845f9-cb93-4162-b0ed-6842eacda5d6 |
| Todd B. Morgan | 7d79931f-101c-415b-a6a0-b7a919f70905 |
| Dylan Behler | 3f45bad5-b856-4d8e-b3d9-8c03623e030a |
| Dana Jones | d8eabd9b-2aa8-40de-94ce-06ce6ef167cf |
| Seth A. Howard | 2fe3f655-c28e-40c3-a2f9-48ea9eb8b498 |
| Brian Chisholm | cfc704da-dd6c-40b0-97fa-0c5ece8d3976 |
| Nicholaus R. Kipke | 0e0bdc53-b5a2-4292-aeb7-341a4c5bed08 |
| LaToya Nkongolo | 13462ee2-0dd9-4f70-809f-a813c23951d4 |
| J. Sandy Bartlett | 7d818044-a989-47e1-b6cf-d482ebad0600 |
| Mark S. Chang | 4a409af4-8568-42c3-bb72-7bb7500c96ce |
| Mike Rogers | 24980735-6a39-4e48-94b0-7318cac8dfde |
| Andrew C. Pruski | ddfd43d3-023d-417e-9b68-af5a693e601e |
| Stuart Michael Schmidt, Jr. | 55d9d0b6-78a3-460b-97b9-87913ffc8e85 |
| Heather Bagnall | 41749b94-11b8-4047-8421-95db0900d4b2 |

**Count: 18 delegates** (Districts 28–33)

### Batch F — Migration 291 — Plan 98-06 (21 delegates, Districts 34–40)
HD-34A(x2)/34B, HD-35A(x2)/35B, HD-36(x3), HD-37A/37B(x2), HD-38A/B/C, HD-39(x3), HD-40(x3)

NOTE: HD-42A Vacant is included in this batch's candidate_inventory to generate the not-found comment. District 42 comes after 41 but the Vacant placeholder goes here to keep the batch at ~20.

| Full Name | Politician ID |
|-----------|---------------|
| Andre V. Johnson, Jr. | b592e432-6411-48b3-bca3-d5596d0d81e9 |
| Steve Johnson | dbb1c600-c87b-449c-bd3b-1c236287c00f |
| Susan K. McComas | 58d0ff82-631f-475f-889a-9a4ebb39fc07 |
| Mike Griffith | 0c789b27-d50c-4822-95ff-409ecb7db08a |
| Teresa E. Reilly | 547841f2-3476-4e83-9344-0cac984d44e8 |
| Kevin B. Hornberger | 96a6d696-50fd-4393-a0f6-19e69dc15716 |
| Steven J. Arentz | fee8a413-a3a8-4568-ad9b-db00f94f5ac2 |
| Jefferson L. Ghrist | eca530ff-628d-417d-a3dc-b858dc7c2376 |
| Jay A. Jacobs | 8b43dd9c-26c3-48bb-ac60-d95f8a39349a |
| Sheree Sample-Hughes | a1c2b55c-df7d-487c-ad90-7f7e2c2e6951 |
| Christopher T. Adams | 1eada938-f28c-46b9-bd21-df241656cd2b |
| Thomas S. Hutchinson | fb1fe811-b340-42d3-88ee-97b5364117cd |
| H. Kevin Anderson | d17104a7-8a35-4bcd-8879-76ceb997df6a |
| Barry Beauchamp | bc7ee014-a452-4eaf-81e9-2f4c55d3eaea |
| Wayne A. Hartman | 1ff2bb96-0e55-4893-8a4c-b675dfbb79f6 |
| Gabriel Acevero | e1b53b61-d4f7-4d10-bdb3-2a8dcfb12820 |
| Lesley J. Lopez | 2fa68ca4-00b5-4518-a692-d12447d7fec3 |
| Greg Wims | b7e2aa8f-a301-4004-81e9-d1f857c81075 |
| Marlon Amprey | 62bed8b6-beb2-4c41-b234-dc6427bfc9c0 |
| Frank M. Conaway, Jr. | 94855fb3-0e08-45ac-8c67-ba668ef67c4b |
| Melissa Wells | 7217c1b4-6fae-447d-9566-f2513319fa94 |

**Count: 21 delegates** (Districts 34–40)

### Batch G — Migration 292 — Plan 98-07 (20 delegates + 1 vacant, Districts 41–47B + compass verification)
HD-41(x3), HD-42A(vacant), HD-42B, HD-42C, HD-43A(x2)/43B, HD-44A/44B(x2), HD-45(x3), HD-46(x3), HD-47A(x2)/47B

| Full Name | Politician ID | Note |
|-----------|---------------|------|
| Samuel I. Rosenberg | 36eecaff-4677-441a-b36e-a323e87d9158 | |
| Malcolm P. Ruff | 7e1dfb66-1eff-4c8d-b3fe-d39f990b99c4 | |
| Sean A. Stinnett | 012af8f7-693a-4ddc-b0bc-953dae8d2bc2 | |
| Vacant | 67acad60-5839-4a8a-95ac-c881c3ca39a9 | HD-42A — no research, not-found comment |
| Michele Guyton | bb180c23-b965-4bba-a2b9-73febd484d21 | |
| Joshua J. Stonko | 656a8bc9-348e-4ffc-819c-2f4611b3ddc8 | |
| Regina T. Boyce | 027a2610-1160-4525-a5c1-469fe85d46e1 | |
| Elizabeth Embry | 03a161cf-1da8-4c34-9c08-d91bbf958987 | |
| Catherine M. Forbes | c017b328-4469-45c4-aa8a-7b9035c77e22 | |
| Eric Ebersole | 22610d7f-eaca-4802-b486-0e48544e6e7d | |
| Aletheia McCaskill | fcfa1844-032e-4dba-9ae0-c52b82447fa8 | |
| Sheila Ruth | df1a05a1-2a70-4e40-a0c6-5b3f81632c7e | |
| Jackie Addison | 01aaf4ba-c8ec-4a50-bd56-8d181d35e903 | |
| Stephanie Smith | 848ac881-004b-436a-9a17-dfacbd33de5a | |
| Caylin Young | 92075c9b-6c7e-4763-981f-5a42a8afddf5 | |
| Luke Clippinger | ad1aaa25-0ef6-4c88-9d78-d75aec7398c7 | |
| Mark Edelson | bec4b395-bb4b-4740-ac1c-8e89f12608a2 | |
| Robbyn Lewis | 9285f590-79b5-48de-a1c0-a022629e6ebb | |
| Diana M. Fennell | 192e8ffb-e576-41f1-915a-dbc0c30d4769 | |
| Julian Ivey | 69bf6043-4546-4804-ae04-311cff54a986 | |
| Deni Taveras | a92085b6-642a-4cf6-a73e-c985a6fd09fa | |

**Count: 21 entries (20 active delegates + 1 vacant placeholder)**

### Batch Summary

| Plan | Migration | Districts | Delegates (active) | Notes |
|------|-----------|-----------|-------------------|-------|
| 98-01 | 286 | 1–7 | 21 | All subdistricts 1A/B/C, 2A/B, 7A/B included |
| 98-02 | 287 | 8–13 | 18 | All subdistricts 9A/B, 11A/B, 12A/B included |
| 98-03 | 288 | 14–20 | 21 | All whole districts |
| 98-04 | 289 | 21–27 | 21 | Peña-Melnyk n-tilde; 27A/B/C subdistricts |
| 98-05 | 290 | 28–33 | 18 | All subdistricts 29A/B/C, 30A/B, 33A/B/C |
| 98-06 | 291 | 34–40 | 21 | All subdistricts 34A/B, 35A/B, 37A/B, 38A/B/C |
| 98-07 | 292 | 41–47 | 20 active + 1 vacant | 42A Vacant placeholder; compass verification |
| **TOTAL** | | | **140 active + 1 vacant = 141** | |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL migration generation | Custom SQL writer | gen_migration.py | Already handles dollar-quoting, ARRAY[] sources, ON CONFLICT, not-found comments, verification queries |
| Migration application | psql CLI | mcp__supabase-local__apply_migration | Direct MCP tool; treats production as live |
| Topic UUID lookup | Ad-hoc query | TOPIC_UUIDS dict in gen_migration.py | Already current and correct per Phase 97 |
| Compass topic questions | Inventing questions | compass-topics-reference.md | 41 topics with exact question text and 1–5 scale |

---

## Common Pitfalls

### Pitfall 1: Peña-Melnyk Name Encoding
**What goes wrong:** CSV file contains "Joseline Pena-Melnyk" (no ñ) but DB has "Joseline Peña-Melnyk" — gen_migration.py finds no matching name, inserts not-found comment silently.
**Why it happens:** Non-ASCII character stripped by editor or research agent.
**How to avoid:** CSV full_name must be `Joseline Peña-Melnyk` (U+00F1). Verify by checking: `grep -c "Pe.a-Melnyk" [csv-file]` — should return 1.
**Warning signs:** Migration verification query shows 0 stances for her politician_id.

### Pitfall 2: Compound Last Names on mgaleg
**What goes wrong:** mgaleg.maryland.gov URL slug uses only part of a compound last name; looking up "White Holland" by full name gives 404.
**Why it happens:** mgaleg slugs use the last word of compound names for most delegates (e.g., "Fraser-Hidalgo" → `fraser01`, "White Holland" → `white01` using first word).
**How to avoid:** Follow established pattern: Fraser-Hidalgo → `fraser01`, White Holland → `white01`, Palakovich Carr → `palakovich01` (first word of compound). When in doubt, check the mgaleg roster page HTML.
**Warning signs:** 404 on mgaleg voting record URL.

### Pitfall 3: Smith/Johnson Name Collisions in CSV
**What goes wrong:** gen_migration.py groups by name only; "Steve Johnson" and "Andre V. Johnson, Jr." in the same batch could collide if name matching is ambiguous.
**Why it happens:** The CSV lookup is by full_name string — must match exactly.
**How to avoid:** Keep Steve Johnson and Andre V. Johnson, Jr. in the same batch (Batch F, migration 291) and ensure their CSV `full_name` fields match exactly: `Steve Johnson` and `Andre V. Johnson, Jr.` respectively. Same applies to Matthew Morgan (HD-29A) and Todd B. Morgan (HD-29C) in Batch E.
**Warning signs:** One politician's stances appearing under another's politician_id in verification query.

### Pitfall 4: CSV Comma in Name Requires Quoting
**What goes wrong:** Names with commas (e.g., `Marvin E. Holmes, Jr.`, `Frank M. Conaway, Jr.`) break CSV parsing if not quoted.
**Why it happens:** CSV reader treats unquoted comma as field delimiter.
**How to avoid:** Wrap names with commas in double-quotes in the CSV: `"Marvin E. Holmes, Jr.",topic_key,...`
**Warning signs:** gen_migration.py WARNING about unknown topic_key (the name fragment got parsed as topic_key).

### Pitfall 5: Vacant Delegate in candidate_inventory
**What goes wrong:** Including "Vacant" (HD-42A) as a research agent target generates a meaningless CSV with no evidence.
**Why it happens:** Researcher forgets the vacancy status.
**How to avoid:** HD-42A (politician_id `67acad60-5839-4a8a-95ac-c881c3ca39a9`) should appear in the Batch G candidate_inventory but receive NO research agent. The gen_migration.py not-found auto-comment handles it correctly when no CSV rows exist.
**Warning signs:** CSV file created for "Vacant" with fabricated stances.

### Pitfall 6: Wrong gen_migration.py Block
**What goes wrong:** Adding MD delegate batch sections to the wrong location in gen_migration.py — placing them inside the `if __name__ == '__main__'` block but accidentally overwriting an existing batch.
**Why it happens:** The file already has 7 existing batch sections (BATCH2, BATCH3, GAPFILL, SF, MD_EXEC, MD_SENATORS_A/B/C).
**How to avoid:** Add new MD_DELEGATES_A through MD_DELEGATES_G sections at the bottom of the constants area, then add corresponding generate_migration() calls at the END of the `if __name__ == '__main__'` block. Never remove or modify existing batch sections.

### Pitfall 7: Running Batches in Parallel
**What goes wrong:** Multiple research agents run simultaneously, exhausting Claude API rate limit quota mid-batch with no recoverable output.
**Why it happens:** Temptation to parallelize for speed.
**How to avoid:** Strictly sequential — one agent at a time. This is a locked decision (D-07). No exceptions.

---

## Code Examples

### gen_migration.py candidate_inventory format (from existing MD senate batches)
```python
# [VERIFIED: gen_migration.py source code reviewed 2026-06-07]
MD_DELEGATES_A_CANDIDATES = [
    ("Jim Hinebaugh, Jr.",       "3817ad52-3f43-4bd3-8525-e7dcd0816153"),  # HD-1A
    ("Jason C. Buckel",          "5260bd6f-e70a-46f1-aa7d-49eaf22192cf"),  # HD-1B
    ("Terry L. Baker",           "d049cf3e-6577-4f8d-ba7e-768ac2b78d66"),  # HD-1C
    # ... (full list in batch boundary section above)
]
```

### CSV format (from existing Phase 97 pattern)
```csv
full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3
"Joseline Peña-Melnyk",abortion,1,"Sponsored HB 1171 (2023) expanding abortion access",https://mgaleg.maryland.gov/...,,
```

### gen_migration.py call for each batch
```python
# [VERIFIED: gen_migration.py source code reviewed 2026-06-07]
generate_migration(
    migration_num=286,
    batch_label="MD Delegates Batch A — Districts 1-7",
    candidate_inventory=MD_DELEGATES_A_CANDIDATES,
    csv_files=MD_DELEGATES_A_CSVS,
    excluded_topics=EXCLUDED_TOPICS_FEDERAL,
    header_scope_note="Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded.",
    outpath=os.path.join(base, "286_md_delegates_batch_a.sql"),
)
```

### Verification query (run after each migration)
```sql
-- [VERIFIED: gen_migration.py source code - auto-generated in each migration]
SELECT p.full_name, COUNT(pa.topic_id) AS topic_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.id IN ('...', '...')  -- batch politician_ids
GROUP BY p.id, p.full_name ORDER BY topic_count;

-- Context pairing (must return 0):
SELECT COUNT(*) FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id IN ('...')
  AND pc.politician_id IS NULL;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| politician_id in CSV | name-only matching, pid from candidate_inventory | Phase 97 | Simpler CSVs; gen_migration.py handles matching |
| Parallel research agents | Sequential (one per politician) | Phase 82 | Rate limit compliance; recoverable partial batches |
| Individual apply scripts per politician | gen_migration.py batch migration | Phase 97 | Cleaner migration history; single numbered SQL file per batch |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | DB verification | Yes | PostgreSQL 15.x (via pooler) | None needed |
| Python 3 | gen_migration.py | Yes | Confirmed (gen_migration.py runs on this system) | None needed |
| mcp__supabase-local__apply_migration | Migration application | Yes | Live MCP tool | None |
| mgaleg.maryland.gov | Research source | Yes (web) | — | ballotpedia.org, ontheissues.org |
| compass-topics-reference.md | Research agent prompts | Yes | Exists at C:/EV-Accounts/backend/data/stance-research/ | None needed |

---

## Validation Architecture

> workflow.nyquist_validation is not set in .planning/config.json — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline in each migration) + psql manual gates |
| Config file | none — queries embedded in migration SQL as comments |
| Quick run command | psql ... -c "SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id IN (...)" |
| Full suite command | Run all verification SELECTs from migration footer + compass UI spot-check (Plan 98-07) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MD-STANCES-03 | All 140 active delegates have stances OR not-found comment | SQL gate | `SELECT COUNT(DISTINCT pa.politician_id) FROM inform.politician_answers pa JOIN essentials.offices o ON o.politician_id=pa.politician_id JOIN essentials.districts d ON d.id=o.district_id WHERE d.district_type='STATE_LOWER' AND d.state='md'` | Wave 0 (embedded in Plan 98-07) |
| MD-STANCES-03 | Every stance has non-null source_url | SQL gate | `SELECT COUNT(*) FROM inform.politician_context WHERE sources = '{}' AND politician_id IN (...)` | Wave 0 |
| MD-STANCES-03 | All values are integers 1-5 | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers WHERE value NOT BETWEEN 1 AND 5 AND politician_id IN (...)` | Wave 0 |
| MD-STANCES-04 | Compass renders on 3 senators + 3 delegates | Manual UI spot-check | Human-verify via browser | Plan 98-07 |

### Sampling Rate
- **Per batch migration applied:** Run the 2 verification SELECTs from migration footer
- **Per wave (each plan):** Confirm row count for batch matches expected range
- **Phase gate:** Full coverage SQL query + human UI spot-check before closing Phase 98

### Wave 0 Gaps
- [ ] Add 7 MD delegate batch sections to `gen_migration.py` — covers all 7 migrations (286–292)

---

## Security Domain

This phase inserts read-only content into inform.politician_answers and inform.politician_context. No user data, authentication, or secrets involved. No ASVS categories apply. All SQL is parameterized through gen_migration.py string formatting (values are researcher-supplied integers and text, not user input).

---

## Open Questions

1. **Batch boundary refinement**
   - What we know: Batches A/C/D/F/G have 21 delegates; B/E have 18. Total = 141 correct.
   - What's unclear: Planner may want to rebalance. Batch A could split at district 6 (18 delegates) and push district 7 to Batch B (3 delegates, giving 21 each). Both approaches are valid.
   - Recommendation: Accept the boundaries as defined above. The imbalance (18 vs 21) is within the "~20 per plan" tolerance specified in D-01.

2. **Delegate visibility online**
   - What we know: Some rural Western MD delegates (Districts 1–6) have minimal digital footprint; Western MD is predominantly Republican and many delegates hold no major leadership positions.
   - What's unclear: How many of Batches A and E will result in not-found comments.
   - Recommendation: Accept not-found outcomes for delegates with no discoverable public stance. The evidence-only constraint (D-08) is non-negotiable. Expect ~10-20% not-found rate for rural/back-bench delegates based on Phase 97 senator pattern.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | gen_migration.py can run as-is with new MD delegate batch sections appended | Code Examples | Low — file structure is well-established; confirmed by reading source |
| A2 | mgaleg.maryland.gov is accessible for delegate voting record research | Environment Availability | Low — confirmed accessible for Phase 93/94 headshot work |
| A3 | District 42A (Vacant) has no substitute/replacement delegate as of 2026-06-07 | Batch G | Low — confirmed vacant at 2026-06-05 during Phase 93; no filing detected |

**If this table is short:** Virtually all claims in this research are verified from direct DB queries and source code review.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: production DB query] — Full 141-row delegate roster with politician_ids, executed 2026-06-07
- [VERIFIED: C:/EV-Accounts/backend/migrations/generate_md_house.ps1] — Roster structure, subdistrict logic, vacant status
- [VERIFIED: C:/EV-Accounts/backend/data/stance-research/gen_migration.py] — Tool signature, EXCLUDED_TOPICS_FEDERAL, candidate_inventory format, name-only grouping behavior
- [VERIFIED: C:/EV-Accounts/backend/migrations/ listing] — Migration 285 confirmed last applied; next is 286
- [VERIFIED: production DB query] — 0 MD delegate stances in inform.politician_answers as of 2026-06-07

### Secondary (MEDIUM confidence)
- [CITED: .planning/phases/97-CONTEXT.md] — Phase 97 patterns for gen_migration.py, CSV format, batch structure
- [CITED: .planning/STATE.md] — Migration history, key decisions carried forward

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tooling verified by direct file/DB inspection
- Batch boundaries: HIGH — DB query returned all 141 rows; boundaries computed manually and checked against 141-entry total
- Politician IDs: HIGH — verified from production DB, not from gen_migration.py roster alone
- Pitfalls: HIGH — derived from Phase 97 execution logs in STATE.md + source code analysis
- Research patterns (mgaleg): MEDIUM — established in Phases 93/94 for headshots; applies to voting records too

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (stable data; roster changes only if MD delegates resign/die)
