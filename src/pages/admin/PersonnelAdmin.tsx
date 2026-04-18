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
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PersonnelRow {
  id: string;
  name: string;
  position: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

interface FormState {
  id?: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  bio: string;
  image_url: string | null;
  is_active: boolean;
  order_index: number;
}

const emptyForm: FormState = {
  name: "",
  position: "",
  department: "",
  phone: "",
  email: "",
  bio: "",
  image_url: null,
  is_active: true,
  order_index: 0,
};

const PersonnelAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<PersonnelRow[]>([]);
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
      .from("personnel")
      .select("id,name,position,department,phone,email,bio,image_url,is_active,order_index,created_at")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    setRows(data ?? []);
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
        r.position.toLowerCase().includes(q) ||
        (r.department ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const openCreate = () => {
    const nextOrder = (rows[rows.length - 1]?.order_index ?? 0) + 10;
    setForm({ ...emptyForm, order_index: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (row: PersonnelRow) => {
    setForm({
      id: row.id,
      name: row.name,
      position: row.position,
      department: row.department ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      bio: row.bio ?? "",
      image_url: row.image_url,
      is_active: row.is_active,
      order_index: row.order_index,
    });
    setDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("ไฟล์ใหญ่เกิน 5MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user?.id ?? "anon"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("personnel-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("อัปโหลดไม่สำเร็จ: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("personnel-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("อัปโหลดรูปสำเร็จ");
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("กรุณากรอกชื่อ");
    if (!form.position.trim()) return toast.error("กรุณากรอกตำแหน่ง");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      position: form.position.trim(),
      department: form.department.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      bio: form.bio.trim() || null,
      image_url: form.image_url,
      is_active: form.is_active,
      order_index: Number.isFinite(form.order_index) ? form.order_index : 0,
    };
    const { error } = form.id
      ? await supabase.from("personnel").update(payload).eq("id", form.id)
      : await supabase.from("personnel").insert(payload);
    setSaving(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    toast.success(form.id ? "แก้ไขเรียบร้อย" : "เพิ่มบุคลากรเรียบร้อย");
    setDialogOpen(false);
    fetchAll();
  };

  const toggleActive = async (row: PersonnelRow) => {
    const { error } = await supabase
      .from("personnel")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const moveOrder = async (row: PersonnelRow, direction: "up" | "down") => {
    const sorted = [...rows].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swapWith = direction === "up" ? sorted[idx - 1] : sorted[idx + 1];
    if (!swapWith) return;
    const { error: e1 } = await supabase
      .from("personnel")
      .update({ order_index: swapWith.order_index })
      .eq("id", row.id);
    const { error: e2 } = await supabase
      .from("personnel")
      .update({ order_index: row.order_index })
      .eq("id", swapWith.id);
    if (e1 || e2) return toast.error((e1 ?? e2)!.message);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("personnel").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบเรียบร้อย");
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">จัดการบุคลากร</h1>
          <p className="text-sm text-muted-foreground">ทำเนียบผู้บริหารและบุคลากรของหมู่บ้าน</p>
        </div>
        <Button variant="royal" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          เพิ่มบุคลากร
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ/ตำแหน่ง/แผนก..."
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
                <TableHead>ชื่อ - ตำแหน่ง</TableHead>
                <TableHead className="hidden md:table-cell">แผนก</TableHead>
                <TableHead className="hidden lg:table-cell">ติดต่อ</TableHead>
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
                    ไม่พบข้อมูลบุคลากร
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
                          className="h-12 w-12 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.position}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.department ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {r.phone && <div>📞 {r.phone}</div>}
                      {r.email && <div className="truncate max-w-[180px]">✉️ {r.email}</div>}
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
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => moveOrder(r, "down")}
                            disabled={i === filtered.length - 1}
                            title="เลื่อนลง"
                          >
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
                        <Button
                          size="icon"
                          variant="ghost"
                          title={r.is_active ? "ซ่อน" : "แสดง"}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "แก้ไขบุคลากร" : "เพิ่มบุคลากร"}</DialogTitle>
            <DialogDescription>กรอกข้อมูลบุคลากรในทำเนียบ</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">ชื่อ - นามสกุล *</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="เช่น นายสมชาย ใจดี"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-pos">ตำแหน่ง *</Label>
                <Input
                  id="p-pos"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="เช่น ประธานกรรมการหมู่บ้าน"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-dept">แผนก/ฝ่าย</Label>
                <Input
                  id="p-dept"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="เช่น ฝ่ายบริหาร"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-order">ลำดับการแสดง</Label>
                <Input
                  id="p-order"
                  type="number"
                  value={form.order_index}
                  onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value || "0", 10) }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">เบอร์โทร</Label>
                <Input
                  id="p-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="08x-xxx-xxxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email">อีเมล</Label>
                <Input
                  id="p-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-bio">ประวัติ/คำอธิบาย</Label>
              <Textarea
                id="p-bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="ข้อมูลแนะนำตัวสั้นๆ"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>รูปประจำตัว</Label>
              {form.image_url && (
                <div className="flex items-start gap-3">
                  <img
                    src={form.image_url}
                    alt="profile"
                    className="h-24 w-24 rounded-full object-cover border border-border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm((f) => ({ ...f, image_url: null }))}
                  >
                    ลบรูป
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
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
                <Upload className="h-3 w-3" /> ไฟล์ภาพไม่เกิน 5MB
              </p>
            </div>

            <label className="flex items-center justify-between rounded-md border border-border p-3 cursor-pointer">
              <div>
                <div className="font-medium text-sm">แสดงในเว็บไซต์</div>
                <div className="text-xs text-muted-foreground">เปิดเพื่อแสดงในหน้าทำเนียบและหน้าแรก</div>
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
            <AlertDialogTitle>ยืนยันการลบบุคลากร</AlertDialogTitle>
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

export default PersonnelAdmin;
