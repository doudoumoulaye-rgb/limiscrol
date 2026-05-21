const fs = require("node:fs");
const path = require("node:path");

function loadSubscriptionsConfig(projectRoot) {
  const configPath = path.join(projectRoot, "config", "subscriptions.json");
  const capacitorPath = path.join(projectRoot, "capacitor.config.json");
  let subs = {};
  let capacitor = {};

  if (fs.existsSync(configPath)) {
    try {
      subs = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
      const raw = fs.readFileSync(configPath, "utf8");
      const goog = raw.match(/goog_[A-Za-z0-9]+/);
      if (goog) subs.androidApiKey = goog[0];
      console.warn(`[build] subscriptions.json invalid JSON — using fallback key: ${error.message}`);
    }
  }

  if (fs.existsSync(capacitorPath)) {
    try {
      capacitor = JSON.parse(fs.readFileSync(capacitorPath, "utf8"));
    } catch (_e) {}
  }

  const rc = capacitor.revenueCat || {};
  return {
    entitlementId: subs.entitlementId || rc.entitlementId || "pro",
    offeringId: subs.offeringId || rc.offeringId || "default",
    androidApiKey: subs.androidApiKey || rc.androidApiKey || "",
    iosApiKey: subs.iosApiKey || rc.iosApiKey || "",
    products: { ...(rc.products || {}), ...(subs.products || {}) },
  };
}

module.exports = { loadSubscriptionsConfig };
