import React, { useCallback } from 'react';
import {
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';
import { Eye as VisibilityIcon, EyeOff as VisibilityOffIcon } from 'lucide-react';
import CustomSwitch from '../CustomSwitch';
import { useTranslation } from '../../i18n';

// 硅基流动TTS配置接口
export interface SiliconFlowTTSSettings {
  apiKey: string;
  showApiKey: boolean;
  selectedModel: string;
  selectedVoice: string;
  useStream: boolean; // 是否使用流式输出
}

// 组件Props接口
interface SiliconFlowTTSTabProps {
  settings: SiliconFlowTTSSettings;
  onSettingsChange: (settings: SiliconFlowTTSSettings | ((prev: SiliconFlowTTSSettings) => SiliconFlowTTSSettings)) => void;
}

// 硅基流动TTS模型选项
const SILICONFLOW_MODELS = [
  { value: 'FunAudioLLM/CosyVoice2-0.5B', label: 'CosyVoice2-0.5B - 多语言语音合成' },
];

// 硅基流动TTS语音选项
const SILICONFLOW_VOICES = {
  'FunAudioLLM/CosyVoice2-0.5B': [
    // 男生音色
    { value: 'alex', label: 'Alex - 沉稳男声' },
    { value: 'benjamin', label: 'Benjamin - 低沉男声' },
    { value: 'charles', label: 'Charles - 磁性男声' },
    { value: 'david', label: 'David - 欢快男声' },
    // 女生音色
    { value: 'anna', label: 'Anna - 沉稳女声' },
    { value: 'bella', label: 'Bella - 激情女声' },
    { value: 'claire', label: 'Claire - 温柔女声' },
    { value: 'diana', label: 'Diana - 欢快女声' },
  ],
};

/**
 * 硅基流动TTS配置组件
 */
export const SiliconFlowTTSTab: React.FC<SiliconFlowTTSTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useTranslation();
  // 🚀 性能优化：使用函数式更新避免依赖整个settings对象
  const handleApiKeyChange = useCallback((value: string) => {
    onSettingsChange(prev => ({ ...prev, apiKey: value }));
  }, [onSettingsChange]);

  const handleShowApiKeyToggle = useCallback(() => {
    onSettingsChange(prev => ({ ...prev, showApiKey: !prev.showApiKey }));
  }, [onSettingsChange]);

  const handleModelChange = useCallback((value: string) => {
    // 切换模型时重置语音选择
    const firstVoice = SILICONFLOW_VOICES[value as keyof typeof SILICONFLOW_VOICES]?.[0]?.value || '';
    onSettingsChange(prev => ({
      ...prev,
      selectedModel: value,
      selectedVoice: firstVoice
    }));
  }, [onSettingsChange]);

  const handleVoiceChange = useCallback((value: string) => {
    onSettingsChange(prev => ({ ...prev, selectedVoice: value }));
  }, [onSettingsChange]);

  const handleStreamToggle = useCallback((checked: boolean) => {
    onSettingsChange(prev => ({ ...prev, useStream: checked }));
  }, [onSettingsChange]);

  // 处理表单提交，防止默认行为
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  // 获取当前模型的语音选项
  const currentVoices = SILICONFLOW_VOICES[settings.selectedModel as keyof typeof SILICONFLOW_VOICES] || [];

  return (
    <>
      <Typography
        variant="subtitle1"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 600,
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
          color: 'text.primary',
        }}
      >
        {t('settings.voice.tabSettings.siliconflow.title')}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
        <FormControl fullWidth variant="outlined">
          <TextField
            label={t('settings.voice.tabSettings.siliconflow.apiKey')}
            variant="outlined"
            value={settings.apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            type={settings.showApiKey ? 'text' : 'password'}
            placeholder={t('settings.voice.tabSettings.siliconflow.apiKeyPlaceholder')}
            helperText={t('settings.voice.tabSettings.siliconflow.apiKeyHelper')}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={handleShowApiKeyToggle}
                    edge="end"
                    size={window.innerWidth < 600 ? "small" : "medium"}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {settings.showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              },
            }}
            sx={{
              mb: { xs: 1.5, sm: 2 },
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' },
              },
              '& .MuiFormHelperText-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mt: { xs: 0.5, sm: 1 },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderRadius: { xs: 1.5, sm: 2 },
              },
            }}
          />
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.siliconflow.model')}</InputLabel>
          <Select
            value={settings.selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            label={t('settings.voice.tabSettings.siliconflow.model')}
          >
            {SILICONFLOW_MODELS.map((model) => (
              <MenuItem key={model.value} value={model.value}>
                {model.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.siliconflow.modelHelper')}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.siliconflow.voice')}</InputLabel>
          <Select
            value={settings.selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value)}
            label={t('settings.voice.tabSettings.siliconflow.voice')}
            disabled={!settings.selectedModel}
          >
            {currentVoices.map((voice) => (
              <MenuItem key={voice.value} value={voice.value}>
                {voice.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {settings.selectedModel
              ? t('settings.voice.tabSettings.siliconflow.voiceHelper')
              : t('settings.voice.tabSettings.siliconflow.voiceHelperNoModel')
            }
          </FormHelperText>
        </FormControl>

        <FormControlLabel
          control={
            <CustomSwitch
              checked={settings.useStream}
              onChange={(e) => handleStreamToggle(e.target.checked)}
            />
          }
          label={t('settings.voice.tabSettings.siliconflow.useStream')}
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
            },
          }}
        />
        <FormHelperText sx={{ mt: -1, ml: 0 }}>
          {t('settings.voice.tabSettings.siliconflow.useStreamHelper')}
        </FormHelperText>
        </Stack>
      </form>
    </>
  );
};

export default SiliconFlowTTSTab;
