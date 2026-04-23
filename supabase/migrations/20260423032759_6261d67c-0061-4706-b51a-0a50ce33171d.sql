ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS hero_layout TEXT NOT NULL DEFAULT 'overlay';