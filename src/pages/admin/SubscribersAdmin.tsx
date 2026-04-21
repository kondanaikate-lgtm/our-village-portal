import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Download, Send, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

const SubscribersAdmin = () => {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSend, setOpenSend] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    setSubs((data as Subscriber[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = subs.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.full_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = subs.filter((s) => s.is_active).length;

  const toggleActive = async (s: Subscriber) => {
    const { error } = await supabase
      .from("subscribers")
      .update({
        is_active: !s.is_active,
        unsubscribed_at: !s.is_active ? null : new Date().toISOString(),
      })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("ลบผู้รับข่าวสารคนนี้?")) return;
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("ลบแล้ว");
    load();
  };

  const exportCSV = () => {
    const rows = [
      ["Email", "Full Name", "Active", "Source", "Subscribed At", "Unsubscribed At"],
      ...subs.map((s) => [
        s.email,
        s.full_name || "",
        s.is_active ? "Yes" : "No",
        s.source || "",
        s.subscribed_at,
        s.unsubscribed_at || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`ส่งออก ${subs.length} รายการแล้ว`);
  };

  const sendNewsletter = async () => {
    if (!subject || !body) {
      toast.error("กรุณากรอกหัวข้อและเนื้อหา");
      return;
    }
    toast.error("ยังไม่เปิดใช้การส่งอีเมลแบบกลุ่มผ่านระบบนี้ กรุณาใช้ Export CSV กับบริการอีเมลการตลาดโดยเฉพาะ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> ผู้รับข่าวสาร
          </h1>
          <p className="text-sm text-muted-foreground">
            ทั้งหมด {subs.length} คน · ใช้งานอยู่ {activeCount} คน
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4" /> ส่งออก CSV
          </Button>
          <Dialog open={openSend} onOpenChange={setOpenSend}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4" /> ส่งข่าวสาร
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ส่งข่าวสารถึงผู้รับ</DialogTitle>
                <DialogDescription>
                  จะส่งถึงผู้รับข่าวสารที่ใช้งานอยู่ทั้งหมด {activeCount} คน
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>หัวข้อ</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="เช่น ข่าวสารประจำเดือน..."
                  />
                </div>
                <div>
                  <Label>เนื้อหา (รองรับ HTML)</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    placeholder="<p>เรียนผู้รับข่าวสาร...</p>"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenSend(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={sendNewsletter} disabled={sending}>
                  {sending ? "กำลังส่ง..." : `ส่งถึง ${activeCount} คน`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาอีเมลหรือชื่อ..."
          className="pl-9"
        />
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>อีเมล</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ที่มา</TableHead>
              <TableHead>สมัครเมื่อ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>{s.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.source || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(s.subscribed_at), "d MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={s.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleActive(s)}
                    >
                      {s.is_active ? "ใช้งานอยู่" : "ยกเลิกแล้ว"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(s.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SubscribersAdmin;
