import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  IconButton,
  AppBar,
  Toolbar,
  Divider,
  alpha,
  FormControlLabel,
  Button,
  Slider,
  FormGroup
} from '@mui/material';
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import CustomSwitch from '../../components/CustomSwitch';
import { updateSettings } from '../../shared/store/settingsSlice';
import MessageBubblePreview from '../../components/preview/MessageBubblePreview';
import ColorPicker from '../../components/common/ColorPicker';
import { useTranslation } from '../../i18n';

const MessageBubbleSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  // 获取版本切换样式设置，默认为'popup'
  const versionSwitchStyle = (settings as any).versionSwitchStyle || 'popup';
  
  // 获取小功能气泡显示设置，默认为true
  const showMicroBubbles = (settings as any).showMicroBubbles !== false;

  // 获取消息操作显示模式设置，默认为'bubbles'
  const messageActionMode = (settings as any).messageActionMode || 'bubbles';

  // 获取自定义气泡颜色设置
  const customBubbleColors = (settings as any).customBubbleColors || {
    userBubbleColor: '',
    userTextColor: '',
    aiBubbleColor: '',
    aiTextColor: ''
  };

  // 获取消息气泡宽度设置
  const messageBubbleMinWidth = settings.messageBubbleMinWidth || 50;
  const messageBubbleMaxWidth = settings.messageBubbleMaxWidth || 99;
  const userMessageMaxWidth = settings.userMessageMaxWidth || 80;

  // 获取头像和名称显示设置
  const showUserAvatar = settings.showUserAvatar !== false;
  const showUserName = settings.showUserName !== false;
  const showModelAvatar = settings.showModelAvatar !== false;
  const showModelName = settings.showModelName !== false;

  const handleBack = () => {
    navigate('/settings/appearance');
  };

  // 版本切换样式变更事件处理函数
  const handleVersionSwitchStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      versionSwitchStyle: event.target.value
    }));
  };
  
  // 小功能气泡显示设置变更处理函数
  const handleMicroBubblesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showMicroBubbles: event.target.checked
    }));
  };

  // 消息操作显示模式变更处理函数
  const handleMessageActionModeChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      messageActionMode: event.target.value
    }));
  };

  // 自定义颜色变更处理函数
  const handleColorChange = (colorType: string, color: string) => {
    dispatch(updateSettings({
      customBubbleColors: {
        ...customBubbleColors,
        [colorType]: color
      }
    }));
  };

  // 重置颜色为默认值
  const handleResetColors = () => {
    dispatch(updateSettings({
      customBubbleColors: {
        userBubbleColor: '',
        userTextColor: '',
        aiBubbleColor: '',
        aiTextColor: ''
      }
    }));
  };

  // 消息气泡宽度设置处理函数
  const handleMessageBubbleMinWidthChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      messageBubbleMinWidth: newValue as number
    }));
  };

  const handleMessageBubbleMaxWidthChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      messageBubbleMaxWidth: newValue as number
    }));
  };

  const handleUserMessageMaxWidthChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      userMessageMaxWidth: newValue as number
    }));
  };

  // 头像和名称显示设置的事件处理函数
  const handleShowUserAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showUserAvatar: event.target.checked
    }));
  };

  const handleShowUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showUserName: event.target.checked
    }));
  };

  const handleShowModelAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showModelAvatar: event.target.checked
    }));
  };

  const handleShowModelNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showModelName: event.target.checked
    }));
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
            <ArrowLeft />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {t('settings.appearance.messageBubble.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: { xs: 1, sm: 2 },
          mt: 8,
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px' },
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* 版本切换样式设置和小功能气泡显示设置 */}
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
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                {t('settings.appearance.messageBubble.function.title')}
              </Typography>
              <Tooltip title={t('settings.appearance.messageBubble.function.tooltip')}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {t('settings.appearance.messageBubble.function.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            {/* 消息操作显示模式设置 */}
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel>{t('settings.appearance.messageBubble.function.actionMode.label')}</InputLabel>
              <Select
                value={messageActionMode}
                onChange={handleMessageActionModeChange}
                label={t('settings.appearance.messageBubble.function.actionMode.label')}
              >
                <MenuItem value="bubbles">{t('settings.appearance.messageBubble.function.actionMode.bubbles')}</MenuItem>
                <MenuItem value="toolbar">{t('settings.appearance.messageBubble.function.actionMode.toolbar')}</MenuItem>
              </Select>
            </FormControl>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 3,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: 1.5
              }}
            >
              {t('settings.appearance.messageBubble.function.actionMode.description')}
              <br />{t('settings.appearance.messageBubble.function.actionMode.bubblesDesc')}
              <br />{t('settings.appearance.messageBubble.function.actionMode.toolbarDesc')}
            </Typography>

            {/* 分隔线 */}
            <Divider sx={{ my: 2 }} />

            {/* 小功能气泡显示设置 - 仅在气泡模式下显示 */}
            {messageActionMode === 'bubbles' && (
              <>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={showMicroBubbles}
                      onChange={handleMicroBubblesChange}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {t('settings.appearance.messageBubble.function.showMicroBubbles.label')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {t('settings.appearance.messageBubble.function.showMicroBubbles.description')}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    mb: 2,
                    mt: 1
                  }}
                />

                {/* 分隔线 */}
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* 版本切换样式设置 - 仅在气泡模式且显示功能气泡时显示 */}
            {messageActionMode === 'bubbles' && showMicroBubbles && (
              <>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel>{t('settings.appearance.messageBubble.function.versionSwitch.label')}</InputLabel>
                  <Select
                    value={versionSwitchStyle}
                    onChange={handleVersionSwitchStyleChange}
                    label={t('settings.appearance.messageBubble.function.versionSwitch.label')}
                  >
                    <MenuItem value="popup">{t('settings.appearance.messageBubble.function.versionSwitch.popup')}</MenuItem>
                    <MenuItem value="arrows">{t('settings.appearance.messageBubble.function.versionSwitch.arrows')}</MenuItem>
                  </Select>
                </FormControl>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.5
                  }}
                >
                  {t('settings.appearance.messageBubble.function.versionSwitch.description')}
                  <br />{t('settings.appearance.messageBubble.function.versionSwitch.popupDesc')}
                  <br />{t('settings.appearance.messageBubble.function.versionSwitch.arrowsDesc')}
                </Typography>
              </>
            )}
          </Box>
        </Paper>

        {/* 消息气泡宽度设置 */}
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
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                {t('settings.appearance.messageBubble.width.title')}
              </Typography>
              <Tooltip title={t('settings.appearance.messageBubble.width.tooltip')}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {t('settings.appearance.messageBubble.width.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            {/* AI消息最大宽度 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                {t('settings.appearance.messageBubble.width.aiMaxWidth')}: {messageBubbleMaxWidth}%
              </Typography>
              <Slider
                value={messageBubbleMaxWidth}
                onChange={handleMessageBubbleMaxWidthChange}
                min={50}
                max={100}
                step={5}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{
                  '& .MuiSlider-thumb': {
                    bgcolor: 'primary.main',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: 'primary.main',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'divider',
                  }
                }}
              />
            </Box>

            {/* 用户消息最大宽度 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                {t('settings.appearance.messageBubble.width.userMaxWidth')}: {userMessageMaxWidth}%
              </Typography>
              <Slider
                value={userMessageMaxWidth}
                onChange={handleUserMessageMaxWidthChange}
                min={50}
                max={100}
                step={5}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{
                  '& .MuiSlider-thumb': {
                    bgcolor: 'secondary.main',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: 'secondary.main',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'divider',
                  }
                }}
              />
            </Box>

            {/* 消息最小宽度 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                {t('settings.appearance.messageBubble.width.minWidth')}: {messageBubbleMinWidth}%
              </Typography>
              <Slider
                value={messageBubbleMinWidth}
                onChange={handleMessageBubbleMinWidthChange}
                min={10}
                max={90}
                step={5}
                marks={[
                  { value: 10, label: '10%' },
                  { value: 30, label: '30%' },
                  { value: 50, label: '50%' },
                  { value: 70, label: '70%' },
                  { value: 90, label: '90%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{
                  '& .MuiSlider-thumb': {
                    bgcolor: 'success.main',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: 'success.main',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'divider',
                  }
                }}
              />
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: 1.5,
                p: 2,
                bgcolor: 'rgba(0,0,0,0.02)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <strong>{t('settings.appearance.messageBubble.width.instructions.title')}</strong>
              <br />{t('settings.appearance.messageBubble.width.instructions.aiMaxWidth')}
              <br />{t('settings.appearance.messageBubble.width.instructions.userMaxWidth')}
              <br />{t('settings.appearance.messageBubble.width.instructions.minWidth')}
              <br />{t('settings.appearance.messageBubble.width.instructions.note')}
            </Typography>
          </Box>
        </Paper>

        {/* 头像和名称显示设置 */}
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
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                {t('settings.appearance.messageBubble.avatar.title')}
              </Typography>
              <Tooltip title={t('settings.appearance.messageBubble.avatar.tooltip')}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {t('settings.appearance.messageBubble.avatar.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={showUserAvatar}
                    onChange={handleShowUserAvatarChange}
                  />
                }
                label={t('settings.appearance.messageBubble.avatar.showUserAvatar')}
              />
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={showUserName}
                    onChange={handleShowUserNameChange}
                  />
                }
                label={t('settings.appearance.messageBubble.avatar.showUserName')}
              />
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={showModelAvatar}
                    onChange={handleShowModelAvatarChange}
                  />
                }
                label={t('settings.appearance.messageBubble.avatar.showModelAvatar')}
              />
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={showModelName}
                    onChange={handleShowModelNameChange}
                  />
                }
                label={t('settings.appearance.messageBubble.avatar.showModelName')}
              />
            </FormGroup>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('settings.appearance.messageBubble.avatar.hint')}
            </Typography>
          </Box>
        </Paper>

        {/* 自定义气泡颜色设置 */}
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
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.1rem' }
                  }}
                >
                  {t('settings.appearance.messageBubble.colors.title')}
                </Typography>
                <Tooltip title={t('settings.appearance.messageBubble.colors.tooltip')}>
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Info />
                  </IconButton>
                </Tooltip>
              </Box>
              <Button
                size="small"
                onClick={handleResetColors}
                variant="outlined"
                sx={{ fontSize: '0.8rem' }}
              >
                {t('settings.appearance.messageBubble.colors.reset')}
              </Button>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {t('settings.appearance.messageBubble.colors.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
              {/* 左侧：颜色设置 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* 表头 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ minWidth: '80px' }}>
                    {/* 空白占位 */}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', minWidth: '80px', textAlign: 'center', fontWeight: 500 }}>
                    {t('settings.appearance.messageBubble.colors.backgroundColor')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', minWidth: '80px', textAlign: 'center', fontWeight: 500 }}>
                    {t('settings.appearance.messageBubble.colors.textColor')}
                  </Typography>
                </Box>

                {/* 用户消息颜色设置 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, minWidth: '80px' }}>
                    {t('settings.appearance.messageBubble.colors.userMessage')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '80px' }}>
                    <ColorPicker
                      value={customBubbleColors.userBubbleColor || '#1976d2'}
                      onChange={(color) => handleColorChange('userBubbleColor', color)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '80px' }}>
                    <ColorPicker
                      value={customBubbleColors.userTextColor || '#ffffff'}
                      onChange={(color) => handleColorChange('userTextColor', color)}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* AI消息颜色设置 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, minWidth: '80px' }}>
                    {t('settings.appearance.messageBubble.colors.aiReply')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '80px' }}>
                    <ColorPicker
                      value={customBubbleColors.aiBubbleColor || '#f5f5f5'}
                      onChange={(color) => handleColorChange('aiBubbleColor', color)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '80px' }}>
                    <ColorPicker
                      value={customBubbleColors.aiTextColor || '#333333'}
                      onChange={(color) => handleColorChange('aiTextColor', color)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontSize: '0.8rem',
                    lineHeight: 1.4
                  }}
                >
                  {t('settings.appearance.messageBubble.colors.hint')}
                </Typography>
              </Box>

              {/* 右侧：实时预览 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <MessageBubblePreview
                  customBubbleColors={customBubbleColors}
                  messageActionMode={messageActionMode}
                  showMicroBubbles={showMicroBubbles}
                  messageBubbleMinWidth={messageBubbleMinWidth}
                  messageBubbleMaxWidth={messageBubbleMaxWidth}
                  userMessageMaxWidth={userMessageMaxWidth}
                  showUserAvatar={showUserAvatar}
                  showUserName={showUserName}
                  showModelAvatar={showModelAvatar}
                  showModelName={showModelName}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* 底部间距 */}
        <Box sx={{ height: '20px' }} />
      </Box>
    </Box>
  );
};

export default MessageBubbleSettings; 