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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_size: number | null;
  fiscal_year: number | null;
  download_count: number;
  is_published: boolean;
  created_at: string;
}

const CATEGORIES = [
  "แผนพัฒนา",
  "งบประมาณ",
  "รายงานผล",
  "กฎหมาย/ระเบียบ",
  "แบบฟอร์ม",
  "ITA",
  "อื่นๆ",
];

interface FormState {
  id?: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_size: number | null;
  fiscal_year: string;
  is_published: boolean;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  category: CATEGORIES[0],
  file_url: "",
  file_size: null,
  fiscal_year: "",
  is_published: true,
};

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
};

const DocumentsAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    setRows((data ?? []) as DocRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCat !== "all" && r.category !== filterCat) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, filterCat]);

  const openCreate = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: DocRow) => {
    setForm({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      category: row.category,
      file_url: row.file_url,
      file_size: row.file_size,
      fiscal_year: row.fiscal_year !== null ? String(row.fiscal_year) : "",
      is_published: row.is_published,
    });
    setDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("ไฟล์ใหญ่เกิน 50MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user?.id ?? "anon"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("อัปโหลดไม่สำเร็จ: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    setForm((f) => ({
      ...f,
      file_url: data.publicUrl,
      file_size: file.size,
      title: f.title || file.name.replace(/\.[^.]+$/, ""),
    }));
    setUploading(false);
    toast.success("อัปโหลดเอกสารสำเร็จ");
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("กรุณากรอกชื่อเอกสาร");
    if (!form.file_url.trim()) return toast.error("กรุณาอัปโหลดไฟล์เอกสาร");
    setSaving(true);
    const fy = form.fiscal_year.trim() === "" ? null : parseInt(form.fiscal_year, 10);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      file_url: form.file_url.trim(),
      file_size: form.file_size,
      fiscal_year: fy,
      is_published: form.is_published,
      uploaded_by: user?.id ?? null,
    };
    const { error } = form.id
      ? await supabase.from("documents").update(payload).eq("id", form.id)
      : await supabase.from("documents").insert(payload);
    setSaving(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    toast.success(form.id ? "แก้ไขเรียบร้อย" : "เพิ่มเอกสารเรียบร้อย");
    setDialogOpen(false);
    fetchAll();
  };

  const togglePublished = async (row: DocRow) => {
    const { error } = await supabase
      .from("documents")
      .update({ is_published: !row.is_published })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("documents").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบเรียบร้อย");
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">จัดการเอกสารดาวน์โหลด</h1>
          <p className="text-sm text-muted-foreground">เอกสารราชการ แผน งบประมาณ และแบบฟอร์มต่างๆ</p>
        </div>
        <Button variant="royal" onClick={openCreate}>
          <Plus className="h-4 w-4" /> เพิ่มเอกสาร
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-background p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเอกสาร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวด</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อเอกสาร</TableHead>
                <TableHead className="hidden md:table-cell">หมวด</TableHead>
                <TableHead className="hidden lg:table-cell">ปี งปม.</TableHead>
                <TableHead className="hidden lg:table-cell">ขนาด</TableHead>
                <TableHead className="hidden md:table-cell">ดาวน์โหลด</TableHead>
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
                    ไม่พบเอกสาร
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{r.title}</div>
                          {r.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                              {r.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{r.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.fiscal_year ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {formatBytes(r.file_size)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm tabular-nums">
                      {r.download_count.toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      {r.is_published ? (
                        <Badge className="bg-primary text-primary-foreground">เผยแพร่</Badge>
                      ) : (
                        <Badge variant="secondary">ร่าง</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" asChild title="เปิดไฟล์">
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => togglePublished(r)} title={r.is_published ? "ซ่อน" : "เผยแพร่"}>
                          {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            <DialogTitle>{form.id ? "แก้ไขเอกสาร" : "เพิ่มเอกสาร"}</DialogTitle>
            <DialogDescription>อัปโหลดและกรอกข้อมูลเอกสาร</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ไฟล์เอกสาร *</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  id="d-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                  <label htmlFor="d-file" className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.file_url ? "เปลี่ยนไฟล์" : "อัปโหลดไฟล์"}
                  </label>
                </Button>
                {form.file_url && (
                  <a
                    href={form.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> ดูไฟล์ ({formatBytes(form.file_size)})
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground">รองรับ PDF, Word, Excel, PowerPoint, ZIP — ไม่เกิน 50MB</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-title">ชื่อเอกสาร *</Label>
              <Input
                id="d-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="เช่น แผนพัฒนาหมู่บ้าน 2568"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-desc">รายละเอียด</Label>
              <Textarea
                id="d-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-cat">หมวด</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger id="d-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-fy">ปีงบประมาณ (พ.ศ.)</Label>
                <Input
                  id="d-fy"
                  type="number"
                  value={form.fiscal_year}
                  onChange={(e) => setForm((f) => ({ ...f, fiscal_year: e.target.value }))}
                  placeholder="2568"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="d-pub" className="cursor-pointer">เผยแพร่บนเว็บไซต์</Label>
                <p className="text-xs text-muted-foreground">ปิดเพื่อบันทึกเป็นร่าง</p>
              </div>
              <Switch
                id="d-pub"
                checked={form.is_published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
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
            <AlertDialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้?</AlertDialogDescription>
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

export default DocumentsAdmin;
