-- Migration 221: CA statewide elections + Governor race patch
-- Applied: 2026-05-28
-- Purpose: Create CA 2026 Statewide Primary + General election rows;
--          patch existing Governor race (bc936a36) to link to general election
--          with correct office_id. Governor race was previously linked to
--          LA County Primary (1ebca37f) with office_id=NULL — both wrong.

-- Task 1a: Insert CA 2026 Statewide Primary election row
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (gen_random_uuid(), 'CA 2026 Statewide Primary', '2026-06-02', 'primary', 'state', 'CA')
ON CONFLICT DO NOTHING;

-- Task 1b: Insert CA 2026 Statewide General election row
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (gen_random_uuid(), 'CA 2026 Statewide General', '2026-11-03', 'general', 'state', 'CA')
ON CONFLICT DO NOTHING;

-- Task 2: Patch Governor race to point to CA Statewide General + set office_id
-- Governor office_id '08454462-a1f0-4d11-9f61-aba7a173a3de' is title='Governor'
-- in the CA government (verified DB 2026-05-28).
-- UPDATE only changes election_id and office_id; 64 race_candidates remain untouched.
UPDATE essentials.races
SET election_id = (SELECT id FROM essentials.elections WHERE name = 'CA 2026 Statewide General'),
    office_id = '08454462-a1f0-4d11-9f61-aba7a173a3de'
WHERE id = 'bc936a36-287c-4ffd-abd8-5e4fd798bae5';
