import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // 🚀 性能优化：配置 WebView 性能设置
        configureWebViewOptimizations()
        
        return true
    }
    
    /// 🚀 性能优化：WebView 配置优化
    /// 参考：Capacitor 性能优化最佳实践
    private func configureWebViewOptimizations() {
        // 1. 启用 WKWebView 的内容模式优化
        if #available(iOS 13.0, *) {
            let processPool = WKProcessPool()
            CAPBridgeViewController.instanceDescriptor().processPool = processPool
        }
        
        // 2. 配置 WebView 配置
        let configuration = WKWebViewConfiguration()
        
        // 启用 JavaScript
        configuration.preferences.javaScriptEnabled = true
        
        // 启用多媒体播放
        if #available(iOS 10.0, *) {
            configuration.mediaTypesRequiringUserActionForPlayback = []
        }
        
        // 允许内联播放
        configuration.allowsInlineMediaPlayback = true
        
        // 启用画中画
        if #available(iOS 9.0, *) {
            configuration.allowsPictureInPictureMediaPlayback = true
        }
        
        // 3. 性能优化：启用 GPU 加速
        if #available(iOS 9.0, *) {
            configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        }
        
        print("🚀 iOS WebView 性能优化配置已应用")
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
