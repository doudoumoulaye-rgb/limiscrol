const fs = require("node:fs");
const path = require("node:path");

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

function loadAppPublicConfig(projectRoot) {
  loadDotEnvFile(path.join(projectRoot, ".env"));
  loadDotEnvFile(path.join(projectRoot, "backend", ".env"));

  const configPath = path.join(projectRoot, "config", "app.public.json");
  let fileCfg = {};
  if (fs.existsSync(configPath)) {
    try {
      fileCfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
      throw new Error(`Invalid JSON in ${configPath}: ${error.message}`);
    }
  }

  const pick = (envKey, jsonKey) => {
    const fromEnv = process.env[envKey];
    if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
    const fromFile = fileCfg[jsonKey];
    if (fromFile && String(fromFile).trim()) return String(fromFile).trim();
    return "";
  };

  return {
    apiBaseUrl: pick("MODERSCROLL_API_BASE_URL", "apiBaseUrl").replace(/\/+$/, ""),
    supabaseUrl: pick("SUPABASE_URL", "supabaseUrl"),
    supabaseAnonKey: pick("SUPABASE_ANON_KEY", "supabaseAnonKey"),
  };
}

module.exports = { loadAppPublicConfig, loadDotEnvFile };
