import { useEffect, useState } from "react";
import { SITE_INFO } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";

export type HeroDisplayMode = "single" | "carousel";
export type HeroLayout = "overlay" | "image-only";

export interface SiteSettings {
  siteName: string;
  logoUrl: string | null;
  heroDisplayMode: HeroDisplayMode;
  heroLayout: HeroLayout;
}

export const defaultSiteSettings: SiteSettings = {
  siteName: SITE_INFO.villageName,
  logoUrl: null,
  heroDisplayMode: "carousel",
  heroLayout: "overlay",
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("site_name,logo_url,hero_display_mode,hero_layout")
      .eq("key", "main")
      .maybeSingle();

    if (data) {
      setSettings({
        siteName: data.site_name || defaultSiteSettings.siteName,
        logoUrl: data.logo_url || null,
        heroDisplayMode: data.hero_display_mode === "single" ? "single" : "carousel",
        heroLayout: data.hero_layout === "image-only" ? "image-only" : "overlay",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, reload: load };
};