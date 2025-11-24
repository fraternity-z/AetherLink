# 安全区域使用指南 (Rikkahub 风格)

## 概述

采用 **纯 CSS 实现**，完全基于浏览器原生的 `env(safe-area-inset-*)` 变量：
- ✅ 状态栏和导航栏完全透明（StatusBarService 控制）
- ✅ 内容延伸到系统栏后面
- ✅ 图标颜色自动跟随主题
- ✅ **不依赖任何插件 API**
- ✅ 使用标准 Web API，跨平台兼容

## 核心服务

### StatusBarService
负责控制状态栏和导航栏的样式：
- `initialize(theme, themeStyle)` - 启用 edge-to-edge 并设置初始主题
- `updateTheme(theme, themeStyle)` - 更新主题时自动切换图标颜色
- `getSystemBarInsets()` - 获取系统栏尺寸

### SafeAreaService (纯 CSS 实现)
负责管理安全区域，**不依赖插件 API**：
- `initialize()` - 从 CSS `env()` 变量读取安全区域
- `getCurrentInsets()` - 获取当前安全区域值
- `refresh()` - 刷新安全区域（方向改变、键盘弹出时）

## 实现原理

### 1. CSS env() 变量
使用浏览器原生的安全区域变量：
```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```

### 2. JavaScript 读取
SafeAreaService 通过创建临时元素读取 CSS 计算值：
```typescript
const testElement = document.createElement('div');
testElement.style.top = 'env(safe-area-inset-top, 0px)';
const computed = window.getComputedStyle(testElement);
const topInset = parseFloat(computed.top); // 获取实际像素值
```

## CSS 变量

### 可用变量
```css
--safe-area-top             /* 顶部安全区域 (px) */
--safe-area-bottom          /* 底部安全区域 (px) */
--safe-area-left            /* 左侧安全区域 (px) */
--safe-area-right           /* 右侧安全区域 (px) */
--chat-input-bottom-padding /* 聊天输入框底部边距 */
```

## 使用示例

### 1. 顶部组件适配状态栏

```tsx
<AppBar className="status-bar-safe-area">
  {/* 内容会自动留出状态栏空间 */}
</AppBar>
```

等价于：
```tsx
<AppBar sx={{ paddingTop: 'var(--safe-area-top)' }}>
  {/* ... */}
</AppBar>
```

### 2. 底部组件适配导航栏

```tsx
<Box sx={{
  position: 'fixed',
  bottom: 0,
  paddingBottom: 'var(--safe-area-bottom)'
}}>
  {/* 内容不会被导航栏遮挡 */}
</Box>
```

### 3. 全屏内容

```tsx
<Box sx={{
  height: '100dvh',  /* 使用动态视口高度 */
  paddingTop: 'var(--safe-area-top)',
  paddingBottom: 'var(--safe-area-bottom)'
}}>
  {/* 内容延伸到系统栏后面，但留出安全区域 */}
</Box>
```

### 4. TypeScript 中使用

```typescript
import { safeAreaService } from '@/shared/services/SafeAreaService';

// 获取安全区域
const insets = safeAreaService.getCurrentInsets();
console.log('顶部安全区域:', insets.top);
console.log('底部安全区域:', insets.bottom);

// 监听安全区域变化
const removeListener = safeAreaService.addListener((newInsets) => {
  console.log('安全区域已更新:', newInsets);
});

// 刷新安全区域（方向改变时）
safeAreaService.refresh();
```

## CSS 类名

### 预定义类

```css
.safe-area-container        /* 四周都适配安全区域 */
.safe-area-top             /* 只适配顶部 */
.safe-area-bottom          /* 只适配底部 */
.status-bar-safe-area      /* 适配顶部安全区域 (同 .safe-area-top) */
```

### 平台特定

```css
.platform-android          /* Android 平台 */
.platform-ios              /* iOS 平台 */
.platform-web              /* Web 平台 */
```

## 调试工具

### 方法 1：控制台开启
```javascript
// 显示安全区域可视化
document.body.setAttribute('data-debug-safe-area', 'true');

// 关闭
document.body.removeAttribute('data-debug-safe-area');
```

### 方法 2：使用调试组件
```tsx
import SafeAreaDebugger from '@/components/SafeAreaDebugger';

function App() {
  return (
    <>
      <SafeAreaDebugger />  {/* 开发环境中添加 */}
      {/* 其他组件 */}
    </>
  );
}
```

### 调试显示说明
- 🔴 红色半透明区域 = 状态栏
- 🟢 绿色半透明区域 = 导航栏
- 中央悬浮窗显示精确数值

## 常见问题

### Q: 内容被状态栏遮挡了怎么办？
A: 给顶部元素添加 `className="status-bar-safe-area"` 或 `paddingTop: 'var(--safe-area-top)'`

### Q: 输入框被导航栏遮挡了？
A: 使用 `paddingBottom: 'var(--safe-area-bottom)'`

### Q: 如何让内容延伸到系统栏后面？
A: 不设置 padding，StatusBarService 已将系统栏设为透明。只在需要交互的元素上设置安全区域。

### Q: 安全区域值不准确？
A: 调用 `safeAreaService.refresh()` 刷新，或检查浏览器是否支持 `env(safe-area-inset-*)`

### Q: Web 端如何获取安全区域？
A: Web 端的 `env()` 变量默认为 0，除非在 iOS Safari PWA 模式下

## 迁移指南

### 从插件方案迁移到纯 CSS 方案

#### 旧方案（使用插件 API）
```typescript
import { EdgeToEdge } from 'capacitor-edge-to-edge';

const insets = await EdgeToEdge.getSystemBarInsets();
console.log(insets.statusBar);  // 状态栏高度
console.log(insets.navigationBar);  // 导航栏高度
```

#### 新方案（Rikkahub 风格 - 纯 CSS）
```typescript
import { safeAreaService } from '@/shared/services/SafeAreaService';

const insets = safeAreaService.getCurrentInsets();
console.log(insets.top);     // 顶部安全区域
console.log(insets.bottom);  // 底部安全区域
```

### CSS 变量变化

| 旧变量 | 新变量 | 说明 |
|--------|--------|------|
| `--status-bar-height` | `--safe-area-top` | 顶部安全区域 |
| `--navigation-bar-height` | `--safe-area-bottom` | 底部安全区域 |
| `--safe-area-inset-top` | `--safe-area-top` | 简化变量名 |
| `--safe-area-inset-bottom` | `--safe-area-bottom` | 简化变量名 |

### 优势

1. **不依赖插件** - 减少依赖，减小包体积
2. **标准化** - 使用 W3C 标准的 `env()` 变量
3. **跨平台** - Web/iOS/Android 统一实现
4. **实时更新** - 自动监听窗口和方向变化

## 性能优化

1. **避免频繁读取** - 安全区域值会缓存，优先使用 CSS 变量
2. **监听器管理** - 组件卸载时记得移除监听器
3. **刷新时机** - 只在必要时（如屏幕旋转）才调用 refresh()

## 相关文件

- `src/shared/services/StatusBarService.ts` - 状态栏控制
- `src/shared/services/SafeAreaService.ts` - 安全区域管理
- `src/shared/styles/safeArea.css` - 全局样式
- `src/components/SafeAreaDebugger.tsx` - 调试组件
