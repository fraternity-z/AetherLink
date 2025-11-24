#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

/**
 * iOS 沉浸式 (Edge-to-Edge) - 真正的全屏实现
 * 
 * 关键：
 * 1. UIViewController.edgesForExtendedLayout = UIRectEdgeAll
 * 2. UIViewController.extendedLayoutIncludesOpaqueBars = YES
 * 3. WebView 约束到 superview 边缘（不是 safeAreaLayoutGuide）
 */

#pragma mark - UIViewController 扩展 (关键！)

@implementation UIViewController (EdgeToEdge)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Method original = class_getInstanceMethod(self, @selector(viewDidLoad));
        Method swizzled = class_getInstanceMethod(self, @selector(e2e_viewDidLoad));
        method_exchangeImplementations(original, swizzled);
    });
}

- (void)e2e_viewDidLoad {
    [self e2e_viewDidLoad];
    
    // 关键！让视图延伸到所有边缘（包括状态栏和 Home 指示器区域）
    self.edgesForExtendedLayout = UIRectEdgeAll;
    self.extendedLayoutIncludesOpaqueBars = YES;
    
    // iOS 11+ 禁用自动调整滚动视图内边距
    if (@available(iOS 11.0, *)) {
        // 遍历所有子视图，禁用 contentInsetAdjustmentBehavior
        for (UIView *subview in self.view.subviews) {
            if ([subview isKindOfClass:[UIScrollView class]]) {
                ((UIScrollView *)subview).contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
            }
        }
    }
}

@end

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
    
    // WebView 配置
    self.opaque = NO;
    self.backgroundColor = UIColor.clearColor;
    self.scrollView.backgroundColor = UIColor.clearColor;
    self.scrollView.bounces = NO;
    
    if (@available(iOS 11.0, *)) {
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
    
    // 确保 ViewController 设置正确
    UIViewController *vc = [self findViewController];
    if (vc) {
        vc.edgesForExtendedLayout = UIRectEdgeAll;
        vc.extendedLayoutIncludesOpaqueBars = YES;
    }
    
    // 移除所有现有约束
    [self removeAllConstraints];
    
    // 方法1：直接设置 frame 为全屏
    self.frame = superview.bounds;
    self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    
    // 方法2：约束到 superview 边缘（备用）
    self.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
        [self.topAnchor constraintEqualToAnchor:superview.topAnchor],
        [self.leadingAnchor constraintEqualToAnchor:superview.leadingAnchor],
        [self.trailingAnchor constraintEqualToAnchor:superview.trailingAnchor],
        [self.bottomAnchor constraintEqualToAnchor:superview.bottomAnchor]
    ]];
    
    // 设置背景色
    [self setupBackgroundColors];
}

- (UIViewController *)findViewController {
    UIResponder *responder = self;
    while (responder) {
        if ([responder isKindOfClass:[UIViewController class]]) {
            return (UIViewController *)responder;
        }
        responder = [responder nextResponder];
    }
    return nil;
}

- (void)removeAllConstraints {
    NSMutableArray *constraintsToRemove = [NSMutableArray array];
    
    // 移除 superview 中与 WebView 相关的约束
    for (NSLayoutConstraint *constraint in self.superview.constraints) {
        if (constraint.firstItem == self || constraint.secondItem == self) {
            [constraintsToRemove addObject:constraint];
        }
    }
    
    // 也移除 WebView 自身的约束
    for (NSLayoutConstraint *constraint in self.constraints) {
        [constraintsToRemove addObject:constraint];
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
    
    UIWindow *window = self.window;
    if (window) {
        window.backgroundColor = bgColor;
        window.rootViewController.view.backgroundColor = bgColor;
    }
}

@end
