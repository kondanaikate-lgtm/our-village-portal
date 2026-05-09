import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import { FileText, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SITE_INFO } from "@/config/site";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";

const PAGE_MAP: Record<string, { key: string; title: string; eyebrow: string }> = {
  "/about/history": { key: "history", title: "ประวัติความเป็นมา", eyebrow: "เกี่ยวกับหมู่บ้าน" },
  "/about/vision": { key: "vision", title: "วิสัยทัศน์ / พันธกิจ", eyebrow: "เกี่ยวกับหมู่บ้าน" },
  "/about/structure": { key: "structure", title: "โครงสร้างการบริหาร", eyebrow: "เกี่ยวกับหมู่บ้าน" },
  "/about/authority": { key: "authority", title: "อำนาจหน้าที่", eyebrow: "เกี่ยวกับหมู่บ้าน" },
  "/transparency": { key: "transparency", title: "ความโปร่งใส", eyebrow: "ข้อมูลสาธารณะ" },
  "/transparency/plans": { key: "plans", title: "แผนพัฒนาท้องถิ่น", eyebrow: "ความโปร่งใส" },
  "/transparency/budget": { key: "budget", title: "งบประมาณ", eyebrow: "ความโปร่งใส" },
  "/transparency/reports": { key: "reports", title: "รายงานผลการปฏิบัติงาน", eyebrow: "ความโปร่งใส" },
  "/ita": { key: "ita", title: "ITA", eyebrow: "เมนูพิเศษ" },
  "/info-center": { key: "info-center", title: "ศูนย์ข้อมูลข่าวสาร", eyebrow: "เมนูพิเศษ" },
  "/policy": { key: "policy", title: "นโยบายเว็บไซต์", eyebrow: "เมนูพิเศษ" },
  "/manual": { key: "manual", title: "คู่มือบริการ", eyebrow: "เมนูพิเศษ" },
};

interface VillageInfoRow {
  title: string;
  content: string | null;
}

const VillageInfoPage = () => {
  const { pathname } = useLocation();
  const page = PAGE_MAP[pathname] ?? PAGE_MAP["/transparency"];
  const { settings } = useSiteSettings();
  const [row, setRow] = useState<VillageInfoRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${page.title} | ${SITE_INFO.villageName}`;
    setLoading(true);
    supabase
      .from("village_info")
      .select("title,content")
      .eq("section_key", page.key)
      .maybeSingle()
      .then(({ data }) => {
        setRow(data as VillageInfoRow | null);
        setLoading(false);
      });
  }, [page.key, page.title]);

  const html = useMemo(() => DOMPurify.sanitize(row?.content || ""), [row?.content]);

  return (
    <SiteLayout>
      <section className={cn(
        "py-12 md:py-16",
        settings.aboutHeroStyle === "minimal"
          ? "bg-secondary border-b border-border"
          : "bg-gradient-primary text-primary-foreground ribbon-gold",
      )}>
        <div className={cn("container", settings.aboutAlign === "center" && "text-center")}>
          <p className="text-xs uppercase tracking-widest text-accent mb-2">{page.eyebrow}</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">{row?.title || page.title}</h1>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className={cn("container max-w-4xl", settings.aboutAlign === "center" && "text-center")}>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />กำลังโหลด...</div>
          ) : html ? (
            <article className="prose prose-slate max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <Card className="p-8 text-center border-border/60">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">ยังไม่มีข้อมูลในหน้านี้</h2>
              <p className="text-sm text-muted-foreground">เจ้าหน้าที่สามารถเพิ่มเนื้อหาได้จากเมนูตั้งค่าเว็บไซต์</p>
            </Card>
          )}
        </div>
      </section>
    </SiteLayout>
  );
};

export default VillageInfoPage;
