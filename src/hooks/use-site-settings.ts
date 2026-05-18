import { useEffect, useState } from "react";
import { SITE_INFO } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";

export type HeroDisplayMode = "single" | "carousel";
export type HeroLayout = "overlay" | "image-only";
export type HeroHeight = "compact" | "normal" | "tall" | "aspect";
export type HeroImageFit = "cover" | "contain";
export type PersonnelImageShape = "square" | "rounded" | "circle";

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
  // Layout customization
  footerColumns: 1 | 2 | 3 | 4;
  footerAlign: "left" | "center";
  footerShowQuickLinks: boolean;
  footerShowHeadman: boolean;
  footerShowSocial: boolean;
  contactLayout: "two-column" | "stacked";
  contactMapPosition: "right" | "below";
  aboutAlign: "left" | "center";
  aboutHeroStyle: "gradient" | "minimal";
  personnelImageShape: PersonnelImageShape;
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
  footerColumns: 4,
  footerAlign: "left",
  footerShowQuickLinks: true,
  footerShowHeadman: true,
  footerShowSocial: true,
  contactLayout: "two-column",
  contactMapPosition: "right",
  aboutAlign: "left",
  aboutHeroStyle: "gradient",
  personnelImageShape: "circle",
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("*")
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
        footerColumns: ([1, 2, 3, 4].includes(Number(data.footer_columns)) ? Number(data.footer_columns) : 4) as 1 | 2 | 3 | 4,
        footerAlign: data.footer_align === "center" ? "center" : "left",
        footerShowQuickLinks: data.footer_show_quicklinks !== false,
        footerShowHeadman: data.footer_show_headman !== false,
        footerShowSocial: data.footer_show_social !== false,
        contactLayout: data.contact_layout === "stacked" ? "stacked" : "two-column",
        contactMapPosition: data.contact_map_position === "below" ? "below" : "right",
        aboutAlign: data.about_align === "center" ? "center" : "left",
        aboutHeroStyle: data.about_hero_style === "minimal" ? "minimal" : "gradient",
        personnelImageShape:
          data.personnel_image_shape === "square"
            ? "square"
            : data.personnel_image_shape === "rounded"
              ? "rounded"
              : "circle",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, reload: load };
};