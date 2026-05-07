import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Newspaper, FileText, Calendar, Image as ImageIcon, Database } from "lucide-react";
import DOMPurify from "dompurify";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card } from "@/components/ui/card";
import { SITE_INFO } from "@/config/site";
import { useVillageInfo } from "@/hooks/use-village-info";

const CATALOG = [
  { icon: Newspaper, title: "ข่าวประชาสัมพันธ์", href: "/news" },
  { icon: FileText, title: "เอกสารราชการ", href: "/services/documents" },
  { icon: Calendar, title: "ปฏิทินกิจกรรม", href: "/events" },
  { icon: ImageIcon, title: "แกลเลอรี่ภาพ", href: "/gallery" },
];

const InfoCenterPage = () => {
  const { data } = useVillageInfo(["info-center"]);
  const html = data["info-center"]?.content ? DOMPurify.sanitize(data["info-center"].content) : "";

  useEffect(() => {
    document.title = `ศูนย์ข้อมูลข่าวสาร | ${SITE_INFO.villageName}`;
  }, []);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">เมนูพิเศษ</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl flex items-center gap-3">
            <Database className="h-9 w-9 text-accent" />
            ศูนย์ข้อมูลข่าวสาร
          </h1>
          <p className="mt-3 text-primary-foreground/85">
            แหล่งรวมข้อมูลที่เปิดเผยต่อสาธารณะตาม พ.ร.บ. ข้อมูลข่าวสารของราชการ พ.ศ. 2540
          </p>
        </div>
      </section>
      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-5xl space-y-8">
          {html && <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: html }} />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATALOG.map(({ icon: Icon, title, href }) => (
              <Link key={href} to={href}>
                <Card className="p-5 text-center hover:shadow-md hover:border-primary transition-base h-full">
                  <Icon className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="font-display font-semibold">{title}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default InfoCenterPage;