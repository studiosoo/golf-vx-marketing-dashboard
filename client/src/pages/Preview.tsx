import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtCurrency(n: number) {
  return "$" + fmt(n);
}
function fmtPercent(n: number) {
  return (n >= 0 ? "+" : "") + fmt(n, 1) + "%";
}

export default function Preview() {
  const { data, isLoading, error } = trpc.preview.getSnapshot.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-lg font-medium animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-lg">Unable to load preview data.</div>
      </div>
    );
  }

  const memberProgress = Math.min((data.members.total / data.members.goal) * 100, 100);
  const budgetUtilization = data.budget.utilization;
  const momChange = data.revenue.mom;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
            alt="Golf VX"
            className="h-8 w-auto"
          />
          <div>
            <div className="text-sm font-semibold text-white">Golf VX Arlington Heights</div>
            <div className="text-xs text-zinc-500">Marketing Dashboard — Read-Only Preview</div>
          </div>
        </div>
        <div className="text-xs text-zinc-600">
          Updated {new Date(data.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Membership Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Membership</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">Total Members</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold text-yellow-400">{data.members.total}</div>
                <div className="text-xs text-zinc-500 mt-1">Goal: {data.members.goal}</div>
                <Progress value={memberProgress} className="mt-2 h-1.5 bg-zinc-800" />
                <div className="text-xs text-zinc-600 mt-1">{fmt(memberProgress, 1)}% of goal</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">All Access Ace</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold text-white">{data.members.allAccessAce}</div>
                <div className="text-xs text-zinc-500 mt-1">Premium tier</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">Swing Saver</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold text-white">{data.members.swingSaver}</div>
                <div className="text-xs text-zinc-500 mt-1">Value tier</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">New This Month</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold text-green-400">+{data.members.newThisMonth}</div>
                <div className="text-xs text-zinc-500 mt-1">New sign-ups</div>
              </CardContent>
            </Card>
          </div>

          {/* MRR bar */}
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardContent className="px-4 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Monthly Recurring Revenue (MRR)</div>
                <div className="text-2xl font-bold text-yellow-400 mt-1">{fmtCurrency(data.members.mrr)}</div>
              </div>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                {data.members.pro} Pro member{data.members.pro !== 1 ? "s" : ""}
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Revenue Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">This Month</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold text-white">{fmtCurrency(data.revenue.thisMonth)}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">Last Month</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold text-zinc-300">{fmtCurrency(data.revenue.lastMonth)}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-normal">Month-over-Month</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className={`text-3xl font-bold ${momChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {fmtPercent(momChange)}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Budget Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Marketing Budget</h2>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="px-4 py-5">
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <div className="text-xs text-zinc-400">Total Budget</div>
                  <div className="text-xl font-bold text-white mt-1">{fmtCurrency(data.budget.total)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Spent</div>
                  <div className="text-xl font-bold text-yellow-400 mt-1">{fmtCurrency(data.budget.spent)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Remaining</div>
                  <div className="text-xl font-bold text-green-400 mt-1">{fmtCurrency(data.budget.remaining)}</div>
                </div>
              </div>
              <Progress value={budgetUtilization} className="h-2 bg-zinc-800" />
              <div className="text-xs text-zinc-500 mt-2">{fmt(budgetUtilization, 1)}% utilized across {data.campaigns.active} active campaign{data.campaigns.active !== 1 ? "s" : ""}</div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-700 pb-6 space-y-1">
          <div>Golf VX Arlington Heights · Internal Marketing Dashboard · Read-Only View</div>
          <div className="text-zinc-800">
            Last synced: {new Date(data.generatedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
