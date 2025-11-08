/**
 * 系统闹钟插件接口
 * 用于调用 Android 系统原生闹钟应用
 */

import { registerPlugin } from '@capacitor/core';

export interface SystemAlarmPlugin {
  /**
   * 打开系统闹钟应用并设置闹钟
   */
  setAlarm(options: {
    title: string;
    hour: number;
    minute: number;
    skipUi?: boolean;
    repeat?: 'none' | 'daily' | 'weekday' | 'weekend';
  }): Promise<{ success: boolean; message: string }>;

  /**
   * 打开系统闹钟列表
   */
  showAlarms(): Promise<{ success: boolean; message: string }>;

  /**
   * 设置倒计时
   */
  setTimer(options: {
    seconds: number;
    message: string;
    skipUi?: boolean;
  }): Promise<{ success: boolean; message: string }>;
}

const SystemAlarm = registerPlugin<SystemAlarmPlugin>('SystemAlarm', {
  web: () => import('./web/SystemAlarmWeb').then(m => new m.SystemAlarmWeb()),
});

export default SystemAlarm;

