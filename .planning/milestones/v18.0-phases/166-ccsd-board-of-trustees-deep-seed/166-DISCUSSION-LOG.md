# Phase 166: CCSD Board of Trustees Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 166-ccsd-board-of-trustees-deep-seed
**Areas discussed:** Roster scope, Routing precision, Stance emphasis, Headshots & modeling

---

## Roster scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 11 (7 elected + 4 appointed) | Full governing board; appointed labeled by appointing jurisdiction. Matches ccsd.net. | ✓ |
| 7 elected only (Districts A–G) | Strictly elected trustees; appointed deferred. | |
| All 11 but appointed marked non-voting-context | Seed 11 with explicit appointed-status note + 2027 officer-voting change. | |

**User's choice:** All 11 (7 elected + 4 appointed)
**Notes:** Confirmed via web search that CCSD's board = 7 elected (Districts A–G) + 4 appointed under NV AB175/2023 (appointed by Clark County, LV, Henderson, NLV; full board rights, officer-voting from 2027 per SB460). Appointed trustees labeled by appointing jurisdiction; appointed-vs-elected distinction kept transparent in the office title (folded the third option's transparency intent into D-01a). Wave-0 verifies live composition.

---

## Routing precision

| Option | Description | Selected |
|--------|-------------|----------|
| Single G5420 district (all 11 shown) | Load CCSD TIGER UNSD boundary; all 11 attach; matches every existing school district. | ✓ |
| Per-trustee sub-district routing (A–G) | Source 7 trustee-district polygons + custom MTFCC; ward-precise. | |
| Hybrid: G5420 now, sub-districts later | Ship single-G5420, defer per-trustee routing. | |

**User's choice:** Single G5420 district (all 11 shown)
**Notes:** DB scout confirmed every existing school district (SF/SD/Portland/Boston/Berkeley) routes via one G5420 boundary; and NV has no G5420 loaded yet, so the boundary must be loaded this phase. Per-trustee routing deferred (the 4 appointed have no sub-district anyway).

---

## Stance emphasis

| Option | Description | Selected |
|--------|-------------|----------|
| School safety / SROs (public-safety-approach) | CCSD's own PD; SRO debate — richest CCSD vein. | ✓ |
| School choice & vouchers (school-vouchers) | Charters, ESAs, open enrollment. | ✓ |
| Curriculum / book / DEI (civil-rights + religious-freedom + trans-athletes) | Book-review, DEI, transgender-student/athletics policy. | ✓ |
| School funding & growth (taxes, childcare, growth/zoning, local-immigration) | Bonds, pre-K, school siting/rezoning, ICE-on-campus. | ✓ |

**User's choice:** All four clusters emphasized
**Notes:** Standing rule still applies — sweep ALL 45 live topics per trustee, one-at-a-time, evidence-only. Most live topics are state/federal-scope → expect more honest blanks than a city council, which is correct. Lead with the education cluster above.

---

## Headshots & modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Use official CCSD naming + carry forward | "Clark County School District, Nevada, US" + "Board of School Trustees"; ccsd.net→BoardDocs headshots; -3209xxx; mig ~1107. | ✓ |
| Use generic 'Board of Education' naming | Match peer school-district chambers for consistency. | |
| Let me adjust something | — | |

**User's choice:** Use official CCSD naming + carry forward
**Notes:** Official body name "Board of School Trustees" chosen over generic "Board of Education." Headshot WAF behavior + external_id collision + CCSD GEOID + on-disk migration MAX all Wave-0-verified.

## Claude's Discretion

- Exact office-row structure under the single G5420 SCHOOL district (recommend 1 shared district + 11 offices).
- Whether to surface board-officer roles (President/VP/Clerk) as title annotations.
- Exact external_id assignment within the −3209xxx block.
- Exact trustee label display strings.
- Migration numbering (~1107, Wave-0 confirms on-disk MAX).

## Deferred Ideas

- Per-trustee sub-district (A–G) geofence routing — future precision phase.
- Education-native compass topics (teacher pay, curriculum standards, school-safety spoke) — compass-design concern.
- CCSD Superintendent + non-elected/administrative offices.
- Other NV school districts (Washoe, rural) — future NV waves.
