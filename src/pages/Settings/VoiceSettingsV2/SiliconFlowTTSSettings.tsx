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
  Volume2,
  Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { TTSService } from '../../../shared/services/TTSService';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';
import {
  SiliconFlowTTSTab,
  type SiliconFlowTTSSettings as SiliconFlowTTSSettingsType,
} from '../../../components/TTS';
import TTSTestSection from '../../../components/TTS/TTSTestSection';
import CustomSwitch from '../../../components/CustomSwitch';

const SiliconFlowTTSSettings: React.FC = () => {
  const navigate = useNavigate();
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

  const [testText, setTestText] = useState('你好，我是硅基流动语音合成服务，感谢你的使用！');
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
      } catch (error) {
        console.error('加载硅基流动TTS设置失败:', error);
      }
    };

    loadSettings();
  }, [ttsService]);

  // 保存配置
  const saveConfig = useCallback((): boolean => {
    try {
      // 验证必要字段
      if (isEnabled && !settings.apiKey.trim()) {
        setUIState(prev => ({
          ...prev,
          saveError: '启用服务时API密钥不能为空',
        }));
        return false;
      }

      // 保存设置到存储
      setStorageItem('siliconflow_api_key', settings.apiKey);
      setStorageItem('tts_model', settings.selectedModel);
      setStorageItem('tts_voice', settings.selectedVoice);
      setStorageItem('siliconflow_tts_stream', settings.useStream.toString());
      setStorageItem('enable_tts', enableTTS.toString());

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
      }

      // 清除错误信息
      setUIState(prev => ({
        ...prev,
        saveError: '',
      }));

      return true;
    } catch (error) {
      console.error('保存硅基流动TTS设置失败:', error);
      setUIState(prev => ({
        ...prev,
        saveError: '保存设置失败，请重试',
      }));
      return false;
    }
  }, [settings, enableTTS, isEnabled, ttsService]);

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
            硅基流动 TTS 设置
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
                label="启用硅基流动 TTS 服务"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                启用后，此服务将成为默认的文本转语音服务。启用其他TTS服务会自动禁用此服务。
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
