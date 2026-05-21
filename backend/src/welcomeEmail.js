const RESEND_API_URL = "https://api.resend.com/emails";

function getWelcomeFromAddress() {
  const from = (process.env.WELCOME_EMAIL_FROM || "ModérScroll <noreply@moder-scroll.com>").trim();
  return from;
}

function buildWelcomeHtml(displayName, locale) {
  const fr = locale === "fr";
  const greeting = displayName
    ? fr
      ? `Bonjour ${displayName},`
      : `Hello ${displayName},`
    : fr
      ? "Bonjour,"
      : "Hello,";
  const bodyFr = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#e8e8e8;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#e8e8e8;">
      Bienvenue dans <strong>ModérScroll</strong> — ta connexion est bien enregistrée.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#b0b0b0;">
      Tu peux définir tes limites quotidiennes (TikTok, Instagram, YouTube) et suivre ton usage depuis l’application.
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:#888;">— L’équipe ModérScroll</p>
  `;
  const bodyEn = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#e8e8e8;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#e8e8e8;">
      Welcome to <strong>ModérScroll</strong> — you are successfully signed in.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#b0b0b0;">
      Set your daily limits for TikTok, Instagram and YouTube and track your usage in the app.
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:#888;">— The ModérScroll team</p>
  `;
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#050810;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;">${fr ? bodyFr : bodyEn}</div>
  </body></html>`;
}

async function sendWelcomeEmailViaResend({ to, displayName, locale }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("RESEND_API_KEY is not configured");
    err.code = "RESEND_NOT_CONFIGURED";
    throw err;
  }
  const fr = locale === "fr";
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getWelcomeFromAddress(),
      to: [to],
      subject: fr ? "Bienvenue dans ModérScroll" : "Welcome to ModérScroll",
      html: buildWelcomeHtml(displayName, locale),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.message || `Resend HTTP ${response.status}`);
    err.code = "RESEND_SEND_FAILED";
    err.details = payload;
    throw err;
  }
  return payload;
}

module.exports = { sendWelcomeEmailViaResend, getWelcomeFromAddress };
