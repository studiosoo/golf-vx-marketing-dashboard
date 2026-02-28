import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Campaigns() {
  const sections = [
    {
      title: "Meta Ads",
      description: "Facebook & Instagram paid campaigns — view spend, reach, and ROI",
      href: "/campaigns/meta-ads",
      icon: "📱",
      badge: "Paid",
    },
    {
      title: "Email Campaigns",
      description: "Encharge broadcast performance — open rates, clicks, and conversions",
      href: "/campaigns/email",
      icon: "📧",
      badge: "Email",
    },
    {
      title: "Drip Campaigns",
      description: "Automated email sequences — trial nurture, win-back, and onboarding",
      href: "/campaigns/drip",
      icon: "💧",
      badge: "Automation",
    },
    {
      title: "Funnels",
      description: "ClickFunnels opt-in performance — leads, submissions, and conversion rates",
      href: "/funnels",
      icon: "🔽",
      badge: "Funnel",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor all marketing campaigns across channels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="bg-card border-border cursor-pointer hover:border-yellow-400/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <CardTitle className="text-base text-foreground">
                      {section.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {section.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
                <p className="text-xs text-yellow-400 mt-2">
                  View details →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
