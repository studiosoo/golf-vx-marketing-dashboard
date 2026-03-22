import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FUNNEL_STEPS } from "./constants";

export function FunnelTable() {
  return (
    <Card className="border border-[#DEDEDA] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#222222]">
          Funnel Analytics — Annual Membership Giveaway | Q1 2026
        </CardTitle>
        <CardDescription className="text-xs text-[#AAAAAA]">
          ClickFunnels data (02/02/2026 – 03/03/2026)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#DEDEDA]">
                <th className="text-left py-2 text-[#AAAAAA] font-medium">Funnel Step</th>
                <th className="text-right py-2 text-[#AAAAAA] font-medium">All Views</th>
                <th className="text-right py-2 text-[#AAAAAA] font-medium">Unique Views</th>
                <th className="text-right py-2 text-[#AAAAAA] font-medium">Opt-ins</th>
                <th className="text-right py-2 text-[#AAAAAA] font-medium">Opt-in Rate</th>
              </tr>
            </thead>
            <tbody>
              {FUNNEL_STEPS.map((step, i) => (
                <tr key={i} className="border-b border-[#F0F0F0]">
                  <td className="py-2.5 font-medium text-[#222222]">{step.label}</td>
                  <td className="py-2.5 text-right text-[#545A60]">{step.allViews.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-[#545A60]">{step.uniqueViews.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-[#545A60]">{step.optIns}</td>
                  <td className="py-2.5 text-right">
                    <span className={`font-semibold ${parseFloat(step.optInRate) > 10 ? "text-[#72B84A]" : "text-[#888888]"}`}>
                      {step.optInRate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
