import { Building2 } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Venues",
  description: "Venue administration is structurally important for future multi-location support. Phase 1 adds the route and nav entry now.",
  bullets: [
    "Create the canonical admin destination for venue configuration.",
    "Support Arlington Heights as the initial default venue context.",
    "Prepare for future multi-location controls without changing existing data modules yet.",
  ],
  icon: Building2,
});
