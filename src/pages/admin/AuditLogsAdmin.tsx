import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ScrollText, Loader2, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface AuditRow {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  details: any;
  created_at: string;
}

const PAGE_SIZES = [25, 50, 100, 200];

const AuditLogsAdmin = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [active, setActive] = useState<AuditRow | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const buildQuery = (forCount = false) => {
    let q = supabase
      .from("audit_logs")
      .select("*", forCount ? { count: "exact" } : undefined)
      .order("created_at", { ascending: false });
    if (userFilter.trim()) q = q.eq("user_id", userFilter.trim());
    if (actionFilter.trim()) q = q.ilike("action", `%${actionFilter.trim()}%`);
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) q = q.lte("created_at", new Date(to + "T23:59:59").toISOString());
    return q;
  };

  const load = async (resetPage = false) => {
    setLoading(true);
    const p = resetPage ? 0 : page;
    if (resetPage) setPage(0);
    const start = p * pageSize;
    const end = start + pageSize - 1;
    const { data, count, error } = await buildQuery(true).range(start, end);
    if (error) toast.error(error.message);
    setRows((data as AuditRow[]) || []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchAllForExport = async (): Promise<AuditRow[]> => {
    const all: AuditRow[] = [];
    const chunk = 1000;
    let from_ = 0;
    // hard cap 50k to protect browser
    while (from_ < 50000) {
      const { data, error } = await buildQuery(false).range(from_, from_ + chunk - 1);
      if (error) throw error;
      const batch = (data as AuditRow[]) || [];
      all.push(...batch);
      if (batch.length < chunk) break;
      from_ += chunk;
    }
    return all;
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = async (kind: "csv" | "json") => {
    setExporting(true);
    try {
      const all = await fetchAllForExport();
      const stamp = format(new Date(), "yyyyMMdd-HHmmss");
      if (kind === "json") {
        downloadFile(`audit-logs-${stamp}.json`, JSON.stringify(all, null, 2), "application/json");
      } else {
        const headers = ["created_at", "action", "table_name", "record_id", "user_id", "ip_address", "details"];
        const escape = (v: any) => {
          if (v === null || v === undefined) return "";
          const s = typeof v === "object" ? JSON.stringify(v) : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [headers.join(","), ...all.map((r) => headers.map((h) => escape((r as any)[h])).join(","))];
        downloadFile(`audit-logs-${stamp}.csv`, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
      }
      toast.success(`ดาวน์โหลด ${all.length} รายการแล้ว`);
    } catch (e: any) {
      toast.error(e.message || "ส่งออกไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            บันทึกการใช้งานระบบ (Audit Logs)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ติดตามการเปลี่ยนแปลงข้อมูล — ทั้งหมด {total.toLocaleString()} รายการ (กรองตามเงื่อนไขปัจจุบัน)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData("csv")} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData("json")} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} JSON
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto_auto]">
          <Input
            placeholder="ค้นหาด้วย User ID (UUID)"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
          <Input
            placeholder="กรอง action (เช่น insert)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={() => load(true)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            กรอง
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ปุ่ม Export จะดาวน์โหลดเฉพาะรายการที่ตรงกับตัวกรองปัจจุบัน
        </p>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เวลา</TableHead>
              <TableHead>การกระทำ</TableHead>
              <TableHead>ตาราง</TableHead>
              <TableHead>ผู้ใช้</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">รายละเอียด</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">
                <Loader2 className="h-5 w-5 animate-spin inline" /> กำลังโหลด...
              </TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                ไม่พบข้อมูล
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss")}
                </TableCell>
                <TableCell><Badge variant="secondary">{r.action}</Badge></TableCell>
                <TableCell className="text-sm">{r.table_name || "—"}</TableCell>
                <TableCell className="text-xs font-mono truncate max-w-[160px]">{r.user_id || "—"}</TableCell>
                <TableCell className="text-xs">{r.ip_address || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setActive(r)}>ดู</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">ต่อหน้า:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPage(0); setPageSize(Number(v)); }}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">หน้า {page + 1} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดการเปลี่ยนแปลง</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">การกระทำ:</span> <Badge>{active.action}</Badge></div>
                <div><span className="text-muted-foreground">ตาราง:</span> {active.table_name || "—"}</div>
                <div><span className="text-muted-foreground">Record ID:</span> <span className="font-mono text-xs">{active.record_id || "—"}</span></div>
                <div><span className="text-muted-foreground">เวลา:</span> {format(new Date(active.created_at), "yyyy-MM-dd HH:mm:ss")}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">ข้อมูลรายละเอียด:</div>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[400px]">
                  {JSON.stringify(active.details ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsAdmin;