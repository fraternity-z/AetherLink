# CSS Variables 命名规范

## 概述

本文档定义了 AetherLink 应用中 CSS Variables 的命名规范。所有 CSS Variables 都使用 `--theme-` 前缀，以避免与其他库的变量名冲突。

## 命名原则

1. **统一前缀**: 所有变量以 `--theme-` 开头
2. **语义化命名**: 使用描述性名称，表达变量的用途而非具体值
3. **kebab-case**: 使用中划线分隔单词
4. **分类命名**: 按照功能分类组织变量名

## 变量分类

### 1. 品牌颜色 (Brand Colors)

品牌主色调和强调色。

| CSS Variable | 说明 | 示例值 |
|---|---|---|
| `--theme-primary` | 主色调 | `#64748B` |
| `--theme-secondary` | 辅助色 | `#10B981` |
| `--theme-accent` | 强调色 | `#DC2626` |

### 2. 背景颜色 (Background)

页面和组件的背景色。

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-bg-default` | 默认背景色 | `#FFFFFF` / `#1A1A1A` |
| `--theme-bg-paper` | 纸质背景色（卡片等） | `#FFFFFF` / `#2A2A2A` |
| `--theme-bg-elevated` | 提升层级的背景色 | `#FAFAFA` / `#333333` |

### 3. 文字颜色 (Text)

文本内容的颜色。

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-text-primary` | 主要文字颜色 | `#1E293B` / `#F0F0F0` |
| `--theme-text-secondary` | 次要文字颜色 | `#64748B` / `#B0B0B0` |
| `--theme-text-disabled` | 禁用文字颜色 | `#94A3B8` / `#6B7280` |
| `--theme-text-hint` | 提示文字颜色 | `#CBD5E1` / `#4B5563` |

### 4. 边框颜色 (Border)

边框和分隔线的颜色。

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-border-default` | 默认边框颜色 | `rgba(0,0,0,0.12)` / `rgba(255,255,255,0.12)` |
| `--theme-border-subtle` | 淡雅边框颜色 | `rgba(0,0,0,0.06)` / `rgba(255,255,255,0.06)` |
| `--theme-border-strong` | 加强边框颜色 | `rgba(0,0,0,0.23)` / `rgba(255,255,255,0.23)` |
| `--theme-border-focus` | 聚焦边框颜色 | `#64748B` / `#94A3B8` |

### 5. 交互状态 (Interaction)

用户交互时的视觉反馈。

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-hover-bg` | 悬停背景色 | `rgba(100,116,139,0.08)` / `rgba(100,116,139,0.16)` |
| `--theme-active-bg` | 激活背景色 | `rgba(100,116,139,0.12)` / `rgba(100,116,139,0.24)` |
| `--theme-selected-bg` | 选中背景色 | `rgba(100,116,139,0.16)` / `rgba(100,116,139,0.32)` |
| `--theme-disabled-bg` | 禁用背景色 | `rgba(0,0,0,0.04)` / `rgba(255,255,255,0.04)` |

### 6. 消息气泡 (Message)

聊天消息气泡的样式。

#### 6.1 AI 消息

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-msg-ai-bg` | AI 消息背景色 | `#F8FAFC` / `#2D3748` |
| `--theme-msg-ai-bg-active` | AI 消息悬停背景色 | `#F1F5F9` / `#374151` |
| `--theme-msg-ai-text` | AI 消息文字颜色 | `#1E293B` / `#F0F0F0` |
| `--theme-msg-ai-border` | AI 消息边框颜色 | `rgba(100,116,139,0.2)` / `rgba(100,116,139,0.3)` |

#### 6.2 用户消息

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-msg-user-bg` | 用户消息背景色 | `#E0F2FE` / `#1E3A5F` |
| `--theme-msg-user-bg-active` | 用户消息悬停背景色 | `#BAE6FD` / `#2C5282` |
| `--theme-msg-user-text` | 用户消息文字颜色 | `#0C4A6E` / `#E0F2FE` |
| `--theme-msg-user-border` | 用户消息边框颜色 | `rgba(14,165,233,0.3)` / `rgba(14,165,233,0.4)` |

#### 6.3 系统消息

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-msg-system-bg` | 系统消息背景色 | `#FEF3C7` / `#78350F` |
| `--theme-msg-system-text` | 系统消息文字颜色 | `#78350F` / `#FEF3C7` |
| `--theme-msg-system-border` | 系统消息边框颜色 | `rgba(245,158,11,0.3)` / `rgba(245,158,11,0.4)` |

### 7. 按钮 (Button)

按钮组件的样式。

#### 7.1 主要按钮

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-btn-primary-bg` | 主按钮背景色 | `#64748B` / `#94A3B8` |
| `--theme-btn-primary-text` | 主按钮文字颜色 | `#FFFFFF` / `#0F172A` |
| `--theme-btn-primary-border` | 主按钮边框颜色 | `#64748B` / `#94A3B8` |
| `--theme-btn-primary-hover` | 主按钮悬停色 | `#475569` / `#CBD5E1` |

#### 7.2 次要按钮

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-btn-secondary-bg` | 次按钮背景色 | `#F1F5F9` / `#334155` |
| `--theme-btn-secondary-text` | 次按钮文字颜色 | `#475569` / `#E2E8F0` |
| `--theme-btn-secondary-border` | 次按钮边框颜色 | `#E2E8F0` / `#475569` |
| `--theme-btn-secondary-hover` | 次按钮悬停色 | `#E2E8F0` / `#475569` |

### 8. 输入框 (Input)

输入框和文本域的样式。

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-input-bg` | 输入框背景色 | `#FFFFFF` / `#1E293B` |
| `--theme-input-text` | 输入框文字颜色 | `#1E293B` / `#F0F0F0` |
| `--theme-input-placeholder` | 输入框占位符颜色 | `#94A3B8` / `#64748B` |
| `--theme-input-border` | 输入框边框颜色 | `rgba(0,0,0,0.23)` / `rgba(255,255,255,0.23)` |
| `--theme-input-border-hover` | 输入框悬停边框颜色 | `#64748B` / `#94A3B8` |
| `--theme-input-border-focus` | 输入框聚焦边框颜色 | `#64748B` / `#94A3B8` |

### 9. 侧边栏 (Sidebar)

侧边栏和导航的样式。

| CSS Variable | 说明 | 示例值（亮色/暗色） |
|---|---|---|
| `--theme-sidebar-bg` | 侧边栏背景色 | `#FFFFFF` / `#1A1A1A` |
| `--theme-sidebar-item-hover` | 侧边栏项悬停色 | `rgba(100,116,139,0.08)` / `rgba(100,116,139,0.16)` |
| `--theme-sidebar-item-selected` | 侧边栏项选中色 | `rgba(100,116,139,0.12)` / `rgba(100,116,139,0.24)` |
| `--theme-sidebar-item-selected-hover` | 侧边栏项选中悬停色 | `rgba(100,116,139,0.16)` / `rgba(100,116,139,0.32)` |
| `--theme-sidebar-border` | 侧边栏边框颜色 | `rgba(0,0,0,0.12)` / `rgba(255,255,255,0.12)` |

### 10. 渐变 (Gradients)

渐变效果。

| CSS Variable | 说明 | 示例值 |
|---|---|---|
| `--theme-gradient-primary` | 主渐变 | `linear-gradient(90deg, #9333EA, #754AB4)` |
| `--theme-gradient-secondary` | 辅助渐变 | `linear-gradient(135deg, #059669, #047857)` |

## 使用示例

### 在 TypeScript 中读取

```typescript
import { getCSSVariable } from '@/shared/utils/cssVariables';

// 读取单个变量
const primaryColor = getCSSVariable('primary');

// 读取消息背景色
const msgAiBg = getCSSVariable('msg-ai-bg');
```

### 在 CSS/Styled Components 中使用

```css
/* 直接使用 CSS Variable */
.my-component {
  background-color: var(--theme-bg-paper);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-default);
}

/* 带回退值 */
.my-button {
  background-color: var(--theme-btn-primary-bg, #64748B);
}
```

### 在 Material-UI sx prop 中使用

```typescript
import { cssVar } from '@/shared/utils/cssVariables';

<Box
  sx={{
    backgroundColor: cssVar('bg-paper'),
    color: cssVar('text-primary'),
    borderColor: cssVar('border-default'),
  }}
/>
```

## 命名约定总结

1. **前缀**: 始终使用 `--theme-` 前缀
2. **分类**: 第一层表示功能分类（如 `bg`, `text`, `btn`, `msg` 等）
3. **子类**: 第二层表示具体用途（如 `default`, `paper`, `primary`, `ai` 等）
4. **状态/变体**: 第三层表示状态或变体（如 `hover`, `active`, `focus` 等）

### 常见前缀

- `bg-`: 背景相关
- `text-`: 文字相关
- `border-`: 边框相关
- `btn-`: 按钮相关
- `msg-`: 消息相关
- `input-`: 输入框相关
- `sidebar-`: 侧边栏相关
- `hover-`: 悬停状态
- `active-`: 激活状态
- `selected-`: 选中状态
- `disabled-`: 禁用状态

## 添加新变量的流程

当需要添加新的 CSS Variable 时，请遵循以下流程：

1. **确定分类**: 新变量属于哪个功能分类？
2. **命名**: 按照命名规范创建变量名
3. **更新 Design Tokens**: 在 `src/shared/design-tokens/index.ts` 中添加对应的 token
4. **注入 CSS Variable**: 在 `src/shared/utils/cssVariables.ts` 的 `applyCSSVariables` 函数中添加注入逻辑
5. **更新文档**: 在本文档中添加新变量的说明
6. **测试**: 确保在所有主题和颜色模式下正确显示

## 相关文档

- [Design Tokens 类型定义](../src/shared/design-tokens/types.ts)
- [CSS Variables 工具函数](../src/shared/utils/cssVariables.ts)
- [主题配置](../src/shared/config/themes.ts)
- [主题迁移计划](./theme-migration/theme-migration-plan.md)

## 版本历史

- **v1.0** (2025-11-05): 初始版本，定义了所有基础的 CSS Variables 命名规范







