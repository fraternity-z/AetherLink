package com.aetherlink.app

import android.os.Bundle
import android.view.Display
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 启用高刷新率支持
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            // Android 11+ 支持首选刷新率
            val display = display
            val supportedModes = display?.supportedModes
            supportedModes?.let { modes ->
                // 找到最高刷新率模式
                val highestRefreshRateMode = modes.maxByOrNull { it.refreshRate }
                highestRefreshRateMode?.let { mode ->
                    val layoutParams = window.attributes
                    layoutParams.preferredDisplayModeId = mode.modeId
                    window.attributes = layoutParams
                }
            }
        } else if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            // Android 6+ 支持首选刷新率
            val display = windowManager.defaultDisplay
            val supportedRefreshRates = display.supportedRefreshRates
            val maxRefreshRate = supportedRefreshRates.maxOrNull()
            maxRefreshRate?.let { rate ->
                val layoutParams = window.attributes
                layoutParams.preferredRefreshRate = rate
                window.attributes = layoutParams
            }
        }

        // 获取窗口控制器
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)

        // 根据系统主题设置状态栏颜色
        val isDarkTheme = (resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES

        if (isDarkTheme) {
            // 深色主题
            window.statusBarColor = android.graphics.Color.parseColor("#1a1a1a")
            window.navigationBarColor = android.graphics.Color.parseColor("#1a1a1a")
            windowInsetsController?.isAppearanceLightStatusBars = false
            windowInsetsController?.isAppearanceLightNavigationBars = false
        } else {
            // 浅色主题
            window.statusBarColor = android.graphics.Color.parseColor("#ffffff")
            window.navigationBarColor = android.graphics.Color.parseColor("#ffffff")
            windowInsetsController?.isAppearanceLightStatusBars = true
            windowInsetsController?.isAppearanceLightNavigationBars = true
        }
    }
}