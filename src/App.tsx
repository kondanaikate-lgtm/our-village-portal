import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import News from "./pages/News.tsx";
import NewsDetail from "./pages/NewsDetail.tsx";
import PersonnelPage from "./pages/PersonnelPage.tsx";
import Faq from "./pages/Faq.tsx";
import Complaints from "./pages/Complaints.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import NewsAdmin from "./pages/admin/NewsAdmin.tsx";
import PersonnelAdmin from "./pages/admin/PersonnelAdmin.tsx";
import BannersAdmin from "./pages/admin/BannersAdmin.tsx";
import OtopAdmin from "./pages/admin/OtopAdmin.tsx";
import DocumentsAdmin from "./pages/admin/DocumentsAdmin.tsx";

const queryClient = new QueryClient();

const wrapAdmin = (el: JSX.Element) => (
  <ProtectedRoute requireAdmin>
    <AdminLayout>{el}</AdminLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Public pages */}
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/about/personnel" element={<PersonnelPage />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/complaints" element={<Complaints />} />

            {/* Admin */}
            <Route path="/admin" element={wrapAdmin(<Dashboard />)} />
            <Route path="/admin/news" element={wrapAdmin(<NewsAdmin />)} />
            <Route path="/admin/personnel" element={wrapAdmin(<PersonnelAdmin />)} />
            <Route path="/admin/banners" element={wrapAdmin(<BannersAdmin />)} />
            <Route path="/admin/otop" element={wrapAdmin(<OtopAdmin />)} />
            <Route path="/admin/documents" element={wrapAdmin(<DocumentsAdmin />)} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
