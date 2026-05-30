# Phase 80: OR Compass Stances - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Ingest compass stances (1–5 scale values) for OR constitutional officers, federal officials, and Portland city council members so the compass widget renders on their profile pages. Strictly limited to these categories — OR state legislature is out of scope.

**Scope (13 executives + federal + 14 Portland officials):**
- 5 OR constitutional officers: Tina Kotek (Governor), Dan Rayfield (AG), Tobias Read (SoS), Elizabeth Steiner (Treasurer), Christina Stephenson (Labor Commissioner)
- 2 US Senators: Ron Wyden, Jeff Merkley
- 6 US House reps: Suzanne Bonamici (CD-1), Cliff Bentz (CD-2), Maxine Dexter (CD-3), Val Hoyle (CD-4), Janelle Bynum (CD-5), Andrea Salinas (CD-6)
- Portland council: Mayor Keith Wilson + 12 council members (Districts 1-4, 3 seats each)
- Portland City Auditor: Simone Rede (elected; research pass, accept 0 stances by design if no evidence)
- **Skip**: Robert Taylor (City Attorney, appointed) + Raymond Lee III (City Administrator, appointed) — no public policy record by design

**Out of scope:** OR state legislature (30 senators + 60 house reps from Phase 75) — deferred to future phase.

</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** OR state legislature (30 senators + 60 house reps from Phase 75) is DEFERRED — Phase 80 strictly covers constitutional officers + federal + Portland council.
- **D-02:** Appointed officials with no public policy record (Taylor, Lee III) receive 0 stances by design — no research needed.

### Portland Council Coverage
- **D-03:** Research all 12 Portland council members + Mayor Wilson equally using the standard evidence-only approach. Council members were elected Nov 2024 under the new charter — campaign materials and voter guides exist even with short records. Accept sparse or zero stances by design where evidence is genuinely absent.

### City Auditor
- **D-04:** Simone Rede (City Auditor, elected) — run a research pass. Accept 0 stances by design if no public positions on compass topics are found. Auditor role is financial-oversight focused; sparse/zero coverage is expected and not a failure.

### Research Rules (carried forward — hard constraints)
- **D-05:** ONE-AT-A-TIME rule: each stance research agent must run sequentially. NEVER run parallel research agents. This is a hard rate-limit constraint established in Phase 18/46/70 and locked in success criterion #3.
- **D-06:** Evidence-only: no stances without a verifiable, citable public record. No interpolation, no assumption from party affiliation.
- **D-07:** Value scale: 1=progressive, 5=conservative, integer values 1–5. Half-steps (0.5, 5.5) reserved for extreme edge cases only.

### Claude's Discretion
- Plan structure (2 vs. 3 plans — e.g., executives+federal in one plan, Portland council in another) is left to the planner to decide based on Phase 70 precedent.
- Research source priority per official is left to the researcher — Phase 70's CA patterns (official websites, Ballotpedia, campaign sites, vote records, news archives) apply.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Compass Stance Phases (direct precedent)
- `.planning/phases/18-compass-stances/18-RESEARCH.md` — Architecture deep-dive: how compass works, FK patterns, ingestion API, value scale (CONFIRMED HIGH confidence)
- `.planning/phases/46-cambridge-compass-stances/46-01-PLAN.md` — Verification-only pattern for small-scope compass close
- `.planning/phases/70-compass-stances/` — Phase 70 (CA compass stances) is the direct structural precedent: 3 plans, same one-at-a-time rule, same evidence threshold

### OR Official Identifiers (from Phase 74)
- `.planning/phases/74-or-executives-federal/74-03-SUMMARY.md` — All 13 OR executive + federal politician UUIDs and external_ids in a single table

### Phase Goal + Success Criteria
- `.planning/ROADMAP.md` §Phase 80 — Official scope, success criteria (especially criterion #3: one-at-a-time rule)

### Ingestion Infrastructure
- `C:/EV-Accounts/backend/scripts/` — Existing apply scripts (TypeScript); pattern: CSV in `data/stance-research/` + `apply-{slug}-stances.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing apply scripts in `C:/EV-Accounts/backend/scripts/apply-*.ts` — all share the same CSV → `inform.politician_answers` ON CONFLICT DO UPDATE pattern; copy any prior script as the template
- CSV format established: `politician_id, topic_id, topic_key, value, notes` — consistent across all prior phases

### Established Patterns
- Compass renders iff politician has ≥1 row in `inform.politician_answers` (gate: `GET /compass/politicians` returns IDs with stances; CompassCard returns null if not in set)
- `inform.politician_context` row required for every answer (citation enforcement — no citation = no staging)
- Phase 70 plan structure: Plan 01 = executives + US Senators, Plan 02 = US House reps, Plan 03 = city officials — planner should follow or adapt this structure
- No bridge migration needed: `politician_answers.politician_id` uses `essentials.politicians.id` UUIDs directly

### Integration Points
- Admin API: `PUT /api/compass/politicians/:id/answers` (bearer token, `essentials.politicians` UUID as `:id`)
- Production DB: mcp__supabase-local is the live remote Supabase instance — all writes are live

</code_context>

<specifics>
## Specific Ideas

- OR legislative officials (Phase 75) should get their own future compass stances phase — this is consistent with how other state-level officials (CA legislature) have been handled
- Portland council members elected via RCV Nov 2024 — campaign voter guides (Willamette Week, Portland Tribune, Oregonian) are likely the richest evidence source given short tenure

</specifics>

<deferred>
## Deferred Ideas

- **OR state legislature stances** — 30 OR senators + 60 OR house reps (Phase 75 officials) deferred to future backlog phase. Same one-at-a-time rule applies when that phase is executed.

</deferred>

---

*Phase: 80-or-compass-stances*
*Context gathered: 2026-05-30*
