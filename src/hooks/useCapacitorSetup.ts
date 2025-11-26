import { useEffect } from 'react';

/**
 * Capacitor 设置 Hook
 * 
 * 注意：返回键处理已统一由 useBackButton hook 管理
 * 此 hook 用于其他 Capacitor 特定的初始化逻辑
 */
export const useCapacitorSetup = () => {
  useEffect(() => {
    // 返回按键处理由 useBackButton hook 统一管理
    // 其他 Capacitor 初始化逻辑可以在这里添加
  }, []);
};
