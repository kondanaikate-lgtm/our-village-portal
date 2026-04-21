import { ReactNode, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  FileText,
  Image as ImageIcon,
  MessageSquareWarning,
  Megaphone,
  Calendar,
  Package,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { to: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, end: true },
  { to: "/admin/news", label: "ข่าวสาร", icon: Newspaper },
  { to: "/admin/personnel", label: "บุคลากร", icon: Users },
  { to: "/admin/documents", label: "เอกสาร", icon: FileText },
  { to: "/admin/gallery", label: "แกลเลอรี่", icon: ImageIcon },
  { to: "/admin/events", label: "ปฏิทินกิจกรรม", icon: Calendar },
  { to: "/admin/banners", label: "แบนเนอร์", icon: Megaphone },
  { to: "/admin/otop", label: "สินค้า OTOP", icon: Package },
  { to: "/admin/complaints", label: "ร้องเรียน", icon: MessageSquareWarning },
  { to: "/admin/faqs", label: "คำถามที่พบบ่อย", icon: HelpCircle },
  { to: "/admin/settings", label: "ตั้งค่าเว็บไซต์", icon: Settings },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
  <div className="flex flex-col h-full">
    <Link
      to="/admin"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border bg-gradient-primary text-primary-foreground"
    >
      <ShieldCheck className="h-6 w-6 text-accent" />
      <div className="min-w-0">
        <div className="font-display font-bold text-sm leading-tight truncate">ระบบจัดการเว็บไซต์</div>
        <div className="text-[11px] opacity-80 truncate">หมู่บ้านแซร์ออ ม.2</div>
      </div>
    </Link>
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      <ul className="space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-base",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-secondary",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  </div>
);

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("ออกจากระบบแล้ว");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-background border-r border-border flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-14">
            <div className="flex items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" aria-label="เปิดเมนู">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>เมนูจัดการเว็บไซต์</SheetTitle>
                  </SheetHeader>
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
                ← ดูเว็บไซต์
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs text-muted-foreground">เข้าสู่ระบบในชื่อ</div>
                <div className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {user?.email}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};
