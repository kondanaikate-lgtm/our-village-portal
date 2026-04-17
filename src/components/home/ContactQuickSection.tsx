import { Link } from "react-router-dom";
import { Phone, MapPin, MessageSquareWarning, FileText, Calendar, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SITE_INFO } from "@/config/site";

const QUICK_LINKS = [
  {
    icon: MessageSquareWarning,
    title: "ร้องเรียน / ร้องทุกข์",
    description: "แจ้งปัญหาในชุมชนถึงผู้ใหญ่บ้าน",
    href: "/complaints",
  },
  {
    icon: FileText,
    title: "แบบฟอร์มดาวน์โหลด",
    description: "เอกสารคำร้องและหนังสือต่างๆ",
    href: "/services/forms",
  },
  {
    icon: Calendar,
    title: "ปฏิทินกิจกรรม",
    description: "ดูกิจกรรมและงานสำคัญของหมู่บ้าน",
    href: "/calendar",
  },
  {
    icon: HelpCircle,
    title: "คำถามที่พบบ่อย",
    description: "คำตอบสำหรับคำถามทั่วไป",
    href: "/faq",
  },
];

export const ContactQuickSection = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-section">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact card — gold gradient */}
          <Card className="lg:col-span-2 p-8 bg-gradient-primary text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 mb-4">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs text-accent font-medium">
                  ติดต่อด่วน 24 ชม.
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-2 text-balance">
                ผู้ใหญ่บ้านพร้อมรับฟัง
              </h2>
              <p className="text-sm text-primary-foreground/80 mb-6 leading-relaxed">
                ติดต่อ {SITE_INFO.headman.name} ผู้ใหญ่บ้าน หมู่ที่ 2 บ้านแซร์ออ ได้ตลอดเวลาทำการ
              </p>

              <div className="space-y-3 mb-6">
                <a
                  href={`tel:${SITE_INFO.headman.phoneRaw}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary-foreground/10 hover:bg-accent/20 transition-base"
                >
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-primary-foreground/70">
                      โทรศัพท์
                    </div>
                    <div className="font-display font-semibold text-base text-accent">
                      {SITE_INFO.headman.phone}
                    </div>
                  </div>
                </a>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary-foreground/10">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-primary-foreground/70">
                      ที่อยู่
                    </div>
                    <div className="text-sm leading-snug">
                      {SITE_INFO.fullAddress}
                    </div>
                  </div>
                </div>
              </div>

              <Button asChild variant="hero" className="w-full sm:w-auto">
                <Link to="/contact">ดูข้อมูลติดต่อทั้งหมด</Link>
              </Button>
            </div>
          </Card>

          {/* Quick links grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
                บริการประชาชน
              </h2>
              <p className="text-sm text-muted-foreground">
                เข้าถึงบริการต่างๆ ของหมู่บ้านได้สะดวก รวดเร็ว
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} to={link.href} className="group">
                    <Card className="p-5 h-full hover:shadow-md hover:border-accent/40 transition-base border-border/60">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-lg bg-accent/15 group-hover:bg-accent group-hover:text-accent-foreground flex items-center justify-center shrink-0 transition-base">
                          <Icon className="h-5 w-5 text-accent group-hover:text-accent-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-base mb-1">
                            {link.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
