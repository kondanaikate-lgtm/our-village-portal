import { useEffect, useState } from "react";
import { SITE_INFO } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";

export type HeroDisplayMode = "single" | "carousel";
export type HeroLayout = "overlay" | "image-only";
export type HeroHeight = "compact" | "normal" | "tall" | "aspect";
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
  heroAutoplayStart: string | null; // "HH:MM" 24h, null = always
  heroAutoplayEnd: string | null;   // "HH:MM" 24h, null = always
  heroRespectReducedMotion: boolean;
  heroHeightAspect: boolean;
  heroAspectRatio: string; // e.g. "16/9", "4/3", "21/9", "1/1"
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
  heroAutoplayStart: null,
  heroAutoplayEnd: null,
  heroRespectReducedMotion: true,
  heroHeightAspect: false,
  heroAspectRatio: "16/9",
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("site_name,logo_url,hero_display_mode,hero_layout,hero_height,hero_autoplay,hero_autoplay_delay,hero_show_cta,hero_image_fit,hero_autoplay_start,hero_autoplay_end,hero_respect_reduced_motion,hero_height_aspect,hero_aspect_ratio")
      .eq("key", "main")
      .maybeSingle();

    if (data) {
      const trimTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
      setSettings({
        siteName: data.site_name || defaultSiteSettings.siteName,
        logoUrl: data.logo_url || null,
        heroDisplayMode: data.hero_display_mode === "single" ? "single" : "carousel",
        heroLayout: data.hero_layout === "image-only" ? "image-only" : "overlay",
        heroHeight: ["compact", "normal", "tall", "aspect"].includes(data.hero_height) ? data.hero_height : "normal",
        heroAutoplay: data.hero_autoplay !== false,
        heroAutoplayDelay: Number(data.hero_autoplay_delay) || 5500,
        heroShowCta: data.hero_show_cta !== false,
        heroImageFit: data.hero_image_fit === "contain" ? "contain" : "cover",
        heroAutoplayStart: trimTime(data.hero_autoplay_start),
        heroAutoplayEnd: trimTime(data.hero_autoplay_end),
        heroRespectReducedMotion: data.hero_respect_reduced_motion !== false,
        heroHeightAspect: data.hero_height_aspect === true,
        heroAspectRatio: data.hero_aspect_ratio || "16/9",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, reload: load };
};