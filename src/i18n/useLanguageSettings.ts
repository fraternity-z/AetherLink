import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../shared/store';
import { updateSettings } from '../shared/store/slices/settingsSlice';
import i18n from './config';

/**
 * 使用语言设置的Hook
 * 自动同步Redux设置和i18n语言
 */
export const useLanguageSettings = () => {
  const { i18n: i18nInstance } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.settings.language || 'zh-CN');

  // 同步Redux设置到i18n
  useEffect(() => {
    if (language && i18nInstance.language !== language) {
      i18nInstance.changeLanguage(language);
    }
  }, [language, i18nInstance]);

  // 监听i18n语言变化，同步到Redux
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (lng !== language) {
        dispatch(updateSettings({ language: lng }));
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChanged);

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, [dispatch, i18nInstance, language]);

  const changeLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    dispatch(updateSettings({ language: newLanguage }));
  };

  return {
    currentLanguage: language,
    changeLanguage,
  };
};

