import React, { useCallback, useState, useMemo } from 'react';
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
  Box,
  InputAdornment,
} from '@mui/material';
import { ChevronRight } from 'lucide-react';
import FullScreenSelector, { type SelectorGroup } from './FullScreenSelectorSolid';
import CustomSwitch from '../CustomSwitch';
import { Eye as VisibilityIcon, EyeOff as VisibilityOffIcon } from 'lucide-react';
import { useTranslation } from '../../i18n';

// Azure TTS配置接口
export interface AzureTTSSettings {
  apiKey: string;
  showApiKey: boolean;
  region: string;
  voiceName: string;
  language: string;
  outputFormat: string;
  rate: string;
  pitch: string;
  volume: string;
  style: string;
  styleDegree: number;
  role: string;
  useSSML: boolean;
}

// 组件Props接口
interface AzureTTSTabProps {
  settings: AzureTTSSettings;
  onSettingsChange: (settings: AzureTTSSettings) => void;
}

// Azure服务区域选项
const AZURE_REGIONS = [
  { value: 'eastus', label: '美国东部 (East US)' },
  { value: 'westus', label: '美国西部 (West US)' },
  { value: 'westus2', label: '美国西部2 (West US 2)' },
  { value: 'eastus2', label: '美国东部2 (East US 2)' },
  { value: 'southeastasia', label: '东南亚 (Southeast Asia)' },
  { value: 'westeurope', label: '西欧 (West Europe)' },
  { value: 'northeurope', label: '北欧 (North Europe)' },
  { value: 'japaneast', label: '日本东部 (Japan East)' },
  { value: 'australiaeast', label: '澳大利亚东部 (Australia East)' },
  { value: 'centralindia', label: '印度中部 (Central India)' },
];

// Azure语音选项
const AZURE_VOICES = [
  // 中文语音
  { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女性，温柔甜美)' },
  { value: 'zh-CN-YunxiNeural', label: '云希 (男性，成熟稳重)' },
  { value: 'zh-CN-YunjianNeural', label: '云健 (男性，年轻活力)' },
  { value: 'zh-CN-XiaoyiNeural', label: '晓伊 (女性，亲切自然)' },
  { value: 'zh-CN-YunyangNeural', label: '云扬 (男性，新闻播报)' },
  { value: 'zh-CN-XiaochenNeural', label: '晓辰 (女性，温暖治愈)' },
  { value: 'zh-CN-XiaohanNeural', label: '晓涵 (女性，严肃正式)' },
  { value: 'zh-CN-XiaomengNeural', label: '晓梦 (女性，可爱活泼)' },
  { value: 'zh-CN-XiaomoNeural', label: '晓墨 (女性，知性优雅)' },
  { value: 'zh-CN-XiaoqiuNeural', label: '晓秋 (女性，成熟知性)' },
  { value: 'zh-CN-XiaoruiNeural', label: '晓睿 (女性，亲和力强)' },
  { value: 'zh-CN-XiaoshuangNeural', label: '晓双 (女性，年轻甜美)' },
  { value: 'zh-CN-XiaoxuanNeural', label: '晓萱 (女性，温柔体贴)' },
  { value: 'zh-CN-XiaoyanNeural', label: '晓颜 (女性，清新自然)' },
  { value: 'zh-CN-XiaoyouNeural', label: '晓悠 (女性，悠扬动听)' },
  { value: 'zh-CN-XiaozhenNeural', label: '晓甄 (女性，专业严谨)' },
  { value: 'zh-CN-YunfengNeural', label: '云枫 (男性，磁性深沉)' },
  { value: 'zh-CN-YunhaoNeural', label: '云皓 (男性，阳光开朗)' },
  { value: 'zh-CN-YunxiaNeural', label: '云夏 (男性，清新自然)' },
  { value: 'zh-CN-YunyeNeural', label: '云野 (男性，豪放不羁)' },
  { value: 'zh-CN-YunzeNeural', label: '云泽 (男性，温润如玉)' },
  // 英文语音
  { value: 'en-US-JennyNeural', label: 'Jenny (女性，美式英语)' },
  { value: 'en-US-GuyNeural', label: 'Guy (男性，美式英语)' },
  { value: 'en-US-AriaNeural', label: 'Aria (女性，美式英语)' },
  { value: 'en-US-DavisNeural', label: 'Davis (男性，美式英语)' },
];

// Azure输出格式选项
const AZURE_OUTPUT_FORMATS = [
  { value: 'audio-24khz-160kbitrate-mono-mp3', label: 'MP3 24kHz 160kbps (推荐)' },
  { value: 'audio-24khz-96kbitrate-mono-mp3', label: 'MP3 24kHz 96kbps' },
  { value: 'audio-16khz-128kbitrate-mono-mp3', label: 'MP3 16kHz 128kbps' },
  { value: 'webm-24khz-16bit-mono-opus', label: 'WebM Opus 24kHz' },
  { value: 'ogg-24khz-16bit-mono-opus', label: 'OGG Opus 24kHz' },
  { value: 'riff-24khz-16bit-mono-pcm', label: 'WAV 24kHz 16bit' },
  { value: 'riff-16khz-16bit-mono-pcm', label: 'WAV 16kHz 16bit' },
];

// Azure说话风格选项
const AZURE_STYLES = [
  { value: 'general', label: '通用 (默认)' },
  { value: 'cheerful', label: '愉快开心' },
  { value: 'sad', label: '悲伤沮丧' },
  { value: 'angry', label: '愤怒生气' },
  { value: 'fearful', label: '恐惧害怕' },
  { value: 'disgruntled', label: '不满抱怨' },
  { value: 'serious', label: '严肃正经' },
  { value: 'affectionate', label: '亲切关爱' },
  { value: 'gentle', label: '温柔体贴' },
  { value: 'embarrassed', label: '尴尬羞涩' },
  { value: 'calm', label: '平静冷静' },
];

// Azure角色扮演选项
const AZURE_ROLES = [
  { value: 'default', label: '默认' },
  { value: 'Girl', label: '女孩' },
  { value: 'Boy', label: '男孩' },
  { value: 'YoungAdultFemale', label: '年轻女性' },
  { value: 'YoungAdultMale', label: '年轻男性' },
  { value: 'OlderAdultFemale', label: '成年女性' },
  { value: 'OlderAdultMale', label: '成年男性' },
  { value: 'SeniorFemale', label: '老年女性' },
  { value: 'SeniorMale', label: '老年男性' },
];

/**
 * Azure TTS配置组件
 */
export const AzureTTSTab: React.FC<AzureTTSTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useTranslation();

  // 全屏选择器状态
  const [voiceSelectorOpen, setVoiceSelectorOpen] = useState(false);
  const [styleSelectorOpen, setStyleSelectorOpen] = useState(false);

  // 音色分组数据
  const voiceGroups: SelectorGroup[] = useMemo(() => [
    {
      name: '中文语音',
      items: AZURE_VOICES.filter(v => v.value.startsWith('zh-')).map(v => ({
        key: v.value,
        label: v.label,
      })),
    },
    {
      name: '英文语音',
      items: AZURE_VOICES.filter(v => v.value.startsWith('en-')).map(v => ({
        key: v.value,
        label: v.label,
      })),
    },
  ], []);

  // 风格分组数据
  const styleGroups: SelectorGroup[] = useMemo(() => [{
    name: '说话风格',
    items: AZURE_STYLES.map(s => ({
      key: s.value,
      label: s.label,
    })),
  }], []);

  // 获取当前选中的名称
  const selectedVoiceName = useMemo(() => 
    AZURE_VOICES.find(v => v.value === settings.voiceName)?.label || settings.voiceName,
  [settings.voiceName]);

  const selectedStyleName = useMemo(() => 
    AZURE_STYLES.find(s => s.value === settings.style)?.label || settings.style,
  [settings.style]);

  // 🚀 性能优化：使用useCallback缓存事件处理函数
  const handleApiKeyChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, apiKey: value });
  }, [settings, onSettingsChange]);

  const handleShowApiKeyToggle = useCallback(() => {
    onSettingsChange({ ...settings, showApiKey: !settings.showApiKey });
  }, [settings, onSettingsChange]);

  const handleRegionChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, region: value });
  }, [settings, onSettingsChange]);

  const handleOutputFormatChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, outputFormat: value });
  }, [settings, onSettingsChange]);

  const handleRateChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, rate: value });
  }, [settings, onSettingsChange]);

  const handlePitchChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, pitch: value });
  }, [settings, onSettingsChange]);

  const handleVolumeChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, volume: value });
  }, [settings, onSettingsChange]);

  const handleStyleDegreeChange = useCallback((value: number) => {
    onSettingsChange({ ...settings, styleDegree: value });
  }, [settings, onSettingsChange]);

  const handleRoleChange = useCallback((value: string) => {
    onSettingsChange({ ...settings, role: value });
  }, [settings, onSettingsChange]);

  const handleUseSSMLToggle = useCallback((checked: boolean) => {
    onSettingsChange({ ...settings, useSSML: checked });
  }, [settings, onSettingsChange]);

  // 处理表单提交，防止默认行为
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        {t('settings.voice.tabSettings.azure.title')}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
        <FormControl fullWidth variant="outlined">
          <TextField
            label={t('settings.voice.tabSettings.azure.apiKey')}
            variant="outlined"
            value={settings.apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            type={settings.showApiKey ? 'text' : 'password'}
            placeholder={t('settings.voice.tabSettings.azure.apiKeyPlaceholder')}
            helperText={t('settings.voice.tabSettings.azure.apiKeyHelper')}
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
          <InputLabel>{t('settings.voice.tabSettings.azure.region')}</InputLabel>
          <Select
            value={settings.region}
            onChange={(e) => handleRegionChange(e.target.value)}
            label={t('settings.voice.tabSettings.azure.region')}
            MenuProps={{
              disableAutoFocus: true,
              disableRestoreFocus: true
            }}
          >
            {AZURE_REGIONS.map((region) => (
              <MenuItem key={region.value} value={region.value}>
                {region.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.azure.regionHelper')}
          </FormHelperText>
        </FormControl>

        {/* 音色选择 - 点击打开全屏选择器 */}
        <TextField
          fullWidth
          label={t('settings.voice.tabSettings.azure.voice')}
          value={selectedVoiceName}
          onClick={() => setVoiceSelectorOpen(true)}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <ChevronRight size={18} />
              </InputAdornment>
            ),
            sx: { cursor: 'pointer' }
          }}
          helperText={t('settings.voice.tabSettings.azure.voiceHelper')}
          sx={{ cursor: 'pointer' }}
        />

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.azure.outputFormat')}</InputLabel>
          <Select
            value={settings.outputFormat}
            onChange={(e) => handleOutputFormatChange(e.target.value)}
            label={t('settings.voice.tabSettings.azure.outputFormat')}
          >
            {AZURE_OUTPUT_FORMATS.map((format) => (
              <MenuItem key={format.value} value={format.value}>
                {format.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.azure.outputFormatHelper')}
          </FormHelperText>
        </FormControl>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.voice.tabSettings.azure.rate')}</InputLabel>
            <Select
              value={settings.rate}
              onChange={(e) => handleRateChange(e.target.value)}
              label={t('settings.voice.tabSettings.azure.rate')}
            >
              <MenuItem value="x-slow">{t('settings.voice.tabSettings.azure.rateOptions.xSlow')}</MenuItem>
              <MenuItem value="slow">{t('settings.voice.tabSettings.azure.rateOptions.slow')}</MenuItem>
              <MenuItem value="medium">{t('settings.voice.tabSettings.azure.rateOptions.medium')}</MenuItem>
              <MenuItem value="fast">{t('settings.voice.tabSettings.azure.rateOptions.fast')}</MenuItem>
              <MenuItem value="x-fast">{t('settings.voice.tabSettings.azure.rateOptions.xFast')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('settings.voice.tabSettings.azure.pitch')}</InputLabel>
            <Select
              value={settings.pitch}
              onChange={(e) => handlePitchChange(e.target.value)}
              label={t('settings.voice.tabSettings.azure.pitch')}
            >
              <MenuItem value="x-low">{t('settings.voice.tabSettings.azure.pitchOptions.xLow')}</MenuItem>
              <MenuItem value="low">{t('settings.voice.tabSettings.azure.pitchOptions.low')}</MenuItem>
              <MenuItem value="medium">{t('settings.voice.tabSettings.azure.pitchOptions.medium')}</MenuItem>
              <MenuItem value="high">{t('settings.voice.tabSettings.azure.pitchOptions.high')}</MenuItem>
              <MenuItem value="x-high">{t('settings.voice.tabSettings.azure.pitchOptions.xHigh')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.voice.tabSettings.azure.volume')}</InputLabel>
            <Select
              value={settings.volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              label={t('settings.voice.tabSettings.azure.volume')}
            >
              <MenuItem value="silent">{t('settings.voice.tabSettings.azure.volumeOptions.silent')}</MenuItem>
              <MenuItem value="x-soft">{t('settings.voice.tabSettings.azure.volumeOptions.xSoft')}</MenuItem>
              <MenuItem value="soft">{t('settings.voice.tabSettings.azure.volumeOptions.soft')}</MenuItem>
              <MenuItem value="medium">{t('settings.voice.tabSettings.azure.volumeOptions.medium')}</MenuItem>
              <MenuItem value="loud">{t('settings.voice.tabSettings.azure.volumeOptions.loud')}</MenuItem>
              <MenuItem value="x-loud">{t('settings.voice.tabSettings.azure.volumeOptions.xLoud')}</MenuItem>
            </Select>
          </FormControl>

          {/* 风格选择 - 点击打开全屏选择器 */}
          <TextField
            fullWidth
            label={t('settings.voice.tabSettings.azure.style')}
            value={selectedStyleName}
            onClick={() => setStyleSelectorOpen(true)}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <ChevronRight size={18} />
                </InputAdornment>
              ),
              sx: { cursor: 'pointer' }
            }}
            sx={{ cursor: 'pointer' }}
          />
        </Box>

        <FormControl fullWidth>
          <Typography gutterBottom>{t('settings.voice.tabSettings.azure.styleDegree')}</Typography>
          <Slider
            value={settings.styleDegree}
            min={0.01}
            max={2.0}
            step={0.01}
            onChange={(_, value) => handleStyleDegreeChange(value as number)}
            valueLabelDisplay="auto"
            marks={[
              { value: 0.01, label: '0.01' },
              { value: 1.0, label: '1.0' },
              { value: 2.0, label: '2.0' }
            ]}
          />
          <FormHelperText>
            {t('settings.voice.tabSettings.azure.styleDegreeHelper')}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t('settings.voice.tabSettings.azure.role')}</InputLabel>
          <Select
            value={settings.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            label={t('settings.voice.tabSettings.azure.role')}
          >
            {AZURE_ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {t('settings.voice.tabSettings.azure.roleHelper')}
          </FormHelperText>
        </FormControl>

        <FormControlLabel
          control={
            <CustomSwitch
              checked={settings.useSSML}
              onChange={(e) => handleUseSSMLToggle(e.target.checked)}
            />
          }
          label={t('settings.voice.tabSettings.azure.useSSML')}
        />
        <FormHelperText>
          {t('settings.voice.tabSettings.azure.useSSMLHelper')}
        </FormHelperText>
        </Stack>
      </form>

      {/* 音色全屏选择器 */}
      <FullScreenSelector
        open={voiceSelectorOpen}
        onClose={() => setVoiceSelectorOpen(false)}
        title="选择语音"
        groups={voiceGroups}
        selectedKey={settings.voiceName}
        onSelect={(key) => onSettingsChange({ ...settings, voiceName: key })}
      />

      {/* 风格全屏选择器 */}
      <FullScreenSelector
        open={styleSelectorOpen}
        onClose={() => setStyleSelectorOpen(false)}
        title="选择风格"
        groups={styleGroups}
        selectedKey={settings.style}
        onSelect={(key) => onSettingsChange({ ...settings, style: key })}
      />
    </>
  );
};

export default AzureTTSTab;
