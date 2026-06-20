## Wave 2 deep-seed — shared conventions (carry into phases 145–156)

- **Greenfield cities:** no `governments` row, no officials — each phase creates the government +
  chamber, seeds the roster, uploads headshots, then researches stances (heavier than the v15.0
  stances-only shortcut).

- **Geofences already exist** (v7.0, TIGER G4110) — confirmed for all 15. Do NOT reload TIGER.
- **Verify per city before seeding:** form of government (mayor-council vs council-manager),
  directly-elected vs rotational mayor, district vs at-large council, current seat count and
  district map (several LA County cities moved to by-district elections post-CVRA).

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

- [ ] 145-01-PLAN.md — Wave 1 reconcile: geo_id backfill + move-then-delete duplicate chamber + Mayor LOCAL_EXEC (migration 910)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 145-02-PLAN.md — Wave 2 roster: retire Crist, reseat Parris/Hughes-Leslie/Mann, create White/Castellanos (migration 911)

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

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0655156
2. Council structure matches Palmdale's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 147: Pomona deep-seed

**Goal:** Take Pomona (geo_id 0658072) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** POMO-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0658072
2. Council structure matches Pomona's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 148: Torrance deep-seed

**Goal:** Take Torrance (geo_id 0680000) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** TORR-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0680000
2. Council structure matches Torrance's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 149: Pasadena deep-seed

**Goal:** Take Pasadena (geo_id 0656000) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** PASA-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0656000
2. Council structure matches Pasadena's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 150: Downey deep-seed

**Goal:** Take Downey (geo_id 0619766) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** DWNY-01

**Success criteria:**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to geo_id 0619766
2. Council structure matches Downey's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

### Phase 151: El Monte deep-seed

**Goal:** Take El Monte (geo_id 0622230) from geofence-only to full Tier 1 depth — government structure, elected roster, headshots, and evidence-only compass stances.

**Requirements:** ELMN-01

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
