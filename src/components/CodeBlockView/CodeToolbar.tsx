import React, { memo } from 'react';
import { IconButton, Tooltip, Box, useMediaQuery, useTheme } from '@mui/material';
import type { ActionTool } from './types';

interface CodeToolbarProps {
  tools: ActionTool[];
  className?: string;
}

/**
 * 代码块工具栏组件
 * 显示一组工具按钮，支持分组显示
 * - 移动端：始终显示
 * - Web端：hover 时显示
 */
const CodeToolbar: React.FC<CodeToolbarProps> = ({ tools, className }) => {
  // 检测是否为移动端（触摸设备）
  const isMobile = useMediaQuery('(hover: none) and (pointer: coarse)');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  if (tools.length === 0) return null;

  // 按组分类工具
  const quickTools = tools.filter(t => t.group === 'quick');
  const coreTools = tools.filter(t => t.group === 'core' || !t.group);

  return (
    <Box
      className={`code-toolbar ${className || ''}`}
      sx={{
        // 移除绝对定位，融入头部
        display: 'flex',
        gap: 0.5,
        backgroundColor: 'transparent', // 透明背景，融入头部
        borderRadius: '6px',
        padding: '2px 4px',
        // 移动端优化：增大点击区域和内边距
        ...(isMobile && {
          padding: '4px 6px',
          gap: 0.75,
        })
      }}
    >
      {/* Quick 工具组 */}
      {quickTools.map(tool => (
        <Tooltip key={tool.id} title={tool.title} placement="top" disableHoverListener={isMobile}>
          <span>
            <IconButton
              size="small"
              onClick={tool.onClick}
              disabled={tool.disabled}
              sx={{
                color: tool.active ? 'primary.main' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'), // 适配头部背景颜色
                padding: isMobile ? '8px' : '5px', // 增加按钮内边距
                minWidth: isMobile ? '36px' : 'auto',
                minHeight: isMobile ? '36px' : 'auto',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', // 适配头部背景的hover效果
                },
                '&:active': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-disabled': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                },
                // 移动端增大图标
                '& svg': {
                  width: isMobile ? 20 : 16, // 移动端图标更大
                  height: isMobile ? 20 : 16,
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
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', // 适配主题颜色
            margin: isMobile ? '6px 4px' : '4px 2px',
          }}
        />
      )}

      {/* Core 工具组 */}
      {coreTools.map(tool => (
        <Tooltip key={tool.id} title={tool.title} placement="top" disableHoverListener={isMobile}>
          <span>
            <IconButton
              size="small"
              onClick={tool.onClick}
              disabled={tool.disabled}
              sx={{
                color: tool.active ? 'primary.main' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'), // 适配头部背景颜色
                padding: isMobile ? '8px' : '5px', // 增加按钮内边距
                minWidth: isMobile ? '36px' : 'auto',
                minHeight: isMobile ? '36px' : 'auto',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', // 适配头部背景的hover效果
                },
                '&:active': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-disabled': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                },
                // 移动端增大图标
                '& svg': {
                  width: isMobile ? 20 : 16, // 移动端图标更大
                  height: isMobile ? 20 : 16,
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

export { CodeToolbar };
export default memo(CodeToolbar);
