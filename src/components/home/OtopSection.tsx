import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
}

export const OtopSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("otop_products")
        .select("id, name, description, price, unit, image_url, contact_name, contact_phone")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(3);

      if (data) setProducts(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <SectionHeader
          eyebrow="สินค้าชุมชน"
          title="สินค้า OTOP & ผลิตภัณฑ์ชุมชน"
          description="สนับสนุนสินค้าและภูมิปัญญาท้องถิ่นของพี่น้องบ้านแซร์ออ"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/services/otop">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีสินค้า OTOP ที่ลงทะเบียน
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              พี่น้องที่สนใจสามารถติดต่อผู้ใหญ่บ้านเพื่อลงข้อมูลสินค้า
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card
                key={p.id}
                className="overflow-hidden hover:shadow-elegant transition-smooth border-border/60 group"
              >
                <div className="aspect-[4/3] bg-secondary overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-smooth"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-section">
                      <ShoppingBag className="h-14 w-14 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2 line-clamp-1">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    {p.price ? (
                      <div className="text-accent font-display font-bold">
                        ฿{Number(p.price).toLocaleString("th-TH")}
                        {p.unit && (
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            / {p.unit}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        สอบถามราคา
                      </span>
                    )}
                    {p.contact_phone && (
                      <a
                        href={`tel:${p.contact_phone}`}
                        className="text-xs text-primary hover:text-accent flex items-center gap-1 transition-base"
                      >
                        <Phone className="h-3 w-3" />
                        ติดต่อ
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
