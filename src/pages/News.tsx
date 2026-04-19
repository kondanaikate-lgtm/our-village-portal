import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Eye, Newspaper, Pin, Search } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}
interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number;
  is_pinned: boolean;
  news_categories: { name: string; slug: string } | null;
}

const PAGE_SIZE = 9;

const formatThaiDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const NewsPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const categorySlug = params.get("cat") ?? "all";
  const search = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "ข่าวสารและประกาศ | หมู่บ้านแซร์ออ ม.2";
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("news_categories")
        .select("id,name,slug")
        .order("order_index", { ascending: true });
      setCategories(data ?? []);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("news")
        .select(
          "id,title,slug,excerpt,thumbnail_url,published_at,created_at,view_count,is_pinned,news_categories(name,slug)",
          { count: "exact" },
        )
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (categorySlug !== "all") {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (search.trim()) {
        q = q.ilike("title", `%${search.trim()}%`);
      }
      const { data, count } = await q;
      setItems((data ?? []) as unknown as NewsItem[]);
      setTotal(count ?? 0);
      setLoading(false);
    };
    if (categories.length > 0 || categorySlug === "all") load();
  }, [page, categorySlug, search, categories]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", searchInput.trim());
  };

  const pageNumbers = useMemo(() => {
    const arr: number[] = [];
    const maxShown = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxShown - 1);
    start = Math.max(1, end - maxShown + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">ข่าวสารและประกาศ</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">ข่าวประชาสัมพันธ์</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-2 max-w-2xl">
            ติดตามข่าวสาร ประกาศ และความเคลื่อนไหวจากหมู่บ้านแซร์ออ ม.2
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8">
            <form onSubmit={submitSearch} className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ค้นหาข่าว..."
                className="pl-9"
              />
            </form>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setParam("cat", null)}
                className={cn(
                  "px-3.5 py-1.5 text-sm rounded-full border transition-base",
                  categorySlug === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground hover:border-primary",
                )}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setParam("cat", c.slug)}
                  className={cn(
                    "px-3.5 py-1.5 text-sm rounded-full border transition-base",
                    categorySlug === c.slug
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Newspaper className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">ไม่พบข่าวที่ตรงกับเงื่อนไข</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Link key={item.id} to={`/news/${item.slug}`} className="group">
                    <Card className="overflow-hidden h-full hover:shadow-elegant transition-smooth border-border/60">
                      <div className="aspect-[16/10] overflow-hidden bg-secondary relative">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover group-hover:scale-105 transition-smooth"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-primary">
                            <Newspaper className="h-12 w-12 text-accent/60" />
                          </div>
                        )}
                        {item.is_pinned && (
                          <div className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 shadow-md">
                            <Pin className="h-3 w-3" /> ปักหมุด
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {item.news_categories && (
                          <Badge variant="secondary" className="mb-2 bg-accent/15 text-accent-foreground border-accent/30">
                            {item.news_categories.name}
                          </Badge>
                        )}
                        <h3 className="font-display font-semibold text-base md:text-lg leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-base">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.excerpt}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatThaiDate(item.published_at || item.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {item.view_count.toLocaleString("th-TH")}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-10">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setParam("page", String(page - 1));
                        }}
                        className={cn(page === 1 && "pointer-events-none opacity-50", "cursor-pointer")}
                      />
                    </PaginationItem>
                    {pageNumbers.map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setParam("page", String(p));
                          }}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setParam("page", String(page + 1));
                        }}
                        className={cn(page === totalPages && "pointer-events-none opacity-50", "cursor-pointer")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
};

export default NewsPage;
