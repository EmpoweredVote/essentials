EMPOWERED VOTE - CITY BANNER REVIEW
Certified 8 | Redo 0 | Unreviewed 4 of 12

NOTE (2026-08-18): this ledger is BEHIND the registry. Many banners added since
2026-07-29 -- the five Tarrant cities, Seattle, King County, Bainbridge Island,
the Puerto Rico set -- were certified in review artifacts and wired into
buildingImages.js without being recorded here. The counts above therefore describe
this file, not the corpus. buildingImages.js is the authority; treat a missing
entry here as unrecorded, not as unreviewed.

REDO (0):
  (none)

CERTIFIED (8):
  - Alexandria
  - Leonardtown
  - Springfield
  - Falls Church -- ALT: The Falls Church
  - Madison WI      -- NEW 2026-07-27. Skyline across Lake Monona, Capitol dome centred.
                        John Benson | CC BY 2.5 | anchor .45 of the 2408x932 original.
                        First WI city banner; WI local coverage was Racine County only.
  - Travis County TX -- NEW 2026-08-18 (cities/travis-county.jpg). Hamilton Pool
                        Preserve. Fredlyfish4 | CC BY-SA 4.0 | 7986x2502 original,
                        centred crop, 7877px retained. Deliberately NOT the skyline:
                        that subject moved to cities/austin.jpg the same day, so the
                        county reads as the county -- the separation King County keeps
                        from Seattle and Dane from Madison.
                        Operator-accepted 2026-08-18 over my objection, correctly: the
                        beachgoers are 10-20px silhouettes with no facial detail at the
                        shipped 1700x540. Distance and scale are the test, not the mere
                        presence of people -- the Barton Springs and Barton Creek frames
                        rejected the same day had subjects filling the FOREGROUND.
  - Austin TX       -- NEW 2026-08-18 (cities/austin.jpg). Downtown skyline from Lady
                        Bird Lake. Sk5893 | CC BY-SA 4.0 | 8005x2993 original.
                        THIS FILE IS THE FORMER states/TX.jpg, BYTE-FOR-BYTE
                        (sha256 62cba3d5...). The Texas state banner was a photograph
                        of Austin, so state and capital shared one subject; the state
                        moved to the Chisos Mountains (states/TX-v2.jpg, Tlshands,
                        CC BY-SA 3.0) and this frame came down a tier -- the same
                        resolution WA used for Seattle, ME for Portland, OR for Mount
                        Hood. No _archive copy: this entry IS the archive.
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

FIXED 2026-07-27: SectionBanner uses an aspect-ratio box instead of a fixed height,
so the visible fraction no longer depends on window WIDTH -- only on the box ratio.

!! SUPERSEDED -- READ THIS BEFORE CERTIFYING ANYTHING (corrected 2026-08-18) !!
The text below this line originally said BANNER_ASPECT was a single '1700 / 540',
that "nothing is cropped any more", and that the middle-band rule was retired.
That was true only briefly. BANNER_ASPECT is now a RESPONSIVE PAIR:

    mobile  aspect-[13/4]  = 3.25:1  -> keeps 96.9% of the asset
    md+     aspect-[6/1]   = 6.00:1  -> keeps 52.5% (rows 128-412 of 540)

So desktop DOES still crop, to just over half the frame, and certifying against the
full 3.15:1 frame is exactly how the Bend defect happened. CONSEQUENCE FOR REVIEW:
certify against the 6:1 DESKTOP BAND, and check mobile second. A subject that is a
horizontal band survives; one distributed vertically does not. Verified 2026-08-18
against SectionBanner.jsx while choosing the Austin and Texas banners -- two
candidates (Pennybacker Bridge, Guadalupe Mountains) looked fine at full frame and
failed in the band.

Note the cost: desktop banners are taller -- ~412px at a 1296px container versus
the old 180px -- and Results/ElectionsView render one per tier, up to three per
page. If that proves too heavy, WIDEN BANNER_ASPECT. Do NOT restore a fixed
height; that brings the viewport-dependent cropping straight back. A regression
test in SectionBanner.test.js fails if a fixed-height box reappears.

STILL WORTH DOING: the 50 state panoramas were composed and certified under the
old middle-44% crop, so some may now reveal sky or foreground that was never
meant to be seen. They are not BROKEN -- they show more, not less -- but none has
been re-reviewed at full frame. Bend (bend-v2) is also now re-checkable: with
nothing cropped, the peaks AND the pond are both visible, so the either/or choice
recorded above no longer binds and a centre crop may be preferable again.

--- STALE EDGE CACHE ON OVERWRITE ---

docs/shared-banner-assets.md says the URL is stable because "Supabase's CDN purges
on overwrite". That did not hold on 2026-07-27: after overwriting cities/bend.jpg,
the plain public URL still returned the previous 346KB file while a cache-busted
request returned the new 309KB one (verified by sha256). Version the filename
instead of overwriting in place. Bend is now cities/bend-v2.jpg; the previous file
is archived at cities/_archive/bend-mirrorpond-centrecrop-pre20260727.jpg.

CONFIRMED AGAIN 2026-08-18, and this time on a STATE asset. Uploading the Chisos
frame over states/TX.jpg and immediately re-fetching gave, from the same URL:
  plain        -> sha256 62cba3d5... (the OLD Austin skyline, 214405 bytes)
  ?v=<buster>  -> sha256 b23ea801... (the new Chisos frame, 205609 bytes)
SectionBanner requests the plain URL, so the swap would have been invisible to
users for an unknown period. Fixed by publishing to states/TX-v2.jpg and adding
STATE_PANORAMA_FILES to buildingImages.js, because the state URL was hardcoded as
`${abbrev}.jpg` and had no way to express a version.

Washington was swapped on 2026-08-14 by overwriting states/WA.jpg and serves the
new Hurricane Ridge frame today -- that is the cache having expired over four days,
NOT evidence that overwrite works. Version the filename for state banners too.

--- machine-readable ---
{"alexandria":{"status":"certified","note":""},"leonardtown":{"status":"certified","note":""},"springfield-mo":{"status":"certified","note":""},"falls-church-alt":{"status":"certified","note":""},"madison-wi":{"status":"certified","note":"new 2026-07-27; CC BY 2.5 John Benson; anchor .45"},"bend-or":{"status":"certified","note":"re-cropped 2026-07-27 to bend-v2.jpg; pond band; supersedes centre crop"},"austin-tx":{"status":"certified","note":"new 2026-08-18; cities/austin.jpg IS the former states/TX.jpg byte-for-byte (sha256 62cba3d5); state moved to Chisos at states/TX-v2.jpg"},"travis-county-tx":{"status":"certified","note":"new 2026-08-18; Hamilton Pool Preserve; Fredlyfish4 CC BY-SA 4.0; centred crop; distant beachgoers operator-accepted (10-20px silhouettes at shipped size)"}}
