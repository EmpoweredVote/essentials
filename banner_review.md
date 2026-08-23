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

--- COLORADO SPRINGS + EL PASO COUNTY, 2026-08-21 ---

Two banners certified in one pass, both inside the 6:1 DESKTOP band (rows 128-411
of 540), never on the full frame.

  cities/colorado-springs.jpg   Garden of the Gods partial pano, Cheyenne Mountain
                                at right | WolfmanSF | CC BY-SA 4.0
                                native 7640x2796 (2.73:1), vertical anchor 0.45
  cities/el-paso-county-co.jpg  Calhan Paint Mines Archeological District, Pillars
                                on the Rim | MElizabethTill | CC BY-SA 4.0
                                native 4723x2988 (1.58:1), vertical anchor 0.25

NEITHER IS A SKYLINE, AND THAT IS THE FINDING. The Colorado STATE banner is the
Denver skyline backed by snowcapped Front Range peaks. Any downtown Colorado
Springs candidate renders as the same composition one tier down the same page, so
the strongest of them -- Downtown Colorado Springs by David Shankbone, CC BY-SA
3.0, a perfectly good photograph -- was rejected on adjacency alone. This is the
state/capital subject collision (Seattle/WA, Portland/ME, Portland/OR, Austin/TX)
appearing in a NON-capital city: Denver and Colorado Springs are different places,
but the two banners were still going to be the same picture. Check the state
banner's SUBJECT, not just its city name.

Fourteen candidates rejected. Two rejections worth keeping:
  - Garden of the Gods "central area" is a wall of conifers with the rock behind
    them: the exact Bend defect, and it looks fine at full frame.
  - "Monument Hill" ranked TOP of the county pool on metadata alone (5465x3787,
    CC BY 4.0, name matches the Palmer Divide landform) and is a photograph of a
    highway elevation sign. Metadata ranking shortlists; only the render decides.

El Paso County reads as the county the place -- a county-owned park on
unincorporated ground out east near Calhan -- deliberately not the red rock that
is the city's banner. Same city/county split as Madison vs Dane County.

The storage file is el-paso-county-co.jpg, not el-paso-county.jpg: El Paso County
also exists in Texas, and cities/ is a shared flat namespace. Precedent
portland-me.jpg / fairview-or.jpg.

NO STALE-CDN RISK ON THIS PASS. Both paths are new keys, never previously written,
so there was nothing cached to invalidate. Served bytes were still sha256-verified
against the local files after upload (014fed61 / e55d2e49) rather than trusting
HTTP 200.

Surfacing differs between the two and only one is exercised by an address search:
the city banner resolves from offices.representing_city, which all ten Colorado
Springs city offices carry, while county offices deliberately leave that column
NULL, so the county banner resolves only from browse_label in browse mode.


--- ASHEVILLE, 2026-08-23 ---

One banner, certified inside the 6:1 DESKTOP band (rows 128-411 of 540), never on
the full frame.

  cities/asheville.jpg   Asheville Skyline from Beaucatcher Mountain, August 2023
                         - 1 | Bill McMannis | CC BY 2.0
                         native 2400x1350 (1.78:1), centred crop 2400x762,
                         downscaled to 1700x540 -- NOTHING upscaled

THE "AVOID A SKYLINE" RULE OF THUMB GAVE THE WRONG ANSWER HERE, and that is the
finding worth keeping. North Carolina's state banner is the Charlotte uptown
skyline, so the reflex -- carried straight over from the Colorado Springs pass
above -- was to refuse any Asheville skyline. Reading the four candidates in the
band inverts it.

Charlotte's frame is a CLOSE, GROUND-LEVEL view with buildings filling it. The two
candidates that actually reproduced that composition were the Pack Square pair,
Asheville City Hall and the Buncombe County Courthouse shot from the square
(DiscoA340, CC BY-SA 4.0; 11488x2800 and 7904x2800). Both are close ground-level
civic buildings -- the same composition one tier down the same page. They also
shipped bare February trees across roughly half the band, a blown-flat sky, and in
the 11488 frame the courthouse roof cut off above row 128.

The chosen frame is an ELEVATED view: the Blue Ridge dominates, downtown sits
mid-distance, City Hall's tiled ziggurat roof is visible left of centre. Nothing
about it recalls Charlotte. So the adjacency risk lives in the COMPOSITION, not in
the word "skyline" -- and on this pass the two frames labelled "skyline" were the
most differentiated of the four, while the two civic close-ups were the collision.

ALSO REJECTED, and on a rule rather than on quality: a downtown aerial panorama at
sunset with McCormick Field (WillThomas, CC BY 4.0, 8192x2716). It is the best
looking frame of the four and by far the best source. Refused only because the
pipeline asks for daytime, consistent with the 50 live state panoramas. If that
rule is ever relaxed, this is the frame to revisit.

EXIF CAN LIE ABOUT TIME OF DAY; THE EXPOSURE TRIANGLE CANNOT. The 11488x2800 Pack
Square panorama carries an EXIF timestamp of 22:26, which reads as a night shot and
would fail the daytime rule outright. Its settings are 1/500 sec at f/5.6, ISO 100,
which is impossible at night, and the frame measures mean luminance 155.8/255 with
a blown sky. The camera clock is offset. Judge the pixels, not the timestamp.

NO STALE-CDN RISK. cities/asheville.jpg is a new key, never previously written, so
there was nothing cached to invalidate and no -v2 suffix is needed. Served bytes
were still sha256-verified against the local file after upload -- plain URL and
cache-busted URL both returned 6e6d4aec... matching the local file -- rather than
trusting HTTP 200.

SURFACING. All 7 Asheville city offices carry representing_city='Asheville'
(measured in prod after CA_0009), so this banner resolves from an ordinary address
search. Buncombe County's 10 offices leave that column NULL, the same as Durham and
El Paso County, so a county banner would resolve only from browse_label in browse
mode. Buncombe has no county banner and does not need one for this wave.

Attribution was verified on the Commons File: page, not from the filename or the
API summary -- the file is a Flickr photo mirrored to Commons, and these lines are
transcribed into public credit by Treasury Tracker.


--- DURHAM, 2026-08-23 ---

One banner, certified inside the 6:1 DESKTOP band (rows 128-411 of 540).

  cities/durham.jpg   Panorama on Corcoran Street, Durham (April 2023)
                      | DiscoA340 | CC BY-SA 4.0
                      native 13300x2800 (4.75:1) -- WIDER than the 3.148:1
                      target, so the crop is horizontal only and nothing is lost
                      vertically. Nine candidates sourced.

DURHAM IS THE FIRST CITY THAT HAD TO CLEAR TWO BANNERS, and that is the finding.
The Asheville pass above established that adjacency lives in the COMPOSITION, not
the subject noun. Durham is where that rule starts doing real work, because both
of its obvious framings were already taken:

    NC state banner  Charlotte uptown  -> close, ground-level, buildings fill frame
    Asheville (city) Beaucatcher Mtn   -> elevated, mountains dominate

A Durham downtown close-up repeats Charlotte. An elevated-over-hills view repeats
Asheville. Between them they eliminate the two framings a city banner normally
reaches for, and six of the nine candidates died on exactly that, on clutter, or
on band fit. Expect this to tighten again with each NC city added; the third city
in a state has fewer compositions left than the second.

The chosen frame is a WIDE LOW-RISE cityscape with sky and foliage -- neither a
tower canyon nor a mountain view -- and it carries four Durham landmarks at once:
DPAC, the Lucky Strike water tower, the smokestack, and the Durham Bull. Its
honest cost is clutter: a traffic signal centre-frame and a railroad crossing
gantry right of centre. Operator accepted that trade for the landmark content.

🔴 REJECTED ON A MEASUREMENT, AND IT WAS THE FIRST-CHOICE SUBJECT. The American
Tobacco Campus courtyard (DiscoA340, CC BY-SA 4.0, 9152x2800) is the best-looking
image of the nine -- warm brick, the canal, a genuinely horizontal composition
filling the band, and the single most recognisable place in Durham. It fails the
people test, not on taste:

    pedestrians ~67 px tall in the 1700x540 asset
    ~51 px as rendered at a 1296 px container
    accepted precedent is 10-20 px silhouettes (Travis County, 2026-08-18)

At that scale they are identifiable individuals -- faces and clothing distinct --
on a government banner, and none of them agreed to appear there. The existing
rule already says the test is DISTANCE AND SCALE, not presence; this is the first
time it has refused a frame that won on every other axis. If that test is ever
read as "presence is fine at any scale", this is the strongest Durham candidate
by a clear margin, and it should be revisited before anything else.

ALSO REJECTED: a DPAC panorama -- the cleanest frame of the nine, and it passed
the people test (parked cars plus one ~15 px figure) -- because DPAC is an
anonymous white modern building that could sit in many cities, a lamppost cuts the
left third, and the lower band is flat lawn that the overlay drives to near-black.
Kept as the standing alternative if the clutter in the shipped frame ever grates.
Also rejected: a Lucky Strike tower panorama (~70% empty sky, subjects at both
edges), two ground-level street frames (overcast, traffic furniture), a
looking-up skyline (buildings cut at the band's bottom edge, sun flare filling the
middle), a second courtyard angle (a steel gantry across the whole frame), and a
CC0 file whose name says tobacco campus but which shows a street corner of
signals and cables -- a reminder that a filename is not a subject.

NO STALE-CDN RISK. cities/durham.jpg is a new key, so nothing was cached and no
-v2 suffix is needed. Served bytes were still sha256-verified after upload --
plain and cache-busted URLs both returned d1f92d7b... matching the local file.

SURFACING. Durham's 7 city offices carry representing_city='Durham', so this
resolves from an ordinary address search. Durham County's 8 offices leave that
column NULL, as Buncombe and El Paso County do, and no county banner was created:
unlike El Paso County there is no distinct county geography to depict, so a second
Durham image would be an invented distinction.

Attribution verified on the Commons File: page -- own work, DiscoA340, CC BY-SA
4.0, 29 April 2023 15:36, afternoon daylight.

--- machine-readable ---
{"alexandria": {"status": "certified", "note": ""}, "leonardtown": {"status": "certified", "note": ""}, "springfield-mo": {"status": "certified", "note": ""}, "falls-church-alt": {"status": "certified", "note": ""}, "madison-wi": {"status": "certified", "note": "new 2026-07-27; CC BY 2.5 John Benson; anchor .45"}, "bend-or": {"status": "certified", "note": "re-cropped 2026-07-27 to bend-v2.jpg; pond band; supersedes centre crop"}, "austin-tx": {"status": "certified", "note": "new 2026-08-18; cities/austin.jpg IS the former states/TX.jpg byte-for-byte (sha256 62cba3d5); state moved to Chisos at states/TX-v2.jpg"}, "travis-county-tx": {"status": "certified", "note": "new 2026-08-18; Hamilton Pool Preserve; Fredlyfish4 CC BY-SA 4.0; centred crop; distant beachgoers operator-accepted (10-20px silhouettes at shipped size)"}, "colorado-springs-co": {"status": "certified", "note": "new 2026-08-21; Garden of the Gods partial pano; WolfmanSF CC BY-SA 4.0; anchor .45; NOT a skyline -- CO state banner is the Denver skyline, adjacency collision"}, "el-paso-county-co": {"status": "certified", "note": "new 2026-08-21; Calhan Paint Mines Pillars on the Rim; MElizabethTill CC BY-SA 4.0; anchor .25; -co suffix avoids El Paso County TX collision; browse-mode only (county offices have NULL representing_city)"}, "asheville-nc": {"status": "certified", "note": "new 2026-08-23; Asheville Skyline from Beaucatcher Mountain Aug 2023 - 1; Bill McMannis CC BY 2.0 (Flickr->Commons); centred crop, 2400->1700 downscale; ELEVATED mountain view chosen BECAUSE the NC state banner is the close ground-level Charlotte skyline -- the two Pack Square civic close-ups were the real adjacency collision, not the skyline frames; sunset aerial (WillThomas CC BY 4.0, 8192px) rejected on the daytime rule only"}, "durham-nc": {"status": "certified", "note": "new 2026-08-23; Panorama on Corcoran Street (April 2023); DiscoA340 CC BY-SA 4.0; native 4.75:1 so horizontal crop only; carries DPAC + Lucky Strike tower + smokestack + Durham Bull in one frame; FIRST city to clear TWO banners (Charlotte close-ground-level AND Asheville elevated-mountain), which eliminated both obvious framings; tobacco-campus courtyard was first choice and REJECTED on the people test at ~67px figures vs the 10-20px silhouette precedent -- revisit it first if that test is ever relaxed; DPAC pano kept as standing alternative"}}
