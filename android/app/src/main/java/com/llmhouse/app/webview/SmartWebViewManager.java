package com.llmhouse.app.webview;

import android.content.Context;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

/**
 * 智能WebView管理器
 * 根据设备和WebView版本提供最佳配置
 */
public class SmartWebViewManager {
    private static final String TAG = "SmartWebViewManager";

    /**
     * WebView策略枚举
     */
    public enum WebViewStrategy {
        OPTIMAL,           // 使用最优配置
        COMPATIBLE,        // 兼容模式
        BASIC,            // 基础模式
        UPGRADE_REQUIRED   // 需要升级
    }

    /**
     * 设备信息类
     */
    public static class DeviceInfo {
        public final int androidVersion;
        public final long availableMemory;
        public final boolean isLowEndDevice;
        public final boolean isWifiConnected;

        public DeviceInfo(int androidVersion, long availableMemory,
                         boolean isLowEndDevice, boolean isWifiConnected) {
            this.androidVersion = androidVersion;
            this.availableMemory = availableMemory;
            this.isLowEndDevice = isLowEndDevice;
            this.isWifiConnected = isWifiConnected;
        }
    }

    /**
     * 获取最佳WebView策略
     */
    public static WebViewStrategy getBestStrategy(Context context) {
        try {
            WebViewDetector.WebViewInfo webViewInfo = WebViewDetector.getWebViewInfo(context);
            DeviceInfo deviceInfo = getDeviceInfo(context);

            return selectStrategy(webViewInfo, deviceInfo);
        } catch (Exception e) {
            Log.e(TAG, "获取WebView策略时发生错误: " + e.getMessage(), e);
            return WebViewStrategy.BASIC;
        }
    }

    /**
     * 选择最佳策略
     */
    private static WebViewStrategy selectStrategy(WebViewDetector.WebViewInfo webViewInfo,
                                                DeviceInfo deviceInfo) {

        Log.d(TAG, String.format("策略选择: WebView版本=%d, Android版本=%d, 低端设备=%b",
            webViewInfo.version, deviceInfo.androidVersion, deviceInfo.isLowEndDevice));

        // 版本太低，强烈建议升级
        if (webViewInfo.version < 60) {
            return WebViewStrategy.UPGRADE_REQUIRED;
        }

        // 现代版本，使用最优配置
        if (webViewInfo.version >= WebViewDetector.OPTIMAL_VERSION &&
            !deviceInfo.isLowEndDevice) {
            return WebViewStrategy.OPTIMAL;
        }

        // 良好版本，使用兼容配置
        if (webViewInfo.version >= WebViewDetector.MIN_RECOMMENDED_VERSION) {
            return WebViewStrategy.COMPATIBLE;
        }

        // 基础版本，使用基础配置
        return WebViewStrategy.BASIC;
    }

    /**
     * 创建优化的WebView
     */
    public static WebView createOptimizedWebView(Context context) {
        WebView webView = new WebView(context);
        WebViewStrategy strategy = getBestStrategy(context);

        configureWebView(webView, strategy);

        Log.d(TAG, "创建WebView完成，使用策略: " + strategy);
        return webView;
    }

    /**
     * 配置WebView
     */
    private static void configureWebView(WebView webView, WebViewStrategy strategy) {
        WebSettings settings = webView.getSettings();

        // 基础配置
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // setAppCacheEnabled已在API 33中废弃，现代浏览器使用Service Worker

        switch (strategy) {
            case OPTIMAL:
                configureOptimalSettings(settings);
                break;
            case COMPATIBLE:
                configureCompatibleSettings(settings);
                break;
            case BASIC:
                configureBasicSettings(settings);
                break;
            case UPGRADE_REQUIRED:
                configureMinimalSettings(settings);
                break;
        }
    }

    /**
     * 最优配置 - 适用于现代WebView
     * 🚀 性能优化：包含所有推荐的性能配置
     */
    private static void configureOptimalSettings(WebSettings settings) {
        Log.d(TAG, "应用最优WebView配置");

        // 🚀 性能优化：核心配置
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // 🚀 图片加载优化
        settings.setLoadsImagesAutomatically(true);
        settings.setBlockNetworkImage(false);
        
        // 🚀 视口优化（移动端性能关键）
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // 现代特性
        if (WebViewFeature.isFeatureSupported(WebViewFeature.OFF_SCREEN_PRERASTER)) {
            WebSettingsCompat.setOffscreenPreRaster(settings, true);
            Log.d(TAG, "✅ 已启用离屏预渲染");
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(settings, true);
            Log.d(TAG, "✅ 已启用安全浏览");
        }

        // 注意：硬件加速通过 WebView.setLayerType() 设置，不是通过 WebSettings
        // 在 MainActivity 的 applyPerformanceOptimizations 中已设置

        // 支持多窗口
        settings.setSupportMultipleWindows(false); // 安全考虑
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        // 缩放支持
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        
        Log.d(TAG, "🎉 最优配置应用完成");
    }

    /**
     * 兼容配置 - 适用于较新WebView
     */
    private static void configureCompatibleSettings(WebSettings settings) {
        Log.d(TAG, "应用兼容WebView配置");

        // 基本性能优化
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 安全设置
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        // 基础缩放支持
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // 禁用一些可能有问题的特性
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
    }

    /**
     * 基础配置 - 适用于老版本WebView
     */
    private static void configureBasicSettings(WebSettings settings) {
        Log.d(TAG, "应用基础WebView配置");

        // 保守的缓存策略
        settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);

        // 安全优先
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        // 禁用可能有问题的特性
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportZoom(false);
    }

    /**
     * 最小配置 - 适用于需要升级的WebView
     */
    private static void configureMinimalSettings(WebSettings settings) {
        Log.d(TAG, "应用最小WebView配置");

        // 最保守的设置
        settings.setCacheMode(WebSettings.LOAD_CACHE_ONLY);

        // 严格安全设置
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        // 禁用所有高级特性
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
    }

    /**
     * 获取设备信息
     */
    private static DeviceInfo getDeviceInfo(Context context) {
        try {
            int androidVersion = android.os.Build.VERSION.SDK_INT;

            // 获取可用内存
            android.app.ActivityManager activityManager =
                (android.app.ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            android.app.ActivityManager.MemoryInfo memoryInfo =
                new android.app.ActivityManager.MemoryInfo();
            activityManager.getMemoryInfo(memoryInfo);
            long availableMemory = memoryInfo.availMem;

            // 判断是否为低端设备
            boolean isLowEndDevice = activityManager.isLowRamDevice() ||
                                   (memoryInfo.totalMem < 2L * 1024 * 1024 * 1024); // 小于2GB

            // 检查网络连接（简化版）
            boolean isWifiConnected = true; // 这里可以添加实际的网络检测逻辑

            return new DeviceInfo(androidVersion, availableMemory, isLowEndDevice, isWifiConnected);
        } catch (Exception e) {
            Log.w(TAG, "获取设备信息时发生错误: " + e.getMessage());
            return new DeviceInfo(android.os.Build.VERSION.SDK_INT, 0, false, true);
        }
    }

    /**
     * 获取WebView状态描述
     */
    public static String getWebViewStatusDescription(Context context) {
        WebViewDetector.WebViewInfo info = WebViewDetector.getWebViewInfo(context);
        WebViewStrategy strategy = getBestStrategy(context);

        return String.format("WebView版本: %d (%s)\n策略: %s\n建议: %s",
            info.version,
            info.getQualityLevel(),
            getStrategyDescription(strategy),
            WebViewDetector.getUpgradeRecommendation(info));
    }

    /**
     * 获取策略描述
     */
    private static String getStrategyDescription(WebViewStrategy strategy) {
        switch (strategy) {
            case OPTIMAL: return "最优模式";
            case COMPATIBLE: return "兼容模式";
            case BASIC: return "基础模式";
            case UPGRADE_REQUIRED: return "需要升级";
            default: return "未知";
        }
    }
}
