package com.limitscroll.app;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private static final long SPLASH_MIN_MS = 500L;
    private static final long SPLASH_MAX_MS = 4000L;

    private boolean keepNativeSplash = true;
    private long splashStartMs;
    private boolean nativeSplashDismissScheduled;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        splashStartMs = System.currentTimeMillis();
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        registerPlugin(ReelBlockerPlugin.class);
        super.onCreate(savedInstanceState);
        splashScreen.setKeepOnScreenCondition(() -> keepNativeSplash);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(Color.parseColor("#000000"));
        }

        if (getBridge() != null) {
            getBridge()
                .addWebViewListener(
                    new WebViewListener() {
                        @Override
                        public void onPageLoaded(WebView view) {
                            scheduleNativeSplashDismiss();
                        }
                    }
                );
        } else {
            scheduleNativeSplashDismiss();
        }

        new Handler(Looper.getMainLooper())
            .postDelayed(
                () -> {
                    if (keepNativeSplash) {
                        keepNativeSplash = false;
                    }
                },
                SPLASH_MAX_MS
            );
    }

    private void scheduleNativeSplashDismiss() {
        if (nativeSplashDismissScheduled) {
            return;
        }
        nativeSplashDismissScheduled = true;
        long elapsed = System.currentTimeMillis() - splashStartMs;
        long remaining = Math.max(0L, SPLASH_MIN_MS - elapsed);
        new Handler(Looper.getMainLooper())
            .postDelayed(() -> keepNativeSplash = false, remaining);
    }
}
