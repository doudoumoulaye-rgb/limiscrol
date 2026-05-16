const REQUIRED_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const PRODUCTION_REQUIRED_KEYS = [...REQUIRED_KEYS, "SUPABASE_SERVICE_ROLE_KEY"];

function getConfig() {
  const config = {
    port: Number(process.env.PORT || 8787),
    nodeEnv: process.env.NODE_ENV || "development",
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    corsOrigins: (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const requiredKeys = config.nodeEnv === "production" ? PRODUCTION_REQUIRED_KEYS : REQUIRED_KEYS;
  const missing = requiredKeys.filter((key) => !process.env[key]);
  return { config, missing };
}

function assertProductionConfig() {
  const { config, missing } = getConfig();
  if (config.nodeEnv !== "production") return;
  if (missing.length > 0) {
    const err = new Error(`Missing required env in production: ${missing.join(", ")}`);
    err.code = "CONFIG_MISSING";
    throw err;
  }
}

module.exports = { getConfig, assertProductionConfig };
