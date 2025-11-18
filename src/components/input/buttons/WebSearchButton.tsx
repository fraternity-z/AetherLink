import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import { CustomIcon } from '../../icons';
import WebSearchProviderSelector from '../../WebSearchProviderSelector';
import { getGlassmorphismToolbarStyles, getTransparentToolbarStyles } from '../InputToolbar';

interface WebSearchButtonProps {
  webSearchActive?: boolean;
  toggleWebSearch?: () => void;
  variant?: 'toolbar' | 'icon-button-compact' | 'icon-button-integrated';
}

const WebSearchButton: React.FC<WebSearchButtonProps> = ({
  webSearchActive = false,
  toggleWebSearch,
  variant = 'toolbar'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [showProviderSelector, setShowProviderSelector] = useState(false);

  // 获取网络搜索设置
  const webSearchSettings = useSelector((state: RootState) => state.webSearch);
  const webSearchEnabled = webSearchSettings?.enabled || false;
  const currentProvider = webSearchSettings?.provider;

  // 获取工具栏样式设置
  const toolbarDisplayStyle = useSelector((state: RootState) =>
    state.settings?.toolbarDisplayStyle || 'both'
  ) as 'icon' | 'text' | 'both';

  const toolbarStyle = useSelector((state: RootState) =>
    state.settings?.toolbarStyle || 'glassmorphism'
  ) as 'glassmorphism' | 'transparent';

  // 根据设置选择样式
  const currentStyles = toolbarStyle === 'glassmorphism'
    ? getGlassmorphismToolbarStyles(isDarkMode)
    : getTransparentToolbarStyles(isDarkMode);

  // 处理网络搜索按钮点击
  const handleWebSearchClick = useCallback(() => {
    if (webSearchActive) {
      // 如果当前处于搜索模式，则关闭搜索
      toggleWebSearch?.();
    } else {
      // 如果当前不在搜索模式，显示提供商选择器
      setShowProviderSelector(true);
    }
  }, [webSearchActive, toggleWebSearch]);

  // 处理提供商选择
  const handleProviderSelect = useCallback((providerId: string) => {
    if (providerId && toggleWebSearch) {
      // 选择了提供商，激活搜索模式
      toggleWebSearch();
    }
  }, [toggleWebSearch]);

  // 如果网络搜索未启用，不显示按钮
  if (!webSearchEnabled || !toggleWebSearch) {
    return null;
  }

  // 根据 variant 渲染不同的按钮样式
  const renderButton = () => {
    if (variant === 'icon-button-compact') {
      // CompactChatInput 样式：IconButton，small size，34x34px
      const iconColor = webSearchActive
        ? '#3b82f6'
        : (isDarkMode ? '#B0B0B0' : '#555');
      
      return (
        <Tooltip title={webSearchActive ? '关闭搜索' : '网络搜索'}>
          <IconButton
            size="small"
            onClick={handleWebSearchClick}
            sx={{
              color: iconColor,
              backgroundColor: webSearchActive ? `${iconColor}15` : 'transparent',
              border: webSearchActive ? `1px solid ${iconColor}30` : '1px solid transparent',
              width: 34,
              height: 34,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${iconColor}20`,
                borderColor: `${iconColor}50`,
                color: iconColor,
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 8px ${iconColor}20`
              }
            }}
          >
            <Search size={20} />
          </IconButton>
        </Tooltip>
      );
    }

    if (variant === 'icon-button-integrated') {
      // IntegratedChatInput 样式：IconButton，medium size
      const iconColor = webSearchActive
        ? '#3b82f6'
        : (isDarkMode ? '#ffffff' : '#000000');
      
      return (
        <Tooltip title={webSearchActive ? '退出网络搜索模式' : '网络搜索'}>
          <span>
            <IconButton
              size="medium"
              onClick={handleWebSearchClick}
              disabled={false}
              style={{
                color: iconColor,
                padding: '6px',
                backgroundColor: webSearchActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <CustomIcon name="search" size={20} />
            </IconButton>
          </span>
        </Tooltip>
      );
    }

    // toolbar 样式：使用原有的 Box 样式（glassmorphism/transparent）
    const iconColor = webSearchActive
      ? (isDarkMode ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.8)')
      : (isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.5)');

    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label="网络搜索"
        onClick={handleWebSearchClick}
        sx={{
          ...currentStyles.button,
          // 激活状态的特殊效果
          ...(webSearchActive && toolbarStyle === 'glassmorphism' && {
            background: isDarkMode
              ? 'rgba(59, 130, 246, 0.15)'
              : 'rgba(59, 130, 246, 0.2)',
            border: isDarkMode
              ? '1px solid rgba(59, 130, 246, 0.25)'
              : '1px solid rgba(59, 130, 246, 0.35)',
            boxShadow: isDarkMode
              ? '0 4px 16px rgba(59, 130, 246, 0.1), 0 1px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(59, 130, 246, 0.2)'
              : '0 4px 16px rgba(59, 130, 246, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(59, 130, 246, 0.3)'
          }),
          ...(webSearchActive && toolbarStyle === 'transparent' && {
            background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)'
          }),
          margin: toolbarStyle === 'glassmorphism' ? '0 4px' : '0 2px',
          '&:hover': {
            ...currentStyles.buttonHover,
            ...(webSearchActive && toolbarStyle === 'glassmorphism' && {
              background: isDarkMode
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(59, 130, 246, 0.25)',
              border: isDarkMode
                ? '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: isDarkMode
                ? '0 6px 24px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(59, 130, 246, 0.25)'
                : '0 6px 24px rgba(59, 130, 246, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(59, 130, 246, 0.4)'
            }),
            ...(webSearchActive && toolbarStyle === 'transparent' && {
              background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)'
            })
          },
          '&:active': {
            ...currentStyles.buttonActive
          },
          '&:focus': {
            outline: `2px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)'}`,
            outlineOffset: '2px',
          }
        }}
        title={webSearchActive ? '关闭搜索' : (webSearchSettings?.providers?.find(p => p.id === currentProvider)?.name || '搜索')}
      >
        {toolbarDisplayStyle !== 'text' && (
          <CustomIcon
            name="search"
            size={16}
            color={iconColor}
          />
        )}
        {toolbarDisplayStyle !== 'icon' && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '13px',
              color: webSearchActive
                ? (isDarkMode ? 'rgba(59, 130, 246, 0.95)' : 'rgba(59, 130, 246, 0.9)')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'),
              textShadow: isDarkMode
                ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                : '0 1px 2px rgba(255, 255, 255, 0.8)',
              letterSpacing: '0.01em',
              ml: toolbarDisplayStyle === 'both' ? 0.5 : 0
            }}
          >
            {webSearchActive ? '关闭搜索' : (webSearchSettings?.providers?.find(p => p.id === currentProvider)?.name || '搜索')}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <>
      {renderButton()}
      <WebSearchProviderSelector
        open={showProviderSelector}
        onClose={() => setShowProviderSelector(false)}
        onProviderSelect={handleProviderSelect}
      />
    </>
  );
};

export default WebSearchButton;

