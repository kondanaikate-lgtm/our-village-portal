import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, MessageCircle } from "lucide-react";
import { SITE_INFO } from "@/config/site";

export const SiteFooter = () => {
  const year = new Date().getFullYear() + 543;

  return (
    <footer className="bg-primary-deep text-primary-foreground mt-16 ribbon-gold">
      <div className="container py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: ข้อมูลหมู่บ้าน */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                <span className="font-display font-bold text-accent-foreground text-xl">
                  ๒
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-accent">
                  {SITE_INFO.villageName}
                </h3>
                <p className="text-xs text-primary-foreground/70">
                  Saeo Village Moo 2
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4 max-w-md">
              {SITE_INFO.description}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                <span className="text-primary-foreground/85">
                  {SITE_INFO.fullAddress}
                </span>
              </div>
              <a
                href={`tel:${SITE_INFO.headman.phoneRaw}`}
                className="flex items-center gap-2 hover:text-accent transition-base"
              >
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <span>{SITE_INFO.headman.phone}</span>
              </a>
            </div>
          </div>

          {/* Column 2: ผู้ใหญ่บ้าน */}
          <div>
            <h4 className="font-display font-semibold text-accent mb-4 text-sm uppercase tracking-wider">
              ผู้ใหญ่บ้าน
            </h4>
            <div className="text-sm space-y-1.5">
              <div className="font-medium text-primary-foreground">
                {SITE_INFO.headman.name}
              </div>
              <div className="text-primary-foreground/75">
                {SITE_INFO.headman.position}
              </div>
              <div className="text-primary-foreground/75">บ้านแซร์ออ</div>
              <a
                href={`tel:${SITE_INFO.headman.phoneRaw}`}
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-accent/15 hover:bg-accent/25 rounded-md text-accent transition-base"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">โทรหาผู้ใหญ่บ้าน</span>
              </a>
            </div>
          </div>

          {/* Column 3: ลิงก์ด่วน */}
          <div>
            <h4 className="font-display font-semibold text-accent mb-4 text-sm uppercase tracking-wider">
              ลิงก์ด่วน
            </h4>
            <ul className="space-y-2 text-sm">
              {[
              { label: "ข่าวประชาสัมพันธ์", href: "/news" },
                { label: "ปฏิทินกิจกรรม", href: "/events" },
                { label: "เอกสารดาวน์โหลด", href: "/services/documents" },
                { label: "แกลเลอรี่ภาพ", href: "/gallery" },
                { label: "ร้องเรียน / ร้องทุกข์", href: "/complaints" },
                { label: "คำถามที่พบบ่อย", href: "/faq" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social */}
        <div className="mt-10 pt-8 border-t border-primary-foreground/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary-foreground/70">
              ติดตามเรา:
            </span>
            <a
              href="#"
              aria-label="Facebook"
              className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-base"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="LINE"
              className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-base"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="mailto:contact@village.local"
              aria-label="Email"
              className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-base"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-primary-foreground/60 text-center sm:text-right">
            © {year} {SITE_INFO.villageName}. สงวนลิขสิทธิ์.
          </p>
        </div>
      </div>
    </footer>
  );
};
