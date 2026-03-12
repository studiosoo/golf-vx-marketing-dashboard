import { CheckCircle, AlertCircle, Minus } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";

const TEXT_S = "#6F6F6B";
const TEXT_M = "#A8A8A3";
const BORDER  = "#DEDEDA";
const GRN     = "#72B84A";
const YELLOW  = "#F2DD48";

type IntegrationStatus = "connected" | "manual" | "partial";

interface Integration {
  key: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  note: string;
}

const INTEGRATIONS: Integration[] = [
  {
    key: "metaAds",
    name: "Meta Ads",
    description: "Facebook & Instagram advertising",
    status: "connected",
    note: "Campaign data synced daily via cache",
  },
  {
    key: "boomerang",
    name: "Boomerang",
    description: "Membership management",
    status: "connected",
    note: "Member records via webhook",
  },
  {
    key: "acuity",
    name: "Acuity Scheduling",
    description: "Booking & appointment management",
    status: "connected",
    note: "Booking & revenue data active",
  },
  {
    key: "toast",
    name: "Toast POS",
    description: "Point of sale system",
    status: "connected",
    note: "Daily F&B and bay revenue flowing",
  },
  {
    key: "encharge",
    name: "Encharge",
    description: "Email marketing automation",
    status: "partial",
    note: "Write key active · subscriber sync partial",
  },
  {
    key: "clickfunnels",
    name: "ClickFunnels",
    description: "Sales funnel management",
    status: "manual",
    note: "Funnel metrics tracked via URL params",
  },
];

const STATUS_BADGE: Record<IntegrationStatus, { label: string; style: React.CSSProperties }> = {
  connected: {
    label: "Connected",
    style: { background: `${GRN}22`, color: GRN, border: `1px solid ${GRN}44` },
  },
  partial: {
    label: "Partial",
    style: { background: `${YELLOW}33`, color: "#b08000", border: `1px solid ${YELLOW}66` },
  },
  manual: {
    label: "Manual",
    style: { background: "#F1F1EF", color: TEXT_S, border: `1px solid ${BORDER}` },
  },
};

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const { label, style } = STATUS_BADGE[status];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
      style={style}
    >
      {label}
    </span>
  );
}

function StatusIcon({ status }: { status: IntegrationStatus }) {
  if (status === "connected") return <CheckCircle size={16} style={{ color: GRN }} />;
  if (status === "partial")   return <AlertCircle  size={16} style={{ color: YELLOW }} />;
  return <Minus size={16} style={{ color: TEXT_M }} />;
}

export default function Integrations() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <PageTitle>Integrations</PageTitle>
        <p className="text-[13px] mt-0.5" style={{ color: TEXT_S }}>
          Third-party service connections active in the Arlington Heights pilot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.key}
            className="bg-white rounded-xl p-5"
            style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[14px] font-semibold text-[#222222]">{integration.name}</p>
                <p className="text-[12px] mt-0.5" style={{ color: TEXT_S }}>{integration.description}</p>
              </div>
              <StatusIcon status={integration.status} />
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status={integration.status} />
              <span className="text-[12px]" style={{ color: TEXT_M }}>{integration.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
