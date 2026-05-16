package com.limitscroll.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;

import java.util.Locale;

public class ShortsBlockerAccessibilityService extends AccessibilityService {
    private static final int MIN_ACTION_GAP_MS = 1300;
    /** Entre deux signaux « scroll » comptés comme une nouvelle vidéo (évite le spam). */
    private static final long SCROLL_SIGNAL_DEBOUNCE_MS = 2000L;
    private static final String KEY_LAST_SCROLL_PREFIX = "last_scroll_signal_";
    /** Limite de profondeur pour limiter le coût sur de gros arbres d'UI. */
    private static final int MAX_TREE_DEPTH = 32;

    /**
     * Sous-chaînes usuelles pour l'onglet / écran Reels (plusieurs langues + graphie FR).
     */
    private static final String[] REELS_HINTS = {
        "reels",
        "reel",
        "réels",
        "réel",
    };

    /**
     * YouTube utilise souvent "Shorts" tel quel ; on évite le seul mot "short" (faux positifs type "shortcut").
     */
    private static final String[] SHORTS_HINTS = {
        "shorts",
        "youtube shorts",
    };

    private long lastActionMs = 0;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) {
            return;
        }

        CharSequence packageNameCs = event.getPackageName();
        if (packageNameCs == null) {
            return;
        }

        String packageName = packageNameCs.toString();

        if (isTikTokPackage(packageName)) {
            if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_SCROLLED && !isBlocked("tiktok")) {
                recordScrollSignal("tiktok");
            }
            if (isBlocked("tiktok")) {
                long now = System.currentTimeMillis();
                if (now - lastActionMs >= MIN_ACTION_GAP_MS) {
                    blockNow("TikTok bloque (limite atteinte)");
                }
            }
            return;
        }

        if ("com.instagram.android".equals(packageName)) {
            if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_SCROLLED && !isBlocked("instagram")) {
                recordScrollSignal("instagram");
            }
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root == null) {
                return;
            }
            try {
                if (isBlocked("instagram") && windowContainsAny(root, REELS_HINTS, 0)) {
                    blockNow("Instagram Reels bloque (limite atteinte)");
                }
            } finally {
                root.recycle();
            }
            return;
        }

        if ("com.google.android.youtube".equals(packageName)) {
            if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_SCROLLED && !isBlocked("youtube")) {
                recordScrollSignal("youtube");
            }
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root == null) {
                return;
            }
            try {
                if (isBlocked("youtube") && windowContainsAny(root, SHORTS_HINTS, 0)) {
                    blockNow("YouTube Shorts bloque (limite atteinte)");
                }
            } finally {
                root.recycle();
            }
        }
    }

    @Override
    public void onInterrupt() {
        // No-op
    }

    private static boolean isTikTokPackage(String packageName) {
        return "com.zhiliaoapp.musically".equals(packageName)
            || "com.ss.android.ugc.trill".equals(packageName);
    }

    private boolean isBlocked(String app) {
        return getSharedPreferences(ReelBlockerPlugin.PREF_NAME, Context.MODE_PRIVATE)
            .getBoolean("block_" + app, false);
    }

    /**
     * Incrémente la file lue par {@link ReelBlockerPlugin#consumePendingViewSignals} (debounce par app).
     */
    private void recordScrollSignal(String appKey) {
        SharedPreferences prefs = getSharedPreferences(ReelBlockerPlugin.PREF_NAME, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long last = prefs.getLong(KEY_LAST_SCROLL_PREFIX + appKey, 0L);
        if (now - last < SCROLL_SIGNAL_DEBOUNCE_MS) {
            return;
        }
        String pendingKey = ReelBlockerPlugin.PENDING_VIEWS_PREFIX + appKey;
        int cur = prefs.getInt(pendingKey, 0);
        prefs.edit()
            .putLong(KEY_LAST_SCROLL_PREFIX + appKey, now)
            .putInt(pendingKey, cur + 1)
            .apply();
    }

    private boolean windowContainsAny(AccessibilityNodeInfo node, String[] hints, int depth) {
        if (node == null || depth > MAX_TREE_DEPTH) {
            return false;
        }

        CharSequence text = node.getText();
        CharSequence content = node.getContentDescription();
        if (matchesAnyHint(text, hints) || matchesAnyHint(content, hints)) {
            return true;
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                boolean found = windowContainsAny(child, hints, depth + 1);
                child.recycle();
                if (found) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean matchesAnyHint(CharSequence value, String[] hints) {
        if (value == null) {
            return false;
        }
        String lower = value.toString().toLowerCase(Locale.ROOT);
        for (String hint : hints) {
            if (hint != null && !hint.isEmpty() && lower.contains(hint.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private void blockNow(String message) {
        lastActionMs = System.currentTimeMillis();
        performGlobalAction(GLOBAL_ACTION_BACK);
        Toast.makeText(getApplicationContext(), message, Toast.LENGTH_SHORT).show();
    }
}
