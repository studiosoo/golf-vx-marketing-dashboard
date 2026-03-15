export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // LLM model overrides — set these in Manus env to change models without code deploy
  llmModelChat:       process.env.LLM_MODEL_CHAT       ?? "",   // default: gemini-2.0-flash-lite
  llmModelAnalysis:   process.env.LLM_MODEL_ANALYSIS   ?? "",   // default: gemini-2.5-pro
  llmModelStructured: process.env.LLM_MODEL_STRUCTURED ?? "",   // default: gemini-2.5-flash
  // Stripe — configure when Stripe data arrives
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // SQR.co short link + QR code platform
  sqrApiKey: process.env.SQR_API_KEY ?? "",
  // Public base URL (used for promo landing page links)
  appBaseUrl: process.env.APP_BASE_URL ?? "https://dashboard.playgolfvx.com",
  // Password bypass — when set, allows login with this password instead of Manus OAuth
  bypassPassword: process.env.BYPASS_PASSWORD ?? "",
};
