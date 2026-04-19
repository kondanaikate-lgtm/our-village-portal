import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Eye, Newspaper, Pin, Share2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsDetailRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number;
  is_pinned: boolean;
  news_categories: { name: string; slug: string } | null;
}

const formatThaiDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const NewsDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<NewsDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select(
          "id,title,slug,excerpt,content,thumbnail_url,published_at,created_at,view_count,is_pinned,news_categories(name,slug)",
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const row = data as unknown as NewsDetailRow;
      setItem(row);
      setLoading(false);

      document.title = `${row.title} | ข่าวสารหมู่บ้านแซร์ออ`;
      const meta =
        document.querySelector('meta[name="description"]') ||
        Object.assign(document.createElement("meta"), { name: "description" });
      meta.setAttribute("content", row.excerpt ?? row.title);
      if (!meta.parentElement) document.head.appendChild(meta);

      // Increment view count (best-effort, ignore errors)
      await supabase
        .from("news")
        .update({ view_count: row.view_count + 1 })
        .eq("id", row.id);
    };
    load();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share && item) {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch {
        // user canceled
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แล้ว");
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-10 space-y-4 max-w-4xl">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </SiteLayout>
    );
  }

  if (notFound || !item) {
    return (
      <SiteLayout>
        <div className="container py-20 text-center">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="font-display text-2xl font-bold mb-2">ไม่พบข่าวที่ค้นหา</h1>
          <p className="text-muted-foreground mb-6">ข่าวอาจถูกลบหรือยังไม่ได้เผยแพร่</p>
          <Button asChild variant="royal">
            <Link to="/news">
              <ArrowLeft className="h-4 w-4" /> กลับไปหน้าข่าวสาร
            </Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="bg-background">
        {/* Hero */}
        <header className="bg-gradient-primary text-primary-foreground py-10 md:py-14 ribbon-gold">
          <div className="container max-w-4xl">
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-glow mb-4 transition-base"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> กลับไปหน้าข่าวสาร
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {item.news_categories && (
                <Badge className="bg-accent text-accent-foreground border-0">
                  {item.news_categories.name}
                </Badge>
              )}
              {item.is_pinned && (
                <Badge variant="outline" className="border-accent text-accent">
                  <Pin className="h-3 w-3 mr-1" /> ปักหมุด
                </Badge>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl md:text-4xl leading-tight mb-4 text-balance">
              {item.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatThaiDate(item.published_at || item.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {(item.view_count + 1).toLocaleString("th-TH")} ครั้ง
              </span>
              <Button
                size="sm"
                variant="outlineGold"
                onClick={handleShare}
                className="ml-auto h-8"
              >
                <Share2 className="h-3.5 w-3.5" /> แชร์
              </Button>
            </div>
          </div>
        </header>

        <div className="container max-w-4xl py-10 md:py-14">
          {item.thumbnail_url && (
            <Card className="overflow-hidden mb-8 border-border/60">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-auto object-cover"
              />
            </Card>
          )}

          {item.excerpt && (
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed border-l-4 border-accent pl-4 mb-8 italic">
              {item.excerpt}
            </p>
          )}

          <div
            className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-accent prose-img:rounded-md"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />

          <div className="mt-12 pt-8 border-t border-border flex justify-between items-center gap-4 flex-wrap">
            <Button asChild variant="outline">
              <Link to="/news">
                <ArrowLeft className="h-4 w-4" /> ดูข่าวอื่นๆ
              </Link>
            </Button>
            <Button onClick={handleShare} variant="gold">
              <Share2 className="h-4 w-4" /> แชร์ข่าวนี้
            </Button>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
};

export default NewsDetailPage;
