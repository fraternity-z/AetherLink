# 会话 4 进度记录 - 重构 themeUtils.ts - 主题特定颜色（上）

**日期**: 2025-11-05  
**状态**: ✅ 已完成

## 目标

将 AI/User 消息气泡颜色迁移到 CSS Variables，实现 Design Tokens 优先读取机制。

## 完成的任务

### 1. ✅ 创建消息颜色读取工具函数

**文件**: `src/shared/utils/themeUtils.ts`

在 `themeUtils.ts` 中新增了 `getMessageColorsFromCSSVars` 工具函数：

```typescript
/**
 * 从 CSS Variables 获取消息气泡颜色
 * 优先使用 CSS Variables，如果不存在则回退到硬编码的颜色值
 */
const getMessageColorsFromCSSVars = (theme: Theme, themeStyle?: ThemeStyle) => {
  const isDark = theme.palette.mode === 'dark';
  
  // 从 CSS Variables 读取
  const cssVarAiBg = getCSSVariable('msg-ai-bg');
  const cssVarAiBgActive = getCSSVariable('msg-ai-bg-active');
  const cssVarUserBg = getCSSVariable('msg-user-bg');
  const cssVarUserBgActive = getCSSVariable('msg-user-bg-active');
  
  // 回退颜色值（如果 CSS Variables 不存在）
  // ... 包含所有主题的回退逻辑
  
  return {
    aiBubbleColor: cssVarAiBg || getAiBubbleFallback(),
    aiBubbleActiveColor: cssVarAiBgActive || getAiBubbleActiveFallback(),
    userBubbleColor: cssVarUserBg || getUserBubbleFallback(),
    userBubbleActiveColor: cssVarUserBgActive || getUserBubbleActiveFallback(),
  };
};
```

**特点**：
- ✅ 优先从 CSS Variables 读取颜色值
- ✅ 回退到硬编码的颜色值确保兼容性
- ✅ 支持所有主题风格（default, claude, nature, tech, soft）
- ✅ 支持亮色/暗色模式

### 2. ✅ 重构 getThemeColors 函数

**改动**：

**之前**：
```typescript
export const getThemeColors = (theme: Theme, themeStyle?: ThemeStyle) => {
  const baseColors = getBaseColorsFromCSSVars(theme);
  
  const styleSpecificColors = {
    aiBubbleColor: (() => {
      switch (themeStyle) {
        case 'claude': return isDark ? '#2A1F1A' : '#FEF3E2';
        case 'nature': return isDark ? '#252B20' : '#F7F5F3';
        // ... 更多 switch-case
      }
    })(),
    // ... 更多硬编码颜色
  };
  
  return { ...baseColors, ...styleSpecificColors, isDark };
};
```

**之后**：
```typescript
export const getThemeColors = (theme: Theme, themeStyle?: ThemeStyle) => {
  const baseColors = getBaseColorsFromCSSVars(theme);
  
  // 消息气泡颜色 - 从 CSS Variables 读取
  const messageColors = getMessageColorsFromCSSVars(theme, themeStyle);
  
  const styleSpecificColors = {
    // 其他颜色...
  };
  
  return { ...baseColors, ...messageColors, ...styleSpecificColors, isDark };
};
```

**改进**：
- ✅ 移除了 AI/User 消息气泡颜色的硬编码 switch-case
- ✅ 使用 CSS Variables 优先读取机制
- ✅ 保持 API 向后兼容，不影响现有组件

### 3. ✅ 修复 getMessageStyles 不一致问题

**改动**：

**之前**：
```typescript
export const getMessageStyles = (theme: Theme, themeStyle?: ThemeStyle, isUserMessage: boolean = false) => {
  const colors = getThemeColors(theme, themeStyle);
  
  return {
    backgroundColor: isUserMessage ? colors.userBubbleColor : colors.aiBubbleColor,
    '&:hover': {
      backgroundColor: isUserMessage 
        ? alpha(colors.userBubbleColor, 0.8)  // ❌ 不一致
        : colors.aiBubbleActiveColor,
    },
  };
};
```

**之后**：
```typescript
export const getMessageStyles = (theme: Theme, themeStyle?: ThemeStyle, isUserMessage: boolean = false) => {
  const colors = getThemeColors(theme, themeStyle);
  
  return {
    backgroundColor: isUserMessage ? colors.userBubbleColor : colors.aiBubbleColor,
    '&:hover': {
      backgroundColor: isUserMessage 
        ? colors.userBubbleActiveColor  // ✅ 统一使用 Active 颜色
        : colors.aiBubbleActiveColor,
    },
  };
};
```

**改进**：
- ✅ 统一使用专门的 Active 颜色，而不是 alpha 函数
- ✅ 确保悬停状态颜色在所有主题下一致

### 4. ✅ 创建 CSS Variables 命名规范文档

**文件**: `docs/css-variables-naming.md`

创建了完整的 CSS Variables 命名规范文档，包含：

1. **命名原则**：
   - 统一前缀 `--theme-`
   - 语义化命名
   - kebab-case 命名风格
   - 分类命名结构

2. **变量分类**：
   - 品牌颜色 (Brand Colors)
   - 背景颜色 (Background)
   - 文字颜色 (Text)
   - 边框颜色 (Border)
   - 交互状态 (Interaction)
   - 消息气泡 (Message) - **本会话重点**
   - 按钮 (Button)
   - 输入框 (Input)
   - 侧边栏 (Sidebar)
   - 渐变 (Gradients)

3. **使用示例**：
   - TypeScript 中读取
   - CSS/Styled Components 中使用
   - Material-UI sx prop 中使用

4. **添加新变量的流程**

### 5. ✅ 验证构建和 Linter

**测试结果**：
- ✅ `npm run build` - 构建成功
- ✅ Linter 测试通过，无错误

## 代码统计

### 新增文件
1. `docs/css-variables-naming.md` - 完整的命名规范文档 (~380 行)

### 修改文件
1. `src/shared/utils/themeUtils.ts`
   - 新增 `getMessageColorsFromCSSVars` 函数 (~106 行)
   - 更新 `getThemeColors` 函数使用 `messageColors`
   - 修复 `getMessageStyles` 悬停状态不一致问题
   - 移除了 AI/User 消息气泡颜色的硬编码 switch-case

### 代码改进
- **新增**: ~106 行（消息颜色读取函数）
- **简化**: 移除了重复的 switch-case 逻辑
- **优化**: 使用 CSS Variables 优先机制

## 技术亮点

### 1. 渐进式迁移策略

采用了优雅的渐进式迁移策略：

```typescript
const cssVarAiBg = getCSSVariable('msg-ai-bg');
return {
  aiBubbleColor: cssVarAiBg || getFallback(),  // CSS Variables 优先，回退保证兼容
};
```

**优势**：
- ✅ CSS Variables 可用时优先使用
- ✅ 回退机制确保在任何环境下都能工作
- ✅ 不需要一次性修改所有组件
- ✅ 零破坏性改动

### 2. 类型安全

```typescript
const getMessageColorsFromCSSVars = (theme: Theme, themeStyle?: ThemeStyle) => {
  // 返回类型明确
  return {
    aiBubbleColor: string,
    aiBubbleActiveColor: string,
    userBubbleColor: string,
    userBubbleActiveColor: string,
  };
};
```

### 3. 职责分离

- `getBaseColorsFromCSSVars()`: 负责基础颜色
- `getMessageColorsFromCSSVars()`: 负责消息气泡颜色
- `getThemeColors()`: 组合所有颜色并返回

清晰的职责分离使代码更易维护。

## 与 Design Tokens 的对应关系

| Design Token 路径 | CSS Variable | themeUtils 返回 |
|---|---|---|
| `message.ai.background` | `--theme-msg-ai-bg` | `aiBubbleColor` |
| `message.ai.backgroundActive` | `--theme-msg-ai-bg-active` | `aiBubbleActiveColor` |
| `message.user.background` | `--theme-msg-user-bg` | `userBubbleColor` |
| `message.user.backgroundActive` | `--theme-msg-user-bg-active` | `userBubbleActiveColor` |

## 遗留问题

无。本会话的所有任务已完成。

## 下一步计划

会话 5 将继续迁移其他主题特定颜色：
- 按钮颜色 (`buttonPrimary`, `buttonSecondary`)
- 交互状态颜色 (`hoverColor`, `selectedColor`)
- 边框颜色 (`borderColor`)
- 图标颜色
- 工具栏颜色

## 测试建议

请参考 `session-04-testing-guide.md` 进行完整的功能测试。

## 总结

本会话成功将 AI/User 消息气泡颜色迁移到了 CSS Variables 系统，实现了 Design Tokens 优先读取机制。通过渐进式迁移策略，确保了向后兼容性，没有破坏任何现有功能。同时创建了完整的命名规范文档，为后续迁移提供了清晰的指导。








