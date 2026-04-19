import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Loader2, Mail, Phone, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Status = "pending" | "in_progress" | "resolved" | "rejected";

interface Row {
  id: string;
  reporter_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  category: string | null;
  subject: string;
  description: string;
  location: string | null;
  attachment_url: string | null;
  status: Status;
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  pending: { label: "รอดำเนินการ", cls: "bg-muted text-foreground" },
  in_progress: { label: "กำลังดำเนินการ", cls: "bg-accent text-accent-foreground" },
  resolved: { label: "แก้ไขแล้ว", cls: "bg-primary text-primary-foreground" },
  rejected: { label: "ยกเลิก", cls: "bg-destructive text-destructive-foreground" },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ComplaintsAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);
  const [draftStatus, setDraftStatus] = useState<Status>("pending");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("id,reporter_name,contact_email,contact_phone,category,subject,description,location,attachment_url,status,admin_note,resolved_by,resolved_at,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (q && !`${r.subject} ${r.reporter_name} ${r.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, filterStatus]);

  const counts = useMemo(() => {
    const c = { pending: 0, in_progress: 0, resolved: 0, rejected: 0 } as Record<Status, number>;
    rows.forEach((r) => { c[r.status]++; });
    return c;
  }, [rows]);

  const openDetail = (r: Row) => {
    setActive(r);
    setDraftStatus(r.status);
    setDraftNote(r.admin_note ?? "");
    setOpen(true);
  };

  const saveUpdate = async () => {
    if (!active) return;
    setSaving(true);
    const isResolving = (draftStatus === "resolved" || draftStatus === "rejected");
    const { error } = await supabase
      .from("complaints")
      .update({
        status: draftStatus,
        admin_note: draftNote.trim() || null,
        resolved_by: isResolving ? user?.id ?? null : null,
        resolved_at: isResolving ? new Date().toISOString() : null,
      })
      .eq("id", active.id);
    setSaving(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    toast.success("อัปเดตสถานะเรียบร้อย");
    setOpen(false);
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">เรื่องร้องเรียน</h1>
        <p className="text-sm text-muted-foreground">รายการเรื่องร้องเรียนจากประชาชน อัปเดตสถานะและบันทึกหมายเหตุของเจ้าหน้าที่</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending", "in_progress", "resolved", "rejected"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg border border-border p-3 text-left transition-base hover:border-primary/40 ${filterStatus === s ? "ring-2 ring-primary/40" : ""}`}
          >
            <div className="text-xs text-muted-foreground">{STATUS_META[s].label}</div>
            <div className="text-2xl font-bold text-foreground">{counts[s]}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 rounded-lg border border-border bg-background p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาตามหัวข้อ / ผู้ร้อง" className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | Status)}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="pending">รอดำเนินการ</SelectItem>
            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
            <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
            <SelectItem value="rejected">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หัวข้อ / ผู้ร้อง</TableHead>
                <TableHead className="hidden md:table-cell">หมวด</TableHead>
                <TableHead className="hidden lg:table-cell">วันที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> กำลังโหลด...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">ไม่มีเรื่องร้องเรียน</TableCell></TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-1 max-w-md">{r.subject}</div>
                      <div className="text-xs text-muted-foreground">โดย {r.reporter_name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {r.category ? <Badge variant="outline">{r.category}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    <TableCell><Badge className={STATUS_META[r.status].cls}>{STATUS_META[r.status].label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(r)}>
                        <Eye className="h-4 w-4" /> ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดเรื่องร้องเรียน</DialogTitle>
            <DialogDescription>อัปเดตสถานะและบันทึกหมายเหตุของเจ้าหน้าที่</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-4 py-2">
              <div>
                <div className="text-xs text-muted-foreground">หัวข้อ</div>
                <div className="font-semibold text-foreground">{active.subject}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">ผู้ร้อง</div>
                  <div className="font-medium">{active.reporter_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">หมวด</div>
                  <div>{active.category || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> โทรศัพท์</div>
                  <div>{active.contact_phone || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> อีเมล</div>
                  <div className="break-all">{active.contact_email || "—"}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">สถานที่</div>
                  <div>{active.location || "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">รายละเอียด</div>
                <div className="rounded-md border border-border bg-muted/30 p-3 whitespace-pre-wrap text-sm">{active.description}</div>
              </div>
              {active.attachment_url && (
                <a href={active.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> เปิดไฟล์แนบ
                </a>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>สถานะ</Label>
                  <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as Status)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">รอดำเนินการ</SelectItem>
                      <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                      <SelectItem value="rejected">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>หมายเหตุของเจ้าหน้าที่</Label>
                  <Textarea
                    rows={4}
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="ระบุการดำเนินการ / ผลการแก้ไข / เหตุผลการยกเลิก"
                  />
                </div>
                {active.resolved_at && (
                  <div className="text-xs text-muted-foreground">ปิดเรื่องเมื่อ: {formatDate(active.resolved_at)}</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
            <Button variant="royal" onClick={saveUpdate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintsAdmin;
