# Phase 28: Judicial Compass Frontend + Communities - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Render judicial compass topics on legal candidate profile pages in the essentials frontend, with distinct burnt orange visual treatment that signals a different evaluation framework. Seed 8 companion Focused Communities for the new judicial topics and populate fc_community_slug on each inform.compass_topics row.

Non-judicial profiles must never see judicial topics. Within judicial profiles, judges see 6 topics (4 universal + 2 judge-specific) and City Attorney/DA candidates see 6 topics (4 universal + 2 DA-specific).

Creating the compass widget itself, authoring stance data, or building bar evaluation sections are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Sub-role detection
- Frontend detects judicial sub-role via office title string matching:
  - `'Judge'` (substring) → judge sub-role
  - `'City Attorney'` OR `'District Attorney'` (substring) → city_attorney_da sub-role
- Fallback when sub-role cannot be determined: show only the applicable topics that can be identified (universals at minimum — never hide everything)
- This approach is intentionally conservative for Phase 28. A `judicial_role` column on `essentials.offices` is the planned durable solution and will come in a later phase as the judicial candidate list grows

### Compass architecture
- Use existing Empowered Compass tech and component patterns — do not rebuild
- 8 judicial topics in DB → 6-topic compass per candidate (4 universal + 2 sub-role-specific)

### Empty state (compass with no politician_answers)
- Render topic cards with empty notches — same as any candidate with no researched stances
- No special empty-state treatment needed; Phase 30 follows immediately and will populate stance data

### Visual treatment — Judicial Evaluation section
- **Section label:** "Judicial Evaluation" as a header above the judicial compass topics
- **Icon:** Scale of justice in the section header
- **Burnt orange accent** applied across:
  - Card left border / accent line on each judicial topic card
  - "Judicial" tag/badge background on each card
  - Compass notch colors (warm palette — amber/gold through deep red, replacing standard blue/purple)
  - Section header text or underline
- **Compass notch color palette:** Warm tones across the 5 positions — amber/gold at one end, deep red at the other. Claude picks the specific hex values to be cohesive with burnt orange.
- Tag placement and section header layout: Claude's discretion to fit the existing design system

### Community descriptions
- **Tone:** Citizen evaluation framing — "How should voters evaluate judicial candidates on this dimension?"
- **Length:** Same as Phase 24 local topic descriptions
- **Slugs:** Shorter, readable slugs without 'judicial-' prefix where content is unambiguous:
  - `criminal-justice-philosophy`
  - `access-to-justice`
  - `government-deference`
  - `court-transparency`
  - `legal-interpretation`
  - `bail-and-pretrial`
  - `prosecution-priorities`
  - `police-accountability`
- Slugs must not collide with existing connect.communities rows

### Claude's Discretion
- Exact warm palette hex values for compass notches
- Tag/badge placement on judicial topic cards
- Section header layout (icon + label arrangement)
- Whether section header uses burnt orange text, underline, or background treatment

</decisions>

<specifics>
## Specific Ideas

- The judicial compass is a re-use of the existing Empowered Compass tech with a "judicial lens" — not a new UI component. The differentiation is visual (burnt orange, scale of justice icon) and content-scoped, not architectural.
- "8 questions → 6-spoke compass" is the mental model: 8 topics exist in the DB, each candidate sees 6 based on their sub-role.
- Burnt orange is the chosen judicial accent color — warm palette on notches to complement.
- The user flagged that office title matching is fragile (e.g., an attorney running for a judge seat could have an ambiguous title). This is accepted for Phase 28 with a plan to add a DB-backed judicial_role field on essentials.offices in a future phase.

</specifics>

<deferred>
## Deferred Ideas

- `judicial_role` column on `essentials.offices` for robust sub-role detection — future phase when more judicial candidates are added
- Additional ways to help voters understand and choose between judges beyond the compass (user raised: "how do you choose between them when you vote?") — broader judicial evaluation UX, future milestone
- The Phase 24 local community descriptions used advocacy/engagement framing; aligning tone across all compass communities (local + judicial) could be a future polish pass

</deferred>

---

*Phase: 28-judicial-compass-frontend-communities*
*Context gathered: 2026-05-06*
