import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_published: boolean;
  order_index: number;
  view_count: number;
}

interface FormState {
  id?: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  order_index: number;
}

const empty: FormState = { question: "", answer: "", category: "", is_published: true, order_index: 0 };

const FaqsAdmin = () => {
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("id,question,answer,category,is_published,order_index,view_count")
      .order("order_index", { ascending: true })
      .order("question", { ascending: true });
    if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
    setRows((data ?? []) as FaqRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const sorted = useMemo(() => [...rows].sort((a, b) => a.order_index - b.order_index), [rows]);

  const openCreate = () => {
    setForm({ ...empty, order_index: (sorted[sorted.length - 1]?.order_index ?? 0) + 10 });
    setOpen(true);
  };
  const openEdit = (r: FaqRow) => {
    setForm({ id: r.id, question: r.question, answer: r.answer, category: r.category ?? "", is_published: r.is_published, order_index: r.order_index });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return toast.error("กรุณากรอกคำถามและคำตอบ");
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim() || null,
      is_published: form.is_published,
      order_index: Number.isFinite(form.order_index) ? form.order_index : 0,
    };
    const { error } = form.id
      ? await supabase.from("faqs").update(payload).eq("id", form.id)
      : await supabase.from("faqs").insert(payload);
    setSaving(false);
    if (error) return toast.error("บันทึกไม่สำเร็จ: " + error.message);
    toast.success(form.id ? "แก้ไขเรียบร้อย" : "เพิ่ม FAQ เรียบร้อย");
    setOpen(false);
    fetchAll();
  };

  const togglePub = async (r: FaqRow) => {
    const { error } = await supabase.from("faqs").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const move = async (r: FaqRow, dir: "up" | "down") => {
    const idx = sorted.findIndex((x) => x.id === r.id);
    const swap = dir === "up" ? sorted[idx - 1] : sorted[idx + 1];
    if (!swap) return;
    const { error: e1 } = await supabase.from("faqs").update({ order_index: swap.order_index }).eq("id", r.id);
    const { error: e2 } = await supabase.from("faqs").update({ order_index: r.order_index }).eq("id", swap.id);
    if (e1 || e2) return toast.error((e1 ?? e2)!.message);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("faqs").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("ลบเรียบร้อย");
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">คำถามที่พบบ่อย (FAQ)</h1>
          <p className="text-sm text-muted-foreground">จัดการคำถาม–คำตอบ จัดหมวดหมู่ และเรียงลำดับการแสดง</p>
        </div>
        <Button variant="royal" onClick={openCreate}><Plus className="h-4 w-4" /> เพิ่ม FAQ</Button>
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>คำถาม</TableHead>
                <TableHead className="hidden md:table-cell">หมวด</TableHead>
                <TableHead className="hidden md:table-cell w-20">เข้าชม</TableHead>
                <TableHead className="w-[100px]">ลำดับ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> กำลังโหลด...</TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">ยังไม่มี FAQ</TableCell></TableRow>
              ) : (
                sorted.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-2 max-w-xl">{r.question}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-xl">{r.answer}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.category ? <Badge variant="outline">{r.category}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="hidden md:table-cell tabular-nums text-sm">{r.view_count}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1">
                        <span className="text-sm tabular-nums w-6 text-center">{r.order_index}</span>
                        <div className="flex flex-col">
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => move(r, "up")} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => move(r, "down")} disabled={i === sorted.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{r.is_published ? <Badge className="bg-primary text-primary-foreground">เผยแพร่</Badge> : <Badge variant="secondary">ฉบับร่าง</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => togglePub(r)} title={r.is_published ? "ซ่อน" : "เผยแพร่"}>
                          {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="แก้ไข"><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)} title="ลบ"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
            <DialogTitle>{form.id ? "แก้ไข FAQ" : "เพิ่ม FAQ"}</DialogTitle>
            <DialogDescription>คำถามที่พบบ่อยจะแสดงในหน้า /faq</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>คำถาม *</Label>
              <Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="ขอใบรับรองที่อยู่อาศัยต้องเตรียมเอกสารอะไรบ้าง" />
            </div>
            <div className="space-y-1.5">
              <Label>คำตอบ *</Label>
              <Textarea rows={6} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} placeholder="รายละเอียดคำตอบ..." />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>หมวดหมู่</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="เช่น งานทะเบียน, ภาษี" />
              </div>
              <div className="space-y-1.5">
                <Label>ลำดับ</Label>
                <Input type="number" value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value || "0", 10) }))} />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-md border border-border p-3 cursor-pointer">
              <div>
                <div className="font-medium text-sm">เผยแพร่</div>
                <div className="text-xs text-muted-foreground">ปิดเพื่อซ่อนจากหน้าสาธารณะ</div>
              </div>
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
            <Button variant="royal" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ FAQ</AlertDialogTitle>
            <AlertDialogDescription>การลบไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FaqsAdmin;
