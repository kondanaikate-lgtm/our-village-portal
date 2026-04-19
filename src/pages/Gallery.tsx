import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  photo_count: number;
}
interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
}

const GalleryPage = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    document.title = "แกลเลอรี่ภาพกิจกรรม | หมู่บ้านแซร์ออ ม.2";
    (async () => {
      const { data, error } = await supabase
        .from("gallery_albums")
        .select("id,title,description,cover_image_url,event_date")
        .eq("is_published", true)
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      const list = (data ?? []) as Omit<Album, "photo_count">[];
      // counts
      let result: Album[] = list.map((a) => ({ ...a, photo_count: 0 }));
      if (list.length) {
        const { data: ps } = await supabase
          .from("gallery_photos")
          .select("album_id")
          .in("album_id", list.map((a) => a.id));
        const map = new Map<string, number>();
        (ps ?? []).forEach((p: { album_id: string }) => map.set(p.album_id, (map.get(p.album_id) ?? 0) + 1));
        result = result.map((a) => ({ ...a, photo_count: map.get(a.id) ?? 0 }));
      }
      setAlbums(result);
      setLoading(false);
    })();
  }, []);

  const openAlbum = async (a: Album) => {
    setActive(a);
    setLoadingPhotos(true);
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("id,image_url,caption")
      .eq("album_id", a.id)
      .order("order_index", { ascending: true });
    if (error) toast.error(error.message);
    setPhotos((data ?? []) as Photo[]);
    setLoadingPhotos(false);
  };

  const showPrev = () => setLightbox((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  const showNext = () => setLightbox((i) => (i === null ? null : (i + 1) % photos.length));

  const currentPhoto = useMemo(() => (lightbox !== null ? photos[lightbox] : null), [lightbox, photos]);

  if (active) {
    return (
      <SiteLayout>
        <div className="container py-10">
          <Button variant="ghost" size="sm" onClick={() => { setActive(null); setPhotos([]); }} className="mb-4">
            <ArrowLeft className="h-4 w-4" /> กลับสู่อัลบั้มทั้งหมด
          </Button>
          <SectionHeader
            title={active.title}
            subtitle={active.event_date ? new Date(active.event_date).toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" }) : undefined}
          />
          {active.description && <p className="mt-3 text-muted-foreground">{active.description}</p>}
          <div className="mt-6">
            {loadingPhotos ? (
              <div className="text-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> กำลังโหลด...</div>
            ) : photos.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">ยังไม่มีรูปภาพในอัลบั้มนี้</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((p, idx) => (
                  <button key={p.id} onClick={() => setLightbox(idx)} className="aspect-square rounded-lg overflow-hidden bg-muted group">
                    <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
            <DialogContent className="max-w-5xl bg-background/95 p-2 sm:p-4">
              {currentPhoto && (
                <div className="relative">
                  <img src={currentPhoto.image_url} alt={currentPhoto.caption ?? ""} className="w-full max-h-[80vh] object-contain" />
                  {photos.length > 1 && (
                    <>
                      <Button size="icon" variant="secondary" onClick={showPrev} className="absolute left-2 top-1/2 -translate-y-1/2"><ChevronLeft className="h-5 w-5" /></Button>
                      <Button size="icon" variant="secondary" onClick={showNext} className="absolute right-2 top-1/2 -translate-y-1/2"><ChevronRight className="h-5 w-5" /></Button>
                    </>
                  )}
                  {currentPhoto.caption && <div className="text-center text-sm text-muted-foreground mt-2">{currentPhoto.caption}</div>}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container py-10">
        <SectionHeader title="แกลเลอรี่ภาพกิจกรรม" subtitle="ภาพบรรยากาศกิจกรรมและงานต่างๆ ของหมู่บ้าน" />
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> กำลังโหลด...</div>
          ) : albums.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">ยังไม่มีอัลบั้มภาพ</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => (
                <Card key={a.id} className="overflow-hidden hover:shadow-md transition-base cursor-pointer" onClick={() => openAlbum(a)}>
                  <div className="aspect-video bg-muted relative">
                    {a.cover_image_url ? (
                      <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">{a.photo_count} รูป</Badge>
                  </div>
                  <div className="p-4">
                    <div className="font-display font-semibold text-foreground line-clamp-1">{a.title}</div>
                    {a.event_date && <div className="text-xs text-muted-foreground mt-1">{new Date(a.event_date).toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}</div>}
                    {a.description && <div className="text-sm text-muted-foreground line-clamp-2 mt-2">{a.description}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
};

export default GalleryPage;
