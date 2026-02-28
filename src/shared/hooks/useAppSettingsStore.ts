import { useSyncExternalStore } from 'react';
import { getStorageItem } from '../utils/storage';

type AppSettingsSnapshot = Record<string, any>;

type SettingsListener = () => void;
type StorageItemChangedDetail = {
  key?: string;
};

const APP_SETTINGS_KEY = 'appSettings';
const STORAGE_ITEM_CHANGED_EVENT = 'storageItemChanged';
const listeners = new Set<SettingsListener>();
let windowEventsBound = false;
let cache: AppSettingsSnapshot = {};

const loadSettingsFromStorage = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = await getStorageItem<AppSettingsSnapshot>(APP_SETTINGS_KEY);
    if (!stored || typeof stored !== 'object') {
      cache = {};
      return;
    }

    cache = stored;
  } catch (error) {
    console.error('[useAppSettingsStore] 读取 appSettings 失败:', error);
    cache = {};
  }
};

const emitChanges = () => {
  listeners.forEach(listener => {
    listener();
  });
};

const syncFromStorage = async () => {
  await loadSettingsFromStorage();
  emitChanges();
};

const onStorage = (event: StorageEvent) => {
  if (event.key && event.key !== APP_SETTINGS_KEY) {
    return;
  }

  void syncFromStorage();
};

const onAppSettingsChanged = () => {
  void syncFromStorage();
};

const onStorageItemChanged = (event: Event) => {
  const detail = (event as CustomEvent<StorageItemChangedDetail>).detail;
  if (detail?.key && detail.key !== APP_SETTINGS_KEY) {
    return;
  }

  void syncFromStorage();
};

const bindWindowEvents = () => {
  if (windowEventsBound || typeof window === 'undefined') {
    return;
  }

  void syncFromStorage();
  window.addEventListener('storage', onStorage);
  window.addEventListener('appSettingsChanged', onAppSettingsChanged as EventListener);
  window.addEventListener(STORAGE_ITEM_CHANGED_EVENT, onStorageItemChanged as EventListener);
  windowEventsBound = true;
};

const subscribe = (listener: SettingsListener) => {
  bindWindowEvents();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => {
  bindWindowEvents();
  return cache;
};

const getServerSnapshot = () => ({} as AppSettingsSnapshot);

export const getAppSettingsSnapshot = (): AppSettingsSnapshot => getSnapshot();

export const useAppSettingsStore = <T>(selector: (settings: AppSettingsSnapshot) => T): T => {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot())
  );
};
