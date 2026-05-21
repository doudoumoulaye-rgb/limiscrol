const fs = require("node:fs");
const path = require("node:path");
const { loadAppPublicConfig } = require("./scripts/load-app-public-config");
const { loadSubscriptionsConfig } = require("./scripts/load-subscriptions-config");

const projectRoot = __dirname;
const distDir = path.join(projectRoot, "dist");

function injectAppPublicConfig(html, cfg, subsCfg) {
  let out = html;
  out = out.replace(
    /const RELEASE_API_BASE = "";/,
    `const RELEASE_API_BASE = ${JSON.stringify(cfg.apiBaseUrl)};`
  );
  out = out.replace(
    /const SUPABASE_DEFAULT_URL = "";/,
    `const SUPABASE_DEFAULT_URL = ${JSON.stringify(cfg.supabaseUrl)};`
  );
  out = out.replace(
    /const SUPABASE_DEFAULT_ANON_KEY = "";/,
    `const SUPABASE_DEFAULT_ANON_KEY = ${JSON.stringify(cfg.supabaseAnonKey)};`
  );
  if (subsCfg?.androidApiKey) {
    out = out.replace(
      /let RC_API_KEY_ANDROID_PUBLISHED = "";/,
      `let RC_API_KEY_ANDROID_PUBLISHED = ${JSON.stringify(subsCfg.androidApiKey)};`
    );
  }
  if (subsCfg?.iosApiKey) {
    out = out.replace(
      /let RC_API_KEY_IOS_PUBLISHED = "";/,
      `let RC_API_KEY_IOS_PUBLISHED = ${JSON.stringify(subsCfg.iosApiKey)};`
    );
  }
  return out;
}

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const appCfg = loadAppPublicConfig(projectRoot);
const subsCfg = loadSubscriptionsConfig(projectRoot);
const filesToCopy = ["index.html", "styles.css", "script.js"];
const i18nSrc = path.join(projectRoot, "i18n");
const i18nDest = path.join(distDir, "i18n");
const configDir = path.join(projectRoot, "config");
const configDest = path.join(distDir, "config");

for (const filename of filesToCopy) {
  const src = path.join(projectRoot, filename);
  const dest = path.join(distDir, filename);
  if (filename === "index.html") {
    const html = fs.readFileSync(src, "utf8");
    fs.writeFileSync(dest, injectAppPublicConfig(html, appCfg, subsCfg), "utf8");
  } else {
    fs.copyFileSync(src, dest);
  }
}

const assetsSrc = path.join(projectRoot, "assets");
const assetsDest = path.join(distDir, "assets");
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
}

if (fs.existsSync(i18nSrc)) {
  fs.cpSync(i18nSrc, i18nDest, { recursive: true });
}

const capacitorSrc = path.join(projectRoot, "capacitor.config.json");
const capacitorDest = path.join(distDir, "capacitor.config.json");
if (fs.existsSync(capacitorSrc)) {
  fs.copyFileSync(capacitorSrc, capacitorDest);
}

if (fs.existsSync(configDir)) {
  fs.mkdirSync(configDest, { recursive: true });
  for (const name of fs.readdirSync(configDir)) {
    if (name === "app.public.json") continue;
    const srcPath = path.join(configDir, name);
    const destPath = path.join(configDest, name);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const hasProdApi = Boolean(appCfg.apiBaseUrl);
const hasSupabase = Boolean(appCfg.supabaseUrl && appCfg.supabaseAnonKey);
console.log("Web build prepared in dist/");
if (!hasProdApi) {
  console.log(
    "[build] No production API URL — app uses localhost / 10.0.2.2 in dev. Copy config/app.public.example.json → config/app.public.json before store release."
  );
}
if (!hasSupabase) {
  console.log(
    "[build] Supabase URL/anon key not set — auth cloud disabled until config/app.public.json is filled."
  );
}
if (!subsCfg.androidApiKey && !subsCfg.iosApiKey) {
  console.log(
    "[build] RevenueCat keys missing — set androidApiKey in config/subscriptions.json for store payments."
  );
}
