import { ScrollText } from "lucide-react";
import { createPlaceholderPage } from "../placeholderFactory";

export default createPlaceholderPage({
  eyebrow: "Admin",
  title: "KPI Definitions",
  description: "Centralized KPI definitions are a locked principle of the target architecture. Phase 1 creates the canonical admin route for that governance layer.",
  bullets: [
    "Reserve a single place to define KPI meaning and calculation governance.",
    "Reduce future ambiguity across reports, performance pages, and operations views.",
    "Keep KPI governance separate from page-level presentation logic.",
  ],
  icon: ScrollText,
});
