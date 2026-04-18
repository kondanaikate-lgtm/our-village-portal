import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="text-muted-foreground max-w-md">
          บัญชีของคุณยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลเว็บไซต์เพื่อขอสิทธิ์
        </p>
        <a
          href="/"
          className="text-primary hover:underline font-medium"
        >
          กลับสู่หน้าแรก
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
