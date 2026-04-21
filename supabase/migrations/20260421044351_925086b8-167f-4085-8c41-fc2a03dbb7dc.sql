CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY DEFAULT 'main',
  site_name TEXT NOT NULL DEFAULT 'หมู่บ้านแซร์ออ หมู่ที่ 2',
  logo_url TEXT,
  hero_display_mode TEXT NOT NULL DEFAULT 'carousel',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT site_settings_singleton CHECK (key = 'main'),
  CONSTRAINT site_settings_hero_display_mode CHECK (hero_display_mode IN ('single', 'carousel'))
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings public read" ON public.site_settings;
CREATE POLICY "Site settings public read"
ON public.site_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Site settings admin write" ON public.site_settings;
CREATE POLICY "Site settings admin write"
ON public.site_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, site_name, hero_display_mode)
VALUES ('main', 'หมู่บ้านแซร์ออ หมู่ที่ 2', 'carousel')
ON CONFLICT (key) DO NOTHING;