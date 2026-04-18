import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { SITE_INFO } from "@/config/site";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().trim().email({ message: "อีเมลไม่ถูกต้อง" }).max(255),
  password: z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }).max(72),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, { message: "กรุณากรอกชื่อ-นามสกุล" }).max(100),
  email: z.string().trim().email({ message: "อีเมลไม่ถูกต้อง" }).max(255),
  password: z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }).max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : signInError.message,
      );
      return;
    }
    toast.success("เข้าสู่ระบบสำเร็จ");
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ"
          : signUpError.message,
      );
      return;
    }
    toast.success("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี");
    setTab("signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50 flex flex-col">
      <div className="container py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-base"
        >
          <ArrowLeft className="h-4 w-4" /> กลับสู่หน้าแรก
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-md ring-2 ring-accent/30 mb-3">
              <ShieldCheck className="h-7 w-7 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {SITE_INFO.villageName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ระบบสำหรับเจ้าหน้าที่และผู้ดูแลเว็บไซต์
            </p>
          </div>

          <Card className="shadow-lg">
            <Tabs value={tab} onValueChange={(v) => { setTab(v as "signin" | "signup"); setError(null); }}>
              <CardHeader className="pb-2">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
                  <TabsTrigger value="signup">สมัครสมาชิก</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="signin">
                <CardHeader className="pt-2">
                  <CardTitle className="text-lg">เข้าสู่ระบบ</CardTitle>
                  <CardDescription>กรอกอีเมลและรหัสผ่านของคุณ</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">อีเมล</Label>
                      <Input id="signin-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">รหัสผ่าน</Label>
                      <Input id="signin-password" name="password" type="password" required autoComplete="current-password" />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" variant="royal" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      เข้าสู่ระบบ
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="signup">
                <CardHeader className="pt-2">
                  <CardTitle className="text-lg">สมัครสมาชิก</CardTitle>
                  <CardDescription>สร้างบัญชีใหม่เพื่อใช้งานระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">ชื่อ-นามสกุล</Label>
                      <Input id="signup-name" name="fullName" type="text" required placeholder="สมชาย ใจดี" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">อีเมล</Label>
                      <Input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">รหัสผ่าน</Label>
                      <Input id="signup-password" name="password" type="password" required autoComplete="new-password" minLength={6} />
                      <p className="text-xs text-muted-foreground">อย่างน้อย 6 ตัวอักษร</p>
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" variant="royal" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      สมัครสมาชิก
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            หากเป็นประชาชนทั่วไป สามารถใช้งานเว็บไซต์ได้โดยไม่ต้องล็อกอิน
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
