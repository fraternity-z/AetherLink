import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  alpha
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus as AddIcon, Trash2 as DeleteIcon, Brain, Sparkles, ArrowRight, GitCompare, Save } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';
import DropdownModelSelector from '../ChatPage/components/DropdownModelSelector';
import { getModelIdentityKey, modelMatchesIdentity, parseModelIdentityKey } from '../../shared/utils/modelUtils';
import CustomSwitch from '../../components/CustomSwitch';
import { useTranslation } from 'react-i18next';
import { modelComboService } from '../../shared/services/ModelComboService';
import { useModelComboSync } from '../../shared/hooks/useModelComboSync';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

import type { ModelComboStrategy, ModelComboFormData } from '../../shared/types/ModelCombo';

const ModelComboEditPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { comboId } = useParams<{ comboId: string }>();
  const isEditing = comboId && comboId !== 'new';
  
  const { syncModelCombos } = useModelComboSync();

  const [formData, setFormData] = useState<ModelComboFormData>({
    name: '',
    description: '',
    strategy: 'sequential',
    enabled: true,
    models: [
      { modelId: '', role: 'thinking', weight: 1, priority: 1 },
      { modelId: '', role: 'generating', weight: 1, priority: 2 }
    ]
  });
  const [loading, setLoading] = useState(false);

  // 获取所有可用模型
  const providers = useSelector((state: RootState) => state.settings.providers);
  const availableModels = useMemo(() => (
    providers
      .filter(provider => provider.id !== 'model-combo' && provider.isEnabled)
      .flatMap(provider =>
        provider.models
          .filter(model => model.enabled)
          .map(model => ({
            ...model,
            provider: model.provider || provider.id,
            providerId: provider.id,
            identityKey: getModelIdentityKey({ id: model.id, provider: model.provider || provider.id })
          }))
      )
  ), [providers]);

  // 加载现有组合数据
  useEffect(() => {
    const loadCombo = async () => {
      if (isEditing) {
        try {
          const combos = await modelComboService.getAllCombos();
          const combo = combos.find(c => c.id === comboId);
          if (combo) {
            const normalizedModels = combo.models.map(m => {
              const parsedIdentity = parseModelIdentityKey(m.modelId);
              if (parsedIdentity) {
                return {
                  modelId: getModelIdentityKey(parsedIdentity),
                  role: m.role,
                  weight: m.weight,
                  priority: m.priority
                };
              }
              const matchedModel = availableModels.find(model =>
                model.id === m.modelId || (model as any).identityKey === m.modelId
              );
              const fallbackIdentity = matchedModel
                ? getModelIdentityKey({ id: matchedModel.id, provider: matchedModel.provider || matchedModel.providerId })
                : getModelIdentityKey({ id: m.modelId, provider: '' });
              return {
                modelId: fallbackIdentity,
                role: m.role,
                weight: m.weight,
                priority: m.priority
              };
            });

            setFormData({
              name: combo.name,
              description: combo.description || '',
              strategy: combo.strategy,
              enabled: combo.enabled,
              models: normalizedModels
            });
          }
        } catch (error) {
          console.error('加载模型组合失败:', error);
        }
      }
    };
    loadCombo();
  }, [comboId, isEditing, availableModels]);

  const handleBack = () => {
    navigate('/settings/model-combo');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 为 models 添加 id 字段
      const dataToSave = {
        ...formData,
        models: formData.models.map((m, index) => ({
          ...m,
          id: `model_${Date.now()}_${index}`,
          role: m.role as 'primary' | 'secondary' | 'thinking' | 'generating' | 'fallback'
        }))
      };
      
      if (isEditing && comboId) {
        await modelComboService.updateCombo(comboId, dataToSave);
      } else {
        await modelComboService.createCombo(dataToSave);
      }
      await syncModelCombos();
      navigate('/settings/model-combo');
    } catch (error) {
      console.error('保存模型组合失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = () => {
    const newPriority = formData.models.length + 1;
    setFormData(prev => ({
      ...prev,
      models: [...prev.models, {
        modelId: '',
        role: 'primary',
        weight: 1,
        priority: newPriority
      }]
    }));
  };

  const handleRemoveModel = (index: number) => {
    if (formData.strategy === 'sequential' && formData.models.length <= 2) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index)
    }));
  };

  const handleModelChange = (index: number, field: string, value: any) => {
    let nextValue = value;
    if (field === 'modelId' && typeof value === 'string') {
      const parsedIdentity = parseModelIdentityKey(value);
      if (parsedIdentity) {
        nextValue = getModelIdentityKey(parsedIdentity);
      } else {
        const matchedModel = availableModels.find(model =>
          model.id === value || (model as any).identityKey === value
        );
        nextValue = matchedModel
          ? getModelIdentityKey({ id: matchedModel.id, provider: matchedModel.provider || matchedModel.providerId })
          : value;
      }
    }
    setFormData(prev => ({
      ...prev,
      models: prev.models.map((model, i) =>
        i === index ? { ...model, [field]: nextValue } : model
      )
    }));
  };

  const handleStrategyChange = (strategy: ModelComboStrategy) => {
    let newModels = formData.models;
    if (strategy === 'sequential') {
      newModels = [
        { modelId: formData.models[0]?.modelId || '', role: 'thinking', weight: 1, priority: 1 },
        { modelId: formData.models[1]?.modelId || '', role: 'generating', weight: 1, priority: 2 }
      ];
    } else if (strategy === 'comparison') {
      if (formData.models.length < 2) {
        newModels = [
          { modelId: '', role: 'primary', weight: 1, priority: 1 },
          { modelId: '', role: 'primary', weight: 1, priority: 2 }
        ];
      }
    }
    setFormData(prev => ({ ...prev, strategy, models: newModels }));
  };

  const getStrategyDescription = (strategy: ModelComboStrategy) => {
    switch (strategy) {
      case 'sequential':
        return t('modelSettings.combo.strategyDesc.sequential', '先用推理模型深度思考，再用生成模型输出答案（类似 DeepClaude）');
      case 'comparison':
        return t('modelSettings.combo.strategyDesc.comparison', '同时使用多个模型，展示对比结果供用户选择');
      default:
        return '';
    }
  };

  const getModelLabel = (index: number) => {
    if (formData.strategy === 'sequential') {
      return index === 0
        ? { icon: <Brain size={20} />, label: t('modelSettings.combo.thinkingModel', '推理模型'), color: '#9c27b0', desc: '负责深度思考和推理' }
        : { icon: <Sparkles size={20} />, label: t('modelSettings.combo.generatingModel', '生成模型'), color: '#2196f3', desc: '基于推理结果生成最终答案' };
    }
    return { icon: <GitCompare size={20} />, label: `${t('modelSettings.combo.model', '模型')} ${index + 1}`, color: '#757575', desc: '' };
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' &&
           formData.models.length >= 2 &&
           formData.models.every(m => m.modelId.trim() !== '');
  };

  return (
    <SafeAreaContainer>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ color: 'primary.main' }}>
            <ArrowLeft size={24} />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {isEditing ? t('modelSettings.combo.editCombo', '编辑模型组合') : t('modelSettings.combo.createCombo', '创建模型组合')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={handleSave}
            disabled={!isFormValid() || loading}
          >
            {t('common.save', '保存')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, pb: 'var(--content-bottom-padding)' }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 基本信息 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('modelSettings.combo.basicInfo', '基本信息')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label={t('modelSettings.combo.comboName', '组合名称')}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="例如：DeepClaude 组合"
                />
                <TextField
                  fullWidth
                  label={t('modelSettings.combo.description', '描述')}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                  placeholder="描述这个模型组合的用途"
                />
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={formData.enabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  }
                  label={t('modelSettings.combo.enableCombo', '启用此组合')}
                />
              </Box>
            </CardContent>
          </Card>

          {/* 策略选择 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('modelSettings.combo.strategy.label', '组合策略')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('modelSettings.combo.strategy.label', '组合策略')}</InputLabel>
                  <Select
                    value={formData.strategy}
                    onChange={(e) => handleStrategyChange(e.target.value as ModelComboStrategy)}
                    label={t('modelSettings.combo.strategy.label', '组合策略')}
                  >
                    <MenuItem value="sequential">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArrowRight size={18} />
                        {t('modelSettings.combo.strategy.sequential', '顺序执行')}
                      </Box>
                    </MenuItem>
                    <MenuItem value="comparison">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GitCompare size={18} />
                        {t('modelSettings.combo.strategy.comparison', '对比分析')}
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                <Alert severity="info" sx={{ mt: 2 }}>
                  {getStrategyDescription(formData.strategy)}
                </Alert>
              </Box>
            </CardContent>
          </Card>

          {/* 模型配置 */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('modelSettings.combo.configModels', '配置模型')}
                </Typography>
                {formData.strategy === 'comparison' && (
                  <Button startIcon={<AddIcon size={18} />} onClick={handleAddModel} size="small">
                    {t('modelSettings.combo.addModel', '添加模型')}
                  </Button>
                )}
              </Box>

              {/* 顺序策略 */}
              {formData.strategy === 'sequential' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {formData.models.map((model, index) => {
                    const labelInfo = getModelLabel(index);
                    return (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{
                          borderColor: alpha(labelInfo.color, 0.5),
                          bgcolor: alpha(labelInfo.color, 0.03)
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: labelInfo.color }}>
                            {labelInfo.icon}
                            <Typography variant="subtitle2" fontWeight={600} color="inherit">
                              {labelInfo.label}
                            </Typography>
                          </Box>
                          {labelInfo.desc && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                              {labelInfo.desc}
                            </Typography>
                          )}
                          <DropdownModelSelector
                            selectedModel={
                              model.modelId
                                ? availableModels.find(m =>
                                    modelMatchesIdentity(m, parseModelIdentityKey(model.modelId), m.provider)
                                  ) || null
                                : null
                            }
                            availableModels={availableModels}
                            handleModelSelect={(selectedModel) => {
                              handleModelChange(
                                index,
                                'modelId',
                                selectedModel
                                  ? getModelIdentityKey({
                                      id: selectedModel.id,
                                      provider: selectedModel.provider || (selectedModel as any).providerId
                                    })
                                  : ''
                              );
                            }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* 流程指示 */}
                  <Divider sx={{ my: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', px: 2 }}>
                      <Brain size={16} color="#9c27b0" />
                      <ArrowRight size={16} />
                      <Sparkles size={16} color="#2196f3" />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {t('modelSettings.combo.sequentialFlow', '推理 → 生成')}
                      </Typography>
                    </Box>
                  </Divider>
                </Box>
              )}

              {/* 对比策略 */}
              {formData.strategy === 'comparison' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {formData.models.map((model, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={500}>
                            {t('modelSettings.combo.model', '模型')} {index + 1}
                          </Typography>
                          {formData.models.length > 2 && (
                            <IconButton size="small" onClick={() => handleRemoveModel(index)} color="error">
                              <DeleteIcon size={18} />
                            </IconButton>
                          )}
                        </Box>
                        <DropdownModelSelector
                          selectedModel={
                            model.modelId
                              ? availableModels.find(m =>
                                  modelMatchesIdentity(m, parseModelIdentityKey(model.modelId), m.provider)
                                ) || null
                              : null
                          }
                          availableModels={availableModels}
                          handleModelSelect={(selectedModel) => {
                            handleModelChange(
                              index,
                              'modelId',
                              selectedModel
                                ? getModelIdentityKey({
                                    id: selectedModel.id,
                                    provider: selectedModel.provider || (selectedModel as any).providerId
                                  })
                                : ''
                            );
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </SafeAreaContainer>
  );
};

export default ModelComboEditPage;
