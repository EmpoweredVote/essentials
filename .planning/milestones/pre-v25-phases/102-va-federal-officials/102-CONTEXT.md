# Phase 102: VA Federal Officials - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Virginia's 13-person federal delegation: assert Warner + Kaine (already fully seeded) then seed 11 US House reps linked to VA NATIONAL_LOWER CD geofences.

</domain>

<decisions>
## Implementation Decisions

### Warner + Kaine (NATIONAL_UPPER)
- **D-01:** Both senators are **already fully seeded** — politician rows, office rows linked to VA NATIONAL_UPPER (`geo_id='51'`, `state='VA'`), and `office_id` backfilled. No INSERT or UPDATE needed.
- **D-02:** External IDs stay as-is: Warner = `-400080`, Kaine = `-400079`. Do NOT update to canonical `-5101001/-5101002`. Migration uses pre-flight assertions to verify they exist, not UPDATEs.
- **D-03:** Senate chamber UUID confirmed: `7cbe07bc-84b8-433b-952b-540e7de18a92`

### VA House Reps (NATIONAL_LOWER)
- **D-04:** External ID scheme for House reps: `-5102001` through `-5102011` (VA FIPS 51 + "02" for House + sequential 1–11 matching CD number)
- **D-05:** All 11 NATIONAL_LOWER districts confirmed present in DB (`geo_ids 5101–5111`, `state='VA'`). NO district INSERTs needed.
- **D-06:** House chamber UUID confirmed: `c2facc31-7b13-428c-b7b9-32d0d3b95f76`
- **D-07:** `representing_state='VA'`, `is_appointed_position=false` for all 11 reps (all voter-elected)
- **D-08:** NOT EXISTS guard for House rep offices uses `(district_id, chamber_id)` — single-member NATIONAL_LOWER districts (each CD has exactly 1 rep)

### Migration Structure
- **D-09:** **Single migration file** — one plan. This matches OR (`224_or_federal_officials.sql`) and MD (`275_md_federal_officials.sql`) patterns.
- **D-10:** **No apply script** — straight SQL only. OR/MD/CA federal migrations used no TypeScript apply scripts.
- **D-11:** **Next migration number is 311.** STATE.md says 309 but 309 (LA Wave 3) and 310 (LA Wave 4 geo_id audit) are already taken. Planner MUST use 311.

### Roster (119th Congress, verify during research)
- VA-1: Rob Wittman (R) → `geo_id='5101'`, `external_id=-5102001`
- VA-2: Jen Kiggans (R) → `geo_id='5102'`, `external_id=-5102002`
- VA-3: Bobby Scott (D) → `geo_id='5103'`, `external_id=-5102003`
- VA-4: Jennifer McClellan (D) → `geo_id='5104'`, `external_id=-5102004`
- VA-5: Bob Good (R) → `geo_id='5105'`, `external_id=-5102005` *(verify — Cline won special election)*
- VA-6: Morgan Griffith (R) → `geo_id='5106'`, `external_id=-5102006`
- VA-7: Eugene Vindman (D) → `geo_id='5107'`, `external_id=-5102007`
- VA-8: Don Beyer (D) → `geo_id='5108'`, `external_id=-5102008` *(Alexandria is in VA-8)*
- VA-9: John McGuire (R) → `geo_id='5109'`, `external_id=-5102009` *(verify — won special election)*
- VA-10: Suhas Subramanyam (D) → `geo_id='5110'`, `external_id=-5102010`
- VA-11: Gerry Connolly / James Walkinshaw (D) → `geo_id='5111'`, `external_id=-5102011` *(verify current holder)*

**Researcher MUST verify full names, party, and incumbency for all 11 reps before writing SQL.** ROADMAP.md provides last names only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §VA-FED — VA-FED-01 and VA-FED-02 requirements
- `.planning/ROADMAP.md` §Phase 102 — Goal, key facts, success criteria

### Pattern Reference Migrations
- `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` — MD federal pattern (senators pre-seeded, 8 House reps CTE + NOT EXISTS guards); **closest match to VA-102**
- `C:/EV-Accounts/backend/migrations/224_or_federal_officials.sql` — OR federal pattern (senators updated external_ids, 6 House reps)

### DB State Facts (pre-confirmed, no research needed)
- Warner: `external_id=-400080`, `id=85d27350-e1b6-45b8-aee3-509ca88c5af4`, office linked to NATIONAL_UPPER `3d62922f`
- Kaine: `external_id=-400079`, `id=8cffe7a0-b56c-42fe-adbf-f57d63589973`, office linked to NATIONAL_UPPER `3d62922f`
- VA NATIONAL_UPPER: `id=3d62922f-3c42-4bef-9c69-9b6dc13741db`, `geo_id='51'`, `state='VA'`
- US Senate chamber: `7cbe07bc-84b8-433b-952b-540e7de18a92`
- US House chamber: `c2facc31-7b13-428c-b7b9-32d0d3b95f76`

### Prior Phase Verification
- `.planning/phases/101-va-state-government-db/101-VERIFICATION.md` — VA government UUID (`bf1095e6`), external_id ranges for execs/senators/delegates

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` — Copy the CTE + NOT EXISTS guard structure for House rep blocks; adapt geo_ids from `24xx` → `51xx`

### Established Patterns
- **CTE pattern**: `WITH ins_p AS (INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id) INSERT INTO essentials.offices ... FROM essentials.districts d CROSS JOIN ins_p p WHERE d.geo_id = '...' AND d.district_type = 'NATIONAL_LOWER' AND d.state = 'VA' AND p.id IS NOT NULL AND NOT EXISTS (...)`
- **Pre-flight assertions**: DO $$ ... RAISE EXCEPTION blocks verify district counts and senator existence before any INSERTs
- **office_id backfill**: `UPDATE essentials.politicians SET office_id = o.id FROM essentials.offices o WHERE o.politician_id = essentials.politicians.id AND essentials.politicians.external_id BETWEEN -5102011 AND -5102001 AND essentials.politicians.office_id IS NULL`
- **state casing**: `state='VA'` (uppercase) for all NATIONAL tiers — confirmed in production DB

### Integration Points
- All 11 NATIONAL_LOWER districts pre-exist from Phase 100 TIGER load — no district INSERTs
- VA government `bf1095e6` and federal chambers are shared across all states — no new chambers

</code_context>

<specifics>
## Specific Ideas

- Alexandria is in VA-8 (Don Beyer) — success criterion: Alexandria address returns Beyer
- Warner up for re-election Nov 2026; Kaine term ends 2030 — no impact on seeding
- VA-5 and VA-9 had special elections in 2025/2026; researcher must verify current holders

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 102-VA Federal Officials*
*Context gathered: 2026-06-08*
