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

## Count: 96

27 (person, topic) pairs appended by 222-02 (integrity remediation) + 15 by 222-03 (Frisco)
+ 54 by 222-04 part A (Plano topic-gap fill).
222-04 part B (McKinney) through 222-17 append their own per-government sections below as
they execute.

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
