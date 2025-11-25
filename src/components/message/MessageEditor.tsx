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
import { UserMessageStatus, AssistantMessageStatus } from '../../shared/types/newMessage.ts';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { clearGetMainTextContentCache } from '../../shared/utils/messageUtils';
import styled from '@emotion/styled';
import { Z_INDEX } from '../../shared/constants/zIndex';
import { useKeyboard } from '../../shared/hooks/useKeyboard';
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

  // 🚀 简化：只在保存时需要查找主文本块，移除不必要的selector

  // 🔧 重写：基于信息块系统架构的内容获取逻辑
  const loadInitialContent = useCallback(async () => {
    // 方法1：检查消息是否有直接的 content 字段（编辑后的内容）
    if (typeof (message as any).content === 'string' && (message as any).content.trim()) {
      return (message as any).content.trim();
    }

    // 方法2：检查消息是否有 blocks 数组
    if (!message.blocks || message.blocks.length === 0) {
      return '';
    }

    // 方法3：从数据库批量加载所有消息块
    try {
      const messageBlocks = await dexieStorage.getMessageBlocksByMessageId(message.id);

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
        messageBlocks.push(...individualBlocks);
      }

      // 方法4：查找主文本块或未知类型块
      const textBlocks = messageBlocks.filter(block =>
        block.type === 'main_text' ||
        block.type === 'unknown'
      );

      for (const block of textBlocks) {
        const blockContent = (block as any).content;
        if (blockContent && typeof blockContent === 'string' && blockContent.trim()) {
          return blockContent.trim();
        }
      }

      // 方法5：如果没有找到主文本块，检查所有块是否有 content 字段
      for (const block of messageBlocks) {
        const blockContent = (block as any).content;
        if (blockContent && typeof blockContent === 'string' && blockContent.trim()) {
          return blockContent.trim();
        }
      }

      return '';

    } catch (error) {
      devError('[MessageEditor] 加载消息块时出错:', error);
      return '';
    }
  }, [message]);

  const [editedContent, setEditedContent] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const isUser = message.role === 'user';

  // 🚀 改进：异步加载内容的逻辑，添加清理函数防止内存泄漏
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后设置状态

    if (open && !isInitialized) {
      const initContent = async () => {
        try {
          const content = await loadInitialContent();

          // 只有在组件仍然挂载时才设置状态
          if (isMounted) {
            setEditedContent(content);
            setIsInitialized(true);
          }
        } catch (error) {
          devError('[MessageEditor] 初始化内容失败:', error);
          if (isMounted) {
            setEditedContent('');
            setIsInitialized(true); // 即使失败也标记为已初始化，避免无限重试
          }
        }
      };
      initContent();
    } else if (!open) {
      // Dialog关闭时重置状态
      setIsInitialized(false);
      setEditedContent('');
    }

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [open, isInitialized, loadInitialContent]);

  // 🚀 性能优化：保存逻辑 - 减少数据库调用和日志输出
  const handleSave = useCallback(async () => {
    // 获取编辑后的文本内容
    const editedText = typeof editedContent === 'string'
      ? editedContent.trim()
      : '';

    if (!topicId || !editedText) {
      devError('[MessageEditor] 保存失败: 缺少topicId或内容为空');
      return;
    }

    try {
      // 🚀 简化：直接从数据库查找主文本块
      let mainTextBlockId: string | undefined;
      if (message.blocks && message.blocks.length > 0) {
        for (const blockId of message.blocks) {
          const block = await dexieStorage.getMessageBlock(blockId);
          if (block && (block.type === 'main_text' || block.type === 'unknown')) {
            mainTextBlockId = blockId;
            break;
          }
        }
      }

      if (!mainTextBlockId) {
        console.warn('[MessageEditor] 未找到主文本块，消息可能没有正确的块结构');
      }



      // � 性能优化：批量更新数据库和Redux状态
      const updatedAt = new Date().toISOString();

      // 🔧 修复：区分用户消息和AI消息的更新策略
      const messageUpdates = {
        status: isUser ? UserMessageStatus.SUCCESS : AssistantMessageStatus.SUCCESS,
        updatedAt,
        // 用户消息：设置content字段；AI消息：不设置content字段，让其从消息块获取
        ...(isUser && { content: editedText })
      };

      // 🚀 性能优化：使用事务批量更新数据库，减少I/O操作
      try {
        await dexieStorage.transaction('rw', [dexieStorage.messages, dexieStorage.message_blocks, dexieStorage.topics], async () => {
          // 更新消息块
          if (mainTextBlockId) {
            await dexieStorage.updateMessageBlock(mainTextBlockId, {
              content: editedText,
              updatedAt
            });
          }

          // 更新消息表
          await dexieStorage.updateMessage(message.id, messageUpdates);

          // 🔧 修复：确保同时更新topic.messages数组
          if (topicId) {
            const topic = await dexieStorage.topics.get(topicId);
            if (topic && topic.messages) {
              // 查找消息在数组中的位置
              const messageIndex = topic.messages.findIndex((m: any) => m.id === message.id);

              if (messageIndex >= 0) {
                // 更新topic.messages数组中的消息
                const updatedMessage = {
                  ...topic.messages[messageIndex],
                  ...messageUpdates
                };
                topic.messages[messageIndex] = updatedMessage;



                // 保存更新后的话题
                await dexieStorage.topics.put(topic);
              } else {
                console.warn('[MessageEditor] 在topic.messages中未找到消息:', message.id);
              }
            } else {
              console.warn('[MessageEditor] 话题不存在或没有messages数组:', topicId);
            }
          }
        });


      } catch (dbError) {
        devError('[MessageEditor] 数据库更新失败:', dbError);
        throw dbError; // 重新抛出错误以便后续处理
      }

      // 🚀 性能优化：批量更新Redux状态
      if (mainTextBlockId) {
        dispatch({
          type: 'messageBlocks/updateOneBlock',
          payload: {
            id: mainTextBlockId,
            changes: {
              content: editedText,
              updatedAt
            }
          }
        });
      }

      dispatch(newMessagesActions.updateMessage({
        id: message.id,
        changes: messageUpdates
      }));

      // 🔧 修复：清除getMainTextContent缓存，确保立即获取最新内容
      try {
        clearGetMainTextContentCache();
      } catch (error) {
        console.warn('[MessageEditor] 清除缓存失败:', error);
      }

      // 🔧 修复AI消息特殊问题：对于AI消息，不设置message.content字段
      // 让getMainTextContent函数从消息块获取最新内容，而不是从缓存的content字段
      if (!isUser) {
        // AI消息：移除content字段，强制从消息块获取内容
        dispatch(newMessagesActions.updateMessage({
          id: message.id,
          changes: {
            ...(message as any).content && { content: undefined }, // 清除content字段（如果存在）
            updatedAt: new Date().toISOString()
          }
        }));

      }

      // 🔧 修复：强制触发组件重新渲染
      // 通过更新消息的updatedAt字段来触发依赖该字段的组件重新渲染
      setTimeout(() => {
        dispatch(newMessagesActions.updateMessage({
          id: message.id,
          changes: {
            updatedAt: new Date().toISOString()
          }
        }));

        // 🔧 额外修复：强制更新消息块的updatedAt，确保MainTextBlock重新渲染
        if (mainTextBlockId) {
          dispatch({
            type: 'messageBlocks/updateOneBlock',
            payload: {
              id: mainTextBlockId,
              changes: {
                updatedAt: new Date().toISOString()
              }
            }
          });
        }


      }, 100);



      // � 性能优化：直接关闭Dialog，移除不必要的延迟和事件
      // Redux状态更新是同步的，不需要额外的延迟或全局事件
      onClose();

    } catch (error) {
      devError('[MessageEditor] 保存失败:', error);
      alert('保存失败，请重试');
    }
  }, [editedContent, topicId, message, dispatch, isUser, onClose]);

  // 🚀 性能优化：关闭处理 - 使用useCallback
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 🚀 性能优化：内容变更处理 - 使用useCallback
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedContent(e.target.value);
    }, []);
 
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
          </EditorTitle>
        </EditorHeader>

        {/* 编辑区域 */}
        <EditorContent theme={theme}>
          <TextField
            multiline
            fullWidth
            minRows={6}
            maxRows={12}
            value={editedContent}
            onChange={handleContentChange}
            variant="outlined"
            placeholder={isInitialized ? "请输入内容..." : "正在加载内容..."}
            disabled={!isInitialized}
            autoFocus={isInitialized && !isMobile}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '14px',
                lineHeight: 1.5
              }
            }}
          />
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
            disabled={!isInitialized || !editedContent || !editedContent.trim()}
          >
            保存
          </Button>
        </EditorFooter>
      </EditorContainer>
    </Drawer>
  );
};

export default MessageEditor;