# Phase 3: Unopposed and Empty Race UX - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Every race in the Elections page renders with appropriate visual treatment based on candidate count — contested (2+ candidates), unopposed (exactly 1), or empty (0). Nothing is hidden or filtered. This phase adds the badge, notice, and differentiation logic to the existing ElectionsView component.

</domain>

<decisions>
## Implementation Decisions

### Unopposed badge
- Pill badge inline after the race name — "U.S. Senate [Running Unopposed]" style
- Neutral gray tone — factual, no editorial weight, not colored
- Exact label text: "Running Unopposed"
- Unopposed candidate card is identical to contested race cards — the badge does the signaling, no card variation needed

### Empty race notice
- Coral-tinted notice box using the Empower pillar brand color (researcher to pull exact token from `empoweredvote.github.io/ev-ui`)
- Primary line: "No candidates have filed"
- Secondary line: static civic framing (e.g. "This seat is currently uncontested") — no dynamic data required, no CTA
- Race section header stays identical to contested/unopposed headers — the coral notice inside the section does the signaling

### Visual differentiation (section separation)
- Alternating light background tints between race sections within an election group (zebra-stripe style)
- Pattern resets per election — races within Indiana Primary alternate among themselves, races within LA Primary alternate separately
- Section structure (borders, spacing, header weight) is identical across all race types — differentiation happens only through the badge and coral notice

### Race ordering
- Sort: Local → State → Federal (small to big geographically)
- Within each geographic level: Executive → Legislative → Judicial
- Sort lives on the frontend in ElectionsView — backend returns races in any order, frontend applies the sort before render
- Researcher to identify what field(s) on the race object indicate government level and branch (or determine what needs to be added)
- Race type (contested/unopposed/empty) plays no role in ordering — branch + level is the only sort key

### Claude's Discretion
- Exact spacing and typography for the badge pill
- Specific background tint values for the alternating sections (within the existing design system)
- Static secondary text for the empty race notice (must fit the Empower pillar tone)

</decisions>

<specifics>
## Specific Ideas

- Empty race framing: "an empty race is an opening, not a gap" — the coral Empower tint reflects this intentionally
- "I want there to be a 'Governor Section' that explains the role briefly and lists each candidate so I can compare my options easily" — role descriptions are deferred (new content requirement), but the section structure and alternating tints support the comparison-friendly layout intent
- Race ordering philosophy: "small to big" — local races (most proximate to daily life) surface first; federal races (Trump/Vance) come last

</specifics>

<deferred>
## Deferred Ideas

- Brief role descriptions per race section (e.g., "what does a Governor do?") — new content/data requirement, own phase or addition to a future content phase
- Any reordering of races by electoral competitiveness or voter relevance score — out of scope for this phase

</deferred>

---

*Phase: 03-unopposed-and-empty-race-ux*
*Context gathered: 2026-04-13*
