# Phase 104: VA Headshots - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 104-va-headshots
**Areas discussed:** Script structure, Senate URL discovery, Federal headshot sources, Plan/migration count

---

## Script Structure

| Option | Description | Selected |
|--------|-------------|----------|
| One script per group | Separate scripts per group (_tmp-va-delegates-headshots.py, _tmp-va-senators-headshots.py, etc). Easier to re-run one group if something fails. | ✓ |
| One master script | Single _tmp-va-headshots.py handles all 156 officials. Alexandria used one script for 2 groups. | |
| You decide | Leave structure choice to researcher/planner based on senate URL pattern discovery. | |

**User's choice:** One script per group (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Execs separate (_tmp-va-execs-headshots.py) | Execs have different source URLs. Keeps each script cleanly aligned to one group. | ✓ |
| Execs + senators together | 3 execs + 40 senators = 43 officials; fewer files. | |
| You decide | Leave to researcher. | |

**User's choice:** Execs separate (Recommended)
**Notes:** Final structure: 4 scripts — execs, senators, delegates, federal.

---

## Senate URL Discovery

| Option | Description | Selected |
|--------|-------------|----------|
| Try common extensions + HTTP HEAD | Construct {LastName}{district}, try .jpg/.png/.webp via HEAD requests, take first 200. Automatable. | ✓ |
| Parse the senate member list page | Scrape HTML to extract actual <img> src attributes. More reliable but requires HTML parsing. | |
| Researcher figures it out | Just tell researcher the base URL; leave discovery method open. | |

**User's choice:** Try common extensions + HTTP HEAD (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Wikipedia + official .gov bio | Fallback for anomalies: Wikipedia Commons then senator's .virginia.gov profile page. | ✓ |
| Skip and note in migration comments | Flag as needs-manual-review; don't block phase completion. | |
| You decide | Researcher decides case-by-case. | |

**User's choice:** Wikipedia + official .gov bio (Recommended)

---

## Federal Headshot Sources

| Option | Description | Selected |
|--------|-------------|----------|
| Congress.gov official portraits | https://www.congress.gov/img/member/{bioguide_id}.jpg — used for CA and MD federal. | ✓ |
| Wikipedia Commons | Good fallback, Creative Commons licensed, less consistent sizing. | |
| Official .gov bios (house.gov / senate.gov) | Per-member discovery required. | |

**User's choice:** Congress.gov official portraits (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated script: _tmp-va-federal-headshots.py | Clean separation — bioguide IDs are a different source domain. | ✓ |
| Fold into senators script | 2 senators + 11 reps = 13; alongside 40 senators would reduce script count to 3. | |

**User's choice:** Dedicated script (Recommended)

---

## Plan/Migration Count

| Option | Description | Selected |
|--------|-------------|----------|
| One migration (315) for all INSERTs | Single file covers all 156 officials. Matches MD/OR/CA headshot pattern. | ✓ |
| Two migrations: state (315) + federal (316) | Cleaner separation but unnecessary migration counter bump. | |

**User's choice:** One migration (315) for all headshot INSERTs (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| AUDIT-ONLY | Scripts do live writes; migration records them. Matches 314/271/255/258. | ✓ |
| Applied normally via Supabase MCP | Migration does INSERT work directly. Deviation from established headshot pattern. | |

**User's choice:** AUDIT-ONLY (Recommended)

---

## Claude's Discretion

None — all areas resolved by user selection.

## Deferred Ideas

None — discussion stayed within phase scope.
