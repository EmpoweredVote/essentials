---
phase: 192-arizona-legislature-seed-headshots
plan: 01
status: complete
completed: 2026-07-09
requirements: [AZ-LEG-01]
migration: "1286_az_legislature.sql"
migration_registered: true
---

# 192-01 Summary — Structural Legislature Seed

## What was built

Authored and applied `1286_az_legislature.sql` — a greenfield **structural** migration that seeds
the full 90-member 57th Arizona Legislature (2025–26) under the State of Arizona government
(geo_id `04`):

- **2 net-new chambers**: `State Senate` (Arizona State Senate) + `House of Representatives`
  (Arizona House of Representatives), idempotent on (name, government_id).
- **30 Senate offices** — 1 per SLDU district, `title='State Senator'`, ext_id `-40050NN`,
  linked WHERE `district_type='STATE_UPPER' AND state='az'`.
- **60 House offices** — exactly 2 per SLDL district, `title='State Representative'`,
  ext_ids `-4006(2N-1)`/`-4006(2N)`, linked WHERE `district_type='STATE_LOWER' AND state='az'`,
  each guarded on `(o.district_id = d.id AND o.politician_id = p.id)` (the collegial-body key —
  NOT district_id+chamber_id — so the 2nd rep of each LD does not silently no-op).
- **90 politicians**, 3 of which are mid-term appointees (`is_appointed=true` on the politician,
  `is_appointed_position=false` on the office): **Kiana Sears** (SD-9, replaced Eva Burch),
  **Cody Reim** (HD-3, replaced Joseph Chaplik), **Sylvia Allen** (HD-7, replaced David Marshall Sr.).
  The 3 departed members were **never seeded** (appear only in explanatory comments).
- Two `office_id` backfills (Senate `-4005030..-4005001`, House `-4006060..-4006001`).
- In-transaction post-verify `DO` gate (6 assertions) + ledger registration outside COMMIT.

## Key files

- **Created:** `C:/EV-Accounts/backend/migrations/1286_az_legislature.sql` (structural, registered) —
  commit `72beb1b9` on `master` in the `C:/EV-Accounts` repo (2948 lines, 1 file, 2948 insertions).

## Checkpoint (Task 2 — human-verify, blocking)

Operator approved on 2026-07-09 ("Approved — apply now") — live azleg.gov roster confirmed current,
including the 3 mid-term seats. Orchestrator then applied the migration via
`psql "$DATABASE_URL" -f` (executor has no DB access).

## Verification (applied to production)

In-transaction gate NOTICE:
`Post-verification PASSED: new_pol_count=90, senate_offices=30, house_offices=60, house_split_violations=0, upper_links=30, lower_links=60, section_split=0`

Post-apply orchestrator assertions (all green):

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| State Senate offices @ geo_id='04' | 30 | 30 | ✅ |
| House offices @ geo_id='04' | 60 | 60 | ✅ |
| House GROUP BY district_id HAVING count<>2 | 0 rows | 0 | ✅ |
| Linkage STATE_UPPER | 30 | 30 | ✅ |
| Linkage STATE_LOWER | 60 | 60 | ✅ |
| DISTINCT state on our 90 offices' districts | only `az` | `az` | ✅ |
| Section-split (our chambers, STATE_UPPER/LOWER) | 0 rows | 0 | ✅ |
| Ledger `version='1286'` registered | 1 | 1 | ✅ |
| Combined boolean SELECT | t | t | ✅ |

> Note: an unscoped `DISTINCT state` over all `geo_id='04'` offices returns `{az, AZ}` — the `AZ`
> rows are Phase 191's pre-existing statewide-exec + Corporation-Commission offices, NOT this
> plan's legislature. Scoped to `State Senate`/`House of Representatives`, DISTINCT state = only `az`.

## Self-Check: PASSED

## 90 Politician UUID Manifest (external_id → UUID → full_name)

Required by Plan 02 (headshot script + audit migration resolve `politician_id` by `external_id`).

| external_id | politician_id (UUID) | full_name |
|-------------|----------------------|-----------|
| -4006060 | 50d00238-5334-4616-ac43-72375f53df71 | John Gillette |
| -4006059 | b1b97401-d1a9-4442-9f78-2749f1853f6e | Leo Biasiucci |
| -4006058 | ee80504a-fe2d-45e1-8bbe-ce0a5042d2b8 | James Taylor |
| -4006057 | 47071c20-df9d-4f9d-9329-25faf64cd163 | Steve Montenegro |
| -4006056 | 184bd445-9f61-4bd3-859f-22522c9ccabd | Beverly Pingerelli |
| -4006055 | 43e734b4-4417-4dcd-91c9-f420f3a1b702 | David Livingston |
| -4006054 | 9c481b8d-e373-4409-bccb-bde6534882da | Tony Rivero |
| -4006053 | 558dc1d6-0365-4707-8373-4ef188aff71c | Lisa Fink |
| -4006052 | 1482a2bc-75d8-4aee-865c-53378c415210 | Quantá Crews |
| -4006051 | 49b2db49-6438-437c-90ce-36b97670e30a | Cesar Aguilar |
| -4006050 | 4176f760-3c74-4a55-8edc-b7897ee80e21 | Nick Kupper |
| -4006049 | 86b6bbf3-cb81-4f8e-a44b-5c4ffe46df7a | Michael Carbone |
| -4006048 | 8deb34b4-a40d-4d26-8d3a-1b5a9e9f07f9 | Lydia Hernandez |
| -4006047 | 1d2e925a-299f-4504-a4de-815d7a2ee7a6 | Anna Abeytia |
| -4006046 | c37db938-9db2-47d5-b30e-7ac6a5f5c5ee | Mariana Sandoval |
| -4006045 | 81b3d4cc-c502-4fbc-bd75-97773c39b2f5 | Michele Peña |
| -4006044 | 8d470040-0f53-4881-8b58-5e9563a85f94 | Elda Luna-Nájera |
| -4006043 | d5466317-d90a-41ce-ba20-30c12429dcb3 | Lupe Contreras |
| -4006042 | 2405145c-f082-47f2-861d-d4efd19e8162 | Stephanie Stahl Hamilton |
| -4006041 | 5e9c9ca6-5267-4d01-b19d-a7da775d89d9 | Consuelo Hernandez |
| -4006040 | 6dcc0e46-c944-480b-a432-7b36989d56e9 | Betty J Villegas |
| -4006039 | e4460c64-fa27-4e05-96e8-cc005a478444 | Alma Hernandez |
| -4006038 | 188c386e-087b-4587-9510-da7fc5805575 | Gail Griffin |
| -4006037 | 0ac7beee-f298-4d41-8981-30c3c307fe3d | Lupe Diaz |
| -4006036 | a7675f41-2e50-413c-9864-8a64969f47f9 | Christopher Mathis |
| -4006035 | ce872623-f6bd-4e90-9eba-239ed00c7491 | Nancy Gutierrez |
| -4006034 | c72622ac-61d7-4e8b-83a8-565cfca045c0 | Kevin Volk |
| -4006033 | 6a1417b8-cdcd-43f2-a63d-533beaefc563 | Rachel Keshel |
| -4006032 | 5dd72969-087b-4db0-b2b1-ee87a1ef11b9 | Chris Lopez |
| -4006031 | cacb84a8-4343-4919-a37c-dfcb6e050243 | Teresa Martinez |
| -4006030 | 29b130a2-1531-4b35-b79e-dc0e8e3c0b93 | Michael Way |
| -4006029 | 9a81dfd3-b70b-45bf-8851-3907d6e12508 | Neal Carter |
| -4006028 | 3769c4ad-3844-4ab6-9416-96b93c049b33 | Khyl Powell |
| -4006027 | 1f7399ee-2434-49dc-9a18-857bfa0e41f1 | Laurin Hendrix |
| -4006026 | 8edebfca-2e35-4424-85f8-f3ad498a2890 | Julie Willoughby |
| -4006025 | b813cb2d-f80e-4f53-83e0-fc0477ff3f3d | Jeff Weninger |
| -4006024 | c2c49ac4-8d5e-46e3-b663-ac1677021a1b | Stacey Travers |
| -4006023 | 8dcf58fe-fea2-4dd4-81ac-542432b154cf | Patty Contreras |
| -4006022 | fb949bda-e2f5-49ab-9069-a70da1fb13bd | Oscar De Los Santos |
| -4006021 | 2b044f08-b5ce-4b15-993e-b90c16603c25 | Junelle Cavero |
| -4006020 | 2af8f7d8-79ac-4668-9771-fdfff27ecc6c | Justin Olson |
| -4006019 | 92b03e09-8251-4eb8-a50e-966d52a592e1 | Ralph Heap |
| -4006018 | 329dc518-7749-4671-b448-3ddaa396da9c | Seth Blattman |
| -4006017 | e2bd3486-1fcf-4726-8df8-564ad8ef2b62 | Lorena Austin |
| -4006016 | ea0e5f51-f963-45ef-a104-429af91e5f90 | Brian Garcia |
| -4006015 | d6f22ab7-5f0a-4d58-b53a-fd69bf4ad556 | Janeen Connolly |
| -4006014 | a88f4ecd-5c4f-4caf-a88c-1d06c92bfdc7 | Walt Blackman |
| -4006013 | 9f5a84e0-0195-4459-ab6e-b3ae09404d2e | Sylvia Allen *(appointee)* |
| -4006012 | 47a75797-e525-4dd9-ab04-66dd4d667760 | Myron Tsosie |
| -4006011 | fe4cbf96-b145-48d7-9fcf-120e6b75c290 | Mae Peshlakai |
| -4006010 | 0df9cd85-3923-48bd-86c2-b7d4b31d510d | Aaron Márquez |
| -4006009 | eb8215ef-5e68-431a-a5cf-c226e8c0abf1 | Sarah Liguori |
| -4006008 | 5293ff0f-0365-4943-89a5-f4017566c8dd | Matt Gress |
| -4006007 | 23675559-e2dd-4e26-abed-2f87954dc70e | Pamela Carter |
| -4006006 | 85937da6-85eb-4d10-946f-2ed3c391a9c9 | Cody Reim *(appointee)* |
| -4006005 | 178470c3-94ea-442a-a558-7b3c841ce858 | Alexander Kolodin |
| -4006004 | 729d1a1e-b58f-4a33-bf18-a0f11e3c5e04 | Justin Wilmeth |
| -4006003 | 84bb6849-a68d-42e0-999d-dd0456b9d0b4 | Stephanie Simacek |
| -4006002 | 9cc152b6-c83b-4501-9e1a-2ab50e1db6a7 | Quang H Nguyen |
| -4006001 | b8c33072-6368-4465-8352-14e9fabddfbe | Selina Bliss |
| -4005030 | 4fe779de-6a47-4321-82f1-ced096543a68 | Hildy Angius |
| -4005029 | 687e6f07-f71a-41b4-8525-b509b2cebb42 | Janae Shamp |
| -4005028 | 376698b5-a276-4977-b2c3-3d15a822f7d8 | Frank Carroll |
| -4005027 | 0b0dc6ea-ed45-45e6-9a59-41d1c8aeb53c | Kevin Payne |
| -4005026 | 4046a3d6-87ba-41bb-afd8-422f017c851b | Flavio Bravo |
| -4005025 | ebef00e8-7722-4e9b-b5dc-ef95a41a9a40 | Timothy "Tim" Dunn |
| -4005024 | bb540c4b-e5d2-40b9-bdaf-e41a721572f8 | Analise Ortiz |
| -4005023 | 2aa0cf37-6c3a-405d-9cd2-0fafc7cf8636 | Brian Fernandez |
| -4005022 | 901398ea-3180-4b6d-8ba4-9f0dd85d7bb1 | Eva Diaz |
| -4005021 | 8cbc6c91-4147-4831-ae0e-f4658ce282e8 | Rosanna Gabaldón |
| -4005020 | 82f31f9c-754b-4417-bc21-af295b2b4d2b | Sally Ann Gonzales |
| -4005019 | e71471f4-bef5-46ef-a1f2-f19f275b558d | David Gowan |
| -4005018 | 179e2cdb-395e-4f7f-a5e1-775ff176ce64 | Priya Sundareshan |
| -4005017 | c2ee942d-72dc-4e50-8b78-dfe0a6ce8f93 | Venden "Vince" Leach |
| -4005016 | 8bbf9f70-adee-4801-ab19-7b78f9e70aa1 | Thomas "T.J." Shope |
| -4005015 | 66ca210e-deab-4d07-8a18-48f7079f6f9b | Jake Hoffman |
| -4005014 | 49b806b1-f15d-4998-a94e-de542d9e323e | Warren Petersen |
| -4005013 | 09ae25a4-9244-455a-960a-b95223bb52d8 | J.D. Mesnard |
| -4005012 | feecd8fc-b007-450a-8779-8e6f68e80dd6 | Denise "Mitzi" Epstein |
| -4005011 | f1b19116-3c6f-4c44-9faf-bc32db5fc5d2 | Catherine Miranda |
| -4005010 | 7ab7c163-bfac-4a95-8b94-22d1a4395522 | David C. Farnsworth |
| -4005009 | fef8eb85-8360-418d-8239-ccf3a823608b | Kiana Sears *(appointee)* |
| -4005008 | 68308cfb-52ff-4a9c-8363-9a582ea9a989 | Lauren Kuby |
| -4005007 | 23b7d096-37ad-4b00-8291-c7f0640a22d2 | Wendy Rogers |
| -4005006 | 5443de2a-bad1-4271-a8ac-30e7443ff605 | Theresa Hatathlie |
| -4005005 | 64520134-c1e3-44b1-aeb5-ed3e8762972d | Lela Alston |
| -4005004 | b769f53e-c9e5-4259-9e00-c20bfa945d15 | Carine Werner |
| -4005003 | 4f7db8ce-def5-4225-b183-654f8f64cb9a | John Kavanagh |
| -4005002 | 2785d691-2404-400e-8dde-bcc5a58e419b | Shawnna Bolick |
| -4005001 | 489e2fc3-b47a-4304-b959-07e35f010da4 | Mark Finchem |
