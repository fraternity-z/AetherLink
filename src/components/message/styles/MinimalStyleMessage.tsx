import React from 'react';
import {
  Box,
  Avatar,
  Typography
} from '@mui/material';

import MessageActions from '../MessageActions';
import MessageContent from '../MessageContent';
import type { BaseMessageStyleProps } from '../types/MessageComponent';
import { messageItemStyles } from '../../../shared/config/scrollOptimization';

const MinimalStyleMessage: React.FC<BaseMessageStyleProps> = ({
  message,
  loading,
  modelAvatar,
  assistantAvatar,
  userAvatar,
  showUserAvatar,
  showUserName,
  showModelAvatar,
  showModelName,
  showMessageDivider,
  theme,
  messageIndex,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend
}) => {
  const isUserMessage = message.role === 'user';

  return (
    <Box
      id={`message-${message.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 1.5, // 修复：添加底部间距，防止输入框遮挡
        paddingX: 2,
        paddingY: 1.5,
        alignItems: 'flex-start',
        gap: 0,
        backgroundColor: 'transparent',
        borderBottom: showMessageDivider ? '1px solid' : 'none',
        borderColor: showMessageDivider
          ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')
          : 'transparent',
        // 🚀 使用统一的消息项优化配置
        ...messageItemStyles,
      }}
    >
      {/* 头像 - 根据设置控制显示 */}
      {((isUserMessage && showUserAvatar) || (!isUserMessage && showModelAvatar)) && (
        <Avatar
          sx={{
            width: 24,
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 600,
            background: isUserMessage
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            flexShrink: 0,
            marginRight: 1,
          }}
        >
          {isUserMessage ? (
            userAvatar ? (
              <img src={userAvatar} alt="用户头像" style={{ width: '100%', height: '100%', borderRadius: '25%' }} />
            ) : (
              '👤'
            )
          ) : (
            (assistantAvatar || modelAvatar) ? (
              <img src={(assistantAvatar || modelAvatar) || undefined} alt="AI头像" style={{ width: '100%', height: '100%', borderRadius: '25%' }} />
            ) : (
              '🤖'
            )
          )}
        </Avatar>
      )}

      {/* 内容区域 - 简洁样式 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* 名称和时间行 - 根据设置控制显示 */}
        {((isUserMessage && showUserName) || (!isUserMessage && showModelName)) && (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.25 }}>
            {/* 名称显示 - 根据设置控制 */}
            {((isUserMessage && showUserName) || (!isUserMessage && showModelName)) && (
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>
                {isUserMessage ? '用户' : (message.model?.name || 'AI')}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.7rem' }}>
              {new Date(message.createdAt).toLocaleString('zh-CN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        )}

        {/* 消息内容 - 使用独立的 memo MessageContent 组件优化渲染 */}
        <Box sx={{ position: 'relative' }}>
          <MessageContent
            message={message}
            loading={loading}
            extraPaddingLeft={0}
            extraPaddingRight={0}
          />

          {/* 底部工具栏 - 简洁样式，显示操作按钮 */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            mt: 0.5,
            pt: 0.25,
            opacity: 0.7,
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
              renderMode="toolbar" // 工具栏模式，显示所有操作按钮
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// 🚀 使用React.memo优化重新渲染
export default React.memo(MinimalStyleMessage, (prevProps, nextProps) => {
  const versionCountEqual =
    (prevProps.message.versions?.length ?? 0) === (nextProps.message.versions?.length ?? 0);

  const blocksEqual = (() => {
    const prevBlocks = prevProps.message.blocks ?? [];
    const nextBlocks = nextProps.message.blocks ?? [];
    if (prevBlocks.length !== nextBlocks.length) {
      return false;
    }
    for (let i = 0; i < prevBlocks.length; i += 1) {
      if (prevBlocks[i] !== nextBlocks[i]) {
        return false;
      }
    }
    return true;
  })();

  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.updatedAt === nextProps.message.updatedAt &&
    prevProps.message.status === nextProps.message.status && // 🔥 关键！流式输出状态变化
    prevProps.message.currentVersionId === nextProps.message.currentVersionId && // 🔥 版本切换需要重新渲染
    versionCountEqual && // 🔥 版本数量变化
    blocksEqual && // 🔥 消息块变化
    prevProps.loading === nextProps.loading &&
    prevProps.showUserAvatar === nextProps.showUserAvatar &&
    prevProps.showUserName === nextProps.showUserName &&
    prevProps.showModelAvatar === nextProps.showModelAvatar &&
    prevProps.showModelName === nextProps.showModelName &&
    prevProps.showMessageDivider === nextProps.showMessageDivider &&
    // 🔥 关键修复：添加头像变化的比较
    prevProps.userAvatar === nextProps.userAvatar &&
    prevProps.assistantAvatar === nextProps.assistantAvatar &&
    prevProps.modelAvatar === nextProps.modelAvatar
  );
});
