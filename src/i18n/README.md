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

| 文件 | 说明 |
|------|------|
| `config.ts` | i18n 核心配置，初始化设置 |
| `useLanguageSettings.ts` | 语言设置 Hook，管理语言切换 |
| `index.ts` | 统一导出文件 |
| `locales/zh-CN.json` | 简体中文翻译资源 |
| `locales/en-US.json` | 英文翻译资源 |

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

