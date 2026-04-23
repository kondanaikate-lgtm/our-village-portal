ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_autoplay_start TIME,
  ADD COLUMN IF NOT EXISTS hero_autoplay_end TIME,
  ADD COLUMN IF NOT EXISTS hero_respect_reduced_motion BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_height_aspect BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_aspect_ratio TEXT NOT NULL DEFAULT '16/9';