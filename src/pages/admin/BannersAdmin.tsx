import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type BannerType = "banner" | "popup";

interface BannerRow {
  id: string;
  type: BannerType;
  title: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  order_index: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

interface FormState {
  id?: string;
  type: BannerType;
  title: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  order_index: number;
  start_at: string; // datetime-local string
  end_at: string;
}

const emptyForm: FormState = {
  type: "banner",
  title: "",
  image_url: "",
  link_url: "",
  is_active: true,
  order_index: 0,
  start_at: "",
  end_at: "",
};

// Convert ISO -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
const isoToLocalInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const localInputToIso = (s: string): string | null => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const isCurrentlyActive = (b: BannerRow): boolean => {
  if (!b.is_active) return false;
  const now = Date.now();
  if (b.start_at && new Date(b.start_at).getTime() > now) return false;
  if (b.end_at && new Date(b.end_at).getTime() <= now) return false;
  return true;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BannersAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | BannerType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banners")
      .select("id,type,title,image_url,link_url,is_active,order_index,start_at,end_at,created_at")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    setRows((data ?? []) as BannerRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(
    () => (filterType === "all" ? rows : rows.filter((r) => r.type === filterType)),
    [rows, filterType],
  );

  const openCreate = () => {
    const nextOrder = (rows[rows.length - 1]?.order_index ?? 0) + 10;
    setForm({ ...emptyForm, order_index: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (row: BannerRow) => {
    setForm({
      id: row.id,
      type: row.type,
      title: row.title ?? "",
      image_url: row.image_url,
      link_url: row.link_url ?? "",
      is_active: row.is_active,
      order_index: row.order_index,
      start_at: isoToLocalInput(row.start_at),
      end_at: isoToLocalInput(row.end_at),
    });
    setDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return toast.error("ไฟล์ใหญ่เกิน 15MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `banners/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("อัปโหลดไม่สำเร็จ: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("อัปโหลดรูปสำเร็จ");
  };

  const handleSave = async () => {
    if (!form.image_url.trim()) return toast.error("กรุณาอัปโหลดรูปแบนเนอร์");
    const startIso = localInputToIso(form.start_at);
    const endIso = localInputToIso(form.end_at);
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      return toast.error("วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น");
    }

    setSaving(true);
    const payload = {
      type: form.type,
      title: form.title.trim() || null,
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      is_active: form.is_active,
      order_index: Number.isFinite(form.order_index) ? form.order_index : 0,
      start_at: startIso,
      end_at: endIso,
    };

    const { error } = form.id
      ? await supabase.from("banners").update(payload).eq("id", form.id)
      : await supabase.from("banners").insert(payload);
    setSaving(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    toast.success(form.id ? "แก้ไขเรียบร้อย" : "เพิ่มแบนเนอร์เรียบร้อย");
    setDialogOpen(false);
    fetchAll();
  };

  const toggleActive = async (row: BannerRow) => {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const moveOrder = async (row: BannerRow, direction: "up" | "down") => {
    const sorted = [...filtered].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swapWith = direction === "up" ? sorted[idx - 1] : sorted[idx + 1];
    if (!swapWith) return;
    const { error: e1 } = await supabase
      .from("banners")
      .update({ order_index: swapWith.order_index })
      .eq("id", row.id);
    const { error: e2 } = await supabase
      .from("banners")
      .update({ order_index: row.order_index })
      .eq("id", swapWith.id);
    if (e1 || e2) return toast.error((e1 ?? e2)!.message);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("banners").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบเรียบร้อย");
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">จัดการแบนเนอร์ / ป๊อปอัป</h1>
          <p className="text-sm text-muted-foreground">ตั้งค่าแบนเนอร์หน้าแรกและป๊อปอัปประกาศ พร้อมกำหนดช่วงเวลาแสดง</p>
        </div>
        <Button variant="royal" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          เพิ่มแบนเนอร์
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | BannerType)}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="banner">แบนเนอร์</SelectItem>
            <SelectItem value="popup">ป๊อปอัป</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">รูป</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead className="hidden md:table-cell">ประเภท</TableHead>
                <TableHead className="hidden lg:table-cell">ช่วงเวลาแสดง</TableHead>
                <TableHead className="w-[100px]">ลำดับ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    ยังไม่มีแบนเนอร์
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, i) => {
                  const live = isCurrentlyActive(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <img
                          src={r.image_url}
                          alt={r.title ?? "banner"}
                          className="h-12 w-20 object-cover rounded border border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground line-clamp-1 max-w-xs">
                          {r.title || <span className="text-muted-foreground italic">ไม่มีชื่อ</span>}
                        </div>
                        {r.link_url && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">→ {r.link_url}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {r.type === "banner" ? "แบนเนอร์" : "ป๊อปอัป"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        <div>เริ่ม: {formatDate(r.start_at)}</div>
                        <div>สิ้นสุด: {formatDate(r.end_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1">
                          <span className="text-sm tabular-nums w-6 text-center">{r.order_index}</span>
                          <div className="flex flex-col">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => moveOrder(r, "up")}
                              disabled={i === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => moveOrder(r, "down")}
                              disabled={i === filtered.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {live ? (
                            <Badge className="bg-primary text-primary-foreground">กำลังแสดง</Badge>
                          ) : r.is_active ? (
                            <Badge variant="outline">นอกช่วงเวลา</Badge>
                          ) : (
                            <Badge variant="secondary">ปิด</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title={r.is_active ? "ปิด" : "เปิด"}
                            onClick={() => toggleActive(r)}
                          >
                            {r.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" title="แก้ไข" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="ลบ"
                            onClick={() => setDeleteId(r.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์"}</DialogTitle>
            <DialogDescription>กำหนดรูป ลิงก์ และช่วงเวลาที่จะแสดง</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ประเภท</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as BannerType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">แบนเนอร์ (Hero / Slide)</SelectItem>
                    <SelectItem value="popup">ป๊อปอัปประกาศ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-order">ลำดับ</Label>
                <Input
                  id="b-order"
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value || "0", 10) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-title">ชื่อ / Alt text</Label>
              <Input
                id="b-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ข้อความสำหรับ SEO/อ่านสกรีน"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-link">ลิงก์ปลายทาง</Label>
              <Input
                id="b-link"
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                placeholder="https://... หรือ /news/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>รูปแบนเนอร์ *</Label>
              {form.image_url ? (
                <div className="flex items-start gap-3">
                  <img
                    src={form.image_url}
                    alt="banner"
                    className="h-32 w-auto rounded border border-border object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                  >
                    ลบรูป
                  </Button>
                </div>
              ) : (
                <div className="h-32 w-full rounded border border-dashed border-border bg-muted/40 flex items-center justify-center text-muted-foreground text-sm">
                  <ImageIcon className="h-5 w-5 mr-2" /> ยังไม่ได้อัปโหลดรูป
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.gif"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                  className="max-w-xs"
                />
                {uploading && (
                  <span className="inline-flex items-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" /> กำลังอัปโหลด
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="h-3 w-3" /> แนะนำสัดส่วน 16:9 รองรับ GIF ไฟล์ไม่เกิน 15MB
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="b-start">เริ่มแสดง</Label>
                <Input
                  id="b-start"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">เว้นว่าง = แสดงทันที</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-end">สิ้นสุด</Label>
                <Input
                  id="b-end"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">เว้นว่าง = แสดงไม่จำกัด</p>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-md border border-border p-3 cursor-pointer">
              <div>
                <div className="font-medium text-sm">เปิดใช้งาน</div>
                <div className="text-xs text-muted-foreground">ปิดเพื่อซ่อนชั่วคราว แม้อยู่ในช่วงเวลา</div>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button variant="royal" onClick={handleSave} disabled={saving || uploading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบแบนเนอร์</AlertDialogTitle>
            <AlertDialogDescription>
              การลบไม่สามารถย้อนกลับได้ ต้องการดำเนินการต่อหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannersAdmin;
