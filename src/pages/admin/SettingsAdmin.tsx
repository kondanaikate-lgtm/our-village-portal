import { useEffect, useState } from "react";
import { ExternalLink, Image as ImageIcon, Loader2, Pencil, Plus, Save, Settings, Trash2, Upload } from "lucide-react";
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
  const [siteSettings, setSiteSettings] = useState<SiteSettingsRow>({ site_name: "หมู่บ้านแซร์ออ หมู่ที่ 2", logo_url: null, hero_display_mode: "carousel", hero_layout: "overlay" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const load = async () => {
    setLoading(true);
    const [infoResult, socialResult, settingsResult] = await Promise.all([
      supabase.from("village_info").select("id,section_key,title,content"),
      supabase.from("social_links").select("*").order("order_index", { ascending: true }),
      (supabase as any).from("site_settings").select("site_name,logo_url,hero_display_mode,hero_layout").eq("key", "main").maybeSingle(),
    ]);
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
    if (settingsResult.data) setSiteSettings(settingsResult.data as SiteSettingsRow);
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
          <TabsList><TabsTrigger value="site">ตั้งค่าหลัก</TabsTrigger><TabsTrigger value="info">เนื้อหาเว็บไซต์</TabsTrigger><TabsTrigger value="social">Social Links</TabsTrigger></TabsList>
          <TabsContent value="site" className="space-y-4">
            <Card className="p-4 md:p-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5"><Label>ชื่อเว็บไซต์</Label><Input value={siteSettings.site_name} onChange={(e) => setSiteSettings((s) => ({ ...s, site_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>รูปแบบแบนเนอร์พื้นหลัง</Label><Select value={siteSettings.hero_display_mode} onValueChange={(v) => setSiteSettings((s) => ({ ...s, hero_display_mode: v as "single" | "carousel" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single">ค้างรูปเดียว</SelectItem><SelectItem value="carousel">เปลี่ยนรูปไปเรื่อย ๆ</SelectItem></SelectContent></Select></div>
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
              <div className="flex justify-end"><Button variant="royal" onClick={saveSiteSettings} disabled={savingSettings || uploadingLogo}>{savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึกการตั้งค่า</Button></div>
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
