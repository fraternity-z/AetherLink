import React, { memo } from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import type { ActionTool } from './types';

interface CodeToolbarProps {
  tools: ActionTool[];
  className?: string;
}

/**
 * 代码块工具栏组件
 * 显示一组工具按钮，支持分组显示
 */
const CodeToolbar: React.FC<CodeToolbarProps> = ({ tools, className }) => {
  if (tools.length === 0) return null;

  // 按组分类工具
  const quickTools = tools.filter(t => t.group === 'quick');
  const coreTools = tools.filter(t => t.group === 'core' || !t.group);

  return (
    <Box
      className={`code-toolbar ${className || ''}`}
      sx={{
        position: 'absolute',
        top: 4,
        right: 8,
        display: 'flex',
        gap: 0.5,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '6px',
        padding: '2px 4px',
        backdropFilter: 'blur(4px)',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        '.code-block:hover &': {
          opacity: 1,
        },
        '&.show': {
          opacity: 1,
        }
      }}
    >
      {/* Quick 工具组 */}
      {quickTools.map(tool => (
        <Tooltip key={tool.id} title={tool.title} placement="top">
          <span>
            <IconButton
              size="small"
              onClick={tool.onClick}
              disabled={tool.disabled}
              sx={{
                color: tool.active ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {tool.icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}

      {/* 分隔线 */}
      {quickTools.length > 0 && coreTools.length > 0 && (
        <Box
          sx={{
            width: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '4px 2px',
          }}
        />
      )}

      {/* Core 工具组 */}
      {coreTools.map(tool => (
        <Tooltip key={tool.id} title={tool.title} placement="top">
          <span>
            <IconButton
              size="small"
              onClick={tool.onClick}
              disabled={tool.disabled}
              sx={{
                color: tool.active ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {tool.icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </Box>
  );
};

export default memo(CodeToolbar);
