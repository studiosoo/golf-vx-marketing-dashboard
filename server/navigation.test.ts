import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Navigation Restructure (15 → 6 items)", () => {
  const clientPagesDir = path.join(__dirname, "../client/src/pages");
  const componentsDir = path.join(__dirname, "../client/src/components");

  describe("Sidebar Configuration", () => {
    it("should have exactly 6 menu items in DashboardLayout", () => {
      const layoutContent = fs.readFileSync(
        path.join(componentsDir, "DashboardLayout.tsx"),
        "utf-8"
      );
      // Count menu items in the menuItems array
      const menuItemMatches = layoutContent.match(/\{ icon:.*label:.*path:.*\}/g);
      expect(menuItemMatches).toHaveLength(6);
    });

    it("should have correct sidebar labels without emoji", () => {
      const layoutContent = fs.readFileSync(
        path.join(componentsDir, "DashboardLayout.tsx"),
        "utf-8"
      );
      const expectedLabels = [
        "Campaign HQ",
        "Campaigns",
        "Channels",
        "Schedule",
        "Members",
        "Revenue & Reports",
      ];
      for (const label of expectedLabels) {
        expect(layoutContent).toContain(`label: "${label}"`);
      }
    });

    it("should have correct paths for each menu item", () => {
      const layoutContent = fs.readFileSync(
        path.join(componentsDir, "DashboardLayout.tsx"),
        "utf-8"
      );
      const expectedPaths = ["/", "/campaigns", "/channels", "/schedule", "/members", "/revenue-reports"];
      for (const p of expectedPaths) {
        expect(layoutContent).toContain(`path: "${p}"`);
      }
    });

    it("should NOT contain Marketing Control Tower label", () => {
      const layoutContent = fs.readFileSync(
        path.join(componentsDir, "DashboardLayout.tsx"),
        "utf-8"
      );
      expect(layoutContent).not.toContain("Marketing Control Tower");
    });

    it("should NOT contain emoji in sidebar labels", () => {
      const layoutContent = fs.readFileSync(
        path.join(componentsDir, "DashboardLayout.tsx"),
        "utf-8"
      );
      // Extract all label values
      const labelMatches = layoutContent.match(/label: "([^"]+)"/g) || [];
      for (const match of labelMatches) {
        // Check no emoji characters (basic emoji range)
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        expect(match).not.toMatch(emojiRegex);
      }
    });
  });

  describe("Hub Pages Exist", () => {
    it("should have CampaignHQ.tsx", () => {
      expect(fs.existsSync(path.join(clientPagesDir, "CampaignHQ.tsx"))).toBe(true);
    });

    it("should have CampaignsHub.tsx", () => {
      expect(fs.existsSync(path.join(clientPagesDir, "CampaignsHub.tsx"))).toBe(true);
    });

    it("should have ChannelsHub.tsx", () => {
      expect(fs.existsSync(path.join(clientPagesDir, "ChannelsHub.tsx"))).toBe(true);
    });

    it("should have ScheduleHub.tsx", () => {
      expect(fs.existsSync(path.join(clientPagesDir, "ScheduleHub.tsx"))).toBe(true);
    });

    it("should have MembersPage.tsx", () => {
      expect(fs.existsSync(path.join(clientPagesDir, "MembersPage.tsx"))).toBe(true);
    });

    it("should have RevenueReportsHub.tsx", () => {
      expect(fs.existsSync(path.join(clientPagesDir, "RevenueReportsHub.tsx"))).toBe(true);
    });
  });

  describe("CampaignHQ Page Structure", () => {
    it("should have Overview and AI Insights tabs", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignHQ.tsx"), "utf-8");
      expect(content).toContain("Overview");
      expect(content).toContain("AI Insights");
    });

    it("should import MarketingIntelligence for AI Insights tab", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignHQ.tsx"), "utf-8");
      expect(content).toContain("MarketingIntelligence");
    });

    it("should NOT import AlertsBanner component", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignHQ.tsx"), "utf-8");
      expect(content).not.toMatch(/import.*AlertsBanner/);
    });

    it("should NOT import ActionCenter component", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignHQ.tsx"), "utf-8");
      expect(content).not.toMatch(/import.*ActionCenter/);
    });

    it("should have Sync All Data button", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignHQ.tsx"), "utf-8");
      expect(content).toContain("Sync All Data");
    });

    it("should have campaign category cards", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignHQ.tsx"), "utf-8");
      expect(content).toContain("getCategorySummary");
    });
  });

  describe("Campaigns Hub Tabs", () => {
    it("should have Strategic, Programs, Giveaway, ROI, Budget tabs", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "CampaignsHub.tsx"), "utf-8");
      expect(content).toContain('"strategic"');
      expect(content).toContain('"programs"');
      expect(content).toContain('"giveaway"');
      expect(content).toContain('"roi"');
      expect(content).toContain('"budget"');
    });
  });

  describe("Channels Hub Tabs", () => {
    it("should have Meta Ads, Email, Instagram, Visuals tabs", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "ChannelsHub.tsx"), "utf-8");
      expect(content).toContain('"meta-ads"');
      expect(content).toContain('"email"');
      expect(content).toContain('"instagram"');
      expect(content).toContain('"visuals"');
    });
  });

  describe("Schedule Hub Tabs", () => {
    it("should have Calendar and Timeline tabs", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "ScheduleHub.tsx"), "utf-8");
      expect(content).toContain('"calendar"');
      expect(content).toContain('"timeline"');
    });
  });

  describe("Revenue & Reports Hub Tabs", () => {
    it("should have Revenue and Reports tabs", () => {
      const content = fs.readFileSync(path.join(clientPagesDir, "RevenueReportsHub.tsx"), "utf-8");
      expect(content).toContain('"revenue"');
      expect(content).toContain('"reports"');
    });
  });

  describe("App.tsx Routing", () => {
    it("should route / to CampaignHQ", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("CampaignHQ");
      expect(content).toMatch(/path=\{?"\/"\}?\s+component=\{?CampaignHQ/);
    });

    it("should route /campaigns to CampaignsHub", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("CampaignsHub");
    });

    it("should route /channels to ChannelsHub", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("ChannelsHub");
    });

    it("should route /schedule to ScheduleHub", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("ScheduleHub");
    });

    it("should route /members to MembersPage", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("MembersPage");
    });

    it("should route /revenue-reports to RevenueReportsHub", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("RevenueReportsHub");
    });

    it("should preserve detail page routes", () => {
      const content = fs.readFileSync(
        path.join(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("/meta-ads/campaign/:id");
      expect(content).toContain("/category/:id");
      expect(content).toContain("/campaign/:id");
      expect(content).toContain("/members/:id");
    });
  });
});
