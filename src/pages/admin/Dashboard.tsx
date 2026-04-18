import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Newspaper,
  Users,
  FileText,
  MessageSquareWarning,
  Image as ImageIcon,
  Mail,
  Eye,
  Package,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StatItem {
  label: string;
  value: number | string;
  icon: typeof Newspaper;
  color: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([
    { label: "ข่าวสารทั้งหมด", value: "—", icon: Newspaper, color: "bg-primary/10 text-primary" },
    { label: "บุคลากร", value: "—", icon: Users, color: "bg-accent/15 text-accent-foreground" },
    { label: "เอกสาร", value: "—", icon: FileText, color: "bg-secondary text-secondary-foreground" },
    { label: "ร้องเรียนรอดำเนินการ", value: "—", icon: MessageSquareWarning, color: "bg-destructive/10 text-destructive" },
    { label: "อัลบั้มรูปภาพ", value: "—", icon: ImageIcon, color: "bg-primary/10 text-primary" },
    { label: "สินค้า OTOP", value: "—", icon: Package, color: "bg-accent/15 text-accent-foreground" },
    { label: "ผู้รับข่าวสาร", value: "—", icon: Mail, color: "bg-secondary text-secondary-foreground" },
    { label: "ผู้เข้าชมวันนี้", value: "—", icon: Eye, color: "bg-primary/10 text-primary" },
  ]);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [news, personnel, docs, complaints, albums, otop, subs, visitors] = await Promise.all([
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase.from("personnel").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("gallery_albums").select("*", { count: "exact", head: true }),
        supabase.from("otop_products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("site_visitors").select("visit_count").eq("visit_date", today).maybeSingle(),
      ]);

      setStats([
        { label: "ข่าวสารทั้งหมด", value: news.count ?? 0, icon: Newspaper, color: "bg-primary/10 text-primary" },
        { label: "บุคลากร", value: personnel.count ?? 0, icon: Users, color: "bg-accent/15 text-accent-foreground" },
        { label: "เอกสาร", value: docs.count ?? 0, icon: FileText, color: "bg-secondary text-secondary-foreground" },
        { label: "ร้องเรียนรอดำเนินการ", value: complaints.count ?? 0, icon: MessageSquareWarning, color: "bg-destructive/10 text-destructive" },
        { label: "อัลบั้มรูปภาพ", value: albums.count ?? 0, icon: ImageIcon, color: "bg-primary/10 text-primary" },
        { label: "สินค้า OTOP", value: otop.count ?? 0, icon: Package, color: "bg-accent/15 text-accent-foreground" },
        { label: "ผู้รับข่าวสาร", value: subs.count ?? 0, icon: Mail, color: "bg-secondary text-secondary-foreground" },
        { label: "ผู้เข้าชมวันนี้", value: visitors.data?.visit_count ?? 0, icon: Eye, color: "bg-primary/10 text-primary" },
      ]);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">แดชบอร์ด</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ยินดีต้อนรับ <span className="font-medium text-foreground">{user?.email}</span> · สรุปข้อมูลภาพรวมเว็บไซต์
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="hover:shadow-md transition-base">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground truncate">{s.label}</div>
                  <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เริ่มต้นใช้งาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• เมนูจัดการเนื้อหาทั้งหมดอยู่ที่แถบด้านซ้าย (เปิด/ปิดได้บนมือถือ)</p>
          <p>• โมดูลย่อย (CRUD ข่าว, บุคลากร, เอกสาร ฯลฯ) จะถูกสร้างใน Phase ถัดไป</p>
          <p>• สถานะปัจจุบัน: ระบบล็อกอิน + ตรวจสอบสิทธิ์ admin พร้อมใช้งานแล้ว ✓</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
