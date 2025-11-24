# 键盘管理实现文档

## 设计理念

模仿 **rikkahub** 项目的极简键盘管理方案，采用声明式 API 替代复杂的状态管理。

## 核心实现

### 1. useKeyboard Hook

位置：`src/shared/hooks/useKeyboard.ts`

```typescript
const { isKeyboardVisible, hideKeyboard } = useKeyboard();
```

**功能：**
- `isKeyboardVisible`: 键盘可见性状态（类似 rikkahub 的 `WindowInsets.isImeVisible`）
- `hideKeyboard()`: 隐藏键盘（类似 rikkahub 的 `keyboardController?.hide()`）

**原理：**
- 监听 Capacitor Keyboard 的 `keyboardWillShow/Hide` 事件
- 零复杂状态管理，只提供最基础的键盘控制

### 2. 自动布局调整

**CSS 方式** - 模仿 rikkahub 的 `.imePadding()` 修饰符：

```css
/* 输入框容器自动处理键盘 padding */
.input-container {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

**配置** - `capacitor.config.ts`:

```typescript
Keyboard: {
  resizeOnFullScreen: false  // 让 WebView 保持原始大小，通过 CSS 处理布局
}
```

### 3. 使用方式

在输入组件中：

```typescript
import { useKeyboard } from '../../shared/hooks/useKeyboard';

// 1. 获取键盘控制
const { hideKeyboard } = useKeyboard();

// 2. 包装发送函数
const wrappedHandleSubmit = useCallback(() => {
  hideKeyboard();  // 发送时隐藏键盘
  handleSubmit();
}, [hideKeyboard, handleSubmit]);

// 3. 传递给发送按钮
<button onClick={wrappedHandleSubmit}>发送</button>
```

## 对比旧实现

| 维度 | 旧实现 (useKeyboardManager) | 新实现 (useKeyboard) |
|------|---------------------------|---------------------|
| **代码行数** | ~200 行 | ~40 行 |
| **状态管理** | 复杂（3个状态） | 极简（1个状态） |
| **高度计算** | 手动 `window.innerHeight` | CSS 自动处理 |
| **页面切换** | 需要监听路由 | 无需处理 |
| **焦点管理** | 复杂逻辑 | 无需处理 |
| **维护成本** | 高 | 低 |

## 优势

✅ **代码量减少 80%** - 从 200+ 行减少到 40 行  
✅ **声明式 API** - 更符合 React 理念  
✅ **系统原生** - 依赖 Capacitor 原生能力  
✅ **易于维护** - 逻辑简单清晰  
✅ **性能更好** - 减少状态更新和重渲染  

## 常见问题和解决方案

### ❌ 问题 1：输入框和键盘之间有很大间隔

**现象：** 键盘弹出后，输入框虽然上移了，但和键盘之间有明显的空隙（通常是安全区域的高度，如 34px）

**原因：** 双重间距问题
```typescript
// ❌ 错误写法
style={{
  bottom: keyboardHeight,  // 已经把输入框顶到键盘上方
  paddingBottom: 'env(safe-area-inset-bottom, 34px)'  // 又加了 34px
}}
// 结果：输入框离键盘 34px 的间隔
```

**解决方案：** 动态切换 paddingBottom
```typescript
// ✅ 正确写法
style={{
  bottom: keyboardHeight,
  // 键盘弹出时不需要 padding，键盘隐藏时才需要安全区域
  paddingBottom: keyboardHeight > 0 ? '0' : 'env(safe-area-inset-bottom, 34px)'
}}
```

**详细说明：**
- **键盘隐藏时**（`keyboardHeight = 0`）：
  - `bottom: 0` - 输入框在底部
  - `paddingBottom: 34px` - 需要安全区域，防止被 Home Indicator 遮挡 ✅
  
- **键盘弹出时**（`keyboardHeight = 336px`）：
  - `bottom: 336px` - 输入框已经在键盘上方
  - `paddingBottom: 0` - 不需要额外间距，否则会有空隙 ✅

参考文件：`src/pages/ChatPage/components/ChatPageUI.tsx` 第 606-629 行

### ❌ 问题 2：展开的输入框在键盘弹出时遮挡整个屏幕

**现象：** 输入框展开到 70vh 后，键盘弹出时屏幕几乎被完全遮挡

**解决方案：** 键盘弹出时自动折叠输入框
```typescript
// 模仿 rikkahub 的 LaunchedEffect(imeVisible)
useEffect(() => {
  if (isKeyboardVisible && expanded) {
    setExpanded(false); // 自动折叠
  }
}, [isKeyboardVisible, expanded]);
```

参考文件：
- `src/components/input/ChatInput.tsx` 第 164-186 行
- `src/components/input/CompactChatInput.tsx` 第 164-174 行
- `src/components/input/IntegratedChatInput/ExpandableContainer.tsx` 第 48-58 行

## 已更新组件

- ✅ `ChatInput.tsx`
- ✅ `CompactChatInput.tsx`
- ✅ `IntegratedChatInput.tsx`
- ✅ `InputTextArea.tsx`
- ✅ `ExpandableContainer.tsx`

## 参考

- rikkahub 项目：`docs/rikkahub-master/app/src/main/java/me/rerere/rikkahub/ui/components/ai/ChatInput.kt`
- Capacitor Keyboard API：https://capacitorjs.com/docs/apis/keyboard
