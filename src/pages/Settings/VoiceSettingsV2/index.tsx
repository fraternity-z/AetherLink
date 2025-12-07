import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  ListItemButton,
  Chip
} from '@mui/material';
import {
  ArrowLeft,
  Volume2,
  Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { getStorageItem } from '../../../shared/utils/storage';
import { useTranslation } from '../../../i18n';
import { cssVar } from '../../../shared/utils/cssVariables';
import useScrollPosition from '../../../hooks/useScrollPosition';
import { SafeAreaContainer } from '../../../components/settings/SettingComponents';

// TTS服务配置 - 将在组件内使用 i18n
const getTTSServices = (t: any) => [
  {
    id: 'capacitor',
    name: t('settings.voice.services.capacitorTTS.name'),
    description: t('settings.voice.services.capacitorTTS.description'),
    icon: '📱',
    color: '#F59E0B',
    features: t('settings.voice.services.capacitorTTS.features', { returnObjects: true }),
    status: 'free',
    path: '/settings/voice/tts/capacitor'
  },
  {
    id: 'siliconflow',
    name: t('settings.voice.services.siliconflow.name'),
    description: t('settings.voice.services.siliconflow.description'),
    icon: '🚀',
    color: '#9333EA',
    features: t('settings.voice.services.siliconflow.features', { returnObjects: true }),
    status: 'recommended',
    path: '/settings/voice/tts/siliconflow'
  },
  {
    id: 'openai',
    name: t('settings.voice.services.openai.name'),
    description: t('settings.voice.services.openai.description'),
    icon: '🤖',
    color: '#10B981',
    features: t('settings.voice.services.openai.features', { returnObjects: true }),
    status: 'premium',
    path: '/settings/voice/tts/openai'
  },
  {
    id: 'azure',
    name: t('settings.voice.services.azure.name'),
    description: t('settings.voice.services.azure.description'),
    icon: '☁️',
    color: '#3B82F6',
    features: t('settings.voice.services.azure.features', { returnObjects: true }),
    status: 'enterprise',
    path: '/settings/voice/tts/azure'
  },
  {
    id: 'gemini',
    name: t('settings.voice.services.gemini.name'),
    description: t('settings.voice.services.gemini.description'),
    icon: '✨',
    color: '#EA4335',
    features: t('settings.voice.services.gemini.features', { returnObjects: true }),
    status: 'premium',
    path: '/settings/voice/tts/gemini'
  },
  {
    id: 'elevenlabs',
    name: t('settings.voice.services.elevenlabs.name'),
    description: t('settings.voice.services.elevenlabs.description'),
    icon: '🎙️',
    color: '#00C7B7',
    features: t('settings.voice.services.elevenlabs.features', { returnObjects: true }),
    status: 'premium',
    path: '/settings/voice/tts/elevenlabs'
  },
  {
    id: 'minimax',
    name: t('settings.voice.services.minimax.name'),
    description: t('settings.voice.services.minimax.description'),
    icon: '🐉',
    color: '#FF6B35',
    features: t('settings.voice.services.minimax.features', { returnObjects: true }),
    status: 'premium',
    path: '/settings/voice/tts/minimax'
  },
  {
    id: 'volcano',
    name: t('settings.voice.services.volcano.name'),
    description: t('settings.voice.services.volcano.description'),
    icon: '🌋',
    color: '#FF4500',
    features: t('settings.voice.services.volcano.features', { returnObjects: true }),
    status: 'free',
    path: '/settings/voice/tts/volcano'
  }
];

// ASR服务配置 - 将在组件内使用 i18n
const getASRServices = (t: any) => [
  {
    id: 'capacitor',
    name: t('settings.voice.services.capacitor.name'),
    description: t('settings.voice.services.capacitor.description'),
    icon: '📱',
    color: '#F59E0B',
    features: t('settings.voice.services.capacitor.features', { returnObjects: true }),
    status: 'free',
    path: '/settings/voice/asr/capacitor'
  },
  {
    id: 'openai-whisper',
    name: t('settings.voice.services.openaiWhisper.name'),
    description: t('settings.voice.services.openaiWhisper.description'),
    icon: '🎯',
    color: '#EF4444',
    features: t('settings.voice.services.openaiWhisper.features', { returnObjects: true }),
    status: 'premium',
    path: '/settings/voice/asr/openai-whisper'
  }
];

// 状态标签配置 - 将在组件内使用 i18n
const getStatusConfig = (t: any) => ({
  recommended: { label: t('settings.voice.status.recommended'), color: 'primary' as const },
  premium: { label: t('settings.voice.status.premium'), color: 'warning' as const },
  enterprise: { label: t('settings.voice.status.enterprise'), color: 'info' as const },
  free: { label: t('settings.voice.status.free'), color: 'success' as const }
});

const VoiceSettingsV2: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0); // 0: TTS, 1: ASR
  const [currentTTSService, setCurrentTTSService] = useState<string>('siliconflow');
  const [currentASRService, setCurrentASRService] = useState<string>('capacitor');

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-voice', {
    autoRestore: true,
    restoreDelay: 0
  });

  const toolbarBg = cssVar('toolbar-bg');
  const toolbarBorder = cssVar('toolbar-border');
  const toolbarShadow = cssVar('toolbar-shadow');
  const textPrimary = cssVar('text-primary');
  const textSecondary = cssVar('text-secondary');
  const borderDefault = cssVar('border-default');
  const borderSubtle = cssVar('border-subtle');
  const hoverBg = cssVar('hover-bg');
  const bgPaper = cssVar('bg-paper');
  const bgElevated = cssVar('bg-elevated');
  const primaryColor = cssVar('primary');

  // 使用 useMemo 缓存服务配置，避免每次渲染重新计算
  const ttsServices = useMemo(() => getTTSServices(t), [t]);
  const asrServices = useMemo(() => getASRServices(t), [t]);
  const statusConfig = useMemo(() => getStatusConfig(t), [t]);

  // 提取 loadCurrentServices 到 useEffect 外部
  const loadCurrentServices = useCallback(async () => {
    try {
      const selectedTTSService = await getStorageItem<string>('selected_tts_service') || 'siliconflow';
      const selectedASRService = await getStorageItem<string>('speech_recognition_provider') || 'capacitor';

      setCurrentTTSService(selectedTTSService);
      setCurrentASRService(selectedASRService);
    } catch (error) {
      console.error(t('settings.voice.common.loadingError', { service: 'current service status' }), error);
    }
  }, [t]);

  // 加载当前服务状态
  useEffect(() => {
    loadCurrentServices();

    // 监听页面焦点变化，重新加载状态
    window.addEventListener('focus', loadCurrentServices);
    return () => window.removeEventListener('focus', loadCurrentServices);
  }, [loadCurrentServices]);

  const handleBack = () => {
    navigate('/settings');
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleServiceClick = (path: string) => {
    navigate(path);
  };

  // 页面可见性变化时重新加载状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时重新加载状态
        loadCurrentServices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadCurrentServices]);

  const currentServices = activeTab === 0 ? ttsServices : asrServices;

  return (
    <SafeAreaContainer>
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
              transition: 'all 0.2s ease-in-out',
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
            {t('settings.voice.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 可滚动的内容区域 */}
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          pt: 2,
          // 使用全局统一的底部 padding 变量
          pb: 'var(--content-bottom-padding)',
          px: { xs: 1, sm: 2, md: 3 },
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'auto',
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px' },
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: toolbarShadow,
            borderRadius: '10px',
            border: `1px solid ${borderSubtle}`,
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1260,
            mx: 'auto',
          }}
        >
          {/* Tab导航 */}
          <Paper
            elevation={0}
            sx={{
              mb: { xs: 2, sm: 3 },
              p: { xs: 0.5, sm: 1 },
              borderRadius: { xs: 2, sm: 2.5 },
              border: `1px solid ${borderDefault}`,
              bgcolor: bgPaper,
              boxShadow: `0 18px 40px -28px ${toolbarShadow}`,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="standard"
              TabIndicatorProps={{ sx: { display: 'none' } }}
              sx={{
                minHeight: 0,
                '& .MuiTabs-flexContainer': {
                  gap: { xs: 0.5, sm: 1 },
                },
                '& .MuiTab-root': {
                  flex: 1,
                  minHeight: 0,
                  borderRadius: { xs: 1.5, sm: 2 },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 1.1, sm: 1.4 },
                  color: textSecondary,
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 0.75, sm: 1 },
                  '& svg': {
                    width: 20,
                    height: 20,
                  },
                  '&.Mui-selected': {
                    color: textPrimary,
                    backgroundColor: hoverBg,
                    boxShadow: `0 18px 40px -24px ${toolbarShadow}`,
                  },
                  '&:hover': {
                    backgroundColor: hoverBg,
                  },
                },
              }}
            >
              <Tab disableRipple label={t('settings.voice.tabs.tts')} icon={<Volume2 size={20} />} iconPosition="start" />
              <Tab disableRipple label={t('settings.voice.tabs.asr')} icon={<Mic size={20} />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* 服务卡片网格 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: { xs: 1.5, sm: 2, md: 2.5 }
            }}
          >
            {currentServices.map((service) => (
              <Paper
                key={service.id}
                elevation={0}
                sx={{
                  position: 'relative',
                  borderRadius: { xs: 2.4, sm: 2.8 },
                  overflow: 'hidden',
                  border: `1px solid ${borderDefault}`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
                  bgcolor: bgPaper,
                  boxShadow: `0 22px 48px -32px ${toolbarShadow}`,
                  minHeight: { xs: 152, sm: 176 },
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 32px 70px -30px ${toolbarShadow}`,
                    borderColor: primaryColor,
                    backgroundColor: bgElevated,
                  },
                  '&:hover .service-card__avatar': {
                    transform: 'scale(1.06)',
                  },
                }}
              >
                <ListItemButton
                  onClick={() => handleServiceClick(service.path)}
                  sx={{
                    p: 0,
                    height: '100%',
                    alignItems: 'stretch',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${primaryColor}`,
                      outlineOffset: '4px',
                    },
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    p: { xs: 2, sm: 2.5 },
                    height: '100%',
                    gap: { xs: 1.5, sm: 2 },
                  }}>
                    {/* 头部：图标、标题和状态 */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Avatar
                        className="service-card__avatar"
                        sx={{
                          bgcolor: (theme) => alpha(service.color, theme.palette.mode === 'dark' ? 0.24 : 0.12),
                          color: service.color,
                          mr: 1.5,
                          width: 48,
                          height: 48,
                          border: `1px solid ${borderSubtle}`,
                          boxShadow: `0 12px 28px -18px ${toolbarShadow}`,
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        {service.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              color: textPrimary,
                              lineHeight: 1.2,
                              letterSpacing: '0.01em',
                            }}
                          >
                            {service.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {/* 当前启用状态 */}
                          {((activeTab === 0 && currentTTSService === service.id) ||
                            (activeTab === 1 && currentASRService === service.id)) && (
                            <Chip
                              size="small"
                              label={t('settings.voice.status.active')}
                              color="success"
                              variant="filled"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                height: 18,
                                borderRadius: 1.5,
                                '& .MuiChip-label': {
                                  px: 0.75,
                                },
                              }}
                            />
                          )}
                          {/* 服务状态标签 */}
                          <Chip
                            size="small"
                            label={statusConfig[service.status as keyof typeof statusConfig].label}
                            color={statusConfig[service.status as keyof typeof statusConfig].color}
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              height: 20,
                              borderRadius: 1.5,
                              '& .MuiChip-label': {
                                px: 0.75,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* 描述 */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: textSecondary,
                        lineHeight: 1.4,
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {service.description}
                    </Typography>

                    {/* 特性标签 */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.5,
                      mt: 'auto'
                    }}>
                      {service.features.slice(0, 3).map((feature: string, index: number) => (
                        <Chip
                          key={index}
                          size="small"
                          label={feature}
                          variant="filled"
                          sx={{
                            bgcolor: (theme) => alpha(service.color, theme.palette.mode === 'dark' ? 0.24 : 0.12),
                            color: service.color,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            height: 20,
                            borderRadius: 1.5,
                            border: `1px solid ${alpha(service.color, 0.25)}`,
                            '& .MuiChip-label': {
                              px: 0.9,
                            },
                          }}
                        />
                      ))}
                      {service.features.length > 3 && (
                        <Chip
                          size="small"
                          label={`+${service.features.length - 3}`}
                          variant="outlined"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            height: 20,
                            borderRadius: 1.5,
                            borderColor: borderSubtle,
                            color: textSecondary,
                            '& .MuiChip-label': {
                              px: 0.75,
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </SafeAreaContainer>
  );
};

export default VoiceSettingsV2;
