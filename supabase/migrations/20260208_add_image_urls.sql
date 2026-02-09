-- Add image_urls column
ALTER TABLE items ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing image_url to image_urls
UPDATE items 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';
