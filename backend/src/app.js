const express = require("express");
const cors = require("cors");
const { getConfig } = require("./config");
const { requireAuth } = require("./middleware/auth");
const {
  APPS,
  getOrCreateRuntimeState,
  saveRuntimeState,
  mergeClientStatePatch,
  updateAppLimit,
  consumeOneView,
} = require("./store");

const app = express();
const { config, missing } = getConfig();
const corsAllowlist = config.corsOrigins;

app.use(
  cors({
    origin(origin, callback) {
      if (!corsAllowlist.length) return callback(null, true);
      if (!origin) return callback(null, true);
      if (corsAllowlist.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"), false);
    },
    methods: ["GET", "PUT", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);
app.use(express.json());

function sendServerError(res, error) {
  console.error(error);
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ error: "Internal server error" });
  }
  return res.status(500).json({ error: "Request failed", details: error.message });
}

app.get("/health", (_req, res) => {
  const body = {
    ok: true,
    authProviders: ["email", "google", "apple"],
    supabaseConfigured: missing.length === 0,
  };
  if (process.env.NODE_ENV !== "production") {
    body.missingEnv = missing;
  }
  res.json(body);
});

app.get("/auth/me", requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email || null,
    providers: Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [],
    createdAt: user.created_at,
  });
});

app.get("/api/limits", requireAuth, (_req, res) => {
  res.status(410).json({
    error: "Use /api/state instead of /api/limits",
  });
});

app.get("/api/state", requireAuth, async (req, res) => {
  try {
    const state = await getOrCreateRuntimeState(req.user.id);
    res.json({ state });
  } catch (error) {
    return sendServerError(res, error);
  }
});

app.put("/api/state", requireAuth, async (req, res) => {
  try {
    const serverState = await getOrCreateRuntimeState(req.user.id);
    const merged = mergeClientStatePatch(serverState, req.body?.state);
    const state = await saveRuntimeState(req.user.id, merged);
    res.json({ state });
  } catch (error) {
    return sendServerError(res, error);
  }
});

app.put("/api/limits/:app", requireAuth, async (req, res) => {
  const app = String(req.params.app || "").toLowerCase();
  const limit = Number(req.body?.limit);
  if (!APPS.includes(app)) {
    return res.status(400).json({ error: "Invalid app. Use tiktok, instagram or youtube." });
  }
  if (!Number.isFinite(limit)) {
    return res.status(400).json({ error: "limit must be a number" });
  }
  try {
    const state = await updateAppLimit(req.user.id, app, limit);
    return res.json({ state });
  } catch (error) {
    return sendServerError(res, error);
  }
});

app.post("/api/views/consume", requireAuth, async (req, res) => {
  const app = String(req.body?.app || "").toLowerCase();
  if (!APPS.includes(app)) {
    return res.status(400).json({ error: "Invalid app. Use tiktok, instagram or youtube." });
  }
  try {
    const result = await consumeOneView(req.user.id, app);
    return res.json(result);
  } catch (error) {
    return sendServerError(res, error);
  }
});

module.exports = { app };
