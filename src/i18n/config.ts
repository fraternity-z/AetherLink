import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入语言资源
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

// 语言资源
const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
};

// 支持的语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

// 默认语言
export const defaultLanguage = 'zh-CN';

// 初始化i18n
i18n
  .use(LanguageDetector) // 检测浏览器语言
  .use(initReactI18next) // 初始化react-i18next
  .init({
    resources,
    fallbackLng: defaultLanguage, // 回退语言
    defaultNS: 'translation',
    ns: ['translation'],
    
    // 调试选项（开发环境启用）
    debug: process.env.NODE_ENV === 'development',
    
    // 插值选项
    interpolation: {
      escapeValue: false, // React已经转义了，不需要再次转义
    },
    
    // 检测选项
    detection: {
      // 检测顺序
      order: ['localStorage', 'navigator', 'htmlTag'],
      // 缓存用户语言选择
      caches: ['localStorage'],
      // localStorage的key
      lookupLocalStorage: 'i18nextLng',
    },
    
    // React选项
    react: {
      useSuspense: false, // 禁用Suspense，避免阻塞渲染
    },
  });

export default i18n;

