import { RefreshCw } from "lucide-react";

interface AsanaSyncStatusProps {
  fetchedAt?: string;
  onRefresh: () => void;
  isLoading: boolean;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function AsanaSyncStatus({ fetchedAt, onRefresh, isLoading }: AsanaSyncStatusProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium" style={{ color: "#72B84A" }}>
        Asana Live{fetchedAt ? ` · ${timeAgo(fetchedAt)}` : ""}
      </span>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="h-5 w-5 flex items-center justify-center rounded transition-colors hover:bg-[#F1F1EF] disabled:opacity-40"
        title="Refresh from Asana"
      >
        <RefreshCw
          size={10}
          style={{ color: "#6F6F6B" }}
          className={isLoading ? "animate-spin" : ""}
        />
      </button>
    </div>
  );
}
