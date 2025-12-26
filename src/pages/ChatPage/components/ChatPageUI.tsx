import React, { useMemo, useCallback, startTransition, useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { CustomIcon } from '../../../components/icons';

import SolidMessageList from '../../../components/message/SolidMessageList';
import { ChatInput, CompactChatInput, IntegratedChatInput, InputToolbar } from '../../../components/input';
import { Sidebar } from '../../../components/TopicManagement';
import { ModelSelector } from './ModelSelector';
import { UnifiedModelDisplay } from './UnifiedModelDisplay';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import type { SiliconFlowImageFormat, ChatTopic, Message, Model } from '../../../shared/types';
import { useTopicManagement } from '../../../shared/hooks/useTopicManagement';
import { useKeyboard } from '../../../shared/hooks/useKeyboard';
import { useVisualViewport } from '../../../shared/hooks/useVisualViewport';
import ChatNavigation from '../../../components/chat/ChatNavigation';
import ErrorBoundary from '../../../components/ErrorBoundary';
import AgenticFilesList from '../../../components/AgenticFilesList';
import type { DebateConfig } from '../../../shared/services/AIDebateService';
import { createSelector } from 'reselect';
import { contextCondenseService } from '../../../shared/services/ContextCondenseService';



// 暂时移除MotionIconButton，直接使用motion.div包装

// 默认设置常量 - 避免每次渲染时创建新对象
const DEFAULT_TOP_TOOLBAR_SETTINGS = {
  showSettingsButton: true,
  showModelSelector: true,
  modelSelectorStyle: 'full',
  showTopicName: true,
  showNewTopicButton: false,
  showClearButton: false,
  showSearchButton: false,
  showMenuButton: true,
  leftComponents: ['menuButton', 'topicName', 'newTopicButton', 'clearButton'],
  rightComponents: ['searchButton', 'modelSelector', 'settingsButton'],
  componentPositions: [],
} as const;

// 样式常量 - 避免每次渲染时重新计算
const DEFAULT_DRAWER_WIDTH = 350;
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94] as const
};
const BUTTON_ANIMATION_CONFIG = {
  duration: 0.1
} as const;

// 从 localStorage 读取侧边栏宽度
const getStoredSidebarWidth = (): number => {
  try {
    const appSettings = localStorage.getItem('appSettings');
    if (appSettings) {
      const settings = JSON.parse(appSettings);
      return settings.sidebarWidth || DEFAULT_DRAWER_WIDTH;
    }
  } catch (e) {
    console.error('读取侧边栏宽度失败:', e);
  }
  return DEFAULT_DRAWER_WIDTH;
};

// 动态计算布局配置
const getLayoutConfigs = (drawerWidth: number) => ({
  // 侧边栏关闭时的布局
  SIDEBAR_CLOSED: {
    mainContent: {
      marginLeft: 0,
      width: '100%'
    },
    inputContainer: {
      left: 0,
      width: '100%'
    }
  },
  // 侧边栏打开时的布局
  SIDEBAR_OPEN: {
    mainContent: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`
    },
    inputContainer: {
      left: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`
    }
  }
});

// 记忆化的选择器 - 避免不必要的重渲染
const selectChatPageSettings = createSelector(
  (state: RootState) => state.settings.themeStyle,
  (state: RootState) => state.settings.inputLayoutStyle,
  (state: RootState) => state.settings.topToolbar,
  (state: RootState) => state.settings.modelSelectorStyle,
  (state: RootState) => state.settings.chatBackground,
  (state: RootState) => state.assistants.currentAssistant?.chatBackground,
  (themeStyle, inputLayoutStyle, topToolbar, modelSelectorStyle, globalChatBackground, assistantChatBackground) => {
    // 助手壁纸优先级高于全局设置
    const effectiveChatBackground = (assistantChatBackground?.enabled && assistantChatBackground?.imageUrl)
      ? assistantChatBackground
      : globalChatBackground;
    
    return {
      themeStyle,
      inputLayoutStyle: inputLayoutStyle || 'default',
      topToolbar,
      modelSelectorStyle,
      chatBackground: effectiveChatBackground || {
        enabled: false,
        imageUrl: '',
        opacity: 0.3,
        size: 'cover',
        position: 'center',
        repeat: 'no-repeat'
      }
    };
  }
);

// 所有从父组件传入的props类型
interface ChatPageUIProps {
  currentTopic: ChatTopic | null;
  currentMessages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  isMobile: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  navigate: (path: string) => void;
  selectedModel: Model | null;
  availableModels: Model[];
  handleModelSelect: (model: Model) => void;
  handleModelMenuClick: () => void;
  handleModelMenuClose: () => void;
  menuOpen: boolean;
  handleClearTopic: () => void;
  handleDeleteMessage: (messageId: string) => void;
  handleRegenerateMessage: (messageId: string) => void;
  handleSwitchMessageVersion: (versionId: string) => void;
  handleResendMessage: (messageId: string) => void;
  webSearchActive: boolean;
  imageGenerationMode: boolean;
  videoGenerationMode: boolean;
  toolsEnabled: boolean;
  mcpMode: 'prompt' | 'function';
  toggleWebSearch: () => void;
  toggleImageGenerationMode: () => void;
  toggleVideoGenerationMode: () => void;
  toggleToolsEnabled: () => void;
  handleMCPModeChange: (mode: 'prompt' | 'function') => void;
  handleMessageSend: (content: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  handleMultiModelSend?: (content: string, models: Model[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  handleStopResponseClick: () => void;
  isDebating?: boolean;
  handleStartDebate?: (question: string, config: DebateConfig) => void;
  handleStopDebate?: () => void;
  showSearch?: boolean;
  onSearchToggle?: () => void;
}

// 使用React.memo优化性能，避免不必要的重新渲染
const ChatPageUIComponent: React.FC<ChatPageUIProps> = ({
  currentTopic,
  currentMessages,
  isStreaming,
  isLoading,
  isMobile,
  drawerOpen,
  setDrawerOpen,
  navigate,
  selectedModel,
  availableModels,
  handleModelSelect,
  handleModelMenuClick,
  handleModelMenuClose,
  menuOpen,
  handleClearTopic,
  handleDeleteMessage,
  handleRegenerateMessage,
  handleSwitchMessageVersion,
  handleResendMessage,
  webSearchActive,
  imageGenerationMode,
  videoGenerationMode,
  toolsEnabled,
  mcpMode,
  toggleWebSearch,
  toggleImageGenerationMode,
  toggleVideoGenerationMode,
  toggleToolsEnabled,
  handleMCPModeChange,
  handleMessageSend,
  handleMultiModelSend,
  handleStopResponseClick,
  isDebating,
  handleStartDebate,
  handleStopDebate,
  showSearch,
  onSearchToggle
}) => {
  // ==================== Hooks 和基础状态 ====================
  // 使用统一的话题管理Hook
  const { handleCreateTopic } = useTopicManagement();

  // 键盘管理 - 获取键盘高度用于调整输入框位置
  // 使用新的锁定机制：当 MessageEditor 锁定键盘时，这里的 keyboardHeight 会自动返回 0
  const { keyboardHeight } = useKeyboard();

  // Visual Viewport 管理 - 解决移动端滚动时输入框跟随移动的问题
  const { fixedTop, shouldUseVisualViewport } = useVisualViewport();

  // 稳定化的回调函数，避免重复渲染 - 使用函数式更新
  const handleToggleDrawer = useCallback(() => {
    console.log('侧边栏切换开始', { current: drawerOpen });
    // 使用startTransition + 函数式更新，完全避免依赖项
    startTransition(() => {
      setDrawerOpen(prev => !prev);
    });
  }, [setDrawerOpen]);

  const handleMobileToggle = useCallback(() => {
    startTransition(() => {
      setDrawerOpen(prev => !prev);
    });
  }, [setDrawerOpen]);

  const handleDesktopToggle = useCallback(() => {
    startTransition(() => {
      setDrawerOpen(prev => !prev);
    });
  }, [setDrawerOpen]);

  // 本地状态
  // 侧边栏宽度状态 - 动态读取并监听变化
  const [sidebarWidth, setSidebarWidth] = useState(getStoredSidebarWidth);
  
  // 监听侧边栏宽度变化
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      if (e.detail?.settingId === 'sidebarWidth') {
        setSidebarWidth(e.detail.value);
      }
    };
    window.addEventListener('appSettingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('appSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  // 动态计算布局配置
  const LAYOUT_CONFIGS = useMemo(() => getLayoutConfigs(sidebarWidth), [sidebarWidth]);

  // 清空按钮的二次确认状态
  const [clearConfirmMode, setClearConfirmMode] = useState(false);
  
  // 上下文压缩状态
  const [isCondensing, setIsCondensing] = useState(false);
  const [condenseSnackbar, setCondenseSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // 自动重置确认模式（3秒后）
  useEffect(() => {
    if (clearConfirmMode) {
      const timer = setTimeout(() => {
        setClearConfirmMode(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clearConfirmMode]);

  // 提取重复的条件判断 - 使用useMemo确保初始值稳定
  const isDrawerVisible = useMemo(() => drawerOpen && !isMobile, [drawerOpen, isMobile]);

  // 使用记忆化的选择器
  const settings = useSelector(selectChatPageSettings);

  // ==================== 事件处理函数 ====================
  // 处理清空话题的二次确认
  const handleClearTopicWithConfirm = useCallback(() => {
    if (clearConfirmMode) {
      // 第二次点击，执行清空
      handleClearTopic();
      setClearConfirmMode(false);
    } else {
      // 第一次点击，进入确认模式
      setClearConfirmMode(true);
    }
  }, [clearConfirmMode, handleClearTopic]);

  // ==================== 计算属性和样式 ====================
  const mergedTopToolbarSettings = {
    ...DEFAULT_TOP_TOOLBAR_SETTINGS,
    ...settings.topToolbar
  };

  const isDIYLayout = Boolean(mergedTopToolbarSettings.componentPositions?.length);
  const shouldShowToolbar = settings.inputLayoutStyle === 'default';

  // 检查是否启用了背景图片 - 用于控制 UI 透明度
  const hasBackgroundImage = useMemo(() => 
    settings.chatBackground?.enabled && settings.chatBackground?.imageUrl,
    [settings.chatBackground]
  );

  // 优化：将样式分离，减少重新计算，使用 CSS Variables
  const baseStyles = useMemo(() => ({
    mainContainer: {
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      height: '100vh',
      bgcolor: 'var(--theme-bg-default)'
    },
    appBar: {
      // 模仿 rikkahub：有背景图时 AppBar 完全透明，否则正常
      bgcolor: hasBackgroundImage ? 'transparent' : 'var(--theme-bg-paper)',
      color: 'var(--theme-text-primary)',
      borderBottom: hasBackgroundImage ? 'none' : '1px solid',
      borderColor: hasBackgroundImage ? 'transparent' : 'var(--theme-border-default)',
    },
    messageContainer: {
      flexGrow: 1,
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100%',
      // 模仿 rikkahub：有背景图时消息容器透明，让背景透出来
      backgroundColor: hasBackgroundImage ? 'transparent' : 'var(--theme-bg-default)',
      // 🚀 为固定定位的输入框预留空间，防止消息被遮挡
      // 动态计算：基础输入框高度 + 安全间距 + 键盘高度 + 安全区域
      // 当键盘弹出时，需要额外增加 padding 以确保消息列表底部内容可见
      // 键盘关闭时，需要加上底部安全区域（导航条区域）的高度
      paddingBottom: keyboardHeight > 0
        ? `${(shouldShowToolbar ? 24 : 16) + keyboardHeight}px`
        : `calc(16px + var(--safe-area-bottom-computed, 0px))`,
      // 平滑过渡动画
      transition: 'padding-bottom 0.2s ease-out',
    },
    welcomeContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80%',
      p: 3,
      textAlign: 'center',
      bgcolor: hasBackgroundImage ? 'transparent' : 'var(--theme-bg-default)',
    },
    welcomeText: {
      fontWeight: 400,
      color: 'var(--theme-text-primary)',
      mb: 1,
    }
  }), [hasBackgroundImage, shouldShowToolbar, keyboardHeight]);

  // contentContainerStyle已移除，样式直接在motion.div中定义

  // ==================== 事件处理函数 ====================

  // 搜索按钮点击处理
  const handleSearchClick = useCallback(() => {
    onSearchToggle?.();
  }, [onSearchToggle]);

  // 上下文压缩点击处理
  const handleCondenseClick = useCallback(async () => {
    if (!currentTopic || currentMessages.length < 5 || isCondensing) {
      if (!currentTopic) {
        setCondenseSnackbar({
          open: true,
          message: '请先选择一个话题',
          severity: 'info'
        });
      } else if (currentMessages.length < 5) {
        setCondenseSnackbar({
          open: true,
          message: '消息数量不足，至少需要5条消息才能压缩',
          severity: 'info'
        });
      }
      return;
    }

    setIsCondensing(true);
    try {
      // 调用 ContextCondenseService 进行压缩
      const result = await contextCondenseService.manualCondense(currentTopic.id);
      
      if (result.error) {
        setCondenseSnackbar({
          open: true,
          message: result.error,
          severity: 'error'
        });
      } else {
        const savedTokens = (result.originalTokens || 0) - (result.compressedTokens || 0);
        setCondenseSnackbar({
          open: true,
          message: `压缩成功！Token 从 ${result.originalTokens?.toLocaleString() || '?'} 减少到 ${result.compressedTokens?.toLocaleString() || '?'}，节省 ${savedTokens.toLocaleString()} tokens`,
          severity: 'success'
        });
      }
    } catch (error: any) {
      console.error('[ChatPageUI] 压缩失败:', error);
      setCondenseSnackbar({
        open: true,
        message: `压缩失败: ${error.message || '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setIsCondensing(false);
    }
  }, [currentTopic, currentMessages.length, isCondensing]);

  // 关闭压缩提示
  const handleCloseCondenseSnackbar = useCallback(() => {
    setCondenseSnackbar(prev => ({ ...prev, open: false }));
  }, []);





  // 简化的工具栏组件渲染函数
  const renderToolbarComponent = useCallback((componentId: string) => {
    const shouldShow = (settingKey: keyof typeof mergedTopToolbarSettings) =>
      isDIYLayout || mergedTopToolbarSettings[settingKey];

    switch (componentId) {
      case 'menuButton':
        return shouldShow('showMenuButton') ? (
          <motion.div
            key={componentId}
            initial={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={BUTTON_ANIMATION_CONFIG}
          >
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleToggleDrawer}
              sx={{ mr: isDIYLayout ? 0 : 1 }}
            >
              <CustomIcon name="documentPanel" size={20} />
            </IconButton>
          </motion.div>
        ) : null;

      case 'topicName':
        if (!shouldShow('showTopicName') || !currentTopic) return null;
        // 字数限制：移动端 8 个字符，桌面端 18 个字符
        const maxLength = isMobile ? 8 : 18;
        const displayName = currentTopic.name.length > maxLength
          ? currentTopic.name.slice(0, maxLength) + '...'
          : currentTopic.name;
        return (
          <Typography
            key={componentId}
            variant="h6"
            noWrap
            component="div"
            sx={{ ml: isDIYLayout ? 0 : 1 }}
            title={currentTopic.name} // 鼠标悬停显示完整名称
          >
            {displayName}
          </Typography>
        );

      case 'newTopicButton':
        return shouldShow('showNewTopicButton') ? (
          <motion.div
            key={componentId}
            initial={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={BUTTON_ANIMATION_CONFIG}
          >
            <IconButton
              color="inherit"
              onClick={handleCreateTopic}
              size="small"
              sx={{ ml: isDIYLayout ? 0 : 1 }}
            >
              <Plus size={20} />
            </IconButton>
          </motion.div>
        ) : null;

      case 'clearButton':
        return shouldShow('showClearButton') && currentTopic ? (
          <motion.div
            key={componentId}
            initial={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={BUTTON_ANIMATION_CONFIG}
          >
            <IconButton
              color="inherit"
              onClick={handleClearTopicWithConfirm}
              size="small"
              sx={{
                ml: isDIYLayout ? 0 : 1,
                color: clearConfirmMode ? '#f44336' : 'inherit',
                transition: 'color 0.2s ease'
              }}
            >
              {clearConfirmMode ? (
                <AlertTriangle size={20} />
              ) : (
                <Trash2 size={20} />
              )}
            </IconButton>
          </motion.div>
        ) : null;

      case 'modelSelector':
        return shouldShow('showModelSelector') ? (
          <Box key={componentId} sx={{ display: 'flex', alignItems: 'center' }}>
            {settings.modelSelectorStyle === 'dropdown' ? (
              <ModelSelector
                selectedModel={selectedModel}
                availableModels={availableModels}
                handleModelSelect={handleModelSelect}
                handleMenuClick={handleModelMenuClick}
                handleMenuClose={handleModelMenuClose}
                menuOpen={menuOpen}
              />
            ) : (
              <>
                <UnifiedModelDisplay
                  selectedModel={selectedModel}
                  onClick={handleModelMenuClick}
                  displayStyle={mergedTopToolbarSettings.modelSelectorDisplayStyle || 'icon'}
                />
                <Box sx={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>
                  <ModelSelector
                    selectedModel={selectedModel}
                    availableModels={availableModels}
                    handleModelSelect={handleModelSelect}
                    handleMenuClick={handleModelMenuClick}
                    handleMenuClose={handleModelMenuClose}
                    menuOpen={menuOpen}
                  />
                </Box>
              </>
            )}
          </Box>
        ) : null;

      case 'searchButton':
        return shouldShow('showSearchButton') ? (
          <motion.div
            key={componentId}
            initial={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={BUTTON_ANIMATION_CONFIG}
          >
            <IconButton
              color={showSearch ? "primary" : "inherit"}
              onClick={handleSearchClick}
              sx={{
                backgroundColor: showSearch ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: showSearch ? 'action.hover' : 'action.hover'
                }
              }}
            >
              <CustomIcon name="search" size={20} />
            </IconButton>
          </motion.div>
        ) : null;

      case 'settingsButton':
        return shouldShow('showSettingsButton') ? (
          <motion.div
            key={componentId}
            initial={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={BUTTON_ANIMATION_CONFIG}
          >
            <IconButton
              color="inherit"
              onClick={() => navigate('/settings')}
            >
              <Settings size={20} />
            </IconButton>
          </motion.div>
        ) : null;

      case 'condenseButton':
        // DIY 布局中的压缩按钮始终显示（如果被放置）
        return isDIYLayout ? (
          <motion.div
            key={componentId}
            initial={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={BUTTON_ANIMATION_CONFIG}
          >
            <IconButton
              color="inherit"
              onClick={handleCondenseClick}
              disabled={isCondensing || !currentTopic || currentMessages.length < 5}
              sx={{
                color: isCondensing ? 'warning.main' : 'inherit',
                '&:disabled': {
                  color: 'action.disabled'
                }
              }}
            >
              {isCondensing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CustomIcon name="foldVertical" size={20} />
              )}
            </IconButton>
          </motion.div>
        ) : null;

      default:
        return null;
    }
  }, [
    mergedTopToolbarSettings,
    settings.modelSelectorStyle,
    isDIYLayout,
    currentTopic,
    selectedModel,
    availableModels,
    menuOpen,
    showSearch,
    // 使用稳定的函数引用
    handleToggleDrawer,
    handleCreateTopic,
    handleClearTopic,
    handleModelSelect,
    handleModelMenuClick,
    handleModelMenuClose,
    navigate,
    handleSearchClick,
    // 压缩相关
    isCondensing,
    handleCondenseClick,
    currentMessages.length
  ]);

  // ==================== 消息处理函数 ====================
  const handleSendMessage = useCallback((content: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => {
    if (currentTopic) {
      handleMessageSend(content, images, toolsEnabled, files);
    } else {
      console.log('没有当前话题，无法发送消息');
    }
  }, [currentTopic, handleMessageSend]);

  const handleSendMultiModelMessage = useCallback((content: string, models: any[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => {
    if (currentTopic && handleMultiModelSend) {
      handleMultiModelSend(content, models, images, toolsEnabled, files);
    } else {
      console.log('没有当前话题，无法发送多模型消息');
    }
  }, [currentTopic, handleMultiModelSend]);

  const handleSendImagePrompt = (prompt: string) => {
    handleMessageSend(prompt);
  };

  // ==================== 组件配置和渲染 ====================

  const commonProps = {
    onSendMessage: handleSendMessage,
    availableModels,
    isLoading,
    allowConsecutiveMessages: true,
    imageGenerationMode,
    videoGenerationMode,
    onSendImagePrompt: handleSendImagePrompt,
    webSearchActive,
    onStopResponse: handleStopResponseClick,
    isStreaming,
    isDebating,
    toolsEnabled,
    ...(handleMultiModelSend && handleSendMultiModelMessage && {
      onSendMultiModelMessage: handleSendMultiModelMessage
    }),
    ...(handleStartDebate && handleStopDebate && {
      onStartDebate: handleStartDebate,
      onStopDebate: handleStopDebate
    })
  };


  const inputComponent = useMemo(() => {
    if (settings.inputLayoutStyle === 'compact') {
      return (
        <CompactChatInput
          key="compact-input"
          {...commonProps}
          onClearTopic={handleClearTopic}
          onNewTopic={handleCreateTopic}
          toggleImageGenerationMode={toggleImageGenerationMode}
          toggleWebSearch={toggleWebSearch}
          toggleToolsEnabled={toggleToolsEnabled}
        />
      );
    } else if (settings.inputLayoutStyle === 'integrated') {
      return (
        <IntegratedChatInput
          key="integrated-input"
          {...commonProps}
          onClearTopic={handleClearTopic}
          toggleImageGenerationMode={toggleImageGenerationMode}
          toggleVideoGenerationMode={toggleVideoGenerationMode}
          toggleWebSearch={toggleWebSearch}
          onToolsEnabledChange={toggleToolsEnabled}
        />
      );
    } else {
      return <ChatInput key="default-input" {...commonProps} />;
    }
  }, [
    settings.inputLayoutStyle,
    commonProps,
    handleClearTopic,
    handleCreateTopic,
    toggleImageGenerationMode,
    toggleWebSearch,
    toggleToolsEnabled
  ]);

  const InputContainer = useMemo(() => (
    <motion.div
      key={`input-container-${isDrawerVisible ? 'open' : 'closed'}`}
      className="chat-input-container"
      initial={false}
      animate={isDrawerVisible ? LAYOUT_CONFIGS.SIDEBAR_OPEN.inputContainer : LAYOUT_CONFIGS.SIDEBAR_CLOSED.inputContainer}
      transition={ANIMATION_CONFIG}
      style={{
        position: 'fixed',
        /**
         * 输入框定位策略 - 解决移动端滚动时输入框跟随移动的问题
         * 
         * 使用 visualViewport API 来正确定位固定元素：
         * - 当键盘弹出且用户滚动时，使用 top + transform 定位到 visual viewport 底部
         * - 否则使用常规 bottom 定位
         * 
         * 参考：https://saricden.com/how-to-make-fixed-elements-respect-the-virtual-keyboard-on-ios
         */
        top: shouldUseVisualViewport && fixedTop !== null ? fixedTop : 'auto',
        bottom: shouldUseVisualViewport && fixedTop !== null ? 'auto' : keyboardHeight,
        transform: shouldUseVisualViewport && fixedTop !== null ? 'translateY(-100%)' : 'none',
        right: 0,
        zIndex: 2,
        backgroundColor: 'transparent',
        boxShadow: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        /**
         * 安全区域处理 - 动态切换 paddingBottom
         */
        paddingBottom: (keyboardHeight > 0 || shouldUseVisualViewport) ? '0' : 'var(--safe-area-bottom-computed)',
        // 使用 visualViewport 时不添加 transition，避免滚动时的延迟感
        transition: shouldUseVisualViewport ? 'none' : 'bottom 0.2s ease-out, padding-bottom 0.2s ease-out',
      }}
    >
      {/* Agentic 模式文件修改列表 - 紧贴输入框上方 */}
      <AgenticFilesList />

      {shouldShowToolbar && (
        <Box sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          px: 2
        }}>
          <InputToolbar
            onClearTopic={handleClearTopic}
            imageGenerationMode={imageGenerationMode}
            toggleImageGenerationMode={toggleImageGenerationMode}
            videoGenerationMode={videoGenerationMode}
            toggleVideoGenerationMode={toggleVideoGenerationMode}
            webSearchActive={webSearchActive}
            toggleWebSearch={toggleWebSearch}
            toolsEnabled={toolsEnabled}
            onToolsEnabledChange={toggleToolsEnabled}
          />
        </Box>
      )}

      <Box sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        px: isMobile ? 0 : 2  // 移动端不要边距，桌面端保持边距
      }}>
        {inputComponent}
      </Box>
    </motion.div>
  ), [
    // 只包含真正影响InputContainer的关键依赖
    isDrawerVisible,
    shouldShowToolbar,
    inputComponent,
    isMobile,
    keyboardHeight, // 键盘高度变化时重新渲染
    // visualViewport 相关依赖 - 用于解决滚动时输入框移动的问题
    fixedTop,
    shouldUseVisualViewport,
    // 添加这些依赖确保工具栏状态变化时正确更新
    handleClearTopic,
    imageGenerationMode,
    toggleImageGenerationMode,
    videoGenerationMode,
    toggleVideoGenerationMode,
    webSearchActive,
    toggleWebSearch,
    toolsEnabled,
    toggleToolsEnabled
  ]);

  // ==================== 组件渲染 ====================

  return (
    <Box
      className="chat-page-container"
      sx={{
        ...baseStyles.mainContainer,
        position: 'relative', // 为背景层提供定位上下文
      }}
    >
      {/* 背景层 - 模仿 rikkahub 的 AssistantBackground，让背景延伸到状态栏 */}
      {settings.chatBackground?.enabled && settings.chatBackground?.imageUrl && (
        <>
          {/* 背景图片层 - opacity 直接控制背景图透明度 */}
          <Box
            className="chat-background-no-scroll"
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0, // 在最底层
              backgroundImage: `url(${settings.chatBackground.imageUrl})`,
              backgroundSize: settings.chatBackground.size || 'cover',
              backgroundPosition: settings.chatBackground.position || 'center',
              backgroundRepeat: settings.chatBackground.repeat || 'no-repeat',
              backgroundAttachment: 'fixed', // 固定背景，不随滚动
              opacity: settings.chatBackground.opacity || 0.7, // 透明度直接应用到背景图
            }}
          />
          {/* 渐变遮罩层 - 提高文字可读性，可通过设置开关控制 */}
          {settings.chatBackground.showOverlay !== false && (
            <Box
              className="chat-background-no-scroll"
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1, // 在背景图上方，内容下方
                // 固定渐变：顶部较浅，底部稍深
                background: `linear-gradient(to bottom, 
                  rgba(255, 255, 255, 0.3), 
                  rgba(255, 255, 255, 0.5)
                )`,
                pointerEvents: 'none', // 不阻止用户交互
              }}
            />
          )}
        </>
      )}

      {/* 统一的侧边栏组件 - 使用Framer Motion优化 */}
      <Sidebar
        mcpMode={mcpMode}
        toolsEnabled={toolsEnabled}
        onMCPModeChange={handleMCPModeChange}
        onToolsToggle={toggleToolsEnabled}
        {...(isMobile ? {
          mobileOpen: drawerOpen,
          onMobileToggle: handleMobileToggle
        } : {
          desktopOpen: drawerOpen,
          onDesktopToggle: handleDesktopToggle
        })}
      />

      {/* 主内容区域 - 🚀 使用预计算布局，避免Drawer推开导致的重新布局 */}
      <Box
        className="chat-main-content-no-scroll"
        component={motion.div}
        key={`main-content-${isDrawerVisible ? 'open' : 'closed'}`}
        initial={false}
        animate={isDrawerVisible ? LAYOUT_CONFIGS.SIDEBAR_OPEN.mainContent : LAYOUT_CONFIGS.SIDEBAR_CLOSED.mainContent}
        transition={ANIMATION_CONFIG}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - var(--titlebar-height, 0px))',
          overflow: 'hidden',
          // 模仿 rikkahub Scaffold(containerColor = Color.Transparent)：有背景图时透明
          backgroundColor: hasBackgroundImage ? 'transparent' : 'var(--theme-bg-default)',
          // 🔧 固定定位，避免被Drawer推开
          position: 'fixed',
          top: 'var(--titlebar-height, 0px)',
          right: 0,
          zIndex: 2, // 确保在背景和遮罩之上（背景 z-index: 0, 遮罩 z-index: 1）
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          className="status-bar-safe-area"
          sx={{
            ...baseStyles.appBar,
            boxShadow: 'none',
            backgroundImage: 'none',
            '&::before': { display: 'none' },
            '&::after': { display: 'none' },
            backdropFilter: (hasBackgroundImage && settings.chatBackground?.showOverlay !== false) 
              ? 'blur(8px)' 
              : 'none',
          }}
        >
          <Toolbar
            className="chat-toolbar-no-scroll"
            sx={{
              position: 'relative',
              minHeight: '56px !important',
              justifyContent: isDIYLayout ? 'center' : 'space-between',
              userSelect: 'none', // 禁止工具栏文本选择
              backgroundColor: 'transparent', // Toolbar 也要透明
            }}
          >
            {/* 如果有DIY布局，使用绝对定位渲染组件 */}
            {isDIYLayout ? (
              <>
                {mergedTopToolbarSettings.componentPositions.map((position: any) => {
                  const component = renderToolbarComponent(position.id);
                  if (!component) return null;

                  return (
                    <motion.div
                      key={position.id}
                      initial={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                      }}
                      animate={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                      }}
                      style={{
                        position: 'absolute',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        userSelect: 'none', // 禁止DIY布局组件文本选择
                      }}
                      transition={ANIMATION_CONFIG}
                    >
                      {component}
                    </motion.div>
                  );
                })}
              </>
            ) : (
              /* 传统左右布局 */
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, userSelect: 'none' }}>
                  {mergedTopToolbarSettings.leftComponents?.map(renderToolbarComponent).filter(Boolean)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, userSelect: 'none' }}>
                  {mergedTopToolbarSettings.rightComponents?.map(renderToolbarComponent).filter(Boolean)}
                </Box>
              </>
            )}
          </Toolbar>
        </AppBar>



        {/* 聊天内容区域 */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          // 确保与工具栏无缝衔接
          backgroundColor: hasBackgroundImage ? 'transparent' : 'var(--theme-bg-default)',
        }}>
          {currentTopic ? (
            <>
              {/* 消息列表应该有固定的可滚动区域，不会被输入框覆盖 */}
              <Box sx={{
                ...baseStyles.messageContainer
              }}>
                <ErrorBoundary>
                  <SolidMessageList
                    messages={currentMessages}
                    onRegenerate={handleRegenerateMessage}
                    onDelete={handleDeleteMessage}
                    onSwitchVersion={handleSwitchMessageVersion}
                    onResend={handleResendMessage}
                  />
                </ErrorBoundary>
              </Box>

              {/* 对话导航组件 */}
              <ChatNavigation containerId="messageList" topicId={currentTopic?.id} />

              {/* 输入框容器，固定在底部 */}
              <ErrorBoundary>
                {InputContainer}
              </ErrorBoundary>
            </>
          ) : (
            <>
              <Box
                sx={{
                  ...baseStyles.messageContainer,
                  // paddingBottom 已在 baseStyles.messageContainer 中定义
                }}
              >
                <Box sx={baseStyles.welcomeContainer}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={baseStyles.welcomeText}
                  >
                    对话开始了，请输入您的问题
                  </Typography>
                </Box>
              </Box>

              {/* 即使没有当前话题，也显示输入框 */}
              {InputContainer}
            </>
          )}
        </Box>
      </Box>


      {/* 压缩结果提示 */}
      <Snackbar
        open={condenseSnackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseCondenseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: { xs: 100, sm: 80 }, // 在输入框上方显示
          zIndex: 9999
        }}
      >
        <Alert
          onClose={handleCloseCondenseSnackbar}
          severity={condenseSnackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: 3
          }}
        >
          {condenseSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// 🚀 自定义比较函数，只比较关键props
const isSameMessage = (prevMsg: Message, nextMsg: Message) => {
  if (
    prevMsg.id !== nextMsg.id ||
    prevMsg.updatedAt !== nextMsg.updatedAt ||
    prevMsg.status !== nextMsg.status ||
    prevMsg.currentVersionId !== nextMsg.currentVersionId
  ) {
    return false;
  }

  const prevVersionsLength = prevMsg.versions?.length ?? 0;
  const nextVersionsLength = nextMsg.versions?.length ?? 0;
  if (prevVersionsLength !== nextVersionsLength) {
    return false;
  }

  const prevBlocks = prevMsg.blocks || [];
  const nextBlocks = nextMsg.blocks || [];
  if (prevBlocks.length !== nextBlocks.length) {
    return false;
  }

  for (let i = 0; i < prevBlocks.length; i++) {
    if (prevBlocks[i] !== nextBlocks[i]) {
      return false;
    }
  }

  return true;
};

const arePropsEqual = (prevProps: ChatPageUIProps, nextProps: ChatPageUIProps) => {
  // 基础属性比较
  if (
    prevProps.isMobile !== nextProps.isMobile ||
    prevProps.drawerOpen !== nextProps.drawerOpen ||
    prevProps.isStreaming !== nextProps.isStreaming ||
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.webSearchActive !== nextProps.webSearchActive ||
    prevProps.imageGenerationMode !== nextProps.imageGenerationMode ||
    prevProps.videoGenerationMode !== nextProps.videoGenerationMode ||
    prevProps.toolsEnabled !== nextProps.toolsEnabled ||
    prevProps.mcpMode !== nextProps.mcpMode ||
    prevProps.isDebating !== nextProps.isDebating ||
    prevProps.menuOpen !== nextProps.menuOpen ||
    prevProps.showSearch !== nextProps.showSearch
  ) {
    return false;
  }

  // 话题比较 - 只比较关键属性
  // 🔥 关键修复：添加 prompt 比较，确保系统提示词变化时能正确更新
  if (prevProps.currentTopic?.id !== nextProps.currentTopic?.id ||
      prevProps.currentTopic?.name !== nextProps.currentTopic?.name ||
      prevProps.currentTopic?.updatedAt !== nextProps.currentTopic?.updatedAt ||
      prevProps.currentTopic?.prompt !== nextProps.currentTopic?.prompt) {
    return false;
  }

  // 🔥 关键修复：比较助手对象，确保 systemPrompt 变化时能正确更新
  // 注意：助手对象可能通过 Redux 传递，需要比较关键属性
  if (prevProps.currentTopic?.assistantId !== nextProps.currentTopic?.assistantId) {
    return false;
  }

  // 模型比较
  if (prevProps.selectedModel?.id !== nextProps.selectedModel?.id) {
    return false;
  }

  // 🚀 流式输出时，总是允许重新渲染（因为块内容会频繁更新）
  // 注意：块的更新在Redux的messageBlocks中，不会反映在消息的blocks数组（只是ID数组）
  if (prevProps.isStreaming || nextProps.isStreaming) {
    return false; // 流式输出时总是重新渲染
  }

  // 消息列表比较 - 只比较长度和关键属性
  if (prevProps.currentMessages.length !== nextProps.currentMessages.length) {
    return false;
  }

  // 比较每条消息的关键属性
  for (let i = 0; i < prevProps.currentMessages.length; i++) {
    const prevMsg = prevProps.currentMessages[i];
    const nextMsg = nextProps.currentMessages[i];

    if (!isSameMessage(prevMsg, nextMsg)) {
      return false;
    }
  }

  // 可用模型列表比较
  if (prevProps.availableModels.length !== nextProps.availableModels.length) {
    return false;
  }

  return true;
};

// 导出使用React.memo优化的组件
export const ChatPageUI = React.memo(ChatPageUIComponent, arePropsEqual);