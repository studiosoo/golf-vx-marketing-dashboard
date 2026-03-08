import { Activity } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Sync Health",
  description: "System and integration health will surface here. Phase 1 creates the admin route and navigation destination without changing backend sync modules.",
  bullets: [
    "Provide a stable home for sync and integration visibility.",
    "Allow utility sync workflows to move out of primary operating navigation over time.",
    "Support future monitoring of data freshness and connector failures.",
  ],
  icon: Activity,
});
