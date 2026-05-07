import { useEffect } from "react";
import { BookOpen, FileText, Users, MessageSquareWarning } from "lucide-react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { SITE_INFO } from "@/config/site";
import { useVillageInfo } from "@/hooks/use-village-info";

const SERVICES = [
  { icon: FileText, title: "เอกสารดาวน์โหลด", desc: "แบบฟอร์มและเอกสารราชการ", href: "/services/documents" },
  { icon: Users, title: "ทำเนียบบุคลากร", desc: "ติดต่อเจ้าหน้าที่ผู้รับผิดชอบ", href: "/about/personnel" },
  { icon: MessageSquareWarning, title: "ร้องเรียน/ร้องทุกข์", desc: "แจ้งปัญหาและข้อเสนอแนะ", href: "/complaints" },
];

const ManualPage = () => {
  const { data } = useVillageInfo(["manual"]);
  const html = data["manual"]?.content ? DOMPurify.sanitize(data["manual"].content) : "";

  useEffect(() => {
    document.title = `คู่มือบริการ | ${SITE_INFO.villageName}`;
  }, []);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">เมนูพิเศษ</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl flex items-center gap-3">
            <BookOpen className="h-9 w-9 text-accent" />
            คู่มือบริการประชาชน
          </h1>
          <p className="mt-3 text-primary-foreground/85">ขั้นตอนและช่องทางการขอใช้บริการต่าง ๆ</p>
        </div>
      </section>
      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-5xl space-y-8">
          {html && <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: html }} />}
          <div className="grid sm:grid-cols-3 gap-4">
            {SERVICES.map(({ icon: Icon, title, desc, href }) => (
              <Link key={href} to={href}>
                <Card className="p-5 h-full hover:shadow-md hover:border-primary transition-base">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <div className="font-display font-semibold text-foreground">{title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default ManualPage;