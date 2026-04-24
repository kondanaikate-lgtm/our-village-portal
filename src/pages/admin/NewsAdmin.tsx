import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Pin, PinOff, Plus, Search, Trash2, Upload, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface NewsRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  category_id: string | null;
  is_published: boolean;
  is_pinned: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  image_urls?: string[] | null;
}

type FilterStatus = "all" | "published" | "draft";

interface FormState {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  is_pinned: boolean;
  image_urls: string[];
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category_id: null,
  thumbnail_url: null,
  is_published: false,
  is_pinned: false,
  image_urls: [],
};

const NONE_CATEGORY = "__none__";

const NewsAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<NewsRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: newsData, error: newsErr }, { data: catData }] = await Promise.all([
      supabase
        .from("news")
        .select("id,title,slug,excerpt,content,thumbnail_url,category_id,is_published,is_pinned,published_at,view_count,created_at,image_urls")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("news_categories").select("id,name,slug").order("order_index"),
    ]);
    if (newsErr) toast.error("โหลดข่าวไม่สำเร็จ: " + newsErr.message);
    setRows(newsData ?? []);
    setCategories(catData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCategory !== "all" && r.category_id !== filterCategory) return false;
      if (filterStatus === "published" && !r.is_published) return false;
      if (filterStatus === "draft" && r.is_published) return false;
      if (q && !(r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, filterCategory, filterStatus]);

  const openCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (row: NewsRow) => {
    setForm({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt ?? "",
      content: row.content,
      category_id: row.category_id,
      thumbnail_url: row.thumbnail_url,
      is_published: row.is_published,
      is_pinned: row.is_pinned,
      image_urls: row.image_urls ?? [],
    });
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user?.id ?? "anon"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("news-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("อัปโหลดไม่สำเร็จ: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("news-images").getPublicUrl(path);
    setForm((f) => ({ ...f, thumbnail_url: data.publicUrl }));
    setUploading(false);
    toast.success("อัปโหลดรูปสำเร็จ");
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("กรุณากรอกหัวข้อข่าว");
    if (!form.content.trim()) return toast.error("กรุณากรอกเนื้อหาข่าว");
    const finalSlug = (form.slug || slugify(form.title)).trim();
    if (!finalSlug) return toast.error("Slug ไม่ถูกต้อง");

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: finalSlug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      category_id: form.category_id,
      thumbnail_url: form.thumbnail_url,
      is_published: form.is_published,
      is_pinned: form.is_pinned,
      published_at: form.is_published ? new Date().toISOString() : null,
      author_id: user?.id ?? null,
      image_urls: form.image_urls,
    };

    const { error } = form.id
      ? await supabase.from("news").update(payload).eq("id", form.id)
      : await supabase.from("news").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    toast.success(form.id ? "แก้ไขข่าวเรียบร้อย" : "สร้างข่าวเรียบร้อย");
    setDialogOpen(false);
    fetchAll();
  };

  const togglePublished = async (row: NewsRow) => {
    const next = !row.is_published;
    const { error } = await supabase
      .from("news")
      .update({
        is_published: next,
        published_at: next ? row.published_at ?? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "เผยแพร่แล้ว" : "ยกเลิกการเผยแพร่");
    fetchAll();
  };

  const togglePinned = async (row: NewsRow) => {
    const { error } = await supabase
      .from("news")
      .update({ is_pinned: !row.is_pinned })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("news").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบข่าวเรียบร้อย");
    fetchAll();
  };

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">จัดการข่าวสาร</h1>
          <p className="text-sm text-muted-foreground">สร้าง แก้ไข และเผยแพร่ข่าวสารของหมู่บ้าน</p>
        </div>
        <Button variant="royal" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          เพิ่มข่าวใหม่
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-background p-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาจากชื่อหรือ slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="published">เผยแพร่แล้ว</SelectItem>
            <SelectItem value="draft">ฉบับร่าง</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">รูป</TableHead>
                <TableHead>หัวข้อ</TableHead>
                <TableHead className="hidden md:table-cell">หมวดหมู่</TableHead>
                <TableHead className="hidden lg:table-cell">วันที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    ไม่พบข้อมูลข่าว
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.thumbnail_url ? (
                        <img
                          src={r.thumbnail_url}
                          alt={r.title}
                          className="h-12 w-16 object-cover rounded border border-border"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                          ไม่มีรูป
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-2 max-w-md">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-md">/{r.slug}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{categoryName(r.category_id)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {r.is_published ? (
                          <Badge className="bg-primary text-primary-foreground">เผยแพร่</Badge>
                        ) : (
                          <Badge variant="secondary">ร่าง</Badge>
                        )}
                        {r.is_pinned && (
                          <Badge variant="outline" className="border-accent text-accent-foreground bg-accent/20">
                            <Pin className="h-3 w-3 mr-1" /> ปักหมุด
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title={r.is_published ? "ยกเลิกเผยแพร่" : "เผยแพร่"}
                          onClick={() => togglePublished(r)}
                        >
                          {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={r.is_pinned ? "ยกเลิกปักหมุด" : "ปักหมุด"}
                          onClick={() => togglePinned(r)}
                        >
                          {r.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลข่าวสาร แล้วเลือกบันทึกเป็นฉบับร่างหรือเผยแพร่ทันที
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">หัวข้อข่าว *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="เช่น ประกาศประชุมประจำเดือน..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                  placeholder="auto จากหัวข้อ"
                />
              </div>
              <div className="space-y-1.5">
                <Label>หมวดหมู่</Label>
                <Select
                  value={form.category_id ?? NONE_CATEGORY}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category_id: v === NONE_CATEGORY ? null : v }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_CATEGORY}>— ไม่ระบุ —</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excerpt">เกริ่นนำ (excerpt)</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="ข้อความสั้นๆ สำหรับแสดงในหน้ารวมข่าว"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>เนื้อหา *</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="รายละเอียดของข่าว..."
                uploadFolder={`content/${user?.id ?? "anon"}`}
              />
            </div>

            <div className="space-y-1.5">
              <Label>รูปปก (Thumbnail)</Label>
              {form.thumbnail_url && (
                <div className="relative inline-block">
                  <img
                    src={form.thumbnail_url}
                    alt="thumbnail"
                    className="h-32 w-auto rounded border border-border object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 ml-2"
                    onClick={() => setForm((f) => ({ ...f, thumbnail_url: null }))}
                  >
                    ลบรูป
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="thumb"
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

            <div className="space-y-1.5">
              <MultiImageUploader
                value={form.image_urls}
                onChange={(urls) => setForm((f) => ({ ...f, image_urls: urls }))}
                bucket="news-images"
                folder={`gallery/${user?.id ?? "anon"}`}
                label="รูปประกอบเพิ่มเติม (เลือกหลายรูปได้)"
                helpText="รองรับสูงสุด 8MB ต่อไฟล์ • แสดงเป็นแกลเลอรี่ในหน้าข่าว"
                maxSizeMB={8}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <label className="flex items-center justify-between rounded-md border border-border p-3 cursor-pointer">
                <div>
                  <div className="font-medium text-sm">เผยแพร่</div>
                  <div className="text-xs text-muted-foreground">แสดงบนหน้าเว็บไซต์ทันที</div>
                </div>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-md border border-border p-3 cursor-pointer">
                <div>
                  <div className="font-medium text-sm">ปักหมุดด้านบน</div>
                  <div className="text-xs text-muted-foreground">แสดงเป็นข่าวเด่น</div>
                </div>
                <Switch
                  checked={form.is_pinned}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_pinned: v }))}
                />
              </label>
            </div>
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข่าว</AlertDialogTitle>
            <AlertDialogDescription>
              การลบข่าวไม่สามารถย้อนกลับได้ ต้องการดำเนินการต่อหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบข่าว
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewsAdmin;
