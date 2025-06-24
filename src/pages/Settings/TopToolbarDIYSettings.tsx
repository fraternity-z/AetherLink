import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { updateSettings } from '../../shared/store/settingsSlice';
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
  Type,
  MessageSquare,
  Hand,
  Wand2,
  RotateCcw,
  EyeOff
} from 'lucide-react';
import { CustomIcon } from '../../components/icons';
import useScrollPosition from '../../hooks/useScrollPosition';

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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const previewRef = useRef<HTMLDivElement>(null);

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-top-toolbar', {
    autoRestore: true,
    restoreDelay: 100
  });

  // 获取当前工具栏设置
  const topToolbar = settings.topToolbar || {
    showSettingsButton: true,
    showModelSelector: true,
    modelSelectorStyle: 'dialog',
    showChatTitle: true,
    showTopicName: false,
    showNewTopicButton: false,
    showClearButton: false,
    showSearchButton: false,
    showMenuButton: true,
    componentPositions: []
  };

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
    menuButton: { name: '菜单按钮', icon: <CustomIcon name="documentPanel" size={20} />, key: 'showMenuButton' },
    chatTitle: { name: '对话标题', icon: <Type size={20} />, key: 'showChatTitle' },
    topicName: { name: '话题名称', icon: <MessageSquare size={20} />, key: 'showTopicName' },
    newTopicButton: { name: '新建话题', icon: <Plus size={20} />, key: 'showNewTopicButton' },
    clearButton: { name: '清空按钮', icon: <Trash2 size={20} />, key: 'showClearButton' },
    searchButton: { name: '搜索按钮', icon: <CustomIcon name="search" size={20} />, key: 'showSearchButton' },
    modelSelector: { name: '模型选择器', icon: <Bot size={20} />, key: 'showModelSelector' },
    settingsButton: { name: '设置按钮', icon: <Settings size={20} />, key: 'showSettingsButton' },
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
    }, 300); // 减少到300ms，更快响应

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

  // 全局鼠标移动监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragState.isDragging && e.touches[0]) {
        setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        e.preventDefault(); // 防止页面滚动
      }
    };

    const handleGlobalUp = (e: MouseEvent | TouchEvent) => {
      if (dragState.isDragging) {
        // 检查是否在预览区域内释放
        if (previewRef.current) {
          const rect = previewRef.current.getBoundingClientRect();
          const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
          const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;

          // 如果在预览区域内释放，触发放置
          if (clientX >= rect.left && clientX <= rect.right &&
              clientY >= rect.top && clientY <= rect.bottom) {
            handleDrop(e as any);
            return;
          }
        }
      }

      if (dragState.isDragging || dragState.isLongPressing) {
        handleDragStop();
      }
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalUp);
      document.addEventListener('touchend', handleGlobalUp);
      document.addEventListener('touchcancel', handleGlobalUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleGlobalUp);
      document.removeEventListener('touchend', handleGlobalUp);
      document.removeEventListener('touchcancel', handleGlobalUp);
    };
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
      case 'chatTitle':
        return (
          <Typography key={componentId} variant="h6" noWrap component="div" sx={style}>
            对话
          </Typography>
        );
      case 'topicName':
        return (
          <Typography key={componentId} variant="body1" noWrap sx={{ ...style, color: 'text.secondary' }}>
            示例话题
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
    <Box sx={{
      height: '100vh',
      backgroundColor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: 2,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        zIndex: 10,
        flexShrink: 0
      }}>
        <ArrowLeft
          size={20}
          style={{ marginRight: 16, cursor: 'pointer' }}
          onClick={handleBack}
        />
        <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>
          顶部工具栏 DIY 设置
        </Typography>
        <Button
          startIcon={<RotateCcw size={16} />}
          onClick={handleResetLayout}
          size="small"
          variant="outlined"
        >
          重置布局
        </Button>
      </Box>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{ p: 2, flex: 1, overflow: 'auto' }}
      >
        {/* DIY 预览区域和组件面板 - 连在一起 */}
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
          {/* DIY 预览区域标题 */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Wand2 size={20} color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              DIY 布局预览
            </Typography>
            <Tooltip title="拖拽下方组件到此区域进行自由布局">
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
                      拖拽下方组件到此区域
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
              <Typography variant="subtitle1">可用组件</Typography>
              <Tooltip title="长按组件拖拽到上方预览区域进行布局">
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
                          已放置
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
              💡 提示：长按组件0.3秒后开始拖拽到上方预览区域。长按时卡片会变黄色提示。已放置的组件下方有小眼睛按钮，点击可隐藏。
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
              矫正对齐
            </Button>
          </Box>

          {/* 模型选择器显示样式设置 */}
          <Box sx={{
            p: 2,
            borderTop: '1px solid #ddd',
            bgcolor: 'background.default'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">模型选择器显示样式</Typography>
              <Tooltip title="选择模型选择器在DIY布局中的显示样式">
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
                label="图标模式（只显示机器人图标）"
              />
              <FormControlLabel
                value="text"
                control={<Radio size="small" />}
                label="文字模式（显示模型名+供应商名）"
              />
            </RadioGroup>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              图标模式更紧凑，文字模式更直观显示当前模型。
            </Typography>
          </Box>
        </Paper>







        {/* 使用说明 */}
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            🎨 DIY 布局使用说明
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              首先在"组件显示设置"中开启需要的组件
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              长按"可用组件"中的组件并拖拽到预览区域
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              可以将组件放置在工具栏的任意位置
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              点击已放置组件右上角的红色关闭按钮可移除单个组件
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              点击"重置布局"可以清除所有自定义位置
            </Typography>
            <Typography component="li" variant="body2">
              设置会实时保存并应用到聊天页面
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default TopToolbarDIYSettings;
