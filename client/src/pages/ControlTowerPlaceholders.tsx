import { DEFAULT_VENUE_SLUG, appRoutes } from "@/lib/routes";
import { useLocation } from "wouter";

export function SharedReportPlaceholder() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="bg-white border border-gray-200 rounded-[10px] p-8 max-w-sm w-full text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-semibold text-neutral-950 mb-1">Shared Reports</p>
        <p className="text-xs text-gray-500 mb-6">
          Shared report links are not active in the Arlington Heights pilot. Contact Studio Soo for direct access.
        </p>
        <button
          onClick={() => navigate(appRoutes.venue(DEFAULT_VENUE_SLUG).dashboard)}
          className="px-5 py-2.5 bg-[#F5C72C] text-neutral-950 text-sm font-semibold rounded-[10px] hover:brightness-95 transition-all duration-100"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
