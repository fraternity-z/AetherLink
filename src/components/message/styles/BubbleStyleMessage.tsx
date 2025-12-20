import React from 'react';
import {
  Box,
  Avatar,
  Paper,
  Typography
} from '@mui/material';
import { User } from 'lucide-react';
import MessageActions from '../MessageActions';
import MessageContent from '../MessageContent';
import type { BaseMessageStyleProps } from '../types/MessageComponent';
import { Z_INDEX } from '../../../shared/constants/zIndex';
import { messageItemStyles, bubbleStyles } from '../../../shared/config/scrollOptimization';

const BubbleStyleMessage: React.FC<BaseMessageStyleProps> = ({
  message,
  showAvatar = true,
  isCompact = false,
  loading,
  modelAvatar,
  assistantAvatar,
  userAvatar,
  showUserAvatar,
  showUserName,
  showModelAvatar,
  showModelName,
  settings,
  themeStyle,
  theme,
  getProviderName,
  messageIndex,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend
}) => {
  const isUserMessage = message.role === 'user';

  // 格式化时间 - 避免重复代码
  const formattedTime = new Date(message.createdAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 获取消息操作显示模式设置
  const messageActionMode = settings?.messageActionMode || 'bubbles';

  // 获取自定义气泡颜色设置
  const customBubbleColors = settings?.customBubbleColors || {};

  // 获取隐藏气泡设置
  const hideUserBubble = settings?.hideUserBubble === true;
  const hideAIBubble = settings?.hideAIBubble === true;
  const shouldHideBubble = isUserMessage ? hideUserBubble : hideAIBubble;

  // 计算实际使用的颜色 - 使用 CSS Variables 作为回退值
  const actualBubbleColor = isUserMessage
    ? (customBubbleColors.userBubbleColor || 'var(--theme-msg-user-bg)')
    : (customBubbleColors.aiBubbleColor || 'var(--theme-msg-ai-bg)');

  const actualTextColor = isUserMessage
    ? (customBubbleColors.userTextColor || 'var(--theme-text-primary)')
    : (customBubbleColors.aiTextColor || 'var(--theme-text-primary)');

  return (
    <Box
      id={`message-${message.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: isCompact ? 2 : 4,
        marginTop: isCompact ? 1 : 2,
        paddingX: 1, // 减少左右间距，让气泡更好地利用空间
        alignItems: isUserMessage ? 'flex-end' : 'flex-start',
        // 🚀 使用统一的消息项优化配置
        ...messageItemStyles,
      }}
    >
      {/* 头像和模型信息 - 根据样式和设置控制显示 */}
      {showAvatar && (showUserAvatar || showUserName || showModelAvatar || showModelName) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginBottom: 1,
            flexShrink: 0,
          }}
        >
          {/* 用户消息显示"用户"文字和时间，右侧显示头像 */}
          {isUserMessage ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexDirection: 'row-reverse' }}>
              {/* 用户头像 - 根据设置控制显示 */}
              {showUserAvatar && (
                userAvatar ? (
                  <Avatar
                    src={userAvatar}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '25%',
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      bgcolor: 'var(--theme-btn-secondary-bg)',
                      width: 24,
                      height: 24,
                      borderRadius: '25%',
                    }}
                  >
                    <User size={16} color="white" />
                  </Avatar>
                )
              )}

              {/* 用户名称和时间 - 根据设置控制名称显示 */}
              {(showUserName || !showUserAvatar) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {/* 用户名称 - 根据设置控制显示 */}
                  {showUserName && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.85rem',
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        lineHeight: 1.2
                      }}
                    >
                      用户
                    </Typography>
                  )}
                  {/* 时间显示 - 当头像或名称被隐藏时仍然显示时间 */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      color: theme.palette.text.primary,
                      lineHeight: 1,
                      marginTop: showUserName ? '2px' : '0'
                    }}
                  >
                    {formattedTime}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            // AI消息显示头像和模型信息
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {/* 助手/模型头像 - 根据设置控制显示，优先使用助手头像 */}
              {showModelAvatar && (
                (assistantAvatar || modelAvatar) ? (
                  <Avatar
                    src={(assistantAvatar || modelAvatar) || undefined}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '25%',
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      bgcolor: 'secondary.main',
                      width: 24,
                      height: 24,
                      borderRadius: '25%',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    {message.model?.name
                      ? message.model.name.charAt(0).toUpperCase()
                      : (message.modelId
                          ? message.modelId.charAt(0).toUpperCase()
                          : 'AI')}
                  </Avatar>
                )
              )}

              {/* 模型名称和供应商名称 - 根据设置控制名称显示 */}
              {(showModelName || !showModelAvatar) && (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {/* 模型名称 - 根据设置控制显示 */}
                  {showModelName && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.85rem',
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        lineHeight: 1.2
                      }}
                    >
                      {/* 模型名 + 供应商名称 */}
                      {message.model ?
                        `${message.model.name}${message.model.provider ? ' | ' + getProviderName(message.model.provider) : ''}`
                        : (message.modelId || 'AI')}
                    </Typography>
                  )}
                  {/* 时间显示 - 当头像或名称被隐藏时仍然显示时间 */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      color: theme.palette.text.primary,
                      lineHeight: 1,
                      marginTop: showModelName ? '2px' : '0'
                    }}
                  >
                    {formattedTime}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      <Box sx={{
        position: 'relative',
        maxWidth: isUserMessage
          ? `${settings?.userMessageMaxWidth || 80}%`
          : `${settings?.messageBubbleMaxWidth || 100}%`, // 更新默认值为100%
        minWidth: `${settings?.messageBubbleMinWidth || 50}%`,
        width: 'auto',
        alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
        flex: 'none',
        overflow: messageActionMode === 'toolbar' ? 'visible' : undefined, // 工具栏模式下允许溢出
      }}>
        {/* 消息内容容器 */}
        <Paper
          elevation={0}
          data-theme-style={themeStyle}
          sx={{
            // 🚀 使用统一的气泡优化配置（包含position: 'relative'）
            ...bubbleStyles,
            // 优化内边距：为三点菜单留出合适空间
            paddingTop: 1.5,
            paddingBottom: 1.5,
            paddingLeft: 1.5,
            paddingRight: messageActionMode === 'bubbles' ? 3 : 1.5, // 气泡模式下为三点菜单留出空间
            backgroundColor: shouldHideBubble ? 'transparent' : actualBubbleColor,
            color: actualTextColor,
            width: '100%',
            border: 'none',
            maxWidth: '100%',
            overflow: messageActionMode === 'toolbar' ? 'visible' : undefined, // 工具栏模式下允许溢出
            // 隐藏气泡时覆盖样式
            ...(shouldHideBubble && {
              boxShadow: 'none',
              borderRadius: 0,
            }),
            // 🚀 添加性能优化CSS，减少重排重绘
            contain: messageActionMode === 'toolbar' ? 'layout style' : 'layout style paint', // 工具栏模式下不限制 paint，允许溢出
            willChange: message.status === 'streaming' ? 'contents' : 'auto',
            transform: 'translateZ(0)', // 启用硬件加速
          }}
        >
          <Box sx={{ width: '100%' }}>
            {/* 🚀 使用独立的 memo MessageContent 组件优化渲染 */}
            <MessageContent
              message={message}
              loading={loading}
              extraPaddingLeft={0}
              extraPaddingRight={0}
            />

              {/* 工具栏模式 - 在气泡内部底部显示工具栏 */}
              {messageActionMode === 'toolbar' && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: isUserMessage ? 'flex-end' : 'flex-start', // 用户消息右对齐，AI消息左对齐
                  alignItems: 'center',
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  opacity: 0.8,
                  overflow: 'visible', // 允许 token 显示溢出
                  '&:hover': {
                    opacity: 1,
                  }
                }}>
                  <MessageActions
                    message={message as any}
                    topicId={message.topicId}
                    messageIndex={messageIndex}
                    onRegenerate={onRegenerate}
                    onDelete={onDelete}
                    onSwitchVersion={onSwitchVersion}
                    onResend={onResend}
                    renderMode="toolbar"
                    customTextColor={actualTextColor}
                  />
                </Box>
              )}
            </Box>
          </Paper>

          {/* 根据设置显示不同的操作模式 */}
          {messageActionMode === 'bubbles' && (
            <>
              {/* 版本指示器和播放按钮 - 放在气泡上方贴合位置（对所有消息显示） */}
              {settings?.showMicroBubbles !== false && (
                <Box sx={{
                  position: 'absolute',
                  top: -22,
                  right: isUserMessage ? 0 : 0,
                  left: isUserMessage ? 0 : 'auto',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: isUserMessage ? 'flex-start' : 'flex-end',
                  gap: '5px',
                  zIndex: Z_INDEX.MESSAGE.BUBBLE_INDICATORS, // 降低z-index，确保不会覆盖三点菜单
                  pointerEvents: 'auto',
                }}>
                  <MessageActions
                    message={message as any}
                    topicId={message.topicId}
                    messageIndex={messageIndex}
                    onRegenerate={onRegenerate}
                    onDelete={onDelete}
                    onSwitchVersion={onSwitchVersion}
                    onResend={onResend}
                    renderMode="full"
                    customTextColor={actualTextColor}
                  />
                </Box>
              )}

              {/* 三点菜单按钮 - 对所有消息显示，放置在气泡内的右上角 */}
            <Box sx={{
              position: 'absolute',
              top: 5,
              right: 5,
              display: 'flex',
              flexDirection: 'row',
              zIndex: Z_INDEX.MESSAGE.BUBBLE_MENU_BUTTON, // 提高z-index，确保三点菜单在最上层
              pointerEvents: 'auto',
            }}>
              <MessageActions
                message={message as any}
                topicId={message.topicId}
                messageIndex={messageIndex}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
                onSwitchVersion={onSwitchVersion}
                onResend={onResend}
                renderMode="menuOnly"
                customTextColor={actualTextColor}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

// 🚀 使用React.memo优化重新渲染
export default React.memo(BubbleStyleMessage, (prevProps, nextProps) => {
  // 基础属性比较
  if (
    prevProps.message.id !== nextProps.message.id ||
    prevProps.message.updatedAt !== nextProps.message.updatedAt ||
    prevProps.message.status !== nextProps.message.status ||
    prevProps.message.currentVersionId !== nextProps.message.currentVersionId ||
    prevProps.message.versions?.length !== nextProps.message.versions?.length ||
    prevProps.loading !== nextProps.loading ||
    prevProps.showAvatar !== nextProps.showAvatar ||
    prevProps.isCompact !== nextProps.isCompact ||
    prevProps.showUserAvatar !== nextProps.showUserAvatar ||
    prevProps.showUserName !== nextProps.showUserName ||
    prevProps.showModelAvatar !== nextProps.showModelAvatar ||
    prevProps.showModelName !== nextProps.showModelName ||
    prevProps.themeStyle !== nextProps.themeStyle ||
    // 🔥 关键修复：添加头像变化的比较
    prevProps.userAvatar !== nextProps.userAvatar ||
    prevProps.assistantAvatar !== nextProps.assistantAvatar ||
    prevProps.modelAvatar !== nextProps.modelAvatar
  ) {
    return false;
  }

  // 消息块比较 - blocks 是字符串数组（block IDs）
  const prevBlocks = prevProps.message.blocks;
  const nextBlocks = nextProps.message.blocks;
  if (prevBlocks?.length !== nextBlocks?.length) {
    return false;
  }
  if (prevBlocks && nextBlocks) {
    for (let i = 0; i < prevBlocks.length; i++) {
      if (prevBlocks[i] !== nextBlocks[i]) {
        return false;
      }
    }
  }

  return true;
});
