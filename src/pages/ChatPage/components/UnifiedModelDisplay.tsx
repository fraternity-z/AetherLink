import React from 'react';
import { Box, Typography, IconButton, Button, useTheme, useMediaQuery } from '@mui/material';
import { Bot } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { Model } from '../../../shared/types';
import { selectProviders } from '../../../shared/store/selectors/settingsSelectors';

interface UnifiedModelDisplayProps {
  selectedModel: Model | null;
  onClick: () => void;
  displayStyle?: 'icon' | 'text';
}

// 🔥 验证并修复显示样式值
const validateDisplayStyle = (style: unknown): 'icon' | 'text' => {
  if (style === 'text' || style === 'icon') {
    return style;
  }
  // 修复损坏的数据：返回默认值
  console.warn(`[UnifiedModelDisplay] 无效的 displayStyle 值: "${style}", 使用默认值 "icon"`);
  return 'icon';
};

export const UnifiedModelDisplay: React.FC<UnifiedModelDisplayProps> = ({
  selectedModel,
  onClick,
  displayStyle
}) => {
  // 验证并确保 displayStyle 是有效值
  const validatedDisplayStyle = validateDisplayStyle(displayStyle);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const providers = useSelector(selectProviders);

  // 获取提供商名称
  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : providerId;
  };

  // 计算动态字体大小
  const getDynamicFontSize = (text: string): string => {
    const baseSize = 0.875;
    const minSize = 0.65;
    const maxLength = 18;

    if (text.length <= maxLength) {
      return `${baseSize}rem`;
    }

    const lengthRatio = text.length / maxLength;
    const scaleFactor = Math.max(1 / Math.sqrt(lengthRatio), minSize / baseSize);
    const scaledSize = baseSize * scaleFactor;

    return `${Math.max(scaledSize, minSize)}rem`;
  };

  if (validatedDisplayStyle === 'icon') {
    return (
      <IconButton
        color="inherit"
        size="small"
        onClick={onClick}
      >
        <Bot size={20} />
      </IconButton>
    );
  }

  // 文字模式 - 显示模型名 + 供应商名
  const providerName = selectedModel ? getProviderName(selectedModel.provider || '') : '';
  const modelName = selectedModel?.name || 'GPT-4';
  const dynamicFontSize = getDynamicFontSize(modelName);

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onClick}
      sx={{
        borderColor: 'divider',
        color: 'text.primary',
        textTransform: 'none',
        minWidth: 'auto',
        px: 1.5,
        py: 0.5
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontSize: dynamicFontSize,
            color: theme.palette.text.primary,
            maxWidth: isMobile ? '120px' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.1
          }}
          title={modelName}
        >
          {modelName}
        </Typography>
        {providerName && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              color: theme.palette.text.secondary,
              lineHeight: 1,
              mt: 0.25,
              maxWidth: isMobile ? '120px' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={providerName}
          >
            {providerName}
          </Typography>
        )}
      </Box>
    </Button>
  );
};
