import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import News from "./pages/News.tsx";
import NewsDetail from "./pages/NewsDetail.tsx";
import PersonnelPage from "./pages/PersonnelPage.tsx";
import Faq from "./pages/Faq.tsx";
import Complaints from "./pages/Complaints.tsx";
import PublicDocuments from "./pages/PublicDocuments.tsx";
import Otop from "./pages/Otop.tsx";
import Gallery from "./pages/Gallery.tsx";
import Events from "./pages/Events.tsx";
import VillageInfoPage from "./pages/VillageInfoPage.tsx";
import Contact from "./pages/Contact.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import NewsAdmin from "./pages/admin/NewsAdmin.tsx";
import PersonnelAdmin from "./pages/admin/PersonnelAdmin.tsx";
import BannersAdmin from "./pages/admin/BannersAdmin.tsx";
import OtopAdmin from "./pages/admin/OtopAdmin.tsx";
import DocumentsAdmin from "./pages/admin/DocumentsAdmin.tsx";
import ComplaintsAdmin from "./pages/admin/ComplaintsAdmin.tsx";
import FaqsAdmin from "./pages/admin/FaqsAdmin.tsx";
import GalleryAdmin from "./pages/admin/GalleryAdmin.tsx";
import EventsAdmin from "./pages/admin/EventsAdmin.tsx";
import SettingsAdmin from "./pages/admin/SettingsAdmin.tsx";
import AuditLogsAdmin from "./pages/admin/AuditLogsAdmin.tsx";
import ItaIndicatorsAdmin from "./pages/admin/ItaIndicatorsAdmin.tsx";
import ItaPage from "./pages/ItaPage.tsx";
import PolicyPage from "./pages/PolicyPage.tsx";
import ManualPage from "./pages/ManualPage.tsx";
import InfoCenterPage from "./pages/InfoCenterPage.tsx";

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
          <VisitorTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Public pages */}
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/about/personnel" element={<PersonnelPage />} />
            <Route path="/about/history" element={<VillageInfoPage />} />
            <Route path="/about/vision" element={<VillageInfoPage />} />
            <Route path="/about/structure" element={<VillageInfoPage />} />
            <Route path="/about/authority" element={<VillageInfoPage />} />
            <Route path="/transparency" element={<VillageInfoPage />} />
            <Route path="/transparency/plans" element={<VillageInfoPage />} />
            <Route path="/transparency/budget" element={<VillageInfoPage />} />
            <Route path="/transparency/reports" element={<VillageInfoPage />} />
            <Route path="/ita" element={<ItaPage />} />
            <Route path="/info-center" element={<InfoCenterPage />} />
            <Route path="/policy" element={<PolicyPage />} />
            <Route path="/manual" element={<ManualPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/services/documents" element={<PublicDocuments />} />
            <Route path="/services/otop" element={<Otop />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/events" element={<Events />} />

            {/* Admin */}
            <Route path="/admin" element={wrapAdmin(<Dashboard />)} />
            <Route path="/admin/news" element={wrapAdmin(<NewsAdmin />)} />
            <Route path="/admin/personnel" element={wrapAdmin(<PersonnelAdmin />)} />
            <Route path="/admin/banners" element={wrapAdmin(<BannersAdmin />)} />
            <Route path="/admin/otop" element={wrapAdmin(<OtopAdmin />)} />
            <Route path="/admin/documents" element={wrapAdmin(<DocumentsAdmin />)} />
            <Route path="/admin/complaints" element={wrapAdmin(<ComplaintsAdmin />)} />
            <Route path="/admin/faqs" element={wrapAdmin(<FaqsAdmin />)} />
            <Route path="/admin/gallery" element={wrapAdmin(<GalleryAdmin />)} />
            <Route path="/admin/events" element={wrapAdmin(<EventsAdmin />)} />
            <Route path="/admin/settings" element={wrapAdmin(<SettingsAdmin />)} />
            <Route path="/admin/audit-logs" element={wrapAdmin(<AuditLogsAdmin />)} />
            <Route path="/admin/ita-indicators" element={wrapAdmin(<ItaIndicatorsAdmin />)} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
