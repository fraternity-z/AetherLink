#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

/**
 * iOS 沉浸式背景色修复
 * 
 * 只设置背景色，让安全区域外的颜色和应用内一致
 * 配合 CSS 的 viewport-fit=cover 实现全屏效果
 */

@implementation WKWebView (EdgeToEdge)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Method original = class_getInstanceMethod(self, @selector(didMoveToWindow));
        Method swizzled = class_getInstanceMethod(self, @selector(e2e_didMoveToWindow));
        method_exchangeImplementations(original, swizzled);
    });
}

- (void)e2e_didMoveToWindow {
    [self e2e_didMoveToWindow];
    
    if (!self.window) return;
    
    // 设置 WebView 背景透明，让底层颜色可见
    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.scrollView.backgroundColor = UIColor.clearColor;
    
    // 设置窗口背景色（支持深色模式）
    UIColor *bgColor;
    if (@available(iOS 13.0, *)) {
        bgColor = [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *tc) {
            return tc.userInterfaceStyle == UIUserInterfaceStyleDark
                ? [UIColor colorWithRed:15/255.0 green:23/255.0 blue:42/255.0 alpha:1]   // #0F172A
                : [UIColor colorWithRed:248/255.0 green:250/255.0 blue:252/255.0 alpha:1]; // #F8FAFC
        }];
    } else {
        bgColor = [UIColor colorWithRed:248/255.0 green:250/255.0 blue:252/255.0 alpha:1];
    }
    
    self.window.backgroundColor = bgColor;
    self.window.rootViewController.view.backgroundColor = bgColor;
}

@end
