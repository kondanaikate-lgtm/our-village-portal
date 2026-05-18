import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search, User, Users } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";

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

interface Department {
  id: string;
  name: string;
  order_index: number;
}

const UNCATEGORIZED = "__uncategorized__";

const PersonnelPage = () => {
  const { settings } = useSiteSettings();
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string>("all");

  useEffect(() => {
    document.title = "ทำเนียบบุคลากร | หมู่บ้านแซร์ออ ม.2";
    const load = async () => {
      const [{ data }, deptRes] = await Promise.all([
        supabase
          .from("personnel")
          .select("id,name,position,department,phone,email,bio,image_url,order_index")
          .eq("is_active", true)
          .order("order_index", { ascending: true }),
        (supabase as any)
          .from("personnel_departments")
          .select("id,name,order_index")
          .order("order_index", { ascending: true }),
      ]);
      setPeople(data ?? []);
      setDepartments((deptRes?.data ?? []) as Department[]);
      setLoading(false);
    };
    load();
  }, []);

  // List of department chips: ordered departments first, then ad-hoc ones (from personnel) appended
  const deptChips = useMemo(() => {
    const ordered = departments.map((d) => d.name);
    const extras: string[] = [];
    people.forEach((p) => {
      if (p.department && !ordered.includes(p.department) && !extras.includes(p.department)) {
        extras.push(p.department);
      }
    });
    return [...ordered, ...extras];
  }, [departments, people]);

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

  // Group people by department for display ordering
  const grouped = useMemo(() => {
    const orderMap = new Map<string, number>();
    departments.forEach((d) => orderMap.set(d.name, d.order_index));
    const buckets = new Map<string, Person[]>();
    filtered.forEach((p) => {
      const key = p.department && p.department.trim() ? p.department : UNCATEGORIZED;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(p);
    });
    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      const oa = orderMap.has(a) ? orderMap.get(a)! : Number.MAX_SAFE_INTEGER;
      const ob = orderMap.has(b) ? orderMap.get(b)! : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.localeCompare(b, "th");
    });
    return sortedKeys.map((k) => ({ key: k, label: k === UNCATEGORIZED ? "ไม่ระบุแผนก" : k, items: buckets.get(k)! }));
  }, [filtered, departments]);

  const shape = settings.personnelImageShape;
  const imageShapeClass =
    shape === "circle" ? "rounded-full" : shape === "rounded" ? "rounded-2xl" : "rounded-md";
  // For circle shape we prefer square aspect; rounded/square use 4:3
  const imageAspectClass = shape === "circle" ? "aspect-square" : "aspect-[4/3]";

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
            {deptChips.length > 0 && (
              <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                <button
                  onClick={() => setDept("all")}
                  className={`shrink-0 px-3.5 py-1.5 text-sm rounded-full border transition-base ${
                    dept === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  ทั้งหมด
                </button>
                {deptChips.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDept(d)}
                    className={`shrink-0 px-3.5 py-1.5 text-sm rounded-full border transition-base ${
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
          ) : grouped.length === 0 || filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">ไม่พบข้อมูลบุคลากร</p>
            </Card>
          ) : (
            <div className="space-y-12">
              {grouped.map((g, gi) => (
                <section key={g.key}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-tight">
                        {g.label}
                      </h2>
                      <p className="text-xs text-muted-foreground">{g.items.length} คน</p>
                    </div>
                    <span className="flex-1 h-px bg-border ml-2" />
                  </div>

                  <div
                    className={cn(
                      "grid gap-5 sm:gap-6",
                      shape === "circle"
                        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                        : "sm:grid-cols-2 lg:grid-cols-3",
                    )}
                  >
                    {g.items.map((p, i) => (
                      <Card
                        key={p.id}
                        className={cn(
                          "hover:shadow-elegant transition-smooth border-border/60 group",
                          shape === "circle" ? "text-center p-4 sm:p-5 bg-card" : "overflow-hidden",
                        )}
                      >
                        {shape === "circle" ? (
                          <>
                            <div className="relative mx-auto w-28 sm:w-32 md:w-36 aspect-square bg-gradient-primary rounded-full overflow-hidden ring-4 ring-background shadow-md">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  loading="lazy"
                                  className="h-full w-full object-cover group-hover:scale-110 transition-smooth"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User className="h-12 w-12 text-accent/50" />
                                </div>
                              )}
                              {dept === "all" && search === "" && gi === 0 && i === 0 && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-gold px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-accent-foreground shadow whitespace-nowrap">
                                  ผู้ใหญ่บ้าน
                                </div>
                              )}
                            </div>
                            <div className="mt-4">
                              <h3 className="font-display font-bold text-sm sm:text-base text-foreground leading-tight">
                                {p.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-primary font-medium mt-0.5">{p.position}</p>
                              {p.bio && (
                                <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mt-2">
                                  {p.bio}
                                </p>
                              )}
                              <div className="flex flex-col items-center gap-1 mt-3">
                                {p.phone && (
                                  <a
                                    href={`tel:${p.phone}`}
                                    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-foreground hover:text-accent transition-base"
                                  >
                                    <Phone className="h-3 w-3 text-accent" />
                                    {p.phone}
                                  </a>
                                )}
                                {p.email && (
                                  <a
                                    href={`mailto:${p.email}`}
                                    className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-foreground hover:text-accent transition-base max-w-full"
                                  >
                                    <Mail className="h-3 w-3 text-accent shrink-0" />
                                    <span className="truncate">{p.email}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={cn("relative bg-gradient-primary overflow-hidden", imageAspectClass, imageShapeClass)}>
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
                              {dept === "all" && search === "" && gi === 0 && i === 0 && (
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
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
};

export default PersonnelPage;
