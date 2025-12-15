import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Chip,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,

} from '@mui/material';
import { ArrowLeft, Wrench, Plus, Trash2, Camera, Video, BookOpen, Search, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { setToolbarStyle, updateSettings, updateToolbarButtons } from '../../shared/store/settingsSlice';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useTranslation } from '../../i18n';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

const ToolbarCustomization: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  
  // 获取工具栏按钮配置
  const getToolbarButtons = () => [
    {
      id: 'mcp-tools',
      icon: Wrench,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.mcpTools.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.mcpTools.description'),
      color: 'rgba(255, 152, 0, 0.8)'
    },
    {
      id: 'new-topic',
      icon: Plus,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.newTopic.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.newTopic.description'),
      color: 'rgba(76, 175, 80, 0.8)'
    },
    {
      id: 'clear-topic',
      icon: Trash2,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.clearTopic.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.clearTopic.description'),
      color: 'rgba(33, 150, 243, 0.8)'
    },
    {
      id: 'generate-image',
      icon: Camera,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.generateImage.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.generateImage.description'),
      color: 'rgba(156, 39, 176, 0.8)'
    },
    {
      id: 'generate-video',
      icon: Video,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.generateVideo.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.generateVideo.description'),
      color: 'rgba(233, 30, 99, 0.8)'
    },
    {
      id: 'knowledge',
      icon: BookOpen,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.knowledge.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.knowledge.description'),
      color: 'rgba(5, 150, 105, 0.8)'
    },
    {
      id: 'web-search',
      icon: Search,
      label: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.webSearch.label'),
      description: t('settings.appearance.toolbarCustomization.buttonCustomization.buttons.webSearch.description'),
      color: 'rgba(59, 130, 246, 0.8)'
    }
  ];
  
  const TOOLBAR_BUTTONS = getToolbarButtons();
  const isDarkMode = settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 获取工具栏显示样式设置
  const toolbarDisplayStyle = settings.toolbarDisplayStyle || 'both';

  // 获取工具栏按钮配置
  const toolbarButtons = useMemo(() => settings.toolbarButtons || {
    order: ['mcp-tools', 'new-topic', 'clear-topic', 'generate-image', 'generate-video', 'knowledge', 'web-search'],
    visibility: {
      'mcp-tools': true,
      'new-topic': true,
      'clear-topic': true,
      'generate-image': true,
      'generate-video': true,
      'knowledge': true,
      'web-search': true
    }
  }, [settings.toolbarButtons]);

  // 本地状态管理
  const [localButtonOrder, setLocalButtonOrder] = useState<string[]>(toolbarButtons.order);
  const [localButtonVisibility, setLocalButtonVisibility] = useState<{ [key: string]: boolean }>(toolbarButtons.visibility);

  // 同步本地状态与Redux状态
  useEffect(() => {
    setLocalButtonOrder(toolbarButtons.order);
    setLocalButtonVisibility(toolbarButtons.visibility);
  }, [toolbarButtons]);

  const handleBack = () => {
    navigate('/settings/appearance');
  };

  const handleToolbarStyleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setToolbarStyle(event.target.value as 'glassmorphism' | 'transparent'));
  };

  const handleToolbarDisplayStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      toolbarDisplayStyle: event.target.value
    }));
  };

  // 处理拖拽结束
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // 重新排序按钮
    const newOrder = Array.from(localButtonOrder);
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destinationIndex, 0, removed);

    // 更新本地状态
    setLocalButtonOrder(newOrder);

    // 更新Redux状态
    dispatch(updateToolbarButtons({
      order: newOrder,
      visibility: localButtonVisibility
    }));
  };

  // 处理按钮可见性切换
  const handleVisibilityToggle = (buttonId: string) => {
    const newVisibility = {
      ...localButtonVisibility,
      [buttonId]: !localButtonVisibility[buttonId]
    };

    // 更新本地状态
    setLocalButtonVisibility(newVisibility);

    // 更新Redux状态
    dispatch(updateToolbarButtons({
      order: localButtonOrder,
      visibility: newVisibility
    }));
  };

  // 重置为默认配置
  const handleResetToDefault = () => {
    const defaultOrder = ['mcp-tools', 'new-topic', 'clear-topic', 'generate-image', 'generate-video', 'knowledge', 'web-search'];
    const defaultVisibility = {
      'mcp-tools': true,
      'new-topic': true,
      'clear-topic': true,
      'generate-image': true,
      'generate-video': true,
      'knowledge': true,
      'web-search': true
    };

    setLocalButtonOrder(defaultOrder);
    setLocalButtonVisibility(defaultVisibility);

    dispatch(updateToolbarButtons({
      order: defaultOrder,
      visibility: defaultVisibility
    }));
  };

  // 玻璃样式预览
  const getGlassPreviewStyle = () => ({
    background: isDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.15)',
    border: isDarkMode
      ? '1px solid rgba(255, 255, 255, 0.12)'
      : '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '16px',
    padding: '8px 14px',
    backdropFilter: 'blur(12px) saturate(120%)',
    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
    boxShadow: isDarkMode
      ? '0 4px 16px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      : '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '36px',
    margin: '0 4px',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  // 透明样式预览
  const getTransparentPreviewStyle = () => ({
    background: 'transparent',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: '32px',
    margin: '0 2px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      background: isDarkMode
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.04)'
    }
  });

  return (
    <SafeAreaContainer>
      <AppBar
        position="static"
        elevation={0}
        className="status-bar-safe-area"
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
            <ArrowLeft size={24} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              backgroundImage: 'linear-gradient(90deg, #06b6d4, #0891b2)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {t('settings.appearance.toolbarCustomization.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
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
        {/* 工具栏样式选择 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {t('settings.appearance.toolbarCustomization.backgroundStyle.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('settings.appearance.toolbarCustomization.backgroundStyle.description')}
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={settings.toolbarStyle || 'glassmorphism'}
                onChange={handleToolbarStyleChange}
                sx={{ gap: { xs: 1.5, sm: 2 } }}
              >
                {/* 毛玻璃效果选项 */}
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: settings.toolbarStyle === 'glassmorphism' ? 2 : 1,
                    borderStyle: 'solid',
                    borderColor: settings.toolbarStyle === 'glassmorphism' 
                      ? 'primary.main' 
                      : 'divider',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                  onClick={() => dispatch(setToolbarStyle('glassmorphism'))}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 },
                      mb: { xs: 1.5, sm: 2 }
                    }}>
                      <FormControlLabel
                        value="glassmorphism"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                              {t('settings.appearance.toolbarCustomization.backgroundStyle.glassmorphism.label')}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                lineHeight: 1.4
                              }}
                            >
                              {t('settings.appearance.toolbarCustomization.backgroundStyle.glassmorphism.description')}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, flex: 1 }}
                      />
                      {settings.toolbarStyle === 'glassmorphism' && (
                        <Chip 
                          label={t('settings.appearance.toolbarCustomization.backgroundStyle.current')} 
                          size="small" 
                          color="primary"
                          sx={{ 
                            height: { xs: '24px', sm: '24px' },
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            mt: { xs: 0, sm: 0.5 }
                          }}
                        />
                      )}
                    </Box>
                    
                    {/* 毛玻璃效果预览 */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, sm: 1 },
                      p: { xs: 1, sm: 2 },
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'auto',
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      '&::-webkit-scrollbar': {
                        height: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '2px',
                      },
                    }}>
                      <Box sx={{
                        ...getGlassPreviewStyle(),
                        padding: { xs: '6px 10px', sm: '8px 14px' },
                        minHeight: { xs: '32px', sm: '36px' },
                        flex: { xs: '0 0 auto', sm: 'initial' },
                      }}>
                        <Plus size={14} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.newTopic')}
                        </Typography>
                      </Box>
                      <Box sx={{
                        ...getGlassPreviewStyle(),
                        padding: { xs: '6px 10px', sm: '8px 14px' },
                        minHeight: { xs: '32px', sm: '36px' },
                        flex: { xs: '0 0 auto', sm: 'initial' },
                      }}>
                        <Trash2 size={14} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.clearContent')}
                        </Typography>
                      </Box>
                      <Box sx={{
                        ...getGlassPreviewStyle(),
                        padding: { xs: '6px 10px', sm: '8px 14px' },
                        minHeight: { xs: '32px', sm: '36px' },
                        flex: { xs: '0 0 auto', sm: 'initial' },
                      }}>
                        <Wrench size={14} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.tools')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* 透明效果选项 */}
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: settings.toolbarStyle === 'transparent' ? 2 : 1,
                    borderStyle: 'solid',
                    borderColor: settings.toolbarStyle === 'transparent' 
                      ? 'primary.main' 
                      : 'divider',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                  onClick={() => dispatch(setToolbarStyle('transparent'))}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 },
                      mb: { xs: 1.5, sm: 2 }
                    }}>
                      <FormControlLabel
                        value="transparent"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                              {t('settings.appearance.toolbarCustomization.backgroundStyle.transparent.label')}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                lineHeight: 1.4
                              }}
                            >
                              {t('settings.appearance.toolbarCustomization.backgroundStyle.transparent.description')}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, flex: 1 }}
                      />
                      {settings.toolbarStyle === 'transparent' && (
                        <Chip 
                          label={t('settings.appearance.toolbarCustomization.backgroundStyle.current')} 
                          size="small" 
                          color="primary"
                          sx={{ 
                            height: { xs: '24px', sm: '24px' },
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            mt: { xs: 0, sm: 0.5 }
                          }}
                        />
                      )}
                    </Box>
                    
                    {/* 透明效果预览 */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, sm: 1 },
                      p: { xs: 1, sm: 2 },
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 2,
                      overflow: 'auto',
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      '&::-webkit-scrollbar': {
                        height: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '2px',
                      },
                    }}>
                      <Box sx={{
                        ...getTransparentPreviewStyle(),
                        padding: { xs: '6px 10px', sm: '6px 12px' },
                        minHeight: { xs: '28px', sm: '32px' },
                        flex: { xs: '0 0 auto', sm: 'initial' },
                      }}>
                        <Plus size={14} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.newTopic')}
                        </Typography>
                      </Box>
                      <Box sx={{
                        ...getTransparentPreviewStyle(),
                        padding: { xs: '6px 10px', sm: '6px 12px' },
                        minHeight: { xs: '28px', sm: '32px' },
                        flex: { xs: '0 0 auto', sm: 'initial' },
                      }}>
                        <Trash2 size={14} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.clearContent')}
                        </Typography>
                      </Box>
                      <Box sx={{
                        ...getTransparentPreviewStyle(),
                        padding: { xs: '6px 10px', sm: '6px 12px' },
                        minHeight: { xs: '28px', sm: '32px' },
                        flex: { xs: '0 0 auto', sm: 'initial' },
                      }}>
                        <Wrench size={14} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.tools')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </RadioGroup>
            </FormControl>
          </Box>
        </Paper>

        {/* 工具栏显示方式设置 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {t('settings.appearance.toolbarCustomization.displayStyle.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('settings.appearance.toolbarCustomization.displayStyle.description')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {t('settings.appearance.toolbarCustomization.displayStyle.label')}
              </InputLabel>
              <Select
                value={toolbarDisplayStyle}
                onChange={handleToolbarDisplayStyleChange}
                label={t('settings.appearance.toolbarCustomization.displayStyle.label')}
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
              >
                <MenuItem value="both" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('settings.appearance.toolbarCustomization.displayStyle.both')}
                </MenuItem>
                <MenuItem value="icon" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('settings.appearance.toolbarCustomization.displayStyle.icon')}
                </MenuItem>
                <MenuItem value="text" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('settings.appearance.toolbarCustomization.displayStyle.text')}
                </MenuItem>
              </Select>
            </FormControl>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                lineHeight: 1.4
              }}
            >
              {t('settings.appearance.toolbarCustomization.displayStyle.hint')}
            </Typography>

            {/* 预览效果 */}
            <Box sx={{
              mt: { xs: 2, sm: 3 },
              p: { xs: 1, sm: 2 },
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '2px',
              },
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  fontWeight: 600,
                  fontSize: { xs: '0.85rem', sm: '0.875rem' }
                }}
              >
                {t('settings.appearance.toolbarCustomization.displayStyle.preview')}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 0.5, sm: 1 },
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}>
                {/* 根据当前选择的样式显示预览 */}
                {toolbarDisplayStyle === 'both' && (
                  <>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                      flex: { xs: '0 0 auto', sm: 'initial' },
                    }}>
                      <Plus size={14} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '13px' }, fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.newTopic')}
                      </Typography>
                    </Box>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                      flex: { xs: '0 0 auto', sm: 'initial' },
                    }}>
                      <Trash2 size={14} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '13px' }, fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.clearContent')}
                      </Typography>
                    </Box>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                      flex: { xs: '0 0 auto', sm: 'initial' },
                    }}>
                      <Wrench size={14} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '13px' }, fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.tools')}
                      </Typography>
                    </Box>
                  </>
                )}
                {toolbarDisplayStyle === 'icon' && (
                  <>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                    }}>
                      <Plus size={14} />
                    </Box>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                    }}>
                      <Trash2 size={14} />
                    </Box>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                    }}>
                      <Wrench size={14} />
                    </Box>
                  </>
                )}
                {toolbarDisplayStyle === 'text' && (
                  <>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                      flex: { xs: '0 0 auto', sm: 'initial' },
                    }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '13px' }, fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.newTopic')}
                      </Typography>
                    </Box>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                      flex: { xs: '0 0 auto', sm: 'initial' },
                    }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '13px' }, fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.clearContent')}
                      </Typography>
                    </Box>
                    <Box sx={{
                      ...(settings.toolbarStyle === 'glassmorphism' ? getGlassPreviewStyle() : getTransparentPreviewStyle()),
                      padding: { xs: '6px 10px', sm: '8px 14px' },
                      minHeight: { xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' },
                      flex: { xs: '0 0 auto', sm: 'initial' },
                    }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '13px' }, fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {t('settings.appearance.toolbarCustomization.backgroundStyle.preview.tools')}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* 工具栏按钮自定义 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              justifyContent: 'space-between', 
              mb: 1,
              gap: 1
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.95rem', sm: '1rem' }
                  }}
                >
                  {t('settings.appearance.toolbarCustomization.buttonCustomization.title')}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.4
                  }}
                >
                  {t('settings.appearance.toolbarCustomization.buttonCustomization.description')}
                </Typography>
              </Box>
              <IconButton
                onClick={handleResetToDefault}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                  flexShrink: 0
                }}
              >
                <Wrench size={16} />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 3 }, position: 'relative' }}>
            {/* 防止复制的覆盖层 */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                '&::selection': {
                  background: 'transparent'
                },
                '& *::selection': {
                  background: 'transparent'
                }
              }}
            />

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="toolbar-buttons">
                {(provided, snapshot) => (
                  <List
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      transition: 'background-color 0.2s ease',
                      minHeight: 200,
                      position: 'relative',
                      zIndex: 2,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      '& *': {
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      },
                      '&::selection': {
                        background: 'transparent'
                      },
                      '& *::selection': {
                        background: 'transparent'
                      }
                    }}
                  >
                    {localButtonOrder.map((buttonId, index) => {
                      const buttonConfig = TOOLBAR_BUTTONS.find(btn => btn.id === buttonId);
                      if (!buttonConfig) return null;

                      const IconComponent = buttonConfig.icon;
                      const isVisible = localButtonVisibility[buttonId];

                      return (
                        <Draggable key={buttonId} draggableId={buttonId} index={index}>
                          {(provided, snapshot) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                mb: 0.75,
                                py: 0.5,
                                px: 1.5,
                                bgcolor: snapshot.isDragging 
                                  ? 'primary.light' 
                                  : (isVisible ? 'background.paper' : 'action.hover'),
                                borderRadius: 1,
                                borderWidth: '1px',
                                borderStyle: snapshot.isDragging ? 'solid' : (isVisible ? 'solid' : 'dashed'),
                                borderColor: snapshot.isDragging 
                                  ? 'primary.main' 
                                  : (isVisible ? 'divider' : 'text.disabled'),
                                transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                transition: 'all 0.2s ease',
                                filter: isVisible ? 'none' : 'grayscale(100%)',
                                opacity: 1,
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' },
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  borderStyle: 'solid',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <GripVertical size={16} color="rgba(0,0,0,0.4)" />
                              </ListItemIcon>

                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <IconComponent
                                  size={18}
                                  color={buttonConfig.color}
                                />
                              </ListItemIcon>

                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    {buttonConfig.label}
                                  </Typography>
                                }
                                secondary={buttonConfig.description}
                                secondaryTypographyProps={{
                                  variant: 'caption',
                                  sx: { 
                                    lineHeight: 1.3,
                                    display: 'block',
                                    mt: 0.25
                                  }
                                }}
                                sx={{ flex: 1, my: 0 }}
                              />

                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation(); // 防止触发拖拽
                                  handleVisibilityToggle(buttonId);
                                }}
                                sx={{
                                  color: isVisible ? 'primary.main' : 'text.disabled',
                                  ml: 1,
                                  '&:hover': {
                                    bgcolor: isVisible ? 'primary.light' : 'action.hover'
                                  }
                                }}
                              >
                                {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                              </IconButton>
                            </ListItem>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>

            {/* 实时预览 */}
            <Box sx={{ mt: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  fontWeight: 600,
                  fontSize: { xs: '0.85rem', sm: '0.875rem' }
                }}
              >
                {t('settings.appearance.toolbarCustomization.buttonCustomization.livePreview')}
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: { xs: 0.5, sm: 1 },
                p: { xs: 1, sm: 2 },
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                borderRadius: 2,
                flexWrap: 'wrap',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '2px',
                },
              }}>
                {localButtonOrder
                  .filter(buttonId => localButtonVisibility[buttonId])
                  .map(buttonId => {
                    const buttonConfig = TOOLBAR_BUTTONS.find(btn => btn.id === buttonId);
                    if (!buttonConfig) return null;

                    const IconComponent = buttonConfig.icon;
                    const previewStyle = settings.toolbarStyle === 'glassmorphism'
                      ? getGlassPreviewStyle()
                      : getTransparentPreviewStyle();

                    return (
                      <Box 
                        key={buttonId} 
                        sx={{
                          ...previewStyle,
                          padding: { xs: '6px 10px', sm: '8px 14px' },
                          minHeight: { 
                            xs: settings.toolbarStyle === 'glassmorphism' ? '32px' : '28px', 
                            sm: settings.toolbarStyle === 'glassmorphism' ? '36px' : '32px' 
                          },
                          flex: { xs: '0 0 auto', sm: 'initial' },
                        }}
                      >
                        {toolbarDisplayStyle !== 'text' && (
                          <IconComponent size={14} color={buttonConfig.color} />
                        )}
                        {toolbarDisplayStyle !== 'icon' && (
                          <Typography variant="body2" sx={{
                            fontSize: { xs: '11px', sm: '13px' },
                            fontWeight: settings.toolbarStyle === 'glassmorphism' ? 600 : 500,
                            ml: toolbarDisplayStyle === 'both' ? 0.5 : 0,
                            whiteSpace: 'nowrap'
                          }}>
                            {buttonConfig.label}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </SafeAreaContainer>
  );
};

export default ToolbarCustomization;
