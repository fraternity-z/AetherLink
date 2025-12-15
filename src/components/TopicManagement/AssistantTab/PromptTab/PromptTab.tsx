import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Sparkles } from 'lucide-react';

// 样式常量
const styles = {
  glassomorphism: (theme: any) => ({
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.2)'}`
  }),

  primaryButton: (theme: any) => ({
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    fontSize: '0.75rem',
    textTransform: 'none' as const,
    backdropFilter: 'blur(10px)',
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
    '&:hover': {
      borderColor: theme.palette.primary.light,
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)'
    }
  })
};

export interface PromptTabProps {
  assistantPrompt: string;
  onPromptChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPromptSelectorClick: () => void;
}

/**
 * 提示词 Tab 组件
 * 包含系统提示词编辑和预设选择
 */
const PromptTab: React.FC<PromptTabProps> = ({
  assistantPrompt,
  onPromptChange,
  onPromptSelectorClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 提示词标题 */}
      <Typography 
        variant="subtitle2" 
        sx={{
          mb: 1,
          color: theme.palette.text.secondary,
          fontSize: isMobile ? '1rem' : '0.875rem'
        }}
      >
        系统提示词
      </Typography>

      {/* 提示词编辑区域 */}
      <Paper sx={{
        ...styles.glassomorphism(theme),
        borderRadius: '12px',
        p: isMobile ? 2 : 1.5,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <TextField
          multiline
          fullWidth
          variant="standard"
          value={assistantPrompt}
          onChange={onPromptChange}
          placeholder="请输入系统提示词，定义助手的角色和行为特征...

示例：
你是一个友好、专业、乐于助人的AI助手。你会以客观、准确的态度回答用户的问题，并在不确定的情况下坦诚表明。你可以协助用户完成各种任务，提供信息，或进行有意义的对话。"
          sx={{
            flex: 1,
            '& .MuiInput-root': {
              color: theme.palette.text.primary,
              fontSize: isMobile ? '16px' : '0.875rem',
              height: '100%',
              alignItems: 'flex-start',
              '&:before': {
                display: 'none'
              },
              '&:after': {
                display: 'none'
              }
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
              fontSize: isMobile ? '16px' : '0.875rem',
              height: '100% !important',
              overflow: 'auto !important',
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.7
              }
            }
          }}
        />

        {/* 功能按钮 */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          mt: 2,
          pt: 2,
          borderTop: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)'}`
        }}>
          <Button
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            startIcon={<Sparkles size={isMobile ? 20 : 16} />}
            onClick={onPromptSelectorClick}
            sx={{
              ...styles.primaryButton(theme),
              fontSize: isMobile ? '14px' : '12px',
              py: isMobile ? 1 : 0.5,
              borderRadius: '8px'
            }}
          >
            选择预设提示词
          </Button>
        </Box>
      </Paper>

      {/* 提示信息 */}
      <Typography 
        variant="caption" 
        sx={{ 
          mt: 1.5, 
          color: theme.palette.text.disabled,
          fontSize: '0.75rem'
        }}
      >
        提示词将作为系统消息发送给 AI，定义助手的角色和行为
      </Typography>
    </Box>
  );
};

export default PromptTab;
