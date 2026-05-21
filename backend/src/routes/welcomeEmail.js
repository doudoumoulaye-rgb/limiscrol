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
  let email = "";
  try {
    const user = req.user;
    email = String(user?.email || "").trim().toLowerCase();
    if (!email) {
      return res.json({ sent: false, skipped: true, reason: "no_email" });
    }

    const meta = user.user_metadata || {};
    const force = Boolean(req.body?.force);
    if (meta.welcome_email_sent === true && !force) {
      return res.json({ sent: false, skipped: true, reason: "already_sent", email });
    }

    const locale = String(req.body?.locale || "fr").toLowerCase() === "en" ? "en" : "fr";
    const resendPayload = await sendWelcomeEmailViaResend({
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

    return res.json({
      sent: true,
      email,
      resendId: resendPayload?.id || null,
    });
  } catch (error) {
    if (error.code === "RESEND_NOT_CONFIGURED") {
      return res.status(503).json({ sent: false, error: "welcome_email_not_configured" });
    }
    console.error("[welcome-email]", email, error.message, error.details || "");
    return res.status(500).json({
      sent: false,
      error: "welcome_email_failed",
      reason: error.code || "unknown",
      hint:
        error.code === "RESEND_SEND_FAILED"
          ? "Vérifie que moder-scroll.com est Verified sur Resend et que WELCOME_EMAIL_FROM utilise ce domaine."
          : undefined,
      details: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
});

module.exports = router;
