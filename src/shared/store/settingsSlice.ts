import { createSlice } from '@reduxjs/toolkit';
import { initialSettingsState } from './settings/settingsInitialState';
import { loadSettings, saveSettings } from './settings/settingsThunks';
import { saveSettingsToStorage, settingsMiddleware } from './settings/settingsPersistence';
import { settingsReducers } from './settings/settingsReducers';

const initialState = initialSettingsState;
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: settingsReducers,
  extraReducers: (builder) => {
    // 处理加载设置
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        if (action.payload) {
          // 合并加载的设置与当前状态
          return {
            ...action.payload,
            isLoading: false
          };
        }
        state.isLoading = false;
      })
      .addCase(loadSettings.rejected, (state) => {
        state.isLoading = false;
      })
      // 统一的响应保存设置操作的处理
      .addCase(saveSettings.pending, () => {
        // 可以在这里设置保存中的状态标记，如果需要的话
      })
      .addCase(saveSettings.fulfilled, () => {
        // 保存完成后的处理，如果需要的话
      })
      .addCase(saveSettings.rejected, () => {
        // 保存失败的处理，如果需要的话
      });
  }
});

// 导出操作
export const {
  setTheme,
  setThemeStyle,
  setFontSize,
  setFontFamily,
  setLanguage,
  setSendWithEnter,
  setEnableNotifications,
  setMobileInputMethodEnterAsNewline,
  addModel,
  updateModel,
  deleteModel,
  setDefaultModel,
  setCurrentModel,
  addProvider,
  updateProvider,
  deleteProvider,
  reorderProviders,
  toggleProviderEnabled,
  addModelToProvider,
  setProviderDefaultModel,
  deleteModelFromProvider,
  addGeneratedImage,
  deleteGeneratedImage,
  clearGeneratedImages,
  updateSettings,
  setModelSelectorStyle,
  updateModelComboModels,
  // 话题命名相关的actions
  setEnableTopicNaming,
  setTopicNamingPrompt,
  setTopicNamingModelId,
  // 消息样式相关的actions
  setMessageStyle,
  setRenderUserInputAsMarkdown,
  // 自动滚动控制
  setAutoScrollToBottom,
  // AI辩论按钮显示控制
  setShowAIDebateButton,
  // 快捷短语按钮显示控制
  setShowQuickPhraseButton,
  // 代码块设置控制
  setCodeThemeLight,
  setCodeThemeDark,
  setEditorTheme,
  setEditorZoomLevel,
  setCodeEditor,
  setCodeShowLineNumbers,
  setCodeCollapsible,
  setCodeWrappable,
  setCodeDefaultCollapsed,
  setMermaidEnabled,
  // 长文本粘贴为文件功能控制
  setPasteLongTextAsFile,
  setPasteLongTextThreshold,
  // 工具栏样式控制
  setToolbarStyle,
  // 工具栏按钮配置控制
  setToolbarButtonOrder,
  setToolbarButtonVisibility,
  updateToolbarButtons,
  // 性能监控控制
  setShowPerformanceMonitor,
  setShowDevToolsFloatingButton,
  // 触觉反馈控制
  setHapticFeedbackEnabled,
  setHapticFeedbackOnSidebar,
  setHapticFeedbackOnSwitch,
  setHapticFeedbackOnListItem,
  setHapticFeedbackOnNavigation,
  // 侧边栏 tab 控制
  setSidebarTabIndex,
  // 上下文压缩控制
  setContextCondenseEnabled,
  setContextCondenseThreshold,
  setContextCondenseModelId,
  setContextCondenseCustomPrompt,
  updateContextCondenseSettings,
} = settingsSlice.actions;

export { loadSettings, saveSettings };
export { saveSettingsToStorage, settingsMiddleware };

export default settingsSlice.reducer;


