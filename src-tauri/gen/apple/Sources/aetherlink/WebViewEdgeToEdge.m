#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

/**
 * iOS Edge-to-Edge 沉浸式实现
 * 
 * 功能：
 * 1. 重写 safeAreaInsets 返回 zero，让 WebView 忽略系统安全区域（关键！）
 * 2. 设置背景色，让安全区域外的颜色和应用内一致
 * 3. 注入安全区域 CSS 变量到 WebView（解决 Tauri WebView 不支持 env() 的问题）
 * 4. 监听键盘事件，动态更新键盘高度
 * 
 * 配合 CSS 的 viewport-fit=cover 实现全屏效果
 */

@implementation WKWebView (EdgeToEdge)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        // Hook didMoveToWindow
        Method original = class_getInstanceMethod(self, @selector(didMoveToWindow));
        Method swizzled = class_getInstanceMethod(self, @selector(e2e_didMoveToWindow));
        method_exchangeImplementations(original, swizzled);
        
        // Hook safeAreaInsetsDidChange
        Method originalInsets = class_getInstanceMethod(self, @selector(safeAreaInsetsDidChange));
        Method swizzledInsets = class_getInstanceMethod(self, @selector(e2e_safeAreaInsetsDidChange));
        if (originalInsets && swizzledInsets) {
            method_exchangeImplementations(originalInsets, swizzledInsets);
        }
        
        // 🚀 关键：Hook safeAreaInsets getter，返回 zero 让 WebView 铺满全屏
        Method originalSafeArea = class_getInstanceMethod(self, @selector(safeAreaInsets));
        Method swizzledSafeArea = class_getInstanceMethod(self, @selector(e2e_safeAreaInsets));
        if (originalSafeArea && swizzledSafeArea) {
            method_exchangeImplementations(originalSafeArea, swizzledSafeArea);
        }
    });
}

/**
 * 🚀 核心修复：重写 safeAreaInsets，返回 zero
 * 这会让 WKWebView 忽略系统安全区域，真正铺满整个屏幕
 * 安全区域的处理完全交给 CSS (env(safe-area-inset-*) 或我们注入的变量)
 */
- (UIEdgeInsets)e2e_safeAreaInsets {
    // 返回 zero，让 WebView 铺满全屏
    // CSS 层会通过我们注入的变量来处理安全区域
    return UIEdgeInsetsZero;
}

- (void)e2e_didMoveToWindow {
    [self e2e_didMoveToWindow];
    
    if (!self.window) return;
    
    // 设置 WebView 背景透明，让底层颜色可见
    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.scrollView.backgroundColor = UIColor.clearColor;
    
    // 🚀 关键修复：禁用 ScrollView 的自动安全区域调整
    if (@available(iOS 11.0, *)) {
        self.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }
    
    // 🚀 核心修复：强制全屏显示 (解决 PageSheet 模式导致的上下留白)
    // 查找 WebView 所属的 ViewController 并将其设置为全屏
    UIResponder *responder = self;
    while ((responder = [responder nextResponder])) {
        if ([responder isKindOfClass:[UIViewController class]]) {
            UIViewController *vc = (UIViewController *)responder;
            
            // 强制设置为全屏模式
            if (vc.modalPresentationStyle != UIModalPresentationFullScreen) {
                vc.modalPresentationStyle = UIModalPresentationFullScreen;
            }
            
            // 如果是在 NavigationController 中，隐藏系统导航栏
            if (vc.navigationController) {
                vc.navigationController.navigationBarHidden = YES;
                vc.navigationController.modalPresentationStyle = UIModalPresentationFullScreen;
            }
            
            // 设置 View 背景色透明
            vc.view.backgroundColor = UIColor.clearColor;
            break;
        }
    }
    
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
    
    // 注册键盘监听
    [self e2e_registerKeyboardObservers];
    
    // 延迟注入安全区域（等待 WebView 加载完成）
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self e2e_injectSafeAreaInsets];
        // 启动周期性注入
        [self e2e_startPeriodicInjection];
    });
}

- (void)e2e_startPeriodicInjection {
    // 简单的递归延迟注入，持续约 5 秒
    __block int count = 0;
    void (^periodicBlock)(void) = ^{
        if (count < 10) {
            [self e2e_injectSafeAreaInsets];
            count++;
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                // 重新调用需要将 block 再次传入，这里简化为直接调用方法
                [self e2e_injectSafeAreaInsets]; 
                // 注意：Objective-C block 递归比较麻烦，这里改用更简单的方式：直接 schedule 多个 dispatch_after
            });
        }
    };
    
    // 调度 10 次注入，每次间隔 0.5s
    for (int i = 1; i <= 10; i++) {
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(i * 0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [self e2e_injectSafeAreaInsets];
        });
    }
}

- (void)e2e_safeAreaInsetsDidChange {
    [self e2e_safeAreaInsetsDidChange];
    
    // 安全区域变化时重新注入
    [self e2e_injectSafeAreaInsets];
}

/**
 * 注册键盘监听器
 */
- (void)e2e_registerKeyboardObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(e2e_keyboardWillShow:)
                                                 name:UIKeyboardWillShowNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(e2e_keyboardWillHide:)
                                                 name:UIKeyboardWillHideNotification
                                               object:nil];
}

- (void)e2e_keyboardWillShow:(NSNotification *)notification {
    NSDictionary *info = notification.userInfo;
    CGRect keyboardFrame = [[info objectForKey:UIKeyboardFrameEndUserInfoKey] CGRectValue];
    CGFloat keyboardHeight = keyboardFrame.size.height;
    
    [self e2e_injectSafeAreaInsetsWithKeyboard:keyboardHeight visible:YES];
}

- (void)e2e_keyboardWillHide:(NSNotification *)notification {
    [self e2e_injectSafeAreaInsetsWithKeyboard:0 visible:NO];
}

/**
 * 注入安全区域 CSS 变量到 WebView
 */
- (void)e2e_injectSafeAreaInsets {
    [self e2e_injectSafeAreaInsetsWithKeyboard:0 visible:NO];
}

- (void)e2e_injectSafeAreaInsetsWithKeyboard:(CGFloat)keyboardHeight visible:(BOOL)keyboardVisible {
    if (@available(iOS 11.0, *)) {
        // 🚀 关键：从 Window 获取真正的安全区域，而不是从 WebView (已被重写为 zero)
        UIEdgeInsets safeArea = UIEdgeInsetsZero;
        if (self.window) {
            safeArea = self.window.safeAreaInsets;
        }
        
        CGFloat top = safeArea.top;
        CGFloat right = safeArea.right;
        CGFloat bottom = safeArea.bottom;
        CGFloat left = safeArea.left;
        CGFloat computedBottom = MAX(bottom, 34.0);  // iOS 底部 Home Indicator 通常是 34px
        
        NSString *jsCode = [NSString stringWithFormat:@
            "(function() {"
            "    var style = document.documentElement.style;"
            "    "
            "    // 系统安全区域（模拟 env(safe-area-inset-*)）"
            "    style.setProperty('--safe-area-inset-top', '%.1fpx');"
            "    style.setProperty('--safe-area-inset-right', '%.1fpx');"
            "    style.setProperty('--safe-area-inset-bottom', '%.1fpx');"
            "    style.setProperty('--safe-area-inset-left', '%.1fpx');"
            "    "
            "    // 兼容项目现有的 CSS 变量"
            "    style.setProperty('--safe-area-top', '%.1fpx');"
            "    style.setProperty('--safe-area-right', '%.1fpx');"
            "    style.setProperty('--safe-area-bottom', '%.1fpx');"
            "    style.setProperty('--safe-area-left', '%.1fpx');"
            "    "
            "    // 计算后的底部安全区域（统一值）"
            "    style.setProperty('--safe-area-bottom-computed', '%.1fpx');"
            "    style.setProperty('--safe-area-bottom-min', '48px');"
            "    style.setProperty('--content-bottom-padding', '%.1fpx');"
            "    "
            "    // 键盘状态"
            "    style.setProperty('--keyboard-height', '%.1fpx');"
            "    style.setProperty('--keyboard-visible', '%d');"
            "    "
            "    // 触发自定义事件"
            "    window.dispatchEvent(new CustomEvent('safeAreaChanged', {"
            "        detail: {"
            "            top: %.1f,"
            "            right: %.1f,"
            "            bottom: %.1f,"
            "            left: %.1f,"
            "            keyboardHeight: %.1f,"
            "            keyboardVisible: %@"
            "        }"
            "    }));"
            "    "
            "    console.log('[EdgeToEdge] Safe area injected: top=%.1fpx, bottom=%.1fpx, keyboard=%.1fpx');"
            "})();",
            top, right, bottom, left,           // safe-area-inset-*
            top, right, bottom, left,           // safe-area-*
            computedBottom,                      // safe-area-bottom-computed
            computedBottom + 16.0,              // content-bottom-padding
            keyboardHeight,                      // keyboard-height
            keyboardVisible ? 1 : 0,            // keyboard-visible
            top, right, bottom, left,           // event detail
            keyboardHeight,
            keyboardVisible ? @"true" : @"false",
            top, bottom, keyboardHeight         // console.log
        ];
        
        [self evaluateJavaScript:jsCode completionHandler:nil];
    }
}

@end
