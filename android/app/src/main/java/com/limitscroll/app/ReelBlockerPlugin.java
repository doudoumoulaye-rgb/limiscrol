package com.limitscroll.app;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;

import java.util.List;
import java.util.Locale;

import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ReelBlocker")
public class ReelBlockerPlugin extends Plugin {
    static final String PREF_NAME = "reel_blocker_prefs";

    /** File d'attente des signaux « nouvelle vidéo » (scroll) détectés par le service d'accessibilité. */
    static final String PENDING_VIEWS_PREFIX = "pending_views_";

    /** Not in all public SDK stubs; must match platform Settings.ACTION_ACCESSIBILITY_DETAILS_SETTINGS. */
    private static final String ACTION_ACCESSIBILITY_DETAILS_SETTINGS =
            "android.settings.ACCESSIBILITY_DETAILS_SETTINGS";

    /** TikTok package id varies by region / store; try in order. */
    private static final String[] TIKTOK_PACKAGES = {
        "com.zhiliaoapp.musically",
        "com.ss.android.ugc.trill",
    };

    private static String packageForApp(String app) {
        if (app == null) return "";
        String key = app.trim().toLowerCase(Locale.ROOT);
        if ("tiktok".equals(key)) return TIKTOK_PACKAGES[0];
        if ("instagram".equals(key)) return "com.instagram.android";
        if ("youtube".equals(key)) return "com.google.android.youtube";
        return "";
    }

    private static String keyForApp(String app) {
        return "block_" + app;
    }

    @PluginMethod
    public void setBlocked(PluginCall call) {
        String app = call.getString("app");
        boolean blocked = call.getBoolean("blocked", false);
        if (app == null || app.trim().isEmpty()) {
            call.reject("Missing app");
            return;
        }

        getContext()
            .getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(keyForApp(app), blocked)
            .apply();

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getBlocked(PluginCall call) {
        String app = call.getString("app");
        if (app == null || app.trim().isEmpty()) {
            call.reject("Missing app");
            return;
        }

        boolean blocked = getContext()
            .getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            .getBoolean(keyForApp(app), false);

        JSObject ret = new JSObject();
        ret.put("app", app);
        ret.put("blocked", blocked);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Context ctx = getContext();
        try {
            // API 31+: opens this app's accessibility detail screen (clearer for users).
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent details = new Intent(ACTION_ACCESSIBILITY_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", ctx.getPackageName(), null);
                details.setData(uri);
                details.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(details);
            } else {
                Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
            }
        } catch (Exception e) {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    /**
     * True if LimitScroll's accessibility service is enabled in system settings.
     */
    private boolean isOurAccessibilityServiceEnabledInternal() {
        Context ctx = getContext();
        String pkg = ctx.getPackageName();
        String serviceClassName = ShortsBlockerAccessibilityService.class.getName();
        ComponentName cn = new ComponentName(pkg, serviceClassName);
        String flat = cn.flattenToString();
        String flatShort = cn.flattenToShortString();

        // Prefer Secure settings first: some OEMs return incomplete lists from AccessibilityManager.
        String enabled =
            Settings.Secure.getString(ctx.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabled != null && !enabled.isEmpty()) {
            String enabledLower = enabled.toLowerCase();
            String pkgLower = pkg.toLowerCase();
            if (enabledLower.contains(flat.toLowerCase()) || enabledLower.contains(flatShort.toLowerCase())) {
                return true;
            }
            for (String piece : enabled.split(":")) {
                String token = piece.trim();
                if (token.isEmpty()) continue;
                String t = token.toLowerCase();
                if (t.equalsIgnoreCase(flat) || t.equalsIgnoreCase(flatShort)) {
                    return true;
                }
                if (t.contains(pkgLower)
                    && (t.contains("shortsblockeraccessibilityservice")
                        || t.endsWith("/.shortsblockeraccessibilityservice"))) {
                    return true;
                }
            }
        }

        try {
            AccessibilityManager am = (AccessibilityManager) ctx.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am != null && am.isEnabled()) {
                int feedback =
                    AccessibilityServiceInfo.FEEDBACK_GENERIC
                        | AccessibilityServiceInfo.FEEDBACK_AUDIBLE
                        | AccessibilityServiceInfo.FEEDBACK_HAPTIC
                        | AccessibilityServiceInfo.FEEDBACK_SPOKEN
                        | AccessibilityServiceInfo.FEEDBACK_VISUAL;
                List<AccessibilityServiceInfo> list = am.getEnabledAccessibilityServiceList(feedback);
                if (list != null) {
                    for (AccessibilityServiceInfo info : list) {
                        ResolveInfo ri = info.getResolveInfo();
                        if (ri != null && ri.serviceInfo != null) {
                            if (pkg.equals(ri.serviceInfo.packageName)
                                && serviceClassName.equals(ri.serviceInfo.name)) {
                                return true;
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // Already tried Secure scan above.
        }

        return false;
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        boolean on = isOurAccessibilityServiceEnabledInternal();
        JSObject ret = new JSObject();
        ret.put("enabled", on);
        call.resolve(ret);
    }

    /**
     * Lit et remet à zéro les compteurs de vues détectées en natif (scroll TikTok / IG / YouTube).
     * Le WebView appelle ensuite POST /api/views/consume pour chaque unité.
     */
    @PluginMethod
    public void consumePendingViewSignals(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        JSObject counts = new JSObject();
        SharedPreferences.Editor ed = prefs.edit();
        String[] apps = new String[] { "tiktok", "instagram", "youtube" };
        for (String app : apps) {
            String key = PENDING_VIEWS_PREFIX + app;
            int n = prefs.getInt(key, 0);
            counts.put(app, n);
            ed.putInt(key, 0);
        }
        ed.apply();
        JSObject ret = new JSObject();
        ret.put("counts", counts);
        call.resolve(ret);
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String app = call.getString("app");
        if (app == null || app.trim().isEmpty()) {
            call.reject("Missing app");
            return;
        }
        String key = app.trim().toLowerCase(Locale.ROOT);
        try {
            PackageManager pm = getContext().getPackageManager();

            if ("tiktok".equals(key)) {
                for (String pkg : TIKTOK_PACKAGES) {
                    Intent launchIntent = pm.getLaunchIntentForPackage(pkg);
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(launchIntent);
                        JSObject ret = new JSObject();
                        ret.put("ok", true);
                        ret.put("installed", true);
                        ret.put("app", app);
                        ret.put("packageUsed", pkg);
                        call.resolve(ret);
                        return;
                    }
                }
                JSObject ret = new JSObject();
                ret.put("ok", false);
                ret.put("installed", false);
                ret.put("app", app);
                call.resolve(ret);
                return;
            }

            String packageName = packageForApp(app);
            if (packageName.isEmpty()) {
                call.reject("Unsupported app");
                return;
            }
            Intent launchIntent = pm.getLaunchIntentForPackage(packageName);
            if (launchIntent == null) {
                JSObject ret = new JSObject();
                ret.put("ok", false);
                ret.put("installed", false);
                ret.put("app", app);
                call.resolve(ret);
                return;
            }
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(launchIntent);
            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("installed", true);
            ret.put("app", app);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open app: " + e.getMessage());
        }
    }
}
