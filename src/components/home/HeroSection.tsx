import { Link } from "react-router-dom";
import { ArrowRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_INFO } from "@/config/site";
import heroImage from "@/assets/hero-village.jpg";

export const HeroSection = () => {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="ภาพมุมสูงหมู่บ้านแซร์ออ"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="container relative py-20 md:py-28 lg:py-36">
        <div className="max-w-3xl animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-sm mb-6">
            <Megaphone className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs md:text-sm text-accent font-medium">
              ยินดีต้อนรับสู่เว็บไซต์ทางการ
            </span>
          </div>

          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight mb-4 text-balance">
            {SITE_INFO.villageName}
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 mb-3 font-medium">
            {SITE_INFO.shortAddress}
          </p>

          <p className="text-sm md:text-base text-primary-foreground/80 max-w-2xl mb-8 leading-relaxed">
            {SITE_INFO.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="xl" variant="hero">
              <Link to="/news">
                ดูข่าวสารล่าสุด
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outlineGold">
              <Link to="/services">บริการประชาชน</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-gold" />
    </section>
  );
};
