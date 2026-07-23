# Plan 197-01 Summary — Town of Sahuarita Structural Deep-Seed

**Status:** ✅ Complete — applied to production 2026-07-16
**Requirement:** SUB-03 (govt + roster half) · ROADMAP success criterion #1
**Migration:** `C:/EV-Accounts/backend/migrations/1354_town_of_sahuarita.sql` (committed `ea4ae2e8`, applied, ledger-registered)

## What was built

Greenfield **Town of Sahuarita, Arizona, US** government (`type='Town'`, `state='AZ'`, `city='Sahuarita'`, `geo_id='0462140'`) + one **Town Council** chamber (`official_count=7`) + exactly **ONE new shared `LOCAL`/`G4110`/`0462140` district** (`state='az'`, label `Town of Sahuarita (At-Large)`) + **7 at-large nonpartisan officials/offices** (`ext_id -4014001..-4014007`, `party=NULL`, `is_appointed=false`, `role_canonical=NULL`).

**Hybrid structural model (overrode CONTEXT D-02):** Mayor + Vice-Mayor are council-chosen **TITLE annotations** (Palm-Springs/Indio style), **NOT** a separate `LOCAL_EXEC` seat — Sahuarita has no separately-elected mayor (Town Code 2.10.010; site states *"One member is chosen as Mayor. One member is chosen as Vice Mayor"*). All 7 offices share the single LOCAL district row (Marana/Oro-Valley precedent, minus the LOCAL_EXEC half).

## Task 2 — BLOCKING roster + title re-verify (live, execute-time)

- **Verified against `sahuaritaaz.gov/274/Town-Council` + `/265/Election-Information` on 2026-07-16.** Live roster matched RESEARCH exactly; "Diane Priolo" spelling corroborated via the official Staff Directory (EID=325) — the WebFetch "Diana" was a parse artifact.
- **Primary date:** July 21, 2026 — **had NOT occurred** at apply time (applied July 16, pre-primary). General: Nov 3, 2026. 3 council seats up (Murphy, Egbert, Morales) + Prop 420 (General Plan ratification) on the July ballot.
- **Post-canvass Mayor/VM title re-vote (Town Code 2.10.010):** pending — occurs after certification.
- **Operator decision (approved):** Seed the current live-confirmed 7-member roster now (it represents residents today); **flag a post-July-21 reconcile** for the 3 contested seats (esp. Egbert's confirmed open seat) + the post-canvass Mayor/VM title re-vote. See phase follow-up note.

## 7-politician UUID manifest (for Plans 02 headshots + 03 stances)

| ext_id | UUID | Name | Title |
|--------|------|------|-------|
| -4014001 | `f32cba1e-d672-440a-9a18-41a312119f40` | Tom Murphy | Mayor |
| -4014002 | `071e2a28-2fef-489a-97e3-15fb5caaee51` | Kara Egbert | Vice Mayor |
| -4014003 | `c2553fba-f62f-4d58-8a9e-c183f9e8f15d` | Deborah Morales | Council Member |
| -4014004 | `9f846d00-9bcd-43cd-b57f-628d031d531c` | Steven Gillespie | Council Member |
| -4014005 | `b9ea3ef0-d4cf-4231-956d-376b6e626ae4` | Diane Priolo | Council Member |
| -4014006 | `866f1db3-4614-4d4f-a68b-96a2b7767091` | Kim Lisk | Council Member |
| -4014007 | `bbfcbd5f-ff32-40d4-af9f-f5c755869571` | Edgar Lytle | Council Member |

## Verification

- In-transaction post-verify DO gate (a)-(h) PASSED (RAISE NOTICE confirmed; no exception → COMMIT).
- Task 3 combined boolean assertion returned `t`: gov=1, 7 offices all on the one LOCAL/G4110/0462140 row, 0 non-LOCAL districts for 0462140, exactly 1 new LOCAL district, party NULL + is_appointed false on all 7, exactly 1 Mayor + 1 Vice Mayor.
- `schema_migrations` version `'1354'` registered.

## Follow-up flagged (post-July-21 2026)

After the July 21 primary is certified and the post-canvass organizational meeting holds its Mayor/VM re-vote, reconcile: Egbert's open seat (guaranteed new occupant), any change to Murphy's/Morales's seats, and re-confirm the Mayor/Vice-Mayor title holders (move the `title` annotations + update gate (e)/(f) expected ext_ids if changed).
