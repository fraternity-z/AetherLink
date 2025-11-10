import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { VolumeX, ArrowLeft } from 'lucide-react';
import { useVoiceRecognition } from '../../shared/hooks/useVoiceRecognition';

interface EnhancedVoiceInputProps {
  isDarkMode?: boolean;
  onSendMessage: (message: string) => void;
  onInsertText: (text: string) => void;
  onClose: () => void; // 关闭录音面板
  startRecognition: (options?: { language?: string; maxResults?: number; partialResults?: boolean; popup?: boolean }) => Promise<void>; // 启动语音识别函数
  currentMessage: string; // 当前输入框的文本
}

const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({
  isDarkMode = false,
  onInsertText,
  onClose,
  startRecognition,
  currentMessage
}) => {
  // 语音识别Hook
  const {
    isListening,
    recognitionText,
    error,
    stopRecognition,
    permissionStatus
  } = useVoiceRecognition();

  // 组件状态
  // const [volumeLevel] = useState(50); // 保留以备将来动态波形使用
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [shouldCancel, setShouldCancel] = useState(false);

  // 长按检测状态
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);

  // 保存录音开始时的基础文本
  const [baseMessage, setBaseMessage] = useState('');



  // 实时将识别文本添加到输入框
  useEffect(() => {
    if (recognitionText && isListening) {
      // 将基础文本和识别文本合并，替换整个输入框内容
      const fullText = baseMessage + (baseMessage && recognitionText ? ' ' : '') + recognitionText;
      onInsertText(fullText);
    }
  }, [recognitionText, isListening, onInsertText, baseMessage]);

  // 清理资源
  useEffect(() => {
    return () => {
      // 清理长按定时器
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      // 如果正在录音，停止录音
      if (isListening) {
        stopRecognition();
      }
    };
  }, [isListening, stopRecognition, longPressTimer]);









  // 清理长按定时器
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressProgress(0);
  }, [longPressTimer]);

  // 启动录音
  const startRecordingInternal = useCallback(async () => {
    if (hasStartedRecording) return;

    try {
      // 保存录音开始时的基础文本
      setBaseMessage(currentMessage);
      setHasStartedRecording(true);
      await startRecognition({
        language: 'zh-CN',
        partialResults: true
      });
    } catch (error) {
      console.error('启动录音失败:', error);
      setHasStartedRecording(false);
    }
  }, [hasStartedRecording, startRecognition, currentMessage]);

  // 长按开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartY(touch.clientY);
    setShouldCancel(false);

    // 清理之前的定时器
    clearLongPressTimer();

    // 启动长按检测定时器（300ms后开始录音）
    const timer = setTimeout(() => {
      startRecordingInternal();
    }, 300);

    setLongPressTimer(timer);

    // 启动进度动画 - 内存泄漏防护：确保定时器被清理
    const progressTimer = setInterval(() => {
      setLongPressProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + (100 / 30); // 300ms内完成进度
      });
    }, 10);

    // 300ms后清理进度定时器
    setTimeout(() => {
      clearInterval(progressTimer);
    }, 300);
  }, [clearLongPressTimer, startRecordingInternal]);

  // 拖拽移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];

    // 计算上滑距离
    const deltaY = dragStartY - touch.clientY;
    const cancelThreshold = 100; // 上滑100px取消

    setShouldCancel(deltaY > cancelThreshold);
  }, [isDragging, dragStartY]);

  // 松开手指
  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;

    setIsDragging(false);

    // 清理长按定时器
    clearLongPressTimer();

    // 如果还没开始录音（长按时间不够），直接关闭
    if (!hasStartedRecording) {
      onClose();
      return;
    }

    if (shouldCancel) {
      // 上滑取消 - 直接关闭，不发送
      try {
        await stopRecognition();
        onClose();
      } catch (error) {
        console.error('取消录音失败:', error);
        onClose();
      }
    } else {
      // 松开发送 - 停止录音并等待结果
      try {
        await stopRecognition();
        // 录音结束后关闭录音界面，识别结果已通过 onInsertText 实时更新到输入框
        onClose();
      } catch (error) {
        console.error('发送录音失败:', error);
        onClose();
      }
    }

    // 重置状态
    setShouldCancel(false);
    setDragStartY(0);
    setHasStartedRecording(false);
    setLongPressProgress(0);
  }, [isDragging, shouldCancel, stopRecognition, onClose, clearLongPressTimer, hasStartedRecording]);

  // 鼠标事件（桌面端）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setShouldCancel(false);

    // 清理之前的定时器
    clearLongPressTimer();

    // 启动长按检测定时器（300ms后开始录音）
    const timer = setTimeout(() => {
      startRecordingInternal();
    }, 300);

    setLongPressTimer(timer);

    // 启动进度动画
    const progressTimer = setInterval(() => {
      setLongPressProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + (100 / 30); // 300ms内完成进度
      });
    }, 10);

    // 300ms后清理进度定时器
    setTimeout(() => {
      clearInterval(progressTimer);
    }, 300);
  }, [clearLongPressTimer, startRecordingInternal]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaY = dragStartY - e.clientY;
    const cancelThreshold = 100;

    setShouldCancel(deltaY > cancelThreshold);
  }, [isDragging, dragStartY]);

  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDragging) return;

    setIsDragging(false);

    // 清理长按定时器
    clearLongPressTimer();

    // 如果还没开始录音（长按时间不够），直接关闭
    if (!hasStartedRecording) {
      onClose();
      return;
    }

    if (shouldCancel) {
      try {
        await stopRecognition();
        onClose();
      } catch (error) {
        console.error('取消录音失败:', error);
        onClose();
      }
    } else {
      try {
        await stopRecognition();
        // 录音结束后关闭录音界面，识别结果已通过 onInsertText 实时更新到输入框
        onClose();
      } catch (error) {
        console.error('发送录音失败:', error);
        onClose();
      }
    }

    setShouldCancel(false);
    setDragStartY(0);
    setHasStartedRecording(false);
    setLongPressProgress(0);
  }, [isDragging, shouldCancel, stopRecognition, onClose, clearLongPressTimer, hasStartedRecording]);



  // 权限检查 - 只有明确被拒绝时才显示错误
  if (permissionStatus === 'denied') {
    return (
      <Paper
        elevation={1}
        sx={{
          height: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
          borderRadius: 2,
          p: 2,
          border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
        }}
      >
        <VolumeX size={24} color="#f44336" style={{ marginBottom: 8 }} />
        <Typography variant="caption" color="text.secondary" textAlign="center">
          需要麦克风权限
        </Typography>
      </Paper>
    );
  }



  return (
    <Box
      sx={{
        width: '100%',
        // 防止文本选择
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        // 防止拖拽
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* 返回按钮 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 1
        }}
      >
        <Tooltip title="返回文字输入">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
        </Tooltip>
      </Box>
      {/* 错误提示 */}
      {error && (
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            color="error"
            sx={{
              fontSize: '0.75rem',
              userSelect: 'none'
            }}
          >
            错误: {error.message}
          </Typography>
        </Box>
      )}

      {/* 录音状态提示文字 - 独立显示在上方 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 1,
          transform: shouldCancel ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'transform 0.2s ease'
        }}
      >
        <Box
          sx={{
            backgroundColor: shouldCancel
              ? '#f44336'
              : hasStartedRecording
              ? '#4caf50'
              : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: '20px',
            px: 2,
            py: 0.5,
            transition: 'background-color 0.2s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <Typography
            variant="body2"
            fontWeight={500}
            color={shouldCancel || hasStartedRecording
              ? '#ffffff'
              : isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'
            }
            sx={{
              fontSize: '0.8rem',
              textAlign: 'center',
              transition: 'color 0.2s ease',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {shouldCancel
              ? '松开取消录音'
              : hasStartedRecording
              ? '正在录音...'
              : '长按开始录音'}
          </Typography>
        </Box>
      </Box>

      {/* 录音波形动画面板 */}
      <Paper
        elevation={3}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // 鼠标离开也视为松开
        sx={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
          borderRadius: 2,
          border: shouldCancel
            ? `2px solid #f44336`
            : hasStartedRecording
            ? `2px solid #4caf50`
            : `2px solid #6366f1`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          px: 2,
          cursor: 'pointer',
          transform: shouldCancel ? 'scale(0.95)' : 'scale(1)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* 长按进度指示器 - 🚀 性能优化：使用 transform: scaleX 替代 width 动画，避免重排 */}
        {!hasStartedRecording && longPressProgress > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              backgroundColor: 'rgba(99, 102, 241, 0.3)',
              borderRadius: 2,
              transformOrigin: 'left center',
              transform: `scaleX(${longPressProgress / 100})`,
              transition: 'transform 0.1s ease',
              willChange: 'transform',
              zIndex: 1
            }}
          />
        )}
        {/* 录音波形动画背景 - 只在录音时显示 */}
        {hasStartedRecording && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 2
            }}
          >
          {/* 音频波形动画 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              height: '40%'
            }}
          >
            {/* 生成多个波形条 */}
            {Array.from({ length: 20 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '2px',
                  animation: `wave-${i % 4} 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                  height: '100%',
                  // 🚀 性能优化：移除 height transition，已经有 scaleY 动画了
                  '@keyframes wave-0': {
                    '0%, 100%': { transform: 'scaleY(0.3)' },
                    '50%': { transform: 'scaleY(1)' }
                  },
                  '@keyframes wave-1': {
                    '0%, 100%': { transform: 'scaleY(0.5)' },
                    '50%': { transform: 'scaleY(0.8)' }
                  },
                  '@keyframes wave-2': {
                    '0%, 100%': { transform: 'scaleY(0.7)' },
                    '50%': { transform: 'scaleY(1.2)' }
                  },
                  '@keyframes wave-3': {
                    '0%, 100%': { transform: 'scaleY(0.4)' },
                    '50%': { transform: 'scaleY(0.9)' }
                  }
                }}
              />
            ))}
          </Box>
        </Box>
        )}

        {/* 未录音时的提示 */}
        {!hasStartedRecording && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              zIndex: 2
            }}
          >
            <Typography
              variant="body2"
              color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
              sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                userSelect: 'none'
              }}
            >
              长按开始录音
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EnhancedVoiceInput;
