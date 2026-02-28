import { useSyncExternalStore } from 'react';

type AppSettingsSnapshot = Record<string, any>;

type SettingsListener = () => void;

const APP_SETTINGS_KEY = 'appSettings';
const listeners = new Set<SettingsListener>();
let windowEventsBound = false;
let cache: AppSettingsSnapshot = {};

const readSettingsFromStorage = (): AppSettingsSnapshot => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch (error) {
    console.error('[useAppSettingsStore] 读取 appSettings 失败:', error);
    return {};
  }
};

const emitChanges = () => {
  cache = readSettingsFromStorage();
  listeners.forEach(listener => listener());
};

const onStorage = (event: StorageEvent) => {
  if (event.key && event.key !== APP_SETTINGS_KEY) {
    return;
  }

  emitChanges();
};

const onAppSettingsChanged = () => {
  emitChanges();
};

const bindWindowEvents = () => {
  if (windowEventsBound || typeof window === 'undefined') {
    return;
  }

  cache = readSettingsFromStorage();
  window.addEventListener('storage', onStorage);
  window.addEventListener('appSettingsChanged', onAppSettingsChanged as EventListener);
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
