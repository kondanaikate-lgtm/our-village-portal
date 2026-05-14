import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PopupBanner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  display_size: "sm" | "md" | "lg" | "xl" | "full";
}

const STORAGE_KEY = "dismissed-popup-banner-id";

export const BannerPopup = () => {
  const [popup, setPopup] = useState<PopupBanner | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("banners")
        .select("id,title,image_url,link_url,start_at,end_at,is_active,type,display_size")
        .eq("type", "popup")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      const active = (data ?? []).find((b) => {
        if (b.start_at && b.start_at > nowIso) return false;
        if (b.end_at && b.end_at <= nowIso) return false;
        return true;
      });
      if (!active) return;
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === active.id) return;
      setPopup(active as PopupBanner);
      // Show after a short delay for nicer UX
      setTimeout(() => setOpen(true), 600);
    };
    fetchPopup();
  }, []);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next && popup) {
      sessionStorage.setItem(STORAGE_KEY, popup.id);
    }
  };

  if (!popup) return null;

  const sizeClass =
    {
      sm: "max-w-sm",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-6xl",
    }[popup.display_size ?? "md"];

  const Img = (
    <img
      src={popup.image_url}
      alt={popup.title ?? "ประกาศ"}
      className="w-full h-auto rounded-md"
    />
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("p-3 w-[95vw]", sizeClass)}>
        <DialogTitle className="sr-only">{popup.title ?? "ประกาศ"}</DialogTitle>
        <DialogDescription className="sr-only">
          ประกาศจากหมู่บ้าน
        </DialogDescription>
        {popup.link_url ? (
          <a href={popup.link_url} target="_blank" rel="noopener noreferrer" className="block">
            {Img}
          </a>
        ) : (
          Img
        )}
        {popup.title && (
          <p className="text-sm text-center text-muted-foreground pt-2">{popup.title}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
