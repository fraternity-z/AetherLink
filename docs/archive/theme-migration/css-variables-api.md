# CSS Variables API 文档

## 📋 概述

本文档描述了 AetherLink 主题系统中使用的所有 CSS Variables（CSS 自定义属性）。这些变量提供了一个统一的、可主题化的颜色系统。

## 🎨 为什么使用 CSS Variables？

### 优势

1. **性能优越**：CSS Variables 是原生 CSS 功能，性能优于 JavaScript 计算
2. **实时更新**：改变 CSS Variable 值会立即应用到所有使用它的地方
3. **主题切换**：轻松支持多主题和亮色/暗色模式切换
4. **开发体验**：在 CSS 中直接使用，无需引入额外的 JavaScript 工具
5. **类型安全**：通过 TypeScript 的 Design Tokens 确保颜色值的一致性

### 架构层次

```
Design Tokens (TypeScript)
    ↓
CSS Variables (注入到 DOM)
    ↓
Material-UI Theme (读取 CSS Variables)
    ↓
组件样式 (使用 CSS Variables)
```

---

## 📚 完整的 CSS Variables 列表

### 基础颜色变量

#### 主题色

| CSS Variable | 描述 | 示例值 (默认主题) |
|--------------|------|-------------------|
| `--primary` | 主色调 | `#64748B` |
| `--secondary` | 次要色调 | `#10B981` |
| `--accent` | 强调色 | `#9333EA` |

#### 背景色

| CSS Variable | 描述 | 示例值 (默认主题 - 亮色) |
|--------------|------|------------------------|
| `--bg-default` | 默认背景色 | `#FFFFFF` |
| `--bg-paper` | 卡片/纸张背景色 | `#FFFFFF` |

#### 文字颜色

| CSS Variable | 描述 | 示例值 (默认主题 - 亮色) |
|--------------|------|------------------------|
| `--text-primary` | 主要文字颜色 | `#1E293B` |
| `--text-secondary` | 次要文字颜色 | `#64748B` |

#### 边框颜色

| CSS Variable | 描述 | 示例值 |
|--------------|------|--------|
| `--border-default` | 默认边框颜色 | 根据主题动态计算 |

---

### 消息气泡颜色变量

| CSS Variable | 描述 | 示例值 (默认主题 - 亮色) |
|--------------|------|------------------------|
| `--msg-ai-bg` | AI 消息背景色 | `rgba(230, 244, 255, 0.9)` |
| `--msg-ai-bg-active` | AI 消息激活/悬停背景色 | `#d3e9ff` |
| `--msg-user-bg` | 用户消息背景色 | `rgba(227, 242, 253, 0.95)` |
| `--msg-user-bg-active` | 用户消息激活/悬停背景色 | 动态计算 |

---

### 按钮颜色变量

| CSS Variable | 描述 | 示例值 (Claude 主题) |
|--------------|------|---------------------|
| `--btn-primary-bg` | 主按钮背景色 | `#D97706` |
| `--btn-secondary-bg` | 次按钮背景色 | `#059669` |

---

### 交互状态颜色变量

| CSS Variable | 描述 | 用途 |
|--------------|------|------|
| `--hover-bg` | 悬停背景色 | 列表项、按钮悬停状态 |
| `--selected-bg` | 选中背景色 | 列表项选中状态 |

---

### 图标颜色变量

| CSS Variable | 描述 | 默认值 |
|--------------|------|--------|
| `--icon-default` | 默认图标颜色 | `#64B5F6` (暗色) / `#1976D2` (亮色) |
| `--icon-success` | 成功状态图标颜色 | `#4CAF50` |
| `--icon-warning` | 警告状态图标颜色 | `#FF9800` |
| `--icon-error` | 错误状态图标颜色 | `#f44336` |
| `--icon-info` | 信息状态图标颜色 | `#2196F3` |

---

### 工具栏颜色变量

| CSS Variable | 描述 | 用途 |
|--------------|------|------|
| `--toolbar-bg` | 工具栏背景色 | 工具栏、浮动按钮背景 |
| `--toolbar-border` | 工具栏边框颜色 | 工具栏边框 |
| `--toolbar-shadow` | 工具栏阴影颜色 | 工具栏阴影效果 |

---

### 侧边栏颜色变量

| CSS Variable | 描述 | 用途 |
|--------------|------|------|
| `--sidebar-bg` | 侧边栏背景色 | 侧边栏主背景 |
| `--sidebar-border` | 侧边栏边框颜色 | 侧边栏边框 |
| `--sidebar-item-hover` | 侧边栏项目悬停色 | 侧边栏项目悬停状态 |
| `--sidebar-item-selected` | 侧边栏项目选中色 | 侧边栏项目选中状态 |
| `--sidebar-item-selected-hover` | 侧边栏项目选中悬停色 | 选中项目悬停状态 |

---

### 输入框颜色变量

| CSS Variable | 描述 | 用途 |
|--------------|------|------|
| `--input-bg` | 输入框背景色 | 文本输入框背景 |
| `--input-border` | 输入框边框颜色 | 输入框默认边框 |
| `--input-border-hover` | 输入框悬停边框色 | 输入框悬停状态边框 |
| `--input-border-focus` | 输入框聚焦边框色 | 输入框聚焦状态边框 |
| `--input-text` | 输入框文字颜色 | 输入框内文字 |
| `--input-placeholder` | 输入框占位符颜色 | 输入框占位符文字 |

---

### 消息块颜色变量

| CSS Variable | 描述 | 用途 |
|--------------|------|------|
| `--msg-block-tool-bg` | 工具调用块背景色 | ToolBlock 组件 |
| `--msg-block-tool-border` | 工具调用块边框色 | ToolBlock 组件边框 |
| `--msg-block-thinking-bg` | 思考过程块背景色 | ThinkingBlock 组件 |
| `--msg-block-file-bg` | 文件块背景色 | FileBlock 组件 |
| `--msg-block-citation-bg` | 引用块背景色 | CitationBlock 组件 |
| `--msg-block-knowledge-bg` | 知识库引用块背景色 | KnowledgeReferenceBlock 组件 |
| `--msg-block-error-bg` | 错误块背景色 | ErrorBlock 组件 |

---

### 渐变变量

| CSS Variable | 描述 | 示例值 (默认主题) |
|--------------|------|-------------------|
| `--gradient-primary` | 主渐变 | `linear-gradient(90deg, #9333EA, #754AB4)` |
| `--gradient-secondary` | 次渐变 | 根据主题定义 |

---

## 🔧 使用方法

### 在组件中使用

#### 1. 在 Material-UI `sx` 属性中使用

```tsx
<Box
  sx={{
    backgroundColor: 'var(--bg-paper)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
  }}
>
  内容
</Box>
```

#### 2. 在 styled-components 中使用

```tsx
const StyledBox = styled(Box)`
  background-color: var(--bg-paper);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
`;
```

#### 3. 在普通 CSS 中使用

```css
.my-component {
  background-color: var(--bg-paper);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

#### 4. 使用辅助函数（不推荐，除非必要）

```tsx
import { cssVar } from '@/shared/utils/cssVariables';

// 在 Material-UI styleOverrides 中使用
styleOverrides: {
  root: {
    backgroundColor: cssVar('bg-paper'),
  },
}
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **直接使用 CSS Variables**
   ```tsx
   sx={{ backgroundColor: 'var(--primary)' }}
   ```

2. **使用语义化的变量名**
   ```tsx
   // 好的
   sx={{ backgroundColor: 'var(--msg-ai-bg)' }}
   
   // 不好的
   sx={{ backgroundColor: '#E6F4FF' }}
   ```

3. **利用 CSS Variables 的层叠特性**
   ```css
   .parent {
     --custom-spacing: 16px;
   }
   
   .child {
     padding: var(--custom-spacing);
   }
   ```

### ❌ 避免做法

1. **不要硬编码颜色值**
   ```tsx
   // ❌ 不好
   sx={{ backgroundColor: '#E6F4FF' }}
   
   // ✅ 好
   sx={{ backgroundColor: 'var(--msg-ai-bg)' }}
   ```

2. **不要在 JavaScript 中计算应该由 CSS 处理的样式**
   ```tsx
   // ❌ 不好
   const bgColor = theme.palette.mode === 'dark' ? '#333' : '#fff';
   
   // ✅ 好
   sx={{ backgroundColor: 'var(--bg-default)' }}
   ```

3. **避免过度使用 getThemeColors**
   ```tsx
   // ❌ 不好（除非真的需要在 JavaScript 中访问颜色值）
   const colors = getThemeColors(theme, themeStyle);
   
   // ✅ 好
   sx={{ backgroundColor: 'var(--bg-default)' }}
   ```

---

## 🔄 主题切换机制

### CSS Variables 如何更新

1. **初始化**：`useTheme` hook 在挂载时注入 CSS Variables
2. **主题切换**：当用户切换主题时，`applyCSSVariables` 函数重新注入新的颜色值
3. **实时更新**：所有使用 CSS Variables 的组件自动获得新颜色

```tsx
// src/hooks/useTheme.ts
useEffect(() => {
  applyCSSVariables(themeStyle, mode);
}, [mode, themeStyle]);
```

### 手动访问 CSS Variables 值

```typescript
import { getCSSVariable } from '@/shared/utils/cssVariables';

// 读取单个变量
const primaryColor = getCSSVariable('primary');
console.log(primaryColor); // 输出: "#64748B"

// 读取多个变量
const bgColor = getCSSVariable('bg-default');
const textColor = getCSSVariable('text-primary');
```

---

## 🛠️ 开发工具

### 在浏览器 DevTools 中查看 CSS Variables

1. 打开 Chrome DevTools (F12)
2. 选择 Elements 面板
3. 查看 `<html>` 元素
4. 在 Styles 面板中查看 `:root` 下的所有 CSS Variables

### 调试技巧

```javascript
// 在浏览器控制台中运行
const root = document.documentElement;
const primaryColor = getComputedStyle(root).getPropertyValue('--primary');
console.log('Primary color:', primaryColor);
```

---

## 📊 类型定义

### Design Tokens 类型

所有 CSS Variables 都源自 TypeScript 的 Design Tokens：

```typescript
// src/shared/design-tokens/types.ts
export interface ColorTokens {
  primary: string;
  secondary: string;
  accent?: string;
  background: string;
  paper: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
}

export interface MessageTokens {
  aiBubbleColor: string;
  aiBubbleActiveColor: string;
  userBubbleColor: string;
  userBubbleActiveColor: string;
}

// ... 更多类型定义
```

---

## 🚀 性能优化

### CSS Variables 的性能优势

1. **避免重绘**：改变 CSS Variable 不会触发布局重排
2. **批量更新**：一次性更新所有使用该变量的元素
3. **减少 JavaScript 计算**：颜色值在 CSS 层面处理，无需 JavaScript 参与

### 性能对比

| 方法 | 主题切换时间 | 内存占用 |
|------|-------------|---------|
| JavaScript 计算 + 内联样式 | ~200ms | 较高 |
| CSS Variables | ~50ms | 较低 |

---

## 📖 相关文档

- [主题迁移指南](./theme-migration-guide.md) - 如何将现有组件迁移到 CSS Variables
- [新主题添加指南](./adding-new-theme.md) - 如何添加新的主题风格
- [CSS Variables 命名规范](./css-variables-naming.md) - 变量命名约定

---

## ❓ 常见问题

### Q: 为什么有些组件还使用 `getThemeColors`？

A: `getThemeColors` 主要用于：
1. 服务层（如 StatusBarService）需要直接访问颜色值
2. 需要在 JavaScript 中动态计算颜色的场景
3. 回退机制，确保 CSS Variables 未注入时也能工作

### Q: CSS Variables 在所有浏览器中都支持吗？

A: CSS Variables (Custom Properties) 在现代浏览器中支持良好：
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

对于不支持的浏览器，会回退到 Design Tokens 中定义的颜色值。

### Q: 如何添加新的 CSS Variable？

A: 请参阅 [新主题添加指南](./adding-new-theme.md) 中的详细步骤。

---

**最后更新：** 2025-11-05  
**维护者：** AetherLink 开发团队

