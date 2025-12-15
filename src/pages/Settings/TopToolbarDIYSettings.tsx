import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { updateSettings } from '../../shared/store/settingsSlice';
import { useTranslation } from '../../i18n';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Card,
  Grid,
  AppBar,
  Toolbar,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';

import {
  ArrowLeft,
  Info,
  Settings,
  Plus,
  Trash2,
  Bot,
  MessageSquare,
  Hand,
  Wand2,
  RotateCcw,
  EyeOff,
} from 'lucide-react';
import { CustomIcon } from '../../components/icons';
import useScrollPosition from '../../hooks/useScrollPosition';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

interface ComponentPosition {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface DragState {
  isDragging: boolean;
  draggedComponent: string | null;
  isLongPressing: boolean;
  longPressTimer: NodeJS.Timeout | null;
}

const TopToolbarDIYSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const previewRef = useRef<HTMLDivElement>(null);

  // 使用滚动位置保存功能（useLayoutEffect 立即恢复，不需要延迟）
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-top-toolbar', {
    autoRestore: true,
    restoreDelay: 0  // 使用 useLayoutEffect 立即恢复，此参数已不再使用
  });

  // 获取当前工具栏设置
  const topToolbar = useMemo(() => settings.topToolbar || {
    showSettingsButton: true,
    showModelSelector: true,
    modelSelectorStyle: 'dialog',
    showTopicName: true,
    showNewTopicButton: false,
    showClearButton: false,
    showSearchButton: false,
    showMenuButton: true,
    componentPositions: []
  }, [settings.topToolbar]);

  // 获取当前DIY布局中的组件列表
  const currentDIYComponents = topToolbar.componentPositions || [];

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedComponent: null,
    isLongPressing: false,
    longPressTimer: null
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 组件配置
  const componentConfig = {
    menuButton: { name: t('settings.appearance.topToolbarDIY.components.menuButton'), icon: <CustomIcon name="documentPanel" size={20} />, key: 'showMenuButton' },
    topicName: { name: t('settings.appearance.topToolbarDIY.components.topicName'), icon: <MessageSquare size={20} />, key: 'showTopicName' },
    newTopicButton: { name: t('settings.appearance.topToolbarDIY.components.newTopicButton'), icon: <Plus size={20} />, key: 'showNewTopicButton' },
    clearButton: { name: t('settings.appearance.topToolbarDIY.components.clearButton'), icon: <Trash2 size={20} />, key: 'showClearButton' },
    searchButton: { name: t('settings.appearance.topToolbarDIY.components.searchButton'), icon: <CustomIcon name="search" size={20} />, key: 'showSearchButton' },
    modelSelector: { name: t('settings.appearance.topToolbarDIY.components.modelSelector'), icon: <Bot size={20} />, key: 'showModelSelector' },
    settingsButton: { name: t('settings.appearance.topToolbarDIY.components.settingsButton'), icon: <Settings size={20} />, key: 'showSettingsButton' },
    condenseButton: { name: t('settings.appearance.topToolbarDIY.components.condenseButton'), icon: <CustomIcon name="foldVertical" size={20} />, key: 'showCondenseButton' },
  };

  const handleBack = () => {
    navigate('/settings/appearance');
  };



  // 开始长按检测
  const handlePressStart = useCallback((componentId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    // 清理之前的计时器
    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer);
    }

    // 设置长按计时器
    const timer = setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedComponent: componentId,
        isLongPressing: false,
        longPressTimer: null
      }));
      setMousePosition({ x: clientX, y: clientY });
    }, 300);

    setDragState(prev => ({
      ...prev,
      isLongPressing: true,
      longPressTimer: timer
    }));
  }, [dragState.longPressTimer]);

  // 取消长按 - 只在还没开始拖拽时取消
  const handlePressCancel = useCallback(() => {
    // 如果已经开始拖拽，就不要取消了
    if (dragState.isDragging) return;

    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer);
    }

    setDragState(prev => ({
      ...prev,
      isLongPressing: false,
      longPressTimer: null
    }));
  }, [dragState.longPressTimer, dragState.isDragging]);

  // 停止拖拽
  const handleDragStop = useCallback(() => {
    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer);
    }

    setDragState({
      isDragging: false,
      draggedComponent: null,
      isLongPressing: false,
      longPressTimer: null
    });
  }, [dragState.longPressTimer]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer);
      }
    };
  }, [dragState.longPressTimer]);

  // 全局鼠标移动监听和滚动阻止
  useEffect(() => {
    if (!dragState.isDragging && !dragState.isLongPressing) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (dragState.isDragging && e.touches[0]) {
        setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalUp = (e: MouseEvent | TouchEvent) => {
      if (dragState.isDragging && previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          handleDrop(e as any);
          return;
        }
      }
      handleDragStop();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchend', handleGlobalUp);
    document.addEventListener('touchcancel', handleGlobalUp);
    document.addEventListener('mouseup', handleGlobalUp);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleGlobalUp);
      document.removeEventListener('touchcancel', handleGlobalUp);
      document.removeEventListener('mouseup', handleGlobalUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState.isDragging, dragState.isLongPressing, handleDragStop]);

  // 处理放置到预览区域
  const handleDrop = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedComponent || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // 限制在预览区域内，但允许更大的范围
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    const newPositions = [...(topToolbar.componentPositions || [])];
    const existingIndex = newPositions.findIndex(pos => pos.id === dragState.draggedComponent);

    const newPosition: ComponentPosition = {
      id: dragState.draggedComponent,
      x: clampedX,
      y: clampedY
    };

    if (existingIndex >= 0) {
      newPositions[existingIndex] = newPosition;
    } else {
      newPositions.push(newPosition);
    }

    dispatch(updateSettings({
      topToolbar: {
        ...topToolbar,
        componentPositions: newPositions
      }
    }));

    handleDragStop();
  }, [dragState, topToolbar, dispatch, handleDragStop]);

  // 渲染真实的工具栏组件 - 复用实际的工具栏实现
  const renderRealToolbarComponent = (componentId: string, position: ComponentPosition) => {
    const style = {
      position: 'absolute' as const,
      left: `${position.x}%`,
      top: `${position.y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: 10
    };

    switch (componentId) {
      case 'menuButton':
        return (
          <IconButton
            key={componentId}
            edge="start"
            color="inherit"
            sx={{ ...style, mr: 0 }}
            size="small"
          >
            <CustomIcon name="documentPanel" size={20} />
          </IconButton>
        );
      case 'topicName':
        return (
          <Typography key={componentId} variant="h6" noWrap component="div" sx={style}>
            {t('settings.appearance.topToolbarDIY.preview.topicNameExample')}
          </Typography>
        );
      case 'newTopicButton':
        return (
          <IconButton key={componentId} color="inherit" size="small" sx={style}>
            <Plus size={20} />
          </IconButton>
        );
      case 'clearButton':
        return (
          <IconButton key={componentId} color="inherit" size="small" sx={style}>
            <Trash2 size={20} />
          </IconButton>
        );
      case 'searchButton':
        return (
          <IconButton key={componentId} color="inherit" size="small" sx={style}>
            <CustomIcon name="search" size={20} />
          </IconButton>
        );
      case 'modelSelector':
        return (topToolbar.modelSelectorDisplayStyle || 'icon') === 'icon' ? (
          <IconButton key={componentId} color="inherit" size="small" sx={style}>
            <Bot size={20} />
          </IconButton>
        ) : (
          <Button
            key={componentId}
            variant="outlined"
            size="small"
            startIcon={<Bot size={16} />}
            sx={{
              ...style,
              borderColor: 'divider',
              color: 'text.primary',
              textTransform: 'none',
              minWidth: 'auto',
              fontSize: '0.75rem'
            }}
          >
            GPT-4
          </Button>
        );
      case 'settingsButton':
        return (
          <IconButton key={componentId} color="inherit" size="small" sx={style}>
            <Settings size={20} />
          </IconButton>
        );
      case 'condenseButton':
        return (
          <IconButton key={componentId} color="inherit" size="small" sx={style}>
            <CustomIcon name="foldVertical" size={20} />
          </IconButton>
        );
      default:
        return null;
    }
  };

  // 渲染拖拽中的组件 - 只显示图标，便于精确定位
  const renderDraggedComponent = (componentId: string) => {
    const config = componentConfig[componentId as keyof typeof componentConfig];
    if (!config) return null;

    return (
      <Box sx={{
        width: 32,
        height: 32,
        backgroundColor: 'rgba(25, 118, 210, 0.9)',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '2px solid white'
      }}>
        {React.cloneElement(config.icon, { size: 16, color: 'white' })}
      </Box>
    );
  };

  // 重置布局
  const handleResetLayout = () => {
    dispatch(updateSettings({
      topToolbar: {
        ...topToolbar,
        componentPositions: []
      }
    }));
  };

  // 移除组件
  const handleRemoveComponent = (componentId: string) => {
    const newPositions = (topToolbar.componentPositions || []).filter(pos => pos.id !== componentId);
    dispatch(updateSettings({
      topToolbar: {
        ...topToolbar,
        componentPositions: newPositions
      }
    }));
  };

  return (
    <SafeAreaContainer sx={{
      backgroundColor: 'background.default',
    }}>
      {/* 头部 - 使用 AppBar + Toolbar 以获得全局安全区域配置 */}
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
            sx={{ color: (theme) => theme.palette.primary.main }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {t('settings.appearance.topToolbarDIY.title')}
          </Typography>
          <Button
            startIcon={<RotateCcw size={16} />}
            onClick={handleResetLayout}
            size="small"
            variant="outlined"
          >
            {t('settings.appearance.topToolbarDIY.resetButton')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{ p: 2, flex: 1, overflow: 'auto', pb: 'var(--content-bottom-padding)' }}
      >
        {/* DIY 预览区域和组件面板 - 连在一起 */}
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
          {/* DIY 预览区域标题 */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Wand2 size={20} color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('settings.appearance.topToolbarDIY.preview.title')}
            </Typography>
            <Tooltip title={t('settings.appearance.topToolbarDIY.preview.tooltip')}>
              <IconButton size="small">
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 真实的工具栏预览 - 复用实际工具栏结构 */}
          <Box
            ref={previewRef}
            sx={{
              position: 'relative',
              border: '2px dashed',
              borderColor: dragState.isDragging ? 'success.main' : 'primary.main',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              overflow: 'hidden',
              transition: 'border-color 0.2s'
            }}
            onMouseUp={handleDrop}
            onTouchEnd={handleDrop}
          >
            <AppBar
              position="static"
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Toolbar sx={{
                position: 'relative',
                minHeight: '56px !important',
                justifyContent: currentDIYComponents.length > 0 ? 'center' : 'space-between',
                userSelect: 'none',
                px: 0, // 移除左右padding限制
                '&.MuiToolbar-root': {
                  paddingLeft: 0,
                  paddingRight: 0
                }
              }}>
                {/* 渲染已放置的组件 */}
                {currentDIYComponents.map((position) =>
                  renderRealToolbarComponent(position.id, position)
                )}

                {/* 提示文字 */}
                {currentDIYComponents.length === 0 && (
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'text.secondary'
                  }}>
                    <Hand size={24} style={{ marginBottom: 4, opacity: 0.5 }} />
                    <Typography variant="body2">
                      {t('settings.appearance.topToolbarDIY.preview.emptyHint')}
                    </Typography>
                  </Box>
                )}
              </Toolbar>
            </AppBar>

            {/* 拖拽中的组件 */}
            {dragState.isDragging && dragState.draggedComponent && (
              <Box sx={{
                position: 'fixed',
                left: mousePosition.x,
                top: mousePosition.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                opacity: 0.8,
                pointerEvents: 'none'
              }}>
                {renderDraggedComponent(dragState.draggedComponent)}
              </Box>
            )}
          </Box>

          {/* 组件面板 - 直接连接在预览区域下方 */}
          <Box sx={{
            p: 2,
            borderTop: '1px solid #ddd', // 添加分隔线
            bgcolor: 'background.default' // 稍微不同的背景色区分
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">{t('settings.appearance.topToolbarDIY.componentPanel.title')}</Typography>
              <Tooltip title={t('settings.appearance.topToolbarDIY.componentPanel.tooltip')}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info size={16} />
                </IconButton>
              </Tooltip>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(componentConfig).map(([componentId, config]) => {
                const isEnabled = true; // 全部开启
                const isPlaced = (topToolbar.componentPositions || []).some(pos => pos.id === componentId);

                return (
                  <Grid size={{ xs: 3, sm: 2, md: 1.5 }} key={componentId}>
                    <Card
                      sx={{
                        p: 0.5,
                        textAlign: 'center',
                        cursor: isEnabled ? 'grab' : 'not-allowed',
                        opacity: isEnabled ? 1 : 0.5,
                        border: isPlaced ? '2px solid' : '1px solid',
                        borderColor: isPlaced ? 'success.main' :
                                    (dragState.isLongPressing && dragState.draggedComponent === componentId) ? 'warning.main' : 'divider',
                        bgcolor: isPlaced ? 'background.paper' :
                                (dragState.isLongPressing && dragState.draggedComponent === componentId) ? 'warning.light' : 'background.paper',
                        transition: 'all 0.2s ease',
                        minHeight: 60,
                        maxWidth: 80,
                        mx: 'auto',
                        position: 'relative',
                        transform: (dragState.isLongPressing && dragState.draggedComponent === componentId) ? 'scale(1.05)' : 'none',
                        userSelect: 'none',
                        touchAction: 'none',
                        '&:hover': isEnabled ? {
                          transform: 'translateY(-1px)',
                          boxShadow: 1
                        } : {},
                        '&:active': isEnabled ? {
                          cursor: 'grabbing',
                          transform: 'scale(0.9)'
                        } : {}
                      }}
                      onMouseDown={isEnabled ? (e) => handlePressStart(componentId, e) : undefined}
                      onTouchStart={isEnabled ? (e) => handlePressStart(componentId, e) : undefined}
                      onMouseUp={handlePressCancel}
                      onTouchEnd={handlePressCancel}
                      onTouchCancel={handlePressCancel}
                    >
                      <Box sx={{ mb: 0.25, color: isEnabled ? 'primary.main' : 'text.disabled' }}>
                        {React.cloneElement(config.icon, { size: 14 })}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          color: isEnabled ? 'text.primary' : 'text.disabled',
                          fontSize: '0.6rem',
                          lineHeight: 1.1,
                          display: 'block'
                        }}
                      >
                        {config.name}
                      </Typography>
                      {isPlaced && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.1, fontSize: '0.55rem' }}>
                          {t('settings.appearance.topToolbarDIY.componentPanel.placed')}
                        </Typography>
                      )}
                    </Card>
                    {isPlaced && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveComponent(componentId);
                          }}
                          sx={{
                            width: 20,
                            height: 20,
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'error.main'
                            }
                          }}
                        >
                          <EyeOff size={12} />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                );
              })}
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('settings.appearance.topToolbarDIY.componentPanel.hint')}
            </Typography>
          </Box>

          {/* 矫正按钮 */}
          <Box sx={{
            p: 2,
            borderTop: '1px solid #ddd',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Button
              variant="outlined"
              startIcon={<Settings size={16} />}
              onClick={() => {
                // 矫正所有组件到水平中线（50%）
                const correctedPositions = currentDIYComponents.map(pos => ({
                  ...pos,
                  y: 50 // 统一设置为50%，即工具栏的垂直中心
                }));

                dispatch(updateSettings({
                  topToolbar: {
                    ...topToolbar,
                    componentPositions: correctedPositions
                  }
                }));
              }}
              disabled={currentDIYComponents.length === 0}
              sx={{
                textTransform: 'none',
                borderColor: 'primary.main',
                color: 'primary.main'
              }}
            >
              {t('settings.appearance.topToolbarDIY.alignButton')}
            </Button>
          </Box>

          {/* 模型选择器显示样式设置 */}
          <Box sx={{
            p: 2,
            borderTop: '1px solid #ddd',
            bgcolor: 'background.default'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">{t('settings.appearance.topToolbarDIY.modelSelector.title')}</Typography>
              <Tooltip title={t('settings.appearance.topToolbarDIY.modelSelector.tooltip')}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info size={16} />
                </IconButton>
              </Tooltip>
            </Box>

            <RadioGroup
              value={topToolbar.modelSelectorDisplayStyle || 'icon'}
              onChange={(e) => {
                dispatch(updateSettings({
                  topToolbar: {
                    ...topToolbar,
                    modelSelectorDisplayStyle: e.target.value as 'icon' | 'text'
                  }
                }));
              }}
            >
              <FormControlLabel
                value="icon"
                control={<Radio size="small" />}
                label={t('settings.appearance.topToolbarDIY.modelSelector.iconMode')}
              />
              <FormControlLabel
                value="text"
                control={<Radio size="small" />}
                label={t('settings.appearance.topToolbarDIY.modelSelector.textMode')}
              />
            </RadioGroup>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('settings.appearance.topToolbarDIY.modelSelector.hint')}
            </Typography>
          </Box>
        </Paper>







        {/* 使用说明 */}
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('settings.appearance.topToolbarDIY.instructions.title')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('settings.appearance.topToolbarDIY.instructions.step1')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('settings.appearance.topToolbarDIY.instructions.step2')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('settings.appearance.topToolbarDIY.instructions.step3')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('settings.appearance.topToolbarDIY.instructions.step4')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('settings.appearance.topToolbarDIY.instructions.step5')}
            </Typography>
            <Typography component="li" variant="body2">
              {t('settings.appearance.topToolbarDIY.instructions.step6')}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </SafeAreaContainer>
  );
};

export default TopToolbarDIYSettings;
