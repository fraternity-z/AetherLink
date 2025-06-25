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
  OpenAITTSTab,
  type OpenAITTSSettings as OpenAITTSSettingsType,
} from '../../../components/TTS';
import TTSTestSection from '../../../components/TTS/TTSTestSection';
import CustomSwitch from '../../../components/CustomSwitch';

const OpenAITTSSettings: React.FC = () => {
  const navigate = useNavigate();
  const ttsService = useMemo(() => TTSService.getInstance(), []);
  
  // 定时器引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 状态管理
  const [settings, setSettings] = useState<OpenAITTSSettingsType>({
    apiKey: '',
    showApiKey: false,
    selectedModel: 'tts-1',
    selectedVoice: 'alloy',
    selectedFormat: 'mp3',
    speed: 1.0,
    useStream: false,
  });

  const [uiState, setUIState] = useState({
    isSaved: false,
    saveError: '',
    isTestPlaying: false,
  });

  const [testText, setTestText] = useState('你好，我是OpenAI语音合成服务，感谢你的使用！');
  const [enableTTS, setEnableTTS] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedOpenaiApiKey = await getStorageItem<string>('openai_tts_api_key') || '';
        const storedOpenaiModel = await getStorageItem<string>('openai_tts_model') || 'tts-1';
        const storedOpenaiVoice = await getStorageItem<string>('openai_tts_voice') || 'alloy';
        const storedOpenaiFormat = await getStorageItem<string>('openai_tts_format') || 'mp3';
        const storedOpenaiSpeed = Number(await getStorageItem<string>('openai_tts_speed') || '1.0');
        const storedUseOpenaiStream = (await getStorageItem<string>('openai_tts_stream')) === 'true';
        const storedEnableTTS = (await getStorageItem<string>('enable_tts')) !== 'false';
        const storedSelectedTTSService = await getStorageItem<string>('selected_tts_service') || 'siliconflow';

        setSettings({
          apiKey: storedOpenaiApiKey,
          showApiKey: false,
          selectedModel: storedOpenaiModel,
          selectedVoice: storedOpenaiVoice,
          selectedFormat: storedOpenaiFormat,
          speed: storedOpenaiSpeed,
          useStream: storedUseOpenaiStream,
        });

        setEnableTTS(storedEnableTTS);
        setIsEnabled(storedSelectedTTSService === 'openai');

        // 设置TTSService
        ttsService.setOpenAIApiKey(storedOpenaiApiKey);
        ttsService.setOpenAIModel(storedOpenaiModel);
        ttsService.setOpenAIVoice(storedOpenaiVoice);
        ttsService.setOpenAIResponseFormat(storedOpenaiFormat);
        ttsService.setOpenAISpeed(storedOpenaiSpeed);
        ttsService.setUseOpenAIStream(storedUseOpenaiStream);
      } catch (error) {
        console.error('加载OpenAI TTS设置失败:', error);
      }
    };

    loadSettings();
  }, [ttsService]);

  // 保存设置
  const handleSave = useCallback(async () => {
    try {
      await setStorageItem('openai_tts_api_key', settings.apiKey);
      await setStorageItem('openai_tts_model', settings.selectedModel);
      await setStorageItem('openai_tts_voice', settings.selectedVoice);
      await setStorageItem('openai_tts_format', settings.selectedFormat);
      await setStorageItem('openai_tts_speed', settings.speed.toString());
      await setStorageItem('openai_tts_stream', settings.useStream.toString());
      await setStorageItem('enable_tts', enableTTS.toString());

      // 只有启用时才设置为当前服务
      if (isEnabled) {
        await setStorageItem('selected_tts_service', 'openai');
        await setStorageItem('use_openai_tts', 'true');
        // 禁用其他TTS服务
        await setStorageItem('use_azure_tts', 'false');
      } else {
        await setStorageItem('use_openai_tts', 'false');
      }

      // 更新TTSService
      ttsService.setOpenAIApiKey(settings.apiKey);
      ttsService.setOpenAIModel(settings.selectedModel);
      ttsService.setOpenAIVoice(settings.selectedVoice);
      ttsService.setOpenAIResponseFormat(settings.selectedFormat);
      ttsService.setOpenAISpeed(settings.speed);
      ttsService.setUseOpenAIStream(settings.useStream);

      if (isEnabled) {
        ttsService.setUseOpenAI(true);
        ttsService.setUseAzure(false);
      } else {
        ttsService.setUseOpenAI(false);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 保存成功后返回上级页面
      setTimeout(() => {
        navigate('/settings/voice');
      }, 0);


    } catch (error) {
      console.error('保存OpenAI TTS设置失败:', error);
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

    // 设置为使用OpenAI TTS
    ttsService.setUseOpenAI(true);
    ttsService.setUseAzure(false);
    ttsService.setOpenAIApiKey(settings.apiKey);
    ttsService.setOpenAIModel(settings.selectedModel);
    ttsService.setOpenAIVoice(settings.selectedVoice);
    ttsService.setOpenAIResponseFormat(settings.selectedFormat);
    ttsService.setOpenAISpeed(settings.speed);
    ttsService.setUseOpenAIStream(settings.useStream);

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
            OpenAI TTS 设置
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
          {/* 保存结果提示 */}
          {uiState.isSaved && (
            <Alert
              severity="success"
              sx={{
                mb: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 1, sm: 2 },
              }}
            >
              设置已保存成功
            </Alert>
          )}

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
                label="启用 OpenAI TTS 服务"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                启用后，此服务将成为默认的文本转语音服务。启用其他TTS服务会自动禁用此服务。
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <OpenAITTSTab
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
            selectedTTSService="openai"
            openaiApiKey={settings.apiKey}
            azureApiKey=""
            siliconFlowApiKey=""
          />
        </Box>
      </Box>
    </Box>
  );
};

export default OpenAITTSSettings;
