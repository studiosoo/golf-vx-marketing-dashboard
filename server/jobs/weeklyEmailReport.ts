/**
 * Weekly Email Report Job
 * Runs every Monday at 8 AM to send Marketing Intelligence digest
 */
import { notifyOwner } from "../_core/notification";
import * as marketingIntelligence from "../marketingIntelligence";

export async function runWeeklyEmailReport() {
  console.log("[Weekly Email Report] Generating Monday morning digest...");
  
  try {
    // Get multi-channel performance data for last 7 days
    const performanceData = await marketingIntelligence.getMultiChannelPerformance(7);
    
    // Generate AI-powered analysis
    const analysis = await marketingIntelligence.analyzePerformanceWithGemini(performanceData);
    
    // Format email content
    const emailContent = formatEmailReport(analysis, performanceData);
    
    // Send notification to owner
    const success = await notifyOwner({
      title: "📊 Weekly Marketing Intelligence Report",
      content: emailContent,
    });
    
    if (!success) {
      console.error("[Weekly Email Report] Failed to send notification");
      return { success: false, error: "Notification service unavailable" };
    }
    
    console.log("[Weekly Email Report] Email sent successfully");
    return {
      success: true,
      sentAt: new Date(),
      recipientCount: 1,
    };
  } catch (error) {
    console.error("[Weekly Email Report] Error:", error);
    throw error;
  }
}

function formatEmailReport(analysis: any, performanceData: any): string {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const monthNum = new Date().getMonth() + 1;
  const membershipMonthlyTargets: Record<number, number> = {
    1: 20, 2: 20, 3: 15, 4: 10, 5: 8, 6: -5,
    7: -8, 8: -5, 9: 10, 10: 20, 11: 25, 12: 20
  };
  const thisMonthTarget = membershipMonthlyTargets[monthNum] || 0;
  
  let content = `# Weekly Marketing Intelligence Digest\n\n`;
  content += `**Week of ${new Date().toLocaleDateString()}**\n\n`;
  
  // Seasonal context
  if (monthNum === 4 || monthNum === 5) {
    content += `## 🚨 SEASONAL ALERT: Pre-Summer Critical Window\n\n`;
    content += `You're in ${currentMonth} - the last chance to maximize membership acquisition before summer churn season (June-August). `;
    content += `Current target: ${thisMonthTarget > 0 ? `+${thisMonthTarget}` : thisMonthTarget} members this month.\n\n`;
  } else if (monthNum >= 6 && monthNum <= 8) {
    content += `## ☀️ SEASONAL CONTEXT: Summer Churn Season\n\n`;
    content += `Expect net member loss this month (${thisMonthTarget} members). Focus on retention and engagement.\n\n`;
  }
  
  // Top Priority
  if (analysis.topPriority) {
    content += `## 🎯 TOP PRIORITY ACTION\n\n`;
    content += `**${analysis.topPriority.title}**\n\n`;
    content += `${analysis.topPriority.description}\n\n`;
    content += `**Expected Impact:** ${analysis.topPriority.expectedImpact}\n\n`;
    content += `**Action Steps:**\n`;
    analysis.topPriority.actionSteps.forEach((step: string, idx: number) => {
      content += `${idx + 1}. ${step}\n`;
    });
    content += `\n`;
  }
  
  // Performance Alerts
  if (analysis.alerts && analysis.alerts.length > 0) {
    content += `## ⚠️ PERFORMANCE ALERTS\n\n`;
    analysis.alerts.forEach((alert: any) => {
      const icon = alert.type === 'warning' ? '🔴' : alert.type === 'success' ? '🟢' : '🔵';
      content += `${icon} **${alert.title}**\n`;
      content += `   Metric: ${alert.metric}\n`;
      if (alert.current !== undefined && alert.benchmark !== undefined) {
        content += `   Current: ${alert.current} | Benchmark: ${alert.benchmark}\n`;
      }
      content += `   Recommendation: ${alert.recommendation}\n`;
      content += `   Confidence: ${alert.confidence}%\n\n`;
    });
  }
  
  // Positive Momentum
  if (analysis.positiveMomentum && analysis.positiveMomentum.length > 0) {
    content += `## 📈 POSITIVE MOMENTUM\n\n`;
    analysis.positiveMomentum.forEach((momentum: any) => {
      content += `**${momentum.channel}**\n`;
      content += `${momentum.insight}\n`;
      content += `Amplification Strategy: ${momentum.amplificationStrategy}\n\n`;
    });
  }
  
  // Budget Reallocation
  if (analysis.budgetReallocation) {
    content += `## 💰 BUDGET REALLOCATION RECOMMENDATION\n\n`;
    content += `Move $${analysis.budgetReallocation.amount} from ${analysis.budgetReallocation.from} to ${analysis.budgetReallocation.to}\n`;
    content += `Expected ROI: ${analysis.budgetReallocation.expectedROI}\n\n`;
  }
  
  // Performance Summary
  content += `## 📊 7-DAY PERFORMANCE SUMMARY\n\n`;
  content += `**Meta Ads:**\n`;
  content += `- Total Spend: $${performanceData.metaAds.totalSpend.toFixed(2)}\n`;
  content += `- Total Leads: ${performanceData.metaAds.totalLeads}\n`;
  content += `- Avg CPL: $${performanceData.metaAds.avgCPL.toFixed(2)}\n\n`;
  
  content += `**Email Marketing:**\n`;
  content += `- Subscribers: ${performanceData.email.subscribers}\n`;
  content += `- Open Rate: ${(performanceData.email.openRate * 100).toFixed(1)}%\n`;
  content += `- Click Rate: ${(performanceData.email.clickRate * 100).toFixed(1)}%\n\n`;
  
  content += `**Instagram:**\n`;
  content += `- Posts: ${performanceData.instagram.posts}\n`;
  content += `- Avg Engagement: ${(performanceData.instagram.avgEngagement * 100).toFixed(1)}%\n`;
  content += `- Reach: ${performanceData.instagram.reach}\n\n`;
  
  content += `---\n\n`;
  content += `View full dashboard: [Golf VX Marketing Dashboard](https://golf-vx-marketing-dashboard.manus.space)\n`;
  
  return content;
}

// For manual testing, run: node --loader ts-node/esm server/jobs/weeklyEmailReport.ts
