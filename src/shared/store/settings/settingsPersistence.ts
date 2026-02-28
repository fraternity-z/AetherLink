import type { SettingsRootState } from './settingsTypes';
import { saveSettings } from './settingsThunks';

export const saveSettingsToStorage = (state: SettingsRootState) => (
  async (dispatch: any) => {
    try {
      await dispatch(saveSettings(state.settings));
    } catch (error) {
      console.error('保存设置时出错:', error);
    }
  }
);

export const settingsMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);
  const actionType = typeof action?.type === 'string' ? action.type : '';

  if (actionType.startsWith('settings/') &&
      !actionType.includes('load') &&
      !actionType.includes('save')) {
    store.dispatch(saveSettings(store.getState().settings));
  }

  return result;
};
