import React, { useState } from 'react';
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
  Switch,
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
import DialogModelSelector from '../../../pages/ChatPage/components/DialogModelSelector';
import DropdownModelSelector from '../../../pages/ChatPage/components/DropdownModelSelector';
import { useTranslation } from 'react-i18next';

const DefaultModelSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 获取当前设置
  const defaultModelId = useSelector((state: RootState) => state.settings.defaultModelId);
  const topicNamingModelId = useSelector((state: RootState) => state.settings.topicNamingModelId);
  const providers = useSelector((state: RootState) => state.settings.providers);

  const modelSelectorStyle = useSelector((state: RootState) => state.settings.modelSelectorStyle || 'dialog');

  // 话题命名功能的状态 - 统一字段名称
  const enableTopicNaming = useSelector((state: RootState) => state.settings.enableTopicNaming);
  const topicNamingPrompt = useSelector((state: RootState) => state.settings.topicNamingPrompt);

  // 模型选择器对话框状态
  const [modelSelectorOpen, setModelSelectorOpen] = useState<boolean>(false);

  // 获取所有可用模型
  const allModels = providers.flatMap(provider =>
    provider.models.filter(model => model.enabled).map(model => ({
      ...model,
      providerName: provider.name // 添加提供商名称
    }))
  );

  // 当前选中的模型
  const selectedModel = allModels.find(model => model.id === (topicNamingModelId || defaultModelId)) || null;

  // 处理返回按钮点击
  const handleBack = () => {
    navigate('/settings');
  };

  // 处理选择话题命名模型
  const handleTopicNamingModelChange = (model: any) => {
    // 更新到 Redux store
    dispatch(updateSettings({ topicNamingModelId: model.id }));
    // 关闭选择器
    setModelSelectorOpen(false);
  };

  // 处理话题命名功能开关 - 统一字段名称
  const handleEnableTopicNamingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = event.target.checked;

    // 更新到 Redux store
    dispatch(updateSettings({ enableTopicNaming: isEnabled }));
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
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
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
              backgroundImage: 'linear-gradient(90deg, #4f46e5, #8b5cf6)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {t('settings.topicNaming.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mt: 8,
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
              {t('settings.topicNaming.modelSection.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.topicNaming.modelSection.subtitle')}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            {modelSelectorStyle === 'dropdown' ? (
              // 下拉式选择器
              <DropdownModelSelector
                selectedModel={selectedModel}
                availableModels={allModels}
                handleModelSelect={handleTopicNamingModelChange}
              />
            ) : (
              // 弹窗式选择器
              <DialogModelSelector
                selectedModel={selectedModel}
                availableModels={allModels}
                handleModelSelect={handleTopicNamingModelChange}
                handleMenuClick={handleOpenModelSelector}
                handleMenuClose={handleCloseModelSelector}
                menuOpen={modelSelectorOpen}
              />
            )}
          </Box>
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
              {t('settings.topicNaming.enableSwitch.primary')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.topicNaming.enableSwitch.secondary')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            <ListItem>
              <ListItemText
                primary={t('settings.topicNaming.enableSwitch.primary')}
                secondary={t('settings.topicNaming.enableSwitch.secondary')}
              />
              <Switch
                edge="end"
                checked={enableTopicNaming}
                onChange={handleEnableTopicNamingChange}
                inputProps={{ 'aria-labelledby': 'enable-topic-naming-switch' }}
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
              {t('settings.topicNaming.promptSection.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.topicNaming.promptSection.subtitle')}
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
              placeholder={t('settings.topicNaming.promptSection.placeholder')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            />
            {topicNamingPrompt && (
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => dispatch(updateSettings({ topicNamingPrompt: '' }))}
              >
                {t('settings.topicNaming.saveButton')}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DefaultModelSettingsPage;