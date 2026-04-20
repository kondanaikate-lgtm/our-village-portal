import { useEffect } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { NewsSection } from "@/components/home/NewsSection";
import { EventsSection } from "@/components/home/EventsSection";
import { PersonnelSection } from "@/components/home/PersonnelSection";
import { OtopSection } from "@/components/home/OtopSection";
import { ContactQuickSection } from "@/components/home/ContactQuickSection";
import { BannerPopup } from "@/components/home/BannerPopup";
import { SITE_INFO } from "@/config/site";

const Index = () => {
  useEffect(() => {
    document.title = `${SITE_INFO.villageName} | เว็บไซต์ทางการ`;
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute("content", SITE_INFO.description);
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  return (
    <SiteLayout>
      <HeroSection />
      <NewsSection />
      <EventsSection />
      <PersonnelSection />
      <OtopSection />
      <ContactQuickSection />
      <BannerPopup />
    </SiteLayout>
  );
};

export default Index;
