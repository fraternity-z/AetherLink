/**
 * 多模型消息分组组件
 * 完全按照 Cherry Studio 的 MessageGroup 架构实现
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Box, IconButton, Tooltip, Avatar, Chip, ToggleButtonGroup, ToggleButton, Popover } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LayoutGrid as GridIcon,
  Rows as VerticalIcon,
  Columns as HorizontalIcon,
  FolderClosed as FoldIcon,
  RotateCcw as RetryIcon,
  Trash2 as DeleteIcon,
  Maximize2 as ExpandIcon,
  Minimize2 as CompressIcon
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';
import type { Message, MultiModelMessageStyle } from '../../shared/types/newMessage';
import { AssistantMessageStatus } from '../../shared/types/newMessage';
import { newMessagesActions } from '../../shared/store/slices/newMessagesSlice';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { getModelOrProviderIcon } from '../../shared/utils/providerIcons';
import MessageItem from './MessageItem';

interface MultiModelMessageGroupProps {
  /** 用户消息（包含 mentions） */
  userMessage: Message;
  /** 助手消息数组（共享同一个 askId） */
  assistantMessages: Message[];
  /** 强制更新函数 */
  forceUpdate?: () => void;
  /** 重新生成回调 */
  onRegenerate?: (messageId: string) => void;
  /** 删除回调 */
  onDelete?: (messageId: string) => void;
  /** 切换版本回调 */
  onSwitchVersion?: (versionId: string) => void;
  /** 重发回调 */
  onResend?: (messageId: string) => void;
}

const MultiModelMessageGroup: React.FC<MultiModelMessageGroupProps> = ({
  userMessage,
  assistantMessages,
  forceUpdate,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend
}) => {
  const dispatch = useDispatch();

  // 从设置中获取默认的多模型消息样式
  const defaultStyle = useSelector((state: RootState) =>
    (state.settings as any).multiModelMessageStyle || 'fold'
  ) as MultiModelMessageStyle;

  // 当前显示样式
  const [displayStyle, setDisplayStyle] = useState<MultiModelMessageStyle>(
    assistantMessages[0]?.multiModelMessageStyle || defaultStyle
  );

  // 本地选中状态（用于立即更新 UI）
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

  // fold 模式下选中的消息ID（优先使用本地状态）
  const selectedMessageId = useMemo(() => {
    if (localSelectedId) return localSelectedId;
    const selected = assistantMessages.find(m => m.foldSelected);
    return selected?.id || assistantMessages[0]?.id || '';
  }, [assistantMessages, localSelectedId]);

  // grid 模式下的 Popover 锚点
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverMessage, setPopoverMessage] = useState<Message | null>(null);

  // 模型列表显示模式
  const [modelListMode, setModelListMode] = useState<'compact' | 'expanded'>('expanded');

  const messageCount = assistantMessages.length;

  // 如果只有一条消息，使用 fold 样式
  const effectiveStyle = useMemo(() => {
    return messageCount < 2 ? 'fold' : displayStyle;
  }, [messageCount, displayStyle]);

  const isGrid = effectiveStyle === 'grid';

  // 切换显示样式
  const handleStyleChange = useCallback(async (_event: React.MouseEvent<HTMLElement>, newStyle: MultiModelMessageStyle | null) => {
    if (!newStyle) return;
    setDisplayStyle(newStyle);

    // 更新所有助手消息的样式
    for (const message of assistantMessages) {
      dispatch(newMessagesActions.updateMessage({
        id: message.id,
        changes: { multiModelMessageStyle: newStyle }
      }));
      await dexieStorage.updateMessage(message.id, { multiModelMessageStyle: newStyle });
    }
  }, [assistantMessages, dispatch]);

  // 切换选中的消息（fold 模式）
  const handleSelectMessage = useCallback(async (message: Message) => {
    // 立即更新本地状态，确保 UI 响应
    setLocalSelectedId(message.id);
    
    // 更新之前选中的消息
    const prevSelected = assistantMessages.find(m => m.foldSelected);
    if (prevSelected && prevSelected.id !== message.id) {
      dispatch(newMessagesActions.updateMessage({
        id: prevSelected.id,
        changes: { foldSelected: false }
      }));
    }

    // 更新当前选中的消息
    dispatch(newMessagesActions.updateMessage({
      id: message.id,
      changes: { foldSelected: true }
    }));
  }, [assistantMessages, dispatch]);

  // Grid 模式点击处理
  const handleGridClick = useCallback((event: React.MouseEvent<HTMLElement>, message: Message) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverMessage(message);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setPopoverAnchor(null);
    setPopoverMessage(null);
  }, []);

  // 获取模型名称
  const getModelName = useCallback((message: Message) => {
    return message.model?.name || message.modelId || '未知模型';
  }, []);

  // 获取模型头像字母
  const getModelAvatarLetter = useCallback((message: Message) => {
    const name = message.model?.name || message.modelId || '?';
    return name.charAt(0).toUpperCase();
  }, []);

  // 获取模型图标
  const getModelIcon = useCallback((message: Message, isDark: boolean) => {
    const modelId = message.model?.id || message.modelId || '';
    const providerId = message.model?.provider || '';
    return getModelOrProviderIcon(modelId, providerId, isDark);
  }, []);

  // 检查消息是否正在处理
  const isMessageProcessing = useCallback((message: Message) => {
    return [
      AssistantMessageStatus.PENDING,
      AssistantMessageStatus.PROCESSING,
      AssistantMessageStatus.SEARCHING,
      AssistantMessageStatus.STREAMING
    ].includes(message.status as any);
  }, []);

  // 检查是否有失败的消息
  const hasFailedMessages = useMemo(() => {
    return assistantMessages.some(m => m.status === AssistantMessageStatus.ERROR);
  }, [assistantMessages]);

  // 重试失败的消息
  const handleRetryFailed = useCallback(() => {
    const failedMessages = assistantMessages.filter(m => m.status === AssistantMessageStatus.ERROR);
    failedMessages.forEach(message => {
      if (onRegenerate) onRegenerate(message.id);
    });
  }, [assistantMessages, onRegenerate]);

  // 删除整个分组
  const handleDeleteGroup = useCallback(() => {
    assistantMessages.forEach(message => {
      if (onDelete) onDelete(message.id);
    });
    if (onDelete) onDelete(userMessage.id);
  }, [assistantMessages, userMessage, onDelete]);

  // 渲染模型选择器（fold 模式）
  const renderModelSelector = () => {
    if (effectiveStyle !== 'fold' || messageCount < 2) return null;

    return (
      <ModelSelectorContainer>
        <Tooltip title={modelListMode === 'compact' ? '展开' : '压缩'}>
          <IconButton
            size="small"
            onClick={() => setModelListMode(prev => prev === 'compact' ? 'expanded' : 'compact')}
          >
            {modelListMode === 'compact' ? <ExpandIcon size={14} /> : <CompressIcon size={14} />}
          </IconButton>
        </Tooltip>

        <ModelList>
          {assistantMessages.map((message) => {
            const isSelected = message.id === selectedMessageId;
            const isProcessing = isMessageProcessing(message);

            const iconUrl = getModelIcon(message, false);
            
            if (modelListMode === 'compact') {
              return (
                <Tooltip key={message.id} title={getModelName(message)}>
                  <ModelAvatar
                    isSelected={isSelected}
                    isProcessing={isProcessing}
                    onClick={() => handleSelectMessage(message)}
                    src={iconUrl}
                  >
                    {getModelAvatarLetter(message)}
                  </ModelAvatar>
                </Tooltip>
              );
            } else {
              return (
                <ModelChip
                  key={message.id}
                  avatar={
                    <Avatar 
                      sx={{ width: 20, height: 20, fontSize: 10 }}
                      src={iconUrl}
                    >
                      {getModelAvatarLetter(message)}
                    </Avatar>
                  }
                  label={getModelName(message)}
                  onClick={() => handleSelectMessage(message)}
                  variant={isSelected ? 'filled' : 'outlined'}
                  color={isSelected ? 'primary' : 'default'}
                  size="small"
                  className={isProcessing ? 'processing' : ''}
                />
              );
            }
          })}
        </ModelList>
      </ModelSelectorContainer>
    );
  };

  // 渲染菜单栏
  const renderMenuBar = () => {
    if (messageCount < 2) return null;

    return (
      <MenuBar className="group-menu-bar">
        <ToggleButtonGroup
          value={effectiveStyle}
          exclusive
          onChange={handleStyleChange}
          size="small"
          sx={{ height: 28 }}
        >
          <ToggleButton value="fold" sx={{ px: 1 }}>
            <Tooltip title="折叠"><FoldIcon size={14} /></Tooltip>
          </ToggleButton>
          <ToggleButton value="horizontal" sx={{ px: 1 }}>
            <Tooltip title="水平"><HorizontalIcon size={14} /></Tooltip>
          </ToggleButton>
          <ToggleButton value="vertical" sx={{ px: 1 }}>
            <Tooltip title="垂直"><VerticalIcon size={14} /></Tooltip>
          </ToggleButton>
          <ToggleButton value="grid" sx={{ px: 1 }}>
            <Tooltip title="网格"><GridIcon size={14} /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {renderModelSelector()}

        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          {hasFailedMessages && (
            <Tooltip title="重试失败">
              <IconButton size="small" onClick={handleRetryFailed} color="warning">
                <RetryIcon size={14} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="删除分组">
            <IconButton size="small" onClick={handleDeleteGroup} color="error">
              <DeleteIcon size={14} />
            </IconButton>
          </Tooltip>
        </Box>
      </MenuBar>
    );
  };

  // 渲染单个消息
  const renderMessage = useCallback((message: Message) => {
    const isSelected = message.id === selectedMessageId;
    const className = `${effectiveStyle}${isSelected ? ' selected' : ''}`;

    const messageContent = (
      <MessageWrapper
        key={message.id}
        id={`message-${message.id}`}
        className={className}
        onClick={isGrid ? (e) => handleGridClick(e, message) : undefined}
      >
        <MessageItem
          message={message}
          forceUpdate={forceUpdate}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
          onSwitchVersion={onSwitchVersion}
          onResend={onResend}
        />
      </MessageWrapper>
    );

    return messageContent;
  }, [effectiveStyle, selectedMessageId, isGrid, handleGridClick, forceUpdate, onRegenerate, onDelete, onSwitchVersion, onResend]);

  return (
    <GroupContainer className={effectiveStyle}>
      {/* 用户消息 */}
      <MessageItem
        message={userMessage}
        forceUpdate={forceUpdate}
        onRegenerate={onRegenerate}
        onDelete={onDelete}
        onSwitchVersion={onSwitchVersion}
        onResend={onResend}
      />

      {/* 助手消息区域 */}
      <GridContainer className={effectiveStyle} count={messageCount}>
        {assistantMessages.map(renderMessage)}
      </GridContainer>

      {/* 底部菜单栏 */}
      {renderMenuBar()}

      {/* Grid 模式的 Popover */}
      <Popover
        open={Boolean(popoverAnchor) && Boolean(popoverMessage)}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
        transformOrigin={{ vertical: 'center', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              // 移动端使用更大宽度
              maxWidth: { xs: '95vw', sm: '85vw', md: '60vw' },
              width: { xs: '95vw', sm: 'auto' },
              maxHeight: { xs: '70vh', sm: '60vh', md: '50vh' },
              overflowY: 'auto',
              p: 1
            }
          }
        }}
      >
        {popoverMessage && (
          <MessageItem
            message={popoverMessage}
            forceUpdate={forceUpdate}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onSwitchVersion={onSwitchVersion}
            onResend={onResend}
          />
        )}
      </Popover>
    </GroupContainer>
  );
};

// ============= 样式组件 - 完全按照 Cherry Studio 实现 =============

const GroupContainer = styled(Box)(({ theme }) => ({
  '&.horizontal, &.grid': {
    padding: theme.spacing(0.5, 1.25),
    '& .group-menu-bar': {
      marginLeft: 0,
      marginRight: 0,
    },
  },
}));

const GridContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'count'
})<{ count: number }>(({ theme, count }) => ({
  width: '100%',
  display: 'grid',
  overflowY: 'visible',
  gap: 16,

  '&.horizontal': {
    paddingBottom: 4,
    gridTemplateColumns: `repeat(${count}, minmax(420px, 1fr))`,
    overflowX: 'auto',
  },

  '&.fold': {
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: 0, // fold 模式无间距
  },

  '&.vertical': {
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: 8,
  },

  '&.grid': {
    // 移动端单列，平板双列，桌面三列
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gridTemplateRows: 'auto',
    [theme.breakpoints.up('sm')]: {
      gridTemplateColumns: count > 1 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
    },
    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: count > 2 ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
    },
  },
}));

const MessageWrapper = styled(Box)(({ theme }) => ({
  // horizontal 模式
  '&.horizontal': {
    padding: 1,
    overflowY: 'auto',
    border: `0.5px solid ${theme.palette.divider}`,
    borderRadius: 10,
    maxHeight: 'calc(100vh - 350px)',
  },

  // grid 模式 - 固定高度，可滚动，点击展开详情
  '&.grid': {
    display: 'block',
    height: 300,
    overflowY: 'auto', // 允许滚动
    border: `0.5px solid ${theme.palette.divider}`,
    borderRadius: 10,
    cursor: 'pointer',
    // 滚动条样式
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.divider,
      borderRadius: 3,
    },
  },

  // fold 模式 - 默认隐藏，选中显示
  '&.fold': {
    display: 'none',
    '&.selected': {
      display: 'block',
    },
  },
  
  // 所有模式都移除消息的底部安全区域边距
  '& > div': {
    marginBottom: '0 !important',
  },

  // vertical 模式
  '&.vertical': {
    border: `0.5px solid ${theme.palette.divider}`,
    borderRadius: 10,
    padding: theme.spacing(1),
  },
}));

const MenuBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: 10,
  margin: theme.spacing(0, 1.25, 1.5), // 顶部无边距，紧贴消息
  justifyContent: 'space-between',
  overflow: 'hidden',
  border: `0.5px solid ${theme.palette.divider}`,
  height: 40,
}));

const ModelSelectorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  overflow: 'hidden',
  marginLeft: theme.spacing(0.5),
}));

const ModelList = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  overflowX: 'auto',
  flex: 1,
  padding: theme.spacing(0, 1),
  '&::-webkit-scrollbar': {
    display: 'none',
  },
}));

const ModelAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isProcessing'
})<{ isSelected: boolean; isProcessing: boolean }>(({ theme, isSelected, isProcessing }) => ({
  width: 24,
  height: 24,
  fontSize: 12,
  cursor: 'pointer',
  border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
  transition: 'transform 0.18s ease-out',
  animation: isProcessing ? 'pulse 1.5s infinite' : 'none',
  '&:hover': {
    transform: 'scale(1.15)',
  },
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
}));

const ModelChip = styled(Chip)(() => ({
  cursor: 'pointer',
  '&.processing': {
    animation: 'pulse 1.5s infinite',
  },
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.6 },
  },
}));

export default React.memo(MultiModelMessageGroup);
