import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  ArrowLeft,
  Mic,
  Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';
import { useVoiceRecognition } from '../../../shared/hooks/useVoiceRecognition';
import { voiceRecognitionService } from '../../../shared/services/VoiceRecognitionService';
import CustomSwitch from '../../../components/CustomSwitch';
import type { VoiceRecognitionSettings } from '../../../shared/types/voice';

const CapacitorASRSettings: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [settings, setSettings] = useState<VoiceRecognitionSettings>({
    enabled: true,
    language: 'zh-CN',
    autoStart: false,
    silenceTimeout: 2000,
    maxResults: 5,
    partialResults: true,
    permissionStatus: 'unknown',
    provider: 'capacitor',
  });

  const [uiState, setUIState] = useState({
    saveError: '',
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 引入语音识别hook
  const {
    isListening,
    recognitionText,
    permissionStatus,
    error,
    startRecognition,
    stopRecognition,
  } = useVoiceRecognition();

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSpeechRecognitionEnabled = (await getStorageItem<string>('speech_recognition_enabled')) !== 'false';
        const storedSpeechRecognitionLanguage = await getStorageItem<string>('speech_recognition_language') || 'zh-CN';
        const storedSpeechRecognitionAutoStart = (await getStorageItem<string>('speech_recognition_auto_start')) === 'true';
        const storedSpeechRecognitionSilenceTimeout = Number(await getStorageItem<string>('speech_recognition_silence_timeout') || '2000');
        const storedSpeechRecognitionMaxResults = Number(await getStorageItem<string>('speech_recognition_max_results') || '5');
        const storedSpeechRecognitionPartialResults = (await getStorageItem<string>('speech_recognition_partial_results')) !== 'false';

        setSettings({
          enabled: storedSpeechRecognitionEnabled,
          language: storedSpeechRecognitionLanguage,
          autoStart: storedSpeechRecognitionAutoStart,
          silenceTimeout: storedSpeechRecognitionSilenceTimeout,
          maxResults: storedSpeechRecognitionMaxResults,
          partialResults: storedSpeechRecognitionPartialResults,
          permissionStatus: 'unknown',
          provider: 'capacitor',
        });
      } catch (error) {
        console.error('加载Capacitor ASR设置失败:', error);
      }
    };

    loadSettings();
  }, []);

  // 保存设置
  const handleSave = useCallback(async () => {
    try {
      await setStorageItem('speech_recognition_enabled', settings.enabled.toString());
      await setStorageItem('speech_recognition_language', settings.language);
      await setStorageItem('speech_recognition_auto_start', settings.autoStart.toString());
      await setStorageItem('speech_recognition_silence_timeout', settings.silenceTimeout.toString());
      await setStorageItem('speech_recognition_max_results', settings.maxResults.toString());
      await setStorageItem('speech_recognition_partial_results', settings.partialResults.toString());
      await setStorageItem('speech_recognition_provider', 'capacitor');

      // 保存成功后返回上级页面
      setTimeout(() => {
        navigate('/settings/voice');
      }, 0);

    } catch (error) {
      console.error('保存Capacitor ASR设置失败:', error);
      setUIState(prev => ({
        ...prev,
        saveError: '保存设置失败，请重试',
      }));
    }
  }, [settings, navigate]);



  // 检查并请求麦克风权限
  const checkAndRequestPermissions = async () => {
    try {
      const result = await voiceRecognitionService.requestPermissions();
      console.log('权限状态:', result);
    } catch (error) {
      console.error('请求权限失败:', error);
    }
  };

  const handleBack = () => {
    navigate('/settings/voice');
  };

  const handleSettingsChange = (key: keyof VoiceRecognitionSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
            Capacitor 语音识别设置
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
              语音识别配置
            </Typography>

            {/* 启用开关 */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={settings.enabled}
                    onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
                  />
                }
                label="启用语音识别功能"
              />
            </Box>

            {/* 语言选择 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>默认语言</InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => handleSettingsChange('language', e.target.value)}
                label="默认语言"
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
              >
                <MenuItem value="zh-CN">中文 (普通话)</MenuItem>
                <MenuItem value="en-US">English (US)</MenuItem>
                <MenuItem value="ja-JP">日本語</MenuItem>
                <MenuItem value="ko-KR">한국어</MenuItem>
                <MenuItem value="fr-FR">Français</MenuItem>
                <MenuItem value="de-DE">Deutsch</MenuItem>
                <MenuItem value="es-ES">Español</MenuItem>
              </Select>
              <FormHelperText>选择语音识别的默认语言。</FormHelperText>
            </FormControl>

            {/* 自动开始 */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={settings.autoStart}
                    onChange={(e) => handleSettingsChange('autoStart', e.target.checked)}
                  />
                }
                label="自动开始识别"
              />
              <FormHelperText>启用后，打开聊天页面时会自动开始语音识别。</FormHelperText>
            </Box>

            {/* 部分结果 */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={settings.partialResults}
                    onChange={(e) => handleSettingsChange('partialResults', e.target.checked)}
                  />
                }
                label="显示部分识别结果"
              />
              <FormHelperText>启用后，会实时显示语音识别的中间结果。</FormHelperText>
            </Box>

            {/* 权限状态 */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              权限状态: {permissionStatus}
            </Typography>

            {/* 权限请求按钮 */}
            <Button
              variant="outlined"
              onClick={checkAndRequestPermissions}
              sx={{ mb: 3 }}
            >
              检查并请求麦克风权限
            </Button>
          </Paper>

          {/* 测试区域 */}
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
              语音识别测试
            </Typography>

            {/* 测试按钮 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant={isListening ? "outlined" : "contained"}
                startIcon={isListening ? <Square size={16} /> : <Mic size={16} />}
                onClick={isListening ? stopRecognition : startRecognition}
                disabled={!settings.enabled}
                color={isListening ? "error" : "primary"}
              >
                {isListening ? '停止识别' : '开始识别'}
              </Button>
            </Box>

            {/* 识别结果 */}
            {recognitionText && (
              <Alert severity="info" sx={{ mb: 3 }}>
                实时识别结果: {recognitionText}
              </Alert>
            )}

            {/* 错误信息 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                语音识别错误: {error.message || '未知错误'}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary">
              点击"开始识别"按钮测试语音识别功能。请确保已授予麦克风权限。
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CapacitorASRSettings;
