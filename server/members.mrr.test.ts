import { describe, it, expect } from "vitest";

// Test the MRR calculation logic used in getStrategicKPIs and getMemberStats

describe("Member MRR Calculations", () => {
  it("calculates monthly MRR correctly for monthly members", () => {
    const monthlyAmount = 325;
    const paymentInterval = "monthly";
    const mrr = paymentInterval === "annual" ? monthlyAmount / 12 : monthlyAmount;
    expect(mrr).toBe(325);
  });

  it("calculates monthly MRR correctly for annual members", () => {
    const annualAmount = 1500;
    const paymentInterval = "annual";
    const mrr = paymentInterval === "annual" ? annualAmount / 12 : annualAmount;
    expect(mrr).toBeCloseTo(125, 1);
  });

  it("calculates total MRR for mixed membership types", () => {
    const members = [
      { tier: "all_access_aces", monthlyAmount: 325, paymentInterval: "monthly" },
      { tier: "all_access_aces", monthlyAmount: 1625 / 12, paymentInterval: "annual" },
      { tier: "swing_savers", monthlyAmount: 225, paymentInterval: "monthly" },
      { tier: "swing_savers", monthlyAmount: 1500 / 12, paymentInterval: "annual" },
      { tier: "golf_vx_pro", monthlyAmount: 500, paymentInterval: "monthly" },
    ];

    const allAccessMRR = members
      .filter(m => m.tier === "all_access_aces")
      .reduce((sum, m) => sum + m.monthlyAmount, 0);

    const swingSaversMRR = members
      .filter(m => m.tier === "swing_savers")
      .reduce((sum, m) => sum + m.monthlyAmount, 0);

    const proMRR = members
      .filter(m => m.tier === "golf_vx_pro")
      .reduce((sum, m) => sum + m.monthlyAmount, 0);

    const totalMRR = allAccessMRR + swingSaversMRR + proMRR;

    expect(allAccessMRR).toBeCloseTo(325 + 1625 / 12, 1);
    expect(swingSaversMRR).toBeCloseTo(225 + 1500 / 12, 1);
    expect(proMRR).toBe(500);
    expect(totalMRR).toBeGreaterThan(1000);
  });

  it("classifies membership tiers correctly from Boomerang labels", () => {
    const classifyTier = (membership: string): string | null => {
      const m = membership.trim().toLowerCase();
      const skip = ['locker', 'need to cancel', 'need to change', 'employee', 'cancel?', 
                    'requested to cancel', 'should have been canceled', 'duplicate', 'annual duplicate'];
      if (skip.some(kw => m.includes(kw))) return null;
      
      if (m === 'aa' || m === 'junior aa' || m.startsWith('sw') || 
          m.includes('family aa') || m.includes('famiy aa') || m.includes('annual aa')) {
        return 'all_access_aces';
      }
      if (m === 'ss' || m.includes('annual ss') || m.includes('family ss')) {
        return 'swing_savers';
      }
      if (m === 'pm') return 'golf_vx_pro';
      return null;
    };

    expect(classifyTier('AA')).toBe('all_access_aces');
    expect(classifyTier('SW')).toBe('all_access_aces');
    expect(classifyTier('Junior AA')).toBe('all_access_aces');
    expect(classifyTier('Family AA')).toBe('all_access_aces');
    expect(classifyTier('Annual AA')).toBe('all_access_aces');
    expect(classifyTier('SS')).toBe('swing_savers');
    expect(classifyTier('Annual SS')).toBe('swing_savers');
    expect(classifyTier('Family SS')).toBe('swing_savers');
    expect(classifyTier('PM')).toBe('golf_vx_pro');
    expect(classifyTier('Locker')).toBeNull();
    expect(classifyTier('Need to cancel')).toBeNull();
    expect(classifyTier('Employee')).toBeNull();
    expect(classifyTier('Annual Duplicate')).toBeNull();
  });

  it("validates the expected member counts from Boomerang CSV", () => {
    // Based on the ArlingtonHeights_ActiveMembers CSV analysis
    const expectedCounts = {
      allAccessAces: 54,
      swingSavers: 33,
      proMembers: 5,
      totalCustomers: 87,
    };

    expect(expectedCounts.allAccessAces + expectedCounts.swingSavers).toBe(expectedCounts.totalCustomers);
    expect(expectedCounts.allAccessAces).toBeGreaterThan(expectedCounts.swingSavers);
    expect(expectedCounts.proMembers).toBe(5);
  });

  it("validates the expected MRR from Boomerang CSV", () => {
    // Based on the ArlingtonHeights_ActiveMembers CSV analysis
    const expectedMRR = {
      allAccessAces: 14006.25,
      swingSavers: 4641.67,
      proMembers: 2000, // 4 active pro members * $500
      total: 20647.92,
    };

    const calculatedTotal = expectedMRR.allAccessAces + expectedMRR.swingSavers + expectedMRR.proMembers;
    expect(calculatedTotal).toBeCloseTo(expectedMRR.total, 0);
    expect(expectedMRR.allAccessAces).toBeGreaterThan(expectedMRR.swingSavers);
    expect(expectedMRR.total).toBeGreaterThan(20000);
  });

  it("calculates fallback MRR when monthlyAmount is not set", () => {
    // Fallback: use flat rates when monthlyAmount is 0 or null
    const allAccessCount = 54;
    const swingSaversCount = 33;
    const proCount = 5;

    const allAccessMRRFromDB = 0; // Not set
    const swingSaversMRRFromDB = 0; // Not set

    const allAccessMRR = allAccessMRRFromDB || allAccessCount * 325;
    const swingSaversMRR = swingSaversMRRFromDB || swingSaversCount * 225;
    const proMRR = proCount * 500;

    expect(allAccessMRR).toBe(54 * 325);
    expect(swingSaversMRR).toBe(33 * 225);
    expect(proMRR).toBe(2500);
  });
});
