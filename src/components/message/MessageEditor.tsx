import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Button,
  TextField,
  useMediaQuery,
  useTheme,
  Box,
  alpha,
  Typography
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { newMessagesActions } from '../../shared/store/slices/newMessagesSlice';
import type { Message } from '../../shared/types/newMessage.ts';
import { UserMessageStatus, AssistantMessageStatus, MessageBlockType } from '../../shared/types/newMessage.ts';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { clearGetMainTextContentCache } from '../../shared/utils/messageUtils';
import styled from '@emotion/styled';
import { Z_INDEX } from '../../shared/constants/zIndex';
import { useKeyboard } from '../../shared/hooks/useKeyboard';

// 编辑块类型
interface EditableBlock {
  id: string;
  content: string;
  type: string;
}

// 开发环境日志工具 - 只保留错误日志
const isDev = process.env.NODE_ENV === 'development';
const devError = isDev ? console.error : () => {};

// 样式组件定义 - 参考QuickPhraseButton的设计
const EditorContainer = styled(Box)<{ theme?: any }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 70vh;
`;

const EditorHeader = styled(Box)<{ theme?: any }>`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
`;

const EditorTitle = styled(Typography)<{ theme?: any }>`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme?.palette?.text?.primary};
`;

const EditorContent = styled(Box)<{ theme?: any }>`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 3px;
  }
`;

const EditorFooter = styled(Box)<{ theme?: any }>`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
`;

interface MessageEditorProps {
  message: Message;
  topicId?: string;
  open: boolean;
  onClose: () => void;
}

const MessageEditor: React.FC<MessageEditorProps> = ({ message, topicId, open, onClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 键盘适配 - 锁定键盘，其他组件不响应键盘事件
  // 只有在编辑框打开时才锁定键盘，关闭时释放锁
  const { keyboardHeight, isKeyboardVisible } = useKeyboard({ lock: open });

  // 🚀 参考 cherry-studio：加载所有文本块，支持多轮工具调用编辑

  // 🔧 重写：加载所有 main_text 块，而不是只加载第一个
  const loadAllTextBlocks = useCallback(async (): Promise<EditableBlock[]> => {
    // 检查消息是否有 blocks 数组
    if (!message.blocks || message.blocks.length === 0) {
      // 如果没有块，检查 content 字段
      if (typeof (message as any).content === 'string' && (message as any).content.trim()) {
        return [{
          id: 'legacy_content',
          content: (message as any).content.trim(),
          type: 'main_text'
        }];
      }
      return [];
    }

    // 从数据库批量加载所有消息块
    try {
      let messageBlocks = await dexieStorage.getMessageBlocksByMessageId(message.id);

      if (messageBlocks.length === 0) {
        // 如果批量获取失败，尝试逐个获取
        const individualBlocks = [];
        for (const blockId of message.blocks) {
          try {
            const block = await dexieStorage.getMessageBlock(blockId);
            if (block) {
              individualBlocks.push(block);
            }
          } catch (error) {
            devError('[MessageEditor] 获取块失败:', blockId, error);
          }
        }
        messageBlocks = individualBlocks;
      }

      // 🔧 关键修复：过滤出所有 main_text 和 unknown 类型的块
      const textBlocks = messageBlocks.filter(block =>
        block.type === MessageBlockType.MAIN_TEXT ||
        block.type === MessageBlockType.UNKNOWN
      );

      // 转换为可编辑块格式
      const editableBlocks: EditableBlock[] = textBlocks
        .map(block => ({
          id: block.id,
          content: (block as any).content || '',
          type: block.type
        }))
        .filter(block => block.content.trim() !== '');

      // 如果没有找到文本块，返回空数组
      if (editableBlocks.length === 0) {
        // 尝试从任意块获取内容
        for (const block of messageBlocks) {
          const blockContent = (block as any).content;
          if (blockContent && typeof blockContent === 'string' && blockContent.trim()) {
            return [{
              id: block.id,
              content: blockContent.trim(),
              type: block.type
            }];
          }
        }
      }

      return editableBlocks;

    } catch (error) {
      devError('[MessageEditor] 加载消息块时出错:', error);
      return [];
    }
  }, [message]);

  // 🔧 状态改为存储多个可编辑块
  const [editedBlocks, setEditedBlocks] = useState<EditableBlock[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUser = message.role === 'user';

  // 🚀 改进：异步加载所有文本块，添加清理函数防止内存泄漏
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后设置状态

    if (open && !isInitialized) {
      const initContent = async () => {
        try {
          const blocks = await loadAllTextBlocks();

          // 只有在组件仍然挂载时才设置状态
          if (isMounted) {
            setEditedBlocks(blocks);
            setIsInitialized(true);
          }
        } catch (error) {
          devError('[MessageEditor] 初始化内容失败:', error);
          if (isMounted) {
            setEditedBlocks([]);
            setIsInitialized(true); // 即使失败也标记为已初始化，避免无限重试
          }
        }
      };
      initContent();
    } else if (!open) {
      // Dialog关闭时重置状态
      setIsInitialized(false);
      setEditedBlocks([]);
    }

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [open, isInitialized, loadAllTextBlocks]);

  // 🔧 参考 cherry-studio：处理单个块内容变更
  const handleTextChange = useCallback((blockId: string, content: string) => {
    setEditedBlocks(prev => prev.map(block =>
      block.id === blockId ? { ...block, content } : block
    ));
  }, []);

  // 🚀 性能优化：保存逻辑 - 支持多块编辑保存
  const handleSave = useCallback(async () => {
    // 检查是否有可编辑的块
    if (!topicId || editedBlocks.length === 0) {
      devError('[MessageEditor] 保存失败: 缺少topicId或没有可编辑内容');
      return;
    }

    // 过滤出有内容的块
    const blocksToSave = editedBlocks.filter(block => block.content.trim());
    if (blocksToSave.length === 0) {
      devError('[MessageEditor] 保存失败: 所有块内容为空');
      return;
    }

    try {
      const updatedAt = new Date().toISOString();

      // 🔧 合并所有块内容用于用户消息的 content 字段
      const mergedContent = blocksToSave.map(b => b.content.trim()).join('\n\n');

      // 🔧 修复：区分用户消息和AI消息的更新策略
      const messageUpdates = {
        status: isUser ? UserMessageStatus.SUCCESS : AssistantMessageStatus.SUCCESS,
        updatedAt,
        // 用户消息：设置content字段；AI消息：不设置content字段，让其从消息块获取
        ...(isUser && { content: mergedContent })
      };

      // 🚀 性能优化：使用事务批量更新数据库，减少I/O操作
      try {
        await dexieStorage.transaction('rw', [dexieStorage.messages, dexieStorage.message_blocks, dexieStorage.topics], async () => {
          // 🔧 关键修复：更新所有编辑过的消息块
          for (const block of blocksToSave) {
            if (block.id !== 'legacy_content') {
              await dexieStorage.updateMessageBlock(block.id, {
                content: block.content.trim(),
                updatedAt
              });
            }
          }

          // 更新消息表
          await dexieStorage.updateMessage(message.id, messageUpdates);

          // 🔧 修复：确保同时更新topic.messages数组
          if (topicId) {
            const topic = await dexieStorage.topics.get(topicId);
            if (topic && topic.messages) {
              const messageIndex = topic.messages.findIndex((m: any) => m.id === message.id);
              if (messageIndex >= 0) {
                const updatedMessage = {
                  ...topic.messages[messageIndex],
                  ...messageUpdates
                };
                topic.messages[messageIndex] = updatedMessage;
                await dexieStorage.topics.put(topic);
              }
            }
          }
        });
      } catch (dbError) {
        devError('[MessageEditor] 数据库更新失败:', dbError);
        throw dbError;
      }

      // 🚀 性能优化：批量更新Redux状态 - 更新所有块
      for (const block of blocksToSave) {
        if (block.id !== 'legacy_content') {
          dispatch({
            type: 'messageBlocks/updateOneBlock',
            payload: {
              id: block.id,
              changes: {
                content: block.content.trim(),
                updatedAt
              }
            }
          });
        }
      }

      dispatch(newMessagesActions.updateMessage({
        id: message.id,
        changes: messageUpdates
      }));

      // 🔧 修复：清除getMainTextContent缓存
      try {
        clearGetMainTextContentCache();
      } catch (error) {
        console.warn('[MessageEditor] 清除缓存失败:', error);
      }

      // 🔧 修复AI消息特殊问题
      if (!isUser) {
        dispatch(newMessagesActions.updateMessage({
          id: message.id,
          changes: {
            ...(message as any).content && { content: undefined },
            updatedAt: new Date().toISOString()
          }
        }));
      }

      // 🔧 修复：强制触发组件重新渲染
      setTimeout(() => {
        dispatch(newMessagesActions.updateMessage({
          id: message.id,
          changes: {
            updatedAt: new Date().toISOString()
          }
        }));

        // 更新所有块的 updatedAt
        for (const block of blocksToSave) {
          if (block.id !== 'legacy_content') {
            dispatch({
              type: 'messageBlocks/updateOneBlock',
              payload: {
                id: block.id,
                changes: {
                  updatedAt: new Date().toISOString()
                }
              }
            });
          }
        }
      }, 100);

      onClose();

    } catch (error) {
      devError('[MessageEditor] 保存失败:', error);
      alert('保存失败，请重试');
    }
  }, [editedBlocks, topicId, message, dispatch, isUser, onClose]);

  // 🚀 性能优化：关闭处理 - 使用useCallback
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 检查是否有可保存的内容
  const hasContent = editedBlocks.some(block => block.content.trim());

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      className="message-editor-drawer"
      slotProps={{
        backdrop: {
          sx: {
            zIndex: Z_INDEX.MODAL.BACKDROP
          }
        }
      }}
      sx={{
        zIndex: Z_INDEX.MODAL.DIALOG
      }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          // 键盘弹出时保持固定高度，不随键盘减小
          maxHeight: '70vh',
          bgcolor: 'background.paper',
          pb: 'var(--safe-area-bottom-computed, 0px)',
          zIndex: Z_INDEX.MODAL.DIALOG,
          // 键盘弹出时，使用 bottom 定位让整个编辑框上移到键盘上方
          bottom: isKeyboardVisible ? `${keyboardHeight}px` : 0,
          // 添加过渡动画让布局变化更平滑
          transition: 'bottom 0.25s ease-out'
        }
      }}
      disableScrollLock={false}
    >
      <EditorContainer theme={theme}>
        {/* 拖拽指示器 */}
        <Box sx={{ pt: 1, pb: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: (theme) => alpha(theme.palette.text.primary, 0.2),
              borderRadius: 999
            }}
          />
        </Box>

        {/* 标题栏 */}
        <EditorHeader theme={theme}>
          <EditorTitle theme={theme}>
            编辑{isUser ? '消息' : '回复'}
            {editedBlocks.length > 1 && (
              <Typography component="span" sx={{ ml: 1, fontSize: '12px', color: 'text.secondary' }}>
                ({editedBlocks.length} 个文本块)
              </Typography>
            )}
          </EditorTitle>
        </EditorHeader>

        {/* 编辑区域 - 为每个文本块渲染独立的编辑框 */}
        <EditorContent theme={theme}>
          {!isInitialized ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              正在加载内容...
            </Typography>
          ) : editedBlocks.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              没有可编辑的内容
            </Typography>
          ) : (
            editedBlocks.map((block, index) => (
              <Box key={block.id} sx={{ mb: editedBlocks.length > 1 ? 2 : 0 }}>
                {/* 多个块时显示块标签 */}
                {editedBlocks.length > 1 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      mb: 0.5, 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    文本块 {index + 1}
                  </Typography>
                )}
                <TextField
                  multiline
                  fullWidth
                  minRows={editedBlocks.length > 1 ? 3 : 6}
                  maxRows={editedBlocks.length > 1 ? 8 : 12}
                  value={block.content}
                  onChange={(e) => handleTextChange(block.id, e.target.value)}
                  variant="outlined"
                  placeholder="请输入内容..."
                  autoFocus={index === 0 && !isMobile}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      lineHeight: 1.5
                    }
                  }}
                />
              </Box>
            ))
          )}
        </EditorContent>

        {/* 操作栏 */}
        <EditorFooter theme={theme}>
          <Button
            onClick={handleClose}
            color="inherit"
            variant="text"
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!isInitialized || !hasContent}
          >
            保存
          </Button>
        </EditorFooter>
      </EditorContainer>
    </Drawer>
  );
};

export default MessageEditor;