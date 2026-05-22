-- Migration 200: Give LA County DA and Sheriff their own chambers so each
-- gets a clearly labeled section in the UI instead of "Los Angeles County Officers"

-- Section A: Create distinct chambers for DA and Sheriff
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT
  gen_random_uuid(),
  'Office of the District Attorney',
  'Office of the District Attorney',
  government_id
FROM essentials.chambers
WHERE id = 'cb7aabfd-5a91-4443-8092-e1ea21f75c70';

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT
  gen_random_uuid(),
  'Office of the Sheriff',
  'Office of the Sheriff',
  government_id
FROM essentials.chambers
WHERE id = 'cb7aabfd-5a91-4443-8092-e1ea21f75c70';

-- Section B: Add government_bodies entries so the API JOIN returns the right display names
INSERT INTO essentials.government_bodies (body_key, display_name, state, geo_id)
VALUES
  ('Office of the District Attorney', 'Office of the District Attorney', 'CA', '06037'),
  ('Office of the Sheriff',           'Office of the Sheriff',           'CA', '06037')
ON CONFLICT DO NOTHING;

-- Section C: Move Hochman's office to the DA chamber
UPDATE essentials.offices
SET chamber_id = (SELECT id FROM essentials.chambers WHERE name_formal = 'Office of the District Attorney' AND government_id = (SELECT government_id FROM essentials.chambers WHERE id = 'cb7aabfd-5a91-4443-8092-e1ea21f75c70'))
WHERE id = 'd0bb1ce7-6e10-442b-b8ca-cf68e77812e7';  -- Hochman District Attorney office

-- Section D: Move Luna's office to the Sheriff chamber
UPDATE essentials.offices
SET chamber_id = (SELECT id FROM essentials.chambers WHERE name_formal = 'Office of the Sheriff' AND government_id = (SELECT government_id FROM essentials.chambers WHERE id = 'cb7aabfd-5a91-4443-8092-e1ea21f75c70'))
WHERE id = 'dd507d10-a106-42e6-a275-2385154aa072';  -- Luna Sheriff office
