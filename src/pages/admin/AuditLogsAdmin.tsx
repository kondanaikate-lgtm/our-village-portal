import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ScrollText, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const AuditLogsAdmin = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [active, setActive] = useState<AuditRow | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
    if (userFilter.trim()) q = q.eq("user_id", userFilter.trim());
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) q = q.lte("created_at", new Date(to + "T23:59:59").toISOString());
    const { data } = await q;
    setRows((data as AuditRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          บันทึกการใช้งานระบบ (Audit Logs)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ติดตามการเปลี่ยนแปลงข้อมูลและการเข้าใช้งานระบบ — แสดง 500 รายการล่าสุด
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input
            placeholder="ค้นหาด้วย User ID (UUID)"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            กรอง
          </Button>
        </div>
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
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                ไม่พบข้อมูล
              </TableCell></TableRow>
            ) : filtered.map((r) => (
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