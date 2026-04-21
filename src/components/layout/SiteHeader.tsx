import { Link, useLocation } from "react-router-dom";
import { Menu, Phone, ChevronDown, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NAV_ITEMS, SITE_INFO } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { settings } = useSiteSettings();

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* แถบบนสุด: ข้อมูลติดต่อด่วน */}
      <div className="bg-primary-deep text-primary-foreground/90 text-xs">
        <div className="container flex h-9 items-center justify-between">
          <div className="hidden sm:block">
            ยินดีต้อนรับสู่เว็บไซต์ {settings.siteName}
          </div>
          <a
            href={`tel:${SITE_INFO.headman.phoneRaw}`}
            className="flex items-center gap-1.5 hover:text-accent transition-base"
          >
            <Phone className="h-3 w-3" />
            <span className="font-medium">{SITE_INFO.headman.phone}</span>
          </a>
        </div>
      </div>

      {/* แถบหลัก: โลโก้ + เมนู */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-b border-border shadow-sm">
        <div className="container flex h-16 lg:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteName} className="h-11 w-11 lg:h-14 lg:w-14 rounded-full object-cover bg-secondary shadow-md ring-2 ring-accent/30 shrink-0" />
            ) : (
              <div className="relative h-11 w-11 lg:h-14 lg:w-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-md ring-2 ring-accent/30 shrink-0">
                <span className="font-display font-bold text-accent text-lg lg:text-2xl">๒</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="font-display font-bold text-sm lg:text-lg leading-tight text-foreground truncate">
                {settings.siteName}
              </div>
              <div className="text-[10px] lg:text-xs text-muted-foreground truncate">
                {SITE_INFO.shortAddress}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md flex items-center gap-1 transition-base",
                        isActive(item.href)
                          ? "text-primary bg-secondary"
                          : "text-foreground hover:text-primary hover:bg-secondary/60",
                      )}
                    >
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[220px]">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link to={child.href} className="cursor-pointer">
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-base",
                    isActive(item.href)
                      ? "text-primary bg-secondary"
                      : "text-foreground hover:text-primary hover:bg-secondary/60",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* CTA + Mobile menu */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="royal"
              className="hidden md:inline-flex"
            >
              <Link to={user && isAdmin ? "/admin" : "/auth"}>
                {user && isAdmin ? <ShieldCheck className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                {user && isAdmin ? "แผงจัดการ" : "เข้าสู่ระบบ"}
              </Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="xl:hidden">
                <Button variant="ghost" size="icon" aria-label="เปิดเมนู">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
                <SheetHeader className="px-6 py-4 border-b border-border bg-gradient-primary text-primary-foreground">
                  <SheetTitle className="text-primary-foreground text-left">
                    เมนูหลัก
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-[calc(100vh-80px)] px-2 py-2">
                  <Accordion type="multiple" className="w-full">
                    {NAV_ITEMS.map((item) =>
                      item.children ? (
                        <AccordionItem
                          key={item.href}
                          value={item.href}
                          className="border-border"
                        >
                          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                            {item.label}
                          </AccordionTrigger>
                          <AccordionContent className="pb-2">
                            <ul className="space-y-0.5 pl-4">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    to={child.href}
                                    onClick={() => setOpen(false)}
                                    className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-secondary rounded-md transition-base"
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ) : (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setOpen(false)}
                          className="block px-4 py-3 text-sm font-medium border-b border-border hover:bg-secondary transition-base"
                        >
                          {item.label}
                        </Link>
                      ),
                    )}
                  </Accordion>

                  <div className="px-4 py-4 mt-2">
                    <Button asChild variant="royal" className="w-full">
                      <Link to={user && isAdmin ? "/admin" : "/auth"} onClick={() => setOpen(false)}>
                        {user && isAdmin ? <ShieldCheck className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                        {user && isAdmin ? "แผงจัดการ" : "เข้าสู่ระบบ"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
