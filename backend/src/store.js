const { supabaseAdmin } = require("./supabase");

const APPS = ["tiktok", "instagram", "youtube"];
const DEFAULT_STATE = {
  active_app: "tiktok",
  limits: { tiktok: 155, instagram: 150, youtube: 150 },
  views: { tiktok: 0, instagram: 0, youtube: 0 },
  likes: { tiktok: 0, instagram: 0, youtube: 0 },
  reposts: { tiktok: 0, instagram: 0, youtube: 0 },
  lock_until: { tiktok: 0, instagram: 0, youtube: 0 },
  last_reset_day: new Date().toISOString().slice(0, 10),
  total_free: 500,
  global_remaining: 500,
  global_used: 0,
  app_bonus: { tiktok: 60, instagram: 60, youtube: 60 },
  app_bonus_initial: { tiktok: 60, instagram: 60, youtube: 60 },
  alerted20: false,
  alerted5: false,
  exhausted_at: null,
};

function assertAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for state persistence");
  }
}

function normalizeByAppObject(input, fallback) {
  const source = input && typeof input === "object" ? input : {};
  return {
    tiktok: Number.isFinite(source.tiktok) ? Math.max(0, Math.round(source.tiktok)) : fallback.tiktok,
    instagram: Number.isFinite(source.instagram) ? Math.max(0, Math.round(source.instagram)) : fallback.instagram,
    youtube: Number.isFinite(source.youtube) ? Math.max(0, Math.round(source.youtube)) : fallback.youtube,
  };
}

function normalizeState(row) {
  const normalized = {
    user_id: row.user_id,
    active_app: APPS.includes(row.active_app) ? row.active_app : DEFAULT_STATE.active_app,
    limits: normalizeByAppObject(row.limits, DEFAULT_STATE.limits),
    views: normalizeByAppObject(row.views, DEFAULT_STATE.views),
    likes: normalizeByAppObject(row.likes, DEFAULT_STATE.likes),
    reposts: normalizeByAppObject(row.reposts, DEFAULT_STATE.reposts),
    lock_until: normalizeByAppObject(row.lock_until, DEFAULT_STATE.lock_until),
    last_reset_day:
      typeof row.last_reset_day === "string" && row.last_reset_day.length >= 10
        ? row.last_reset_day.slice(0, 10)
        : DEFAULT_STATE.last_reset_day,
    total_free: Number.isFinite(row.total_free) ? Math.max(0, Math.round(row.total_free)) : DEFAULT_STATE.total_free,
    global_remaining: Number.isFinite(row.global_remaining)
      ? Math.max(0, Math.round(row.global_remaining))
      : DEFAULT_STATE.global_remaining,
    global_used: Number.isFinite(row.global_used) ? Math.max(0, Math.round(row.global_used)) : DEFAULT_STATE.global_used,
    app_bonus: normalizeByAppObject(row.app_bonus, DEFAULT_STATE.app_bonus),
    app_bonus_initial: normalizeByAppObject(row.app_bonus_initial, DEFAULT_STATE.app_bonus_initial),
    alerted20: Boolean(row.alerted20),
    alerted5: Boolean(row.alerted5),
    exhausted_at: row.exhausted_at || null,
  };
  if (normalized.global_remaining > normalized.total_free) {
    normalized.global_remaining = normalized.total_free;
  }
  return normalized;
}

async function insertDefaultState(userId) {
  assertAdminClient();
  const payload = { user_id: userId, ...DEFAULT_STATE };
  const { data, error } = await supabaseAdmin
    .from("app_runtime_state")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeState(data);
}

async function getOrCreateRuntimeState(userId) {
  assertAdminClient();
  const { data, error } = await supabaseAdmin
    .from("app_runtime_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return insertDefaultState(userId);
  return normalizeState(data);
}

async function saveRuntimeState(userId, state) {
  assertAdminClient();
  const payload = {
    ...state,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin
    .from("app_runtime_state")
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeState(data);
}

function sanitizeClientState(input, fallbackUserId) {
  const src = input && typeof input === "object" ? input : {};
  return normalizeState({
    user_id: fallbackUserId,
    active_app: src.active_app,
    limits: src.limits,
    views: src.views,
    likes: src.likes,
    reposts: src.reposts,
    lock_until: src.lock_until,
    last_reset_day: src.last_reset_day,
    total_free: src.total_free,
    global_remaining: src.global_remaining,
    global_used: src.global_used,
    app_bonus: src.app_bonus,
    app_bonus_initial: src.app_bonus_initial,
    alerted20: src.alerted20,
    alerted5: src.alerted5,
    exhausted_at: src.exhausted_at,
  });
}

function maxByApp(serverObj, clientObj, fallback) {
  const out = {};
  for (const app of APPS) {
    const s = Number.isFinite(serverObj[app]) ? Math.max(0, Math.round(serverObj[app])) : fallback[app];
    const cRaw = clientObj?.[app];
    const c = Number.isFinite(cRaw) ? Math.max(0, Math.round(cRaw)) : s;
    out[app] = Math.max(s, c);
  }
  return out;
}

/**
 * Merge client-reported state with server truth to block trivial credit / limit tampering (curl + Bearer).
 * Server owns: limits, lock_until, last_reset_day, total_free, app_bonus_initial.
 * Monotonic: views (max, capped by server limits), likes/reposts (max), global_used (max).
 * Pessimistic for "remaining": global_remaining, app_bonus (min vs server).
 */
function mergeClientStatePatch(serverState, clientRaw) {
  const server = normalizeState(serverState);
  const client = sanitizeClientState(clientRaw, server.user_id);
  const views = {};
  const appBonus = {};
  for (const app of APPS) {
    const lim = server.limits[app];
    const sv = server.views[app];
    const cv = client.views[app];
    views[app] = Math.min(lim, Math.max(sv, cv));
    appBonus[app] = Math.min(server.app_bonus[app], client.app_bonus[app]);
  }
  const merged = normalizeState({
    ...server,
    active_app: APPS.includes(client.active_app) ? client.active_app : server.active_app,
    views,
    likes: maxByApp(server.likes, client.likes, DEFAULT_STATE.likes),
    reposts: maxByApp(server.reposts, client.reposts, DEFAULT_STATE.reposts),
    app_bonus: appBonus,
    global_remaining: Math.min(server.global_remaining, client.global_remaining),
    global_used: Math.max(server.global_used, client.global_used),
    alerted20: Boolean(server.alerted20 || client.alerted20),
    alerted5: Boolean(server.alerted5 || client.alerted5),
    exhausted_at: server.exhausted_at || client.exhausted_at || null,
  });
  return merged;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewDay(state) {
  const today = getTodayKey();
  if (state.last_reset_day === today) return state;
  return {
    ...state,
    last_reset_day: today,
    views: { ...DEFAULT_STATE.views },
    likes: { ...DEFAULT_STATE.likes },
    reposts: { ...DEFAULT_STATE.reposts },
  };
}

function canConsumeVideo(state, app) {
  if ((state.app_bonus[app] || 0) > 0) return true;
  return (state.global_remaining || 0) > 0;
}

function consumeCredit(state, app) {
  const next = { ...state, app_bonus: { ...state.app_bonus } };
  if ((next.app_bonus[app] || 0) > 0) {
    next.app_bonus[app] -= 1;
  } else if ((next.global_remaining || 0) > 0) {
    next.global_remaining -= 1;
  } else {
    return { state, consumed: false };
  }
  next.global_used += 1;
  const remaining = next.global_remaining + next.app_bonus.tiktok + next.app_bonus.instagram + next.app_bonus.youtube;
  if (remaining <= 0 && !next.exhausted_at) {
    next.exhausted_at = new Date().toISOString();
  }
  return { state: next, consumed: true };
}

function parseLimit(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.min(999, Math.round(value)));
}

async function updateAppLimit(userId, app, limit) {
  if (!APPS.includes(app)) throw new Error("Invalid app");
  const parsedLimit = parseLimit(limit);
  if (!parsedLimit) throw new Error("Invalid limit");

  let state = await getOrCreateRuntimeState(userId);
  state = resetIfNewDay(state);
  state.limits = { ...state.limits, [app]: parsedLimit };
  if (state.views[app] > parsedLimit) {
    state.views = { ...state.views, [app]: parsedLimit };
  }
  state.lock_until = { ...state.lock_until, [app]: Date.now() + 24 * 60 * 60 * 1000 };
  return saveRuntimeState(userId, state);
}

async function consumeOneView(userId, app) {
  if (!APPS.includes(app)) throw new Error("Invalid app");
  let state = await getOrCreateRuntimeState(userId);
  state = resetIfNewDay(state);

  const limit = state.limits[app];
  const views = state.views[app];
  const remainingByLimit = Math.max(0, limit - views);

  if (remainingByLimit <= 0) {
    return { state, consumed: false, reason: "limit_reached" };
  }
  if (!canConsumeVideo(state, app)) {
    return { state, consumed: false, reason: "credits_exhausted" };
  }

  const creditResult = consumeCredit(state, app);
  if (!creditResult.consumed) {
    return { state, consumed: false, reason: "credits_exhausted" };
  }

  const nextState = {
    ...creditResult.state,
    views: { ...creditResult.state.views, [app]: creditResult.state.views[app] + 1 },
  };
  const saved = await saveRuntimeState(userId, nextState);
  return { state: saved, consumed: true, reason: null };
}

module.exports = {
  APPS,
  getOrCreateRuntimeState,
  saveRuntimeState,
  sanitizeClientState,
  mergeClientStatePatch,
  updateAppLimit,
  consumeOneView,
};
