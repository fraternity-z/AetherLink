/**
 * MentionedModelsDisplay - 显示已选中的多模型标签
 * 参考 Cherry Studio 的 MentionModelsInput 实现
 */
import React from 'react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { X, AtSign } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { Model } from '../../shared/types';
import { selectProviders } from '../../shared/store/selectors/settingsSelectors';
import { getModelIdentityKey } from '../../shared/utils/modelUtils';

interface MentionedModelsDisplayProps {
  /** 已选中的模型列表 */
  selectedModels: Model[];
  /** 移除模型回调 */
  onRemoveModel: (model: Model) => void;
  /** 清空所有模型回调 */
  onClearAll?: () => void;
}

/**
 * 获取模型的唯一标识
 */
const getModelUniqueId = (model: Model): string => {
  const providerId = model.provider || (model as any).providerId || 'unknown';
  return getModelIdentityKey({ id: model.id, provider: providerId });
};

/**
 * 已选模型显示组件
 * 在输入框上方显示已选中的模型标签，支持单个移除和清空全部
 */
const MentionedModelsDisplay: React.FC<MentionedModelsDisplayProps> = ({
  selectedModels,
  onRemoveModel,
  onClearAll
}) => {
  // 获取提供商配置
  const providers = useSelector(selectProviders);

  // 获取提供商名称
  const getProviderName = (providerId: string): string => {
    const provider = providers.find((p: any) => p.id === providerId);
    return provider?.name || providerId;
  };

  if (selectedModels.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'action.hover',
          borderRadius: 2,
        },
      }}
    >
      {/* @ 图标 */}
      <Tooltip title="多模型对比">
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
          <AtSign size={16} />
        </Box>
      </Tooltip>

      {/* 模型标签列表 */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
        {selectedModels.map((model) => {
          const providerId = model.provider || model.providerType || 'unknown';
          const providerName = getProviderName(providerId);
          
          return (
            <Chip
              key={getModelUniqueId(model)}
              label={`${model.name || model.id} (${providerName})`}
              size="small"
              color="primary"
              variant="outlined"
              onDelete={() => onRemoveModel(model)}
              deleteIcon={<X size={14} />}
              sx={{
                height: 24,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                },
                '& .MuiChip-deleteIcon': {
                  fontSize: 14,
                  marginRight: '4px',
                },
              }}
            />
          );
        })}
      </Box>

      {/* 清空按钮 */}
      {onClearAll && selectedModels.length > 1 && (
        <Tooltip title="清空所有">
          <IconButton
            size="small"
            onClick={onClearAll}
            sx={{ ml: 'auto', flexShrink: 0 }}
          >
            <X size={16} />
          </IconButton>
        </Tooltip>
      )}

      {/* 数量提示 */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ ml: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
      >
        {selectedModels.length} 个模型
      </Typography>
    </Box>
  );
};

export default MentionedModelsDisplay;
