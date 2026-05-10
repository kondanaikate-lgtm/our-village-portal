import { useEffect, useState } from "react";
import { ExternalLink, Eye, Image as ImageIcon, Loader2, MapPin, Pencil, Play, Plus, Save, Settings, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { HeroSection } from "@/components/home/HeroSection";
import { defaultSiteSettings, type SiteSettings } from "@/hooks/use-site-settings";
import { Slider } from "@/components/ui/slider";

const INFO_SECTIONS = [
  { key: "history", title: "ประวัติความเป็นมา" },
  { key: "vision", title: "วิสัยทัศน์ / พันธกิจ" },
  { key: "structure", title: "โครงสร้างการบริหาร" },
  { key: "authority", title: "อำนาจหน้าที่" },
  { key: "transparency", title: "ความโปร่งใส" },
  { key: "plans", title: "แผนพัฒนาท้องถิ่น" },
  { key: "budget", title: "งบประมาณ" },
  { key: "reports", title: "รายงานผลการปฏิบัติงาน" },
  { key: "ita", title: "ITA" },
  { key: "info-center", title: "ศูนย์ข้อมูลข่าวสาร" },
  { key: "policy", title: "นโยบายเว็บไซต์" },
  { key: "manual", title: "คู่มือบริการ" },
  { key: "footer-about", title: "ส่วนท้าย: ข้อความแนะนำหมู่บ้าน" },
  { key: "contact-info", title: "ติดต่อ: ข้อมูลติดต่อ (ที่อยู่/โทร/อีเมล)" },
  { key: "contact-hours", title: "ติดต่อ: เวลาทำการ" },
  { key: "contact-map", title: "ติดต่อ: ลิงก์/ฝัง Google Maps (วาง iframe หรือ URL)" },
];

interface InfoRow {
  id?: string;
  section_key: string;
  title: string;
  content: string;
}

interface SocialRow {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon_name: string | null;
  is_active: boolean;
  order_index: number;
}

interface SiteSettingsRow {
  site_name: string;
  logo_url: string | null;
  hero_display_mode: "single" | "carousel";
  hero_layout: "overlay" | "image-only";
  hero_height: "compact" | "normal" | "tall" | "aspect";
  hero_autoplay: boolean;
  hero_autoplay_delay: number;
  hero_show_cta: boolean;
  hero_image_fit: "cover" | "contain";
  hero_autoplay_start: string | null;
  hero_autoplay_end: string | null;
  hero_respect_reduced_motion: boolean;
  hero_height_aspect: boolean;
  hero_aspect_ratio: string;
  footer_columns: number;
  footer_align: "left" | "center";
  footer_show_quicklinks: boolean;
  footer_show_headman: boolean;
  footer_show_social: boolean;
  contact_layout: "two-column" | "stacked";
  contact_map_position: "right" | "below";
  about_align: "left" | "center";
  about_hero_style: "gradient" | "minimal";
}

const emptySocial = { platform: "", label: "", url: "", icon_name: "", is_active: true, order_index: 0 };

const SettingsAdmin = () => {
  const { user } = useAuth();
  const [infos, setInfos] = useState<Record<string, InfoRow>>({});
  const [activeKey, setActiveKey] = useState(INFO_SECTIONS[0].key);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialForm, setSocialForm] = useState<(typeof emptySocial) & { id?: string }>(emptySocial);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsRow>({
    site_name: "หมู่บ้านแซร์ออ หมู่ที่ 2",
    logo_url: null,
    hero_display_mode: "carousel",
    hero_layout: "overlay",
    hero_height: "normal",
    hero_autoplay: true,
    hero_autoplay_delay: 5500,
    hero_show_cta: true,
    hero_image_fit: "cover",
    hero_autoplay_start: null,
    hero_autoplay_end: null,
    hero_respect_reduced_motion: true,
    hero_height_aspect: false,
    hero_aspect_ratio: "16/9",
    footer_columns: 4,
    footer_align: "left",
    footer_show_quicklinks: true,
    footer_show_headman: true,
    footer_show_social: true,
    contact_layout: "two-column",
    contact_map_position: "right",
    about_align: "left",
    about_hero_style: "gradient",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewResetKey, setPreviewResetKey] = useState(0);
  const [previewForceAutoplay, setPreviewForceAutoplay] = useState(false);

  const load = async () => {
    setLoading(true);
    const [infoResult, socialResult, settingsResult] = await Promise.all([
      supabase.from("village_info").select("id,section_key,title,content"),
      supabase.from("social_links").select("*").order("order_index", { ascending: true }),
      (supabase as any).from("site_settings").select("site_name,logo_url,hero_display_mode,hero_layout,hero_height,hero_autoplay,hero_autoplay_delay,hero_show_cta,hero_image_fit,hero_autoplay_start,hero_autoplay_end,hero_respect_reduced_motion,hero_height_aspect,hero_aspect_ratio").eq("key", "main").maybeSingle(),
      // also fetch layout columns in same row
    ]);
    const settingsResult2 = await (supabase as any).from("site_settings").select("footer_columns,footer_align,footer_show_quicklinks,footer_show_headman,footer_show_social,contact_layout,contact_map_position,about_align,about_hero_style").eq("key", "main").maybeSingle();
    if (infoResult.error) toast.error(infoResult.error.message);
    if (socialResult.error) toast.error(socialResult.error.message);

    const next: Record<string, InfoRow> = {};
    INFO_SECTIONS.forEach((section) => {
      const found = infoResult.data?.find((r) => r.section_key === section.key);
      next[section.key] = {
        id: found?.id,
        section_key: section.key,
        title: found?.title ?? section.title,
        content: found?.content ?? "",
      };
    });
    setInfos(next);
    setSocials((socialResult.data ?? []) as SocialRow[]);
    if (settingsResult.data) {
      const d: any = settingsResult.data;
      const d2: any = settingsResult2?.data ?? {};
      const trimTime = (t: string | null | undefined) => (t ? String(t).slice(0, 5) : null);
      setSiteSettings({
        site_name: d.site_name ?? "หมู่บ้านแซร์ออ หมู่ที่ 2",
        logo_url: d.logo_url ?? null,
        hero_display_mode: d.hero_display_mode === "single" ? "single" : "carousel",
        hero_layout: d.hero_layout === "image-only" ? "image-only" : "overlay",
        hero_height: ["compact", "normal", "tall", "aspect"].includes(d.hero_height) ? d.hero_height : "normal",
        hero_autoplay: d.hero_autoplay !== false,
        hero_autoplay_delay: Number(d.hero_autoplay_delay) || 5500,
        hero_show_cta: d.hero_show_cta !== false,
        hero_image_fit: d.hero_image_fit === "contain" ? "contain" : "cover",
        hero_autoplay_start: trimTime(d.hero_autoplay_start),
        hero_autoplay_end: trimTime(d.hero_autoplay_end),
        hero_respect_reduced_motion: d.hero_respect_reduced_motion !== false,
        hero_height_aspect: d.hero_height_aspect === true,
        hero_aspect_ratio: d.hero_aspect_ratio || "16/9",
        footer_columns: [1, 2, 3, 4].includes(Number(d2.footer_columns)) ? Number(d2.footer_columns) : 4,
        footer_align: d2.footer_align === "center" ? "center" : "left",
        footer_show_quicklinks: d2.footer_show_quicklinks !== false,
        footer_show_headman: d2.footer_show_headman !== false,
        footer_show_social: d2.footer_show_social !== false,
        contact_layout: d2.contact_layout === "stacked" ? "stacked" : "two-column",
        contact_map_position: d2.contact_map_position === "below" ? "below" : "right",
        about_align: d2.about_align === "center" ? "center" : "left",
        about_hero_style: d2.about_hero_style === "minimal" ? "minimal" : "gradient",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const activeInfo = infos[activeKey];

  const updateInfo = (patch: Partial<InfoRow>) => {
    setInfos((prev) => ({ ...prev, [activeKey]: { ...prev[activeKey], ...patch } }));
  };

  const saveInfo = async () => {
    if (!activeInfo?.title.trim()) return toast.error("กรุณากรอกชื่อหัวข้อ");
    setSavingInfo(true);
    const payload = {
      section_key: activeInfo.section_key,
      title: activeInfo.title.trim(),
      content: activeInfo.content || null,
      updated_by: user?.id ?? null,
    };
    const { data, error } = activeInfo.id
      ? await supabase.from("village_info").update(payload).eq("id", activeInfo.id).select("id").single()
      : await supabase.from("village_info").insert(payload).select("id").single();
    setSavingInfo(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    if (data?.id) updateInfo({ id: data.id });
    toast.success("บันทึกเนื้อหาเรียบร้อย");
  };

  const uploadLogo = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("ไฟล์ใหญ่เกิน 5MB");
    setUploadingLogo(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `logos/${user?.id ?? "admin"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { cacheControl: "3600", upsert: false });
    setUploadingLogo(false);
    if (error) return toast.error("อัปโหลดโลโก้ไม่สำเร็จ: " + error.message);
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setSiteSettings((s) => ({ ...s, logo_url: data.publicUrl }));
    toast.success("อัปโหลดโลโก้สำเร็จ");
  };

  const saveSiteSettings = async () => {
    if (!siteSettings.site_name.trim()) return toast.error("กรุณากรอกชื่อเว็บไซต์");
    setSavingSettings(true);
    const { error } = await (supabase as any).from("site_settings").upsert({
      key: "main",
      site_name: siteSettings.site_name.trim(),
      logo_url: siteSettings.logo_url,
      hero_display_mode: siteSettings.hero_display_mode,
      hero_layout: siteSettings.hero_layout,
      hero_height: siteSettings.hero_height,
      hero_autoplay: siteSettings.hero_autoplay,
      hero_autoplay_delay: siteSettings.hero_autoplay_delay,
      hero_show_cta: siteSettings.hero_show_cta,
      hero_image_fit: siteSettings.hero_image_fit,
      hero_autoplay_start: siteSettings.hero_autoplay_start || null,
      hero_autoplay_end: siteSettings.hero_autoplay_end || null,
      hero_respect_reduced_motion: siteSettings.hero_respect_reduced_motion,
      hero_height_aspect: siteSettings.hero_height_aspect,
      hero_aspect_ratio: siteSettings.hero_aspect_ratio || "16/9",
      footer_columns: siteSettings.footer_columns,
      footer_align: siteSettings.footer_align,
      footer_show_quicklinks: siteSettings.footer_show_quicklinks,
      footer_show_headman: siteSettings.footer_show_headman,
      footer_show_social: siteSettings.footer_show_social,
      contact_layout: siteSettings.contact_layout,
      contact_map_position: siteSettings.contact_map_position,
      about_align: siteSettings.about_align,
      about_hero_style: siteSettings.about_hero_style,
      updated_by: user?.id ?? null,
    });
    setSavingSettings(false);
    if (error) return toast.error("บันทึกการตั้งค่าไม่สำเร็จ: " + error.message);
    toast.success("บันทึกการตั้งค่าเว็บไซต์เรียบร้อย");
  };

  const openSocial = (row?: SocialRow) => {
    setSocialForm(row ? { ...row, icon_name: row.icon_name ?? "" } : { ...emptySocial, order_index: (socials.at(-1)?.order_index ?? 0) + 10 });
    setSocialOpen(true);
  };

  const saveSocial = async () => {
    if (!socialForm.platform.trim() || !socialForm.label.trim() || !socialForm.url.trim()) return toast.error("กรุณากรอกข้อมูลให้ครบ");
    try {
      new URL(socialForm.url);
    } catch {
      return toast.error("URL ไม่ถูกต้อง");
    }
    const payload = {
      platform: socialForm.platform.trim(),
      label: socialForm.label.trim(),
      url: socialForm.url.trim(),
      icon_name: socialForm.icon_name.trim() || null,
      is_active: socialForm.is_active,
      order_index: Number(socialForm.order_index) || 0,
    };
    const { error } = socialForm.id
      ? await supabase.from("social_links").update(payload).eq("id", socialForm.id)
      : await supabase.from("social_links").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("บันทึกช่องทางเรียบร้อย");
    setSocialOpen(false);
    load();
  };

  const removeSocial = async (id: string) => {
    if (!confirm("ลบช่องทางนี้?")) return;
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("ลบแล้ว");
    load();
  };

  const toggleSocial = async (row: SocialRow) => {
    const { error } = await supabase.from("social_links").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> ตั้งค่าเว็บไซต์</h1>
        <p className="text-sm text-muted-foreground">จัดการเนื้อหาหน้าสาธารณะและช่องทางติดต่อออนไลน์</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />กำลังโหลด...</div>
      ) : (
        <Tabs defaultValue="site" className="space-y-4">
          <TabsList>
            <TabsTrigger value="site">ตั้งค่าหลัก</TabsTrigger>
            <TabsTrigger value="layout">เลย์เอาต์</TabsTrigger>
            <TabsTrigger value="info">เนื้อหาเว็บไซต์</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
          </TabsList>
          <TabsContent value="site" className="space-y-4">
            <Card className="p-4 md:p-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5"><Label>ชื่อเว็บไซต์</Label><Input value={siteSettings.site_name} onChange={(e) => setSiteSettings((s) => ({ ...s, site_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>รูปแบบแบนเนอร์พื้นหลัง</Label><Select value={siteSettings.hero_display_mode} onValueChange={(v) => setSiteSettings((s) => ({ ...s, hero_display_mode: v as "single" | "carousel" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">ค้างรูปเดียว</SelectItem><SelectItem value="carousel">เปลี่ยนรูปไปเรื่อย ๆ</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-1.5">
                <Label>โหมดการแสดงผลแบนเนอร์</Label>
                <Select value={siteSettings.hero_layout} onValueChange={(v) => setSiteSettings((s) => ({ ...s, hero_layout: v as "overlay" | "image-only" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overlay">แสดงข้อความและปุ่มทับรูป (ค่าเริ่มต้น)</SelectItem>
                    <SelectItem value="image-only">โชว์รูปแบนเนอร์เต็ม ๆ ไม่มีตัวหนังสือบัง</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">โหมด "โชว์รูปเต็ม" เหมาะกับแบนเนอร์ที่มีข้อความอยู่ในรูปอยู่แล้ว ระบบจะไม่ครอบรูปและไม่แสดงข้อความซ้อนทับ</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>ความสูงแบนเนอร์</Label>
                  <Select value={siteSettings.hero_height_aspect ? "aspect" : siteSettings.hero_height} onValueChange={(v) => setSiteSettings((s) => v === "aspect"
                    ? { ...s, hero_height_aspect: true, hero_height: "normal" }
                    : { ...s, hero_height_aspect: false, hero_height: v as "compact" | "normal" | "tall" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">เตี้ย (compact)</SelectItem>
                      <SelectItem value="normal">ปกติ (normal)</SelectItem>
                      <SelectItem value="tall">สูง (tall) — เห็นรูปเต็มชัดเจน</SelectItem>
                      <SelectItem value="aspect">ปรับตามสัดส่วนรูป (aspect ratio)</SelectItem>
                    </SelectContent>
                  </Select>
                  {(siteSettings.hero_height_aspect || siteSettings.hero_height === "aspect") && (
                    <div className="pt-2 space-y-1.5">
                      <Label className="text-xs">อัตราส่วนภาพ</Label>
                      <Select value={siteSettings.hero_aspect_ratio} onValueChange={(v) => setSiteSettings((s) => ({ ...s, hero_aspect_ratio: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="21/9">21:9 (ultra-wide)</SelectItem>
                          <SelectItem value="16/9">16:9 (widescreen)</SelectItem>
                          <SelectItem value="3/2">3:2</SelectItem>
                          <SelectItem value="4/3">4:3</SelectItem>
                          <SelectItem value="1/1">1:1 (จัตุรัส)</SelectItem>
                          <SelectItem value="4/5">4:5 (portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">โหมดนี้จะปรับความสูงตามสัดส่วนของภาพแบนเนอร์ ทำให้ภาพที่สัดส่วนต่างกันไม่ถูกบังคับเกินไป</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>การครอบรูปแบนเนอร์</Label>
                  <Select value={siteSettings.hero_image_fit} onValueChange={(v) => setSiteSettings((s) => ({ ...s, hero_image_fit: v as "cover" | "contain" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">เต็มพื้นที่ (cover) — อาจครอบบางส่วน</SelectItem>
                      <SelectItem value="contain">เห็นรูปเต็ม (contain) — ไม่ครอบ</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">ถ้ารูปแบนเนอร์มีข้อความสำคัญ แนะนำใช้ contain เพื่อไม่ให้โดนครอบหาย</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-end">
                <div className="space-y-1.5">
                  <Label>เปิดเล่นสไลด์อัตโนมัติ</Label>
                  <div className="h-10 flex items-center"><Switch checked={siteSettings.hero_autoplay} onCheckedChange={(v) => setSiteSettings((s) => ({ ...s, hero_autoplay: v }))} /></div>
                </div>
                <div className="space-y-1.5">
                  <Label>ค้างแต่ละรูปนาน {(siteSettings.hero_autoplay_delay / 1000).toFixed(1)} วินาที</Label>
                  <Slider min={2} max={30} step={0.5} value={[siteSettings.hero_autoplay_delay / 1000]} onValueChange={([v]) => setSiteSettings((s) => ({ ...s, hero_autoplay_delay: Math.round(v * 1000) }))} disabled={!siteSettings.hero_autoplay} />
                  <p className="text-xs text-muted-foreground">ปรับได้ 2 - 30 วินาที (ใช้กับโหมด "เปลี่ยนรูปไปเรื่อย ๆ")</p>
                </div>
                <div className="space-y-1.5">
                  <Label>แสดงปุ่ม CTA (โหมด overlay)</Label>
                  <div className="h-10 flex items-center"><Switch checked={siteSettings.hero_show_cta} onCheckedChange={(v) => setSiteSettings((s) => ({ ...s, hero_show_cta: v }))} disabled={siteSettings.hero_layout === "image-only"} /></div>
                  <p className="text-xs text-muted-foreground">ในโหมด "โชว์รูปเต็ม" จะไม่มีข้อความ/ปุ่มอยู่แล้ว</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>เริ่ม Autoplay (เวลา)</Label>
                  <Input type="time" value={siteSettings.hero_autoplay_start ?? ""} onChange={(e) => setSiteSettings((s) => ({ ...s, hero_autoplay_start: e.target.value || null }))} disabled={!siteSettings.hero_autoplay} />
                </div>
                <div className="space-y-1.5">
                  <Label>หยุด Autoplay (เวลา)</Label>
                  <Input type="time" value={siteSettings.hero_autoplay_end ?? ""} onChange={(e) => setSiteSettings((s) => ({ ...s, hero_autoplay_end: e.target.value || null }))} disabled={!siteSettings.hero_autoplay} />
                  <p className="text-xs text-muted-foreground">เว้นว่างทั้งสองช่อง = เล่นตลอดเวลา (รองรับช่วงข้ามเที่ยงคืน)</p>
                </div>
                <div className="space-y-1.5">
                  <Label>เคารพ "ลดการเคลื่อนไหว"</Label>
                  <div className="h-10 flex items-center gap-2">
                    <Switch checked={siteSettings.hero_respect_reduced_motion} onCheckedChange={(v) => setSiteSettings((s) => ({ ...s, hero_respect_reduced_motion: v }))} />
                    <span className="text-xs text-muted-foreground">ปิด autoplay อัตโนมัติเมื่อผู้ใช้เปิด prefers-reduced-motion</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>โลโก้เว็บไซต์</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {siteSettings.logo_url ? <img src={siteSettings.logo_url} alt="โลโก้เว็บไซต์" className="h-20 w-20 rounded-full object-cover border border-border" /> : <div className="h-20 w-20 rounded-full border border-dashed border-border bg-muted/40 flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}
                  <Input type="file" accept="image/*" disabled={uploadingLogo} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }} className="max-w-xs" />
                  {siteSettings.logo_url && <Button type="button" variant="outline" size="sm" onClick={() => setSiteSettings((s) => ({ ...s, logo_url: null }))}>ลบโลโก้</Button>}
                  {uploadingLogo && <span className="inline-flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-1" /> กำลังอัปโหลด</span>}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="h-3 w-3" /> รองรับไฟล์รูปภาพทั่วไป แนะนำ PNG/JPG</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>ตัวอย่างแบนเนอร์ (Live Preview)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewForceAutoplay(true);
                        setPreviewResetKey((k) => k + 1);
                        toast.success("รีเซ็ตและเล่นสไลด์โชว์ใหม่ตามความเร็วปัจจุบัน");
                      }}
                    >
                      <Play className="h-4 w-4" /> ลองใช้กับโหมดนี้
                    </Button>
                    <span className="text-xs text-muted-foreground hidden md:inline">เปลี่ยนค่าด้านบนแล้วเห็นผลทันที</span>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border border-border">
                  <HeroSection
                    resetKey={previewResetKey}
                    forceAutoplay={previewForceAutoplay}
                    settingsOverride={{
                      ...defaultSiteSettings,
                      siteName: siteSettings.site_name,
                      logoUrl: siteSettings.logo_url,
                      heroDisplayMode: siteSettings.hero_display_mode,
                      heroLayout: siteSettings.hero_layout,
                      heroHeight: siteSettings.hero_height,
                      heroAutoplay: siteSettings.hero_autoplay,
                      heroAutoplayDelay: siteSettings.hero_autoplay_delay,
                      heroShowCta: siteSettings.hero_show_cta,
                      heroImageFit: siteSettings.hero_image_fit,
                      heroAutoplayStart: siteSettings.hero_autoplay_start,
                      heroAutoplayEnd: siteSettings.hero_autoplay_end,
                      heroRespectReducedMotion: siteSettings.hero_respect_reduced_motion,
                      heroHeightAspect: siteSettings.hero_height_aspect,
                      heroAspectRatio: siteSettings.hero_aspect_ratio,
                    } as SiteSettings}
                  />
                </div>
              </div>
              <div className="flex justify-end"><Button variant="royal" onClick={saveSiteSettings} disabled={savingSettings || uploadingLogo}>{savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึกการตั้งค่า</Button></div>
            </Card>
          </TabsContent>
          <TabsContent value="layout" className="space-y-4">
            <Card className="p-4 md:p-5 space-y-6">
              <div>
                <h3 className="font-display font-semibold text-lg mb-3">ส่วนท้าย (Footer)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>จำนวนคอลัมน์</Label>
                    <Select value={String(siteSettings.footer_columns)} onValueChange={(v) => setSiteSettings((s) => ({ ...s, footer_columns: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 คอลัมน์</SelectItem>
                        <SelectItem value="2">2 คอลัมน์</SelectItem>
                        <SelectItem value="3">3 คอลัมน์</SelectItem>
                        <SelectItem value="4">4 คอลัมน์ (ค่าเริ่มต้น)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>การจัดวาง</Label>
                    <Select value={siteSettings.footer_align} onValueChange={(v) => setSiteSettings((s) => ({ ...s, footer_align: v as "left" | "center" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">ชิดซ้าย</SelectItem>
                        <SelectItem value="center">กึ่งกลาง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 mt-4">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={siteSettings.footer_show_quicklinks} onCheckedChange={(v) => setSiteSettings((s) => ({ ...s, footer_show_quicklinks: v }))} /> แสดงลิงก์ด่วน</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={siteSettings.footer_show_headman} onCheckedChange={(v) => setSiteSettings((s) => ({ ...s, footer_show_headman: v }))} /> แสดงผู้ใหญ่บ้าน</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={siteSettings.footer_show_social} onCheckedChange={(v) => setSiteSettings((s) => ({ ...s, footer_show_social: v }))} /> แสดงโซเชียล</label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-display font-semibold text-lg mb-3">หน้าติดต่อ (Contact)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>โครงสร้าง</Label>
                    <Select value={siteSettings.contact_layout} onValueChange={(v) => setSiteSettings((s) => ({ ...s, contact_layout: v as "two-column" | "stacked" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="two-column">แบบสองคอลัมน์ (ข้อมูล + แผนที่)</SelectItem>
                        <SelectItem value="stacked">แบบเรียงคอลัมน์เดียว</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>ตำแหน่งแผนที่</Label>
                    <Select value={siteSettings.contact_map_position} onValueChange={(v) => setSiteSettings((s) => ({ ...s, contact_map_position: v as "right" | "below" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">ด้านขวา</SelectItem>
                        <SelectItem value="below">ด้านล่าง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-display font-semibold text-lg mb-3">หน้าเกี่ยวกับ / ข้อมูลสาธารณะ</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>การจัดวางข้อความ</Label>
                    <Select value={siteSettings.about_align} onValueChange={(v) => setSiteSettings((s) => ({ ...s, about_align: v as "left" | "center" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">ชิดซ้าย</SelectItem>
                        <SelectItem value="center">กึ่งกลาง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>สไตล์ส่วนหัว (Hero)</Label>
                    <Select value={siteSettings.about_hero_style} onValueChange={(v) => setSiteSettings((s) => ({ ...s, about_hero_style: v as "gradient" | "minimal" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gradient">ไล่สีหลัก (gradient)</SelectItem>
                        <SelectItem value="minimal">มินิมอล (โทนอ่อน)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="royal" onClick={saveSiteSettings} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึกการตั้งค่า
                </Button>
              </div>
            </Card>

            <Card className="p-4 md:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-lg">พรีวิวเลย์เอาต์ (อัปเดตทันที)</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                ดูภาพคร่าว ๆ ของ Footer / Contact / About ตามค่าที่กำลังปรับ ก่อนกดบันทึก
              </p>

              {/* About preview */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="text-[11px] font-medium px-3 py-1 bg-muted text-muted-foreground">About — Hero</div>
                <div
                  className={cn(
                    "p-6",
                    siteSettings.about_hero_style === "gradient"
                      ? "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground"
                      : "bg-muted/40 text-foreground border-b",
                    siteSettings.about_align === "center" ? "text-center" : "text-left",
                  )}
                >
                  <h2 className="font-display text-xl font-bold">หัวข้อหน้าเกี่ยวกับ</h2>
                  <p className="text-sm opacity-90 mt-1">ตัวอย่างคำบรรยายสั้น ๆ ของหน้านี้</p>
                </div>
              </div>

              {/* Contact preview */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="text-[11px] font-medium px-3 py-1 bg-muted text-muted-foreground">Contact</div>
                <div className={cn(
                  "p-4 grid gap-3",
                  siteSettings.contact_layout === "two-column" && siteSettings.contact_map_position === "right"
                    ? "md:grid-cols-2"
                    : "grid-cols-1",
                )}>
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold">ข้อมูลติดต่อ</div>
                    <div className="text-muted-foreground">โทร / อีเมล / ที่อยู่</div>
                  </div>
                  <div className="rounded bg-muted h-24 flex items-center justify-center text-muted-foreground text-xs">
                    <MapPin className="h-4 w-4 mr-1" /> แผนที่ ({siteSettings.contact_map_position === "right" ? "ขวา" : "ด้านล่าง"})
                  </div>
                </div>
              </div>

              {/* Footer preview */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="text-[11px] font-medium px-3 py-1 bg-muted text-muted-foreground">Footer</div>
                <div className={cn(
                  "bg-foreground/95 text-background p-4 grid gap-3",
                  siteSettings.footer_align === "center" ? "text-center" : "text-left",
                  siteSettings.footer_columns === 1 && "grid-cols-1",
                  siteSettings.footer_columns === 2 && "grid-cols-2",
                  siteSettings.footer_columns === 3 && "grid-cols-3",
                  siteSettings.footer_columns === 4 && "grid-cols-2 md:grid-cols-4",
                )}>
                  <div>
                    <div className="font-semibold text-sm">เกี่ยวกับ</div>
                    <div className="text-xs opacity-70 mt-1">ข้อมูลหน่วยงาน</div>
                  </div>
                  {siteSettings.footer_show_quicklinks && (
                    <div>
                      <div className="font-semibold text-sm">ลิงก์ด่วน</div>
                      <div className="text-xs opacity-70 mt-1">ข่าวสาร · กิจกรรม</div>
                    </div>
                  )}
                  {siteSettings.footer_show_headman && (
                    <div>
                      <div className="font-semibold text-sm">ผู้ใหญ่บ้าน</div>
                      <div className="text-xs opacity-70 mt-1">ชื่อ-สกุล / ติดต่อ</div>
                    </div>
                  )}
                  {siteSettings.footer_show_social && (
                    <div>
                      <div className="font-semibold text-sm">ติดตามเรา</div>
                      <div className="text-xs opacity-70 mt-1">Facebook · LINE</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="info" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <Card className="p-2 h-fit">
                {INFO_SECTIONS.map((section) => (
                  <button key={section.key} onClick={() => setActiveKey(section.key)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-base ${activeKey === section.key ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                    {section.title}
                  </button>
                ))}
              </Card>
              <Card className="p-4 md:p-5 space-y-4">
                <div className="space-y-1.5"><Label>ชื่อหัวข้อ</Label><Input value={activeInfo?.title ?? ""} onChange={(e) => updateInfo({ title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>เนื้อหา</Label><RichTextEditor value={activeInfo?.content ?? ""} onChange={(content) => updateInfo({ content })} uploadFolder="village-info" /></div>
                <div className="flex justify-end"><Button variant="royal" onClick={saveInfo} disabled={savingInfo}>{savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึก</Button></div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="flex justify-end"><Button variant="royal" onClick={() => openSocial()}><Plus className="h-4 w-4" /> เพิ่มช่องทาง</Button></div>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>ชื่อ</TableHead><TableHead>แพลตฟอร์ม</TableHead><TableHead>URL</TableHead><TableHead>แสดง</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader>
                <TableBody>
                  {socials.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</TableCell></TableRow> : socials.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell>{row.platform}</TableCell>
                      <TableCell><a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline max-w-[260px] truncate"><ExternalLink className="h-3 w-3" />{row.url}</a></TableCell>
                      <TableCell><Switch checked={row.is_active} onCheckedChange={() => toggleSocial(row)} /></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openSocial(row)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => removeSocial(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={socialOpen} onOpenChange={setSocialOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{socialForm.id ? "แก้ไขช่องทาง" : "เพิ่มช่องทาง"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid sm:grid-cols-2 gap-3"><div className="space-y-1.5"><Label>แพลตฟอร์ม</Label><Input value={socialForm.platform} onChange={(e) => setSocialForm((f) => ({ ...f, platform: e.target.value }))} placeholder="Facebook" /></div><div className="space-y-1.5"><Label>ชื่อที่แสดง</Label><Input value={socialForm.label} onChange={(e) => setSocialForm((f) => ({ ...f, label: e.target.value }))} placeholder="Facebook หมู่บ้าน" /></div></div>
            <div className="space-y-1.5"><Label>URL</Label><Input value={socialForm.url} onChange={(e) => setSocialForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <div className="grid sm:grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Icon name</Label><Input value={socialForm.icon_name} onChange={(e) => setSocialForm((f) => ({ ...f, icon_name: e.target.value }))} placeholder="facebook / line" /></div><div className="space-y-1.5"><Label>ลำดับ</Label><Input type="number" value={socialForm.order_index} onChange={(e) => setSocialForm((f) => ({ ...f, order_index: Number(e.target.value) }))} /></div></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={socialForm.is_active} onCheckedChange={(checked) => setSocialForm((f) => ({ ...f, is_active: checked }))} /> แสดงบนเว็บไซต์</label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSocialOpen(false)}>ยกเลิก</Button><Button variant="royal" onClick={saveSocial}>บันทึก</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsAdmin;
