---
tech-stack.added: []
key-files:
  - C:/EV-Accounts/backend/migrations/228_or_legislature_headshots.sql
affects:
  - phase-76
requires:
  - phase-75-plan-01
  - phase-75-plan-02
subsystem: essentials-data
---

# Plan 75-03 Summary: OR State Legislature Headshots

Executed 2026-05-29. All 90 OR state legislators received official portrait headshots sourced exclusively from oregonlegislature.gov MemberPhotos. Senate pass completed first (30 subjects), house pass second (60 subjects). Zero gaps.

---

## Senate Pass: 30/30 IMPORTED, 0 GAPS

| politician_id | full_name | District | Source filename |
|---|---|---|---|
| 5350c0ba-0ef4-4021-a620-90820df859b7 | David Brock Smith | SD-01 | smithdb.jpg |
| 13ce589f-756e-4968-881f-c8cc95dae404 | Noah Robinson | SD-02 | robinsonn.jpg |
| 21b454d4-e6a5-48fe-9bd1-0da84f2a1a39 | Jeff Golden | SD-03 | golden.jpg |
| b6f5cd9e-a9d2-44ff-9027-0d931765f378 | Floyd Prozanski | SD-04 | prozanski.jpg |
| d9803822-6bf8-437d-aa4b-d7e6b4a67b7c | Dick Anderson | SD-05 | andersond.jpg |
| d3dedaa7-bda5-4e3d-af18-6214719d6e1e | Cedric Hayden | SD-06 | hayden.jpg |
| bef7b04c-a2ba-4daf-9359-ae1ae0e38e9e | James I. Manning Jr. | SD-07 | manning.jpg |
| 1ca1abf1-9523-499c-b644-0b32c61257c6 | Sara Gelser Blouin | SD-08 | gelser.jpg |
| 6b107b84-afbe-4141-8951-bafb65543dda | Fred Girod | SD-09 | girod.jpg |
| 631cc414-8793-42ec-b883-594ed7f0b249 | Deb Patterson | SD-10 | patterson.jpg |
| b548a0f7-5086-4124-a510-49ef8f60f515 | Kim Thatcher | SD-11 | thatcher.jpg |
| 0c228d44-a876-4371-bdfd-13fdfd8ea9b6 | Bruce Starr | SD-12 | starrb.jpg |
| dcdc002c-8fd6-415a-a30a-8fc70c83d9ff | Courtney Neron Misslin | SD-13 | neron.jpg |
| 529ea93b-c234-4df5-ae22-6ba32d0ae9a4 | Kate Lieber | SD-14 | lieber.jpg |
| fa9d50e7-7e9b-4eed-b105-bf8277b51f95 | Janeen Sollman | SD-15 | sollman.jpg |
| d34df5c8-9534-4472-814d-971adff16f50 | Suzanne Weber | SD-16 | weber.jpg |
| d910cf6e-7d70-4b0c-b883-2fe2dcb185b6 | Lisa Reynolds | SD-17 | Reynolds.jpg |
| 95300e6e-ea4e-47f9-8a24-5f6f762d5c73 | Wlnsvey Campos | SD-18 | campos.jpg |
| 14faa864-de9f-497f-a78a-db41f42ee5e0 | Rob Wagner | SD-19 | wagner.jpg |
| be46ed6d-363e-46f4-89d4-c95d9af67db1 | Mark Meek | SD-20 | meek.jpg |
| 4b4702e0-3b88-4fd0-aa17-aa379be0dbac | Kathleen Taylor | SD-21 | taylor.jpg |
| ae4b1163-e9a7-4529-a8f2-5610f6c93cbd | Lew Frederick | SD-22 | frederick.jpg |
| 80ed3ab4-f7f6-4738-a9b7-49e6f52ad61e | Khanh Pham | SD-23 | pham.jpg |
| a703adb5-1086-471b-ba8b-2dbeddd8102b | Kayse Jama | SD-24 | jama.jpg |
| 22a1e980-4f15-435d-a0c4-1a08202d6bb5 | Chris Gorsek | SD-25 | gorsek.jpg |
| 402a00be-71c3-4584-b29f-bf493365bffb | Christine Drazan | SD-26 | drazan.jpg |
| 3af0dfad-d1a1-4c91-a859-6f17c5e238b9 | Anthony Broadman | SD-27 | broadman.jpg |
| 50eab431-7b51-4a56-acaa-61af3509c298 | Diane Linthicum | SD-28 | linthicumd.jpg |
| 86d23630-36ff-48a7-b2ac-6071a0cabd64 | Todd Nash | SD-29 | nash.jpg |
| 252a2adf-68a5-4b5a-9024-d5635e2fbd88 | Mike McLane | SD-30 | mclane.jpg |

Notes on non-obvious senate filenames:
- SD-01 smithdb.jpg (avoids collision with house smithg.jpg for Gregory Smith)
- SD-02 robinsonn.jpg ('n' suffix)
- SD-05 andersond.jpg ('d' suffix for Dick)
- SD-08 gelser.jpg (not gelserblouin)
- SD-12 starrb.jpg ('b' suffix for Bruce)
- SD-13 neron.jpg (not neronmisslin)
- SD-17 Reynolds.jpg (capital R on source server)
- SD-20 meek.jpg (derived; not in scraped list — file confirmed present on server, 25KB)
- SD-28 linthicumd.jpg ('d' suffix for Diane)

GAP table: none.

---

## House Pass: 60/60 IMPORTED, 0 GAPS

| politician_id | full_name | District | Source filename |
|---|---|---|---|
| 0e3b9216-cfb9-411f-b80e-684ccaae593f | Court Boice | HD-01 | boice.jpg |
| 558e9c8c-5e52-4685-9e24-1367810f8030 | Virgle Osborne | HD-02 | osborne.jpg |
| f74bb46f-4e4a-47c0-a3d7-285e57cf8d4d | Dwayne Yunker | HD-03 | yunker.jpg |
| 35d2729c-b754-4fad-b124-10ee437a116f | Alek Skarlatos | HD-04 | skarlatos.jpg |
| 03af5908-a069-4ab7-91db-2f388a885bf9 | Pam Marsh | HD-05 | marsh.jpg |
| 3778353d-cbc9-43cf-866a-a7c01397503a | Kim Wallan | HD-06 | wallan.jpg |
| f2b4e1d0-9603-42fd-b2b7-fefd7905ec3d | John Lively | HD-07 | lively.jpg |
| 763d9c0d-e1a4-4ddd-b919-b1a70d1f99ac | Lisa Fragala | HD-08 | fragala.jpg |
| d5386673-4244-44ca-8e54-e1af61803f6e | Boomer Wright | HD-09 | wright.jpg |
| 00ddecfd-648a-4118-82e6-a60327068b32 | David Gomberg | HD-10 | gomberg.jpg |
| c854f51f-0ab0-4b46-9397-596501e3ee67 | Jami Cate | HD-11 | cate.jpg |
| f3fb09eb-adb0-4543-b6a2-32f90003569b | Darin Harbick | HD-12 | harbick.jpg |
| ca404c61-11af-43d9-9563-07dde3f7b8e7 | Nancy Nathanson | HD-13 | nathanson.jpg |
| 24398310-8e0c-487e-a11c-253e3060f77c | Julie Fahey | HD-14 | fahey.jpg |
| 4919fd6a-c250-47b2-a37d-37b1eec8c63d | Shelly Boshart Davis | HD-15 | davis.jpg |
| 2a116530-8d06-41b5-b965-50d943eae8c2 | Sarah Finger McDonald | HD-16 | mcdonald.jpg |
| ea9746ba-9fd2-4622-b781-b3ed35d18d17 | Ed Diehl | HD-17 | diehl.jpg |
| aa57168d-58b8-4f70-a937-09fdaf18b325 | Rick Lewis | HD-18 | lewis.jpg |
| 5b81e68c-3ec3-4c81-9f1b-010db86da9c0 | Tom Andersen | HD-19 | andersen.jpg |
| e5c0549e-4454-4cea-b7dc-67eb17d28b49 | Paul Evans | HD-20 | evans.jpg |
| 2edbb7a5-a798-4088-8939-7b44b51e682c | Kevin Mannix | HD-21 | mannix.jpg |
| 7360da53-a6df-42d9-89b4-fff76af23de6 | Lesly Munoz | HD-22 | munoz.jpg |
| 0cd6ccff-e02d-4cbe-a1df-381226292840 | Anna Scharf | HD-23 | scharf.jpg |
| 7bba19f8-0a1f-4ee2-852f-63bb38ffef6e | Lucetta Elmer | HD-24 | elmer.jpg |
| 5e29b685-1f2e-4963-83a8-a7bde5b5250e | Ben Bowman | HD-25 | bowman.jpg |
| 0d5a4aeb-121f-461c-b379-a8a00c3b1ba1 | Sue Rieke Smith | HD-26 | riekesmith.jpg |
| 40ecc3a4-ca59-48c4-8b17-634cc385bc9a | Ken Helm | HD-27 | helm.jpg |
| c5640f05-239a-47fd-97f3-e284859c1cc9 | Dacia Grayber | HD-28 | grayber.jpg |
| 3fbaa80c-be2d-411f-a3ab-95add9ae6c84 | Susan McLain | HD-29 | mclain.jpg |
| f2bc3bbf-0d29-4ad9-b675-9c53cf081969 | Nathan Sosa | HD-30 | sosa.jpg |
| eab1011b-0cf3-4538-8842-292e7ab22291 | Darcey Edwards | HD-31 | edwardsda.jpg |
| cd8e1e6b-bd17-44e0-a8a3-deffc2f5982e | Cyrus Javadi | HD-32 | javadi.jpg |
| 2b9da845-9fab-406f-97c3-1afe895c254b | Shannon Isadore | HD-33 | isadore.jpg |
| bcc608a3-abf0-4a30-9c4b-0721dcf04be5 | Mari Watanabe | HD-34 | watanabe.jpg |
| 62decede-7149-40a1-a68a-16e2d3eb62a6 | Farrah Chaichi | HD-35 | chaichi.jpg |
| 2e668344-f025-489a-b870-1803269c11fc | Hai Pham | HD-36 | phamh.jpg |
| b5d3a442-3229-412a-8da4-e8eb8b9fdb3a | Jules Walters | HD-37 | walters.jpg |
| 73519742-09c3-4204-871b-076ff1397a14 | Daniel Nguyen | HD-38 | nguyend.jpg |
| 0bffa985-c83b-41c3-8901-19b7dac86cd7 | April Dobson | HD-39 | dobson.jpg |
| 14896652-e36b-4823-afb0-e92e3338929c | Annessa Hartman | HD-40 | hartman.jpg |
| 36db8c55-4b20-408c-bd99-b8488d0ef344 | Mark Gamba | HD-41 | gamba.jpg |
| c5c49832-aa2d-477e-b44e-d6059a98d426 | Rob Nosse | HD-42 | nosse.jpg |
| 051b4e9a-6966-45b3-9b65-e23ad4672364 | Tawna D. Sanchez | HD-43 | sanchez.jpg |
| 0f7439ad-5832-42e9-a1c5-75f1720e14d3 | Travis Nelson | HD-44 | nelson.jpg |
| 9ada0539-e66c-444f-b220-86a8138b5277 | Thuy Tran | HD-45 | tran.jpg |
| d3371858-924e-4f76-b756-f2d7bb3c9b8d | Willy Chotzen | HD-46 | chotzen.jpg |
| a5a3918c-3e24-44fa-9573-440436a05b04 | Andrea Valderrama | HD-47 | valderrama.jpg |
| e0b21a1d-8c55-4aa9-a58a-d6b69db9f716 | Lamar Wise | HD-48 | wise.jpg |
| 37247ac1-5444-4fdd-b58e-123b5db4d0fe | Zach Hudson | HD-49 | hudson.jpg |
| 5e5e267a-808e-4a57-9f80-7c3e47fcb5f6 | Ricki Ruiz | HD-50 | ruiz.jpg |
| ce386a55-7cc5-4006-89db-97e06e0e0279 | Matt Bunch | HD-51 | bunch.jpg |
| 701f0236-5ca7-4bfa-ab71-8c22bcc5ff8c | Jeff Helfrich | HD-52 | helfrich.jpg |
| f1d2cfe6-5e70-42f3-a010-bb58ec6a5d86 | Emerson Levy | HD-53 | levye.jpg |
| bbc19752-8675-48ef-87fb-480e3f8bf3f6 | Jason Kropf | HD-54 | kropf.jpg |
| 3c7c9b46-a054-41a7-8752-f0d8706f754d | E. Werner Reschke | HD-55 | reschke.jpg |
| 9f9b60c1-483c-4a8e-8221-145098204ced | Emily McIntire | HD-56 | mcintire.jpg |
| 81cda574-d820-4ac3-b7fe-0ac3d2638c28 | Gregory Smith | HD-57 | smithg.jpg |
| 05152597-fd40-49bb-bcd3-9e21945ae8b0 | Bobby Levy | HD-58 | levy.jpg |
| 7f460988-c9a6-4452-a872-441e7c4ac071 | Vikki Breese-Iverson | HD-59 | breeseiverson.jpg |
| ca7c06f8-d4cf-4bec-947f-fb39a00e2cb1 | Mark Owens | HD-60 | owens.jpg |

GAP table: none.

---

## HD-53 vs HD-58 Levy Disambiguation

Both Emerson Levy (HD-53) and Bobby Levy (HD-58) share the same surname. The oregonlegislature.gov house page assigns distinct filenames: `levye.jpg` for Emerson (Democratic, HD-53) and `levy.jpg` for Bobby (Republican, HD-58). Scraped directly from RepresentativesAll.aspx HTML; no derivation needed. Both imported successfully with correct photo assignments.

---

## PIL Spot-Check Results

**Lisa Reynolds** (sentinel, SD-17, external_id=-4110017, politician_id=d910cf6e-7d70-4b0c-b883-2fe2dcb185b6):
- PIL confirmed size: (600, 750) — PASS

**Shannon Isadore** (HD-33, external_id=-4120033, politician_id=2b9da845-9fab-406f-97c3-1afe895c254b):
- PIL confirmed size: (600, 750) — PASS
- Primary sentinel used (no fallback to Fahey needed)

---

## Combined Coverage

| Chamber | with_photo | without_photo | total |
|---|---|---|---|
| Oregon House of Representatives | 60 | 0 | 60 |
| Oregon Senate | 30 | 0 | 30 |

**Total: 90/90 legislators with photos.**

---

## SC-4 End-to-End Routing Query Result

Portland, OR address (-122.6794, 45.5231):

```
tier   | full_name       | geo_id | headshot_url
-------|-----------------|--------|--------------------------------------------------------------
SENATE | Lisa Reynolds   | 41017  | https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/d910cf6e-7d70-4b0c-b883-2fe2dcb185b6-headshot.jpg
HOUSE  | Shannon Isadore | 41033  | https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/2b9da845-9fab-406f-97c3-1afe895c254b-headshot.jpg
```

2 rows returned. Both headshot_url values are non-NULL. PASS.

---

## Zero type='headshot' Check

```sql
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id BETWEEN -4120060 AND -4110001
  AND pi.type = 'headshot';
```

Result: **0** — PASS. All 90 rows use type='default'.

---

## Audit Migration

Path: `C:/EV-Accounts/backend/migrations/228_or_legislature_headshots.sql`

File written 2026-05-29. This is an AUDIT-ONLY file documenting the writes performed in Tasks 1 and 2. It was NOT passed to mcp__supabase-local__apply_migration. The actual DB inserts were executed directly via mcp__supabase-local__execute_sql in this session.

---

## STATE.md Update Text

Drafted below — awaiting human checkpoint approval before applying:

```
- Phase 75 headshot coverage: 30/30 senators with photos, 60/60 house reps with photos; 0 documented gaps in 75-03-SUMMARY.md; oregonlegislature.gov MemberPhotos source; all 600x750 LANCZOS q90 upscale (per D-05/D-06)
```
