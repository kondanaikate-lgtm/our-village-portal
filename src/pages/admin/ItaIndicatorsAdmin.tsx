import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Save, ShieldCheck, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Row {
  id: string;
  code: string;
  title: string;
  description: string | null;
  link_url: string | null;
  order_index: number;
  is_published: boolean;
}

const empty = { code: "", title: "", description: "", link_url: "", order_index: 0, is_published: true };

const ItaIndicatorsAdmin = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<(typeof empty) & { id?: string }>(empty);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ita_indicators")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (r?: Row) => {
    setForm(r
      ? { id: r.id, code: r.code, title: r.title, description: r.description ?? "", link_url: r.link_url ?? "", order_index: r.order_index, is_published: r.is_published }
      : { ...empty, order_index: (rows.at(-1)?.order_index ?? 0) + 10 });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.title.trim()) return toast.error("กรุณากรอกรหัสและชื่อตัวชี้วัด");
    setSaving(true);
    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      link_url: form.link_url.trim() || null,
      order_index: Number(form.order_index) || 0,
      is_published: form.is_published,
      updated_by: user?.id ?? null,
    };
    const { error } = form.id
      ? await (supabase as any).from("ita_indicators").update(payload).eq("id", form.id)
      : await (supabase as any).from("ita_indicators").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("บันทึกตัวชี้วัดเรียบร้อย");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("ลบตัวชี้วัดนี้?")) return;
    const { error } = await (supabase as any).from("ita_indicators").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("ลบแล้ว");
    load();
  };

  const toggle = async (r: Row) => {
    const { error } = await (supabase as any)
      .from("ita_indicators")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const persistOrder = async (next: Row[]) => {
    setReordering(true);
    // assign normalized order_index in steps of 10
    const updates = next.map((r, i) => ({ id: r.id, order_index: (i + 1) * 10 }));
    setRows(next.map((r, i) => ({ ...r, order_index: (i + 1) * 10 })));
    try {
      // run updates in parallel; small list so this is fine
      await Promise.all(
        updates.map((u) =>
          (supabase as any).from("ita_indicators").update({ order_index: u.order_index }).eq("id", u.id),
        ),
      );
      toast.success("บันทึกลำดับใหม่แล้ว");
    } catch (e: any) {
      toast.error(e?.message || "บันทึกลำดับไม่สำเร็จ");
      load();
    } finally {
      setReordering(false);
    }
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = rows.findIndex((r) => r.id === dragId);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    persistOrder(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> ตัวชี้วัด ITA / OIT
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการรายการตัวชี้วัดที่แสดงในหน้า /ita — ลากที่ไอคอน <GripVertical className="inline h-3 w-3" /> เพื่อจัดลำดับ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reordering && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> กำลังบันทึกลำดับ...</span>}
          <Button variant="royal" onClick={() => openForm()}><Plus className="h-4 w-4" /> เพิ่มตัวชี้วัด</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin inline mr-2" /> กำลังโหลด...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-20">รหัส</TableHead>
                <TableHead>ชื่อตัวชี้วัด</TableHead>
                <TableHead className="hidden md:table-cell">รายละเอียด</TableHead>
                <TableHead className="w-20">ลำดับ</TableHead>
                <TableHead className="w-24">เผยแพร่</TableHead>
                <TableHead className="text-right w-32">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">ยังไม่มีตัวชี้วัด</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow
                  key={r.id}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={() => onDrop(r.id)}
                  className={dragId === r.id ? "opacity-50" : ""}
                >
                  <TableCell>
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setDragId(r.id)}
                      onDragEnd={() => setDragId(null)}
                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                      aria-label="ลากเพื่อจัดลำดับ"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{r.code}</Badge></TableCell>
                  <TableCell className="font-medium">
                    {r.title}
                    {r.link_url && <span className="block text-xs text-primary truncate max-w-[300px]">{r.link_url}</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[360px] truncate">{r.description || "—"}</TableCell>
                  <TableCell className="text-sm">{r.order_index}</TableCell>
                  <TableCell><Switch checked={r.is_published} onCheckedChange={() => toggle(r)} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{form.id ? "แก้ไขตัวชี้วัด" : "เพิ่มตัวชี้วัด"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div className="space-y-1.5"><Label>รหัส</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="O1" /></div>
              <div className="space-y-1.5"><Label>ชื่อตัวชี้วัด</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>ลิงก์อ้างอิง (ถ้ามี)</Label><Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5"><Label>ลำดับ</Label><Input type="number" value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) }))} /></div>
              <label className="flex items-center gap-2 text-sm pt-5"><Switch checked={form.is_published} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} /> เผยแพร่</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button variant="royal" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItaIndicatorsAdmin;