# 221-01 WORKLIST — Collin County Missing Headshots (LIVE audit)

Derived **live from essentials at execution time** (2026-07-24), not from the ~82-day-old audit memo. Source of truth = `pi.id IS NULL` over the Collin County scope. Cross-checked against the 23 Collin browse geo_ids in `src/lib/coverage.js` (Texas block).

## BEFORE coverage counts (city-scope)

| Metric | Count |
|--------|-------|
| Total in-scope seated Collin officeholders | **150** |
| WITH a `politician_images` row | **102** |
| WITHOUT an image (worklist size, city-scope) | **48** |

Worklist to attempt = **49** = 48 city-scope + Brandon Smith (Longview D3, seated mig 1400, outside the Collin city filter but a coverage.js browse city).

### Scope notes
- **Gopal Ponangi (was Frisco Place 4, mig 1404): OUT OF SCOPE.** Live DB shows `is_active = false`, `office_id = NULL` — he was un-seated when mig 1409 corrected the erroneous Collin-only-canvass seating of the Frisco P4 *loser* (Frisco is a 2-county city). He is **not a current officeholder**, so no headshot is needed. His final disposition (221-04) = "not seated; no photo required" — NOT a confirmed-blank-with-search. Recorded here so 221-04 does not treat his absence as a coverage gap.
- **Most Batch A cities already have full headshot coverage.** Plano, Richardson, Allen, McKinney, Prosper, Celina, Murphy, Fairview, Lucas, Parker returned **zero** imageless officeholders. The gap is concentrated in small-town rosters — as the v25.0 roadmap predicted.
- **coverage.js cross-check:** all 23 Collin browse cities are inside the query scope; no government present in coverage.js but absent from the query (and vice-versa). Longview (4843888) is a coverage.js TX browse city; Brandon Smith is handled via explicit union.
- **Zero-known-online-source cities** (v25.0 roadmap flag): **Blue Ridge, Farmersville, Lowry Crossing, Nevada, Saint Paul** — EXPECTED to end mostly blank, but every person is still attempted via a genuine search before any blank is recorded (COLLIN-HEADSHOT-01).

---

## Batch A — higher-source (→ 221-02), 3 people

| politician_id | full_name | city | office |
|---|---|---|---|
| c84d87b3-aa64-4f73-aed8-2eb5f113a016 | Jessica Walden | Anna | Council Member Place 3 |
| 3579e02c-d480-48ba-8d95-3eb7f002a5b0 | Mark Hill | Frisco | Mayor |
| c6ec603a-3ba9-478b-a43d-35ef9bb5b0f0 | Brandon Smith | Longview | Council Member District 3 |

---

## Batch B — small-town / low-source (→ 221-03), 46 people

### Blue Ridge (6) — zero-known-source, expect mostly blank
| politician_id | full_name | office |
|---|---|---|
| 831ce2c9-bc43-487a-a0d6-a0b9c776e7d2 | David Apple | Council Member Place 1 |
| c7bfdeff-ba51-479c-b956-331a6562c21b | Linda Braly | Council Member Place 2 |
| b85c7a20-744d-4065-b240-530aceda65bc | Trenton Sissom | Council Member Place 3 |
| ff6a17d4-7067-4566-9241-17aaf9f45b34 | Wendy Mattingly | Council Member Place 4 |
| f6da000b-c299-4f90-afee-5a8e0d0d26bf | Keith Chitwood | Council Member Place 5 |
| a9db2052-5fbd-4370-9f78-f8ba07b6e452 | Rhonda Williams | Mayor |

### Farmersville (6) — zero-known-source, expect mostly blank
| politician_id | full_name | office |
|---|---|---|
| 94252f68-40d6-4e82-8f10-1015a85fa403 | Coleman Strickland | Council Member Place 1 |
| eb6c2d0f-ea9f-420c-81bb-eb3d6287214d | Russell Chandler | Council Member Place 2 |
| fae40714-a182-4e37-9bac-1afe754b4561 | Kristi Mondy | Council Member Place 3 |
| 5712d682-ffd5-4e6d-afa8-9707613fd838 | Mike Henry | Council Member Place 4 |
| eab3bbe2-4103-49a2-a0bf-d45acc9d54e0 | Tonya Fox | Council Member Place 5 |
| e7f04a34-b8e7-4978-87d6-60ece59ced92 | Craig Overstreet | Mayor |

### Lowry Crossing (9) — zero-known-source, expect mostly blank
| politician_id | full_name | office |
|---|---|---|
| e84f56af-ad73-4bec-8e4c-efccb8854cb1 | Scott Pitchure | Council Member Place 1 |
| eb142dfb-2208-4d3c-afe7-d2b64708129b | Tammy Hodges | Council Member Place 2 |
| c765ca48-4960-42c9-bf31-a4e074227e14 | Eusebio "Joe" Trujillo III | Council Member Place 3 |
| 254acced-9f14-4d55-bf13-18697a7c2f86 | Muhanad "G" Hijazen | Council Member Place 4 |
| 40c5dd28-4613-4b2e-b51f-5fd2ee8d515c | Chris Madrid | Council Member Place 5 |
| 38bb0d46-b34d-48f3-b7d3-797b19a379ae | Agur Rios | Council Member Place 6 |
| fed8ee0b-440d-4562-a521-0f897324ab78 | Cindy Cash | Council Member Place 7 |
| dceb965b-63c6-47cb-ba59-f25ff91b05b5 | Ollie Simpson | Council Member Place 8 |
| 6f199ec9-ba4a-4c0d-b6e3-bae97e0da847 | Pat Kelly | Mayor |

### Nevada (6) — zero-known-source, expect mostly blank
| politician_id | full_name | office |
|---|---|---|
| f138261a-4e0b-4c53-b30a-18e30b76e614 | Mike Laye | Council Member Place 1 |
| 988e1851-7b35-4bce-81ff-955412f8670b | Paul Baker | Council Member Place 2 |
| c41886b8-f4ad-4f06-a579-5140c8951c91 | Amanda Wilson | Council Member Place 3 |
| 6c1dc476-507b-43a8-9061-bdaf9eafec58 | Clayton Laughter | Council Member Place 4 |
| 51c0d0db-b3e6-4e71-960e-4809ad680e25 | Derrick Little | Council Member Place 5 |
| 47a5349c-ea03-4fcf-8719-948c259a3753 | Donald Deering | Mayor |

### Princeton (7)
| politician_id | full_name | office |
|---|---|---|
| eb9f2322-ec6b-42f0-9939-e58cd0b843a9 | Terrance Johnson | Council Member Place 1 |
| 3c8d7283-2387-47ff-8a29-1ef7a1e2a554 | Cristina Todd | Council Member Place 2 |
| e40be594-2239-4c28-a8ac-d4f86c6d4180 | Bryan Washington | Council Member Place 3 |
| 7ccb8074-3d74-4493-9eb9-528ac48fea47 | Steven Deffibaugh | Council Member Place 5 |
| ec68cd34-0756-4c12-89b9-d1b483cf08e8 | Ben Long | Council Member Place 6 |
| 2b828401-75d7-4fb4-a3f6-ad1c6f39cc2a | Carolyn David-Graves | Council Member Place 7 |
| 08cf69c5-1bd4-484f-88c8-8edd05a1b821 | Eugene Escobar Jr. | Mayor |

### Saint Paul (6) — zero-known-source, expect mostly blank
| politician_id | full_name | office |
|---|---|---|
| 5195d338-4337-4cfe-b5fc-3aa1b0d122f1 | Larry Nail | Council Member Place 1 |
| 53359759-e517-4e83-8a3e-45c572a75627 | David Dryden | Council Member Place 2 |
| 4fd0877c-447d-4950-911d-d73b9b9b1ad1 | Greg Pierson | Council Member Place 3 |
| 008565fa-5704-4bba-aaf6-a5d94ee3a875 | Kristen Bewley | Council Member Place 4 |
| 4e17eda5-157c-42e4-832e-3a12d4b2069e | Robert Simmons | Council Member Place 5 |
| 8dd71c1c-dea7-4fd9-bc52-39d4002ff537 | J.T. Trevino | Mayor |

### Van Alstyne (6)
| politician_id | full_name | office |
|---|---|---|
| 1c178f04-87e5-4b27-9793-3afbff6e7ae5 | Ryan Neal | Council Member Place 1 |
| a710f944-a299-4ffd-9c4f-b110474b0560 | Marla Butler | Council Member Place 2 |
| c09ee8f2-1bd1-4ff9-92e9-f35a1de2735d | Dusty Williams | Council Member Place 3 |
| 4089111f-35dc-4e92-911e-17dfcce50d0b | Lee Thomas | Council Member Place 4 |
| 84bd50df-a548-49b4-8c9e-19fcfa59ff90 | Katrina Arsenault | Council Member Place 5 |
| bafcb381-ed3d-4426-b599-582e4a3e251e | Zach Williams | Council Member Place 6 |
