# Phase 168: NV 2026 Candidate Population — Statewide & US House - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 168-nv-2026-candidate-population-statewide-us-house
**Areas discussed:** Field breadth, Politician linking, Challenger headshots, Uncertain-field handling

---

## Field breadth

| Option | Description | Selected |
|--------|-------------|----------|
| All certified general candidates | Every confirmed Nov-3 candidate per race — majors + certified independents/minor/nonpartisan; matches 1072 | ✓ |
| Major-party nominees only | Just the D + R nominees per race; omits certified independents/third-party | |

**User's choice:** All certified general candidates
**Notes:** Aligns with the 1072 analog (MD Gov seeded D + R + independent) and the nonpartisan ethos of showing the full real ballot.

---

## Politician linking

| Option | Description | Selected |
|--------|-------------|----------|
| Link any with an existing record | Set politician_id for any candidate already in the DB (incl. cross-office, e.g. Conine); challengers NULL; maximizes photo coverage | ✓ |
| Only sitting incumbents of that office | Link only the seat's current holder; misses cross-office records | |
| All full_name-only | No politician_id links; everyone shows initials until headshots added | |

**User's choice:** Link any with an existing record
**Notes:** Existing politician records carry headshots (Phases 159–160); the card reads COALESCE(rc.photo_url, pi.url) so linking surfaces photos immediately.

---

## Challenger headshots

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to a follow-up | Ship rows now; challengers show initials; headshots later (Claude's recommendation) | |
| Fetch now for all challengers | Run find-headshots for every new challenger this phase | ✓ |
| Opportunistic only | Only trivially-available photos; uneven coverage | |

**User's choice:** Fetch now for all challengers (overrode the defer recommendation)
**Notes:** Headshot work is in-scope this phase; honest-skip where no usable official/Ballotpedia photo exists (CA/TX/NY pattern); must follow project headshot rules (600×750 4:5, crop-not-stretch, eyes ⅓ from top, no superimposed graphics).

---

## Uncertain-field handling

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmed-only, hold back uncertain | Seed only verified/certified Nov-3 nominees; hold back late/uncertified; matches 1072 + evidence-only | ✓ |
| Include likely-but-unconfirmed, flagged | Also seed probable candidates noted as tentative; risks seeding non-ballot names | |

**User's choice:** Confirmed-only, hold back uncertain
**Notes:** June 9 primary concluded so nominees are known; residual uncertainty is late independents / certification timing — held back and noted in migration comments.

---

## Claude's Discretion

- One migration vs. statewide/US-House split — planner's call (idempotent either way); find-headshots likely its own plan/wave.
- first_name/last_name split + external_id/source string formatting — follow 1072 shapes.

## Deferred Ideas

- Legislative candidate population (11 Senate + 42 Assembly races) — explicit follow-up phase.
- Candidate compass stances — downstream of population.
- candidate_staging → race_candidates bulk-promotion tooling — not built here; this phase curates manually.
