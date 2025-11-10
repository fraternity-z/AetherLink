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
  Slider,
  FormControlLabel,
} from '@mui/material';
import { Eye as VisibilityIcon, EyeOff as VisibilityOffIcon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import CustomSwitch from '../CustomSwitch';

// OpenAI TTS配置接口
export interface OpenAITTSSettings {
  apiKey: string;
  showApiKey: boolean;
  selectedModel: string;
  selectedVoice: string;
  selectedFormat: string;
  speed: number;
  useStream: boolean;
}

// 组件Props接口
interface OpenAITTSTabProps {
  settings: OpenAITTSSettings;
  onSettingsChange: (settings: OpenAITTSSettings) => void;
}

// OpenAI TTS模型选项
const OPENAI_MODELS = [
  { value: 'tts-1', label: 'TTS-1 - 标准质量，速度快' },
  { value: 'tts-1-hd', label: 'TTS-1-HD - 高清质量，更自然' },
];

// OpenAI TTS语音选项
const OPENAI_VOICES = [
  { value: 'alloy', label: 'Alloy - 中性，平衡' },
  { value: 'echo', label: 'Echo - 男性，深沉' },
  { value: 'fable', label: 'Fable - 英式，优雅' },
  { value: 'onyx', label: 'Onyx - 男性，深沉有力' },
  { value: 'nova', label: 'Nova - 女性，年轻活泼' },
  { value: 'shimmer', label: 'Shimmer - 女性，温柔' },
];

// OpenAI TTS格式选项
const OPENAI_FORMATS = [
  { value: 'mp3', label: 'MP3 - 通用格式，兼容性好' },
  { value: 'opus', label: 'Opus - 高压缩比，适合网络传输' },
  { value: 'aac', label: 'AAC - 高质量，适合移动设备' },
  { value: 'flac', label: 'FLAC - 无损压缩，最高质量' },
  { value: 'wav', label: 'WAV - 无压缩，最大兼容性' },
  { value: 'pcm', label: 'PCM - 原始音频数据' },
];

/**
 * OpenAI TTS配置组件
 */
export const OpenAITTSTab: React.FC<OpenAITTSTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useTranslation();
  // 🚀 性能优化：使用useCallback缓存事件处理函数
  const handleApiKeyChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, apiKey: value });
  }, [settings, onSettingsChange]);

  const handleShowApiKeyToggle = useCallback(() => {
    onSettingsChange({ ...settings, showApiKey: !settings.showApiKey });
  }, [settings, onSettingsChange]);

  const handleModelChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, selectedModel: value });
  }, [settings, onSettingsChange]);

  const handleVoiceChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, selectedVoice: value });
  }, [settings, onSettingsChange]);

  const handleFormatChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, selectedFormat: value });
  }, [settings, onSettingsChange]);

  const handleSpeedChange = useCallback((value: number) => {
    onSettingsChange({ ...settings, speed: value });
  }, [settings, onSettingsChange]);

  const handleStreamToggle = useCallback((checked: boolean) => {
    onSettingsChange({ ...settings, useStream: checked });
  }, [settings, onSettingsChange]);

  // 处理表单提交，防止默认行为
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        {t('settings.voice.tabSettings.openai.title')}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
        <FormControl fullWidth variant="outlined">
          <TextField
            label={t('settings.voice.tabSettings.openai.apiKey')}
            variant="outlined"
            value={settings.apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            type={settings.showApiKey ? 'text' : 'password'}
            placeholder={t('settings.voice.tabSettings.openai.apiKeyPlaceholder')}
            helperText={t('settings.voice.tabSettings.openai.apiKeyHelper')}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={handleShowApiKeyToggle}
                    edge="end"
                  >
                    {settings.showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.openai.model')}</InputLabel>
          <Select
            value={settings.selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            label={t('settings.voice.tabSettings.openai.model')}
            MenuProps={{
              disableAutoFocus: true,
              disableRestoreFocus: true
            }}
          >
            {OPENAI_MODELS.map((model) => (
              <MenuItem key={model.value} value={model.value}>
                {model.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.openai.modelHelper')}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.openai.voice')}</InputLabel>
          <Select
            value={settings.selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value)}
            label={t('settings.voice.tabSettings.openai.voice')}
            MenuProps={{
              disableAutoFocus: true,
              disableRestoreFocus: true
            }}
          >
            {OPENAI_VOICES.map((voice) => (
              <MenuItem key={voice.value} value={voice.value}>
                {voice.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.openai.voiceHelper')}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.openai.format')}</InputLabel>
          <Select
            value={settings.selectedFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
            label={t('settings.voice.tabSettings.openai.format')}
            MenuProps={{
              disableAutoFocus: true,
              disableRestoreFocus: true
            }}
          >
            {OPENAI_FORMATS.map((format) => (
              <MenuItem key={format.value} value={format.value}>
                {format.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.openai.formatHelper')}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth>
          <Typography gutterBottom>{t('settings.voice.tabSettings.openai.speed')}</Typography>
          <Slider
            value={settings.speed}
            min={0.25}
            max={4.0}
            step={0.05}
            onChange={(_, value) => handleSpeedChange(value as number)}
            valueLabelDisplay="auto"
            marks={[
              { value: 0.25, label: '0.25x' },
              { value: 1.0, label: '1.0x' },
              { value: 4.0, label: '4.0x' }
            ]}
          />
          <FormHelperText>
            {t('settings.voice.tabSettings.openai.speedHelper')}
          </FormHelperText>
        </FormControl>

        <FormControlLabel
          control={
            <CustomSwitch
              checked={settings.useStream}
              onChange={(e) => handleStreamToggle(e.target.checked)}
            />
          }
          label={t('settings.voice.tabSettings.openai.useStream')}
        />
        <FormHelperText>
          {t('settings.voice.tabSettings.openai.useStreamHelper')}
        </FormHelperText>
        </Stack>
      </form>
    </>
  );
};

export default OpenAITTSTab;
