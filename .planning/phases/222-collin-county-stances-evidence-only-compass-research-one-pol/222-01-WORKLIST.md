# 222-01 WORKLIST — Collin County Un-Stanced Officeholders (LIVE audit)

Derived **live from production** by the orchestrator on 2026-07-25 (this executor has no
`mcp__supabase-local__execute_sql` binding; the orchestrator ran RESEARCH.md §A Step 1/2 verbatim
and handed the results to this executor). Source of truth = `essentials.politicians` LEFT JOINed to
`inform.politician_answers`, filtered on `p.is_active = true AND (p.is_vacant = false OR p.is_vacant
IS NULL)` — the OR-NULL form, never `is_vacant = false` alone (Pitfall 4 / the exact bug that hid 7
officeholders in the Phase 221 audit) — over the 24-entry Texas `coverage.js` geo_id set (23 Collin
governments + Longview).

## BEFORE snapshot — supersedes CONTEXT.md's discussion-time anchor

**CONTEXT.md's 157 / 55 / 102 numbers were a discussion-time estimate gathered with no live DB
access. They are superseded by the live numbers below, checked 2026-07-25.**

| Metric | Any-topic variant | 11-canonical-topic-restricted variant |
|---|---|---|
| Total in-scope (active, not-vacant) | **164** | **164** |
| With >= 1 stance | **57** | **57** |
| Without any stance (worklist size) | **107** | **107** |

**Open Question 1 (RESEARCH.md) — SETTLED: both variants are IDENTICAL (57 / 107).** Every existing
stance row held by an in-scope person already sits on one of the 11 canonical topic UUIDs — there
are no off-canon answer rows in scope. The any-topic and 11-topic-restricted counts are therefore the
same query in practice for this population, and no separate "which definition did 55/102 use"
reconciliation is needed.

**164/57/107 (live, 2026-07-25) supersedes CONTEXT.md's 157/55/102 (discussion-time, 2026-07-24).**
The 7-person gap matches the same class of drift Phase 221 found in its own scope memo — rosters
shift between sessions; this document is the only authoritative scope for Phase 222's downstream
plans.

## Live next-available migration number

`C:/EV-Accounts/backend/migrations` highest on-disk numeric prefix, checked **2026-07-25** this
session: **1415** (`1415_bend_or_2026_races_candidates.sql`). **Next available number: 1416.** None
of 1411–1415 is Collin-related. Re-verify live at each downstream plan's execution — this counter is
shared with concurrent milestone work and moves between sessions (per RESEARCH.md §E).

## Topic-UUID verification — all 11 resolve live

| topic_key | short_title | id | is_live | is_active |
|---|---|---|---|---|
| housing | Housing | 669cac97-66a6-4087-b036-936fbe62efb3 | true | true |
| civil-rights | Civil Rights | 0bc588c6-39e1-4084-b5de-cac909b8b762 | true | true |
| homelessness | Homelessness | 4938766b-b45a-46e3-93bd-b8b30651271a | true | true |
| economic-development | Economic Development Incentives | eb3d1247-0de1-4b7f-baec-7259861efd53 | true | true |
| local-immigration | Local Immigration Enforcement | b9ccee94-ad96-4f10-b655-889d8e5abe92 | true | true |
| public-safety-approach | Public Safety Approach | e9ebefcd-c496-45e8-b816-a79f8442ba85 | true | true |
| residential-zoning | Residential Zoning | d4f18138-a2e0-4110-b925-7387d9d0d16d | true | true |
| transportation-priorities | Transportation Priorities | ba59337e-30e2-4aba-a39a-426b3366eb27 | true | true |
| taxes | Taxes | f7e5678d-dadd-4556-a2fc-446e24642ceb | true | true |
| growth-and-development | Growth and Development Pace | fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4 | true | true |
| healthcare | Healthcare | e8dad4a8-eb93-4931-91f5-d8fb5d7dd529 | true | true |

**Decoy check PASSED:** `6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f` (`homelessness-response`,
"Homelessness Response") is a **distinct** topic. None of the 11 canonical IDs collides with it. The
canonical homelessness topic used by this phase is `4938766b-b45a-46e3-93bd-b8b30651271a`
(topic_key `homelessness`, "Criminalization of Homelessness" per RESEARCH.md §B).

**Housing / taxes / healthcare wording check (Pitfall 1) — result: MATCHES, no divergence.**

| Topic | Live `question_text` (2026-07-25) | RESEARCH.md §B text | Result |
|---|---|---|---|
| housing | "What role should government play in making sure people can afford housing?" | Identical | **MATCH** |
| taxes | "How should government balance what it collects in taxes against what it spends on public services?" | Identical | **MATCH** |
| healthcare | "What role should government play in healthcare access?" | Identical | **MATCH** |

No divergence found for any of the three Pitfall-1 topics. Downstream research plans (222-02..17)
should use RESEARCH.md §B verbatim as originally written — no live-text override is needed beyond
what §B already specifies (which itself already overrides the stale `politician-stance-researcher`
subagent defaults).

## Frisco Place 4 (Pitfall 3) — RESOLVED, no regression

Exactly ONE active politician holds Frisco Council Member Place 4: **Jared Elad**
(`5d8acfc7-5643-418b-a474-3d87898f4e17`, `is_active=true`, `is_vacant=false`). Jared Elad already
holds 5 stances, so he is **not** on this phase's un-stanced worklist (he is part of the 57
already-stanced, not the 107).

Gopal Ponangi (`d6e0d762-f7a2-4566-8718-452e4c33781b`) is `is_active = false` with `office_id = NULL`
— confirmed **not a live-data regression**. Consistent with 221-CONFIRMED-BLANK.md's "Not a blank —
out of scope" note.

## Longview determination (RESEARCH.md Open Question 2) — EXCEEDS the plan's own 3-person threshold

Longview (geo_id `4843888`, Gregg County — a coverage.js TX browse city, not a Collin county) has
**7 active officeholders; 5 un-stanced**:

| full_name | title | politician_id |
|---|---|---|
| Derrick Conley | Council Member District 1 | c723b079-c7db-4376-b8d3-72ac896fefe2 |
| Shannon Moore | Council Member District 2 | d55159ff-7c27-4313-b464-722f653fd7b7 |
| Brandon Smith | Council Member District 3 | c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0 |
| John Nustad | Council Member District 4 | 94957758-20db-4590-8cc9-ce54c24e2449 |
| Sidney Allen | Council Member District 6 | 2baab241-b3c5-48e9-b9a6-fd29b7b77beb |

The other 2 Longview officeholders are partially stanced and out of scope under the zero-rows
definition: Kristen Ishihara (Mayor, 9 topics already held), Jody Berryhill (District 5, 2 topics
already held).

**This is a live operator decision, flagged prominently rather than resolved here:** the plan's own
Task 3 how-to-verify step 3 says "If Longview shows more than 3 un-stanced officeholders, say so —
Longview then needs its own plan rather than riding along in 222-07." Live count is 5 > 3. See
`## Operator decisions required` below.

## Do-not-overwrite set — and a material finding

All 107 worklist people below have **zero** existing `inform.politician_answers` rows. This phase
can therefore never overwrite an existing (politician_id, topic_id) pair as long as every downstream
plan stays strictly on this worklist. The do-not-overwrite set is exactly the complementary 57
already-stanced people (not itemized pair-by-pair here since none of the 107 worklist people share a
politician_id with any of the 57 — there is no overlap to reconcile).

**Material finding — not one of the 57 already-stanced people holds all 11 topics.** Live
distribution of existing stance counts among the 57:

| Stances held | People |
|---|---|
| 1 | 8 |
| 2 | 9 |
| 3 | 6 |
| 4 | 10 |
| 5 | 14 |
| 6 | 8 |
| 9 | 2 |
| **Total** | **57** |

Maximum held by anyone in scope is 9 of 11. Under D-07 ("leave existing records as-is") and
CONTEXT.md's Deferred Ideas (which explicitly excludes "standardizing the existing already-stanced"
cohort from this phase), these 57 remain **out of scope** — but every one of them keeps blank spokes
on at least 2 of the 11 topics after this phase closes. This is recorded here as a known,
decided-out-of-scope residual per D-07/Deferred Ideas, and is surfaced again at the Task 3 gate for
explicit operator confirmation.

---

## Full un-stanced roster — all 107 rows

`full_name | title | politician_id`, grouped by government.

### City of Allen (4801924) — 1 un-stanced of 7 active
Chris Schulmeister | Mayor | `698da6ca-eadd-46a0-8e27-94ae48d23279`

### City of Anna (4803300) — 6 un-stanced of 7 active
Kevin Toten | Council Member Place 1 | `38ba3e31-8b1d-4038-9c5a-e5b16c06aa8d`
Nathan Bryan | Council Member Place 2 | `94d3e41c-60b6-4803-b937-1877aeae84df`
Jessica Walden | Council Member Place 3 | `c84d87b3-aa64-4f73-aed8-2eb5f113a016`
Elden Baker | Council Member Place 5 | `3842838e-2015-4136-95d2-97f4f20366b1`
Manny Singh | Council Member Place 6 | `f920ca1a-8263-4662-aa21-1f5964dfa61d`
Pete Cain | Mayor | `d9710a3e-4679-44a5-8bfe-ddbb7b376ab5`

### City of Blue Ridge (4808872) — 6 un-stanced of 6 active
David Apple | Council Member Place 1 | `831ce2c9-bc43-487a-a0d6-a0b9c776e7d2`
Linda Braly | Council Member Place 2 | `c7bfdeff-ba51-479c-b956-331a6562c21b`
Trenton Sissom | Council Member Place 3 | `b85c7a20-744d-4065-b240-530aceda65bc`
Wendy Mattingly | Council Member Place 4 | `ff6a17d4-7067-4566-9241-17aaf9f45b34`
Keith Chitwood | Council Member Place 5 | `f6da000b-c299-4f90-afee-5a8e0d0d26bf`
Rhonda Williams | Mayor | `a9db2052-5fbd-4370-9f78-f8ba07b6e452`

### City of Celina (4813684) — 2 un-stanced of 7 active
Shea Scott | Council Member Place 4 | `91128e4f-94f6-4119-8087-4449ee16964a`
Shane Lambert | Council Member Place 5 | `2e8dc841-f8ea-42f0-b6a4-08e9c779a20e`

### Town of Fairview (4825224) — 7 un-stanced of 7 active
Rich Connelly | Council Member Seat 1 | `9e2aa590-23e2-4217-84b7-418ba9dc1414`
Joe W. Boggs | Council Member Seat 2 | `1a726799-8eb1-4479-b46a-83aacb0109e8`
Jill Hawkins | Council Member Seat 3 | `c97ba2a3-d56e-4ecc-aa7d-c5d009c9312c`
John Stanley | Council Member Seat 4 | `194c1b38-e76c-4edb-a064-0a7e7e1ac195`
Pat Sheehan | Council Member Seat 5 | `38e20826-63c9-4eef-a4e1-ea77aa6892e2`
Lakia Works | Council Member Seat 6 | `9e80fff4-8b89-4c38-b33e-a1a0fff7e080`
John Hubbard | Mayor | `72b80f6a-82b3-4872-a10f-e95e2cd3f90f`

### City of Farmersville (4825488) — 6 un-stanced of 6 active
Coleman Strickland | Council Member Place 1 | `94252f68-40d6-4e82-8f10-1015a85fa403`
Russell Chandler | Council Member Place 2 | `eb6c2d0f-ea9f-420c-81bb-eb3d6287214d`
Kristi Mondy | Council Member Place 3 | `fae40714-a182-4e37-9bac-1afe754b4561`
Mike Henry | Council Member Place 4 | `5712d682-ffd5-4e6d-afa8-9707613fd838`
Tonya Fox | Council Member Place 5 | `eab3bbe2-4103-49a2-a0bf-d45acc9d54e0`
Craig Overstreet | Mayor | `e7f04a34-b8e7-4978-87d6-60ece59ced92`

### City of Frisco (4827684) — 2 un-stanced of 7 active
Brittany Colberg | Council Member Place 6 | `ddcb2d35-0f94-4956-ab65-ae56a900ac11`
Mark Hill | Mayor | `3579e02c-d480-48ba-8d95-3eb7f002a5b0`

### City of Josephine (4838068) — 6 un-stanced of 6 active
April Aurand | Council Member Place 1 | `c5411e93-3b1c-42e3-a0c8-00491804cada`
Jane Ridgway | Council Member Place 2 | `b6bf2154-78d1-4d12-8881-5f83640beee2`
Alex Esquivel | Council Member Place 3 | `215618d2-17ac-4946-a511-c0e9a95164b6`
Pam Sardo | Council Member Place 4 | `f90a82e8-24db-433c-a8dd-6b5098f0a20e`
Gary Chappell | Council Member Place 5 | `b48179c3-8e73-47a8-9e05-f9a8a24d4ab7`
Jason Turney | Mayor | `f3eb38f1-a044-4c75-82c8-80750f40543e`

### City of Lavon (4841800) — 6 un-stanced of 6 active
Mike Shepard | Council Member Place 1 | `e8df1e64-e5c3-4417-bccd-fb176be11f39`
Mike Cook | Council Member Place 2 | `f4ee71a6-8a14-4727-aa39-716fae402f60`
Travis Jacob | Council Member Place 3 | `d53f9122-face-4b22-a5b1-66ca6dc49997`
Rachel Dumas | Council Member Place 4 | `62d609ff-284a-493e-a2ba-70c11bf87619`
Lindsey Hedge | Council Member Place 5 | `0997e0f6-24ed-4d7e-964a-bd1069479352`
Vicki Sanson | Mayor | `3ae0e255-7dca-486d-abbf-f8d2ebd5e7be`

### City of Longview (4843888) — 5 un-stanced of 7 active (see Longview determination above)
Derrick Conley | Council Member District 1 | `c723b079-c7db-4376-b8d3-72ac896fefe2`
Shannon Moore | Council Member District 2 | `d55159ff-7c27-4313-b464-722f653fd7b7`
Brandon Smith | Council Member District 3 | `c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0`
John Nustad | Council Member District 4 | `94957758-20db-4590-8cc9-ce54c24e2449`
Sidney Allen | Council Member District 6 | `2baab241-b3c5-48e9-b9a6-fd29b7b77beb`

### City of Lowry Crossing (4844308) — 9 un-stanced of 9 active
Scott Pitchure | Council Member Place 1 | `e84f56af-ad73-4bec-8e4c-efccb8854cb1`
Tammy Hodges | Council Member Place 2 | `eb142dfb-2208-4d3c-afe7-d2b64708129b`
Eusebio "Joe" Trujillo III | Council Member Place 3 | `c765ca48-4960-42c9-bf31-a4e074227e14`
Muhanad "G" Hijazen | Council Member Place 4 | `254acced-9f14-4d55-bf13-18697a7c2f86`
Chris Madrid | Council Member Place 5 | `40c5dd28-4613-4b2e-b51f-5fd2ee8d515c`
Agur Rios | Council Member Place 6 | `38bb0d46-b34d-48f3-b7d3-797b19a379ae`
Cindy Cash | Council Member Place 7 | `fed8ee0b-440d-4562-a521-0f897324ab78`
Ollie Simpson | Council Member Place 8 | `dceb965b-63c6-47cb-ba59-f25ff91b05b5`
Pat Kelly | Mayor | `6f199ec9-ba4a-4c0d-b6e3-bae97e0da847`

### City of Lucas (4845012) — 7 un-stanced of 7 active
Jonathan Underhill | Council Member Place 1 | `4ad7d4e3-c0d2-4b7a-bc32-a8b3f41551a0`
Rebecca B. Orr | Council Member Place 2 | `3c839111-ed39-41fd-8e63-9c81b1e3e591`
Chris Bierman | Council Member Place 3 | `ada1526e-32a3-47b2-9535-c4988e8db633`
Phil Lawrence | Council Member Place 4 | `bf1f8150-ae29-42ef-8b50-b2619e8d46ca`
Debbie Fisher | Council Member Place 5 | `8d24cdb6-64d1-4597-a66e-71bc723391d7`
Neil Peterson | Council Member Place 6 | `72c0de8c-38b0-4470-a0d0-9d7a71986be0`
Dusty Kuykendall | Mayor | `0ea8bc33-1629-41b4-8ae9-da74c3e2b44c`

### City of McKinney (4845744) — 0 un-stanced of 7 active (fully stanced; NO WORK for 222-04)

### City of Melissa (4847496) — 6 un-stanced of 7 active
Preston Taylor | Council Member Place 1 | `3e377dbe-2c37-41ed-a65d-664de75318ae`
Rendell Hendrickson | Council Member Place 2 | `af2697d7-f766-4ddd-8b61-65e5d0c2df70`
Dana Conklin | Council Member Place 3 | `30680496-7464-495c-a9bc-eb44cc6b84b8`
Joseph Armstrong | Council Member Place 4 | `12d3560f-3b07-4fe7-b8c4-c2466c13e7eb`
Craig Ackerman | Council Member Place 5 | `c5d9869d-6e7b-448d-bb48-43c2cd795d9a`
Sean Lehr | Council Member Place 6 | `b3602d0c-9af7-4baf-a96c-a15be063c272`

### City of Murphy (4850100) — 2 un-stanced of 7 active
Debbie Ison | Council Member Place 3 | `bb9bed2f-cf0c-4997-9676-e5314ee1d7e0`
Kevin Kelley | Council Member Place 5 | `4220560f-5c74-4c92-9a35-e2a7cecb69da`

### City of Nevada (4850760) — 6 un-stanced of 6 active
Mike Laye | Council Member Place 1 | `f138261a-4e0b-4c53-b30a-18e30b76e614`
Paul Baker | Council Member Place 2 | `988e1851-7b35-4bce-81ff-955412f8670b`
Amanda Wilson | Council Member Place 3 | `c41886b8-f4ad-4f06-a579-5140c8951c91`
Clayton Laughter | Council Member Place 4 | `6c1dc476-507b-43a8-9061-bdaf9eafec58`
Derrick Little | Council Member Place 5 | `51c0d0db-b3e6-4e71-960e-4809ad680e25`
Donald Deering | Mayor | `47a5349c-ea03-4fcf-8719-948c259a3753`

### City of Parker (4855152) — 6 un-stanced of 6 active
Roxanne Bogdan | Council Member Place 1 | `a32e8631-404d-49bd-a914-8b05febe9df5`
Colleen Halbert | Council Member Place 2 | `fc09e53a-723c-4c34-97ab-9e0b692104a0`
Buddy Pilgrim | Council Member Place 3 | `812359f8-3ea5-4815-91ca-7e5a4ba2ba0a`
Darrel Sharpe | Council Member Place 4 | `aba6f016-e35d-4977-99e6-a2cfc079ad75`
Billy Barron | Council Member Place 5 | `e136a517-1772-4f16-9bd5-785828f524e8`
Lee Pettle | Mayor | `61f73b44-c46d-4f1b-91a7-0d35c83feecb`

### City of Plano (4858016) — 0 un-stanced of 8 active (fully stanced; NO WORK for 222-02)

### City of Princeton (4859576) — 3 un-stanced of 8 active
Cristina Todd | Council Member Place 2 | `3c8d7283-2387-47ff-8a29-1ef7a1e2a554`
Bryan Washington | Council Member Place 3 | `e40be594-2239-4c28-a8ac-d4f86c6d4180`
Jaisen Rutledge | Council Member Place 4 | `53f97990-822e-46de-8e18-f09e5a160c2b`

### Town of Prosper (4859696) — 1 un-stanced of 7 active
Doug Charles | Council Member Place 5 | `48500428-3421-4298-b618-613696ca644c`

### City of Richardson (4861796) — 1 un-stanced of 7 active
Curtis Dorian | Council Member District 1 | `6b512b29-d3c1-4709-829f-df78664ffee1`

### City of Saint Paul (4864220) — 6 un-stanced of 6 active
Larry Nail | Council Member Place 1 | `5195d338-4337-4cfe-b5fc-3aa1b0d122f1`
David Dryden | Council Member Place 2 | `53359759-e517-4e83-8a3e-45c572a75627`
Greg Pierson | Council Member Place 3 | `4fd0877c-447d-4950-911d-d73b9b9b1ad1`
Kristen Bewley | Council Member Place 4 | `008565fa-5704-4bba-aaf6-a5d94ee3a875`
Robert Simmons | Council Member Place 5 | `4e17eda5-157c-42e4-832e-3a12d4b2069e`
J.T. Trevino | Mayor | `8dd71c1c-dea7-4fd9-bc52-39d4002ff537`

### City of Van Alstyne (4874924) — 7 un-stanced of 7 active
Ryan Neal | Council Member Place 1 | `1c178f04-87e5-4b27-9793-3afbff6e7ae5`
Marla Butler | Council Member Place 2 | `a710f944-a299-4ffd-9c4f-b110474b0560`
Dusty Williams | Council Member Place 3 | `c09ee8f2-1bd1-4ff9-92e9-f35a1de2735d`
Lee Thomas | Council Member Place 4 | `4089111f-35dc-4e92-911e-17dfcce50d0b`
Katrina Arsenault | Council Member Place 5 | `84bd50df-a548-49b4-8c9e-19fcfa59ff90`
Zach Williams | Council Member Place 6 | `bafcb381-ed3d-4426-b599-582e4a3e251e`
Jim Atchison | Mayor | `4e7bc81e-1b24-4113-a839-3d87a2637df1`

### City of Weston (4877740) — 6 un-stanced of 6 active
Patti Harrington | Council Member Place 1 | `34d011da-2352-4d91-b3f2-b3970ccbaefd`
Brian M. Roach | Council Member Place 2 | `ec61ea47-5631-4203-a6b6-a09fbdb7837d`
Jeff Metzger | Council Member Place 3 | `bd1727af-4222-448a-839c-8fc79e8abdb9`
Mike Hill | Council Member Place 4 | `de080c23-2e85-4b08-b7f7-780bebcde9b8`
Marla Johnston | Council Member Place 5 | `bf89cead-3e7b-4f03-b5be-040c45aa7d07`
Matthew Marchiori | Mayor | `42462d85-a9c8-4aef-9f62-21b11803d06b`

---

## Per-plan assignment table (D-02 evidence-first ordering)

"Councils" means every un-stanced officeholder of that government EXCEPT the mayor already covered
in 222-08/222-09.

| Plan | Scope | Live count |
|---|---|---|
| 222-02 | **County-wide stance-integrity remediation** — delete 12 Class A rows, review 19 Class B2 rows (see 222-01-INTEGRITY-AUDIT.md) | n/a (remediation on the already-stanced 57, not the 107 worklist) |
| 222-03 | Frisco (4827684) — Brittany Colberg, Mark Hill | 2 |
| 222-04 | **Plano + McKinney topic-gap fill** — ~93 unfilled topic slots across 15 people, re-derived live | n/a (gap-fill on the already-stanced 57, not the 107 worklist) |
| 222-05 | Allen (4801924) — Chris Schulmeister | 1 |
| 222-06 | Richardson (4861796) — Curtis Dorian | 1 |
| 222-07 | Prosper (Doug Charles, 1) + Celina (Shea Scott, Shane Lambert, 2) + Longview (Derrick Conley, Shannon Moore, Brandon Smith, John Nustad, Sidney Allen, 5) | 8 |
| 222-08 | Mayors of Anna (Pete Cain), Fairview (John Hubbard), Farmersville (Craig Overstreet), Parker (Lee Pettle), Lucas (Dusty Kuykendall) | 5 (Murphy / Princeton / Melissa mayors are ALREADY stanced -> not in scope) |
| 222-09 | Mayors of Weston (Matthew Marchiori), Blue Ridge (Rhonda Williams), Josephine (Jason Turney), Lavon (Vicki Sanson), Lowry Crossing (Pat Kelly), Nevada (Donald Deering), Saint Paul (J.T. Trevino), Van Alstyne (Jim Atchison) | 8 |
| 222-10 | Anna councils (Toten, Bryan, Walden, Baker, Singh — 5) + Murphy councils (Ison, Kelley — 2) | 7 |
| 222-11 | Fairview councils (Connelly, Boggs, Hawkins, Stanley, Sheehan, Works — 6) + Princeton councils (Todd, Washington, Rutledge — 3) | 9 |
| 222-12 | Melissa councils (Taylor, Hendrickson, Conklin, Armstrong, Ackerman, Lehr — 6) + Farmersville councils (Strickland, Chandler, Mondy, Henry, Fox — 5) | 11 |
| 222-13 | Parker councils (Bogdan, Halbert, Pilgrim, Sharpe, Barron — 5) + Lucas councils (Underhill, Orr, Bierman, Lawrence, Fisher, Peterson — 6) | 11 |
| 222-14 | Weston councils (Harrington, Roach, Metzger, Hill, Johnston — 5) + Blue Ridge councils (Apple, Braly, Sissom, Mattingly, Chitwood — 5) | 10 |
| 222-15 | Josephine councils (Aurand, Ridgway, Esquivel, Sardo, Chappell — 5) + Lavon councils (Shepard, Cook, Jacob, Dumas, Hedge — 5) | 10 |
| 222-16 | Lowry Crossing councils (Pitchure, Hodges, Trujillo, Hijazen, Madrid, Rios, Cash, Simpson — 8) + Nevada councils (Laye, Baker, Wilson, Laughter, Little — 5) | 13 |
| 222-17 | Saint Paul councils (Nail, Dryden, Pierson, Bewley, Simmons — 5) + Van Alstyne councils (Neal, Butler, Williams, Thomas, Arsenault, Williams — 6) | 11 |
| **TOTAL** | | **107** |

**Note — coverage of the 107 is unchanged by the 222-02/222-04 re-scope.** The 107-name research
worklist above is untouched: it is still fully and exclusively covered by plans 222-03 and
222-05..222-17 (222-02 and 222-04 always contributed 0 of the 107, both before and after their
re-scope — see 222-01-INTEGRITY-AUDIT.md). The 222-02 remediation and 222-04 gap-fill work operate
on the *already-stanced* 57-person cohort, a disjoint population from the 107. Re-scoping those two
plans therefore adds work; it does not remove any of the 107 from coverage. The exhaustiveness
assertion below (107 = 107) still holds exactly as derived, and 222-18's reconciliation of the 107
against plans 222-03 + 222-05..222-17 is unaffected by 222-02/222-04's new scope.

### Exhaustiveness assertion

- Worklist row count (from the Full un-stanced roster above): **107**
- Assignment table total: **107**
- Names unassigned: **0**
- Names assigned twice: **0**

**The mapping is exhaustive and non-overlapping.** There is no `UNASSIGNED — needs operator decision`
section because every one of the 107 rows fits an assignment bucket. The two divergences from the
plan's design-time assumptions (Plano/McKinney zero-work, Longview above threshold) are recorded
below as `Operator decisions required`, not as unassigned names.

---

## Operator decisions required

**All four items below are RESOLVED.** The operator reviewed these at the Task 3 blocking
checkpoint on 2026-07-25 and approved the plan with amendments (see 222-01-SUMMARY.md for the full
sign-off record and the county-wide integrity audit this checkpoint triggered).

1. **RESOLVED — 222-02 (Plano) and 222-04 (McKinney) have zero *un-stanced* officeholders, but the
   operator asked for both cities to be double-checked** (they were stanced early in the project,
   before this phase's evidence bar was written down) rather than accepting the "close as no-op"
   recommendation. That check was widened county-wide and found real reasoning/sourcing defects in
   the already-stanced cohort (see `222-01-INTEGRITY-AUDIT.md`). Operator decision, 2026-07-25:
   **222-02 is REPURPOSED into a county-wide stance-integrity remediation plan** (delete 12 Class A
   defective rows, hand-review 19 Class B2 rows), and **222-04 is REPURPOSED into a Plano + McKinney
   topic-gap fill** (evidence-only research for the ~93 unfilled topic slots across Plano's 8 and
   McKinney's 7 officeholders — re-derived live at execution, since the Class A deletions shrink
   several per-person counts). This is a narrowly-scoped exception covering exactly these two
   cities, not a general reopening of the 57 already-stanced residual (item 3 below). See the
   amended per-plan assignment table below.

2. **RESOLVED — Longview has 5 un-stanced (> the plan's own 3-person threshold for riding along in
   222-07).** Operator decision, 2026-07-25: **keep Longview in 222-07** as an 8-person plan
   (Prosper 1 + Celina 2 + Longview 5). No 19th plan.

3. **RESOLVED — All 57 already-stanced in-scope people hold between 1 and 9 of the 11 topics — none
   holds all 11.** Operator decision, 2026-07-25: **the 57-person partially-stanced residual is
   ACCEPTED as out of scope** for Phase 222 per D-07, **except for Plano and McKinney** (see item 1
   above — those two cities' gaps are filled by the repurposed 222-04, not left as residual). The
   remaining 41 already-stanced people across the other 22 governments are logged as named follow-on
   work ("standardize/backfill the existing partially-stanced cohort to all 11 topics") for a future
   phase, not a Phase 222 gap.

4. **RESOLVED — blank-register contract granularity.** Operator decision, 2026-07-25: **CONFIRMED as
   per-person-per-topic**, not per-person. A person may legitimately appear in both the applied-
   migration bucket and the blank-register bucket — sourced topics land in an applied migration,
   unsourced topics land in the register, for the *same* person. The per-person "never both" reading
   is unsatisfiable in practice because nobody in this phase's scope reaches all 11 topics. 222-18
   must reconcile completeness at (person, topic) granularity, not (person) granularity.

---

## Sources

- Live SQL results run against production by the orchestrator, 2026-07-25 (RESEARCH.md §A Steps 1-2,
  the topic-UUID verification query, the Frisco Place 4 / Longview cross-checks, and a directory
  listing of `C:/EV-Accounts/backend/migrations`).
- `.planning/phases/222-.../222-RESEARCH.md` §A (worklist SQL), §B (topic UUID/question text), §E
  (migration numbering convention).
- `.planning/phases/222-.../222-CONTEXT.md` D-01 through D-08.
- `.planning/phases/221-.../221-CONFIRMED-BLANK.md` — `is_vacant IS NULL` fix precedent.
