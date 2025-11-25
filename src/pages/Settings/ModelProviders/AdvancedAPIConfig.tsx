import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  Paper,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../shared/store';
import { updateProvider } from '../../../shared/store/settingsSlice';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { SafeAreaContainer } from "../../../components/settings/SettingComponents";

const AdvancedAPIConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const provider = useAppSelector(state =>
    state.settings.providers.find(p => p.id === providerId)
  );

  const [currentTab, setCurrentTab] = useState(0);
  const [extraHeaders, setExtraHeaders] = useState<Record<string, string>>({});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [extraBody, setExtraBody] = useState<Record<string, any>>({});
  const [newBodyKey, setNewBodyKey] = useState('');
  const [newBodyValue, setNewBodyValue] = useState('');

  // 初始化状态
  useEffect(() => {
    if (provider) {
      setExtraHeaders(provider.extraHeaders || {});
      setExtraBody(provider.extraBody || {});
    }
  }, [provider]);

  // 返回按钮
  const handleBack = () => {
    navigate(`/settings/model-provider/${providerId}`);
  };

  // 保存配置
  const handleSave = () => {
    if (provider) {
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          extraHeaders,
          extraBody
        }
      }));
      navigate(`/settings/model-provider/${providerId}`);
    }
  };

  // Headers 操作
  const handleAddHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      setExtraHeaders({
        ...extraHeaders,
        [newHeaderKey.trim()]: newHeaderValue.trim()
      });
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...extraHeaders };
    delete newHeaders[key];
    setExtraHeaders(newHeaders);
  };

  const handleUpdateHeader = (oldKey: string, newKey: string, newValue: string) => {
    const newHeaders = { ...extraHeaders };
    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }
    newHeaders[newKey] = newValue;
    setExtraHeaders(newHeaders);
  };

  // Body 操作
  const parseBodyValue = (value: string): any => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    
    try {
      return JSON.parse(trimmed);
    } catch {
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (trimmed === 'null') return null;
      if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
      if (/^-?\d*\.\d+$/.test(trimmed)) return parseFloat(trimmed);
      return trimmed;
    }
  };

  const formatBodyValue = (value: any): string => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  };

  const handleAddBody = () => {
    if (newBodyKey.trim() && newBodyValue.trim()) {
      setExtraBody({
        ...extraBody,
        [newBodyKey.trim()]: parseBodyValue(newBodyValue)
      });
      setNewBodyKey('');
      setNewBodyValue('');
    }
  };

  const handleRemoveBody = (key: string) => {
    const newBody = { ...extraBody };
    delete newBody[key];
    setExtraBody(newBody);
  };

  const handleUpdateBody = (oldKey: string, newKey: string, newValue: any) => {
    const newBody = { ...extraBody };
    if (oldKey !== newKey) {
      delete newBody[oldKey];
    }
    newBody[newKey] = newValue;
    setExtraBody(newBody);
  };

  const headersEntries = Object.entries(extraHeaders);
  const hasHeaders = headersEntries.length > 0;
  
  const bodyEntries = Object.entries(extraBody);
  const hasBody = bodyEntries.length > 0;

  if (!provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t('modelSettings.provider.notFound')}</Typography>
        <Button onClick={handleBack}>{t('common.back')}</Button>
      </Box>
    );
  }

  return (
    <SafeAreaContainer>
      {/* 顶部导航栏 */}
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
            {t('modelSettings.dialogs.advancedConfig.title')}
          </Typography>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            {t('common.save')}
          </Button>
        </Toolbar>
      </AppBar>

      {/* 标签页 */}
      <Box>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            px: 3,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tab label={t('modelSettings.dialogs.advancedConfig.headersTab')} />
          <Tab label={t('modelSettings.dialogs.advancedConfig.bodyTab')} />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
          pb: 'var(--content-bottom-padding)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* Headers Tab */}
        {currentTab === 0 && (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              {t('modelSettings.dialogs.headers.description')}
            </Typography>

            {/* 快捷操作 */}
            <Paper
              variant="outlined"
              sx={(theme) => ({
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.action.hover,
              })}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                {t('modelSettings.dialogs.headers.quickActions')}
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ flexWrap: 'wrap' }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setExtraHeaders({
                      ...extraHeaders,
                      'x-stainless-timeout': 'REMOVE'
                    });
                  }}
                  sx={{ borderRadius: 999 }}
                >
                  {t('modelSettings.dialogs.headers.disableTimeout')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setExtraHeaders({
                      ...extraHeaders,
                      'x-stainless-retry-count': 'REMOVE'
                    });
                  }}
                  sx={{ borderRadius: 999 }}
                >
                  {t('modelSettings.dialogs.headers.disableRetry')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setExtraHeaders({
                      ...extraHeaders,
                      'x-stainless-timeout': 'REMOVE',
                      'x-stainless-retry-count': 'REMOVE',
                      'x-stainless-arch': 'REMOVE',
                      'x-stainless-lang': 'REMOVE',
                      'x-stainless-os': 'REMOVE',
                      'x-stainless-package-version': 'REMOVE',
                      'x-stainless-runtime': 'REMOVE',
                      'x-stainless-runtime-version': 'REMOVE'
                    });
                  }}
                  sx={{ borderRadius: 999 }}
                >
                  {t('modelSettings.dialogs.headers.disableAll')}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('modelSettings.dialogs.headers.removeHint')}
              </Typography>
            </Paper>

            {/* Headers 列表 */}
            <Stack spacing={2}>
              {hasHeaders ? (
                headersEntries.map(([key, value]) => (
                  <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 1.5 },
                        alignItems: { sm: 'center' }
                      }}
                    >
                      <TextField
                        size="small"
                        label={t('modelSettings.dialogs.headers.headerName')}
                        value={key}
                        onChange={(e) => handleUpdateHeader(key, e.target.value, value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label={t('modelSettings.dialogs.headers.headerValue')}
                        value={value}
                        onChange={(e) => handleUpdateHeader(key, key, e.target.value)}
                        sx={(theme) => ({
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor:
                              value === 'REMOVE'
                                ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.2 : 0.08)
                                : theme.palette.background.paper,
                          },
                          '& .MuiOutlinedInput-input': {
                            color: value === 'REMOVE' ? theme.palette.error.main : theme.palette.text.primary
                          }
                        })}
                        helperText={value === 'REMOVE' ? t('modelSettings.dialogs.headers.willBeDisabled') : ''}
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveHeader(key)}
                        sx={{
                          alignSelf: { xs: 'flex-end', sm: 'center' }
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('modelSettings.provider.headersConfigured', { count: 0 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('modelSettings.dialogs.headers.removeHint')}
                  </Typography>
                </Paper>
              )}
            </Stack>

            {/* 添加新 Header */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: { sm: 'center' } }}
              >
                <TextField
                  size="small"
                  label={t('modelSettings.dialogs.headers.newHeaderName')}
                  placeholder={t('modelSettings.dialogs.headers.newHeaderNamePlaceholder')}
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t('modelSettings.dialogs.headers.newHeaderValue')}
                  placeholder={t('modelSettings.dialogs.headers.newHeaderValuePlaceholder')}
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  startIcon={<Plus size={16} />}
                  onClick={handleAddHeader}
                  disabled={!newHeaderKey.trim() || !newHeaderValue.trim()}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {t('common.submit')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* Body Tab */}
        {currentTab === 1 && (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              {t('modelSettings.dialogs.body.description')}
            </Typography>

            {/* Body 列表 */}
            <Stack spacing={2}>
              {hasBody ? (
                bodyEntries.map(([key, value]) => (
                  <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 1.5 },
                        alignItems: { sm: 'flex-start' }
                      }}
                    >
                      <TextField
                        size="small"
                        label={t('modelSettings.dialogs.body.parameterName')}
                        value={key}
                        onChange={(e) => handleUpdateBody(key, e.target.value, value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label={t('modelSettings.dialogs.body.parameterValue')}
                        value={formatBodyValue(value)}
                        onChange={(e) => {
                          const parsedValue = parseBodyValue(e.target.value);
                          handleUpdateBody(key, key, parsedValue);
                        }}
                        multiline
                        rows={1}
                        sx={{
                          flex: 1,
                          '& .MuiInputBase-input': {
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }
                        }}
                        helperText={t('modelSettings.dialogs.body.valueHint')}
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveBody(key)}
                        sx={{
                          alignSelf: { xs: 'flex-end', sm: 'flex-start' },
                          mt: { sm: 0.5 }
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('modelSettings.provider.bodyConfigured', { count: 0 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('modelSettings.dialogs.body.emptyHint')}
                  </Typography>
                </Paper>
              )}
            </Stack>

            {/* 添加新 Body 参数 */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: { sm: 'flex-start' } }}
              >
                <TextField
                  size="small"
                  label={t('modelSettings.dialogs.body.newParameterName')}
                  placeholder={t('modelSettings.dialogs.body.newParameterNamePlaceholder')}
                  value={newBodyKey}
                  onChange={(e) => setNewBodyKey(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label={t('modelSettings.dialogs.body.newParameterValue')}
                  placeholder={t('modelSettings.dialogs.body.newParameterValuePlaceholder')}
                  value={newBodyValue}
                  onChange={(e) => setNewBodyValue(e.target.value)}
                  multiline
                  rows={1}
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }
                  }}
                  helperText={t('modelSettings.dialogs.body.valueHint')}
                />
                <Button
                  startIcon={<Plus size={16} />}
                  onClick={handleAddBody}
                  disabled={!newBodyKey.trim() || !newBodyValue.trim()}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    width: { xs: '100%', sm: 'auto' },
                    alignSelf: { xs: 'stretch', sm: 'flex-start' },
                    mt: { sm: 0.5 }
                  }}
                >
                  {t('common.submit')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Box>
    </SafeAreaContainer>
  );
};

export default AdvancedAPIConfigPage;




