require("dotenv").config();
const { app } = require("./app");
const { getConfig, assertProductionConfig } = require("./config");

try {
  assertProductionConfig();
} catch (error) {
  console.error(`[backend] ${error.message}`);
  process.exit(1);
}

const { config, missing } = getConfig();

app.listen(config.port, () => {
  console.log(`[backend] listening on http://localhost:${config.port} (${config.nodeEnv})`);
  if (missing.length > 0) {
    console.log(`[backend] missing env: ${missing.join(", ")}`);
  }
  if (config.nodeEnv === "production") {
    if (config.corsOrigins.length) {
      console.log(`[backend] CORS allowlist: ${config.corsOrigins.join(", ")}`);
    } else {
      console.log(
        "[backend] CORS: permissive (requests without Origin or from Capacitor). Set CORS_ORIGINS if you host a browser web app."
      );
    }
  }
});
