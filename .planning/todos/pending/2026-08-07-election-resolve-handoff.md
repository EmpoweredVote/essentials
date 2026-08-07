# Election resolve — handoff, 2026-08-07

Session did the post-election "large resolve". **Migrations 1574–1589 are applied AND pushed**
(EV-Accounts `master` @ `307c6fd4`). Next free migration: **1593**.

> ## ✅ TASKS (A) AND (B) ARE COMPLETE — closed 2026-08-07 (later session)
>
> **Migrations 1590–1592 applied and committed; 1527 committed.** EV-Accounts `master` @ `a694d960`,
> **2 commits ahead of origin — NOT PUSHED.**
>
> **(A) LA County June 2 primary is FULLY RESOLVED.** 247 rows, **0 NULL results**, every result
> carries a source (249 − 2 deleted fabrications). 44 rows recorded across migs 1590–1592.
>
> Three findings that **overturned assumptions written below** — read these before trusting the
> task-A section, which is left intact only as a record of what was believed at handoff time:
>
> 1. **Long Beach City Attorney + Prosecutor WERE on the June ballot.** The guess below ("these
>    seats weren't on the June ballot") was wrong. Each had exactly ONE filer; under LBMC 1.15.150
>    the Council appointed the sole nominee and cancelled that contest, so neither appears in the
>    canvass. Both are `won` (unopposed). Every Long Beach office with 2+ candidates *does* appear
>    in the results — that asymmetry is the diagnostic.
> 2. **Two more `incumbent_lookup` fabrications**, deleted and archived in
>    `essentials._fabricated_1590_removed`: **Ricardo Lara** (termed out, Cal. Const. art. V) and
>    **Tony Thurmond** (positively on the GOVERNOR ballot, 63,762 / 0.7%). Both contests had one row
>    more than the certified field. The `incumbent_lookup` audit for this election is now COMPLETE —
>    4 of 14 rows were fabrications; the other 10 are confirmed real.
> 3. **Superintendent's nonpartisan majority rule never fired.** Nobody cleared 50% (Shaw led on
>    22.6%), so the top two `advanced`. The warning below is still correct — it just didn't apply.
>
> Also: the three district contests were **verified** LA-only (one county row each), and the SoS
> `.xlsx` **dropped Sang "Sam Shin" Masog's name** while keeping his 10,199 votes — only the PDF
> (p.93) identifies him.
>
> **(B) Migration 1527 is committed, and its open question is CLOSED.** The 404 empty-`sources` rows
> are **legitimate**, not a defect backlog. The gate is driven from `politician_answers`, so
> `EMPTY_SOURCES` fires only where a voter-facing answer rests on uncited context — 0 of the 404 have
> an answer. All 404 are honest documented blanks from the 2026-05-11..13 Collin County / Richardson /
> Plano / Prosper / Bloomington work across 92 people, each opening "Researched <date>" and listing
> what was checked. `scripts/check-stance-sources.mjs` runs green: `EMPTY_SOURCES 0`,
> `NON_URL_SOURCE 0`, `BALLOTPEDIA_ONLY 159` (unchanged).
>
> ▶ **Everything still open is in "Other open items" near the bottom of this file** — the WA / TN /
> VA / KS / MO / TX post-certification queues, plus the deliberately-unseeded additive work (LA City
> Mayor has no race row, Villanueva has no Sheriff-runoff row, BoS D5 has no race row).

Two things to pick up: **(A) the last 46 LA County rows**, **(B) migration 1527**.

---

## Context you need before either task

### The `result` column (mig 1574, vocabulary extended 1575)

`essentials.race_candidates` now has `result` / `result_source` / `result_recorded_at`.

| value | means |
|---|---|
| `won` | carried the race (includes unopposed, and >50% in a nonpartisan primary) |
| `lost` | ran and was beaten |
| `advanced` | cleared a **top-two** primary — reached the general, does NOT hold the office |
| `runoff` | no outright winner; this candidate is in the runoff |
| `withdrew` | left before it was decided |
| `not_nominated` | on a shell but never on the ballot / not the nominee |

- **NULL means "not recorded", never "lost".**
- A CHECK makes it **impossible to write a `result` without a `result_source`**. Every citation must
  be a source you actually fetched.
- `result` is **per-race, not per-person**: Jaisen Rutledge is `runoff` on the May race and `won` on
  the June runoff. Both true.

### Two structural safeguards added this session — don't work around them

- `essentials.candidate_name_key(text)` + UNIQUE INDEX on
  `race_candidates (race_id, candidate_name_key(full_name))` — one candidacy per person per race.
  **Insert with `ON CONFLICT DO NOTHING`; do not re-implement the normalisation in app code.**
- UNIQUE INDEX on `races (election_id, office_id, COALESCE(primary_party,'~nonpartisan~'))`
  WHERE office_id IS NOT NULL. `primary_party` is in the key because partisan primaries legitimately
  put a Dem race AND a Rep race on the same office — 196 such pairs exist.
- `essentials.is_live_candidate(candidate_status, result)` (mig 1582) is the single liveness test,
  used at 11 sites across 7 services. Don't inline a status check.

---

## (A) LA County June 2 primary — 46 rows left

Election id `1ebca37f-cf96-47f4-bc2b-47ef266721fe`. **203 of 249 rows recorded. Nothing is blocked** —
all three defects that stopped the earlier passes are fixed (migs 1586–1589).

### 🔴 The one trap that matters

The LA County canvass is authoritative **only for contests wholly inside LA County**. It also carries
Governor, Lt Governor, AG etc., but those are LA's *share* of a statewide contest and California's
top-two is decided on **statewide** totals — for AG it shows Bonta at 1,305,327 against a statewide
4,979,967. Use the SoS Statement of Vote for anything statewide.

### Remaining work

**1. Three statewide contests (26 rows)** — CA SoS Statement of Vote, State Totals on the FINAL page
of each PDF (already downloaded to scratchpad this session; re-fetch if gone):

| contest | rows | PDF |
|---|---|---|
| Controller | 3 | `elections.cdn.sos.ca.gov/sov/2026-primary/sov/58-sco.pdf` |
| Insurance Commissioner | 12 | `.../67-ic.pdf` |
| Superintendent of Public Instruction | 11 | `.../113-spi.pdf` |

⚠️ **Superintendent is NONPARTISAN — not top-two.** >50% is `won`, not `advanced`. Applying the
top-two rule there is the same class of error as reading LA's county share for a statewide office.

Pattern to copy: **mig 1585** (AG + SoS, already done — read it first).
PDFs with many candidates are split into panels; state totals appear once per panel (Lt Gov needed
pp. 48 *and* 51). Read with the Read tool — WebFetch garbles these PDFs.

**2. Three district contests (18 rows)** — CA State Assembly 55 (4), CA State Senate 26 (8),
U.S. Rep 34 (6). These *look* wholly inside LA County, so the LA canvass may be complete for them —
**check that against SoS district totals, don't assume it.**

**3. Long Beach City Attorney + City Prosecutor (2 rows)** — these contests appear NOWHERE in the
certified results. Long Beach reported an Auditor, a Mayor and five council districts, nothing else.
So these seats weren't on the June ballot; `lost` and `not_nominated` would both be false. Check the
Long Beach City Clerk's election calendar.

### Not seeded (additive work, deliberately not done)

- **LA City MAYOR has no race row at all** — the county's highest-profile result. Karen Bass 34.27%
  and Nithya Raman 29.02% to a November runoff; 15 candidates.
- **Alex Villanueva** finished 2nd for Sheriff (21.70%) and is in the November runoff, but has no
  row — that runoff currently shows one participant.
- **BoS District 5** has no race row after mig 1589 retired its bogus shell. D5 IS up in 2026.
  Office id `e8603d4c-08a5-47fd-a068-90f5d77846e0`.
- Others: Minasyan, Sidenfaden (BoS D3); Sun, Newland, Palty (Assessor); Strong, Martinez, White
  (Sheriff); Hauer (KS-02), Hohe (KS-03), Phillips (MO-01), Becker (MO-05); Albritton, Vasquez,
  Harvey, Ahrar (VA).

### Source recipe that worked

`results.lavote.gov/text-results/4338` (certified 2026-06-26). Strip tags, then the format is
`NAME (PARTY) / votes / percent` in descending order per contest. The awk parser used is in the
session scratchpad (`parse_la.awk`) — 172 contests, 647 rows, easy to regenerate.

**Rule depends on the ballot title:** "GENERAL/REGULAR MUNICIPAL" = plurality, top N win.
"PRIMARY NOMINATING" = >50% or top two go to a November runoff. Getting this backwards inverts
outcomes — Linares won Covina D3 with 42.54% (general), Gaspar only made a runoff with 46.08% (LA).

---

## (B) migration 1527 — `1527_repair_prose_in_sources.sql`

**Status: applied to production, but NEVER COMMITTED.** It sits untracked in
`C:/EV-Accounts/backend/migrations/`. 372 lines, generated by `scripts/emit-source-prose-repair.mjs`.

### What it did

An ingestion step split a reasoning string on commas into the `sources` array: the first fragment
stayed in `reasoning` (rendering truncated mid-sentence), the rest became fake "citations" like
`"SB0438 pharmacy benefits"` and a bare carriage-return fragment, with the real URL last. (The
literal escape sequence is deliberately not reproduced here — Tailwind v4 scans `.planning/*.md`
and a raw backslash in these files has crashed the build before.) Both halves are voter-facing via
`Citations.jsx`. The migration rejoins the sentence and keeps only real URLs.

### Verified this session

- ✅ **It was applied.** Benjamin Brooks / Abortion matches the repaired text exactly (reasoning
  restored, single `fastdemocracy.com` source).
- ✅ **The defect class is gone:** `0` rows in `inform.politician_context` have a non-URL entry in
  `sources`.

So the immediate task is just **`git add` + commit the file** — the record of an applied change.
Related artifacts named in its header (confirm they exist):
`data/stance-retirement/2026-08-01-prose-sources-rollback.json` and `...-repair.md`.

### 🔴 Open question worth the exploration

1527's header says: *"10 further rows have NO url left in the array and are NOT touched here.
Repairing them would empty `sources`, and EMPTY_SOURCES is zero-tolerance."*

But **`inform.politician_context` currently has 404 rows with empty `sources`** (0 NULL, 404 empty,
33,300 total). Either the zero-tolerance gate isn't holding, or empty sources are legitimate for some
row class — plausibly the honest per-(person,topic) blanks registered during the Collin County stance
work. **Establish which before treating 404 as a defect.** The `NON_URL_SOURCE` gate check mentioned
in the header is the thing to go read.

---

## Other open items (tasks #8–#14 in the session task list)

| | |
|---|---|
| WA top-two cull | after 2026-08-21 certification; 69 rows dated `provisional_until = 2026-08-24` |
| TN full-shell reconcile | after 2026-08-24; 88 rows dated `2026-08-27` |
| VA held rows | Kersey (VA-04), Terry (VA-07) after VA DOE posts its November list; dated `2026-09-01` |
| KS held rows | Gaynor, Catanese (KS-04); dated `2026-09-01` |
| MO held rows | 16 minor-party rows; dated `2026-09-01` |
| MO placeholder election | districts 2–6 hang off a 2026-03-24 shell — needs a re-parent decision |
| TX May 2026 | 19 uncovered races (6 cities' cancellation orders, Grayson/Gregg counties, Frisco Mayor runoff which has no race row) |

### ⚠️ The rule that held in every state checked

**`stale_provisional_candidates` UNDERCOUNTS.** The flag was set on rows whose *sourcing* felt shaky
(independents, minor parties), not on rows whose *facts* are contingent. Observed: VA 8 flagged / 21
real · KS 26/26 · WA 20/69 · TN 28/88. **Always query the whole general-election shell, never just
the queue.** Upcoming primaries — HI 08-08, VT 08-11, CT/MN/WI 08-12 — will have the same shape.

### Also: gate on the CANVASS date, not election day

Several `provisional_until` values were set to election-day+1 and came due while results were still
unofficial. WA certifies 08-21, TN 08-24, AZ certified 08-06.

---

## Discovery cron — resolved, don't re-enable without reading

Already gated off (`DISCOVERY_SWEEP_ENABLED`, default-off) since 2026-07-26; verified zero runs
since. Measured lifetime return is now recorded in `backend/src/cron/discoverySweep.ts`:
**526 runs → 7 net-new candidates, 47% failure rate, 70% of what it wrote were duplicates** — and
those duplicates were the worst integrity defect in this sweep (mig 1586). On-demand runs still work
and are the right model: an attended run is an intentional spend.
