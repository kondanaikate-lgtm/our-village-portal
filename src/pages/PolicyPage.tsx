import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import DOMPurify from "dompurify";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SITE_INFO } from "@/config/site";
import { useVillageInfo } from "@/hooks/use-village-info";

const DEFAULT_POLICY = `
<h2>นโยบายเว็บไซต์</h2>
<p>เว็บไซต์ของ${SITE_INFO.villageName} จัดทำขึ้นเพื่อเผยแพร่ข้อมูลข่าวสารและให้บริการประชาชน
ตามหลักธรรมาภิบาลและความโปร่งใส</p>
<h3>1. นโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h3>
<p>เว็บไซต์เก็บรวบรวมข้อมูลเท่าที่จำเป็นต่อการให้บริการ ไม่เปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับอนุญาต</p>
<h3>2. นโยบายการรักษาความมั่นคงปลอดภัย</h3>
<p>มีระบบควบคุมการเข้าถึง การเข้ารหัสข้อมูล และการตรวจสอบการเข้าใช้งาน</p>
<h3>3. นโยบายลิขสิทธิ์</h3>
<p>เนื้อหาบนเว็บไซต์เป็นลิขสิทธิ์ของหมู่บ้าน อนุญาตให้นำไปใช้เพื่อประโยชน์สาธารณะโดยอ้างอิงแหล่งที่มา</p>
<h3>4. การปฏิเสธความรับผิด</h3>
<p>ข้อมูลที่เผยแพร่อาจมีการเปลี่ยนแปลงได้ โปรดตรวจสอบกับเจ้าหน้าที่ก่อนใช้อ้างอิงทางราชการ</p>
`;

const PolicyPage = () => {
  const { data } = useVillageInfo(["policy"]);
  const html = DOMPurify.sanitize(data["policy"]?.content || DEFAULT_POLICY);

  useEffect(() => {
    document.title = `นโยบายเว็บไซต์ | ${SITE_INFO.villageName}`;
  }, []);

  return (
    <SiteLayout>
      <section className="bg-gradient-primary text-primary-foreground py-12 md:py-16 ribbon-gold">
        <div className="container">
          <p className="text-xs uppercase tracking-widest text-accent mb-2">เมนูพิเศษ</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-accent" />
            {data["policy"]?.title || "นโยบายเว็บไซต์"}
          </h1>
        </div>
      </section>
      <section className="py-10 md:py-14 bg-background">
        <div className="container max-w-4xl">
          <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
    </SiteLayout>
  );
};

export default PolicyPage;