import React from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { Edit, Brain } from 'lucide-react';
import type { ChatTopic, Assistant } from '../../shared/types/Assistant';
// 移除不再使用的useAppSelector导入
// import { useAppSelector } from '../shared/store';
// 移除旧的系统提示词选择器，使用默认提示词
// import { selectActiveSystemPrompt } from '../shared/store/slices/systemPromptsSlice';

interface SystemPromptBubbleProps {
  topic: ChatTopic | null;
  assistant: Assistant | null;
  onClick: () => void;
}

/**
 * 系统提示词气泡组件
 * 显示在消息列表顶部，点击可以编辑系统提示词
 * 🚀 优化：使用React.memo避免不必要的重新渲染
 */
const SystemPromptBubbleComponent: React.FC<SystemPromptBubbleProps> = ({ topic, assistant, onClick }) => {
  const theme = useTheme();
  
  // 使用默认提示词替代旧的系统提示词
  const activeSystemPrompt = '';

  // 获取系统提示词 - 实现追加模式显示
  // 逻辑：助手提示词 + 话题提示词追加（如果有的话）
  const getDisplayPrompt = () => {
    let displayPrompt = '';

    if (assistant?.systemPrompt) {
      displayPrompt = assistant.systemPrompt;

      // 只有当话题提示词不为空时才追加显示
      if (topic?.prompt && topic.prompt.trim()) {
        displayPrompt = displayPrompt + '\n\n[追加] ' + topic.prompt;
      }
    } else if (topic?.prompt && topic.prompt.trim()) {
      // 如果助手没有提示词，则单独显示话题提示词（仅当不为空时）
      displayPrompt = topic.prompt;
    } else {
      displayPrompt = activeSystemPrompt || '点击此处编辑系统提示词';
    }

    return displayPrompt;
  };

  const systemPrompt = getDisplayPrompt();

  return (
    <Paper
      elevation={1}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        margin: '0 8px 16px 8px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(30, 30, 30, 0.95)'
          : alpha(theme.palette.background.paper, 0.95), // 使用主题paper颜色并添加95%透明度
        border: `1px solid`,
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
        userSelect: 'none', // 禁止文本选择
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(40, 40, 40, 0.98)'
            : alpha(theme.palette.background.paper, 0.98), // 使用主题paper颜色并添加98%透明度
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(0, 0, 0, 0.25)',
        },
        position: 'relative',
        zIndex: 10
      }}
    >
      <Brain
        size={20}
        style={{
          marginRight: 12,
          color: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.6)'
            : 'rgba(0, 0, 0, 0.6)'
        }}
      />

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Typography
          variant="caption"
          component="div"
          sx={{
            color: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(0, 0, 0, 0.7)',
            fontSize: '12px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {systemPrompt}
        </Typography>
      </Box>

      <Edit
        size={18}
        style={{
          marginLeft: 8,
          color: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(0, 0, 0, 0.5)'
        }}
      />
    </Paper>
  );
};

// 🚀 自定义比较函数，确保提示词变化时能正确更新
const arePropsEqual = (prevProps: SystemPromptBubbleProps, nextProps: SystemPromptBubbleProps) => {
  // 比较话题
  if (prevProps.topic?.id !== nextProps.topic?.id ||
      prevProps.topic?.prompt !== nextProps.topic?.prompt ||
      prevProps.topic?.updatedAt !== nextProps.topic?.updatedAt) {
    return false;
  }

  // 🔥 关键：比较助手的 systemPrompt，确保从设置返回时能正确更新
  if (prevProps.assistant?.id !== nextProps.assistant?.id ||
      prevProps.assistant?.systemPrompt !== nextProps.assistant?.systemPrompt ||
      prevProps.assistant?.updatedAt !== nextProps.assistant?.updatedAt) {
    return false;
  }

  // onClick 函数引用变化不影响显示，但为了安全起见，如果变化也重新渲染
  // 实际上 onClick 通常不会变化，所以这里可以忽略

  return true;
};

// 使用React.memo优化，并添加自定义比较函数
const SystemPromptBubble = React.memo(SystemPromptBubbleComponent, arePropsEqual);

// 设置displayName便于调试
SystemPromptBubble.displayName = 'SystemPromptBubble';

export default SystemPromptBubble;