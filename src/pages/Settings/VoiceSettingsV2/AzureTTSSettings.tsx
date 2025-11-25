import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  Button,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TTSService } from '../../../shared/services/TTSService';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';
import { cssVar } from '../../../shared/utils/cssVariables';
import {
  AzureTTSTab,
  type AzureTTSSettings as AzureTTSSettingsType,
} from '../../../components/TTS';
import TTSTestSection from '../../../components/TTS/TTSTestSection';
import CustomSwitch from '../../../components/CustomSwitch';
import { useTranslation } from '../../../i18n';
import { SafeAreaContainer } from '../../../components/settings/SettingComponents';

const AzureTTSSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ttsService = useMemo(() => TTSService.getInstance(), []);
  
  // 定时器引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 状态管理
  const [settings, setSettings] = useState<AzureTTSSettingsType>({
    apiKey: '',
    showApiKey: false,
    region: 'eastus',
    voiceName: 'zh-CN-XiaoxiaoNeural',
    language: 'zh-CN',
    outputFormat: 'audio-24khz-160kbitrate-mono-mp3',
    rate: 'medium',
    pitch: 'medium',
    volume: 'medium',
    style: 'general',
    styleDegree: 1.0,
    role: 'default',
    useSSML: true,
  });

  const [uiState, setUIState] = useState({
    saveError: '',
    isTestPlaying: false,
  });

  const [testText, setTestText] = useState('你好，我是微软Azure语音合成服务，感谢你的使用！');
  const [enableTTS, setEnableTTS] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedAzureApiKey = await getStorageItem<string>('azure_tts_api_key') || '';
        const storedAzureRegion = await getStorageItem<string>('azure_tts_region') || 'eastus';
        const storedAzureVoiceName = await getStorageItem<string>('azure_tts_voice') || 'zh-CN-XiaoxiaoNeural';
        const storedAzureLanguage = await getStorageItem<string>('azure_tts_language') || 'zh-CN';
        const storedAzureOutputFormat = await getStorageItem<string>('azure_tts_format') || 'audio-24khz-160kbitrate-mono-mp3';
        const storedAzureRate = await getStorageItem<string>('azure_tts_rate') || 'medium';
        const storedAzurePitch = await getStorageItem<string>('azure_tts_pitch') || 'medium';
        const storedAzureVolume = await getStorageItem<string>('azure_tts_volume') || 'medium';
        const storedAzureStyle = await getStorageItem<string>('azure_tts_style') || 'general';
        const storedAzureStyleDegree = parseFloat(await getStorageItem<string>('azure_tts_style_degree') || '1.0');
        const storedAzureRole = await getStorageItem<string>('azure_tts_role') || 'default';
        const storedAzureUseSSML = (await getStorageItem<string>('azure_tts_use_ssml')) !== 'false';
        const storedEnableTTS = (await getStorageItem<string>('enable_tts')) !== 'false';
        const storedSelectedTTSService = await getStorageItem<string>('selected_tts_service') || 'siliconflow';

        setSettings({
          apiKey: storedAzureApiKey,
          showApiKey: false,
          region: storedAzureRegion,
          voiceName: storedAzureVoiceName,
          language: storedAzureLanguage,
          outputFormat: storedAzureOutputFormat,
          rate: storedAzureRate,
          pitch: storedAzurePitch,
          volume: storedAzureVolume,
          style: storedAzureStyle,
          styleDegree: storedAzureStyleDegree,
          role: storedAzureRole,
          useSSML: storedAzureUseSSML,
        });

        setEnableTTS(storedEnableTTS);
        setIsEnabled(storedSelectedTTSService === 'azure');

        // 设置TTSService
        ttsService.setAzureApiKey(storedAzureApiKey);
        ttsService.setAzureRegion(storedAzureRegion);
        ttsService.setAzureVoiceName(storedAzureVoiceName);
        ttsService.setAzureLanguage(storedAzureLanguage);
        ttsService.setAzureOutputFormat(storedAzureOutputFormat);
        ttsService.setAzureRate(storedAzureRate);
        ttsService.setAzurePitch(storedAzurePitch);
        ttsService.setAzureVolume(storedAzureVolume);
        ttsService.setAzureStyle(storedAzureStyle);
        ttsService.setAzureStyleDegree(storedAzureStyleDegree);
        ttsService.setAzureRole(storedAzureRole);
        ttsService.setAzureUseSSML(storedAzureUseSSML);
      } catch (error) {
        console.error(t('settings.voice.common.loadingError', { service: 'Azure TTS' }), error);
      }
    };

    loadSettings();
  }, [ttsService, t]);

  // 保存设置
  const handleSave = useCallback(async () => {
    try {
      await setStorageItem('azure_tts_api_key', settings.apiKey);
      await setStorageItem('azure_tts_region', settings.region);
      await setStorageItem('azure_tts_voice', settings.voiceName);
      await setStorageItem('azure_tts_language', settings.language);
      await setStorageItem('azure_tts_format', settings.outputFormat);
      await setStorageItem('azure_tts_rate', settings.rate);
      await setStorageItem('azure_tts_pitch', settings.pitch);
      await setStorageItem('azure_tts_volume', settings.volume);
      await setStorageItem('azure_tts_style', settings.style);
      await setStorageItem('azure_tts_style_degree', settings.styleDegree.toString());
      await setStorageItem('azure_tts_role', settings.role);
      await setStorageItem('azure_tts_use_ssml', settings.useSSML.toString());
      await setStorageItem('enable_tts', enableTTS.toString());
      await setStorageItem('use_capacitor_tts', 'false');

      // 只有启用时才设置为当前服务
      if (isEnabled) {
        await setStorageItem('selected_tts_service', 'azure');
        await setStorageItem('use_azure_tts', 'true');
        // 禁用其他TTS服务
        await setStorageItem('use_openai_tts', 'false');
      } else {
        await setStorageItem('use_azure_tts', 'false');
      }

      // 更新TTSService
      ttsService.setAzureApiKey(settings.apiKey);
      ttsService.setAzureRegion(settings.region);
      ttsService.setAzureVoiceName(settings.voiceName);
      ttsService.setAzureLanguage(settings.language);
      ttsService.setAzureOutputFormat(settings.outputFormat);
      ttsService.setAzureRate(settings.rate);
      ttsService.setAzurePitch(settings.pitch);
      ttsService.setAzureVolume(settings.volume);
      ttsService.setAzureStyle(settings.style);
      ttsService.setAzureStyleDegree(settings.styleDegree);
      ttsService.setAzureRole(settings.role);
      ttsService.setAzureUseSSML(settings.useSSML);

      if (isEnabled) {
        ttsService.setUseAzure(true);
        ttsService.setUseOpenAI(false);
        ttsService.setUseCapacitorTTS(false);
      } else {
        ttsService.setUseAzure(false);
        ttsService.setUseCapacitorTTS(false);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 保存成功后返回上级页面
      setTimeout(() => {
        navigate('/settings/voice');
      }, 0);


    } catch (error) {
      console.error(t('settings.voice.common.saveErrorText', { service: 'Azure TTS' }), error);
      setUIState(prev => ({
        ...prev,
        saveError: t('settings.voice.common.saveError'),
      }));
    }
  }, [settings, enableTTS, isEnabled, ttsService, navigate, t]);

  // 处理启用状态变化
  const handleEnableChange = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  // 测试TTS
  const handleTestTTS = useCallback(async () => {
    if (uiState.isTestPlaying) {
      ttsService.stop();
      if (playCheckIntervalRef.current) {
        clearInterval(playCheckIntervalRef.current);
      }
      setUIState(prev => ({ ...prev, isTestPlaying: false }));
      return;
    }

    setUIState(prev => ({ ...prev, isTestPlaying: true }));

    // 设置为使用Azure TTS
    ttsService.setUseAzure(true);
    ttsService.setUseOpenAI(false);
    ttsService.setUseCapacitorTTS(false);
    ttsService.setAzureApiKey(settings.apiKey);
    ttsService.setAzureRegion(settings.region);
    ttsService.setAzureVoiceName(settings.voiceName);
    ttsService.setAzureLanguage(settings.language);
    ttsService.setAzureOutputFormat(settings.outputFormat);
    ttsService.setAzureRate(settings.rate);
    ttsService.setAzurePitch(settings.pitch);
    ttsService.setAzureVolume(settings.volume);
    ttsService.setAzureStyle(settings.style);
    ttsService.setAzureStyleDegree(settings.styleDegree);
    ttsService.setAzureRole(settings.role);
    ttsService.setAzureUseSSML(settings.useSSML);

    const success = await ttsService.speak(testText);

    if (!success) {
      setUIState(prev => ({ ...prev, isTestPlaying: false }));
    }

    if (playCheckIntervalRef.current) {
      clearInterval(playCheckIntervalRef.current);
    }

    const checkPlaybackStatus = () => {
      if (!ttsService.getIsPlaying()) {
        setUIState(prev => ({ ...prev, isTestPlaying: false }));
        if (playCheckIntervalRef.current) {
          clearInterval(playCheckIntervalRef.current);
          playCheckIntervalRef.current = null;
        }
      } else {
        playCheckIntervalRef.current = setTimeout(checkPlaybackStatus, 1000);
      }
    };

    setTimeout(checkPlaybackStatus, 1000);
  }, [uiState.isTestPlaying, settings, testText, ttsService]);

  const handleBack = () => {
    navigate('/settings/voice');
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (playCheckIntervalRef.current) {
        clearInterval(playCheckIntervalRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (uiState.isTestPlaying) {
        ttsService.stop();
      }
    };
  }, [uiState.isTestPlaying, ttsService]);

  // 获取主题变量
  const toolbarBg = cssVar('toolbar-bg');
  const toolbarBorder = cssVar('toolbar-border');
  const toolbarShadow = cssVar('toolbar-shadow');
  const textPrimary = cssVar('text-primary');
  const borderDefault = cssVar('border-default');
  const borderSubtle = cssVar('border-subtle');
  const hoverBg = cssVar('hover-bg');
  const bgPaper = cssVar('bg-paper');
  const bgDefault = cssVar('bg-default');
  const primaryColor = cssVar('primary');

  return (
    <SafeAreaContainer sx={{
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: bgDefault,
    }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: toolbarBg,
          color: textPrimary,
          borderBottom: `1px solid ${toolbarBorder}`,
          boxShadow: `0 18px 40px -24px ${toolbarShadow}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2.5, md: 4 }, gap: { xs: 1, sm: 1.5 } }}>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label={t('settings.voice.back')}
            size="large"
            sx={{
              color: primaryColor,
              mr: { xs: 1, sm: 2 },
              borderRadius: 2,
              border: `1px solid ${borderSubtle}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: hoverBg,
                transform: 'translateY(-1px)',
              },
              '&:focus-visible': {
                outline: `2px solid ${primaryColor}`,
                outlineOffset: '2px',
              },
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {t('settings.voice.azure.title')}
          </Typography>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: { xs: 2.5, sm: 3 },
              py: { xs: 0.9, sm: 1 },
              fontWeight: 700,
            }}
          >
            {t('settings.voice.common.save')}
          </Button>
        </Toolbar>
      </AppBar>

      {/* 可滚动的内容区域 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          pt: { xs: 8, sm: 9 },
          pb: { xs: 2, sm: 3 },
          px: { xs: 1.5, sm: 2.5, md: 4 },
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: toolbarShadow,
            borderRadius: 3,
            border: `1px solid ${borderSubtle}`,
          },
        }}
      >
        <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%' }}>
          {/* 错误提示 */}
          {uiState.saveError && (
            <Alert
              severity="error"
              sx={{
                mb: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 1, sm: 2 },
              }}
            >
              {uiState.saveError}
            </Alert>
          )}

          {/* 配置区域 */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              mb: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, sm: 2.5 },
              border: `1px solid ${borderDefault}`,
              bgcolor: bgPaper,
              boxShadow: `0 18px 40px -28px ${toolbarShadow}`,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              {t('settings.voice.common.apiConfig')}
            </Typography>

            {/* 启用开关 */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={isEnabled}
                    onChange={(e) => handleEnableChange(e.target.checked)}
                  />
                }
                label={t('settings.voice.common.enableService', { name: t('settings.voice.services.azure.name') })}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                {t('settings.voice.azure.enableDesc')}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <AzureTTSTab
              settings={settings}
              onSettingsChange={setSettings}
            />
          </Paper>

          {/* 测试区域 */}
          <TTSTestSection
            testText={testText}
            setTestText={setTestText}
            handleTestTTS={handleTestTTS}
            isTestPlaying={uiState.isTestPlaying}
            enableTTS={enableTTS}
            selectedTTSService="azure"
            openaiApiKey=""
            azureApiKey={settings.apiKey}
            siliconFlowApiKey=""
          />
        </Box>
      </Box>
    </SafeAreaContainer>
  );
};

export default AzureTTSSettings;
