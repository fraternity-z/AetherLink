import React from 'react';

import type { ThinkingDisplayStyle } from './ThinkingBlock';
import ThinkingAdvancedStyles from './ThinkingAdvancedStyles';
// Motion variants are now defined inline for better type safety

interface ThinkingDisplayRendererProps {
  displayStyle: ThinkingDisplayStyle;
  expanded: boolean;
  isThinking: boolean;
  thinkingTime: number;
  content: string;
  copied: boolean;
  streamText: string;
  sidebarOpen: boolean;
  overlayOpen: boolean;
  updateCounter: number;
  onToggleExpanded: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onSetSidebarOpen: (open: boolean) => void;
  onSetOverlayOpen: (open: boolean) => void;
  onSetStreamText: (text: string) => void;
}

// 样式化组件

/**
 * 思考过程显示渲染器组件
 * 负责根据不同的显示样式渲染思考过程内容
 * 已删除大部分样式，只保留流式样式，防止太过冗杂
 */
const ThinkingDisplayRenderer: React.FC<ThinkingDisplayRendererProps> = ({
  displayStyle,
  expanded,
  isThinking,
  thinkingTime,
  content,
  copied,
  streamText,
  sidebarOpen,
  overlayOpen,
  onToggleExpanded,
  onCopy,
  onSetSidebarOpen,
  onSetOverlayOpen,
  onSetStreamText
}) => {
  
  // 格式化思考时间（毫秒转为秒，保留1位小数）

  // 只渲染流式样式，其余情况均不渲染
  if (displayStyle !== 'stream') {
    return null;
  }

  // 完整显示样式

  // 极简模式 - 只显示一个小图标

  // 气泡模式 - 类似聊天气泡

  // 时间线模式 - 左侧有时间线指示器

  // 卡片模式 - 更突出的卡片设计

  // 内联模式 - 嵌入在消息中

  // 思考点动画模式 - 类似聊天应用的"正在输入"

  // 检查是否是高级样式
  if (displayStyle === 'stream') {
    return (
      <ThinkingAdvancedStyles
        displayStyle={'stream'}
        isThinking={isThinking}
        thinkingTime={thinkingTime}
        content={content}
        copied={copied}
        expanded={expanded}
        streamText={streamText}
        sidebarOpen={sidebarOpen}
        overlayOpen={overlayOpen}
        onToggleExpanded={onToggleExpanded}
        onCopy={onCopy}
        onSetSidebarOpen={onSetSidebarOpen}
        onSetOverlayOpen={onSetOverlayOpen}
        onSetStreamText={onSetStreamText}
      />
    );
  }

  // 根据样式选择渲染方法
  // 仅保留流式样式，其余不渲染
  return null;
};

export default React.memo(ThinkingDisplayRenderer);
