package com.aetherlink.app

import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * AetherLink MainActivity - Rikkahub 风格沉浸式体验
 * 
 * 核心特性：
 * 1. Edge-to-Edge 模式 - 内容延伸到系统栏后面
 * 2. 完全透明系统栏 - 实现壁纸沉浸式体验
 * 3. 图标颜色自适应 - 根据主题自动切换深色/浅色图标
 * 4. 高刷新率支持 - 自动适配设备最高刷新率
 * 5. CSS 安全区域注入 - 将系统栏 insets 注入到 WebView CSS 变量
 * 
 * 参考：
 * - Capacitor EdgeToEdge 插件实现
 * - Android Edge-to-Edge 官方指南
 * - rikkahub 项目的沉浸式设计
 */
class MainActivity : TauriActivity() {
    private val mainHandler = Handler(Looper.getMainLooper())
    private var webView: WebView? = null
    
    // 缓存最新的安全区域值，用于 WebView 加载完成后注入
    private var cachedInsets = SafeAreaInsets(0, 0, 0, 0)
    
    data class SafeAreaInsets(val top: Int, val right: Int, val bottom: Int, val left: Int)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 🚀 启用 Edge-to-Edge 模式（官方推荐的一行代码方案）
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // 🔧 Android 10+ 禁用导航栏对比度保护（移除白色遮罩）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }

        // ⌨️ 处理软键盘和系统栏 insets（Edge-to-Edge 模式必需）
        setupWindowInsets()

        // ⚡ 启用高刷新率支持
        setupHighRefreshRate()

        // 🎨 设置系统栏图标颜色（根据主题自适应）
        setupSystemBarAppearance()
        
        // 📱 获取 WebView 并注入安全区域
        findWebViewAndInjectSafeArea()
    }
    
    /**
     * 查找 Tauri WebView 并注入安全区域
     * 需要延迟执行，因为 WebView 可能还没准备好
     */
    private fun findWebViewAndInjectSafeArea() {
        mainHandler.postDelayed({
            webView = findWebView(window.decorView)
            if (webView != null) {
                println("[MainActivity] ✅ 找到 WebView，开始周期性注入安全区域")
                // 立即注入一次
                injectSafeAreaToWebView(cachedInsets)
                // 启动周期性注入，确保页面加载完成后也能生效
                startPeriodicInjection()
            } else {
                println("[MainActivity] ⚠️ 未找到 WebView，500ms 后重试...")
                findWebViewAndInjectSafeArea()
            }
        }, 500)
    }

    /**
     * 周期性注入安全区域
     * 持续 10 秒，每 500ms 注入一次，覆盖页面加载过程
     */
    private fun startPeriodicInjection() {
        val runnable = object : Runnable {
            var count = 0
            override fun run() {
                if (count < 20) { // 20 * 500ms = 10秒
                    if (webView != null) {
                        // 仅在 insets 有效时注入
                        if (cachedInsets.top > 0 || cachedInsets.bottom > 0) {
                            injectSafeAreaToWebView(cachedInsets)
                        }
                    }
                    count++
                    mainHandler.postDelayed(this, 500)
                }
            }
        }
        mainHandler.post(runnable)
    }
    
    /**
     * 递归查找 WebView
     */
    private fun findWebView(view: android.view.View): WebView? {
        if (view is WebView) return view
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val found = findWebView(view.getChildAt(i))
                if (found != null) return found
            }
        }
        return null
    }

    /**
     * 处理 Window Insets（系统栏 + 键盘）
     * 
     * 关键功能：
     * 1. 获取系统栏安全区域（状态栏、导航栏）
     * 2. 将安全区域注入到 WebView CSS 变量
     * 3. 处理键盘弹出时的布局调整
     */
    private fun setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { view, windowInsets ->
            // 获取系统栏 insets
            val systemBarsInsets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            val statusBarHeight = systemBarsInsets.top
            val navBarHeight = systemBarsInsets.bottom
            
            // 获取键盘（IME）的高度
            val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
            val imeHeight = imeInsets.bottom
            val isKeyboardVisible = imeHeight > 0
            
            // 缓存安全区域值
            cachedInsets = SafeAreaInsets(
                top = statusBarHeight,
                right = systemBarsInsets.right,
                bottom = navBarHeight,
                left = systemBarsInsets.left
            )
            
            println("[MainActivity] 📏 系统栏 Insets: top=$statusBarHeight, bottom=$navBarHeight, keyboard=$imeHeight")
            
            // 注入安全区域到 WebView
            injectSafeAreaToWebView(cachedInsets, isKeyboardVisible, imeHeight)
            
            // 设置底部 padding（键盘显示时）
            val bottomPadding = if (isKeyboardVisible) maxOf(0, imeHeight - navBarHeight) else 0
            view.setPadding(0, 0, 0, bottomPadding)
            
            // 返回 insets，让子 View 也能接收到
            windowInsets
        }
    }
    
    /**
     * 将安全区域注入到 WebView CSS 变量
     * 这是解决 Tauri WebView 不支持 env(safe-area-inset-*) 的关键
     */
    private fun injectSafeAreaToWebView(
        insets: SafeAreaInsets, 
        isKeyboardVisible: Boolean = false,
        keyboardHeight: Int = 0
    ) {
        webView?.let { wv ->
            val density = resources.displayMetrics.density
            val topPx = insets.top / density
            val rightPx = insets.right / density
            val bottomPx = insets.bottom / density
            val leftPx = insets.left / density
            val keyboardPx = keyboardHeight / density
            
            // 注入 CSS 变量到 document.documentElement
            val jsCode = """
                (function() {
                    var style = document.documentElement.style;
                    
                    // 系统安全区域（模拟 env(safe-area-inset-*)）
                    style.setProperty('--safe-area-inset-top', '${topPx}px');
                    style.setProperty('--safe-area-inset-right', '${rightPx}px');
                    style.setProperty('--safe-area-inset-bottom', '${bottomPx}px');
                    style.setProperty('--safe-area-inset-left', '${leftPx}px');
                    
                    // 兼容项目现有的 CSS 变量
                    style.setProperty('--safe-area-top', '${topPx}px');
                    style.setProperty('--safe-area-right', '${rightPx}px');
                    style.setProperty('--safe-area-bottom', '${bottomPx}px');
                    style.setProperty('--safe-area-left', '${leftPx}px');
                    
                    // 计算后的底部安全区域（统一值）
                    var computedBottom = Math.max(${bottomPx}, 48);
                    style.setProperty('--safe-area-bottom-computed', computedBottom + 'px');
                    style.setProperty('--safe-area-bottom-min', '48px');
                    style.setProperty('--content-bottom-padding', (computedBottom + 16) + 'px');
                    
                    // 键盘状态
                    style.setProperty('--keyboard-height', '${keyboardPx}px');
                    style.setProperty('--keyboard-visible', '${if (isKeyboardVisible) "1" else "0"}');
                    
                    // 触发自定义事件，通知 JS 层安全区域已更新
                    window.dispatchEvent(new CustomEvent('safeAreaChanged', {
                        detail: {
                            top: ${topPx},
                            right: ${rightPx},
                            bottom: ${bottomPx},
                            left: ${leftPx},
                            keyboardHeight: ${keyboardPx},
                            keyboardVisible: ${isKeyboardVisible}
                        }
                    }));
                    
                    console.log('[EdgeToEdge] Safe area injected: top=${topPx}px, bottom=${bottomPx}px, keyboard=${keyboardPx}px');
                })();
            """.trimIndent()
            
            wv.evaluateJavascript(jsCode, null)
        }
    }

    /**
     * 启用高刷新率支持
     * 自动适配设备支持的最高刷新率（90Hz/120Hz/144Hz）
     */
    private fun setupHighRefreshRate() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+: 使用 Display Mode API
                val display = display
                val supportedModes = display?.supportedModes
                supportedModes?.let { modes ->
                    val highestRefreshRateMode = modes.maxByOrNull { it.refreshRate }
                    highestRefreshRateMode?.let { mode ->
                        val layoutParams = window.attributes
                        layoutParams.preferredDisplayModeId = mode.modeId
                        window.attributes = layoutParams
                        println("[MainActivity] ✅ 已启用高刷新率: ${mode.refreshRate}Hz")
                    }
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Android 6-10: 使用 Preferred Refresh Rate API
                @Suppress("DEPRECATION")
                val display = windowManager.defaultDisplay
                @Suppress("DEPRECATION")
                val supportedRefreshRates = display.supportedRefreshRates
                val maxRefreshRate = supportedRefreshRates.maxOrNull()
                maxRefreshRate?.let { rate ->
                    val layoutParams = window.attributes
                    layoutParams.preferredRefreshRate = rate
                    window.attributes = layoutParams
                    println("[MainActivity] ✅ 已启用高刷新率: ${rate}Hz")
                }
            }
        } catch (e: Exception) {
            println("[MainActivity] ⚠️ 启用高刷新率失败: ${e.message}")
        }
    }

    /**
     * 设置系统栏图标颜色（根据主题自适应）
     * 
     * 注意：系统栏的透明颜色已在 themes.xml 中配置，这里只负责设置图标颜色
     * 
     * 图标颜色规则：
     * - 深色主题 → 浅色图标（白色）isAppearanceLight = false
     * - 浅色主题 → 深色图标（黑色）isAppearanceLight = true
     */
    private fun setupSystemBarAppearance() {
        // 检测系统主题模式
        val isDarkTheme = (resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES

        // 获取窗口控制器
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)

        // 根据主题设置图标颜色
        windowInsetsController?.apply {
            isAppearanceLightStatusBars = !isDarkTheme
            isAppearanceLightNavigationBars = !isDarkTheme
        }
    }
}