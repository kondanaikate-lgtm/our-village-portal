import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search, User } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Person {
  id: string;
  name: string;
  position: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  image_url: string | null;
  order_index: number;
}

const PersonnelPage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string>("all");

  useEffect(() => {
    document.title = "ทำเนียบบุคลากร | หมู่บ้านแซร์ออ ม.2";
    const load = async () => {
      const { data } = await supabase
        .from("personnel")
        .select("id,name,position,department,phone,email,bio,image_url,order_index")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      setPeople(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    people.forEach((p) => p.department && set.add(p.department));
    return Array.from(set);
  }, [people]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      if (dept !== "all" && p.department !== dept) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        (p.department ?? "").toLowerCase().includes(q)
      );
    });
  }, [people, search, dept]);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">เกี่ยวกับหมู่บ้าน</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">ทำเนียบบุคลากร</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-2 max-w-2xl">
            ผู้บริหาร คณะกรรมการหมู่บ้าน และบุคลากรที่ดูแลความเป็นอยู่ของพี่น้องชาวบ้านแซร์ออ
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container">
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ ตำแหน่ง หรือแผนก..."
                className="pl-9"
              />
            </div>
            {departments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDept("all")}
                  className={`px-3.5 py-1.5 text-sm rounded-full border transition-base ${
                    dept === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  ทั้งหมด
                </button>
                {departments.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDept(d)}
                    className={`px-3.5 py-1.5 text-sm rounded-full border transition-base ${
                      dept === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">ไม่พบข้อมูลบุคลากร</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <Card
                  key={p.id}
                  className="overflow-hidden hover:shadow-elegant transition-smooth border-border/60 group"
                >
                  <div className="relative aspect-[4/3] bg-gradient-primary overflow-hidden">
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
                    {dept === "all" && search === "" && i === 0 && (
                      <div className="absolute top-3 left-3 bg-gradient-gold px-3 py-1 rounded-full text-xs font-semibold text-accent-foreground shadow-md">
                        ผู้ใหญ่บ้าน
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-lg text-foreground leading-tight mb-1">
                      {p.name}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-1">{p.position}</p>
                    {p.department && (
                      <Badge variant="secondary" className="text-xs mb-3">
                        {p.department}
                      </Badge>
                    )}
                    {p.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{p.bio}</p>
                    )}
                    <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-accent transition-base"
                        >
                          <Phone className="h-3 w-3 text-accent" />
                          {p.phone}
                        </a>
                      )}
                      {p.email && (
                        <a
                          href={`mailto:${p.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-accent transition-base truncate"
                        >
                          <Mail className="h-3 w-3 text-accent shrink-0" />
                          <span className="truncate">{p.email}</span>
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
    </SiteLayout>
  );
};

export default PersonnelPage;
