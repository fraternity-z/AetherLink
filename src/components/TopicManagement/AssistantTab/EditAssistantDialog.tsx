import React, { useState } from 'react';
import {
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
  useMediaQuery,
  type Theme
} from '@mui/material';
import BackButtonDialog from '../../common/BackButtonDialog';
import { ChevronLeft, User, Sparkles, Settings2, Wand2 } from 'lucide-react';
import { useKeyboard } from '../../../shared/hooks/useKeyboard';
import { ParameterEditor } from '../../ParameterEditor';
import { detectProviderFromModel } from '../../../shared/config/parameterMetadata';
import { RegexTab } from './RegexTab';
import type { AssistantRegex } from '../../../shared/types/Assistant';

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
  /** 当前使用的模型 ID */
  modelId?: string;
  /** 参数值 */
  parameterValues?: Record<string, any>;
  /** 已启用的参数 */
  enabledParams?: Record<string, boolean>;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPromptChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
  onPromptSelectorClick: () => void;
  /** 参数变化回调 */
  onParameterChange?: (key: string, value: any) => void;
  /** 参数启用状态变化 */
  onParameterToggle?: (key: string, enabled: boolean) => void;
  /** 正则替换规则 */
  regexRules?: AssistantRegex[];
  /** 正则替换规则变化回调 */
  onRegexRulesChange?: (rules: AssistantRegex[]) => void;
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
  modelId = 'gpt-4',
  parameterValues: externalParamValues = {},
  enabledParams: externalEnabledParams = {},
  onNameChange,
  onPromptChange,
  onAvatarClick,
  onPromptSelectorClick,
  onParameterChange,
  onParameterToggle,
  regexRules = [],
  onRegexRulesChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 键盘适配 - 在移动端锁定键盘，避免其他组件响应
  useKeyboard({ lock: isMobile && open });
  
  const [tabValue, setTabValue] = useState(0);
  
  // 内部状态管理参数（当外部没有提供时使用）
  const [localParamValues, setLocalParamValues] = useState<Record<string, any>>(externalParamValues);
  const [localEnabledParams, setLocalEnabledParams] = useState<Record<string, boolean>>(externalEnabledParams);
  
  // 参数变化处理
  const handleParamChange = (key: string, value: any) => {
    setLocalParamValues(prev => ({ ...prev, [key]: value }));
    onParameterChange?.(key, value);
  };
  
  const handleParamToggle = (key: string, enabled: boolean) => {
    setLocalEnabledParams(prev => ({ ...prev, [key]: enabled }));
    onParameterToggle?.(key, enabled);
  };
  
  // 检测供应商类型
  const providerType = detectProviderFromModel(modelId);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <BackButtonDialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isMobile ? false : "md"}
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            ...styles.dialogPaper(theme),
            // 移动端全屏适配
            ...(isMobile && {
              margin: 0,
              maxHeight: '100vh',
              height: '100vh',
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column'
            })
          }
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
        // 移动端适配顶部安全区域
        ...(isMobile && {
          paddingTop: 'calc(16px + var(--safe-area-top, 0px))',
          minHeight: '64px'
        })
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
          <ChevronLeft size={isMobile ? 28 : 24} />
        </IconButton>
        <Typography variant={isMobile ? "h6" : "subtitle1"} sx={{ 
          color: (theme) => theme.palette.text.primary, 
          fontWeight: 600,
          fontSize: isMobile ? '1.25rem' : '1.125rem'
        }}>
          编辑助手
        </Typography>
      </Box>

      {/* 助手头像区域 - 优化空间占用 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: isMobile ? 2 : 2, // 减少移动端间距
        backgroundColor: 'transparent'
      }}>
        <Box sx={{
          ...styles.avatarContainer(theme),
          width: isMobile ? 80 : 80, // 减小移动端容器尺寸
          height: isMobile ? 80 : 80
        }}>
          <Avatar
            src={assistantAvatar}
            sx={{
              width: isMobile ? 60 : 70, // 减小移动端头像尺寸
              height: isMobile ? 60 : 70,
              bgcolor: assistantAvatar ? 'transparent' : 'primary.main',
              fontSize: isMobile ? '1.5rem' : '1.5rem', // 调整字体大小
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
              width: isMobile ? 44 : 24, // 移动端使用 44px 触摸目标
              height: isMobile ? 44 : 24,
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
            <User size={isMobile ? 20 : 14} color="white" />
          </IconButton>
        </Box>
      </Box>

      {/* 标签页导航 - 优化空间占用 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        px: isMobile ? 2 : 2,
        pb: 1
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="standard"
          sx={{
            minHeight: isMobile ? 40 : 36, // 减小移动端高度
            '& .MuiTab-root': {
              color: (theme) => theme.palette.text.secondary,
              fontSize: isMobile ? '0.9rem' : '0.875rem', // 稍微减小字体
              fontWeight: 500,
              textTransform: 'none',
              minWidth: isMobile ? 80 : 80,
              minHeight: isMobile ? 40 : 36, // 减小移动端高度
              py: isMobile ? 1 : 1,
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
          <Tab 
            label="参数" 
            icon={<Settings2 size={16} />} 
            iconPosition="start"
            sx={{ minHeight: isMobile ? 40 : 36 }}
          />
          <Tab 
            label="正则替换" 
            icon={<Wand2 size={16} />} 
            iconPosition="start"
            sx={{ minHeight: isMobile ? 40 : 36 }}
          />
        </Tabs>
      </Box>

      {/* 内容区域 - 优化空间利用 */}
      <DialogContent sx={{
        flex: 1,
        backgroundColor: 'transparent',
        p: 2,
        pt: 1,
        color: (theme) => theme.palette.text.primary,
        overflow: 'auto',
        // 移动端内容区域适配 - 使用 flex: 1 自动填充剩余空间
        ...(isMobile && {
          px: 2,
          flex: 1, // 自动填充可用空间，避免硬编码高度
          overflow: 'auto'
        })
      }}>
        {tabValue === 0 && (
          <Box>
            {/* Name 字段 */}
            <Typography variant="subtitle2" sx={{
              mb: 0.5,
              color: (theme) => theme.palette.text.secondary,
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}>
              名称
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={assistantName}
              onChange={onNameChange}
              placeholder="请输入助手名称，例如：法律咨询助手"
              size={isMobile ? "medium" : "small"}
              sx={{
                mb: 2,
                ...styles.inputField(theme),
                '& .MuiInputBase-input': {
                  color: (theme) => theme.palette.text.primary,
                  fontSize: isMobile ? '16px' : '0.875rem' // 移动端使用16px防止缩放
                }
              }}
            />

            {/* Prompt 字段 */}
            <Typography variant="subtitle2" sx={{
              mb: 0.5,
              color: (theme) => theme.palette.text.secondary,
              fontSize: isMobile ? '1rem' : '0.875rem'
            }}>
              提示词
            </Typography>
            <Paper sx={{
              ...styles.glassomorphism(theme),
              borderRadius: '8px',
              p: isMobile ? 1.5 : 1.5 // 减少移动端padding
            }}>
              <TextField
                multiline
                rows={isMobile ? 8 : 10} // 移动端进一步减少到8行
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
                    fontSize: isMobile ? '16px' : '0.875rem', // 移动端使用16px防止缩放
                    '&:before': {
                      display: 'none'
                    },
                    '&:after': {
                      display: 'none'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: (theme) => theme.palette.text.primary,
                    fontSize: isMobile ? '16px' : '0.875rem', // 移动端使用16px防止缩放
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
                  size={isMobile ? "medium" : "small"}
                  startIcon={<Sparkles size={isMobile ? 20 : 16} />}
                  onClick={onPromptSelectorClick}
                  sx={{
                    ...styles.primaryButton(theme),
                    fontSize: isMobile ? '14px' : '12px',
                    py: isMobile ? 1 : 0.5
                  }}
                >
                  选择预设提示词
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* 参数 Tab 内容 */}
        {tabValue === 1 && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <ParameterEditor
              providerType={providerType}
              values={localParamValues}
              enabledParams={localEnabledParams}
              onChange={handleParamChange}
              onToggle={handleParamToggle}
            />
          </Box>
        )}

        {/* 正则替换 Tab 内容 */}
        {tabValue === 2 && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <RegexTab
              rules={regexRules}
              onChange={(rules) => onRegexRulesChange?.(rules)}
            />
          </Box>
        )}
      </DialogContent>

      {/* 底部操作按钮 - 优化空间占用 */}
      <DialogActions sx={{
        p: isMobile ? 3 : 2,
        backgroundColor: 'transparent',
        borderTop: (theme) =>
          `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)'}`,
        // 移动端底部安全区域适配
        ...(isMobile && {
          paddingBottom: 'calc(16px + var(--safe-area-bottom-computed, 0px))',
          minHeight: '60px' // 减少最小高度
        })
      }}>
        <Button
          onClick={onClose}
          size={isMobile ? "large" : "medium"}
          sx={{
            color: (theme) => theme.palette.text.secondary,
            backdropFilter: 'blur(10px)',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
            fontSize: isMobile ? '16px' : '14px',
            px: isMobile ? 3 : 2,
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
          size={isMobile ? "large" : "medium"}
          sx={{
            backgroundColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
            backdropFilter: 'blur(10px)',
            fontSize: isMobile ? '16px' : '14px',
            px: isMobile ? 3 : 2,
            '&:hover': {
              backgroundColor: (theme) => theme.palette.primary.dark
            }
          }}
        >
          保存
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

export default EditAssistantDialog;
