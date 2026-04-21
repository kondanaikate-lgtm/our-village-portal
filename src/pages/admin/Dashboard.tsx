import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  Users,
  FileText,
  MessageSquareWarning,
  Image as ImageIcon,
  Eye,
  Package,
  Calendar,
  Download,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StatItem {
  label: string;
  value: number | string;
  icon: typeof Newspaper;
  color: string;
  to?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [complaintBreakdown, setComplaintBreakdown] = useState<
    Record<string, number>
  >({});
  const [topDocs, setTopDocs] = useState<
    { id: string; title: string; download_count: number; category: string }[]
  >([]);
  const [visitors, setVisitors] = useState({ today: 0, month: 0 });

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const [
        news,
        personnel,
        docs,
        complaintsAll,
        complaintsPending,
        complaintsInProgress,
        complaintsResolved,
        complaintsRejected,
        albums,
        otop,
        events,
        visitorsToday,
        visitorsMonth,
        topDocsRes,
      ] = await Promise.all([
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase
          .from("personnel")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress"),
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved"),
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected"),
        supabase
          .from("gallery_albums")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("otop_products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .gte("start_at", new Date().toISOString()),
        supabase
          .from("site_visitors")
          .select("visit_count")
          .eq("visit_date", todayStr)
          .maybeSingle(),
        supabase
          .from("site_visitors")
          .select("visit_count")
          .gte("visit_date", monthStart),
        supabase
          .from("documents")
          .select("id,title,download_count,category")
          .order("download_count", { ascending: false })
          .limit(5),
      ]);

      const monthSum = (visitorsMonth.data || []).reduce(
        (s, r) => s + (r.visit_count || 0),
        0,
      );
      setVisitors({
        today: visitorsToday.data?.visit_count ?? 0,
        month: monthSum,
      });

      setComplaintBreakdown({
        pending: complaintsPending.count ?? 0,
        in_progress: complaintsInProgress.count ?? 0,
        resolved: complaintsResolved.count ?? 0,
        rejected: complaintsRejected.count ?? 0,
      });

      setTopDocs((topDocsRes.data as any) || []);

      setStats([
        {
          label: "ข่าวสารทั้งหมด",
          value: news.count ?? 0,
          icon: Newspaper,
          color: "bg-primary/10 text-primary",
          to: "/admin/news",
        },
        {
          label: "บุคลากร",
          value: personnel.count ?? 0,
          icon: Users,
          color: "bg-accent/15 text-accent-foreground",
          to: "/admin/personnel",
        },
        {
          label: "เอกสาร",
          value: docs.count ?? 0,
          icon: FileText,
          color: "bg-secondary text-secondary-foreground",
          to: "/admin/documents",
        },
        {
          label: "ร้องเรียนทั้งหมด",
          value: complaintsAll.count ?? 0,
          icon: MessageSquareWarning,
          color: "bg-destructive/10 text-destructive",
          to: "/admin/complaints",
        },
        {
          label: "อัลบั้มรูปภาพ",
          value: albums.count ?? 0,
          icon: ImageIcon,
          color: "bg-primary/10 text-primary",
          to: "/admin/gallery",
        },
        {
          label: "สินค้า OTOP",
          value: otop.count ?? 0,
          icon: Package,
          color: "bg-accent/15 text-accent-foreground",
          to: "/admin/otop",
        },
        {
          label: "กิจกรรมที่จะมา",
          value: events.count ?? 0,
          icon: Calendar,
          color: "bg-secondary text-secondary-foreground",
          to: "/admin/events",
        },
      ]);
    };
    load();
  }, []);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" },
    in_progress: { label: "กำลังดำเนินการ", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
    resolved: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" },
    rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
          แดชบอร์ด
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          ยินดีต้อนรับ <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>

      {/* Visitor stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">ผู้เข้าชมวันนี้</div>
              <div className="text-3xl font-display font-bold text-foreground mt-1">
                {visitors.today.toLocaleString()}
              </div>
            </div>
            <Eye className="h-10 w-10 text-primary opacity-70" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/15 to-accent/5 border-accent/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">ผู้เข้าชมเดือนนี้</div>
              <div className="text-3xl font-display font-bold text-foreground mt-1">
                {visitors.month.toLocaleString()}
              </div>
            </div>
            <TrendingUp className="h-10 w-10 text-accent-foreground opacity-70" />
          </CardContent>
        </Card>
      </div>

      {/* Module stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <Card className="hover:shadow-md transition-base h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-lg flex items-center justify-center ${s.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground truncate">
                    {s.label}
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">
                    {s.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return s.to ? (
            <Link key={s.label} to={s.to}>
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Complaints breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4" /> เรื่องร้องเรียน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(complaintBreakdown).map(([key, count]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <Badge className={statusLabels[key].color} variant="secondary">
                  {statusLabels[key].label}
                </Badge>
                <span className="font-display font-bold text-lg">{count}</span>
              </div>
            ))}
            <Link
              to="/admin/complaints"
              className="text-sm text-primary hover:underline inline-block mt-2"
            >
              จัดการทั้งหมด →
            </Link>
          </CardContent>
        </Card>

        {/* Top downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" /> เอกสารยอดนิยม Top 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                ยังไม่มีข้อมูลการดาวน์โหลด
              </p>
            ) : (
              <ol className="space-y-2">
                {topDocs.map((d, i) => (
                  <li
                    key={d.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-muted-foreground font-display font-bold w-5 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.category}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {d.download_count.toLocaleString()}
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
