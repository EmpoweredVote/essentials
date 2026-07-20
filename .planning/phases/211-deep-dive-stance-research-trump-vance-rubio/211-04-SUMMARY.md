# 211-04 SUMMARY — Marco Rubio full-compass cited stances

**Status:** ✅ Complete
**Wave:** 4 (ran alone — D-10; after Vance)
**Official:** Marco Rubio (Secretary of State; fmr. 14-yr FL U.S. Senator) · politician_id `7c8e4442-e13e-485a-8993-b05ca110410d`

## Result

| Metric | Value |
|---|---|
| Topics answered (chair-matched, cited) | **21 / 44** |
| Honest blanks (D-02) | 23 |
| Cited (source_url + quote_text + topic_id) | 21 / 21 (100%) |
| D-09 attribution flags | 6 |
| Live `politician_answers` after apply | **21** (was 0 — clean insert) |
| Legacy deletes | 0 (Rubio had no legacy) |
| Null-value rows | 0 |
| `politician_context` rows | 21 (lockstep) |
| Trump / Vance rows | 27 / 20 — untouched |

**Assigned chairs:** abortion 4, campaign-finance 4, childcare 3, civil-rights 5, climate-change 4, deportation 4, fossil-fuels 4, healthcare 4, immigration 4, local-immigration 4, medicare/aid 4, misinformation 4, religious-freedom 4, same-sex-marriage 3, school-vouchers 3, social-security 4, tariffs 4, taxes 4, trans-athletes 4, ukraine-support 3, voting-rights 4.

**Honest blanks (23):** ai-regulation, housing, redistricting + 11 hyper-local + all 8 `judicial-*`.

## D-08 / D-09 (compass reflects Rubio, not the office)

SecState-led with Senate backfill; recorded Senate floor votes anchor most chairs (Ukraine aid, DISCLOSE Act, Freedom to Vote Act, ACA repeal, TCJA, Respect for Marriage Act) + 2025 SecState acts. **6 D-09 attribution flags** where a SecState action executes the President's agenda:
- **tariffs 4** — SecState defends Trump's blanket tariffs (chair-5 policy), but assigned 4 on Rubio's own reciprocal "fair trade" framing + Senate China-PNTR record.
- **deportation 4** — executes Trump's program; backed by Rubio's own enforcement-first Senate record.
- **ukraine-support 3** — runs Trump's diplomacy-first line; supported by Rubio's own recorded NO on the Apr-2024 $95B package (flag notes his earlier hawkish posture differs; recent governs per D-07).
- Partial flags on civil-rights, misinformation, trans-athletes (admin acts that independently match his own Senate record).

## Low-confidence / judgment calls (in editor_notes)

climate-change 4 (chair 5 arguable; used market-forces chair since he now acknowledges changing climate); childcare 3 (CTC proxy — no direct childcare record); fossil-fuels 4 (FL coast protection kept it off 5); school-vouchers 3 (his voucher act is income-capped/means-tested); same-sex-marriage 3 (RFMA no-vote + "states decide" = policy position, not his personal belief).

## Verification (all PASS, orchestrator re-ran before applying)

- Citation gate: 21 non-blank stances all carry quote_text + source_url + topic_id; **6 D-09 flags (≥1 required)**.
- CSV integrity: 21 rows, header exact, topic_ids valid, all pid=Rubio, values 1–5, 5 columns.
- Post-apply DB: Rubio=21, 0 nulls, context=21; Trump=27 / Vance=20 unchanged.

## Notes

- Clean insert (no legacy) — reconcile-delete correctly removed 0.
- Artifacts (`2026-07-19-marco-rubio.bundle.json` / `.csv`) on disk, intentionally gitignored (same as all stance artifacts).
