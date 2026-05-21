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
const welcomeEmailRouter = require("./routes/welcomeEmail");

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

/**
 * Pont HTTPS → deep link app (Supabase n’accepte pas toujours les schemes custom).
 * Ajouter dans Supabase Redirect URLs : https://TON_API/auth/mobile-callback
 */
app.get("/auth/mobile-callback", (req, res) => {
  const appDeepLink = "com.limitscroll.app://auth/callback";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ModérScroll — connexion</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #050810; color: #e8e8e8; display: flex;
      align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
    p { opacity: 0.85; margin: 0.5rem 0; }
    a { display: inline-block; margin-top: 1.25rem; padding: 0.85rem 1.5rem; background: #3b82f6; color: #fff;
      text-decoration: none; border-radius: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <p id="status">Ouverture de ModérScroll…</p>
    <p style="font-size: 0.85rem; opacity: 0.6;">Si rien ne se passe, appuie sur le bouton ci-dessous.</p>
    <a id="openApp" href="#">Ouvrir ModérScroll</a>
  </div>
  <script>
    (function () {
      var deep = ${JSON.stringify(appDeepLink)};
      var target = deep + (window.location.search || "") + (window.location.hash || "");
      var link = document.getElementById("openApp");
      if (link) link.setAttribute("href", target);
      window.location.replace(target);
      setTimeout(function () {
        var intentUrl = "intent://auth/callback" + (window.location.search || "") +
          (window.location.hash || "") +
          "#Intent;scheme=com.limitscroll.app;package=com.limitscroll.app;end";
        try { window.location.href = intentUrl; } catch (e) {}
      }, 600);
      setTimeout(function () {
        var el = document.getElementById("status");
        if (el) el.textContent = "Retourne dans l'app ModérScroll.";
      }, 2800);
    })();
  </script>
</body>
</html>`);
});

app.get("/health", (_req, res) => {
  const body = {
    ok: true,
    authProviders: ["email", "google", "apple"],
    supabaseConfigured: missing.length === 0,
    welcomeEmailConfigured: Boolean((process.env.RESEND_API_KEY || "").trim()),
    mobileCallback: true,
  };
  if (process.env.NODE_ENV !== "production") {
    body.missingEnv = missing;
  }
  res.json(body);
});

app.use("/api/auth", welcomeEmailRouter);

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
    const result = await consumeOneView(req.user.id, app, {
      premiumActive: Boolean(req.body?.premium_active),
    });
    return res.json(result);
  } catch (error) {
    return sendServerError(res, error);
  }
});

module.exports = { app };
