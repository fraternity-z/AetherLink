// 导出i18n实例和配置
export { default as i18n, supportedLanguages, defaultLanguage } from './config';

// 导出类型
export type { TFunction } from 'i18next';

// 导出常用的翻译函数包装器
export { useTranslation } from 'react-i18next';

// 导出语言设置Hook
export { useLanguageSettings } from './useLanguageSettings';

