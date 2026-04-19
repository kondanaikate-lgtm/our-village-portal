import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_size: number | null;
  fiscal_year: number | null;
  download_count: number;
  created_at: string;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const PublicDocuments = () => {
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [year, setYear] = useState<string>("all");

  useEffect(() => {
    document.title = "เอกสารดาวน์โหลด | หมู่บ้านแซร์ออ ม.2";
    (async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,description,category,file_url,file_size,fiscal_year,download_count,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) toast.error("โหลดเอกสารไม่สำเร็จ: " + error.message);
      setRows((data ?? []) as DocRow[]);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const years = useMemo(() => {
    const set = new Set(rows.map((r) => r.fiscal_year).filter((y): y is number => !!y));
    return Array.from(set).sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (year !== "all" && String(r.fiscal_year ?? "") !== year) return false;
      if (q && !`${r.title} ${r.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, category, year]);

  const handleDownload = async (doc: DocRow) => {
    // Trigger increment but don't block download
    supabase.rpc("increment_document_download", { _doc_id: doc.id }).then(() => {
      setRows((prev) => prev.map((r) => (r.id === doc.id ? { ...r, download_count: r.download_count + 1 } : r)));
    });
    window.open(doc.file_url, "_blank", "noopener,noreferrer");
  };

  return (
    <SiteLayout>
      <div className="container py-10">
        <SectionHeader title="เอกสารดาวน์โหลด" subtitle="เอกสารราชการ แผนงาน รายงาน และแบบฟอร์มต่างๆ" />

        <div className="mt-6 grid gap-3 sm:grid-cols-3 rounded-lg border border-border bg-card p-4">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเอกสาร..." className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="หมวดหมู่" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวด</SelectItem>
              {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue placeholder="ปีงบประมาณ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกปี</SelectItem>
              {years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">ไม่พบเอกสารตามเงื่อนไข</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => (
                <Card key={d.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-base">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground line-clamp-2">{d.title}</div>
                      {d.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{d.description}</div>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="outline">{d.category}</Badge>
                    {d.fiscal_year && <Badge variant="secondary">ปี {d.fiscal_year}</Badge>}
                    <span className="text-muted-foreground ml-auto">{formatSize(d.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">ดาวน์โหลด {d.download_count.toLocaleString("th-TH")} ครั้ง</span>
                    <Button size="sm" variant="royal" onClick={() => handleDownload(d)}>
                      <Download className="h-4 w-4" /> ดาวน์โหลด
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
};

export default PublicDocuments;
