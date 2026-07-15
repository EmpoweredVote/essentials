-- Migration 878: Link 2026 U.S. Senate races to their correct NATIONAL_UPPER seat office.
--
-- WHY: 51 `U.S. Senate %` races (35 distinct states) were seeded with office_id IS NULL,
--   so their candidates never surface by address (the address -> district -> office -> race
--   join has no office to hang on). This sets each state's 2026 Senate race office_id to that
--   state's single real NATIONAL_UPPER seat office, matching how House races already resolve.
--
-- SCOPE: Mutates ONLY essentials.races.office_id. No office/district/politician/race_candidate
--   row is created, deleted, or altered. House races are untouched.
--
-- IDEMPOTENCY: Guarded by "AND r.office_id IS NULL" so re-running this migration is a safe no-op
--   (already-linked rows are skipped). No INSERT/DELETE/DDL.
--
-- LINK TARGETS ARE REAL SEAT OFFICES ONLY: every office_id below is a real seat office titled
--   'Senator' (31 states) or 'U.S. Senate - {State}' (Maine, Massachusetts, Oregon, Texas).
--   NONE is a stray 'Candidate for U.S. Senate - {State}' office (those 52 rows are never linked;
--   D-07 scope guard). The join key is the full-state-name position_name, e.g.
--   'U.S. Senate Minnesota' (no abbreviation, no dash), linking by stable office_id only.
--
-- SPECIAL ELECTIONS (2026): two seats are special elections filling a vacated seat, flagged here
--   for the review record but linked identically to a real NATIONAL_UPPER seat office:
--     Ohio    -> Jon Husted   (SPECIAL: filling JD Vance's vacated seat)
--     Florida -> Ashley Moody (SPECIAL: filling Marco Rubio's vacated seat)
--
-- SEAT MAP SOURCE: derived + human-approved 35-row map from
--   .planning/phases/205-u-s-senate-2026-candidate-wiring/205-RESEARCH.md
--   `## The Derived 2026 Seat Map` (UUIDs copied verbatim; VERIFIED against live prod 2026-07-15).

UPDATE essentials.races AS r
SET office_id = v.office_id::uuid
FROM (VALUES
  ('U.S. Senate Alabama',        'dd596029-1a44-4bc6-97da-545b864e46c5'),
  ('U.S. Senate Alaska',         '8fe392b4-a639-4349-a2b7-bb3a63a32416'),
  ('U.S. Senate Arkansas',       '4df196c4-4b12-4d11-b295-c37c2ab190d1'),
  ('U.S. Senate Colorado',       '7c735887-cab8-47b1-9634-8e5f48d363f1'),
  ('U.S. Senate Delaware',       'b5cd6e9c-4da3-4768-8633-346a170e3ee0'),
  ('U.S. Senate Florida',        '0cd42c43-f72d-474c-87d7-e2682fd95e46'),  -- SPECIAL (Moody, Rubio's seat)
  ('U.S. Senate Georgia',        '8116f4a3-d161-4d9b-a83c-0b9470ace42c'),
  ('U.S. Senate Idaho',          '8f590ee2-5e18-47b8-ba41-ff1933a6e866'),
  ('U.S. Senate Illinois',       '6d582deb-95f5-4e9f-a904-7d35eb96142d'),
  ('U.S. Senate Iowa',           '79e7b0db-6843-4949-b128-712aa3aae9cc'),
  ('U.S. Senate Kansas',         '40481651-6a62-4046-8398-f23dfcf26428'),
  ('U.S. Senate Kentucky',       '6578f1bb-e37d-4615-8433-34b514179017'),
  ('U.S. Senate Louisiana',      'b7e7c556-8bba-4f39-8f1e-655ac60ac899'),
  ('U.S. Senate Maine',          '50b86543-956e-40a1-9e17-7fb9a6f7561d'),
  ('U.S. Senate Massachusetts',  '215e8e94-ab07-4ca8-b7a1-ccf7aec0c4f4'),
  ('U.S. Senate Michigan',       '1bb21d97-918a-48cb-bc8f-f34cb3a404bc'),
  ('U.S. Senate Minnesota',      'e2630486-5610-49c6-9da2-0af0e335b7c2'),
  ('U.S. Senate Mississippi',    'f6398c92-57e8-4e45-9a4b-0131bf40e332'),
  ('U.S. Senate Montana',        '24c4c340-d9e3-4466-a60e-b4bc19dc9b2b'),
  ('U.S. Senate Nebraska',       'd166af4e-8d84-4797-a60c-4a67eb263446'),
  ('U.S. Senate New Hampshire',  'd37cdff2-581d-43c4-af45-1351a309618a'),
  ('U.S. Senate New Jersey',     '9421c941-170b-42d8-bf15-2f52f3caefd9'),
  ('U.S. Senate New Mexico',     '493f3449-255f-42ed-be32-51f52d2a88b6'),
  ('U.S. Senate North Carolina', '38104a44-0f20-4ad5-9aab-e841f022215c'),
  ('U.S. Senate Ohio',           'd85572a3-835d-4b02-916d-9ff7688856fa'),  -- SPECIAL (Husted, Vance's seat)
  ('U.S. Senate Oklahoma',       '68c01d20-17f3-424a-936e-02107dd79fe8'),
  ('U.S. Senate Oregon',         '3db3e08a-ed6c-4365-9e5a-9af1f94c4372'),
  ('U.S. Senate Rhode Island',   '61172e93-e725-478f-a41e-891ef715ec2e'),
  ('U.S. Senate South Carolina', 'af90499c-0219-4a7a-bd89-fb9ac20392ae'),
  ('U.S. Senate South Dakota',   '42941c6c-b7b7-47c3-9ebb-b375da114ae6'),
  ('U.S. Senate Tennessee',      '40c5e020-ba3b-45a9-a7a1-baf14717adf7'),
  ('U.S. Senate Texas',          '61aa4e58-15d9-43ad-857a-72c624f7d8df'),
  ('U.S. Senate Virginia',       '6204cbda-f055-46db-962d-98ddf945060e'),
  ('U.S. Senate West Virginia',  '1740c53e-51a3-40bb-b995-803486355279'),
  ('U.S. Senate Wyoming',        '75eef8b5-4b9c-49bf-8951-76e4fefb53e9')
) AS v(position_name, office_id)
WHERE r.position_name = v.position_name
  AND r.office_id IS NULL;

-- SKIP REPORT (REQ-4): 0 states skipped. All 35 distinct `U.S. Senate %` states present in
--   essentials.races map 1:1 onto the public 2026 Class-2 (33) + special-election (2: OH, FL)
--   list with zero extras and zero omissions on either side (VERIFIED, RESEARCH 2026-07-15).
--   No state was omitted from the VALUES map above for low confidence; therefore none remains
--   deliberately office_id NULL. Any `U.S. Senate %` row left NULL after apply is an unexpected
--   join miss (e.g. an unforeseen position_name spelling), not a documented skip.
