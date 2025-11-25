import { storageService } from './storage/storageService';
import { AssistantService } from './assistant';
import { DB_CONFIG } from '../types/DatabaseSchema';
import { dexieStorage } from './storage/DexieStorageService';
import { EventEmitter, EVENT_NAMES } from './EventService';
import Dexie from 'dexie';
import { getStorageItem } from '../utils/storage';

// 导出所有服务
export {
  storageService,
  AssistantService,
  dexieStorage,
  EventEmitter,
  EVENT_NAMES
};

// 导出状态栏服务
export { statusBarService, StatusBarService } from './StatusBarService';

// 版本检查状态缓存
let versionCheckPromise: Promise<any> | null = null;

// 导出数据管理工具函数
export const DataManager = {
  /**
   * 检查并修复数据库版本
   * 确保数据库版本与应用版本一致
   * 使用缓存避免重复执行
   */
  async ensureDatabaseVersion(): Promise<{
    success: boolean;
    message: string;
    oldVersion?: number;
    newVersion?: number;
  }> {
    // 如果已经有正在进行的版本检查，直接返回该Promise
    if (versionCheckPromise) {
      console.log('DataManager: 版本检查已在进行中，等待结果...');
      return versionCheckPromise;
    }

    // 创建新的版本检查Promise
    versionCheckPromise = this._performVersionCheck();

    try {
      const result = await versionCheckPromise;
      return result;
    } finally {
      // 检查完成后清除缓存，允许下次检查
      versionCheckPromise = null;
    }
  },

  /**
   * 实际执行版本检查的内部方法
   */
  async _performVersionCheck(): Promise<{
    success: boolean;
    message: string;
    oldVersion?: number;
    newVersion?: number;
  }> {
    try {
      console.log('DataManager: 开始检查数据库版本');

      // 使用Dexie获取所有数据库
      const databases = await Dexie.getDatabaseNames();

      // 检查目标数据库是否存在
      const targetDB = databases.includes(DB_CONFIG.NAME);

      // 如果数据库不存在，不需要修复
      if (!targetDB) {
        console.log('DataManager: 数据库不存在，将在首次访问时创建');
        return {
          success: true,
          message: '数据库不存在，将在首次访问时创建'
        };
      }

      // 检查版本是否匹配
      // 获取当前数据库实例的版本
      const currentVersion = dexieStorage.verno;

      if (currentVersion === DB_CONFIG.VERSION) {
        console.log(`DataManager: 数据库版本匹配 (v${currentVersion})`);
        return {
          success: true,
          message: `数据库版本匹配 (v${currentVersion})`
        };
      }

      // 版本不匹配时，让 Dexie 自己处理版本升级
      // 移除激进清理机制，避免数据丢失
      console.log(`DataManager: 数据库版本不匹配，当前: v${currentVersion}，期望: v${DB_CONFIG.VERSION}`);
      console.log('DataManager: 将使用 Dexie 标准迁移机制进行版本升级，保留用户数据');

      return {
        success: true,
        message: `数据库版本将从 v${currentVersion} 升级到 v${DB_CONFIG.VERSION}，使用渐进迁移保留数据`,
        oldVersion: currentVersion,
        newVersion: DB_CONFIG.VERSION
      };
    } catch (error) {
      console.error('DataManager: 检查数据库版本失败:', error);
      return {
        success: false,
        message: `检查数据库版本失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },

  /**
   * 检查并修复重复话题
   * @deprecated 请使用 DataRepairService.repairAllData() 方法
   * @returns 返回修复结果的Promise
   */
  async fixDuplicateTopics() {
    console.log('[DataManager] fixDuplicateTopics 已废弃，请使用 DataRepairService.repairAllData()');
    // 简化逻辑，不再实际修复，只是检查
    try {
      const topics = await dexieStorage.getAllTopics();
      return { fixed: 0, total: topics.length };
    } catch (error) {
      console.error('检查话题失败:', error);
      return { fixed: 0, total: 0 };
    }
  },

  /**
   * 查找重复话题
   * @returns 返回重复话题列表的Promise
   */
  async findDuplicateTopics() {
    try {
      // 获取所有话题
      const topics = await dexieStorage.getAllTopics();

      // 检查是否有重复话题
      const topicMap = new Map<string, number>();
      const duplicates: string[] = [];

      topics.forEach(topic => {
        topicMap.set(topic.id, (topicMap.get(topic.id) || 0) + 1);
      });

      // 找出重复的ID
      topicMap.forEach((count, id) => {
        if (count > 1) {
          duplicates.push(id);
        }
      });

      return duplicates;
    } catch (error) {
      console.error('查找重复话题失败:', error);
      return [];
    }
  },

  /**
   * 启用或禁用日志记录
   * @param enabled 是否启用日志记录
   */
  setLogging(enabled: boolean) {
    try {
      console.log(`日志记录已${enabled ? '启用' : '禁用'}`);
      // DexieStorageService不支持动态切换日志设置，不需要实际操作
    } catch (error) {
      console.error('设置日志状态失败:', error);
    }
  }
};

// 导出所有服务模块
export * from './messages';
export * from './network';
export * from './knowledge';
export * from './topics';

// 导入需要在初始化中使用的服务
import { EnhancedNetworkService } from './network';

/**
 * 初始化所有服务
 * 应在应用启动时调用
 */
export async function initializeServices(): Promise<void> {
  try {
    // 初始化开发者工具服务
    try {
      // 使用静态导入以避免动态导入警告
      const { default: EnhancedConsoleService } = await import('./EnhancedConsoleService');

      // 初始化控制台拦截
      EnhancedConsoleService.getInstance();
      console.log('控制台拦截服务初始化完成');

      // 初始化网络拦截 - 使用静态导入的服务
      EnhancedNetworkService.getInstance();
      console.log('网络拦截服务初始化完成');
    } catch (devToolsError) {
      console.warn('开发者工具服务初始化失败:', devToolsError);
    }

    // 初始化TTS服务配置 (使用 V2 新架构)
    try {
      const { TTSManager } = await import('./tts-v2');
      
      const tts = TTSManager.getInstance();
      
      // 加载用户选择的 TTS 服务
      const selectedService = await getStorageItem<string>('selected_tts_service') || 'siliconflow';
      const enableTTS = (await getStorageItem<string>('enable_tts')) !== 'false';
      
      if (enableTTS) {
        // 根据选择配置引擎
        switch (selectedService) {
          case 'capacitor': {
            const language = await getStorageItem<string>('capacitor_tts_language') || 'zh-CN';
            const rate = parseFloat(await getStorageItem<string>('capacitor_tts_rate') || '1.0');
            const pitch = parseFloat(await getStorageItem<string>('capacitor_tts_pitch') || '1.0');
            const volume = parseFloat(await getStorageItem<string>('capacitor_tts_volume') || '1.0');
            tts.configureEngine('capacitor', { enabled: true, language, rate, pitch, volume });
            tts.setActiveEngine('capacitor');
            break;
          }
          case 'openai': {
            const apiKey = await getStorageItem<string>('openai_tts_api_key') || '';
            const model = await getStorageItem<string>('openai_tts_model') || 'tts-1';
            const voice = await getStorageItem<string>('openai_tts_voice') || 'alloy';
            tts.configureEngine('openai', { enabled: true, apiKey, model, voice });
            tts.setActiveEngine('openai');
            break;
          }
          case 'azure': {
            const apiKey = await getStorageItem<string>('azure_tts_api_key') || '';
            const region = await getStorageItem<string>('azure_tts_region') || 'eastus';
            const voiceName = await getStorageItem<string>('azure_tts_voice_name') || 'zh-CN-XiaoxiaoNeural';
            tts.configureEngine('azure', { enabled: true, apiKey, region, voiceName });
            tts.setActiveEngine('azure');
            break;
          }
          case 'gemini': {
            const apiKey = await getStorageItem<string>('gemini_tts_api_key') || '';
            const model = await getStorageItem<string>('gemini_tts_model') || 'gemini-2.5-flash-preview-tts';
            const voice = await getStorageItem<string>('gemini_tts_voice') || 'Kore';
            tts.configureEngine('gemini', { enabled: true, apiKey, model, voice });
            tts.setActiveEngine('gemini');
            break;
          }
          case 'siliconflow':
          default: {
            const apiKey = await getStorageItem<string>('siliconflow_api_key') || '';
            const model = await getStorageItem<string>('tts_model') || 'FunAudioLLM/CosyVoice2-0.5B';
            const voice = await getStorageItem<string>('tts_voice') || 'FunAudioLLM/CosyVoice2-0.5B:alex';
            tts.configureEngine('siliconflow', { enabled: true, apiKey, model, voice });
            tts.setActiveEngine('siliconflow');
            break;
          }
        }
      }
      
      console.log('🎵 TTS V2 初始化完成, 使用引擎:', selectedService);
    } catch (ttsError) {
      console.warn('TTS服务配置初始化失败:', ttsError);
    }

    // 系统提示词服务现在通过Redux thunk初始化
    console.log('服务初始化完成');
  } catch (error) {
    console.error('服务初始化失败:', error);
  }
}