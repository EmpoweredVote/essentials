-- Migration 199: LAUSD board office title district labels
-- Set titles to 'Board Member (District N)' to disambiguate districts in UI.

UPDATE essentials.offices
SET title = 'Board Member (District ' || d.num || ')'
FROM (VALUES
  ('lausd-board-district-1', 1),
  ('lausd-board-district-2', 2),
  ('lausd-board-district-3', 3),
  ('lausd-board-district-4', 4),
  ('lausd-board-district-5', 5),
  ('lausd-board-district-6', 6),
  ('lausd-board-district-7', 7)
) AS d(geo_id, num)
JOIN essentials.districts dist ON dist.geo_id = d.geo_id
WHERE essentials.offices.district_id = dist.id
  AND essentials.offices.title = 'Board Member';
