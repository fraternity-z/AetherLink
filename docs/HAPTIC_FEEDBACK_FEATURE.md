# 触觉反馈功能说明文档

## 功能概述

参考 Kelivo 项目的优秀实现，为 AetherLink 应用添加了完整的触觉反馈（Haptic Feedback）功能，提升用户交互体验。

## 新增文件

### 1. 触觉反馈工具类
**文件路径**: `src/shared/utils/hapticFeedback.ts`

实现了完整的触觉反馈功能：
- ✅ 支持 Web 端（Navigator Vibration API）
- ✅ 支持 Capacitor 移动端（iOS 和 Android）
- ✅ 提供多种触觉反馈类型：
  - `light()` - 轻触反馈，用于小型UI交互
  - `medium()` - 中等反馈，用于重要操作
  - `soft()` - 柔和反馈，用于列表项点击
  - `drawerPulse()` - 侧边栏专用脉冲反馈

## 修改文件

### 1. 状态管理 (`src/shared/store/settingsSlice.ts`)

新增触觉反馈相关状态和 actions：

```typescript
hapticFeedback?: {
  enabled: boolean;              // 全局触觉反馈总开关
  enableOnSidebar: boolean;      // 侧边栏触觉反馈
  enableOnSwitch: boolean;       // 开关触觉反馈
  enableOnListItem: boolean;     // 列表项触觉反馈
};
```

新增 Actions：
- `setHapticFeedbackEnabled` - 设置全局开关
- `setHapticFeedbackOnSidebar` - 设置侧边栏反馈
- `setHapticFeedbackOnSwitch` - 设置开关反馈
- `setHapticFeedbackOnListItem` - 设置列表项反馈

### 2. 国际化文本

**中文** (`src/i18n/locales/zh-CN/settings/settings.json`):
```json
{
  "hapticFeedback": {
    "title": "触觉反馈",
    "description": "自定义应用的触觉反馈设置",
    "enabled": {
      "label": "启用触觉反馈",
      "description": "开启后，应用交互将提供触觉反馈"
    },
    "enableOnSidebar": {
      "label": "侧边栏触觉反馈",
      "description": "打开/关闭侧边栏时启用触觉反馈"
    }
    // ... 更多配置
  }
}
```

**英文** (`src/i18n/locales/en-US/settings/settings.json`):
```json
{
  "hapticFeedback": {
    "title": "Haptic Feedback",
    "description": "Customize haptic feedback settings for app interactions",
    // ... 配置与中文对应
  }
}
```

### 3. 行为设置页面 (`src/pages/Settings/BehaviorSettings.tsx`)

新增触觉反馈设置面板，包含：
- 🎯 全局触觉反馈总开关（带实时测试）
- 🎯 侧边栏触觉反馈开关
- 🎯 开关触觉反馈
- 🎯 列表项触觉反馈

每个开关都支持：
- 实时预览效果
- 子项随全局开关禁用
- 美观的 UI 设计

### 4. 侧边栏组件 (`src/components/TopicManagement/MotionSidebar.tsx`)

集成触觉反馈功能：
- ✅ 监听侧边栏打开/关闭状态变化
- ✅ 触发 `drawerPulse()` 反馈
- ✅ 跳过初次渲染（避免误触发）
- ✅ 支持移动端和桌面端

## 功能特点

### 1. 智能触发
- 只在状态真正改变时触发
- 跳过组件初始化时的触发
- 遵循用户设置开关

### 2. 跨平台支持
```typescript
// Web 端
navigator.vibrate(pattern);

// Capacitor 移动端（iOS/Android）
Haptics.impact({ style: ImpactStyle.Medium });
```

### 3. 渐进增强
- Web 端不支持触觉反馈时静默失败
- 不影响应用正常功能
- 提供降级方案

### 4. 性能优化
- 使用单例模式避免重复实例化
- 使用 `useRef` 追踪状态避免不必要的重渲染
- 轻量级实现，对性能影响极小

## 使用示例

### 在组件中使用触觉反馈

```typescript
import { Haptics, HapticType } from '../../shared/utils/hapticFeedback';
import { useAppSelector } from '../../shared/store';

function MyComponent() {
  const hapticSettings = useAppSelector((state) => state.settings.hapticFeedback);
  
  const handleClick = () => {
    // 检查是否启用
    if (hapticSettings?.enabled && hapticSettings?.enableOnSwitch) {
      Haptics.soft(); // 或使用其他类型
    }
    
    // 你的业务逻辑
  };
  
  return <button onClick={handleClick}>点击我</button>;
}
```

### 触觉反馈类型选择指南

| 场景 | 推荐类型 | 说明 |
|------|---------|------|
| 按钮点击 | `light()` | 轻微反馈 |
| 开关切换 | `soft()` | 柔和反馈 |
| 侧边栏开关 | `drawerPulse()` | 专用脉冲 |
| 重要操作 | `medium()` | 中等强度 |
| 列表项选择 | `light()` | 轻触反馈 |

## 默认配置

```typescript
hapticFeedback: {
  enabled: true,              // 默认启用
  enableOnSidebar: true,      // 默认启用侧边栏反馈
  enableOnSwitch: true,       // 默认启用开关反馈
  enableOnListItem: false,    // 默认关闭（避免过于频繁）
}
```

## 扩展建议

未来可以在以下场景添加触觉反馈：

1. **消息发送** - 发送消息成功时
2. **下拉刷新** - 刷新完成时
3. **长按操作** - 进入长按模式时
4. **错误提示** - 使用特殊的振动模式
5. **通知** - 收到新消息时

示例代码：
```typescript
// 消息发送成功
if (hapticSettings?.enabled) {
  Haptics.medium();
}

// 错误提示（自定义模式）
if (hapticSettings?.enabled) {
  Haptics.trigger(HapticType.MEDIUM);
}
```

## 测试

在行为设置页面中，每个触觉反馈开关都支持实时测试：
1. 进入 设置 > 行为设置
2. 找到"触觉反馈"部分
3. 切换任何开关即可感受对应的触觉反馈

## 兼容性

| 平台 | 支持情况 | 说明 |
|------|---------|------|
| iOS (Capacitor) | ✅ 完全支持 | 使用 Haptic Impact |
| Android (Capacitor) | ✅ 完全支持 | 使用系统振动 |
| Web (Chrome/Edge) | ✅ 支持 | 使用 Vibration API |
| Web (Safari) | ⚠️ 部分支持 | 需要用户手势触发 |
| Web (Firefox) | ✅ 支持 | 使用 Vibration API |

## 参考

本功能的实现参考了以下优秀项目：
- **Kelivo v1.1.0** - Flutter 应用的触觉反馈实现
- 使用的触觉反馈插件：`haptic_feedback: ^0.5.1+1`

---

**创建日期**: 2025-11-10  
**版本**: 1.0.0  
**作者**: AetherLink Development Team

