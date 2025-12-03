import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  TextField,
  Button
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import { updateSettings } from '../../../shared/store/settingsSlice';
import { getModelIdentityKey, modelMatchesIdentity, parseModelIdentityKey } from '../../../shared/utils/modelUtils';
import { ModelSelector } from '../../ChatPage/components/ModelSelector';
import { useTranslation } from 'react-i18next';
import useScrollPosition from '../../../hooks/useScrollPosition';
import CustomSwitch from '../../../components/CustomSwitch';


const DefaultModelSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-default-model', {
    autoRestore: true,
    restoreDelay: 0
  });

  // 获取当前设置
  const defaultModelId = useSelector((state: RootState) => state.settings.defaultModelId);
  const topicNamingModelId = useSelector((state: RootState) => state.settings.topicNamingModelId);
  const providers = useSelector((state: RootState) => state.settings.providers);


  // 话题命名功能的状态 - 统一字段名称
  const enableTopicNaming = useSelector((state: RootState) => state.settings.enableTopicNaming);
  const topicNamingPrompt = useSelector((state: RootState) => state.settings.topicNamingPrompt);
  const topicNamingUseCurrentModel = useSelector((state: RootState) => state.settings.topicNamingUseCurrentModel);

  // 🚀 AI 意图分析设置
  const enableAIIntentAnalysis = useSelector((state: RootState) => state.settings.enableAIIntentAnalysis);
  const aiIntentAnalysisUseCurrentModel = useSelector((state: RootState) => state.settings.aiIntentAnalysisUseCurrentModel);
  const aiIntentAnalysisModelId = useSelector((state: RootState) => state.settings.aiIntentAnalysisModelId);

  // 模型选择器对话框状态
  const [modelSelectorOpen, setModelSelectorOpen] = useState<boolean>(false);
  const [aiIntentModelSelectorOpen, setAiIntentModelSelectorOpen] = useState<boolean>(false);

  // 获取所有可用模型
  const allModels = useMemo(() => (
    providers
      .filter(provider => provider.isEnabled)
      .flatMap(provider =>
        provider.models
          .filter(model => model.enabled)
          .map(model => ({
            ...model,
            providerName: provider.name, // 添加提供商名称
            providerId: provider.id
          }))
      )
  ), [providers]);

  // 当前选中的话题命名模型
  const selectedModel = useMemo(() => {
    const identity = parseModelIdentityKey(topicNamingModelId || defaultModelId);
    if (!identity) {
      return null;
    }
    return allModels.find(model => modelMatchesIdentity(model, identity, (model as any).providerId)) || null;
  }, [allModels, topicNamingModelId, defaultModelId]);

  // 当前选中的 AI 意图分析模型
  const selectedAIIntentModel = useMemo(() => {
    const identity = parseModelIdentityKey(aiIntentAnalysisModelId || topicNamingModelId || defaultModelId);
    if (!identity) {
      return null;
    }
    return allModels.find(model => modelMatchesIdentity(model, identity, (model as any).providerId)) || null;
  }, [allModels, aiIntentAnalysisModelId, topicNamingModelId, defaultModelId]);

  // 处理返回按钮点击
  const handleBack = () => {
    navigate('/settings');
  };

  // 处理选择话题命名模型
  const handleTopicNamingModelChange = (model: any) => {
    const providerId = model.provider || model.providerId;
    const identityKey = getModelIdentityKey({ id: model.id, provider: providerId });
    // 更新到 Redux store
    dispatch(updateSettings({ topicNamingModelId: identityKey }));
    // 关闭选择器
    setModelSelectorOpen(false);
  };

  // 处理话题命名功能开关 - 统一字段名称
  const handleEnableTopicNamingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = event.target.checked;

    // 更新到 Redux store
    dispatch(updateSettings({ enableTopicNaming: isEnabled }));
  };

  // 处理"使用当前话题模型"开关
  const handleUseCurrentTopicModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({ topicNamingUseCurrentModel: event.target.checked }));
  };

  // 处理话题命名提示词变更
  const handleTopicNamingPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const prompt = event.target.value;

    // 更新到 Redux store
    dispatch(updateSettings({ topicNamingPrompt: prompt }));
  };

  // 打开模型选择器
  const handleOpenModelSelector = () => {
    setModelSelectorOpen(true);
  };

  // 关闭模型选择器
  const handleCloseModelSelector = () => {
    setModelSelectorOpen(false);
  };

  // 🚀 AI 意图分析相关处理函数
  const handleEnableAIIntentAnalysisChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({ enableAIIntentAnalysis: event.target.checked }));
  };

  const handleAIIntentUseCurrentModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({ aiIntentAnalysisUseCurrentModel: event.target.checked }));
  };

  const handleAIIntentModelChange = (model: any) => {
    const providerId = model.provider || model.providerId;
    const identityKey = getModelIdentityKey({ id: model.id, provider: providerId });
    dispatch(updateSettings({ aiIntentAnalysisModelId: identityKey }));
    setAiIntentModelSelectorOpen(false);
  };

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.02)
        : alpha(theme.palette.background.default, 0.9),
    }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {t('modelSettings.defaultModel.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('modelSettings.defaultModel.namingModel')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('modelSettings.defaultModel.namingModelDesc')}
            </Typography>
          </Box>

          <Divider />

          {/* 使用当前话题模型开关 */}
          <List disablePadding>
            <ListItem>
              <ListItemText 
                primary={t('modelSettings.defaultModel.useCurrentTopicModel', '使用当前话题模型')} 
                secondary={t('modelSettings.defaultModel.useCurrentTopicModelDesc', '使用当前对话所选择的模型进行命名')}
              />
              <CustomSwitch
                checked={topicNamingUseCurrentModel ?? true}
                onChange={handleUseCurrentTopicModelChange}
              />
            </ListItem>
          </List>

          <Divider />

          {/* 仅在关闭"使用当前话题模型"时显示模型选择器 */}
          {topicNamingUseCurrentModel === false && (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleOpenModelSelector} size="small">
                {t('modelSettings.defaultModel.selectModel')}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {selectedModel ? t('modelSettings.defaultModel.currentModel', { model: selectedModel.name }) : t('modelSettings.defaultModel.notSelected')}
              </Typography>
              <ModelSelector
                selectedModel={selectedModel}
                availableModels={allModels}
                handleModelSelect={handleTopicNamingModelChange}
                handleMenuClick={handleOpenModelSelector}
                handleMenuClose={handleCloseModelSelector}
                menuOpen={modelSelectorOpen}
              />
            </Box>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('modelSettings.defaultModel.autoNaming')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('modelSettings.defaultModel.autoNamingDesc')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            <ListItem>
              <ListItemText primary={t('modelSettings.defaultModel.autoNaming')} />
              <CustomSwitch
                checked={enableTopicNaming}
                onChange={handleEnableTopicNamingChange}
              />
            </ListItem>
          </List>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('modelSettings.defaultModel.namingPrompt')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('modelSettings.defaultModel.namingPromptDesc')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={topicNamingPrompt}
              onChange={handleTopicNamingPromptChange}
              placeholder={t('modelSettings.defaultModel.namingPromptPlaceholder')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            />
            {topicNamingPrompt && (
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => dispatch(updateSettings({ topicNamingPrompt: '' }))}
              >
                {t('modelSettings.defaultModel.resetToDefault')}
              </Button>
            )}
          </Box>
        </Paper>

        {/* 🚀 AI 意图分析设置 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('modelSettings.defaultModel.aiIntentAnalysis', 'AI 意图分析')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('modelSettings.defaultModel.aiIntentAnalysisDesc', '使用 AI 分析用户消息，判断是否需要进行网络搜索（仅在手动模式下生效）')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            <ListItem>
              <ListItemText 
                primary={t('modelSettings.defaultModel.enableAIIntentAnalysis', '启用 AI 意图分析')} 
                secondary={t('modelSettings.defaultModel.enableAIIntentAnalysisDesc', '关闭时使用规则匹配（快速），开启时使用 AI 分析（更准确）')}
              />
              <CustomSwitch
                checked={enableAIIntentAnalysis ?? false}
                onChange={handleEnableAIIntentAnalysisChange}
              />
            </ListItem>
          </List>

          {enableAIIntentAnalysis && (
            <>
              <Divider />
              <List disablePadding>
                <ListItem>
                  <ListItemText 
                    primary={t('modelSettings.defaultModel.aiIntentUseCurrentModel', '使用当前话题模型')} 
                    secondary={t('modelSettings.defaultModel.aiIntentUseCurrentModelDesc', '使用当前对话所选择的模型进行意图分析')}
                  />
                  <CustomSwitch
                    checked={aiIntentAnalysisUseCurrentModel ?? true}
                    onChange={handleAIIntentUseCurrentModelChange}
                  />
                </ListItem>
              </List>

              {aiIntentAnalysisUseCurrentModel === false && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button variant="outlined" onClick={() => setAiIntentModelSelectorOpen(true)} size="small">
                      {t('modelSettings.defaultModel.selectModel')}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAIIntentModel ? t('modelSettings.defaultModel.currentModel', { model: selectedAIIntentModel.name }) : t('modelSettings.defaultModel.notSelected')}
                    </Typography>
                    <ModelSelector
                      selectedModel={selectedAIIntentModel}
                      availableModels={allModels}
                      handleModelSelect={handleAIIntentModelChange}
                      handleMenuClick={() => setAiIntentModelSelectorOpen(true)}
                      handleMenuClose={() => setAiIntentModelSelectorOpen(false)}
                      menuOpen={aiIntentModelSelectorOpen}
                    />
                  </Box>
                </>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DefaultModelSettingsPage;