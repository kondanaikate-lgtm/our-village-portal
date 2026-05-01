import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  category: string | null;
  cover_image_url: string | null;
  image_urls?: string[] | null;
}

const Events = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    document.title = "ปฏิทินกิจกรรม | หมู่บ้านแซร์ออ ม.2";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("start_at", startOfMonth(month).toISOString())
        .lte("start_at", endOfMonth(month).toISOString())
        .order("start_at", { ascending: true });
      setEvents((data as EventItem[]) || []);
      setLoading(false);
    };
    load();
  }, [month]);

  const eventDays = useMemo(
    () => events.map((e) => new Date(e.start_at)),
    [events],
  );

  const eventsForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => isSameDay(new Date(e.start_at), selectedDate));
  }, [events, selectedDate]);

  return (
    <SiteLayout>
      <div className="container py-10 lg:py-14">
        <SectionHeader
          eyebrow="ปฏิทิน"
          title="กิจกรรมหมู่บ้าน"
          description="ติดตามกิจกรรม การประชุม และอีเวนต์ของหมู่บ้านแซร์ออ หมู่ที่ 2"
        />

        <Tabs defaultValue="month" className="mt-8">
          <TabsList>
            <TabsTrigger value="month">มุมมองเดือน</TabsTrigger>
            <TabsTrigger value="list">รายการ</TabsTrigger>
          </TabsList>

          <TabsContent value="month" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
              <Card className="p-2 w-fit mx-auto lg:mx-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={setMonth}
                  locale={th}
                  modifiers={{ hasEvent: eventDays }}
                  modifiersClassNames={{
                    hasEvent:
                      "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary",
                  }}
                  className={cn("p-3 pointer-events-auto")}
                />
              </Card>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold">
                  {selectedDate
                    ? format(selectedDate, "d MMMM yyyy", { locale: th })
                    : "เลือกวันที่"}
                </h3>
                {eventsForSelected.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ไม่มีกิจกรรมในวันนี้
                  </p>
                ) : (
                  eventsForSelected.map((e) => <EventCard key={e.id} event={e} onClick={() => setDetailEvent(e)} />)
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ไม่มีกิจกรรมในเดือนนี้
              </p>
            ) : (
              events.map((e) => <EventCard key={e.id} event={e} onClick={() => setDetailEvent(e)} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailEvent && <EventDetail event={detailEvent} />}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
};

const EventCard = ({ event, onClick }: { event: EventItem; onClick?: () => void }) => {
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;
  const photoCount = (event.image_urls?.length ?? 0) + (event.cover_image_url ? 1 : 0);
  return (
    <Card className="hover:shadow-md transition-base cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex gap-4">
        <div className="shrink-0 w-16 text-center bg-primary/10 text-primary rounded-md py-2">
          <div className="text-2xl font-display font-bold leading-none">
            {format(start, "d")}
          </div>
          <div className="text-xs uppercase mt-1">
            {format(start, "MMM", { locale: th })}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground">{event.title}</h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {photoCount > 0 && <Badge variant="outline" className="text-xs">{photoCount} รูป</Badge>}
              {event.category && <Badge variant="secondary">{event.category}</Badge>}
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.all_day
                ? "ทั้งวัน"
                : `${format(start, "HH:mm")}${end ? ` - ${format(end, "HH:mm")}` : ""}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EventDetail = ({ event }: { event: EventItem }) => {
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;
  const gallery = [
    ...(event.cover_image_url ? [event.cover_image_url] : []),
    ...((event.image_urls ?? []).filter((u) => u && u !== event.cover_image_url)),
  ];
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{event.title}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{format(start, "d MMMM yyyy", { locale: th })}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{event.all_day ? "ทั้งวัน" : `${format(start, "HH:mm")}${end ? ` - ${format(end, "HH:mm")}` : ""}`}</span>
        {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>}
        {event.category && <Badge variant="secondary">{event.category}</Badge>}
      </div>
      {gallery.length > 0 && (
        <div className="space-y-2">
          <Carousel opts={{ loop: gallery.length > 1 }}>
            <CarouselContent>
              {gallery.map((url, i) => (
                <CarouselItem key={`${url}-${i}`}>
                  <div className="aspect-video bg-muted rounded-md overflow-hidden">
                    <img src={url} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {gallery.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {gallery.map((url, i) => (
                <div key={`${url}-thumb-${i}`} className="aspect-square rounded overflow-hidden border border-border">
                  <img src={url} alt={`thumb-${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {event.description && (
        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{event.description}</div>
      )}
    </div>
  );
};

export default Events;
