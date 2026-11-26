# Bloomington Common Council Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every current and former Bloomington Common Council member (Dec 2020 → now) a voting record on
Essentials, stored in the existing `essentials.legislative_*` tables, kept current weekly from the city's minutes,
and read by stance research from the same rows.

**Architecture:** A per-city *reader* turns the city's system (OnBoard legislation feed + approved minutes PDFs)
into candidate roll calls. Shared code works out the majority side, runs the four checks, writes confirmed votes
to `legislative_votes` (plus a new `legislative_roll_calls` table for outcomes and pending items), and logs
failures as exceptions. A first-load script compares the reader with the trusted inventory before anything goes
live. A new API endpoint and ev-ui component show the record; the local census reads the same rows.

**Tech Stack:** ev-accounts backend (TypeScript, Express, `pg`, vitest, `pdfjs-dist` via `src/lib/pdfText.ts`,
Supabase Storage via `supabaseAdmin`), Postgres migrations (`CA_` namespace), ev-ui (React, vitest, tsup),
Essentials (React/Vite, Playwright e2e), ev-infra (`render.yaml`).

**Spec:** `docs/superpowers/specs/2026-11-26-bloomington-council-record-design.md` (this Essentials worktree).
Decisions are cited as D1–D13.

## Global Constraints

- 🔴 **No database write, migration apply, migration-slot reservation, storage upload, push or PR without Chris
  Andrews's explicit yes**, asked per action. Dry-runs against production count as writes for this rule
  (`dry-run-migration.mjs` once committed while printing "ROLLED BACK"). Each task ends at a local commit.
- Repos and where work happens: backend in a worktree of ev-accounts at
  `~/Documents/GitHub/_worktrees/ev-accounts/council-record/` cut from `origin/master`; ev-ui in
  `~/Documents/GitHub/_worktrees/ev-ui/council-record/` from `origin/main`; Essentials in this worktree;
  ev-infra in `~/Documents/GitHub/_worktrees/ev-infra/council-record/`. Never create worktrees elsewhere.
- Git identity `chrisandrewsedu`. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  Check staged changes for secrets before each commit.
- Migrations: file `CA_NNNN_<snake>.sql`, number from `npm run steward --prefix backend -- slot CA --purpose "…"`
  (after the yes), one migration per file, idempotent, and the file creating a table also grants per role,
  enables RLS and creates its policies. No bulk grants. Read `backend/migrations/CLAUDE.md` before Task 1 and
  Task 9.
- City scope string: `place:1805860`. Session/bill `jurisdiction` = `place:1805860`; `source` values:
  `onboard` (sessions, bills), `onboard-minutes` (votes).
- `position` values written: `yea`, `nay`, `present` (= abstain), `absent` (absent at roll), `not_voting`
  (left, out of the room, or not yet arrived).
- Votes in scope (D1): final passage, amendments, veto overrides of ordinances, resolutions and appropriation
  ordinances. Never procedural motions, voice votes, or appointments (D13).
- A per-member vote row is written **only** when confirmed from minutes (spec 5.2 refinement). Pending items live
  only in `legislative_roll_calls` with counts and no names.
- No party anywhere. No invented names, numbers or dates in components or tests; test fixtures are verbatim
  city text.
- Time window: meetings on or after 2020-12-01 (D2).

## Review Focus

1. **A member who leaves mid-meeting** ("Rosenbarger left at 10:40pm"): later roll calls count them `not_voting`;
   a departure the parser cannot place relative to a roll call sends that roll call to exceptions (`unplaced_note`).
   → Task 5 test `departure before vote excludes member`, Task 6 test `unplaced departure fails`.
2. **A note inside a tally that is not a list of voters**: "Ayes: 8 (Sims out of the room), Nays: 0" must read
   Sims as out of the room, not as the named Yes side. → Task 5 test `out-of-room parenthetical is not a name list`.
3. **Two-column minutes (2020–2022)**: margin notes such as "Vote to adopt Amendment 02 to Ordinance 21-23
   [10:38pm]" share text lines with the body; the parser must not merge them into the roll-call sentence.
   → Task 5 test `margin column does not corrupt roll call` (fixture `2021-05-05.txt`).
4. **The city re-uploads corrected minutes** (new file id, same meeting): no duplicate rows; the old copy is
   marked superseded; any changed vote is an exception, not an overwrite. → Task 8 test `replaced minutes raise
   file_changed and write nothing`.
5. **A minutes roll call for an item the feed lacks, or a feed final with no minutes roll call after the minutes
   posted** (e.g. Res 2026-12, which has no feed file): neither is guessed. → Task 6 test `unknown item fails`,
   Task 8 test `feed final missing from posted minutes raises feed_missing_final`.

---

## File map (ev-accounts unless noted)

| File | Responsibility |
|---|---|
| `backend/migrations/CA_aaaa_legislative_roll_calls.sql` | new table + RLS (Task 1) |
| `backend/migrations/CA_bbbb_local_record_source_documents.sql` | new private table (Task 1) |
| `backend/migrations/CA_cccc_local_record_exceptions.sql` | new private table (Task 1) |
| `backend/migrations/CA_dddd_legislative_votes_city_columns.sql` | three nullable columns (Task 1) |
| `backend/migrations/CA_eeee_bloomington_council_people_and_terms.sql` | six former members, earlier terms, onboard ids (Task 9) |
| `backend/src/lib/localRecord/types.ts` | shared types (Task 2) |
| `backend/src/lib/localRecord/names.ts` | name normalising + resolving by date (Task 3) |
| `backend/src/lib/localRecord/onboard/feed.ts` | legislation + meetings feed readers (Task 4) |
| `backend/src/lib/localRecord/onboard/minutes.ts` | minutes text → attendance, notes, roll calls (Task 5) |
| `backend/src/lib/localRecord/checks.ts` | majority work-out + four checks (Task 6) |
| `backend/src/lib/localRecord/store.ts` | saved copies + fingerprints (Task 7) |
| `backend/src/lib/localRecord/write.ts` | DB writes in one transaction (Task 7) |
| `backend/src/lib/localRecord/refresh.ts` | weekly run, control, summary (Task 8) |
| `backend/data/local-record/cities.json` | enabled cities (Task 8) |
| `backend/data/local-record/bloomington-in/names.json` | name variants → politician ids (Task 9) |
| `backend/scripts/local-record/first-load.ts` | first load: compare with inventory, spot check (Task 10) |
| `backend/scripts/local-record/report.ts` | exceptions by cause, 8 weeks (Task 8) |
| `backend/src/lib/essentialsLegislativeService.ts`, `backend/src/routes/essentialsPoliticians.ts` | council-record endpoint (Task 11) |
| ev-ui `src/CouncilVoteRecord.jsx` | grouped council layout (Task 12) |
| Essentials `src/pages/LegislativeRecord.jsx`, `src/lib/api.jsx`, `src/components/CouncilRecordAttribution.jsx` | page wiring (Task 13) |
| feat/local-inventory `backend/scripts/local-inventory/census.ts`, `LOCAL.md` | census reads DB (Task 14) |
| ev-infra `render.yaml` | add step to Sunday chain (Task 15) |

---

### Task 1: Schema migrations (written, not applied)

**Files:**
- Create: the four `CA_…` migration files above (numbers from the allocator, after the yes).
- Test: `backend/tests/architecture/localRecordMigrations.test.ts`

**Interfaces:**
- Produces tables/columns used by Tasks 7, 8, 10, 11:
  - `essentials.legislative_roll_calls(id uuid pk default gen_random_uuid(), city_scope text not null,
    bill_id uuid not null references essentials.legislative_bills(id), external_vote_id text not null,
    meeting_date date not null, question text not null, question_order int not null,
    outcome text not null check (outcome in ('passed','failed','vetoed')), yes_count int, no_count int,
    abstain_count int, not_present_count int, state text not null check (state in ('pending_minutes','confirmed')),
    confirmed_from uuid null references essentials.local_record_source_documents(id),
    feed_disagreement text null, created_at timestamptz default now(), updated_at timestamptz default now(),
    unique (city_scope, external_vote_id))`. Grants: `select` to `anon, authenticated`; all to `service_role`;
    RLS on; policy `public read` for select.
  - `essentials.local_record_source_documents(id uuid pk, city_scope text, kind text check (kind in
    ('minutes','item_text')), source_url text not null, city_file_id text, fetched_at timestamptz not null,
    sha256 text not null, storage_path text not null, superseded_by uuid null references same(id),
    unique (source_url, sha256))`. Grants to `service_role` only; RLS on; no anon/authenticated policy.
  - `essentials.local_record_exceptions(id uuid pk, city_scope text, run_id text not null, cause text not null
    check (cause in ('unknown_name','not_seated','tally_mismatch','unplaced_note','outcome_conflict',
    'unknown_item','feed_missing_final','file_changed','control_failed','unparsed_roll_call','inventory_disagrees',
    'spot_check_failed')), subject text not null, detail jsonb not null, status text not null default 'open'
    check (status in ('open','resolved')), resolved_by text, resolution text, created_at timestamptz default now(),
    unique (city_scope, cause, subject))`. `service_role` only; RLS on.
  - `essentials.legislative_votes` add nullable `roll_call_id uuid references essentials.legislative_roll_calls(id)`,
    `name_as_printed text`, `worked_out boolean`, `confirmed_from uuid references
    essentials.local_record_source_documents(id)`. `ADD COLUMN IF NOT EXISTS`, no defaults (metadata-only on the
    10M-row table). Any index: `CREATE INDEX CONCURRENTLY` in its own file, not inside a transaction.

- [ ] **Step 1:** Ask Chris for a yes to reserve four `CA` slots; reserve them; name the files.
- [ ] **Step 2: Write the failing test** — reads each new file and asserts: contains `ENABLE ROW LEVEL SECURITY`
  for each created table; contains no `grant .* on all tables`; the two private tables have no grant to `anon` or
  `authenticated`; the columns file uses `ADD COLUMN IF NOT EXISTS` and no `DEFAULT`.
- [ ] **Step 3:** Run `npm run test --prefix backend -- localRecordMigrations` → FAIL (files empty).
- [ ] **Step 4:** Write the four files (create order: source_documents before roll_calls).
- [ ] **Step 5:** Run the test → PASS. Run `npm run check:migrations --prefix backend` and
  `npm run check:rls-coverage --prefix backend` → clean.
- [ ] **Step 6:** Commit. **Do not apply.** Applying (dry-run, then apply with `apply-migration-file.mjs`) is a
  separate yes, asked when Task 10 is ready.

### Task 2: Shared types

**Files:** Create `backend/src/lib/localRecord/types.ts` (types only, no test of its own; exercised by Tasks 3–8).

**Interfaces — Produces:**

```ts
export type CityScope = string;                       // 'place:1805860'
export type Side = 'yes' | 'no' | 'abstain';
export type Position = 'yea' | 'nay' | 'present' | 'absent' | 'not_voting';
export interface PrintedTally { yes: number; no: number; abstain: number }
export interface AttendanceEntry { nameAsPrinted: string; absent: boolean }
export type MeetingNote =
  | { kind: 'arrived' | 'left' | 'out_of_room' | 'returned'; nameAsPrinted: string; at: number | null };
                                                       // at = event index the note is placed before; null = unplaceable
export interface MinutesRollCall {
  index: number;                                       // position among events in the document
  itemNumber: string;                                  // normalised, e.g. 'App Ord 2026-02', 'Ord 21-23', 'Res 2026-09'
  question: string;                                    // 'Final passage' | 'Amendment 03' | 'Veto override'
  tally: PrintedTally;
  named: { side: Side; names: string[] }[];            // only sides whose names the minutes print
  inlineNotes: MeetingNote[];                          // e.g. '(Volan out of the room)' — at = this index
  outcome: 'passed' | 'failed';
  sentence: string;                                    // verbatim sentence, for exceptions and audit
}
export interface MinutesParse { meetingDate: string; attendance: AttendanceEntry[]; notes: MeetingNote[];
  rollCalls: MinutesRollCall[]; unparsed: string[] }   // unparsed = roll-call-looking sentences not understood
export interface FeedItem { feedId: number; type: 'Ordinance' | 'Resolution' | 'Appropriation Ordinance';
  number: string; itemNumber: string; title: string; synopsis: string | null; status: string;
  final: { date: string; outcome: 'passed' | 'failed' | 'vetoed'; tally: PrintedTally } | null; pageUrl: string }
export interface ResolvedVote { politicianId: string; nameAsPrinted: string; position: Position; workedOut: boolean }
export type ExceptionCause = /* the 12 values in Task 1, as a string union */;
export type CheckResult =
  | { ok: true; votes: ResolvedVote[]; feedDisagreement: string | null }
  | { ok: false; cause: ExceptionCause; detail: string };
```

- [ ] **Step 1:** Write the file; `npm run typecheck --prefix backend` → clean.
- [ ] **Step 2:** Commit.

### Task 3: Name resolving by date

**Files:** Create `backend/src/lib/localRecord/names.ts`, test `names.test.ts`.

**Interfaces:**
- Consumes: none.
- Produces:
  - `interface NameFile { city: CityScope; members: { politicianId: string; onboardId: string | null; variants: string[] }[] }`
  - `interface TermSpan { politicianId: string; start: string; end: string | null }` (ISO dates; from `office_terms`)
  - `normaliseName(s: string): string` — lower-case; strip titles `councilmember|council member|council president|
    vice president|president`; strip `*` (remote marker), punctuation except hyphen; collapse spaces; fold accents
    in code (no `unaccent` on prod).
  - `resolveName(printed: string, date: string, names: NameFile, terms: TermSpan[]): { politicianId: string } | { error: 'unknown_name' | 'not_seated' | 'ambiguous'; detail: string }`
    — match normalised printed form against normalised variants, then require exactly one matched person with a
    term containing `date`. Never fuzzy-match.

- [ ] **Step 1: Failing tests** in `names.test.ts`:
  - `normaliseName('Isak Nti Asare*') === 'isak nti asare'`; `normaliseName('Councilmember Piedmont-Smith') === 'piedmont-smith'`.
  - a variant listed for person P resolves on a date inside P's term; the same name on a date outside every
    term → `{ error: 'not_seated' }`; an unlisted name → `{ error: 'unknown_name' }`; a surname listed for two
    people both seated that day → `{ error: 'ambiguous' }`. (Fixture ids `'p-1'`, `'p-2'`; names are the real
    roster names from `roster.json`.)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. **Step 5:** Commit.

### Task 4: OnBoard feed readers

**Files:** Create `backend/src/lib/localRecord/onboard/feed.ts`, test `feed.test.ts`, fixtures
`backend/src/lib/localRecord/onboard/__fixtures__/legislation-2026.json` and `meetings-2026.json` (verbatim
downloads of the two feed URLs, date fetched in a sibling `README.md`).

**Interfaces:**
- Produces:
  - `parseFeedTally(vote: string): PrintedTally | null` — reads only the counts; names are discarded.
  - `parseLegislationFeed(json: unknown, base: string): FeedItem[]` — `itemNumber` = `Ord <n>` / `Res <n>` /
    `App Ord <n>`; `pageUrl` = `${base}/council/legislation/${encodeURIComponent(type)}/${year}/${number}`;
    `final` from the action named `Final` (`outcome` `pass`→`passed`, `fail`→`failed`; status `Vetoed` →
    `vetoed`).
  - `listMinutesFiles(json: unknown): { meetingId: number; meetingDate: string; fileId: number; url: string; updated: string }[]`
    — only files of type `Minutes`, only meetings whose title contains `Common Council` and `Session`.
  - `fetchJson(url: string): Promise<unknown>` — sends a browser User-Agent and `Accept-Encoding: gzip`; no
    personal data in headers.

- [ ] **Step 1: Failing tests:**
  - `parseFeedTally('5 - 2 (Flaherty, Ruff) - 0 (Rosenbarger, Zulich absent)')` → `{yes:5,no:2,abstain:0}`;
    `'7-0-0 (Rosenbarger, Zulich absent)'` → `{7,0,0}`; `'6-1 (Asare) (Flaherty, Rosenbarger absent)'` → `{6,1,0}`;
    `'9-0'` → `{9,0,0}`; `'7-0 (Rosenbarger left at 10:40pm, Zulich absent)'` → `{7,0,0}`; `'pending'` → `null`.
  - `parseLegislationFeed(fixture)` returns 54 items; the item with `feedId 6435` has `itemNumber 'Ord 2026-37'`,
    `final.date '2026-11-04'`, `final.tally {7,0,0}`, `pageUrl` ending `/Ordinance/2026/2026-37`.
  - `listMinutesFiles(meetingsFixture)` returns only `Minutes` files, each with an `https://` download URL.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit.

### Task 5: Minutes parser

**Files:** Create `backend/src/lib/localRecord/onboard/minutes.ts`, test `minutes.test.ts`, fixtures: copy
verbatim from the inventory's `store-staging/minutes/` the files `2026-10-07.txt`, `2021-05-05.txt`,
`2021-04-07.txt`, `2021-05-19.txt`, `2022-05-04.txt` into `onboard/__fixtures__/minutes/`.

**Interfaces:**
- Consumes: Task 2 types.
- Produces: `parseMinutes(text: string, meetingDate: string): MinutesParse` and
  `minutesTextFromPdf(bytes: Uint8Array): Promise<string>` (wraps `extractPdfText` from `src/lib/pdfText.ts`;
  if columns interleave, use `extractPdfItems` and keep only items left of the page's body/margin gutter).

Rules the implementation must follow:
- Attendance: the block after the `Roll Call` heading up to the next heading; a line ending `(absent)` is absent.
- Roll call sentence: `received a roll call vote of Ayes: <n>[ (<names|note>)], Nays: <n>[ (…)], Abstain: <n>[ (…)]`
  with an optional trailing `FAILED`. Outcome: `FAILED` present or Ayes ≤ Nays → `failed`, else `passed`.
- A parenthetical is a **name list** only when every comma-separated part is a single surname-like token; a part
  matching `<Name> (out of the room|left …|arrived …)` is an inline note, not a name.
- Subject: the item and question are read from the same sentence ("to adopt Amendment 03 to Appropriation
  Ordinance 2026-02" → `App Ord 2026-02`, `Amendment 03`; "to adopt Ordinance 21-23" → `Final passage`;
  "override the veto" → `Veto override`). Sentences about procedural motions (introduce, read by title,
  postpone, table, call the question, agenda, withdraw, minutes) are ignored.
- Notes elsewhere in the text (`arrived 6:31pm`, `left the meeting`, `was out of the room`, `returned`) become
  `notes` with `at` = the index of the next roll call; if the parser cannot order it against the roll calls,
  `at = null`.
- Any sentence containing `roll call vote` that does not parse goes to `unparsed`.

- [ ] **Step 1: Failing tests:**
  - `2026-10-07.txt`: attendance marks Rollo and Rosenbarger absent; roll call for `App Ord 2026-02`
    `Amendment 03` has tally `{yes:1,no:6,abstain:0}`, `named [{side:'yes',names:['Ruff']}]`, outcome `failed`;
    `Amendment 18` has `named [{side:'no',names:['Daily','Stosberg']}]`, outcome `passed`; `Amendment 05` and
    `Amendment 06` (tabled, withdrawn) produce no roll call; `unparsed` is empty.
  - `out-of-room parenthetical is not a name list`: in `2021-05-19.txt`, the roll call with `Ayes: 8 (Sims out of the
    room)` has `named` with no yes names and an inline note `{kind:'out_of_room', nameAsPrinted:'Sims'}`.
  - `2021-04-07.txt`: `(Volan out of the room)` after the tally becomes an inline note on that roll call.
  - `margin column does not corrupt roll call`: in `2021-05-05.txt`, `Amendment 02` to `Ord 21-23` parses with
    tally `{9,0,0}` and `sentence` does not contain `[10:38pm]`.
  - `departure before vote excludes member`: `2022-05-04.txt` — Volan's `arrived 6:31pm` note has `at` set to
    the index of the first roll call after it.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit.

### Task 6: Majority work-out and the four checks

**Files:** Create `backend/src/lib/localRecord/checks.ts`, test `checks.test.ts`.

**Interfaces:**
- Consumes: Tasks 2, 3.
- Produces:
  - `presentAt(parse: MinutesParse, rc: MinutesRollCall): { present: string[]; notPresent: { name: string; kind: MeetingNote['kind'] | 'absent' }[] } | { error: 'unplaced_note'; detail: string }`
    — attendance minus absent, applying every note with `at <= rc.index` in order (arrived adds, left/out_of_room
    removes, returned adds) plus `rc.inlineNotes`; any note with `at === null` → error.
  - `checkRollCall(rc: MinutesRollCall, parse: MinutesParse, ctx: { names: NameFile; terms: TermSpan[]; seatedCount: number;
    feed: Map<string, FeedItem>; knownItems: Set<string> }): CheckResult` — in this order:
    1. **Known item** (check 4): `rc.itemNumber` in `knownItems`, else `unknown_item`.
    2. **On the council** (check 2): every printed and attendance name resolves via `resolveName`; else that error
       as cause (`unknown_name` / `not_seated`; `ambiguous` → `unknown_name`).
    3. **Tally closes** (check 1): named side's count equals its tally; `present − named` equals the other side's
       count when exactly one side is unnamed (abstain unnamed means 0); `yes+no+abstain+notPresent === seatedCount`;
       else `tally_mismatch`. Unnamed side members get `workedOut: true`.
    4. **Agrees with the vote list** (check 3, `Final passage` only): feed outcome differs → `outcome_conflict`;
       outcome same but counts differ → ok with `feedDisagreement = 'feed <y>-<n>, minutes <y>-<n>'`; no feed
       final for the item → ok (amendments, items the feed lacks a final for are still checked by 1, 2, 4).
  - Position mapping: yes→`yea`, no→`nay`, abstain→`present`, absent at roll→`absent`, left/out of room/not yet
    arrived→`not_voting`.

- [ ] **Step 1: Failing tests** (build `MinutesParse` objects in the test from the Task 5 fixtures via
  `parseMinutes`, with a `NameFile` of fixture ids):
  - `2026-10-07` `Amendment 03`: ok; Ruff `yea` not worked out; the six other present members `nay` worked out;
    Rollo and Rosenbarger `absent`.
  - `tally mismatch`: same roll call with tally edited to `{yes:1,no:5}` → `tally_mismatch`.
  - `unplaced departure fails`: add a note `{kind:'left', at:null}` → `unplaced_note`.
  - `unknown item fails`: `knownItems` without `App Ord 2026-02` → `unknown_item`.
  - `feed counts differ, minutes win`: final passage whose feed tally is `8-0` and minutes `9-0` → ok,
    `feedDisagreement` set. Feed outcome `failed` vs minutes `passed` → `outcome_conflict`.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit.

### Task 7: Saved copies and the writer

**Files:** Create `backend/src/lib/localRecord/store.ts`, `write.ts`; tests `store.test.ts`, `write.test.ts`
(write test runs against a `pg` client stub that records SQL, like `federalVotesRefresh.test.ts`).

**Interfaces:**
- Produces:
  - `type Queryable = Pick<import('pg').PoolClient, 'query'>`;
    `interface StorageLike { upload(path: string, bytes: Uint8Array, contentType: string): Promise<void> }`
    (production: `supabaseAdmin.storage.from('local-record-sources')`; tests: an in-memory stub).
  - `sha256Hex(bytes: Uint8Array): string`
  - `saveDocument(db: Queryable, storage: StorageLike, doc: { city: CityScope; kind: 'minutes' | 'item_text';
    url: string; cityFileId: string | null; bytes: Uint8Array }): Promise<{ id: string; sha256: string; isNew: boolean }>`
    — bucket `local-record-sources` (private); path `<city>/<kind>/<sha256>.<ext>`; upsert on `(source_url, sha256)`;
    when the same `source_url` already has a different hash, insert the new row, set the old row's
    `superseded_by`, and return `isNew: true`.
  - `externalVoteId(city: CityScope, date: string, itemNumber: string, question: string): string` —
    `bloomington-<date>-<item slug>-<question slug>`, e.g. `bloomington-2026-10-07-app-ord-2026-02-amendment-03`.
  - `writeFeed(db, city, items: FeedItem[]): Promise<{ bills: number; pending: number }>` — upsert sessions
    (one per number year, `external_id 'onboard-<year>'`), bills (`external_id 'onboard-<feedId>'`, unique
    `(external_id, jurisdiction)`), and a `pending_minutes` roll call per feed final not yet confirmed.
  - `writeConfirmed(db, city, rc: MinutesRollCall, result: Extract<CheckResult,{ok:true}>, billId: string,
    minutesDocId: string): Promise<void>` — upsert roll call as `confirmed` (counts from minutes), then upsert one
    vote per `ResolvedVote` on the existing unique `(politician_id, bill_id, session_id, external_vote_id)` with
    `source 'onboard-minutes'`, `roll_call_id`, `name_as_printed`, `worked_out`, `confirmed_from`.
  - `recordException(db, city, runId, cause, subject, detail): Promise<void>` — upsert on
    `(city_scope, cause, subject)`; a resolved row stays resolved unless `detail` changed.

- [ ] **Step 1: Failing tests:** `sha256Hex` of a known byte string; `externalVoteId` example above;
  `saveDocument` same URL + same bytes twice → one row, `isNew false`; same URL new bytes → old row superseded;
  `writeConfirmed` twice with the same input issues upserts only (idempotent: second call's SQL has no plain
  INSERT without `ON CONFLICT`).
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit.

### Task 8: Weekly run, control, report

**Files:** Create `backend/src/lib/localRecord/refresh.ts`, test `refresh.test.ts`,
`backend/data/local-record/cities.json`, `backend/scripts/local-record/report.ts`; modify
`backend/src/jobs/registry.ts` (add `'local-record'` after `'federal-votes'`), `backend/package.json`
(`"local-record:report": "tsx scripts/local-record/report.ts"`).

**Interfaces:**
- Consumes: Tasks 3–7.
- Produces:
  - `cities.json`: `[{ "scope": "place:1805860", "slug": "bloomington-in", "reader": "onboard",
    "base": "https://bloomington.in.gov", "committeeId": 1, "trust": { "file": "TRUST.md", "sha256": "<hash of
    full.json from TRUST.md>", "date": "2026-11-25" }, "enabled": false }]`. `enabled` flips to `true` only in the
    go-live PR (D8).
  - `runLocalRecordRefresh(opts: { dryRun: boolean; now?: Date }): Promise<RunSummary>` where
    `RunSummary = { runId: string; cities: { scope: string; pendingAdded: number; rollCallsConfirmed: number;
    votesWritten: number; exceptions: Record<ExceptionCause, number> }[] }`. Env `LOCAL_RECORD_DRY_RUN=1` →
    one transaction per city, rolled back.
  - Per enabled city: read feed (current + previous year) → `writeFeed`; list minutes files not yet in
    `source_documents` **and** those for confirmed roll calls from the last 90 days (re-fetch); save, parse, check,
    write or `recordException`. A feed final whose meeting's minutes are saved but hold no roll call for it →
    `feed_missing_final`. A changed fingerprint on an already-used file → `file_changed`, nothing rewritten for
    that meeting.
  - **Control:** before writing, re-parse one confirmed meeting (seeded by `runId`) from its saved copy; if the
    resolved votes differ from the stored rows → `control_failed`, roll back the city, continue other cities.
  - The job throws (non-zero exit, visible in job health) when any **new** exception was recorded.
  - `report.ts`: prints, per city, open exceptions by cause for each of the last 8 ISO weeks, and the open list.

- [ ] **Step 1: Failing tests** (stub fetch, storage, db): happy path writes feed + one confirmed roll call;
  `replaced minutes raise file_changed and write nothing`; `feed final missing from posted minutes raises
  feed_missing_final`; control mismatch rolls back and records `control_failed`; disabled city is skipped;
  dry run issues `ROLLBACK`.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** `npm run typecheck --prefix backend` → clean. Commit.

### Task 9: People, terms, ids and the name file

**Files:** Create `backend/migrations/CA_eeee_bloomington_council_people_and_terms.sql`,
`backend/data/local-record/bloomington-in/names.json`; test `backend/src/lib/localRecord/namesFile.test.ts`.

**Interfaces:**
- Consumes: `essentials.seat_officeholder(p_office_id, p_politician_id, p_term_start, p_source, …)`
  (`1464_office_terms_seeding_helpers.sql`), the existing Bloomington council offices, `roster.json`, and the
  OnBoard seat pages saved in the inventory's `store-staging/jurisdictions/`.
- Produces: politician rows for Sims, Sandberg, Volan, Smith, Sgambelluri, Rana (full names as the seat pages
  print them); dated terms for them and earlier terms for current members (spans exactly as `roster.json`, each
  `source` naming its seat page URL); a `legislative_politician_id_map` row per member with `id_type 'onboard'`
  (confirm the OnBoard person id on the seat page before writing; if only seat ids exist, stop and ask);
  `names.json` listing every printed form seen in the fixtures and the inventory (`Asare`, `Asari`,
  `Isak Nti Asare`, …) per politician id. Photos for the six are out of this task (a later `find-headshots`
  pass; if one is added, set `photo_custom_url` as well as `politician_images`).

- [ ] **Step 1:** Read `backend/migrations/CLAUDE.md` "Writing" and "Sourcing a seat from a roster". Ask for the
  yes to reserve one `CA` slot; reserve it.
- [ ] **Step 2: Failing test** `namesFile.test.ts`: every surname in the inventory's `roster.json` resolves
  through `names.json` on a date inside its roster span; no variant maps to two ids.
- [ ] **Step 3:** Write the migration (idempotent, `NOT EXISTS` guards, old values recorded in comments for any
  `UPDATE`) and the name file (politician ids for the six new people are filled in **after** the migration is
  applied — the test is skipped with a clear message until then).
- [ ] **Step 4:** `npm run check:occupancy --prefix backend` and `check:seating` → clean. Commit. **Do not apply.**

### Task 10: First load (dry by default)

**Files:** Create `backend/scripts/local-record/first-load.ts`, test `first-load.test.ts`; `package.json`
script `"local-record:first-load": "tsx scripts/local-record/first-load.ts"`.

**Interfaces:**
- Consumes: Tasks 4–8; the inventory files `full.json`, `deep.json`, `roster.json` (paths by flag, absolute).
- Produces: `npm run local-record:first-load --prefix backend -- --city place:1805860 --inventory <abs dir>
  --out <abs dir> [--apply]`, writing to `--out`:
  - `reader-output.json` (every confirmed and failed roll call, 2020-12-01 → now, from **all** posted minutes),
  - `compare.md` — per inventory item (procedural motions skipped) and per member: `agree`, `differs` (→
    exception `inventory_disagrees`), `inventory only` (→ exception), and `reader only` (no inventory row),
  - `spotcheck.json` — 30 `reader only` votes drawn with a seed recorded in the file, each with its minutes
    quote and an empty `verdict`,
  - `summary.md` — rows that would go live, pending outcomes, exceptions by cause.
  - Without `--apply` it writes nothing to the database or storage. With `--apply` it refuses unless every
    `spotcheck.json` verdict is `match` and there are no open exceptions of causes `inventory_disagrees`,
    `control_failed`, `spot_check_failed`.
- Inventory matching: item id `place:1805860:<date>:<item_no>[ (<suffix>)]`; suffix `amendment N` → `Amendment N`
  (zero-pad to the minutes' form), `veto override` → `Veto override`, none → `Final passage`; `motion …` →
  skipped. Members compared by surname via the inventory roster.

- [ ] **Step 1: Failing tests:** suffix mapping table above; a `differs` row produces an `inventory_disagrees`
  exception; `--apply` refuses with one blank verdict; draw is reproducible from its seed.
- [ ] **Step 2–4:** FAIL → implement → PASS. Commit.
- [ ] **Step 5 (yes-gated):** ask to apply Task 1 and Task 9 migrations (dry-run first, each its own yes), fill
  the six ids into `names.json`, run Task 9's test → PASS, commit.
- [ ] **Step 6:** run first-load **without** `--apply` (reads only the city's public site; writes local files) →
  report `summary.md` to Chris with exceptions by cause.
- [ ] **Step 7:** Chris (or a second reader he names) fills `spotcheck.json`. Fix the reader for every cause
  that repeats (D6), re-run Step 6 until clean.
- [ ] **Step 8 (yes-gated):** `--apply`. It also uploads every file in the inventory's `store-staging/items/`
  and `store-staging/minutes/` through `saveDocument` (`kind` `item_text` / `minutes`, `url` = the item's
  `url_item` / `url_minutes` from the inventory), so the saved texts no longer live on one laptop. Report counts.

### Task 11: API — council record

**Files:** Modify `backend/src/lib/essentialsLegislativeService.ts`, `backend/src/routes/essentialsPoliticians.ts`;
test `backend/src/lib/essentialsLegislativeService.councilRecord.test.ts` (route test with supertest, as nearby
tests do).

**Interfaces:**
- Produces `GET /api/essentials/politicians/:id/council-record?limit=50&offset=0` (limit 1–200) →

```ts
{ total: number; items: {
    bill_id: string; number: string; title: string; url: string; status_label: string;
    pending: null | { meeting_date: string; outcome: 'passed' | 'failed' | 'vetoed'; yes: number; no: number; abstain: number };
    votes: { roll_call_id: string; question: string; question_order: number; meeting_date: string;
             position: 'yea' | 'nay' | 'present' | 'absent' | 'not_voting'; worked_out: boolean;
             outcome: string; yes: number; no: number; abstain: number; minutes_url: string;
             feed_disagreement: string | null; seat_label: string | null }[] }[] }
```

  - Items ordered by latest `meeting_date` desc; votes within an item by `meeting_date`, then `question_order`.
  - `pending` items appear only for meetings inside one of the member's council terms (`office_terms` date
    containment, not `term_end IS NULL`). Pending carries counts only, never names.
  - `seat_label` is the member's seat on that date when it differs from their current seat.
  - Returns `{ total: 0, items: [] }` for anyone with no city roll calls (state/federal legislators unaffected).
  - No change to `/votes`, `/bills`, `/legislative-summary`.

- [ ] **Step 1: Failing tests:** grouping and ordering; pending outside the member's term excluded; empty shape
  for a non-council id; limit clamp.
- [ ] **Step 2–4:** FAIL → implement (pool.query, one politician-rooted query with `DISTINCT` per
  `backend/migrations/CLAUDE.md`) → PASS. Commit.

### Task 12: ev-ui `CouncilVoteRecord`

**Files (ev-ui):** Create `src/CouncilVoteRecord.jsx`, test `src/CouncilVoteRecord.test.jsx`; export from
`src/index.js`; bump `package.json` to `0.19.0`.

**Interfaces:**
- Consumes: the Task 11 `items` array.
- Produces: `<CouncilVoteRecord items={…} loading={bool} />` — section title "Council votes"; year filter by
  `meeting_date` (reuse the `extractYear`/`getYears` approach in `LegislativeRecord.jsx`); one block per item;
  rows "Final passage" / "Amendment N" / "Veto override" with vote word (`yea` Yes, `nay` No, `present` Abstain,
  `absent` Absent, `not_voting` Not present), outcome and tally; pending block copy exactly: "How each member
  voted will appear when the minutes are approved."; links "Legislation page" (`url`) and "Minutes"
  (`minutes_url`); worked-out votes look the same, with the source detail text "Worked out from the attendance
  list and tally in the minutes." in the row's title attribute; show-all past 25 items like the existing
  sections; empty state "No council votes on file."

- [ ] **Step 1: Failing tests:** renders grouped rows in order; pending copy exact; year filter uses vote date;
  `present` renders "Abstain"; no party text anywhere in output.
- [ ] **Step 2–4:** FAIL → implement → PASS (`npm test`). `npm run build` → clean. Commit. Publishing the
  package is yes-gated.

### Task 13: Essentials page

**Files (this worktree):** Modify `src/lib/api.jsx` (add `fetchCouncilRecord(id, { limit, offset })`, same
pattern as `fetchLegislativeVotes`), `src/pages/LegislativeRecord.jsx`; create
`src/components/CouncilRecordAttribution.jsx`; bump `@empoweredvote/ev-ui` to `0.19.0`; test
`src/pages/LegislativeRecord.test.jsx`.

**Interfaces:** Page fetches council record alongside the rest; when `total > 0` it renders `CouncilVoteRecord`
in place of the bills and votes sections and `CouncilRecordAttribution` ("From the approved minutes of the
Bloomington Common Council." — city name from the politician's `government_name`) in place of
`LegiScanAttribution`; otherwise unchanged.

- [ ] **Step 1: Failing test** (mocked fetch): `total > 0` renders the council section and not "Sponsored
  Legislation"; `total 0` renders today's layout.
- [ ] **Step 2–4:** FAIL → implement → PASS (`npm test`). Run `npm run dev` against the live API and confirm a
  state legislator's record page is unchanged (council data does not exist until Task 10 Step 8).
- [ ] **Step 5:** After Task 9 is applied, open a former member's profile (`/politician/<id>`) on the live API.
  It must render with their past seat. If the profile shows no seat for a person with only past terms, add the
  line "Former member, <seat>, <first year>–<last year>" from their terms, with a test; report it before building
  more.
- [ ] **Step 6:** After go-live, add an `e2e/journeys.spec.js` journey: open a Bloomington member's record page
  and see a "Council votes" section with at least one item. Commit.

### Task 14: Stance research reads the same rows

**Files (ev-accounts, on top of `feat/local-inventory` once merged; if not merged, stop and ask):** modify
`backend/scripts/local-inventory/census.ts`, add `dbLinks.ts` + test, update
`.claude/skills/season-topic-prep/LOCAL.md`.

**Interfaces:**
- Produces: `<city>/db-links.json` (not hashed, like `confirmations.json`): inventory item id →
  `external_vote_id`, written by Task 10's `--apply` run. Census flag `--from-db`: per record item, reads that
  roll call's `legislative_votes` rows (read-only pool query, like `federalTableRead.ts`) and uses them as the
  votes; a record item with no link or no rows is refused by name. `confirmations.json` is not read for a
  `--from-db` city.
- LOCAL.md: replace "Stage L writes nothing to the database at all" with: Stage L writes nothing itself; the
  record job writes the votes; for a city with a live record, Stage L harvests from the database and checks it
  with the same gates; `db-links.json` joins tags to rows. Also add: a city's votes go live only with a passing,
  current trust file (D8), and every trust-process problem met per city is logged in
  `<research root>/local-inventory/TRUST-PROBLEMS.md` (city, date, problem, fix) for the owner's review of the
  lighter bar after the third city.

- [ ] **Step 1: Failing tests:** `--from-db` uses DB positions over the file's; missing link → refusal naming
  the item. **Step 2–4:** FAIL → implement → PASS. Commit.

### Task 15: Schedule

**Files (ev-infra):** modify `render.yaml` service `ev-jobs-legiscan` so the chain ends
`… → federal-votes → local-record`.

- [ ] **Step 1:** Edit; validate YAML. Commit. PR is yes-gated; merge only after go-live (Task 10 Step 8 and the
  `enabled: true` PR).

### Go-live order (each a separate yes)

1. Apply Task 1 migrations → 2. apply Task 9 → 3. first-load dry run, spot check, fixes → 4. first-load
`--apply` → 5. release ev-ui 0.19.0 → 6. merge ev-accounts (API + job, city still `enabled: false`) →
7. merge Essentials page → 8. PR flipping `enabled: true` → 9. ev-infra chain PR → 10. first weekly run, report.
