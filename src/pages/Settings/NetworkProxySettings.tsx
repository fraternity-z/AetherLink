import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  alpha,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Shield,
  Wifi,
  Plus,
  X,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../i18n';
import {
  SafeAreaContainer,
  Container,
  HeaderBar,
  YStack,
  SettingGroup,
  Row,
} from '../../components/settings/SettingComponents';
import CustomSwitch from '../../components/CustomSwitch';
import useScrollPosition from '../../hooks/useScrollPosition';
import type { RootState, AppDispatch } from '../../shared/store';
import {
  setProxyEnabled,
  setProxyType,
  setProxyHost,
  setProxyPort,
  setProxyUsername,
  setProxyPassword,
  setProxyBypass,
  testProxyConnection,
  applyGlobalProxy,
  saveNetworkProxySettings,
  loadNetworkProxySettings,
  clearTestResult,
  type ProxyType,
} from '../../shared/store/slices/networkProxySlice';

const NetworkProxySettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  // 使用滚动位置保存功能
  const { containerRef, handleScroll } = useScrollPosition('settings-network-proxy', {
    autoRestore: true,
    restoreDelay: 0,
  });

  // Redux state
  const { globalProxy, isTesting, lastTestResult, isLoaded, status } = useSelector(
    (state: RootState) => state.networkProxy
  );

  // Local state
  const [showPassword, setShowPassword] = useState(false);
  const [testUrl, setTestUrl] = useState('https://www.google.com');
  const [newBypassDomain, setNewBypassDomain] = useState('');
  const [quickInput, setQuickInput] = useState('');

  // 加载设置
  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadNetworkProxySettings());
    }
  }, [dispatch, isLoaded]);

  // 保存设置
  const saveSettings = useCallback(() => {
    dispatch(
      saveNetworkProxySettings({
        globalProxy,
        status,
        isTesting: false,
        isLoaded: true,
      })
    );
  }, [dispatch, globalProxy, status]);

  // 设置变更时保存
  useEffect(() => {
    if (isLoaded) {
      const timeoutId = setTimeout(saveSettings, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [globalProxy, isLoaded, saveSettings]);

  const handleBack = () => {
    navigate('/settings');
  };

  // 切换代理启用状态
  const handleToggleEnabled = async () => {
    const newEnabled = !globalProxy.enabled;
    dispatch(setProxyEnabled(newEnabled));

    // 应用代理配置到插件
    await dispatch(
      applyGlobalProxy({
        ...globalProxy,
        enabled: newEnabled,
      })
    );
  };

  // 代理类型选项
  const proxyTypeOptions: { value: ProxyType; label: string }[] = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'socks4', label: 'SOCKS4' },
    { value: 'socks5', label: 'SOCKS5' },
  ];

  // 处理代理类型变更
  const handleTypeChange = (event: SelectChangeEvent) => {
    dispatch(setProxyType(event.target.value as ProxyType));
    dispatch(clearTestResult());
  };

  // 处理主机变更
  const handleHostChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProxyHost(event.target.value));
    dispatch(clearTestResult());
  };

  // 快速填入 host:port 格式
  const handleQuickInput = () => {
    const input = quickInput.trim();
    if (!input) return;

    // 支持多种格式: host:port, http://host:port, socks5://host:port
    let host = '';
    let port = 0;
    let type: ProxyType | null = null;

    // 检查是否有协议前缀
    const protocolMatch = input.match(/^(https?|socks[45]):\/\//i);
    let addressPart = input;
    
    if (protocolMatch) {
      const protocol = protocolMatch[1].toLowerCase();
      if (protocol === 'http') type = 'http';
      else if (protocol === 'https') type = 'https';
      else if (protocol === 'socks4') type = 'socks4';
      else if (protocol === 'socks5') type = 'socks5';
      addressPart = input.slice(protocolMatch[0].length);
    }

    // 解析 host:port
    const lastColon = addressPart.lastIndexOf(':');
    if (lastColon !== -1) {
      host = addressPart.slice(0, lastColon);
      const portStr = addressPart.slice(lastColon + 1);
      port = parseInt(portStr, 10);
      
      if (isNaN(port) || port < 1 || port > 65535) {
        port = 0;
      }
    } else {
      host = addressPart;
    }

    // 更新状态
    if (host) {
      dispatch(setProxyHost(host));
    }
    if (port > 0) {
      dispatch(setProxyPort(port));
    }
    if (type) {
      dispatch(setProxyType(type));
    }
    
    dispatch(clearTestResult());
    setQuickInput('');
  };

  // 处理端口变更
  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // 允许空值（用户正在删除）
    if (value === '') {
      dispatch(setProxyPort(0));
      dispatch(clearTestResult());
      return;
    }
    
    // 只允许数字
    if (!/^\d+$/.test(value)) {
      return;
    }
    
    const port = parseInt(value, 10);
    if (port >= 0 && port <= 65535) {
      dispatch(setProxyPort(port));
      dispatch(clearTestResult());
    }
  };

  // 处理用户名变更
  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProxyUsername(event.target.value));
    dispatch(clearTestResult());
  };

  // 处理密码变更
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProxyPassword(event.target.value));
    dispatch(clearTestResult());
  };

  // 测试代理连接
  const handleTestProxy = async () => {
    await dispatch(testProxyConnection({ config: globalProxy, testUrl }));
  };

  // 添加 bypass 域名
  const handleAddBypassDomain = () => {
    if (newBypassDomain.trim() && !globalProxy.bypass?.includes(newBypassDomain.trim())) {
      dispatch(setProxyBypass([...(globalProxy.bypass || []), newBypassDomain.trim()]));
      setNewBypassDomain('');
    }
  };

  // 删除 bypass 域名
  const handleRemoveBypassDomain = (domain: string) => {
    dispatch(setProxyBypass((globalProxy.bypass || []).filter((d: string) => d !== domain)));
  };

  // 获取测试结果显示
  const getTestResultDisplay = () => {
    if (!lastTestResult) return null;

    if (lastTestResult.success) {
      return (
        <Alert
          severity="success"
          icon={<CheckCircle2 size={20} />}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {t('settings.networkProxy.test.success')}
          </Typography>
          {lastTestResult.responseTime && (
            <Typography variant="caption" color="text.secondary">
              {t('settings.networkProxy.test.responseTime', {
                time: lastTestResult.responseTime,
              })}
            </Typography>
          )}
          {lastTestResult.externalIp && (
            <Typography variant="caption" display="block" color="text.secondary">
              {t('settings.networkProxy.test.externalIp', { ip: lastTestResult.externalIp })}
            </Typography>
          )}
        </Alert>
      );
    }

    return (
      <Alert severity="error" icon={<XCircle size={20} />} sx={{ mt: 2, borderRadius: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          {t('settings.networkProxy.test.failed')}
        </Typography>
        {lastTestResult.error && (
          <Typography variant="caption" color="text.secondary">
            {lastTestResult.error}
          </Typography>
        )}
      </Alert>
    );
  };

  return (
    <SafeAreaContainer>
      <HeaderBar title={t('settings.networkProxy.title')} onBackPress={handleBack} />
      <Container
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          overflow: 'auto',
          willChange: 'scroll-position',
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <YStack sx={{ gap: 3, pb: 4 }}>
          {/* 代理状态卡片 */}
          <Box
            sx={(theme) => ({
              p: 2,
              borderRadius: 3,
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            })}
          >
            <Row sx={{ alignItems: 'center', gap: 2 }}>
              <Box
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: alpha(theme.palette.primary.main, 0.15),
                })}
              >
                {globalProxy.enabled ? (
                  <Shield size={24} color="currentColor" />
                ) : (
                  <Globe size={24} color="currentColor" />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {globalProxy.enabled
                    ? t('settings.networkProxy.status.enabled')
                    : t('settings.networkProxy.status.disabled')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {globalProxy.enabled
                    ? `${globalProxy.type.toUpperCase()} - ${globalProxy.host}:${globalProxy.port}`
                    : t('settings.networkProxy.status.directConnection')}
                </Typography>
              </Box>
              <CustomSwitch checked={globalProxy.enabled} onChange={handleToggleEnabled} />
            </Row>
          </Box>

          {/* 基础设置 */}
          <SettingGroup title={t('settings.networkProxy.basic.title')}>
            {/* 代理类型 */}
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.basic.type')}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={globalProxy.type}
                  onChange={handleTypeChange}
                  sx={{ borderRadius: 2 }}
                >
                  {proxyTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Row sx={{ alignItems: 'center', gap: 1 }}>
                        <Wifi size={16} />
                        <Typography>{option.label}</Typography>
                      </Row>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* 快速填入 */}
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.basic.quickInput', '快速填入')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="18.162.158.218:80 或 socks5://127.0.0.1:1080"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickInput()}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleQuickInput}
                  disabled={!quickInput.trim()}
                  sx={{ borderRadius: 2, minWidth: 'auto', px: 2 }}
                >
                  {t('settings.networkProxy.basic.fill', '填入')}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('settings.networkProxy.basic.quickInputHint', '支持格式: host:port, http://host:port, socks5://host:port')}
              </Typography>
            </Box>

            {/* 服务器地址 */}
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.basic.host')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="127.0.0.1"
                value={globalProxy.host}
                onChange={handleHostChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* 端口 */}
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.basic.port')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="text"
                placeholder="8080"
                value={globalProxy.port || ''}
                onChange={handlePortChange}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </SettingGroup>

          {/* 认证设置 */}
          <SettingGroup title={t('settings.networkProxy.auth.title')}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {t('settings.networkProxy.auth.description')}
              </Typography>

              {/* 用户名 */}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.auth.username')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('settings.networkProxy.auth.usernamePlaceholder')}
                value={globalProxy.username || ''}
                onChange={handleUsernameChange}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* 密码 */}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.auth.password')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('settings.networkProxy.auth.passwordPlaceholder')}
                value={globalProxy.password || ''}
                onChange={handlePasswordChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </SettingGroup>

          {/* 代理跳过列表 */}
          <SettingGroup title={t('settings.networkProxy.bypass.title')}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {t('settings.networkProxy.bypass.description')}
              </Typography>

              {/* 当前跳过列表 */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(globalProxy.bypass || []).map((domain: string) => (
                  <Chip
                    key={domain}
                    label={domain}
                    size="small"
                    onDelete={() => handleRemoveBypassDomain(domain)}
                    deleteIcon={<X size={14} />}
                    sx={{ borderRadius: 1.5 }}
                  />
                ))}
              </Box>

              {/* 添加新域名 */}
              <Row sx={{ gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('settings.networkProxy.bypass.placeholder')}
                  value={newBypassDomain}
                  onChange={(e) => setNewBypassDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBypassDomain()}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <IconButton
                  onClick={handleAddBypassDomain}
                  disabled={!newBypassDomain.trim()}
                  sx={(theme) => ({
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  })}
                >
                  <Plus size={20} />
                </IconButton>
              </Row>
            </Box>
          </SettingGroup>

          {/* 代理测试 */}
          <SettingGroup title={t('settings.networkProxy.test.title')}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {t('settings.networkProxy.test.description')}
              </Typography>

              {/* 测试URL */}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('settings.networkProxy.test.url')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="https://www.google.com"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* 测试按钮 */}
              <Button
                fullWidth
                variant="outlined"
                onClick={handleTestProxy}
                disabled={isTesting || !globalProxy.host || !globalProxy.port}
                startIcon={
                  isTesting ? <CircularProgress size={16} /> : <RefreshCw size={16} />
                }
                sx={{ borderRadius: 2 }}
              >
                {isTesting
                  ? t('settings.networkProxy.test.testing')
                  : t('settings.networkProxy.test.button')}
              </Button>

              {/* 测试结果 */}
              {getTestResultDisplay()}
            </Box>
          </SettingGroup>

          {/* 平台支持说明 */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {t('settings.networkProxy.platformSupport.title')}
            </Typography>
            <Typography variant="caption" component="div">
              • <strong>Android</strong> - {t('settings.networkProxy.platformSupport.android')}
              <br />
              • <strong>iOS</strong> - {t('settings.networkProxy.platformSupport.ios')}
              <br />• <strong>Web</strong> - {t('settings.networkProxy.platformSupport.web')}
            </Typography>
          </Alert>
        </YStack>
      </Container>
    </SafeAreaContainer>
  );
};

export default NetworkProxySettings;
