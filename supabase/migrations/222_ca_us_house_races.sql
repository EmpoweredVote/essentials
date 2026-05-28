-- Migration 222: Insert 52 CA US House race rows for CA 2026 Statewide General election
-- Each row: one per congressional district, office_id from verified DB table (2026-05-28)
-- CD-29 uses office_id a2fe1b46 (Luz Rivas, active) — NOT ebee1293 (Cárdenas, is_vacant=true)
-- Existing CD-34 row (linked to LA County Primary) is left as-is; this adds a new CD-34 general race

WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = 'CA 2026 Statewide General'
)
INSERT INTO essentials.races (id, election_id, office_id, position_name, seats)
SELECT gen_random_uuid(), gen_elec.id, t.office_id_val::uuid, t.position_name_val, 1
FROM gen_elec, (VALUES
  ('095d8394-1b09-4009-8221-1fa5916405ac', 'U.S. Representative District 1'),
  ('5a4d85ca-6c91-45d3-ad9a-6fbe81e17cf2', 'U.S. Representative District 2'),
  ('d83af640-8f1a-48ed-96ee-8a08e21a37f1', 'U.S. Representative District 3'),
  ('2d2770c7-9493-4cc4-9326-9a56182103c8', 'U.S. Representative District 4'),
  ('c1fc046c-5d90-426f-985f-f87587a33898', 'U.S. Representative District 5'),
  ('4bf25567-a4ec-4038-a724-dd421630bdd5', 'U.S. Representative District 6'),
  ('f5847ebc-0f8b-4ca3-8639-6c196f3a1a26', 'U.S. Representative District 7'),
  ('ecaffbe8-258a-4408-8c04-a84ace6093dc', 'U.S. Representative District 8'),
  ('25e8dc7b-186a-4c5c-b707-7eb2bfbc0a53', 'U.S. Representative District 9'),
  ('aedf1793-7a41-417c-bba2-588b54f60ff5', 'U.S. Representative District 10'),
  ('dea9d19c-5379-4975-9db5-fbb920184220', 'U.S. Representative District 11'),
  ('c612fb81-ad92-46cf-9447-53a2f995bf94', 'U.S. Representative District 12'),
  ('b44d155a-12ea-42f0-a11b-41abddc809fd', 'U.S. Representative District 13'),
  ('4cb713ee-8764-41b7-828b-19d42abefaaf', 'U.S. Representative District 14'),
  ('3cd4d6d6-86d1-4bbb-b18e-b31b4cd43a07', 'U.S. Representative District 15'),
  ('1dc07ba5-f29c-4593-b823-7261716fe51e', 'U.S. Representative District 16'),
  ('a2846ba5-67c3-4be2-9cad-3a3415507a48', 'U.S. Representative District 17'),
  ('f4b7fac5-5190-4b50-8cff-e97f4ec4f5a9', 'U.S. Representative District 18'),
  ('c52496b6-1068-4f98-a0b5-41d91dc1b79f', 'U.S. Representative District 19'),
  ('b835ea6d-f084-49c3-a129-24057206f434', 'U.S. Representative District 20'),
  ('17e5ef67-b8f8-4f77-89c5-61afcfc6523e', 'U.S. Representative District 21'),
  ('152a70fe-b4ac-4e38-98ce-777cf65899db', 'U.S. Representative District 22'),
  ('db0f5990-cebb-4d26-bd9b-b2a775941a5c', 'U.S. Representative District 23'),
  ('79f6c23a-2572-4d93-9500-e3c5ae880454', 'U.S. Representative District 24'),
  ('dc5c64c0-eac1-4cc8-9627-ba0d2ff098c9', 'U.S. Representative District 25'),
  ('0a61e7f7-faaf-4275-8334-5c6b7edb9c56', 'U.S. Representative District 26'),
  ('5e971ab3-133a-443e-a5bb-8fff66dec9a4', 'U.S. Representative District 27'),
  ('08840d87-f911-4c99-8407-a5496cac29fe', 'U.S. Representative District 28'),
  ('a2fe1b46-d105-4239-8560-0aff0f8f9808', 'U.S. Representative District 29'),
  ('a54f1dd9-aaef-4639-8a24-fc1babfa358e', 'U.S. Representative District 30'),
  ('e1e70721-7c53-4240-95a5-7a9dba3a182b', 'U.S. Representative District 31'),
  ('46316d22-43d0-48c1-8e33-00ab1055f83d', 'U.S. Representative District 32'),
  ('4aedab90-c243-4314-9517-b20a34a31fbf', 'U.S. Representative District 33'),
  ('4e1ab309-a5d2-4c98-9a0d-11034f4896b2', 'U.S. Representative District 34'),
  ('82969f05-8a43-478c-a3c5-dd051c2d12b7', 'U.S. Representative District 35'),
  ('4116447a-ba79-497e-81d2-7ed96632765f', 'U.S. Representative District 36'),
  ('6cc8867b-f823-4eb1-a7ba-05a2ceb1f1fa', 'U.S. Representative District 37'),
  ('579c06e1-9bf8-4ab5-b87b-da1d1366d682', 'U.S. Representative District 38'),
  ('ba2ace24-b043-4d43-9d0b-df043b158d36', 'U.S. Representative District 39'),
  ('40570178-ccae-4197-8b26-354d035ddd41', 'U.S. Representative District 40'),
  ('018f5541-e125-4a1c-b30a-ecfae1da1072', 'U.S. Representative District 41'),
  ('6c9613d8-54e6-40d7-88e2-1140e72687a3', 'U.S. Representative District 42'),
  ('37658309-3b83-4b7e-821c-4a95e3d73944', 'U.S. Representative District 43'),
  ('848404b6-3d2d-4e84-a8f3-27acffabef3f', 'U.S. Representative District 44'),
  ('6cff20cd-243b-452c-a287-a04bd301ddee', 'U.S. Representative District 45'),
  ('ae9b2b49-e367-4326-9604-66aca2f9899c', 'U.S. Representative District 46'),
  ('1bdcb754-08cf-40e5-9509-ee873fb518ae', 'U.S. Representative District 47'),
  ('c0f5cf4c-00f6-4d7b-b854-99497367ac1f', 'U.S. Representative District 48'),
  ('92db9e60-fca5-4e3f-9138-29c89c04abe9', 'U.S. Representative District 49'),
  ('6f1c0534-80f8-440d-b5a7-33dc157c460c', 'U.S. Representative District 50'),
  ('80bee97f-21af-4587-9977-58727f060746', 'U.S. Representative District 51'),
  ('994f6391-b0a9-428c-bf55-fa56c23e09b8', 'U.S. Representative District 52')
) AS t(office_id_val, position_name_val)
ON CONFLICT DO NOTHING;
