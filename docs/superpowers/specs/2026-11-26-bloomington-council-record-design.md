# Bloomington Common Council record — design

Date: 2026-11-26. Status: draft for Chris Andrews's approval. Design only: no database write, migration,
push or PR without his explicit yes.

## 1. What this is, and why

Essentials shows a "legislative record" for state and federal legislators: the bills they sponsored and how
they voted. City council members have nothing like it, except a separate Los Angeles section. This design gives
each **Bloomington, Indiana Common Council** member a record on their Essentials page, and sets the pattern
other cities (Saint Paul, Charlotte, and more) will follow.

There are two users of the record, and they must read the same thing:

- **Voters**, on a member's Essentials page.
- **Stance research** (the season topic-prep process), which uses council votes as evidence of where a member
  stands.

**The core rule: one source.** A vote shown to a voter and a vote used as stance evidence are the same database
row, with the same source document behind it.

## 2. Decisions made with the owner

| # | Question | Decision |
|---|---|---|
| D1 | Which votes a voter sees | Final votes **and** amendment votes, grouped under their ordinance, resolution or appropriation. Procedural motions (introduce, read by title, postpone, call the question, agenda order) and voice votes are left out. (Appointments: see D13.) |
| D2 | How far back | December 2020, where the trusted inventory starts. |
| D3 | Where the data lives | The **existing** state/federal tables (`essentials.legislative_sessions`, `legislative_bills`, `legislative_votes`), with small additions. Not a new set of city tables, not the On the Record meeting tables. |
| D4 | One store | The **database** is the one store of votes. The trusted inventory feeds the first load; later inventory runs read the database and check it instead of keeping their own copy of the votes. |
| D5 | What must be true before a member's vote is shown | **The minutes govern.** As soon as the city's vote list has an item, show its outcome and tally. A member's own vote, and every amendment vote, appears only once the approved minutes support it (printed, or worked out under D11). Where the vote list and minutes disagree, the minutes win and the difference is recorded. |
| D6 | Who reads the minutes | **A program**, weekly. A vote goes live only if it passes four checks (section 5.6). Failures go to Chris Andrews. If failures repeat with the same cause, the process is changed rather than each one fixed by hand. |
| D7 | Former members | The six former members (Sims, Sandberg, Volan, Smith, Sgambelluri, Rana) are added as people with dated past council terms, and all their votes are stored. |
| D8 | Bar for a new city | **For now, a new city needs a trusted inventory** (the Stage L gates) before its votes go live. Problems the trust process hits are logged city by city. The owner decides later — suggested review after the third city — whether to switch to a lighter bar (the four checks plus a one-time spot check of about 30 votes against the minutes). |
| D9 | Research judgments | Topic tags, item kind, record/lead status and deciding quotes **stay in the inventory files**. The files point at database rows and keep no copy of the votes. Public tables hold facts only. |
| D10 | Source documents | Keep a **private copy** of every minutes file and item text, with a fingerprint (SHA-256). Each vote points at the copy it was confirmed from. If the city's file changes, the weekly job notices and raises an exception. |
| D11 | Votes the minutes imply but do not print | **Allowed, under a strict rule.** The minutes print an attendance list and, per vote, only the smaller side's names (and who was out of the room). A majority vote is worked out from the minutes: attendance, minus anyone recorded leaving, arriving late or out of the room, minus the named members; the rest voted with the majority, and the count must equal the printed tally exactly. The vote is marked worked out. Any arrival or departure that cannot be placed relative to the item sends it to the exception list. |
| D12 | First-load votes the inventory does not hold (mostly 2020–2025 amendments) | **Go live on the four checks, after a spot check.** Before the first load, about 30 such votes, drawn at random, are checked by hand or by a second reader against the minutes. One failure stops the load until the reader is fixed. |
| D13 | Appointments | **Dropped from this build.** Nearly all are voice votes (33 of 34 in the last year) and the city's vote list does not carry them. Revisit if a city records them by name. |
| D14 | Which document confirms a vote | **The clerk's action memorandum**, posted within days of the meeting, confirms votes (it is the text the inventory read as "minutes"). When the formal Minutes for that meeting are posted (often months later), the weekly job re-reads them and compares; any difference is an exception, and the Minutes govern. Decided 2026-11-26. |

## 3. Goals, non-goals, anti-goals

**Goals**

- Every current and former Bloomington council member, December 2020 to now, has a record page with each final
  and amendment roll call held while they sat, their vote, the tally, the outcome, and a link to the source.
- New votes appear within about a week of the minutes being posted; outcomes appear within about a week of the
  city's vote list.
- Stance research reads the same rows voters see.
- A second city can be added by writing one new "reader" for its system; everything after the reader is shared.

**Non-goals (this build)**

- Saint Paul, Charlotte or any second city. The design leaves room; the build is Bloomington only.
- Sponsorship ("authored N ordinances"). The feed names sponsors only inside free-text synopses; not reliable
  enough for v1.
- Committee votes, voice votes, procedural motions, appointments (D13).
- Moving Los Angeles onto this model. (Possible later; see 5.9.)
- Topic tags or any research judgment on public pages.

**Anti-goals (a failure even if everything "works")**

- A voter sees a vote attached to a person that the minutes do not support. This is the failure most likely to
  cost trust. Every rule below that delays a vote exists to prevent it.
- Two copies of the record drift apart (one for voters, one for research).
- Party shown anywhere (Empowered Vote is antipartisan).
- Research tags reachable by the public or by Stage 2 drafters.

## 4. What exists today (summary)

**State and federal record.** Tables in the `essentials` schema, public read through RLS, writes by service role
only. Their CREATE statements are not in either repo (created outside it); the columns are documented in the
header of `backend/src/lib/essentialsLegislativeService.ts`.

- `legislative_sessions` (`jurisdiction` is free text: `'indiana'`, `'federal'`), `legislative_bills` (unique on
  `(external_id, jurisdiction)`), `legislative_bill_cosponsors`, `legislative_votes` (one row per person per roll
  call; unique on `(politician_id, bill_id, session_id, external_vote_id)`; `bill_id` may be null; `position` is
  `yea / nay / not_voting / absent / present`; provenance is only a `source` tag). About 10.1M vote rows.
- `legislative_politician_id_map` already allows `id_type = 'onboard'` (CA_0401/CA_0402); nothing writes it yet.
- Loaders: LegiScan for states, govinfo + LegiScan for federal, in the Render cron `ev-jobs-legiscan`, Sundays
  14:00 UTC (`member-ids → legiscan → federal-bills → federal-votes`).
- API: `/api/essentials/politicians/:id/legislative`, `/bills`, `/votes` (cap 100, no pagination),
  `/legislative-summary`.
- Page: Essentials `/politician/:id/record` (`src/pages/LegislativeRecord.jsx`) renders ev-ui
  `LegislativeRecord`; the profile shows ev-ui `LegislativeInlineSummary`.
- Stance research reads `legislative_votes` directly for **federal** votes (`backend/scripts/lib/federalTableRead.ts`).

**Other city vote data.** Los Angeles has its own table (`meetings.la_council_votes`) and its own Essentials
section. Bloomington has On the Record rows (`meetings.agenda_items`, `meetings.vote_records`) built from meeting
transcripts. Neither is the record this design builds; the inventory treats transcripts as a cross-check only.

**The Bloomington inventory** (`~/Documents/GitHub/.planning/research/local-inventory/bloomington-in/`, local,
never pushed, trusted 2026-11-25 under codebook 1.4). `deep.json` (2020-11-24 to 2025-11-23, 425 items) and
`full.json` (2025-11-24 to 2026-11-23, 348 items); no overlap. Members by surname only. Many Yes votes are
**worked out** (`derived: true`) from the feed's No/absent names — 330 of the 425 deep items took their names
from the feed, not the minutes. `roster.json` dates each seat. Saved texts in `store-staging/` (374 item texts,
57 minutes). Rules: `LOCAL.md` on branch `feat/local-inventory` in ev-accounts.

**The city's sources.**

- Legislation feed: `https://bloomington.in.gov/onboard/committees/1/legislation?year=<yyyy>;format=json`. One
  record per item: `id`, `type`, `number`, `status`, `title`, `synopsis`, `files`, and **one** action ("Final")
  with a vote string such as `"5 - 2 (Flaherty, Ruff) - 0 (Rosenbarger, Zulich absent)"`. No amendments, no
  procedural motions, no Yes names. Known errors: it gave Ord 2025-19's Amendment 5 (5-4) as the final vote
  (minutes: 8-1); it gave Res 2026-09 as 8-0 (minutes: 9-0).
- Meetings feed: `https://bloomington.in.gov/onboard/committees/1/meetings?year=<yyyy>;format=json`. Meetings by
  date, each with files grouped by type (`Packet`, `Memorandum`, `Minutes`, `Agenda`, …) and download URLs.
  Minutes are posted weeks after the meeting, once approved.
- What the minutes print: an attendance list at the top ("Dave Rollo (absent)"), then per roll call the tally and
  only the smaller side's names, e.g. "Ayes: 1 (Ruff), Nays: 6, Abstain: 0. FAILED" or "Ayes: 5, Nays: 2 (Daily,
  Stosberg)", plus notes such as "(Volan out of the room)" or "(arrived 6:31pm)". So most Yes votes are worked out
  even from the minutes (D11).
- The council's legislation pages (`https://bloomington.in.gov/council/legislation/<Type>/<year>/<number>`) show
  the same data as the legislation feed, as readable pages. They add no data; they are the voter-facing link for
  each item.

**Officeholders we hold.** All nine current members, with photos: Asare, Daily, Flaherty, Piedmont-Smith, Rollo,
Rosenbarger, Ruff, Stosberg, Zulich. None of the six former members is held as a Bloomington council member.

## 5. Design

### 5.1 What a voter sees

On the member's record page (`/politician/:id/record`), a council member gets a **Council votes** section
instead of the state layout's "Sponsored legislation":

```
Council votes                                    [Year ▾]

Ord <number>  <title>                                   <meeting date>
  Final passage ........ <vote>   <Passed|Failed> <yes>-<no>
  Amendment <n> ........ <vote>   <Passed|Failed> <yes>-<no>
  Amendment <n> ........ <vote>   <Passed|Failed> <yes>-<no>
  Source: approved minutes, <meeting date> ↗

Res <number>  <title>                                   <meeting date>
  <Passed|Failed> <yes>-<no> (city vote list). How each member voted
  will appear when the minutes are approved.

(Placeholders only. The page shows live data.)
```

- One block per item, newest first; amendment rows under the final row, in the order taken.
- The Year filter uses the **date of the vote**, not the year in the item's number (Ord 17-09, voted on in 2021,
  shows under 2021). *My call.* The API must return vote dates for grouping; the session year is not used for it.
- A worked-out vote looks the same as a printed one to voters; the difference is kept in the database and shown
  in the source detail ("worked out from the attendance list and tally in the minutes"). *My call; the minutes
  support both equally under D11.*
- Each row: question (Final passage / Amendment N), the member's vote, the outcome and tally **from the
  minutes**.
- Vote words: Yes, No, Abstain, Absent. (Stored as the existing `position` values; see 5.2.)
- Pending items show only the outcome and counts, never names (the feed's vote string names No and absent
  members, and those are not yet confirmed).
- The member's seat on the vote date is shown where it differs from today's ("as District I").
- Links: the item's council legislation page, and the city's minutes file. Attribution line: "From the approved minutes of the Bloomington Common
  Council."
- The profile's short summary (`LegislativeInlineSummary`) works as it does for state legislators.

### 5.2 How city data maps onto the existing tables

| Existing table | Bloomington use |
|---|---|
| `legislative_sessions` | One per calendar year. `jurisdiction = 'place:1805860'` (Census place code, the inventory's city scope; *builder's call on the exact string, but it must be unique to the city and never a state name*). `source = 'onboard'`. |
| `legislative_bills` | One per ordinance, resolution or appropriation ordinance. `number` as printed ("Ord 2026-37", "Res 2026-09", "App Ord 2026-02"). `external_id = 'onboard-<feed id>'`. `title`, `summary` (= feed synopsis), `url` (the council legislation page, `/council/legislation/<Type>/<year>/<number>`), `status_label` (Adopted, Vetoed, Failed…). Session = the year in the item's number (Ord 17-09, voted on in 2021, sits in 2017's session; votes carry their own dates). |
| `legislative_votes` | One row per member per **confirmed** roll call. `vote_question` = "Final passage", "Amendment 5" or "Veto override". `external_vote_id` deterministic from city, meeting date, item and question, e.g. `bloomington-2025-12-17-ord-2025-19-am5`. `source = 'onboard-minutes'`. `result`, `yea_count`, `nay_count` from the minutes. |

**Additions** (one migration each, Chris Andrews's `CA_` namespace, slot from the steward allocator):

1. **`essentials.legislative_roll_calls`** — new table, one row per roll call (city only for now): city scope,
   bill id, meeting date, question, outcome, yes/no/abstain/absent counts, **state** (`pending_minutes` |
   `confirmed`), the minutes copy it was confirmed from, and a note when the minutes and the vote list
   disagreed. This is what lets the page show "Passed 7-0, details when minutes are approved" with no person
   attached, and where the "minutes win" difference is recorded. *My call: a pending outcome has no member rows,
   so it needs a home that is not `legislative_votes`.* Public read (facts only; it names nobody).
2. **`essentials.source_documents`** — new table, one row per saved copy: city scope, kind (`minutes`,
   `item_text`), city URL, fetched at, SHA-256 of the file, storage path, superseded by. **Service role only**,
   no public read (D10). Files go in a private storage bucket (builder's call on which).
3. **Columns on `legislative_votes`**, all nullable, so existing state and federal rows are untouched and the
   change is metadata-only on the 10M-row table:
   - `roll_call_id` → `legislative_roll_calls` (null for state/federal),
   - `name_as_printed` (the name exactly as the minutes print it, from the vote line or, for a worked-out vote,
     from the attendance list, e.g. "Isak Nti Asare"),
   - `worked_out` (true when the member is not named on the vote line, D11),
   - `confirmed_from` → `source_documents` (the minutes copy).

**Refinement of D5 (my call, flagged):** unconfirmed per-member votes are **never written** to
`legislative_votes`. The table is publicly readable, so a hidden row is still a published row. A city vote row
exists only once the minutes support it; `confirmed_from` records which copy. Votes the inventory worked out
from the city's vote list wait in the inventory files until the minutes reader confirms them.

### 5.3 Saved copies and fingerprints

- Every minutes file the reader uses, and every item text the inventory relied on, is copied to private storage
  with its SHA-256 and a row in `source_documents`.
- Each week the job re-fetches the city files behind confirmed votes from the last 90 days (*builder's call on
  the window*) and compares fingerprints. A changed file raises an exception; nothing is changed automatically.
  If the corrected minutes change a vote, the fix goes through the exception path.
- The 57 minutes and 374 item texts in `store-staging/` are uploaded in the first load, so they no longer live
  only on one laptop.

### 5.4 People, names and seats

- **Six former members** added as politicians, each with a dated, sourced `office_terms` row on the right
  Bloomington council office (source: the city's OnBoard seat pages, already saved under
  `store-staging/jurisdictions/`). Follow `backend/migrations/CLAUDE.md` "Writing": seat through
  `seat_officeholder`, never `is_incumbent`, never cache "current". Known spans from `roster.json`: Sims,
  Sandberg, Rosenbarger (District I), Sgambelluri, Volan, Smith to 2023-12-31; Rana District V 2024-01-02 to
  2024-02-07; District V vacant 2024-02-08 to 2024-03-26. **Current members get their earlier terms too**
  (e.g. Rosenbarger, District I 2020–2023; Piedmont-Smith, Flaherty, Rollo from 2020), or check 2 fails for
  their older votes. *My call.* Former members get a basic page: name, "Former member,
  <seat>, <years>", the record. Photo only if a free-to-use one is found (`find-headshots` rules; set
  `photo_custom_url` as well as `politician_images`).
- **IDs:** each member gets a `legislative_politician_id_map` row, `id_type = 'onboard'`, value = the person's
  OnBoard id (*builder: confirm OnBoard exposes a person id; if only seat ids exist, use the person page id*).
- **Name variants:** a reviewed per-city file in the repo, e.g. `backend/data/local-record/bloomington-in/names.json`,
  mapping every printed form ("Asare", "Asari", "Isak Nti Asare", "Councilmember Asare") to one politician id.
  An unknown name is never guessed; it fails check 2.
- **Seat on the vote date:** read from `office_terms` by date, not stored on the vote.

### 5.5 Readers (the per-city part)

A reader turns a city's own system into **candidate roll calls**, a shape shared by all cities:

```
{ city, item_number, item_feed_id?, question, meeting_date,
  printed_tally: {yes, no, abstain, absent},
  members: [{ name_as_printed, vote }],      // empty for a vote-list-only outcome
  source: { kind: 'minutes' | 'vote_list', url, document_id? } }
```

Everything after the reader is shared: the checks, the writes, the exceptions, the page.

**Bloomington reader** (OnBoard):

- Reads the legislation feed for the current and previous year → bill rows and `pending_minutes` roll calls
  (final outcome and counts only; names discarded).
- Reads the meetings feed → new `Minutes` files → saves a copy → extracts text (PDF to text) → reads the
  attendance list, every arrival/departure/out-of-room note with its position in the meeting, and each roll call
  on a non-procedural item with its printed tally and named members → works out the majority side (D11).
- The 57 saved minutes plus the inventory's 773 items are its test set: the reader must reproduce the
  inventory's printed (not worked-out) votes on those meetings.

### 5.6 The four checks (shared)

A candidate roll call from minutes goes live only if all apply:

1. **Tally closes.** Present at the vote = attendance list, adjusted by every arrival, departure and
   out-of-room note placed before the vote. The named members match the printed count for their side, and
   present minus named equals the printed count for the other side, exactly. Yes + No + Abstain + not present
   equals the number of members seated that day. A note the reader cannot place relative to the vote fails
   this check.
2. **On the council that day.** Every printed name resolves, through the name file, to exactly one person with a
   council term covering the meeting date.
3. **Agrees with the vote list.** For a final vote, the outcome (passed / failed / vetoed) matches the feed. **Counts
   that differ while the outcome agrees** do not block: the minutes win, and the difference is noted on the roll
   call (Res 2026-09, 8-0 vs 9-0). An **outcome** that contradicts the feed, or a final vote the feed does not
   have, is an exception. Amendments have no feed counterpart; this check does not apply to them.
4. **Known item.** The item number matches a bill row; an amendment must attach to a known item.

A positive control runs each week *(my call)*: the reader re-reads one already-confirmed minutes file, chosen at
random, and must reproduce it exactly. If it does not, the run writes nothing and raises an exception — a reader
that has silently broken must not keep publishing.

### 5.7 Exceptions

- Stored in a private table (service role only): city, candidate, which check failed, a **cause code** (e.g.
  `unknown_name`, `tally_mismatch`, `outcome_conflict`, `file_changed`, `unparsed_roll_call`), details, status,
  who resolved it and how.
- Each run ends with a summary: new votes confirmed, pending outcomes, exceptions by cause, this week and the last
  eight weeks. A cause that keeps appearing is the signal to change the process (D6).
- Resolving an exception: fix the input (add a name variant, correct a reader rule) and let the next run pick it
  up; a one-off manual decision is recorded with who made it and why.

### 5.8 First load

1. Add the six former members, IDs and name file (5.4).
2. Upload the saved texts (5.3).
3. Load bills and pending outcomes from the feed, 2020 to now.
4. Run the minutes reader over **every** council meeting's minutes from 2020-12 to now (not just the 57 saved):
   most 2020–2025 names in the inventory were worked out from the feed, so the minutes must be read to confirm
   them.
5. Compare the reader's output with the trusted inventory, item by item and person by person. **Agreement →
   goes live. Any difference → exception**, never silently resolved either way. The comparison is meaningful
   even where both sides worked a vote out: for 2020–2025 the inventory worked its votes out from the city's
   vote list, the reader from the minutes — two different documents.
   **Votes the inventory does not hold** (mostly 2020–2025 amendments; the inventory has about 35 there) go live
   on the four checks after the D12 spot check: about 30 drawn at random, checked against the minutes by hand or
   a second reader; one failure stops the load until the reader is fixed. The inventory is the check on
   the reader; the reader's confirmed rows become the record. *(My refinement of D4: the inventory "feeds" the
   first load as its acceptance test, because most of its Yes votes are worked out and may not be shown until
   the minutes confirm them.)*
6. Report to the owner: rows live, rows pending, exceptions by cause. Bloomington goes live on the page only with
   the owner's yes.

### 5.9 Weekly run

Added to the existing Sunday chain after `federal-votes` (the chain is configured in ev-infra `render.yaml`;
a change there is a PR to ev-infra). It runs only for cities marked **enabled**; a city is enabled only with a
passing, current inventory trust file (D8). The enabled list is a reviewed repo file naming each city and its
trust hash *(my call)*.

### 5.10 Stance research reads the same rows

- Inventory items and votes carry the database ids (`legislative_bills.id`, `external_vote_id`) once loaded.
- The local census (`npm run local:census`) reads votes from `legislative_votes` (the way
  `federalTableRead.ts` does for federal), joined to the inventory's tags by id. A vote used as evidence is the
  database row; its source is `confirmed_from`.
- `confirmations.json` is no longer needed for loaded cities: a vote is in the table only when the minutes
  confirm it.
- **Rule change (owner-approved, D4):** `LOCAL.md` says Stage L "writes nothing to the database". The new rule:
  Stage L still writes nothing itself; the record job writes the votes; Stage L's next run harvests from the
  database and checks it with the same gates. This edit to `LOCAL.md` and the census code is part of the build.
- The drafters' forbidden list is unchanged. The public record names votes and members — drafters already must
  not read the inventory; the design does not change what they can see.

### 5.11 Other cities later

- Saint Paul and Charlotte run on Legistar, whose public API (`webapi.legistar.com/v1/<client>/…`) names each
  member's vote, amendments included. One Legistar reader would cover both and many more.
- Each city still needs a trusted inventory before it is enabled (D8). The trust problems hit per city are
  logged in one running file so the owner can judge the switch to the lighter bar.
- Los Angeles could later move onto this model; out of scope here.

### 5.12 Access and security

- Migrations follow `backend/migrations/CLAUDE.md`: allocator slot in `CA_`; one migration per file;
  idempotent; the file that creates a table also grants privileges to only the roles that need them, enables
  RLS and creates its policies; no bulk grants.
- `legislative_roll_calls`: public read. `source_documents` and the exceptions table: no anon/authenticated
  access.
- No party anywhere.

## 6. Approaches considered

| Approach | Trade-off | Outcome |
|---|---|---|
| **Reuse the state/federal tables** (chosen) | Reuses the page, API and year filter; one table for voters and research; federal research already reads it. Needs person rows for former members and care on a 10M-row table. | Chosen (D3). |
| New city tables built for any city | Cleanest fit for city items; LA could join. A second page, API and research reader; breaks "one source" across levels. | Rejected. |
| Build on On the Record vote rows | Already hold Bloomington votes. Built from transcripts (a check, not the record); shaped like agendas, not bills. | Rejected. |

## 7. Constraints

- No database write, migration, push or PR without the owner's explicit yes. The first load and going live are
  separate yeses.
- ev-accounts: allocator-numbered migrations, RLS in the same file, occupancy rules for seating people, dry-run
  with the existing `backend/scripts/dry-run-migration.mjs`.
- Essentials: build on live data through `src/lib/api.jsx`; use ev-ui components (the record component change is
  made in ev-ui and released with a version bump); update the `e2e/` journey if a journey changes.
- Render settings change only through ev-infra.
- The inventory is frozen while trusted; its pending rulings (`rulings-after-trust.md`) apply at its next run.

## 8. Left to the builder

- Exact `jurisdiction` string, `external_vote_id` format, column names and types.
- Which private storage bucket; the fingerprint re-check window.
- The PDF-to-text tool and the minutes parsing rules.
- API changes: pagination for `/votes` (the current cap of 100 is too low for six years), returning roll-call
  grouping and pending outcomes, and how the ev-ui component switches to the council layout.
- How the run summary reaches the owner (log, admin page or message), as long as it shows causes over eight weeks.

## 9. Risks

- **Minutes layout drift** over six years may defeat a simple parser. Mitigation: the test set (5.5), the weekly
  positive control (5.6), and the exception count by cause (5.7).
- **Most 2020–2025 votes are not yet confirmed** by minutes. The first load may surface many exceptions; that is
  the point of step 5 in 5.8.
- **The 10M-row table.** Adding nullable columns is quick; any index on them must be built concurrently.
- **City corrects minutes after publication.** Caught by fingerprints; handled as an exception.
