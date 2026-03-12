import { trpc } from "@/lib/trpc";
import { ProgramAIIntelligence } from "@/components/ProgramAIIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar } from "lucide-react";

export default function Leagues() {
  // Leagues are tracked via campaigns with type "league"
  const { data: campaigns, isLoading } = trpc.campaigns.getByCategory.useQuery({ category: "membership_acquisition" });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Leagues</h1>
        <p className="text-[#6F6F6B] text-sm mt-1">Golf league management and tracking</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-[#DEDEDA]" />
          ))}
        </div>
      ) : campaigns && (campaigns as any[]).length > 0 ? (
        <div className="space-y-3">
          {(campaigns as any[]).map((league: any) => (
            <Card key={league.id} className="bg-white border-[#DEDEDA]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[#222222] flex items-center gap-2">
                      <Trophy size={16} className="text-[#F2DD48]" />
                      {league.name}
                    </div>
                    <div className="text-xs text-[#6F6F6B] mt-1">{league.description}</div>
                  </div>
                  <Badge
                    variant={league.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {league.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#222222]">${parseFloat(String(league.actualRevenue || 0)).toLocaleString()}</div>
                    <div className="text-xs text-[#6F6F6B]">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#222222]">${parseFloat(String(league.actualSpend || 0)).toLocaleString()}</div>
                    <div className="text-xs text-[#6F6F6B]">Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#222222]">
                      {league.startDate ? new Date(league.startDate).toLocaleDateString() : "—"}
                    </div>
                    <div className="text-xs text-[#6F6F6B]">Start Date</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#6F6F6B]">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No leagues found</p>
        </div>
      )}

      {/* AI Marketing Intelligence */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-[#F2DD48]">✦</span> AI Marketing Intelligence
          </h2>
          <p className="text-sm text-[#6F6F6B] mt-1">AI-generated multi-channel marketing strategy for Golf VX Leagues.</p>
        </div>
        <ProgramAIIntelligence campaignId={5} programName="Golf VX Leagues" />
      </div>
    </div>
  );
}
