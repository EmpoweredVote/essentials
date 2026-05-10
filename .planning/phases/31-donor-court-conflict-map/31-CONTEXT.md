# Phase 31: Donor-Court Conflict Map - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Identify top-15% legal professional donors for each LA legal candidate, cross-reference those donors against LA Superior Court appearance records, compute conflicts (donated + appeared before the judge), and surface the result on legal candidate profile pages. The Transparent Motivations section already shows all donors — this phase specifically highlights the intersection of top donors who also appeared in court before the judge candidate.

</domain>

<decisions>
## Implementation Decisions

### Conflict Definition
- **For judge candidates:** Conflict = top-15% legal professional donor AND appeared before this judge in LA Superior Court in the past 5 years (2021–present)
- **No temporal ordering required:** Any appearance in the 5-year window counts, regardless of whether it preceded or followed the donation
- **Recusal clears the conflict flag:** If a recusal record is found for a case where a donor firm appeared, do NOT flag it as a conflict — store as "donor appeared, recusal on record" instead
- **For City Attorney candidates (Ashouri, McKinney, Roy):** Conflict framing does not apply (they don't preside). Show "donor law firms active in LA courts" — transparency about who's funding them, not a conflict claim. Do not use the word "conflict" for City Attorney display.

### Law Firm Identification
- **Occupation-first rule:** If `con_occp` identifies someone as a legal professional (attorney, lawyer, partner, counsel, esquire, etc.), they are included — regardless of `con_emp`
- **Solo attorneys are included:** Not just named firms; individual attorneys are cross-referenced by their own name in court records
- **Non-law employers included:** If `con_occp` is legal, the donor counts even if their employer is not a law firm (e.g., in-house counsel at a corporation)
- **Fuzzy name matching:** Script uses fuzzy matching (e.g., Levenshtein distance) to normalize firm name variants (e.g., "Morrison Foerster" vs "Morrison & Foerster LLP"); uncertain matches flagged for human review
- **Top 15% = by total dollar amount:** Sort all legal professional donors by total contribution amount; take those collectively making up the top 15% of total raised for that candidate

### Court Research Scope
- **LA Superior Court only (lacourt.org):** Primary and sole court checked — this is where the ballot judges actually preside; federal CourtListener is out of scope for this phase
- **Search strategy:** Search by firm/employer name (con_emp) first; if no results, fall back to searching by individual attorney name (con_name or similar)
- **5-year window:** Appearances from 2021–present only
- **Cap at 10 records per firm per candidate:** Store up to 10 most recent appearance records; document count of total found even if capped
- **Recusal research:** Attempt to identify recusal records when a conflict is found; recusal clears the conflict flag

### Frontend Display
- **Placement:** After Bar Evaluation section, before Campaign Finance section on legal candidate profile pages
- **Per-firm data shown:** Firm name, total donated, number of appearances before this judge, case type (criminal/civil/family/etc.), source link to court record
- **Visual treatment:** Amber/yellow highlight on individual firm rows where a court conflict is found; neutral styling otherwise
- **"No conflicts" state:** Honest disclaimer — "No top donors were found in court records for this candidate." — factual, acknowledges data limits without over-claiming
- **City Attorney display:** Show "law firm donors active in LA courts" framing (no conflict label); same data fields minus the conflict highlight

### Claude's Discretion
- Exact fuzzy matching algorithm and threshold for firm name normalization
- Schema design for storing conflict records (new table vs. extending existing tables)
- How to handle lacourt.org search rate limits or access restrictions
- Whether to include a brief methodology note in the UI explaining what "top 15%" means

</decisions>

<specifics>
## Specific Ideas

- The Transparent Motivations section already shows all donors — this section is specifically the *intersection* (top donors who also appeared in court). The framing should make clear this is about that overlap, not a duplicate of the existing donor list.
- Recusal is the judge handling conflicts correctly — it should clear the flag, not create one. The display should reflect this: "Donor appeared, recusal filed" is a neutral or positive signal.
- City Attorney candidates and judges get different display language: "conflict" only applies to judges. City Attorney section shows law firm donor activity without claiming a conflict of interest.

</specifics>

<deferred>
## Deferred Ideas

- CourtListener/RECAP federal court cross-reference — could be a future phase extension
- Recusal record research for all historical cases (not just cases involving top donors)
- Expanding this conflict map pattern to other states/jurisdictions

</deferred>

---

*Phase: 31-donor-court-conflict-map*
*Context gathered: 2026-05-09*
