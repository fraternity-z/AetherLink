import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
  Chip,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Tooltip
} from '@mui/material';
import {
  MoreVertical,
  Volume2,
  VolumeX,
  History,
  GitBranch,
  Copy,
  RefreshCw,
  Trash2,
  Edit,
  Save,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import TokenDisplay from '../chat/TokenDisplay';
import type { Message, MessageVersion } from '../../shared/types/newMessage.ts';
import MessageEditor from './MessageEditor';
import ExportMenu from './ExportMenu';
import { TTSService } from '../../shared/services/TTSService';
import { getMainTextContent } from '../../shared/utils/messageUtils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EventEmitter, EVENT_NAMES } from '../../shared/services/EventService';
import { getStorageItem } from '../../shared/utils/storage';
import { useAppSelector } from '../../shared/store';
import { Clipboard } from '@capacitor/clipboard';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface MessageActionsProps {
  message: Message;
  topicId?: string;
  messageIndex?: number; // 消息在列表中的索引，用于分支功能
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onSwitchVersion?: (messageId: string) => void;
  onResend?: (messageId: string) => void; // 新增重新发送回调
  renderMode?: 'full' | 'menuOnly' | 'toolbar'; // 新增渲染模式参数
  customTextColor?: string; // 自定义文字颜色
}

// 优化：将样式常量移到组件外部，避免每次渲染重新计算
const getThemeColors = (isDark: boolean) => ({
  aiBubbleColor: isDark ? '#1a3b61' : '#e6f4ff',
  aiBubbleActiveColor: isDark ? '#234b79' : '#d3e9ff',
  textColor: isDark ? '#ffffff' : '#333333'
});

// 优化：将重复的样式对象移到组件外部
const getToolbarIconButtonStyle = (customColor?: string) => ({
  padding: 0.5,
  opacity: 0.8,
  color: customColor || 'text.primary',
  '&:hover': {
    opacity: 1,
    transform: 'scale(1.1)'
  },
  transition: 'all 0.2s ease-in-out'
});

const menuButtonStyle = (isDark: boolean) => ({
  padding: 0.5,
  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
  borderRadius: '50%',
  width: 20,
  height: 20,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0.8,
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  '&:hover': {
    opacity: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)'
  }
});

// 删除按钮的特殊样式
const getDeleteButtonStyle = (isClicked: boolean, errorColor: string, customColor?: string) => ({
  ...getToolbarIconButtonStyle(customColor),
  color: isClicked ? errorColor : (customColor || 'text.primary'),
  opacity: isClicked ? 1 : 0.8,
  transform: isClicked ? 'scale(1.1)' : 'scale(1)',
  transition: 'all 0.2s ease-in-out'
});

const MessageActions: React.FC<MessageActionsProps> = React.memo(({
  message,
  topicId,
  messageIndex = 0,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend,
  renderMode = 'full', // 默认为完整渲染模式
  customTextColor
}) => {
  const isUser = message.role === 'user';
  const theme = useTheme();

  // 获取工具栏按钮样式
  const toolbarIconButtonStyle = getToolbarIconButtonStyle(customTextColor);

  // 获取版本切换样式设置
  const settings = useAppSelector((state) => state.settings);
  const versionSwitchStyle = (settings as any).versionSwitchStyle || 'popup';

  // 检查是否显示小功能气泡
  const showMicroBubbles = settings.showMicroBubbles !== false;

  // 优化：使用useMemo缓存主题颜色计算
  const themeColors = useMemo(() =>
    getThemeColors(theme.palette.mode === 'dark'),
    [theme.palette.mode]
  );

  // 菜单状态
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // 编辑对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // 版本切换弹出框状态
  const [versionAnchorEl, setVersionAnchorEl] = useState<null | HTMLElement>(null);
  const versionPopoverOpen = Boolean(versionAnchorEl);

  // 导出菜单状态
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  // 删除按钮状态（两次点击确认）
  const [deleteButtonClicked, setDeleteButtonClicked] = useState(false);

  // TTS播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  // TTS功能启用状态
  const [enableTTS, setEnableTTS] = useState(true);
  // TTS配置缓存
  const ttsConfigRef = useRef<{
    apiKey: string;
    model: string;
    voice: string;
    loaded: boolean;
  }>({
    apiKey: '',
    model: 'FunAudioLLM/CosyVoice2-0.5B',
    voice: 'alex',
    loaded: false
  });

  // 初始化TTS服务 - 使用全局配置初始化，避免重复加载
  useEffect(() => {
    const initializeTTS = async () => {
      try {
        const ttsService = TTSService.getInstance();

        // 使用TTSService的全局配置初始化
        const success = await ttsService.initializeConfig();

        if (success) {
          // 标记本地配置已加载
          ttsConfigRef.current.loaded = true;

          // 从存储获取启用状态
          const enabled = await getStorageItem<string>('enable_tts');
          const isEnabled = enabled !== 'false'; // 默认启用
          setEnableTTS(isEnabled);
        } else {
          console.warn('TTS配置初始化失败，使用默认设置');
          setEnableTTS(true); // 默认启用
        }
      } catch (error) {
        console.error('TTS初始化失败:', error);
        setEnableTTS(true); // 默认启用
      }
    };

    // 如果本地配置未加载，则初始化
    if (!ttsConfigRef.current.loaded) {
      initializeTTS();
    }
  }, []);

  // 监听TTS播放状态变化 - 优化：减少轮询频率，使用更高效的检查机制
  useEffect(() => {
    const ttsService = TTSService.getInstance();

    // 检测初始状态
    const currentMessageId = ttsService.getCurrentMessageId();
    const initialPlaying = currentMessageId === message.id && ttsService.getIsPlaying();
    setIsPlaying(initialPlaying);

    // 优化：减少轮询频率到1秒，并添加条件检查
    const intervalId = setInterval(() => {
      const currentId = ttsService.getCurrentMessageId();
      const isServicePlaying = ttsService.getIsPlaying();
      const shouldBePlaying = isServicePlaying && currentId === message.id;

      // 只在状态真正改变时更新
      if (isPlaying !== shouldBePlaying) {
        setIsPlaying(shouldBePlaying);
      }
    }, 1000); // 从500ms改为1000ms

    return () => clearInterval(intervalId);
  }, [message.id, isPlaying]);

  // 打开菜单 - 优化：使用useCallback
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  // 关闭菜单 - 优化：使用useCallback
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // 复制消息内容到剪贴板 - 优化：使用useCallback
  const handleCopyContent = useCallback(async () => {
    if (!message) return;

    try {
      // 使用工具函数获取主文本内容
      const textContent = getMainTextContent(message);

      // 优先使用Capacitor Clipboard插件（移动端）
      try {
        await Clipboard.write({
          string: textContent
        });
      } catch (capacitorError) {
        // 如果Capacitor失败，回退到Web API
        await navigator.clipboard.writeText(textContent);
      }

      handleMenuClose();
    } catch (error) {
      console.error('复制内容失败:', error);
      alert('复制失败');
    }
  }, [message, handleMenuClose]);

  // 打开编辑对话框 - 优化：使用useCallback
  const handleEditClick = useCallback(() => {
    setEditDialogOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  // 删除消息 - 两次点击确认逻辑
  const handleDeleteClick = useCallback(() => {
    if (!deleteButtonClicked) {
      // 第一次点击：变红，准备删除
      setDeleteButtonClicked(true);
      // 3秒后自动重置状态
      setTimeout(() => {
        setDeleteButtonClicked(false);
      }, 3000);
    } else {
      // 第二次点击：执行删除
      if (onDelete) {
        onDelete(message.id);
      }
      setDeleteButtonClicked(false);
    }
    handleMenuClose();
  }, [deleteButtonClicked, onDelete, message.id]);

  // 重新生成消息 - 优化：使用useCallback
  const handleRegenerateClick = useCallback(() => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
    handleMenuClose();
  }, [onRegenerate, message.id, handleMenuClose]);

  // 重新发送消息（用户消息）- 优化：使用useCallback
  const handleResendClick = useCallback(() => {
    if (onResend) {
      onResend(message.id);
    }
    handleMenuClose();
  }, [onResend, message.id, handleMenuClose]);

  // 保存消息内容 - 优化：使用useCallback
  const handleSaveContent = useCallback(async () => {
    try {
      const textContent = getMainTextContent(message);
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      const fileName = `message_${timestamp}.txt`;

      // 移动端使用Capacitor Filesystem
      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: textContent,
            directory: Directory.External,
            encoding: Encoding.UTF8
          });
          alert('消息内容已保存到下载目录');
        } catch (capacitorError) {
          console.error('Capacitor保存失败:', capacitorError);
          // 回退到Web方式
          throw capacitorError;
        }
      } else {
        // Web端使用下载链接
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('消息内容已保存');
      }
    } catch (error) {
      console.error('保存消息内容失败:', error);
      alert('保存失败');
    }
    handleMenuClose();
  }, [message, handleMenuClose]);

  // 创建分支 - 使用最佳实例的事件机制
  const handleCreateBranch = useCallback(() => {
    if (messageIndex === undefined) {
      console.error('[MessageActions] 无法创建分支: 缺少messageIndex');
      return;
    }

    // 发送NEW_BRANCH事件，传递消息索引
    EventEmitter.emit(EVENT_NAMES.NEW_BRANCH, messageIndex);

    handleMenuClose();
  }, [messageIndex]);

  // 文本转语音 - 优化：使用缓存的配置，避免重复存储调用
  const handleTextToSpeech = useCallback(async () => {
    try {
      const ttsService = TTSService.getInstance();
      const content = getMainTextContent(message);

      if (isPlaying) {
        // 如果正在播放，停止
        ttsService.stop();
        setIsPlaying(false);
      } else {
        // 使用缓存的配置，避免重复的存储调用
        const config = ttsConfigRef.current;

        // 如果配置未加载，则等待加载
        if (!config.loaded) {
          console.warn('TTS配置尚未加载完成，请稍后再试');
          return;
        }

        console.log('🔧 聊天界面TTS配置:', {
          hasApiKey: !!config.apiKey,
          model: config.model,
          voice: config.voice
        });

        // 设置TTS配置
        if (config.apiKey) {
          ttsService.setApiKey(config.apiKey);
        }
        if (config.model && config.voice) {
          ttsService.setDefaultVoice(config.model, config.voice);
        }

        // 开始播放 - 不传递语音参数，使用默认语音
        await ttsService.speak(content);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('TTS错误:', error);
      alert('文本转语音失败');
    }

    handleMenuClose();
  }, [isPlaying, message, handleMenuClose]);

  // 检查是否有多个版本 - 放宽条件，对象存在且长度至少为1也显示历史按钮，方便调试
  // 旧逻辑: const hasMultipleVersions = Array.isArray(message.versions) && message.versions.length > 1;
  const hasMultipleVersions = Array.isArray(message.versions) && message.versions.length >= 1;

  // 获取当前版本号 - 根据 currentVersionId 确定
  const getCurrentVersionNumber = useMemo(() => {
    if (!message.versions || message.versions.length === 0) return 1;

    // 如果有 currentVersionId，找到对应版本的索引
    if (message.currentVersionId) {
      const versionIndex = message.versions.findIndex(v => v.id === message.currentVersionId);
      if (versionIndex >= 0) {
        return versionIndex + 1; // 版本从1开始计数
      }
    }

    // 默认显示最新版本
    return message.versions.length + 1;
  }, [message.versions, message.currentVersionId]);

  // 按照 Chatbox 原理：总版本数 = 历史版本数 + 当前版本
  const getTotalVersionCount = useMemo(() => {
    const historyVersionCount = message.versions?.length || 0;
    return historyVersionCount + 1; // 历史版本 + 当前版本
  }, [message.versions]);

  // 获取当前版本索引 - 用于箭头式切换
  const currentVersionIndex = useMemo(() => {
    if (!message.versions || message.versions.length === 0) return -1;

    if (message.currentVersionId) {
      return message.versions.findIndex(v => v.id === message.currentVersionId);
    }

    return -1; // -1 表示当前是最新版本
  }, [message.versions, message.currentVersionId]);

  // 计算总版本数（包括最新版本）
  const totalVersions = useMemo(() => {
    return (message.versions?.length || 0) + 1;
  }, [message.versions]);

  // 箭头式切换 - 前一个版本
  const handlePreviousVersion = useCallback(() => {
    if (!message.versions || message.versions.length === 0) return;

    if (currentVersionIndex === -1) {
      // 当前是最新版本，切换到最后一个历史版本
      const lastVersion = message.versions[message.versions.length - 1];
      if (lastVersion && onSwitchVersion) {
        onSwitchVersion(lastVersion.id);
      }
    } else if (currentVersionIndex > 0) {
      // 切换到前一个版本
      const prevVersion = message.versions[currentVersionIndex - 1];
      if (prevVersion && onSwitchVersion) {
        onSwitchVersion(prevVersion.id);
      }
    }
  }, [message.versions, currentVersionIndex, onSwitchVersion]);

  // 箭头式切换 - 后一个版本
  const handleNextVersion = useCallback(() => {
    if (!message.versions || message.versions.length === 0) return;

    if (currentVersionIndex === -1) {
      // 已经是最新版本，无需操作
      return;
    } else if (currentVersionIndex === message.versions.length - 1) {
      // 当前是最后一个历史版本，切换到最新版本
      if (onSwitchVersion) {
        onSwitchVersion('latest');
      }
    } else {
      // 切换到下一个版本
      const nextVersion = message.versions[currentVersionIndex + 1];
      if (nextVersion && onSwitchVersion) {
        onSwitchVersion(nextVersion.id);
      }
    }
  }, [message.versions, currentVersionIndex, onSwitchVersion]);

  // 切换到特定版本 - 保留原有函数
  const handleSwitchToVersion = useCallback((versionId: string) => {
    if (onSwitchVersion) {
      onSwitchVersion(versionId);
    }

    // 关闭弹窗
    setVersionAnchorEl(null);
  }, [onSwitchVersion]);

  // 切换到最新版本 - 保留原有函数
  const handleSwitchToLatest = useCallback(() => {
    if (onSwitchVersion) {
      // 传递特殊标记'latest'表示切换到最新版本
      onSwitchVersion('latest');
    }

    // 关闭弹窗
    setVersionAnchorEl(null);
  }, [onSwitchVersion]);

  // 手动创建当前版本 - 保留原有函数
  const handleCreateVersion = useCallback(() => {
    if (onSwitchVersion) {
      // 使用特殊标记'create'表示创建新版本
      onSwitchVersion('create');
    }

    // 关闭弹窗
    setVersionAnchorEl(null);
  }, [onSwitchVersion]);

  // 导出功能处理
  const handleExportClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleExportMenuClose = useCallback(() => {
    setExportAnchorEl(null);
  }, []);

  // 删除特定版本 - 保留原有函数
  const handleDeleteVersion = useCallback((versionId: string, event: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发切换版本
    event.stopPropagation();

    if (onSwitchVersion) {
      // 使用特殊前缀'delete:'表示删除版本
      onSwitchVersion(`delete:${versionId}`);
    }
  }, [onSwitchVersion]);

  // 格式化时间 - 优化：使用useCallback
  const formatTime = useCallback((dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '未知时间';
    }
  }, []);

  // 获取版本源信息的显示文本
  const getVersionSourceText = useCallback((version: MessageVersion) => {
    const source = version.metadata?.source;
    if (!source) return '';

    switch (source) {
      case 'regenerate':
        return '重新生成';
      case 'manual':
        return '手动保存';
      case 'auto_before_switch':
        return '自动保存';
      default:
        return '';
    }
  }, []);

  return (
    <>
      {/* 根据renderMode决定渲染哪些部分 */}
      {renderMode === 'full' && showMicroBubbles && (
        /* 只显示版本指示器和播放按钮，不显示三点菜单 */
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative', top: '-1px' }}>
          {/* 只有助手消息且有多个版本时显示版本指示器 */}
          {!isUser && hasMultipleVersions && (
            <>
              {versionSwitchStyle === 'arrows' ? (
                // 箭头式版本切换
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: themeColors.aiBubbleColor,
                  borderRadius: '10px',
                  padding: '0 2px',
                  height: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
                  marginRight: '2px',
                  '&:hover': {
                    backgroundColor: themeColors.aiBubbleActiveColor,
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'
                  }
                }}>
                  <IconButton
                    size="small"
                    onClick={handlePreviousVersion}
                    disabled={currentVersionIndex <= 0 && message.currentVersionId !== undefined}
                    sx={{
                      padding: 0,
                      opacity: currentVersionIndex <= 0 && message.currentVersionId !== undefined ? 0.3 : 0.7,
                      '&:hover': { opacity: 1 },
                      color: themeColors.textColor
                    }}
                  >
                    <ChevronLeft size={12} />
                  </IconButton>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '10px',
                      fontWeight: 'medium',
                      color: themeColors.textColor,
                      mx: 0.5,
                      userSelect: 'none'
                    }}
                  >
                    {message.currentVersionId ? currentVersionIndex + 1 : totalVersions}/{totalVersions}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={handleNextVersion}
                    disabled={currentVersionIndex === -1}
                    sx={{
                      padding: 0,
                      opacity: currentVersionIndex === -1 ? 0.3 : 0.7,
                      '&:hover': { opacity: 1 },
                      color: themeColors.textColor
                    }}
                  >
                    <ChevronRight size={12} />
                  </IconButton>
                </Box>
              ) : (
                // 默认弹出式版本切换
                <Chip
                  size="small"
                  label={`版本 ${getCurrentVersionNumber}/${getTotalVersionCount}`}
                  variant="filled"
                  color="info"
                  onClick={(e) => setVersionAnchorEl(e.currentTarget)}
                  icon={<History size={12} />}
                  sx={{
                    height: 18,
                    paddingLeft: '2px',
                    paddingRight: '4px',
                    fontSize: '10px',
                    fontWeight: 'medium',
                    opacity: 0.95,
                    backgroundColor: themeColors.aiBubbleColor,
                    color: themeColors.textColor,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    borderRadius: '10px',
                    border: 'none',
                    marginRight: '2px',
                    '&:hover': {
                      opacity: 1,
                      cursor: 'pointer',
                      backgroundColor: themeColors.aiBubbleActiveColor
                    },
                    '& .MuiChip-icon': {
                      ml: 0.3,
                      mr: -0.3,
                      fontSize: '10px',
                      color: themeColors.textColor
                    },
                    '& .MuiChip-label': {
                      padding: '0 4px',
                      lineHeight: 1.2
                    }
                  }}
                />
              )}
            </>
          )}

          {!isUser && enableTTS && (
            <Chip
              size="small"
              label={isPlaying ? "播放中" : "播放"}
              variant="filled"
              color="primary"
              onClick={handleTextToSpeech}
              icon={isPlaying ? <Volume2 size={12} /> : <VolumeX size={12} />}
              sx={{
                height: 18,
                paddingLeft: '2px',
                paddingRight: '4px',
                fontSize: '10px',
                fontWeight: 'medium',
                opacity: 0.95,
                backgroundColor: isPlaying ? themeColors.aiBubbleActiveColor : themeColors.aiBubbleColor,
                color: themeColors.textColor,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                borderRadius: '10px',
                border: versionSwitchStyle === 'arrows' ?
                  `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}` : 'none',
                '&:hover': {
                  opacity: 1,
                  cursor: 'pointer',
                  backgroundColor: themeColors.aiBubbleActiveColor,
                  borderColor: versionSwitchStyle === 'arrows' ?
                    (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)') : undefined
                },
                '& .MuiChip-icon': {
                  ml: 0.3,
                  mr: -0.3,
                  fontSize: '10px',
                  color: themeColors.textColor
                },
                '& .MuiChip-label': {
                  padding: '0 4px',
                  lineHeight: 1.2
                }
              }}
            />
          )}
        </Box>
      )}

      {/* 三点菜单按钮 - 只在menuOnly模式下显示 */}
      {renderMode === 'menuOnly' && (
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={menuButtonStyle(theme.palette.mode === 'dark')}
        >
          <MoreVertical size={14} />
        </IconButton>
      )}

      {/* 工具栏模式 - 显示操作按钮 */}
      {renderMode === 'toolbar' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
          {/* 用户消息：Token显示在左侧 */}
          {isUser && (
            <TokenDisplay
              currentMessage={message}
              showCurrentMessage={true}
            />
          )}
          {/* 工具栏按钮组 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            {/* 复制按钮 */}
            <Tooltip title="复制内容">
              <IconButton
                size="small"
                onClick={handleCopyContent}
                sx={toolbarIconButtonStyle}
              >
                <Copy size={16} />
              </IconButton>
            </Tooltip>

          {/* 编辑按钮 */}
          <Tooltip title="编辑">
            <IconButton
              size="small"
              onClick={handleEditClick}
              sx={toolbarIconButtonStyle}
            >
              <Edit size={16} />
            </IconButton>
          </Tooltip>

          {/* 保存按钮 */}
          <Tooltip title="保存内容">
            <IconButton
              size="small"
              onClick={handleSaveContent}
              sx={toolbarIconButtonStyle}
            >
              <Save size={16} />
            </IconButton>
          </Tooltip>

          {/* 导出按钮 */}
          <Tooltip title="导出信息">
            <IconButton
              size="small"
              onClick={handleExportClick}
              sx={toolbarIconButtonStyle}
            >
              <FileText size={16} />
            </IconButton>
          </Tooltip>

          {/* 用户消息：重新发送 */}
          {isUser && (
            <Tooltip title="重新发送">
              <IconButton
                size="small"
                onClick={handleResendClick}
                sx={toolbarIconButtonStyle}
              >
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          )}

          {/* AI消息：重新生成 */}
          {!isUser && (
            <Tooltip title="重新生成">
              <IconButton
                size="small"
                onClick={handleRegenerateClick}
                sx={toolbarIconButtonStyle}
              >
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          )}

          {/* AI消息：语音播放 */}
          {!isUser && enableTTS && (
            <Tooltip title={isPlaying ? "停止播放" : "语音播放"}>
              <IconButton
                size="small"
                onClick={handleTextToSpeech}
                sx={{
                  padding: 0.5,
                  opacity: isPlaying ? 1 : 0.8,
                  color: isPlaying ? theme.palette.primary.main : 'text.primary',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </IconButton>
            </Tooltip>
          )}

          {/* AI消息：版本历史 */}
          {!isUser && hasMultipleVersions && (
            <Tooltip title="版本历史">
              <IconButton
                size="small"
                onClick={(e) => setVersionAnchorEl(e.currentTarget)}
                sx={toolbarIconButtonStyle}
              >
                <History size={16} />
              </IconButton>
            </Tooltip>
          )}

          {/* 分支按钮 */}
          <Tooltip title="创建分支">
            <IconButton
              size="small"
              onClick={handleCreateBranch}
              sx={toolbarIconButtonStyle}
            >
              <GitBranch size={16} />
            </IconButton>
          </Tooltip>

          {/* 删除按钮 */}
          <Tooltip title={deleteButtonClicked ? "再次点击确认删除" : "删除"}>
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              sx={getDeleteButtonStyle(deleteButtonClicked, theme.palette.error.main, customTextColor)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>

          </Box>

          {/* AI消息：Token显示在右侧 */}
          {!isUser && (
            <TokenDisplay
              currentMessage={message}
              showCurrentMessage={true}
            />
          )}
        </Box>
      )}

      {/* 版本切换弹出框 */}
      <Popover
        open={versionPopoverOpen}
        anchorEl={versionAnchorEl}
        onClose={() => setVersionAnchorEl(null)}
        disableAutoFocus={true}
        disableRestoreFocus={true}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            maxWidth: '260px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            mt: 0.5
          }
        }}
      >
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ px: 0.5, py: 0.25, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span>消息版本历史</span>
            <Button
              size="small"
              startIcon={<Plus size={13} />}
              onClick={handleCreateVersion}
              variant="outlined"
              color="primary"
              sx={{ fontSize: '0.7rem', py: 0.1, px: 0.5, minWidth: 'auto', height: '20px' }}
            >
              保存当前
            </Button>
          </Typography>
          {/* 版本数量指示器 */}
          {message.versions && message.versions.length > 5 && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: theme.palette.text.secondary,
                fontSize: '0.7rem',
                mb: 0.5
              }}
            >
              显示 5/{message.versions.length + 1} 个版本，滑动查看更多
            </Typography>
          )}
          <List
            dense
            sx={{
              // 计算最大高度 = 单个项目高度(约28px) * 5 = 140px
              maxHeight: '140px',
              overflow: 'auto',
              py: 0,
              // 添加滚动条样式
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
              }
            }}
          >
            {/* 显示所有历史版本 */}
            {message.versions?.map((version, index) => {
              const isCurrentVersion = message.currentVersionId === version.id;
              const sourceText = getVersionSourceText(version);
              return (
                <ListItem
                  key={version.id}
                  onClick={() => handleSwitchToVersion(version.id)}
                  sx={{
                    borderRadius: '4px',
                    mb: 0.2,
                    py: 0.2,
                    px: 1,
                    backgroundColor: isCurrentVersion
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)')
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)'
                    },
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>{`版本 ${index + 1}${isCurrentVersion ? ' (当前)' : ''}`}</span>
                        {sourceText && (
                          <Chip
                            label={sourceText}
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: '0.6rem',
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                              '& .MuiChip-label': { px: 0.5, py: 0 }
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={formatTime(version.createdAt)}
                    primaryTypographyProps={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.2 }}
                    secondaryTypographyProps={{ fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}
                    sx={{ margin: 0 }}
                  />
                  {!isCurrentVersion && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteVersion(version.id, e)}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        padding: '2px',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 1, backgroundColor: 'rgba(255, 0, 0, 0.1)' },
                        '.MuiListItem-root:hover &': { opacity: 0.5 }
                      }}
                    >
                      <Trash2 size={13} color={theme.palette.error.main} />
                    </IconButton>
                  )}
                </ListItem>
              );
            })}

            {/* 始终显示最新版本（如果不是历史版本） */}
            {message.versions && message.versions.length > 0 && (
              <ListItem
                key="latest"
                onClick={handleSwitchToLatest}
                sx={{
                  borderRadius: '4px',
                  mb: 0.2,
                  py: 0.2,
                  px: 1,
                  backgroundColor: !message.currentVersionId
                    ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)')
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)'
                  },
                  cursor: 'pointer'
                }}
              >
                <ListItemText
                  primary={`版本 ${getTotalVersionCount}${!message.currentVersionId ? ' (当前)' : ''}`}
                  secondary="最新版本"
                  primaryTypographyProps={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.2 }}
                  secondaryTypographyProps={{ fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}
                  sx={{ margin: 0 }}
                />
              </ListItem>
            )}
          </List>
          {/* 滑动提示箭头 - 当有超过5个版本时显示 */}
          {message.versions && message.versions.length > 5 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 0.5,
                opacity: 0.7,
                animation: 'pulse 1.5s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { opacity: 0.3, transform: 'translateY(-1px)' },
                  '50%': { opacity: 0.7, transform: 'translateY(2px)' },
                  '100%': { opacity: 0.3, transform: 'translateY(-1px)' }
                }
              }}
            >
              <span style={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                ︾
              </span>
            </Box>
          )}
        </Box>
      </Popover>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        disableAutoFocus={true}
        disableRestoreFocus={true}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left', // 改为left，避免菜单覆盖主聊天内容
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left', // 改为left，确保菜单从左侧展开
        }}
      >
        <MenuItem onClick={handleCopyContent}>复制内容</MenuItem>
        <MenuItem onClick={handleSaveContent}>保存内容</MenuItem>
        <MenuItem onClick={handleExportClick} sx={{ display: 'flex', alignItems: 'center' }}>
          <FileText size={16} style={{ marginRight: '8px' }} />
          导出信息
        </MenuItem>
        <MenuItem onClick={handleEditClick}>编辑</MenuItem>

        {/* 用户消息特有功能 */}
        {isUser && <MenuItem onClick={handleResendClick}>重新发送</MenuItem>}

        {/* AI消息特有功能 */}
        {!isUser && [
          <MenuItem key="regenerate" onClick={handleRegenerateClick}>重新生成</MenuItem>,
          <MenuItem key="versions" onClick={() => {
            handleMenuClose();
            // 使用消息ID作为DOM元素ID参考
            const messageElement = document.getElementById(`message-${message.id}`);
            setVersionAnchorEl(messageElement || document.body);
          }}>查看历史版本</MenuItem>
        ]}

        {/* 通用功能 */}
        <MenuItem onClick={handleCreateBranch} sx={{ display: 'flex', alignItems: 'center' }}>
          <GitBranch size={16} style={{ marginRight: '8px' }} />
          分支
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>删除</MenuItem>
      </Menu>

      {/* 编辑对话框 */}
      <MessageEditor
        message={message}
        topicId={topicId}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />



      {/* 导出菜单 */}
      <ExportMenu
        message={message}
        anchorEl={exportAnchorEl}
        open={exportMenuOpen}
        onClose={handleExportMenuClose}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键props变化时重新渲染
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.blocks?.length === nextProps.message.blocks?.length &&
    prevProps.message.currentVersionId === nextProps.message.currentVersionId &&
    prevProps.message.versions?.length === nextProps.message.versions?.length &&
    prevProps.topicId === nextProps.topicId &&
    prevProps.messageIndex === nextProps.messageIndex &&
    prevProps.renderMode === nextProps.renderMode
  );
});

export default MessageActions;