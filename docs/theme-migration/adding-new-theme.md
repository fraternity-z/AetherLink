# 新主题添加指南

## 📋 概述

本指南详细说明如何在 AetherLink 主题系统中添加新的主题风格。通过 Design Tokens 和 CSS Variables 系统，添加新主题变得简单而安全。

## 🎯 添加新主题的步骤

### 步骤 1: 设计主题配色方案

在开始编码之前，先规划好你的主题配色。建议使用配色工具：

- [Adobe Color](https://color.adobe.com/)
- [Coolors](https://coolors.co/)
- [Material Design Color Tool](https://material.io/resources/color/)

#### 配色方案模板

创建一个配色方案文档（可以使用下面的模板）：

```yaml
主题名称: Ocean（海洋主题）
描述: 清新的海洋蓝色系设计

# 基础颜色
主色调: #0EA5E9 (天空蓝)
次要色调: #06B6D4 (青色)
强调色: #F59E0B (琥珀色)

# 背景色
亮色模式:
  默认背景: #F0F9FF
  卡片背景: #FFFFFF
暗色模式:
  默认背景: #0C1A2E
  卡片背景: #1E3A5F

# 文字颜色
亮色模式:
  主要文字: #0F172A
  次要文字: #475569
暗色模式:
  主要文字: #F1F5F9
  次要文字: #94A3B8

# 消息气泡颜色
亮色模式:
  AI 气泡: #E0F2FE
  AI 气泡激活: #BAE6FD
  用户气泡: #F0F9FF
  用户气泡激活: #E0F2FE
暗色模式:
  AI 气泡: #1E3A5F
  AI 气泡激活: #2E4A6F
  用户气泡: #0C2744
  用户气泡激活: #1C3754

# 按钮颜色
主按钮: #0EA5E9
次按钮: #06B6D4

# 交互状态颜色
亮色模式:
  悬停: rgba(14, 165, 233, 0.08)
  选中: rgba(14, 165, 233, 0.12)
暗色模式:
  悬停: rgba(14, 165, 233, 0.12)
  选中: rgba(14, 165, 233, 0.16)
```

---

### 步骤 2: 更新 ThemeStyle 类型定义

首先，在类型定义中添加新主题：

**文件：** `src/shared/config/themes.ts`

```typescript
// 主题风格类型
export type ThemeStyle = 'default' | 'claude' | 'nature' | 'tech' | 'soft' | 'ocean'; // 添加 'ocean'
```

---

### 步骤 3: 添加 ThemeConfig

在 `themeConfigs` 对象中添加新主题配置：

**文件：** `src/shared/config/themes.ts`

```typescript
export const themeConfigs: Record<ThemeStyle, ThemeConfig> = {
  // ... 现有主题 ...

  ocean: {
    name: '海洋主题',
    description: '清新的海洋蓝色系设计',
    colors: {
      primary: '#0EA5E9', // 天空蓝
      secondary: '#06B6D4', // 青色
      accent: '#F59E0B', // 琥珀色
      background: {
        light: '#F0F9FF', // 清新的浅蓝色背景
        dark: '#0C1A2E', // 深海蓝黑色
      },
      paper: {
        light: '#FFFFFF', // 白色卡片
        dark: '#1E3A5F', // 深蓝灰色
      },
      text: {
        primary: {
          light: '#0F172A', // 深蓝黑色文字
          dark: '#F1F5F9', // 淡蓝白色文字
        },
        secondary: {
          light: '#475569', // 灰蓝色次要文字
          dark: '#94A3B8', // 浅灰蓝色次要文字
        },
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', // 蓝色渐变
      secondary: 'linear-gradient(135deg, #06B6D4, #0EA5E9)', // 青蓝渐变
    },
  },
};
```

---

### 步骤 4: 添加 Design Tokens

在 Design Tokens 中为新主题定义所有颜色值。

**文件：** `src/shared/design-tokens/index.ts`

```typescript
/**
 * Ocean 主题 - 清新的海洋蓝色系设计
 */
const oceanTheme: ThemeTokens = {
  // 基础颜色
  colors: {
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    accent: '#F59E0B',
    background: '#F0F9FF',
    paper: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    divider: 'rgba(15, 23, 42, 0.12)',
  },

  // 消息气泡颜色
  message: {
    aiBubbleColor: '#E0F2FE',
    aiBubbleActiveColor: '#BAE6FD',
    userBubbleColor: '#F0F9FF',
    userBubbleActiveColor: '#E0F2FE',
  },

  // 按钮颜色
  button: {
    primaryBg: '#0EA5E9',
    secondaryBg: '#06B6D4',
  },

  // 交互状态颜色
  interaction: {
    hoverColor: 'rgba(14, 165, 233, 0.08)',
    selectedColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },

  // 图标颜色
  icon: {
    default: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },

  // 工具栏颜色
  toolbar: {
    bg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(226, 232, 240, 0.8)',
    shadow: 'rgba(14, 165, 233, 0.1)',
  },

  // 侧边栏颜色
  sidebar: {
    bg: '#F0F9FF',
    border: 'rgba(14, 165, 233, 0.15)',
    itemHover: 'rgba(14, 165, 233, 0.08)',
    itemSelected: 'rgba(14, 165, 233, 0.12)',
    itemSelectedHover: 'rgba(14, 165, 233, 0.16)',
  },

  // 输入框颜色
  input: {
    bg: '#FFFFFF',
    border: 'rgba(14, 165, 233, 0.2)',
    borderHover: 'rgba(14, 165, 233, 0.4)',
    borderFocus: '#0EA5E9',
    text: '#0F172A',
    placeholder: '#94A3B8',
  },

  // 消息块颜色
  messageBlock: {
    toolBg: 'rgba(14, 165, 233, 0.05)',
    toolBorder: 'rgba(14, 165, 233, 0.2)',
    thinkingBg: 'rgba(236, 72, 153, 0.05)',
    fileBg: 'rgba(139, 92, 246, 0.05)',
    citationBg: 'rgba(251, 146, 60, 0.05)',
    knowledgeBg: 'rgba(34, 197, 94, 0.05)',
    errorBg: 'rgba(239, 68, 68, 0.1)',
  },

  // 渐变
  gradients: {
    primary: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
    secondary: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
  },
};

// 暗色模式
const oceanThemeDark: ThemeTokens = {
  // 基础颜色
  colors: {
    primary: '#38BDF8',
    secondary: '#22D3EE',
    accent: '#FBBF24',
    background: '#0C1A2E',
    paper: '#1E3A5F',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    divider: 'rgba(241, 245, 249, 0.12)',
  },

  // 消息气泡颜色
  message: {
    aiBubbleColor: '#1E3A5F',
    aiBubbleActiveColor: '#2E4A6F',
    userBubbleColor: '#0C2744',
    userBubbleActiveColor: '#1C3754',
  },

  // 按钮颜色
  button: {
    primaryBg: '#38BDF8',
    secondaryBg: '#22D3EE',
  },

  // 交互状态颜色
  interaction: {
    hoverColor: 'rgba(56, 189, 248, 0.12)',
    selectedColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },

  // 图标颜色
  icon: {
    default: '#38BDF8',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#22D3EE',
  },

  // 工具栏颜色
  toolbar: {
    bg: 'rgba(30, 58, 95, 0.9)',
    border: 'rgba(56, 189, 248, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  // 侧边栏颜色
  sidebar: {
    bg: '#0C1A2E',
    border: 'rgba(56, 189, 248, 0.2)',
    itemHover: 'rgba(56, 189, 248, 0.12)',
    itemSelected: 'rgba(56, 189, 248, 0.16)',
    itemSelectedHover: 'rgba(56, 189, 248, 0.2)',
  },

  // 输入框颜色
  input: {
    bg: '#1E3A5F',
    border: 'rgba(56, 189, 248, 0.3)',
    borderHover: 'rgba(56, 189, 248, 0.5)',
    borderFocus: '#38BDF8',
    text: '#F1F5F9',
    placeholder: '#64748B',
  },

  // 消息块颜色
  messageBlock: {
    toolBg: 'rgba(56, 189, 248, 0.1)',
    toolBorder: 'rgba(56, 189, 248, 0.3)',
    thinkingBg: 'rgba(244, 114, 182, 0.1)',
    fileBg: 'rgba(167, 139, 250, 0.1)',
    citationBg: 'rgba(251, 146, 60, 0.1)',
    knowledgeBg: 'rgba(74, 222, 128, 0.1)',
    errorBg: 'rgba(248, 113, 113, 0.15)',
  },

  // 渐变
  gradients: {
    primary: 'linear-gradient(135deg, #38BDF8, #22D3EE)',
    secondary: 'linear-gradient(135deg, #22D3EE, #38BDF8)',
  },
};

// 导出主题映射
export const themeTokens: Record<string, { light: ThemeTokens; dark: ThemeTokens }> = {
  // ... 现有主题 ...
  
  ocean: {
    light: oceanTheme,
    dark: oceanThemeDark,
  },
};
```

---

### 步骤 5: 更新国际化文本

为新主题添加显示名称和描述。

**文件：** `src/i18n/locales/zh-CN/settings.json`（在 `appearance.themeStyle.themes` 部分添加）

```json
{
  "appearance": {
    "themeStyle": {
      "themes": {
        "ocean": {
          "name": "海洋风格",
          "description": "2025年流行的海洋蓝绿色系，清新舒适的视觉体验"
        }
      }
    }
  }
}
```

**文件：** `src/i18n/locales/en-US/settings.json`（在 `appearance.themeStyle.themes` 部分添加）

```json
{
  "appearance": {
    "themeStyle": {
      "themes": {
        "ocean": {
          "name": "Ocean Style",
          "description": "Popular 2025 ocean blue-green color scheme with fresh and comfortable visual experience"
        }
      }
    }
  }
}
```

**注意：** 翻译文件已模块化拆分，主题相关的翻译都在 `settings.json` 文件中。

---

### 步骤 6: 测试新主题

#### 6.1 手动测试

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **切换到新主题**
   - 打开设置页面
   - 选择"外观设置"
   - 在"主题风格"下拉菜单中选择"海洋主题"

3. **测试所有场景**
   - ✅ 亮色/暗色模式切换
   - ✅ 消息气泡显示
   - ✅ 按钮和交互元素
   - ✅ 侧边栏和导航
   - ✅ 输入框和表单
   - ✅ 消息块（工具调用、思考过程等）
   - ✅ 所有页面和对话框

#### 6.2 浏览器 DevTools 检查

1. 打开 Chrome DevTools (F12)
2. 选择 Elements 面板
3. 查看 `<html>` 元素
4. 在 Styles 面板中检查 `:root` 下的 CSS Variables
5. 确认所有变量都有正确的值

#### 6.3 对比测试

与其他主题对比，确保：
- 配色协调美观
- 文字清晰可读
- 对比度符合可访问性标准（WCAG AA 级别）

---

### 步骤 7: 优化和微调

根据测试结果进行微调：

#### 对比度检查

使用 [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) 检查文字和背景的对比度：

- **正文文字**：对比度至少 4.5:1
- **大号文字**（18pt+）：对比度至少 3:1
- **UI 元素**：对比度至少 3:1

#### 颜色和谐性

确保主题中的颜色搭配和谐：
- 主色、次色、强调色应该形成良好的视觉层次
- 避免使用过于鲜艳或刺眼的颜色
- 考虑色盲用户的体验

---

## 🎨 设计最佳实践

### 1. 选择基础色

- **主色**：品牌色或主题的核心颜色
- **次色**：与主色互补或对比的颜色
- **强调色**：用于重要操作或警告

### 2. 背景和文字颜色

- **亮色模式**：浅色背景 + 深色文字
- **暗色模式**：深色背景 + 浅色文字
- **对比度**：确保足够的对比度以提高可读性

### 3. 交互状态颜色

- **悬停**：比默认状态稍深或稍亮
- **选中**：明显区别于默认状态
- **禁用**：降低饱和度和不透明度

### 4. 消息气泡颜色

- **AI 消息**：使用主题的主色或次色系
- **用户消息**：与 AI 消息有明显区别
- **激活状态**：比默认状态稍深或稍亮，提供反馈

### 5. 语义颜色

- **成功**：绿色系（#10B981）
- **警告**：橙色系（#F59E0B）
- **错误**：红色系（#EF4444）
- **信息**：蓝色系（#3B82F6）

---

## 📝 完整示例：添加 "Sunset" 主题

下面是一个完整的示例，展示如何添加一个"日落"主题：

### 1. 更新类型定义

```typescript
// src/shared/config/themes.ts
export type ThemeStyle = 'default' | 'claude' | 'nature' | 'tech' | 'soft' | 'sunset';
```

### 2. 添加 ThemeConfig

```typescript
// src/shared/config/themes.ts
sunset: {
  name: '日落主题',
  description: '温暖的日落色调设计',
  colors: {
    primary: '#F97316', // 橙色
    secondary: '#EC4899', // 粉红色
    accent: '#FBBF24', // 黄色
    background: {
      light: '#FFF7ED',
      dark: '#1C1917',
    },
    paper: {
      light: '#FFFFFF',
      dark: '#292524',
    },
    text: {
      primary: {
        light: '#1C1917',
        dark: '#FAFAF9',
      },
      secondary: {
        light: '#78716C',
        dark: '#A8A29E',
      },
    },
  },
  gradients: {
    primary: 'linear-gradient(135deg, #F97316, #EC4899)',
    secondary: 'linear-gradient(135deg, #EC4899, #FBBF24)',
  },
},
```

### 3. 添加 Design Tokens

```typescript
// src/shared/design-tokens/index.ts
const sunsetTheme: ThemeTokens = {
  colors: {
    primary: '#F97316',
    secondary: '#EC4899',
    accent: '#FBBF24',
    background: '#FFF7ED',
    paper: '#FFFFFF',
    textPrimary: '#1C1917',
    textSecondary: '#78716C',
    divider: 'rgba(28, 25, 23, 0.12)',
  },
  message: {
    aiBubbleColor: '#FFEDD5',
    aiBubbleActiveColor: '#FED7AA',
    userBubbleColor: '#FCE7F3',
    userBubbleActiveColor: '#FBCFE8',
  },
  button: {
    primaryBg: '#F97316',
    secondaryBg: '#EC4899',
  },
  interaction: {
    hoverColor: 'rgba(249, 115, 22, 0.08)',
    selectedColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  icon: {
    default: '#F97316',
    success: '#10B981',
    warning: '#FBBF24',
    error: '#EF4444',
    info: '#3B82F6',
  },
  toolbar: {
    bg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(254, 215, 170, 0.8)',
    shadow: 'rgba(249, 115, 22, 0.1)',
  },
  sidebar: {
    bg: '#FFF7ED',
    border: 'rgba(249, 115, 22, 0.15)',
    itemHover: 'rgba(249, 115, 22, 0.08)',
    itemSelected: 'rgba(249, 115, 22, 0.12)',
    itemSelectedHover: 'rgba(249, 115, 22, 0.16)',
  },
  input: {
    bg: '#FFFFFF',
    border: 'rgba(249, 115, 22, 0.2)',
    borderHover: 'rgba(249, 115, 22, 0.4)',
    borderFocus: '#F97316',
    text: '#1C1917',
    placeholder: '#A8A29E',
  },
  messageBlock: {
    toolBg: 'rgba(249, 115, 22, 0.05)',
    toolBorder: 'rgba(249, 115, 22, 0.2)',
    thinkingBg: 'rgba(236, 72, 153, 0.05)',
    fileBg: 'rgba(139, 92, 246, 0.05)',
    citationBg: 'rgba(251, 191, 36, 0.05)',
    knowledgeBg: 'rgba(34, 197, 94, 0.05)',
    errorBg: 'rgba(239, 68, 68, 0.1)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #F97316, #EC4899)',
    secondary: 'linear-gradient(135deg, #EC4899, #FBBF24)',
  },
};

const sunsetThemeDark: ThemeTokens = {
  // ... 暗色模式配置
};

// 添加到导出
export const themeTokens: Record<string, { light: ThemeTokens; dark: ThemeTokens }> = {
  // ...
  sunset: {
    light: sunsetTheme,
    dark: sunsetThemeDark,
  },
};
```

### 4. 更新国际化

在 `src/i18n/locales/zh-CN/settings.json` 和 `src/i18n/locales/en-US/settings.json` 的 `appearance.themeStyle.themes` 部分添加：

```json
// src/i18n/locales/zh-CN/settings.json
{
  "appearance": {
    "themeStyle": {
      "themes": {
        "sunset": {
          "name": "日落风格",
          "description": "2025年流行的日落色系，温暖浪漫的视觉氛围"
        }
      }
    }
  }
}
```

**注意：** 翻译文件已模块化拆分，请修改对应的模块文件（本例为 `settings.json`）。

---

## ⚠️ 常见陷阱和注意事项

### 1. 忘记添加暗色模式

❌ **错误：** 只定义亮色模式的 Design Tokens

✅ **正确：** 同时定义 `light` 和 `dark` 两种模式

### 2. 颜色对比度不足

❌ **错误：** 浅灰色文字 + 白色背景

✅ **正确：** 使用对比度检查工具验证所有颜色组合

### 3. 忘记更新所有颜色类别

❌ **错误：** 只定义基础颜色，遗漏消息块颜色

✅ **正确：** 确保所有颜色类别都有定义

### 4. 硬编码颜色值

❌ **错误：** 在组件中使用 `#F97316`

✅ **正确：** 使用 CSS Variables `var(--primary)`

---

## 📊 检查清单

在提交新主题前，使用此清单进行最后检查：

- [ ] 更新了 `ThemeStyle` 类型定义
- [ ] 在 `themeConfigs` 中添加了主题配置
- [ ] 为亮色和暗色模式都添加了 Design Tokens
- [ ] 定义了所有必需的颜色类别（基础、消息、按钮、交互、图标、工具栏、侧边栏、输入框、消息块、渐变）
- [ ] 更新了所有语言的国际化文本
- [ ] 测试了所有主题切换场景
- [ ] 验证了对比度符合可访问性标准
- [ ] 检查了所有页面和组件的显示效果
- [ ] 没有控制台错误或警告
- [ ] 代码已经过审查和优化

---

## 🚀 发布新主题

### 1. 文档更新

更新以下文档：
- `README.md` - 添加新主题的说明
- `CHANGELOG.md` - 记录新主题的添加

### 2. 版本控制

```bash
git add .
git commit -m "feat: add Sunset theme with warm color palette"
git push
```

### 3. 发布说明

在发布说明中提及新主题：

```markdown
## 新功能

- 🎨 添加日落主题：温暖的日落色调设计，适合喜欢暖色系的用户
```

---

## 📚 相关资源

- [CSS Variables API 文档](./css-variables-api.md) - CSS Variables 完整列表
- [主题迁移指南](./theme-migration-guide.md) - 迁移现有组件
- [Design Tokens 系统](../src/shared/design-tokens/README.md) - Design Tokens 详细说明

---

## 💡 主题设计灵感

### 热门配色网站

- [Dribbble](https://dribbble.com/) - 设计作品展示
- [Behance](https://www.behance.net/) - 创意作品集
- [Pinterest](https://www.pinterest.com/) - 视觉灵感
- [Color Hunt](https://colorhunt.co/) - 配色方案集合

### Material Design 主题

- [Material Design 3](https://m3.material.io/) - Google 的设计系统
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) - 主题生成工具

### 主题示例

1. **极简主义**：单色系，高对比度，简洁线条
2. **自然系**：大地色，柔和渐变，温暖氛围
3. **科技感**：冷色调，玻璃态效果，未来感
4. **复古风**：复古色，怀旧氛围，经典美学
5. **多彩系**：丰富颜色，活泼设计，年轻化

---

**最后更新：** 2025-11-05  
**维护者：** AetherLink 开发团队

