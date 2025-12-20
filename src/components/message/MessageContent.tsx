/**
 * MessageContent - 消息内容渲染组件
 * 
 * 独立的 memo 组件，负责渲染消息的实际内容
 * 参考 cherry-studio 的设计模式，通过独立 memo 减少不必要的重渲染
 */
import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import MessageBlockRenderer from './MessageBlockRenderer';
import type { Message } from '../../shared/types/newMessage';

interface MessageContentProps {
  /** 消息对象 */
  message: Message;
  /** 是否正在加载 */
  loading?: boolean;
  /** 额外的左侧内边距 */
  extraPaddingLeft?: number;
  /** 额外的右侧内边距 */
  extraPaddingRight?: number;
}

/**
 * 消息内容组件
 * 负责渲染消息块或回退到纯文本内容
 */
const MessageContent: React.FC<MessageContentProps> = ({
  message,
  loading = false,
  extraPaddingLeft = 0,
  extraPaddingRight = 0
}) => {
  // 加载状态显示骨架屏
  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </Box>
    );
  }

  // 有消息块时使用 MessageBlockRenderer
  if (message.blocks && message.blocks.length > 0) {
    return (
      <MessageBlockRenderer
        blocks={message.blocks}
        message={message}
        extraPaddingLeft={extraPaddingLeft}
        extraPaddingRight={extraPaddingRight}
      />
    );
  }

  // 回退到纯文本内容
  return (
    <Typography
      variant="body2"
      sx={{
        lineHeight: 1.6,
        wordBreak: 'break-word'
      }}
    >
      {(message as any).content || ''}
    </Typography>
  );
};

// 使用 React.memo 优化，只在关键属性变化时重渲染
export default React.memo(MessageContent, (prevProps, nextProps) => {
  // 消息 ID 变化
  if (prevProps.message.id !== nextProps.message.id) return false;
  
  // 消息更新时间变化
  if (prevProps.message.updatedAt !== nextProps.message.updatedAt) return false;
  
  // 消息状态变化（流式输出等）
  if (prevProps.message.status !== nextProps.message.status) return false;
  
  // 加载状态变化
  if (prevProps.loading !== nextProps.loading) return false;
  
  // padding 变化
  if (prevProps.extraPaddingLeft !== nextProps.extraPaddingLeft) return false;
  if (prevProps.extraPaddingRight !== nextProps.extraPaddingRight) return false;
  
  // 消息块数组变化
  const prevBlocks = prevProps.message.blocks;
  const nextBlocks = nextProps.message.blocks;
  
  if (prevBlocks?.length !== nextBlocks?.length) return false;
  
  if (prevBlocks && nextBlocks) {
    for (let i = 0; i < prevBlocks.length; i++) {
      if (prevBlocks[i] !== nextBlocks[i]) return false;
    }
  }
  
  return true;
});
