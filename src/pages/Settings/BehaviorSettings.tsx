import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  alpha,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Chip
} from '@mui/material';
import { ArrowLeft, Send, Bell, Smartphone, Vibrate, TestTube2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { 
  setSendWithEnter, 
  setEnableNotifications, 
  setMobileInputMethodEnterAsNewline,
  setHapticFeedbackEnabled,
  setHapticFeedbackOnSidebar,
  setHapticFeedbackOnSwitch,
  setHapticFeedbackOnListItem,
  setHapticFeedbackOnNavigation
} from '../../shared/store/settingsSlice';
import useScrollPosition from '../../hooks/useScrollPosition';
import { Haptics } from '../../shared/utils/hapticFeedback';
import CustomSwitch from '../../components/CustomSwitch';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

const BehaviorSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const settings = useAppSelector((state) => state.settings);

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-behavior', {
    autoRestore: true,
    restoreDelay: 100
  });

  const handleBack = () => {
    navigate('/settings');
  };

  return (
    <SafeAreaContainer>
      <AppBar
        position="static"
        elevation={0}
        sx={{
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
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {t('settings.behavior.title')}
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
          pb: 'var(--content-bottom-padding)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* 行为设置 */}
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
              {t('settings.behavior.interaction.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.behavior.interaction.description')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            <ListItem disablePadding>
              <Box sx={{ width: '100%', p: 2 }}>
                <FormControlLabel
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      flex: 1
                    }
                  }}
                  labelPlacement="start"
                  control={
                    <Box sx={{ ml: 2 }}>
                      <CustomSwitch
                        checked={settings.sendWithEnter}
                        onChange={(e) => dispatch(setSendWithEnter(e.target.checked))}
                      />
                    </Box>
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemAvatar sx={{ minWidth: 'auto', mr: 2 }}>
                        <Avatar sx={{
                          bgcolor: alpha('#06b6d4', 0.12),
                          color: '#06b6d4',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          width: 40,
                          height: 40
                        }}>
                          <Send size={20} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.behavior.sendWithEnter.label')}</Typography>}
                        secondary={t('settings.behavior.sendWithEnter.description')}
                        primaryTypographyProps={{ component: 'div' }}
                      />
                    </Box>
                  }
                />
              </Box>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            <ListItem disablePadding>
              <Box sx={{ width: '100%', p: 2 }}>
                <FormControlLabel
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      flex: 1
                    }
                  }}
                  labelPlacement="start"
                  control={
                    <Box sx={{ ml: 2 }}>
                      <CustomSwitch
                        checked={settings.enableNotifications}
                        onChange={(e) => dispatch(setEnableNotifications(e.target.checked))}
                      />
                    </Box>
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemAvatar sx={{ minWidth: 'auto', mr: 2 }}>
                        <Avatar sx={{
                          bgcolor: alpha('#8b5cf6', 0.12),
                          color: '#8b5cf6',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          width: 40,
                          height: 40
                        }}>
                          <Bell size={20} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.behavior.enableNotifications.label')}</Typography>}
                        secondary={t('settings.behavior.enableNotifications.description')}
                        primaryTypographyProps={{ component: 'div' }}
                      />
                    </Box>
                  }
                />
              </Box>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            <ListItem disablePadding>
              <Box sx={{ width: '100%', p: 2 }}>
                <FormControlLabel
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      flex: 1
                    }
                  }}
                  labelPlacement="start"
                  control={
                    <Box sx={{ ml: 2 }}>
                      <CustomSwitch
                        checked={settings.mobileInputMethodEnterAsNewline}
                        onChange={(e) => dispatch(setMobileInputMethodEnterAsNewline(e.target.checked))}
                      />
                    </Box>
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemAvatar sx={{ minWidth: 'auto', mr: 2 }}>
                        <Avatar sx={{
                          bgcolor: alpha('#f59e0b', 0.12),
                          color: '#f59e0b',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          width: 40,
                          height: 40
                        }}>
                          <Smartphone size={20} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.behavior.mobileInputMethodEnterAsNewline.label')}</Typography>}
                        secondary={t('settings.behavior.mobileInputMethodEnterAsNewline.description')}
                        primaryTypographyProps={{ component: 'div' }}
                      />
                    </Box>
                  }
                />
              </Box>
            </ListItem>
          </List>
        </Paper>

        {/* 触觉反馈设置 */}
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
          {/* 标题区域 */}
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t('settings.behavior.hapticFeedback.title')}
              </Typography>
              <Chip 
                label={settings.hapticFeedback?.enabled ? t('common.enabled') : t('common.disabled')}
                size="small"
                color={settings.hapticFeedback?.enabled ? 'primary' : 'default'}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('settings.behavior.hapticFeedback.description')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            {/* 全局触觉反馈总开关 */}
            <ListItem disablePadding>
              <Box sx={{ width: '100%', p: 2 }}>
                <FormControlLabel
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      flex: 1
                    }
                  }}
                  labelPlacement="start"
                  control={
                    <Box sx={{ ml: 2 }}>
                      <CustomSwitch
                        checked={settings.hapticFeedback?.enabled ?? true}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          dispatch(setHapticFeedbackEnabled(enabled));
                          // 立即测试触觉反馈
                          if (enabled) {
                            Haptics.medium();
                          }
                        }}
                      />
                    </Box>
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemAvatar sx={{ minWidth: 'auto', mr: 2 }}>
                        <Avatar sx={{
                          bgcolor: alpha('#ec4899', 0.12),
                          color: '#ec4899',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          width: 40,
                          height: 40
                        }}>
                          <Vibrate size={20} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.behavior.hapticFeedback.enabled.label')}</Typography>}
                        secondary={t('settings.behavior.hapticFeedback.enabled.description')}
                        primaryTypographyProps={{ component: 'div' }}
                      />
                    </Box>
                  }
                />
              </Box>
            </ListItem>

            {/* 子选项分组区域 */}
            {settings.hapticFeedback?.enabled && (
              <>
                <Divider />
                <Box 
                  sx={{ 
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.05)
                      : alpha(theme.palette.primary.main, 0.02),
                    borderLeft: 3,
                    borderColor: 'primary.main',
                    borderStyle: 'solid',
                  }}
                >
                  {/* 标题栏 */}
                  <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('settings.behavior.hapticFeedback.specificSettings')}
                    </Typography>
                  </Box>

                  <List disablePadding>
                    {/* 侧边栏触觉反馈 */}
                    <ListItem disablePadding>
                      <Box sx={{ width: '100%', px: 2, py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.5 }}>
                              {t('settings.behavior.hapticFeedback.enableOnSidebar.label')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('settings.behavior.hapticFeedback.enableOnSidebar.description')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => Haptics.drawerPulse()}
                              disabled={!settings.hapticFeedback?.enableOnSidebar}
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1, 
                                py: 0.5,
                                fontSize: '0.7rem',
                                textTransform: 'none'
                              }}
                            >
                              <TestTube2 size={14} />
                            </Button>
                            <CustomSwitch
                              checked={settings.hapticFeedback?.enableOnSidebar ?? true}
                              onChange={(e) => {
                                dispatch(setHapticFeedbackOnSidebar(e.target.checked));
                                if (e.target.checked && settings.hapticFeedback?.enabled) {
                                  Haptics.drawerPulse();
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>

                    <Divider variant="middle" sx={{ my: 0.5 }} />

                    {/* 开关触觉反馈 */}
                    <ListItem disablePadding>
                      <Box sx={{ width: '100%', px: 2, py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.5 }}>
                              {t('settings.behavior.hapticFeedback.enableOnSwitch.label')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('settings.behavior.hapticFeedback.enableOnSwitch.description')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => Haptics.soft()}
                              disabled={!settings.hapticFeedback?.enableOnSwitch}
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1, 
                                py: 0.5,
                                fontSize: '0.7rem',
                                textTransform: 'none'
                              }}
                            >
                              <TestTube2 size={14} />
                            </Button>
                            <CustomSwitch
                              checked={settings.hapticFeedback?.enableOnSwitch ?? true}
                              onChange={(e) => dispatch(setHapticFeedbackOnSwitch(e.target.checked))}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>

                    <Divider variant="middle" sx={{ my: 0.5 }} />

                    {/* 列表项触觉反馈 */}
                    <ListItem disablePadding>
                      <Box sx={{ width: '100%', px: 2, py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.5 }}>
                              {t('settings.behavior.hapticFeedback.enableOnListItem.label')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('settings.behavior.hapticFeedback.enableOnListItem.description')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => Haptics.light()}
                              disabled={!settings.hapticFeedback?.enableOnListItem}
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1, 
                                py: 0.5,
                                fontSize: '0.7rem',
                                textTransform: 'none'
                              }}
                            >
                              <TestTube2 size={14} />
                            </Button>
                            <CustomSwitch
                              checked={settings.hapticFeedback?.enableOnListItem ?? false}
                              onChange={(e) => dispatch(setHapticFeedbackOnListItem(e.target.checked))}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>

                    <Divider variant="middle" sx={{ my: 0.5 }} />

                    {/* 导航触觉反馈 */}
                    <ListItem disablePadding>
                      <Box sx={{ width: '100%', px: 2, py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.5 }}>
                              {t('settings.behavior.hapticFeedback.enableOnNavigation.label')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('settings.behavior.hapticFeedback.enableOnNavigation.description')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => Haptics.light()}
                              disabled={!settings.hapticFeedback?.enableOnNavigation}
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1, 
                                py: 0.5,
                                fontSize: '0.7rem',
                                textTransform: 'none'
                              }}
                            >
                              <TestTube2 size={14} />
                            </Button>
                            <CustomSwitch
                              checked={settings.hapticFeedback?.enableOnNavigation ?? true}
                              onChange={(e) => dispatch(setHapticFeedbackOnNavigation(e.target.checked))}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>
                  </List>
                </Box>
              </>
            )}

            {/* 禁用状态提示 */}
            {!settings.hapticFeedback?.enabled && (
              <>
                <Divider />
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('settings.behavior.hapticFeedback.disabledHint')}
                  </Typography>
                </Box>
              </>
            )}
          </List>
        </Paper>
      </Box>
    </SafeAreaContainer>
  );
};

export default BehaviorSettings;