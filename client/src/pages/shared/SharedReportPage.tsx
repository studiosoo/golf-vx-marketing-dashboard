import { FileText } from "lucide-react";
import { createPlaceholderPage } from "@/pages/app/placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Shared Report",
  title: "Shared Report View",
  description: "Phase 1 establishes the canonical shared-report route under /r/:shareId. Detailed report sharing behavior can be layered in later without reworking the route model.",
  bullets: [
    "Provide a dedicated public-facing shared report entry point.",
    "Separate shared report access from authenticated app navigation.",
    "Prepare for future secure shared report rendering and permissions.",
  ],
  icon: FileText,
  status: "Phase 1 Shared Route",
});
