import { SlidersHorizontal } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Report Settings",
  description: "Administrative report configuration belongs in Admin, while report generation stays top-level in Reports. Phase 1 establishes that separation structurally.",
  bullets: [
    "Separate report governance from report usage workflows.",
    "Prepare a destination for delivery defaults, permissions, and organizational reporting controls.",
    "Support the report-first architecture without rewriting report internals yet.",
  ],
  icon: SlidersHorizontal,
});
