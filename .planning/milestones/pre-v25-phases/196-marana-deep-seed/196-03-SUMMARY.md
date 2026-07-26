---
phase: 196-marana-deep-seed
plan: 03
status: complete
completed: 2026-07-16
requirements: [SUB-02]
migrations: [1347, 1348, 1349, 1350, 1351, 1352, 1353]
commit: 5e826a01
---

# Plan 196-03 Summary — Marana evidence-only compass stances

**Outcome:** 21 evidence-only compass stances seeded across the 7 Town of Marana officials against the
36 non-judicial live topics — **100% cited** (every `politician_answers` row has a matching
`politician_context` row with a non-empty real-URL `sources` array), **0 judicial rows**, **0
neutral-default rows** (honest blanks throughout), all values discrete chairs in [1.0, 5.0]. Applied to
production; 7 audit migrations `1347–1353` left unregistered. Aggregate integrity assertion = `t`.

## Per-official completion order (save-point trail) + counts

Researched + authored + applied ONE OFFICIAL AT A TIME (quota rule), 1347→1353 in sequence:

| # | ext_id | official | file | stances | notable |
|---|--------|----------|------|---------|---------|
| 1 | -4013001 | Jon Post (Mayor) | 1347 | 6 | data-centers 4, growth 4, econ-dev 4, taxes 3, local-immigration 3, transportation 4 |
| 2 | -4013002 | Roxanne Ziegler (VM) | 1348 | 3 | data-centers 3, growth 4, local-immigration 4 |
| 3 | -4013003 | Patrick Cavanaugh | 1349 | 2 | data-centers 4, growth 2 (dissented on Linda Vista annexation) |
| 4 | -4013004 | Patti Comerford | 1350 | 2 | growth 3, data-centers 3 |
| 5 | -4013005 | Herb Kai | 1351 | 4 | growth 3, econ-dev 3, taxes 3, public-safety 4 — **data-centers blank (recused)** |
| 6 | -4013006 | Teri Murphy | 1352 | 2 | data-centers 4, growth 4 |
| 7 | -4013007 | John Officer | 1353 | 2 | data-centers 4, growth 3 |

## Method
Each official researched by a dedicated web-capable agent (one at a time — no parallel fan-out per the
quota rule), authored the SQL, then the orchestrator applied + asserted that file before the next. The
dominant Marana 2026 issues — the ~600–661-acre Beale Infrastructure / "Project Blue" hyperscale **data
center** (Jan 6 2026 rezoning, 6-0 with **Kai recused**), the **Aug 6 2025 Linda Vista 52 annexation**
(4-2; Cavanaugh + Comerford the two no-votes; Post recused), **growth pace**, and the proposed **ICE
detention facility** — drove most attributable positions.

## Honest blanks (deliberate, evidence-bounded)
- **local-immigration** was blanked for most council members: the compass axis measures local
  police/ICE-detainer cooperation, whereas the Marana debate was about whether a *private federal-contract
  facility* may operate. Only Post (3) and Ziegler (4) had statements that mapped to the axis without
  forcing; the rest were honestly left blank rather than mis-mapped.
- **Kai data-centers**: blanked — he recused from the vote (family owns a related parcel); a recusal is
  not a stance, and he made no separate substantive statement.
- All ~20 federal/state topics (abortion, healthcare, tariffs, ukraine, etc.): a town councilmember has
  no attributable record → blank across the board.
- Two officials (Kai, Officer) declined 2026 press interviews / forums, so their stances rest on their
  own on-record votes + campaign-platform statements only.

## Sources (all non-WAF, fetched live)
azpm.org / news.azpm.org, azluminaria.org, tucson.com, tucsonlocalmedia.com, kgun9.com,
tucsonsentinel.com, tucsonspotlight.org, tucsonagenda.com, azfamily.com, ballotpedia.org, and the
candidates' own campaign sites (herbkai.com, officer4marana.com). NO maranaaz.gov agenda/minutes URL was
cited (Akamai-WAF-blocked — unfetchable, so uncitable).

## Verification (all green)
- Aggregate boolean assertion = `t`: 0 answer rows without a context row; 0 context rows with NULL/empty
  sources; 0 judicial-* rows for the 7 officials; all values in [1.0, 5.0].
- Per-file grep gate passed for all 7 (both tables present, no judicial INSERT, no ledger line).

## Next
Plan 04 (Wave 3): banner + coverage chip. `hasContext:true` for Marana is now honest (≥1 stance row
exists — 21 in fact).
