## Wave 2 deep-seed — shared conventions (carry into phases 145–156)

- **⚠ NOT greenfield — these are RECONCILES (DB-verified milestone-wide 2026-06-20).** Every one of
  the 12 remaining cities already has a `governments` row (bulk-imported, likely the v7.0 CA provider
  load) with **`geo_id = NULL`** and offices already filled. 11 of 12 carry a **duplicate "City Council"
  chamber** (split-section defect; rosters split across two same-named chambers). **Stances are 0
  across all 12.** So each phase is **reconcile (backfill geo_id + merge duplicate chambers + repair the
  offices.politician_id ↔ politicians.office_id bidirectional link + drop stale members) + complete
  (add current members missing post-election) + headshots (fill gaps) + stances (the big universal
  gap)** — NOT create-from-scratch. See `145-CONTEXT.md` + memory `project_v170_wave2_not_greenfield`.

- **Search by NAME, not geo_id**, when pre-checking (`name = 'City of <X>, California, US'`) — geo_id
  is NULL on all of them, so geo_id lookups return nothing (the Lancaster trap).

- **Per-city DB pre-check is MANDATORY before planning each phase** — confirm which members are current
  (recent elections retire/replace incumbents; e.g. Lancaster's Malhi lost + Crist retired April 2026),
  confirm the duplicate-chamber split, and check headshot/stance gaps. Do NOT trust a prior pre-check
  that joined the wrong link direction (`offices.politician_id` vs `politicians.office_id`).

- **Geofences already exist** (v7.0, TIGER G4110) — confirmed for all 15. Do NOT reload TIGER.
- **Verify per city:** form of government (mayor-council vs council-manager), directly-elected vs
  rotational mayor, district vs at-large council, current seat count and district map (several LA
  County cities moved to by-district elections post-CVRA).

- **Stances:** evidence-only, one research agent at a time (rate-limit rule), all live compass
  topics, per-individual migration files applied immediately, no default values, honest blanks.

- **Conventions:** headshots 600×750 (4:5 Lanczos, `press_use`); `politician_images.type='default'`;
  governments INSERT uses WHERE NOT EXISTS (no geo_id unique constraint); `slug` is generated on
  chambers (never INSERT it); stance migrations apply via raw SQL and don't register in
  schema_migrations (on-disk counter authoritative). See LOCATION-ONBOARDING.md + templates.

- **Antipartisan:** party may be stored but never displayed on profiles.
- **Next migration:** 910 (advance the on-disk counter as each phase lands).
- **Shared build order within each phase:** government+chamber → roster (offices) → headshots →
  stances → spot-check render.

---

### Phase 145: Lancaster deep-seed

**Goal:** Take Lancaster (geo_id 0640130) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** LANC-01

**Plans:** 4 plans

Plans:
**Wave 1**

- [ ] 145-01-PLAN.md — Wave 1 reconcile: geo_id backfill + merge duplicate chamber (move-then-delete) + repair bidirectional office↔politician link for the 3 continuing members; Mayor district confirmed LOCAL_EXEC (migration 910)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 145-02-PLAN.md — Wave 2 roster turnover: retire Malhi (lost) + Crist (did not file), create White/Castellanos and seat into the freed offices with synced pointers (migration 911)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 145-03-PLAN.md — Wave 3 headshots: Parris (Wikimedia) + WAF-blocked browser-sourced portraits, honest gaps (migration 912, audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 145-04-PLAN.md — Wave 4 stances: 5 current members, evidence-only chairs model, one agent at a time, no judicial (migrations 913-917, audit-only)

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0640130
2. Council structure matches Lancaster's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 146: Palmdale deep-seed

**Goal:** Take Palmdale (geo_id 0655156) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** PLMD-01

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 146-01-PLAN.md — Wave 1 reconcile: geo_id backfill + merge duplicate chamber (move-then-delete) + relabel 4 At-Large districts to D1/D2/D4/D5 + create new District 3 row (migration 918)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 146-02-PLAN.md — Wave 2 roster: repair Bishop's bidirectional link + create Bettencourt (-700657) seated into a new District 3 office + flag Mayor on Ohlsen's seat (Glendale model); official_count=5 (migration 919)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 146-03-PLAN.md — Wave 3 headshots: Bettencourt from cityofpalmdaleca.gov documentID=13184 (no WAF), 600×750; the other 4 already imaged; honest gaps documented (migration 920, audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 146-04-PLAN.md — Wave 4 stances: 5 current members (all current, no exclusions), evidence-only chairs model, one agent at a time, no judicial (migrations 921-925, audit-only)

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0655156
2. Council structure matches Palmdale's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 147: Pomona deep-seed

**Goal:** Take Pomona (geo_id 0658072) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** POMO-01

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 147-01-PLAN.md — Wave 1 reconcile: geo_id backfill + merge duplicate chamber (move-then-delete, 3 offices) + relabel 4 At-Large districts to D1/D2/D3/D6 + create new District 4 + District 5 + repoint Lustro off the shared district UUID; directly-elected Mayor LOCAL_EXEC reused (migration 926)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 147-02-PLAN.md — Wave 2 roster: repair 3 bidirectional links (Garcia/Lustro/Sandoval) + create Ontiveros-Cole (-700658) seated into a new District 4 office + reuse the directly-elected Mayor (Lancaster LOCAL_EXEC model); official_count=7 (migration 927)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 147-03-PLAN.md — Wave 3 headshots: pomonaca.gov WAF-403 -> alt sources (PCE 2020 / campaign / DB-reprocess); reject stale PCE-2025 wrong-person photos (Torres/Gonzalez); 600x750; honest gaps documented (migration 928, audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 147-04-PLAN.md — Wave 4 stances: 7 current members (all current, no exclusions), evidence-only chairs model, one agent at a time, no judicial; RSO positions cited (migrations 929-935, audit-only)

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0658072
2. Council structure matches Pomona's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 148: Torrance deep-seed

**Goal:** Take Torrance (geo_id 0680000) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** TORR-01

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 148-01-PLAN.md — Wave 1 reconcile: geo_id backfill (empty-string guard) + DELETE the Brigitte-Lewis typo-duplicate (office+politician) + merge duplicate chamber (move-then-delete, 3 offices) + create one new At-Large row + repoint Sheikh off the shared At-Large UUID; AT-LARGE preserved (no by-district relabel); directly-elected Mayor LOCAL_EXEC reused (migration 936)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 148-02-PLAN.md — Wave 2 roster (light — current council all exists): repair 3 broken back-pointers (Chen/Mattucci/Sheikh) + official_count=7; seat the CURRENTLY-SEATED council (Chen Mayor, no retirements, no Betty Lieu, no Kalani-as-Mayor); directly-elected Mayor reused (migration 937)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 148-03-PLAN.md — Wave 3 headshots: torranceca.gov NO-WAF direct curl; Kaji/Kalani showpublishedimage URLs, Gerson/Bridgett-Lewis council pages, Chen reprocess to canonical seated-Mayor portrait, Mattucci/Sheikh verify existing; 600x750; honest gaps documented (migration 938, audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 148-04-PLAN.md — Wave 4 stances: 7 current members (Chen/Mattucci seated, not retired; no Betty Lieu), evidence-only chairs model, one agent at a time, no judicial topics, no manufactured rent-regulation; documented Torrance votes (Pride/anti-camping/Homekey+/airport-ban) cited (migrations 939-945, audit-only)

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0680000
2. Council structure matches Torrance's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 149: Pasadena deep-seed

**Goal:** Take Pasadena (geo_id 0656000) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** PASA-01

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 149-01-PLAN.md — Wave 1 reconcile (STRUCTURAL, migration 946): geo_id backfill (empty-string guard) + merge the 2 duplicate City Council chambers (move-then-delete, 2 offices: Gordo/Mayor + Hampton) + BY-DISTRICT relabel At-Large to District 1-7 + create any missing district (D7) + Lyon image dedupe; directly-elected Mayor LOCAL_EXEC reused

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 149-02-PLAN.md — Wave 2 roster link-repair (STRUCTURAL, migration 947): repair broken back-pointers (Gordo/Hampton + any NULL) + optional Cole-not-Williams name correction + official_count=7; NO retirements/creations (all 8 current and exist); directly-elected Mayor reused

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 149-03-PLAN.md — Wave 3 headshots (AUDIT-ONLY, migration 948): cityofpasadena.net NO-WAF direct curl; Rivas newly uploaded (was 0 images), other 7 reprocessed to canonical 600x750; verify D2 is Rick Cole not Felicia Williams; honest gaps documented

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 149-04-PLAN.md — Wave 4 stances (AUDIT-ONLY, migrations 949-956): 8 current members (no exclusions), evidence-only chairs model, one agent at a time, no judicial topics; rent-regulation APPLIES (active Measure H RSO — do NOT auto-blank); RSO/Measure H positions cited

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0656000
2. Council structure matches Pasadena's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 150: Downey deep-seed

**Goal:** Take Downey (geo_id 0619766) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** DWNY-01

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 150-01-PLAN.md — Wave 1 reconcile (STRUCTURAL, migration 990): geo_id backfill + merged 2 duplicate chambers + BY-DISTRICT relabel At-Large→D1-D5 + collapsed LOCAL_EXEC (Sosa D2 title='Mayor') + created District 1 row (39e05679) + fixed Trujillo name; ZERO LOCAL_EXEC; split-section check 0 rows

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 150-02-PLAN.md — Wave 2 roster reconcile (STRUCTURAL, migration 991): created+seated Horacio Ortiz (D1, ext_id -700991, UUID 13dc32dd); unlinked Saab (-700160) + Pelc (-700161) — rows KEPT, is_active=false; repaired Trujillo back-pointer (was NULL); official_count=5; all 5 members bidirectionally linked (Ortiz D1/Sosa D2 Mayor/Pemberton D3/Frometa D4/Trujillo D5)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 150-03-PLAN.md — Wave 3 headshots (AUDIT-ONLY, migration 987): downeyca.org WAF-403 to curl — operator in-browser for 4, Frometa via SCAG direct curl; full greenfield (all 5 were 0 images); verify D1 is Horacio Ortiz not Timothy Horn + D3 is Pemberton not 'vacant'; 600x750 4:5; honest gaps documented

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 150-04-PLAN.md — Wave 4 stances (AUDIT-ONLY, migrations 988-992): 5 current members (Trujillo/Sosa/Frometa rich-medium, Pemberton/Ortiz thin Dec-2023), evidence-only chairs model, one agent at a time, no judicial topics (appointed City Attorney); pre-tenure discipline — Jan 2021 rent-control vote attributed ONLY to Trujillo + Frometa; honest blanks preserved

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0619766
2. Council structure matches Downey's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 151: El Monte deep-seed

**Goal:** Take El Monte (geo_id 0622230) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** ELMN-01

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 151-01-PLAN.md — Wave 1 reconcile: geo_id backfill ('0622230') + merge the two duplicate 'City Council' chambers (move Longoria+Ruedas into survivor 5ca38f3a, then delete b41e0065) + relabel At-Large→D1–D5 + create District 6 row; directly-elected Mayor (Ancona, LOCAL_EXEC) kept as-is (migration 1000, structural)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 151-02-PLAN.md — Wave 2 roster: create+seat Marisol Cortez (D6, NEW politician, next custom ext_id) into a new office on the District 6 row + repair bidirectional links for all 7 members + official_count=6 (council only; directly-elected Mayor excluded) (migration 1001, structural)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 151-03-PLAN.md — Wave 3 headshots: verify 6 pre-existing images + source Cortez fresh, all via direct curl from ci.el-monte.ca.us NO-WAF documentIds (7429–7435); 4:5→600×750; re-crop only failures; honest gaps; blocking human-verify (migration 1002, audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 151-04-PLAN.md — Wave 4 stances: 7 current members, evidence-only chairs model, one agent at a time, no judicial topics, pre-tenure discipline for the 3 thin Nov-2024 members; blocking human-verify (migrations 1003–1009, audit-only)

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0622230
2. Council structure matches El Monte's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 152: West Covina deep-seed

**Goal:** Take West Covina (geo_id 0684200) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** WCOV-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0684200
2. Council structure matches West Covina's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

**Plans:** 3/4 plans executed
Plans:
**Wave 1**

- [x] 152-01-PLAN.md — Reconcile: geo_id backfill + merge two City Council chambers (survivor 12c9360a) + repair 2 one-directional links + by-district relabel D1-D5 (mig 1010, structural)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 152-02-PLAN.md — Roster finalize: rotational Mayor (Lopez-Viado D2) + Mayor Pro Tem (Cantos D4) titles-on-seat + official_count=5; no new politician (mig 1011, structural)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 152-03-PLAN.md — Headshots: verify-and-fix 5 pre-existing (all low-res), NO-WAF direct curl westcovina.gov documentIDs 1052-1056 (mig 1012, audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 152-04-PLAN.md — Stances: full greenfield, 5 members evidence-only chairs, no judicial, rent-regulation only-if-evidence, one agent at a time (migs 1013-1017, audit-only)

### Phase 153: Inglewood deep-seed

**Goal:** Take Inglewood (geo_id 0636546) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** INGL-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0636546
2. Council structure matches Inglewood's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 154: Burbank deep-seed

**Goal:** Take Burbank (geo_id 0608954) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** BURB-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0608954
2. Council structure matches Burbank's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 155: Norwalk deep-seed

**Goal:** Take Norwalk (geo_id 0652526) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** NRWK-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0652526
2. Council structure matches Norwalk's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 156: Bellflower deep-seed

**Goal:** Take Bellflower (geo_id 0604982) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances. (Tier B, 70k–100k.)

**Requirements:** BLFL-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0604982
2. Council structure matches Bellflower's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

---

### Phase 157: Wave 2 close-out

**Goal:** Surface the new cities and capture learnings.

**Requirements:** LAC2-RETRO-01

**Plans:** 3 plans
Plans:
**Wave 1**

- [ ] 157-01-PLAN.md — DB-verify per-city counts for all 15 cities + write v17.0-MILESTONE-AUDIT.md (structure-hard/data-soft verdicts, deferred split-section follow-up)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 157-02-PLAN.md — Surface 15 cities in Landing.jsx COVERAGE_STATES (alphabetical, hasContext only for >=1-stance cities) + add 15 Cities Onboarded rows + net-new GOTCHAs to LOCATION-ONBOARDING.md

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 157-03-PLAN.md — Close milestone: v17.0 Shipped entry in MILESTONES.md + status flip in STATE.md / PROJECT.md

**Success criteria:**

1. All 15 new cities present in Landing.jsx COVERAGE_STATES with correct browse wiring (purple/has-context)
2. LOCATION-ONBOARDING.md updated — any LA-County-Wave-2 GOTCHAs + 15 Cities Onboarded rows
3. v17.0 milestone audit written (DB-verified per-city counts) and milestone closed in MILESTONES.md / STATE.md / PROJECT.md
