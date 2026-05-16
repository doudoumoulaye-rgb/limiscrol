const { createClient } = require("@supabase/supabase-js");
const { getConfig } = require("./config");

const { config } = getConfig();

const supabaseAnon = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const supabaseAdmin = config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

module.exports = { supabaseAnon, supabaseAdmin };
