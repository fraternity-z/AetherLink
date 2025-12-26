import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import type { WebStorage } from 'redux-persist';
import { dexieStorage } from '../services/storage/DexieStorageService';

// 🚀 使用 Dexie (IndexedDB) 作为 Redux Persist 的存储后端
// 相比 localStorage: 容量更大、不阻塞主线程、支持大型状态
const storage: WebStorage = {
  getItem: async (key) => {
    try {
      const value = await dexieStorage.getSetting(`redux_${key}`);
      return value !== null && value !== undefined ? JSON.stringify(value) : null;
    } catch (error) {
      console.error('[Redux Storage] getItem error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      const parsed = JSON.parse(value);
      await dexieStorage.saveSetting(`redux_${key}`, parsed);
    } catch (error) {
      console.error('[Redux Storage] setItem error:', error);
    }
  },
  removeItem: async (key) => {
    try {
      await dexieStorage.deleteSetting(`redux_${key}`);
    } catch (error) {
      console.error('[Redux Storage] removeItem error:', error);
    }
  },
};
// 移除旧的 messagesReducer 导入
import messagesReducer from './slices/newMessagesSlice'; // 使用 normalizedMessagesReducer 作为唯一的消息状态管理
import settingsReducer, { settingsMiddleware } from './settingsSlice';
import groupsReducer, { saveGroups } from './slices/groupsSlice';
import webSearchReducer, { initializeWebSearchSettings } from './slices/webSearchSlice';

import assistantsReducer from './slices/assistantsSlice';
import messageBlocksReducer from './slices/messageBlocksSlice';
import uiReducer from './slices/uiSlice';
import runtimeReducer from './slices/runtimeSlice';
import networkProxyReducer, { loadNetworkProxySettings } from './slices/networkProxySlice';
import agenticFilesReducer from './slices/agenticFilesSlice';
import memoryReducer, { initializeMemoryService } from './slices/memorySlice';
import { eventMiddleware } from './middleware/eventMiddleware';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { debounce } from 'lodash';

// 合并所有reducer
const rootReducer = combineReducers({
  messages: messagesReducer,
  settings: settingsReducer,
  groups: groupsReducer,
  webSearch: webSearchReducer,
  assistants: assistantsReducer,
  messageBlocks: messageBlocksReducer,
  ui: uiReducer,
  runtime: runtimeReducer,
  networkProxy: networkProxyReducer,
  agenticFiles: agenticFilesReducer,
  memory: memoryReducer,
});

// 配置Redux持久化
const persistConfig = {
  key: 'cherry-studio',
  storage: storage!,  // 使用非空断言，因为在浏览器环境中storage一定存在
  version: 2, // 增加版本号，因为我们添加了新的状态切片
  // 与电脑端保持一致，不持久化messages和messageBlocks
  // 同时排除assistants，因为它包含非序列化的React元素
  // 排除runtime，因为它包含运行时状态
  blacklist: ['messages', 'messageBlocks', 'assistants', 'runtime', 'agenticFiles'],
  // 🚀 性能优化：节流持久化写入，减少 localStorage 操作频率
  throttle: 1000, // 1秒内最多写入一次
  // 🚀 性能优化：使用 timeout 避免长时间阻塞
  timeout: 0, // 立即返回，不等待序列化完成
};

// 创建持久化reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 创建防抖的保存函数
const debouncedSaveGroups = debounce((store: any) => {
  store.dispatch(saveGroups());
}, 500);

// 简单的分组自动保存中间件
const groupsAutoSaveMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);

  // 监听分组相关的操作
  if (action.type?.startsWith('groups/') &&
      !action.type.includes('loadGroupsSuccess') &&
      !action.type.includes('setError') &&
      !action.type.includes('clearError') &&
      !action.type.includes('setLoading')) {
    debouncedSaveGroups(store);
  }

  return result;
};

// 配置Redux存储
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 完全禁用序列化检查，避免非序列化值警告
      serializableCheck: false
    }).concat(eventMiddleware, groupsAutoSaveMiddleware, settingsMiddleware)
});

// 创建persistor
export const persistor = persistStore(store);

// 初始化网络搜索设置
initializeWebSearchSettings().then(settings => {
  if (settings) {
    // 如果有保存的设置，更新store
    store.dispatch({ type: 'webSearch/setWebSearchSettings', payload: settings });
  }
}).catch(error => {
  console.error('初始化网络搜索设置失败:', error);
});

// 初始化网络代理设置
store.dispatch(loadNetworkProxySettings() as any);

// 初始化记忆服务
store.dispatch(initializeMemoryService() as any);

// 导出类型
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// 创建类型化的 hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
