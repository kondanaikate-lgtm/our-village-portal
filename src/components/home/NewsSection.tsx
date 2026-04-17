import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Eye, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number;
  news_categories: { name: string; slug: string } | null;
}

const formatThaiDate = (date: string) => {
  try {
    const d = new Date(date);
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export const NewsSection = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, thumbnail_url, published_at, created_at, view_count, news_categories(name, slug)")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) setItems(data as unknown as NewsItem[]);
      setLoading(false);
    };
    fetchNews();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <SectionHeader
          eyebrow="ข่าวสารและประกาศ"
          title="ข่าวประชาสัมพันธ์ล่าสุด"
          description="ติดตามข่าวสาร ประกาศ และความเคลื่อนไหวจากหมู่บ้าน"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/news">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Newspaper className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีข่าวเผยแพร่ในขณะนี้
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              กลับมาเช็คใหม่ได้เร็วๆ นี้
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} to={`/news/${item.slug}`} className="group">
                <Card className="overflow-hidden h-full hover:shadow-elegant transition-smooth border-border/60">
                  <div className="aspect-[16/10] overflow-hidden bg-secondary">
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
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.excerpt}
                      </p>
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
        )}
      </div>
    </section>
  );
};
