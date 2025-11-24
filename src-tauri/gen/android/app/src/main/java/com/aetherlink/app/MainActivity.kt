package com.aetherlink.app

import android.os.Build
import android.os.Bundle
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
 * 
 * 参考：
 * - Capacitor EdgeToEdge 插件实现
 * - Android Edge-to-Edge 官方指南
 * - rikkahub 项目的沉浸式设计
 */
class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 🚀 启用 Edge-to-Edge 模式（官方推荐的一行代码方案）
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // 🔧 Android 10+ 禁用导航栏对比度保护（移除白色遮罩）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }

        // ⌨️ 处理软键盘显示/隐藏（Edge-to-Edge 模式必需）
        setupKeyboardInsets()

        // ⚡ 启用高刷新率支持
        setupHighRefreshRate()

        // 🎨 设置系统栏图标颜色（根据主题自适应）
        setupSystemBarAppearance()
    }

    /**
     * 处理软键盘的 WindowInsets
     * 
     * 关键：在 Edge-to-Edge 模式下，adjustResize 失效，必须手动监听键盘 insets
     * 
     * 参考：
     * - https://stackoverflow.com/questions/68003131/soft-input-adjust-resize-deprecated-starting-android-30
     * - Android 官方文档：WindowInsetsCompat
     */
    private fun setupKeyboardInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { view, windowInsets ->
            // 获取键盘（IME）的高度
            val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
            val imeHeight = imeInsets.bottom
            
            // 获取导航栏的高度（避免重复计算）
            val navInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars())
            val navHeight = navInsets.bottom
            
            // 设置底部 padding = 键盘高度 - 导航栏高度（避免双重间距）
            val bottomPadding = maxOf(0, imeHeight - navHeight)
            view.setPadding(0, 0, 0, bottomPadding)
            
            // 返回 insets，让子 View 也能接收到
            windowInsets
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