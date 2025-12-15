import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import BackButtonDialog from '../../../common/BackButtonDialog';
import { X, Wand2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { AssistantRegex, AssistantRegexScope } from '../../../../shared/types/Assistant';

export interface RegexRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: AssistantRegex) => void;
  rule?: AssistantRegex | null;
}

const SCOPE_OPTIONS: { value: AssistantRegexScope; label: string }[] = [
  { value: 'user', label: '用户消息' },
  { value: 'assistant', label: '助手消息' }
];

/**
 * 正则规则编辑对话框
 */
const RegexRuleDialog: React.FC<RegexRuleDialogProps> = ({
  open,
  onClose,
  onSave,
  rule
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState('');
  const [scopes, setScopes] = useState<AssistantRegexScope[]>(['user']);
  const [visualOnly, setVisualOnly] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // 初始化或重置表单
  useEffect(() => {
    if (open) {
      if (rule) {
        setName(rule.name);
        setPattern(rule.pattern);
        setReplacement(rule.replacement);
        setScopes(rule.scopes.length > 0 ? rule.scopes : ['user']);
        setVisualOnly(rule.visualOnly);
      } else {
        setName('');
        setPattern('');
        setReplacement('');
        setScopes(['user']);
        setVisualOnly(false);
      }
      setPatternError(null);
      setNameError(null);
    }
  }, [open, rule]);

  // 验证正则表达式
  const validatePattern = (value: string): boolean => {
    if (!value.trim()) {
      setPatternError('正则表达式不能为空');
      return false;
    }
    try {
      new RegExp(value);
      setPatternError(null);
      return true;
    } catch (e) {
      setPatternError(`无效的正则表达式: ${(e as Error).message}`);
      return false;
    }
  };

  // 切换作用范围
  const toggleScope = (scope: AssistantRegexScope) => {
    setScopes(prev => {
      if (prev.includes(scope)) {
        // 至少保留一个作用范围
        if (prev.length > 1) {
          return prev.filter(s => s !== scope);
        }
        return prev;
      }
      return [...prev, scope];
    });
  };

  // 保存处理
  const handleSave = () => {
    if (!name.trim()) {
      setNameError('规则名称不能为空');
      return;
    }
    if (!validatePattern(pattern)) {
      return;
    }
    if (scopes.length === 0) {
      return;
    }

    const newRule: AssistantRegex = {
      id: rule?.id || uuidv4(),
      name: name.trim(),
      pattern: pattern.trim(),
      replacement,
      scopes,
      visualOnly,
      enabled: rule?.enabled ?? true
    };

    onSave(newRule);
    onClose();
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      '& fieldset': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
      },
      '&:hover fieldset': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main
      }
    },
    '& .MuiInputBase-input': {
      fontSize: isMobile ? '16px' : '0.875rem'
    }
  };

  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? false : "sm"}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          // 移动端全屏适配
          ...(isMobile && {
            margin: 0,
            maxHeight: '100vh',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          })
        }
      }}
    >
      {/* 标题栏 */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          py: 1.5,
          // 移动端适配顶部安全区域
          ...(isMobile && {
            paddingTop: 'calc(16px + var(--safe-area-top, 0px))',
            minHeight: '64px'
          })
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Wand2 size={20} color={theme.palette.primary.main} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {rule ? '编辑正则规则' : '添加正则规则'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        pt: 2.5,
        // 移动端内容区域适配
        ...(isMobile && {
          px: 2,
          flex: 1,
          overflow: 'auto'
        })
      }}>
        {/* 规则名称 */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>
            规则名称 *
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="例如：隐藏敏感信息"
            error={!!nameError}
            helperText={nameError}
            sx={inputStyles}
          />
        </Box>

        {/* 正则表达式 */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>
            正则表达式 *
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              if (patternError) validatePattern(e.target.value);
            }}
            onBlur={() => pattern && validatePattern(pattern)}
            placeholder="例如：\b\d{11}\b"
            error={!!patternError}
            helperText={patternError}
            sx={{
              ...inputStyles,
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: isMobile ? '16px' : '0.875rem'
              }
            }}
          />
        </Box>

        {/* 替换内容 */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>
            替换为
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="留空则删除匹配内容，支持 $1, $2 等捕获组引用"
            sx={inputStyles}
          />
        </Box>

        {/* 作用范围 */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
            作用范围 *
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {SCOPE_OPTIONS.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => toggleScope(option.value)}
                variant={scopes.includes(option.value) ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: scopes.includes(option.value)
                    ? theme.palette.primary.main
                    : 'transparent',
                  color: scopes.includes(option.value)
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                  borderColor: scopes.includes(option.value)
                    ? theme.palette.primary.main
                    : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    backgroundColor: scopes.includes(option.value)
                      ? theme.palette.primary.dark
                      : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* 仅视觉显示选项 */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={visualOnly}
                onChange={(e) => setVisualOnly(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="body2">仅视觉显示</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  启用后，替换仅在界面显示，不影响实际发送给AI的内容
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', ml: 0 }}
          />
        </Box>

        {/* 提示信息 */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            正则替换会按顺序应用到消息内容上。您可以使用 $1, $2 等引用捕获组。
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        // 移动端底部安全区域适配
        ...(isMobile && {
          paddingBottom: 'calc(16px + var(--safe-area-bottom-computed, 0px))',
          minHeight: '60px'
        })
      }}>
        <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !pattern.trim() || !!patternError || scopes.length === 0}
        >
          {rule ? '保存' : '添加'}
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

export default RegexRuleDialog;
