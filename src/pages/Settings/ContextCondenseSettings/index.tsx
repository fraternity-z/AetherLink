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
  Button,
  Slider
} from '@mui/material';
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import { updateContextCondenseSettings } from '../../../shared/store/settingsSlice';
import { getModelIdentityKey, modelMatchesIdentity, parseModelIdentityKey } from '../../../shared/utils/modelUtils';
import { ModelSelector } from '../../ChatPage/components/ModelSelector';
import { useTranslation } from 'react-i18next';
import useScrollPosition from '../../../hooks/useScrollPosition';
import CustomSwitch from '../../../components/CustomSwitch';
import { CustomIcon } from '../../../components/icons/CustomIcon';

const ContextCondenseSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-context-condense', {
    autoRestore: true,
    restoreDelay: 0
  });

  // 获取当前设置
  const contextCondense = useSelector((state: RootState) => state.settings.contextCondense);
  const defaultModelId = useSelector((state: RootState) => state.settings.defaultModelId);
  const providers = useSelector((state: RootState) => state.settings.providers);

  // 模型选择器对话框状态
  const [modelSelectorOpen, setModelSelectorOpen] = useState<boolean>(false);

  // 获取所有可用模型
  const allModels = useMemo(() => (
    providers
      .filter(provider => provider.isEnabled)
      .flatMap(provider =>
        provider.models
          .filter(model => model.enabled)
          .map(model => ({
            ...model,
            providerName: provider.name,
            providerId: provider.id
          }))
      )
  ), [providers]);

  // 当前选中的压缩模型
  const selectedModel = useMemo(() => {
    const modelId = contextCondense?.modelId || defaultModelId;
    const identity = parseModelIdentityKey(modelId);
    if (!identity) {
      return null;
    }
    return allModels.find(model => modelMatchesIdentity(model, identity, (model as any).providerId)) || null;
  }, [allModels, contextCondense?.modelId, defaultModelId]);

  // 处理返回按钮点击
  const handleBack = () => {
    navigate('/settings');
  };

  // 处理选择压缩模型
  const handleModelChange = (model: any) => {
    const providerId = model.provider || model.providerId;
    const identityKey = getModelIdentityKey({ id: model.id, provider: providerId });
    dispatch(updateContextCondenseSettings({ modelId: identityKey }));
    setModelSelectorOpen(false);
  };

  // 处理启用/禁用开关
  const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateContextCondenseSettings({ enabled: event.target.checked }));
  };

  // 处理"使用当前话题模型"开关
  const handleUseCurrentTopicModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateContextCondenseSettings({ useCurrentTopicModel: event.target.checked }));
  };

  // 处理阈值变更
  const handleThresholdChange = (_event: Event, value: number | number[]) => {
    dispatch(updateContextCondenseSettings({ threshold: value as number }));
  };

  // 处理自定义提示词变更
  const handleCustomPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(updateContextCondenseSettings({ customPrompt: event.target.value || undefined }));
  };

  // 打开模型选择器
  const handleOpenModelSelector = () => {
    setModelSelectorOpen(true);
  };

  // 关闭模型选择器
  const handleCloseModelSelector = () => {
    setModelSelectorOpen(false);
  };

  // 重置自定义提示词
  const handleResetPrompt = () => {
    dispatch(updateContextCondenseSettings({ customPrompt: undefined }));
  };

  // 使用默认模型
  const handleUseDefaultModel = () => {
    dispatch(updateContextCondenseSettings({ modelId: undefined }));
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
            {t('settings:contextCondense.title', '上下文压缩')}
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
        {/* 功能说明卡片 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'info.main',
            overflow: 'hidden',
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
          }}
        >
          <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Info size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('settings:contextCondense.whatIsThis', '什么是上下文压缩？')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settings:contextCondense.description', '当对话历史过长时，会占用大量的 Token，导致成本增加、响应变慢，甚至超出模型的上下文窗口限制。上下文压缩通过 AI 将冗长的对话历史智能地总结成精简摘要，同时保留关键信息。')}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 启用开关 */}
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CustomIcon name="foldVertical" size={18} />
              {t('settings:contextCondense.autoCondense', '自动压缩')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings:contextCondense.autoCondenseDesc', '当上下文占用达到设定阈值时自动进行压缩')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            <ListItem>
              <ListItemText primary={t('settings:contextCondense.enableAutoCondense', '启用自动压缩')} />
              <CustomSwitch
                checked={contextCondense?.enabled ?? false}
                onChange={handleEnabledChange}
              />
            </ListItem>
          </List>
        </Paper>

        {/* 阈值设置 */}
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
              {t('settings:contextCondense.threshold', '触发阈值')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings:contextCondense.thresholdDesc', '当上下文窗口占用达到此百分比时触发自动压缩')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('settings:contextCondense.currentThreshold', '当前阈值')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {contextCondense?.threshold ?? 80}%
              </Typography>
            </Box>
            <Slider
              value={contextCondense?.threshold ?? 80}
              onChange={handleThresholdChange}
              min={5}
              max={100}
              step={5}
              marks={[
                { value: 5, label: '5%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('settings:contextCondense.thresholdHint', '建议设置在 70%-90% 之间，过低会频繁触发压缩，过高可能导致超出限制')}
            </Typography>
          </Box>
        </Paper>

        {/* 压缩模型选择 */}
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
              {t('settings:contextCondense.condenseModel', '压缩模型')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings:contextCondense.condenseModelDesc', '选择用于压缩对话的模型（可使用更便宜的模型来节省成本）')}
            </Typography>
          </Box>

          <Divider />

          {/* 使用当前话题模型开关 */}
          <List disablePadding>
            <ListItem>
              <ListItemText 
                primary={t('settings:contextCondense.useCurrentTopicModel', '使用当前话题模型')} 
                secondary={t('settings:contextCondense.useCurrentTopicModelDesc', '使用当前对话所选择的模型进行压缩')}
              />
              <CustomSwitch
                checked={contextCondense?.useCurrentTopicModel ?? true}
                onChange={handleUseCurrentTopicModelChange}
              />
            </ListItem>
          </List>

          <Divider />

          {/* 仅在关闭"使用当前话题模型"时显示模型选择器 */}
          {contextCondense?.useCurrentTopicModel === false && (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleOpenModelSelector} size="small">
                {t('settings:contextCondense.selectModel', '选择模型')}
              </Button>
              {contextCondense?.modelId && (
                <Button variant="text" onClick={handleUseDefaultModel} size="small" color="secondary">
                  {t('settings:contextCondense.useDefaultModel', '使用默认模型')}
                </Button>
              )}
              <Typography variant="body2" color="text.secondary">
                {selectedModel
                  ? `${t('settings:contextCondense.currentModelPrefix', '当前')}: ${selectedModel.name}`
                  : t('settings:contextCondense.usingDefaultModel', '使用默认模型')}
              </Typography>
              <ModelSelector
                selectedModel={selectedModel}
                availableModels={allModels}
                handleModelSelect={handleModelChange}
                handleMenuClick={handleOpenModelSelector}
                handleMenuClose={handleCloseModelSelector}
                menuOpen={modelSelectorOpen}
              />
            </Box>
          )}
        </Paper>

        {/* 自定义提示词 */}
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
              {t('settings:contextCondense.customPrompt', '自定义提示词')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings:contextCondense.customPromptDesc', '自定义压缩时使用的系统提示词（留空使用内置提示词）')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={contextCondense?.customPrompt ?? ''}
              onChange={handleCustomPromptChange}
              placeholder={t('settings:contextCondense.customPromptPlaceholder', '请输入自定义提示词...\n\n内置提示词会生成包含以下内容的摘要：\n- 之前的对话概述\n- 当前工作详情\n- 关键技术概念\n- 相关文件和代码\n- 问题解决进展\n- 待完成任务')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            />
            {contextCondense?.customPrompt && (
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={handleResetPrompt}
              >
                {t('settings:contextCondense.resetToDefault', '恢复默认')}
              </Button>
            )}
          </Box>
        </Paper>

        {/* 压缩效果说明 */}
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
              {t('settings:contextCondense.howItWorks', '工作原理')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" component="div">
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>{t('settings:contextCondense.step1', '保留首条消息 - 通常包含任务初始指令')}</li>
                <li>{t('settings:contextCondense.step2', '保留最后3条消息 - 保持最新上下文的完整性')}</li>
                <li>{t('settings:contextCondense.step3', '压缩中间消息 - 使用 AI 生成结构化摘要')}</li>
                <li>{t('settings:contextCondense.step4', '重组消息 - [首条消息, 摘要, 最后3条消息]')}</li>
              </ol>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ContextCondenseSettingsPage;