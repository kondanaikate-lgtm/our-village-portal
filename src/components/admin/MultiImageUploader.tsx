import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
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

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">{value.length} รูป</span>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted"
            >
              <img src={url} alt={`image-${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
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
              <Upload className="h-3 w-3" /> {helpText ?? `รองรับสูงสุด ${maxSizeMB}MB ต่อไฟล์ • เลือกได้หลายรูป`}
            </>
          )}
        </p>
      </div>
    </div>
  );
};