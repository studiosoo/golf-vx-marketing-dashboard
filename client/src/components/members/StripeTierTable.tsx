/**
 * StripeTierTable
 *
 * Displays membership tier breakdown sourced from the Stripe snapshot cache.
 * Data is Stripe-authoritative, not derived from the Boomerang-synced members table.
 * Refreshes automatically when stripe-snapshot.json is updated on the server.
 */

import { trpc } from "@/lib/trpc";
import { RefreshCw } from "lucide-react";

interface TierRow {
  tier: string;
  count: number;
  mrr: number;
}

const TIER_STYLE: Record<string, { bg: string; text: string }> = {
  "Golf VX Pro":           { bg: "bg-[#F2DD48]/10", text: "text-[#B8A000]" },
  "All Access Ace":        { bg: "bg-[#F5C72C]/10", text: "text-[#c49a00]" },
  "All Access Ace Annual": { bg: "bg-[#F5C72C]/10", text: "text-[#c49a00]" },
  "All Access Ace Founding":{ bg: "bg-[#F5C72C]/10", text: "text-[#c49a00]" },
  "Swing Saver":           { bg: "bg-[#72B84A]/10", text: "text-[#72B84A]" },
  "Swing Saver Annual":    { bg: "bg-[#72B84A]/10", text: "text-[#72B84A]" },
  "Swing Saver Founding":  { bg: "bg-[#72B84A]/10", text: "text-[#72B84A]" },
  "Legacy/Other":          { bg: "bg-[#DEDEDA]/40", text: "text-[#6F6F6B]" },
  "Comped/Staff":          { bg: "bg-[#DEDEDA]/40", text: "text-[#6F6F6B]" },
};

function tierStyle(tier: string) {
  return TIER_STYLE[tier] ?? { bg: "bg-[#F1F1EF]", text: "text-[#6F6F6B]" };
}

function fmtMrr(v: number) {
  return v === 0 ? "—" : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StripeTierTable() {
  const { data, isLoading } = trpc.members.getStripeSnapshot.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#6F6F6B] py-6 px-4">
        <RefreshCw size={14} className="animate-spin" />
        Loading Stripe snapshot…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-[13px] text-[#6F6F6B] px-4 py-4">
        Stripe snapshot unavailable — re-upload stripe-snapshot.json to enable.
      </div>
    );
  }

  const { summary, tiers, generatedAt } = data;
  const payingTiers = tiers.filter((t: TierRow) => t.tier !== "Comped/Staff");
  const compedRow = tiers.find((t: TierRow) => t.tier === "Comped/Staff");

  return (
    <div className="bg-white rounded-2xl border border-[#DEDEDA] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-[#222222]">Membership Tier Breakdown</h2>
          <p className="text-[12px] text-[#A8A8A3] mt-0.5">
            Stripe-authoritative · {summary.payingMembers} paying members ·{" "}
            {compedRow ? `${compedRow.count} comped/staff · ` : ""}
            export {generatedAt}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold text-[#222222] leading-none tracking-tight">
            ${summary.mrr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-0.5">MRR (recognized)</div>
        </div>
      </div>

      {/* Sub-header KPIs */}
      <div className="grid grid-cols-3 divide-x divide-[#DEDEDA] border-t border-[#DEDEDA] bg-[#F6F6F4]">
        <div className="px-4 py-3">
          <div className="text-[11px] text-[#A8A8A3] uppercase tracking-wide">Cash MRR</div>
          <div className="text-[15px] font-semibold text-[#222222] mt-0.5">
            ${summary.cashMrr.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-[#A8A8A3]">monthly billing only</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-[#A8A8A3] uppercase tracking-wide">ARR (implied)</div>
          <div className="text-[15px] font-semibold text-[#222222] mt-0.5">
            ${Math.round(summary.arr / 1000)}k
          </div>
          <div className="text-[11px] text-[#A8A8A3]">MRR × 12</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-[#A8A8A3] uppercase tracking-wide">Paying Members</div>
          <div className="text-[15px] font-semibold text-[#222222] mt-0.5">{summary.payingMembers}</div>
          <div className="text-[11px] text-[#A8A8A3]">excl. comped / staff</div>
        </div>
      </div>

      {/* Tier table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-[#DEDEDA]">
            <th className="px-5 py-2 text-left text-[11px] font-normal text-[#A8A8A3]">Tier</th>
            <th className="px-5 py-2 text-right text-[11px] font-normal text-[#A8A8A3]">Members</th>
            <th className="px-5 py-2 text-right text-[11px] font-normal text-[#A8A8A3]">MRR</th>
            <th className="px-5 py-2 text-right text-[11px] font-normal text-[#A8A8A3] hidden sm:table-cell">Avg / member</th>
            <th className="px-5 py-2 text-right text-[11px] font-normal text-[#A8A8A3] hidden sm:table-cell">% of MRR</th>
          </tr>
        </thead>
        <tbody>
          {payingTiers.map((row: TierRow) => {
            const pct = summary.mrr > 0 ? (row.mrr / summary.mrr) * 100 : 0;
            const avg = row.count > 0 ? row.mrr / row.count : 0;
            const { bg, text } = tierStyle(row.tier);
            return (
              <tr key={row.tier} className="border-t border-[#DEDEDA] hover:bg-[#F6F6F4] transition-colors">
                <td className="px-5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-medium ${bg} ${text}`}>
                    {row.tier}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-[14px] font-semibold text-[#222222]">
                  {row.count}
                </td>
                <td className="px-5 py-3 text-right text-[14px] font-semibold text-[#222222]">
                  {fmtMrr(row.mrr)}
                </td>
                <td className="px-5 py-3 text-right text-[13px] text-[#6F6F6B] hidden sm:table-cell">
                  {avg > 0 ? `$${avg.toFixed(0)}` : "—"}
                </td>
                <td className="px-5 py-3 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[#F1F1EF] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F5C72C]"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-[#6F6F6B] w-8 text-right">{pct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        {compedRow && (
          <tfoot>
            <tr className="border-t border-[#DEDEDA] bg-[#F6F6F4]">
              <td className="px-5 py-2.5">
                <span className="text-[12px] text-[#A8A8A3]">Comped / Staff</span>
              </td>
              <td className="px-5 py-2.5 text-right text-[13px] text-[#A8A8A3]">{compedRow.count}</td>
              <td className="px-5 py-2.5 text-right text-[13px] text-[#A8A8A3]">—</td>
              <td className="px-5 py-2.5 hidden sm:table-cell" />
              <td className="px-5 py-2.5 hidden sm:table-cell" />
            </tr>
          </tfoot>
        )}
      </table>

      <div className="px-5 py-3 border-t border-[#DEDEDA] bg-[#F6F6F4] flex items-center gap-1.5">
        <span className="text-[11px] text-[#A8A8A3]">
          Source: Stripe subscriptions export · Annual subs normalized to monthly (÷12) ·
          To refresh, upload a new stripe-snapshot.json
        </span>
      </div>
    </div>
  );
}
