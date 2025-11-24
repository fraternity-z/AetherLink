import React, { useMemo, useCallback, startTransition, useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { CustomIcon } from '../../../components/icons';
import { Capacitor } from '@capacitor/core';

import MessageList from '../../../components/message/MessageList';
import { ChatInput, CompactChatInput, IntegratedChatInput, InputToolbar } from '../../../components/input';
import { Sidebar } from '../../../components/TopicManagement';
import { ModelSelector } from './ModelSelector';
import { UnifiedModelDisplay } from './UnifiedModelDisplay';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import type { SiliconFlowImageFormat, ChatTopic, Message, Model } from '../../../shared/types';
import { useTopicManagement } from '../../../shared/hooks/useTopicManagement';
import { useKeyboard } from '../../../shared/hooks/useKeyboard';
import ChatNavigation from '../../../components/chat/ChatNavigation';
import ErrorBoundary from '../../../components/ErrorBoundary';
import type { DebateConfig } from '../../../shared/services/AIDebateService';
import { createSelector } from 'reselect';



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
const DRAWER_WIDTH = 320;
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94] as const
};
const BUTTON_ANIMATION_CONFIG = {
  duration: 0.1
} as const;

// 预计算的布局配置 - 避免运行时计算
const LAYOUT_CONFIGS = {
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
      marginLeft: DRAWER_WIDTH,
      width: `calc(100% - ${DRAWER_WIDTH}px)`
    },
    inputContainer: {
      left: DRAWER_WIDTH,
      width: `calc(100% - ${DRAWER_WIDTH}px)`
    }
  }
} as const;

// 记忆化的选择器 - 避免不必要的重渲染
const selectChatPageSettings = createSelector(
  (state: RootState) => state.settings.themeStyle,
  (state: RootState) => state.settings.inputLayoutStyle,
  (state: RootState) => state.settings.topToolbar,
  (state: RootState) => state.settings.modelSelectorStyle,
  (state: RootState) => state.settings.chatBackground,
  (themeStyle, inputLayoutStyle, topToolbar, modelSelectorStyle, chatBackground) => ({
    themeStyle,
    inputLayoutStyle: inputLayoutStyle || 'default',
    topToolbar,
    modelSelectorStyle,
    chatBackground: chatBackground || {
      enabled: false,
      imageUrl: '',
      opacity: 0.3,
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat'
    }
  })
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
  // 搜索相关
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

  // 键盘管理 - iOS 使用 visualViewport，Android 使用 keyboardHeight
  const { keyboardHeight, visualViewportHeight } = useKeyboard();
  const isIOS = Capacitor.getPlatform() === 'ios';

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
  // 清空按钮的二次确认状态
  const [clearConfirmMode, setClearConfirmMode] = useState(false);

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
      // 动态计算：基础输入框高度 + 工具栏高度(如果显示) + 安全间距
      paddingBottom: shouldShowToolbar ? '90px' : '60px',
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
  }), [hasBackgroundImage, shouldShowToolbar]);

  // contentContainerStyle已移除，样式直接在motion.div中定义

  // ==================== 事件处理函数 ====================

  // 搜索按钮点击处理
  const handleSearchClick = useCallback(() => {
    onSearchToggle?.();
  }, [onSearchToggle]);





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
        return shouldShow('showTopicName') && currentTopic ? (
          <Typography key={componentId} variant="h6" noWrap component="div" sx={{ ml: isDIYLayout ? 0 : 1 }}>
            {currentTopic.name}
          </Typography>
        ) : null;

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
    handleSearchClick
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
      initial={false}
      animate={isDrawerVisible ? LAYOUT_CONFIGS.SIDEBAR_OPEN.inputContainer : LAYOUT_CONFIGS.SIDEBAR_CLOSED.inputContainer}
      transition={ANIMATION_CONFIG}
      style={{
        position: 'fixed',
        /**
         * 🚀 iOS vs Android 键盘处理 - 使用不同的定位策略
         * 
         * iOS（使用 Visual Viewport API）：
         * - top: visualViewportHeight + transform: translateY(-100%)
         * - visualViewport.height 会自动减去键盘高度
         * - 不会有二次跳动问题
         * - 参考：https://saricden.com/how-to-make-fixed-elements-respect-the-virtual-keyboard-on-ios
         * 
         * Android（使用 Capacitor Keyboard 事件）：
         * - bottom: keyboardHeight
         * - 监听 keyboardWillShow 事件获取键盘高度
         * - 性能更好，无需额外计算
         * 
         * 参考：rikkahub 的 imePadding() 修饰符
         */
        ...(isIOS ? {
          // iOS: 使用 top + transform 定位
          top: `${visualViewportHeight}px`,
          transform: 'translateY(-100%)',
          left: 0,
        } : {
          // Android: 使用 bottom 定位
          bottom: keyboardHeight,
        }),
        right: 0,
        zIndex: 2,
        backgroundColor: 'transparent',
        boxShadow: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        /**
         * 安全区域处理 - 只在 Android 需要动态切换
         * iOS 由 visualViewport 自动处理，不需要额外的 paddingBottom
         */
        paddingBottom: isIOS 
          ? '8px' // iOS 固定 padding
          : (keyboardHeight > 0 ? '0' : 'max(env(safe-area-inset-bottom, 0px), 8px)'), // Android 动态切换
        transition: isIOS 
          ? 'top 0.2s ease-out' // iOS 只需过渡 top
          : 'bottom 0.2s ease-out, padding-bottom 0.2s ease-out', // Android 过渡 bottom 和 padding
      }}
    >
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
    keyboardHeight, // Android 键盘高度
    visualViewportHeight, // iOS Visual Viewport 高度
    isIOS, // 平台判断
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
        component={motion.div}
        key={`main-content-${isDrawerVisible ? 'open' : 'closed'}`}
        initial={false}
        animate={isDrawerVisible ? LAYOUT_CONFIGS.SIDEBAR_OPEN.mainContent : LAYOUT_CONFIGS.SIDEBAR_CLOSED.mainContent}
        transition={ANIMATION_CONFIG}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          // 模仿 rikkahub Scaffold(containerColor = Color.Transparent)：有背景图时透明
          backgroundColor: hasBackgroundImage ? 'transparent' : 'var(--theme-bg-default)',
          // 🔧 固定定位，避免被Drawer推开
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 2, // 确保在背景和遮罩之上（背景 z-index: 0, 遮罩 z-index: 1）
        }}
      >
        {/* 顶部应用栏 - 模仿 rikkahub TopAppBar(containerColor = Color.Transparent) */}
        <AppBar
          position="static"
          elevation={0}
          className="status-bar-safe-area"
          sx={{
            ...baseStyles.appBar,
            // 🚀 安全区域只在移动端应用
            paddingTop: Capacitor.isNativePlatform() ? '25px' : '0px',
            // 强制移除所有可能的阴影和边框
            boxShadow: 'none',
            backgroundImage: 'none',
            '&::before': { display: 'none' },
            '&::after': { display: 'none' },
            // 🚀 模糊效果跟随遮罩开关：只有开启遮罩时才显示模糊
            backdropFilter: (hasBackgroundImage && settings.chatBackground?.showOverlay !== false) 
              ? 'blur(8px)' 
              : 'none',
          }}
        >
          <Toolbar sx={{
            position: 'relative',
            minHeight: '56px !important',
            justifyContent: isDIYLayout ? 'center' : 'space-between',
            userSelect: 'none', // 禁止工具栏文本选择
            backgroundColor: 'transparent', // Toolbar 也要透明
          }}>
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
                  <MessageList
                    messages={currentMessages}
                    onRegenerate={handleRegenerateMessage}
                    onDelete={handleDeleteMessage}
                    onSwitchVersion={handleSwitchMessageVersion}
                    onResend={handleResendMessage}
                  />
                </ErrorBoundary>
              </Box>

              {/* 对话导航组件 */}
              <ChatNavigation containerId="messageList" />

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