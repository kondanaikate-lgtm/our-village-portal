import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SITE_INFO } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-village.jpg";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface BannerSlide {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
}

const HeroOverlay = ({ siteName }: { siteName: string }) => (
  <div className="container relative py-20 md:py-28 lg:py-36 pointer-events-none">
    <div className="max-w-3xl animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-sm mb-6">
        <Megaphone className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs md:text-sm text-accent font-medium">
          ยินดีต้อนรับสู่เว็บไซต์ทางการ
        </span>
      </div>
      <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight mb-4 text-balance">
        {siteName}
      </h1>
      <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 mb-3 font-medium">
        {SITE_INFO.shortAddress}
      </p>
      <p className="text-sm md:text-base text-primary-foreground/80 max-w-2xl mb-8 leading-relaxed">
        {SITE_INFO.description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 pointer-events-auto">
        <Button asChild size="xl" variant="hero">
          <Link to="/news">
            ดูข่าวสารล่าสุด
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="xl" variant="outlineGold">
          <Link to="/services/documents">บริการประชาชน</Link>
        </Button>
      </div>
    </div>
  </div>
);

export const HeroSection = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const fetchBanners = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("banners")
        .select("id,title,image_url,link_url,start_at,end_at,is_active,type")
        .eq("type", "banner")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      const filtered = (data ?? []).filter((b) => {
        if (b.start_at && b.start_at > nowIso) return false;
        if (b.end_at && b.end_at <= nowIso) return false;
        return true;
      });
      setSlides(filtered as BannerSlide[]);
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  // Build the visual list — fall back to default hero if no banners
  const visuals: { src: string; alt: string; href?: string | null }[] =
    slides.length > 0
      ? slides.map((s) => ({ src: s.image_url, alt: s.title ?? "banner", href: s.link_url }))
      : [{ src: heroImage, alt: "ภาพมุมสูงหมู่บ้านแซร์ออ" }];
  const displayVisuals = settings.heroDisplayMode === "single" ? visuals.slice(0, 1) : visuals;
  const isImageOnly = settings.heroLayout === "image-only";

  return (
    <section className={cn("relative isolate overflow-hidden", isImageOnly && "bg-primary")}>
      <div className={cn(isImageOnly ? "relative" : "absolute inset-0 -z-10")}>
        {displayVisuals.length === 1 ? (
          <>
            {displayVisuals[0].href ? (
              <a href={displayVisuals[0].href} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                <img src={displayVisuals[0].src} alt={displayVisuals[0].alt} className={cn("w-full", isImageOnly ? "h-auto max-h-[80vh] object-contain mx-auto" : "h-full object-cover")} />
              </a>
            ) : (
              <img src={displayVisuals[0].src} alt={displayVisuals[0].alt} className={cn("w-full", isImageOnly ? "h-auto max-h-[80vh] object-contain mx-auto" : "h-full object-cover")} />
            )}
            {!isImageOnly && <div className="absolute inset-0 bg-gradient-hero" />}
          </>
        ) : (
          <>
            <Carousel
              setApi={setApi}
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 5500, stopOnInteraction: false })]}
              className="h-full w-full"
            >
              <CarouselContent className="h-full ml-0">
                {displayVisuals.map((v, i) => (
                  <CarouselItem key={i} className="pl-0 basis-full">
                    <div className={cn("relative w-full", isImageOnly ? "min-h-0" : "h-full min-h-[480px] md:min-h-[560px] lg:min-h-[640px]")}>
                      {v.href ? (
                        <a href={v.href} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                          <img src={v.src} alt={v.alt} className={cn("w-full", isImageOnly ? "h-auto max-h-[80vh] object-contain mx-auto" : "h-full object-cover")} />
                        </a>
                      ) : (
                        <img src={v.src} alt={v.alt} className={cn("w-full", isImageOnly ? "h-auto max-h-[80vh] object-contain mx-auto" : "h-full object-cover")} />
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {!isImageOnly && <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />}
            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {displayVisuals.map((_, i) => (
                <button
                  key={i}
                  aria-label={`สไลด์ที่ ${i + 1}`}
                  onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    current === i ? "w-8 bg-accent" : "w-2 bg-primary-foreground/50 hover:bg-primary-foreground/80",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!isImageOnly && <HeroOverlay siteName={settings.siteName} />}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-gold" />
    </section>
  );
};
