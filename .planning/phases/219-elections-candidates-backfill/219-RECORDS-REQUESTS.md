# Phase 219 — Records Requests (for the [OPEN] seats not sourceable online)

These primary documents (candidate-filing / election-cancellation records) are not published online. Send the drafts below to the respective City/Town Secretary; when they reply, the seats can be seeded evidence-only (a small follow-up migration, same pattern as 1401–1403).

Parker's 3 at-large seats are NOT here — those are sourced (canvass); they only need a data-modeling decision, not a records request.

---

## 1. Fairview (Town of Fairview, Collin County)
**To:** Town Secretary — `townsecretary@fairviewtexas.org` (verify current address on fairviewtexas.org)
**Re:** Public records request — May 3, 2025 Town Council election

> Subject: Public Information Request — May 3, 2025 Town Council Election Records
>
> Hello,
>
> Under the Texas Public Information Act, I'm requesting the following records for the Town of Fairview's May 3, 2025 general election:
>
> 1. The list of candidates who filed for each contested and uncontested office (Mayor, Council Member Seat 1, Seat 3, Seat 5), including any who were declared elected unopposed.
> 2. Any order or resolution cancelling the election (or any office's race) due to unopposed candidates under Texas Election Code §2.053, and/or the certificate(s) of election issued.
>
> A PDF or scan is fine. Thank you for your help.
>
> [Your name / organization]

**Seats to resolve:** Mayor (John Hubbard), Council Member Seat 1 (Rich Connelly), Seat 3 (Jill Hawkins), Seat 5 (Pat Sheehan) — current officeholders confirmed; need the primary election record naming them as the 2025 candidate/winner.

---

## 2. Melissa (City of Melissa, Collin County)
**To:** City Secretary — Hope Baskin (per prior research), main line 972-838-2520 (verify email on cityofmelissa.com)
**Re:** Public records request — May 4, 2024 City Council election, Places 5 & 6

> Subject: Public Information Request — May 4, 2024 City Council Election (Places 5 & 6)
>
> Hello,
>
> Under the Texas Public Information Act, I'm requesting the following records for the City of Melissa's May 4, 2024 general election:
>
> 1. The candidates who filed for Council Member Place 5 and Council Member Place 6, including any declared elected unopposed.
> 2. Any order/resolution cancelling either race for lack of opposition (Texas Election Code §2.053) and/or the certificate(s) of election issued for those two seats.
>
> A PDF or scan is fine. Thank you.
>
> [Your name / organization]

**Seats to resolve:** Council Member Place 5 (Craig Ackerman) and Place 6 (Sean Lehr) — current officeholders known, but no independently-cited candidate name was found for the 2024 cycle (both seats were absent from the county canvass — an unopposed-cancellation signature).

---

## When the replies come back
Seed the confirmed rosters as a small migration (mirror 1401): mint the city's own election row by name/date/state, seed the declared-elected candidate per seat, link the winner via `offices.politician_id`, cite the records-request document in the `source` column. Then flip these from [OPEN] to covered in 219-COVERAGE.md.
