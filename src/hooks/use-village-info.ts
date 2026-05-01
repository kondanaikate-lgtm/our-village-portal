import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch one or more village_info rows by section_key.
 * Returns a map: { [section_key]: { title, content } }
 */
export const useVillageInfo = (keys: string[]) => {
  const [data, setData] = useState<Record<string, { title: string; content: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from("village_info")
        .select("section_key,title,content")
        .in("section_key", keys);
      if (!alive) return;
      const map: Record<string, { title: string; content: string }> = {};
      (rows ?? []).forEach((r: any) => {
        map[r.section_key] = { title: r.title ?? "", content: r.content ?? "" };
      });
      setData(map);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join("|")]);

  return { data, loading };
};
