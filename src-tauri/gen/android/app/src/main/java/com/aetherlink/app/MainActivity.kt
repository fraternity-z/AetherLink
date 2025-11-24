package com.aetherlink.app

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

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

        // 启用 Edge-to-Edge 模式
        setupEdgeToEdge()

        // 启用高刷新率支持
        setupHighRefreshRate()

        // 设置透明系统栏 + 图标颜色自适应
        setupTransparentSystemBars()
    }

    /**
     * 启用 Edge-to-Edge 模式
     * 让内容延伸到状态栏和导航栏后面，实现完全沉浸式体验
     */
    private fun setupEdgeToEdge() {
        // 启用 Edge-to-Edge 布局
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // 确保内容可以绘制到系统栏后面
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+: 使用新 API
            window.setDecorFitsSystemWindows(false)
        } else {
            // Android 10 及以下: 使用兼容 API
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            )
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
     * 设置完全透明的系统栏 + 图标颜色自适应
     * 
     * 实现要点：
     * 1. 状态栏和导航栏设置为完全透明（Color.TRANSPARENT）
     * 2. 图标颜色根据系统主题自动切换：
     *    - 深色主题 → 浅色图标（isAppearanceLight = false）
     *    - 浅色主题 → 深色图标（isAppearanceLight = true）
     * 3. 背景色由页面内容决定，支持壁纸沉浸式体验
     * 
     * 参考 Capacitor EdgeToEdge 实现：
     * - EdgeToEdge.setTransparentSystemBars({ statusBar: true, navigationBar: true })
     * - EdgeToEdge.setSystemBarAppearance({ statusBarStyle: 'light/dark' })
     */
    private fun setupTransparentSystemBars() {
        try {
            // 检测系统主题模式
            val isDarkTheme = (resources.configuration.uiMode and
                android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
                android.content.res.Configuration.UI_MODE_NIGHT_YES

            // 设置完全透明的系统栏（关键！）
            window.statusBarColor = Color.TRANSPARENT
            window.navigationBarColor = Color.TRANSPARENT

            // 确保导航栏在 Android 8.0+ 上也透明
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                window.navigationBarColor = Color.TRANSPARENT
                // Android 8.0+ 支持导航栏浅色/深色图标切换
            }

            // 获取窗口控制器用于设置图标颜色
            val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)

            // 根据主题设置图标颜色（与 Capacitor 版本完全一致）
            // 深色主题 → 浅色图标（白色），浅色主题 → 深色图标（黑色）
            if (isDarkTheme) {
                // 深色主题：使用浅色图标
                windowInsetsController?.isAppearanceLightStatusBars = false
                windowInsetsController?.isAppearanceLightNavigationBars = false
                println("[MainActivity] 深色主题 - 使用浅色图标")
            } else {
                // 浅色主题：使用深色图标
                windowInsetsController?.isAppearanceLightStatusBars = true
                windowInsetsController?.isAppearanceLightNavigationBars = true
                println("[MainActivity] 浅色主题 - 使用深色图标")
            }

            // 额外优化：设置导航栏为对比色（可选，根据设计需求）
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                // Android 9.0+: 设置导航栏分隔线颜色为透明
                window.navigationBarDividerColor = Color.TRANSPARENT
            }

            println("[MainActivity] 透明系统栏已启用 - Edge-to-Edge 沉浸式体验")
        } catch (e: Exception) {
            println("[MainActivity] 设置透明系统栏失败: ${e.message}")
        }
    }
}