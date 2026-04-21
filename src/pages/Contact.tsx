import { useEffect, useState } from "react";
import { Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SITE_INFO } from "@/config/site";

interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon_name: string | null;
}

const iconFor = (name: string | null, platform: string) => {
  const key = `${name ?? ""} ${platform}`.toLowerCase();
  if (key.includes("facebook")) return Facebook;
  if (key.includes("line") || key.includes("message")) return MessageCircle;
  return Mail;
};

const Contact = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    document.title = `ติดต่อเรา | ${SITE_INFO.villageName}`;
    supabase
      .from("social_links")
      .select("id,platform,label,url,icon_name")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .then(({ data }) => setLinks((data ?? []) as SocialLink[]));
  }, []);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">ติดต่อเรา</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">ติดต่อหมู่บ้านแซร์ออ</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-2 max-w-2xl">ช่องทางติดต่อผู้ใหญ่บ้านและติดตามข่าวสารของหมู่บ้าน</p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <Card className="p-6 border-border/60">
              <h2 className="font-display font-semibold text-xl mb-4">ข้อมูลติดต่อ</h2>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3"><MapPin className="h-5 w-5 text-primary shrink-0" /><span>{SITE_INFO.fullAddress}</span></div>
                <a href={`tel:${SITE_INFO.headman.phoneRaw}`} className="flex gap-3 hover:text-primary"><Phone className="h-5 w-5 text-primary shrink-0" /><span>{SITE_INFO.headman.phone}</span></a>
                <div className="flex gap-3"><Mail className="h-5 w-5 text-primary shrink-0" /><span>contact@village.local</span></div>
              </div>
            </Card>

            <Card className="p-6 border-border/60">
              <h2 className="font-display font-semibold text-xl mb-2">ผู้ใหญ่บ้าน</h2>
              <p className="font-medium text-foreground">{SITE_INFO.headman.name}</p>
              <p className="text-sm text-muted-foreground mb-4">{SITE_INFO.headman.position}</p>
              <Button asChild variant="royal"><a href={`tel:${SITE_INFO.headman.phoneRaw}`}><Phone className="h-4 w-4" /> โทรหา</a></Button>
            </Card>
          </div>

          <div className="space-y-4">
            {links.length > 0 && (
              <Card className="p-6 border-border/60">
                <h2 className="font-display font-semibold text-xl mb-4">ช่องทางออนไลน์</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {links.map((link) => {
                    const Icon = iconFor(link.icon_name, link.platform);
                    return (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border border-border p-3 hover:border-primary hover:bg-secondary transition-base">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">{link.label}</span>
                      </a>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Contact;
