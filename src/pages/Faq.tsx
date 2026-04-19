import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Search } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  view_count: number;
  order_index: number;
}

const FaqPage = () => {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    document.title = "คำถามที่พบบ่อย | หมู่บ้านแซร์ออ ม.2";
    const load = async () => {
      const { data } = await supabase
        .from("faqs")
        .select("id,question,answer,category,view_count,order_index")
        .eq("is_published", true)
        .order("order_index", { ascending: true });
      setFaqs(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => f.category && set.add(f.category));
    return Array.from(set);
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (!q) return true;
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    });
  }, [faqs, search, category]);

  const handleOpen = async (faqId: string) => {
    const f = faqs.find((x) => x.id === faqId);
    if (!f) return;
    await supabase.from("faqs").update({ view_count: f.view_count + 1 }).eq("id", faqId);
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">บริการประชาชน</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">คำถามที่พบบ่อย</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-2 max-w-2xl">
            รวบรวมคำถามและข้อสงสัยที่พบบ่อยเกี่ยวกับการให้บริการของหมู่บ้าน
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-4xl">
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาคำถาม..."
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategory("all")}
                  className={`px-3.5 py-1.5 text-sm rounded-full border transition-base ${
                    category === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  ทุกหมวด
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3.5 py-1.5 text-sm rounded-full border transition-base ${
                      category === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีคำถามในหมวดนี้</p>
            </Card>
          ) : (
            <Card className="border-border/60 divide-y divide-border">
              <Accordion
                type="single"
                collapsible
                className="w-full"
                onValueChange={(v) => v && handleOpen(v)}
              >
                {filtered.map((f) => (
                  <AccordionItem key={f.id} value={f.id} className="border-0">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/40 text-left">
                      <div className="flex items-start gap-3 text-foreground font-medium">
                        <span className="text-accent shrink-0 mt-0.5">Q.</span>
                        <span>{f.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 pl-12 text-muted-foreground whitespace-pre-line leading-relaxed">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          )}
        </div>
      </section>
    </SiteLayout>
  );
};

export default FaqPage;
