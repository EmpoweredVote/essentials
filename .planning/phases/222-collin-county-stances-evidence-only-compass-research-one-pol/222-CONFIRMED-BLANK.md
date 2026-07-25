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

## Count: 31

31 (person, topic) pairs appended below by 222-02 (integrity remediation). 222-03 through 222-17
append their own per-government sections below as they execute.

---

## Phase 222 integrity remediation (2026-07-25)

**Not "never searched" blanks.** Every entry below was previously stanced with a chair on the
public compass — a deeper hand-review (222-01 county-wide integrity audit + this plan's Task 1
hand-review of the Class B2 rows) found the recorded reasoning did not clear the D-04 evidence bar
(no citable, explicit, on-topic statement/vote/questionnaire answer by that specific person), so the
chair was deleted via migration `1416_222_collin_stance_integrity_remediation.sql`
(C:/EV-Accounts, AUDIT-ONLY, committed locally, **not yet applied to production** — pending the
Task 3 operator checkpoint). These are "searched, evidence found insufficient, chair removed," per
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

### Class B2 deletions (19) — hand-reviewed, adjacency-only, delete

Per Task 1's explicit finding: `222-01-INTEGRITY-AUDIT.md` captures only the class-level "weak
adjacency" characterization for Class B2 (board membership, professional background, "general
profile," city-wide budget vote) rather than a per-row verbatim excerpt, and this session has no
DB access to inspect each row's full stored reasoning directly. Per the 222-02 plan's own explicit
tie-breaker ("when genuinely uncertain whether a row clears the bar, delete it"), all 19 are
therefore DELETE rather than KEEP — none could be confirmed to cite an explicit on-topic
statement, vote, or questionnaire answer by the specific person.

- Amy Gnadt — Allen — `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` — housing — evidence-integrity remediation — B2: adjacency-only (no explicit on-topic citation confirmable this session), delete per uncertainty tie-breaker.
- Amy Gnadt — Allen — `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` — public-safety-approach — evidence-integrity remediation — B2: same rationale.
- Amy Gnadt — Allen — `b0a9801c-7f9d-4d7b-99f5-09360cf69c08` — residential-zoning — evidence-integrity remediation — B2: same rationale.
- Carl Clemencich — Allen — `f72c8a0c-61dd-4a86-a205-171e331fcaee` — public-safety-approach — evidence-integrity remediation — B2: same rationale.
- Michael Schaeffer — Allen — `c7a0ecf6-b416-474b-9647-a25e404f4bc4` — economic-development — evidence-integrity remediation — B2: same rationale.
- Tommy Baril — Allen — `3b15d821-fc1e-4e7b-bda0-13a669a77a27` — economic-development — evidence-integrity remediation — B2: same rationale.
- Angelia Pelham — Frisco — `5b346b19-d6ee-47e2-acbf-5780ca423264` — civil-rights — evidence-integrity remediation — B2: same rationale.
- Ernest Lynch — McKinney — `c3e2d7a6-8096-4e91-9ee0-3cca445af72e` — economic-development — evidence-integrity remediation — B2: same rationale.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — economic-development — evidence-integrity remediation — B2: same rationale.
- Geré Feltus — McKinney — `23ba75d2-6eed-4b71-9669-78ab3bb82e98` — public-safety-approach — evidence-integrity remediation — B2: same rationale.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — economic-development — evidence-integrity remediation — B2: same rationale.
- Justin Beller — McKinney — `bcdbeae4-04c9-4ea1-8942-bac3ce1a8723` — public-safety-approach — evidence-integrity remediation — B2: same rationale.
- Michael Jones — McKinney — `09dbafc2-9252-40e4-9a1c-afda5b069f2e` — economic-development — evidence-integrity remediation — B2: same rationale.
- Patrick Cloutier — McKinney — `27578980-2e6c-4639-879a-70b510566d0f` — economic-development — evidence-integrity remediation — B2: same rationale.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — economic-development — evidence-integrity remediation — B2: same rationale.
- Rick Franklin — McKinney — `6ee726c1-79af-4fef-abb8-fa7f4208ae14` — residential-zoning — evidence-integrity remediation — B2: same rationale.
- Shun Thomas — Plano — `4272e5cb-40cf-42d9-a493-ae5ca04301bb` — homelessness — evidence-integrity remediation — B2: same rationale.
- Arefin Shamsul — Richardson — `9f93ae55-9228-478d-84a9-971cf4686649` — residential-zoning — evidence-integrity remediation — B2: same rationale.
- Dan Barrios — Richardson — `e8c863a7-d116-480e-a81f-47d26f45e264` — homelessness — evidence-integrity remediation — B2: same rationale.

---
