# Phase 84: Multnomah Smaller Cities - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 84-multnomah-smaller-cities
**Areas discussed:** Plan wave structure, Mayor role handling, Headshot effort for tiny cities

---

## Plan Wave Structure

### Question 1: How should we split Phase 84 into plans?

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans: governments + headshots | Plan 1 seeds all 5 city governments, chambers, districts, officials in one migration. Plan 2 handles headshots. Same as Phase 83 pattern. | ✓ |
| 3 plans: Gresham alone, 4 smaller cities, headshots | Gresham complexity handled separately. More granular rollback. | |
| 6 plans: one per city + headshots | Maximum granularity. Overkill for similarly-structured cities. | |

**User's choice:** 2 plans: governments + headshots (Recommended)
**Notes:** No elaboration — agreed with recommendation.

---

### Question 2: Within Plan 1, how should migrations be structured?

| Option | Description | Selected |
|--------|-------------|----------|
| One migration for all 5 cities | Single migration 246 covers all 5 governments, chambers, districts, officials. One BEGIN/COMMIT. | ✓ |
| One migration per city (5 migrations) | Migrations 246–250 applied separately. More granular but adds tracking complexity. | |

**User's choice:** One migration for all 5 cities (Recommended)
**Notes:** No elaboration.

---

### Question 3: How should the routing smoke test be scoped?

| Option | Description | Selected |
|--------|-------------|----------|
| One smoke test, one address per city | Single smoke-multnomah-cities.ts with 5 test addresses. Verifies G4110 match + LOCAL officials returned. | ✓ |
| One smoke test, Gresham + one representative smaller city | Lighter coverage — misses some cities. | |
| Separate smoke test per city | 5 smoke scripts. Too granular. | |

**User's choice:** One smoke test, one address per city (Recommended)
**Notes:** No elaboration.

---

## Mayor Role Handling

### Question 1: How should the Mayor be seeded for each of the 5 cities?

| Option | Description | Selected |
|--------|-------------|----------|
| Mayor as LOCAL_EXEC, separate from council | Matches Portland's pattern. Mayor in own district_type=LOCAL_EXEC. Council in City Council chamber LOCAL_LEG. | ✓ |
| Mayor folded into City Council chamber | Mayor listed alongside councilors. Simpler but loses distinction. | |
| Researcher decides per city | Let researcher look up each city's charter. Risk: inconsistent. | |

**User's choice:** Mayor as LOCAL_EXEC, separate from council (Recommended)
**Notes:** No elaboration.

---

### Question 2: For Gresham's 6 ward-elected councilors, how should districts be seeded?

| Option | Description | Selected |
|--------|-------------|----------|
| At-large: one LOCAL district per city | All councilors link to G4110 geo_id. No custom ward geofences needed. | |
| Ward-based: custom geofences per ward (like Portland) | 6 custom district rows, custom polygon loading. Enables per-ward routing. | ✓ (evolved from discussion) |

**User's choice:** Initially leaning ward-based but asked follow-up
**Notes:** User said: "I recognize it's a lot more work, but why not build it right the first time? I find it more likely that we won't return to do this work, and that feels like a worse experience for local citizens in rural areas. That said, those communities are less dense, population wise." — This prompted a follow-up question.

---

### Question 3: For Gresham's ward system specifically, what should the researcher target?

| Option | Description | Selected |
|--------|-------------|----------|
| Research ward boundaries and load them in Phase 84 | Researcher finds Gresham GIS data, loads 6 custom polygon geofences (X0013–X0018), creates 6 LOCAL district rows in Phase 84. | ✓ |
| At-large for Phase 84, named follow-up phase | At-large now, Phase 84.5/90.x for Gresham wards later. | |
| At-large for all 5 cities — accept limitation | Ship at-large. Less accurate but simpler. | |

**User's choice:** Research ward boundaries and load them in Phase 84 (Recommended)
**Notes:** User's earlier reasoning confirmed: prefer doing it right the first time; unlikely to return for Gresham ward refinement.

---

## Headshot Effort for Tiny Cities

### Question 1: How aggressive should headshot sourcing be for small cities?

| Option | Description | Selected |
|--------|-------------|----------|
| City official site only, then accept unavailability | Check each city's official website. If no photo, mark unavailable. No LinkedIn/news/social. | ✓ |
| City site + local news / city social media | Broader search. More coverage, slower, less consistent quality. | |
| Researcher decides per city | Discretion per city. Risk: inconsistent depth. | |

**User's choice:** City official site only, then accept unavailability (Recommended)
**Notes:** No elaboration.

---

### Question 2: How should unavailable headshots be documented?

| Option | Description | Selected |
|--------|-------------|----------|
| Document every official: source URL or 'unavailable' | Every official has a commented row in migration 247: source URL or 'No photo found on official city website.' | ✓ |
| Only document officials where a photo was found | Skip documentation for unavailables. Simpler but leaves audit gaps. | |

**User's choice:** Document every official: source URL or 'unavailable' (Recommended)
**Notes:** No elaboration.

---

## Claude's Discretion

- **External ID scheme for Phase 84 officials** — User did not specify. CONTEXT.md notes suggested approach (derive from city geo_id prefix) and flags for researcher/planner to confirm.
- **Smoke test test addresses** — Researcher will find real coordinates for each city. Not discussed.

## Deferred Ideas

- **Per-ward sub-routing for Troutdale/Fairview/Wood Village/Maywood Park** — At-large for Phase 84; deferred to future phase if any of these cities adopt ward systems.
- **Compass stances for smaller city officials** — Noted as OR-CITIES-01 in backlog; not Phase 84 scope.
- **Maywood Park contact data gaps** — Expected due to very small city size; documented as acceptable.
