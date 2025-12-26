import React from 'react';
import { Box, Typography, TextField, Button, IconButton, Tooltip } from '@mui/material';
import { HelpCircle, RefreshCw } from 'lucide-react';
import BackButtonDialog from '../../../components/common/BackButtonDialog';
import { SolidBridge } from '../../../shared/bridges/SolidBridge';
import { DialogModelSelector as SolidDialogModelSelector } from '../../../solid/components/ModelSelector/DialogModelSelector.solid';
import type { Model } from '../../../shared/types';

interface ModelConfigDialogProps {
  open: boolean;
  onClose: () => void;
  // LLM 模型相关
  selectedLLMModel: Model | null;
  llmMenuOpen: boolean;
  onLlmMenuOpen: () => void;
  onLlmMenuClose: () => void;
  onLlmModelSelect: (model: Model) => void;
  // 嵌入模型相关
  selectedEmbeddingModel: Model | null;
  embeddingMenuOpen: boolean;
  onEmbeddingMenuOpen: () => void;
  onEmbeddingMenuClose: () => void;
  onEmbeddingModelSelect: (model: Model) => void;
  // 嵌入维度
  embeddingDimensions: number;
  onEmbeddingDimensionsChange: (value: number) => void;
  onDetectDimensions: () => void;
  // 其他
  models: Model[];
  providers: any[];
  themeMode: 'light' | 'dark';
  fullScreen: boolean;
  onSave: () => void;
}

/**
 * 模型配置对话框
 */
const ModelConfigDialog: React.FC<ModelConfigDialogProps> = ({
  open,
  onClose,
  selectedLLMModel,
  llmMenuOpen,
  onLlmMenuOpen,
  onLlmMenuClose,
  onLlmModelSelect,
  selectedEmbeddingModel,
  embeddingMenuOpen,
  onEmbeddingMenuOpen,
  onEmbeddingMenuClose,
  onEmbeddingModelSelect,
  embeddingDimensions,
  onEmbeddingDimensionsChange,
  onDetectDimensions,
  models,
  providers,
  themeMode,
  fullScreen,
  onSave,
}) => {
  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">记忆设置</Typography>
          <IconButton onClick={onClose} size="small">
            ×
          </IconButton>
        </Box>

        {/* LLM 模型 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="error" sx={{ mb: 0.5 }}>
            * LLM 模型
          </Typography>
          <Box 
            onClick={onLlmMenuOpen}
            sx={{ 
              p: 1.5, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            <Typography variant="body2" color={selectedLLMModel ? 'text.primary' : 'text.secondary'}>
              {selectedLLMModel ? (selectedLLMModel.name || selectedLLMModel.id) : '未选择模型'}
            </Typography>
          </Box>
          <SolidBridge
            component={SolidDialogModelSelector as any}
            props={{
              selectedModel: selectedLLMModel,
              availableModels: models,
              handleModelSelect: (model: Model) => {
                onLlmModelSelect(model);
              },
              handleMenuClose: onLlmMenuClose,
              menuOpen: llmMenuOpen,
              providers: providers,
              themeMode: themeMode,
              fullScreen: fullScreen,
            }}
            debugName="LLMModelSelector"
          />
        </Box>

        {/* 嵌入模型 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="error" sx={{ mb: 0.5 }}>
            * 嵌入模型
          </Typography>
          <Box 
            onClick={onEmbeddingMenuOpen}
            sx={{ 
              p: 1.5, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            <Typography variant="body2" color={selectedEmbeddingModel ? 'text.primary' : 'text.secondary'}>
              {selectedEmbeddingModel ? (selectedEmbeddingModel.name || selectedEmbeddingModel.id) : '未选择模型'}
            </Typography>
          </Box>
          <SolidBridge
            component={SolidDialogModelSelector as any}
            props={{
              selectedModel: selectedEmbeddingModel,
              availableModels: models,
              handleModelSelect: (model: Model) => {
                onEmbeddingModelSelect(model);
              },
              handleMenuClose: onEmbeddingMenuClose,
              menuOpen: embeddingMenuOpen,
              providers: providers,
              themeMode: themeMode,
              fullScreen: fullScreen,
            }}
            debugName="EmbeddingModelSelector"
          />
        </Box>

        {/* 嵌入维度 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2">嵌入维度</Typography>
            <Tooltip title="向量嵌入的维度数，常见值：768, 1536, 3072">
              <HelpCircle size={14} style={{ opacity: 0.5 }} />
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type="number"
              value={embeddingDimensions}
              onChange={(e) => onEmbeddingDimensionsChange(parseInt(e.target.value) || 1536)}
              size="small"
              fullWidth
              inputProps={{ min: 64, max: 8192 }}
            />
            <IconButton onClick={onDetectDimensions} size="small">
              <RefreshCw size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* 按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>取消</Button>
          <Button 
            variant="contained" 
            onClick={onSave}
            disabled={!selectedLLMModel || !selectedEmbeddingModel}
          >
            确定
          </Button>
        </Box>
      </Box>
    </BackButtonDialog>
  );
};

export default ModelConfigDialog;
