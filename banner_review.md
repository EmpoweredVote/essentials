EMPOWERED VOTE - CITY BANNER REVIEW
Certified 6 | Redo 0 | Unreviewed 4 of 10

REDO (0):
  (none)

CERTIFIED (6):
  - Alexandria
  - Leonardtown
  - Springfield
  - Falls Church -- ALT: The Falls Church
  - Madison WI      -- NEW 2026-07-27. Skyline across Lake Monona, Capitol dome centred.
                        John Benson | CC BY 2.5 | anchor .45 of the 2408x932 original.
                        First WI city banner; WI local coverage was Racine County only.
  - Bend OR         -- RE-CROPPED 2026-07-27 (cities/bend-v2.jpg). Same Spencer Dahl
                        photograph, re-cut lower onto the Drake Park footbridge, the
                        white-columned house and the pond. Supersedes the 2026-07-26
                        centre crop, which was certified against the wrong frame -- below.

UNREVIEWED (4):
  Falls Church, Alexandria -- ALT: Old Town waterfront, Leonardtown -- ALT: downtown Main St, Springfield -- ALT: Park Central Square fountain

--- WHY BEND WAS RE-CROPPED (applies to every banner in the set) ---

The 1700x540 file is NOT what renders. SectionBanner uses a fixed-height box
(h-[120px] md:h-[180px]) at full width, so object-fit:cover keeps only the middle
~44% of the height on desktop -- source rows 152-388 of 540. Measured: a 1296x180
box covering a 1700x540 file keeps 43.7%.

Bend's snow peaks sat in rows 0-110 and were cut entirely, so what shipped to
desktop users was a wall of trees. The banner had been certified by looking at the
full 3.15:1 frame, which nobody sees at that viewport. It is a desktop-only
defect: at ~390px the box aspect (3.25:1) nearly matches the file (3.15:1) and
~97% survives, which is why it passed review.

Note the source's own limit: the 4510x2995 original is 1.506:1, so a 3.148:1 crop
keeps 1433 of its 2995 rows and the visible band covers only 626 source px. The
peaks (rows ~699-1060) and the pond (~1669-2263) are ~1300px apart and CANNOT both
sit in the band. bend-v2 chooses the pond; band-centring near row 1010 would choose
the peaks instead.

CONSEQUENCE FOR REVIEW: certify against the middle 44%, not the whole file. Any
banner whose subject is distributed vertically has this latent problem -- the 50
state panoramas included, none of which have been checked against a safe zone that
is not documented anywhere.

The real fix is upstream: give SectionBanner an aspect-ratio box instead of a fixed
height. Until then, treat "subject inside the middle 44%" as the bar.

--- STALE EDGE CACHE ON OVERWRITE ---

docs/shared-banner-assets.md says the URL is stable because "Supabase's CDN purges
on overwrite". That did not hold on 2026-07-27: after overwriting cities/bend.jpg,
the plain public URL still returned the previous 346KB file while a cache-busted
request returned the new 309KB one (verified by sha256). Version the filename
instead of overwriting in place. Bend is now cities/bend-v2.jpg; the previous file
is archived at cities/_archive/bend-mirrorpond-centrecrop-pre20260727.jpg.

--- machine-readable ---
{"alexandria":{"status":"certified","note":""},"leonardtown":{"status":"certified","note":""},"springfield-mo":{"status":"certified","note":""},"falls-church-alt":{"status":"certified","note":""},"madison-wi":{"status":"certified","note":"new 2026-07-27; CC BY 2.5 John Benson; anchor .45"},"bend-or":{"status":"certified","note":"re-cropped 2026-07-27 to bend-v2.jpg; pond band; supersedes centre crop"}}
