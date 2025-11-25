import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入模块化的语言资源
// 英文模块
import enCommon from './locales/en-US/common.json';
import enWelcome from './locales/en-US/welcome.json';
import enChat from './locales/en-US/chat.json';
import enNotifications from './locales/en-US/notifications.json';
import enErrors from './locales/en-US/errors.json';
import enSettings from './locales/en-US/settings/settings.json';

// 中文模块
import zhCommon from './locales/zh-CN/common.json';
import zhWelcome from './locales/zh-CN/welcome.json';
import zhChat from './locales/zh-CN/chat.json';
import zhNotifications from './locales/zh-CN/notifications.json';
import zhErrors from './locales/zh-CN/errors.json';
import zhSettings from './locales/zh-CN/settings/settings.json';

// 导入所有模块文件
import enModelSettings from './locales/en-US/modelSettings.json';
import enAiDebate from './locales/en-US/aiDebate.json';
import enDataSettings from './locales/en-US/dataSettings.json';
import enDevtools from './locales/en-US/devtools.json';
import enAppearanceSettings from './locales/en-US/settings/appearanceSettings.json';
import enVoiceSettings from './locales/en-US/settings/voiceSettings.json';
import enWebSearchSettings from './locales/en-US/settings/webSearchSettings.json';
import enMcpServerSettings from './locales/en-US/settings/mcpServerSettings.json';
import enNetworkProxySettings from './locales/en-US/settings/networkProxySettings.json';
import zhModelSettings from './locales/zh-CN/modelSettings.json';
import zhAiDebate from './locales/zh-CN/aiDebate.json';
import zhDataSettings from './locales/zh-CN/dataSettings.json';
import zhDevtools from './locales/zh-CN/devtools.json';
import zhAppearanceSettings from './locales/zh-CN/settings/appearanceSettings.json';
import zhVoiceSettings from './locales/zh-CN/settings/voiceSettings.json';
import zhWebSearchSettings from './locales/zh-CN/settings/webSearchSettings.json';
import zhMcpServerSettings from './locales/zh-CN/settings/mcpServerSettings.json';
import zhNetworkProxySettings from './locales/zh-CN/settings/networkProxySettings.json';

// 深度合并函数，用于合并 settings 相关模块
const deepMerge = (target: any, source: any) => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

// 合并多个 settings 模块
const mergeSettingsModules = (...modules: any[]) => {
  return modules.reduce((acc, module) => deepMerge(acc, module), {});
};

// 合并所有模块
const mergeModules = (...modules: any[]) => {
  return Object.assign({}, ...modules);
};

// 语言资源
const resources = {
  'zh-CN': {
    translation: mergeModules(
      { common: zhCommon },
      { welcome: zhWelcome },
      { chat: zhChat },
      { notifications: zhNotifications },
      { errors: zhErrors },
      { settings: mergeSettingsModules(zhSettings, zhAppearanceSettings, zhVoiceSettings, zhWebSearchSettings, zhMcpServerSettings, { networkProxy: zhNetworkProxySettings }) },
      { modelSettings: zhModelSettings },
      { aiDebate: zhAiDebate },
      { dataSettings: zhDataSettings },
      { devtools: zhDevtools }
    ),
  },
  'en-US': {
    translation: mergeModules(
      { common: enCommon },
      { welcome: enWelcome },
      { chat: enChat },
      { notifications: enNotifications },
      { errors: enErrors },
      { settings: mergeSettingsModules(enSettings, enAppearanceSettings, enVoiceSettings, enWebSearchSettings, enMcpServerSettings, { networkProxy: enNetworkProxySettings }) },
      { modelSettings: enModelSettings },
      { aiDebate: enAiDebate },
      { dataSettings: enDataSettings },
      { devtools: enDevtools }
    ),
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

