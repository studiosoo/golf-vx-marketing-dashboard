import { ScrollText } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "Audit Log",
  description: "This placeholder reserves the system-level audit trail route in the admin workspace for future operational traceability.",
  bullets: [
    "Create a dedicated destination for historical system and coordination events.",
    "Prepare for future tracking of administrative and reporting actions.",
    "Keep audit visibility in Admin rather than scattering it across tools.",
  ],
  icon: ScrollText,
});
