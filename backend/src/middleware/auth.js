const { supabaseAnon } = require("../supabase");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Invalid bearer token" });
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = data.user;
  return next();
}

module.exports = { requireAuth };
