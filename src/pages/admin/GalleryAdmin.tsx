import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Eye, EyeOff, Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AlbumRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  is_published: boolean;
  created_at: string;
  photo_count?: number;
}

interface PhotoRow {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
}

interface AlbumForm {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  cover_image_url: string;
  is_published: boolean;
}

const emptyAlbum: AlbumForm = { title: "", description: "", event_date: "", cover_image_url: "", is_published: true };

const GalleryAdmin = () => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumForm, setAlbumForm] = useState<AlbumForm>(emptyAlbum);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);

  // Photo manager
  const [activeAlbum, setActiveAlbum] = useState<AlbumRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_albums")
      .select("id,title,description,cover_image_url,event_date,is_published,created_at")
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) toast.error("โหลดอัลบั้มไม่สำเร็จ: " + error.message);
    const list = (data ?? []) as AlbumRow[];
    // count photos
    if (list.length) {
      const ids = list.map((a) => a.id);
      const { data: photosCount } = await supabase
        .from("gallery_photos")
        .select("album_id")
        .in("album_id", ids);
      const map = new Map<string, number>();
      (photosCount ?? []).forEach((p: { album_id: string }) => map.set(p.album_id, (map.get(p.album_id) ?? 0) + 1));
      list.forEach((a) => { a.photo_count = map.get(a.id) ?? 0; });
    }
    setAlbums(list);
    setLoading(false);
  };

  useEffect(() => { fetchAlbums(); }, []);

  const fetchPhotos = async (albumId: string) => {
    setLoadingPhotos(true);
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("id,album_id,image_url,caption,order_index")
      .eq("album_id", albumId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setPhotos((data ?? []) as PhotoRow[]);
    setLoadingPhotos(false);
  };

  const openCreateAlbum = () => { setAlbumForm(emptyAlbum); setAlbumOpen(true); };
  const openEditAlbum = (a: AlbumRow) => {
    setAlbumForm({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      event_date: a.event_date ?? "",
      cover_image_url: a.cover_image_url ?? "",
      is_published: a.is_published,
    });
    setAlbumOpen(true);
  };

  const uploadCover = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("ไฟล์ใหญ่เกิน 5MB");
    setUploadingCover(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `covers/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("gallery-photos").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(error.message); setUploadingCover(false); return; }
    const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
    setAlbumForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
    setUploadingCover(false);
    toast.success("อัปโหลดรูปปกสำเร็จ");
  };

  const saveAlbum = async () => {
    if (!albumForm.title.trim()) return toast.error("กรุณาใส่ชื่ออัลบั้ม");
    setSavingAlbum(true);
    const payload = {
      title: albumForm.title.trim(),
      description: albumForm.description.trim() || null,
      event_date: albumForm.event_date || null,
      cover_image_url: albumForm.cover_image_url.trim() || null,
      is_published: albumForm.is_published,
      created_by: user?.id ?? null,
    };
    const { error } = albumForm.id
      ? await supabase.from("gallery_albums").update(payload).eq("id", albumForm.id)
      : await supabase.from("gallery_albums").insert(payload);
    setSavingAlbum(false);
    if (error) return toast.error(error.message);
    toast.success(albumForm.id ? "แก้ไขอัลบั้มเรียบร้อย" : "สร้างอัลบั้มเรียบร้อย");
    setAlbumOpen(false);
    fetchAlbums();
  };

  const togglePub = async (a: AlbumRow) => {
    const { error } = await supabase.from("gallery_albums").update({ is_published: !a.is_published }).eq("id", a.id);
    if (error) return toast.error(error.message);
    fetchAlbums();
  };

  const confirmDeleteAlbum = async () => {
    if (!deleteAlbumId) return;
    // delete photos first (FK)
    await supabase.from("gallery_photos").delete().eq("album_id", deleteAlbumId);
    const { error } = await supabase.from("gallery_albums").delete().eq("id", deleteAlbumId);
    setDeleteAlbumId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบอัลบั้มเรียบร้อย");
    if (activeAlbum?.id === deleteAlbumId) setActiveAlbum(null);
    fetchAlbums();
  };

  const handleMultiUpload = async (files: FileList) => {
    if (!activeAlbum) return;
    setUploadingPhotos(true);
    let success = 0;
    const baseOrder = (photos[photos.length - 1]?.order_index ?? 0) + 1;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 8 * 1024 * 1024) { toast.error(`ข้าม ${file.name}: ใหญ่เกิน 8MB`); continue; }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `albums/${activeAlbum.id}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from("gallery-photos").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
      const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
      const { error: insErr } = await supabase.from("gallery_photos").insert({
        album_id: activeAlbum.id,
        image_url: data.publicUrl,
        order_index: baseOrder + i,
      });
      if (insErr) toast.error(insErr.message);
      else success++;
    }
    setUploadingPhotos(false);
    if (success) toast.success(`อัปโหลดสำเร็จ ${success} รูป`);
    fetchPhotos(activeAlbum.id);
    fetchAlbums();
  };

  const confirmDeletePhoto = async () => {
    if (!deletePhotoId) return;
    const { error } = await supabase.from("gallery_photos").delete().eq("id", deletePhotoId);
    setDeletePhotoId(null);
    if (error) return toast.error(error.message);
    if (activeAlbum) fetchPhotos(activeAlbum.id);
    fetchAlbums();
  };

  // ===== Photo manager view =====
  if (activeAlbum) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setActiveAlbum(null); setPhotos([]); }}>
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-foreground truncate">{activeAlbum.title}</h1>
            <p className="text-xs text-muted-foreground">รูปทั้งหมดในอัลบั้มนี้</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <Label className="mb-2 block">เพิ่มรูปภาพ (เลือกหลายรูปได้)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            disabled={uploadingPhotos}
            onChange={(e) => {
              if (e.target.files && e.target.files.length) handleMultiUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Upload className="h-3 w-3" /> รองรับสูงสุด 8MB ต่อไฟล์
          </p>
          {uploadingPhotos && (
            <div className="mt-2 inline-flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-1" /> กำลังอัปโหลด...
            </div>
          )}
        </div>

        {loadingPhotos ? (
          <div className="text-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> กำลังโหลด...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" /> ยังไม่มีรูปภาพในอัลบั้มนี้
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-square">
                <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" className="w-full h-full object-cover" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeletePhotoId(p.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!deletePhotoId} onOpenChange={(o) => !o && setDeletePhotoId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ลบรูปภาพ?</AlertDialogTitle>
              <AlertDialogDescription>การลบไม่สามารถย้อนกลับได้</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePhoto} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบ</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ===== Albums grid =====
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">แกลเลอรี่ภาพกิจกรรม</h1>
          <p className="text-sm text-muted-foreground">จัดการอัลบั้มภาพและอัปโหลดรูปภาพหลายรูปพร้อมกัน</p>
        </div>
        <Button variant="royal" onClick={openCreateAlbum}><Plus className="h-4 w-4" /> สร้างอัลบั้ม</Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> กำลังโหลด...</div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
          ยังไม่มีอัลบั้ม คลิก "สร้างอัลบั้ม" เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Card key={a.id} className="overflow-hidden flex flex-col">
              <button onClick={() => { setActiveAlbum(a); fetchPhotos(a.id); }} className="aspect-video bg-muted relative group">
                {a.cover_image_url ? (
                  <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                )}
                <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">{a.photo_count ?? 0} รูป</Badge>
              </button>
              <div className="p-3 flex-1 flex flex-col">
                <button onClick={() => { setActiveAlbum(a); fetchPhotos(a.id); }} className="text-left">
                  <div className="font-semibold text-foreground line-clamp-1">{a.title}</div>
                  {a.event_date && <div className="text-xs text-muted-foreground mt-0.5">{new Date(a.event_date).toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}</div>}
                  {a.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.description}</div>}
                </button>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  {a.is_published ? <Badge className="bg-primary text-primary-foreground">เผยแพร่</Badge> : <Badge variant="secondary">ฉบับร่าง</Badge>}
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => togglePub(a)} title={a.is_published ? "ซ่อน" : "เผยแพร่"}>
                      {a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEditAlbum(a)} title="แก้ไข"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteAlbumId(a.id)} title="ลบ"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={albumOpen} onOpenChange={setAlbumOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{albumForm.id ? "แก้ไขอัลบั้ม" : "สร้างอัลบั้มใหม่"}</DialogTitle>
            <DialogDescription>กำหนดรายละเอียดอัลบั้มและรูปปก</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่ออัลบั้ม *</Label>
              <Input value={albumForm.title} onChange={(e) => setAlbumForm((f) => ({ ...f, title: e.target.value }))} placeholder="เช่น กิจกรรมวันเด็ก 2568" />
            </div>
            <div className="space-y-1.5">
              <Label>รายละเอียด</Label>
              <Textarea rows={3} value={albumForm.description} onChange={(e) => setAlbumForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>วันที่จัดกิจกรรม</Label>
              <Input type="date" value={albumForm.event_date} onChange={(e) => setAlbumForm((f) => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รูปปก</Label>
              {albumForm.cover_image_url ? (
                <div className="flex items-start gap-3">
                  <img src={albumForm.cover_image_url} alt="cover" className="h-28 w-auto rounded border border-border object-cover" />
                  <Button type="button" size="sm" variant="outline" onClick={() => setAlbumForm((f) => ({ ...f, cover_image_url: "" }))}>ลบรูป</Button>
                </div>
              ) : (
                <div className="h-28 w-full rounded border border-dashed border-border bg-muted/40 flex items-center justify-center text-muted-foreground text-sm">
                  <ImageIcon className="h-5 w-5 mr-2" /> ยังไม่มีรูปปก
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingCover}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
                className="max-w-xs"
              />
              {uploadingCover && <span className="inline-flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-1" /> กำลังอัปโหลด</span>}
            </div>
            <label className="flex items-center justify-between rounded-md border border-border p-3 cursor-pointer">
              <div>
                <div className="font-medium text-sm">เผยแพร่</div>
                <div className="text-xs text-muted-foreground">ปิดเพื่อซ่อนจากหน้าสาธารณะ</div>
              </div>
              <Switch checked={albumForm.is_published} onCheckedChange={(v) => setAlbumForm((f) => ({ ...f, is_published: v }))} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlbumOpen(false)} disabled={savingAlbum}>ยกเลิก</Button>
            <Button variant="royal" onClick={saveAlbum} disabled={savingAlbum || uploadingCover}>{savingAlbum && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAlbumId} onOpenChange={(o) => !o && setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบอัลบั้มและรูปทั้งหมด?</AlertDialogTitle>
            <AlertDialogDescription>การลบจะลบรูปภาพทั้งหมดในอัลบั้มและไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAlbum} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GalleryAdmin;
