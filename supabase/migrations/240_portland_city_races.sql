-- Migration 240: Portland City Races for OR 2026 General — Phase 79 Plan 04
-- D-07 corrected: Portland D3/D4/Auditor ARE on 2026 ballot (2-year terms from 2024 charter stagger)
-- Mayor Wilson + D1 + D2 NOT up in 2026 (4-year terms)

DO $$
DECLARE
  v_general_id UUID;
BEGIN
  SELECT id INTO v_general_id FROM essentials.elections
  WHERE name = 'OR 2026 General' AND state = 'OR';

  -- District 3: Three seats (Seat A/B/C — each links to one of 3 identical offices, enumerated by ORDER BY o.id OFFSET)
  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-3'
     ORDER BY o.id LIMIT 1 OFFSET 0),
    'Portland City Council District 3 Seat A', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-3'
     ORDER BY o.id LIMIT 1 OFFSET 1),
    'Portland City Council District 3 Seat B', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-3'
     ORDER BY o.id LIMIT 1 OFFSET 2),
    'Portland City Council District 3 Seat C', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  -- District 4: Three seats (Seat A/B/C — same enumeration pattern)
  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-4'
     ORDER BY o.id LIMIT 1 OFFSET 0),
    'Portland City Council District 4 Seat A', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-4'
     ORDER BY o.id LIMIT 1 OFFSET 1),
    'Portland City Council District 4 Seat B', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    (SELECT o.id FROM essentials.offices o
     JOIN essentials.districts d ON d.id = o.district_id
     WHERE d.geo_id = 'portland-or-council-district-4'
     ORDER BY o.id LIMIT 1 OFFSET 2),
    'Portland City Council District 4 Seat C', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

  -- City Auditor (hardcoded office_id from Phase 77 — a19813f9-ee4d-442d-b052-5c2f9f7db9c8)
  INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
  VALUES (gen_random_uuid(), v_general_id,
    'a19813f9-ee4d-442d-b052-5c2f9f7db9c8'::uuid,
    'Portland City Auditor', NULL, 1)
  ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;

END $$;
