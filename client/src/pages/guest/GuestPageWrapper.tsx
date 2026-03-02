// Generic wrapper for pages that already use public endpoints (autonomous.*)
// or pages that are purely static (Announcements, SiteControl, etc.)
import { ReactNode } from "react";
import { Lock } from "lucide-react";

interface GuestPageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  disabledFeatures?: string[];
}

export default function GuestPageWrapper({ children, title, description, disabledFeatures = [] }: GuestPageWrapperProps) {
  return (
    <div className="relative">
      {/* Disabled overlay for action buttons - handled via CSS pointer-events */}
      <style>{`
        .guest-mode-page [data-guest-disabled="true"],
        .guest-mode-page button[type="submit"],
        .guest-mode-page form button:not([data-guest-allow]) {
          opacity: 0.5;
          pointer-events: none;
          cursor: not-allowed;
        }
      `}</style>
      <div className="guest-mode-page">
        {disabledFeatures.length > 0 && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
            <Lock size={11} />
            <span>Disabled in guest mode: {disabledFeatures.join(", ")}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
