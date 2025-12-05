/**
 * 动态上下文设置组件
 * 上下文窗口和消息数常驻，参数使用共享的 ParameterEditor 组件
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Slider,
  TextField,
  Collapse,
  IconButton,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip
} from '@mui/material';
import { ChevronDown, ChevronUp, Settings, X } from 'lucide-react';
import type { ThinkingOption } from '../../../shared/config/reasoningConfig';
import { collapsibleHeaderStyle } from './scrollOptimization';
import type { ProviderType } from '../../../shared/api/parameters/types';
import { detectProviderFromModel } from '../../../shared/config/parameterMetadata';
import ParameterEditor from '../../ParameterEditor/ParameterEditor';
import { parameterSyncService, PARAMETER_EVENT_MAP, type SyncableParameterKey } from '../../../shared/services/ParameterSyncService';

interface DynamicContextSettingsProps {
  /** 当前模型 ID */
  modelId?: string;
  /** 上下文窗口大小（Token数） */
  contextWindowSize: number;
  /** 上下文消息数 */
  contextCount: number;
  /** 最大输出 Token */
  maxOutputTokens: number;
  /** 是否启用最大输出 Token */
  enableMaxOutputTokens: boolean;
  /** 思维链长度 (保留接口兼容) */
  thinkingEffort?: ThinkingOption;
  /** 思考预算 */
  thinkingBudget: number;
  /** 扩展参数设置 (保留接口兼容) */
  extendedSettings?: Record<string, any>;
  
  // 回调函数
  onContextWindowSizeChange: (value: number) => void;
  onContextCountChange: (value: number) => void;
  onMaxOutputTokensChange: (value: number) => void;
  onEnableMaxOutputTokensChange: (value: boolean) => void;
  onThinkingEffortChange?: (value: ThinkingOption) => void;
  onThinkingBudgetChange: (value: number) => void;
  onExtendedSettingChange?: (key: string, value: any) => void;
}

/**
 * 动态上下文设置组件
 */
// 导出 CustomParameter 类型供外部使用
export { type CustomParameter } from '../../ParameterEditor/ParameterEditor';

export default function DynamicContextSettings({
  modelId = 'gpt-4',
  contextWindowSize,
  contextCount,
  maxOutputTokens,
  onContextWindowSizeChange,
  onContextCountChange,
  onMaxOutputTokensChange,
  onEnableMaxOutputTokensChange
}: DynamicContextSettingsProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 检测供应商类型
  const providerType = useMemo(() => detectProviderFromModel(modelId), [modelId]);
  
  // 供应商名称
  const providerNames: Record<ProviderType, string> = {
    openai: 'OpenAI',
    anthropic: 'Claude',
    gemini: 'Gemini',
    'openai-compatible': '兼容 API'
  };

  // 参数值状态（从 parameterSyncService 加载）
  const [paramValues, setParamValues] = useState<Record<string, any>>(() => {
    const settings = parameterSyncService.getSettings();
    return {
      temperature: settings.temperature ?? 0.7,
      topP: settings.topP ?? 1.0,
      maxOutputTokens: settings.maxOutputTokens ?? maxOutputTokens,
      topK: settings.topK ?? 40,
      frequencyPenalty: settings.frequencyPenalty ?? 0,
      presencePenalty: settings.presencePenalty ?? 0,
      seed: settings.seed ?? null,
      stopSequences: settings.stopSequences ?? '',
      responseFormat: settings.responseFormat ?? 'text',
      parallelToolCalls: settings.parallelToolCalls ?? true,
      thinkingBudget: settings.thinkingBudget ?? 1024,
      reasoningEffort: settings.reasoningEffort ?? 'medium',
      streamOutput: settings.streamOutput ?? true,
    };
  });

  // 参数启用状态
  const [enabledParams, setEnabledParams] = useState<Record<string, boolean>>(() => {
    const settings = parameterSyncService.getSettings();
    return {
      temperature: settings.enableTemperature ?? false,
      topP: settings.enableTopP ?? false,
      maxOutputTokens: settings.enableMaxOutputTokens !== false,
      topK: settings.enableTopK ?? false,
      frequencyPenalty: settings.enableFrequencyPenalty ?? false,
      presencePenalty: settings.enablePresencePenalty ?? false,
      seed: settings.enableSeed ?? false,
      stopSequences: settings.enableStopSequences ?? false,
      responseFormat: settings.enableResponseFormat ?? false,
      parallelToolCalls: true,
      thinkingBudget: settings.enableThinkingBudget ?? false,
      reasoningEffort: settings.enableReasoningEffort ?? false,
      streamOutput: true,
    };
  });

  // 处理参数值变化
  const handleParamChange = useCallback((key: string, value: any) => {
    setParamValues(prev => ({ ...prev, [key]: value }));
    parameterSyncService.setParameter(key as SyncableParameterKey, value, enabledParams[key]);
    
    // 特殊处理 maxOutputTokens
    if (key === 'maxOutputTokens') {
      onMaxOutputTokensChange(value);
    }
  }, [enabledParams, onMaxOutputTokensChange]);

  // 处理参数启用状态变化
  const handleParamToggle = useCallback((key: string, enabled: boolean) => {
    setEnabledParams(prev => ({ ...prev, [key]: enabled }));
    parameterSyncService.setParameterEnabled(key as SyncableParameterKey, enabled);
    
    // 特殊处理 maxOutputTokens
    if (key === 'maxOutputTokens') {
      onEnableMaxOutputTokensChange(enabled);
    }
  }, [onEnableMaxOutputTokensChange]);

  // 监听外部参数变化（从其他组件同步过来）
  useEffect(() => {
    const handleParamChanged = (e: CustomEvent) => {
      const { key, value, enabled } = e.detail;
      if (key) {
        if (value !== undefined) {
          setParamValues(prev => ({ ...prev, [key]: value }));
        }
        if (enabled !== undefined) {
          setEnabledParams(prev => ({ ...prev, [key]: enabled }));
        }
      }
    };

    window.addEventListener('parameterChanged', handleParamChanged as EventListener);

    // 监听特定参数变化事件
    const eventHandlers: Array<[string, EventListener]> = [];
    Object.entries(PARAMETER_EVENT_MAP).forEach(([key, eventName]) => {
      const handler = ((e: CustomEvent) => {
        const { value, enabled } = e.detail;
        if (value !== undefined) {
          setParamValues(prev => ({ ...prev, [key]: value }));
        }
        if (enabled !== undefined) {
          setEnabledParams(prev => ({ ...prev, [key]: enabled }));
        }
      }) as EventListener;
      window.addEventListener(eventName, handler);
      eventHandlers.push([eventName, handler]);
    });

    return () => {
      window.removeEventListener('parameterChanged', handleParamChanged as EventListener);
      eventHandlers.forEach(([eventName, handler]) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, []);

  // 处理上下文窗口大小变化
  const handleContextWindowSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value);
      if (numValue >= 0 && numValue <= 2000000) {
        onContextWindowSizeChange(numValue);
      }
    }
  };

  // 处理上下文消息数变化
  const handleContextCountChange = (_event: Event, newValue: number | number[]) => {
    onContextCountChange(newValue as number);
  };

  return (
    <Box>
      {/* 可折叠的标题栏 */}
      <ListItem
        component="div"
        onClick={() => setExpanded(!expanded)}
        sx={collapsibleHeaderStyle(expanded)}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>上下文设置</span>
              <Chip 
                label={providerNames[providerType]} 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
          }
          secondary={`窗口: ${contextWindowSize > 0 ? contextWindowSize.toLocaleString() : '自动'} | 输出: ${maxOutputTokens}`}
          primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.95rem', lineHeight: 1.2, component: 'div' }}
          secondaryTypographyProps={{ fontSize: '0.75rem', lineHeight: 1.2 }}
        />
        <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="参数编辑器" arrow>
            <IconButton 
              size="small" 
              sx={{ padding: '2px' }}
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
            >
              <Settings size={14} />
            </IconButton>
          </Tooltip>
          <IconButton edge="end" size="small" sx={{ padding: '2px' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      {/* 可折叠的内容区域 */}
      <Collapse
        in={expanded}
        timeout={{ enter: 300, exit: 200 }}
        easing={{ enter: 'cubic-bezier(0.4, 0, 0.2, 1)', exit: 'cubic-bezier(0.4, 0, 0.6, 1)' }}
        unmountOnExit
      >
        <Box sx={{ px: 2, pb: 2 }}>
          {/* 上下文窗口大小控制 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="medium">
              上下文窗口大小
            </Typography>
            <Typography variant="caption" color="text.secondary">
              模型可以处理的总Token数
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="text"
              value={contextWindowSize || ''}
              onChange={handleContextWindowSizeChange}
              placeholder="0 表示使用模型默认值"
              sx={{ mt: 1 }}
            />
          </Box>
          <Divider sx={{ my: 2 }} />

          {/* 上下文消息数量控制 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="medium">
              上下文消息数: {contextCount === 100 ? '最大' : contextCount} 条
            </Typography>
            <Box 
              sx={{ touchAction: 'none' }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <Slider
                value={contextCount}
                onChange={handleContextCountChange}
                min={0}
                max={100}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 50, label: '50' },
                  { value: 100, label: '最大' }
                ]}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />

          {/* 使用共享的 ParameterEditor 组件 */}
          <ParameterEditor
            providerType={providerType}
            values={paramValues}
            enabledParams={enabledParams}
            onChange={handleParamChange}
            onToggle={handleParamToggle}
          />
        </Box>
      </Collapse>

      {/* 参数编辑器对话框 */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings size={20} />
            <span>参数编辑器</span>
            <Chip 
              label={providerNames[providerType]} 
              size="small" 
              color="primary"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <ParameterEditor
            providerType={providerType}
            values={paramValues}
            enabledParams={enabledParams}
            onChange={handleParamChange}
            onToggle={handleParamToggle}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
