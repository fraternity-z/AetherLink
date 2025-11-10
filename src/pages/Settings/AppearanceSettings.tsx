import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Slider,
  FormHelperText,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  alpha,
  FormControlLabel
} from '@mui/material';
import { ArrowLeft, ChevronRight, MessageSquare, MessageCircle, Brain, Palette, LayoutDashboard, Sliders, Edit3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { setTheme, setFontSize, setFontFamily, setShowPerformanceMonitor } from '../../shared/store/settingsSlice';
import { fontOptions, fontCategoryLabels, getFontById } from '../../shared/config/fonts';
import useScrollPosition from '../../hooks/useScrollPosition';
import { useLanguageSettings } from '../../i18n/useLanguageSettings';
import { supportedLanguages } from '../../i18n';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../i18n';
import CustomSwitch from '../../components/CustomSwitch';

const AppearanceSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const { currentLanguage, changeLanguage } = useLanguageSettings();
  const { t } = useTranslation();

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-appearance', {
    autoRestore: true,
    restoreDelay: 100
  });

  const handleBack = () => {
    navigate('/settings');
  };

  // 字体大小处理函数
  const handleFontSizeChange = (_: Event, newValue: number | number[]) => {
    dispatch(setFontSize(newValue as number));
  };

  // 字体家族处理函数
  const handleFontFamilyChange = (event: any) => {
    dispatch(setFontFamily(event.target.value));
  };

  // 字体大小预设值
  const fontSizePresets = [
    { value: 12, label: t('settings.appearance.fontSize.presets.12') },
    { value: 14, label: t('settings.appearance.fontSize.presets.14') },
    { value: 16, label: t('settings.appearance.fontSize.presets.16') },
    { value: 18, label: t('settings.appearance.fontSize.presets.18') },
    { value: 20, label: t('settings.appearance.fontSize.presets.20') },
    { value: 24, label: t('settings.appearance.fontSize.presets.24') }
  ];

  // 获取当前字体大小的描述
  const getCurrentFontSizeLabel = (fontSize: number) => {
    const preset = fontSizePresets.find(p => p.value === fontSize);
    return preset ? preset.label : t('settings.appearance.fontSize.custom');
  };

  // 获取当前字体的描述
  const getCurrentFontLabel = (fontId: string) => {
    const font = getFontById(fontId);
    return font ? font.name : t('settings.appearance.fontFamily.systemDefault');
  };

  const handleNavigateToChatInterface = () => {
    navigate('/settings/appearance/chat-interface');
  };

  const handleNavigateToTopToolbar = () => {
    navigate('/settings/appearance/top-toolbar');
  };

  const handleNavigateToToolbarCustomization = () => {
    navigate('/settings/appearance/toolbar-customization');
  };

  const handleNavigateToMessageBubble = () => {
    navigate('/settings/appearance/message-bubble');
  };

  const handleNavigateToThinkingProcess = () => {
    navigate('/settings/appearance/thinking-process');
  };

  const handleNavigateToInputBox = () => {
    navigate('/settings/appearance/input-box');
  };

  const handleNavigateToThemeStyle = () => {
    navigate('/settings/appearance/theme-style');
  };

  // 性能监控开关处理函数
  const handlePerformanceMonitorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setShowPerformanceMonitor(event.target.checked));
  };

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.02)
        : alpha(theme.palette.background.default, 0.9),
    }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowLeft size={24} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {t('settings.appearance.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mt: 8,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* 主题和字体设置 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('settings.appearance.themeAndFont.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.appearance.themeAndFont.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            {/* 主题选择 */}
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel>{t('settings.appearance.theme.label')}</InputLabel>
              <Select
                value={settings.theme}
                onChange={(e) => dispatch(setTheme(e.target.value as 'light' | 'dark' | 'system'))}
                label={t('settings.appearance.theme.label')}
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem value="light">{t('settings.light')}</MenuItem>
                <MenuItem value="dark">{t('settings.dark')}</MenuItem>
                <MenuItem value="system">{t('settings.system')}</MenuItem>
              </Select>
              <FormHelperText>
                {t('settings.appearance.theme.helperText')}
              </FormHelperText>
            </FormControl>

            {/* 语言选择 */}
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel>{t('settings.appearance.language.label')}</InputLabel>
              <Select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                label={t('settings.appearance.language.label')}
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: 2,
                  },
                }}
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Globe size={16} />
                      <Typography>{lang.nativeName}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {lang.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {t('settings.appearance.language.helperText')}
              </FormHelperText>
            </FormControl>

          {/* 全局字体大小控制 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                }}
              >
                {t('settings.appearance.fontSize.label')}
              </Typography>
              <Chip
                label={`${settings.fontSize}px (${getCurrentFontSizeLabel(settings.fontSize)})`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 500,
                }}
              />
            </Box>

            <Slider
              value={settings.fontSize}
              min={12}
              max={24}
              step={1}
              onChange={handleFontSizeChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}px`}
              marks={fontSizePresets.map(preset => ({
                value: preset.value,
                label: preset.label
              }))}
              sx={{
                '& .MuiSlider-thumb': {
                  width: { xs: 20, sm: 24 },
                  height: { xs: 20, sm: 24 },
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(147, 51, 234, 0.16)',
                  },
                },
                '& .MuiSlider-track': {
                  background: 'linear-gradient(90deg, #9333EA, #754AB4)',
                },
                '& .MuiSlider-rail': {
                  opacity: 0.3,
                },
                '& .MuiSlider-mark': {
                  backgroundColor: 'currentColor',
                  height: 8,
                  width: 2,
                  '&.MuiSlider-markActive': {
                    backgroundColor: 'currentColor',
                  },
                },
                '& .MuiSlider-markLabel': {
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  color: 'text.secondary',
                  transform: 'translateX(-50%)',
                  top: { xs: 28, sm: 32 },
                },
                '& .MuiSlider-valueLabel': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #9333EA, #754AB4)',
                },
              }}
            />

            <FormHelperText sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {t('settings.appearance.fontSize.helperText')}
            </FormHelperText>
          </Box>

          {/* 全局字体选择 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                }}
              >
                {t('settings.appearance.fontFamily.label')}
              </Typography>
              <Chip
                label={getCurrentFontLabel(settings.fontFamily || 'system')}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 500,
                }}
              />
            </Box>

            <FormControl fullWidth variant="outlined">
              <InputLabel>{t('settings.appearance.fontFamily.label')}</InputLabel>
              <Select
                value={settings.fontFamily || 'system'}
                onChange={handleFontFamilyChange}
                label={t('settings.appearance.fontFamily.label')}
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true,
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: 2,
                  },
                }}
              >
                {Object.entries(fontCategoryLabels).map(([category]) => [
                  <MenuItem key={`category-${category}`} disabled sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    fontSize: '0.875rem',
                    opacity: '1 !important'
                  }}>
                    {t(`settings.appearance.fontCategory.${category}`)}
                  </MenuItem>,
                  ...fontOptions
                    .filter(font => font.category === category)
                    .map(font => (
                      <MenuItem
                        key={font.id}
                        value={font.id}
                        sx={{
                          fontFamily: font.fontFamily.join(', '),
                          pl: 3,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {font.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              fontFamily: font.fontFamily.join(', '),
                              mt: 0.5
                            }}
                          >
                            {font.preview}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                ]).flat()}
              </Select>
              <FormHelperText sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {t('settings.appearance.fontFamily.helperText')}
              </FormHelperText>
            </FormControl>
          </Box>
          </Box>
        </Paper>

        {/* 界面定制选项 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('settings.appearance.customization.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.appearance.customization.description')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            {/* 1. 主题风格设置 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToThemeStyle}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#9333EA', 0.12),
                    color: '#9333EA',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <Palette size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.themeStyle.title')}</Typography>}
                  secondary={t('settings.appearance.themeStyle.navigationDescription')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            {/* 2. 顶部工具栏设置 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToTopToolbar}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#10b981', 0.12),
                    color: '#10b981',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <LayoutDashboard size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.topToolbar.title')}</Typography>}
                  secondary={t('settings.appearance.topToolbar.description')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            {/* 3. 聊天界面设置 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToChatInterface}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#6366f1', 0.12),
                    color: '#6366f1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <MessageSquare size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.chatInterface.title')}</Typography>}
                  secondary={t('settings.appearance.chatInterface.description')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            {/* 4. 思考过程设置 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToThinkingProcess}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#f59e0b', 0.12),
                    color: '#f59e0b',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <Sparkles size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.thinkingProcess.title')}</Typography>}
                  secondary={t('settings.appearance.thinkingProcess.description')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            {/* 5. 信息气泡管理 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToMessageBubble}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#8b5cf6', 0.12),
                    color: '#8b5cf6',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <MessageCircle size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.messageBubble.title')}</Typography>}
                  secondary={t('settings.appearance.messageBubble.description')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            {/* 6. 输入框工具栏设置 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToToolbarCustomization}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#06b6d4', 0.12),
                    color: '#06b6d4',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <Sliders size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.toolbarCustomization.title')}</Typography>}
                  secondary={t('settings.appearance.toolbarCustomization.description')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            {/* 7. 输入框管理设置 */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleNavigateToInputBox}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#ec4899', 0.12),
                    color: '#ec4899',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <Edit3 size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.appearance.inputBox.title')}</Typography>}
                  secondary={t('settings.appearance.inputBox.description')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRight size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>

        {/* 开发者工具 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('settings.appearance.developerTools.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.appearance.developerTools.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 500,
                    mb: 0.5,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  {t('settings.appearance.developerTools.performanceMonitor.title')}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.5
                  }}
                >
                  {t('settings.appearance.developerTools.performanceMonitor.description')}
                </Typography>
              </Box>
              <Box sx={{ flexShrink: 0, pt: 0.5 }}>
                <CustomSwitch
                  checked={settings.showPerformanceMonitor || false}
                  onChange={handlePerformanceMonitorChange}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AppearanceSettings;
