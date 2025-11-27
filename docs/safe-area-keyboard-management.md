# 安全区域与键盘管理系统

本文档记录了 AetherLink 在 **Tauri** 和 **Capacitor** 两个平台上关于安全区域（Safe Area）和键盘管理的实现细节。

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端适配层 (React)                        │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │  SafeAreaService.ts │◄───│ 监听 safeAreaChanged 事件       │ │
│  │  (核心服务)          │    │ 更新 CSS 变量                   │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   useKeyboard.ts    │◄───│ 监听键盘事件                    │ │
│  │   (键盘管理 Hook)    │    │ 提供锁定机制                    │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              UI 组件 (ChatPageUI, ExpandableContainer)      ││
│  │              根据 keyboardHeight 和 safeArea 调整布局        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ window.dispatchEvent / CSS env()
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                        原生层                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │ Tauri                │    │ Capacitor                    │  │
│  │ tauri-plugin-edge-   │    │ capacitor-edge-to-edge       │  │
│  │ to-edge (Rust)       │    │ (Swift/Kotlin)               │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 文件清单

### 1. 前端适配层 (通用)

| 文件路径 | 功能描述 |
| :--- | :--- |
| `src/shared/services/SafeAreaService.ts` | **核心服务**。监听原生 `safeAreaChanged` 事件，读取 CSS `env()` 变量，更新全局 CSS 变量。 |
| `src/shared/hooks/useKeyboard.ts` | **键盘管理 Hook**。提供键盘高度、可见性状态，支持锁定机制（模态框独占）。 |
| `src/components/GlobalStyles.tsx` | **全局样式**。定义 CSS 变量默认值（`--safe-area-*`、`--keyboard-height` 等）。 |
| `src/pages/ChatPage/components/ChatPageUI.tsx` | **聊天页面布局**。根据键盘高度动态调整输入框 `bottom` 位置。 |
| `src/components/input/IntegratedChatInput/ExpandableContainer.tsx` | **输入框容器**。处理 iOS 底部安全区域 padding，键盘弹出时自动移除。 |
| `src/components/SafeAreaDebugger.tsx` | **调试工具**。用于开发时可视化安全区域值。 |

### 2. Tauri 平台

| 文件路径 | 关键代码 | 说明 |
| :--- | :--- | :--- |
| `src-tauri/Cargo.toml` | `tauri-plugin-edge-to-edge = "0.3.3"` | Rust 侧插件依赖 |
| `src-tauri/src/lib.rs` | `.plugin(tauri_plugin_edge_to_edge::init())` | 注册并初始化插件 |

### 3. Capacitor 平台

| 文件路径 | 关键配置 | 说明 |
| :--- | :--- | :--- |
| `package.json` | `"capacitor-edge-to-edge": "^1.6.4"` | npm 包依赖 |
| `android/` | 自动集成 | `npx cap sync` 时注入原生代码 |
| `ios/` | 自动集成 | `npx cap sync` 时注入原生代码 |

---

## 键盘管理系统 (useKeyboard)

### 设计理念

1. **全局单例管理** - `KeyboardManager` 单例管理键盘状态，避免多个组件重复监听原生事件。
2. **锁定机制** - 模态框可以锁定键盘，锁定期间其他组件的 `keyboardHeight` 返回 `0`。
3. **栈结构优先级** - 后锁定的优先级更高，支持嵌套模态框场景。

### 使用方式

```typescript
// 1. 普通组件 - 尊重锁定状态（当有模态框锁定时 keyboardHeight 返回 0）
const { keyboardHeight, isKeyboardVisible } = useKeyboard();

// 2. 模态框 - 锁定键盘并独占响应
const { keyboardHeight, isKeyboardVisible } = useKeyboard({ lock: true });

// 3. 获取原始键盘高度（忽略锁定，用于调试或特殊场景）
const { rawKeyboardHeight } = useKeyboard({ ignoreLock: true });
```

### 返回值

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `isKeyboardVisible` | `boolean` | 键盘是否可见 |
| `keyboardHeight` | `number` | 键盘高度（受锁定影响，可能为 0） |
| `rawKeyboardHeight` | `number` | 原始键盘高度（不受锁定影响） |
| `hideKeyboard` | `() => void` | 隐藏键盘函数 |
| `isLockOwner` | `boolean` | 当前组件是否持有锁 |

### 应用场景

| 组件 | 使用方式 | 说明 |
| :--- | :--- | :--- |
| `ChatPageUI` | `useKeyboard()` | 普通模式，尊重锁定 |
| `MessageEditor` | `useKeyboard({ lock: true })` | 锁定模式，独占键盘响应 |
| 其他模态框 | `useKeyboard({ lock: true })` | 锁定模式 |

---

## 安全区域服务 (SafeAreaService)

### 监听的事件

| 事件名 | 来源 | 数据结构 |
| :--- | :--- | :--- |
| `safeAreaChanged` | Tauri/Capacitor 原生层 | `{ top, right, bottom, left, keyboardHeight, keyboardVisible }` |
| `keyboardWillShow` | Capacitor Android | `{ keyboardHeight }` |
| `keyboardDidHide` | Capacitor Android | - |

### 设置的 CSS 变量

| 变量名 | 说明 |
| :--- | :--- |
| `--safe-area-top` | 顶部安全区域（状态栏） |
| `--safe-area-right` | 右侧安全区域 |
| `--safe-area-bottom` | 底部安全区域（Home Indicator） |
| `--safe-area-left` | 左侧安全区域 |
| `--safe-area-bottom-computed` | 计算后的底部安全区域（统一使用） |
| `--content-bottom-padding` | 内容区域底部 padding |
| `--keyboard-height` | 键盘高度 |
| `--keyboard-visible` | 键盘可见性 (`1` 或 `0`) |

---

## 已知问题与修复记录

### 1. iOS 键盘弹出时的双重间距问题

**问题描述**：在 iOS 设备上，键盘弹出时输入框与键盘之间会出现约 16px~34px 的空白区域。

**原因分析**：
- `ChatPageUI` 根据 `keyboardHeight` 调整输入框的 `bottom` 位置。
- `ExpandableContainer` 为适配 iOS Home Indicator，硬编码了 `34px` 的 `paddingBottom`。
- 两者叠加导致双重间距。

**修复方案**：在 `ExpandableContainer.tsx` 中，当键盘可见时将 `paddingBottom` 设为 `0`。

```typescript
// 修复前
paddingBottom: isIOS ? '34px' : '0',

// 修复后
paddingBottom: isIOS ? (isKeyboardVisible ? '0' : '34px') : '0',
```

**修复日期**：2025-11-26

---

### 2. Android 键盘推页面问题

**问题描述**：在 Android 设备上，点击输入框时整个页面被推上去，而不是让输入框平滑上移。

**原因分析**：
- 使用 Edge-to-Edge 模式后，`AndroidManifest.xml` 缺少 `android:windowSoftInputMode` 配置。
- Android 系统默认使用 `adjustResize` 模式，会压缩整个 WebView 以适应键盘。
- 这与我们的 JS 代码手动调整布局冲突，导致双重调整。

**修复方案**：在 `AndroidManifest.xml` 的 `MainActivity` 中添加 `android:windowSoftInputMode="adjustNothing"`。

```xml
<!-- 修复前 -->
<activity
    android:name=".MainActivity"
    android:configChanges="..."
    android:exported="true">

<!-- 修复后 -->
<activity
    android:name=".MainActivity"
    android:configChanges="..."
    android:windowSoftInputMode="adjustNothing"
    android:exported="true">
```

**说明**：`adjustNothing` 让系统不自动调整布局，由我们的 `useKeyboard` Hook 和 `ChatPageUI` 通过监听键盘事件来手动控制。

**修复日期**：2025-11-27

---

## 测试状态

| 平台 | 安全区域 | 键盘 | 备注 |
| :--- | :--- | :--- | :--- |
| Tauri iOS | ✅ 正常 | ✅ 正常 | 已修复双重间距问题 |
| Tauri Android | ✅ 正常 | ✅ 正常 | - |
| Capacitor iOS | ✅ 正常 | ✅ 正常 | 已修复双重间距问题 |
| Capacitor Android | ✅ 正常 | ✅ 正常 | - |

---

## 参考资料

- [Tauri Edge-to-Edge Plugin](https://github.com/AetherLink/tauri-plugin-edge-to-edge)
- [Capacitor Edge-to-Edge Plugin](https://github.com/AetherLink/capacitor-edge-to-edge)
- [rikkahub ChatInput.kt](docs/rikkahub-master/app/src/main/java/me/rerere/rikkahub/ui/components/ai/ChatInput.kt) - imePadding() 修饰符参考
