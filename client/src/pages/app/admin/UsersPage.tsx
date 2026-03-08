import { Users } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Users",
  description: "Administrative user management will live here. Phase 1 adds the route and navigation target only.",
  bullets: [
    "Reserve a structured destination for org-level user administration.",
    "Keep user administration separate from personal profile settings.",
    "Support future role assignment and venue access controls.",
  ],
  icon: Users,
});
