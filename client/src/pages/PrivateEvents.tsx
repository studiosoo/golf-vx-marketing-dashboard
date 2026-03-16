import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign } from "lucide-react";

export default function PrivateEvents() {
  const { data: campaigns, isLoading } = trpc.campaigns.getByCategory.useQuery({ category: "corporate_events" });

  const formatCurrency = (val: any) =>
    `$${parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Private Events</h1>
        <p className="text-[#6F6F6B] text-sm mt-1">Corporate and private event bookings</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-xl animate-pulse border border-[#DEDEDA]" />
          ))}
        </div>
      ) : campaigns && (campaigns as any[]).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(campaigns as any[]).map((event: any) => (
            <Card key={event.id} className="bg-white border-[#DEDEDA]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-[#222222]">{event.name}</div>
                    <div className="text-xs text-[#6F6F6B] mt-0.5 capitalize">{event.type?.replace(/_/g, " ")}</div>
                  </div>
                  <Badge variant={event.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                    {event.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-[#6F6F6B]" />
                    <div>
                      <div className="text-sm font-semibold text-[#222222]">{formatCurrency(event.actualRevenue)}</div>
                      <div className="text-xs text-[#6F6F6B]">Revenue</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#6F6F6B]" />
                    <div>
                      <div className="text-sm font-semibold text-[#222222]">
                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}
                      </div>
                      <div className="text-xs text-[#6F6F6B]">Date</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#6F6F6B]">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>No private events found</p>
        </div>
      )}
    </div>
  );
}
