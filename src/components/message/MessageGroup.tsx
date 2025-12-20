import React, { useMemo, useEffect, useState } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronDown as ExpandMoreIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';
import MessageItem from './MessageItem';
import MultiModelMessageGroup from './MultiModelMessageGroup';
import ConversationDivider from './ConversationDivider';
import type { Message } from '../../shared/types/newMessage';
import { getMessageDividerSetting, shouldShowConversationDivider } from '../../shared/utils/settingsUtils';

/**
 * 将消息按 askId 分组，识别多模型响应
 * 返回一个数组，每个元素是：
 * - 单条消息（普通消息）
 * - 多模型分组对象 { userMessage, assistantMessages }
 */
interface MultiModelGroup {
  type: 'multi-model';
  userMessage: Message;
  assistantMessages: Message[];
}

type MessageOrGroup = Message | MultiModelGroup;

const groupMessagesByAskId = (messages: Message[]): MessageOrGroup[] => {
  const result: MessageOrGroup[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // 如果已处理过，跳过
    if (processedIds.has(message.id)) continue;

    // 检查是否是用户消息且有 mentions（多模型发送）
    if (message.role === 'user' && message.mentions && message.mentions.length > 0) {
      // 查找所有共享同一个 askId 的助手消息
      const assistantMessages = messages.filter(
        m => m.role === 'assistant' && m.askId === message.id
      );

      if (assistantMessages.length > 1) {
        // 多模型分组
        result.push({
          type: 'multi-model',
          userMessage: message,
          assistantMessages
        });

        // 标记所有相关消息为已处理
        processedIds.add(message.id);
        assistantMessages.forEach(m => processedIds.add(m.id));
        continue;
      }
    }

    // 检查是否是助手消息且属于多模型分组（已被上面处理）
    if (message.role === 'assistant' && message.askId) {
      const userMessage = messages.find(m => m.id === message.askId);
      if (userMessage?.mentions && userMessage.mentions.length > 0) {
        // 这条消息属于多模型分组，跳过（会在用户消息处理时一起处理）
        continue;
      }
    }

    // 普通消息
    result.push(message);
    processedIds.add(message.id);
  }

  return result;
};

const isMultiModelGroup = (item: MessageOrGroup): item is MultiModelGroup => {
  return (item as MultiModelGroup).type === 'multi-model';
};

interface MessageGroupProps {
  date: string;
  messages: Message[];
  expanded?: boolean;
  onToggleExpand?: () => void;
  startIndex?: number; // 当前组在全局消息列表中的起始索引
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onSwitchVersion?: (versionId: string) => void;
  onResend?: (messageId: string) => void;
}

/**
 * 消息分组组件
 * 按日期对消息进行分组显示
 */
const MessageGroup: React.FC<MessageGroupProps> = ({
  date,
  messages,
  expanded = true,
  onToggleExpand,
  startIndex = 0,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // 从Redux获取设置
  const messageGrouping = useSelector((state: RootState) =>
    (state.settings as any).messageGrouping || 'byDate'
  );

  // 获取消息分割线设置
  const [showMessageDivider, setShowMessageDivider] = useState<boolean>(true);

  useEffect(() => {
    const fetchMessageDividerSetting = () => {
      try {
        const dividerSetting = getMessageDividerSetting();
        setShowMessageDivider(dividerSetting);
      } catch (error) {
        console.error('获取消息分割线设置失败:', error);
      }
    };

    fetchMessageDividerSetting();

    // 监听 localStorage 变化，实时更新设置
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appSettings') {
        fetchMessageDividerSetting();
      }
    };

    // 使用自定义事件监听设置变化（用于同一页面内的变化）
    const handleCustomSettingChange = () => {
      fetchMessageDividerSetting();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('appSettingsChanged', handleCustomSettingChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appSettingsChanged', handleCustomSettingChange);
    };
  }, []);

  // 格式化日期
  const formattedDate = useMemo(() => {
    try {
      const dateObj = new Date(date);
      return format(dateObj, 'yyyy年MM月dd日 EEEE', { locale: zhCN });
    } catch (error) {
      return date;
    }
  }, [date]);

  // 将消息按 askId 分组，识别多模型响应
  const groupedMessages = useMemo(() => groupMessagesByAskId(messages), [messages]);

  // 渲染单条消息或多模型分组
  const renderMessageOrGroup = (item: MessageOrGroup, index: number) => {
    if (isMultiModelGroup(item)) {
      // 渲染多模型分组
      return (
        <MultiModelMessageGroup
          key={`multi-${item.userMessage.id}`}
          userMessage={item.userMessage}
          assistantMessages={item.assistantMessages}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
          onSwitchVersion={onSwitchVersion}
          onResend={onResend}
        />
      );
    } else {
      // 渲染普通消息
      return (
        <React.Fragment key={item.id}>
          <MessageItem
            message={item}
            messageIndex={startIndex + index}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onSwitchVersion={onSwitchVersion}
            onResend={onResend}
          />
          {/* 在对话轮次结束后显示分割线 */}
          {shouldShowConversationDivider(messages, index) && (
            <ConversationDivider show={showMessageDivider} style="subtle" />
          )}
        </React.Fragment>
      );
    }
  };

  // 如果禁用了消息分组，直接渲染消息列表
  if (messageGrouping === 'disabled') {
    return (
      <Box>
        {groupedMessages.map((item, index) => renderMessageOrGroup(item, index))}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* 日期标题 */}
      <DateHeader
        onClick={onToggleExpand}
        sx={{
          cursor: onToggleExpand ? 'pointer' : 'default',
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography variant="body2" color="text.primary">
          {formattedDate}
        </Typography>

        {onToggleExpand && (
          <ExpandMoreIcon
            size={20}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              color: '#757575'
            }}
          />
        )}
      </DateHeader>

      {/* 消息列表 */}
      {expanded && (
        <Box>
          {groupedMessages.map((item, index) => renderMessageOrGroup(item, index))}
        </Box>
      )}
    </Box>
  );
};

// 样式化组件
const DateHeader = styled(Paper)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
}));

export default React.memo(MessageGroup);
