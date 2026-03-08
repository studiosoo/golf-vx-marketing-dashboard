import { FileClock } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Reports",
  title: "Report Schedules",
  description: "This route is reserved for configuring recurring report delivery and timing logic. Phase 1 adds the canonical location without changing report internals.",
  bullets: [
    "Schedule recurring report runs for admins and venue stakeholders.",
    "Prepare for future delivery rules, recipients, and cadence management.",
    "Keep schedule management separated from template definition and archives.",
  ],
  icon: FileClock,
});
