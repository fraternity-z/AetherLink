import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useKeyboard } from './useKeyboard';

/**
 * useInputExpand - 输入框展开/折叠状态管理 Hook
 * 
 * 从 ChatInput、CompactChatInput、ExpandableContainer 抽取的共享逻辑：
 * 1. expanded 状态管理
 * 2. showExpandButton 状态管理
 * 3. textareaExpanded 状态管理（CompactChatInput 特有）
 * 4. 键盘弹出时自动折叠逻辑（模仿 rikkahub）
 * 5. 根据文本长度计算是否显示展开按钮
 * 
 * @see rikkahub ChatInput.kt - LaunchedEffect(imeVisible) 键盘弹出时自动折叠
 */

export interface UseInputExpandOptions {
  /** 当前消息文本 */
  message: string;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 是否为平板 */
  isTablet?: boolean;
  /** 是否启用文本区域展开状态（CompactChatInput 特有） */
  enableTextareaExpand?: boolean;
  /** 显示展开按钮的行数阈值，默认 4 行 */
  expandThreshold?: number;
  /** 隐藏语音按钮的行数阈值，默认 3 行（ChatInput 特有） */
  voiceButtonThreshold?: number;
  /** 容器宽度（用于计算行数），默认根据设备类型自动计算 */
  containerWidth?: number;
  /** 每行字符数，默认根据设备类型自动计算 */
  charsPerLine?: number;
  /** 防抖延迟（毫秒），默认 100ms */
  debounceDelay?: number;
}

export interface UseInputExpandReturn {
  /** 展开状态 */
  expanded: boolean;
  /** 设置展开状态 */
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  /** 是否显示展开按钮 */
  showExpandButton: boolean;
  /** 文本区域展开状态（CompactChatInput 特有） */
  textareaExpanded: boolean;
  /** 设置文本区域展开状态 */
  setTextareaExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  /** 切换展开状态 */
  handleExpandToggle: () => void;
  /** 切换文本区域展开状态 */
  handleTextareaExpandToggle: () => void;
  /** 是否应隐藏语音按钮（ChatInput 特有） */
  shouldHideVoiceButton: boolean;
  /** 键盘是否可见 */
  isKeyboardVisible: boolean;
  /** 隐藏键盘 */
  hideKeyboard: () => void;
}

/**
 * 计算按钮可见性
 * 性能优化：使用字符串操作替代正则表达式（大文本时更快）
 */
function calculateButtonVisibility(
  message: string,
  _containerWidth: number, // 保留参数用于未来扩展
  charsPerLine: number,
  expanded: boolean,
  textareaExpanded: boolean,
  expandThreshold: number,
  voiceButtonThreshold: number,
  enableTextareaExpand: boolean
): { showExpandButton: boolean; shouldHideVoiceButton: boolean } {
  const textLength = message.length;
  
  // 性能优化：使用字符串操作替代正则表达式（大文本时更快）
  let newlineCount = 0;
  if (textLength < 1000) {
    // 小文本使用 split（快速）
    newlineCount = message.split('\n').length - 1;
  } else {
    // 大文本时使用循环（避免创建大量数组）
    for (let i = 0; i < Math.min(textLength, 10000); i++) {
      if (message[i] === '\n') newlineCount++;
    }
  }
  
  const estimatedLines = Math.ceil(textLength / charsPerLine) + newlineCount;
  
  // 如果启用了文本区域展开，使用 textareaExpanded 状态
  // 否则使用 expanded 状态
  const isExpanded = enableTextareaExpand ? textareaExpanded : expanded;
  
  return {
    showExpandButton: isExpanded ? true : estimatedLines > expandThreshold,
    shouldHideVoiceButton: estimatedLines > voiceButtonThreshold
  };
}

export function useInputExpand(options: UseInputExpandOptions): UseInputExpandReturn {
  const {
    message,
    isMobile = false,
    isTablet = false,
    enableTextareaExpand = false,
    expandThreshold = 4,
    voiceButtonThreshold = 3,
    containerWidth: customContainerWidth,
    charsPerLine: customCharsPerLine,
    debounceDelay = 100
  } = options;

  // 展开状态
  const [expanded, setExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [textareaExpanded, setTextareaExpanded] = useState(false);
  const [shouldHideVoiceButton, setShouldHideVoiceButton] = useState(false);

  // 键盘管理 - 模仿 rikkahub 的 WindowInsets.isImeVisible
  const { isKeyboardVisible, hideKeyboard } = useKeyboard();

  // 计算容器宽度和每行字符数
  const containerWidth = customContainerWidth ?? (isMobile ? 280 : isTablet ? 400 : 500);
  const charsPerLine = customCharsPerLine ?? Math.floor(containerWidth / (isTablet ? 17 : 16));

  /**
   * 键盘弹出时自动折叠输入框 - 模仿 rikkahub 的逻辑
   * 
   * 参考 rikkahub 的实现（ChatInput.kt 第 189-194 行）：
   * ```kotlin
   * val imeVisible = WindowInsets.isImeVisible
   * LaunchedEffect(imeVisible) {
   *     if (imeVisible) {
   *         expand = ExpandState.Collapsed  // 键盘弹出时自动折叠
   *     }
   * }
   * ```
   * 
   * 原因：
   * 1. 展开的输入框通常很高（70vh），键盘弹出后屏幕空间不足
   * 2. 自动折叠可以给用户更多的可视空间来查看输入内容
   * 3. 避免展开的输入框遮挡大部分屏幕，影响用户体验
   */
  useEffect(() => {
    if (isKeyboardVisible) {
      if (enableTextareaExpand && textareaExpanded) {
        setTextareaExpanded(false);
      }
      if (expanded) {
        setExpanded(false);
      }
    }
  }, [isKeyboardVisible, expanded, textareaExpanded, enableTextareaExpand]);

  // 性能优化：使用 useMemo 缓存按钮可见性计算结果，避免重复计算
  const buttonVisibility = useMemo(() => {
    return calculateButtonVisibility(
      message,
      containerWidth,
      charsPerLine,
      expanded,
      textareaExpanded,
      expandThreshold,
      voiceButtonThreshold,
      enableTextareaExpand
    );
  }, [message, containerWidth, charsPerLine, expanded, textareaExpanded, expandThreshold, voiceButtonThreshold, enableTextareaExpand]);

  // 使用防抖更新按钮可见性状态，避免频繁 setState
  const buttonVisibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 清除之前的定时器
    if (buttonVisibilityTimeoutRef.current) {
      clearTimeout(buttonVisibilityTimeoutRef.current);
    }
    
    // 使用 requestAnimationFrame + 防抖优化
    buttonVisibilityTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setShowExpandButton(buttonVisibility.showExpandButton);
        setShouldHideVoiceButton(buttonVisibility.shouldHideVoiceButton);
      });
    }, debounceDelay);
    
    return () => {
      if (buttonVisibilityTimeoutRef.current) {
        clearTimeout(buttonVisibilityTimeoutRef.current);
      }
    };
  }, [buttonVisibility, debounceDelay]);

  // 展开切换函数
  const handleExpandToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // 文本区域展开切换函数（CompactChatInput 特有）
  const handleTextareaExpandToggle = useCallback(() => {
    setTextareaExpanded(prev => !prev);
  }, []);

  return {
    expanded,
    setExpanded,
    showExpandButton,
    textareaExpanded,
    setTextareaExpanded,
    handleExpandToggle,
    handleTextareaExpandToggle,
    shouldHideVoiceButton,
    isKeyboardVisible,
    hideKeyboard
  };
}

export default useInputExpand;