# AetherLink i18n 国际化指南

## 📋 目录

- [概述](#概述)
- [技术栈](#技术栈)
- [文件结构](#文件结构)
- [主要文件说明](#主要文件说明)
- [使用方法](#使用方法)
- [已完成的页面](#已完成的页面)
- [翻译键值命名规范](#翻译键值命名规范)
- [扩展指南](#扩展指南)
- [最佳实践](#最佳实践)

## 概述

AetherLink 项目已集成 `i18next` 和 `react-i18next` 实现完整的国际化（i18n）支持。目前支持简体中文和英文，可以轻松扩展支持更多语言。

### 核心特性

- ✅ 自动语言检测（浏览器语言、localStorage）
- ✅ 语言切换实时生效
- ✅ Redux 状态同步
- ✅ 持久化存储（localStorage）
- ✅ TypeScript 类型支持
- ✅ 嵌套翻译键值支持

## 技术栈

- **i18next**: 核心国际化框架
- **react-i18next**: React 集成
- **i18next-browser-languagedetector**: 浏览器语言检测

## 文件结构

```
src/
├── i18n/                          # i18n 核心目录
│   ├── config.ts                  # i18n 配置文件
│   ├── useLanguageSettings.ts     # 语言设置 Hook
│   ├── index.ts                   # 导出文件
│   └── locales/                   # 语言资源文件目录（模块化）
│       ├── zh-CN/                 # 简体中文翻译（模块化）
│       │   ├── common.json        # 通用翻译
│       │   ├── welcome.json       # 欢迎页
│       │   ├── chat.json          # 聊天相关
│       │   ├── notifications.json # 通知
│       │   ├── errors.json        # 错误信息
│       │   ├── settings.json      # 设置（大文件）
│       │   ├── modelSettings.json # 模型设置
│       │   └── aiDebate.json      # AI辩论
│       └── en-US/                 # 英文翻译（模块化）
│           ├── common.json
│           ├── welcome.json
│           ├── chat.json
│           ├── notifications.json
│           ├── errors.json
│           ├── settings.json
│           ├── modelSettings.json
│           └── aiDebate.json
├── main.tsx                       # 应用入口（初始化 i18n）
├── pages/
│   ├── WelcomePage.tsx           # 欢迎页面（已国际化）
│   ├── Settings/
│   │   └── index.tsx             # 设置主页面（已国际化）
│   └── SettingsPage.tsx          # 设置页面重定向（已国际化）
└── shared/
    └── store/
        └── slices/
            └── settingsSlice.ts  # 设置状态（包含 language 字段）
```

## 主要文件说明

### 1. `src/i18n/config.ts`

i18n 核心配置文件，负责：
- 初始化 i18next 实例
- 配置语言资源
- 设置语言检测策略
- 定义支持的语言列表

**关键配置：**
```typescript
// 支持的语言
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

// 默认语言
export const defaultLanguage = 'zh-CN';

// 语言检测顺序：localStorage → navigator → htmlTag
// 缓存到 localStorage
```

### 2. `src/i18n/useLanguageSettings.ts`

自定义 Hook，用于管理语言设置：
- 同步 Redux store 和 i18n 语言
- 提供 `changeLanguage` 方法切换语言
- 监听语言变化事件

**使用示例：**
```typescript
const { currentLanguage, changeLanguage } = useLanguageSettings();
changeLanguage('en-US'); // 切换到英文
```

### 3. `src/i18n/index.ts`

统一导出文件，提供：
- `useTranslation` Hook（从 react-i18next）
- `useLanguageSettings` Hook
- `supportedLanguages` 语言列表
- `defaultLanguage` 默认语言
- `i18n` 实例

### 4. `src/i18n/locales/zh-CN/` 和 `src/i18n/locales/en-US/`

翻译资源文件采用模块化结构，按功能拆分为多个 JSON 文件：

**模块文件：**
- `common.json` - 通用翻译（按钮、操作等基础文本）
- `welcome.json` - 欢迎页翻译
- `chat.json` - 聊天功能翻译
- `notifications.json` - 通知相关翻译
- `errors.json` - 错误信息翻译
- `settings.json` - 设置页面翻译（较大的文件）
- `modelSettings.json` - 模型设置翻译
- `aiDebate.json` - AI 辩论功能翻译

**优势：**
- ✅ 文件更小，易于维护
- ✅ 便于 AI 修改特定模块
- ✅ 结构清晰，按功能组织
- ✅ 系统自动合并加载

**结构示例：**

`common.json`:
```json
{
  "loading": "加载中...",
  "error": "错误",
  "save": "保存",
  "cancel": "取消"
}
```

`settings.json`:
```json
{
  "title": "设置",
  "groups": {
    "basic": "基本设置"
  },
  "items": {
    "appearance": {
      "title": "外观",
      "description": "主题、字体大小和语言设置"
    }
  }
}
```

系统在 `config.ts` 中会自动将所有模块文件合并为完整的翻译对象，使用方式与之前完全一致。

### 6. `src/main.tsx`

应用入口文件，在应用启动时初始化 i18n：

```typescript
// 初始化i18n
import './i18n/config';
```

### 7. `src/shared/store/slices/settingsSlice.ts`

Redux 设置状态，包含 `language` 字段：
- 默认值：`'zh-CN'`
- 持久化到 IndexedDB
- 与 i18n 语言同步

## 使用方法

### 在组件中使用翻译

#### 基本用法

```typescript
import { useTranslation } from '../i18n';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('settings.title')}</h1>
      <p>{t('settings.items.appearance.description')}</p>
    </div>
  );
};
```

#### 使用语言设置 Hook

```typescript
import { useLanguageSettings } from '../i18n';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguageSettings();
  
  return (
    <select 
      value={currentLanguage} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="zh-CN">简体中文</option>
      <option value="en-US">English</option>
    </select>
  );
};
```

#### 带变量的翻译

```typescript
// 在 JSON 文件中
{
  "greeting": "你好，{{name}}！"
}

// 在组件中使用
{t('greeting', { name: '张三' })}  // "你好，张三！"
```

## 已完成的页面

### ✅ 已完成国际化的页面

1. **WelcomePage** (`src/pages/WelcomePage.tsx`)
   - 页面标题
   - 副标题
   - 开始按钮
   - 错误提示

2. **Settings 主页面** (`src/pages/Settings/index.tsx`)
   - 页面标题
   - 所有设置组标题
   - 所有设置项的标题和描述
   - 错误提示

3. **SettingsPage 重定向** (`src/pages/SettingsPage.tsx`)
   - 加载文本

4. **AppearanceSettings** (`src/pages/Settings/AppearanceSettings.tsx`)
   - 语言选择器（在设置页面中）

5. **TopToolbarDIYSettings** (`src/pages/Settings/TopToolbarDIYSettings.tsx`)

6. **ChatInterfaceSettings** (`src/pages/Settings/ChatInterfaceSettings.tsx`)

7. **ThinkingProcessSettings** (`src/pages/Settings/ThinkingProcessSettings.tsx`)

8. **MessageBubbleSettings** (`src/pages/Settings/MessageBubbleSettings.tsx`)

9. **ToolbarCustomization** (`src/pages/Settings/ToolbarCustomization.tsx`)

10. **InputBoxSettings** (`src/pages/Settings/InputBoxSettings.tsx`)
    - 子组件：DraggableButtonConfig (`src/components/DraggableButtonConfig.tsx`)

### 📝 待国际化的页面

以下页面还未完全国际化，需要逐步迁移：

#### 其他设置页面

- BehaviorSettings
- DefaultModelSettings
- VoiceSettings
- DataSettings
- KnowledgeSettings
- AboutPage
- 其他设置子页面

## 翻译键值命名规范

### 推荐结构

使用嵌套结构，按功能模块组织：

```json
{
  "模块名": {
    "组件名": {
      "元素名": "翻译文本"
    }
  }
}
```

### 命名示例

```typescript
// ✅ 推荐
t('settings.items.appearance.title')
t('chat.input.placeholder')
t('welcome.subtitle')

// ❌ 不推荐（扁平结构，难以维护）
t('settings_appearance_title')
t('chat_input_placeholder')
```

### 常见命名模式

- **页面标题**: `模块名.title`
- **分组标题**: `模块名.groups.分组名`
- **列表项**: `模块名.items.项名.title` 和 `模块名.items.项名.description`
- **按钮**: `模块名.按钮名`
- **通用文本**: `common.文本名`

## 扩展指南

### 添加新语言

1. **创建语言资源目录和模块文件**

在 `src/i18n/locales/` 目录下创建新语言目录，例如 `ja-JP/`，并创建所有模块文件：

```bash
src/i18n/locales/ja-JP/
├── common.json
├── welcome.json
├── chat.json
├── notifications.json
├── errors.json
├── settings.json
├── modelSettings.json
└── aiDebate.json
```

**示例：`ja-JP/common.json`**
```json
{
  "loading": "読み込み中...",
  "error": "エラー",
  "save": "保存",
  "cancel": "キャンセル"
}
```

**示例：`ja-JP/settings.json`**
```json
{
  "title": "設定",
  "groups": {
    "basic": "基本設定"
  }
}
```

2. **更新配置文件**

在 `src/i18n/config.ts` 中导入并添加新语言：

```typescript
// 导入日文模块
import jaCommon from './locales/ja-JP/common.json';
import jaWelcome from './locales/ja-JP/welcome.json';
import jaChat from './locales/ja-JP/chat.json';
import jaNotifications from './locales/ja-JP/notifications.json';
import jaErrors from './locales/ja-JP/errors.json';
import jaSettings from './locales/ja-JP/settings.json';
import jaModelSettings from './locales/ja-JP/modelSettings.json';
import jaAiDebate from './locales/ja-JP/aiDebate.json';

// 合并日文模块
const resources = {
  'zh-CN': {
    translation: mergeModules(
      { common: zhCommon },
      { welcome: zhWelcome },
      { chat: zhChat },
      { notifications: zhNotifications },
      { errors: zhErrors },
      { settings: zhSettings },
      { modelSettings: zhModelSettings },
      { aiDebate: zhAiDebate }
    ),
  },
  'en-US': {
    translation: mergeModules(
      // ... 英文模块
    ),
  },
  'ja-JP': {
    translation: mergeModules(
      { common: jaCommon },
      { welcome: jaWelcome },
      { chat: jaChat },
      { notifications: jaNotifications },
      { errors: jaErrors },
      { settings: jaSettings },
      { modelSettings: jaModelSettings },
      { aiDebate: jaAiDebate }
    ),
  },
};

export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' }, // 新增
];
```

### 为新页面添加国际化

1. **添加翻译键值**

根据新页面所属的功能模块，在对应的模块文件中添加翻译。例如，如果是设置相关的页面，在 `settings.json` 中添加；如果是新的功能模块，可以创建新的模块文件。

**方式一：添加到现有模块文件**

例如在 `zh-CN/settings.json` 和 `en-US/settings.json` 中添加：

```json
{
  "newPage": {
    "title": "新页面",
    "subtitle": "这是新页面的副标题",
    "button": {
      "save": "保存",
      "cancel": "取消"
    }
  }
}
```

2. **在组件中使用**

```typescript
import { useTranslation } from '../i18n';

const NewPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('newPage.title')}</h1>
      <p>{t('newPage.subtitle')}</p>
      <button>{t('newPage.button.save')}</button>
    </div>
  );
};
```


### 添加翻译键值检查脚本

可以创建一个脚本检查所有翻译键值是否完整：

```typescript
// scripts/check-i18n.ts
import zhCommon from '../src/i18n/locales/zh-CN/common.json';
import zhWelcome from '../src/i18n/locales/zh-CN/welcome.json';
import zhChat from '../src/i18n/locales/zh-CN/chat.json';
// ... 导入其他模块

import enCommon from '../src/i18n/locales/en-US/common.json';
import enWelcome from '../src/i18n/locales/en-US/welcome.json';
import enChat from '../src/i18n/locales/en-US/chat.json';
// ... 导入其他模块

// 合并模块
const zhCN = { common: zhCommon, welcome: zhWelcome, chat: zhChat, ... };
const enUS = { common: enCommon, welcome: enWelcome, chat: enChat, ... };

// 检查所有键值是否在两个语言文件中都存在
function checkKeys(obj1: any, obj2: any, path: string = '') {
  // 实现键值检查逻辑
}
```

## 最佳实践

### ✅ 推荐做法

1. **始终使用翻译函数**
   ```typescript
   // ✅ 正确
   {t('settings.title')}
   
   // ❌ 错误
   "设置"
   ```

2. **使用有意义的键名**
   ```typescript
   // ✅ 推荐
   t('settings.items.appearance.title')
   
   // ❌ 不推荐
   t('s.i.a.t')
   ```

3. **保持键值一致性**
   - 相同含义的文本使用相同的键名
   - 避免重复定义

4. **分组管理**
   - 按功能模块组织翻译键值
   - 使用嵌套结构

5. **及时更新**
   - 添加新功能时，同时更新所有语言的翻译文件
   - 删除功能时，清理对应的翻译键值

6. **英文翻译优化**
   - 考虑 UI 布局，避免过长文本导致 UI 穿模

### ❌ 避免的做法

1. **硬编码文本**
   ```typescript
   // ❌ 错误
   <div>设置</div>
   
   // ✅ 正确
   <div>{t('settings.title')}</div>
   ```

2. **直接使用变量名作为键**
   ```typescript
   // ❌ 错误
   t(item.id) // 如果 item.id 是动态的
   
   // ✅ 正确
   t(`settings.items.${item.id}.title`)
   ```

3. **不一致的命名**
   ```typescript
   // ❌ 错误：命名不一致
   t('settings.appearance')
   t('settings-behavior')
   t('Settings_Voice')
   
   // ✅ 正确：统一使用点分隔的驼峰命名
   t('settings.appearance')
   t('settings.behavior')
   t('settings.voice')
   ```

## 常见问题

### Q: 翻译键找不到怎么办？

A: 检查以下几点：
1. 键名是否正确（大小写敏感）
2. 是否在所有语言文件中都有定义
3. JSON 文件格式是否正确
4. 文件是否已保存

### Q: 语言切换不生效？

A: 检查：
1. 是否正确使用了 `useLanguageSettings` Hook
2. Redux store 中的 `language` 字段是否正确更新
3. 浏览器控制台是否有错误信息

### Q: 如何调试翻译问题？

A: 在开发环境中，i18n 会自动输出调试信息：
- 检查浏览器控制台的 i18n 日志
- 使用 `i18n.language` 查看当前语言
- 使用 `i18n.t()` 测试翻译

### Q: 翻译文本太长怎么办？

A: 可以将长文本拆分为多个部分：
```json
{
  "description": {
    "intro": "第一部分",
    "detail": "第二部分",
    "conclusion": "第三部分"
  }
}
```

## 相关资源

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [项目 i18n 配置](../src/i18n/config.ts)

## 更新日志

### 2025-01-XX（最新）
- ✅ 完成 i18n 模块化拆分，按功能模块组织翻译文件
- ✅ 拆分为 8 个模块文件：common, welcome, chat, notifications, errors, settings, modelSettings, aiDebate
- ✅ 提升维护性和 AI 修改效率

### 2025-01-XX（之前）
- ✅ 完成所有外观设置子页面国际化（6个页面 + DraggableButtonConfig 子组件）

### 2025-01-XX（初始）
- ✅ 初始化 i18n 配置
- ✅ 完成 WelcomePage 国际化
- ✅ 完成 Settings 主页面国际化
- ✅ 添加语言切换功能

---

**注意**: 本文档会随着项目进展持续更新。如有问题或建议，请提交 Issue 或 PR。

