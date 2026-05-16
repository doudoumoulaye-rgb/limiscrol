const authScreen = document.getElementById("authScreen");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authInfo = document.getElementById("authInfo");
const accessibilityScreen = document.getElementById("accessibilityScreen");
const subscriptionScreen = document.getElementById("subscriptionScreen");
const startTrialBtn = document.getElementById("startTrialBtn");
const buyMonthlyNowBtn = document.getElementById("buyMonthlyNowBtn");
const subscriptionInfo = document.getElementById("subscriptionInfo");
const onboardingAccessibilityBtn = document.getElementById("onboardingAccessibilityBtn");
const onboardingAccessibilityDoneBtn = document.getElementById("onboardingAccessibilityDoneBtn");
const onboardingAccessibilityInfo = document.getElementById("onboardingAccessibilityInfo");
const appEntryScreen = document.getElementById("appEntryScreen");
const appSettingsScreen = document.getElementById("appSettingsScreen");
const profileScreen = document.getElementById("profileScreen");
const historyScreen = document.getElementById("historyScreen");
const entryTiktokBtn = document.getElementById("entryTiktokBtn");
const entryInstagramBtn = document.getElementById("entryInstagramBtn");
const entryYoutubeBtn = document.getElementById("entryYoutubeBtn");
const splashScreen = document.getElementById("splashScreen");
const selectedAppName = document.getElementById("selectedAppName");
const selectedLimit = document.getElementById("selectedLimit");
const selectedUsed = document.getElementById("selectedUsed");
const selectedRemaining = document.getElementById("selectedRemaining");
const selectedLockMessage = document.getElementById("selectedLockMessage");
const decreaseLimitBtn = document.getElementById("decreaseLimitBtn");
const increaseLimitBtn = document.getElementById("increaseLimitBtn");
const acceptLimitBtn = document.getElementById("acceptLimitBtn");
const limitLockInfo = document.getElementById("limitLockInfo");
const addViewedBtn = document.getElementById("addViewedBtn");
const profileBtn = document.getElementById("profileBtn");
const trialStatus = document.getElementById("trialStatus");
const subscribeMonthlyBtn = document.getElementById("subscribeMonthlyBtn");
const androidProtectionBtn = document.getElementById("androidProtectionBtn");
const androidProtectionInfo = document.getElementById("androidProtectionInfo");
const resetBtn = document.getElementById("resetBtn");
const backBtn = document.getElementById("backBtn");
const backToSettingsBtn = document.getElementById("backToSettingsBtn");
const backFromProfileBtn = document.getElementById("backFromProfileBtn");
const backFromHistoryBtn = document.getElementById("backFromHistoryBtn");
const historyAppTiktokBtn = document.getElementById("historyAppTiktokBtn");
const historyAppInstagramBtn = document.getElementById("historyAppInstagramBtn");
const historyAppYoutubeBtn = document.getElementById("historyAppYoutubeBtn");
const historySummary = document.getElementById("historySummary");
const weeklyInsight = document.getElementById("weeklyInsight");
const challengeStatus = document.getElementById("challengeStatus");
const historyBody = document.getElementById("historyBody");
const profileEmail = document.getElementById("profileEmail");
const profileCreatedAt = document.getElementById("profileCreatedAt");
const profileTrialLeft = document.getElementById("profileTrialLeft");
const profilePlan = document.getElementById("profilePlan");
const profileRank = document.getElementById("profileRank");
const profileHistoryBtn = document.getElementById("profileHistoryBtn");
const challengeMotivation = document.getElementById("challengeMotivation");
const challengeList = document.getElementById("challengeList");
const rewardProgressBar = document.getElementById("rewardProgressBar");
const rewardScoreText = document.getElementById("rewardScoreText");
const rewardBadges = document.getElementById("rewardBadges");

const STORAGE_KEY = "video-limit-state-v4";
const APPS = ["tiktok", "instagram", "youtube"];
const DEFAULT_LIMIT = 150;
const HISTORY_DAYS = 7;
const CHALLENGE_DAYS = 14;
const DEFAULT_VIDEO_SECONDS = 30;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 14;
const APP_LABELS = {
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  youtube: "YouTube Shorts"
};
const state = {
  account: {
    email: "",
    passwordSet: false,
    createdAt: 0
  },
  subscription: {
    monthlyActive: false,
    choiceDone: false
  },
  security: {
    pinEnabled: false,
    pinCode: ""
  },
  accessibilityReady: false,
  onboardingDone: false,
  limits: {
    tiktok: DEFAULT_LIMIT,
    instagram: DEFAULT_LIMIT,
    youtube: DEFAULT_LIMIT
  },
  used: {
    tiktok: 0,
    instagram: 0,
    youtube: 0
  },
  blocked: {
    tiktok: false,
    instagram: false,
    youtube: false
  },
  limitLocks: {
    tiktok: 0,
    instagram: 0,
    youtube: 0
  },
  history: {
    // dateKey: { tiktok: 0, instagram: 0, youtube: 0 }
  },
  historyEvents: []
};
let selectedApp = "tiktok";
let selectedHistoryApp = "tiktok";
let lastResetDate = "";

function resetOnboardingState() {
  state.account.email = "";
  state.account.passwordSet = false;
  state.account.createdAt = 0;
  state.subscription.monthlyActive = false;
  state.subscription.choiceDone = false;
  state.accessibilityReady = false;
  state.onboardingDone = false;
}

function getReelBlockerPlugin() {
  return window?.Capacitor?.Plugins?.ReelBlocker || null;
}

function isNativeAndroid() {
  return window?.Capacitor?.getPlatform?.() === "android";
}

async function sendBlockedStateToAndroid(app) {
  const plugin = getReelBlockerPlugin();
  if (!plugin?.setBlocked || !isNativeAndroid()) {
    return;
  }
  try {
    await plugin.setBlocked({ app, blocked: state.blocked[app] });
  } catch {
    // Ignore bridge errors in web/dev mode.
  }
}

async function syncAllBlockedStatesToAndroid() {
  for (const app of APPS) {
    // eslint-disable-next-line no-await-in-loop
    await sendBlockedStateToAndroid(app);
  }
}

function updateAndroidProtectionUI() {
  if (!androidProtectionBtn || !androidProtectionInfo) {
    return;
  }

  const plugin = getReelBlockerPlugin();
  const native = isNativeAndroid() && plugin?.openAccessibilitySettings;
  androidProtectionBtn.hidden = !native;
  if (!native) {
    androidProtectionInfo.textContent = "";
    return;
  }
  androidProtectionInfo.textContent =
    "Active le service Accessibilite Android pour bloquer uniquement Reels/Shorts quand la limite est atteinte.";
}

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function isMorning(date = new Date()) {
  const hour = date.getHours();
  return hour >= 5 && hour < 12;
}

function getTrialRemainingDays() {
  if (!state.account.createdAt) {
    return TRIAL_DAYS;
  }
  const elapsedMs = Date.now() - state.account.createdAt;
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  return Math.max(TRIAL_DAYS - elapsedDays, 0);
}

function hasPremiumAccess() {
  return state.subscription.monthlyActive || getTrialRemainingDays() > 0;
}

function promptPinVerification() {
  if (!state.security.pinEnabled || !state.security.pinCode) {
    return true;
  }
  const entered = window.prompt("Entre ton code PIN pour confirmer.");
  return entered === state.security.pinCode;
}

function saveState() {
  const snapshot = {
    account: state.account,
    subscription: state.subscription,
    security: state.security,
    accessibilityReady: state.accessibilityReady,
    onboardingDone: state.onboardingDone,
    limits: state.limits,
    used: state.used,
    blocked: state.blocked,
    history: state.history,
    historyEvents: state.historyEvents,
    lastResetDate
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    lastResetDate = getDateKey();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.account && typeof parsed.account === "object") {
      state.account.email = typeof parsed.account.email === "string" ? parsed.account.email : "";
      state.account.passwordSet = Boolean(parsed.account.passwordSet);
      state.account.createdAt = Number.isFinite(parsed.account.createdAt) ? parsed.account.createdAt : 0;
      if (state.account.passwordSet && !state.account.createdAt) {
        state.account.createdAt = Date.now();
      }
    }
    if (parsed.subscription && typeof parsed.subscription === "object") {
      state.subscription.monthlyActive = Boolean(parsed.subscription.monthlyActive);
      state.subscription.choiceDone = Boolean(parsed.subscription.choiceDone);
    } else {
      state.subscription.choiceDone = Boolean(parsed.onboardingDone);
    }
    if (parsed.security && typeof parsed.security === "object") {
      state.security.pinEnabled = Boolean(parsed.security.pinEnabled);
      state.security.pinCode = typeof parsed.security.pinCode === "string" ? parsed.security.pinCode : "";
    }
    state.accessibilityReady = Boolean(parsed.accessibilityReady);
    state.onboardingDone = Boolean(parsed.onboardingDone);

    for (const app of APPS) {
      const parsedLimit = parsed?.limits?.[app];
      const parsedUsed = parsed?.used?.[app];
      const parsedBlocked = parsed?.blocked?.[app];
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        state.limits[app] = parsedLimit;
      }
      if (Number.isFinite(parsedUsed) && parsedUsed >= 0) {
        state.used[app] = parsedUsed;
      }
      state.blocked[app] = Boolean(parsedBlocked);
      // Limit locks are intentionally session-only for testing comfort.
      state.limitLocks[app] = 0;
    }
    if (parsed.history && typeof parsed.history === "object") {
      for (const [day, values] of Object.entries(parsed.history)) {
        const safeDay = {
          tiktok: Number.isFinite(values?.tiktok) ? Math.max(values.tiktok, 0) : 0,
          instagram: Number.isFinite(values?.instagram) ? Math.max(values.instagram, 0) : 0,
          youtube: Number.isFinite(values?.youtube) ? Math.max(values.youtube, 0) : 0
        };
        state.history[day] = safeDay;
      }
    }
    if (Array.isArray(parsed.historyEvents)) {
      state.historyEvents = parsed.historyEvents
        .filter((eventItem) => APPS.includes(eventItem?.app) && typeof eventItem?.timestamp === "number")
        .map((eventItem) => ({
          app: eventItem.app,
          timestamp: eventItem.timestamp,
          durationSec: Number.isFinite(eventItem.durationSec) ? Math.max(eventItem.durationSec, 0) : DEFAULT_VIDEO_SECONDS
        }));
    }

    lastResetDate = typeof parsed.lastResetDate === "string" ? parsed.lastResetDate : getDateKey();
  } catch {
    lastResetDate = getDateKey();
  }
}

function showSubscriptionScreen() {
  authScreen.hidden = true;
  accessibilityScreen.hidden = true;
  subscriptionScreen.hidden = false;
  appEntryScreen.hidden = true;
  appSettingsScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = true;
}

function showEntryScreen() {
  authScreen.hidden = true;
  accessibilityScreen.hidden = true;
  subscriptionScreen.hidden = true;
  appEntryScreen.hidden = false;
  appSettingsScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = true;
}

function showAuthScreen() {
  authScreen.hidden = false;
  accessibilityScreen.hidden = true;
  subscriptionScreen.hidden = true;
  appEntryScreen.hidden = true;
  appSettingsScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = true;
}

function showAccessibilityScreen() {
  authScreen.hidden = true;
  accessibilityScreen.hidden = false;
  subscriptionScreen.hidden = true;
  appEntryScreen.hidden = true;
  appSettingsScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = true;
  onboardingAccessibilityInfo.textContent =
    isNativeAndroid()
      ? "Android detecte: active le service puis valide."
      : "Mode web/iPhone: la configuration Accessibilite Android sera finalisee plus tard.";
}

function submitAuth(event) {
  event.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email.includes("@")) {
    authInfo.textContent = "Entre un email valide.";
    return;
  }
  if (password.length < 6) {
    authInfo.textContent = "Mot de passe trop court (minimum 6 caracteres).";
    return;
  }

  state.account.email = email;
  state.account.passwordSet = true;
  saveState();
  authInfo.textContent = "";
  showSubscriptionScreen();
}

function finishAccessibilityOnboarding() {
  state.accessibilityReady = true;
  state.onboardingDone = true;
  saveState();
  showEntryScreen();
}

function startTrial() {
  if (!state.account.createdAt) {
    state.account.createdAt = Date.now();
  }
  state.subscription.monthlyActive = false;
  state.subscription.choiceDone = true;
  saveState();
  subscriptionInfo.textContent = "";
  showAccessibilityScreen();
}

function buyMonthlyNow() {
  state.subscription.monthlyActive = true;
  state.subscription.choiceDone = true;
  saveState();
  subscriptionInfo.textContent = "Plan mensuel active (mode demo).";
  showAccessibilityScreen();
}

function canChangeLimit(app) {
  return Date.now() >= (state.limitLocks[app] || 0);
}

function formatUnlockDate(timestamp) {
  return new Date(timestamp).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateUI() {
  const canCount = isMorning();
  const canEditLimit = canChangeLimit(selectedApp);
  const remaining = Math.max(state.limits[selectedApp] - state.used[selectedApp], 0);
  const trialDays = getTrialRemainingDays();
  const premium = hasPremiumAccess();
  selectedAppName.textContent = APP_LABELS[selectedApp];
  selectedLimit.textContent = String(state.limits[selectedApp]);
  selectedUsed.textContent = String(state.used[selectedApp]);
  selectedRemaining.textContent = String(remaining);
  selectedLockMessage.hidden = !state.blocked[selectedApp];
  addViewedBtn.disabled = !canCount || state.blocked[selectedApp];
  decreaseLimitBtn.disabled = !canEditLimit;
  increaseLimitBtn.disabled = !canEditLimit;
  acceptLimitBtn.disabled = !canEditLimit;

  if (canEditLimit) {
    limitLockInfo.textContent = "Tu peux modifier puis valider avec Accepter.";
  } else {
    const lockUntil = state.limitLocks[selectedApp];
    limitLockInfo.textContent =
      `Limite verrouillee jusqu'au ${formatUnlockDate(lockUntil)}. Videos restantes aujourd'hui: ${remaining}.`;
  }

  if (state.subscription.monthlyActive) {
    trialStatus.textContent = "Plan mensuel actif (5 CHF / mois).";
    subscribeMonthlyBtn.disabled = true;
  } else if (trialDays > 0) {
    trialStatus.textContent = `Essai gratuit actif: ${trialDays} jours restants.`;
    subscribeMonthlyBtn.disabled = false;
  } else {
    trialStatus.textContent = "Essai termine. Active le plan mensuel pour continuer les fonctions premium.";
    subscribeMonthlyBtn.disabled = false;
  }

  profileHistoryBtn.disabled = !premium;
}

function getPastDateKeys(daysCount) {
  const now = new Date();
  const keys = [];
  for (let i = 0; i < daysCount; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(getDateKey(d));
  }
  return keys;
}

function getTotalViewsForDay(dateKey) {
  const values = state.history[dateKey] || { tiktok: 0, instagram: 0, youtube: 0 };
  return values.tiktok + values.instagram + values.youtube;
}

function getWeekendLightStatus() {
  const now = new Date();
  const weekendDates = [];
  for (let i = 0; i < CHALLENGE_DAYS; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const day = d.getDay();
    if (day === 0 || day === 6) {
      weekendDates.push(getDateKey(d));
    }
  }
  const checked = weekendDates.slice(0, 2);
  let okCount = 0;
  for (const dateKey of checked) {
    if (getTotalViewsForDay(dateKey) <= 50) {
      okCount += 1;
    }
  }
  return `${okCount}/${Math.max(checked.length, 1)} weekend day(s) sous 50 videos`;
}

function getNoScrollAfter22hStatus() {
  const keys = getPastDateKeys(HISTORY_DAYS);
  let successDays = 0;
  for (const day of keys) {
    const hasLateEvent = state.historyEvents.some((eventItem) => {
      return getDateKey(new Date(eventItem.timestamp)) === day && new Date(eventItem.timestamp).getHours() >= 22;
    });
    if (!hasLateEvent) {
      successDays += 1;
    }
  }
  return `${successDays}/${HISTORY_DAYS} jour(s) sans scroll apres 22h`;
}

function getMorningWithoutReelsStatus() {
  const keys = getPastDateKeys(5);
  let cleanDays = 0;
  for (const day of keys) {
    const hasEarlyEvent = state.historyEvents.some((eventItem) => {
      return getDateKey(new Date(eventItem.timestamp)) === day && new Date(eventItem.timestamp).getHours() < 10;
    });
    if (!hasEarlyEvent) {
      cleanDays += 1;
    }
  }
  return `${cleanDays}/5 jours sans reels avant 10h`;
}

function getWithinLimitStatus(daysCount) {
  const keys = getPastDateKeys(daysCount);
  let ok = 0;
  for (const day of keys) {
    const values = state.history[day] || { tiktok: 0, instagram: 0, youtube: 0 };
    const within =
      values.tiktok <= state.limits.tiktok &&
      values.instagram <= state.limits.instagram &&
      values.youtube <= state.limits.youtube;
    if (within) {
      ok += 1;
    }
  }
  return `${ok}/${daysCount} jours respectes`;
}

function getCurrentStreak() {
  const keys = getPastDateKeys(CHALLENGE_DAYS);
  let streak = 0;
  for (const day of keys) {
    const values = state.history[day] || { tiktok: 0, instagram: 0, youtube: 0 };
    const within =
      values.tiktok <= state.limits.tiktok &&
      values.instagram <= state.limits.instagram &&
      values.youtube <= state.limits.youtube;
    if (!within) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function getFocusSessionStatus() {
  const keys = getPastDateKeys(HISTORY_DAYS);
  let goodDays = 0;
  for (const day of keys) {
    const values = state.history[day] || { tiktok: 0, instagram: 0, youtube: 0 };
    const total = values.tiktok + values.instagram + values.youtube;
    if (total <= 60) {
      goodDays += 1;
    }
  }
  return `${goodDays}/${HISTORY_DAYS} jours avec >=3 sessions focus estimees`;
}

function renderProfile() {
  profileEmail.textContent = state.account.email || "-";
  profileCreatedAt.textContent = state.account.createdAt
    ? new Date(state.account.createdAt).toLocaleDateString("fr-FR")
    : "-";
  profileTrialLeft.textContent = `${getTrialRemainingDays()} jour(s)`;
  profilePlan.textContent = state.subscription.monthlyActive ? "Mensuel 5 CHF/mois" : "Essai gratuit";

  const streak = getCurrentStreak();
  const toRatioDone = (valueText) => {
    const match = valueText.match(/(\d+)\/(\d+)/);
    if (!match) {
      return false;
    }
    return Number.parseInt(match[1], 10) >= Number.parseInt(match[2], 10);
  };

  const within7 = getWithinLimitStatus(7);
  const morningNoReels = getMorningWithoutReelsStatus();
  const progressive14 = getWithinLimitStatus(14);
  const focus25 = getFocusSessionStatus();
  const weekendLight = getWeekendLightStatus();
  const noAfter22 = getNoScrollAfter22hStatus();

  const challengeData = [
    { title: "7 jours sans depasser", value: within7, completed: toRatioDone(within7) },
    { title: "Matin sans reels", value: morningNoReels, completed: toRatioDone(morningNoReels) },
    { title: "-20% progressif (14j)", value: progressive14, completed: toRatioDone(progressive14) },
    { title: "Defi focus 25 min", value: focus25, completed: toRatioDone(focus25) },
    { title: "Weekend light", value: weekendLight, completed: toRatioDone(weekendLight) },
    { title: "Streak sobriete", value: `${streak} jour(s) consecutif(s)`, completed: streak >= 7 },
    { title: "No scroll apres 22h", value: noAfter22, completed: toRatioDone(noAfter22) },
    { title: "Challenge duo", value: "Disponible: partage ton score avec un ami", completed: false }
  ];

  challengeList.innerHTML = challengeData
    .map((challenge) => {
      const pointsText = challenge.completed ? "+10 pts" : "0 pt";
      return `<div class="challenge-item"><strong>${challenge.title}</strong><span>${challenge.value} - ${pointsText}</span></div>`;
    })
    .join("");
  challengeMotivation.textContent = "Chaque defi reussi rapporte 10 points.";

  const score = Math.min(
    100,
    challengeData.reduce((acc, challenge) => acc + (challenge.completed ? 10 : 0), 0)
  );
  rewardProgressBar.style.width = `${score}%`;
  const ranks = [
    { name: "Bronze I", min: 10 },
    { name: "Bronze II", min: 20 },
    { name: "Silver I", min: 30 },
    { name: "Silver II", min: 40 },
    { name: "Gold I", min: 50 },
    { name: "Gold II", min: 60 },
    { name: "Platine I", min: 70 },
    { name: "Platine II", min: 80 },
    { name: "Diamant", min: 90 },
    { name: "Master", min: 100 }
  ];
  const unlockedRanks = ranks.filter((rank) => score >= rank.min).map((rank) => rank.name);
  const currentRank = unlockedRanks.length > 0 ? unlockedRanks[unlockedRanks.length - 1] : "Non classe";
  rewardScoreText.textContent = `${score}/100`;
  profileRank.textContent = currentRank;

  rewardBadges.innerHTML = unlockedRanks.length
    ? unlockedRanks.map((badge) => `<span class="badge-chip">${badge}</span>`).join("")
    : '<span class="badge-chip badge-chip--empty">Aucun rang pour le moment</span>';
}

function applyBlockingRulesOnStartup() {
  for (const app of APPS) {
    // Apply hard blocking only when app starts (or restarts).
    state.blocked[app] = state.limits[app] <= 0 || state.used[app] >= state.limits[app];
  }
}

function dailyResetIfNeeded() {
  const today = getDateKey();
  if (today !== lastResetDate) {
    for (const app of APPS) {
      state.used[app] = 0;
      state.blocked[app] = state.limits[app] <= 0;
    }
    lastResetDate = today;
    pruneHistory();
    saveState();
  }
}

function ensureHistoryDay(dateKey) {
  if (!state.history[dateKey]) {
    state.history[dateKey] = { tiktok: 0, instagram: 0, youtube: 0 };
  }
}

function pruneHistory() {
  const now = new Date();
  const keepDays = new Set();
  for (let i = 0; i < CHALLENGE_DAYS; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keepDays.add(getDateKey(d));
  }

  for (const day of Object.keys(state.history)) {
    if (!keepDays.has(day)) {
      delete state.history[day];
    }
  }

  const earliest = new Date(now);
  earliest.setDate(now.getDate() - (CHALLENGE_DAYS - 1));
  earliest.setHours(0, 0, 0, 0);
  const minTimestamp = earliest.getTime();
  state.historyEvents = state.historyEvents.filter((eventItem) => eventItem.timestamp >= minTimestamp);
}

function addHistoryView(app) {
  const todayKey = getDateKey();
  ensureHistoryDay(todayKey);
  state.history[todayKey][app] += 1;
  state.historyEvents.push({
    app,
    timestamp: Date.now(),
    durationSec: DEFAULT_VIDEO_SECONDS
  });
  pruneHistory();
}

function getDayLabel(dateKey, indexFromToday) {
  if (indexFromToday === 0) {
    return "Aujourd'hui";
  }
  if (indexFromToday === 1) {
    return "Hier";
  }

  const weekday = new Date(`${dateKey}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long" });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function formatDayWithDate(dateKey, indexFromToday) {
  const label = getDayLabel(dateKey, indexFromToday);
  const [year, month, day] = dateKey.split("-");
  return `${label} (${day}/${month}/${year})`;
}

function getLastDaysKeys() {
  const now = new Date();
  const keys = [];
  for (let i = 0; i < HISTORY_DAYS; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(getDateKey(d));
  }
  return keys;
}

function formatSeconds(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function formatTimes(timestamps) {
  if (timestamps.length === 0) {
    return "-";
  }
  return timestamps
    .map((ts) => new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))
    .join(", ");
}

function renderHistory() {
  const dayKeys = getLastDaysKeys();
  let totalViews = 0;
  let totalDurationSec = 0;
  let savedSecondsTotal = 0;
  let challengeSuccess = true;

  const rows = dayKeys.map((day, indexFromToday) => {
    const fallbackCount = state.history?.[day]?.[selectedHistoryApp] || 0;
    const events = state.historyEvents.filter((eventItem) => {
      if (eventItem.app !== selectedHistoryApp) {
        return false;
      }
      return getDateKey(new Date(eventItem.timestamp)) === day;
    });

    const viewCount = Math.max(events.length, fallbackCount);
    const durationSecFromEvents = events.reduce((acc, item) => acc + item.durationSec, 0);
    const durationSec = events.length > 0 ? durationSecFromEvents : fallbackCount * DEFAULT_VIDEO_SECONDS;
    const times = formatTimes(events.map((item) => item.timestamp));

    totalViews += viewCount;
    totalDurationSec += durationSec;
    const limitForApp = Math.max(state.limits[selectedHistoryApp], 0);
    savedSecondsTotal += Math.max(limitForApp - viewCount, 0) * DEFAULT_VIDEO_SECONDS;
    if (viewCount > limitForApp) {
      challengeSuccess = false;
    }

    return `
      <div class="history-row">
        <span>${formatDayWithDate(day, indexFromToday)}</span>
        <span>${viewCount}</span>
        <span>${times}</span>
        <span>${formatSeconds(durationSec)}</span>
      </div>
    `;
  });

  historySummary.textContent =
    `${APP_LABELS[selectedHistoryApp]} - 7 jours: ${totalViews} videos, temps passe estime: ${formatSeconds(totalDurationSec)}.`;
  const addictionScore = Math.max(
    0,
    Math.min(100, Math.round(100 - (totalDurationSec / (7 * 120 * 60)) * 100))
  );
  weeklyInsight.textContent = `Rapport hebdo: temps economise estime ${formatSeconds(savedSecondsTotal)}. Score d'addiction: ${addictionScore}/100.`;
  challengeStatus.textContent = challengeSuccess
    ? "Defi: 7 jours sans depasser - Reussi."
    : "Defi: 7 jours sans depasser - A continuer.";
  historyBody.innerHTML = rows.join("");
}

function selectHistoryApp(app) {
  if (!APPS.includes(app)) {
    return;
  }
  selectedHistoryApp = app;
  historyAppTiktokBtn.classList.toggle("active", app === "tiktok");
  historyAppInstagramBtn.classList.toggle("active", app === "instagram");
  historyAppYoutubeBtn.classList.toggle("active", app === "youtube");
  renderHistory();
}

function lockApp(app) {
  state.blocked[app] = true;
  saveState();
  sendBlockedStateToAndroid(app);
  updateUI();
}

function unlockApp(app) {
  state.blocked[app] = false;
  saveState();
  sendBlockedStateToAndroid(app);
  updateUI();
}

function refreshBlockStatus(app) {
  if (state.used[app] >= state.limits[app]) {
    lockApp(app);
  } else {
    unlockApp(app);
  }
  saveState();
}

function changeLimit(delta) {
  if (!canChangeLimit(selectedApp)) {
    alert(`Tu pourras changer cette limite apres le ${formatUnlockDate(state.limitLocks[selectedApp])}.`);
    return;
  }
  const next = state.limits[selectedApp] + delta;
  state.limits[selectedApp] = Math.max(0, next);
  refreshBlockStatus(selectedApp);
}

function acceptLimitForWeek() {
  if (!promptPinVerification()) {
    alert("PIN incorrect. Action annulee.");
    return;
  }
  if (!canChangeLimit(selectedApp)) {
    alert(`Limite deja verrouillee jusqu'au ${formatUnlockDate(state.limitLocks[selectedApp])}.`);
    return;
  }
  state.limitLocks[selectedApp] = Date.now() + ONE_WEEK_MS;
  saveState();
  updateUI();
}

async function openAndroidAccessibilitySettings() {
  const plugin = getReelBlockerPlugin();
  if (!plugin?.openAccessibilitySettings || !isNativeAndroid()) {
    return;
  }
  try {
    await plugin.openAccessibilitySettings();
  } catch {
    alert("Impossible d'ouvrir les reglages Accessibilite.");
  }
}

function resetCounter() {
  for (const app of APPS) {
    state.limits[app] = 0;
    state.used[app] = 0;
    state.blocked[app] = true;
  }
  state.history = {};
  state.historyEvents = [];
  saveState();
  renderHistory();
  updateUI();
}

function activateMonthlyPlan() {
  state.subscription.monthlyActive = true;
  saveState();
  updateUI();
}

function addOneVideo(app) {
  dailyResetIfNeeded();

  if (!isMorning()) {
    alert("Le compteur est actif le matin (05:00 - 11:59).");
    return;
  }

  if (state.blocked[app]) {
    return;
  }

  state.used[app] += 1;
  addHistoryView(app);
  // During an active session, do not auto-block immediately when limit is crossed.
  // Blocking is applied when the app is reopened.
  saveState();
  updateUI();
}

function selectApp(app) {
  if (!APPS.includes(app)) {
    return;
  }
  selectedApp = app;
  updateUI();
}

function openSettings(app) {
  if (!state.onboardingDone) {
    showAuthScreen();
    return;
  }
  selectApp(app);
  subscriptionScreen.hidden = true;
  appEntryScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = true;
  appSettingsScreen.hidden = false;
}

function goToLogos() {
  if (!state.onboardingDone) {
    showAuthScreen();
    return;
  }
  subscriptionScreen.hidden = true;
  appSettingsScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = true;
  appEntryScreen.hidden = false;
}

function openHistory() {
  if (!hasPremiumAccess()) {
    alert("Fonction premium: active le plan mensuel 5 CHF/mois.");
    return;
  }
  selectHistoryApp(selectedApp);
  appSettingsScreen.hidden = true;
  appEntryScreen.hidden = true;
  profileScreen.hidden = true;
  historyScreen.hidden = false;
}

function backToSettings() {
  historyScreen.hidden = true;
  profileScreen.hidden = true;
  appSettingsScreen.hidden = false;
}

function openProfile() {
  renderProfile();
  appSettingsScreen.hidden = true;
  appEntryScreen.hidden = true;
  historyScreen.hidden = true;
  profileScreen.hidden = false;
}

function backFromProfile() {
  profileScreen.hidden = true;
  appSettingsScreen.hidden = false;
}

function openHistoryFromProfile() {
  profileScreen.hidden = true;
  openHistory();
}

authForm.addEventListener("submit", submitAuth);
onboardingAccessibilityBtn.addEventListener("click", openAndroidAccessibilitySettings);
onboardingAccessibilityDoneBtn.addEventListener("click", finishAccessibilityOnboarding);
startTrialBtn.addEventListener("click", startTrial);
buyMonthlyNowBtn.addEventListener("click", buyMonthlyNow);
entryTiktokBtn.addEventListener("click", () => openSettings("tiktok"));
entryInstagramBtn.addEventListener("click", () => openSettings("instagram"));
entryYoutubeBtn.addEventListener("click", () => openSettings("youtube"));
decreaseLimitBtn.addEventListener("click", () => changeLimit(-1));
increaseLimitBtn.addEventListener("click", () => changeLimit(1));
acceptLimitBtn.addEventListener("click", acceptLimitForWeek);
addViewedBtn.addEventListener("click", () => addOneVideo(selectedApp));
subscribeMonthlyBtn.addEventListener("click", activateMonthlyPlan);
profileBtn.addEventListener("click", openProfile);
androidProtectionBtn.addEventListener("click", openAndroidAccessibilitySettings);
resetBtn.addEventListener("click", resetCounter);
backBtn.addEventListener("click", goToLogos);
backToSettingsBtn.addEventListener("click", backToSettings);
backFromProfileBtn.addEventListener("click", backFromProfile);
profileHistoryBtn.addEventListener("click", openHistoryFromProfile);
backFromHistoryBtn.addEventListener("click", goToLogos);
historyAppTiktokBtn.addEventListener("click", () => selectHistoryApp("tiktok"));
historyAppInstagramBtn.addEventListener("click", () => selectHistoryApp("instagram"));
historyAppYoutubeBtn.addEventListener("click", () => selectHistoryApp("youtube"));

loadState();
const params = new URLSearchParams(window.location.search);
if (params.get("forceOnboarding") === "1") {
  resetOnboardingState();
}
dailyResetIfNeeded();
pruneHistory();
applyBlockingRulesOnStartup();
saveState();
selectHistoryApp("tiktok");
updateUI();
renderProfile();
updateAndroidProtectionUI();
syncAllBlockedStatesToAndroid();
if (!state.account.passwordSet) {
  showAuthScreen();
} else if (!state.subscription.choiceDone) {
  showSubscriptionScreen();
} else if (!state.accessibilityReady) {
  showAccessibilityScreen();
} else if (state.onboardingDone) {
  showEntryScreen();
} else {
  showEntryScreen();
}

if (splashScreen) {
  window.setTimeout(() => {
    splashScreen.classList.add("hide");
  }, 1650);
}
