# Cross-reference pre-existing assembly rows against current roster

# Pre-existing rows from DB (external_id, full_name)
pre_existing = [
    (-100049, 'Tony Vazquez'),
    (-100051, 'Tom Lackey'),
    (-100053, 'Juan Carrillo'),
    (-100055, 'Pilar Schiavo'),
    (-100057, 'John Harabedian'),
    (-100059, 'Jacqui Irwin'),
    (-100061, 'Celeste Rodriguez'),
    (-100063, 'Nick Schultz'),
    (-100065, 'Jesse Gabriel'),
    (-100067, 'Blanca Rubio'),
    (-100069, 'Mike Fong'),
    (-100071, 'Rick Chavez Zbur'),
    (-100073, 'Jessica Caloza'),
    (-100075, 'Michelle Rodriguez'),
    (-100077, 'Mark Gonzalez'),
    (-100079, 'Isaac G. Bryan'),
    (-100081, 'Lisa Calderon'),
    (-100083, 'Sade Elhawary'),
    (-100085, 'Tina Simone McKinnor'),
    (-100087, 'Jose Luis Solache'),
    (-100089, 'Blanca Pachecco'),
    (-100091, 'Mike A. Gipson'),
    (-100093, 'Al Muratsuchi'),
    (-100095, 'Sharon Quirk-Silva'),
    (-100097, 'Josh Lowenthal'),
    (-100099, 'Susan Rubio'),
    (-100101, 'Suzette Martinez Valladares'),
    (-100103, 'Benjamin Allen'),
    (-100105, 'Sasha Renee Perez'),
    (-100107, 'Maria Elena Durazo'),
    (-100109, 'Henry Stern'),
    (-100111, 'Lola Smallwood-Cuevas'),
    (-100113, 'Bob Archuleta'),
    (-100115, 'Lena A. Gonzalez'),
    (-100117, 'Thomas J. Umberg'),
    (-100119, 'Laura Richardson'),
]

# Current roster from website (district, full_name, party, first, last)
roster = [
    (1, 'Heather Hadwick', 'Republican', 'Heather', 'Hadwick'),
    (2, 'Chris Rogers', 'Democrat', 'Chris', 'Rogers'),
    (3, 'James Gallagher', 'Republican', 'James', 'Gallagher'),
    (4, 'Cecilia M. Aguiar-Curry', 'Democrat', 'Cecilia M.', 'Aguiar-Curry'),
    (5, 'Joe Patterson', 'Republican', 'Joe', 'Patterson'),
    (6, 'Maggy Krell', 'Democrat', 'Maggy', 'Krell'),
    (7, 'Josh Hoover', 'Republican', 'Josh', 'Hoover'),
    (8, 'David J. Tangipa', 'Republican', 'David J.', 'Tangipa'),
    (9, 'Heath Flora', 'Republican', 'Heath', 'Flora'),
    (10, 'Stephanie Nguyen', 'Democrat', 'Stephanie', 'Nguyen'),
    (11, 'Lori D. Wilson', 'Democrat', 'Lori D.', 'Wilson'),
    (12, 'Damon Connolly', 'Democrat', 'Damon', 'Connolly'),
    (13, 'Rhodesia Ransom', 'Democrat', 'Rhodesia', 'Ransom'),
    (14, 'Buffy Wicks', 'Democrat', 'Buffy', 'Wicks'),
    (15, 'Anamarie Avila Farias', 'Democrat', 'Anamarie', 'Avila Farias'),
    (16, 'Rebecca Bauer-Kahan', 'Democrat', 'Rebecca', 'Bauer-Kahan'),
    (17, 'Matt Haney', 'Democrat', 'Matt', 'Haney'),
    (18, 'Mia Bonta', 'Democrat', 'Mia', 'Bonta'),
    (19, 'Catherine Stefani', 'Democrat', 'Catherine', 'Stefani'),
    (20, 'Liz Ortega', 'Democrat', 'Liz', 'Ortega'),
    (21, 'Diane Papan', 'Democrat', 'Diane', 'Papan'),
    (22, 'Juan Alanis', 'Republican', 'Juan', 'Alanis'),
    (23, 'Marc Berman', 'Democrat', 'Marc', 'Berman'),
    (24, 'Alex Lee', 'Democrat', 'Alex', 'Lee'),
    (25, 'Ash Kalra', 'Democrat', 'Ash', 'Kalra'),
    (26, 'Patrick J. Ahrens', 'Democrat', 'Patrick J.', 'Ahrens'),
    (27, 'Esmeralda Z. Soria', 'Democrat', 'Esmeralda Z.', 'Soria'),
    (28, 'Gail Pellerin', 'Democrat', 'Gail', 'Pellerin'),
    (29, 'Robert Rivas', 'Democrat', 'Robert', 'Rivas'),
    (30, 'Dawn Addis', 'Democrat', 'Dawn', 'Addis'),
    (31, 'Dr. Joaquin Arambula', 'Democrat', 'Dr. Joaquin', 'Arambula'),
    (32, 'Stan Ellis', 'Republican', 'Stan', 'Ellis'),
    (33, 'Alexandra M. Macedo', 'Republican', 'Alexandra M.', 'Macedo'),
    (34, 'Tom Lackey', 'Republican', 'Tom', 'Lackey'),
    (35, 'Jasmeet Kaur Bains', 'Democrat', 'Jasmeet Kaur', 'Bains'),
    (36, 'Jeff Gonzalez', 'Republican', 'Jeff', 'Gonzalez'),
    (37, 'Gregg Hart', 'Democrat', 'Gregg', 'Hart'),
    (38, 'Steve Bennett', 'Democrat', 'Steve', 'Bennett'),
    (39, 'Juan Carrillo', 'Democrat', 'Juan', 'Carrillo'),
    (40, 'Pilar Schiavo', 'Democrat', 'Pilar', 'Schiavo'),
    (41, 'John Harabedian', 'Democrat', 'John', 'Harabedian'),
    (42, 'Jacqui Irwin', 'Democrat', 'Jacqui', 'Irwin'),
    (43, 'Celeste Rodriguez', 'Democrat', 'Celeste', 'Rodriguez'),
    (44, 'Nick Schultz', 'Democrat', 'Nick', 'Schultz'),
    (45, 'James C. Ramos', 'Democrat', 'James C.', 'Ramos'),
    (46, 'Jesse Gabriel', 'Democrat', 'Jesse', 'Gabriel'),
    (47, 'Greg Wallis', 'Republican', 'Greg', 'Wallis'),
    (48, 'Blanca E. Rubio', 'Democrat', 'Blanca E.', 'Rubio'),
    (49, 'Mike Fong', 'Democrat', 'Mike', 'Fong'),
    (50, 'Robert Garcia', 'Democrat', 'Robert', 'Garcia'),
    (51, 'Rick Chavez Zbur', 'Democrat', 'Rick Chavez', 'Zbur'),
    (52, 'Jessica M. Caloza', 'Democrat', 'Jessica M.', 'Caloza'),
    (53, 'Michelle Rodriguez', 'Democrat', 'Michelle', 'Rodriguez'),
    (54, 'Mark Gonzalez', 'Democrat', 'Mark', 'Gonzalez'),
    (55, 'Isaac G. Bryan', 'Democrat', 'Isaac G.', 'Bryan'),
    (56, 'Lisa Calderon', 'Democrat', 'Lisa', 'Calderon'),
    (57, 'Sade Elhawary', 'Democrat', 'Sade', 'Elhawary'),
    (58, 'Leticia Castillo', 'Republican', 'Leticia', 'Castillo'),
    (59, 'Phillip Chen', 'Republican', 'Phillip', 'Chen'),
    (60, 'Dr. Corey A. Jackson', 'Democrat', 'Dr. Corey A.', 'Jackson'),
    (61, 'Tina S. McKinnor', 'Democrat', 'Tina S.', 'McKinnor'),
    (62, 'Jose Luis Solache Jr.', 'Democrat', 'Jose Luis', 'Solache Jr.'),
    (63, 'Natasha Johnson', 'Republican', 'Natasha', 'Johnson'),
    (64, 'Blanca Pacheco', 'Democrat', 'Blanca', 'Pacheco'),
    (65, 'Mike A. Gipson', 'Democrat', 'Mike A.', 'Gipson'),
    (66, 'Al Muratsuchi', 'Democrat', 'Al', 'Muratsuchi'),
    (67, 'Sharon Quirk-Silva', 'Democrat', 'Sharon', 'Quirk-Silva'),
    (68, 'Avelino Valencia', 'Democrat', 'Avelino', 'Valencia'),
    (69, 'Josh Lowenthal', 'Democrat', 'Josh', 'Lowenthal'),
    (70, 'Tri Ta', 'Republican', 'Tri', 'Ta'),
    (71, 'Kate Sanchez', 'Republican', 'Kate', 'Sanchez'),
    (72, 'Diane B. Dixon', 'Republican', 'Diane B.', 'Dixon'),
    (73, 'Cottie Petrie-Norris', 'Democrat', 'Cottie', 'Petrie-Norris'),
    (74, 'Laurie Davies', 'Republican', 'Laurie', 'Davies'),
    (75, 'Carl DeMaio', 'Republican', 'Carl', 'DeMaio'),
    (76, 'Dr. Darshana R. Patel', 'Democrat', 'Dr. Darshana R.', 'Patel'),
    (77, 'Tasha Boerner', 'Democrat', 'Tasha', 'Boerner'),
    (78, 'Christopher M. Ward', 'Democrat', 'Christopher M.', 'Ward'),
    (79, 'Dr. LaShae Sharp-Collins', 'Democrat', 'Dr. LaShae', 'Sharp-Collins'),
    (80, 'David A. Alvarez', 'Democrat', 'David A.', 'Alvarez'),
]

# Manual mapping based on careful name cross-reference
# Some pre-existing names have typos or former members
# Key: old_external_id -> (district, canonical_name, party, notes)
manual_map = {
    -100049: (50, 'Robert Garcia', 'Democrat', 'Tony Vazquez left; AD-50 now Robert Garcia'),
    -100051: (34, 'Tom Lackey', 'Republican', 'Same person, AD-34'),
    -100053: (39, 'Juan Carrillo', 'Democrat', 'Same person, AD-39'),
    -100055: (40, 'Pilar Schiavo', 'Democrat', 'Same person, AD-40'),
    -100057: (41, 'John Harabedian', 'Democrat', 'Same person, AD-41'),
    -100059: (42, 'Jacqui Irwin', 'Democrat', 'Same person, AD-42'),
    -100061: (43, 'Celeste Rodriguez', 'Democrat', 'Same person, AD-43'),
    -100063: (44, 'Nick Schultz', 'Democrat', 'Same person, AD-44'),
    -100065: (46, 'Jesse Gabriel', 'Democrat', 'Same person, AD-46'),
    -100067: (48, 'Blanca E. Rubio', 'Democrat', 'Blanca Rubio = Blanca E. Rubio, AD-48'),
    -100069: (49, 'Mike Fong', 'Democrat', 'Same person, AD-49'),
    -100071: (51, 'Rick Chavez Zbur', 'Democrat', 'Same person, AD-51'),
    -100073: (52, 'Jessica M. Caloza', 'Democrat', 'Jessica Caloza = Jessica M. Caloza, AD-52'),
    -100075: (53, 'Michelle Rodriguez', 'Democrat', 'Same person, AD-53'),
    -100077: (54, 'Mark Gonzalez', 'Democrat', 'Mark Gonzalez = Mark Gonzalez (accentless), AD-54'),
    -100079: (55, 'Isaac G. Bryan', 'Democrat', 'Same person, AD-55'),
    -100081: (56, 'Lisa Calderon', 'Democrat', 'Same person, AD-56'),
    -100083: (57, 'Sade Elhawary', 'Democrat', 'Same person, AD-57'),
    -100085: (61, 'Tina S. McKinnor', 'Democrat', 'Tina Simone McKinnor = Tina S. McKinnor, AD-61'),
    -100087: (62, 'Jose Luis Solache Jr.', 'Democrat', 'Jose Luis Solache = Jose Luis Solache Jr., AD-62'),
    -100089: (64, 'Blanca Pacheco', 'Democrat', 'Blanca Pachecco (typo) = Blanca Pacheco, AD-64'),
    -100091: (65, 'Mike A. Gipson', 'Democrat', 'Same person, AD-65'),
    -100093: (66, 'Al Muratsuchi', 'Democrat', 'Same person, AD-66'),
    -100095: (67, 'Sharon Quirk-Silva', 'Democrat', 'Same person, AD-67'),
    -100097: (69, 'Josh Lowenthal', 'Democrat', 'Same person, AD-69'),
    -100099: (29, 'Robert Rivas', 'Democrat', 'Susan Rubio left; AD-29 now Robert Rivas'),
    -100101: (38, 'Steve Bennett', 'Democrat', 'Suzette Martinez Valladares left; AD-38 now Steve Bennett'),
    -100103: (19, 'Catherine Stefani', 'Democrat', 'Benjamin Allen left; AD-19 now Catherine Stefani'),
    -100105: (45, 'James C. Ramos', 'Democrat', 'Sasha Renee Perez left; AD-45 now James C. Ramos'),
    -100107: (57, 'Sade Elhawary', 'Democrat', 'Maria Elena Durazo left; needs check - AD-57 already mapped to -100083'),
    -100109: (27, 'Esmeralda Z. Soria', 'Democrat', 'Henry Stern left; AD-27 now Esmeralda Z. Soria'),
    -100111: (55, 'Isaac G. Bryan', 'Democrat', 'Lola Smallwood-Cuevas left; needs check - AD-55 already mapped'),
    -100113: (30, 'Dawn Addis', 'Democrat', 'Bob Archuleta left; AD-30 now Dawn Addis'),
    -100115: (68, 'Avelino Valencia', 'Democrat', 'Lena A. Gonzalez left; AD-68 now Avelino Valencia'),
    -100117: (60, 'Dr. Corey A. Jackson', 'Democrat', 'Thomas J. Umberg left; AD-60 now Dr. Corey A. Jackson'),
    -100119: (20, 'Liz Ortega', 'Democrat', 'Laura Richardson left; AD-20 now Liz Ortega'),
}

print("NOTE: The manual_map above has conflicts that need resolution.")
print("Several pre-existing rows map to members who NO LONGER hold those seats.")
print("The pre-existing rows represent FORMER members - we need to either:")
print("1. Keep the politician rows and just re-key them (they'll be is_incumbent=true but wrong person)")
print("2. Update their names to current members")
print()
print("CRITICAL QUESTION: Should we REPLACE the name to the current member, or keep old name?")
print("The plan says 'UPDATE external_ids for pre-existing rows' - just re-key external_id")
print("But if Tony Vazquez no longer represents AD-50 (now Robert Garcia), the politician row")
print("should NOT be linked to AD-50 as is_incumbent=true with Tony Vazquez's name.")
print()

# Actually, re-reading the plan: the goal is to re-key existing rows AND fill gaps
# The pre-existing rows are assembly members seeded from prior work.
# If the person in the pre-existing row (e.g. Tony Vazquez) is no longer the rep,
# we need to:
# - Keep Tony Vazquez row but deactivate it
# - Insert Robert Garcia as new incumbent
# OR the pre-existing row already IS the wrong person - we need to identify
# which districts these 36 rows were INTENDED to represent

# Looking at names that are clearly still current:
still_current = {
    -100051: 34,  # Tom Lackey -> AD-34 (confirmed on roster)
    -100053: 39,  # Juan Carrillo -> AD-39
    -100055: 40,  # Pilar Schiavo -> AD-40
    -100057: 41,  # John Harabedian -> AD-41
    -100059: 42,  # Jacqui Irwin -> AD-42
    -100061: 43,  # Celeste Rodriguez -> AD-43
    -100063: 44,  # Nick Schultz -> AD-44
    -100065: 46,  # Jesse Gabriel -> AD-46
    -100067: 48,  # Blanca Rubio -> AD-48
    -100069: 49,  # Mike Fong -> AD-49
    -100071: 51,  # Rick Chavez Zbur -> AD-51
    -100073: 52,  # Jessica Caloza -> AD-52
    -100075: 53,  # Michelle Rodriguez -> AD-53
    -100077: 54,  # Mark Gonzalez -> AD-54 (accent on canonical, but same person)
    -100079: 55,  # Isaac G. Bryan -> AD-55
    -100081: 56,  # Lisa Calderon -> AD-56
    -100083: 57,  # Sade Elhawary -> AD-57
    -100085: 61,  # Tina Simone McKinnor -> AD-61 (name diff but same person)
    -100087: 62,  # Jose Luis Solache -> AD-62
    -100089: 64,  # Blanca Pachecco -> AD-64 (typo in DB, same person)
    -100091: 65,  # Mike A. Gipson -> AD-65
    -100093: 66,  # Al Muratsuchi -> AD-66
    -100095: 67,  # Sharon Quirk-Silva -> AD-67
    -100097: 69,  # Josh Lowenthal -> AD-69
}

# Former members (need verification - were they ORIGINALLY in different districts?)
former_member_rows = {
    -100049: 'Tony Vazquez',    # Not on current roster
    -100099: 'Susan Rubio',     # Not on current roster
    -100101: 'Suzette Martinez Valladares',  # Not on current roster
    -100103: 'Benjamin Allen',   # Not on current roster
    -100105: 'Sasha Renee Perez', # Not on current roster
    -100107: 'Maria Elena Durazo', # Not on current roster
    -100109: 'Henry Stern',     # Not on current roster
    -100111: 'Lola Smallwood-Cuevas', # Not on current roster
    -100113: 'Bob Archuleta',   # Not on current roster
    -100115: 'Lena A. Gonzalez',   # Not on current roster - NOTE: different from Jeff Gonzalez AD-36
    -100117: 'Thomas J. Umberg',   # Not on current roster
    -100119: 'Laura Richardson',   # Not on current roster
}

print("=== STILL CURRENT (24 members) ===")
for ext_id, district in sorted(still_current.items()):
    name = dict(pre_existing)[ext_id]
    new_ext = -6002000 - district
    print(f"  UPDATE {ext_id} -> {new_ext} (AD-{district:02d}) [{name}]")

print()
print("=== FORMER MEMBERS (12 rows) - need district assignment ===")
for ext_id, name in sorted(former_member_rows.items()):
    print(f"  {ext_id}: {name}")
