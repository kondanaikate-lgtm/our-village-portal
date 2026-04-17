import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";

interface Person {
  id: string;
  name: string;
  position: string;
  department: string | null;
  phone: string | null;
  image_url: string | null;
}

export const PersonnelSection = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("personnel")
        .select("id, name, position, department, phone, image_url")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(4);

      if (data) setPeople(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-gradient-section">
      <div className="container">
        <SectionHeader
          eyebrow="ทำเนียบบุคลากร"
          title="ผู้บริหารและคณะกรรมการ"
          description="ผู้นำและผู้ดูแลความเป็นอยู่ของพี่น้องชาวบ้านแซร์ออ"
          align="center"
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {people.map((p, i) => (
              <Card
                key={p.id}
                className="overflow-hidden text-center hover:shadow-elegant transition-smooth border-border/60 group"
              >
                <div className="relative aspect-square bg-gradient-primary overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-smooth"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-20 w-20 text-accent/50" />
                    </div>
                  )}
                  {i === 0 && (
                    <div className="absolute top-3 left-3 bg-gradient-gold px-3 py-1 rounded-full text-xs font-semibold text-accent-foreground shadow-md">
                      ผู้ใหญ่บ้าน
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-base md:text-lg text-foreground leading-tight mb-1">
                    {p.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-1">
                    {p.position}
                  </p>
                  {p.department && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {p.department}
                    </p>
                  )}
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-primary transition-base mt-2"
                    >
                      <Phone className="h-3 w-3" />
                      {p.phone}
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Button asChild variant="outline">
            <Link to="/about/personnel">
              ดูทำเนียบบุคลากรทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
