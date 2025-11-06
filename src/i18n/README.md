# i18n 国际化模块

## 快速开始

### 在组件中使用翻译

```typescript
import { useTranslation } from '../i18n';

const MyComponent = () => {
  const { t } = useTranslation();
  return <div>{t('settings.title')}</div>;
};
```

### 切换语言

```typescript
import { useLanguageSettings } from '../i18n';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage } = useLanguageSettings();
  return (
    <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
      <option value="zh-CN">简体中文</option>
      <option value="en-US">English</option>
    </select>
  );
};
```

## 文件说明

| 文件/目录 | 说明 |
|------|------|
| `config.ts` | i18n 核心配置，初始化设置 |
| `useLanguageSettings.ts` | 语言设置 Hook，管理语言切换 |
| `index.ts` | 统一导出文件 |
| `locales/` | 语言资源文件目录（模块化） |
| `locales/zh-CN/` | 简体中文翻译资源（按模块拆分） |
| `locales/en-US/` | 英文翻译资源（按模块拆分） |
| `locales/*/settings/` | 设置相关翻译文件（已归类到独立文件夹） |

### 模块化结构

翻译文件已按功能模块拆分，便于维护和 AI 修改：

#### 已拆分的模块

| 文件 | 行数 | 说明 |
|------|------|------|
| `common.json` | ~35 行 | 通用翻译（按钮、操作等） |
| `welcome.json` | ~7 行 | 欢迎页翻译 |
| `chat.json` | ~16 行 | 聊天相关翻译 |
| `notifications.json` | ~7 行 | 通知相关翻译 |
| `errors.json` | ~13 行 | 错误信息翻译 |
| `settings/settings.json` | ~270 行 | 设置页面主文件（已拆分多个模块） |
| `settings/appearanceSettings.json` | ~598 行 | 外观设置（已独立拆分） |
| `settings/voiceSettings.json` | ~228 行 | 语音功能设置（已独立拆分） |
| `settings/webSearchSettings.json` | ~170 行 | 网络搜索设置（已独立拆分） |
| `settings/mcpServerSettings.json` | ~173 行 | MCP服务器设置（已独立拆分） |
| `dataSettings.json` | ~408 行 | 数据设置（备份、恢复等） |
| `modelSettings.json` | ~163 行 | 模型设置翻译 |
| `aiDebate.json` | ~213 行 | AI 辩论功能翻译 |
| `devtools.json` | ~55 行 | 开发者工具翻译 |

#### 模块合并机制

- **深度合并（Deep Merge）**：`settings.json` 及其拆分模块（`appearanceSettings.json`、`voiceSettings.json`、`webSearchSettings.json`、`mcpServerSettings.json`）使用 `mergeSettingsModules` 函数合并，确保嵌套对象的正确合并
- **命名空间合并**：其他模块使用 `mergeModules` 函数合并为独立的命名空间
- **访问方式**：翻译键访问方式保持不变，例如 `t('settings.appearance.*')`、`t('settings.voice.*')`、`t('settings.webSearch.*')`、`t('settings.mcpServer.*')` 会自动从合并后的配置中读取

#### 拆分完成情况

模块化拆分工作已完成。主要的大模块（>150行）已独立拆分：

- ✅ `appearanceSettings.json` - 外观设置（约 598 行）
- ✅ `voiceSettings.json` - 语音功能（约 228 行）
- ✅ `webSearchSettings.json` - 网络搜索（约 170 行）
- ✅ `mcpServerSettings.json` - MCP服务器（约 173 行）

剩余的小模块（<60行）保留在 `settings.json` 中，包括：
- `notion` - Notion集成（约 60 行）
- `quickPhraseManagement` - 快捷短语（约 50 行）
- `agentPromptsPage` - 智能体提示词（约 20 行）
- `systemPromptVariables` - 系统提示词变量（约 30 行）

当前 `settings.json` 约 270 行，结构清晰，维护方便。

#### 文件组织结构

设置相关的翻译文件已归类到 `settings/` 子文件夹中，便于管理和查找：

```
locales/
├── zh-CN/
│   ├── settings/          # 设置相关翻译文件
│   │   ├── settings.json
│   │   ├── appearanceSettings.json
│   │   ├── voiceSettings.json
│   │   ├── webSearchSettings.json
│   │   └── mcpServerSettings.json
│   ├── common.json
│   ├── chat.json
│   └── ...
└── en-US/
    ├── settings/          # 设置相关翻译文件
    │   ├── settings.json
    │   ├── appearanceSettings.json
    │   ├── voiceSettings.json
    │   ├── webSearchSettings.json
    │   └── mcpServerSettings.json
    ├── common.json
    ├── chat.json
    └── ...
```

#### 拆分优势

- ✅ **模块化**：每个功能模块独立文件，便于维护
- ✅ **可读性**：文件更小，查找和修改更容易
- ✅ **组织结构**：设置相关文件统一放在 `settings/` 文件夹，结构清晰
- ✅ **协作**：多人可同时编辑不同模块，减少冲突
- ✅ **性能**：减小单个文件体积，加载更快
- ✅ **兼容性**：保持原有翻译键访问方式不变

## 主要功能

- ✅ 自动语言检测（浏览器语言、localStorage）
- ✅ 语言切换实时生效
- ✅ Redux 状态同步
- ✅ 持久化存储
- ✅ TypeScript 类型支持

## 支持的语言

- `zh-CN`: 简体中文
- `en-US`: English

## 详细文档

查看完整文档：[docs/i18n-guide.md](../../docs/i18n-guide.md)

