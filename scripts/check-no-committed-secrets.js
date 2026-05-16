const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const indexPath = path.join(projectRoot, "index.html");
const html = fs.readFileSync(indexPath, "utf8");

const problems = [];

if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(html)) {
  problems.push("index.html contains a JWT-like string (move to config/app.public.json)");
}
if (/supabase\.co/.test(html) && !/YOUR_PROJECT_ID/.test(html)) {
  const hasPlaceholderOnly =
    html.includes('const SUPABASE_DEFAULT_URL = "";') &&
    html.includes('const SUPABASE_DEFAULT_ANON_KEY = "";');
  if (!hasPlaceholderOnly) {
    problems.push("index.html may embed a Supabase project URL");
  }
}

if (problems.length) {
  console.error("[check-secrets] FAILED:\n- " + problems.join("\n- "));
  process.exit(1);
}

console.log("[check-secrets] OK — no obvious secrets in index.html");
