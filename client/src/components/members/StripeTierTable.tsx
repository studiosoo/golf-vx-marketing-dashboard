/**
 * StripeTierTable
 *
 * Displays membership tier breakdown sourced from the Stripe snapshot.
 * Data is Stripe-authoritative (server/data/stripe-snapshot.ts), not derived
 * from the Boomerang-synced members table.
 *
 * Endpoint: trpc.members.getStripeSnapshot — merged in PR #17.
 * Shape reference: server/data/stripe-snapshot.ts (StripeSnapshot type).
 *
 * To refresh: update server/data/stripe-snapshot.ts with next export values.
 */

import { trpc } from "@/lib/trpc";
import { RefreshCw } from "lucide-react";

const TIER_STYLE: Record<string, { bg: string; text: string }> = {
  "Golf VX Pro":   { bg: "bg-[#F2DD48]/10", text: "text-[#B8A000]" },
  "All Access Ace":{ bg: "bg-[#F2DD48]/10", text: "text-[#c49a00]" },
  "Swing Saver":   { bg: "bg-[#72B84A]/10", text: "text-[#72B84A]" },
  "Legacy / Other":{ bg: "bg-[#DEDEDA]/40", text: "text-[#6F6F6B]" },
  "Comped / Staff":{ bg: "bg-[#DEDEDA]/40", text: "text-[#6F6F6B]" },
};

function tierStyle(name: string) {
  return TIER_STYLE[name] ?? { bg: "bg-[#F1F1EF]", text: "text-[#6F6F6B]" };
}

function fmtMrr(v: number) {
  return v === 0
    ? "—"
    : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        Stripe snapshot unavailable — update server/data/stripe-snapshot.ts to enable.
      </div>
    );
  }

  // Shape: server/data/stripe-snapshot.ts (StripeSnapshot)
  // Fields: asOf, payingMembers, totalMRR, totalContacts, tiers[{name,count,mrr,avgMonthlyCharge}], billingBreakdown
  const { asOf, payingMembers, totalMRR, tiers, billingBreakdown } = data;

  const payingTiers = tiers.filter((t) => t.name !== "Comped / Staff");
  const compedRow = tiers.find((t) => t.name === "Comped / Staff");
  const arr = Math.round((totalMRR * 12) / 1000);

  return (
    <div className="bg-white rounded-2xl border border-[#DEDEDA] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-[#222222]">Membership Tier Breakdown</h2>
          <p className="text-[12px] text-[#A8A8A3] mt-0.5">
            Stripe-authoritative · {payingMembers} paying members ·{" "}
            {compedRow ? `${compedRow.count} comped/staff · ` : ""}
            export {asOf}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold text-[#222222] leading-none tracking-tight">
            {fmtMrr(totalMRR)}
          </div>
          <div className="text-[11px] text-[#A8A8A3] mt-0.5">MRR (recognized)</div>
        </div>
      </div>

      {/* Sub-header KPIs */}
      <div className="grid grid-cols-3 divide-x divide-[#DEDEDA] border-t border-[#DEDEDA] bg-[#F6F6F4]">
        <div className="px-4 py-3">
          <div className="text-[11px] text-[#A8A8A3] uppercase tracking-wide">Monthly Billing</div>
          <div className="text-[15px] font-semibold text-[#222222] mt-0.5">
            {billingBreakdown.monthly}
          </div>
          <div className="text-[11px] text-[#A8A8A3]">subscriptions</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-[#A8A8A3] uppercase tracking-wide">ARR (implied)</div>
          <div className="text-[15px] font-semibold text-[#222222] mt-0.5">${arr}k</div>
          <div className="text-[11px] text-[#A8A8A3]">MRR × 12</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-[#A8A8A3] uppercase tracking-wide">Paying Members</div>
          <div className="text-[15px] font-semibold text-[#222222] mt-0.5">{payingMembers}</div>
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
            <th className="px-5 py-2 text-right text-[11px] font-normal text-[#A8A8A3] hidden sm:table-cell">
              Avg / member
            </th>
            <th className="px-5 py-2 text-right text-[11px] font-normal text-[#A8A8A3] hidden sm:table-cell">
              % of MRR
            </th>
          </tr>
        </thead>
        <tbody>
          {payingTiers.map((row) => {
            const pct = totalMRR > 0 ? (row.mrr / totalMRR) * 100 : 0;
            const avg = row.count > 0 ? row.mrr / row.count : 0;
            const { bg, text } = tierStyle(row.name);
            return (
              <tr
                key={row.name}
                className="border-t border-[#DEDEDA] hover:bg-[#F6F6F4] transition-colors"
              >
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[12px] font-medium ${bg} ${text}`}
                  >
                    {row.name}
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
                        className="h-full rounded-full bg-[#F2DD48]"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-[#6F6F6B] w-8 text-right">
                      {pct.toFixed(0)}%
                    </span>
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
              <td className="px-5 py-2.5 text-right text-[13px] text-[#A8A8A3]">
                {compedRow.count}
              </td>
              <td className="px-5 py-2.5 text-right text-[13px] text-[#A8A8A3]">—</td>
              <td className="px-5 py-2.5 hidden sm:table-cell" />
              <td className="px-5 py-2.5 hidden sm:table-cell" />
            </tr>
          </tfoot>
        )}
      </table>

      <div className="px-5 py-3 border-t border-[#DEDEDA] bg-[#F6F6F4]">
        <span className="text-[11px] text-[#A8A8A3]">
          Source: Stripe subscriptions export · Annual subs normalized to monthly (÷12) ·
          To refresh, update server/data/stripe-snapshot.ts
        </span>
      </div>
    </div>
  );
}
