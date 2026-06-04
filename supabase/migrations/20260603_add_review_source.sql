ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';
-- Backfill existing editor reviews
UPDATE reviews SET source = 'editor' WHERE user_id IN (
  'c131993d-8710-43f9-91ef-fb194d7113c0',
  '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
  '8d0cf351-70ee-428c-bc76-164f1ee1b929',
  '21b72dfb-882c-44ec-afc0-3a7f5391af70',
  '4cc6e534-b024-4bf4-bd26-c382412e5802',
  '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
  'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
  '1a089886-3a67-4332-8fc9-849561897b8c',
  '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8'
);
