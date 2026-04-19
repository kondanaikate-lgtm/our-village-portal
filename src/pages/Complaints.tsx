import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MessageSquareWarning, Send, Upload } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  "สาธารณูปโภค (ถนน/ไฟฟ้า/น้ำประปา)",
  "ความสะอาด/ขยะ",
  "ความปลอดภัย",
  "เสียงรบกวน",
  "สิ่งแวดล้อม",
  "อื่นๆ",
];

interface FormState {
  reporter_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  subject: string;
  description: string;
  location: string;
}

const empty: FormState = {
  reporter_name: "",
  contact_phone: "",
  contact_email: "",
  category: CATEGORIES[0],
  subject: "",
  description: "",
  location: "",
};

const ComplaintsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "แจ้งเรื่องร้องเรียน | หมู่บ้านแซร์ออ ม.2";
  }, []);

  useEffect(() => {
    if (user?.email) {
      setForm((f) => ({ ...f, contact_email: f.contact_email || user.email! }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนส่งเรื่องร้องเรียน");
      navigate("/auth?redirect=/complaints");
      return;
    }
    if (!form.reporter_name.trim()) return toast.error("กรุณากรอกชื่อผู้แจ้ง");
    if (!form.subject.trim()) return toast.error("กรุณากรอกหัวข้อเรื่อง");
    if (!form.description.trim()) return toast.error("กรุณากรอกรายละเอียด");

    setSubmitting(true);
    let attachmentUrl: string | null = null;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSubmitting(false);
        return toast.error("ไฟล์แนบต้องไม่เกิน 10MB");
      }
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        setSubmitting(false);
        return toast.error("อัปโหลดไฟล์ไม่สำเร็จ: " + upErr.message);
      }
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      attachmentUrl = data.publicUrl;
    }

    const { error } = await supabase.from("complaints").insert({
      user_id: user.id,
      reporter_name: form.reporter_name.trim(),
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      category: form.category,
      subject: form.subject.trim(),
      description: form.description.trim(),
      location: form.location.trim() || null,
      attachment_url: attachmentUrl,
    });

    setSubmitting(false);

    if (error) {
      return toast.error("ส่งเรื่องไม่สำเร็จ: " + error.message);
    }
    toast.success("ส่งเรื่องร้องเรียนเรียบร้อย เจ้าหน้าที่จะติดต่อกลับโดยเร็ว");
    setForm(empty);
    setFile(null);
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">บริการประชาชน</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl">แจ้งเรื่องร้องเรียน</h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-2 max-w-2xl">
            แจ้งปัญหา ข้อเสนอแนะ หรือเรื่องร้องเรียนต่างๆ เพื่อให้หมู่บ้านดำเนินการแก้ไข
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-3xl">
          {!authLoading && !user && (
            <Card className="p-5 mb-6 border-accent/40 bg-accent/5">
              <div className="flex items-start gap-3">
                <MessageSquareWarning className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    กรุณาเข้าสู่ระบบก่อนส่งเรื่อง
                  </p>
                  <p className="text-muted-foreground mb-3">
                    เพื่อให้เจ้าหน้าที่สามารถติดต่อกลับและติดตามสถานะเรื่องของท่านได้
                  </p>
                  <Button asChild variant="royal" size="sm">
                    <Link to="/auth?redirect=/complaints">เข้าสู่ระบบ / สมัครสมาชิก</Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5 md:p-7 border-border/60">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">ชื่อผู้แจ้ง *</Label>
                  <Input
                    id="c-name"
                    value={form.reporter_name}
                    onChange={(e) => setForm((f) => ({ ...f, reporter_name: e.target.value }))}
                    placeholder="ชื่อ - นามสกุล"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-cat">หมวดเรื่อง</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger id="c-cat"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">เบอร์โทรติดต่อ</Label>
                  <Input
                    id="c-phone"
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">อีเมล</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-subj">หัวข้อเรื่อง *</Label>
                <Input
                  id="c-subj"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="สรุปสั้นๆ เกี่ยวกับเรื่องที่ร้องเรียน"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-loc">สถานที่/จุดเกิดเหตุ</Label>
                <Input
                  id="c-loc"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="เช่น หน้าบ้านเลขที่ 42 ซอย 3"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-desc">รายละเอียด *</Label>
                <Textarea
                  id="c-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="กรุณาอธิบายเรื่องร้องเรียนให้ละเอียด..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-file">ไฟล์แนบ (รูปภาพ/เอกสาร) — ไม่เกิน 10MB</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="c-file"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {file.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(empty);
                    setFile(null);
                  }}
                  disabled={submitting}
                >
                  ล้างฟอร์ม
                </Button>
                <Button type="submit" variant="royal" disabled={submitting || !user}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  ส่งเรื่องร้องเรียน
                </Button>
              </div>
            </form>
          </Card>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            เรื่องร้องเรียนจะถูกส่งตรงถึงเจ้าหน้าที่ และจะรักษาความลับของผู้ร้องเรียน
          </p>
        </div>
      </section>
    </SiteLayout>
  );
};

export default ComplaintsPage;
