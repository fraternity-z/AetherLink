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
import { alpha } from '@mui/material/styles';
import { TTSService } from '../../../shared/services/TTSService';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';
import {
  AzureTTSTab,
  type AzureTTSSettings as AzureTTSSettingsType,
} from '../../../components/TTS';
import TTSTestSection from '../../../components/TTS/TTSTestSection';
import CustomSwitch from '../../../components/CustomSwitch';

const AzureTTSSettings: React.FC = () => {
  const navigate = useNavigate();
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
        console.error('加载Azure TTS设置失败:', error);
      }
    };

    loadSettings();
  }, [ttsService]);

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
      } else {
        ttsService.setUseAzure(false);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 保存成功后返回上级页面
      setTimeout(() => {
        navigate('/settings/voice');
      }, 0);


    } catch (error) {
      console.error('保存Azure TTS设置失败:', error);
      setUIState(prev => ({
        ...prev,
        saveError: '保存设置失败，请重试',
      }));
    }
  }, [settings, enableTTS, isEnabled, ttsService]);

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

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.8)',
          '@media (prefers-color-scheme: dark)': {
            background: 'rgba(18, 18, 18, 0.8)',
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2, md: 3 } }}>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="返回"
            size="large"
            sx={{
              color: 'primary.main',
              mr: { xs: 1, sm: 2 },
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            微软Azure TTS 设置
          </Typography>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              borderRadius: 2,
              px: 3,
            }}
          >
            保存
          </Button>
        </Toolbar>
      </AppBar>

      {/* 可滚动的内容区域 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mt: 8,
          bgcolor: (theme) => theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.02)
            : alpha(theme.palette.background.default, 0.9),
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
          }}
        >
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
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              background: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              API配置
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
                label="启用微软Azure TTS 服务"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                启用后，此服务将成为默认的文本转语音服务。启用其他TTS服务会自动禁用此服务。
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
    </Box>
  );
};

export default AzureTTSSettings;
