import { useState, useEffect, useCallback } from 'react';

import { statusBarService } from '../shared/services/StatusBarService';
import { safeAreaService } from '../shared/services/SafeAreaService';
import { DataManager } from '../shared/services';
import { DataRepairService } from '../shared/services/DataRepairService';
import { DatabaseCleanupService } from '../shared/services/storage/DatabaseCleanupService';
import { getStorageItem } from '../shared/utils/storage';
// 🚀 性能优化：性能指标追踪
import { recordMetric } from '../utils/performanceMetrics';

export const useAppInitialization = () => {
  const [appInitialized, setAppInitialized] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [initializationStep, setInitializationStep] = useState('正在启动...');
  const [isFirstInstall, setIsFirstInstall] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  const initializeApp = useCallback(async (signal: AbortSignal) => {
    try {
      // 🚀 极速启动：检测首次安装（同步，极快）
      const hasLaunched = localStorage.getItem('app-has-launched');
      const isFirst = !hasLaunched;
      setIsFirstInstall(isFirst);

      if (signal.aborted) return;

      // 🚀 极速启动：只做最小必要初始化，其他全部后台执行
      setInitializationStep(isFirst ? '欢迎使用 AetherLink...' : '启动中...');
      setInitializationProgress(50);

      // 🚀 关键优化：SafeArea 必须同步等待（影响布局）
      await safeAreaService.initialize();

      if (signal.aborted) return;

      // 🚀 极速启动：立即标记完成，其他初始化全部后台执行
      setInitializationProgress(100);
      setInitializationStep('启动完成');

      if (isFirst) {
        localStorage.setItem('app-has-launched', 'true');
        localStorage.setItem('app-first-launch-time', Date.now().toString());
      }

      // 🚀 立即完成，不等待
      setAppInitialized(true);

      // 🚀 后台初始化：所有非关键任务移到这里
      Promise.resolve().then(async () => {
        try {
          // 状态栏初始化（不阻塞界面）
          const savedSettings = await getStorageItem('settings') as any;
          const currentTheme = savedSettings?.theme || 'system';
          const currentThemeStyle = savedSettings?.themeStyle || 'default';
          const actualTheme = currentTheme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : currentTheme as 'light' | 'dark';
          await statusBarService.initialize(actualTheme, currentThemeStyle);

          // 数据库清理和版本检查（后台）
          await Promise.all([
            DatabaseCleanupService.needsCleanup() 
              ? DatabaseCleanupService.cleanupDatabase() 
              : Promise.resolve(),
            DataManager.ensureDatabaseVersion()
          ]);

          // 数据修复（后台）
          const hasIssues = await DataRepairService.checkDataConsistency();
          if (hasIssues) {
            console.log('[Init] 后台执行数据修复...');
            await DataRepairService.repairAllData({
              fixAssistantTopicRelations: true,
              fixDuplicateMessages: true,
              fixOrphanTopics: true,
              migrateMessages: true
            });
          }

          console.log('[useAppInitialization] 后台初始化完成');
        } catch (err) {
          console.error('[Init] 后台初始化失败:', err);
        }
      });

      // 🚀 性能优化：记录应用初始化完成时间
      if (process.env.NODE_ENV === 'development') {
        recordMetric('appInitialized');
      }

    } catch (error) {
      if (!signal.aborted) {
        console.error('应用初始化失败:', error);
        setInitError(error as Error);
      }
    }
  }, []);

  const retryInitialization = useCallback(() => {
    setInitError(null);
    setAppInitialized(false);
    setInitializationProgress(0);
    setInitializationStep('重新启动...');
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    if (!appInitialized && !initError) {
      initializeApp(abortController.signal);
    }

    return () => {
      abortController.abort();
    };
  }, [initializeApp, appInitialized, initError]);

  return {
    appInitialized,
    initializationProgress,
    initializationStep,
    isFirstInstall,
    initError,
    retryInitialization
  };
};
