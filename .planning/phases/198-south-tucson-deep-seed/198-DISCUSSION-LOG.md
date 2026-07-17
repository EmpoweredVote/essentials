# Phase 198: South Tucson Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 198-south-tucson-deep-seed
**Areas discussed:** Banner identity, Council seat model, Enclave routing, Headshot fallback

---

## Banner identity

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Source 2-3 licensed candidates (murals / South 4th Ave streetscape / welcome sign+Mercado) and present for review; murals front-runner | ✓ |
| Murals first | Prioritize a Chicano/community mural, streetscape backup | |
| South 4th Ave streetscape | Prioritize restaurant-district streetscape/signage | |

**User's choice:** You decide
**Notes:** Two hard collision constraints made explicit — banner must NOT read as a Catalina/mountain shot (Pima/Oro Valley/Marana) NOR as downtown Tucson (Tucson = Hotel Congress). South Tucson gets a cultural/urban identity; murals are the distinctive front-runner. Source one at a time per BANR-01.

---

## Council seat model

| Option | Description | Selected |
|--------|-------------|----------|
| Precedent default | Mayor LOCAL_EXEC + one shared LOCAL district, at-large nonpartisan; verify against cityofsouthtucson.org at plan time; by-ward fallback only if proven | ✓ |
| Known by-ward | Plan per-seat districts + ward geofences from the start | |

**User's choice:** Precedent default
**Notes:** Mirrors Oro Valley/Marana/Sahuarita. Researcher MUST verify form of government + seat count before planner locks it.

---

## Enclave routing

| Option | Description | Selected |
|--------|-------------|----------|
| Verify explicitly (blocking) | Confirm South Tucson TIGER place geo_id resolves distinctly + a known in-enclave address routes to South Tucson not Tucson, before seeding | ✓ |
| Standard check only | Confirm geo_id + post-seed section-split scan, no special in-enclave probe | |

**User's choice:** Verify explicitly (blocking)
**Notes:** South Tucson is wholly inside Tucson, so geofence-overlap / address-routing is a first-class blocking pre-seed check (in addition to the standard section-split scan).

---

## Headshot fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Standard order | Direct cityofsouthtucson.org → Playwright WAF fallback → Ballotpedia/Wikimedia; honest blank if none | ✓ |
| Ballotpedia-first | Skip straight to Ballotpedia/Wikimedia/news, official site last resort | |

**User's choice:** Standard order
**Notes:** Very small city — official site may lack usable portraits, so the Ballotpedia/Wikimedia fallback is more likely to be exercised than in prior phases, but the standard order still applies.

---

## Claude's Discretion

- Banner subject selection (per "you decide") — source and present candidates; Chicano/community mural is the front-runner but final choice is at review.
- Migration numbering (disk-authoritative), ext_id ranges, geofence source (Pima County GIS / TIGER place layer FIPS 04).
- Exact headshot fetch mechanics within the standard order.

## Deferred Ideas

None — discussion stayed within phase scope.
