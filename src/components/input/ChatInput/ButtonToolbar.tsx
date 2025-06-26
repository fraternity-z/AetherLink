import React from 'react';
import { IconButton, CircularProgress, Badge, Tooltip } from '@mui/material';
import { Send, Plus, Square, Keyboard, Mic, ChevronDown, ChevronUp, Image, Search } from 'lucide-react';
import type { ImageContent, FileContent } from '../../../shared/types';

interface ButtonToolbarProps {
  // 状态
  voiceState: 'normal' | 'voice-mode' | 'recording';
  shouldHideVoiceButton: boolean;
  showExpandButton: boolean;
  expanded: boolean;
  
  // 样式相关
  isDarkMode: boolean;
  iconColor: string;
  disabledColor: string;
  isTablet: boolean;

  // 功能状态
  uploadingMedia: boolean;
  isLoading: boolean;
  allowConsecutiveMessages: boolean;
  isStreaming: boolean;
  imageGenerationMode: boolean;
  webSearchActive: boolean;
  
  // 数据
  images: ImageContent[];
  files: FileContent[];
  canSendMessage: () => boolean;
  
  // 回调函数
  handleToggleVoiceMode: () => void;
  handleExpandToggle: () => void;
  handleOpenUploadMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleSubmit: () => void;
  onStopResponse?: () => void;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  voiceState,
  shouldHideVoiceButton,
  showExpandButton,
  expanded,
  isDarkMode,
  iconColor,
  disabledColor,
  isTablet,
  uploadingMedia,
  isLoading,
  allowConsecutiveMessages,
  isStreaming,
  imageGenerationMode,
  webSearchActive,
  images,
  files,
  canSendMessage,
  handleToggleVoiceMode,
  handleExpandToggle,
  handleOpenUploadMenu,
  handleSubmit,
  onStopResponse
}) => {
  // 显示正在加载的指示器，但不禁用输入框
  const showLoadingIndicator = isLoading && !allowConsecutiveMessages;

  return (
    <>
      {/* 展开/收起按钮 - 显示在输入框容器右上角 */}
      {showExpandButton && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          zIndex: 10
        }}>
          <Tooltip title={expanded ? "收起输入框" : "展开输入框"}>
            <IconButton
              onClick={handleExpandToggle}
              size="small"
              style={{
                color: expanded ? '#2196F3' : iconColor,
                padding: '2px',
                width: '20px',
                height: '20px',
                minWidth: '20px',
                backgroundColor: isDarkMode
                  ? 'rgba(42, 42, 42, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              {expanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronUp size={14} />
              )}
            </IconButton>
          </Tooltip>
        </div>
      )}

      {/* 语音识别按钮 - 根据状态显示不同图标，当文本超过3行时隐藏 */}
      {!shouldHideVoiceButton && (
        <Tooltip title={voiceState === 'normal' ? "切换到语音输入模式" : "退出语音输入模式"}>
          <span>
            <IconButton
              onClick={handleToggleVoiceMode}
              disabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
              size={isTablet ? "large" : "medium"}
              style={{
                color: voiceState !== 'normal' ? '#f44336' : (isDarkMode ? '#ffffff' : '#000000'),
                padding: isTablet ? '10px' : '8px',
                backgroundColor: voiceState !== 'normal' ? 'rgba(211, 47, 47, 0.15)' : 'transparent',
                transition: 'all 0.25s ease-in-out'
              }}
            >
              {voiceState === 'normal' ? (
                <Mic size={isTablet ? 28 : 24} />
              ) : (
                <Keyboard size={isTablet ? 28 : 24} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* 在非录音状态下显示其他按钮 */}
      {voiceState !== 'recording' && (
        <>
          {/* 添加按钮，打开上传菜单 */}
          <Tooltip title="添加图片或文件">
            <span>
              <IconButton
                size={isTablet ? "large" : "medium"}
                onClick={handleOpenUploadMenu}
                disabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
                style={{
                  color: uploadingMedia ? disabledColor : (isDarkMode ? '#ffffff' : '#000000'),
                  padding: isTablet ? '10px' : '8px',
                  position: 'relative',
                  marginRight: isTablet ? '4px' : '0'
                }}
              >
                {uploadingMedia ? (
                  <CircularProgress size={isTablet ? 28 : 24} />
                ) : (
                  <Badge badgeContent={images.length + files.length} color="primary" max={9} invisible={images.length + files.length === 0}>
                    <Plus size={isTablet ? 28 : 24} />
                  </Badge>
                )}
              </IconButton>
            </span>
          </Tooltip>

          {/* 发送按钮或停止按钮 */}
          <Tooltip
            title={
              isStreaming ? "停止生成" :
              imageGenerationMode ? "生成图像" :
              webSearchActive ? "搜索网络" :
              "发送消息"
            }
          >
            <span>
              <IconButton
                onClick={isStreaming && onStopResponse ? onStopResponse : handleSubmit}
                disabled={!isStreaming && (!canSendMessage() || (isLoading && !allowConsecutiveMessages))}
                size={isTablet ? "large" : "medium"}
                style={{
                  color: isStreaming ? '#ff4d4f' : !canSendMessage() || (isLoading && !allowConsecutiveMessages) ? disabledColor : imageGenerationMode ? '#9C27B0' : webSearchActive ? '#3b82f6' : isDarkMode ? '#4CAF50' : '#09bb07',
                  padding: isTablet ? '10px' : '8px'
                }}
              >
                {isStreaming ? (
                  <Square size={isTablet ? 20 : 18} />
                ) : showLoadingIndicator ? (
                  <CircularProgress size={isTablet ? 28 : 24} color="inherit" />
                ) : imageGenerationMode ? (
                  <Image size={isTablet ? 20 : 18} />
                ) : webSearchActive ? (
                  <Search size={isTablet ? 20 : 18} />
                ) : (
                  <Send size={isTablet ? 20 : 18} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </>
      )}
    </>
  );
};

export default ButtonToolbar;
