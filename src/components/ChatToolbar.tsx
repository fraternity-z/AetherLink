import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, useTheme, IconButton } from '@mui/material';
// Lucide Icons - 按需导入，高端简约设计
import { Plus, Trash2, AlertTriangle, Camera, Search, ChevronLeft, BookOpen } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../shared/store';
import { TopicService } from '../shared/services/TopicService';
import { EventEmitter, EVENT_NAMES } from '../shared/services/EventService';
import { newMessagesActions } from '../shared/store/slices/newMessagesSlice';
import { updateSettings } from '../shared/store/settingsSlice';
import WebSearchProviderSelector from './WebSearchProviderSelector';
import MCPToolsButton from './chat/MCPToolsButton';
import KnowledgeSelector from './chat/KnowledgeSelector';

interface ChatToolbarProps {
  onClearTopic?: () => void;
  imageGenerationMode?: boolean; // 是否处于图像生成模式
  toggleImageGenerationMode?: () => void; // 切换图像生成模式
  webSearchActive?: boolean; // 是否处于网络搜索模式
  toggleWebSearch?: () => void; // 切换网络搜索模式
  toolsEnabled?: boolean; // 是否启用工具调用
  onToolsEnabledChange?: (enabled: boolean) => void; // 切换工具调用
}

/**
 * 聊天工具栏组件
 * 提供新建话题和清空话题内容功能
 * 使用独立气泡式设计，支持横向滑动
 */
const ChatToolbar: React.FC<ChatToolbarProps> = ({
  onClearTopic,
  imageGenerationMode = false,
  toggleImageGenerationMode,
  webSearchActive = false,
  toggleWebSearch,
  toolsEnabled = true,
  onToolsEnabledChange
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [clearConfirmMode, setClearConfirmMode] = useState(false);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const dispatch = useDispatch();

  // 从Redux获取网络搜索设置
  const webSearchSettings = useSelector((state: RootState) => state.webSearch);
  const webSearchEnabled = webSearchSettings?.enabled || false;
  const currentProvider = webSearchSettings?.provider;

  // 获取工具栏显示样式设置
  const toolbarDisplayStyle = useSelector((state: RootState) =>
    (state.settings as any).toolbarDisplayStyle || 'both'
  );

  // 获取工具栏折叠状态
  const toolbarCollapsedFromStore = useSelector((state: RootState) =>
    (state.settings as any).toolbarCollapsed || false
  );

  // 使用本地状态来立即响应UI变化，避免等待异步保存
  const [localToolbarCollapsed, setLocalToolbarCollapsed] = useState(toolbarCollapsedFromStore);

  // 防抖保存的引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 简约小巧的工具栏样式
  const getSimpleToolbarStyles = () => {
    return {
      // 容器样式 - 极简设计
      container: {
        background: 'transparent',
        border: 'none',
        borderRadius: '24px',
        padding: '0 8px'
      },
      // 按钮样式 - 小巧圆润
      button: {
        background: 'transparent',
        border: 'none',
        borderRadius: '20px',
        padding: '6px 12px',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minHeight: '32px'
      },
      // 按钮悬停效果 - 轻微
      buttonHover: {
        background: isDarkMode
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.04)'
      },
      // 按钮激活效果 - 简单
      buttonActive: {
        background: isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.06)',
        transform: 'scale(0.96)'
      },
      // 文字样式 - 小字体
      text: {
        fontSize: '13px',
        fontWeight: 500,
        color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)'
      }
    };
  };

  const simpleStyles = getSimpleToolbarStyles();

  // 处理清空内容的二次确认
  const handleClearTopic = () => {
    if (clearConfirmMode) {
      // 第二次点击，执行清空
      onClearTopic?.();
      setClearConfirmMode(false);
    } else {
      // 第一次点击，进入确认模式
      setClearConfirmMode(true);
    }
  };

  // 自动重置确认模式（3秒后）
  useEffect(() => {
    if (clearConfirmMode) {
      const timer = setTimeout(() => {
        setClearConfirmMode(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clearConfirmMode]);

  // 获取按钮的简约样式
  const getButtonSimpleStyle = (isActive: boolean) => {
    const baseStyle = {
      ...simpleStyles.button,
      background: isActive
        ? (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
        : 'transparent'
    };

    return baseStyle;
  };

  // 同步本地状态与store状态
  useEffect(() => {
    setLocalToolbarCollapsed(toolbarCollapsedFromStore);
  }, [toolbarCollapsedFromStore]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 切换工具栏折叠状态
  const toggleToolbarCollapse = () => {
    const newCollapsedState = !localToolbarCollapsed;
    // 立即更新本地状态，提供即时反馈
    setLocalToolbarCollapsed(newCollapsedState);

    // 清除之前的保存定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 防抖保存：500ms后才保存到store，避免频繁点击时的性能问题
    saveTimeoutRef.current = setTimeout(() => {
      dispatch(updateSettings({
        toolbarCollapsed: newCollapsedState
      }));
    }, 500);
  };

  // 创建新话题 - 使用统一的TopicService
  const handleCreateTopic = async () => {
    // 触发新建话题事件
    EventEmitter.emit(EVENT_NAMES.ADD_NEW_TOPIC);
    console.log('[ChatToolbar] Emitted ADD_NEW_TOPIC event.');

    // 创建新话题
    const newTopic = await TopicService.createNewTopic();

    // 如果成功创建话题，自动跳转到新话题
    if (newTopic) {
      console.log('[ChatToolbar] 成功创建新话题，自动跳转:', newTopic.id);

      // 设置当前话题 - 立即选择新创建的话题
      dispatch(newMessagesActions.setCurrentTopicId(newTopic.id));

      // 确保话题侧边栏显示并选中新话题
      setTimeout(() => {
        EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR);

        // 再次确保新话题被选中，防止其他逻辑覆盖
        setTimeout(() => {
          dispatch(newMessagesActions.setCurrentTopicId(newTopic.id));
        }, 50);
      }, 100);
    }
  };

  // 优化的拖动滑动处理 - 增加齿轮感和流畅度
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 移除折叠状态检查，因为折叠时工具栏已经隐藏
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current!.offsetLeft);
    setScrollLeft(scrollRef.current!.scrollLeft);
    // 添加抓取光标
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // 恢复光标
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
    // 添加惯性滚动效果
    addInertiaScrolling();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current!.offsetLeft;
    const walk = (x - startX) * 1.5; // 调整滚动速度，更流畅
    const newScrollLeft = scrollLeft - walk;

    // 添加边界检查和回弹效果
    if (scrollRef.current) {
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      if (newScrollLeft < 0) {
        scrollRef.current.scrollLeft = newScrollLeft * 0.3; // 回弹效果
      } else if (newScrollLeft > maxScroll) {
        scrollRef.current.scrollLeft = maxScroll + (newScrollLeft - maxScroll) * 0.3;
      } else {
        scrollRef.current.scrollLeft = newScrollLeft;
      }
    }
  };

  // 添加惯性滚动效果
  const addInertiaScrolling = () => {
    // 这里可以添加惯性滚动的实现
    // 暂时简化处理
  };

  // 触摸设备的处理 - 优化触摸体验
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // 移除折叠状态检查，因为折叠时工具栏已经隐藏
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current!.offsetLeft);
    setScrollLeft(scrollRef.current!.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    addInertiaScrolling();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - scrollRef.current!.offsetLeft;
    const walk = (x - startX) * 1.5;
    const newScrollLeft = scrollLeft - walk;

    if (scrollRef.current) {
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      if (newScrollLeft < 0) {
        scrollRef.current.scrollLeft = newScrollLeft * 0.3;
      } else if (newScrollLeft > maxScroll) {
        scrollRef.current.scrollLeft = maxScroll + (newScrollLeft - maxScroll) * 0.3;
      } else {
        scrollRef.current.scrollLeft = newScrollLeft;
      }
    }
  };

  // 处理知识库按钮点击
  const handleKnowledgeClick = () => {
    setShowKnowledgeSelector(true);
  };

  // 处理知识库选择
  const handleKnowledgeSelect = (knowledgeBase: any, searchResults: any[]) => {
    console.log('选择了知识库:', knowledgeBase, '搜索结果:', searchResults);

    // 存储选中的知识库信息到sessionStorage（风格：新模式）
    const knowledgeData = {
      knowledgeBase: {
        id: knowledgeBase.id,
        name: knowledgeBase.name
      },
      isSelected: true,
      searchOnSend: true // 标记需要在发送时搜索
    };

    console.log('[ChatToolbar] 保存知识库选择到sessionStorage:', knowledgeData);
    window.sessionStorage.setItem('selectedKnowledgeBase', JSON.stringify(knowledgeData));

    // 验证保存是否成功
    const saved = window.sessionStorage.getItem('selectedKnowledgeBase');
    console.log('[ChatToolbar] sessionStorage保存验证:', saved);

    // 关闭选择器
    setShowKnowledgeSelector(false);
  };

  // 简约小巧按钮数据 - 使用Lucide Icons
  const buttons = [
    {
      id: 'new-topic',
      icon: <Plus
        size={16}
        color={isDarkMode ? 'rgba(76, 175, 80, 0.8)' : 'rgba(76, 175, 80, 0.7)'}
      />,
      label: '新建话题',
      onClick: handleCreateTopic,
      isActive: false
    },
    {
      id: 'clear-topic',
      icon: clearConfirmMode
        ? <AlertTriangle
            size={16}
            color={isDarkMode ? 'rgba(244, 67, 54, 0.8)' : 'rgba(244, 67, 54, 0.7)'}
          />
        : <Trash2
            size={16}
            color={isDarkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)'}
          />,
      label: clearConfirmMode ? '确认清空' : '清空内容',
      onClick: handleClearTopic,
      isActive: clearConfirmMode
    },
    {
      id: 'generate-image',
      icon: <Camera
        size={16}
        color={imageGenerationMode
          ? (isDarkMode ? 'rgba(156, 39, 176, 0.9)' : 'rgba(156, 39, 176, 0.8)')
          : (isDarkMode ? 'rgba(156, 39, 176, 0.6)' : 'rgba(156, 39, 176, 0.5)')
        }
      />,
      label: imageGenerationMode ? '取消生成' : '生成图片',
      onClick: toggleImageGenerationMode,
      isActive: imageGenerationMode
    },
    {
      id: 'knowledge',
      icon: <BookOpen
        size={16}
        color={isDarkMode ? 'rgba(5, 150, 105, 0.8)' : 'rgba(5, 150, 105, 0.7)'}
      />,
      label: '知识库',
      onClick: handleKnowledgeClick,
      isActive: false
    }
  ];

  // 处理网络搜索按钮点击
  const handleWebSearchClick = () => {
    if (webSearchActive) {
      // 如果当前处于搜索模式，则关闭搜索
      toggleWebSearch?.();
    } else {
      // 如果当前不在搜索模式，显示提供商选择器
      setShowProviderSelector(true);
    }
  };

  // 处理提供商选择
  const handleProviderSelect = (providerId: string) => {
    if (providerId && toggleWebSearch) {
      // 选择了提供商，激活搜索模式
      toggleWebSearch();
    }
  };

  // 如果网络搜索已启用，添加网络搜索按钮
  if (webSearchEnabled && toggleWebSearch) {
    const providerName = webSearchSettings?.providers?.find(p => p.id === currentProvider)?.name || '搜索';

    buttons.push({
      id: 'web-search',
      icon: <Search
        size={16}
        color={webSearchActive
          ? (isDarkMode ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.8)')
          : (isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.5)')
        }
      />,
      label: webSearchActive ? '关闭搜索' : providerName,
      onClick: handleWebSearchClick,
      isActive: webSearchActive
    });
  }

  return (
    <Box
      sx={{
        padding: '4px 0 0 0',
        backgroundColor: 'transparent',
        width: '100%',
        position: 'relative',
        overflow: 'visible',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: '800px',
          position: 'relative',
          ...simpleStyles.container
        }}
      >
        {/* 简约折叠按钮 */}
        <IconButton
          onClick={toggleToolbarCollapse}
          size="small"
          sx={{
            background: 'transparent',
            borderRadius: '16px',
            width: 28,
            height: 28,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            transition: 'all 0.15s ease',
            marginRight: 0.5,
            flexShrink: 0,
            '&:hover': {
              background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
            }
          }}
        >
          <ChevronLeft
            size={16}
            style={{
              transition: 'transform 0.2s ease',
              transform: localToolbarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </IconButton>

        {/* 工具栏内容 */}
        <Box
          sx={{
            display: localToolbarCollapsed ? 'none' : 'flex', // 简单的显示/隐藏
            alignItems: 'center',
            flex: 1, // 占据剩余空间
            overflow: 'hidden' // 防止溢出
          }}
        >
          <Box
            ref={scrollRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              padding: '0 8px',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              whiteSpace: 'nowrap',
              minHeight: '38px',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', md: 'center' },
              cursor: 'grab',
              willChange: 'transform', // 优化性能
              transform: 'translateZ(0)', // 启用硬件加速
              width: '100%', // 占满容器
              '&:active': {
                cursor: 'grabbing'
              }
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
          {/* MCP 按钮 - 合并工具开关和MCP工具功能 */}
          {onToolsEnabledChange && (
            <Box sx={{ mr: 1 }}>
              <MCPToolsButton
                toolsEnabled={toolsEnabled}
                onToolsEnabledChange={onToolsEnabledChange}
              />
            </Box>
          )}

          {/* 简约小巧按钮渲染 */}
          {buttons.map((button) => {
            const buttonStyle = getButtonSimpleStyle(button.isActive);

            return (
              <Box
                key={button.id}
                onClick={button.onClick}
                sx={{
                  ...buttonStyle,
                  margin: '0 2px',
                  '&:hover': {
                    ...simpleStyles.buttonHover
                  },
                  '&:active': {
                    ...simpleStyles.buttonActive
                  }
                }}
              >
                {toolbarDisplayStyle !== 'text' && button.icon}
                {toolbarDisplayStyle !== 'icon' && (
                  <Typography
                    variant="body2"
                    sx={{
                      ...simpleStyles.text,
                      ml: toolbarDisplayStyle === 'both' ? 0.5 : 0
                    }}
                  >
                    {button.label}
                  </Typography>
                )}
              </Box>
            );
          })}
          </Box>
        </Box>
      </Box>

      {/* 网络搜索提供商选择器 */}
      <WebSearchProviderSelector
        open={showProviderSelector}
        onClose={() => setShowProviderSelector(false)}
        onProviderSelect={handleProviderSelect}
      />

      {/* 知识库选择器 */}
      <KnowledgeSelector
        open={showKnowledgeSelector}
        onClose={() => setShowKnowledgeSelector(false)}
        onSelect={handleKnowledgeSelect}
      />
    </Box>
  );
};

export default ChatToolbar;