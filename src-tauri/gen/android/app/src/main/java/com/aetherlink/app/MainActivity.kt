package com.aetherlink.app

import android.webkit.WebView

/**
 * AetherLink MainActivity
 * 
 * Edge-to-Edge 功能由 tauri-plugin-edge-to-edge 插件自动处理
 */
class MainActivity : TauriActivity() {
    // Edge-to-Edge 功能已由插件处理，无需手动实现
    
    /**
     * 处理 Android 系统返回键
     * 将返回键事件转发给 WebView 中的 JavaScript
     */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // 获取 WebView 并派发键盘事件
        val webView = findWebView(window.decorView)
        if (webView != null) {
            // 派发自定义事件到 JavaScript
            webView.evaluateJavascript(
                """
                (function() {
                    // 派发自定义的 Android 返回键事件
                    var event = new KeyboardEvent('keydown', {
                        key: 'Escape',
                        code: 'Escape',
                        keyCode: 27,
                        which: 27,
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(event);
                    console.log('[TauriAndroid] 返回键事件已派发');
                })();
                """.trimIndent(),
                null
            )
        } else {
            // 如果找不到 WebView，调用默认行为
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }
    
    /**
     * 递归查找 WebView
     */
    private fun findWebView(view: android.view.View): WebView? {
        if (view is WebView) {
            return view
        }
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val child = view.getChildAt(i)
                val webView = findWebView(child)
                if (webView != null) {
                    return webView
                }
            }
        }
        return null
    }
}
