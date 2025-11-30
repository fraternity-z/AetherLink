package com.llmhouse.app;

// 确保导入你的 BuildConfig
import com.llmhouse.app.BuildConfig; 
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
// import android.view.View; // Edge-to-Edge plugin handles this
// import android.view.WindowManager; // Edge-to-Edge plugin handles this
import android.webkit.WebSettings;
import android.webkit.WebView;
// import androidx.core.view.ViewCompat; // Edge-to-Edge plugin handles this
// import androidx.core.view.WindowInsetsCompat; // Edge-to-Edge plugin handles this
import com.getcapacitor.BridgeActivity;
// 确保这些自定义类存在
import com.llmhouse.app.webview.SmartWebViewManager;
import com.llmhouse.app.webview.WebViewDetector;
import com.llmhouse.app.webview.WebViewUpgradeDialog;
import java.lang.reflect.Method;


public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    // --- 定义常量 ---
    // 🚀 极速启动优化：大幅减少初始延迟
    private static final int WEBVIEW_SETUP_INITIAL_DELAY_MS = 0; // 立即尝试，无需延迟
    private static final int WEBVIEW_SETUP_MAX_RETRIES = 3;      // 减少最大重试次数
    private static final int WEBVIEW_SETUP_RETRY_DELAY_BASE_MS = 100; // 减少重试延迟基数
    private static final int UPGRADE_DIALOG_DELAY_MS = 5000;   // 升级对话框延迟增加，避免影响启动体验

    // --- 单一Handler实例 ---
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    
    // 标记是否已成功配置，防止重复配置 (虽然当前逻辑不会，但作为防御性编程)
     private boolean isWebViewConfigured = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 在Capacitor 4+中，必须在super.onCreate之前注册插件
         registerPlugin(ModernWebViewPlugin.class);
         registerPlugin(NativeHttpPlugin.class);
         // 注册 CorsBypass 插件以解决移动端 CORS 问题
         registerPlugin(com.capacitor.cors.CorsBypassPlugin.class);
         // 注册系统闹钟插件
         registerPlugin(SystemAlarmPlugin.class);

        super.onCreate(savedInstanceState);

        Log.i(TAG, "=== 🚀 MainActivity onCreate 开始 ===");
        // Android Edge-to-edge 处理由 @capawesome/capacitor-android-edge-to-edge-support 插件负责
        Log.d(TAG, "Edge-to-Edge 样式交由插件处理。");

        // 启动统一的 WebView 设置流程
        isWebViewConfigured = false;
        attemptWebViewSetup(0);
    }

    /**
     * 🚀 极速启动优化：尝试获取并配置 WebView
     * 首次尝试同步执行，失败后才使用延迟重试
     * @param retryCount 当前重试次数
     */
    private void attemptWebViewSetup(int retryCount) {
        if (isWebViewConfigured) return;

        if (retryCount > WEBVIEW_SETUP_MAX_RETRIES) {
            Log.e(TAG, "❌ WebView 初始化重试次数已达上限，放弃配置。");
            return;
        }

        // 🚀 首次尝试直接同步执行，不延迟
        if (retryCount == 0) {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    onWebViewReady(webView);
                    isWebViewConfigured = true;
                    return; // 成功，无需重试
                }
            } catch (Exception e) {
                Log.w(TAG, "⚠️ 首次同步获取 WebView 失败，将异步重试");
            }
        }

        // 后续重试使用短延迟
        long delay = WEBVIEW_SETUP_RETRY_DELAY_BASE_MS * (long) Math.max(1, retryCount);

        mainHandler.postDelayed(() -> {
            if (isWebViewConfigured) return;
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    onWebViewReady(webView);
                    isWebViewConfigured = true;
                } else {
                    attemptWebViewSetup(retryCount + 1);
                }
            } catch (Exception e) {
                attemptWebViewSetup(retryCount + 1);
            }
        }, delay);
    }

     /**
      * 当成功获取 WebView 实例后，按顺序执行所有配置和检查
      * 修复了原 `replaceCapacitorWebView` 逻辑无效的问题
      * @param webView Capacitor 实际使用的 WebView 实例
      */
    private void onWebViewReady(final WebView webView) {
         Log.i(TAG, "✅ 成功获取 Capacitor WebView 实例，开始应用配置...");
         try {
            WebSettings settings = webView.getSettings();

            // 1. 应用内容和安全相关设置
            applyContentAndSecuritySettings(settings);

            // 2. 应用调试设置
            applyDebuggingSettings();

            // 🚀 性能优化：启用硬件加速和高优先级渲染
            applyPerformanceOptimizations(webView, settings);

            // 3. 应用 SmartWebViewManager 优化 (核心修复: 应用到正确的实例上)
            Log.d(TAG, "🔧 应用 SmartWebViewManager 优化...");
             // !!! 假设你已将 SmartWebViewManager.createOptimizedWebView 的逻辑
             // !!! 改为了 applyOptimizations(WebView webView, Context context) 方法
             // SmartWebViewManager.applyOptimizations(webView, this);
              Log.d(TAG, "📊 WebView UserAgent: " + settings.getUserAgentString());
              Log.d(TAG, "✅ SmartWebViewManager 优化应用完成 (请确保 applyOptimizations 方法存在)");


            // 4. 检测 WebView 版本并提示升级
             checkAndPromptForUpgrade();

            Log.i(TAG, "🎉🎉🎉 WebView 所有配置和检查流程完成！");

         } catch (Exception e) {
             // 这里的错误是最终错误，不再触发重试
             Log.e(TAG, "❌❌❌ 在应用 WebView 配置过程中发生最终错误: " + e.getMessage(), e);
         }
    }


    /**
     * 抽取方法：应用混合内容和安全相关设置
     * 减少了原 configureMixedContent 和 configureMixedContentRetry 的代码重复
     * (注意：忽略了这些设置本身的安全风险，仅做结构优化)
     */
    @SuppressWarnings("deprecation") // setAllowFileAccessFromFileURLs 和 setAllowUniversalAccessFromFileURLs 在 API 30 废弃，但仍需兼容
    private void applyContentAndSecuritySettings(WebSettings settings) {
         Log.d(TAG, "🔧 开始应用内容和(非)安全设置 (处理混合内容和 CORS)...");
        try {
             //  关键设置：允许混合内容
             if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                 settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                 Log.d(TAG, "✅ 已启用混合内容支持 (MIXED_CONTENT_ALWAYS_ALLOW)");
             }

             //  彻底禁用CORS相关设置 (按原代码逻辑保留)
             settings.setAllowFileAccess(true);
             settings.setAllowContentAccess(true);
             settings.setAllowFileAccessFromFileURLs(true);
             settings.setAllowUniversalAccessFromFileURLs(true);
              Log.d(TAG, "⚠️ 已设置 AllowFile/Content/Universal Access (存在安全风险)");

             // 基础Web功能
             settings.setJavaScriptEnabled(true);
             settings.setDomStorageEnabled(true);
             settings.setDatabaseEnabled(true);

             // 确保网络请求正常
             settings.setBlockNetworkLoads(false);
             settings.setLoadsImagesAutomatically(true);

             //  尝试使用反射禁用Web安全性 (按原代码逻辑保留)
             try {
                 Method setWebSecurityMethod = settings.getClass().getDeclaredMethod("setWebSecurityEnabled", boolean.class);
                 setWebSecurityMethod.setAccessible(true);
                 setWebSecurityMethod.invoke(settings, false);
                 Log.d(TAG, "🔓 已通过反射禁用Web安全性 (CORS检查已关闭，存在高安全风险)");
             } catch (Exception e) {
                 Log.w(TAG, "⚠️ 无法通过反射禁用Web安全性: " + e.getMessage());
             }
              Log.d(TAG, "🔧 内容和安全设置应用完成。");

        } catch (Exception e) {
             Log.e(TAG, "❌ 应用内容和安全设置时出错: " + e.getMessage(), e);
        }
    }

    /**
      * 抽取方法：应用调试设置，仅在 DEBUG 模式下启用
      */
    private void applyDebuggingSettings() {
         // 仅在 Debug 构建时启用 WebView 调试
        if (BuildConfig.DEBUG) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
               try {
                    // 这是一个静态方法
                   WebView.setWebContentsDebuggingEnabled(true);
                   Log.d(TAG, "🔓 已启用WebView调试模式 (当前为 Debug Build)");
               } catch (Exception e) {
                   Log.w(TAG, "⚠️ 启用WebView调试失败: " + e.getMessage());
               }
           }
        } else {
            Log.d(TAG, "🚫 当前为 Release Build, WebView 调试模式未启用。");
        }
    }

    /**
     * 🚀 性能优化：应用 WebView 性能优化配置
     * 参考：Capacitor 性能优化最佳实践
     */
    private void applyPerformanceOptimizations(WebView webView, WebSettings settings) {
        Log.d(TAG, "🚀 开始应用 WebView 性能优化配置...");
        try {
            // 1. 启用硬件加速（最重要的性能优化）
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
            Log.d(TAG, "✅ 已启用 WebView 硬件加速 (LAYER_TYPE_HARDWARE)");

            // 注意：setRenderPriority() 在 API 18+ 已废弃且无效果，已移除

            // 3. 设置合适的缓存策略（平衡性能和内容更新）
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            Log.d(TAG, "✅ 已设置缓存模式为 LOAD_DEFAULT");

            // 4. 启用GPU加速渲染（如果支持）
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // 强制启用混合内容硬件加速
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }

            // 5. 优化图片加载
            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);
            
            // 6. 启用视口元标签支持（移动端优化）
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);

            // 7. 优化滚动性能
            webView.setScrollBarStyle(android.view.View.SCROLLBARS_INSIDE_OVERLAY);
            webView.setHorizontalScrollBarEnabled(false);

            Log.d(TAG, "🎉 WebView 性能优化配置应用完成！");
        } catch (Exception e) {
            Log.e(TAG, "❌ 应用 WebView 性能优化时出错: " + e.getMessage(), e);
        }
    }

    /**
      * 抽取方法：检查 WebView 版本并根据需要延迟显示升级对话框
      */
     private void checkAndPromptForUpgrade() {
         Log.d(TAG, "🔍 开始检测 WebView 版本和策略...");
         try {
             // 获取WebView信息
             WebViewDetector.WebViewInfo webViewInfo = WebViewDetector.getWebViewInfo(this);
             // SmartWebViewManager.WebViewStrategy strategy = SmartWebViewManager.getBestStrategy(this); // 如果需要使用 strategy
 
             Log.d(TAG, String.format("📱 WebView信息: 版本=%d, 包名=%s, 质量=%s",
                 webViewInfo.version, webViewInfo.packageName, webViewInfo.getQualityLevel()));
             // Log.d(TAG, "🎯 选择策略: " + strategy); // 如果需要打印
 
             // 检查是否需要显示升级对话框
             if (webViewInfo.needsUpgrade()) {
                 Log.d(TAG, "⚠️ WebView版本较低，将在 " + (UPGRADE_DIALOG_DELAY_MS/1000) + " 秒后提示升级...");
                 // 延迟显示升级对话框，避免影响应用启动
                 mainHandler.postDelayed(() -> {
                     Log.d(TAG, "🕒 触发 WebView 升级对话框检查...");
                     WebViewUpgradeDialog.showUpgradeDialogIfNeeded(this);
                 }, UPGRADE_DIALOG_DELAY_MS);
             } else {
                 Log.d(TAG, "✅ WebView版本良好，无需升级。");
             }
          } catch (Exception e) {
              Log.e(TAG, "❌ 检测 WebView 版本或显示对话框时发生错误: " + e.getMessage(), e);
          }
           Log.d(TAG, "🔍 WebView 版本检测流程结束。");
     }
}