import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Logs a visit to public.site_visitors via the increment_visitor RPC.
 * - Skips admin and auth routes
 * - De-duplicates the same path within a single tab session
 */
export const VisitorTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;
    try {
      const key = "vt:" + pathname;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage errors
    }
    supabase.rpc("increment_visitor", { _page_path: pathname }).then(() => {});
  }, [pathname]);

  return null;
};