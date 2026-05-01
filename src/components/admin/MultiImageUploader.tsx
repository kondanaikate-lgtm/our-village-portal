import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: string;
  folder: string;
  maxSizeMB?: number;
  label?: string;
  helpText?: string;
}

/**
 * Extract storage path from a public URL like:
 * https://xxx.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
const extractStoragePath = (url: string, bucket: string): string | null => {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
};

export const MultiImageUploader = ({
  value,
  onChange,
  bucket,
  folder,
  maxSizeMB = 8,
  label = "รูปภาพเพิ่มเติม (เลือกหลายรูปได้)",
  helpText,
}: MultiImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`ข้าม ${file.name}: ใหญ่เกิน ${maxSizeMB}MB`);
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }
    setUploading(false);
    if (newUrls.length) {
      toast.success(`อัปโหลดสำเร็จ ${newUrls.length} รูป`);
      onChange([...value, ...newUrls]);
    }
  };

  const removeAt = async (idx: number) => {
    const url = value[idx];
    const path = extractStoragePath(url, bucket);
    // Optimistically update UI
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    if (path) {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        // Non-fatal: file may not be in this bucket / external URL
        console.warn("Storage remove warning:", error.message);
      }
    }
  };

  const onDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIdx !== idx) setOverIdx(idx);
  };

  const onDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...value];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIdx(null);
    setOverIdx(null);
  };

  const onDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">{value.length} รูป • ลากเพื่อเรียงลำดับ</span>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver(idx)}
              onDrop={onDrop(idx)}
              onDragEnd={onDragEnd}
              className={`relative group aspect-square rounded-md overflow-hidden border bg-muted cursor-move transition-all ${
                overIdx === idx && dragIdx !== idx ? "ring-2 ring-primary border-primary" : "border-border"
              } ${dragIdx === idx ? "opacity-40" : ""}`}
            >
              <img src={url} alt={`image-${idx + 1}`} loading="lazy" className="w-full h-full object-cover pointer-events-none" />
              <div className="absolute top-1 left-1 bg-background/80 rounded px-1 py-0.5 text-[10px] font-medium flex items-center gap-0.5">
                <GripVertical className="h-3 w-3" />
                {idx + 1}
              </div>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeAt(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          {uploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3" /> {helpText ?? `รองรับสูงสุด ${maxSizeMB}MB ต่อไฟล์ • เลือกได้หลายรูป • ลากเพื่อจัดเรียง`}
            </>
          )}
        </p>
      </div>
    </div>
  );
};
