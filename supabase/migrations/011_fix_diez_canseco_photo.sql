-- Fix incorrect photo for Francisco Diez-Canseco Távara
-- The previous photo was from a 19th century historical figure with the same name

UPDATE candidates
SET photo_url = NULL
WHERE slug = 'francisco-diez-canseco-tavara';
