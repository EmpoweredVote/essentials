# 222-01 INTEGRITY AUDIT — Already-Stanced Cohort (57 people, 220 rows)

**Run by:** orchestrator, production, 2026-07-25.
**Trigger:** at the Task 3 blocking checkpoint the operator approved the plan's overall scope but
rejected the recommendation to close 222-02 (Plano) and 222-04 (McKinney) as no-op plans. The
operator specifically asked for Plano and McKinney to be double-checked because those cities were
stanced early in the project (an earlier pass, before this phase's evidence-bar tightening) and
might contain misses. This audit widened that request to **all 220 existing
`inform.politician_answers` rows** held by the 57 already-stanced in-scope officeholders across all
24 in-scope governments, not just Plano and McKinney, so that any systemic defect in the early-pass
cohort would surface wherever it lived rather than only where the operator happened to ask.

## Scope

220 rows total: every `inform.politician_answers` row held by the 57 in-scope officeholders who
already had >= 1 stance per the 222-01-WORKLIST.md BEFORE snapshot. This audit does **not** touch
the 107-person un-stanced worklist — those rows do not exist yet.

## Value-integrity finding — CLEAN

Across all 220 rows:
- Zero non-integer values (every stored value is a whole 1-5 chair).
- Zero out-of-range values (nothing outside 1-5).
- Zero answer rows missing a matching `politician_context` row.
- Zero context rows with empty reasoning text.

**The defect is entirely in the reasoning text and its sourcing, not in the stored values.** No
migration is needed to fix a corrupted number — every row needing remediation needs its reasoning
re-examined and, where it fails the evidence bar, the row deleted so the topic reverts to blank.

## Severity buckets (220 rows total)

| Bucket | Rows | People | Meaning |
|---|---|---|---|
| A1 | 5 | 4 | Reasoning admits "no record found" / "no public statement" YET a chair was written; `sources` is NULL |
| A2 | 1 | 1 | Party named in stored reasoning text |
| A3 | 4 | 3 | Stance inferred from ethnicity / religion / birthplace |
| A4 | 2 | 2 | "has made no public statement" -> chair defaulted from city policy (SB4) rather than the person's own words |
| **Class A total** | **12** | **~9** | **Violates D-04 (evidence-only), this plan's own prohibitions, and the [[stance_no_default_value]] working rule — DELETE** |
| B2 | 19 | 14 | Weak adjacency inference ("served on the EDC board", "general profile") — reasoning is not on its face disqualifying, but does not clearly cite an explicit on-topic statement, vote, or questionnaire answer either — NEEDS HAND REVIEW |
| C | 128 | 41 | "Inferred from…" prose style, but the reasoning does cite a real quote or vote — a documentation-style quirk, not a defect. No action. |
| D | 61 | 35 | Clean, direct citation. No action. |

Note: 4 of the 5 A1 rows are the `housing` topic, and all 5 A1 rows are dated "Researched
2026-05-11" — this reads as a single early research pass that filled `housing` for every person in
its batch regardless of whether evidence existed for that specific person, then moved on. This is
consistent with the operator's instinct that the early Plano/McKinney pass (and apparently a few
rows outside those two cities too) predates this phase's tightened evidence bar.

## CLASS A — the 12 rows to DELETE

`politician_id` / `topic_id` are exact and authoritative for the migration 222-02 will author.

| # | Bucket | City | Person | politician_id | topic_key | topic_id | val |
|---|---|---|---|---|---|---|---|
| 1 | A1 | Celina | Ryan Tubbs | `cb9d6924-77d1-49c9-ab3d-778b0201e623` | housing | `669cac97-66a6-4087-b036-936fbe62efb3` | 3 |
| 2 | A1 | Frisco | Burt Thakur | `c11bf372-8190-4b45-b80a-cbd0fb2ba401` | housing | `669cac97-66a6-4087-b036-936fbe62efb3` | 4 |
| 3 | A1 | Plano | Chris Krupa Downs | `127b8e69-3900-438c-8361-2cfe24b6c6cf` | housing | `669cac97-66a6-4087-b036-936fbe62efb3` | 4 |
| 4 | A1 | Plano | Chris Krupa Downs | `127b8e69-3900-438c-8361-2cfe24b6c6cf` | residential-zoning | `d4f18138-a2e0-4110-b925-7387d9d0d16d` | 4 |
| 5 | A1 | Plano | Shun Thomas | `4272e5cb-40cf-42d9-a493-ae5ca04301bb` | housing | `669cac97-66a6-4087-b036-936fbe62efb3` | 3 |
| 6 | A2 | Richardson | Dan Barrios | `e8c863a7-d116-480e-a81f-47d26f45e264` | civil-rights | `0bc588c6-39e1-4084-b5de-cac909b8b762` | 2 |
| 7 | A3 | Plano | Vidal Quintanilla | `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` | civil-rights | `0bc588c6-39e1-4084-b5de-cac909b8b762` | 3 |
| 8 | A3 | Plano | Vidal Quintanilla | `5de5cc59-9cbc-4b09-b7a4-88a45d1b1b7f` | local-immigration | `b9ccee94-ad96-4f10-b655-889d8e5abe92` | 3 |
| 9 | A3 | Richardson | Amir Omar | `e9b9877d-c4dc-482e-b52a-cd015a4a6850` | civil-rights | `0bc588c6-39e1-4084-b5de-cac909b8b762` | 3 |
| 10 | A3 | Richardson | Arefin Shamsul | `9f93ae55-9228-478d-84a9-971cf4686649` | civil-rights | `0bc588c6-39e1-4084-b5de-cac909b8b762` | 3 |
| 11 | A4 | Plano | John B. Muns | `5584e869-4a54-4a68-a3c8-c14db45a71c5` | local-immigration | `b9ccee94-ad96-4f10-b655-889d8e5abe92` | 3 |
| 12 | A4 | Plano | Maria Tu | `d6bf8d34-5a59-419a-8ed7-9c9b4d865799` | local-immigration | `b9ccee94-ad96-4f10-b655-889d8e5abe92` | 3 |

### Verbatim excerpts for the record

Quoted here as evidence of the defect being deleted — not as a template for future reasoning text,
and not as a basis for inference. Party affiliation appears in the Barrios excerpt below solely
because it is itself the defect (A2: party named in stored reasoning text) being removed; this is
the one legitimate use of that phrase in this document.

- **Downs, housing (row 3):** *"Researched 2026-05-11 — no specific record found of Downs stating a
  position on affordable housing policy. Campaign emphasized infrastructure. Assumed…"*
- **Tu, local-immigration (row 12):** *"Plano operates under Texas SB4 (2017) which bars sanctuary
  policies. Tu has made no public statements advocating ei…"*
- **Quintanilla, local-immigration (row 8):** *"Quintanilla, a Mexican American born in the Rio
  Grande Valley border region, served on Plano's Commu…"*
- **Barrios, civil-rights (row 6):** *"Barrios is a Democrat running for Congress on a platform of
  'fairness, accountability, and common sense'…"*
- **Omar, civil-rights (row 9):** *"Amir Omar, a first-generation American of Palestinian and
  Iranian descent and the first Muslim mayor of a DFW city…"*

Every deletion must be logged in `222-CONFIRMED-BLANK.md` at (person, topic) granularity so the
resulting blank spoke lands honestly in the blank register — these are not "never searched," they
are "searched, evidence found insufficient, chair removed," which is exactly the blank-register's
purpose per D-08.

## CLASS B2 — the 19 rows to hand-review in 222-02

Reasoning cites a real activity (board membership, general public profile) but does not clearly
name an explicit on-topic statement, vote, or questionnaire answer. 222-02 must read each row's full
reasoning and stored source(s) and keep the row **only if** it genuinely cites an explicit on-topic
statement, a recorded vote, or a questionnaire answer — otherwise delete it and log it in
`222-CONFIRMED-BLANK.md` exactly like a Class A deletion.

| City | Person | politician_id | topic(s) |
|---|---|---|---|
| Allen | Amy Gnadt | `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` | housing, public-safety-approach, residential-zoning |
| Allen | Carl Clemencich | `f72c8a0c-61dd-4a86-a205-171e331fcaee` | public-safety-approach |
| Allen | Michael Schaeffer | `c7a0ecf6-b416-474b-9647-a25e404f4bc4` | economic-development |
| Allen | Tommy Baril | `3b15d821-fc1e-4e7b-bda0-13a669a77a27` | economic-development |
| Frisco | Angelia Pelham | `5b346b19-d6ee-47e2-acbf-5780ca423264` | civil-rights |
| McKinney | Ernest Lynch | `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` | economic-development |
| McKinney | Geré Feltus | `23ba75d2-6eed-4b71-9669-78ab3bb82e98` | economic-development, public-safety-approach |
| McKinney | Justin Beller | `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` | economic-development, public-safety-approach |
| McKinney | Michael Jones | `09dbafc2-9252-40e4-9a1c-afda5b069f2e` | economic-development |
| McKinney | Patrick Cloutier | `27578980-2e6c-4639-879a-70b510566d0f` | economic-development |
| McKinney | Rick Franklin | `6ee726c1-79af-4fef-abb8-fa7f4208ae14` | economic-development, residential-zoning |
| Plano | Shun Thomas | `4272e5cb-40cf-42d9-a493-ae5ca04301bb` | homelessness |
| Richardson | Arefin Shamsul | `9f93ae55-9228-478d-84a9-971cf4686649` | residential-zoning |
| Richardson | Dan Barrios | `e8c863a7-d116-480e-a81f-47d26f45e264` | homelessness |

(19 topic-rows across 14 people; Shun Thomas and Arefin Shamsul and Dan Barrios each also appear in
the Class A table above for a *different* topic — this is expected under the per-(person, topic)
granularity of the blank-register contract, not a duplicate defect.)

## Plano + McKinney topic-gap detail (feeds 222-04)

Per-person topics currently held (live, before this audit's deletions land):

**Plano (8 people, 51 slots unfilled of 88):** Maria Tu 5 held (economic-development, housing,
local-immigration, residential-zoning, transportation-priorities); Bob Kehr 3 held
(economic-development, housing, public-safety-approach); Rick Horne 4 held (civil-rights, housing,
public-safety-approach, residential-zoning); Chris Krupa Downs 3 held (housing, residential-zoning,
transportation-priorities); Steve Lavine 5 held (economic-development, housing,
public-safety-approach, taxes, transportation-priorities); Shun Thomas 5 held (homelessness,
housing, public-safety-approach, residential-zoning, transportation-priorities); Vidal Quintanilla 6
held (civil-rights, economic-development, housing, local-immigration, public-safety-approach,
residential-zoning); John B. Muns 6 held (economic-development, housing, local-immigration,
public-safety-approach, residential-zoning, transportation-priorities).

**McKinney (7 people, 42 slots unfilled of 77):** Ernest Lynch 3 held (economic-development,
housing, public-safety-approach); Michael Jones 4 held (economic-development, homelessness, housing,
public-safety-approach); Justin Beller 5 held (economic-development, homelessness, housing,
public-safety-approach, residential-zoning); Patrick Cloutier 6 held (economic-development,
homelessness, housing, public-safety-approach, residential-zoning, transportation-priorities); Geré
Feltus 6 held (same six); Rick Franklin 6 held (same six); Bill Cox 5 held (economic-development,
housing, public-safety-approach, residential-zoning, transportation-priorities).

**City-wide zero-coverage topics:** both cities are 0/N on `growth-and-development` and
`healthcare`; McKinney is additionally 0/7 on `civil-rights`, `taxes`, and `local-immigration`.

**Important caveat for 222-04:** the Class A deletions listed above will shrink several of these
per-person counts (Downs drops from 3 held to 1; Tu drops from 5 held to 4; Muns drops from 6 held
to 5; Quintanilla drops from 6 held to 4). 222-04 must re-derive its exact gap list live at its own
execution start rather than trusting the ~93-slot figure quoted here, which is a pre-deletion
snapshot for planning purposes only.

## Disposition and closing statement

These 220 rows are **pre-existing** — none was created by Phase 222, and this phase's own tasks
have written zero stance rows as of this audit. D-07's instruction to "leave the existing [55/57]
records as-is" governs *research effort*, not *correctness*: it means Phase 222 does not re-open a
general standardization or backfill pass across the already-stanced cohort (that remains explicitly
deferred per CONTEXT.md's Deferred Ideas). It cannot reasonably be read to mean "retain rows now
affirmatively known to violate the evidence-only bar" — D-04's prohibition on suggestive-but-not-
explicit evidence and the [[stance_no_default_value]] working rule apply to every row in the
database, not only to rows this phase authors. A blank spoke is the correct terminal state per D-08
regardless of which phase's research pass originally (mis)populated the row.

Remediation of these 12 Class A + 19 Class B2 rows is assigned to **222-02** (repurposed from its
original "Plano, 0 un-stanced, no-op" scope into a county-wide stance-integrity remediation plan).
The Plano + McKinney topic-gap fill is assigned to **222-04** (repurposed from its original
"McKinney, 0 un-stanced, no-op" scope). See `222-01-WORKLIST.md`'s amended per-plan assignment table
for the operator-approved re-scope of both plans.
