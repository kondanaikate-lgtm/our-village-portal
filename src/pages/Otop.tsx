import { useEffect, useMemo, useState } from "react";
import { Phone, Search, ShoppingBag } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SITE_INFO } from "@/config/site";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  image_urls?: string[] | null;
}

const Otop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = `สินค้า OTOP | ${SITE_INFO.villageName}`;
    supabase
      .from("otop_products")
      .select("id,name,description,price,unit,image_url,contact_name,contact_phone,image_urls")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.contact_name ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">บริการประชาชน</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">สินค้า OTOP และผลิตภัณฑ์ชุมชน</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-2 max-w-2xl">
            รวมสินค้าและภูมิปัญญาท้องถิ่นของพี่น้องบ้านแซร์ออ
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ค้นหาสินค้า OTOP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีสินค้า OTOP ที่ตรงกับคำค้นหา</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const gallery = [
                  ...(p.image_url ? [p.image_url] : []),
                  ...((p.image_urls ?? []).filter((u) => u && u !== p.image_url)),
                ];
                return (
                <Card key={p.id} className="overflow-hidden hover:shadow-elegant transition-smooth border-border/60 group">
                  <div className="aspect-[4/3] bg-secondary overflow-hidden relative">
                    {gallery.length > 1 ? (
                      <Carousel className="h-full" opts={{ loop: true }}>
                        <CarouselContent className="h-full">
                          {gallery.map((url, i) => (
                            <CarouselItem key={`${url}-${i}`} className="h-full">
                              <div className="aspect-[4/3] h-full w-full">
                                <img src={url} alt={`${p.name} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2 h-7 w-7" />
                        <CarouselNext className="right-2 h-7 w-7" />
                        <div className="absolute bottom-2 right-2 bg-background/80 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          {gallery.length} รูป
                        </div>
                      </Carousel>
                    ) : gallery.length === 1 ? (
                      <img src={gallery[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-section">
                        <ShoppingBag className="h-14 w-14 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h2 className="font-display font-semibold text-lg text-foreground line-clamp-1">{p.name}</h2>
                      {p.description && <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{p.description}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      {p.price ? (
                        <div className="text-accent font-display font-bold">
                          ฿{Number(p.price).toLocaleString("th-TH")}
                          {p.unit && <span className="text-xs font-normal text-muted-foreground ml-1">/ {p.unit}</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">สอบถามราคา</span>
                      )}
                      {p.contact_phone && (
                        <a href={`tel:${p.contact_phone}`} className="text-xs text-primary hover:text-accent flex items-center gap-1 transition-base">
                          <Phone className="h-3 w-3" /> ติดต่อ
                        </a>
                      )}
                    </div>
                    {p.contact_name && <p className="text-xs text-muted-foreground">ผู้ติดต่อ: {p.contact_name}</p>}
                  </div>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
};

export default Otop;