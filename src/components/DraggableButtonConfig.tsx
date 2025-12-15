import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useTranslation } from '../i18n';

interface ButtonConfig {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

interface DraggableButtonConfigProps {
  availableButtons: ButtonConfig[];
  leftButtons: string[];
  rightButtons: string[];
  onUpdateLayout: (leftButtons: string[], rightButtons: string[]) => void;
}

const DraggableButtonConfig: React.FC<DraggableButtonConfigProps> = ({
  availableButtons,
  leftButtons,
  rightButtons,
  onUpdateLayout
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // 检测是否为触摸设备
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // 创建按钮映射
  const buttonMap = React.useMemo(() => {
    const map = new Map<string, ButtonConfig>();
    availableButtons.forEach(button => {
      map.set(button.id, button);
    });
    return map;
  }, [availableButtons]);

  // 获取未使用的按钮列表
  const unusedButtons = availableButtons.filter(button =>
    !leftButtons.includes(button.id) && !rightButtons.includes(button.id)
  );

  const handleToggleVisibility = useCallback((buttonId: string) => {
    const isInLeft = leftButtons.includes(buttonId);
    const isInRight = rightButtons.includes(buttonId);

    if (isInLeft || isInRight) {
      // 隐藏按钮 - 从对应列表中移除
      const newLeftButtons = leftButtons.filter(id => id !== buttonId);
      const newRightButtons = rightButtons.filter(id => id !== buttonId);
      onUpdateLayout(newLeftButtons, newRightButtons);
    } else {
      // 显示按钮 - 默认添加到左侧
      onUpdateLayout([...leftButtons, buttonId], rightButtons);
    }
  }, [leftButtons, rightButtons, onUpdateLayout]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // 如果在同一个列表内重新排序
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'left-buttons') {
        const newLeftButtons = Array.from(leftButtons);
        newLeftButtons.splice(source.index, 1);
        newLeftButtons.splice(destination.index, 0, draggableId);
        onUpdateLayout(newLeftButtons, rightButtons);
      } else if (source.droppableId === 'right-buttons') {
        const newRightButtons = Array.from(rightButtons);
        newRightButtons.splice(source.index, 1);
        newRightButtons.splice(destination.index, 0, draggableId);
        onUpdateLayout(leftButtons, newRightButtons);
      }
      // 未使用按钮区域内的排序不需要处理，因为顺序不重要
    } else {
      // 在不同列表间移动
      if (source.droppableId === 'left-buttons' && destination.droppableId === 'right-buttons') {
        // 从左侧移动到右侧
        const newLeftButtons = leftButtons.filter(id => id !== draggableId);
        const newRightButtons = Array.from(rightButtons);
        newRightButtons.splice(destination.index, 0, draggableId);
        onUpdateLayout(newLeftButtons, newRightButtons);
      } else if (source.droppableId === 'right-buttons' && destination.droppableId === 'left-buttons') {
        // 从右侧移动到左侧
        const newRightButtons = rightButtons.filter(id => id !== draggableId);
        const newLeftButtons = Array.from(leftButtons);
        newLeftButtons.splice(destination.index, 0, draggableId);
        onUpdateLayout(newLeftButtons, newRightButtons);
      } else if (source.droppableId === 'unused-buttons') {
        // 从未使用列表拖拽到左侧或右侧
        if (destination.droppableId === 'left-buttons') {
          const newLeftButtons = Array.from(leftButtons);
          newLeftButtons.splice(destination.index, 0, draggableId);
          onUpdateLayout(newLeftButtons, rightButtons);
        } else if (destination.droppableId === 'right-buttons') {
          const newRightButtons = Array.from(rightButtons);
          newRightButtons.splice(destination.index, 0, draggableId);
          onUpdateLayout(leftButtons, newRightButtons);
        }
      } else if (destination.droppableId === 'unused-buttons') {
        // 从左侧或右侧拖拽回未使用列表（移除按钮）
        if (source.droppableId === 'left-buttons') {
          const newLeftButtons = leftButtons.filter(id => id !== draggableId);
          onUpdateLayout(newLeftButtons, rightButtons);
        } else if (source.droppableId === 'right-buttons') {
          const newRightButtons = rightButtons.filter(id => id !== draggableId);
          onUpdateLayout(leftButtons, newRightButtons);
        }
      }
    }
  }, [leftButtons, rightButtons, onUpdateLayout]);

  const renderButtonItem = (button: ButtonConfig, index: number, isVisible: boolean) => {
    const IconComponent = button.icon;

    return (
      <Draggable key={button.id} draggableId={button.id} index={index}>
        {(provided, snapshot) => (
          <ListItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            sx={{
              mb: 0.75,
              py: 0.5,
              px: 1.5,
              bgcolor: snapshot.isDragging ? 'primary.light' : 'background.paper',
              borderRadius: 1,
              borderWidth: '1px',
              borderStyle: snapshot.isDragging ? 'solid' : (isVisible ? 'solid' : 'dashed'),
              borderColor: snapshot.isDragging ? 'primary.main' : (isVisible ? 'divider' : 'text.disabled'),
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
              },
              // 优化触摸设备样式
              ...(isTouchDevice && {
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
              })
            }}
          >
            <ListItemIcon 
              {...provided.dragHandleProps}
              sx={{ 
                minWidth: 36,
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
                ...(isTouchDevice && {
                  WebkitTapHighlightColor: 'transparent',
                })
              }}
            >
              <GripVertical 
                size={16} 
                color="rgba(0,0,0,0.4)" 
                style={{ 
                  ...(isTouchDevice && {
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  })
                }}
              />
            </ListItemIcon>

            <ListItemIcon sx={{ minWidth: 36 }}>
              <IconComponent size={18} color={button.color} />
            </ListItemIcon>

            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {button.label}
                </Typography>
              }
              secondary={button.description}
              secondaryTypographyProps={{
                variant: 'caption',
                sx: { 
                  lineHeight: 1.3,
                  display: 'block',
                  mt: 0.25,
                  fontSize: '0.75rem'
                }
              }}
              sx={{ flex: 1, my: 0 }}
            />

            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleToggleVisibility(button.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              sx={{
                color: isVisible ? 'primary.main' : 'text.disabled',
                ml: 1,
                position: 'relative',
                zIndex: 10,
                pointerEvents: 'auto',
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
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        flexDirection: { xs: 'column', md: 'row' },
        padding: 0
      }}>
        {/* 左侧按钮区域 */}
        <Box sx={{ 
          flex: 1, 
          minWidth: isMobile ? '100%' : '300px',
          maxWidth: isMobile ? '100%' : '50%'
        }}>
          <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.9rem' }}>
            {t('settings.appearance.inputBox.draggableButtonConfig.leftButtons')}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({leftButtons.length}{t('settings.appearance.inputBox.draggableButtonConfig.count')})
            </Typography>
          </Typography>

          <Paper 
            sx={{ 
              p: 0.75, 
              minHeight: 150, 
              backgroundColor: 'rgba(25, 118, 210, 0.02)',
              border: '1px dashed #90caf9'
            }}
          >
            <Droppable droppableId="left-buttons">
              {(provided) => (
                <List
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ 
                    minHeight: 120,
                    padding: 0
                  }}
                >
                  {leftButtons.map((buttonId, index) => {
                    const button = buttonMap.get(buttonId);
                    if (!button) return null;
                    return renderButtonItem(button, index, true);
                  })}
                  {provided.placeholder}
                  {leftButtons.length === 0 && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        textAlign: 'center', 
                        py: 3,
                        fontStyle: 'italic',
                        fontSize: '0.8rem'
                      }}
                    >
                      {t('settings.appearance.inputBox.draggableButtonConfig.dragHere')}
                    </Typography>
                  )}
                </List>
              )}
            </Droppable>
          </Paper>
        </Box>

        {/* 右侧按钮区域 */}
        <Box sx={{ 
          flex: 1, 
          minWidth: isMobile ? '100%' : '300px',
          maxWidth: isMobile ? '100%' : '50%'
        }}>
          <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.9rem' }}>
            {t('settings.appearance.inputBox.draggableButtonConfig.rightButtons')}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({rightButtons.length}{t('settings.appearance.inputBox.draggableButtonConfig.count')})
            </Typography>
          </Typography>

          <Paper 
            sx={{ 
              p: 0.75, 
              minHeight: 150, 
              backgroundColor: 'rgba(76, 175, 80, 0.02)',
              border: '1px dashed #a5d6a7'
            }}
          >
            <Droppable droppableId="right-buttons">
              {(provided) => (
                <List
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ 
                    minHeight: 120,
                    padding: 0
                  }}
                >
                  {rightButtons.map((buttonId, index) => {
                    const button = buttonMap.get(buttonId);
                    if (!button) return null;
                    return renderButtonItem(button, index, true);
                  })}
                  {provided.placeholder}
                  {rightButtons.length === 0 && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        textAlign: 'center', 
                        py: 3,
                        fontStyle: 'italic',
                        fontSize: '0.8rem'
                      }}
                    >
                      {t('settings.appearance.inputBox.draggableButtonConfig.dragHere')}
                    </Typography>
                  )}
                </List>
              )}
            </Droppable>
          </Paper>
        </Box>
      </Box>

      {/* 可用按钮区域 - 始终显示 */}
      <Box sx={{ 
        mt: 1.5,
        padding: 0
      }}>
        <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.9rem' }}>
          {t('settings.appearance.inputBox.draggableButtonConfig.availableButtons')} ({unusedButtons.length}{t('settings.appearance.inputBox.draggableButtonConfig.count')})
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontSize: '0.75rem' }}>
          {t('settings.appearance.inputBox.draggableButtonConfig.dragToUse')}
        </Typography>
        <Paper 
          sx={{ 
            p: 0.75, 
            minHeight: 80, 
            backgroundColor: 'rgba(158, 158, 158, 0.02)',
            border: '1px dashed #bdbdbd'
          }}
        >
          <Droppable droppableId="unused-buttons">
            {(provided, snapshot) => (
              <List
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: '1fr', 
                    sm: 'repeat(2, 1fr)', 
                    md: 'repeat(3, 1fr)', 
                    lg: 'repeat(4, 1fr)'
                  },
                  gap: 0.75,
                  minHeight: 60,
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(158, 158, 158, 0.1)' : 'transparent',
                  borderRadius: 1,
                  transition: 'background-color 0.2s ease',
                  padding: 0
                }}
              >
                {unusedButtons.map((button, index) =>
                  renderButtonItem(button, index, false)
                )}
                {provided.placeholder}
                {unusedButtons.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: 3,
                      gridColumn: '1 / -1',
                      fontStyle: 'italic',
                      fontSize: '0.8rem'
                    }}
                  >
                    {snapshot.isDraggingOver 
                      ? t('settings.appearance.inputBox.draggableButtonConfig.releaseToRemove')
                      : t('settings.appearance.inputBox.draggableButtonConfig.allUsed')}
                  </Typography>
                )}
              </List>
            )}
          </Droppable>
        </Paper>
      </Box>
    </DragDropContext>
  );
};

export default DraggableButtonConfig;



