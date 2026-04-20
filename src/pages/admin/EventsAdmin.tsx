import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  category: string | null;
  is_published: boolean;
}

const empty = {
  id: "",
  title: "",
  description: "",
  start_at: "",
  end_at: "",
  all_day: false,
  location: "",
  category: "",
  is_published: true,
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

const EventsAdmin = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("start_at", { ascending: false });
    setEvents((data as EventRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (e: EventRow) => {
    setForm({
      id: e.id,
      title: e.title,
      description: e.description || "",
      start_at: toLocalInput(e.start_at),
      end_at: toLocalInput(e.end_at),
      all_day: e.all_day,
      location: e.location || "",
      category: e.category || "",
      is_published: e.is_published,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.start_at) {
      toast.error("กรุณากรอกชื่อกิจกรรมและวันเริ่ม");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      all_day: form.all_day,
      location: form.location || null,
      category: form.category || null,
      is_published: form.is_published,
    };
    const { error } = form.id
      ? await supabase.from("events").update(payload).eq("id", form.id)
      : await supabase.from("events").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "อัปเดตแล้ว" : "เพิ่มกิจกรรมแล้ว");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("ลบกิจกรรมนี้?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("ลบแล้ว");
    load();
  };

  const togglePublish = async (e: EventRow) => {
    await supabase
      .from("events")
      .update({ is_published: !e.is_published })
      .eq("id", e.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <CalIcon className="h-6 w-6 text-primary" /> ปฏิทินกิจกรรม
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการกิจกรรมและอีเวนต์ของหมู่บ้าน
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> เพิ่มกิจกรรม
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>ชื่อกิจกรรม *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>รายละเอียด</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>วันเริ่ม *</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) =>
                      setForm({ ...form, start_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>วันสิ้นสุด</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) =>
                      setForm({ ...form, end_at: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>สถานที่</Label>
                  <Input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>หมวดหมู่</Label>
                  <Input
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="เช่น ประชุม, อบรม, งานบุญ"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.all_day}
                    onCheckedChange={(v) => setForm({ ...form, all_day: v })}
                  />
                  <span className="text-sm">ทั้งวัน</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.is_published}
                    onCheckedChange={(v) =>
                      setForm({ ...form, is_published: v })
                    }
                  />
                  <span className="text-sm">เผยแพร่</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={save}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อกิจกรรม</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>สถานที่</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  ยังไม่มีกิจกรรม
                </TableCell>
              </TableRow>
            ) : (
              events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(e.start_at), "d MMM yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-sm">{e.location || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={e.is_published ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => togglePublish(e)}
                    >
                      {e.is_published ? "เผยแพร่" : "ซ่อน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(e.id)}
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

export default EventsAdmin;
