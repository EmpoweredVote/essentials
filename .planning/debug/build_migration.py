#!/usr/bin/env python3
"""
Build migration 195 for CA State Assembly.

Pre-existing rows (36 total):
- 24 are still current members: just UPDATE external_id
- 12 are former/misidentified members: UPDATE to new current member data + assign to gap district
- 44 remaining districts: INSERT new rows

Assembly chamber already exists as 'Assembly' (not 'California State Assembly')
so Step 0 needs to handle this: update the name or use existing chamber.
"""

# Pre-existing rows still current (ext_id -> district)
still_current_map = {
    -100051: (34, 'Tom Lackey', 'Tom', 'Lackey', 'Republican'),
    -100053: (39, 'Juan Carrillo', 'Juan', 'Carrillo', 'Democrat'),
    -100055: (40, 'Pilar Schiavo', 'Pilar', 'Schiavo', 'Democrat'),
    -100057: (41, 'John Harabedian', 'John', 'Harabedian', 'Democrat'),
    -100059: (42, 'Jacqui Irwin', 'Jacqui', 'Irwin', 'Democrat'),
    -100061: (43, 'Celeste Rodriguez', 'Celeste', 'Rodriguez', 'Democrat'),
    -100063: (44, 'Nick Schultz', 'Nick', 'Schultz', 'Democrat'),
    -100065: (46, 'Jesse Gabriel', 'Jesse', 'Gabriel', 'Democrat'),
    -100067: (48, 'Blanca E. Rubio', 'Blanca E.', 'Rubio', 'Democrat'),
    -100069: (49, 'Mike Fong', 'Mike', 'Fong', 'Democrat'),
    -100071: (51, 'Rick Chavez Zbur', 'Rick Chavez', 'Zbur', 'Democrat'),
    -100073: (52, 'Jessica M. Caloza', 'Jessica M.', 'Caloza', 'Democrat'),
    -100075: (53, 'Michelle Rodriguez', 'Michelle', 'Rodriguez', 'Democrat'),
    -100077: (54, 'Mark Gonzalez', 'Mark', 'Gonzalez', 'Democrat'),
    -100079: (55, 'Isaac G. Bryan', 'Isaac G.', 'Bryan', 'Democrat'),
    -100081: (56, 'Lisa Calderon', 'Lisa', 'Calderon', 'Democrat'),
    -100083: (57, 'Sade Elhawary', 'Sade', 'Elhawary', 'Democrat'),
    -100085: (61, 'Tina S. McKinnor', 'Tina S.', 'McKinnor', 'Democrat'),
    -100087: (62, 'Jose Luis Solache Jr.', 'Jose Luis', 'Solache Jr.', 'Democrat'),
    -100089: (64, 'Blanca Pacheco', 'Blanca', 'Pacheco', 'Democrat'),
    -100091: (65, 'Mike A. Gipson', 'Mike A.', 'Gipson', 'Democrat'),
    -100093: (66, 'Al Muratsuchi', 'Al', 'Muratsuchi', 'Democrat'),
    -100095: (67, 'Sharon Quirk-Silva', 'Sharon', 'Quirk-Silva', 'Democrat'),
    -100097: (69, 'Josh Lowenthal', 'Josh', 'Lowenthal', 'Democrat'),
}

# Former member rows to be recycled for gap districts
# Format: old_ext_id -> (district, new_full_name, new_first, new_last, new_party)
former_member_recycle = {
    -100049: (50, 'Robert Garcia', 'Robert', 'Garcia', 'Democrat'),
    -100099: (48, None, None, None, None),  # CONFLICT: AD-48 taken by -100067
    -100101: (38, 'Steve Bennett', 'Steve', 'Bennett', 'Democrat'),
    -100103: (29, 'Robert Rivas', 'Robert', 'Rivas', 'Democrat'),  # Benjamin Allen was AD-26 before Senate
    -100105: (45, 'James C. Ramos', 'James C.', 'Ramos', 'Democrat'),  # Sasha Perez ran for AD-45? Actually no
    -100107: (27, 'Esmeralda Z. Soria', 'Esmeralda Z.', 'Soria', 'Democrat'),  # Durazo not assembly - reassign
    -100109: (37, 'Gregg Hart', 'Gregg', 'Hart', 'Democrat'),  # Stern was SD; reassign to gap AD-37
    -100111: (30, 'Dawn Addis', 'Dawn', 'Addis', 'Democrat'),  # Smallwood-Cuevas was AD-54 but that's taken
    -100113: (36, 'Jeff Gonzalez', 'Jeff', 'Gonzalez', 'Republican'),  # Archuleta was SD; reassign to AD-36
    -100115: (68, 'Avelino Valencia', 'Avelino', 'Valencia', 'Democrat'),  # Lena Gonzalez was SD; reassign
    -100117: (60, 'Dr. Corey A. Jackson', 'Dr. Corey A.', 'Jackson', 'Democrat'),  # Umberg was SD; reassign
    -100119: (20, 'Liz Ortega', 'Liz', 'Ortega', 'Democrat'),  # Richardson last assembly 2007; reassign
}

# Wait - Susan Rubio (-100099) maps to AD-48 which is ALREADY taken by -100067 (Blanca Rubio)
# So Susan Rubio's row needs a different district assignment
# Let me fix this:

# All covered districts after still_current:
covered = set(still_current_map[k][0] for k in still_current_map)
print("Covered after still_current:", sorted(covered))

# Gap districts (all 80 minus covered):
all_districts = set(range(1, 81))
gap_districts = sorted(all_districts - covered)
print(f"Gap districts ({len(gap_districts)}): {gap_districts}")
print()

# Now assign former member rows to gap districts, one per district
# Former member rows (12) need to cover 12 of the 56 gap districts
# Remaining 44 gap districts need INSERT rows

# Let me rebuild the recycle map more carefully, avoiding conflicts
# The 12 former member rows are: -100049, -100099, -100101, -100103, -100105, -100107, -100109, -100111, -100113, -100115, -100117, -100119

# I'll assign them to gap districts sequentially, picking districts that make historical sense:
# Susan Rubio (-100099): Previously AD-48, now taken. Next available from gaps.
# After fixing conflicts, assign to specific gap districts:

recycle_assignments = {}

# Historical context for former members:
# Tony Vazquez: AD-50 -> gap (recycle for Robert Garcia)
# Susan Rubio: was AD-48 before 2022 (different from Blanca E. Rubio). Reassign to another gap
# Suzette Martinez Valladares: AD-38 -> gap
# Benjamin Allen: was AD-26 (pre-2014), so assign to AD-26 gap (Patrick Ahrens now)
# Sasha Renee Perez: won AD-45? No - let's check: she ran for AD-41 in 2022 and won primary then lost general?
#   Actually Sasha Perez won AD-41 general in 2022 but Harabedian won in 2024.
#   The pre-seed was from ~2022 roster. But AD-41 is already taken by -100057 (John Harabedian).
#   So Sasha Perez (-100105) needs reassignment - use AD-45 (James Ramos)
# Maria Elena Durazo: was Senate SD-24, never assembly. Reassign to AD-24 (Alex Lee)? Or AD-27 (Soria)?
#   Let's use AD-35 (Bains)
# Henry Stern: was Senate SD-27. Not assembly. Reassign to AD-37 (Gregg Hart)
# Lola Smallwood-Cuevas: AD-54 but that's taken by -100077 (Mark Gonzalez).
#   Was AD-54 (2022-2024). AD-54 is taken. Assign to nearby uncovered district.
#   Let's use AD-36 (Jeff Gonzalez) -- NOTE: different Jeff/Lola; just recycling the politician row
# Bob Archuleta: was AD-59 (2008-2020). AD-59 is a gap. Assign to AD-59 (Phillip Chen)
# Lena A. Gonzalez: was AD-33 (2014-2018). AD-33 is a gap (Alexandra Macedo). Assign to AD-33
# Thomas J. Umberg: was AD-69 (1991-96, 2018-22). AD-69 is taken by -100097 (Josh Lowenthal).
#   Reassign to gap - use AD-60 (Dr. Corey A. Jackson)
# Laura Richardson: was AD-37 (2004-07). AD-37 is a gap (Gregg Hart).
#   But if we use AD-37 for Stern, then use AD-20 for Richardson (Liz Ortega)

# Final recycle assignments (old_ext_id -> new district):
recycle_final = [
    (-100049, 50),   # Tony Vazquez -> Robert Garcia (AD-50)
    (-100099, 19),   # Susan Rubio -> Catherine Stefani (AD-19)
    (-100101, 38),   # Suzette Martinez Valladares -> Steve Bennett (AD-38)
    (-100103, 26),   # Benjamin Allen -> Patrick J. Ahrens (AD-26)
    (-100105, 45),   # Sasha Renee Perez -> James C. Ramos (AD-45)
    (-100107, 35),   # Maria Elena Durazo -> Jasmeet Kaur Bains (AD-35)
    (-100109, 37),   # Henry Stern -> Gregg Hart (AD-37)
    (-100111, 36),   # Lola Smallwood-Cuevas -> Jeff Gonzalez (AD-36)
    (-100113, 59),   # Bob Archuleta -> Phillip Chen (AD-59)
    (-100115, 33),   # Lena A. Gonzalez -> Alexandra M. Macedo (AD-33)
    (-100117, 60),   # Thomas J. Umberg -> Dr. Corey A. Jackson (AD-60)
    (-100119, 20),   # Laura Richardson -> Liz Ortega (AD-20)
]

# Verify no duplicate district assignments
recycle_districts = [d for _, d in recycle_final]
assert len(recycle_districts) == len(set(recycle_districts)), "Duplicate recycle districts!"
all_assigned = covered | set(recycle_districts)
print(f"Districts covered after still_current + recycle: {len(all_assigned)}")

# Remaining gap districts need INSERT
remaining_gaps = sorted(all_districts - all_assigned)
print(f"Remaining gap districts for INSERT ({len(remaining_gaps)}): {remaining_gaps}")
print()

# Full roster for new INSERTs
roster = {
    1: ('Heather Hadwick', 'Heather', 'Hadwick', 'Republican'),
    2: ('Chris Rogers', 'Chris', 'Rogers', 'Democrat'),
    3: ('James Gallagher', 'James', 'Gallagher', 'Republican'),
    4: ('Cecilia M. Aguiar-Curry', 'Cecilia M.', 'Aguiar-Curry', 'Democrat'),
    5: ('Joe Patterson', 'Joe', 'Patterson', 'Republican'),
    6: ('Maggy Krell', 'Maggy', 'Krell', 'Democrat'),
    7: ('Josh Hoover', 'Josh', 'Hoover', 'Republican'),
    8: ('David J. Tangipa', 'David J.', 'Tangipa', 'Republican'),
    9: ('Heath Flora', 'Heath', 'Flora', 'Republican'),
    10: ('Stephanie Nguyen', 'Stephanie', 'Nguyen', 'Democrat'),
    11: ('Lori D. Wilson', 'Lori D.', 'Wilson', 'Democrat'),
    12: ('Damon Connolly', 'Damon', 'Connolly', 'Democrat'),
    13: ('Rhodesia Ransom', 'Rhodesia', 'Ransom', 'Democrat'),
    14: ('Buffy Wicks', 'Buffy', 'Wicks', 'Democrat'),
    15: ('Anamarie Avila Farias', 'Anamarie', 'Avila Farias', 'Democrat'),
    16: ('Rebecca Bauer-Kahan', 'Rebecca', 'Bauer-Kahan', 'Democrat'),
    17: ('Matt Haney', 'Matt', 'Haney', 'Democrat'),
    18: ('Mia Bonta', 'Mia', 'Bonta', 'Democrat'),
    19: ('Catherine Stefani', 'Catherine', 'Stefani', 'Democrat'),
    20: ('Liz Ortega', 'Liz', 'Ortega', 'Democrat'),
    21: ('Diane Papan', 'Diane', 'Papan', 'Democrat'),
    22: ('Juan Alanis', 'Juan', 'Alanis', 'Republican'),
    23: ('Marc Berman', 'Marc', 'Berman', 'Democrat'),
    24: ('Alex Lee', 'Alex', 'Lee', 'Democrat'),
    25: ('Ash Kalra', 'Ash', 'Kalra', 'Democrat'),
    26: ('Patrick J. Ahrens', 'Patrick J.', 'Ahrens', 'Democrat'),
    27: ('Esmeralda Z. Soria', 'Esmeralda Z.', 'Soria', 'Democrat'),
    28: ('Gail Pellerin', 'Gail', 'Pellerin', 'Democrat'),
    29: ('Robert Rivas', 'Robert', 'Rivas', 'Democrat'),
    30: ('Dawn Addis', 'Dawn', 'Addis', 'Democrat'),
    31: ('Dr. Joaquin Arambula', 'Dr. Joaquin', 'Arambula', 'Democrat'),
    32: ('Stan Ellis', 'Stan', 'Ellis', 'Republican'),
    33: ('Alexandra M. Macedo', 'Alexandra M.', 'Macedo', 'Republican'),
    34: ('Tom Lackey', 'Tom', 'Lackey', 'Republican'),
    35: ('Jasmeet Kaur Bains', 'Jasmeet Kaur', 'Bains', 'Democrat'),
    36: ('Jeff Gonzalez', 'Jeff', 'Gonzalez', 'Republican'),
    37: ('Gregg Hart', 'Gregg', 'Hart', 'Democrat'),
    38: ('Steve Bennett', 'Steve', 'Bennett', 'Democrat'),
    39: ('Juan Carrillo', 'Juan', 'Carrillo', 'Democrat'),
    40: ('Pilar Schiavo', 'Pilar', 'Schiavo', 'Democrat'),
    41: ('John Harabedian', 'John', 'Harabedian', 'Democrat'),
    42: ('Jacqui Irwin', 'Jacqui', 'Irwin', 'Democrat'),
    43: ('Celeste Rodriguez', 'Celeste', 'Rodriguez', 'Democrat'),
    44: ('Nick Schultz', 'Nick', 'Schultz', 'Democrat'),
    45: ('James C. Ramos', 'James C.', 'Ramos', 'Democrat'),
    46: ('Jesse Gabriel', 'Jesse', 'Gabriel', 'Democrat'),
    47: ('Greg Wallis', 'Greg', 'Wallis', 'Republican'),
    48: ('Blanca E. Rubio', 'Blanca E.', 'Rubio', 'Democrat'),
    49: ('Mike Fong', 'Mike', 'Fong', 'Democrat'),
    50: ('Robert Garcia', 'Robert', 'Garcia', 'Democrat'),
    51: ('Rick Chavez Zbur', 'Rick Chavez', 'Zbur', 'Democrat'),
    52: ('Jessica M. Caloza', 'Jessica M.', 'Caloza', 'Democrat'),
    53: ('Michelle Rodriguez', 'Michelle', 'Rodriguez', 'Democrat'),
    54: ('Mark Gonzalez', 'Mark', 'Gonzalez', 'Democrat'),
    55: ('Isaac G. Bryan', 'Isaac G.', 'Bryan', 'Democrat'),
    56: ('Lisa Calderon', 'Lisa', 'Calderon', 'Democrat'),
    57: ('Sade Elhawary', 'Sade', 'Elhawary', 'Democrat'),
    58: ('Leticia Castillo', 'Leticia', 'Castillo', 'Republican'),
    59: ('Phillip Chen', 'Phillip', 'Chen', 'Republican'),
    60: ('Dr. Corey A. Jackson', 'Dr. Corey A.', 'Jackson', 'Democrat'),
    61: ('Tina S. McKinnor', 'Tina S.', 'McKinnor', 'Democrat'),
    62: ('Jose Luis Solache Jr.', 'Jose Luis', 'Solache Jr.', 'Democrat'),
    63: ('Natasha Johnson', 'Natasha', 'Johnson', 'Republican'),
    64: ('Blanca Pacheco', 'Blanca', 'Pacheco', 'Democrat'),
    65: ('Mike A. Gipson', 'Mike A.', 'Gipson', 'Democrat'),
    66: ('Al Muratsuchi', 'Al', 'Muratsuchi', 'Democrat'),
    67: ('Sharon Quirk-Silva', 'Sharon', 'Quirk-Silva', 'Democrat'),
    68: ('Avelino Valencia', 'Avelino', 'Valencia', 'Democrat'),
    69: ('Josh Lowenthal', 'Josh', 'Lowenthal', 'Democrat'),
    70: ('Tri Ta', 'Tri', 'Ta', 'Republican'),
    71: ('Kate Sanchez', 'Kate', 'Sanchez', 'Republican'),
    72: ('Diane B. Dixon', 'Diane B.', 'Dixon', 'Republican'),
    73: ('Cottie Petrie-Norris', 'Cottie', 'Petrie-Norris', 'Democrat'),
    74: ('Laurie Davies', 'Laurie', 'Davies', 'Republican'),
    75: ('Carl DeMaio', 'Carl', 'DeMaio', 'Republican'),
    76: ('Dr. Darshana R. Patel', 'Dr. Darshana R.', 'Patel', 'Democrat'),
    77: ('Tasha Boerner', 'Tasha', 'Boerner', 'Democrat'),
    78: ('Christopher M. Ward', 'Christopher M.', 'Ward', 'Democrat'),
    79: ('Dr. LaShae Sharp-Collins', 'Dr. LaShae', 'Sharp-Collins', 'Democrat'),
    80: ('David A. Alvarez', 'David A.', 'Alvarez', 'Democrat'),
}

# Print summary
print("=== STILL CURRENT UPDATE LIST (24 rows) ===")
for old_ext, (district, full, first, last, party) in sorted(still_current_map.items()):
    new_ext = -6002000 - district
    print(f"  UPDATE {old_ext} -> {new_ext} (AD-{district:02d}) [{full}]")
    # Also note if name needs fixing
    if old_ext == -100067:
        print(f"    NOTE: DB has 'Blanca Rubio', update to 'Blanca E. Rubio'")
    if old_ext == -100073:
        print(f"    NOTE: DB has 'Jessica Caloza', update to 'Jessica M. Caloza'")
    if old_ext == -100077:
        print(f"    NOTE: DB has 'Mark Gonzalez', roster has 'Mark González' (accent) - keep as is")
    if old_ext == -100085:
        print(f"    NOTE: DB has 'Tina Simone McKinnor', update to 'Tina S. McKinnor'")
    if old_ext == -100087:
        print(f"    NOTE: DB has 'Jose Luis Solache', update to 'Jose Luis Solache Jr.'")
    if old_ext == -100089:
        print(f"    NOTE: DB has 'Blanca Pachecco' (typo), update to 'Blanca Pacheco'")

print()
print("=== RECYCLE UPDATE LIST (12 former member rows) ===")
for old_ext, district in recycle_final:
    new_ext = -6002000 - district
    full, first, last, party = roster[district]
    print(f"  UPDATE {old_ext} -> {new_ext} (AD-{district:02d}) [{full}]")

print()
print("=== INSERT LIST (44 new rows) ===")
for district in remaining_gaps:
    new_ext = -6002000 - district
    full, first, last, party = roster[district]
    geo_id = f"06{district:03d}"
    print(f"  INSERT AD-{district:02d}: {full} ({party}) -> {new_ext} [geo_id={geo_id}]")

print()
print(f"Total: {len(still_current_map)} updates (still current) + {len(recycle_final)} recycles + {len(remaining_gaps)} inserts = {len(still_current_map)+len(recycle_final)+len(remaining_gaps)}")
