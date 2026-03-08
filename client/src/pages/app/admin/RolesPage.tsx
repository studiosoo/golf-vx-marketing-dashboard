import { KeyRound } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Roles & Permissions",
  description: "This placeholder reserves the canonical route for role and permission governance in the Control Tower admin area.",
  bullets: [
    "Provide a dedicated home for org-level permission rules.",
    "Keep access management distinct from page-specific business logic.",
    "Prepare for future multi-venue and role-based routing controls.",
  ],
  icon: KeyRound,
});
