-- First, add the fees column as JSONB with a default empty array
ALTER TABLE quotes 
ADD COLUMN fees JSONB DEFAULT '[]'::jsonb;

-- Then, update existing quotes to initialize their fees array with all fee types
UPDATE quotes
SET fees = jsonb_build_array(
  jsonb_build_object('name', 'delivery', 'price', 0, 'enabled', false, 'description', ''),
  jsonb_build_object('name', 'pickup', 'price', 0, 'enabled', false, 'description', ''),
  jsonb_build_object('name', 'table_service', 'price', 0, 'enabled', false, 'description', ''),
  jsonb_build_object('name', 'retrieval', 'price', 0, 'enabled', false, 'description', ''),
  jsonb_build_object('name', 'marquee_setup', 'price', 0, 'enabled', false, 'description', ''),
  jsonb_build_object('name', 'marquee_dismantling', 'price', 0, 'enabled', false, 'description', ''),
  jsonb_build_object('name', 'decoration', 'price', 0, 'enabled', false, 'description', '')
)
WHERE fees IS NULL OR fees = '[]'::jsonb;