import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  FormControl,
  FormControlLabel,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  InputLabel,
  OutlinedInput,
  Slider,
  FormGroup,
  alpha,
  Divider,
  Tooltip,
  Alert,
  Paper
} from '@mui/material';
import CustomSwitch from '../../components/CustomSwitch';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft as ArrowBackIcon, Plus as AddIcon, Trash2 as DeleteIcon, Edit as EditIcon, Globe as LanguageIcon, Info as InfoOutlinedIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { WebSearchProvider, WebSearchCustomProvider } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../../i18n';
import {
  toggleWebSearchEnabled,
  setWebSearchProvider,
  setWebSearchApiKey,
  setWebSearchMaxResults,
  toggleIncludeInContext,
  toggleShowTimestamp,
  toggleFilterSafeSearch,
  setSearchMode,
  addCustomProvider,
  updateCustomProvider,
  deleteCustomProvider,
  toggleCustomProviderEnabled,
  toggleSearchWithTime,
  setExcludeDomains,

  // 🚀 新增：Tavily最佳实践相关actions
  setSearchDepth,
  setChunksPerSource,
  toggleIncludeRawContent,
  toggleIncludeAnswer,
  setMinScore,
  toggleQueryValidation,
  togglePostProcessing,
  toggleSmartSearch,
  setTimeRange,
  setNewsSearchDays,

  // 🚀 新增：搜索引擎选择相关actions
  setSelectedSearchEngine
} from '../../shared/store/slices/webSearchSlice';
import type { RootState } from '../../shared/store';

const WebSearchSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // 从Redux获取设置
  const webSearchSettings = useSelector((state: RootState) => state.webSearch) || {
    enabled: false,
    provider: 'firecrawl' as WebSearchProvider,
    apiKey: '',
    includeInContext: true,
    maxResults: 5,
    showTimestamp: true,
    filterSafeSearch: true,
    searchMode: 'auto' as 'auto' | 'manual',
    searchWithTime: false,
    excludeDomains: [],
    providers: [],
    customProviders: []
  };

  const [editingProvider, setEditingProvider] = useState<WebSearchCustomProvider | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // 初始化设置 - 这里不需要设置本地状态，因为我们直接使用Redux的状态
  }, [webSearchSettings]);

  const handleBack = () => {
    navigate('/settings');
  };

  const handleToggleEnabled = () => {
    dispatch(toggleWebSearchEnabled());
  };

  const handleProviderChange = (event: SelectChangeEvent) => {
    dispatch(setWebSearchProvider(event.target.value as WebSearchProvider));
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setWebSearchApiKey(event.target.value));
  };

  const handleMaxResultsChange = (_: Event, newValue: number | number[]) => {
    dispatch(setWebSearchMaxResults(newValue as number));
  };

  const handleToggleIncludeInContext = () => {
    dispatch(toggleIncludeInContext());
  };

  const handleToggleShowTimestamp = () => {
    dispatch(toggleShowTimestamp());
  };

  const handleToggleFilterSafeSearch = () => {
    dispatch(toggleFilterSafeSearch());
  };

  const handleSearchModeChange = (event: SelectChangeEvent) => {
    dispatch(setSearchMode(event.target.value as 'auto' | 'manual'));
  };

  const handleAddCustomProvider = () => {
    const newProvider: WebSearchCustomProvider = {
      id: uuidv4(),
      name: t('settings.webSearch.basic.customProviders.newName'),
      apiKey: '',
      baseUrl: '',
      enabled: true
    };

    setEditingProvider(newProvider);
    setIsEditing(true);
  };

  const handleEditProvider = (provider: WebSearchCustomProvider) => {
    setEditingProvider({...provider});
    setIsEditing(true);
  };

  const handleDeleteProvider = (id: string) => {
    dispatch(deleteCustomProvider(id));
  };

  const handleSaveProvider = () => {
    if (!editingProvider) return;

    if (editingProvider.id && webSearchSettings.customProviders?.some(p => p.id === editingProvider.id)) {
      dispatch(updateCustomProvider(editingProvider));
    } else {
      dispatch(addCustomProvider(editingProvider));
    }

    setEditingProvider(null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
    setIsEditing(false);
  };

  const handleProviderFieldChange = (field: keyof WebSearchCustomProvider, value: string | boolean) => {
    if (!editingProvider) return;

    setEditingProvider(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  // 🚀 新增：Tavily最佳实践相关处理函数
  const handleSearchDepthChange = (event: SelectChangeEvent) => {
    dispatch(setSearchDepth(event.target.value as 'basic' | 'advanced'));
  };

  const handleChunksPerSourceChange = (_: Event, newValue: number | number[]) => {
    dispatch(setChunksPerSource(newValue as number));
  };

  const handleMinScoreChange = (_: Event, newValue: number | number[]) => {
    dispatch(setMinScore((newValue as number) / 100)); // 转换为0-1范围
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    dispatch(setTimeRange(event.target.value as 'day' | 'week' | 'month' | 'year'));
  };

  const handleNewsSearchDaysChange = (_: Event, newValue: number | number[]) => {
    dispatch(setNewsSearchDays(newValue as number));
  };

  // 🚀 新增：搜索引擎选择处理函数
  const handleSearchEngineChange = (event: SelectChangeEvent) => {
    dispatch(setSelectedSearchEngine(event.target.value as any));
  };

  // 渲染主要内容
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
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowBackIcon size={24} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: (theme) => theme.palette.text.primary,
            }}
          >
            <LanguageIcon size={24} color="#3b82f6" style={{ marginRight: 8 }} /> {t('settings.webSearch.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          px: 2,
          py: 2,
          mt: 8,
          mb: 2,
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
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: (theme) => theme.palette.text.primary,
              mb: 2,
            }}
          >
            {t('settings.webSearch.basic.title')}
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={webSearchSettings.enabled}
                  onChange={handleToggleEnabled}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>{t('settings.webSearch.basic.enable.label')}</Typography>
                  <Tooltip title={t('settings.webSearch.basic.enable.tooltip')}>
                    <InfoOutlinedIcon size={16} color="var(--mui-palette-text-secondary)" />
                  </Tooltip>
                </Box>
              }
            />
          </FormGroup>

          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth margin="normal">
            <InputLabel id="search-provider-label">{t('settings.webSearch.basic.provider.label')}</InputLabel>
            <Select
              labelId="search-provider-label"
              value={webSearchSettings.provider}
              onChange={handleProviderChange}
              input={<OutlinedInput label={t('settings.webSearch.basic.provider.label')} />}
              disabled={!webSearchSettings.enabled}
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="bing-free">{t('settings.webSearch.basic.provider.options.bingFree')}</MenuItem>
              <MenuItem value="tavily">{t('settings.webSearch.basic.provider.options.tavily')}</MenuItem>
              <MenuItem value="exa">{t('settings.webSearch.basic.provider.options.exa')}</MenuItem>
              <MenuItem value="bocha">{t('settings.webSearch.basic.provider.options.bocha')}</MenuItem>
              <MenuItem value="firecrawl">{t('settings.webSearch.basic.provider.options.firecrawl')}</MenuItem>
              <MenuItem value="custom">{t('settings.webSearch.basic.provider.options.custom')}</MenuItem>
            </Select>
          </FormControl>

          {webSearchSettings.provider !== 'custom' && (
            <>
              {/* 🚀 新增：搜索引擎选择器（仅在bing-free时显示） */}
              {webSearchSettings.provider === 'bing-free' && (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="search-engine-label">{t('settings.webSearch.basic.searchEngine.label')}</InputLabel>
                  <Select
                    labelId="search-engine-label"
                    value={webSearchSettings.selectedSearchEngine || 'bing'}
                    onChange={handleSearchEngineChange}
                    input={<OutlinedInput label={t('settings.webSearch.basic.searchEngine.label')} />}
                    disabled={!webSearchSettings.enabled}
                    MenuProps={{
                      disableAutoFocus: true,
                      disableRestoreFocus: true
                    }}
                  >
                    <MenuItem value="bing">{t('settings.webSearch.basic.searchEngine.options.bing')}</MenuItem>
                    <MenuItem value="google">{t('settings.webSearch.basic.searchEngine.options.google')}</MenuItem>
                    <MenuItem value="baidu">{t('settings.webSearch.basic.searchEngine.options.baidu')}</MenuItem>
                    <MenuItem value="sogou">{t('settings.webSearch.basic.searchEngine.options.sogou')}</MenuItem>
                    <MenuItem value="yandex">{t('settings.webSearch.basic.searchEngine.options.yandex')}</MenuItem>
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                margin="normal"
                label={t('settings.webSearch.basic.apiKey.label')}
                type="password"
                value={
                  // 🚀 优先使用当前提供商的独立API密钥，如果没有则使用通用密钥
                  (webSearchSettings.apiKeys && webSearchSettings.apiKeys[webSearchSettings.provider]) ||
                  webSearchSettings.apiKey ||
                  ''
                }
                onChange={handleApiKeyChange}
                disabled={!webSearchSettings.enabled}
                variant="outlined"
                placeholder={t('settings.webSearch.basic.apiKey.placeholder', { provider: webSearchSettings.provider })}
              />

              {/* 🚀 调试信息：显示当前存储的API密钥状态 */}
              {process.env.NODE_ENV === 'development' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('settings.webSearch.basic.debug.currentProvider', {
                    provider: webSearchSettings.provider,
                    status: webSearchSettings.apiKeys && webSearchSettings.apiKeys[webSearchSettings.provider]
                      ? t('settings.webSearch.basic.debug.set')
                      : t('settings.webSearch.basic.debug.notSet')
                  })}
                  {webSearchSettings.apiKeys && Object.keys(webSearchSettings.apiKeys).length > 0 && (
                    <span>{t('settings.webSearch.basic.debug.savedProviders', {
                      providers: Object.keys(webSearchSettings.apiKeys).join(', ')
                    })}</span>
                  )}
                </Typography>
              )}

              {webSearchSettings.provider === 'tavily' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('settings.webSearch.basic.alerts.tavily.text')}{' '}
                  <a href="https://app.tavily.com" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                    {t('settings.webSearch.basic.alerts.tavily.link')}
                  </a>{' '}
                  {t('settings.webSearch.basic.alerts.tavily.linkText')}
                </Alert>
              )}

              {webSearchSettings.provider === 'exa' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('settings.webSearch.basic.alerts.exa.text')}{' '}
                  <a href="https://exa.ai" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                    {t('settings.webSearch.basic.alerts.exa.link')}
                  </a>{' '}
                  {t('settings.webSearch.basic.alerts.exa.linkText')}
                </Alert>
              )}

              {webSearchSettings.provider === 'bocha' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('settings.webSearch.basic.alerts.bocha.text')}{' '}
                  <a href="https://bochaai.com" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                    {t('settings.webSearch.basic.alerts.bocha.link')}
                  </a>{' '}
                  {t('settings.webSearch.basic.alerts.bocha.linkText')}
                </Alert>
              )}

              {webSearchSettings.provider === 'bing-free' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('settings.webSearch.basic.alerts.bingFree.text')}
                </Alert>
              )}

              {webSearchSettings.provider === 'firecrawl' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('settings.webSearch.basic.alerts.firecrawl.text')}{' '}
                  <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }}>
                    {t('settings.webSearch.basic.alerts.firecrawl.link')}
                  </a>{' '}
                  {t('settings.webSearch.basic.alerts.firecrawl.linkText')}
                </Alert>
              )}
            </>
          )}



          {webSearchSettings.provider === 'custom' && webSearchSettings.customProviders && webSearchSettings.customProviders.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('settings.webSearch.basic.customProviders.title')}
              </Typography>

              {webSearchSettings.customProviders.map((provider) => (
                <Card
                  key={provider.id}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    borderColor: provider.enabled ? alpha('#3b82f6', 0.5) : 'divider'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">{provider.name}</Typography>
                      <FormControlLabel
                        control={
                          <CustomSwitch
                            checked={provider.enabled}
                            onChange={() => dispatch(toggleCustomProviderEnabled(provider.id))}
                          />
                        }
                        label={t('settings.webSearch.basic.customProviders.enable')}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('settings.webSearch.basic.customProviders.apiUrl', { url: provider.baseUrl })}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon size={16} />}
                      onClick={() => handleEditProvider(provider)}
                    >
                      {t('settings.webSearch.basic.customProviders.edit')}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon size={16} />}
                      color="error"
                      onClick={() => handleDeleteProvider(provider.id)}
                    >
                      {t('settings.webSearch.basic.customProviders.delete')}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}

          {webSearchSettings.provider === 'custom' && (
            <Button
              startIcon={<AddIcon size={16} />}
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={handleAddCustomProvider}
              disabled={!webSearchSettings.enabled}
            >
              {t('settings.webSearch.basic.customProviders.add')}
            </Button>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: (theme) => theme.palette.text.primary,
              mb: 2,
            }}
          >
            {t('settings.webSearch.searchOptions.title')}
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="search-mode-label">{t('settings.webSearch.searchOptions.searchMode.label')}</InputLabel>
            <Select
              labelId="search-mode-label"
              value={webSearchSettings.searchMode}
              onChange={handleSearchModeChange}
              input={<OutlinedInput label={t('settings.webSearch.searchOptions.searchMode.label')} />}
              disabled={!webSearchSettings.enabled}
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="auto">{t('settings.webSearch.searchOptions.searchMode.auto')}</MenuItem>
              <MenuItem value="manual">{t('settings.webSearch.searchOptions.searchMode.manual')}</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography id="max-results-slider" gutterBottom>
              {t('settings.webSearch.searchOptions.maxResults.label', { count: webSearchSettings.maxResults })}
            </Typography>
            <Slider
              aria-labelledby="max-results-slider"
              value={webSearchSettings.maxResults}
              onChange={handleMaxResultsChange}
              min={1}
              max={20}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 20, label: '20' },
              ]}
              disabled={!webSearchSettings.enabled}
            />
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={webSearchSettings.includeInContext}
                  onChange={handleToggleIncludeInContext}
                  disabled={!webSearchSettings.enabled}
                />
              }
              label={t('settings.webSearch.searchOptions.includeInContext.label')}
            />

            <FormControlLabel
              control={
                <CustomSwitch
                  checked={webSearchSettings.showTimestamp}
                  onChange={handleToggleShowTimestamp}
                  disabled={!webSearchSettings.enabled}
                />
              }
              label={t('settings.webSearch.searchOptions.showTimestamp.label')}
            />

            <FormControlLabel
              control={
                <CustomSwitch
                  checked={webSearchSettings.filterSafeSearch}
                  onChange={handleToggleFilterSafeSearch}
                  disabled={!webSearchSettings.enabled}
                />
              }
              label={t('settings.webSearch.searchOptions.filterSafeSearch.label')}
            />

            <FormControlLabel
              control={
                <CustomSwitch
                  checked={webSearchSettings.searchWithTime}
                  onChange={() => dispatch(toggleSearchWithTime())}
                  disabled={!webSearchSettings.enabled}
                />
              }
              label={t('settings.webSearch.searchOptions.searchWithTime.label')}
            />
          </FormGroup>
        </Paper>

        {/* 🚀 Tavily最佳实践设置 */}
        {webSearchSettings.provider === 'tavily' && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: (theme) => theme.palette.text.primary,
                mb: 2,
              }}
            >
              {t('settings.webSearch.tavily.title')}
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              {t('settings.webSearch.tavily.description')}
            </Alert>

            {/* 智能搜索开关 */}
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={webSearchSettings.enableSmartSearch || false}
                  onChange={() => dispatch(toggleSmartSearch())}
                  disabled={!webSearchSettings.enabled}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1 }}>{t('settings.webSearch.tavily.smartSearch.label')}</Typography>
                  <Tooltip title={t('settings.webSearch.tavily.smartSearch.tooltip')}>
                    <InfoOutlinedIcon size={16} color="var(--mui-palette-text-secondary)" />
                  </Tooltip>
                </Box>
              }
              sx={{ mb: 3 }}
            />

            {/* 搜索深度 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="search-depth-label">{t('settings.webSearch.tavily.searchDepth.label')}</InputLabel>
              <Select
                labelId="search-depth-label"
                value={webSearchSettings.searchDepth || 'basic'}
                onChange={handleSearchDepthChange}
                input={<OutlinedInput label={t('settings.webSearch.tavily.searchDepth.label')} />}
                disabled={!webSearchSettings.enabled || webSearchSettings.enableSmartSearch}
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
              >
                <MenuItem value="basic">{t('settings.webSearch.tavily.searchDepth.basic')}</MenuItem>
                <MenuItem value="advanced">{t('settings.webSearch.tavily.searchDepth.advanced')}</MenuItem>
              </Select>
            </FormControl>

            {/* 每个来源的内容块数量 */}
            <Box sx={{ mb: 3 }}>
              <Typography id="chunks-per-source-slider" gutterBottom>
                {t('settings.webSearch.tavily.chunksPerSource.label', { count: webSearchSettings.chunksPerSource || 3 })}
              </Typography>
              <Slider
                aria-labelledby="chunks-per-source-slider"
                value={webSearchSettings.chunksPerSource || 3}
                onChange={handleChunksPerSourceChange}
                min={1}
                max={5}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                ]}
                disabled={!webSearchSettings.enabled || webSearchSettings.enableSmartSearch}
              />
            </Box>

            {/* 最小相关性分数 */}
            <Box sx={{ mb: 3 }}>
              <Typography id="min-score-slider" gutterBottom>
                {t('settings.webSearch.tavily.minScore.label', { score: Math.round((webSearchSettings.minScore || 0.3) * 100) })}
              </Typography>
              <Slider
                aria-labelledby="min-score-slider"
                value={Math.round((webSearchSettings.minScore || 0.3) * 100)}
                onChange={handleMinScoreChange}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 30, label: '30%' },
                  { value: 70, label: '70%' },
                  { value: 100, label: '100%' },
                ]}
                disabled={!webSearchSettings.enabled || webSearchSettings.enableSmartSearch}
              />
              <Typography variant="body2" color="text.secondary">
                {t('settings.webSearch.tavily.minScore.description')}
              </Typography>
            </Box>

            {/* 时间范围过滤 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="time-range-label">{t('settings.webSearch.tavily.timeRange.label')}</InputLabel>
              <Select
                labelId="time-range-label"
                value={webSearchSettings.timeRange || 'week'}
                onChange={handleTimeRangeChange}
                input={<OutlinedInput label={t('settings.webSearch.tavily.timeRange.label')} />}
                disabled={!webSearchSettings.enabled}
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
              >
                <MenuItem value="day">{t('settings.webSearch.tavily.timeRange.day')}</MenuItem>
                <MenuItem value="week">{t('settings.webSearch.tavily.timeRange.week')}</MenuItem>
                <MenuItem value="month">{t('settings.webSearch.tavily.timeRange.month')}</MenuItem>
                <MenuItem value="year">{t('settings.webSearch.tavily.timeRange.year')}</MenuItem>
              </Select>
            </FormControl>

            {/* 新闻搜索天数 */}
            <Box sx={{ mb: 3 }}>
              <Typography id="news-search-days-slider" gutterBottom>
                {t('settings.webSearch.tavily.newsSearchDays.label', { days: webSearchSettings.newsSearchDays || 7 })}
              </Typography>
              <Slider
                aria-labelledby="news-search-days-slider"
                value={webSearchSettings.newsSearchDays || 7}
                onChange={handleNewsSearchDaysChange}
                min={1}
                max={30}
                step={1}
                marks={[
                  { value: 1, label: t('settings.webSearch.tavily.newsSearchDays.marks.1day') },
                  { value: 7, label: t('settings.webSearch.tavily.newsSearchDays.marks.1week') },
                  { value: 14, label: t('settings.webSearch.tavily.newsSearchDays.marks.2weeks') },
                  { value: 30, label: t('settings.webSearch.tavily.newsSearchDays.marks.1month') },
                ]}
                disabled={!webSearchSettings.enabled}
              />
              <Typography variant="body2" color="text.secondary">
                {t('settings.webSearch.tavily.newsSearchDays.description')}
              </Typography>
            </Box>

            {/* 高级选项 */}
            <FormGroup>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={webSearchSettings.includeRawContent || false}
                    onChange={() => dispatch(toggleIncludeRawContent())}
                    disabled={!webSearchSettings.enabled || webSearchSettings.enableSmartSearch}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{t('settings.webSearch.tavily.includeRawContent.label')}</Typography>
                    <Tooltip title={t('settings.webSearch.tavily.includeRawContent.tooltip')}>
                      <InfoOutlinedIcon size={16} color="var(--mui-palette-text-secondary)" />
                    </Tooltip>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={webSearchSettings.includeAnswer || false}
                    onChange={() => dispatch(toggleIncludeAnswer())}
                    disabled={!webSearchSettings.enabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{t('settings.webSearch.tavily.includeAnswer.label')}</Typography>
                    <Tooltip title={t('settings.webSearch.tavily.includeAnswer.tooltip')}>
                      <InfoOutlinedIcon size={16} color="var(--mui-palette-text-secondary)" />
                    </Tooltip>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={webSearchSettings.enableQueryValidation !== false}
                    onChange={() => dispatch(toggleQueryValidation())}
                    disabled={!webSearchSettings.enabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{t('settings.webSearch.tavily.enableQueryValidation.label')}</Typography>
                    <Tooltip title={t('settings.webSearch.tavily.enableQueryValidation.tooltip')}>
                      <InfoOutlinedIcon size={16} color="var(--mui-palette-text-secondary)" />
                    </Tooltip>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={webSearchSettings.enablePostProcessing !== false}
                    onChange={() => dispatch(togglePostProcessing())}
                    disabled={!webSearchSettings.enabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{t('settings.webSearch.tavily.enablePostProcessing.label')}</Typography>
                    <Tooltip title={t('settings.webSearch.tavily.enablePostProcessing.tooltip')}>
                      <InfoOutlinedIcon size={16} color="var(--mui-palette-text-secondary)" />
                    </Tooltip>
                  </Box>
                }
              />
            </FormGroup>
          </Paper>
        )}

        {/* 高级设置 */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: (theme) => theme.palette.text.primary,
              mb: 2,
            }}
          >
            {t('settings.webSearch.advanced.title')}
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            {t('settings.webSearch.advanced.excludeDomains.label')}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={webSearchSettings.excludeDomains?.join('\n') || ''}
            onChange={(e) => {
              const domains = e.target.value.split('\n').filter(d => d.trim());
              dispatch(setExcludeDomains(domains));
            }}
            placeholder={t('settings.webSearch.advanced.excludeDomains.placeholder')}
            disabled={!webSearchSettings.enabled}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('settings.webSearch.advanced.excludeDomains.description')}
          </Typography>
        </Paper>
      </Box>

      {isEditing && editingProvider && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Paper
            sx={{
              p: 3,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editingProvider.id ? t('settings.webSearch.basic.editDialog.editTitle') : t('settings.webSearch.basic.editDialog.addTitle')}
            </Typography>

            <TextField
              fullWidth
              margin="normal"
              label={t('settings.webSearch.basic.editDialog.name')}
              value={editingProvider.name}
              onChange={(e) => handleProviderFieldChange('name', e.target.value)}
              variant="outlined"
            />

            <TextField
              fullWidth
              margin="normal"
              label={t('settings.webSearch.basic.editDialog.baseUrl')}
              value={editingProvider.baseUrl}
              onChange={(e) => handleProviderFieldChange('baseUrl', e.target.value)}
              variant="outlined"
              placeholder={t('settings.webSearch.basic.editDialog.baseUrlPlaceholder')}
            />

            <TextField
              fullWidth
              margin="normal"
              label={t('settings.webSearch.basic.editDialog.apiKey')}
              type="password"
              value={editingProvider.apiKey}
              onChange={(e) => handleProviderFieldChange('apiKey', e.target.value)}
              variant="outlined"
            />

            <FormControlLabel
              control={
                <CustomSwitch
                  checked={editingProvider.enabled}
                  onChange={(e) => handleProviderFieldChange('enabled', e.target.checked)}
                />
              }
              label={t('settings.webSearch.basic.editDialog.enable')}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handleCancelEdit}>{t('settings.webSearch.basic.editDialog.cancel')}</Button>
              <Button
                variant="contained"
                onClick={handleSaveProvider}
                sx={{
                  bgcolor: '#3b82f6',
                  '&:hover': {
                    bgcolor: '#2563eb',
                  }
                }}
              >
                {t('settings.webSearch.basic.editDialog.save')}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default WebSearchSettings;