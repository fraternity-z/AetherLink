import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';

export const useCapacitorSetup = () => {
  useEffect(() => {
    // 移除返回按键监听器，避免与BackButtonHandler冲突
    // 返回按键处理完全由BackButtonHandler组件负责
    console.log('[App] Capacitor设置完成，返回按键由BackButtonHandler处理');
  }, []);
};
