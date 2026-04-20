import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface EventItem {
  id: string;
  title: string;
  start_at: string;
  location: string | null;
  category: string | null;
}

export const EventsSection = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,start_at,location,category")
        .eq("is_published", true)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(4);
      setEvents((data as EventItem[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <section className="container py-12 lg:py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <SectionHeader
          eyebrow="กำลังจะมาถึง"
          title="ปฏิทินกิจกรรม"
          description="กิจกรรมและอีเวนต์ของหมู่บ้านที่กำลังจะเกิดขึ้น"
        />
        <Button asChild variant="outline">
          <Link to="/events">
            ดูทั้งหมด <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))
          : events.map((e) => {
              const d = new Date(e.start_at);
              return (
                <Card key={e.id} className="hover:shadow-md transition-base">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-center bg-primary/10 text-primary rounded-md px-3 py-2 min-w-[60px]">
                        <div className="text-xl font-display font-bold leading-none">
                          {format(d, "d")}
                        </div>
                        <div className="text-xs mt-1">
                          {format(d, "MMM", { locale: th })}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground line-clamp-2">
                          {e.title}
                        </h4>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(d, "HH:mm")} น.
                          </div>
                          {e.location && (
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{e.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </section>
  );
};
