import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Paper,
  Tabs,
  Tab,
  useTheme,
  type Theme
} from '@mui/material';
import { ChevronLeft, User, Sparkles } from 'lucide-react';

// 样式常量
const styles = {
  glassomorphism: (theme: Theme) => ({
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.2)'}`
  }),

  dialogPaper: (theme: Theme) => ({
    height: '80vh',
    borderRadius: '16px',
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(18, 18, 18, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    border: theme.palette.mode === 'dark'
      ? '1px solid rgba(255, 255, 255, 0.1)'
      : '1px solid rgba(0, 0, 0, 0.1)',
    color: theme.palette.text.primary,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.4)'
      : '0 8px 32px rgba(0, 0, 0, 0.15)'
  }),

  dialogBackdrop: {
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },

  inputField: (theme: Theme) => ({
    '& .MuiOutlinedInput-root': {
      ...styles.glassomorphism(theme),
      borderRadius: '8px',
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(0, 0, 0, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(0, 0, 0, 0.3)',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      }
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      fontSize: '0.875rem'
    }
  }),

  avatarContainer: (theme: Theme) => ({
    position: 'relative' as const,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
      : 'linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)`
      : `0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)`,
  }),

  primaryButton: (theme: Theme) => ({
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

// 组件属性接口
export interface EditAssistantDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  assistantName: string;
  assistantPrompt: string;
  assistantAvatar: string;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPromptChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
  onPromptSelectorClick: () => void;
}

/**
 * 编辑助手对话框组件 - 纯UI组件
 */
const EditAssistantDialog: React.FC<EditAssistantDialogProps> = ({
  open,
  onClose,
  onSave,
  assistantName,
  assistantPrompt,
  assistantAvatar,
  onNameChange,
  onPromptChange,
  onAvatarClick,
  onPromptSelectorClick
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      slotProps={{
        paper: {
          sx: styles.dialogPaper(theme)
        },
        backdrop: {
          sx: styles.dialogBackdrop
        }
      }}
    >
      {/* 自定义标题栏 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: (theme) => 
          `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        backgroundColor: 'transparent',
      }}>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: (theme) => theme.palette.text.primary, 
            mr: 2,
            '&:hover': { 
              backgroundColor: (theme) => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(0,0,0,0.1)' 
            }
          }}
        >
          <ChevronLeft size={24} />
        </IconButton>
        <Typography variant="h6" sx={{ 
          color: (theme) => theme.palette.text.primary, 
          fontWeight: 600 
        }}>
          编辑助手
        </Typography>
      </Box>

      {/* 助手头像区域 - 优化空间占用 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 2,
        backgroundColor: 'transparent'
      }}>
        <Box sx={styles.avatarContainer(theme)}>
          <Avatar
            src={assistantAvatar}
            sx={{
              width: 70,
              height: 70,
              bgcolor: assistantAvatar ? 'transparent' : 'primary.main',
              fontSize: '1.5rem',
              color: (theme) => theme.palette.primary.contrastText,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7)',
              border: (theme) =>
                `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}`,
              background: assistantAvatar ? 'transparent' : (theme) =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
            }}
          >
            {!assistantAvatar && (assistantName.charAt(0) || '助')}
          </Avatar>
          <IconButton
            onClick={onAvatarClick}
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              border: (theme) =>
                `2px solid ${theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)'}`,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)'
                    : '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <User size={14} color="white" />
          </IconButton>
        </Box>
      </Box>

      {/* 标签页导航 - 优化空间占用 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        px: 2,
        pb: 1
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="standard"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              color: (theme) => theme.palette.text.secondary,
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              minWidth: 80,
              minHeight: 36,
              py: 1,
              '&.Mui-selected': {
                color: (theme) => theme.palette.primary.main
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: (theme) => theme.palette.primary.main,
              height: 2,
              borderRadius: '1px'
            }
          }}
        >
          <Tab label="提示词" />
        </Tabs>
      </Box>

      {/* 内容区域 - 优化空间利用 */}
      <DialogContent sx={{
        flex: 1,
        backgroundColor: 'transparent',
        p: 2,
        pt: 1,
        color: (theme) => theme.palette.text.primary,
        overflow: 'auto'
      }}>
        {tabValue === 0 && (
          <Box>
            {/* Name 字段 */}
            <Typography variant="subtitle2" sx={{
              mb: 0.5,
              color: (theme) => theme.palette.text.secondary,
              fontSize: '0.875rem'
            }}>
              名称
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={assistantName}
              onChange={onNameChange}
              placeholder="请输入助手名称，例如：法律咨询助手"
              size="small"
              sx={{
                mb: 2,
                ...styles.inputField(theme)
              }}
            />

            {/* Prompt 字段 */}
            <Typography variant="subtitle2" sx={{
              mb: 0.5,
              color: (theme) => theme.palette.text.secondary,
              fontSize: '0.875rem'
            }}>
              提示词
            </Typography>
            <Paper sx={{
              ...styles.glassomorphism(theme),
              borderRadius: '8px',
              p: 1.5
            }}>
              <TextField
                multiline
                rows={10}
                fullWidth
                variant="standard"
                value={assistantPrompt}
                onChange={onPromptChange}
                placeholder="请输入系统提示词，定义助手的角色和行为特征...

示例：
你是一个友好、专业、乐于助人的AI助手。你会以客观、准确的态度回答用户的问题，并在不确定的情况下坦诚表明。你可以协助用户完成各种任务，提供信息，或进行有意义的对话。"
                sx={{
                  '& .MuiInput-root': {
                    color: (theme) => theme.palette.text.primary,
                    fontSize: '0.875rem',
                    '&:before': {
                      display: 'none'
                    },
                    '&:after': {
                      display: 'none'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: (theme) => theme.palette.text.primary,
                    '&::placeholder': {
                      color: (theme) => theme.palette.text.secondary,
                      opacity: 1
                    }
                  }
                }}
              />

              {/* 功能按钮 */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                mt: 1.5,
                pt: 1.5,
                borderTop: (theme) =>
                  `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)'}`
              }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Sparkles size={16} />}
                  onClick={onPromptSelectorClick}
                  sx={styles.primaryButton(theme)}
                >
                  选择预设提示词
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      {/* 底部操作按钮 - 优化空间占用 */}
      <DialogActions sx={{
        p: 2,
        backgroundColor: 'transparent',
        borderTop: (theme) =>
          `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Button
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.text.secondary,
            backdropFilter: 'blur(10px)',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          取消
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{
            backgroundColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: (theme) => theme.palette.primary.dark
            }
          }}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAssistantDialog;
