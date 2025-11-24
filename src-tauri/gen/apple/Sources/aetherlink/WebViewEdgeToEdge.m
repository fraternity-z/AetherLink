#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

/**
 * iOS 沉浸式配置 - 让 WebView 延伸到安全区域
 * 类似 Android 的 Edge-to-Edge 效果
 */
@implementation WKWebView (EdgeToEdge)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        SEL originalSelector = @selector(didMoveToWindow);
        SEL swizzledSelector = @selector(edgeToEdge_didMoveToWindow);
        
        Method originalMethod = class_getInstanceMethod(self, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(self, swizzledSelector);
        
        method_exchangeImplementations(originalMethod, swizzledMethod);
    });
}

- (void)edgeToEdge_didMoveToWindow {
    [self edgeToEdge_didMoveToWindow];
    
    if (!self.window) return;
    
    // 1. WebView 背景透明
    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.scrollView.backgroundColor = UIColor.clearColor;
    
    // 2. 禁用自动内边距调整，让内容延伸到安全区域
    if (@available(iOS 11.0, *)) {
        self.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }
    
    // 3. 设置窗口背景色（适配深浅色模式）
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
