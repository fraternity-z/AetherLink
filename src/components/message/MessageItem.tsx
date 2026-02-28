import React from 'react';
import type { MessageItemProps } from './types/MessageComponent';
import type { MessageVersion } from '../../shared/types/newMessage';
import { useMessageData } from './hooks/useMessageData';
import { useMessageBlocks } from './hooks/useMessageBlocks';
import BubbleStyleMessage from './styles/BubbleStyleMessage';
import MinimalStyleMessage from './styles/MinimalStyleMessage';

const areArraysEqual = <T,>(a?: T[], b?: T[]): boolean => {
  if (a === b) return true;
  const arrayA = a ?? [];
  const arrayB = b ?? [];
  if (arrayA.length !== arrayB.length) return false;
  for (let i = 0; i < arrayA.length; i += 1) {
    if (arrayA[i] !== arrayB[i]) return false;
  }
  return true;
};

const areVersionsEqual = (a?: MessageVersion[], b?: MessageVersion[]): boolean => {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  // 比较版本ID而不是整个对象
  for (let i = 0; i < a.length; i += 1) {
    if (a[i]?.id !== b[i]?.id || a[i]?.createdAt !== b[i]?.createdAt) {
      return false;
    }
  }
  return true;
};

const MessageItem: React.FC<MessageItemProps> = React.memo(({
  message,
  showAvatar = true,
  isCompact = false,
  messageIndex,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend,
  forceUpdate
}) => {
  // 使用自定义hooks获取消息数据
  const messageData = useMessageData(message);
  const { loading } = useMessageBlocks(message, messageData.blocks, forceUpdate);

  // 🚀 使用useMemo缓存styleProps
  // 依赖项与 memo 比较函数保持一致，只依赖会触发重渲染的属性
  const styleProps = React.useMemo(() => ({
    message,
    showAvatar,
    isCompact,
    loading,
    modelAvatar: messageData.modelAvatar,
    assistantAvatar: messageData.assistantAvatar,
    userAvatar: messageData.userAvatar,
    showUserAvatar: messageData.showUserAvatar,
    showUserName: messageData.showUserName,
    showModelAvatar: messageData.showModelAvatar,
    showModelName: messageData.showModelName,
    showMessageDivider: messageData.showMessageDivider,
    settings: messageData.settings,
    themeStyle: messageData.themeStyle,
    theme: messageData.theme,
    getProviderName: messageData.getProviderName,
    messageIndex,
    onRegenerate,
    onDelete,
    onSwitchVersion,
    onResend
  }), [
    // ✅ 与 memo 比较函数保持一致：依赖 message 的具体属性而非整个对象
    message.id,
    message.updatedAt,
    message.status,
    message.currentVersionId,
    message.blocks,
    message.versions,
    // 其他 props
    showAvatar,
    isCompact,
    loading,
    messageData.modelAvatar,
    messageData.assistantAvatar,
    messageData.userAvatar,
    messageData.showUserAvatar,
    messageData.showUserName,
    messageData.showModelAvatar,
    messageData.showModelName,
    messageData.showMessageDivider,
    messageData.settings,
    messageData.themeStyle,
    messageData.theme,
    messageData.getProviderName,
    messageIndex,
    onRegenerate,
    onDelete,
    onSwitchVersion,
    onResend
  ]);

  // 根据样式设置选择对应的组件
  if (messageData.isBubbleStyle) {
    return <BubbleStyleMessage {...styleProps} />;
  }
  return <MinimalStyleMessage {...styleProps} />;
}, (prevProps, nextProps) => {
  // 🚀 自定义比较函数，只有关键属性变化时才重新渲染
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.updatedAt === nextProps.message.updatedAt &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.currentVersionId === nextProps.message.currentVersionId &&
    // ✅ 比较版本内容而不仅仅是长度
    areVersionsEqual(prevProps.message.versions, nextProps.message.versions) &&
    areArraysEqual(prevProps.message.blocks, nextProps.message.blocks) &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.messageIndex === nextProps.messageIndex &&
    prevProps.forceUpdate === nextProps.forceUpdate &&
    // ✅ 比较回调函数引用（假设父组件使用了 useCallback）
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onSwitchVersion === nextProps.onSwitchVersion &&
    prevProps.onResend === nextProps.onResend
  );
});

// 🚀 设置displayName便于调试
MessageItem.displayName = 'MessageItem';

export default MessageItem;
