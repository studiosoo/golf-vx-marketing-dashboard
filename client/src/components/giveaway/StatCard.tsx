import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({ title, value, sub, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="border border-[#E0E0E0] shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#888888]">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#AAAAAA]" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tracking-tight ${accent ? "text-[#F5C72C]" : "text-[#111111]"}`}>{value}</div>
        <p className="text-xs text-[#AAAAAA] mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
