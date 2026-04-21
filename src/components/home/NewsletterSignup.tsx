import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง").max(255),
  fullName: z.string().trim().max(120).optional(),
});

interface NewsletterSignupProps {
  compact?: boolean;
  source?: string;
}

export const NewsletterSignup = ({ compact = false, source = "website" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, fullName: fullName || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({
      email: parsed.data.email.toLowerCase(),
      full_name: parsed.data.fullName || null,
      source,
      is_active: true,
    });
    setLoading(false);

    if (error) {
      toast.error(error.code === "23505" ? "อีเมลนี้สมัครรับข่าวสารแล้ว" : "สมัครไม่สำเร็จ: " + error.message);
      return;
    }

    toast.success("สมัครรับข่าวสารเรียบร้อย");
    setEmail("");
    setFullName("");
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "rounded-lg border border-border bg-card p-5 space-y-3"}>
      {!compact && (
        <div>
          <h2 className="font-display font-semibold text-xl text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> รับข่าวสารหมู่บ้าน
          </h2>
          <p className="text-sm text-muted-foreground mt-1">รับประกาศและข่าวประชาสัมพันธ์ทางอีเมล</p>
        </div>
      )}
      <div className={compact ? "space-y-2" : "grid gap-2 sm:grid-cols-[1fr_1fr_auto]"}>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ชื่อ (ไม่บังคับ)" maxLength={120} />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="อีเมล" maxLength={255} required />
        <Button type="submit" variant={compact ? "gold" : "royal"} disabled={loading} className={compact ? "w-full" : ""}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          สมัคร
        </Button>
      </div>
    </form>
  );
};
