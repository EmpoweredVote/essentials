# Phase 160: Nevada Legislature (seed + headshots) - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the full Nevada State Legislature so any NV address returns its correct **State Senator** (21, SLDU) and **Assemblymember** (42, SLDL), each with a 600×750 headshot. **Greenfield**: phase 158 loaded the SLDU/SLDL geofence districts (state='nv' lowercase, geo_id 32001–32042 for Assembly + the 21 senate districts), but **0 legislators are seated and the NV Senate/Assembly chambers do not exist yet**. This phase creates: 2 chambers under State of Nevada, 63 politicians, 63 offices (linked to existing SLDU/SLDL districts), office_id back-fills, and 63 headshots.

**Explicitly OUT of scope:** compass stances for legislators (SC#4 — deferred to a follow-up milestone; must be verified ABSENT at phase close). No new geofences (158 owns those). No 2026 election rows (phase 167).
</domain>

<decisions>
## Implementation Decisions

### Headshot sourcing
- **D-01:** Primary source is the **official Nevada Legislature site** (`leg.state.nv.us` member pages — government work). Process with **crop-to-4:5 then resize 600×750 Lanczos q90** (official portraits are not guaranteed 4:5, so crop-first like the Controller in 159, NOT resize-only).
- **D-02:** Fallback order when the official photo is missing/unusable: **Wikipedia/Wikimedia Commons → Open States (openstates.org)**. Record the chosen source + license per member (e.g., `us_government_work`/`public_domain`/`cc_by_sa_*`).
- **D-03:** **No fabricated photos (SC#3).** Any legislator with no findable authoritative portrait is left without a headshot and **documented as a genuine gap** in the SUMMARY; the seed/office row is still created.

### Titles & wording
- **D-04:** Voter-facing titles are **"State Senator"** and **"Assemblymember"** (Nevada's official gender-neutral term, one word).
- **D-05 (Claude's discretion):** Seed **uniform base titles** for all members. Add leadership (e.g., Senate Majority Leader, Speaker of the Assembly) into the title **only if it is trivially available** during roster research; otherwise leadership is deferred to a later polish — do not block the seed on it.

### Roster currency
- **D-06:** Seed the **current sitting membership as of June 2026** (post-2025 regular session, including any mid-term appointments/replacements). 
- **D-07:** Any genuinely **vacant seat** is seeded as the district/office with **`is_vacant=true` and no invented person** — never fabricate a member to fill a seat.

### Claude's Discretion (structural — follow established analogs, no user input needed)
- Chamber modeling: 2 chambers ("Senate" + "Assembly", with formal names) under State of Nevada (`geo_id='32'`), mirroring the TX/OR/VA legislature-seed analogs. `slug` is GENERATED ALWAYS — never in the INSERT column list.
- **external_id scheme:** pick a distinct NV-legislator range that does NOT collide with existing NV ids (House -32001..-32004; STATE_EXEC -3200001..-3200006). Propose e.g. senate -3203xxx / assembly -3204xxx; confirm free during research.
- Office linkage: link offices to the **existing** SLDU/SLDL district rows (state='nv' lowercase — STATE_UPPER/STATE_LOWER use TIGER lowercase, unlike the uppercase STATE_EXEC/NATIONAL tiers in 159). Do NOT create new districts.
- Migration sequencing: structural seed migration(s) starting at **1053** (registered); headshot rows as audit-only (unregistered), per the 159 pattern. Idempotent (WHERE NOT EXISTS / ON CONFLICT external_id DO NOTHING).
- Headshot scripts are gitignored `backend/scripts/_tmp-*` helpers run inline by the orchestrator (gsd-executor has no Supabase MCP — DB applies + Storage uploads + audits are inline-orchestrator steps, same split as phase 159).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & scope
- `.planning/REQUIREMENTS.md` — NV-LEG-01 (21 senators + SLDU + headshots), NV-LEG-02 (42 assembly + SLDL + headshots); stances deferred.
- `.planning/ROADMAP.md` §"Phase 160" — goal + 4 success criteria.

### Reusable analogs (EV-Accounts repo — separate from this repo)
- `C:/EV-Accounts/backend/migrations/108_tx_state_legislature_chambers.sql`, `109_tx_state_senate_officials.sql`, `110_tx_state_house_officials.sql` — chamber + two-house officials seed pattern.
- `C:/EV-Accounts/backend/migrations/318_va_state_senators.sql`, `319_va_delegates.sql` — recent two-house seed; `227_or_state_house.sql` + `228_or_legislature_headshots.sql` — house + legislature headshot-migration pattern.
- `C:/EV-Accounts/backend/scripts/_tmp-va-delegates-headshots.py` — delegate headshot pipeline analog (crop-to-4:5 + Storage upload).

### Phase 159 playbook (same executor/orchestrator split, casing rules, migration ledger)
- `.planning/phases/159-nevada-state-federal-government/159-PATTERNS.md` — STATE_EXEC vs STATE_UPPER/LOWER **casing rule** (legislature districts use lowercase `state='nv'`), idempotency patterns, structural-registration block, politician_images column shape (no photo_origin_url).
- `.planning/phases/159-nevada-state-federal-government/159-01-SUMMARY.md` — Wikimedia descriptive-User-Agent gotcha (429), gitignored `_tmp-*` script policy, migration counter (next = 1053).
- `.planning/phases/158-nevada-geofences/` — SLDU/SLDL geofence load (district rows offices will link to).

</canonical_refs>

<specifics>
## Specific Ideas
- Statewide browse verification link: `essentials.empowered.vote/results?browse_state_officials=NV` (state officials list) + per-district address tests for SLDU/SLDL routing (legislators are address-routed like House reps, not in the statewide list — verify by address).
- Headshot pipeline must use the Wikimedia-compliant descriptive User-Agent if any Wikimedia source is hit (generic browser UA → HTTP 429, learned in 159).
- Section-split check (159-PATTERNS "Section-Split Verification SQL", adapted to STATE_UPPER/STATE_LOWER) must return 0 rows at phase close.
</specifics>

<deferred>
## Deferred Ideas
- **Compass stances for all 63 legislators** — explicitly deferred to a follow-up milestone (per milestone scope + SC#4). Evidence-only, one-at-a-time when it happens.
- **Leadership role modeling** — only if not trivially available during this seed (D-05).
- **2026 election rows** for legislative seats — phase 167 (NV-ELEC-01).
</deferred>

---

*Phase: 160-nevada-legislature-seed-headshots*
*Context gathered: 2026-06-23 via discuss-phase*
