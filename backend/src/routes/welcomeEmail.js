const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { supabaseAdmin } = require("../supabase");
const { sendWelcomeEmailViaResend } = require("../welcomeEmail");

const router = express.Router();

function displayNameFromUser(user) {
  const meta = user?.user_metadata || {};
  const full = String(meta.full_name || meta.name || "").trim();
  if (full) return full;
  const email = String(user?.email || "");
  if (email.includes("@")) return email.split("@")[0];
  return "";
}

router.post("/send-welcome-email", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const email = String(user?.email || "").trim().toLowerCase();
    if (!email) {
      return res.json({ sent: false, skipped: true, reason: "no_email" });
    }

    const meta = user.user_metadata || {};
    if (meta.welcome_email_sent === true) {
      return res.json({ sent: false, skipped: true, reason: "already_sent" });
    }

    const locale = String(req.body?.locale || "fr").toLowerCase() === "en" ? "en" : "fr";
    await sendWelcomeEmailViaResend({
      to: email,
      displayName: displayNameFromUser(user),
      locale,
    });

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          welcome_email_sent: true,
          welcome_email_sent_at: new Date().toISOString(),
        },
      });
      if (error) {
        console.warn("[welcome-email] metadata update failed:", error.message);
      }
    }

    return res.json({ sent: true, email });
  } catch (error) {
    if (error.code === "RESEND_NOT_CONFIGURED") {
      return res.status(503).json({ sent: false, error: "welcome_email_not_configured" });
    }
    console.error("[welcome-email]", error);
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ sent: false, error: "welcome_email_failed" });
    }
    return res.status(500).json({
      sent: false,
      error: "welcome_email_failed",
      details: error.message,
    });
  }
});

module.exports = router;
