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
  Mic,
  Settings as SettingsIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { getStorageItem } from '../../../shared/utils/storage';
import { useTranslation } from '../../../i18n';

// TTS服务配置 - 将在组件内使用 i18n
const getTTSServices = (t: any) => [
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
            aria-label={t('settings.voice.back')}
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
            {t('settings.voice.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 可滚动的内容区域 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          pt: { xs: 7, sm: 8 },
          pb: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px' },
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.2)',
            },
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
          }}
        >
          {/* Tab导航 */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: { xs: 2, sm: 3 },
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                height: { xs: 3, sm: 4 },
                borderRadius: '2px 2px 0 0',
                background: 'linear-gradient(90deg, #9333EA, #754AB4)',
              },
              '& .MuiTab-root': {
                minHeight: 64,
                fontWeight: 600,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <Tab label={t('settings.voice.tabs.tts')} icon={<Volume2 size={20} />} iconPosition="start" />
            <Tab label={t('settings.voice.tabs.asr')} icon={<Mic size={20} />} iconPosition="start" />
          </Tabs>

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
                  borderRadius: { xs: 2, sm: 2.5 },
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  minHeight: { xs: '140px', sm: '160px' },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                  }
                }}
              >
                <ListItemButton
                  onClick={() => handleServiceClick(service.path)}
                  sx={{
                    p: 0,
                    height: '100%',
                    '&:hover': {
                      bgcolor: 'transparent',
                    }
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    p: { xs: 2, sm: 2.5 },
                    height: '100%'
                  }}>
                    {/* 头部：图标、标题和状态 */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(service.color, 0.12),
                          color: service.color,
                          mr: 1.5,
                          width: 44,
                          height: 44,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                              color: 'text.primary',
                              lineHeight: 1.2
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
                                height: 18,
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
                              height: 20,
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
                        color: 'text.secondary',
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
                      {service.features.slice(0, 3).map((feature, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={feature}
                          variant="filled"
                          sx={{
                            bgcolor: alpha(service.color, 0.08),
                            color: service.color,
                            fontSize: '0.65rem',
                            height: 18,
                            '& .MuiChip-label': {
                              px: 0.75,
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
                            height: 18,
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
    </Box>
  );
};

export default VoiceSettingsV2;
