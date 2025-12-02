/**
 * 网络搜索工具消息块组件
 * 
 * 显示 AI 调用网络搜索工具的状态和结果
 * 简约风格设计
 */

import React from 'react';
import { Search, Loader2, Check, ExternalLink, X } from 'lucide-react';
import type { ToolMessageBlock } from '../../shared/types/newMessage';

interface MessageWebSearchToolProps {
  block: ToolMessageBlock;
}

interface WebSearchToolResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet?: string;
    content?: string;
  }>;
  success: boolean;
  error?: string;
}

/**
 * 网络搜索工具消息块
 */
export const MessageWebSearchTool: React.FC<MessageWebSearchToolProps> = ({ block }) => {
  const isSearching = block.status === 'processing' || block.status === 'streaming';
  const isDone = block.status === 'success';
  const isError = block.status === 'error';

  // 解析工具响应
  const toolResponse = block.metadata?.rawMcpToolResponse;
  const toolInput = toolResponse?.arguments as { query?: string; additionalContext?: string } | undefined;
  const toolOutput = block.content as WebSearchToolResult | undefined;

  // 获取搜索查询
  const searchQuery = toolInput?.query || toolInput?.additionalContext || toolOutput?.query || '搜索中...';

  // 搜索中状态
  if (isSearching) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
        <Loader2 size={14} className="text-gray-400 animate-spin" />
        <span className="text-gray-600 dark:text-gray-400">
          正在搜索: {searchQuery}
        </span>
      </div>
    );
  }

  // 错误状态
  if (isError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
        <X size={14} className="text-gray-400" />
        <span className="text-gray-500 dark:text-gray-400">
          搜索失败: {toolOutput?.error || '未知错误'}
        </span>
      </div>
    );
  }

  // 完成状态
  if (isDone && toolOutput) {
    const resultCount = toolOutput.results?.length || 0;

    return (
      <div className="space-y-2">
        {/* 搜索摘要 */}
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
          <Check size={14} className="text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            搜索完成，找到 {resultCount} 个结果
          </span>
        </div>

        {/* 搜索结果列表 */}
        {resultCount > 0 && (
          <div className="space-y-1 pl-2">
            {toolOutput.results.slice(0, 5).map((result, index) => (
              <a
                key={index}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-start gap-2 px-2 py-1.5 rounded
                  hover:bg-gray-50 dark:hover:bg-gray-800/50
                  text-sm group transition-colors
                "
              >
                <span className="
                  flex-shrink-0 w-4 h-4
                  text-gray-400
                  flex items-center justify-center text-xs
                ">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-700 dark:text-gray-300 truncate group-hover:underline">
                      {result.title}
                    </span>
                    <ExternalLink size={10} className="text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {result.snippet && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                      {result.snippet}
                    </p>
                  )}
                </div>
              </a>
            ))}
            {resultCount > 5 && (
              <div className="text-xs text-gray-400 pl-6">
                还有 {resultCount - 5} 个结果...
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 默认状态（等待中）
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
      <Search size={14} className="text-gray-400" />
      <span className="text-gray-500 dark:text-gray-400">
        网络搜索
      </span>
    </div>
  );
};

/**
 * 网络搜索工具标题组件
 * 用于在工具块折叠时显示
 */
export const MessageWebSearchToolTitle: React.FC<MessageWebSearchToolProps> = ({ block }) => {
  const isSearching = block.status === 'processing' || block.status === 'streaming';
  const isDone = block.status === 'success';

  const toolOutput = block.content as WebSearchToolResult | undefined;
  const resultCount = toolOutput?.results?.length || 0;

  if (isSearching) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        <span>正在搜索...</span>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Search size={12} />
        <span>搜索完成，{resultCount} 个结果</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-400">
      <Search size={12} />
      <span>网络搜索</span>
    </div>
  );
};

export default MessageWebSearchTool;
