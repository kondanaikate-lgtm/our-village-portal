import { useEffect } from "react";
import { CheckCircle2, ShieldCheck, FileSearch } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SITE_INFO } from "@/config/site";
import { useVillageInfo } from "@/hooks/use-village-info";
import DOMPurify from "dompurify";

const ITA_INDICATORS: { code: string; title: string; desc: string }[] = [
  { code: "O1", title: "โครงสร้างองค์กร", desc: "แสดงโครงสร้างการบริหารและการจัดส่วนงาน" },
  { code: "O2", title: "ข้อมูลผู้บริหาร", desc: "ข้อมูลผู้บริหารและตำแหน่งสำคัญ" },
  { code: "O3", title: "อำนาจหน้าที่", desc: "ภารกิจ อำนาจหน้าที่ตามกฎหมาย" },
  { code: "O4", title: "แผนยุทธศาสตร์/แผนพัฒนา", desc: "แผนพัฒนาท้องถิ่น/แผนยุทธศาสตร์" },
  { code: "O5", title: "ข้อมูลการติดต่อ", desc: "ที่อยู่ เบอร์โทร อีเมล แผนที่" },
  { code: "O6", title: "กฎหมายที่เกี่ยวข้อง", desc: "ระเบียบ กฎหมายที่ใช้ปฏิบัติงาน" },
  { code: "O7", title: "ข่าวประชาสัมพันธ์", desc: "ข่าวสารที่เผยแพร่ต่อสาธารณะ" },
  { code: "O8", title: "Q&A", desc: "ช่องทางการถาม-ตอบ" },
  { code: "O9", title: "Social Network", desc: "ช่องทางการสื่อสารออนไลน์" },
  { code: "O10", title: "นโยบายคุ้มครองข้อมูลส่วนบุคคล", desc: "PDPA และนโยบายเว็บไซต์" },
];

const ItaPage = () => {
  const { data } = useVillageInfo(["ita"]);
  const customHtml = data["ita"]?.content
    ? DOMPurify.sanitize(data["ita"].content)
    : "";

  useEffect(() => {
    document.title = `ITA | ${SITE_INFO.villageName}`;
  }, []);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">เมนูพิเศษ</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-accent" />
            ITA — การประเมินคุณธรรมและความโปร่งใส
          </h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">
            การเปิดเผยข้อมูลสาธารณะ (Open Data Integrity & Transparency Assessment) ของ
            {" "}{SITE_INFO.villageName}
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-5xl space-y-8">
          {customHtml && (
            <article
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: customHtml }}
            />
          )}

          <div>
            <h2 className="font-display font-bold text-2xl mb-4 flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-primary" />
              ตัวชี้วัดการเปิดเผยข้อมูล (OIT)
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ITA_INDICATORS.map((ind) => (
                <Card key={ind.code} className="p-4 flex gap-3 border-border/60">
                  <Badge variant="secondary" className="h-fit shrink-0">{ind.code}</Badge>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {ind.title}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{ind.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default ItaPage;