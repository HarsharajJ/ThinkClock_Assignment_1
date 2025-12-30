/**
 * Environment Configuration
 * Validates required environment variables at runtime
 */

const requiredEnvVars = {
  // Frontend API URL - must be set for API communication
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
} as const;

// Validate environment variables
function validateEnv() {
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    console.error(
      `❌ Missing required environment variables:\n${missing.map(v => `  - ${v}`).join("\n")}`
    );
    console.error("\nPlease set these variables in your .env.local or deployment environment.");
  }
  
  return missing.length === 0;
}

// Run validation on module load (dev mode only shows warnings)
if (typeof window === "undefined") {
  validateEnv();
}

// Environment configuration object
export const env = {
  // API URL with fallback for development
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  
  // Environment type
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  
  // Feature flags (can be extended)
  features: {
    enableDevTools: process.env.NODE_ENV === "development",
    enableAnalytics: process.env.NODE_ENV === "production",
  },
} as const;

export default env;
