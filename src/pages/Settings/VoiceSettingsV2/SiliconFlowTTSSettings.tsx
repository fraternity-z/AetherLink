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
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TTSService } from '../../../shared/services/TTSService';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';
import { cssVar } from '../../../shared/utils/cssVariables';
import {
  SiliconFlowTTSTab,
  type SiliconFlowTTSSettings as SiliconFlowTTSSettingsType,
} from '../../../components/TTS';
import TTSTestSection from '../../../components/TTS/TTSTestSection';
import CustomSwitch from '../../../components/CustomSwitch';
import { useTranslation } from '../../../i18n';

const SiliconFlowTTSSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ttsService = useMemo(() => TTSService.getInstance(), []);
  
  // 定时器引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 状态管理
  const [settings, setSettings] = useState<SiliconFlowTTSSettingsType>({
    apiKey: '',
    showApiKey: false,
    selectedModel: 'FunAudioLLM/CosyVoice2-0.5B',
    selectedVoice: 'alex',
    useStream: false,
  });

  const [uiState, setUIState] = useState({
    saveError: '',
    isTestPlaying: false,
  });

  const [testText, setTestText] = useState('');
  const [enableTTS, setEnableTTS] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false); // 是否启用此TTS服务

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedApiKey = await getStorageItem<string>('siliconflow_api_key') || '';
        const storedModel = await getStorageItem<string>('tts_model') || 'FunAudioLLM/CosyVoice2-0.5B';
        const storedVoice = await getStorageItem<string>('tts_voice') || 'alex';
        const storedUseStream = (await getStorageItem<string>('siliconflow_tts_stream')) === 'true';
        const storedEnableTTS = (await getStorageItem<string>('enable_tts')) !== 'false';
        const storedSelectedTTSService = await getStorageItem<string>('selected_tts_service') || 'siliconflow';

        setSettings({
          apiKey: storedApiKey,
          showApiKey: false,
          selectedModel: storedModel,
          selectedVoice: storedVoice,
          useStream: storedUseStream,
        });

        setEnableTTS(storedEnableTTS);
        setIsEnabled(storedSelectedTTSService === 'siliconflow');

        // 设置TTSService
        ttsService.setApiKey(storedApiKey);
        ttsService.setUseSiliconFlowStream(storedUseStream);
        if (storedModel && storedVoice) {
          ttsService.setDefaultVoice(storedModel, `${storedModel}:${storedVoice}`);
        }
        // 加载测试文本
        const defaultTestText = t('settings.voice.siliconflow.testText');
        setTestText(defaultTestText);
      } catch (error) {
        console.error(t('settings.voice.common.loadingError', { service: 'SiliconFlow TTS' }), error);
      }
    };

    loadSettings();
  }, [ttsService, t]);

  // 保存配置
  const saveConfig = useCallback((): boolean => {
    try {
      // 验证必要字段
      if (isEnabled && !settings.apiKey.trim()) {
        setUIState(prev => ({
          ...prev,
          saveError: t('settings.voice.siliconflow.apiKeyRequired'),
        }));
        return false;
      }

      // 保存设置到存储
      setStorageItem('siliconflow_api_key', settings.apiKey);
      setStorageItem('tts_model', settings.selectedModel);
      setStorageItem('tts_voice', settings.selectedVoice);
      setStorageItem('siliconflow_tts_stream', settings.useStream.toString());
      setStorageItem('enable_tts', enableTTS.toString());
      setStorageItem('use_capacitor_tts', 'false');

      // 只有启用时才设置为当前服务
      if (isEnabled) {
        setStorageItem('selected_tts_service', 'siliconflow');
        // 禁用其他TTS服务
        setStorageItem('use_openai_tts', 'false');
        setStorageItem('use_azure_tts', 'false');
      }

      // 更新TTSService
      ttsService.setApiKey(settings.apiKey);
      ttsService.setUseSiliconFlowStream(settings.useStream);
      ttsService.setDefaultVoice(settings.selectedModel, `${settings.selectedModel}:${settings.selectedVoice}`);

      if (isEnabled) {
        ttsService.setUseOpenAI(false);
        ttsService.setUseAzure(false);
        ttsService.setUseCapacitorTTS(false);
      }

      // 清除错误信息
      setUIState(prev => ({
        ...prev,
        saveError: '',
      }));

      return true;
    } catch (error) {
      console.error(t('settings.voice.common.saveErrorText', { service: 'SiliconFlow TTS' }), error);
      setUIState(prev => ({
        ...prev,
        saveError: t('settings.voice.common.saveError'),
      }));
      return false;
    }
  }, [settings, enableTTS, isEnabled, ttsService, t]);

  // 手动保存
  const handleSave = useCallback(() => {
    if (saveConfig()) {
      // 保存成功后返回上级页面
      setTimeout(() => {
        navigate('/settings/voice');
      }, 0);
    }
  }, [saveConfig, navigate]);

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

    // 设置为使用硅基流动TTS
    ttsService.setUseOpenAI(false);
    ttsService.setUseAzure(false);
    ttsService.setUseCapacitorTTS(false);
    ttsService.setApiKey(settings.apiKey);
    ttsService.setUseSiliconFlowStream(settings.useStream);
    ttsService.setDefaultVoice(settings.selectedModel, `${settings.selectedModel}:${settings.selectedVoice}`);

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
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: bgDefault,
      color: textPrimary
    }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
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
            {t('settings.voice.siliconflow.title')}
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
                label={t('settings.voice.common.enableService', { name: t('settings.voice.services.siliconflow.name') })}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                {t('settings.voice.siliconflow.enableDesc')}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <SiliconFlowTTSTab
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
            selectedTTSService="siliconflow"
            openaiApiKey=""
            azureApiKey=""
            siliconFlowApiKey={settings.apiKey}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SiliconFlowTTSSettings;
