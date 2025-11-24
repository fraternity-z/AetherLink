#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

/**
 * iOS 沉浸式 (Edge-to-Edge) - 学习 Capacitor 的实现方式
 * 
 * Capacitor 的秘密: WebView 直接是 ViewController 的 view
 * 而不是添加到 view 上再用 SafeArea 约束
 * 
 * 参考: CAPBridgeViewController.swift - view = webView
 */

#pragma mark - WKWebView 扩展

@implementation WKWebView (EdgeToEdge)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Method original = class_getInstanceMethod(self, @selector(didMoveToSuperview));
        Method swizzled = class_getInstanceMethod(self, @selector(e2e_didMoveToSuperview));
        method_exchangeImplementations(original, swizzled);
    });
}

- (void)e2e_didMoveToSuperview {
    [self e2e_didMoveToSuperview];
    
    if (!self.superview) return;
    
    // 1. WebView 配置 (学习 Capacitor)
    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.scrollView.backgroundColor = UIColor.clearColor;
    self.scrollView.bounces = NO;  // Capacitor 默认禁用弹跳
    
    if (@available(iOS 11.0, *)) {
        // 关键！Capacitor 使用 .never 让 WebView 全屏
        self.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }
    
    // 延迟执行，确保视图层级完全建立
    dispatch_async(dispatch_get_main_queue(), ^{
        [self makeFullScreen];
    });
}

- (void)makeFullScreen {
    UIView *superview = self.superview;
    if (!superview) return;
    
    // 2. 移除所有现有约束
    [self removeAllConstraints];
    
    // 3. 设置 WebView frame 为全屏 (学习 Capacitor: view = webView)
    self.translatesAutoresizingMaskIntoConstraints = NO;
    
    // 关键：约束到 superview 的边缘，而不是 safeAreaLayoutGuide
    [NSLayoutConstraint activateConstraints:@[
        [self.topAnchor constraintEqualToAnchor:superview.topAnchor],
        [self.leadingAnchor constraintEqualToAnchor:superview.leadingAnchor],
        [self.trailingAnchor constraintEqualToAnchor:superview.trailingAnchor],
        [self.bottomAnchor constraintEqualToAnchor:superview.bottomAnchor]
    ]];
    
    // 4. 设置背景色 (支持深色模式)
    [self setupBackgroundColors];
}

- (void)removeAllConstraints {
    // 移除所有与此 WebView 相关的约束
    NSMutableArray *constraintsToRemove = [NSMutableArray array];
    
    for (NSLayoutConstraint *constraint in self.superview.constraints) {
        if (constraint.firstItem == self || constraint.secondItem == self) {
            [constraintsToRemove addObject:constraint];
        }
    }
    
    [NSLayoutConstraint deactivateConstraints:constraintsToRemove];
}

- (void)setupBackgroundColors {
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
    
    // 设置窗口和根视图背景色
    UIWindow *window = self.window;
    if (window) {
        window.backgroundColor = bgColor;
        window.rootViewController.view.backgroundColor = bgColor;
    }
}

@end
