/**
 * Autonomous Marketing Intelligence Engine
 *
 * This file re-exports everything from the modular implementation in ./autonomous/
 * Kept for backward compatibility with existing imports in routers.ts, scheduler.ts, etc.
 *
 * Source modules:
 *   server/autonomous/types.ts         — CampaignMetrics, GeneratedAction, ActionExecutionResult
 *   server/autonomous/riskClassifier.ts — classifyRisk, determineStatus, risk action lists
 *   server/autonomous/ruleEngine.ts    — analyzeWithRules, analyzeWithLLM
 *   server/autonomous/executor.ts      — executeAction and all sub-executors
 *   server/autonomous/index.ts         — runAutonomousCycle, query functions, DB helpers
 */

export * from "./autonomous/index";
