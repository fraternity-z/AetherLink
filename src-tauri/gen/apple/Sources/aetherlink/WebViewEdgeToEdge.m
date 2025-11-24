#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

/**
 * iOS 沉浸式 (Edge-to-Edge)
 * 
 * 解决 Tauri iOS 底部白色安全区域问题 (Issue #11475)
 * 通过 additionalSafeAreaInsets 抵消安全区域，实现真正的全屏
 */

#pragma mark - UIViewController 扩展

@implementation UIViewController (EdgeToEdge)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        // Swizzle viewDidAppear
        Method original = class_getInstanceMethod(self, @selector(viewDidAppear:));
        Method swizzled = class_getInstanceMethod(self, @selector(e2e_viewDidAppear:));
        method_exchangeImplementations(original, swizzled);
    });
}

- (void)e2e_viewDidAppear:(BOOL)animated {
    [self e2e_viewDidAppear:animated];
    
    // 只处理包含 WKWebView 的 ViewController
    BOOL hasWebView = NO;
    for (UIView *subview in self.view.subviews) {
        if ([subview isKindOfClass:[WKWebView class]]) {
            hasWebView = YES;
            break;
        }
    }
    if (!hasWebView) return;
    
    // 设置 additionalSafeAreaInsets 抵消底部安全区域
    if (@available(iOS 11.0, *)) {
        UIEdgeInsets safeArea = self.view.safeAreaInsets;
        // 用负值抵消安全区域，让内容延伸到屏幕边缘
        self.additionalSafeAreaInsets = UIEdgeInsetsMake(-safeArea.top, -safeArea.left, -safeArea.bottom, -safeArea.right);
    }
    
    // 设置背景色
    [self setupBackgroundColor];
}

- (void)setupBackgroundColor {
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
    
    self.view.backgroundColor = bgColor;
    if (self.view.window) {
        self.view.window.backgroundColor = bgColor;
    }
}

@end

#pragma mark - WKWebView 扩展

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
    
    // WebView 背景透明
    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.scrollView.backgroundColor = UIColor.clearColor;
    
    // 禁用滚动视图的内容内边距自动调整
    if (@available(iOS 11.0, *)) {
        self.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }
}

@end
