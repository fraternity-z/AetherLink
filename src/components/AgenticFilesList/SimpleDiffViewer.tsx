/**
 * Simple Diff Viewer 组件
 * 简单的 Diff 显示组件，显示文件修改前后的对比
 */

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { FileOperationType } from '../../shared/store/slices/agenticFilesSlice';

interface SimpleDiffViewerProps {
  originalContent: string;
  newContent: string;
  operation: FileOperationType;
  isDarkMode: boolean;
  maxLines?: number;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'info';
  content: string;
  lineNumber?: number;
}

/**
 * 简单的行级 Diff 算法
 * 使用 LCS (最长公共子序列) 的简化版本
 */
function computeSimpleDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const result: DiffLine[] = [];

  // 简单的逐行比较
  let i = 0;
  let j = 0;

  while (i < originalLines.length || j < modifiedLines.length) {
    if (i >= originalLines.length) {
      // 原文件已结束，剩余都是新增
      result.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
      j++;
    } else if (j >= modifiedLines.length) {
      // 新文件已结束，剩余都是删除
      result.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 });
      i++;
    } else if (originalLines[i] === modifiedLines[j]) {
      // 相同行
      result.push({ type: 'unchanged', content: originalLines[i], lineNumber: i + 1 });
      i++;
      j++;
    } else {
      // 不同行 - 尝试查找匹配
      // 向前查找是否在新文件中能找到当前原文件行
      let foundInModified = -1;
      for (let k = j + 1; k < Math.min(j + 5, modifiedLines.length); k++) {
        if (originalLines[i] === modifiedLines[k]) {
          foundInModified = k;
          break;
        }
      }

      // 向前查找是否在原文件中能找到当前新文件行
      let foundInOriginal = -1;
      for (let k = i + 1; k < Math.min(i + 5, originalLines.length); k++) {
        if (modifiedLines[j] === originalLines[k]) {
          foundInOriginal = k;
          break;
        }
      }

      if (foundInModified !== -1 && (foundInOriginal === -1 || foundInModified - j <= foundInOriginal - i)) {
        // 在新文件中找到了，说明中间是新增的
        while (j < foundInModified) {
          result.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
          j++;
        }
      } else if (foundInOriginal !== -1) {
        // 在原文件中找到了，说明中间是删除的
        while (i < foundInOriginal) {
          result.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 });
          i++;
        }
      } else {
        // 都没找到，标记为修改（先删除后新增）
        result.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 });
        result.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
        i++;
        j++;
      }
    }
  }

  return result;
}

const SimpleDiffViewer: React.FC<SimpleDiffViewerProps> = ({
  originalContent,
  newContent,
  operation,
  isDarkMode,
  maxLines = 100,
}) => {
  // 计算 Diff
  const diffLines = useMemo(() => {
    // 如果没有内容，显示提示
    if (!originalContent && !newContent) {
      return [{ type: 'info' as const, content: '(无内容预览)' }];
    }

    if (operation === 'create') {
      // 新建文件，全部显示为新增
      if (!newContent) {
        return [{ type: 'info' as const, content: '(空文件)' }];
      }
      return newContent.split('\n').slice(0, maxLines).map((line, index) => ({
        type: 'added' as const,
        content: line,
        lineNumber: index + 1,
      }));
    }

    if (operation === 'delete') {
      // 删除文件，全部显示为删除
      if (!originalContent) {
        return [{ type: 'info' as const, content: '(空文件)' }];
      }
      return originalContent.split('\n').slice(0, maxLines).map((line, index) => ({
        type: 'removed' as const,
        content: line,
        lineNumber: index + 1,
      }));
    }

    // 修改文件，计算 Diff
    if (!originalContent && !newContent) {
      return [{ type: 'info' as const, content: '(无内容变化)' }];
    }
    
    const diff = computeSimpleDiff(originalContent || '', newContent || '');
    
    // 限制显示行数
    if (diff.length > maxLines) {
      return [
        ...diff.slice(0, maxLines),
        { type: 'info' as const, content: `... 还有 ${diff.length - maxLines} 行未显示` },
      ];
    }

    return diff;
  }, [originalContent, newContent, operation, maxLines]);

  // 获取行样式
  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return {
          backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)',
          borderLeft: '3px solid #4caf50',
        };
      case 'removed':
        return {
          backgroundColor: isDarkMode ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.1)',
          borderLeft: '3px solid #f44336',
        };
      case 'info':
        return {
          backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
          borderLeft: '3px solid #2196f3',
          fontStyle: 'italic',
        };
      default:
        return {
          borderLeft: '3px solid transparent',
        };
    }
  };

  // 获取行前缀
  const getLinePrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  if (diffLines.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        无内容变化
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        lineHeight: 1.5,
        overflow: 'auto',
        borderRadius: 1,
        border: '1px solid',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }}
    >
      {diffLines.map((line, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            ...getLineStyle(line.type),
            px: 1,
            py: 0.25,
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            },
          }}
        >
          {/* 行号 */}
          {line.lineNumber !== undefined && (
            <Typography
              component="span"
              sx={{
                width: 40,
                minWidth: 40,
                textAlign: 'right',
                pr: 1,
                color: 'text.secondary',
                fontSize: '0.7rem',
                userSelect: 'none',
              }}
            >
              {line.lineNumber}
            </Typography>
          )}

          {/* 前缀 (+/-) */}
          <Typography
            component="span"
            sx={{
              width: 16,
              minWidth: 16,
              color: line.type === 'added' ? 'success.main' : line.type === 'removed' ? 'error.main' : 'text.secondary',
              fontWeight: 'bold',
              userSelect: 'none',
            }}
          >
            {getLinePrefix(line.type)}
          </Typography>

          {/* 内容 */}
          <Typography
            component="span"
            sx={{
              flex: 1,
              whiteSpace: 'pre',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: line.type === 'info' ? 'text.secondary' : 'inherit',
            }}
          >
            {line.content || ' '}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default SimpleDiffViewer;
