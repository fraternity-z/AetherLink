import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  FormGroup,
  FormControlLabel,
  Tooltip,
  IconButton,
  AppBar,
  Toolbar,
  alpha,
  Button,
  Slider,
  Alert,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import CustomSwitch from '../../components/CustomSwitch';
import { ArrowLeft, Info, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { updateSettings } from '../../shared/store/settingsSlice';
import {
  validateImageFile,
  compressImage,
  cleanupBackgroundImage
} from '../../shared/utils/backgroundUtils';
import useScrollPosition from '../../hooks/useScrollPosition';
import { useTranslation } from '../../i18n';


const ChatInterfaceSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-chat-interface', {
    autoRestore: true,
    restoreDelay: 100
  });

  // 本地状态
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取所有设置项
  const multiModelDisplayStyle = (settings as any).multiModelDisplayStyle || 'horizontal';
  const showToolDetails = (settings as any).showToolDetails !== false;
  const showCitationDetails = (settings as any).showCitationDetails !== false;

  const showSystemPromptBubble = settings.showSystemPromptBubble !== false;

  // 背景设置
  const chatBackground = settings.chatBackground || {
    enabled: false,
    imageUrl: '',
    opacity: 0.3,
    size: 'cover',
    position: 'center',
    repeat: 'no-repeat'
  };


  const handleBack = () => {
    navigate('/settings/appearance');
  };

  // 事件处理函数
  const handleMultiModelDisplayStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      multiModelDisplayStyle: event.target.value
    }));
  };

  const handleShowToolDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showToolDetails: event.target.checked
    }));
  };

  const handleShowCitationDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showCitationDetails: event.target.checked
    }));
  };





  const handleSystemPromptBubbleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      showSystemPromptBubble: event.target.value === 'show'
    }));
  };




  // 背景设置事件处理函数
  const handleBackgroundEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      chatBackground: {
        ...chatBackground,
        enabled: event.target.checked
      }
    }));
  };

  const handleBackgroundOpacityChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      chatBackground: {
        ...chatBackground,
        opacity: newValue as number
      }
    }));
  };

  const handleBackgroundSizeChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      chatBackground: {
        ...chatBackground,
        size: event.target.value
      }
    }));
  };

  const handleBackgroundPositionChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      chatBackground: {
        ...chatBackground,
        position: event.target.value
      }
    }));
  };

  const handleBackgroundRepeatChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      chatBackground: {
        ...chatBackground,
        repeat: event.target.value
      }
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);

    try {
      // 验证文件
      const validation = validateImageFile(file, t);
      if (!validation.valid) {
        setUploadError(validation.error || t('settings.appearance.chatInterface.background.errors.validationFailed'));
        return;
      }

      // 压缩并转换为数据URL
      const dataUrl = await compressImage(file);

      // 清理旧的背景图片
      if (chatBackground.imageUrl) {
        cleanupBackgroundImage(chatBackground.imageUrl);
      }

      // 更新设置
      dispatch(updateSettings({
        chatBackground: {
          ...chatBackground,
          imageUrl: dataUrl,
          enabled: true // 上传后自动启用
        }
      }));

    } catch (error) {
      setUploadError(t('settings.appearance.chatInterface.background.errors.uploadFailed'));
      console.error('Background upload error:', error);
    } finally {
      setIsUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBackground = () => {
    if (chatBackground.imageUrl) {
      cleanupBackgroundImage(chatBackground.imageUrl);
    }

    dispatch(updateSettings({
      chatBackground: {
        ...chatBackground,
        imageUrl: '',
        enabled: false
      }
    }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
              color: 'transparent',
            }}
          >
            {t('settings.appearance.chatInterface.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
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


        {/* 多模型对比显示设置 */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">{t('settings.appearance.chatInterface.multiModel.title')}</Typography>
            <Tooltip title={t('settings.appearance.chatInterface.multiModel.tooltip')}>
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>{t('settings.appearance.chatInterface.multiModel.layoutLabel')}</InputLabel>
            <Select
              value={multiModelDisplayStyle}
              onChange={handleMultiModelDisplayStyleChange}
              label={t('settings.appearance.chatInterface.multiModel.layoutLabel')}
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="horizontal">{t('settings.appearance.chatInterface.multiModel.horizontal')}</MenuItem>
              <MenuItem value="vertical">{t('settings.appearance.chatInterface.multiModel.vertical')}</MenuItem>
              <MenuItem value="single">{t('settings.appearance.chatInterface.multiModel.single')}</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('settings.appearance.chatInterface.multiModel.description')}
          </Typography>
        </Paper>





        {/* 工具调用设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">{t('settings.appearance.chatInterface.toolCall.title')}</Typography>
            <Tooltip title={t('settings.appearance.chatInterface.toolCall.tooltip')}>
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={showToolDetails}
                  onChange={handleShowToolDetailsChange}
                />
              }
              label={t('settings.appearance.chatInterface.toolCall.showDetails')}
            />
          </FormGroup>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('settings.appearance.chatInterface.toolCall.description')}
          </Typography>
        </Paper>

        {/* 引用设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">{t('settings.appearance.chatInterface.citation.title')}</Typography>
            <Tooltip title={t('settings.appearance.chatInterface.citation.tooltip')}>
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={showCitationDetails}
                  onChange={handleShowCitationDetailsChange}
                />
              }
              label={t('settings.appearance.chatInterface.citation.showDetails')}
            />
          </FormGroup>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('settings.appearance.chatInterface.citation.description')}
          </Typography>
        </Paper>



        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {t('settings.appearance.chatInterface.systemPrompt.title')}
          </Typography>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="prompt-bubble-style-label">{t('settings.appearance.chatInterface.systemPrompt.label')}</InputLabel>
            <Select
              labelId="prompt-bubble-style-label"
              value={showSystemPromptBubble ? 'show' : 'hide'}
              onChange={handleSystemPromptBubbleChange}
              label={t('settings.appearance.chatInterface.systemPrompt.label')}
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="show">{t('settings.appearance.chatInterface.systemPrompt.show')}</MenuItem>
              <MenuItem value="hide">{t('settings.appearance.chatInterface.systemPrompt.hide')}</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('settings.appearance.chatInterface.systemPrompt.description')}
          </Typography>
        </Paper>

        {/* 聊天背景设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {t('settings.appearance.chatInterface.background.title')}
          </Typography>

          {/* 启用背景开关 */}
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={chatBackground.enabled}
                  onChange={handleBackgroundEnabledChange}
                />
              }
              label={t('settings.appearance.chatInterface.background.enable')}
            />
          </FormGroup>

          {/* 背景图片上传 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('settings.appearance.chatInterface.background.imageLabel')}
            </Typography>

            {chatBackground.imageUrl ? (
              <Card sx={{ maxWidth: 200, mb: 2 }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={chatBackground.imageUrl}
                  alt={t('settings.appearance.chatInterface.background.previewAlt')}
                  sx={{ objectFit: 'cover' }}
                />
                <CardActions sx={{ p: 1 }}>
                  <Button
                    size="small"
                    startIcon={<X size={16} />}
                    onClick={handleRemoveBackground}
                    color="error"
                  >
                    {t('settings.appearance.chatInterface.background.remove')}
                  </Button>
                </CardActions>
              </Card>
            ) : (
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={handleUploadClick}
              >
                <ImageIcon size={32} style={{ color: '#ccc', marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('settings.appearance.chatInterface.background.uploadHint')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('settings.appearance.chatInterface.background.uploadFormat')}
                </Typography>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {!chatBackground.imageUrl && (
              <Button
                variant="outlined"
                startIcon={<Upload size={16} />}
                onClick={handleUploadClick}
                disabled={isUploading}
                sx={{ mt: 1 }}
              >
                {isUploading ? t('settings.appearance.chatInterface.background.uploading') : t('settings.appearance.chatInterface.background.selectImage')}
              </Button>
            )}

            {uploadError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {uploadError}
              </Alert>
            )}
          </Box>

          {/* 背景设置选项 */}
          {chatBackground.enabled && (
            <>
              {/* 透明度设置 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t('settings.appearance.chatInterface.background.opacityLabel')}: {Math.round(chatBackground.opacity * 100)}%
                </Typography>
                <Slider
                  value={chatBackground.opacity}
                  onChange={handleBackgroundOpacityChange}
                  min={0.1}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: '10%' },
                    { value: 0.5, label: '50%' },
                    { value: 1, label: '100%' }
                  ]}
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* 背景尺寸 */}
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>{t('settings.appearance.chatInterface.background.sizeLabel')}</InputLabel>
                <Select
                  value={chatBackground.size}
                  onChange={handleBackgroundSizeChange}
                  label={t('settings.appearance.chatInterface.background.sizeLabel')}
                  MenuProps={{
                    disableAutoFocus: true,
                    disableRestoreFocus: true
                  }}
                >
                  {['cover', 'contain', 'auto'].map((value) => (
                    <MenuItem key={value} value={value}>
                      <Box>
                        <Typography variant="body2">{t(`settings.appearance.chatInterface.background.presets.${value}.label`)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(`settings.appearance.chatInterface.background.presets.${value}.description`)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 背景位置 */}
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>{t('settings.appearance.chatInterface.background.positionLabel')}</InputLabel>
                <Select
                  value={chatBackground.position}
                  onChange={handleBackgroundPositionChange}
                  label={t('settings.appearance.chatInterface.background.positionLabel')}
                  MenuProps={{
                    disableAutoFocus: true,
                    disableRestoreFocus: true
                  }}
                >
                  {['center', 'top', 'bottom', 'left', 'right'].map((value) => (
                    <MenuItem key={value} value={value}>
                      {t(`settings.appearance.chatInterface.background.positions.${value}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 背景重复 */}
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>{t('settings.appearance.chatInterface.background.repeatLabel')}</InputLabel>
                <Select
                  value={chatBackground.repeat}
                  onChange={handleBackgroundRepeatChange}
                  label={t('settings.appearance.chatInterface.background.repeatLabel')}
                  MenuProps={{
                    disableAutoFocus: true,
                    disableRestoreFocus: true
                  }}
                >
                  <MenuItem value="no-repeat">{t('settings.appearance.chatInterface.background.repeats.noRepeat')}</MenuItem>
                  <MenuItem value="repeat">{t('settings.appearance.chatInterface.background.repeats.repeat')}</MenuItem>
                  <MenuItem value="repeat-x">{t('settings.appearance.chatInterface.background.repeats.repeatX')}</MenuItem>
                  <MenuItem value="repeat-y">{t('settings.appearance.chatInterface.background.repeats.repeatY')}</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('settings.appearance.chatInterface.background.description')}
          </Typography>
        </Paper>

        {/* 底部间距 */}
        <Box sx={{ height: '20px' }} />
      </Box>
    </Box>
  );
};

export default ChatInterfaceSettings;