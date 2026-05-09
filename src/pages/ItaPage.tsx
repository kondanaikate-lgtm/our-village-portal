import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, FileSearch, ExternalLink } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SITE_INFO } from "@/config/site";
import { useVillageInfo } from "@/hooks/use-village-info";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";

interface Indicator { id: string; code: string; title: string; description: string | null; link_url: string | null }

const ItaPage = () => {
  const { data } = useVillageInfo(["ita"]);
  const customHtml = data["ita"]?.content
    ? DOMPurify.sanitize(data["ita"].content)
    : "";
  const [items, setItems] = useState<Indicator[]>([]);

  useEffect(() => {
    document.title = `ITA | ${SITE_INFO.villageName}`;
    (supabase as any)
      .from("ita_indicators")
      .select("id,code,title,description,link_url")
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .then(({ data }: any) => setItems((data ?? []) as Indicator[]));
  }, []);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">เมนูพิเศษ</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-accent" />
            ITA — การประเมินคุณธรรมและความโปร่งใส
          </h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">
            การเปิดเผยข้อมูลสาธารณะ (Open Data Integrity & Transparency Assessment) ของ
            {" "}{SITE_INFO.villageName}
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-5xl space-y-8">
          {customHtml && (
            <article
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: customHtml }}
            />
          )}

          <div>
            <h2 className="font-display font-bold text-2xl mb-4 flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-primary" />
              ตัวชี้วัดการเปิดเผยข้อมูล (OIT)
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">ยังไม่มีรายการตัวชี้วัด</p>
              ) : items.map((ind) => {
                const Inner = (
                  <>
                    <Badge variant="secondary" className="h-fit shrink-0">{ind.code}</Badge>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {ind.title}
                        {ind.link_url && <ExternalLink className="h-3.5 w-3.5 text-primary ml-1" />}
                      </div>
                      {ind.description && <p className="text-sm text-muted-foreground mt-0.5">{ind.description}</p>}
                    </div>
                  </>
                );
                return ind.link_url ? (
                  <a key={ind.id} href={ind.link_url} target="_blank" rel="noreferrer" className="block">
                    <Card className="p-4 flex gap-3 border-border/60 hover:border-primary/60 hover:shadow-sm transition-base">{Inner}</Card>
                  </a>
                ) : (
                  <Card key={ind.id} className="p-4 flex gap-3 border-border/60">{Inner}</Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default ItaPage;