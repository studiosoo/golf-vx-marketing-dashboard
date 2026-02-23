import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function CalendarViewer() {
  // Combine both calendars in a single iframe using Google Calendar's multi-calendar format
  // Format: src=CALENDAR1&src=CALENDAR2&ctz=TIMEZONE
  const unifiedCalendarUrl = 
    "https://calendar.google.com/calendar/embed?" +
    "src=119453e46227722060aae4e5fc24b9bb77c237965700a798244d5d8f79d58f06%40group.calendar.google.com&" +
    "src=golfvx.arlingtonheights%40gmail.com&" +
    "ctz=America%2FChicago&" +
    "mode=WEEK&" +
    "showTitle=0&" +
    "showNav=1&" +
    "showDate=1&" +
    "showPrint=0&" +
    "showTabs=1&" +
    "showCalendars=1";

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Marketing campaigns and venue events in unified view
          </p>
        </div>
        <a
          href={unifiedCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Google Calendar
        </a>
      </div>

      <Card>
        <CardContent className="p-0">
          <iframe
            src={unifiedCalendarUrl}
            className="w-full h-[calc(100vh-200px)] border-0"
            title="Golf VX Unified Calendar"
          />
        </CardContent>
      </Card>
    </div>
  );
}
