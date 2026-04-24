import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";

interface OtopRow {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  image_urls?: string[] | null;
}

interface FormState {
  id?: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  image_url: string | null;
  contact_name: string;
  contact_phone: string;
  is_active: boolean;
  order_index: number;
  image_urls: string[];
}

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  unit: "",
  image_url: null,
  contact_name: "",
  contact_phone: "",
  is_active: true,
  order_index: 0,
  image_urls: [],
};

const OtopAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<OtopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("otop_products")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    setRows((data ?? []) as OtopRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.contact_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const openCreate = () => {
    const nextOrder = (rows[rows.length - 1]?.order_index ?? 0) + 10;
    setForm({ ...emptyForm, order_index: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (row: OtopRow) => {
    setForm({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      price: row.price !== null ? String(row.price) : "",
      unit: row.unit ?? "",
      image_url: row.image_url,
      contact_name: row.contact_name ?? "",
      contact_phone: row.contact_phone ?? "",
      is_active: row.is_active,
      order_index: row.order_index,
      image_urls: row.image_urls ?? [],
    });
    setDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("ไฟล์ใหญ่เกิน 5MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `otop/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
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
    if (!form.name.trim()) return toast.error("กรุณากรอกชื่อสินค้า");
    setSaving(true);
    const priceNum = form.price.trim() === "" ? null : Number(form.price);
    if (priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0)) {
      setSaving(false);
      return toast.error("ราคาต้องเป็นตัวเลขที่ถูกต้อง");
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: priceNum,
      unit: form.unit.trim() || null,
      image_url: form.image_url,
      contact_name: form.contact_name.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      is_active: form.is_active,
      order_index: Number.isFinite(form.order_index) ? form.order_index : 0,
      image_urls: form.image_urls,
    };
    const { error } = form.id
      ? await supabase.from("otop_products").update(payload).eq("id", form.id)
      : await supabase.from("otop_products").insert(payload);
    setSaving(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    toast.success(form.id ? "แก้ไขเรียบร้อย" : "เพิ่มสินค้าเรียบร้อย");
    setDialogOpen(false);
    fetchAll();
  };

  const toggleActive = async (row: OtopRow) => {
    const { error } = await supabase
      .from("otop_products")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const moveOrder = async (row: OtopRow, direction: "up" | "down") => {
    const sorted = [...rows].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swapWith = direction === "up" ? sorted[idx - 1] : sorted[idx + 1];
    if (!swapWith) return;
    await supabase.from("otop_products").update({ order_index: swapWith.order_index }).eq("id", row.id);
    await supabase.from("otop_products").update({ order_index: row.order_index }).eq("id", swapWith.id);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("otop_products").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบเรียบร้อย");
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">จัดการสินค้า OTOP</h1>
          <p className="text-sm text-muted-foreground">สินค้าและผลิตภัณฑ์ชุมชนของหมู่บ้าน</p>
        </div>
        <Button variant="royal" onClick={openCreate}>
          <Plus className="h-4 w-4" /> เพิ่มสินค้า
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">รูป</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead className="hidden md:table-cell">ราคา</TableHead>
                <TableHead className="hidden lg:table-cell">ผู้ผลิต/ติดต่อ</TableHead>
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
                    ยังไม่มีสินค้า OTOP
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt={r.name}
                          className="h-12 w-12 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {r.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {r.price !== null ? (
                        <>
                          ฿{Number(r.price).toLocaleString("th-TH")}
                          {r.unit && <span className="text-xs text-muted-foreground"> /{r.unit}</span>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">สอบถาม</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {r.contact_name && <div>{r.contact_name}</div>}
                      {r.contact_phone && <div>📞 {r.contact_phone}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1">
                        <span className="text-sm tabular-nums w-6 text-center">{r.order_index}</span>
                        <div className="flex flex-col">
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveOrder(r, "up")} disabled={i === 0}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveOrder(r, "down")} disabled={i === filtered.length - 1}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge className="bg-primary text-primary-foreground">แสดง</Badge>
                      ) : (
                        <Badge variant="secondary">ซ่อน</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => toggleActive(r)} title={r.is_active ? "ซ่อน" : "แสดง"}>
                          {r.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="แก้ไข">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(r.id)}
                          className="text-destructive hover:text-destructive"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "แก้ไขสินค้า" : "เพิ่มสินค้า OTOP"}</DialogTitle>
            <DialogDescription>กรอกข้อมูลสินค้าและผู้ผลิต</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="o-name">ชื่อสินค้า *</Label>
              <Input
                id="o-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="เช่น ผ้าทอมือลายแซร์ออ"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="o-desc">รายละเอียด</Label>
              <Textarea
                id="o-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="เรื่องราว/วิธีการผลิต/วัตถุดิบ"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="o-price">ราคา (บาท)</Label>
                <Input
                  id="o-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-unit">หน่วย</Label>
                <Input
                  id="o-unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="ผืน/ชิ้น/กล่อง"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-order">ลำดับ</Label>
                <Input
                  id="o-order"
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value || "0", 10) }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="o-cname">ผู้ผลิต/ผู้ขาย</Label>
                <Input
                  id="o-cname"
                  value={form.contact_name}
                  onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                  placeholder="ชื่อผู้ผลิต"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-cphone">เบอร์ติดต่อ</Label>
                <Input
                  id="o-cphone"
                  value={form.contact_phone}
                  onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="08x-xxx-xxxx"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>รูปสินค้า</Label>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="preview"
                  className="h-32 w-32 object-cover rounded-md border border-border"
                />
              )}
              <div>
                <input
                  id="o-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                  <label htmlFor="o-file" className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.image_url ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                  </label>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <MultiImageUploader
                value={form.image_urls}
                onChange={(urls) => setForm((f) => ({ ...f, image_urls: urls }))}
                bucket="site-assets"
                folder={`otop/${user?.id ?? "anon"}/gallery`}
                label="รูปสินค้าเพิ่มเติม (มุมมองอื่น ๆ)"
                helpText="รองรับสูงสุด 8MB ต่อไฟล์ • แสดงเป็นแกลเลอรี่ในหน้าสินค้า"
                maxSizeMB={8}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="o-active" className="cursor-pointer">แสดงบนเว็บไซต์</Label>
                <p className="text-xs text-muted-foreground">ปิดเพื่อซ่อนชั่วคราว</p>
              </div>
              <Switch
                id="o-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>ยกเลิก</Button>
            <Button variant="royal" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? ไม่สามารถกู้คืนได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OtopAdmin;
