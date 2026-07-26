# 222-CONFIRMED-BLANK — Collin County officeholders with a genuinely-searched, no-stance-found result

This register is created empty at the start of Phase 222 (2026-07-25) and is appended to by every
research plan (222-02 through 222-17) as each government's people are attempted. Every person listed
below (once appended) was **genuinely searched** across all 11 canonical compass topics and has **no
cited, on-topic evidence** for at least one of those topics. Blank is the correct terminal state for
those topics — it is a **SUCCESS outcome**, never a defaulted stance, and never a sign that the
research step was skipped (D-08, [[stance_no_default_value]]). A person may appear here with some
topics blank and other topics sourced (an applied migration row) — this register records the blanks,
not the whole person's status.

## Search method

Each attempted officeholder is searched against the D-05 acceptable source types before any topic is
recorded as blank:
- Candidate questionnaires from **Ballotpedia** and **VOTE411** (including the League of Women Voters
  of Collin County's VOTE411 ballot tool where applicable).
- **Public statements and news coverage** — Community Impact Newspaper, Star Local Media, DFW
  broadcast coverage (NBC5/WFAA/Fox4), and any other identifiable local press.
- **Council votes and meeting minutes** — official AgendaCenter/FormCenter modules and recorded
  motions where a specific, on-topic vote is documented.
- **Official government bios** — the officeholder's page on their city/town's official site.
- **Campaign and official sites** — candidate campaign sites and official council-member pages.

A topic is recorded as blank only when none of the above yields an explicit, on-topic, citable
position for that specific person on that specific topic (D-04's strict evidence bar: suggestive but
not explicit is still a blank). Social-media-only profile photos/posts are not treated as evidence
of a policy position absent a direct, citable quote. AI-generated, stock, or placeholder content is
never used as evidence.

## Completeness contract

Every name on the `222-01-WORKLIST.md` worklist must end the phase in exactly one of these two
buckets — **never neither, never both**:
1. **An applied migration row** — at least one `inform.politician_answers` / `inform.politician_context`
   pair was written for that person on at least one of the 11 topics.
2. **An entry in this register** — every one of the 11 topics was attempted and none yielded citable
   evidence, so the person appears here with zero applied stances.

A person may also appear with a **mix**: some topics landed in an applied migration (bucket 1) and
the remaining, unsourced topics are listed in this register (bucket 2) under their name. What must
never happen: a person absent from both the migrations and this register (an attempt that was silently
dropped), or a person present in both with the *same* topic recorded twice (an inconsistent record).

## Count: 303

27 (person, topic) pairs appended by 222-02 (integrity remediation) + 15 by 222-03 (Frisco)
+ 54 by 222-04 part A (Plano topic-gap fill) + 47 by 222-04 part B (McKinney topic-gap fill)
+ 1 by the 2026-07-25 bio-page-only follow-on remediation (Dan Barrios / healthcare)
+ 10 by 222-05 (Allen) + 10 by 222-06 (Richardson)
+ 84 by 222-07 (11 Prosper + 20 Celina + 53 Longview)
+ 55 by 222-08, COMPLETE (11 Anna + 11 Fairview + 11 Farmersville + 11 Parker + 11 Lucas —
all five mayors fully blank, 55 of 55 attempted pairs).
222-09 through 222-17 append their own per-government sections below as they execute.

**Migration status** — 1416 through 1421 were all applied to production 2026-07-25 after
operator approval; 1422 is authored and committed but **not yet applied**:

| Migration | Contents | Status |
|---|---|---|
| `1416_222_collin_stance_integrity_remediation.sql` | 27 deletions (12 Class A + 15 Class B2) | APPLIED |
| `1417_222_frisco_stances.sql` | 7 chairs (Colberg 1, Hill 6) | APPLIED |
| `1418_222_plano_gapfill_stances.sql` | 1 chair (Lavine residential-zoning=2) — revised down from 5; the 4 `taxes` rows were dropped by operator ruling, see below | APPLIED |
| `1419_222_mckinney_gapfill_stances.sql` | 2 chairs (Lynch homelessness=4, Jones growth-and-development=3) | APPLIED |
| `1420_222_barrios_healthcare_bio_only_remediation.sql` | 1 deletion (bio-page-only) | APPLIED |
| `1421_222_allen_stances.sql` | 1 chair (Schulmeister residential-zoning=3) | APPLIED |
| `1422_222_richardson_stances.sql` | 1 chair (Dorian housing=3) | APPLIED |
| `1423_222_prosper_celina_stances.sql` | 4 chairs across 3 of 8 people — Shea Scott (Celina): economic-development=1, public-safety-approach=4; Derrick Conley (Longview): homelessness=5; John Nustad (Longview): homelessness=5. Doug Charles (Prosper), Shane Lambert (Celina), Shannon Moore, Brandon Smith and Sidney Allen (Longview) yield zero rows — all 11 topics honest blanks each. | APPLIED |
| **`1424_222_collin_mayors_a_stances.sql` — NOT AUTHORED, NO FILE EXISTS** | Plan **222-08** (D-02 mayors sweep part A: Anna, Fairview, Farmersville, Parker, Lucas). **Zero chairs across all five mayors — 55 of 55 attempted (person, topic) pairs are honest blanks — so per the plan's own instruction no migration file was created and migration number 1424 was NOT claimed.** Nothing was committed to `C:/EV-Accounts` by this plan. There is no SQL for the operator to apply for 222-08; **Task 3's apply step is a no-op**, and the only operator action 222-08 requests is the VOTE411 403 retry described in the Lucas section. The next research plan should re-derive the next free migration number rather than assuming 1424 is taken. | **N/A — NO MIGRATION (all-blank outcome)** |

Net effect on production so far: **28 defective rows removed, 10 evidence-cited chairs added.**
Migration 1422 is excluded from that total until the operator applies it. **Plan 222-08 changes
production by nothing at all** — it adds 55 register blanks and two actionable retry leads.

---

## Phase 222 integrity remediation (2026-07-25)

**Not "never searched" blanks.** Every entry below was previously stanced with a chair on the
public compass — a deeper hand-review (222-01 county-wide integrity audit + this plan's Task 1
hand-review of the Class B2 rows) found the recorded reasoning did not clear the D-04 evidence bar
(no citable, explicit, on-topic statement/vote/questionnaire answer by that specific person), so the
chair was deleted via migration `1416_222_collin_stance_integrity_remediation.sql`
(C:/EV-Accounts, AUDIT-ONLY, **APPLIED to production 2026-07-25** after operator approval at the
Task 3 checkpoint — verified: 0 of 27 target pairs remain in either table, all 4 kept rows intact,
Collin-scope answer rows 220 → 193, zero orphaned answers created). These are "searched, evidence
found insufficient, chair removed," per
D-08 and matching 222-01-INTEGRITY-AUDIT.md's own closing framing — not a skipped research step.

Office titles below are not re-verified this session (no DB access in this executor) —
`politician_id` is the authoritative key for every row; city is carried over from
`222-01-INTEGRITY-AUDIT.md`.

### Class A deletions (12) — flatly violate D-04

- Ryan Tubbs — Celina — `cb9d6924-77d1-49c9-ab3d-778b0201e623` — housing — evidence-integrity remediation — A1: chair assigned despite reasoning admitting "no record found," sources NULL.
- Burt Thakur — Frisco — `c11bf372-8190-4b45-b80a-cbd0fb2ba401` — housing — evidence-integrity remediation — A1: same no-record-found batch pattern, sources NULL.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — housing — evidence-integrity remediation — A1: reasoning explicitly states "no specific record found... Assumed…".
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — residential-zoning — evidence-integrity remediation — A1: same batch pattern, no person-specific zoning evidence.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — housing — evidence-integrity remediation — A1: no record found, sources NULL, chair defaulted anyway.
- Dan Barrios — Richardson — `e8c863a7-d116-480e-a81f-47d26f45e264` — civil-rights — evidence-integrity remediation — A2: reasoning names party ("...a Democrat running for Congress..."), stance derived from platform framing not an on-topic position.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — civil-rights — evidence-integrity remediation — A3: identity/ethnicity-inference pattern, no explicit statement cited.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — local-immigration — evidence-integrity remediation — A3: reasoning infers stance from ethnicity/birthplace ("...born in the Rio Grande Valley border region...").
- Amir Omar — Richardson — `e9b9877d-c4dc-482e-b52a-cd015a4a6850` — civil-rights — evidence-integrity remediation — A3: reasoning infers stance from ethnicity/religion ("...Palestinian and Iranian descent... first Muslim mayor...").
- Arefin Shamsul — Richardson — `9f93ae55-9228-478d-84a9-971cf4686649` — civil-rights — evidence-integrity remediation — A3: same ethnicity/religion/birthplace-inference pattern as Omar.
- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — local-immigration — evidence-integrity remediation — A4: chair defaulted from Plano's city-wide SB4 policy, not Muns's own words.
- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — local-immigration — evidence-integrity remediation — A4: reasoning states "Plano operates under Texas SB4... Tu has made no public statements..." — city-wide law defaulted onto her record.

### Class B2 deletions (15 of 19) — per-row re-read against live reasoning

**Revision note (2026-07-25, orchestrator).** Plan 222-02's executor had no DB access and so could
not read these rows' actual stored reasoning; it applied the plan's uncertainty tie-breaker, marked
all 19 DELETE, and explicitly flagged that a reader with DB access should re-decide them per-row.
That re-read has now been done against the live `reasoning` / `sources` text. **4 of the 19 clear
the D-04 bar and were removed from the migration — they remain in production.** 15 are confirmed
deletions and are listed below. Two of the 15 proved worse than adjacency and are re-labelled.

**KEPT — not deleted, not blanks, listed here only so the decision is on the record:**
- Michael Schaeffer — Allen — `c7a0ecf6-b416-474b-9647-a25e404f4bc4` — economic-development — KEPT: reasoning cites his own dated recorded vote approving the Kalahari Resort ($950M) performance-based incentive deal, Feb 2025.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — economic-development — KEPT: reasoning carries his verbatim commitment to "welcoming businesses to move to McKinney, decreasing property tax rates and encouraging companies with higher paying jobs."
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — residential-zoning — KEPT: his own zoning votes (incl. affordable workforce apartments, 2019) plus his own quote calling an 11-acre development one of the "worst ones" he'd seen for density.
- Arefin Shamsul — Richardson — `9f93ae55-9228-478d-84a9-971cf4686649` — residential-zoning — KEPT: dated attributed statement at the April 2025 LWV Forum endorsing "small housing and missing middle housing" provisions. (His civil-rights row IS deleted above — separate row, A3 defect.)

**Confirmed deletions (15):**

- Amy Gnadt — Allen — `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` — housing — **A1-grade, re-labelled**: reasoning self-admits "No housing-specific statements found" then states the chair is "the default moderate-conservative suburban position" — an explicitly defaulted stance.
- Amy Gnadt — Allen — `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` — public-safety-approach — B2: chair rests on city-wide budget history plus "supports public services"; reasoning states no co-responder or reallocation statements found.
- Amy Gnadt — Allen — `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` — residential-zoning — B2: "supports 'smart growth' without specific zoning advocacy found"; chair rests on the city's adopted framework and generic unanimous rezoning votes.
- Carl Clemencich — Allen — `f72c8a0c-61dd-4a86-a205-171e331fcaee` — public-safety-approach — B2: pure tenure adjacency — police HQ approved "during" his term; no personal position cited.
- Tommy Baril — Allen — `3b15d821-fc1e-4e7b-bda0-13a669a77a27` — economic-development — B2: board presidency plus a generic "fiscally prudent" quote; reasoning itself notes he was ABSENT from the one on-topic incentive vote.
- Angelia Pelham — Frisco — `5b346b19-d6ee-47e2-acbf-5780ca423264` — civil-rights — B2: extensive civic/nonprofit work, but reasoning states "no specific policy mandates... or systemic reform proposals at the council level were found."
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — economic-development — B2: quote is real but generic ("policies that support businesses of all sizes"); does not locate the incentive-aggressiveness chair it was used to set.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — economic-development — B2: board membership plus a "suggesting"/"indicating" chain of inference.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — public-safety-approach — B2: "public safety is my top priority" does not distinguish this chair from its neighbour, and the reasoning cites a vote pointing the other way.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — economic-development — B2: profession plus bond-committee service plus a "suggests" inference.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — public-safety-approach — B2: cites real dated votes, but they are homelessness-criminalization votes used to set a public-safety chair — cross-topic inference.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — economic-development — B2: board membership plus profession plus "aligned with."
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — economic-development — B2: board membership plus profession; "actively supports" asserted without a quote or vote. (His residential-zoning row is KEPT above.)
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — homelessness — B2: real campaign pledge quote, but about "wrap-around services for residents in need" generally — not an on-topic position on public camping / homelessness response.
- Dan Barrios — Richardson — `e8c863a7-d116-480e-a81f-47d26f45e264` — homelessness — **A2/A4-grade, re-labelled**: chair derived from "his progressive Democratic lean" while reasoning admits "No direct policy statement on public camping found."

---

## Frisco — City of Frisco (4827684) — 222-03

**Attempted:** 2026-07-25, one politician at a time (D-03), both un-stanced Frisco officeholders on
the 222-01 live worklist, each against all 11 canonical compass topics. The other five seated Frisco
officeholders (Jared Elad, Ann Anderson, Angelia Pelham, Laura Rummel, Burt Thakur) already hold
stances and were out of scope per D-07. Gopal Ponangi is un-seated and was not attempted; Place 4 is
Jared Elad (Pitfall 3), who is not in this plan's scope.

**Evidence checked (both people):** Dallas Morning News Editorial Board recommendation + Voter Guide
answers for the May 2026 Frisco races; Community Impact Newspaper's Frisco-bureau candidate Q&As
(Place 6, March 24 2026; mayoral runoff, May 14 2026); each officeholder's campaign site
(choosecolberg.com; markhill4mayor.com including its full `/policies/` platform page); their official
friscotexas.gov council pages; Star Local Media / Frisco Enterprise; KERA, WFAA, CBS Texas, NBC 5
DFW and Local Profile election coverage; Frisco Chronicles; Frisco Chamber of Commerce voter
information; League of Women Voters of Collin County / VOTE411. Frisco, **Texas** was confirmed on
every source used (Frisco also exists in CO and NC; "Mark Hill" is a common name — the Frisco TX
mayor elected in the June 13 2026 runoff and sworn in July 7 2026 was confirmed specifically).

**Sources checked but unavailable this session:** Ballotpedia's individual candidate pages for both
people resolved but returned no readable body content on repeated fetches (no Candidate Connection
survey surfaced for either person in search either); Star Local Media / Frisco Enterprise returned
HTTP 429 on repeated attempts. Neither was used as a source for any applied chair. A later pass with
working access to those two families may find additional evidence, particularly on the
economic-development and public-safety topics.

### Brittany Colberg — Council Member Place 6 — `ddcb2d35-0f94-4956-ab65-ae56a900ac11`

Sourced: `housing` = 3 (applied via migration 1417). The remaining 10 topics are blank:

- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — civil-rights — no on-topic
  position found. The DMN recommendation quotes her Voter Guide line "My approach is to lead with
  consistency, fairness, and a commitment to treating people with respect," which is a statement
  about her leadership manner, not a position on civil-rights law, enforcement, or equity policy.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — homelessness — no statement
  found on public camping, encampments, or homelessness response.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — economic-development — no
  position found on incentives or abatements. The DMN board's own framing that she understands "the
  best ways to promote commercial growth while preserving neighborhoods" is the board's
  characterization, not her words, and does not locate an incentive-aggressiveness chair.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — local-immigration — no
  statement found on Frisco PD's relationship to federal immigration enforcement or ICE detainers.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — public-safety-approach —
  "ensuring first responders have what they need to keep residents safe" (Community Impact, March 24
  2026) is real and on-topic but does not distinguish maintaining current funding from increasing
  staffing and equipment, and names no crisis-response component. This is the same defect pattern
  the 222-01 audit deleted elsewhere ("public safety is my top priority"), so it stays blank.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — residential-zoning — her
  recorded opposition to Senate Bill 840 (DMN, April 16 2026) rules out the broad by-right-upzoning
  chairs, but no statement of hers was found that separates strict neighborhood-character protection
  from modest infill density from corridor-focused multifamily. Range-narrowed is not chair-located,
  so it stays blank. Her eight years on the Frisco Planning & Zoning Commission is service history,
  not a position, and was deliberately not used.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — transportation-priorities —
  no statement found on transportation mode priorities; her "infrastructure that keeps up with
  development" line is about infrastructure generally, not roads versus transit versus pedestrian
  investment.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — taxes — "fiscal discipline"
  and "protecting taxpayer dollars through clear, accountable decision-making" (Community Impact,
  March 24 2026) is about spending accountability, not a position on the tax-and-spend balance.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — growth-and-development —
  **demoted to blank in this plan's pre-commit self-audit.** Her Community Impact answers are
  genuinely on-topic ("Managing growth responsibly while preserving the high quality of life…
  intentional planning to protect neighborhoods and taxpayer dollars, as we approach build-out";
  "I will focus on infrastructure that keeps up with development"), but the wording cannot separate
  allowing growth only where existing infrastructure supports it from planning proactively and
  investing ahead of growth — "keeps up with" points at neither exclusively. Two adjacent chairs
  remained live, so no chair was assigned.
- Brittany Colberg — Frisco — `ddcb2d35-0f94-4956-ab65-ae56a900ac11` — healthcare — no statement
  found on healthcare access.

### Mark Hill — Mayor — `3579e02c-d480-48ba-8d95-3eb7f002a5b0`

Sourced: `housing` = 4, `residential-zoning` = 3, `growth-and-development` = 3,
`public-safety-approach` = 4, `taxes` = 3, `transportation-priorities` = 3 (applied via migration
1417). The remaining 5 topics are blank:

- Mark Hill — Frisco — `3579e02c-d480-48ba-8d95-3eb7f002a5b0` — economic-development — **demoted to
  blank in this plan's pre-commit self-audit.** His platform is explicit and on-topic but points at
  two adjacent chairs at once: "Keep all incentives performance-based and phased, with no dollar
  until delivery" and "Maintain and strengthen performance-based incentives only" are conditioned,
  restrained incentives, while "The EDC is busier than it has ever been, and I will keep it that
  way," "Leverage World Cup, Universal, and PGA," and his June 26 2026 NBC 5 interview ("I know I
  intend to be extremely competitive… win a lot of those competitive battles") describe active
  competition for major employers. Neither chair dominates, so none was assigned. His seat on the
  Frisco EDC board is service history, not a position, and was deliberately not used — that is the
  exact adjacency defect the 222-01 audit found on this topic in six other Collin records.
- Mark Hill — Frisco — `3579e02c-d480-48ba-8d95-3eb7f002a5b0` — civil-rights — no on-topic position
  found. His "Unite Frisco" platform pillar, and coverage of his campaign emphasizing unity and
  inclusion and urging city leaders to "avoid rhetoric that makes residents feel unwelcome," are
  statements about civic tone and leadership conduct, not positions on civil-rights enforcement,
  equity requirements, or race-conscious programs. Assigning a chair from them — or from the
  religious/ethnic framing that surrounded the 2026 runoff — would repeat the A3 identity-inference
  defect, so this stays blank.
- Mark Hill — Frisco — `3579e02c-d480-48ba-8d95-3eb7f002a5b0` — homelessness — no statement found on
  public camping, encampments, or homelessness response. Confirmed absent from his full platform
  page.
- Mark Hill — Frisco — `3579e02c-d480-48ba-8d95-3eb7f002a5b0` — local-immigration — no statement
  found on Frisco PD's relationship to federal immigration enforcement, ICE detainers, or
  information sharing. Confirmed absent from his full platform page. His general remarks on
  diversity and immigration in a FunAsia interview were not treated as a position on municipal
  police cooperation.
- Mark Hill — Frisco — `3579e02c-d480-48ba-8d95-3eb7f002a5b0` — healthcare — no statement found on
  healthcare access. Confirmed absent from his full platform page.

**Frisco reconcile:** both worklist names appear in bucket 1 (an applied migration row) and
additionally list their unsourced topics here — no Frisco name is in neither bucket, and no
(person, topic) pair appears in both.

---

## City of Plano (4858016) — 222-04 part A

**Attempted:** 2026-07-25, one politician at a time (D-03), all 8 seated Plano officeholders,
each against exactly the topics that held no stance for them after plan 222-02's deletions
(59 (person, topic) pairs). Pairs that already held a stance were not re-researched and were
not touched (D-07). Place 6 is not in scope. **5 pairs were sourced** (applied via migration
`1418_222_plano_gapfill_stances.sql`); **the 54 below are honest blanks.**

**Evidence checked (all 8 people):** Community Impact Newspaper's Plano-bureau candidate Q&As
for the May 3 2025 Place 2, Place 4, Place 5 and Place 8 races and the Jan 31 2026 Place 7
special election; Community Impact's Plano government coverage of the FY 2025-26 budget and
property-tax-rate deliberations (Aug 19, Aug 26 and Sept 9 2025), the Aug 27 2025 state-housing-law
zoning ordinances, the Nov 5 2025 DART withdrawal-election call and the Feb 23 2026 DART
cancellation; KERA News coverage of the tax rate (Sept 9 2025) and the DART votes (Nov 5 2025);
Star Local Media / Plano Star Courier's 2023 and 2025 council-election candidate previews and its
State of the City report; Plano Magazine's 2023 and 2025 election coverage and its Maria Tu
profile; Local Profile; each officeholder's campaign site where one exists and resolves
(steve4plano.com, vidalforplano.com, bob4plano.org, rickhorne4plano.org); their official
plano.gov council pages; the Capital Analytics "Spotlight On: John Muns" interview; the
Keep Plano #1 voters-guide page; Prism News; and searches against VOTE411 / League of Women
Voters of Collin County. Plano, **Texas** was confirmed on every source used.

**Sources checked but unavailable this session:** Ballotpedia's individual candidate pages
(Maria Tu, Bob Kehr, Shun Thomas, Vidal Quintanilla) all resolved but returned no readable body
content on repeated fetches — the same failure plan 222-03 recorded for Frisco; Star Local Media
returned HTTP 429 on its 2025 "Get to know your Plano City Council candidates" piece; D Magazine
returned HTTP 403; `bob4plano.org` returned HTTP 404 and `rickhorne4plano.org` did not resolve
via DNS. None was used as a source for any applied chair. A later pass with working access to
Ballotpedia Candidate Connection and Star Local Media may find additional evidence, particularly
on the growth-and-development, economic-development and transportation topics.

**Plano-wide note on unanimous votes.** Plano's four most on-topic council actions in this window
were all unanimous with no individually-attributed reasoning: the Sept 8 2025 tax-rate adoption
(8-0), the Nov 5 2025 DART withdrawal-election call (8-0), the Feb 23 2026 DART cancellation (8-0)
and the May 26 2026 $140M public-safety campus construction award (8-0). Per this phase's evidence
bar a unanimous vote with no personal statement does not locate a chair, so none of them was used
except where the member's own quoted reason at that meeting exists.

### Maria Tu — Council Member Place 1 — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799`

Sourced: `taxes` = 3 (applied via migration 1418). The remaining 6 attempted topics are blank:

- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — civil-rights — no on-topic position
  found. Her 2019 Community Impact answer that she is personally passionate about "diversity and
  unity" and hoped to be "a unifying force" that could help heal community divisions is a statement
  about civic tone and her own motivation, not a position on civil-rights enforcement, equity
  requirements, or race-conscious programs.
- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — growth-and-development — no
  chair-locating position found. Her Plano Magazine profile quote that "The main issue that Plano is
  facing is that we're getting old... we have to focus on getting senior adults like her to downsize"
  is about the city's age demographics and housing turnover, not about how fast growth should be
  approved, whether infrastructure capacity should gate it, or whether permitting should be
  streamlined. Her 2025 budget remark that "if we want any type of increase in our tax base, we're
  not going to have it" is about tax-base revenue, not development pace.
- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — healthcare — no statement found on
  healthcare access.
- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — homelessness — no statement found on
  public camping, encampments, or homelessness response.
- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — local-immigration — **previously
  deleted by 222-02 (A4: chair defaulted from Plano's city-wide SB4 posture) and re-researched this
  session; it stays blank.** No statement by Tu was found on Plano PD's relationship to federal
  immigration enforcement, ICE detainers, or information sharing. Her law practice includes
  immigration cases and she has spoken generally about Plano's immigrant community, but professional
  background is adjacency and a general remark about community diversity is not a position on
  municipal police cooperation — using either would reproduce the defect just removed.
- Maria Tu — Plano — `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` — public-safety-approach — her 2019
  campaign answer on "enhancing public safety and reducing crime," citing Plano's ranking as the
  third-safest city in America, is real and on-topic but does not distinguish keeping current public
  safety funding from increasing staffing, equipment and pay, and names no crisis-response or
  co-responder component. This is the same non-discriminating pattern the 222-01 audit deleted
  elsewhere, so it stays blank. The May 26 2026 public-safety campus award was unanimous with no
  statement of hers attributed.

### Bob Kehr — Council Member Place 2 — `de037c5c-9c00-40c5-ade2-3d322b4a0349`

Sourced: none. All 8 attempted topics are blank. This is a correct outcome, not a skipped
research pass — his one substantive public questionnaire (Community Impact, March 10 2025) is a
services-and-value platform that touches none of these topics at chair-locating resolution.

- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — civil-rights — no on-topic position
  found.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — growth-and-development — no
  chair-locating position found. "Plano is now a mature city. We must refresh retail and office
  spaces, and continue robust maintenance on infrastructure" (Community Impact, March 10 2025) is
  about maintaining and refreshing a built-out city; it states no position on the pace at which new
  growth should be approved, on gating approvals to infrastructure capacity, or on streamlining
  permitting.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — healthcare — no statement found on
  healthcare access.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — homelessness — no statement found on
  public camping, encampments, or homelessness response.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — local-immigration — no statement found
  on Plano PD's relationship to federal immigration enforcement.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — residential-zoning — no position found
  on housing density or neighborhood character. "Addressing housing to keep growing families in
  Plano, help our seniors retire here, and support young families build lives here" (Community
  Impact, March 10 2025) names who he wants housed but takes no position on density, rezoning, or
  single-family zoning.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — taxes — no chair-locating position
  found. His campaign-site observation that "The tax rate in Plano remains one of the lowest in the
  region. However, the cost of housing is higher than in the past, which means the total taxes paid
  continues to grow" describes the burden rather than stating what should be done about it; he
  proposes neither an increase nor a cut nor a service tradeoff. His campaign site itself returned
  HTTP 404 this session, so only the search-surfaced excerpt was available and it was not used.
  The Sept 8 2025 rate adoption was unanimous with no statement of his attributed.
- Bob Kehr — Plano — `de037c5c-9c00-40c5-ade2-3d322b4a0349` — transportation-priorities — no
  chair-locating position found. His DART-dispute remark that "the buses are mostly empty" is an
  observation about current ridership, and his comment that the February 2026 agreement "didn't meet
  all of Plano's initial goals, but... represented progress toward a long-term solution" is about the
  negotiation; neither states where the city's transportation investment should go as between roads,
  transit, and pedestrian and cycling infrastructure. The full context of the "empty buses" quote
  could not be retrieved (D Magazine returned HTTP 403), so it was not used.

### Rick Horne — Council Member Place 3 — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e`

Sourced: `taxes` = 3 (applied via migration 1418). The remaining 6 attempted topics are blank:

- Rick Horne — Plano — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e` — economic-development — **demoted to
  blank in this plan's pre-commit self-audit.** He personally moved the June 8 2026 designation of a
  Tax Increment Reinvestment Zone (approved 8-0) and voted for the Economic Development Incentive
  Agreement with Centennial Waterfall Willow Bend, LLC, and his platform names redevelopment as a
  priority — which together rule out the no-incentives and small-business-only chairs. But no stated
  reason of his was found that separates targeted incentives carrying community-benefit and
  job-quality conditions from active competition for major employers with significant abatements.
  Range-narrowed is not chair-located. His board service and his own framing of his "skillset as a
  businessman" were deliberately not used — that is the exact adjacency defect the 222-01 audit found
  on this topic in six other Collin records.
- Rick Horne — Plano — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e` — growth-and-development — no
  chair-locating position found. "Plano must continue to renew itself to avoid becoming a city of
  abandoned strip centers and failing infrastructure" and "To continue being the City of Excellence
  while competing against our neighbors to the north, Plano must look forward and progress smartly
  and with purpose" (Plano Magazine, 2023 election coverage) are genuinely on-topic but point at two
  adjacent chairs at once: investing in infrastructure ahead of growth, and actively recruiting
  development to grow the tax base. "Smartly and with purpose" resolves neither.
- Rick Horne — Plano — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e` — healthcare — no statement found on
  healthcare access.
- Rick Horne — Plano — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e` — homelessness — no statement found on
  public camping, encampments, or homelessness response.
- Rick Horne — Plano — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e` — local-immigration — no statement
  found on Plano PD's relationship to federal immigration enforcement.
- Rick Horne — Plano — `bc4a88d7-2f56-48fd-85db-fa1fd4f8547e` — transportation-priorities — his own
  words at the Feb 23 2026 DART decision — "We were working as hard as we could to come up with a
  solution where we can improve the mobility within the city" and "What we have is good, it's not
  perfect, but it's a starting point" — are real, dated and his own, but they are about the DART
  negotiation and general mobility rather than a position on where transportation investment should
  go as between roads, transit, and pedestrian and cycling infrastructure. The vote itself was 8-0.

### Chris Krupa Downs — Council Member Place 4 — `127b8e69-3900-438c-8361-2cfe24b6c6cf`

Sourced: `taxes` = 3 (applied via migration 1418). The remaining 9 attempted topics are blank:

- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — civil-rights — no on-topic
  position found.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — economic-development — no
  chair-locating position found. "I support continued upgrades to ageing retail and the Texas
  Research Quarter are great opportunities to grow the commercial tax base" and "I will support
  expanding the commercial tax base" (Community Impact, March 10 2025) commit her to growing the
  commercial base but state no posture on incentives or abatements, which is what this topic's
  chairs distinguish.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — growth-and-development — no
  chair-locating position found. "Continued upgrades to ageing retail" is redevelopment of a
  built-out city, not a position on growth pace, infrastructure gating, or permitting.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — healthcare — no statement
  found on healthcare access.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — homelessness — no statement
  found on public camping, encampments, or homelessness response.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — housing — **previously
  deleted by 222-02 (A1: reasoning explicitly stated "no specific record found... Assumed") and
  re-researched this session; it stays blank.** Her full March 10 2025 Community Impact questionnaire
  was read this session and names traffic, roads, taxes, public safety, and commercial redevelopment
  — housing affordability appears nowhere in it, and no other source was found in which she takes a
  position on the government's role in housing affordability. The deleted row's own diagnosis was
  correct; nothing new exists to replace it.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — local-immigration — no
  statement found on Plano PD's relationship to federal immigration enforcement.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — public-safety-approach —
  **demoted to blank in this plan's pre-commit self-audit.** "Public safety is my top priority,
  ensuring police and fire departments have needed resources" and "The city must support police and
  fire services" (Community Impact, March 10 2025) are on-topic but do not distinguish keeping
  current public safety funding from increasing staffing, equipment and pay, and name no crisis-response
  component. "Public safety is my top priority" is verbatim the phrase the 222-01 audit deleted from
  another Collin record for exactly this reason.
- Chris Krupa Downs — Plano — `127b8e69-3900-438c-8361-2cfe24b6c6cf` — residential-zoning —
  **previously deleted by 222-02 (A1: same no-record-found batch pattern) and re-researched this
  session; it stays blank.** No statement of hers was found on housing density, rezoning, or
  neighborhood character. Her service on Plano's Cultural Affairs Commission and Historical
  Commission is service history, not a position, and was deliberately not used.

### Steve Lavine — Council Member Place 5 — `ecef0481-27c7-4955-b822-83d64c7ef63f`

Sourced: `residential-zoning` = 2 (applied via migration 1418). The remaining 5 attempted topics
are blank:

- Steve Lavine — Plano — `ecef0481-27c7-4955-b822-83d64c7ef63f` — civil-rights — no on-topic
  position found. His campaign framing of Plano as "a vibrant, welcoming city" is about civic
  character, not civil-rights policy.
- Steve Lavine — Plano — `ecef0481-27c7-4955-b822-83d64c7ef63f` — growth-and-development — no
  chair-locating position found. "Plano needs thoughtful renewal planning for its future," his
  endorsement of "multi-use redevelopments at Collin Creek and Willow Bend" delivered through
  "public-private partnerships... without overburdening taxpayers" (Community Impact, April 3 2025)
  and his self-description as one who "Works constructively with both developers and residents to
  find balanced, win-win solutions" are about redevelopment method, not about the pace at which
  growth should be approved. His Haggard Farm rezoning record was deliberately not carried across to
  this topic — the residents' traffic-and-schools objections in that case were not stated by him as
  his own infrastructure-capacity position, and cross-topic inference from a zoning fight to a growth
  chair is exactly the defect pattern the 222-01 audit deleted elsewhere.
- Steve Lavine — Plano — `ecef0481-27c7-4955-b822-83d64c7ef63f` — healthcare — no statement found on
  healthcare access. Confirmed absent from his full campaign site.
- Steve Lavine — Plano — `ecef0481-27c7-4955-b822-83d64c7ef63f` — homelessness — no statement found
  on public camping, encampments, or homelessness response. Confirmed absent from his full campaign
  site.
- Steve Lavine — Plano — `ecef0481-27c7-4955-b822-83d64c7ef63f` — local-immigration — no statement
  found on Plano PD's relationship to federal immigration enforcement. Confirmed absent from his full
  campaign site.

### Shun Thomas — Council Member Place 7 — `4272e5cb-40cf-42d9-a493-ae5ca04301bb`

Sourced: none. All 8 attempted topics are blank. She won the Place 7 special election on Jan 31
2026, so she was not seated for the FY 2025-26 budget and tax-rate deliberations and has no tax
vote or budget statement of her own; her published campaign material is a short priorities list.

- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — civil-rights — no on-topic position
  found.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — economic-development — no
  chair-locating position found. "Balance business and residential needs to keep taxes low" and
  "grow tourism responsibly" (Community Impact, Dec 19 2025; campaign material) state no posture on
  incentives or abatements.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — growth-and-development — no
  chair-locating position found. "Plano's biggest challenge is identifying the best transportation
  option for our growing city" (Community Impact, Dec 19 2025) describes growth as context for a
  transportation question; it states no position on growth pace, and "grow tourism responsibly" is
  about tourism, not development approvals.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — healthcare — no statement found on
  healthcare access.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — homelessness — **previously deleted
  by 222-02 (B2: the quote was about "wrap-around services for residents in need" generally, not
  homelessness policy) and re-researched this session; it stays blank.** The same
  wrap-around-services clause is still the only nearby language in her campaign material, and it was
  deliberately not reused. No statement of hers was found on public camping, encampments, or
  homelessness response.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — housing — **previously deleted by
  222-02 (A1: no record found, sources NULL, chair defaulted anyway) and re-researched this session;
  it stays blank.** Her full Community Impact questionnaire and her campaign priorities list were
  read this session; neither takes a position on the government's role in housing affordability.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — local-immigration — no statement
  found on Plano PD's relationship to federal immigration enforcement.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — taxes — no chair-locating position
  found. "Balance business and residential needs to keep taxes low" is a single clause in a
  laundry-list of campaign priorities; it names no rate, no service tradeoff, and no vote, and does
  not distinguish keeping the current tax system with small adjustments from cutting taxes.

### Vidal Quintanilla — Council Member Place 8 — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f`

Sourced: `taxes` = 3 (applied via migration 1418). The remaining 6 attempted topics are blank:

- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — civil-rights — **previously
  deleted by 222-02 (A3: identity/ethnicity inference with no explicit statement cited) and
  re-researched this session; it stays blank.** His full campaign platform was read this session and
  covers economic development, property taxes, public safety and four-corner redevelopment only; no
  statement on civil-rights enforcement, equity requirements, or race-conscious programs was found in
  any source. His ethnicity, birthplace and Plano commission service were deliberately not used —
  that is precisely the defect just removed.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — growth-and-development — no
  chair-locating position found. "I believe in a city that listens to its residents, prioritizes
  smart growth, and invests in its future" and his campaign site's "ensuring sustainable growth that
  benefits all of Plano's residents" (Community Impact, March 12 2025; vidalforplano.com) are
  slogans; they state no position on growth pace, infrastructure gating, or permitting. The 222-01
  audit deleted another Collin row that rested on exactly a "supports 'smart growth'" formulation.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — healthcare — no statement
  found on healthcare access. Confirmed absent from his full campaign platform.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — homelessness — no statement
  found on public camping, encampments, or homelessness response. Confirmed absent from his full
  campaign platform.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — local-immigration —
  **previously deleted by 222-02 (A3: stance inferred from ethnicity and birthplace) and
  re-researched this session; it stays blank.** No statement of his was found on Plano PD's
  relationship to federal immigration enforcement, ICE detainers, or information sharing; the topic
  is confirmed absent from his full campaign platform.
- Vidal Quintanilla — Plano — `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` — transportation-priorities —
  **demoted to blank in this plan's pre-commit self-audit.** "Plano's challenge is maintaining and
  improving our roads while minimizing disruptions for residents" and "advocating for a strategic,
  phased approach to road maintenance that minimizes disruptions" (Community Impact, March 12 2025)
  are real, on-topic and his own, and they rule out the transit-and-cycling-first chair and the
  highway-and-free-parking chair. But they are about the sequencing of road construction rather than
  about mode priority, and they cannot separate maintaining roads while selectively adding transit
  and pedestrian improvements from focusing investment on road capacity for drivers. Two adjacent
  chairs remained live, so no chair was assigned.

### John B. Muns — Mayor — `5584e869-4a54-4a68-a3c8-c14db45a71c5`

Sourced: none. All 6 attempted topics are blank. His pre-existing stances on the topics he already
held were not touched.

- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — civil-rights — no on-topic
  position found. Plano has an Equal Rights Ordinance but no statement by Muns about it, or about
  civil-rights enforcement, equity requirements, or race-conscious programs, was found.
- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — growth-and-development — no
  chair-locating position found. His Jan 28 State of the City remarks — "The development phase of our
  city is slowing down," "Our future will have a strong focus on redevelopment," Plano is "robust,
  resilient and strong" and approaching build-out with only 4% of land left — describe where the city
  is in its development cycle rather than stating how growth should be managed. His Aug 25 2025
  remarks on Senate Bills 840 and 15 ("Senate Bill 840 [and] 15 have taken complete authority away
  from what our community would like to see"; "we no longer have any ability to [determine] what we
  think is appropriate in certain areas") are about local zoning authority, and he already holds a
  stance on residential zoning; carrying them across to the growth-pace topic would be cross-topic
  inference and was not done.
- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — healthcare — no statement found on
  healthcare access.
- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — homelessness — no statement found
  on public camping, encampments, or homelessness response.
- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — local-immigration — **previously
  deleted by 222-02 (A4: chair defaulted from Plano's city-wide SB4 policy rather than his own
  words) and re-researched this session; it stays blank.** No statement of his was found on Plano
  PD's relationship to federal immigration enforcement, ICE detainers, or information sharing. His
  remark in a Capital Analytics interview that "We are a diversified population with a fantastic
  immigrant presence that has grown through word of mouth over time" is a demographic and workforce
  observation, not a position on municipal police cooperation, and using it would substitute one
  inference defect for another.
- John B. Muns — Plano — `5584e869-4a54-4a68-a3c8-c14db45a71c5` — taxes — **demoted to blank in this
  plan's pre-commit self-audit.** His only quote in the tax-rate coverage — "If we don't take care of
  our infrastructure, I think companies will look elsewhere if we're not taking care of our city in
  all facets" (KERA, Sept 9 2025) — is an argument for infrastructure spending and states no position
  on the balance between what the city collects and what it spends. The Sept 8 2025 rate adoption was
  unanimous (8-0) with no tax statement of his own attributed, and a unanimous vote does not locate a
  chair.

**Plano reconcile:** 59 (person, topic) pairs attempted; 5 sourced and applied via migration
`1418_222_plano_gapfill_stances.sql`; 54 blank-registered above. 5 + 54 = 59. Five of the eight
people appear in both buckets (an applied row plus their unsourced topics listed here); Bob Kehr,
Shun Thomas and John B. Muns appear in this register only, with zero newly applied stances — a
correct outcome under D-04, not a skipped pass. No (person, topic) pair appears in both buckets, and
no pair outside the 59-pair gap list was researched, written, or touched. All 8 previously-deleted
pairs that fall in this scope were re-researched and all 8 remain blank; none was reinstated.

---

## City of McKinney (4845744) — 222-04 part B

**Attempted:** 2026-07-25, one politician at a time (D-03), all 7 seated McKinney officeholders,
each against exactly the topics that held no stance for them after plan 222-02's deletions
(49 (person, topic) pairs). Pairs that already held a stance were not re-researched and were not
touched (D-07) — including Michael Jones / `economic-development` and Rick Franklin /
`residential-zoning`, which 222-02 reviewed and KEPT. **2 pairs were sourced** (Ernest Lynch /
`homelessness` = 4 and Michael Jones / `growth-and-development` = 3, authored in migration
`1419_222_mckinney_gapfill_stances.sql`); **the 47 below are honest blanks.**

**Evidence checked (all 7 people):** Community Impact Newspaper's McKinney-bureau candidate Q&As
(At Large 1, March 6 2025; District 3, March 5 2025; At Large 2, April 3 2023; the June 12 2023
Jones get-to-know Q&A; the Feb 10 2022 Cloutier Q&A; the 2021 Beller/Feltus new-member profile;
the 2019 Franklin candidate Q&A) plus Community Impact's McKinney government coverage of the
Oct. 21 2025 public-sleeping and camping ordinances, the Aug. 19 2025 panhandling/camping
work session, the Sept. 2 2025 FY 2025-26 budget and tax-rate adoption, the Aug. 6/Aug. 8 2025
proposed rate, the June 17 2025 over-65 homestead-exemption decision, and the Oct. 28 2025 11-acre
apartment rezoning; KERA News coverage of the McKinney field (Feb. 18 2025), the four-way mayoral
race (March 25 2025), the June 2025 runoffs, the Sept. 3 2025 tax-rate adoption and the Dec. 29
2025 county-wide public-camping/no-shelter story; NBC 5 DFW's report on McKinney's homelessness
ordinance debate; WFAA's ordinance report; each officeholder's campaign or official site where one
exists and resolves (michaelhjones.com and /my-vision; feltus4mckinney.com and /priorities;
coxformayor.com and /about; patrickformckinney.com); their official mckinneytexas.org council
member pages; GoodParty.org's Lynch candidate profile; TX 3rd Congressional District news; the
McKinney Legistar agenda/legislation system; and searches against VOTE411 / League of Women Voters
of Collin County. Targeted searches were also run for a McKinney 287(g) / ICE-detainer /
information-sharing debate and for a McKinney civil-rights, equity or equal-rights resolution;
neither exists in the public record. McKinney, **Texas** was confirmed on every source used.

**Sources checked but unavailable this session:** Ballotpedia's individual candidate pages (Lynch,
Feltus, Cox) resolved but returned no readable body content on repeated fetches — the same failure
plans 222-03 and 222-04 part A recorded for Frisco and Plano; VOTE411's race-detail page for the
At Large 1 runoff returned HTTP 403; Local Profile returned HTTP 403 on both its ordinance and its
budget stories; WFAA timed out; `lynchformckinney.com` and `rickwithmckinney.com` no longer resolve
or return HTTP 404 on every path tried; `patrickformckinney.com` resolves but is an empty default
WordPress install; Star Local Media was not reachable. Community Impact's 2019 Franklin Q&A page
resolved but its answer body did not render on either URL form. None was used as a source for any
applied chair. A later pass with working access to Ballotpedia Candidate Connection, VOTE411 and
Star Local Media may find additional evidence, particularly on the economic-development,
public-safety and taxes topics.

**McKinney-wide note on the Oct. 21 2025 ordinances.** These were the cohort's most on-topic
recorded votes and they were *not* unanimous: Community Impact reports the downtown
sitting-and-lying ordinance passed 6-1 (Justin Beller against) and the citywide camping ordinance
passed 5-2 (Beller and Geré Feltus against), which identifies every member's side on both. Only two
of the seven have `homelessness` in this plan's gap list (Lynch and Cox) — the other five already
hold that topic. A member's vote on these ordinances was used **only** for `homelessness`; carrying
it across to `public-safety-approach` is the exact cross-topic move that got Beller's public-safety
row deleted by 222-02, and it was deliberately not repeated. TX 3rd Congressional District news
reported a conflicting roll call for these votes (it places Michael Jones with the dissenters and
Feltus with the majority); where the two accounts conflict, Community Impact's account was used and
the other was discarded rather than averaged.

**Note on `taxes` (7 pairs).** All 7 members were researched on this topic and **no `taxes` row was
written**, pending an operator methodology ruling: the scale's chairs 1-2 require raising taxes
specifically on wealthy people and large companies and its chairs 4-5 require scaling public
services back, neither of which is a municipal power or practice, leaving chair 3 as the only
structurally reachable chair for a city council member. Four members (Lynch, Jones, Cloutier,
Feltus) have real, dated, on-topic tax evidence that would support chair 3 if the operator rules
chair 3 acceptable; their entries below are marked **researched, chair pending methodology ruling**
and record the evidence so nothing has to be re-researched. Beller, Franklin and Cox yielded no
chair-locating tax evidence at all and are ordinary blanks.

**Note on the McKinney Economic Development Corporation.** Four of these seven members are current
or former MEDC board members or chairs (Lynch, Jones, Cloutier, Franklin) and Feltus works with the
MEDC on workforce development. **EDC board service is not evidence of a position on economic-
development incentives.** It is the adjacency defect 222-02 deleted from five McKinney records, and
it was deliberately not used anywhere in this pass.

### Ernest Lynch — Council Member At-Large Place 1 — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e`

Sourced: `homelessness` = 4 (authored in migration 1419). The remaining 8 attempted topics are
blank:

- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — civil-rights — no on-topic
  position found. Nothing in his candidate Q&A, his runoff coverage, his GoodParty profile or his
  official council page states a position on civil-rights enforcement, equity requirements, or
  race-conscious programs.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — economic-development —
  **previously deleted by 222-02 (B2: the quote was real but too generic — "policies that support
  businesses of all sizes" — to locate the incentive-aggressiveness chair) and re-researched this
  session; it stays blank.** The nearest material found is the same register: "As a former hospital
  CEO, I know what it's like to operate a business in McKinney. We need a strong tax base, a growing
  vibrant economy, and an inviting business environment" (TX3D news, runoff preview), "supporting a
  business-friendly environment" (Community Impact, March 6 2025) and "prioritizing smart
  investments and public-private partnerships" (GoodParty profile). None of it states a posture on
  incentives, abatements, community-benefit conditions or job-quality requirements, which is what
  this topic's chairs distinguish. His chairmanship of the McKinney Economic Development Corporation
  is service history, not a position, and was deliberately not used — re-deriving the same chair
  from the same weak material would reinstate the defect just removed.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — growth-and-development — no
  chair-locating position found. "I'm running for City Council to ensure McKinney grows responsibly
  while protecting our community values" and "The No. 1 challenge facing McKinney is managing rapid
  growth while ensuring public safety and maintaining quality of life. I'll focus on workforce
  development, improving infrastructure, and supporting a business-friendly environment" (Community
  Impact, March 6 2025), plus "We are at a tipping point in terms of how we plan for growth. We need
  to make the most of these opportunities, but we need to be practical, pragmatic, and listen"
  (TX3D news, runoff preview), are genuinely about growth but state no position on the pace at which
  growth should be approved, on gating approvals to infrastructure capacity, or on streamlining
  permitting. "Grows responsibly" is the same formulation the 222-01 audit deleted from another
  Collin record ("supports 'smart growth'"), so it was not used.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — healthcare — no statement found
  on the government's role in healthcare access. He is a retired hospital CEO and his homelessness
  answer proposes "collaborating with healthcare providers," but professional background is
  adjacency and a service-collaboration remark is not a position on how healthcare coverage should
  be financed or provided.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — local-immigration — no
  statement found on McKinney PD's relationship to federal immigration enforcement, ICE detainers,
  or information sharing. No such McKinney council debate exists in the public record.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — residential-zoning — no
  position found on housing density, rezoning, or neighborhood character. He is not quoted in the
  Oct. 28 2025 11-acre apartment rezoning coverage and was recorded absent from a March 2026 zoning
  vote.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — taxes — **researched, chair
  pending methodology ruling (would be 3).** KERA (Feb. 18 2025) reports his campaign site listed
  "economic growth, transparency, public safety and lower taxes" as his priorities, and that "By
  prioritizing smart investments and public-private partnerships, Ernest aims to expand the tax base
  while reducing the financial strain on homeowners"; his GoodParty profile adds "implementing
  strategic measures to lower the tax burden on families and businesses by fostering economic growth
  and maximizing efficiencies within city operations." He seeks a lower burden achieved by growing
  the tax base and finding efficiencies, and simultaneously commits to funding first responders and
  expanding homeless services — he proposes no reduction in public services, which is what the
  tax-cutting chairs require, and no increase aimed at wealthy people or large companies, which is
  what the redistributive chairs require.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — transportation-priorities — no
  chair-locating position found. "Improving infrastructure" (Community Impact, March 6 2025) is
  about infrastructure generally, and his answer that the TKI airport expansion "should benefit all
  residents and align with the community's needs" while he awaits "the necessary data and
  projections" is explicitly a deferred judgment. Neither states where city transportation
  investment should go as between roads, transit, and pedestrian and cycling infrastructure.

### Michael Jones — Council Member At-Large Place 2 — `09dbafc2-9252-40e4-9a1c-afda5b069f2e`

Sourced: `growth-and-development` = 3 (authored in migration 1419). The remaining 6 attempted
topics are blank. His pre-existing `economic-development` row (KEPT by 222-02) was not touched.

- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — civil-rights — no on-topic
  position found. His stated interest in "meeting different, diverse people and seeing... what are
  the issues in the community" (Community Impact, June 12 2023) is about how he intends to serve,
  not a position on civil-rights enforcement, equity requirements, or race-conscious programs.
  Nothing about his own background was used for this topic — that is the A3 identity-inference
  defect the 222-01 audit deleted from four other Collin records.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — healthcare — no statement
  found on the government's role in healthcare access.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — local-immigration — no
  statement found on McKinney PD's relationship to federal immigration enforcement, ICE detainers,
  or information sharing.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — residential-zoning — no
  position found on housing density or neighborhood character. His remark that on the MEDC board he
  learned "what you can do with land and property rights; it's a big deal" (Community Impact, June
  12 2023) is about what he learned, not a position on density or rezoning, and he is not quoted in
  the Oct. 28 2025 apartment rezoning coverage.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — taxes — **researched, chair
  pending methodology ruling (would be 3).** "Maintaining low tax rates during the high inflationary
  period we are facing will be a top issue to address for years to come" (Community Impact, April 3
  2023); he says he will "work to ensure meaningful tax relief for our citizens, and work to
  maintain our status as one of safest cities in America by supporting our first responders"
  (Community Impact, June 2023); his campaign site pairs "Meaningful tax relief for citizens" with
  supporting first responders, maintaining parks and funding infrastructure, and he argued the
  airport expansion would deliver its benefits "without raising taxes." At the June 17 2025 meeting
  he asked the CFO to examine a general homestead exemption for all McKinney homeowners. He holds
  rates down while explicitly funding existing services rather than scaling them back, and seeks no
  increase aimed at wealthy people or large companies.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — transportation-priorities — no
  chair-locating position found. His campaign site's "Infrastructure improvements for congestion
  relief and road quality" is road-focused but does not state a position as between roads, transit,
  and pedestrian and cycling investment; silence on transit is not opposition to it. His support for
  commercial service at McKinney National Airport is about aviation and regional connectivity, not
  about where local surface-transportation money should go.

### Justin Beller — Council Member District 1 — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723`

Sourced: none. All 8 attempted topics are blank. This is a correct outcome, not a skipped research
pass — he ran unopposed in 2025 so no candidate questionnaire exists for that cycle, and his
substantive public record in this window is concentrated on housing, zoning and homelessness, all
three of which he already holds.

- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — civil-rights — no on-topic
  position found. "East McKinney has some unique needs that need to be quantified and advocated
  for" (Community Impact, 2021 new-member profile) is about geographic equity in city investment,
  not a position on civil-rights enforcement, equity requirements, or race-conscious programs.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — economic-development —
  **previously deleted by 222-02 (B2: profession plus bond-committee service plus a "suggests"
  inference) and re-researched this session; it stays blank.** No statement or vote of his was found
  that takes a position on incentives, abatements, community-benefit conditions or job-quality
  requirements. His banking career and his service on the 2017 bond committee are adjacency and were
  deliberately not used; his remark that McKinney sits in "a high-employment zone" was made about a
  specific rezoning case and belongs to the zoning topic he already holds.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — growth-and-development — no
  chair-locating position found. "That growth is going to impact old McKinney and try to change the
  culture and dynamics of old McKinney, and so [it's] just managing that in a way that the people
  who live here will benefit" (Community Impact, 2021) describes who should benefit from growth, not
  the pace at which it should be approved, whether infrastructure capacity should gate it, or
  whether permitting should be streamlined. His Feb. 20 2026 strategic-goals emphasis on
  "infrastructure" and community trust is a priority ranking, not a growth-pace position.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — healthcare — no statement
  found on the government's role in healthcare access.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — local-immigration — no
  statement found on McKinney PD's relationship to federal immigration enforcement, ICE detainers,
  or information sharing.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — public-safety-approach —
  **previously deleted by 222-02 (B2: real dated votes, but homelessness-criminalization votes used
  to set a public-safety chair — cross-topic inference) and re-researched this session; it stays
  blank.** No statement of his was found on police funding levels, staffing, pay, or crisis-response
  and co-responder teams. His Oct. 21 2025 dissents and the reasons he gave for them ("Until we have
  resources in place that gives them an option, I think we are just pushing them further into that
  hard place") are on-topic for homelessness — which he already holds — and were deliberately not
  carried across to this topic, since doing so would reproduce exactly the defect just removed.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — taxes — no chair-locating
  position found. No statement or individually-attributed vote of his was located on the balance
  between what the city collects and what it spends; he is not quoted in the FY 2025-26 budget or
  tax-rate coverage or in the June 17 2025 homestead-exemption coverage.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — transportation-priorities — no
  chair-locating position found. His "infrastructure" emphasis at the Feb. 20 2026 strategic-goals
  work session and his observation that a rezoning site sits "at the intersection of two arteries
  near two major highways" are not positions on mode priority.

### Patrick Cloutier — Council Member District 2 — `27578980-2e6c-4639-879a-70b510566d0f`

Sourced: none applied. All 6 attempted topics are blank, one of them pending the taxes methodology
ruling. His pre-existing rows on the five topics he already held were not touched.

- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — civil-rights — no on-topic
  position found. His concern that a quadrant of McKinney with "concentrations of poverty" and
  residents without vehicle access has no grocery store (Community Impact, Feb. 10 2022) is a food-
  access and land-use observation, not a position on civil-rights enforcement, equity requirements,
  or race-conscious programs.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — economic-development —
  **previously deleted by 222-02 (B2: board membership plus profession plus "aligned with") and
  re-researched this session; it stays blank.** No statement or vote of his was found stating a
  posture on incentives, abatements, community-benefit conditions or job-quality requirements. His
  MEDC board service and his career as a financial advisor are adjacency and were deliberately not
  used. His observation that "When you see a lot of the development that we do, a lot of it is with
  the thought of sales taxes, because if we can collect those, that puts downward pressure on our
  property tax rates" (Community Impact, Sept. 3 2025) is a tax-base argument recorded under `taxes`
  below, not an incentive posture, and reusing it here would be cross-topic inference.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — growth-and-development — no
  chair-locating position found. "Traffic strains are hard in growing areas" and "The state took
  away our ability to restrict multifamily last year" are about traffic and about state pre-emption
  of local zoning authority — and he already holds `residential-zoning`, so carrying the second
  remark across would be cross-topic inference. His description of east McKinney redevelopment as
  "a once-in-a-multigeneration opportunity" states no position on growth pace or permitting.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — healthcare — no statement
  found on the government's role in healthcare access.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — local-immigration — no
  statement found on McKinney PD's relationship to federal immigration enforcement, ICE detainers,
  or information sharing.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — taxes — **researched, chair
  pending methodology ruling (would be 3).** Ahead of the Sept. 2 2025 vote adopting a $942M budget
  and a rate cut from $0.415513 to $0.412284, Cloutier said "To me, it comes down to downward
  pressure on the property tax rate is so important" and explained the mechanism: "When you see a
  lot of the development that we do, a lot of it is with the thought of sales taxes, because if we
  can collect those, that puts downward pressure on our property tax rates," adding "This is not a
  decision that's really made in a day... some of them are really tough, and they mean saying no to
  people" (Community Impact, Sept. 3 2025). At the June 17 2025 homestead-exemption item he said
  "This is going to reduce the taxes for every homeowner and even more so for every over-65 and
  disabled [homeowner]." He lowers the rate by broadening the sales-tax base inside a budget that
  grew and added 27 staff — he scales no services back, which the tax-cutting chairs require, and
  seeks no increase aimed at wealthy people or large companies.

### Geré Feltus — Council Member District 3 — `23ba75d2-6eed-4b71-9669-78ab3bb82e98`

Sourced: none applied. All 7 attempted topics are blank, one of them pending the taxes methodology
ruling.

- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — civil-rights — no on-topic
  position found. "The question I pose is, 'Who does McKinney want to be?' That we have to figure
  out" (Community Impact, 2021) is about civic identity, not a position on civil-rights enforcement,
  equity requirements, or race-conscious programs. Nothing about her own background was used — that
  is the A3 identity-inference defect the 222-01 audit deleted from four other Collin records.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — economic-development —
  **previously deleted by 222-02 (B2: EDC board membership plus a "suggesting"/"indicating" chain of
  inference) and re-researched this session; it stays blank.** Her campaign priorities page does
  contain a real, on-topic sentence — "I will support the aggressive recruitment of forward-thinking
  companies in strategically targeted industries" (feltus4mckinney.com/priorities) — and she has
  said "One way to balance that out is to have a larger corporate tax base. We still have to keep a
  good focus on good economic development" (Community Impact, 2021). But "strategically targeted
  industries" points at the targeted-incentives chair while "aggressive recruitment" points at the
  compete-actively-for-major-employers chair, and she names no incentive or abatement posture, no
  community-benefit agreement and no job-quality requirement that would separate them. Two adjacent
  chairs remained live, so no chair was assigned; range-narrowed is not chair-located. Her MEDC work
  was deliberately not used.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — growth-and-development — no
  chair-locating position found. "We must work with state legislators to restore local control over
  the 45 square miles left in our ETJ, where the population is growing without equitably
  contributing to taxes that fund roads, libraries, and parks" (Community Impact, March 5 2025) is
  about extraterritorial jurisdiction authority and tax equity, and her remark that the airport
  expansion "will drive economic growth, attract new businesses, and create sustainable jobs" is
  about one project. Neither states a position on the pace at which growth should be approved,
  infrastructure gating, or permitting.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — healthcare — no statement found
  on the government's role in healthcare access. She is a board-certified family physician and her
  campaign priorities page carries pandemic-era remarks about vaccine allocation and using her
  clinical experience to guide the city's recovery, but professional background is adjacency and a
  vaccine-logistics remark is not a position on how healthcare coverage should be financed or
  provided.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — local-immigration — no statement
  found on McKinney PD's relationship to federal immigration enforcement, ICE detainers, or
  information sharing.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — public-safety-approach —
  **previously deleted by 222-02 (B2: "public safety is my top priority" does not distinguish this
  chair from its neighbour, and the reasoning cited a vote pointing the other way) and re-researched
  this session; it stays blank.** Her campaign priorities page says "It is imperative that we focus
  on keeping McKinney the safest place for our children to flourish and for all of our residents to
  thrive" and, per the same page, supports police and fire staffing, training and the Neighborhood
  Police Officer program while collaborating with public safety officials on the community's growing
  mental-health needs; her 2025 questionnaire adds only "we've strengthened public safety"
  (Community Impact, March 5 2025). Expanding staffing points at the increase-staffing-and-equipment
  chair while the mental-health collaboration points at the keep-current-funding-plus-crisis-
  response chair, and the mental-health language is exploratory rather than a commitment to
  co-responder or crisis teams. Two adjacent chairs remained live, so no chair was assigned.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — taxes — **researched, chair
  pending methodology ruling (would be 3).** At the June 17 2025 over-65 homestead-exemption item
  she gave her own reason for not increasing the exemption further: "I don't see the need for us
  right now given how much we need to operate the city with the amount of growth that we have, with
  the amount of roads that need to be constructed, with the number of city services that we have to
  provide as people are moving in," while also saying "When we're looking at shifting tax burden
  this is one of the things that we sort of weigh" and "We don't want seniors to be caught in a
  position where they're struggling every year as taxes increase because their home values are
  increasing" (Community Impact, June 19 2025). Her 2025 questionnaire records that over four years
  the council "lowered property tax rates, increased senior homestead exemptions" (Community Impact,
  March 5 2025). She declines to give up revenue precisely in order to keep funding existing
  services — she scales nothing back, which the tax-cutting chairs require — and she seeks no
  increase aimed at wealthy people or large companies.

### Rick Franklin — Council Member District 4 (Mayor Pro Tem) — `6ee726c1-79af-4fef-abb8-fa7f4208ae14`

Sourced: none. All 6 attempted topics are blank. His pre-existing `residential-zoning` row (KEPT by
222-02) was not touched. He ran unopposed in 2023, so no candidate questionnaire exists for that
cycle, and Community Impact's 2019 Q&A page would not render its answer body on either URL form.

- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — civil-rights — no on-topic
  position found.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — economic-development —
  **previously deleted by 222-02 (B2: board membership plus profession; "actively supports" asserted
  without a quote or vote) and re-researched this session; it stays blank.** No statement or vote of
  his was found stating a posture on incentives, abatements, community-benefit conditions or
  job-quality requirements. His prior service on the McKinney Economic Development Corporation and
  his career as a commercial real estate broker are adjacency and were deliberately not used —
  re-deriving the same chair from the same material would reinstate the defect just removed.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — growth-and-development — no
  chair-locating position found. His only on-record remark in the development coverage read this
  session is case-specific praise for one applicant's mitigation work — "You've done an incredible
  job of mitigating that for the residents out there. You've done an awesome job with this site
  plan, and I'm in favor of it" (Community Impact, Oct. 28 2025) — which belongs to the zoning topic
  he already holds and states no position on growth pace, infrastructure gating, or permitting.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — healthcare — no statement
  found on the government's role in healthcare access.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — local-immigration — no
  statement found on McKinney PD's relationship to federal immigration enforcement, ICE detainers,
  or information sharing.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — taxes — no chair-locating
  position found. No statement or individually-attributed vote of his was located on the balance
  between what the city collects and what it spends; he is not quoted in the FY 2025-26 budget or
  tax-rate coverage or in the June 17 2025 homestead-exemption coverage, and his campaign site no
  longer resolves.

### Bill Cox — Mayor — `1c31b159-d4c1-4756-ba81-a247dbf0af8f`

Sourced: none. All 6 attempted topics are blank. His pre-existing rows on the five topics he already
held were not touched.

- Bill Cox — McKinney — `1c31b159-d4c1-4756-ba81-a247dbf0af8f` — civil-rights — no on-topic position
  found. His campaign site's line that "His vision for McKinney includes fostering a vibrant,
  inclusive, and prosperous community" that meets the needs of a "growing and diverse population"
  (coxformayor.com/about) is a statement about civic tone and demographics, not a position on
  civil-rights enforcement, equity requirements, or race-conscious programs.
- Bill Cox — McKinney — `1c31b159-d4c1-4756-ba81-a247dbf0af8f` — growth-and-development — no
  chair-locating position found. "I've seen it when it was a small town, and I've seen what it is
  now, and I understand completely what it will take to take McKinney into the future" (KERA, March
  25 2025) is about his own experience, and his campaign framing about ensuring development
  "enhances — rather than diminishes — the qualities that make our city special" states no position
  on the pace at which growth should be approved, on infrastructure gating, or on permitting. His
  chairmanship of the Planning and Zoning Commission, and that body's January 2025 approval of the
  airport expansion site plan, are service history and a body's action rather than his own stated
  growth-pace position, and were deliberately not used.
- Bill Cox — McKinney — `1c31b159-d4c1-4756-ba81-a247dbf0af8f` — healthcare — no statement found on
  the government's role in healthcare access.
- Bill Cox — McKinney — `1c31b159-d4c1-4756-ba81-a247dbf0af8f` — homelessness — **narrowed but not
  located; blank.** He is genuinely on the record: "We are a fast-growth city and along with that
  comes a population that needs addressing," "These questions about homeless and the unhoused are
  not exclusive to McKinney," "We are getting out front and going to be active and implement
  ordinances that ensure the safety of our citizens and the viability of our businesses" and "And at
  the same time, you have to be compassionate. The question of homelessness looks very different to
  many different people" (NBC 5 DFW), and he voted for both Oct. 21 2025 ordinances (Community
  Impact: 6-1 and 5-2, with only Beller, and Beller plus Feltus, against). That rules out the chairs
  that protect the right to sleep in public or decriminalize public sleeping, and — because McKinney
  had no adequate shelter capacity when he voted — the chair permitting enforcement only once
  adequate beds exist. But "you have to be compassionate" is not a shelter commitment, and no
  statement of his was found on shelter capacity or on what services should accompany the ban, so
  the prohibit-with-penalties-while-maintaining-shelter chair and the ban-and-rely-on-existing-
  services chair both remain live. Range-narrowed is not chair-located, so no chair was assigned.
  (This is the precise evidentiary difference from Ernest Lynch, whose own words do commit the city
  to adding shelter capacity.)
- Bill Cox — McKinney — `1c31b159-d4c1-4756-ba81-a247dbf0af8f` — local-immigration — no statement
  found on McKinney PD's relationship to federal immigration enforcement, ICE detainers, or
  information sharing.
- Bill Cox — McKinney — `1c31b159-d4c1-4756-ba81-a247dbf0af8f` — taxes — no chair-locating position
  found. KERA (Feb. 18 2025) lists "lowering property taxes" among his campaign priorities alongside
  "smart corporate growth" and "preserving city charm", but that is an issue-list mention rather
  than a statement of what he would do about the balance between collections and services; his
  campaign site carries no tax position on the pages that resolve, and the FY 2025-26 rate cut he
  presided over came with no statement of his own attributed in any coverage read this session. This
  pair would remain blank whichever way the taxes methodology question is ruled.

**McKinney reconcile:** 49 (person, topic) pairs attempted; 2 sourced and authored in migration
`1419_222_mckinney_gapfill_stances.sql`; 47 blank-registered above. 2 + 47 = 49. Ernest Lynch and
Michael Jones appear in both buckets (an applied row plus their unsourced topics listed here);
Justin Beller, Patrick Cloutier, Geré Feltus, Rick Franklin and Bill Cox appear in this register
only, with zero newly applied stances — a correct outcome under D-04, not a skipped pass. No
(person, topic) pair appears in both buckets, and no pair outside the 49-pair gap list was
researched, written, or touched. All 7 previously-deleted McKinney pairs that fall in this scope
were re-researched and all 7 remain blank; none was reinstated. Zero `taxes` rows were written; the
four members with real tax evidence are marked above as pending the operator's methodology ruling.

---

## RULING: `taxes` is structurally unanswerable for municipal officeholders (2026-07-25)

**Operator decision, 2026-07-25.** Every `taxes` entry in this register — the four Plano members
(Maria Tu, Rick Horne, Chris Krupa Downs, Vidal Quintanilla) and the four McKinney members (Ernest
Lynch, Michael Jones, Patrick Cloutier, Geré Feltus) who were marked "pending the taxes methodology
ruling" above — is now a **CONFIRMED BLANK**. No `taxes` chair was applied for any of them, and none
will be applied for the remaining plans 222-05 … 222-17.

Why. The `taxes` scale (`f7e5678d-dadd-4556-a2fc-446e24642ceb`) reads:

| Chair | Requires |
|---|---|
| 1 | Significantly raise taxes **on wealthy people and large companies** to fund more services |
| 2 | Moderately raise taxes **on wealthy people and large companies** to fund existing services |
| 3 | Keep the current tax system mostly as-is with small adjustments to close unfair loopholes |
| 4 | Cut taxes for everyone **and scale back public services** to match |
| 5 | Drastically cut taxes and shrink government |

Texas cities levy a uniform ad-valorem property tax. They cannot tax by wealth or company size, so
chairs 1–2 are outside municipal power; they do not cut services to match rate cuts, so chairs 4–5
do not occur. Chair 3 is the only structurally reachable chair, which means it carries no
discriminating information — and it actively misrepresents. Tu and Horne argued **for** Plano's 2025
rate increase, Quintanilla cast the **lone vote against** it, Downs campaigned on holding rates down
via commercial-base growth; Cloutier pushed rate cuts while Feltus **declined** a further exemption
increase specifically to protect service funding. All eight would have rendered as the identical
chair 3. Tu and Horne voted to *raise* the rate, which "keep the current system mostly as-is" does
not describe at all — the scale has no chair for "raise uniform property taxes to fund existing
services."

Assigning the middle chair because the outer four are unreachable is defaulting to a middle value,
which this phase's own prohibitions forbid even where each row cites a real, dated quote. Blank is
therefore the correct terminal state, and it is a SUCCESS outcome under D-08.

**The research is preserved, not discarded.** Each person's tax evidence is recorded verbatim in
their entry above, so if the Local Lens `taxes` question is later rewritten with a municipal scope
(e.g. chairs spanning "raise the rate to fund services" → "cut the rate and accept service
reductions"), these eight can be placed from the existing evidence without re-researching.

**Follow-on logged:** the Local Lens `taxes` question needs a municipal-scope rewrite before any
city officeholder can be placed on it. Note `healthcare` has the same shape for the opposite reason
— all five of its chairs describe national healthcare policy, which is why every `healthcare` pair
in this phase is blank and correctly so.

---

## Follow-on integrity remediation — bio-page-only row (2026-07-25)

One further defect was found after plan 222-02 closed, while cross-checking Phase 222 against the
pre-existing `C:/EV-Accounts/.planning/todos/2026-07-24-party-prior-stance-contamination-audit.md`.
That audit measures 907 rows nationally whose only source is a Ballotpedia **biography** URL — a
page carrying no stance content in either direction. Exactly one such row existed in Collin scope.

Deleted via `1420_222_barrios_healthcare_bio_only_remediation.sql` (C:/EV-Accounts, AUDIT-ONLY,
**APPLIED to production 2026-07-25** on explicit operator authorisation, separate from the 27 pairs
approved for migration 1416). Verified after apply: absent from both tables; zero bio-page-only rows
now remain anywhere in the 24-government Collin scope.

- Dan Barrios — Richardson — `e8c863a7-d116-480e-a81f-47d26f45e264` — healthcare — **bio-page-only**: the row's sole source was `https://ballotpedia.org/Dan_Barrios`, a biography page with no stance content, so it could not support a chair on healthcare or anything else. It survived plan 222-02 because that plan's Class A1 signature required `sources IS NULL` — this row had a source, just a useless one. Barrios's other two defective rows (civil-rights, homelessness) were deleted by 222-02; this was the third and last in scope.

---

## City of Allen (4801924) — 222-05

**Attempted:** 2026-07-25, the one un-stanced Allen officeholder on the 222-01 live worklist —
Mayor Chris Schulmeister — against all 11 canonical compass topics. The other seated Allen
officeholders already hold stances and were out of scope per D-07; none of their rows was read,
re-reasoned, or modified by this plan (several were remediated earlier on 2026-07-25).

**Evidence checked:** Community Impact Newspaper's Allen bureau — the March 17, 2026 pre-election
mayoral candidate Q&A (the only genuine questionnaire found for this race), the May 12, 2026
"Meet Allen's new mayor" Q&A, the May 2 result story, and the swearing-in coverage; KERA News
(April 16, 2026 race preview and May 2, 2026 result story); Star Local Media / Allen American,
"Allen Mayor Chris Schulmeister shares his vision, priorities," July 10, 2026; tx3dnews.com's Allen
mayor-race candidate profile (April 2026); Bisnow Dallas-Fort Worth's September 2, **2019**
multifamily-approvals feature, which carries his own account of a council vote; Texas Scorecard's two
Allen high-density-development stories; cityofallen.org's City Council page (which confirmed him as
mayor, term 2026–2029, with no bio text); League of Women Voters of Collin County / VOTE411. Allen,
**Texas** was confirmed on every source used, and his identity as the Allen TX council member
(Place 4, 2019–2025) and now Allen TX mayor was confirmed before the 2019 council vote below was
accepted as his.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position: `chrisforallen.org` returned HTTP 404 to every fetch, at both the root and `/meet-chris/`
and with and without the `www.` prefix, so **his campaign platform pages were never read**. This is
the most significant gap: search-result snippets suggest that site carries specific claims about
police and fire pay, training and equipment, and about parks and trails, either of which could bear
on `public-safety-approach` or `transportation-priorities` if the actual page text could be read.
No chair was assigned from a snippet. Also unreadable: `ballotpedia.org`'s individual candidate page
for him resolved but returned an empty body (no Candidate Connection survey surfaced in search
either); `lwvcollin.org/voters-guides` and `cityofallen.org/directory.aspx` both returned HTTP 403.
A later pass with working access to the campaign site, Ballotpedia, and the LWV Collin voters guide
may find additional evidence.

### Chris Schulmeister — Mayor — `698da6ca-eadd-46a0-8e27-94ae48d23279`

Sourced: `residential-zoning` = 3 (applied via migration 1421). The remaining 10 topics are blank:

- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — housing — no position found
  on government's role in housing affordability. His answer to Community Impact's March 17, 2026
  question about uses for Allen's remaining land — "Regardless of the type of development, whether
  it be housing, retail or commercial, we must focus on innovative solutions that complement the
  neighborhood in which the development occurs" — is about development compatibility, not about
  subsidies, rent regulation, inclusionary requirements, permitting reform, or public development.
  His campaign's "affordability" theme, as he himself defines it in the same Q&A, is about property
  tax bills and water and wastewater costs, not housing prices. His 2019 statement that "multifamily
  is what millennials are seeking and we have to be able to compete against neighboring cities"
  (Bisnow) is about market supply and regional competitiveness, and applying it to the housing
  affordability scale would be cross-topic inference, which is prohibited.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — civil-rights — no on-topic
  position found. Nothing in his campaign coverage, his two Community Impact Q&As, or the Star Local
  Media interview addresses civil-rights enforcement, equity requirements, or race-conscious
  programs. His support for the Community Engagement Advisory Board's "Table Talk" program
  (Community Impact, March 17, 2026) is a civic-engagement initiative, not a civil-rights position.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — homelessness — no statement
  found on public camping, encampments, enforcement, or homelessness response.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — economic-development — no
  position found on incentives, abatements, or community-benefit conditions. His service on the
  Allen Economic Development Corporation and Community Development Corporation boards
  (Community Impact, May 12, 2026) is service history, not a position, and was deliberately not
  used — that is the exact adjacency defect deleted from two other Allen records on this same topic
  on 2026-07-25. Listing "Economic Development" among the areas he wants Allen to stay on a
  "success trajectory" in (tx3dnews candidate profile) names the subject without locating a chair on
  incentive aggressiveness.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — local-immigration — no
  statement found on the Allen Police Department's relationship to federal immigration enforcement,
  ICE detainers, or information sharing. Texas SB4's statewide bar on sanctuary policies is state
  law, not his position, and was deliberately not used as a default — that is the A4 defect the
  222-01 audit deleted from two Plano records.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — public-safety-approach — the
  available language is real but too generic to locate a chair. He told tx3dnews he is running "to
  ensure Allen stays on a success trajectory with regard to Public Safety, Economic Development,
  Transportation, Water/Waste management and investing in our aging neighborhoods and
  infrastructure, and doing so in a fiscally sound manner," and that profile summarises his platform
  as maintaining fiscal discipline while supporting police, fire and emergency services. That does
  not distinguish holding current funding from increasing staffing, equipment and pay, and it names
  no crisis-response or co-responder component. Allen's $97M police headquarters, built during his
  council tenure, was deliberately not used — a capital project completed while someone held office
  is not that person's stated position, and that exact inference was deleted from another Allen
  record on 2026-07-25. Search snippets indicate his campaign site claims credit for police and fire
  pay, training and equipment levels, which could locate chair 4, but that site returned HTTP 404 and
  the page text was never read, so nothing was assigned from it.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — transportation-priorities —
  no statement found on mode priorities. "Transportation" appears in his list of focus areas
  (tx3dnews) and among the 2045 Comprehensive Plan's subject headings he says he will work through
  (Community Impact, May 12, 2026; Star Local Media, July 10, 2026), but nothing found sets roads and
  traffic capacity against transit, bike or pedestrian investment. His term on the North Central
  Texas Council of Governments Regional Transportation Council (2020–2024) is service history, not a
  position, and was deliberately not used.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — taxes — **researched, no
  chair written per the 2026-07-25 taxes ruling** (see "RULING: `taxes` is structurally
  unanswerable for municipal officeholders" above). This is not an absence of evidence — his
  evidence is among the most explicit found anywhere in this phase, and is preserved here verbatim
  so it can be placed if the question is ever rewritten with municipal scope. Community Impact,
  March 17, 2026, asked what the biggest challenge facing Allen residents is: *"The cost of living.
  Increasing assessed values for property owners has become a struggle. This growth needs to be
  balanced with a tax rate that provides Allen residents with the level of services they expect.
  Additionally, managing the cost of water and wastewater impacts the cost of living."* Asked how he
  would address it: *"During my six years on Council, I voted to reduce the tax rate every year. A
  5% Homestead Exemption was adopted. The level of city services may need to be adjusted, and I will
  work with City staff and citizens to prioritize services, continuing my efforts toward further tax
  relief."* Six years of recorded rate-reduction votes, plus an explicit willingness to adjust
  service levels and pursue further relief, would point at chair 4 on the current scale — but chair 4
  reads "Cut taxes for everyone and scale back public services to match," and a uniform ad-valorem
  city property-tax rate is not a tax "for everyone" in the sense chairs 1–5 are written around, so
  the ruling stands and no row was written.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — growth-and-development — no
  chair-locating statement found. His central and much-repeated theme is that Allen "transitioned
  from decades of rapid growth to a mature city" (KERA, May 2, 2026; the same framing in Community
  Impact's March 17 and May 12, 2026 Q&As and in Star Local Media, July 10, 2026), and that the 2045
  Comprehensive Plan and reinvestment in aging neighborhoods and infrastructure are how he will
  manage it. That is a description of where Allen is in its life cycle plus a commitment to
  reinvestment, not a position on growth pace: it does not choose between allowing growth only where
  infrastructure already supports it, investing in infrastructure ahead of growth, streamlining
  permitting to recruit development, or capping growth outright. Notably absent is any
  build-ahead-of-growth commitment of the kind that located this chair for another Collin mayor.
- Chris Schulmeister — Allen — `698da6ca-eadd-46a0-8e27-94ae48d23279` — healthcare — no statement
  found on healthcare access. Expected: all five chairs on this scale describe national healthcare
  policy, which a mayor holds no position on by role. No health-adjacent remark was stretched into a
  chair.

**Allen reconcile:** the one worklist name appears in bucket 1 (an applied migration row for
`residential-zoning`) and additionally lists his 10 unsourced topics here — the Allen worklist has no
name in neither bucket, and no (person, topic) pair appears in both.

---

## City of Richardson (4861796) — 222-06

**Attempted:** 2026-07-25, the one un-stanced Richardson officeholder on the 222-01 live worklist —
Council Member Curtis Dorian (District 1 / Place 1) — against all 11 canonical compass topics. The
other six seated Richardson officeholders already hold stances and were out of scope per D-07; none
of their rows was read, re-reasoned, or modified by this plan (Omar's, Shamsul's and Barrios's rows
were remediated earlier on 2026-07-25).

**Evidence checked:** Community Impact Newspaper's Dallas-Fort Worth / Richardson desk, which is by
far the richest source for this council — the May 14, 2026 Greenwood Park rezoning story, the
May 26, 2026 CDBG story, the May 21, 2026 Unified Development Code story, the February 6, 2026
comprehensive-zoning-ordinance story, the June 11, 2026 Interurban / Solow Garage story, the
June 9, 2026 water and wastewater rate story, the October 7, 2025 bond-priorities story, the
May 1, 2025 89-townhome approval, the February 11, 2025 downtown 279-apartment approval, the
June 10, 2025 Amazon drone-hub split vote, the February 14, 2025 candidate-filing story, and the
April 10, **2023** Place 1 candidate Q&A (the only genuine questionnaire found for him — he ran
unopposed in 2025, so no 2025 questionnaire appears to exist); *The Wheel* (marksteger.com), the
long-running Richardson council-recap blog, for the May 20, 2026 CDBG/UDC meeting, the
February 23, 2026 DART meeting, the July 20, 2026 vacancy-appointment meeting and the October 2024
comprehensive-plan review; and justinneth.substack.com's meeting write-ups, including the
September 8, 2025 FY26 tax-rate public hearing. Richardson, **TEXAS** was confirmed on every source
used — the homonym gate matters unusually much here, since "Richardson" is also a common surname and
a city name in other states, and since Richardson TX spans Dallas and Collin counties. His identity
as the Richardson TX Place 1 / District 1 council member (elected May 2023, re-elected unopposed
May 3, 2025 with 8,009 votes) was confirmed before any evidence was accepted as his.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position: **every `www.cor.net` URL attempted returned HTTP 403**, including his official
council-member page (`/government/city-council/who-are-our-city-council-members/curtis-dorian`) and
the city's news / Week-in-Review pages, so the official City of Richardson site was never read and
**no city agenda packet, minutes document, or meeting video was ever opened** — every recorded vote
below is known only through news coverage of it. This is the single biggest gap: Richardson posts its
agenda packets and meeting video, and a pass with working cor.net access would very likely find
on-the-record remarks on public safety, the tax rate, and specific zoning cases that this pass could
not reach. Also unreadable: `ballotpedia.org`'s individual candidate page for him
(`/Curtis_Dorian_(Richardson_City_Council_Place_1,_Texas,_candidate_2025)`) resolved but returned an
**empty body**, as did `/City_elections_in_Richardson,_Texas_(2025)` — the same Ballotpedia
empty-body failure seen throughout this phase, which is a fetch failure and not evidence of absence.
No Richardson Place 1 questionnaire was found on VOTE411 / League of Women Voters of Collin County.
His campaign Facebook page (`facebook.com/CurtisDorianforRichardson`) was not fetched — social-media
posts are not treated as evidence of a policy position absent a direct citable quote, and Facebook is
not fetchable here.

### Curtis Dorian — Council Member District 1 — `6b512b29-d3c1-4709-829f-df78664ffee1`

Sourced: `housing` = 3 (migration 1422, **authored — awaiting operator apply**). The remaining 10
topics are blank:

- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — residential-zoning —
  **DEMOTED TO BLANK BY THIS PLAN'S TIER-1 SELF-AUDIT.** A chair was drafted from his own remarks at
  the May 11, 2026 unanimous Greenwood Park rezoning vote (40 compact single-family detached homes
  with reduced lot areas, reduced setbacks and increased lot coverage, on the decommissioned
  Cottonwood Creek nursing-home site on West Shore Drive) — "We're always taking into consideration
  that we do need some middle ground housing. I don't want anyone thinking that we're walking away
  from this as an opportunity because this is the right product for this particular area" — read
  alongside his October 2024 comprehensive-plan remarks that "we do need to create new
  infrastructure, new buildings, new mixed-use, new areas where people can call home." The re-fetch
  of the source confirmed the quotes are genuine but also confirmed that he says **nothing** about
  where middle housing should be allowed, nothing about multifamily, nothing about neighborhood
  character, and nothing about community votes on rezoning. His affirmation of "middle ground
  housing" is chair 2's subject matter (modest density increases such as duplexes and accessory
  units); his support for new mixed-use districts is chair 3's subject matter (multifamily and
  mixed-use near commercial corridors); nothing resolves between them, and chair 3's second clause —
  protecting most residential zones — would have to be inferred from his silence rather than from
  anything he said. Suggestive but not explicit is a blank. Separately, his two other rezoning votes
  (89 townhomes at 3600 Shiloh Road, unanimous April 28, 2025; 279 downtown apartments on Polk
  Street, February 10, 2025) were deliberately not used — he is not quoted in either, and a generic
  unanimous rezoning approval with no stated reason is the exact defect deleted from an Allen record
  on 2026-07-25. His profession — he is a land-development and design-build contractor and president
  of the Dorian Bahr Company — was likewise not used; profession is adjacency, not a position.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — civil-rights — no on-topic
  position found anywhere. Nothing in his council remarks, the 2023 candidate Q&A, or any coverage
  addresses civil-rights enforcement, equity requirements, or race-conscious programs. Note that the
  two other Richardson `civil-rights` rows in production (Omar, Shamsul) were **deleted** on
  2026-07-25 for being inferred from ethnicity, religion or birthplace — that inference class is
  forbidden and was not repeated here.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — homelessness — no statement
  found on public camping, encampments, enforcement, citations, or shelter capacity. A targeted
  search for a Richardson encampment or panhandling ordinance debate turned up no council item at
  all in 2025–2026, let alone a Dorian remark on one.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — economic-development — no
  position found on incentives, abatements, or community-benefit conditions. Richardson does use
  Chapter 380 agreements, but no Dorian statement or attributed vote on any incentive deal was found.
  Listing "Economic development, infrastructure and revitalization" as his top priorities in the
  April 10, 2023 Community Impact Q&A names the subject without locating a chair on incentive
  aggressiveness — exactly the generic-priority-list defect this phase has repeatedly refused. His
  Richardson Chamber of Commerce membership was deliberately not used: membership is adjacency, and
  chamber/EDC-board adjacency was the basis of rows deleted from two Allen records on 2026-07-25.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — local-immigration — no
  statement found on the Richardson Police Department's relationship to federal immigration
  enforcement, ICE detainers, or information sharing. Texas SB4's statewide bar on sanctuary policies
  is state law, not his position, and was deliberately not used as a default — that is the A4 defect
  the 222-01 audit deleted from two Plano records.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — public-safety-approach — no
  chair-locating statement found. He is not quoted on police staffing, funding levels, pay,
  equipment, or crisis-response or co-responder programs in any source reachable this session; the
  October 6, 2025 bond work session listed a new Fire Station 7 among candidate projects but that
  item is not attributed to him. His Citizens Police Academy and Citizens Fire Academy attendance and
  his volunteering with the Richardson police and fire departments (2023 Q&A; his official bio) are
  service history and civic participation, not positions, and were deliberately not used — that is
  the adjacency defect deleted from Allen records on 2026-07-25. Because cor.net returned HTTP 403
  throughout, the city's own budget-hearing packets and meeting video — the likeliest place for a
  public-safety funding remark — were never read.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — transportation-priorities —
  no statement found that sets any transportation mode against another. His one transportation-shaped
  remark is about capital infrastructure generally: at the October 6, 2025 work session on a
  potential $200M bond (of which roughly $130M was floated for streets and mobility) he said "The
  most important thing to me is to continue building our infrastructure. It's something you don't
  see, so it's not instant gratification, but it's super important for the growth of our city" —
  which, in a discussion that also covered drainage and water, does not choose between road capacity
  and transit, bike or pedestrian investment. He is not quoted at all in the February 23, 2026 DART
  governance and General Mobility Fund items, which the council approved. The Interurban district's
  stated aim of "reducing auto uses" refers to automotive **businesses** (repair garages), not to car
  travel, and was deliberately not read as a mode-priority position.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — taxes — **researched, no
  chair written per the 2026-07-25 taxes ruling** (see "RULING: `taxes` is structurally unanswerable
  for municipal officeholders" above). Unlike Allen's, his evidence on this axis is genuinely thin as
  well: **no statement on the Richardson property-tax rate was found at all**, and he is not
  mentioned anywhere in the September 8, 2025 FY26 tax-rate public-hearing write-up. The nearest
  material is about **utility rates, not taxes**, and is preserved here verbatim so a future
  municipal-scope rewrite can consider it. At the June 8, 2026 council meeting on the water and
  wastewater rate plan (an ~8% annual residential increase under the recommended
  meter-equivalency option, driven by North Texas Municipal Water District increases and an $83.89M
  five-year infrastructure requirement) he said: *"I don't think anyone wants to see an increase in
  utility rates across the board, but it's inevitable that we take care of our infrastructure."* And:
  *"The majority of our population is aging in place. I do want to protect that asset to where it's
  affordable for them to maintain their living environment."* Accepting a rate increase to fund
  infrastructure while asking that the burden on aging residents be limited is a utility-ratemaking
  position, not a taxation-and-public-spending chair, and stretching it onto the taxes scale would be
  cross-topic inference on top of a scale the operator has already ruled unanswerable. No taxes row
  was written.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — growth-and-development — no
  chair-locating statement found. His October 6, 2025 bond remark that continuing to build
  infrastructure is "super important for the growth of our city" is an argument for capital
  reinvestment in a city that is more than 95% built out (he himself framed Richardson's central
  challenge in the 2023 Q&A as "Land use... We have less than 5% land mass"), not a position on
  growth pace: it does not choose between allowing growth only where existing infrastructure can
  already support it, investing ahead of growth, streamlining permitting to recruit development, or
  capping growth outright. Most of his infrastructure language is about **maintaining and replacing
  aging** systems (drainage, water, wastewater, neighborhood rehabilitation), which is not the
  build-ahead-of-growth commitment that located this chair for another Collin officeholder — the same
  distinction that kept the Allen mayor's record blank on this topic. His 2023 Q&A answer, "I plan to
  work alongside the council and the people of Richardson to determine what is the best use of our
  limited space," is a process commitment and locates nothing.
- Curtis Dorian — Richardson — `6b512b29-d3c1-4709-829f-df78664ffee1` — healthcare — no statement
  found on healthcare access. Expected: all five chairs on this scale describe national healthcare
  policy, which a city council member holds no position on by role. His references to Richardson's
  aging population, and the fact that the Greenwood Park site was a decommissioned nursing home, are
  demographic and land-use facts; neither was stretched into a healthcare chair.

**Richardson reconcile:** the one worklist name appears in bucket 1 (a migration row for `housing`,
authored in 1422 and pending operator apply) and additionally lists his 10 unsourced topics here —
the Richardson worklist has no name in neither bucket, and no (person, topic) pair appears in both.
Once 1422 is applied, this reconcile holds against production; until then the name is honestly in
bucket 2 for all 11 topics.

---

## Town of Prosper (4859696) — 222-07

**Attempted:** 2026-07-25, the one un-stanced Prosper officeholder on the 222-01 live worklist —
Councilmember Doug Charles (Place 5) — against all 11 canonical compass topics. The other seated
Prosper officeholders already hold stances and were out of scope per D-07; none of their rows was
read, re-reasoned, or modified by this plan.

**Result: zero chairs. All 11 topics blank.** Prosper contributes no rows to migration 1423.

**Evidence checked:** his own campaign site `dougcharles.com` (home page and `/priorities`, the only
place any first-person policy language exists — "Listen. Plan. Protect.", Transparent Government,
Responsible Growth, Fiscal Responsibility, Community Character, Strategic Commercial Development);
his official Town of Prosper staff-directory profile (`prospertx.gov/directory.aspx?eid=68`, which
loaded fine and confirmed Place 5, term ending May 2029); Community Impact Newspaper's
Prosper–Celina desk (the January 2, 2026 "A completely different town" growth-and-density feature,
the January 14, 2026 candidate-filing story, the February 13, 2026 "who is running" story, the
June 11, 2026 Bella Prosper approval story); and — decisively — the **official Town of Prosper
minutes for the June 9, 2026 Town Council regular meeting**, retrieved as the signed PDF attachment
to the June 23, 2026 agenda on Municode and read in full (6 pages). Prosper, **TEXAS** was confirmed
on every source used, and "Doug Charles" is a common name, so identity was pinned to the Place 5
seat on the official town directory before any evidence was accepted as his.

**HOMONYM / MISATTRIBUTION NEAR-MISS CAUGHT AND REJECTED — read this before any future pass.** A
WebSearch result summary asserted that "Council Member Charles" made the motion to approve the Bella
Prosper rezoning on June 9, 2026 and said *"I greatly appreciate the removal of the multifamily. That
was my large hesitation."* That would have been a clean, dated, on-the-record `residential-zoning`
chair. **It is false.** The official minutes read: *"Mayor Pro-Tem Bartley made a motion to approve a
request for a rezoning of 61.7± acres…"*, *"Motion seconded by Deputy Mayor Pro-Tem Kern"*, and
*"Councilmember **Ray** noted his appreciation for accommodating and the removal of the
multi-family. He has no hesitations to the recommended changes. Councilmember Reeves and Charles
shared their appreciation and hard work on the project."* The multifamily statement belongs to
**Councilmember Marcus E. Ray**, and the motion to Bartley. Charles's only recorded participation is
a shared expression of appreciation and a yes vote in a 6-0 tally. Do not re-import that quote onto
Charles from a search snippet — go to the minutes.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position: `ballotpedia.org/Doug_Charles` returned an **empty body** (the same Ballotpedia
empty-body failure seen throughout this phase — a fetch failure, not evidence of absence). No
VOTE411 / League of Women Voters of Collin County questionnaire was found for Prosper Place 5, and
none is likely to exist: **both 2026 Prosper Town Council races were uncontested** and Charles was
the lone filer for Place 5, so Community Impact published no candidate Q&A for him (it did publish
one for the contested Celina Place 5 race). His campaign Facebook page
(`facebook.com/Doug4TownOfProsperPlace5/`) was not fetched — Facebook is not fetchable here and
social posts are not treated as evidence of a policy position absent a direct citable quote. The
`prospertx.new.swagit.com` meeting **video** for June 9 and June 23, 2026 was not watched (video is
not readable by this pass); the written minutes were read instead. He took office in **May 2026**, so
only two months of council record exist at all — a pass in 2027 will have far more voting record to
work from.

### Doug Charles — Council Member Place 5 — `48500428-3421-4298-b618-613696ca644c`

Sourced: **none.** All 11 topics are blank:

- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — residential-zoning — **the
  closest call in this plan, and deliberately blanked.** Two pieces of real, on-topic material exist.
  (a) His campaign platform's Strategic Commercial Development section names as its focus
  *"Mixed-use commercial developments (retail, dining, office—NOT apartments)"*, and his Community
  Character section says *"We have a character worth preserving… Every zoning decision, every
  development approval, should strengthen what makes Prosper special—not dilute it."* (b) On
  June 9, 2026 he voted, in a 6-0 tally, to approve the Bella Prosper rezoning (ZONE-24-0025, 61.7±
  acres from Agricultural and PD-71 to a mixed-use Planned Development) whose Neighborhood
  Subdistrict allows **86 townhomes by right** with a 1,300 sq ft minimum and 25 ft front setbacks.
  These do not resolve to one chair. Excluding apartments from mixed-use commercial rules out chairs
  3, 4 and 5 (chair 3 explicitly allows multifamily near commercial corridors). But chair 1 requires
  *"require community votes before any rezoning"*, which his own practice contradicts — he voted to
  rezone 61.7 acres with no such condition — and chair 2's operative content, *"allow modest density
  increases (duplexes, accessory units)"*, is something he has never addressed in any source, even
  though approving 86 attached townhomes with heavy design standards is closer to chair 2's subject
  matter than to chair 1's. He is **not quoted giving any reason** for that vote, and a generic
  unanimous rezoning approval with no stated reason is the exact defect the 222-01 audit deleted from
  an Allen record on 2026-07-25 and the Richardson pass refused on 2026-07-25. "Strengthen what makes
  Prosper special—not dilute it" is generically evaluative and locates nothing on its own. Suggestive
  but not explicit is a blank. His 2021–2023 Planning & Zoning Commission service and the claim that
  he "reviewed over 100 development applications" were deliberately **not** used — board service and
  tenure are adjacency, not positions.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — growth-and-development — no
  chair-locating position. His Responsible Growth section reads in full: *"Prosper is growing whether
  we like it or not. The question is whether we manage that growth wisely. That means holding
  developers accountable for the infrastructure their projects require, attracting businesses so
  homeowners don't carry the full tax burden, and protecting the quality of life that brought us all
  here. Growth should benefit existing residents, not just developers—and that includes ensuring our
  fire and police have the capacity to keep pace with new rooftops."* Accepting that growth will
  happen rules out chair 1 (growth limits / voter approval of annexations), but *"manage that growth
  wisely"* is precisely the generically-evaluative formula this phase has repeatedly refused, and
  making developers fund the infrastructure their own projects require is a cost-allocation position,
  not a pace position: it is neither chair 2's *"allow growth only where existing infrastructure can
  support it; slow approvals until capacity catches up"* nor chair 3's *"invest in infrastructure
  ahead of growth"* — under his formulation the developer pays, not the town, and no approval is
  slowed. His Fiscal Responsibility line *"Build it right the first time. Size projects correctly
  from the start so we don't run out of money halfway through"* is about capital-project scoping. His
  2020 Prosper Bond Committee service, which helped guide the Town's $210M infrastructure package,
  is committee adjacency and capital-project attribution — both refused classes.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — economic-development — no
  position on incentives, abatements, or community-benefit conditions, which is the axis all five
  chairs are defined by. His platform says *"We can keep approving whatever developers bring us—or
  Town Council can partner with the Chamber of Commerce, Economic Development Committee, and business
  leaders to set a bold vision that attracts the investment, jobs, and destinations Prosper
  deserves"*, and *"In the next few years, decisions about the Tollway corridor, downtown, and
  commercial development will determine whether we become their destination of choice—or watch them
  drive past."* That is a governance-and-vision argument for proactive recruitment; it never says
  whether the town should offer tax abatements, attach job-quality or community-benefit strings, or
  refuse subsidies altogether. Naming economic development as a priority area locates no chair.
  Separately, at the same June 9, 2026 meeting the council voted 6-0 out of executive session to
  authorize an Economic Development Incentive Agreement with Prosper Tollway Plaza LLC — Charles is
  not quoted on it, the motion was Reeves's, the deal terms were negotiated in closed session, and a
  silent yes vote on a unanimous incentive authorization is not a stated position on incentive
  aggressiveness. His advocacy of partnering with the Chamber of Commerce and the Economic
  Development Committee was deliberately not used: chamber/EDC adjacency was the basis of rows
  deleted from two Allen records on 2026-07-25.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — public-safety-approach — no
  chair-locating position. The only on-topic material is one clause inside his growth paragraph:
  *"…that includes ensuring our fire and police have the capacity to keep pace with new rooftops."*
  That is a growth-adequacy statement, and reading it onto this scale would be cross-topic inference:
  it says nothing about police **funding level** relative to other municipal services, nothing about
  staffing, pay or equipment as a means of improving response times or deterring crime (chair 4),
  nothing about crisis-response or co-responder teams for mental-health and addiction calls
  (chairs 2–3), and nothing about redirecting budget to social services (chair 1); it also lumps fire
  in with police, and fire is not on this scale at all. The June 9, 2026 minutes contain no
  public-safety item he spoke to; the May 19, 2026 agenda's purchase of three police speed trailers
  is a procurement item with no recorded remark from him.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — housing — no position on housing
  affordability found in any source. His only tax-and-housing-adjacent line, *"attracting businesses
  so homeowners don't carry the full tax burden"*, is about the commercial share of the tax base, not
  about whether or how government should make housing affordable. He has not addressed public
  housing, rent caps, inclusionary requirements, subsidies, first-time-buyer assistance, permit
  streamlining for affordability, or leaving housing to the market. His day job as a Rocket Mortgage
  executive was deliberately not used — profession is adjacency, and mortgage-industry employment
  says nothing about a housing-policy chair.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — transportation-priorities — no
  statement found that sets any transportation mode against another. His Tollway-corridor and
  *"destination of choice—or watch them drive past"* language is about commercial positioning, not
  about road capacity versus transit, bike or pedestrian investment. The June 9, 2026 minutes record
  a Capital Improvement subcommittee mention of a traffic-calming program, but by Mayor Pro-Tem
  Bartley, not by him.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — homelessness — no statement found
  on public camping, encampments, enforcement, citations, or shelter capacity. No such council item
  appears in the Prosper record reachable this session.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — local-immigration — no statement
  found on the Prosper Police Department's relationship to federal immigration enforcement, ICE
  detainers, or information sharing. Texas SB4's statewide bar on sanctuary policies is state law,
  not his position, and was deliberately not used as a default — that is the defect the 222-01 audit
  deleted from two Plano records.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — civil-rights — no on-topic
  position found anywhere. Nothing in his platform, his official bio, or any coverage addresses civil
  rights enforcement, equity requirements, or race-conscious programs. No inference was drawn from
  any identity or affiliation characteristic — that inference class is forbidden and was the basis of
  deletions from two Richardson records on 2026-07-25.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling** (see "RULING: `taxes` is structurally unanswerable for
  municipal officeholders" above). His material on this axis is preserved verbatim here so a future
  municipal-scope rewrite can place it. From his platform: *"attracting businesses so homeowners
  don't carry the full tax burden"*; and under Fiscal Responsibility, *"right-sizing projects from
  the start"*, planning long-term maintenance, and being transparent about what things actually cost.
  From his official bio and campaign material: in 2025 he **led the Windsong Ranch PISD annexation
  petition**, which would redirect more than $6.5M in annual property taxes from Denton ISD to
  Prosper ISD (pending state approval). Broadening the commercial tax base to relieve homeowners, and
  moving an existing tax stream between two school districts, are both revenue-composition moves —
  neither raises taxes on wealthy people or large companies (chairs 1–2) nor scales public services
  back (chairs 4–5), so on this scale they can only render as the undiscriminating middle chair.
  Prosper's adopted FY2025-26 rate is $0.505 per $100 of taxable value, but no statement by him on
  that rate was found. No taxes row was written.
- Doug Charles — Prosper — `48500428-3421-4298-b618-613696ca644c` — healthcare — no statement found
  on healthcare access. Expected: all five chairs on this scale describe national healthcare policy,
  which a town council member holds no position on by role. No health-adjacent remark was stretched
  into a chair.

**Prosper reconcile:** the one worklist name appears in bucket 2 for all 11 topics and in bucket 1
for none — Prosper has no name in neither bucket, no name in both, and contributes no row to
migration 1423.

---

## City of Celina (4813684) — 222-07

**Attempted:** 2026-07-25, the two un-stanced Celina officeholders on the 222-01 live worklist —
Councilmember Shea Scott (Place 4) and Councilmember Shane Lambert (Place 5) — against all 11
canonical compass topics. Both were elected on **May 2, 2026** in contested races and took office
that month, so both have a candidate questionnaire on the record (Celina's best evidence source) but
barely two months of council voting record. The other seated Celina officeholders already hold
stances and were out of scope per D-07; none of their rows was read, re-reasoned, or modified by this
plan (note that Mayor Ryan Tubbs's `housing` row was **deleted** by the 222-01 integrity remediation
as a Class A defect — that deletion is not disturbed here).

**Result: 2 chairs, both for Shea Scott** — `economic-development` = 1 and
`public-safety-approach` = 4, migration 1423, **authored — awaiting operator apply**. Shane Lambert
yields zero chairs. 20 of the 22 (person, topic) pairs are blank.

**Evidence checked:** Community Impact Newspaper's Prosper–Celina desk, which is the richest source
for this council — the **March 16, 2026 Place 4 candidate Q&A** and the **March 16, 2026 Place 5
candidate Q&A** (both genuine candidate questionnaires, the D-05 gold standard, both from contested
races), the February 13, 2026 "who is running" story, the February 23, 2026 candidate-withdrawal
story, the May 2, 2026 results story, the February 17, 2026 story on the council amending Celina's
zoning ordinance in response to state multifamily law SB 840, and the **July 15, 2026 story on the
council's 5-2 approval of a $3.05M incentive package for the Trackside Junction downtown mixed-use
project**, which is the only recorded council vote reachable this session in which either of these
two members is quoted; **Star Local Media's Celina Record** candidate profile of April 17, 2026 for
the Place 4 race (by Jack Hintze) — Star Local loaded on this attempt rather than returning its usual
HTTP 429; Scott's campaign site `bluelineiq.com/sheaforcouncil` and its `/about` page; and both
members' official City of Celina staff-directory profiles (`celina-tx.gov/directory.aspx`). Celina,
**TEXAS** was confirmed on every source used (the Place 4 campaign site states the city population
as 67,232), and both "Shea Scott" and "Shane Lambert" are common names, so each identity was pinned
to its Place number on the official city directory and to the May 2, 2026 Collin County canvass
before any evidence was accepted as theirs.

**Note on the February 2026 SB 840 zoning amendment.** Celina's council unanimously amended its
zoning ordinance at a **February 10, 2026** meeting (reported February 17) to allow heavy industrial
uses by permit in nonresidential districts, a move framed in the press as limiting where the new
state multifamily-by-right law could apply. That is genuinely on-topic for `residential-zoning` — but
it happened **three months before either of these two people took office**, so it is not their vote
and was deliberately not used for either of them. A future pass should check whether any
already-stanced Celina member's `residential-zoning` row rests on it.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position: **both** Ballotpedia individual candidate pages resolved but returned an **empty body**
(`/Shea_Scott_(Celina_City_Council_Place_4,_Texas,_candidate_2026)` and
`/Shane_Lambert_(Celina_City_Council_Place_5,_Texas,_candidate_2026)`) — the known phase-wide
Ballotpedia failure, a fetch failure and not evidence of absence. A constructed Star Local Media URL
for a possible Place 5 candidate profile returned **HTTP 429**, and no Place 5 Star Local profile was
located by search, so Lambert has no Star Local counterpart to Scott's April 17 profile. No VOTE411 /
League of Women Voters of Collin County questionnaire was found for either seat. **Community Impact's
Place 5 Q&A truncates three of Lambert's four answers mid-sentence with an ellipsis** — "Responsible
growth means …", "…higher water bills and higher property …", "…unfair property taxes and excessive
…" — and the full text could not be recovered from either URL variant of the article; this is a
publisher truncation, and those three cut-off sentences are the single most likely place a Lambert
chair is hiding. The **celinaradio.com interview with Shane Lambert (April 18, 2026)**, titled
"Shane Lambert on Growth, Spending, and the Future of Celina," is **audio/video only with no
published transcript** — podcast audio is not readable by this pass, and it is described as covering
"rapid growth, responsible spending, protecting downtown," "taxes, infrastructure, water concerns";
a pass able to transcribe it would very likely find real positions. Lambert's official city
directory profile carries **no biography at all**, only a seat and an email. Council meeting video on
`celinatx.new.swagit.com` was not watched, and no Celina agenda packet or minutes document was
opened this session — every recorded vote below is known only through news coverage of it. Campaign
Facebook pages were not fetched.

### Shea Scott — Council Member Place 4 — `91128e4f-94f6-4119-8087-4449ee16964a`

Sourced: `economic-development` = 1 and `public-safety-approach` = 4 (migration 1423, **authored —
awaiting operator apply**). The remaining 9 topics are blank:

- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — growth-and-development — **DEMOTED
  TO BLANK BY THIS PLAN'S TIER-1 SELF-AUDIT.** A chair 2 was drafted from his March 16, 2026
  questionnaire answers: *"Our biggest challenges are unsustainable growth and a staggering municipal
  debt load approaching $1 billion. This rapid expansion is outpacing our public safety resources and
  infrastructure, leading to issues like water rationing…"* and *"We must slow down incentive-driven
  development and refocus our city's budget on core infrastructure and public safety."* The re-fetch
  confirmed both quotes verbatim and confirmed he does call for development approvals to be slowed —
  but it also surfaced, in the April 17, 2026 Star Local profile, an equally explicit statement of
  the **opposite** chair: *"My vision is a Celina that grows smarter, not just bigger. A city where
  infrastructure leads growth instead of chasing it,"* and *"I see a city where public safety is
  planned ahead of growth, not responding after the fact,"* and from his campaign site, a pledge to
  *"manage our growth sustainably without burdening future generations."* Building and planning ahead
  of growth is chair 3's operative content; slowing approvals until capacity catches up is chair 2's.
  He states both, and nothing resolves between them — his one slowing prescription is scoped to
  *incentive-driven* development specifically, which is a subsidy objection already carried by his
  `economic-development` chair, not a general pace rule. Suggestive but not explicit is a blank. His
  diagnosis that growth is "unsustainable" does rule out chairs 4 and 5, and his silence on growth
  caps and annexation votes rules out chair 1, but a blank spoke is the correct terminal state when
  the remaining two chairs cannot be separated. A future pass with his council voting record on
  specific development approvals should be able to place this.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — residential-zoning — no chair-locating
  position. **Verified by targeted re-fetch of both of his questionnaire/profile sources: neither
  mentions apartments, multifamily, duplexes, accessory dwelling units, density, or rezoning at all.**
  His character language — *"the small-town character that makes this place special is protected by
  policy, not just promises"* and, from his campaign bio, *"ensure that as we expand, we don't lose
  the character that makes this city home"* — names neighbourhood character without saying what
  housing types should be allowed where, and his transparency proposal of *"automated zoning-change
  notifications and a resident feedback portal with guaranteed response timelines"* is a notice
  mechanism, not the community-vote requirement that distinguishes chair 1, and not the modest-density
  allowance that distinguishes chair 2. His July 14, 2026 remark that the Trackside Junction downtown
  mixed-use project (which includes residential space) is *"great"* is praise for one project, not a
  density position. The February 10, 2026 SB 840 zoning amendment predates his tenure.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — housing — no position on housing
  affordability found. Re-fetch of the Place 4 questionnaire confirmed it contains nothing about
  affordable housing, rent, or housing subsidies. He has not addressed public housing, rent caps,
  inclusionary requirements, first-time-buyer assistance, permit streamlining for affordability, or
  leaving housing to the market. His fiscal-affordability language is about municipal debt and the
  tax burden, not about housing supply or price.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — transportation-priorities — no
  statement found that sets any transportation mode against another. His repeated "core
  infrastructure" framing, in a city whose named infrastructure crisis is **water rationing**, does
  not choose between road capacity and transit, bicycle or pedestrian investment. Nothing about
  sidewalks, bike lanes, transit, parking, or traffic flow appears in any source read.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — homelessness — no statement found on
  public camping, encampments, enforcement, citations, or shelter capacity. Notably, 27 years in law
  enforcement including service as Celina's assistant police chief is **exactly** the kind of
  adjacency that must not be converted into an enforcement-side chair on this topic; it was
  deliberately not used.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — local-immigration — no statement
  found on the Celina Police Department's relationship to federal immigration enforcement, ICE
  detainers, or information sharing. His law-enforcement career was deliberately not used — that
  inference would be pure adjacency. Texas SB 4's statewide bar on sanctuary policies is state law,
  not his position, and was not used as a default.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — civil-rights — no on-topic position
  found anywhere. Nothing in either questionnaire, the Star Local profile, his campaign site, or the
  July 2026 council coverage addresses civil-rights enforcement, equity requirements, or race-conscious
  programs. No inference was drawn from any identity or affiliation characteristic.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling** (see "RULING: `taxes` is structurally unanswerable for
  municipal officeholders" above). His material on this axis is the strongest in this plan and is
  preserved verbatim here so a future municipal-scope rewrite can place it. From the March 16, 2026
  questionnaire: *"Our biggest challenges are unsustainable growth and a staggering municipal debt
  load approaching $1 billion… residents are sidelined without voter-approved bonds to help manage
  these massive financial obligations."* And: *"I will demand absolute transparency in our finances
  and fight the reliance on non-voter-approved Certificates of Obligation, returning the power of the
  vote to citizens."* And: *"My top priorities are instituting strict fiscal responsibility to tackle
  our $1 billion debt, ensuring public safety and infrastructure keep pace with growth and mandating
  voter approval for all new municipal bonds."* From the April 17, 2026 Star Local profile: *"Celina
  carries over $1 billion in total debt obligations, one of the highest per-capita debt loads among
  comparable Texas cities, and nobody was talking about it."* From his campaign bio: *"prioritize
  essential services and infrastructure before vanity projects"*; his campaign site's central feature
  is a municipal **debt clock** benchmarking Celina against McKinney and Prosper. This is a
  debt-instrument and fiscal-transparency platform — it neither raises taxes on wealthy people or
  large companies (chairs 1–2) nor scales public services back (chairs 4–5); he in fact wants MORE
  spending on services and infrastructure and LESS borrowing, a combination the scale has no chair
  for. No taxes row was written.
- Shea Scott — Celina — `91128e4f-94f6-4119-8087-4449ee16964a` — healthcare — no statement found on
  healthcare access. Expected: all five chairs on this scale describe national healthcare policy,
  which a city council member holds no position on by role. No health-adjacent remark was stretched
  into a chair.

### Shane Lambert — Council Member Place 5 — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e`

Sourced: **none.** All 11 topics are blank. His single substantive source, Community Impact's
March 16, 2026 Place 5 candidate Q&A, is **truncated by the publisher** in three of four answers, and
his surviving policy language is generically evaluative.

- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — economic-development — no
  chair-locating position, and this is the closest call for him. He is explicitly pro-incentive: *"The
  biggest challenges facing the city of Celina are properly managing our growth while preserving our
  small town charm. Thoughtful incentives for new developers as well as our small business owners is
  critical for sustainable growth."* That rules out chair 1 (no corporate tax incentives) and chair 2
  (small-business support **only**, avoiding large corporate subsidies — he explicitly includes new
  developers as well). But *"thoughtful"* is the entire qualifier, and it is generically evaluative:
  he never says whether incentives should carry community-benefit agreements or job-quality
  requirements (chair 3's operative content), nor whether the city should compete aggressively for
  major employers with significant abatements (chair 4), nor that growth is the top city priority
  (chair 5). Chair 3 is the middle chair, and assigning it on the strength of the word "thoughtful"
  would be defaulting to a middle value, which D-04 forbids. His **recorded vote does not resolve it
  either**: on July 14, 2026 he was one of two members to vote against the $3.05M Trackside Junction
  incentive package (city land worth ~$1M sold for $1, a $1.7M TIRZ No. 11 grant, a $350K Celina EDC
  grant) — but his stated reason was procedural and narrow: *"I would like to have a more robust
  dialogue on the parking lot,"* referring to an 18-space parking-lot lease on Louisiana Drive, and
  the coverage records that he expressed overall support for the development. A no vote cast over a
  parking lot is not an anti-subsidy position and was deliberately not read as one. His **nearly two
  years on the Celina Economic Development Corporation** — which he himself cites as qualifying
  experience, *"Nearly two years on the Celina EDC has provided an understanding for the mechanics of
  growth"* — was deliberately **not** used: EDC/chamber board service is adjacency, and it was the
  basis of rows deleted from two Allen records on 2026-07-25.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — growth-and-development — no
  chair-locating position. His language is *"properly managing our growth while preserving our small
  town charm"*, *"I am an advocate for infrastructure. Responsible growth means …"* (the publisher
  truncates the sentence at exactly the point where the position would appear), and, as his stated top
  priority, *"1) Infrastructure: Growth must be managed with the proper foundation in order to create
  a sustainable future for Celina."* "Responsible growth" and "managed with the proper foundation" are
  precisely the generically-evaluative formulas this phase has repeatedly refused; neither says
  whether approvals should be slowed until capacity catches up, whether the city should invest ahead
  of growth, whether permitting should be streamlined, or whether growth should be capped. The
  truncated "Responsible growth means …" sentence is the single most valuable missing piece of
  evidence for this person.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — residential-zoning — no
  chair-locating position. *"Preserving our small town charm"* names neighbourhood character without
  addressing housing density at all — nothing about apartments, multifamily, duplexes, accessory
  dwelling units, lot sizes, or rezoning process appears in any source read. The February 10, 2026
  SB 840 zoning amendment, which is genuinely on-topic, predates his tenure by three months and is
  not his vote. His July 14, 2026 no vote on Trackside Junction — a mixed-use project including
  residential space — was cast over a parking-lot lease, not over the residential component, and he
  supported the development overall.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — housing — no position on housing
  affordability found. His third stated priority is *"Affordability. Protecting our residents from
  unfair property taxes and excessive …"* — the sentence is truncated, and what survives is about tax
  and utility burden on existing residents, not about housing supply, price, subsidy, or the
  government's role in housing. Nothing on public housing, rent caps, inclusionary requirements,
  buyer assistance, or deregulation.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — public-safety-approach — no
  statement found on police funding, staffing, pay, equipment, response times, crisis-response teams,
  co-responders, or redirecting police budget. He does not mention public safety in any of his four
  published answers.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — transportation-priorities — no
  statement found that sets any transportation mode against another. His infrastructure advocacy is
  concretely about **water** — *"2) Water management: Stop the madness with those water bills! Working
  to secure more water for future increases in demand"* — which is a utility-capacity position, not a
  transportation-mode tradeoff. Reading it onto this scale would be cross-topic inference. Nothing
  about roads, transit, sidewalks, bike lanes, or parking appears in any source read.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — homelessness — no statement found
  on public camping, encampments, enforcement, citations, or shelter capacity.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — local-immigration — no statement
  found on the Celina Police Department's relationship to federal immigration enforcement, ICE
  detainers, or information sharing. Texas SB 4 is state law, not his position, and was not used as a
  default.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — civil-rights — no on-topic
  position found anywhere. Nothing addresses civil-rights enforcement, equity requirements, or
  race-conscious programs. No inference was drawn from any identity or affiliation characteristic.
  His self-description, *"My experience in the service industry makes me a listener by trade,"* is a
  temperament claim and locates nothing.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling** (see the ruling above). His material is preserved verbatim
  here: *"We will avoid passing initiatives that result in higher water bills and higher property …"*
  (truncated by the publisher, presumably "taxes"), and *"3) Affordability. Protecting our residents
  from unfair property taxes and excessive …"* (also truncated). Holding down the residential property
  tax burden neither raises taxes on wealthy people or large companies (chairs 1–2) nor commits to
  scaling public services back (chairs 4–5) — he simultaneously advocates more infrastructure and more
  water supply — so it can only render as the undiscriminating middle chair. His **water-bill** relief
  priority is separately refused as taxes evidence under the rule established in 222-06: utility,
  water and wastewater rates are fee decisions, not tax-and-spend positions. No taxes row was written.
- Shane Lambert — Celina — `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e` — healthcare — no statement found
  on healthcare access. Expected: all five chairs on this scale describe national healthcare policy,
  which a city council member holds no position on by role. No health-adjacent remark was stretched
  into a chair.

**Celina reconcile:** Shea Scott appears in bucket 1 (two migration rows in 1423, pending operator
apply) and additionally lists his 9 unsourced topics here; Shane Lambert appears in bucket 2 for all
11 topics and in bucket 1 for none. Both Celina worklist names are accounted for — no name in neither
bucket, and no (person, topic) pair in both. Until 1423 is applied, Scott is honestly in bucket 2 for
all 11 topics.

---

## City of Longview (4843888) — 222-07

**Longview's disposition is an explicit operator decision, not an omission.** Longview is a **Gregg
County** city, not a Collin government; it is bundled into the Texas browse list in
`src/lib/coverage.js` and already carries a `hasContext: true` chip. 222-RESEARCH.md Open Question 2
expected the 222-01 BEFORE snapshot to show zero un-stanced Longview officeholders. It did not — it
showed **five**, which exceeds plan 222-07's own three-person "ride along" threshold and would
normally have triggered the plan's escalate-rather-than-thin clause. **On 2026-07-25 the operator
decided to keep Longview inside 222-07 as an eight-person plan rather than open a nineteenth plan.**
All five were therefore researched here under the identical D-04 rules, at full depth, with no
thinning.

**Attempted:** 2026-07-25, the five un-stanced Longview officeholders on the 222-01 live worklist —
Derrick Conley (District 1), Shannon Moore (District 2), Brandon Smith (District 3), John Nustad
(District 4) and Sidney Allen (District 6) — against all 11 canonical compass topics, 55 pairs in
total. **Out of scope per D-07 and untouched:** Mayor **Kristen Ishihara** (9 topics already held)
and **Jody Berryhill**, District 5 (2 topics already held) are partially stanced; none of their rows
was read, re-reasoned or modified, which is also why no District 5 or mayoral entry appears below.

**Result: 2 chairs.** `homelessness` = 5 for **Derrick Conley** and `homelessness` = 5 for **John
Nustad**, both resting on the same contested, individually-recorded roll-call vote (migration 1423,
**authored — awaiting operator apply**). Moore, Smith and Allen yield zero chairs. 53 of the 55 pairs
are blank.

**Evidence checked:** the **official City of Longview council minutes**, which are unusually valuable
because Longview transcribes discussion items nearly verbatim rather than summarising them — the
**May 23, 2024** regular meeting (12 pages, read in full: the camping ordinance roll call, the
citizen comment period, the Swim Center vote), the **August 5, 2025** special called budget session
(12 pages, read in full: the proposed 57.19-cent tax rate, the employee-raise debate, the fee
resolution — every one of Conley, Moore, Nustad and Allen speaks at length here), and the **August
14, 2025** regular meeting (20 pages, read in full: five zoning cases and the raise decision). The
**Longview News-Journal** (`news-journal.com`), which is fetchable and is by far the richest
secondary source for this council — the May 2024 story on the council strengthening camping rules,
the Conley District 1 win story, the January 1, 2026 story on charges being dropped against the One
Love Longview director, the 2023 Nustad District 4 profile, the March 6, 2026 story declaring Nustad
re-elected unopposed, the April 16, 2026 Brandon Smith profile, the April 29, 2026 write-up of the
NAACP District 3 candidate forum, the June 13, 2026 Smith runoff-win story, and the story on Sidney
Allen taking District 6 unopposed. **KLTV** East Texas coverage, including the April 2024 District 2
candidate story. The city's own official council-member pages for all five members
(`longviewtexas.gov/220x/District-x`). Longview's Municode/AgendaCenter search index was used to
locate the May 23, 2024 minutes by document ID (`_05232024-1872`) after a direct search failed.

**⚠ LONGVIEW, WASHINGTON HOMONYM TRAP — CAUGHT AND REJECTED; READ BEFORE ANY FUTURE PASS.** There is
a **Longview, Washington** with its own city council, and general searches for Longview council
ordinance news surface it freely and confidently. Specifically rejected this session: a **tdn.com**
(*The Daily News*, Longview WA) story headlined "Longview council narrowly OKs excessive storage
ordinance," which a search summary presented as a Longview camping-ordinance revision and attributed
to "council member **Ruth Kendall**" — there is no Ruth Kendall on the Longview **Texas** council,
and that story is not about this city. Had it been used it would have produced a fabricated
`homelessness` position for whoever it was attached to. Also rejected as Washington: OPB's "Longview
City Council to select new mayor Jan. 8," klog.com's "Longview City Council Votes to Impose New 0.1%
Sales Tax," and longviewlibrary.org's "What Your City Council Accomplished in 2025." Every Longview
source relied on below was confirmed **Texan** by an explicit marker — the Gregg County Tax
Assessor-Collector, the Gregg County appraisal district, the Jo Ann Metcalf Municipal Building at
300 W. Cotton St., or the City of Longview, Texas seal on the minutes. Separately, **"Sidney Allen"
of Longview District 6 must not be confused with the city of Allen, TX**, which is a different
government covered by plan 222-05; and "Shannon Moore", "Brandon Smith" and "John Nustad" are all
common names, so each identity was pinned to its district on the official city directory and to a
named Longview News-Journal election result before any evidence was accepted.

**The `homelessness` evidence, stated once.** On **May 23, 2024** the council adopted **Ordinance
No. 4495**: *"AN ORDINANCE ... ADDING A NEW ARTICLE VIII TO CHAPTER 58 OF THE LONGVIEW CITY CODE
REGARDING SLEEPING OUTSIDE ON PRIVATE PROPERTY; PROVIDING FOR THE IMPOSITION OF A CRIMINAL PENALTY
NOT TO EXCEED $2,000 FOR EACH VIOLATION."* Longview's code already prohibited camping in the city
and sleeping on public property; this closed the remaining place a person could lawfully sleep
outdoors. It carries no graduated-warning scheme and imposes no obligation on the city to maintain
shelter capacity. The minutes record the roll call by name — **MOTION** Pirtle, **SECOND** Gamboa;
**Conley Yes · Moore No · Wade No · Nustad Yes · Gamboa Yes · Pirtle Yes · Ishihara Yes**; *"The
motion carried (5, 2)."* Eight residents spoke against it that night, one stating she has cancer and
cannot use a shelter for medical reasons and another that "there are many reason why someone could
not go to one of the Longview Shelters"; two spoke for it on behalf of area businesses. Municipal
court charges were later filed against the executive director of the nonprofit One Love Longview for
allowing clients to sleep in front of its building at 1015 McCann Road, and dismissed "in the
interest of justice" in January 2026. **Note a reporting discrepancy resolved in favour of the
primary source:** one search summary rendered the tally as "4-2"; the signed official minutes say
5-2 and name every vote, and the minutes govern. **Sidney Allen and Brandon Smith were not on the
council for this vote** — the May 23, 2024 minutes list the members as Ishihara, Conley, Moore, Wade,
Nustad, Gamboa and Pirtle — so neither receives anything from it.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position: Longview's own official council-member pages carry **no biography whatsoever** for any of
these five members, only a photo, an election date, a term expiry and liaison assignments, so there
is no official-bio source for this council at all. **No candidate questionnaire exists for Nustad**
— his 2026 District 4 election was **cancelled** because he was the only filer — **or for Allen**,
likewise unopposed and cancelled in 2025; and although District 3 in 2026 was a five-way contested
race that went to a runoff, neither the News-Journal nor any other outlet published a policy
questionnaire for it, only forum write-ups. Ballotpedia's individual candidate page for Brandon Smith
was not readable (the phase-wide Ballotpedia empty-body failure). KLTV's 2024 candidate-forum items
for Districts 1 and 2 and the Longview Chamber of Commerce and NAACP District 3 forums are
**video/broadcast**, not readable by this pass — the NAACP forum was reached only through the
News-Journal's written write-up of it. Council meeting **video** was not watched. **Sidney Allen's
earlier nine years of service, which ended in 2016 under term limits, were deliberately not mined**
— 2016-and-earlier statements are too stale to bear on a 2025-2028 term, and this is the single
largest recoverable gap for him. Only the May 23 2024, August 5 2025 and August 14 2025 minutes were
read in full; Longview holds roughly two meetings a month, so the great majority of this council's
recorded discussion remains unread and a deeper pass would very likely place additional chairs —
this is the most promising city in plan 222-07 for a future pass, precisely because its minutes are
near-verbatim.

### Derrick Conley — Council Member District 1 — `c723b079-c7db-4376-b8d3-72ac896fefe2`

Sourced: `homelessness` = 5 (migration 1423, **authored — awaiting operator apply**), on his recorded
Yes vote on Ordinance No. 4495 at the May 23, 2024 meeting — the same meeting at which he was sworn
in, having won District 1 in May 2024 with 227 votes (58.21%) over Jim Cogar and Arthur Carter. He is
**not individually quoted** on the item; the chair rests on the roll call and says so. The remaining
10 topics are blank:

- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — public-safety-approach — no
  chair-locating position. His one on-topic remark, at the August 5, 2025 budget session, is a
  balance statement: *"It's a balance of being able to make sure our people and public safety are not
  neglected. I really appreciate more thought and being able to be creative, if we can do that in any
  way where we don't raise taxes."* Saying public safety must not be "neglected" while holding taxes
  flat locates nothing: it is not chair 4's increase in staffing, equipment or pay to improve
  response times, not chair 3's addition of crisis-response teams, and not chair 1's redirection of
  police budget to social services. The city manager's observation at that meeting that "two thirds
  of our general operating budget is public safety" is staff testimony, not Conley's position. His
  employer — he is an assistant superintendent at Pine Tree ISD — was deliberately not used;
  profession is adjacency.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — residential-zoning — no
  chair-locating position. He seconded the consent agenda and one Planned Development rezoning for a
  gas station and convenience store at W. Loop 281 and McCann Road on August 14, 2025, and every one
  of that meeting's five zoning cases passed **7-0 with no citizen speaking and no council member
  saying anything at all**. A generic unanimous rezoning approval with no stated reason is the exact
  defect the 222-01 audit deleted from an Allen record on 2026-07-25 and the Richardson pass refused;
  moreover the cases were housekeeping (bringing non-conforming lots into compliance, a nonprofit
  office building, a convenience store), not density-policy choices.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — housing — no position on
  housing affordability found. His nearest remark, at the August 5, 2025 fee discussion, is
  *"one thing we know taxes affects all of us, whether we own property or whether we rent
  property"* — an observation that utility and tax costs reach renters as well as owners, not a
  position on the government's role in making housing affordable. A resident at the May 23, 2024
  meeting urged the city to address "the housing shortage in Longview," but no Conley response is
  recorded.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — transportation-priorities — no
  statement found that sets any transportation mode against another. His August 5, 2025 remarks about
  city services concern water rates and trash collection; the 2018 bond's street projects are a
  capital programme, not a mode choice, and he is not quoted on them.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — economic-development — no
  position found on incentives, abatements, or community-benefit conditions. Nothing in the minutes
  read or in any News-Journal coverage records him on a Longview incentive or abatement decision.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — growth-and-development — no
  chair-locating position on growth pace. Nothing found on annexation, approval speed, permitting
  fees, growth caps, or building infrastructure ahead of development.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — local-immigration — no
  statement found on the Longview Police Department's relationship to federal immigration
  enforcement, ICE detainers, or information sharing. Texas SB 4 is state law, not his position, and
  was not used as a default.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — civil-rights — no on-topic
  position found. His campaign statements as reported by the News-Journal are about accessibility and
  temperament — *"It all starts with one handshake at a time and listening"*, *"I want to be
  available, visible, approachable"*, *"I just feel like God's going to put me where I'm supposed to
  be"* — and locate nothing. **No inference was drawn from any identity, demographic or affiliation
  characteristic**; that inference class is forbidden and was the basis of deletions from two
  Richardson records on 2026-07-25.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling.** His material is preserved verbatim here for a future
  municipal-scope rewrite. At the August 5, 2025 budget session, on a proposed 57.19-cent rate: *"I
  think it's like you mentioned that we want to obviously compensate our people fairly, make that
  competitive, but we want to also take care of the taxpayers and not do what we can without raising
  taxes… anytime you have the responsibility of taxpayer money we take that very seriously. It's a
  balance of being able to make sure our people and public safety are not neglected. I really
  appreciate more thought and being able to be creative, if we can do that in any way where we don't
  raise taxes."* Wanting both fair employee pay and no tax increase neither raises taxes on wealthy
  people or large companies (chairs 1–2) nor commits to scaling services back (chairs 4–5). His
  interrogation of the water-rate increase at the same meeting — pressing the public works director
  until he had the per-bill figure, "*So that's basically so typical so someone is normally paying if
  you're paying $10.71 for water you're basically an increase of 21 cents*" — is utility ratemaking,
  separately refused as taxes evidence under the 222-06 rule. No taxes row was written.
- Derrick Conley — Longview — `c723b079-c7db-4376-b8d3-72ac896fefe2` — healthcare — no statement
  found on healthcare access. Expected: all five chairs describe national healthcare policy, which a
  city council member holds no position on by role. The city's employee health-insurance premium
  discussion on August 5, 2025 is an employee-benefits matter and was not stretched into a chair.

### Shannon Moore — Council Member District 2 — `d55159ff-7c27-4313-b464-722f653fd7b7`

Sourced: **none.** All 11 topics are blank. She won District 2 in May 2024 against Natasha Harrell,
succeeding the term-limited Nona Snoddy, and was sworn in at the May 23, 2024 meeting.

- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — homelessness — **real evidence
  of direction, but deliberately left blank, and this is the hardest blank in the plan.** She cast one
  of the two recorded **NO** votes on Ordinance No. 4495 on May 23, 2024, opposing the criminal
  prohibition on sleeping outside on private property; that vote is verified by name in the official
  minutes and independently reported by the Longview News-Journal. But **no stated reason of any kind
  was found** — she is not quoted in the minutes on the item, not quoted in the News-Journal's
  coverage of the vote, not quoted in KLTV's coverage, and not quoted in the later coverage of the
  ordinance's aftermath. A No vote establishes she rejects chairs 4 and 5 (prohibition backed by
  penalties) but cannot separate chair 1 (protect the right to sleep in public and redirect
  enforcement budgets to housing and mental-health services), chair 2 (decriminalise public sleeping
  while investing in shelter capacity and outreach), and chair 3 (allow enforcement only when
  adequate shelter beds exist, with citations diverting people to services). Critically, she has
  **not** sought repeal of Longview's pre-existing ban on camping and sleeping on public property, so
  chairs 1 and 2 cannot be assumed, and she said nothing about shelter capacity, so chair 3 cannot be
  either. Assigning a chair by picking the middle of the three she did not rule out would be
  defaulting to a middle value, which D-04 forbids. Her reason may well be on the meeting video,
  which this pass could not watch — this is the highest-value single retry in the plan.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — economic-development — no
  chair-locating position. Her one on-topic statement, from KLTV's April 18, 2026 District 2 candidate
  story, is a geographic-equity complaint rather than a position on incentive policy: *"Everything is
  literally being built and developed on the north side of Longview and we're just kind of left here
  and everything is just kind of blank."* Wanting investment to reach the southwest side says nothing
  about whether the city should offer tax abatements, attach community-benefit or job-quality
  conditions, confine help to small business, or refuse subsidies — the axis all five chairs are
  defined by.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — residential-zoning — no
  chair-locating position. She **made the motion** on August 14, 2025 to rezone 601 West Avalon
  Avenue, in her own district, from Multi Family (MF-2) to Office (O) for The Martin House — a
  downzoning away from multifamily — and it passed 7-0. But she is **not quoted giving any reason**,
  no citizen spoke, the applicant is a nonprofit wanting to build an office on a recreation field,
  and staff had found the change consistent with adjacent uses and with a comprehensive-plan
  designation of Public/Semi-Public. A silent motion on a housekeeping case is not a density
  position; converting it into one would be the generic-unanimous-rezoning defect. She said nothing
  about apartments, duplexes, accessory dwelling units, neighbourhood character, or rezoning process
  in any source read.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — housing — no position on housing
  affordability found. Her August 5, 2025 observation that a tax increase "affects renters" is about
  who bears a tax, not about housing supply, price or subsidy.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — public-safety-approach — no
  statement found on police funding levels, staffing, pay, equipment, response times,
  crisis-response teams, co-responders, or redirecting police budget.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — transportation-priorities — no
  statement found that sets any transportation mode against another.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — growth-and-development — no
  chair-locating position on growth pace. Her "north side versus here" remark is about **where**
  development happens, not about how fast it should be allowed to happen or what must be built first.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — local-immigration — no statement
  found on the police department's relationship to federal immigration enforcement, ICE detainers, or
  information sharing.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — civil-rights — no on-topic
  position found. Her campaign framing — *"It needs to be a voice that is from this community and has
  experienced the things we have experienced in this community"* and *"I want to be an advocate for
  the people who often feel like they're not heard"* — is representational, not a position on civil
  rights enforcement, equity mandates, or race-conscious programs, and locates no chair. **No
  inference was drawn from her identity, her district's demographics, or her having spoken at an
  NAACP-adjacent venue** — that is precisely the forbidden identity-inference class that was deleted
  from two Richardson records on 2026-07-25.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling.** Her material is preserved verbatim here. At the August 5,
  2025 budget session: *"I would just like to say that was our goal, I think, for most of the council
  for us to look in deeper to see where we are at because when we totally say, 'Okay, we want to
  raise property taxes specifically for a raise.' I think that is where we were all conflicted and
  just like anybody said and we've all said around council that is not it not only affects
  homeowners, it affects renters, it affects the employees that we're raising the taxes on."*
  Objecting that a property-tax increase to fund employee raises falls on renters and on the very
  employees being paid neither raises taxes on wealthy people or large companies nor scales services
  back. She also questioned the city's health-insurance premium increase — *"I wanted to discuss the
  health insurance premiums increase and the why. Is it more because they're getting more benefit or
  is it more what are we raising it for?"* — which is an employee-benefits fee question, refused both
  as taxes evidence and as healthcare evidence. No taxes row was written.
- Shannon Moore — Longview — `d55159ff-7c27-4313-b464-722f653fd7b7` — healthcare — no statement found
  on healthcare access. Expected: all five chairs describe national policy. Her question about the
  city's own employee health-insurance premiums is a municipal benefits-cost question and was
  deliberately **not** stretched into a healthcare-access chair — that stretch is exactly the defect
  that got a Richardson-phase healthcare row deleted on 2026-07-25.

### Brandon Smith — Council Member District 3 — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0`

Sourced: **none.** All 11 topics are blank. He is the newest member in this plan: 42 years old, a
lifelong Longview resident and 1998 Longview High School graduate, he led a five-way District 3 field
on May 2, 2026 with 195 votes (37.28%) and won the **June 13, 2026 runoff** with 223 votes (52.22%)
against Marlena Cooper's 204 (47.78%), succeeding Wray Wade. He has therefore held office for roughly
six weeks and has **no recorded vote on any compass topic**; the May 2024 camping ordinance predates
him by two years. Identity was pinned carefully because "Brandon Smith" is a very common name and
because a residency challenge was raised against him during the campaign (he stated he does live in
District 3).

- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — transportation-priorities — no
  chair-locating position, and this is his closest call. At the NAACP District 3 candidate forum on
  April 14, 2026 he cited his own canvassing survey: *"54% of the people who did our survey want
  street repairs such as potholes, complete roads, they want it fixed,"* and in his April 16, 2026
  News-Journal profile, *"Roads are one of the top three issues."* Pothole and pavement repair is
  **maintenance**, not a choice between competing modes: it is not chair 4's focus on road capacity
  and traffic flow, and his separate concern about street **lighting** — elderly residents unable to
  walk safely after dark, *"A lot of the time, they can't go out because they don't feel safe"* — is a
  personal-safety and illumination point, not chair 2's or chair 3's sidewalk, bike-lane or transit
  investment. The 222-06 rule that a bond bundling roads with drainage and water is not a
  transportation mode tradeoff applies with equal force to a pothole-repair priority.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — public-safety-approach — no
  chair-locating position. He reported a constituent perception rather than stating a funding or
  staffing position: *"They don't really feel safe because they're not seeing a lot of patrolling."*
  Relaying that residents notice fewer patrols is not a commitment to increase police staffing,
  equipment or pay (chair 4), nor a position on crisis-response teams or co-responders (chairs 2–3),
  nor on redirecting police budget (chair 1). Suggestive but not explicit is a blank; the phase
  blanked an equivalent-strength "public safety must keep pace" statement for a Prosper member in
  this same plan.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — growth-and-development — no
  chair-locating position. His vision statements — *"District 3 needs someone strong who's going to
  lead that district and help revitalize the district that has been left there unattended,
  respectfully"* and *"I would love to see a neighborhood that thrived as well as in the past"* — are
  revitalisation and restoration language about an older part of the city, not a position on growth
  pace, approval speed, permitting fees, annexation, or building infrastructure ahead of development.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — residential-zoning — no
  statement found on housing density, apartments, multifamily, duplexes, accessory dwelling units,
  lot sizes, neighbourhood character or rezoning process. He has cast no zoning vote.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — housing — no position on
  housing affordability found. His District 3 revitalisation framing does not address public housing,
  rent, inclusionary requirements, subsidies, buyer assistance, or deregulation.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — homelessness — no statement
  found on public camping, encampments, enforcement, citations, or shelter capacity, and he was not
  on the council for Ordinance No. 4495. Notably, no Longview outlet appears to have asked the 2026
  District 3 candidates about the camping ordinance despite its being live litigation in the city
  that January.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — economic-development — no
  position found on incentives, abatements, or community-benefit conditions, notwithstanding that one
  of his campaign forums was hosted by the Longview Chamber of Commerce; a forum appearance is
  adjacency, and that forum's content is not published in readable form.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — local-immigration — no
  statement found on the police department's relationship to federal immigration enforcement, ICE
  detainers, or information sharing.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — civil-rights — no on-topic
  position found. He participated in a forum hosted by the Longview branch of the **NAACP**, and that
  fact was deliberately **not** used: appearing at an organisation's candidate forum is adjacency and
  says nothing about a person's position on civil-rights enforcement, equity mandates or
  race-conscious programs. No inference was drawn from his identity or from his district's
  demographics.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling**, and in his case there is genuinely nothing to preserve:
  no statement by him on the Longview property-tax rate, the city budget, debt, or spending priorities
  beyond streets, lighting and parks was found in any source. His parks position — *"I would like for
  our parks to be more uniform"* and *"I would definitely advocate for at least a restroom at every
  park"* — is a specific spending request too narrow to bear on a tax-and-spend chair even if the
  scale were answerable. No taxes row was written.
- Brandon Smith — Longview — `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0` — healthcare — no statement found
  on healthcare access. Expected: all five chairs describe national healthcare policy.

### John Nustad — Council Member District 4 — `94957758-20db-4590-8cc9-ce54c24e2449`

Sourced: `homelessness` = 5 (migration 1423, **authored — awaiting operator apply**), on his recorded
Yes vote on Ordinance No. 4495 on May 23, 2024. He has held District 4 since May 2023 and was
**declared re-elected unopposed on March 6, 2026** when no one else filed and the election was
cancelled; term to May 2029. He is **not individually quoted** on the ordinance; the chair rests on
the roll call and says so. The remaining 10 topics are blank:

- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — public-safety-approach — no
  chair-locating position, despite being the most talkative member on the budget. His extensive
  August 5, 2025 remarks are about **city labour costs in general**, not about police specifically:
  he established from the city manager that labour is "close to 85%" of the budget and argued *"when
  85% of your budget is labor, where we are at right now trying to raise do a 6% raise with a $1,000
  kicker is not because we're feeling generous. It's because we're playing catchup."* A general
  employee-raise argument is not a position on police funding relative to other municipal services,
  and the compass scale here is specifically about policing. His fire-department remarks at the same
  meeting are ratemaking: he backed charging assisted-living facilities for non-medical lift assists
  after speaking to firefighters at stations two and five about their call volume, and separately
  supported passing credit-card processing fees to payers. Fees are not funding-model positions, and
  fire is not on this scale.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — residential-zoning — no
  chair-locating position. He made the motion on August 14, 2025 to rezone 209 Northcutt Avenue from
  Office (O) to Single Family (SF-5), and seconded the consent agenda; that case passed 7-0 with no
  citizen speaking and no member explaining a reason, and it was pure housekeeping — an owner
  bringing a non-conforming single-family home into compliance so it could be sold. A silent motion
  on a housekeeping case is not a density position.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — economic-development — no
  position found on incentives, abatements, or community-benefit conditions. His small-business
  analogy at the August 5, 2025 session — *"it's like a small business owner, they're experiencing
  higher cost of goods sold… The last thing the small business owner is going to want to do is raise
  prices"* — is a rhetorical device for explaining municipal cost pressure, not a position on
  business recruitment or subsidy, and reading it as one would be cross-topic inference.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — transportation-priorities — no
  statement found that sets any transportation mode against another. His 2023 profile mentions
  getting a specific intersection (Page Road and Delia Road) and a drainage issue addressed —
  constituent casework, not a mode priority.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — growth-and-development — no
  chair-locating position on growth pace. Nothing found on annexation, approval speed, permitting
  fees, growth caps, or infrastructure sequencing.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — housing — no position on housing
  affordability found.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — local-immigration — no statement
  found on the police department's relationship to federal immigration enforcement, ICE detainers, or
  information sharing.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — civil-rights — no on-topic
  position found. His 2023 statement of approach — *"My hope is to lead with professionalism, with a
  caring heart and … to help (residents) and be completely and fully accessible to them in whatever
  they may need"* — locates nothing.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling**, and his is the richest tax material in the plan after
  Scott's, preserved verbatim here for a future municipal-scope rewrite. At the August 5, 2025 budget
  session he laid out the tradeoff explicitly: *"You cannot pass tax increases but to pay the labor
  that we need to provide the services. So you have to look at two options. You either reduce staff
  which can impact services or you provide less services."* And: *"So, it's either you do sensible
  budgeting now, you go ahead and plan that cause the problems and reduction in staff and services
  and you provide that stuff and you look at ways to do it. And I hope that we can do this without
  increasing property tax."* And on state policy: *"The legislature is capping the revenue that we're
  able to increase. So, yes, they're lowering property taxes or trying to do their property taxes,
  but they're putting it at the expense of your school districts. They are putting it at the expense
  of your municipalities."* Note carefully what this is and is not: he names service reduction as the
  consequence of holding the rate flat, but he **advocates** the 6%-plus-$1,000 employee raise and
  hopes to fund it without a rate increase — he does not propose scaling public services back as an
  end (chairs 4–5), and he plainly does not propose raising taxes on wealthy people or large
  companies (chairs 1–2). This is exactly the pattern the operator ruling describes: a real, dated,
  substantive tax position that the scale can only render as the undiscriminating middle chair. No
  taxes row was written.
- John Nustad — Longview — `94957758-20db-4590-8cc9-ce54c24e2449` — healthcare — no statement found
  on healthcare access. Expected: all five chairs describe national healthcare policy.

### Sidney Allen — Council Member District 6 — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb`

Sourced: **none.** All 11 topics are blank. He returned to District 6 in **May 2025** after nine
earlier years on the council that ended in 2016 under term limits; he was **unopposed and his
election was cancelled**, so no 2025 candidate questionnaire exists. Term expires May 2028. He was
**not on the council** for the May 23, 2024 camping ordinance vote. His name is spelled "Sydney
Allen" in parts of the August 5, 2025 minutes; the official city directory and the News-Journal both
use **Sidney**. He must not be confused with the **city of Allen, TX**, a separate government covered
by plan 222-05.

- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — public-safety-approach — no
  chair-locating position. Everything he is recorded saying about emergency services is **fee
  ratemaking**, not funding level. At the August 5, 2025 fee discussion he pressed to charge
  assisted-living facilities for non-medical lift assists and to remove the proposed grace period:
  *"I don't see any reason in somebody having to keep track of that one free pickup. I think
  effective tomorrow, we should notify the assisted living centers that if it's not a medical
  situation and they call us to go out and assist, it's $250 effective within 30 days… I just see no
  reason to give them one free pickup and had no idea and I want to thank the new fire chief for
  looking at that."* That is a fire-department cost-recovery position; it is not about police
  staffing, pay, equipment, response times, crisis-response teams, or the police budget's share of
  city spending, and fire is not on this scale. He is the council liaison to the Zoning Board of
  Adjustment, the Animal Shelter Advisory Committee and the Council Appointments Committee — liaison
  assignments are adjacency and were not used for any topic.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — residential-zoning — no
  chair-locating position. He made the motion on August 14, 2025 to approve a Planned Development for
  a gas station and convenience store at W. Loop 281 and McCann Road — a **commercial** case,
  approved 7-0 with no citizen comment and no stated reason from him — and the other case in his
  district that night was a housekeeping Office-to-SF-5 rezone. Neither is a density-policy choice,
  and being the Zoning Board of Adjustment liaison is adjacency, not a position.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — economic-development — no
  position found on incentives, abatements, or community-benefit conditions. His August 5, 2025
  argument that the nonprofit discount at the Maude Cobb complex should be cut only to 20% rather
  than 15% — *"I think that if they were paying 30%, they can certainly pay 20%. And that's just a
  little bit of revenue that the complex out there will have to operate on"* — is venue-rental
  pricing for a city facility, not business attraction policy.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — homelessness — no statement
  found on public camping, encampments, enforcement, citations, or shelter capacity. He was not on the
  council for Ordinance No. 4495 and no later statement by him on it or on its 2026 aftermath was
  found. **A Longview, WASHINGTON story about an "excessive storage" camping-ordinance revision was
  specifically rejected as a source here** — see the homonym warning above.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — transportation-priorities — no
  statement found that sets any transportation mode against another. His remarks on trash-truck
  maintenance costs — *"when you're running trash trucks all over the city of Longview, you've got
  terrible maintenance expense and these are running start and stop, start and stop"* — are about
  fleet operating cost, not about transportation investment priorities.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — housing — no position on housing
  affordability found.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — growth-and-development — no
  chair-locating position on growth pace.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — local-immigration — no statement
  found on the police department's relationship to federal immigration enforcement, ICE detainers, or
  information sharing.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — civil-rights — no on-topic
  position found. Nothing addresses civil-rights enforcement, equity requirements, or race-conscious
  programs. No inference was drawn from any identity or affiliation characteristic.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — taxes — **researched, no chair
  written per the 2026-07-25 taxes ruling.** His material is preserved verbatim here. At the August 5,
  2025 budget session he pointed at appraisals rather than the rate: *"I think everyone here tonight,
  everyone that's listening may be watching over the last two years, maybe at least two years, has
  seen considerable increase in the taxable values of their home. Now, we have nothing to do with
  that. That's your Gregg County appraisal district."* On the fee resolution he judged the utility
  increases acceptable: *"With the water and the trash. I don't like to see the increases, but as we
  all know, equipment, trash trucks, operations, not counting personnel… So I think if the water and
  trash additional amounts are reasonable in my opinion."* And on payment fees: *"I still think 3.6 is
  a little high. I think all of the companies that process these credit cards nowadays are reducing
  their fees over a period of time."* Disclaiming responsibility for appraisal values and accepting
  utility rate increases is neither a tax increase on wealthy people or large companies (chairs 1–2)
  nor a commitment to scale services back (chairs 4–5); and **every one of these is a fee or rate
  decision, which the 222-06 ruling separately refuses as taxes evidence**. No taxes row was written.
- Sidney Allen — Longview — `2baab241-b3c5-48e9-b9a6-fd29b7b77beb` — healthcare — no statement found
  on healthcare access. Expected: all five chairs describe national healthcare policy. His lift-assist
  remarks concern who pays for a fire-department response to a fall in an assisted-living facility, a
  municipal cost-recovery question, and were deliberately not stretched into a healthcare chair.

**Longview reconcile:** Derrick Conley and John Nustad each appear in bucket 1 (one migration row in
1423 for `homelessness`, pending operator apply) and additionally list their 10 unsourced topics here;
Shannon Moore, Brandon Smith and Sidney Allen appear in bucket 2 for all 11 topics and in bucket 1
for none. All five Longview worklist names are accounted for — no name in neither bucket, and no
(person, topic) pair in both. Until 1423 is applied, Conley and Nustad are honestly in bucket 2 for
all 11 topics. Mayor Ishihara and District 5's Jody Berryhill are deliberately absent from this
register: they are partially stanced and out of scope per D-07, not unsearched.

---

## City of Anna (4803300) — 222-08

**Plan 222-08 preamble — scope, stated once for all five of this plan's cities.** 222-08 is the
**D-02 mayors sweep, part A**. It researches **the mayor only** of five Collin cities — Anna,
Fairview, Farmersville, Parker and Lucas. The **council members of all five cities are covered by
plans 222-11, 222-12 and 222-13** and are deliberately absent from these five sections; their absence
is a scope boundary, not an omission.

**⚠ Murphy, Princeton and Melissa were cut from this plan's scope, deliberately.** The 222-08 PLAN's
own `<objective>` prose names **eight** mayors. The correct live scope is **five**. The 222-01 live
worklist and its per-plan assignment table cut **Murphy** (Mayor Scott Bradley, 1 stance held),
**Princeton** (Mayor Eugene Escobar Jr., 3 stances held) and **Melissa** (Mayor Jay Northcut, 4
stances held) because all three are **already stanced** and are therefore **out of scope under D-07**
(no overwrite pass). This was re-verified against production by the orchestrator on 2026-07-25. None
of their rows was read, re-reasoned or modified, and no Murphy, Princeton or Melissa mayoral section
appears in this register from 222-08. The live worklist governs over the plan's prose.

---

**Attempted:** 2026-07-25 — **Mayor Pete Cain** (`d9710a3e-4679-44a5-8bfe-ddbb7b376ab5`), the sole
Anna officeholder in plan 222-08's scope, against **all 11** canonical compass topics (11 pairs).
Verified at `stance_count = 0` against production before any research began. Anna's six at-large
council members (Kevin Toten, Nathan Bryan, Jessica Walden, Kelly Patterson-Herndon, Elden Baker,
Manny Singh) are **not** in this plan — see the preamble.

**Result: 0 chairs. All 11 topics are honest blanks.** Anna is a 222-RESEARCH.md §C **Tier "Medium"**
city and this is a below-tier outcome; the reason is specific and recoverable — see "Sources checked
but unavailable" below. Anna's council record is genuinely rich (a fast-growing city adopting large
development agreements and a tax rate above the no-new-revenue rate to fund a police station), but
**every route into the primary record was closed to this session**, and no chair was placed on the
strength of a summary of a document that could not be opened.

**Evidence checked:**
- **Official City of Anna site** (`annatexas.gov`) — Mayor Cain's own officeholder page
  (`/1354/Pete-Cain`), read in full: it is **biography only**. Born in Abilene, Marine Corps
  1988–1994 (Desert Shield/Desert Storm), elected May 2024 for a term ending May 2027, three Anna ISD
  graduate children, "Pete believes completely in servant leadership." It carries **no policy
  statement of any kind**. His listed service — multiple terms as an Anna ISD trustee, board member
  and chair of the Greater Anna Chamber of Commerce, ordained Elder at Pin Oaks Christian Fellowship,
  and **service on the City of Anna's Diversity & Inclusion commission** — was deliberately NOT used
  for any topic. Board and commission service is **adjacency**, not a position; in particular the
  Diversity & Inclusion commission seat was **not** used to place `civil-rights`, which would have
  been exactly the adjacency-plus-identity-inference defect the 222-01 audit deleted from Richardson
  records.
- **The city's own news releases** — ArchiveCenter item 1899, the June 27, 2025 release announcing
  City Manager Ryan Henderson's departure, downloaded and read in full as a PDF. Cain is quoted at
  length in it, but entirely in praise of a departing employee: *"Ryan's leadership came at a
  fundamental time in our city's history… He guided Anna through a period of transformational growth
  while keeping our organization grounded in the values of service, integrity and community."* That
  is a personnel tribute, not a position on any compass axis.
- **`collincounty.com/mayor-pete-cain`** — a full profile piece on Cain, fetched and read. Its two
  substantive quotes were both examined and both refused:
  *"We're going to grow, no doubt about it, but we need to grow in a way that keeps our community
  spirit intact"* — **generically evaluative**, the exact class ("manage that growth wisely") that
  locates no `growth-and-development` chair; and
  *"I don't know that I can ever look at the budget to a point where I'm willing to not have a
  firefighter, or not have a peace officer, or not have a librarian, so that I get paid"* — this is
  about **council compensation** (Anna's mayor and council are unpaid and he is explaining why he
  would not change that), and it ranks firefighter, peace officer and librarian **equally**, so it is
  not a public-safety-funding preference either. No chair.
- **North Texas e-News / Local Profile / Bisnow economic-development coverage of Anna**, searched and
  sampled. See the misattribution rejection below.
- **Star Local Media (Anna-Melissa Tribune), Community Impact (Prosper-Celina / Collin County
  editions), Local Profile, WFAA** — searched for a Cain policy interview, candidate questionnaire or
  State-of-the-City address. **None exists that this session could find.** Cain's May 2024 mayoral
  election produced no discoverable candidate questionnaire.

**⚠ MISATTRIBUTION REJECTED — wrong officeholder, wrong era.** Bisnow's *"Destination Anna: Why This
Collin County Town Is On Developer Wish Lists"* surfaced high in searches for Anna growth-policy
quotes and reads exactly like a mayoral growth-pace and economic-development source: *"We are one of
the last blank canvases in Collin County. We have 61 square miles of [developable] planning area, and
we want to grow."* **That is not Pete Cain.** The article is dated **March 3, 2021** and the speaker
is **Mayor Nate Pike**, Cain's predecessor; the other quotes belong to a broker and to the Anna EDC
director Joey Grisham. Read carelessly it would have produced a fabricated
`growth-and-development` = 4 for Cain. The article was opened and the speakers confirmed by name
before it was set aside — which is exactly what rule 5 of this plan requires.

**Sources checked but unavailable this session** — recorded so a later pass can retry, **not** treated
as absence of a position:
- **Anna's council minutes are effectively unreadable from here, and this is the single reason Anna
  ends at zero.** `annatexas.gov/AgendaCenter` returns **HTTP 404** — Anna does *not* use the
  CivicPlus AgendaCenter module that most of Collin County uses. Its agendas and minutes live in
  **Laserfiche WebLink** at `publicdocs.annatexas.gov/WebLink/`, which returns *"Cookies are not
  enabled for this website. Cookies must be enabled in order to sign in to WebLink"* on both the root
  and `Browse.aspx?id=1&dbid=0`, exposing **no folder listing and no document at all**. Recent
  meetings are additionally served through a **CivicClerk** single-page app
  (`annatx.portal.civicclerk.com/event/1091/files`) which renders only the string "Public Portal •
  CivicClerk" to a fetch and lists no files. **No Anna City Council minute was read this session.**
- **`citizenportal.ai` returned HTTP 403.** Its article "Anna adopts $29.7 million FY2026 budget and
  raises property tax rate to fund police station" was visible only as a search-result summary. That
  summary indicates the FY2026 general fund was set at $29.7M, the adopted rate of $0.525073 exceeds
  the no-new-revenue rate of $0.495928, the increase funds a new police station plus five officers, a
  detective, a lieutenant and two library custodians, and that "council members repeatedly tied the
  tax increase to public-safety needs." **No chair was placed on any of that**, for three independent
  reasons: the article body could not be opened (403); citizenportal.ai is an **AI-generated meeting
  summary, not a primary document**, and rule 5 of this plan forbids attributing a motion, vote or
  in-meeting quote from a summary; and the summary attributes the public-safety framing to "council
  members" collectively, never to Cain by name. **If a future pass can read the Anna FY2026 budget
  minutes, `public-safety-approach` is the most likely chair to be placed for this mayor** — that is
  the highest-value unread source for Anna.
- **Council meeting video** at `annatx.new.swagit.com/views/445` was **not watched** — video is not
  readable by this pass. This is where Anna's actual deliberation lives, since the written record is
  gated.
- **No Ballotpedia individual candidate page** exists for a mayor of a ~35,000-person city — Anna is
  far below Ballotpedia's "100 largest cities" scope. **No VOTE411 or League of Women Voters of Collin
  County questionnaire** was found for the Anna mayoral seat, and `lwvcollin.org` has returned
  **HTTP 403** for the entire phase.
- Cain's **campaign Facebook page** was not fetched (Facebook is not fetchable here, and social posts
  are not treated as evidence of a policy position absent a direct citable quote).

### Pete Cain — Mayor — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5`

Sourced: **none.** All 11 topics blank. Elected mayor in May 2024, term ending May 2027, in a city
that grew from 16,896 (2020 census) to about 35,245 (2025) and projects 100,000 by 2050.

- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **housing** — no position found on what
  role government should play in housing affordability. Nothing on public housing, rent caps,
  inclusionary requirements, subsidy for affordable projects, first-time-buyer assistance, permit
  streamlining, or leaving prices to the market. Anna's development agreements (Liberty Hills, Sherley
  Farms, Oak Ridge, Ana Capri North, Rockhill — more than 3,000 acres of planned residential and
  commercial development, named in the city's own June 2025 release) are **staff-negotiated
  agreements credited to the city manager in that release**, not statements of Cain's position on
  housing affordability, and the release quotes him only on the manager's character.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **residential-zoning** — no position
  found on density or neighborhood character. Anna's Planning & Zoning Commission and council
  regularly act on plats, rezonings and planned-development districts (including a 1,127.6-acre
  Sherley Farms annexation and PD zoning in February 2025, and a development agreement with NextMetro
  Communities for a multifamily project), but **no minute recording Cain's vote or words on any of
  them could be read** (Laserfiche gated — see above), and a P&Z commission action is not the mayor's
  position in any case. Nothing was inferred from the city's existing zoning pattern; **city policy is
  not the individual's position**.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **growth-and-development** — no
  chair-locating position, and this is the closest miss. He plainly addresses growth — *"We're going
  to grow, no doubt about it, but we need to grow in a way that keeps our community spirit intact"*
  and, on a national fastest-growing-cities ranking, *"Anna is rising with purpose,"* a recognition
  that "reflects the intentional growth, strong partnerships and long-term vision that are shaping our
  city" — but every one of those is **generically evaluative**. "Grow in a way that keeps our
  community spirit intact," "intentional growth" and "long-term vision" are compatible with chair 2
  (slow approvals until infrastructure catches up), chair 3 (invest ahead of growth) and chair 4
  (streamline permitting to grow the tax base) alike. He names no growth cap, no annexation vote
  requirement, no approval-speed or fee position, and no infrastructure-before-growth sequencing
  commitment. This is precisely the "responsible growth" defect class the 222-01 audit deleted from
  production. Blank, not defaulted.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **economic-development** — no position
  found on incentives, abatements, Chapter 380 agreements, community-benefit or job-quality
  conditions. His two on-topic remarks are **celebratory, not positional**: on the Rosamond Town
  Center groundbreaking, *"It changes everything — the retail and tax base with 750 jobs coming to us
  with this development,"* and on incoming retailers, *"It is so exciting to have these important
  retailers coming so close to home, creating convenience and economic opportunity for our
  community."* Welcoming a project that has already broken ground says nothing about whether he would
  offer maximum incentives, targeted conditional incentives, small-business-only support, or none at
  all — and no incentive instrument is mentioned in either quote. His years as a **board member and
  chair of the Greater Anna Chamber of Commerce** were deliberately not used: **chamber service is
  adjacency**, expressly refused.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **public-safety-approach** — no
  chair-locating position, **and this is the blank most likely to be resolvable by a future pass**.
  Anna adopted an FY2026 rate above no-new-revenue expressly to fund a police station and add five
  officers, a detective and a lieutenant, and Cain necessarily presided over that adoption — but
  **presiding is not a position** (a mayor calling a vote holds no chair by that fact), the primary
  minutes could not be read, and the only account of the deliberation (citizenportal.ai) is an
  AI-generated summary that returned 403 and attributes the public-safety framing to "council members"
  collectively rather than to Cain. His one quotable public-safety-adjacent sentence — *"I don't know
  that I can ever look at the budget to a point where I'm willing to not have a firefighter, or not
  have a peace officer, or not have a librarian, so that I get paid"* — is about **council
  compensation**, and it weights a librarian equally with a peace officer, so it does not locate
  chair 4 (increase staffing, equipment and pay to improve response times), chair 5 (police above all
  other municipal services), chair 3 (add crisis-response teams), or chair 1 (redirect police budget
  to social services). Blank.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **transportation-priorities** — no
  statement found setting any transportation mode against another. Anna completed major roadway
  expansions on Rosamond and Hackberry, but a capital roadway project is **not a mode tradeoff** and
  Cain is not quoted on it; the city's own release credits those projects to the city manager. Nothing
  found on transit, bike lanes, sidewalks, parking requirements, or road capacity as a stated
  priority.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **homelessness** — no statement or vote
  found on people sleeping or camping in public spaces. No Anna camping ordinance, encampment policy
  or shelter decision surfaced in any readable source, and none was inferred.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **local-immigration** — no statement
  found on the Anna Police Department's relationship to federal immigration enforcement, ICE
  detainers, or information sharing. **Texas SB 4 is state law, not his position**, and was not used
  as a default.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **civil-rights** — no on-topic position
  found. **His service on the City of Anna's Diversity & Inclusion commission was deliberately not
  used**: commission service is adjacency, and inferring a civil-rights chair from a diversity-body
  seat is the same defect class as inferring one from identity — both are forbidden, and both were
  deleted from real production rows earlier in this phase. His ordination as an Elder at Pin Oaks
  Christian Fellowship was likewise not used in any direction; **religion is never a basis for
  inference**.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **taxes** — **researched, no chair
  written per the settled 2026-07-25 operator ruling.** The material found is preserved here verbatim
  for any future municipal-scope rewrite of this question. Anna adopted an FY2026 general fund of
  **$29.7 million** and a property-tax rate of **$0.525073**, which **exceeds** the state
  no-new-revenue rate of **$0.495928**, raising roughly **$3.1 million** in additional revenue and
  about **$98 per year** for the average homeowner, in order to fund a new police station and
  additional public-safety staffing. Cain presided over that adoption. **None of this reaches a
  chair**: chairs 1–2 require raising taxes specifically on wealthy people and large companies and
  chairs 4–5 require scaling public services back, and a uniform ad-valorem municipal rate increase
  that funds *more* service does neither. His only tax-adjacent quote is the council-compensation
  remark above. Additionally, the underlying detail was available only through a **403** AI summary,
  so even the factual account here is second-hand and is recorded as such. No taxes row was written.
- Pete Cain — Anna — `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5` — **healthcare** — no statement found on
  healthcare access. Expected: all five chairs on this scale describe **national** healthcare policy,
  which a city mayor holds no position on by role. No health-adjacent remark was stretched into a
  chair.

**Anna reconcile:** Pete Cain appears in **bucket 2 for all 11 topics** and in bucket 1 for none. He
is the only Anna name in plan 222-08's scope and he is accounted for — not in neither bucket, not in
both. Anna's six council members are out of this plan's scope and belong to 222-11/222-12/222-13.

---

## Town of Fairview (4825224) — 222-08

**Attempted:** 2026-07-25 — **Mayor John Hubbard** (`72b80f6a-82b3-4872-a10f-e95e2cd3f90f`), the sole
Fairview officeholder in plan 222-08's scope, against **all 11** canonical compass topics (11 pairs).
Verified at `stance_count = 0` against production before any research began. **Only the mayor is in
scope here; Fairview's Town Council seats are covered by plans 222-11/222-12/222-13** and are
deliberately absent from this section. See the 222-08 preamble in the Anna section above for the
Murphy/Princeton/Melissa scope cut.

**Result: 0 chairs. All 11 topics are honest blanks — but this is by far the hardest zero in plan
222-08, and the reasoning below should be read before any future pass re-searches Fairview.** Hubbard
is the **best-documented person in this entire plan**: he holds a recorded, individually-named,
contested **dissenting vote with a stated reason**, sustained over fourteen months into a named public
campaign. It still does not land on any of the eleven compass axes, for the reason set out under
`residential-zoning` below. **An operator who disagrees with that call should overrule it explicitly
rather than have a later pass rediscover it** — the evidence is preserved here in full so that is
possible.

**Evidence checked:**
- **PRIMARY DOCUMENT — the official Fairview Town Council minutes of April 29, 2025, read in full (6
  pages, signed and attested).** Obtained by way of Fairview's **CivicClerk OData API**
  (`fairviewtx.api.civicclerk.com/v1/Events`, then
  `/v1/Meetings/GetMeetingFileStream(fileId=1877,plainText=false)`) after the public portal SPA proved
  unreadable — **this API route is the single most useful technical finding for Fairview and should be
  reused by 222-11/222-12/222-13.** The minutes establish, by name and beyond doubt:
  - Council present: **Mayor Henry Lessner and Mayor Pro Tem John Hubbard**, and Councilmembers Rich
    Connelly, Gregg Custer, Ricardo Doi, Larry Little, Ken Logsdon. (Hubbard was **Mayor Pro Tem** at
    this meeting; he became mayor at the May 2025 election.)
  - Item 4a: a public hearing on *"an ordinance for a request for approval of a Conditional Use Permit
    (CUP) for a religious facility. The 8.1-acre site is located on the north side of Stacy Road, west
    of Meandering Way and is zoned for the (RE-1) One-acre Ranch Estate District."*
  - The mandatory conditions Mayor Lessner read into the record, including *"From ground level, the
    steeple and spire and any other element of the temple structure cannot exceed 120'"* and a
    44'-7" roof/façade cap, a 30,742 sq ft floor-area cap, 38.9% impervious coverage, and detailed
    Dark-Skies lighting limits.
  - **The roll call, verbatim: Mayor Henry Lessner — Aye; Mayor Pro Tem John Hubbard — Nay;
    Councilmember Rich Connelly — Nay; Councilmember Gregg Custer — Aye; Councilmember Ricardo Doi —
    Aye; Councilmember Larry Little — Aye; Councilmember Ken Logsdon — Aye.** *"…in a vote of Yes 5,
    No 2, Abstained 0. Mayor Pro Tem Hubbard and Councilmember Connelly voting against."* The motion
    was **Mayor Lessner's**, seconded by **Doi** — not Hubbard's. The meeting ran from 5:30 PM to
    12:09 AM with roughly sixty members of the public present and 40-plus named speakers.
  - The minutes were approved May 6, 2025 and are signed **"Dr. John Hubbard, Mayor."**
- **Deseret News, June 15, 2026** — *"Town leaders launch campaign against Fairview Texas Temple
  steeple"* — fetched and read. Hubbard's own words at that day's press conference launching the
  **FairviewSpeaks** campaign: *"Some people think the issue was resolved when the Town Council
  approved the temple permit last year. It wasn't."* · *"They have every right, right now, to build
  (to) 120 feet. But… It just doesn't fit into the character of the town of Fairview. It's just too
  big."* · *"I'm here today on behalf of my friends and neighbors who are upset with a 120-foot
  steeple that will tower over our community once the temple is completed."* The article also records
  the height history: an original 173-foot proposal, a **November 2024 mediated compromise at 120
  feet which Hubbard joined**, and a residents' counter-proposal of 70 feet; ground was broken in
  February 2026.
- **CBS Texas (CBS News DFW), June 15, 2026** — fetched and read. Hubbard argues *"the 120-foot
  steeple is taller than what Fairview's zoning ordinances typically allow"* and repeats *"It just
  doesn't fit into the character of the town of Fairview. It's just too big"*; he would prefer **68
  feet**. **Asked directly of this article: it contains no statement from Hubbard about housing
  density, multifamily housing, or residential development generally.** That negative finding is the
  hinge of the `residential-zoning` blank below.
- **Deseret News, April 30, 2025** — the contemporaneous account of the CUP vote — fetched and read.
  It quotes **Mayor Henry Lessner** (*"None of us are pleased with this… but this is what we feel we
  have to do"*), **Councilman Gregg Custer** and **Councilmember Ricardo Doi** (*"I hope a future
  council will change the ordinance and establish a maximum height for a church so no other council
  has to face this again"*) — and **does not mention John Hubbard at all**. Hubbard's Nay was
  therefore taken from the **official minutes**, not from any news account, exactly as rule 5 requires.
- **Official Town of Fairview site** (`fairviewtexas.org`) — root navigation read. Several documented
  paths return **HTTP 404** (`/index.php/government/town-council`, `/government.html`,
  `/bondelection.html`); the working entry point for meetings is the CivicClerk portal.
- **Fairview EDC** (`fairviewtexasedc.com`) and Fairview Crossing / Sloan Corners / Fairview Town
  Center development coverage, searched. Hubbard is not quoted with a position in any of it.
- **LegiStorm, TML City Officials Directory, LinkedIn** biography material — read; **bio only**.

**⚠ HOMONYM AND ADJACENCY GATES APPLIED.** "Hubbard" is a common surname and there is also a **City of
Hubbard, Texas** (Hill County) with its own TML directory entry, plus a **Fairview Fire Protection
District** that is a **California** agency and dozens of other US Fairviews. Every source relied on
above was pinned to **Fairview, Collin County, Texas** by an explicit marker — the 372 Town Place
council chambers address, Stacy Road, the Town Secretary Joshua Stevenson's attestation, or the
article's own statement of the county. Separately, Hubbard's **profession and board service were
deliberately not used for any topic**: he holds a Ph.D. in Human Capital Development, is a university
professor and consultant specialising in **economic development** and strategic planning, sits on the
**Texas Economic Development Council** and the **Methodist Charlton Medical Center Advisory Board**,
and previously worked as Assistant to the City Manager in Plano, Assistant Town Administrator in
Fairview and **City Administrator in Lucas**. It would have been easy and wrong to read
`economic-development` off the TEDC seat and the CEcD credential, or `healthcare` off the hospital
advisory board. **Board service and profession are adjacency, not positions** — both are expressly
refused defect classes, and both were declined here.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position:
- **Fairview's minutes are ACTION-ONLY, and that is the structural reason Fairview yields no chairs.**
  Having read the April 29, 2025 minutes in full — a nearly seven-hour marathon meeting on the single
  most contested item in the town's recent history — the record of the deliberation is exactly three
  sentences: *"The Council and staff had discussion regarding this item"*, *"The Council, staff, and
  multiple people from the applicant team had discussion regarding this item"*, and *"Council and the
  applicant had continued discussion."* **Not one council member's words are recorded anywhere in the
  document.** Fairview minutes list motions, seconds, roll calls and speaker names and nothing else.
  This is the opposite of Longview's near-verbatim style (222-07), and it means **reading more
  Fairview minutes cannot produce quotes** — it can only produce votes, and an unexplained vote cannot
  locate a chair. A future pass should spend its budget on **audio**, not on minutes.
- **Council meeting AUDIO exists and was not listened to.** Fairview publishes MP3 recordings of
  council meetings directly (e.g.
  `fairviewtexas.org/pdf/audio/Town%20Council/2024/02%20-%20February%206,%202024%20Regular%20Council%20Meeting.mp3`,
  surfaced in the CivicClerk event payload as `externalMediaUrl`). **Audio is not readable by this
  pass.** Given that the written minutes are action-only, this audio archive is the single highest-value
  unread source for every Fairview officeholder, and it is directly addressable by URL — a genuinely
  useful finding for 222-11/222-12/222-13.
- **A podcast interview exists and could not be used:** *"A Conversation with Dr. John Hubbard, Mayor
  of Fairview, Texas"* (Apple Podcasts, id1682941294). Audio-only with no published transcript;
  podcast audio is not readable here. This is the most likely place a genuine multi-topic Hubbard
  position statement exists.
- **No Ballotpedia individual candidate page** — Fairview's population is roughly 11,000, far below
  Ballotpedia's "100 largest cities" scope. **No VOTE411 or League of Women Voters of Collin County
  questionnaire** was found for the Fairview mayoral seat; `lwvcollin.org` has returned **HTTP 403**
  all phase. **No Community Impact or Star Local Media candidate Q&A** for the May 3, 2025 Fairview
  general election (Mayor, Seats 1, 3 and 5) could be found.
- Hubbard's **campaign Facebook page** (`facebook.com/HubbardforFairview`) was not fetched — Facebook
  is not fetchable here, and social posts are not treated as evidence of a policy position absent a
  direct citable quote.
- **The May 1, 2026 letter Hubbard sent to every member of the First Presidency and Quorum of the
  Twelve** asking for a further steeple reduction is referenced in coverage but its **text was not
  located**, so nothing was attributed to it.

### John Hubbard — Mayor — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f`

Sourced: **none.** All 11 topics blank. Elected mayor May 2025 after serving on the Town Council from
2020 and as Mayor Pro Tem from 2023.

- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **residential-zoning** —
  **THE CLOSEST CALL IN PLAN 222-08, DELIBERATELY LEFT BLANK.** The evidence is real, primary, dated,
  individually attributed and repeatedly restated, and it is recorded here in full because a future
  pass must not have to re-derive it:
  on **April 29, 2025** Hubbard, then Mayor Pro Tem, cast one of two recorded **Nay** votes against
  the ordinance granting a Conditional Use Permit for a 120-foot steeple on an 8.1-acre site zoned
  **RE-1 One-acre Ranch Estate** (roll call named in the official minutes, 5-2); and on **June 15,
  2026**, fourteen months later, he launched the **FairviewSpeaks** campaign, telling a press
  conference *"They have every right, right now, to build (to) 120 feet. But… It just doesn't fit into
  the character of the town of Fairview. It's just too big,"* that *"Some people think the issue was
  resolved when the Town Council approved the temple permit last year. It wasn't,"* and that the
  120-foot steeple *"is taller than what Fairview's zoning ordinances typically allow."* He wants 68
  feet. So this is **not** the refused "unexplained dissenting vote" class (222-07, Shannon Moore) —
  the reason is stated, in his own words, on the record.
  **It is nevertheless a blank, and the reason is topic fit, not evidence quality.** All five chairs
  on this scale are propositions about **how much housing of what type is allowed where**: chair 1
  pairs strict character protection with *community votes before any rezoning*; chair 2 is duplexes
  and accessory units with design review; chair 3 is multifamily and mixed-use near commercial
  corridors; chair 4 is broad upzoning with reduced parking; chair 5 is eliminating single-family-only
  zoning. Hubbard's position concerns **the maximum height of one non-residential structure under a
  conditional use permit** — it is a building-height and CUP question, not a housing-density question.
  He has **not** called for community votes before rezoning, and **CBS Texas's June 15, 2026 piece was
  interrogated on exactly this point and contains no statement from him about housing density,
  multifamily housing, or residential development at all.** Rendering him at chair 1 would publish a
  housing-density claim he has never made, inferred from a religious-land-use dispute — which is the
  banned **cross-topic inference** class ("a quote about topic X may not set topic Y"), and it is the
  same shape of near-miss the 222-01 audit deleted from production. **Blank, not defaulted, and
  flagged for operator review rather than quietly dropped.** Nothing was inferred in the opposite
  direction either — no view was attributed to him about the religious institution itself, and
  religion is never a basis for inference in this phase.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **growth-and-development** — no
  chair-locating position. His campaign framing is *"committed to preserving Fairview's unique charm
  while ensuring responsible growth, fiscal stewardship, and open, transparent governance"* — the
  textbook **generically evaluative** formulation, indistinguishable across chairs 2, 3 and 4, and the
  precise class the 222-01 audit deleted. The steeple dispute is about one structure's height, not
  about growth pace, annexation, approval speed or permitting fees, and was not carried across. Nothing
  found on growth caps, voter approval for large developments, or infrastructure-ahead-of-growth
  sequencing. **Fairview's own low-density, one-acre-minimum zoning pattern is town policy, not
  Hubbard's stated position**, and was not used as a default.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **housing** — no position found
  on what role government should play in housing affordability. Nothing on public housing, rent caps,
  inclusionary requirements, affordable-project subsidy, first-time-buyer assistance, permit
  streamlining, or leaving prices to the market.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **economic-development** — no
  position found on incentives, abatements, Chapter 380 agreements, community-benefit or job-quality
  conditions. **This is the blank most at risk of a bad inference and it was refused deliberately:**
  Hubbard is a **Certified Economic Developer (CEcD)** who teaches and consults on economic
  development and sits on the **Texas Economic Development Council**, and Fairview has an active EDC
  with projects (Fairview Crossing, Sloan Corners, Fairview Town Center) he could plausibly be assumed
  to have views on. **Credential, profession and board service are adjacency and set no chair**, and
  no Hubbard statement about any actual Fairview incentive decision was found.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **public-safety-approach** — no
  chair-locating position. Fairview runs its own police department (a chief plus 19 full-time
  officers), but nothing was found in which Hubbard states a position on staffing levels, pay,
  equipment, crisis-response or mental-health co-responders, or redirecting police budget. His service
  alongside the Police and Fire Chiefs at council meetings is not a position.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **transportation-priorities** —
  no statement found setting any transportation mode against another. The April 29, 2025 minutes
  record a unanimous 7-0 authorisation for the Town Manager to settle a **right-of-way acquisition for
  Fairview Parkway** — a real-property settlement taken out of executive session with no stated
  reasoning of any kind, which locates nothing; and a roadway right-of-way purchase is not a mode
  tradeoff. Nothing found on transit, bike lanes, sidewalks or parking requirements.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **homelessness** — no statement
  or vote found on people sleeping or camping in public spaces. No Fairview camping ordinance,
  encampment policy or shelter decision surfaced, and none was inferred.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **local-immigration** — no
  statement found on the Fairview Police Department's relationship to federal immigration enforcement,
  ICE detainers, or information sharing. **Texas SB 4 is state law, not his position**, and was not
  used as a default.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **civil-rights** — no on-topic
  position found on racial or social inequality. The temple dispute is a **land-use and building-height
  matter** and was **deliberately not** read as a civil-rights or religious-liberty position in either
  direction: doing so would require inferring a stance on institutional equity from a zoning vote,
  which is both cross-topic inference and an identity-adjacent inference, and both are forbidden. No
  inference was drawn from any religious, demographic or affiliation characteristic of anyone involved.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **taxes** — **researched, no
  chair written per the settled 2026-07-25 operator ruling; and separately, nothing chair-locating was
  found even for the register.** His only tax-adjacent language is the campaign phrase *"fiscal
  stewardship"*, which is generically evaluative and reaches no chair on any scale. Fairview funds
  infrastructure projects partly from sales-tax revenue, but that is a description of the town's
  finance structure, not his position. Chairs 1–2 require raising taxes specifically on wealthy people
  and large companies and chairs 4–5 require scaling public services back; nothing found does either.
  No taxes row was written.
- John Hubbard — Fairview — `72b80f6a-82b3-4872-a10f-e95e2cd3f90f` — **healthcare** — no statement
  found on healthcare access. Expected: all five chairs describe **national** healthcare policy, which
  a town mayor holds no position on by role. **His seat on the Methodist Charlton Medical Center
  Advisory Board was deliberately not used** — hospital board service is adjacency, and it is not a
  position on the government's role in coverage. No health-adjacent fact was stretched into a chair.

**Fairview reconcile:** John Hubbard appears in **bucket 2 for all 11 topics** and in bucket 1 for
none. He is the only Fairview name in plan 222-08's scope and he is accounted for — not in neither
bucket, not in both. Fairview's Town Council seats are out of this plan's scope and belong to
222-11/222-12/222-13. **Fairview therefore does NOT flip to `hasContext: true` in
`src/lib/coverage.js` from this plan** (RESEARCH.md Pitfall 5) — it remains at zero stances.

---

## City of Farmersville (4825488) — 222-08

**Attempted:** 2026-07-25 — **Mayor Craig Overstreet** (`e7f04a34-b8e7-4978-87d6-60ece59ced92`), the
sole Farmersville officeholder in plan 222-08's scope, against **all 11** canonical compass topics (11
pairs). Verified at `stance_count = 0` against production before any research began. **Only the mayor
is in scope here; Farmersville's five council seats (Coleman Strickland Place 1, Russell Chandler
Place 2, Kristi Mondy Place 3, Mike Henry Place 4, Tonya Fox Place 5) are covered by plans
222-11/222-12/222-13** and are deliberately absent from this section. See the 222-08 preamble in the
Anna section above for the Murphy/Princeton/Melissa scope cut.

**Result: 0 chairs. All 11 topics are honest blanks.** Farmersville is a 222-RESEARCH.md §C **Tier
"Low"** city and this is the expected outcome — but unlike Anna, it is **not** the result of a fetch
failure. Farmersville's official minutes were **obtained and read in full**, and the zero is a real
finding about the record rather than a gap in access.

**⚠ THE STRUCTURAL FINDING FOR FARMERSVILLE — read this before 222-11/222-12/222-13 spend budget
here. The Mayor of Farmersville does not vote on ordinary business.** Across both full meetings read
this session, every recorded vote is tallied among the five councilmembers only — "The motion was
approved unanimously (5-0)" with all five present, "(3-0)" with three present — and Overstreet appears
in the record exclusively in a **presiding** capacity: he calls the meeting to order, leads the
pledges, reviews the calendar, opens and closes each item and each public hearing, reads ordinances
and resolutions **into the record**, and asks clarifying questions of staff and consultants. Under
this plan's rule 5, **presiding is not a position** — a mayor reading an ordinance into the record and
calling the vote holds no chair by that fact. This structurally suppresses the strongest evidence type
(a recorded vote) for this particular officeholder while leaving it fully available for his council,
which is exactly why the council plans should expect a better hit rate in Farmersville than this
mayoral pass achieved.

**Evidence checked:**
- **PRIMARY DOCUMENTS — two complete sets of official Farmersville City Council minutes, downloaded
  and read page by page, signed and attested by City Secretary Tabatha Monk:**
  - **June 15, 2026 Regular Session** (9 pages, `farmersvilletx.com/media/10981`, signed "Craig
    Overstreet, Mayor"): the Farmersville Community Development Corporation budget amendment; a
    Resolution finding public necessity and **authorizing condemnation / eminent domain** to acquire
    2.677 acres of right-of-way for +/- 3,400 feet of **Farmersville Parkway** east of Collin Parkway
    and west of State Highway 78; a Farmersville Parkway construction update from Dunaway engineer
    Jacob Dupuis; a **Collin County Outer Loop Segment 5 (Northeast)** route discussion; board
    appointments; and the appointment of Dr. Angela Smith as City Manager.
  - **September 15, 2025 Regular Session** (8+ pages, `farmersvilletx.com/media/8896`): the Master Fee
    Schedule water and electrical rate amendment; adoption of the FY 2025-2026 tax appraisal roll; the
    **public hearing on the tax rate**; the Atmos Energy Mid-Tex rate-review settlement; a TxDOT
    safety-lighting agreement; the **$424,900 purchase of 111 North Johnson Street as a base of
    operations for the Police Department** with $350,000 budgeted for improvements and a $340,000 loan
    authorisation; two **opioid-manufacturer settlement** participation resolutions (including Purdue
    Pharma); and a FEDC land/residential-structure purchase up to $215,000.
  Both were reached through the city's Drupal meetings index
  (`farmersvilletx.com/meetings/recent?...&boards-commissions=71`), which exposes agenda, packet and
  minutes PDFs at plain `/media/NNNN` URLs — **a readable, date-filterable route worth reusing.**
- **Official City of Farmersville site** (`farmersvilletx.com`) — Overstreet's directory listing
  (`/mayor-council/directory-listing/craig-overstreet`) fetched and read: it is a **staff-directory
  entry only** ("Position: Mayor" plus phone, email and the 205 South Main Street address). **No
  biography and no policy statement of any kind** — this is not a bio-page-only stance source, it is
  not even a bio page.
- **The Farmersville Times** (`farmersvilletimes.com`), the town's own newspaper and the richest
  potential secondary source, searched and sampled:
  - *"School bond passes 2 to 1, Overstreet elected mayor"* (**May 4, 2024**) — Overstreet, a former
    councilmember, defeated the incumbent Mayor Bryon Wiebold with **55.68% of 625 votes cast**. A
    contested race, but no policy content.
  - *"New mayor sets priorities"* (**May 23, 2024**) — fetched. Despite the headline, the accessible
    text contains **no priorities and no positions**; the only quotation attributed to Overstreet is
    *"I have a lot of questions that need answers."* The article defers the substance to the print /
    digital edition.
  - *"A year of tough choices, steady growth for Farmersville"* (**December 31, 2025**) — fetched and
    interrogated directly for Overstreet quotes. It covers the council's 2025 decisions at length
    (budget pressure, a tax rate adopted at 72.5 cents per $100, service reductions, infrastructure,
    emergency services) and **mentions Overstreet exactly once, in a photograph caption** from the
    February 18, 2025 ceremony honouring former mayor Joseph E. Helmberger. **No quotation and no
    position.**
  - *"City manager provides street projects update"* (November 21, 2024) and *"Council hears first look
    at 2025-26 budget"* (June 19, 2025) — staff-reported items; no Overstreet position.
- **TML City Officials Directory, Texas State Directory** — bare directory entries.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position:
- **Council meeting VIDEO was not watched.** Farmersville streams and archives its meetings on
  **BoxCast** (`boxcast.tv/channel/pjlmoamwdrud0o6wncn9`). Video is not readable by this pass. Because
  the written minutes **paraphrase** rather than transcribe, the video is where any actual Overstreet
  phrasing lives; it is the highest-value unread Farmersville source.
- **Only 2 of roughly 50 available council meetings were read.** Farmersville meets on the 1st and 3rd
  Mondays plus frequent special and budget-work sessions, and the index exposes minutes back through at
  least 2025. The two read were chosen as the highest-yield candidates (a full regular meeting under
  the current mayor, and the tax-rate/public-safety-purchase meeting). **The great majority of this
  council's record remains unread**, and a deeper pass is cheap here because the documents are directly
  addressable — but see the "mayor does not vote" finding above for why the yield for *this* person is
  likely to stay low.
- **The Farmersville Times is effectively paywalled** for full article text — the two most promising
  pieces both truncate to a teaser, and *"New mayor sets priorities"* explicitly directs readers to the
  print or digital edition. The full May 23, 2024 edition would be the single best place to find this
  mayor's stated priorities and **could not be obtained**.
- **No Ballotpedia individual candidate page** — Farmersville's population is roughly 4,000, far below
  Ballotpedia's "100 largest cities" scope, and per 222-08's instructions no fetch cycles were spent
  guessing Ballotpedia URLs for this town. **No VOTE411 or League of Women Voters of Collin County
  questionnaire** was found for the Farmersville mayoral seat; `lwvcollin.org` has returned **HTTP
  403** all phase. **No Community Impact candidate Q&A** exists for Farmersville — Community Impact's
  Collin County coverage does not extend to this city.
- Overstreet's **campaign Facebook page** ("Craig Overstreet for Farmersville Mayor") was not fetched —
  Facebook is not fetchable here, and social posts are not treated as evidence of a policy position
  absent a direct citable quote. It is the most likely place a 2024 campaign platform survives.
- **No State-of-the-City address** by this mayor could be found.

### Craig Overstreet — Mayor — `e7f04a34-b8e7-4978-87d6-60ece59ced92`

Sourced: **none.** All 11 topics blank. Elected mayor May 2024 after service as a councilmember,
defeating the incumbent 55.68%–44.32% on a 625-vote turnout.

- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **transportation-priorities**
  — no chair-locating position, **and this is the closest miss for Farmersville.** He speaks at length
  and on the record about roads. On the **Collin County Outer Loop Segment 5** item of June 15, 2026 the
  minutes attribute to him: TxDOT and the Collin County Commissioners have narrowed four candidate
  routes to two; *"what the Mayor has seen is the intersection with the outer loop as it relates to 380
  right now… It looks like it's going to be very inconvenient for our residents or people getting off
  the Collin County Loop to try and go either east or west"*; *"We don't need to be going east to be
  able to turn back west, and that is what it appears to be now on the drawings they have. It maybe an
  effort to save money on their side… but is not a workable situation for our residents"*; two of the
  four routes come within about a mile of the 2194/Merit Street intersection at Brittany's Creek and
  *"the main concern is the on and off ramps, we do not think that is a positive situation for
  Farmersville."* He proposes to respond to the Commissioners by resolution. **This is interchange and
  ramp geometry on a county highway project, not a mode tradeoff.** Every chair on this scale allocates
  investment *between* modes — pedestrian/cycling/transit first (1), equal multimodal with mandatory
  bike lanes and sidewalks (2), maintain roads while selectively adding transit and pedestrian
  improvements (3), road capacity and traffic flow for the driving majority (4), highways and abundant
  free parking as the foundation of policy (5). Arguing that a specific ramp configuration is
  inconvenient for residents does not choose among those; he never sets roads against transit, bikes or
  sidewalks, and he is not deciding Farmersville's own investment mix at all — the Outer Loop is a
  county and TxDOT project. Likewise the **Farmersville Parkway** items: he presided over a
  condemnation resolution and questioned the engineer on paving schedule (*"asked if assuming we don't
  have a lot of weather days if he thinks they have another 30 days to pour the remaining thousand feet
  up to Wilcoxson"*), which is **project management, not a policy position**; a roadway right-of-way
  acquisition is a capital action, and per this phase's settled rules a road project bundled with
  utilities, drainage and grading is **not** a transportation mode tradeoff. Blank, not defaulted.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **public-safety-approach**
  — no chair-locating position. The September 15, 2025 meeting authorised a **$424,900 purchase of 111
  North Johnson Street to serve as a base of operations for the Police Department**, with $350,000
  budgeted for improvements and a $340,000 loan; the Police Chief and Fire Marshal attend council
  meetings with members of their departments; and the Farmersville Times reports the council allowed
  the fire marshal's office to pursue law-enforcement designation for independent arson investigations,
  and that police calls for service rose from 6,134 in 2023 to 9,178 in 2024. **None of that is
  Overstreet's position.** He did not vote on the purchase (the five councilmembers did, 5-0); his only
  recorded contribution was to ask *"about improvements needed"* on the building. **Capital-project
  attribution is an expressly refused defect class** — a facility acquired during a tenure is not a
  funding-level position — and buying a police building says nothing about staffing, pay, equipment,
  crisis-response teams, unarmed co-responders, or redirecting police budget. Blank.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **economic-development** —
  no position found on incentives, abatements, community-benefit or job-quality conditions, **and this
  blank was refused deliberately against a lot of tempting material.** Overstreet is the council's
  **liaison to the Farmersville Economic Development Board (FEDC, Type A)** and reports its actions to
  the council in detail: a $41,386.00 fire-suppression grant to Jinger McTee, a completed business
  development grant to Main Street Antiques, a fire-suppression grant to Doug Lobby of Lake Lavon
  Lakeland Properties, a pay application for 12 Stories Coffee at 206 McKinney Street, a $5,085.00
  business development grant for the Edward Jones building, a Kodiak Fire Suppression pay application, a
  billboard-leasing discussion, a downtown-strategies proposal on which the board took no action, and a
  FEDC land-and-residential-structure purchase up to $215,000. **Liaison reporting is adjacency, and
  relaying a board's decisions is not holding a position** — the grants are FEDC board actions, he does
  not vote on them at council, and he is never recorded arguing for or against the practice of granting
  them. Reading `economic-development` off an EDC liaison seat is precisely the adjacency defect the
  222-01 audit deleted from production. Blank.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **residential-zoning** —
  no position found on density or neighborhood character. Farmersville has a Planning & Zoning
  Commission whose meetings are reported to council by Councilmember Henry as liaison, but no zoning
  case with an Overstreet position appeared in either meeting read, and he does not vote. Nothing was
  inferred from the city's existing zoning pattern; **city policy is not the individual's position.**
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **housing** — no position
  found on what role government should play in housing affordability. Nothing on public housing, rent
  caps, inclusionary requirements, affordable-project subsidy, first-time-buyer assistance, permit
  streamlining, or leaving prices to the market. The FEDC's purchase of "land and residential
  structures" up to $215,000 is a **business-development land assembly** under Texas Local Government
  Code § 501.103, not a housing-affordability program, and was not stretched into one.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **growth-and-development**
  — no chair-locating position on growth pace. Nothing found on growth caps, voter approval for large
  developments, approval speed, permitting fees, or building infrastructure ahead of growth. The
  Farmersville Times' framing of 2025 as *"a year of tough choices, steady growth"* is **the
  newspaper's characterisation, not his statement**, and the one growth-adjacent sentence he is
  recorded uttering — praising the incoming city manager's *"experience in capital planning,
  comprehensive plan updates, and identifying new revenue opportunities"* and calling her *"the perfect
  fit for our growing community"* — is a **hiring endorsement**, and generically evaluative besides.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **homelessness** — no
  statement or vote found on people sleeping or camping in public spaces. No Farmersville camping
  ordinance, encampment policy or shelter decision appeared in either meeting read or in any Times
  coverage, and none was inferred.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **local-immigration** — no
  statement found on the Farmersville Police Department's relationship to federal immigration
  enforcement, ICE detainers, or information sharing. **Texas SB 4 is state law, not his position**,
  and was not used as a default.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **civil-rights** — no
  on-topic position found on racial or social inequality. Nothing in either set of minutes or in any
  Times coverage engages that axis. **No inference was drawn from any identity, demographic, religious
  or affiliation characteristic** — that inference class is forbidden and was the basis of deletions
  from two Richardson records on 2026-07-25.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **taxes** — **researched,
  no chair written per the settled 2026-07-25 operator ruling.** The material is preserved here verbatim
  for any future municipal-scope rewrite. Farmersville held its **tax-rate public hearing on September
  15, 2025**; the council then approved Resolution R-2025-0915-000 *"approving the proposed tax rate of
  no new revenue at .827244 per $100 valuation"* unanimously (5-0), on Councilmember Henry's motion
  seconded by Councilmember Mondy, and the Times reports a rate ultimately adopted at 72.5 cents per
  $100 amid lower-than-expected ad valorem collections, reduced sales-tax revenue, rising expenses and
  service reductions; Finance Manager John Lawrence told the council *"part of the problems we are
  coming up against is through Collin County as property values have decreased."* **Overstreet's own
  recorded contribution to that hearing was entirely procedural** — he opened the item, opened the
  public hearing at 6:35 p.m., closed it at 6:48 p.m., and read the resolution into the record — and he
  cast no vote. Nothing here reaches a chair on any reading: chairs 1–2 require raising taxes
  specifically on wealthy people and large companies, chairs 4–5 require committing to scale public
  services back, and adopting a **no-new-revenue** rate does neither. Three further refusals apply and
  are recorded so a later pass does not relitigate them: the **appraisal-district value complaints**
  aired at that hearing belong to resident **Jim Foy**, not to Overstreet, and an appraisal-value
  grievance is expressly refused as taxes evidence in any case; resident **Randy Smith's** objection to
  using the TIRZ district to back the general fund is likewise a resident's view; and the **Master Fee
  Schedule water and electrical rate amendment** and the **Atmos Energy Mid-Tex rate-review settlement**
  (9.27% residential / 6.56% commercial, about $7.83 more per residential month) are **fee and utility
  ratemaking, separately refused as taxes evidence under the 222-06 rule**. No taxes row was written.
- Craig Overstreet — Farmersville — `e7f04a34-b8e7-4978-87d6-60ece59ced92` — **healthcare** — no
  statement found on healthcare access. Expected: all five chairs describe **national** healthcare
  policy, which a city mayor holds no position on by role. Two health-adjacent items were examined and
  **deliberately not stretched into a chair**: on September 15, 2025 the council authorised Overstreet
  to execute participation and release forms in the **opioid-litigation settlements with eight
  manufacturers and with Purdue Pharma, LP** — joining a multistate settlement as a political
  subdivision is a litigation-administration act with no stated reasoning of any kind and locates no
  chair on the government's role in coverage — and the purchase of 111 North Johnson Street from
  Community Health Service Agency, Inc. d/b/a Carevide is a **real-estate transaction whose seller
  happens to be a health provider**, which says nothing about anyone's healthcare-access position.

**Farmersville reconcile:** Craig Overstreet appears in **bucket 2 for all 11 topics** and in bucket 1
for none. He is the only Farmersville name in plan 222-08's scope and he is accounted for — not in
neither bucket, not in both. Farmersville's five council seats are out of this plan's scope and belong
to 222-11/222-12/222-13. **Farmersville therefore does NOT flip to `hasContext: true` in
`src/lib/coverage.js` from this plan** (RESEARCH.md Pitfall 5) — it remains at zero stances.

---

## City of Parker (4855152) — 222-08

**Attempted:** 2026-07-25 — **Mayor Lee Pettle** (`61f73b44-c46d-4f1b-91a7-0d35c83feecb`), the sole
Parker officeholder in plan 222-08's scope, against **all 11** canonical compass topics (11 pairs).
Verified at `stance_count = 0` against production before any research began. **Only the mayor is in
scope here; Parker's council seats (Mayor Pro Tem Buddy Pilgrim, Billy Barron, Roxanne Bogdan, Colleen
Halbert, Darrel Sharpe) are covered by plans 222-11/222-12/222-13** and are deliberately absent from
this section. See the 222-08 preamble in the Anna section above for the Murphy/Princeton/Melissa scope
cut.

**Result: 0 chairs. All 11 topics are honest blanks.** Parker is a 222-RESEARCH.md §C **Tier "Low"**
city and this is the expected outcome — but, as with Farmersville and unlike Anna, the zero is a
**finding about the record, not a fetch failure**: Parker's official minutes were obtained and read in
full, and its single most contested civic controversy was traced to primary documents.

**⚠ THE STRUCTURAL FINDING FOR PARKER, same shape as Farmersville: the Mayor of Parker does not vote
on ordinary business.** In the July 7, 2026 minutes read in full, every motion carried **4-0** among
the four councilmembers present, and Pettle appears exclusively **presiding** — calling the workshop
and the regular meeting to order, turning the floor over to staff, reviewing the community-interest
calendar, asking the P&Z chair to present a recommendation, recessing to and reconvening from executive
session, asking for future agenda items, thanking donors, and adjourning. Under this plan's rule 5,
**presiding is not a position.** Parker's evidence-rich controversy is likewise led by others (below),
so the strongest evidence types are structurally unavailable for *this* person while remaining fully
available for her council — which the council plans should expect.

**Evidence checked:**
- **PRIMARY DOCUMENT — the official City of Parker City Council minutes of July 7, 2026, read in full
  (7 pages, `parkertexas.us/Archive.aspx?ADID=4331`, bearing the City of Parker, Collin County, Texas
  seal, signed "Mayor Lee Pettle" and attested by City Secretary Patti Scott Hull, approved July 21,
  2026).** This both **confirms Pettle's identity and seat** and covers: a "Budget 101" FY2026-2027
  workshop; the **Green Meadows preliminary plat** approved with conditions and two variances (a
  cul-de-sac exceeding the 600-foot maximum under §155.052(17), and the two-points-of-access
  requirement under §155.049(1)(b)); the **McCreary Meadows final plat**; City Hall remodelling not to
  exceed $23,000; **Resolution 2026-904** authorising an $8,769,420 Texas Water Development Board
  Water Supply and Infrastructure Grant application (100% grant, no local match) for a new
  1,000,000-gallon elevated storage tank on Whitestone Drive; **Ordinance No. 918** on fire prevention
  (fireworks and open burning), on which **no action was taken**; **Resolution 2026-905**, Amendment #6
  to the **Jail Services Agreement between the City of Parker and Collin County**; updates on FM2551,
  the TCEQ wastewater-permit re-hearing, MUD discovery, Lewis Lane striping, drones, and Restore the
  Grasslands; and a donations acceptance item.
- **PRIMARY DOCUMENT — the City of Parker's "Open Letter to Residents" of March 12, 2026**
  (`parkertexas.us/DocumentCenter/View/4108`), downloaded and read in full. See the refusal analysis
  below — it is signed **"Your Parker City Council and Mayor"** collectively and states **no
  substantive position**.
- **The City's "Restore the Grasslands Transparency" page** (`parkertexas.us/468/...`), fetched and
  interrogated specifically for Pettle attributions. It records the City's willingness to move toward
  **170 detached single-family homes** rather than RTG's 624 lots and a commitment to preserving
  Parker's *"rural character, infrastructure standards, and quality of life"*, notes the property lies
  **outside city limits**, limiting direct influence, and links four documents (the Open Letter, the
  List of Key Issues 03-12-2026, a Gregory Lane nonsuit update 04-12-2026, and a Revised List of Key
  Issues 06-04-2026). **Asked directly: Mayor Lee Pettle is not named or quoted anywhere on it** — the
  updates reference *"the Mayor and City Council"* collectively and attribute no statement to any
  individual.
- **Murphy Monitor** (`murphymonitor.com`, the Star Local Media title covering Parker), which is
  fetchable and is the richest secondary source for this city — *"Restore the Grasslands plat approved
  with conditions"* (**June 23, 2026**) fetched and read; *"New proposal for disputed development"*
  (June 23, 2025), *"Murphy exits fight over disputed development"* (April 9, 2026), *"Parker council
  reveals settlement offer for disputed development"* (April 24, 2024) and *"Community discusses
  disputed development"* (March 21, 2024) surveyed.
- **City of Parker official site** — the Elections page, the "City Election May 2, 2026 – List of
  Candidates" news flash, the May 2, 2026 campaign-finance listing, and the City Council minutes
  archive index (`Archive.aspx?AMID=40`, which exposes minutes back to 2009).
- **NBC 5 Dallas-Fort Worth**'s Collin County May 2, 2026 ballot rundown, and the Change.org and
  Communities & Creeks United petitions against the RTG development.

**⚠ WITHIN-CITY MISATTRIBUTION REJECTED — this is the exact trap that produced the wave-7 Doug Charles
error, and it was caught the same way.** Parker's Restore the Grasslands controversy is the single
richest vein of civic-position evidence in this city: a 624-lot, ~100-acre development by Dallas
developers Don and Phillip Huffines on unincorporated land between Parker and Murphy, with a proposed
wastewater plant discharging into Maxwell Creek and a **Municipal Utility District**, opposed by
residents through two petition drives, litigated, mediated, and conditionally approved 3-1 by the
Collin County Commissioners Court on June 22, 2026. It would have been very easy — and wrong — to
attribute the City's opposition to its mayor. **Every primary document says otherwise:**
- The **March 12, 2026 Open Letter** names **"Darrel Sharpe and Buddy Pilgrim"** as *"the Parker City
  Council representatives for discussions with RTG"*, and lists Pettle only among those who *"will all
  be engaged at various points."* Pettle is not the negotiator.
- The **Murphy Monitor's June 23, 2026** account of the plat approval quotes **Parker Mayor pro tem
  Buddy Pilgrim**, **County Judge Chris Hill** (voting record only) and county staff **Clarence
  Daugherty** and **Yoon Kim** — and **not Pettle at all**.
- In the **July 7, 2026 minutes**, the RTG and TCEQ/MUD updates are delivered by **Mayor Pro Tem
  Pilgrim** and **Councilmember Barron**; Pettle says nothing on them.
- The **transparency page** attributes to *"the Mayor and City Council"* collectively and to no
  individual.
A chair assigned to Pettle from this controversy would have been a body's position mapped onto its
presiding officer. **Rejected.**

**⚠ HOMONYM GATE — "PARKER" IS THE WORST NAME IN THIS PLAN, AND SEVERAL TRAPS WERE HIT AND REJECTED.**
"Parker" is simultaneously this Collin County city, a very common surname, and at least two other
places with their own councils. Specifically encountered and rejected this session:
- **Parker, COLORADO** (`parkerco.gov`) — a "Town of Parker" with its own **2026 Election Information**
  page, its own town council, and its own candidate coverage (`coloradocommunitymedia.com`, *"Get to
  know your candidates running for Parker town council"*, October 3, 2024). This is the most dangerous
  trap here because it publishes *candidate questionnaires* — exactly the D-05 source type this phase
  values most — for the wrong Parker.
- **Parker COUNTY, Texas** (`parkercountytx.gov`), a different jurisdiction near Fort Worth, whose
  election-information and campaign-finance pages and whose **Ballotpedia "Parker County, Texas,
  elections, 2026"** page surface on nearly every search for this city.
- **Mattie Parker**, Mayor of **Fort Worth**, and **Annise Parker**, former Mayor of Houston — surname
  collisions that dominate any search for "Parker mayor" statements, State-of-the-City addresses or
  priorities. A Fort Worth Chamber item headlined *"Mayor Parker Highlights Fort Worth's Progress and
  Priorities at State of the City Address"* is **not** a Parker, TX source and was rejected on sight.
Every source relied on above was pinned to **Parker, Collin County, Texas** by an explicit marker — the
5700 E. Parker Road Municipal Complex, the City of Parker/Collin County/Texas seal on the minutes, City
Secretary Patti Scott Hull's attestation, or Collin County Commissioners Court. Separately, **Pettle's
prior service on the Parker Planning & Zoning Commission was deliberately not used for any topic** —
commission service is adjacency, not a position.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position:
- **Ballotpedia's individual candidate page for Lee Pettle returned an EMPTY BODY** — the known
  phase-wide Ballotpedia failure. This one is a genuine loss rather than a scope gap: Ballotpedia
  **does** cover this race (a page exists for her opponent, *"Melissa Tierce (Mayor of Parker, Texas,
  candidate 2026)"*), so a **Candidate Connection survey for Pettle may well exist and simply could not
  be read.** That is the single highest-value unread source for this officeholder and a later pass
  should retry it first.
- **No candidate questionnaire or forum write-up was found for the contested May 2, 2026 mayoral
  race**, which Pettle won with **451 votes** to Melissa Tierce's **338** and Marcos Arias's **16**.
  The City announced that a **"Candidates' Night" was being planned for a date in April** 2026; no
  published account of it, and no Murphy Monitor candidate Q&A for the mayoral race, could be located.
  A three-way contested mayoral race with a candidates' forum is normally the richest possible source
  for this phase, and its written record appears not to exist online.
- **Council meeting VIDEO was not watched.** Parker streams through **Swagit/Granicus** (agenda packets
  surfaced from `swagit-attachments.granicus.com`). Video is not readable by this pass, and because
  Parker's minutes are action-oriented rather than verbatim, the video is where any actual Pettle
  phrasing lives.
- **Only 1 of the many available council meetings was read in full.** Parker's archive exposes minutes
  back to 2009 and the council meets at least monthly with frequent special meetings (July 7, June 30,
  June 22, June 16, June 2, May 19, May 12, April 21, April 7 and March 10, 2026 are all indexed). The
  July 7, 2026 regular/workshop meeting was chosen as the most recent full meeting under the current
  mayor. **The great majority of this council's record remains unread**, and the documents are directly
  addressable — but see the "mayor does not vote" finding for why the yield for this person is likely
  to stay low.
- **No VOTE411 or League of Women Voters of Collin County questionnaire** was found for the Parker
  mayoral seat; `lwvcollin.org` has returned **HTTP 403** all phase. **No Community Impact coverage** of
  Parker exists. **No State-of-the-City address** by this mayor could be found. **No campaign site** for
  Pettle was located, and any campaign Facebook page was not fetched (Facebook is not fetchable here,
  and social posts are not treated as evidence of a policy position absent a direct citable quote).
- The **List of Key Issues (03-12-2026)**, the **Revised List of Key Issues (06-04-2026)** and the
  **Gregory Lane nonsuit update (04-12-2026)** were not individually opened. They are **City-drafted
  negotiating documents**, not statements by any individual, and the Open Letter that transmits them
  expressly calls the list *"a discussion guide only… not intended to represent final legal language"* —
  so they could not have located an individual chair for Pettle even if read. Recorded for completeness.

### Lee Pettle — Mayor — `61f73b44-c46d-4f1b-91a7-0d35c83feecb`

Sourced: **none.** All 11 topics blank. Re-elected mayor on May 2, 2026 in a three-way contested race
(451 votes to 338 to 16); previously a member of Parker's Planning & Zoning Commission.

- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **residential-zoning** — no position
  found on density or neighborhood character, **and this is the closest miss in Parker.** The City of
  Parker is on record preferring **170 detached single-family homes** over RTG's **624 lots** and
  committing to preserve its *"rural character, infrastructure standards, and quality of life."* That
  is a genuine density position — **but it is the City's, not demonstrably hers.** The March 12, 2026
  Open Letter that is the City's own public statement of the matter is signed **"Your Parker City
  Council and Mayor"** with no individual signature, was authored by a third party (the PDF's creator
  metadata reads "Lindy Pilgrim"), names Sharpe and Pilgrim as the negotiators, and — decisively — takes
  **no substantive position at all**: it says *"no specific offers have been proposed or accepted by
  either side, Parker has not agreed to any specific terms"*, that the accompanying list is *"a
  discussion guide only"*, that *"all legal options remain on the table"*, and that *"there is no
  guarantee that discussions will yield any particular outcome."* It is a **process letter**. The
  transparency page's density figures are staff/City negotiating positions attributed to no individual.
  A collective institutional position mapped onto the presiding officer is the banned pattern; and
  **an existing city posture is not the individual's position** (the city-policy-default refusal).
  Furthermore the site is **outside Parker's city limits** and was platted by **Collin County**, so
  this was never a Parker zoning decision at all. The two plats Parker's own council did act on that
  night — Green Meadows and McCreary Meadows — passed **4-0 with Pettle not voting and not speaking**,
  and both were **housekeeping** matters (cul-de-sac length and points-of-access variances; a FEMA
  Letter of Map Revision condition), not density-policy choices. Blank, not defaulted.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **growth-and-development** — no
  chair-locating position on growth pace. Everything available is the same RTG material refused above,
  plus the fact that Parker filed for a **TCEQ re-hearing on the wastewater-treatment-plant permit** and
  is engaged in **MUD discovery** — municipal litigation strategy reported to council by **Mayor Pro Tem
  Pilgrim**, not a Pettle statement, and adopted institutionally rather than argued individually.
  Nothing found in which she states a view on annexation, approval speed, permitting fees, growth caps,
  or infrastructure-ahead-of-growth sequencing. Parker's own low-density character (a former rural farm
  area, D Magazine's #1 place to live in Collin County) is **the city's condition, not her position**,
  and was not used as a default.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **housing** — no position found on what
  role government should play in housing affordability. Nothing on public housing, rent caps,
  inclusionary requirements, affordable-project subsidy, first-time-buyer assistance, permit
  streamlining, or leaving prices to the market. The RTG dispute concerns **whether and at what density
  a development proceeds**, not the affordability of housing, and was not carried across.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **public-safety-approach** — no
  chair-locating position. On July 7, 2026 the council approved **Amendment #6 to the Jail Services
  Agreement with Collin County** — Sharpe moved, Barron seconded, carried 4-0, **Pettle neither voting
  nor speaking**, and with **no stated reason of any kind** in the record. Contracting jail bed space
  from the county is an interlocal service arrangement, not a position on how the city funds and
  operates public safety; and an unexplained (indeed non-participating) approval cannot separate chair 4
  (increase staffing, equipment and pay), chair 3 (add crisis-response teams) or chair 1 (redirect
  police budget). Nothing found on staffing levels, pay, equipment, mental-health co-responders, or
  redirecting police budget. That the Police Sergeant, a Police Officer and the Fire Chief attend her
  meetings is not a position.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **transportation-priorities** — no
  statement found setting any transportation mode against another. Her only transportation-adjacent
  recorded act is procedural: on the **FM2551** update she *"noted this meeting will be held as soon as
  possible"* about a TxDOT town hall for Parker residents — scheduling, not policy. The Lewis Lane
  buttons-and-striping update came from the Public Works Director. Nothing found on transit, bike lanes,
  sidewalks, parking requirements, or road capacity as a stated priority.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **economic-development** — no position
  found on incentives, abatements, Chapter 380 agreements, community-benefit or job-quality conditions.
  Nothing in the minutes read or in any Murphy Monitor coverage records her on a Parker incentive or
  abatement decision. The **$8,769,420 Texas Water Development Board grant application** for an
  elevated storage tank is the City pursuing 100%-grant state infrastructure funding with no local
  match — **not a business-incentive position** — and she did not vote on it (Halbert moved, Barron
  seconded, 4-0).
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **homelessness** — no statement or vote
  found on people sleeping or camping in public spaces. No Parker camping ordinance, encampment policy
  or shelter decision surfaced, and none was inferred. **Ordinance No. 918 on fire prevention
  (fireworks and open burning) was examined and is not on this axis** — open-burning regulation is a
  fire-safety matter, not a public-camping measure — and in any event **no action was taken** on it.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **local-immigration** — no statement
  found on the Parker Police Department's relationship to federal immigration enforcement, ICE
  detainers, or information sharing. **Texas SB 4 is state law, not her position**, and was not used as
  a default. The Jail Services Agreement with Collin County was **specifically considered and refused**
  as evidence on this axis: it is a bed-space contract with no immigration-detainer content whatsoever,
  and reading detainer policy into it would be fabrication.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **civil-rights** — no on-topic position
  found on racial or social inequality. Nothing in the minutes read, the City's letters, or any Murphy
  Monitor coverage engages that axis. **No inference was drawn from any identity, demographic,
  religious or affiliation characteristic** — that inference class is forbidden and was the basis of
  deletions from two Richardson records on 2026-07-25.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **taxes** — **researched, no chair
  written per the settled 2026-07-25 operator ruling; and separately, nothing chair-locating was found
  even for the register.** The July 7, 2026 workshop was a **"Budget 101"** session in which
  Finance/Human Resources Director **Grant Savage** presented the FY2026-2027 budget calendar, the
  City's fund structure, departmental staffing levels, general-fund revenues, property taxes and
  historical information, and *"requested percentage of M&O and I&S"*. **That is staff testimony**;
  Pettle's only recorded contributions were to turn the meeting over to Savage and to adjourn the
  workshop at 6:21 p.m. She stated no view on the rate, on the maintenance-and-operations versus
  interest-and-sinking split, or on service levels. Chairs 1–2 require raising taxes specifically on
  wealthy people and large companies and chairs 4–5 require committing to scale public services back;
  nothing found does either. No taxes row was written.
- Lee Pettle — Parker — `61f73b44-c46d-4f1b-91a7-0d35c83feecb` — **healthcare** — no statement found on
  healthcare access. Expected: all five chairs describe **national** healthcare policy, which a city
  mayor holds no position on by role. No health-adjacent remark was stretched into a chair.

**Parker reconcile:** Lee Pettle appears in **bucket 2 for all 11 topics** and in bucket 1 for none.
She is the only Parker name in plan 222-08's scope and she is accounted for — not in neither bucket,
not in both. Parker's council seats are out of this plan's scope and belong to 222-11/222-12/222-13.
**Parker therefore does NOT flip to `hasContext: true` in `src/lib/coverage.js` from this plan**
(RESEARCH.md Pitfall 5) — it remains at zero stances.

---

## City of Lucas (4845012) — 222-08

**Attempted:** 2026-07-25 — **Mayor Dusty Kuykendall** (`0ea8bc33-1629-41b4-8ae9-da74c3e2b44c`), the
sole Lucas officeholder in plan 222-08's scope, against **all 11** canonical compass topics (11 pairs).
Verified at `stance_count = 0` against production before any research began. **Only the mayor is in
scope here; Lucas's council seats (Mayor Pro Tem Debbie Fisher Seat 5, Jonathan Underhill Seat 1,
Rebecca Orr Seat 2, Chris Bierman Seat 3, Phil Lawrence Seat 4, Neil Peterson Seat 6) are covered by
plans 222-11/222-12/222-13** and are deliberately absent from this section. See the 222-08 preamble in
the Anna section above for the Murphy/Princeton/Melissa scope cut.

**Result: 0 chairs. All 11 topics are honest blanks — and this is the single most frustrating and most
recoverable zero in the whole of plan 222-08.**

> ### 🔴 ACTION FOR THE OPERATOR — one 403 is standing between this phase and a real chair
>
> **A VOTE411 candidate questionnaire EXISTS for a CONTESTED Lucas mayoral race, and it appears to
> contain an explicit `residential-zoning` position in Kuykendall's own words. It could not be read
> because the page returns HTTP 403 to this session's fetcher.**
>
> **URL:** `https://onyourballot.vote411.org/m/race-detail.do?id=50429844`
> (title: *"Lucas Mayor — vote411 Voter Guide"*; candidates **Dusty Kuykendall** and **Kathleen A.
> Peele**). Both the `/m/` mobile path and the non-mobile `race-detail.do` path return **403**.
>
> Search-index summaries of that page — **paraphrase, NOT verbatim, and explicitly recorded as such** —
> render his answers as: Lucas *"is unique in that it has stuck to its core vision of 'Keeping Lucas
> Country' by having low density, large lots and open spaces"*, and he is described as committing to
> preserve *"the city's low density, large lots and open spaces through zoning requirements that
> prevent high density"*; home lots in Lucas run around two acres with an average value of about $1.2
> million, and the city has no multifamily or high-density neighborhoods. The same summaries render
> his other priorities as roads and water: the city engineers use *"a data-driven road repair and
> maintenance schedule"* with funding as the constraint, requiring *"scrutiny of the city budget and
> working with fellow council members to allocate funds"*; Lake Lavon as the drinking-water source must
> be protected, with citizen *"water wise"* education and storm-run-off measures; and increased sales
> tax from commercial areas would let the city *"increase a higher percentage of its budget to roads
> and water with no taxable increase to citizens"*; plus traffic minimisation and trash cleanup through
> **Keep Lucas Beautiful**.
>
> **NO CHAIR WAS WRITTEN FROM ANY OF THAT, and that is deliberate, not an oversight.** Three
> independent rules forbid it: rule 5 of this plan requires reading the primary document rather than a
> search summary of it; the phase prohibits recording a source URL that was not actually fetched and
> read; and the self-audit contract requires re-fetching the cited source to confirm the wording is
> present, which a 403 makes impossible. A paraphrase also cannot settle whether the roads-and-water
> material is chair 3 or chair 4 of `transportation-priorities`.
>
> **If the operator can open that URL in a browser, `residential-zoning` for Dusty Kuykendall is the
> most likely chair in this plan to become real — very plausibly chair 1 — on the strongest source type
> D-05 recognises: his own answer in a contested-race candidate questionnaire.** It should be placed by
> a follow-on migration with the verbatim text, not by this plan.

**⚠ PHASE-WIDE DISCOVERY, worth more than this one city: VOTE411 race pages DO exist for Collin
County's small towns.** Phase 222 has been treating VOTE411 / League of Women Voters as a dead end
because `lwvcollin.org` has returned **HTTP 403** for the entire phase, and no plan before this one had
found a VOTE411 questionnaire for any Collin small-town seat. **This is the first one found.** The
blocker is a **403 on the `onyourballot.vote411.org` host**, not the absence of the resource. Plans
**222-09 through 222-17 should assume a VOTE411 race page may exist for every contested seat they
touch**, search for `onyourballot.vote411.org` race pages by city and office, and escalate the 403 to
the operator rather than recording "no questionnaire found." The race-detail URL takes the form
`onyourballot.vote411.org/m/race-detail.do?id=<numeric id>`.

**Evidence checked:**
- **The official City of Lucas "A Message from the Mayor" page** (`lucastexas.us/417/...`) — fetched
  and read in full. This is a genuine mayoral column, the strongest small-town source type, and it is
  **entirely generically evaluative**: Lucas is *"at an exciting point in its history"*, evolving from
  *"a quiet rural township into a thriving semi-rural suburban destination"*; the city is *"mindful of
  the challenges and opportunities that come with growth"*; it *"continues to invest strategically in
  roads, water systems, and essential public services"*; he is committed to *"preserving what makes
  Lucas special while embracing opportunities for responsible growth"* and to maintaining *"our
  community's rural character"*; and *"increasing traffic demands, infrastructure needs, and community
  expectations call for careful planning and forward-thinking leadership."* Interrogated directly, the
  page **does not address zoning, housing density, police or fire services, or taxes.** Every phrase
  above is the refused *"responsible growth" / "careful planning"* class.
- **The official City of Lucas site** — the City Council page (`/164/City-Council`, which confirms
  Kuykendall as Mayor with a term ending 2027 and gives the full council roster), the staff directory
  entry (`directory.aspx?EID=10`), the Planning & Zoning Commission pages, and the Agendas & Minutes /
  Agenda Center modules (see the access failure below).
- **TML City Officials Directory** and **Texas State Directory** — bare directory entries confirming
  the seat. Biographical material: over 20 years in corporate finance and business consulting, for the
  past 10 years CFO of a global software company (The Next Solutions, Inc.), and **former Chairman of
  the Lucas Planning & Zoning Commission** before his election. **All of that is adjacency and was used
  for nothing** — profession, tenure and commission service set no chair, and it would have been
  particularly tempting and particularly wrong to read `residential-zoning` off a P&Z chairmanship or
  `taxes`/`economic-development` off a CFO career.
- **VOTE411** (`onyourballot.vote411.org`) — the Lucas Mayor race page located; **403 on every path
  tried.** See the operator action box above.
- **Wikipedia (Lucas, Texas)**, `grisak.com`'s Lucas-zoning explainer, and general Collin County
  coverage — used only to confirm the city's factual profile (about 9,000–10,000 residents, roughly 18
  square miles in southeastern Collin County, no multifamily or high-density neighborhoods, roughly
  two-acre lots). **These describe the city, not the mayor.** Lucas's existing large-lot, low-density
  zoning is **city policy and was expressly NOT used as a default for his position** — the 222-08
  instructions single this exact trap out for Lucas, and it was declined.

**⚠ HOMONYM GATE — "LUCAS" AND "KUYKENDALL" BOTH COLLIDE BADLY; SEVERAL TRAPS WERE HIT AND REJECTED.**
- **Mayor Quinton Lucas of KANSAS CITY, Missouri.** This is the worst trap in this city, because he is
  a sitting big-city mayor whose surname is this city's name, and searches for "Lucas mayor" plus
  infrastructure, priorities or budget return him confidently and repeatedly. Specifically rejected
  this session: Fox4KC's *"Mayor Lucas outlines priorities once infrastructure money comes to Kansas
  City"*, KSHB's *"Kansas City Mayor Quinton Lucas reflects on 2025 achievements and 2026 priorities"*,
  the KCMO press release on the federal infrastructure package, and the KSHB "KC Mayor Promise
  Tracker." Any one of them, read carelessly, would have produced a fabricated infrastructure,
  transportation or housing chair for Dusty Kuykendall.
- **Lucas COUNTY, Ohio** (`co.lucas.oh.us`), which runs its own CivicEngage **Agenda Center** — i.e. a
  minutes archive that looks exactly like the one being searched for — and **Springfield Township,
  Lucas County, Ohio**, which publishes a **zoning resolution**. Rejected.
- **Marlin Kuykendall**, former Mayor of Prescott, Arizona, and **"The Kuykendall Coalition"**
  (`kuykendallcoalition.com`) — surname collisions, rejected.
Every source relied on above was pinned to **Lucas, Collin County, Texas** by an explicit marker — the
`lucastexas.us` official domain, the Collin County location statement, the Lake Lavon adjacency, or the
named council roster.

**Sources checked but unavailable this session** — recorded rather than treated as absence of a
position:
- **NO Lucas City Council minute was read this session, and Lucas's minutes could not be reached at
  all.** `lucastexas.us/AgendaCenter` renders only the search interface to a fetch and lists no
  documents; `AgendaCenter/City-Council-1` likewise; the search endpoint answers but returns **"No
  results found in All categories"** for an empty term and **"No results found for zoning"** for a
  dated 2025–2026 range across all categories; `/129/Agendas-Minutes` shows only navigation; and
  `/city-council-meetings/` returns **HTTP 404**. Lucas is the second of this plan's five cities (with
  Anna) whose written council record was **completely inaccessible**. A future pass should try the
  CivicPlus `AgendaCenter/ViewFile/Minutes/_MMDDYYYY-NNNN` pattern by document id, which is how 222-07
  eventually reached Longview's minutes after its search failed.
- **The mayoral candidate interview is VIDEO and was not watched:** *"Dusty Kuykendall Mayoral
  Candidate Interview – April 6th, 2024"* on YouTube (`watch?v=0loL5TZf90o`), promoted on LinkedIn by
  Tom Grisak. **This is a dedicated, dated, candidate-specific policy interview** and is, after the
  VOTE411 page, the richest known unread source for this officeholder. Video is not readable by this
  pass and no transcript was published.
- **Council meeting video / live meetings** (`/163/Public-Meetings-Agendas-Minutes`) — not watched.
- **No Ballotpedia individual candidate page** — Lucas's population is under 10,000, far below
  Ballotpedia's "100 largest cities" scope. **`lwvcollin.org` has returned HTTP 403 all phase.** **No
  Community Impact coverage** of Lucas exists, and **no Star Local Media candidate profile** for the
  Lucas mayoral race was found. **No State-of-the-City address.** Any campaign Facebook page was not
  fetched (Facebook is not fetchable here, and social posts are not treated as evidence of a policy
  position absent a direct citable quote).

### Dusty Kuykendall — Mayor — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c`

Sourced: **none.** All 11 topics blank. Mayor of Lucas with a term ending in 2027; previously Chairman
of the Lucas Planning & Zoning Commission; by profession a corporate-finance consultant and, for the
past decade, CFO of a global software company.

- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **residential-zoning** —
  **THE HIGHEST-VALUE BLANK IN PLAN 222-08, blank ONLY because its source returned 403.** See the
  operator action box above for the full material and the exact URL. In short: a VOTE411 questionnaire
  for a contested Lucas mayoral race appears to contain his own commitment to preserving Lucas's *"low
  density, large lots and open spaces through zoning requirements that prevent high density"* under a
  *"Keeping Lucas Country"* vision — which, if the verbatim text bears that out, is chair 1 (protect
  existing neighborhood character strictly) and unlike the Fairview steeple case is squarely **on the
  housing-density axis the topic measures**. **It is nevertheless blank here**, because the page was
  never opened, a URL that was not fetched and read may not be cited, and a stance whose source cannot
  be re-fetched cannot pass this plan's self-audit. Separately and independently: Lucas's *existing*
  large-lot, low-density zoning, its ~2-acre average lots and its complete absence of multifamily
  housing are **the city's policy and condition, not his stated position**, and were not used as a
  default; and his prior **P&Z chairmanship is adjacency**, not a position. Blank, not defaulted — and
  flagged for immediate retry rather than filed away.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **transportation-priorities** —
  no chair-locating position, on two independent grounds. First, the only substantive material is the
  unreadable VOTE411 page, known solely through paraphrase. Second, **even taken at face value the
  paraphrase does not distinguish a chair**: a *"data-driven road repair and maintenance schedule"*
  whose constraint is funding, a desire to *"minimize traffic"*, and trash cleanup through Keep Lucas
  Beautiful are **road maintenance and traffic management, not a mode tradeoff** — this phase has
  settled that *pothole repair is maintenance, not a mode tradeoff* — and "maintain roads" is the
  opening clause of chair 3 as much as road-capacity focus is chair 4, so the paraphrase cannot
  separate them. His mayoral column's *"increasing traffic demands, infrastructure needs, and community
  expectations call for careful planning and forward-thinking leadership"* is generically evaluative.
  He is never recorded setting roads against transit, bike lanes, sidewalks or parking requirements.
  Blank.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **growth-and-development** — no
  chair-locating position. His column addresses growth repeatedly and locates nothing: *"a quiet rural
  township into a thriving semi-rural suburban destination"*, *"mindful of the challenges and
  opportunities that come with growth"*, *"preserving what makes Lucas special while embracing
  opportunities for responsible growth"*. **"Responsible growth" is the textbook refused formulation**
  and is compatible with chair 2 (slow approvals until infrastructure catches up), chair 3 (invest
  ahead of growth) and chair 4 (streamline permitting to grow the tax base) alike. Nothing found on
  growth caps, voter approval for large developments, annexation, approval speed or permitting fees.
  Note also that a **built-out or maintenance framing is not growth-pace management**, which is the
  other reading his roads-and-water material might tempt. Blank.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **housing** — no position found
  on what role government should play in housing **affordability**. This is a real distinction and not
  a technicality: everything available concerns **density and lot size**, and the `housing` scale asks
  instead about public housing, rent caps, inclusionary requirements, subsidy for affordable projects,
  first-time-buyer assistance, permit streamlining, or leaving prices to the market. He addresses none
  of those. The fact that Lucas's average home value is about $1.2 million is a **market fact about the
  city**, not his position, and was not read as one in either direction.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **public-safety-approach** — no
  chair-locating position. His column's reference to investing *"in roads, water systems, and essential
  public services"* to maintain *"safety and sustainability"* names public safety only as part of a
  bundle and is generically evaluative; interrogated directly, the page **does not address police or
  fire services**. Nothing found on staffing levels, pay, equipment, crisis-response teams, unarmed
  mental-health co-responders, or redirecting police budget. No Lucas budget or staffing vote could be
  read (minutes inaccessible).
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **economic-development** — no
  position found on incentives, abatements, Chapter 380 agreements, community-benefit or job-quality
  conditions. The nearest material is the VOTE411 paraphrase's observation that increased **sales tax
  from commercial areas** would let the city put a higher share of its budget into roads and water
  *"with no taxable increase to citizens"* — a **revenue-mix observation**, not a position on how the
  city should attract business, and in any case known only through an unreadable source. **His career
  as a corporate-finance consultant and software-company CFO was deliberately not used** — profession
  is adjacency and sets no chair.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **homelessness** — no statement
  or vote found on people sleeping or camping in public spaces. No Lucas camping ordinance, encampment
  policy or shelter decision surfaced in any readable source, and none was inferred.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **local-immigration** — no
  statement found on the Lucas Police Department's relationship to federal immigration enforcement,
  ICE detainers, or information sharing. **Texas SB 4 is state law, not his position**, and was not
  used as a default.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **civil-rights** — no on-topic
  position found on racial or social inequality. Nothing in his column, the city site or any coverage
  engages that axis. **No inference was drawn from any identity, demographic, religious or affiliation
  characteristic** — that inference class is forbidden and was the basis of deletions from two
  Richardson records on 2026-07-25.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **taxes** — **researched, no
  chair written per the settled 2026-07-25 operator ruling.** The material is preserved here for any
  future municipal-scope rewrite, clearly marked as **paraphrase from an unreadable source**: the
  VOTE411 summaries render him as saying that with increased sales tax from commercial areas the city
  can direct *"a higher percentage of its budget to roads and water with no taxable increase to
  citizens"*, and that road funding *"will require scrutiny of the city budget and working with fellow
  council members to allocate funds to address this need."* Holding the property-tax burden flat while
  reallocating within an existing budget neither raises taxes specifically on wealthy people or large
  companies (chairs 1–2) nor commits to scaling public services back (chairs 4–5) — indeed it promises
  *more* road and water service at the same tax cost. No taxes row was written.
- Dusty Kuykendall — Lucas — `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c` — **healthcare** — no statement
  found on healthcare access. Expected: all five chairs describe **national** healthcare policy, which
  a city mayor holds no position on by role. His water-quality material — protecting Lake Lavon as the
  drinking-water source, *"water wise"* citizen education, addressing storm run-off — is **drinking-water
  and environmental protection, deliberately NOT stretched into a healthcare chair.**

**Lucas reconcile:** Dusty Kuykendall appears in **bucket 2 for all 11 topics** and in bucket 1 for
none. He is the only Lucas name in plan 222-08's scope and he is accounted for — not in neither bucket,
not in both. Lucas's council seats are out of this plan's scope and belong to 222-11/222-12/222-13.
**Lucas therefore does NOT flip to `hasContext: true` in `src/lib/coverage.js` from this plan**
(RESEARCH.md Pitfall 5) — it remains at zero stances, **unless the operator reads the VOTE411 page and
places the `residential-zoning` chair**, in which case Lucas becomes the first of the twelve
zero-coverage Texas entries to flip and 222-18 must reconcile it.

> ### ⛔ VOTE411 RETRY ATTEMPTED AND FAILED — 2026-07-25, orchestrator
>
> **Do not spend more time on this URL.** The orchestrator escalated the 403 with strictly more
> capability than the research agent had, and it still fails:
>
> | Attempt | Result |
> |---|---|
> | `WebFetch` → `onyourballot.vote411.org/m/race-detail.do?id=50429844` | **HTTP 403 Forbidden**, no body |
> | `WebFetch` → same id on the non-mobile path `/race-detail.do?id=50429844` | **HTTP 403 Forbidden**, no body |
> | **Real headless browser** (Playwright, full JS, normal browser headers) → `/m/race-detail.do?id=50429844` | **HTTP 403**, page title `Voter Guide Toolkit: Forbidden Page` |
>
> A real browser getting the same 403 with a *branded* forbidden page — not a bot wall — means this
> is **VOTE411 taking the guide down after the election, not a scraping block**. The Lucas mayoral
> race was decided in **May 2026**; `vote411.org/ballot` currently serves 8,252 races and 15,870
> candidates scoped to *upcoming* elections, and the Wayback Machine has no snapshot (checked by the
> research agent). **The page is very likely gone rather than gated**, so no amount of retrying or
> credentialing will recover it.
>
> **Correction to the phase-wide inference.** 222-08's research agent reasonably read this as "VOTE411
> race pages DO exist for Collin small towns; the blocker is a 403 on the host, so plans 222-09…222-17
> should search `onyourballot.vote411.org/m/race-detail.do?id=<n>` per contested seat." That is now
> **downgraded**: the host serves only current-cycle guides, so this source family is usable for
> *upcoming* races and not for the past elections that seated the officials this phase is documenting.
> Later plans should not budget time for it. **Kuykendall's `residential-zoning` stays blank** — the
> only surviving trace is a search-index *paraphrase*, and D-05 forbids citing a URL never fetched.
> Logged as named follow-on work, not as a Phase 222 gap.

---

## Plan 222-08 outcome (mayors sweep part A) — no migration authored

**All five mayors in plan 222-08's scope yielded ZERO sourced chairs. 55 of 55 attempted (person,
topic) pairs are honest blanks.** Per plan 222-08's own instruction — *"If all 5 mayors yield zero
sourced stances, do NOT create the migration file — write only the register sections"* — **no migration
file was authored, migration number 1424 was NOT claimed, and nothing was committed to
`C:/EV-Accounts`.** The next research plan should re-derive the next free migration number rather than
assuming 1424 is taken.

This is a **success outcome, not a failure**, and it is consistent with the phase's record: waves 3–7
produced 16 chairs from 240 attempted pairs, and 222-08's own brief anticipated that "a 5-mayor plan
returning 0–2 chairs is a normal, successful outcome." No bar was lowered to raise a count.

**Two of the five zeros are recoverable, and both are recorded above with exact URLs:**
1. **Lucas / Dusty Kuykendall / `residential-zoning`** — a VOTE411 contested-race questionnaire at
   `onyourballot.vote411.org/m/race-detail.do?id=50429844` that returns **403** to this session. The
   highest-value single retry in the phase.
2. **Anna / Pete Cain / `public-safety-approach`** — Anna's FY2026 budget minutes, gated behind
   **Laserfiche WebLink** (cookies required) with `AgendaCenter` **404** and the only secondary account
   (`citizenportal.ai`) returning **403**.

**One zero is a deliberate judgement call the operator may wish to overturn:** **Fairview / John
Hubbard / `residential-zoning`**, where a recorded, individually-named, contested Nay vote with a stated
reason exists but concerns the height of a non-residential structure under a conditional use permit
rather than housing density. It is argued in full in the Fairview section.

**Two of the five zeros are settled findings about the record, not access failures:** Farmersville and
Parker, where complete official minutes were read and the mayor is **structurally non-voting** and
appears only presiding.

---
