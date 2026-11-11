-- Run this once in Supabase > SQL Editor before deploying the updated website.
-- It preserves existing products and existing image_url values.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS long_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fragrance_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inspired_by text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS longevity text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS best_for text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS how_to_use text NOT NULL DEFAULT '';

UPDATE public.products
SET gallery_urls = CASE
  WHEN image_url IS NOT NULL AND image_url <> ''
    AND (gallery_urls IS NULL OR gallery_urls = '[]'::jsonb)
  THEN jsonb_build_array(image_url)
  ELSE COALESCE(gallery_urls, '[]'::jsonb)
END;
