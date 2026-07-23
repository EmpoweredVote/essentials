# Phase 206 Context — AZ 2026 Candidate Reconcile

**Source:** Operator directive during v22.0 close (2026-07-23). Captured in lieu of a full discuss-phase; all decisions below are operator-stated or established project patterns.

## Domain

The AZ 2026 primary certified on 2026-07-21. Phase 199 seeded **82 AZ race shells** (all for the Nov 3, 2026 general election); **73 are still empty** (no `race_candidates` rows). This phase updates those races to reflect the **current post-primary reality** — i.e., seeds the certified general-election nominees onto the shells.

Empty-shell breakdown (verified in production 2026-07-23):
- **State Senate** — 30 (LD 1–30)
- **State House** — 30 (LD 1–30)
- **State Executive** — 7 (Governor, Secretary of State, Attorney General, Treasurer, Superintendent of Public Instruction, State Mine Inspector, Corporation Commission)
- **Local council** — 4 (Marana, Oro Valley, Sahuarita, South Tucson)
- **Local exec** — 2 (Marana Mayor, Oro Valley Mayor)

## Locked Decisions

- **Roster-only — NO stances.** The operator explicitly does NOT want compass stance research in this phase. Seed candidate identity + party + race linkage only. (Contrast: normal deep-seed phases do stances; this reconcile does not.)
- **Only certified general-election nominees.** Do not seed primary losers or withdrawn candidates. The goal is "where the races currently are" — the actual Nov-2026 ballot. Primary-dropouts must be excluded (and if any already-seeded candidate lost/withdrew, it should be corrected).
- **Authoritative source = Arizona Secretary of State** official 2026 general-election candidate list; cross-check against Ballotpedia / AZ Clean Elections. Never seed from a single unofficial source.
- **Idempotent seeding.** `essentials` tables have NO unique constraints on natural keys (see project memory) — use `WHERE NOT EXISTS` insert patterns, never `ON CONFLICT`. Re-running must produce zero net-new rows.
- **Reuse existing politician records** for incumbents/known people (match by name + office); create new `politicians` rows only for genuinely new candidates.
- **Local 6 races (Marana/Oro Valley/Sahuarita/South Tucson) fold in the owed 197/198 reconcile** — re-verify council membership + titles (Mayor/Vice-Mayor) against the certified ballot while seeding these races.
- **Headshots optional/deferred** — not required for this roster reconcile; a name+party+race row is the deliverable. (Headshots can be a later pass.)
- **Uncontested / write-in-only races:** seed the single certified candidate; if a shell has no certified general candidate, leave it empty and record why (do not fabricate).

## Success Criteria (what must be TRUE)

1. Each of the 73 empty AZ 2026 race shells either has its certified general-election nominee(s) seeded, or is explicitly documented as legitimately empty (no certified candidate).
2. No primary-loser or withdrawn candidate appears on any 2026 AZ race.
3. Seeding is idempotent (proven by a net-zero-new re-run) and writes only to production `essentials.politicians` / `essentials.race_candidates` (+ reused existing rows).
4. The 6 local races double as the 197/198 title/membership reconcile — Marana/Oro Valley/Sahuarita/South Tucson council + mayor rows match the certified ballot.
5. No compass stances are created in this phase.

## Out of Scope

- Compass stance research (explicit operator exclusion).
- Headshot sourcing (deferrable follow-up).
- Any non-AZ races.
