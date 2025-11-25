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
  Button,
  Slider,
  Stack,
  useTheme
} from '@mui/material';
import { ArrowLeft, Info, Palette, Sliders, User, Bot, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import CustomSwitch from '../../components/CustomSwitch';
import { updateSettings } from '../../shared/store/settingsSlice';
import MessageBubblePreview from '../../components/preview/MessageBubblePreview';
import ColorPicker from '../../components/common/ColorPicker';
import { useTranslation } from '../../i18n';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

const MessageBubbleSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const theme = useTheme();

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

  // 获取隐藏气泡设置
  const hideUserBubble = (settings as any).hideUserBubble === true;
  const hideAIBubble = (settings as any).hideAIBubble === true;

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

  // 隐藏气泡设置的事件处理函数
  const handleHideUserBubbleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      hideUserBubble: event.target.checked
    }));
  };

  const handleHideAIBubbleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      hideAIBubble: event.target.checked
    }));
  };

  // 根据全局字体大小计算图标大小
  const getIconSize = (baseSize: number = 20) => {
    const scale = settings.fontSize / 16; // 16px 是基准字体大小
    return Math.round(baseSize * scale);
  };

  // 通用卡片样式
  const cardStyle = {
    mb: 2,
    p: 2.5,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    boxShadow: 'none', // 移除阴影，更扁平
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
      bgcolor: alpha(theme.palette.background.paper, 0.8),
    }
  };

  // 设置项行样式
  const settingRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2
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
              mr: 1
            }}
          >
            <ArrowLeft size={getIconSize(20)} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
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
          p: { xs: 2, sm: 3 },
          pb: 'var(--content-bottom-padding)',
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px' },
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* 功能设置 */}
        <Paper sx={cardStyle}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main 
            }}>
              <Sliders size={getIconSize(20)} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('settings.appearance.messageBubble.function.title')}
                </Typography>
                <Tooltip title={t('settings.appearance.messageBubble.function.tooltip')}>
                  <Info size={getIconSize(16)} className="text-gray-400 hover:text-gray-600 cursor-help" />
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('settings.appearance.messageBubble.function.description')}
              </Typography>
            </Box>
          </Box>

          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>{t('settings.appearance.messageBubble.function.actionMode.label')}</InputLabel>
            <Select
              value={messageActionMode}
              onChange={handleMessageActionModeChange}
              label={t('settings.appearance.messageBubble.function.actionMode.label')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="bubbles">{t('settings.appearance.messageBubble.function.actionMode.bubbles')}</MenuItem>
              <MenuItem value="toolbar">{t('settings.appearance.messageBubble.function.actionMode.toolbar')}</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('settings.appearance.messageBubble.function.actionMode.description')}
          </Typography>

          {/* 小功能气泡显示设置 - 仅在气泡模式下显示 */}
          {messageActionMode === 'bubbles' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={settingRowStyle}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                  <Box sx={{ 
                    p: 1, 
                    height: 'fit-content',
                    borderRadius: 2, 
                    bgcolor: alpha('#6366f1', 0.1),
                    color: '#6366f1' 
                  }}>
                    <Sliders size={getIconSize(20)} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('settings.appearance.messageBubble.function.showMicroBubbles.label')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t('settings.appearance.messageBubble.function.showMicroBubbles.description')}
                    </Typography>
                  </Box>
                </Box>
                <CustomSwitch
                  checked={showMicroBubbles}
                  onChange={handleMicroBubblesChange}
                />
              </Box>

              {/* 版本切换样式设置 - 仅在气泡模式且显示功能气泡时显示 */}
              {showMicroBubbles && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>{t('settings.appearance.messageBubble.function.versionSwitch.label')}</InputLabel>
                    <Select
                      value={versionSwitchStyle}
                      onChange={handleVersionSwitchStyleChange}
                      label={t('settings.appearance.messageBubble.function.versionSwitch.label')}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="popup">{t('settings.appearance.messageBubble.function.versionSwitch.popup')}</MenuItem>
                      <MenuItem value="arrows">{t('settings.appearance.messageBubble.function.versionSwitch.arrows')}</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('settings.appearance.messageBubble.function.versionSwitch.description')}
                  </Typography>
                </>
              )}
            </>
          )}
        </Paper>

        {/* 气泡宽度设置 */}
        <Paper sx={cardStyle}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: alpha('#10b981', 0.1),
              color: '#10b981' 
            }}>
              <Maximize2 size={getIconSize(20)} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('settings.appearance.messageBubble.width.title')}
                </Typography>
                <Tooltip title={t('settings.appearance.messageBubble.width.tooltip')}>
                  <Info size={getIconSize(16)} className="text-gray-400 hover:text-gray-600 cursor-help" />
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('settings.appearance.messageBubble.width.description')}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={3}>
            {/* AI消息最大宽度 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Bot size={getIconSize(16)} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('settings.appearance.messageBubble.width.aiMaxWidth')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({messageBubbleMaxWidth}%)
                </Typography>
              </Box>
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
              />
            </Box>

            {/* 用户消息最大宽度 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <User size={getIconSize(16)} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('settings.appearance.messageBubble.width.userMaxWidth')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({userMessageMaxWidth}%)
                </Typography>
              </Box>
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
              />
            </Box>

            {/* 消息最小宽度 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Minimize2 size={getIconSize(16)} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('settings.appearance.messageBubble.width.minWidth')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({messageBubbleMinWidth}%)
                </Typography>
              </Box>
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
              />
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: alpha(theme.palette.background.default, 0.5),
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <strong>{t('settings.appearance.messageBubble.width.instructions.title')}</strong>
            <br />{t('settings.appearance.messageBubble.width.instructions.aiMaxWidth')}
            <br />{t('settings.appearance.messageBubble.width.instructions.userMaxWidth')}
            <br />{t('settings.appearance.messageBubble.width.instructions.minWidth')}
            <br />{t('settings.appearance.messageBubble.width.instructions.note')}
          </Typography>
        </Paper>

        {/* 开关类设置组 */}
        <Stack spacing={2} mb={3}>
          {/* 头像和名称显示设置 */}
          <Paper sx={cardStyle}>
            <Box sx={settingRowStyle}>
              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                <Box sx={{ 
                  p: 1, 
                  height: 'fit-content',
                  borderRadius: 2, 
                  bgcolor: alpha('#f59e0b', 0.1),
                  color: '#f59e0b' 
                }}>
                  <User size={getIconSize(20)} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('settings.appearance.messageBubble.avatar.title')}
                    </Typography>
                    <Tooltip title={t('settings.appearance.messageBubble.avatar.tooltip')}>
                      <Info size={getIconSize(16)} className="text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('settings.appearance.messageBubble.avatar.description')}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={2}>
              <Box sx={settingRowStyle}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {t('settings.appearance.messageBubble.avatar.showUserAvatar')}
                </Typography>
                <CustomSwitch
                  checked={showUserAvatar}
                  onChange={handleShowUserAvatarChange}
                />
              </Box>
              <Box sx={settingRowStyle}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {t('settings.appearance.messageBubble.avatar.showUserName')}
                </Typography>
                <CustomSwitch
                  checked={showUserName}
                  onChange={handleShowUserNameChange}
                />
              </Box>
              <Box sx={settingRowStyle}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {t('settings.appearance.messageBubble.avatar.showModelAvatar')}
                </Typography>
                <CustomSwitch
                  checked={showModelAvatar}
                  onChange={handleShowModelAvatarChange}
                />
              </Box>
              <Box sx={settingRowStyle}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {t('settings.appearance.messageBubble.avatar.showModelName')}
                </Typography>
                <CustomSwitch
                  checked={showModelName}
                  onChange={handleShowModelNameChange}
                />
              </Box>
            </Stack>
          </Paper>

          {/* 隐藏气泡设置 */}
          <Paper sx={cardStyle}>
            <Box sx={settingRowStyle}>
              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                <Box sx={{ 
                  p: 1, 
                  height: 'fit-content',
                  borderRadius: 2, 
                  bgcolor: alpha('#ef4444', 0.1),
                  color: '#ef4444' 
                }}>
                  <EyeOff size={getIconSize(20)} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t('settings.appearance.messageBubble.hideBubble.title')}
                    </Typography>
                    <Tooltip title={t('settings.appearance.messageBubble.hideBubble.tooltip')}>
                      <Info size={getIconSize(16)} className="text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('settings.appearance.messageBubble.hideBubble.description')}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={2}>
              <Box sx={settingRowStyle}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {t('settings.appearance.messageBubble.hideBubble.hideUserBubble')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('settings.appearance.messageBubble.hideBubble.hideUserBubbleDesc')}
                  </Typography>
                </Box>
                <CustomSwitch
                  checked={hideUserBubble}
                  onChange={handleHideUserBubbleChange}
                />
              </Box>
              <Box sx={settingRowStyle}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {t('settings.appearance.messageBubble.hideBubble.hideAIBubble')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('settings.appearance.messageBubble.hideBubble.hideAIBubbleDesc')}
                  </Typography>
                </Box>
                <CustomSwitch
                  checked={hideAIBubble}
                  onChange={handleHideAIBubbleChange}
                />
              </Box>
            </Stack>
          </Paper>
        </Stack>

        {/* 自定义气泡颜色设置 */}
        <Paper sx={cardStyle}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                p: 1, 
                borderRadius: 2, 
                bgcolor: alpha('#ec4899', 0.1),
                color: '#ec4899' 
              }}>
                <Palette size={getIconSize(20)} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('settings.appearance.messageBubble.colors.title')}
                  </Typography>
                  <Tooltip title={t('settings.appearance.messageBubble.colors.tooltip')}>
                    <Info size={getIconSize(16)} className="text-gray-400 hover:text-gray-600 cursor-help" />
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.appearance.messageBubble.colors.description')}
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              onClick={handleResetColors}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              {t('settings.appearance.messageBubble.colors.reset')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* 左侧：颜色设置 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '120px 80px 80px', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {/* 空白占位 */}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
                  {t('settings.appearance.messageBubble.colors.backgroundColor')}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
                  {t('settings.appearance.messageBubble.colors.textColor')}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '120px 80px 80px', gap: 2, alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={getIconSize(16)} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('settings.appearance.messageBubble.colors.userMessage')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ColorPicker
                    value={customBubbleColors.userBubbleColor || '#1976d2'}
                    onChange={(color) => handleColorChange('userBubbleColor', color)}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ColorPicker
                    value={customBubbleColors.userTextColor || '#ffffff'}
                    onChange={(color) => handleColorChange('userTextColor', color)}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '120px 80px 80px', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bot size={getIconSize(16)} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('settings.appearance.messageBubble.colors.aiReply')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ColorPicker
                    value={customBubbleColors.aiBubbleColor || '#f5f5f5'}
                    onChange={(color) => handleColorChange('aiBubbleColor', color)}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ColorPicker
                    value={customBubbleColors.aiTextColor || '#333333'}
                    onChange={(color) => handleColorChange('aiTextColor', color)}
                    size="small"
                  />
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
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
                hideUserBubble={hideUserBubble}
                hideAIBubble={hideAIBubble}
              />
            </Box>
          </Box>
        </Paper>

        {/* 底部间距 */}
        <Box sx={{ height: '40px' }} />
      </Box>
    </SafeAreaContainer>
  );
};

export default MessageBubbleSettings;
