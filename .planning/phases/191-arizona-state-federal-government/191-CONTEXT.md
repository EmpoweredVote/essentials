# Phase 191: Arizona State & Federal Government - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Arizona's statewide **executive** (Gov. Katie Hobbs + all statewide elected
constitutional officers) and its **federal delegation** (2 US Senators + 9 US House reps)
as profile-visible officials with correct election/appointment flags and 600×750 headshots,
each linked to the correct Phase 190 geofence tier (STATE_EXEC / NATIONAL_UPPER /
NATIONAL_LOWER). Satisfies AZ-STATE-01 + AZ-STATE-02. Combined into one phase per the NV
v18.0 (Phase 159) pattern.

**In scope:** State of Arizona government row + chambers/offices for ~11 statewide *elected*
officials (Governor, Secretary of State, Attorney General, State Treasurer, Superintendent of
Public Instruction, State Mine Inspector, + the 5-member Corporation Commission); 2 US Senators
(Mark Kelly, Ruben Gallego) as NATIONAL_UPPER (statewide); 9 US House reps as NATIONAL_LOWER
(each linked to its CD geofence from Phase 190); 600×750 headshots for all seeded officials;
STATE_EXEC district linkage.

**Out of scope:** the 90-member Legislature (Phase 192); appointed agency/cabinet directors
(deferred); Pima County + Tucson-metro local officials (Phases 193–198); 2026 election shells
(Phase 199); compass stances (deferred milestone-wide for the state tier). No frontend change
beyond officials appearing on their existing profile surfaces.
</domain>

<decisions>
## Implementation Decisions

### Constitutional officer roster scope
- **D-01:** Seed **all statewide *elected* constitutional officers** (~11 total), not just the
  obvious executives. The slate: Governor (Katie Hobbs), Secretary of State (Adrian Fontes),
  Attorney General (Kris Mayes), State Treasurer (Kimberly Yee), Superintendent of Public
  Instruction (Tom Horne), **State Mine Inspector** (the AZ-only elected office), and the
  **5 Corporation Commissioners**. Rationale: every office an AZ voter marks on a statewide
  ballot is covered. Exact current names/incumbency confirmed at research/plan time.

### Arizona Corporation Commission
- **D-02:** Model the Corporation Commission as **its own chamber under State of Arizona** —
  a distinct "Arizona Corporation Commission" chamber holding **5 at-large member offices**,
  all attached to the **statewide STATE_EXEC district** (commissioners are elected statewide,
  at-large, staggered terms — NOT by district). Keeps this collegial regulatory body visually
  and structurally separate from the Governor's single-seat executive officers. NOT modeled as
  5 sibling STATE_EXEC officers, and NOT deferred.

### Elected vs appointed
- **D-03:** **Elected-only.** Every seeded statewide official is flagged **voter-elected**.
  Appointed agency/cabinet directors are OUT of scope and captured under Deferred Ideas. The
  requirement text's "some appointed" phrasing does not apply to Arizona's statewide slate —
  all ~11 offices in D-01 are elected.
- **D-03a:** Record a data/display note that **Arizona has no Lieutenant Governor** — the
  Secretary of State is first in the line of gubernatorial succession. Do not seed a phantom
  Lt. Gov office.

### US House roster & vacancy policy
- **D-04:** Seed the **current sitting officeholder** for each of the 9 CDs **as of the seed
  date**. Research confirms the live roster at plan time, including the **CD-7 succession**
  (Raúl Grijalva d. March 2025 → Adelita Grijalva). A genuinely vacant seat is seeded as a
  **vacant office (no politician attached)** rather than a former holder — never backfill a
  departed member. The 2 US Senators (Kelly, Gallego) are seeded as NATIONAL_UPPER (statewide).

### Locked by precedent (NOT re-decided — inherited from NV 159 + 190-CONTEXT)
- Headshot pipeline: **US House** → `unitedstates.github.io` 450×550 public-domain (resize-only,
  already 4:5); **state execs / senators** → official `.gov` portrait or Wikimedia Commons with a
  **descriptive User-Agent** (generic UA → HTTP 429/403); 600×750 Lanczos q90, 4:5 crop-first.
- District casing (locked in 190-CONTEXT): `districts.state='AZ'` **uppercase** for
  STATE_EXEC + NATIONAL tiers; the 14 pre-existing AZ district rows from prior seed
  (STATE_EXEC 4, NATIONAL_UPPER 1, NATIONAL_LOWER 9) already exist — **DB-pre-check and reuse,
  do not duplicate**.
- Cross-repo: all backend/migration/script work lives in `C:/EV-Accounts` (default branch
  `master`, push deploys to Render); commit via `git -C "C:/EV-Accounts"`. `mcp__supabase-local`
  IS production. Migration counter is DB-integer-ledger authoritative (STATE.md figures may be
  stale — verify MAX before assigning).

### Claude's Discretion
- Exact ext_id numbering scheme for the new AZ officials (follow the NV `-32xxxxx` / CA
  `-60003xx` sibling conventions; pick a clean AZ range at plan time).
- Which headshot source wins per official when multiple exist (official .gov preferred; document
  license per image).
- Whether the Governor is modeled in its own single-seat chamber vs a shared "Executive Officers"
  chamber alongside SoS/AG/Treasurer/Superintendent/Mine Inspector — planner picks the structure
  that best mirrors the established STATE_EXEC pattern from NV/CA.
- Plan/wave split (NV 159 used 3 plans: state exec → US House headshots → verification).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase planning
- `.planning/ROADMAP.md` §"Phase 191: Arizona State & Federal Government" — goal, depends-on
  (Phase 190), success criteria 1–4 (STATE_EXEC elected/appointed flags, 2 senators
  NATIONAL_UPPER, 9 House NATIONAL_LOWER linked to CD geofences, all with headshots).
- `.planning/REQUIREMENTS.md` §"AZ-STATE-01" + §"AZ-STATE-02" — the two requirements this phase satisfies.

### Precedent context (closest analog — mirror nearly 1:1)
- `.planning/milestones/v18.0-phases/159-nevada-state-federal-government/159-01-PLAN.md` +
  `159-01-SUMMARY.md` — STATE_EXEC official seed pattern (chamber + STATE_EXEC district +
  office + office_id back-fill; Wikimedia descriptive-UA GOTCHA).
- `.../159-02-PLAN.md` + `159-02-SUMMARY.md` — US House headshot pattern
  (`unitedstates.github.io` public-domain, resize-only for 4:5 sources; bioguide-ID lookup).
- `.../159-03-SUMMARY.md` — verification SQL audit shape (resident sees Gov + officers +
  senators + their House member, each with a headshot).
- `.../159-RESEARCH.md` + `159-PATTERNS.md` — technical approach and pattern map for the NV analog.

### This milestone's geofence groundwork
- `.planning/phases/190-arizona-tiger-geofences/190-CONTEXT.md` — casing rule, the 14
  pre-existing AZ district rows, cross-repo + supabase-is-prod notes.
- `.planning/phases/190-arizona-tiger-geofences/190-02-SUMMARY.md` — final AZ geofence/district
  row inventory the federal CD linkage depends on (9 CD geofences, NATIONAL_LOWER district rows).

### Reusable code (backend repo `C:\EV-Accounts`)
- `backend/migrations/` — structural (registered) vs audit-only (headshots/stances, unregistered)
  migration convention; `1050_nv_controller.sql` (structural) + `1052_nv_controller_headshot.sql`
  (audit) are the shape templates.
- `backend/scripts/_tmp-*-headshot.py` — gitignored inline headshot-processing helper pattern.

### Playbook
- `LOCATION-ONBOARDING.md` — per-state officials/headshot GOTCHAs; add the Arizona block in
  Phase 200 (retrospective), not here.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- NV 159 migrations (`1050`/`1052`) — copy-adapt structural + audit migration shape for AZ
  officials + headshots.
- `unitedstates.github.io` congressional-photo pipeline (resize-only, 450×550 → 600×750) — reuse
  verbatim for the 9 AZ House reps + (where available) the 2 senators.
- STATE_EXEC chamber/office/district back-fill pattern from NV 159-01 — one net-new government
  ("State of Arizona") plus chambers and offices hung off it.

### Established Patterns
- `essentials.governments` → chambers → offices → politicians, with `districts` linkage via
  casing-sensitive `state` column (`'AZ'` uppercase for STATE_EXEC/NATIONAL).
- Officials become profile-visible automatically once office + politician + image rows exist;
  no frontend change needed (address routing already resolves via Phase 190 geofences).
- Migration counter is DB-ledger authoritative; structural migs registered, headshot migs audit-only.

### Integration Points
- Federal CD linkage consumes the 9 CD geofences + NATIONAL_LOWER district rows loaded in Phase 190.
- STATE_EXEC officials attach to the statewide STATE_EXEC district (4 such district rows already exist).
- Downstream: Phase 192 (Legislature) reuses the same government row + chamber pattern; the CD-7
  seat interacts with Phase 199 (2026 elections).

### Non-obvious project state
- `gsd-executor` has no Supabase MCP — DB pre-checks (existing AZ government/officials, migration
  MAX, section-split) run inline within the phase, not via subagent.
- The 14 pre-existing AZ district rows mean this phase is **not strictly greenfield** at the
  district tier — DB-verify existing rows before inserting to avoid duplicates (NV 159 was itself
  a partly-seeded reconcile).
</code_context>

<specifics>
## Specific Ideas

- The Corporation Commission should read as one collegial elected body (its own chamber with
  5 at-large seats), not five scattered executive officers — this is the headline AZ-specific
  modeling call.
- Every seeded official is voter-elected; explicitly note the absence of a Lieutenant Governor so
  no phantom office is created and succession display is correct (SoS is next in line).
- Vacant US House seats surface as vacant offices, never as a departed member — profiles must
  reflect who represents a resident *today*.
</specifics>

<deferred>
## Deferred Ideas

- **Appointed AZ executive-branch officials** (agency/cabinet directors, e.g. Director of the
  Dept. of Administration) — not voter-elected; out of scope for this phase. Revisit only if
  appointed-official coverage becomes a goal.
- **Arizona Legislature (90 members)** — Phase 192 (seed + headshots; stances deferred).
- **Compass stances for state/federal officials** — deferred milestone-wide (NV v18.0 pattern).

### Reviewed Todos (not folded)
None — no pending todos matched this phase.
</deferred>

---

*Phase: 191-arizona-state-federal-government*
*Context gathered: 2026-07-08*
