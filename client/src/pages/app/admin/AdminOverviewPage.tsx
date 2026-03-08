import { Shield } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Admin Overview",
  description: "This is the organizational control surface for system-level governance. Phase 1 establishes the home for admin workflows distinct from personal account settings.",
  bullets: [
    "Separate organization administration from personal profile management.",
    "Prepare a single home for venues, integrations, roles, KPI definitions, and system governance.",
    "Anchor the new /app/admin route family without touching backend modules yet.",
  ],
  icon: Shield,
});
