import { useEffect, useState } from "react";
import { SITE_INFO } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";

export type HeroDisplayMode = "single" | "carousel";
export type HeroLayout = "overlay" | "image-only";
export type HeroHeight = "compact" | "normal" | "tall";
export type HeroImageFit = "cover" | "contain";

export interface SiteSettings {
  siteName: string;
  logoUrl: string | null;
  heroDisplayMode: HeroDisplayMode;
  heroLayout: HeroLayout;
  heroHeight: HeroHeight;
  heroAutoplay: boolean;
  heroAutoplayDelay: number;
  heroShowCta: boolean;
  heroImageFit: HeroImageFit;
}

export const defaultSiteSettings: SiteSettings = {
  siteName: SITE_INFO.villageName,
  logoUrl: null,
  heroDisplayMode: "carousel",
  heroLayout: "overlay",
  heroHeight: "normal",
  heroAutoplay: true,
  heroAutoplayDelay: 5500,
  heroShowCta: true,
  heroImageFit: "cover",
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("site_name,logo_url,hero_display_mode,hero_layout,hero_height,hero_autoplay,hero_autoplay_delay,hero_show_cta,hero_image_fit")
      .eq("key", "main")
      .maybeSingle();

    if (data) {
      setSettings({
        siteName: data.site_name || defaultSiteSettings.siteName,
        logoUrl: data.logo_url || null,
        heroDisplayMode: data.hero_display_mode === "single" ? "single" : "carousel",
        heroLayout: data.hero_layout === "image-only" ? "image-only" : "overlay",
        heroHeight: ["compact", "normal", "tall"].includes(data.hero_height) ? data.hero_height : "normal",
        heroAutoplay: data.hero_autoplay !== false,
        heroAutoplayDelay: Number(data.hero_autoplay_delay) || 5500,
        heroShowCta: data.hero_show_cta !== false,
        heroImageFit: data.hero_image_fit === "contain" ? "contain" : "cover",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, reload: load };
};