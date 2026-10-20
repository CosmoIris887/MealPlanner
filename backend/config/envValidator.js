/**
 * Environment configuration validator for AI Food & Meal Planner.
 * Validates presence of critical environment variables without exposing sensitive values.
 */

function validateEnv() {
  const warnings = [];
  const errors = [];

  const port = process.env.PORT || 5000;
  const jwtSecret = process.env.JWT_SECRET;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.VISION_API_KEY;
  const visionModel = process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest';
  const chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest';
  const usdaApiKey = process.env.USDA_API_KEY;

  if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === 'ai_meal_planner_secret_key_2026') {
    warnings.push('JWT_SECRET is using default or unset key. Set a secure random string for production.');
  }

  if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey.includes('your_')) {
    errors.push('GEMINI_API_KEY is not configured or still uses placeholder. AI Vision and Chatbot features will be disabled.');
  }

  if (!usdaApiKey || usdaApiKey.trim() === '' || usdaApiKey === 'DEMO_KEY') {
    warnings.push('USDA_API_KEY is empty or DEMO_KEY. USDA FoodData Central online search may be rate limited.');
  }

  console.log('--- Environment Configuration Audit ---');
  console.log(`[CONFIG] PORT: ${port}`);
  console.log(`[CONFIG] JWT_SECRET: ${jwtSecret ? 'Configured' : 'MISSING'}`);
  console.log(`[CONFIG] GEMINI_API_KEY: ${geminiApiKey && !geminiApiKey.includes('your_') ? 'Configured (' + geminiApiKey.length + ' chars)' : 'MISSING'}`);
  console.log(`[CONFIG] GEMINI_VISION_MODEL: ${visionModel}`);
  console.log(`[CONFIG] GEMINI_CHAT_MODEL: ${chatModel}`);
  console.log(`[CONFIG] USDA_API_KEY: ${usdaApiKey && usdaApiKey !== 'DEMO_KEY' ? 'Configured (' + usdaApiKey.length + ' chars)' : (usdaApiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'MISSING')}`);

  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn(`[CONFIG WARNING] ⚠️  ${w}`));
  }

  if (errors.length > 0) {
    errors.forEach((e) => console.error(`[CONFIG ERROR] ❌ ${e}`));
  }
  console.log('----------------------------------------');

  return {
    isValid: errors.length === 0,
    hasGeminiKey: Boolean(geminiApiKey && !geminiApiKey.includes('your_')),
    visionModel,
    chatModel,
    hasUsdaKey: Boolean(usdaApiKey && usdaApiKey !== 'DEMO_KEY'),
    errors,
    warnings
  };
}

module.exports = { validateEnv };
