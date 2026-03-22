import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap } from "lucide-react";

interface Conversion {
  email: string;
  applicantName: string;
  appointmentType: string;
  appointmentDate: Date | null;
  conversionType: "trial" | "drive_day";
}

interface ConversionsData {
  total: number;
  trialCount: number;
  driveDayCount: number;
  conversions: Conversion[];
}

interface BottomFunnelConversionProps {
  conversions: ConversionsData | undefined;
  totalApplications: number;
}

export function BottomFunnelConversion({ conversions, totalApplications }: BottomFunnelConversionProps) {
  return (
    <Card className="border border-[#DEDEDA] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#F2DD48]" />
          Bottom Funnel Conversion
        </CardTitle>
        <CardDescription className="text-xs text-[#AAAAAA]">
          Giveaway applicants who booked $9 Trial or Drive Day — matched by email via Acuity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-[#F1F1EF] rounded-lg">
            <div className="text-2xl font-bold text-[#222222]">{conversions?.total ?? 0}</div>
            <div className="text-xs text-[#888888] mt-0.5">Total Converted</div>
            <div className="text-xs text-[#AAAAAA] mt-0.5">
              {conversions && totalApplications > 0
                ? ((conversions.total / totalApplications) * 100).toFixed(1)
                : "0.0"}% of applicants
            </div>
          </div>
          <div className="text-center p-3 bg-[#F1F1EF] rounded-lg">
            <div className="text-2xl font-bold text-[#545A60]">{conversions?.trialCount ?? 0}</div>
            <div className="text-xs text-[#888888] mt-0.5">$9 Trial</div>
            <div className="text-xs text-[#AAAAAA] mt-0.5">Anniversary Trial Sessions</div>
          </div>
          <div className="text-center p-3 bg-[#F1F1EF] rounded-lg">
            <div className="text-2xl font-bold text-[#545A60]">{conversions?.driveDayCount ?? 0}</div>
            <div className="text-xs text-[#888888] mt-0.5">Drive Day</div>
            <div className="text-xs text-[#AAAAAA] mt-0.5">Clinic bookings</div>
          </div>
        </div>

        {conversions && conversions.conversions.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[#888888] mb-2">Converted Applicants</div>
            {conversions.conversions.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-[#F9F9F9] rounded text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#72B84A]" />
                  <span className="font-medium text-[#222222]">{c.applicantName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    c.conversionType === "trial"
                      ? "bg-[#F2DD48]/20 text-[#8B6E00]"
                      : "bg-[#007AFF]/10 text-[#007AFF]"
                  }`}>
                    {c.conversionType === "trial" ? "$9 Trial" : "Drive Day"}
                  </span>
                  {c.appointmentDate && (
                    <span className="text-[#AAAAAA]">
                      {new Date(c.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(!conversions || conversions.total === 0) && (
          <div className="text-center py-4 text-xs text-[#AAAAAA]">
            No conversions tracked yet — conversions appear when applicants book via Acuity
          </div>
        )}
      </CardContent>
    </Card>
  );
}
