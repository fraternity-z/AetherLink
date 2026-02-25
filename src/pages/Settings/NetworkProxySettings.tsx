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
  Collapse,
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
  Server,
  Lock,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Chrome,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../i18n';
import {
  SafeAreaContainer,
  Container,
  HeaderBar,
  YStack,
  SettingsCard,
  SettingRow,
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
import { getCorsProxyUrl, setCorsProxyUrl } from '../../shared/utils/universalFetch';

// 输入框通用样式
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const NetworkProxySettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

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
  const [corsProxyUrlInput, setCorsProxyUrlInput] = useState(getCorsProxyUrl());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 加载设置
  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadNetworkProxySettings());
    }
  }, [dispatch, isLoaded]);

  // 保存设置（防抖）
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

  useEffect(() => {
    if (isLoaded) {
      const id = setTimeout(saveSettings, 500);
      return () => clearTimeout(id);
    }
  }, [globalProxy, isLoaded, saveSettings]);

  // ==================== 事件处理 ====================

  const handleBack = () => navigate('/settings');

  const handleToggleEnabled = async () => {
    const newEnabled = !globalProxy.enabled;
    dispatch(setProxyEnabled(newEnabled));
    await dispatch(applyGlobalProxy({ ...globalProxy, enabled: newEnabled }));
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    dispatch(setProxyType(event.target.value as ProxyType));
    dispatch(clearTestResult());
  };

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProxyHost(e.target.value));
    dispatch(clearTestResult());
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') { dispatch(setProxyPort(0)); dispatch(clearTestResult()); return; }
    if (!/^\d+$/.test(value)) return;
    const port = parseInt(value, 10);
    if (port >= 0 && port <= 65535) { dispatch(setProxyPort(port)); dispatch(clearTestResult()); }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProxyUsername(e.target.value));
    dispatch(clearTestResult());
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProxyPassword(e.target.value));
    dispatch(clearTestResult());
  };

  // 快速填入 host:port / protocol://host:port
  const handleQuickInput = () => {
    const input = quickInput.trim();
    if (!input) return;

    let host = '', port = 0;
    let type: ProxyType | null = null;

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

    const lastColon = addressPart.lastIndexOf(':');
    if (lastColon !== -1) {
      host = addressPart.slice(0, lastColon);
      const p = parseInt(addressPart.slice(lastColon + 1), 10);
      if (!isNaN(p) && p >= 1 && p <= 65535) port = p;
    } else {
      host = addressPart;
    }

    if (host) dispatch(setProxyHost(host));
    if (port > 0) dispatch(setProxyPort(port));
    if (type) dispatch(setProxyType(type));
    dispatch(clearTestResult());
    setQuickInput('');
  };

  const handleTestProxy = () => dispatch(testProxyConnection({ config: globalProxy, testUrl }));

  const handleAddBypassDomain = () => {
    const d = newBypassDomain.trim();
    if (d && !globalProxy.bypass?.includes(d)) {
      dispatch(setProxyBypass([...(globalProxy.bypass || []), d]));
      setNewBypassDomain('');
    }
  };

  const handleRemoveBypassDomain = (domain: string) => {
    dispatch(setProxyBypass((globalProxy.bypass || []).filter((d: string) => d !== domain)));
  };

  const handleCorsProxyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorsProxyUrlInput(e.target.value);
  };

  const handleCorsProxyUrlBlur = () => {
    const url = corsProxyUrlInput.trim();
    if (url && url !== getCorsProxyUrl()) {
      setCorsProxyUrl(url);
    }
  };

  // 代理类型选项
  const proxyTypeOptions: { value: ProxyType; label: string }[] = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'socks4', label: 'SOCKS4' },
    { value: 'socks5', label: 'SOCKS5' },
  ];

  return (
    <SafeAreaContainer>
      <HeaderBar title={t('settings.networkProxy.title', '网络代理')} onBackPress={handleBack} />
      <Container
        ref={containerRef}
        onScroll={handleScroll}
        sx={{ overflow: 'auto', willChange: 'scroll-position', transform: 'translateZ(0)', WebkitOverflowScrolling: 'touch' }}
      >
        <YStack sx={{ gap: 2.5, pb: 4 }}>

          {/* ==================== 状态概览 ==================== */}
          <Box
            sx={(theme) => ({
              p: 2.5,
              borderRadius: 3,
              background: globalProxy.enabled
                ? (theme.palette.mode === 'dark'
                    ? alpha(theme.palette.success.main, 0.12)
                    : alpha(theme.palette.success.main, 0.06))
                : (theme.palette.mode === 'dark'
                    ? alpha(theme.palette.text.secondary, 0.08)
                    : alpha(theme.palette.text.secondary, 0.04)),
              border: `1px solid ${globalProxy.enabled
                ? alpha(theme.palette.success.main, 0.25)
                : alpha(theme.palette.divider, 1)}`,
              transition: 'all 0.3s ease',
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={(theme) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: globalProxy.enabled
                    ? alpha(theme.palette.success.main, 0.18)
                    : alpha(theme.palette.text.secondary, 0.1),
                  color: globalProxy.enabled
                    ? theme.palette.success.main
                    : theme.palette.text.secondary,
                  transition: 'all 0.3s ease',
                })}
              >
                {globalProxy.enabled ? <Shield size={22} /> : <Globe size={22} />}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                  {globalProxy.enabled ? '代理已启用' : '直接连接'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {globalProxy.enabled
                    ? `${globalProxy.type.toUpperCase()} ${globalProxy.host}:${globalProxy.port}`
                    : '所有请求直接发送，不经过代理'}
                </Typography>
              </Box>
              <CustomSwitch checked={globalProxy.enabled} onChange={handleToggleEnabled} />
            </Box>
          </Box>

          {/* ==================== 服务器配置 ==================== */}
          <SettingsCard title="服务器配置" icon={<Server />}>

            {/* 快速填入 */}
            <SettingRow label="快速填入" description="粘贴地址自动解析协议、主机和端口" vertical>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="socks5://127.0.0.1:1080"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickInput()}
                  sx={inputSx}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleQuickInput}
                  disabled={!quickInput.trim()}
                  sx={{ borderRadius: 2, minWidth: 64, height: 40, textTransform: 'none', flexShrink: 0 }}
                >
                  解析
                </Button>
              </Box>
            </SettingRow>

            {/* 代理类型 */}
            <SettingRow label="协议类型">
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={globalProxy.type}
                  onChange={handleTypeChange}
                  sx={{ borderRadius: 2 }}
                >
                  {proxyTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Wifi size={14} />
                        {opt.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SettingRow>

            {/* 主机 + 端口 同行 */}
            <SettingRow label="服务器地址" vertical>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="127.0.0.1"
                  value={globalProxy.host}
                  onChange={handleHostChange}
                  sx={{ flex: 3, ...inputSx }}
                />
                <TextField
                  size="small"
                  placeholder="端口"
                  value={globalProxy.port || ''}
                  onChange={handlePortChange}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  sx={{ flex: 1, minWidth: 80, ...inputSx }}
                />
              </Box>
            </SettingRow>
          </SettingsCard>

          {/* ==================== 认证（可折叠） ==================== */}
          <SettingsCard title="认证信息" description="代理服务器需要认证时填写" icon={<Lock />}>
            <SettingRow label="用户名" vertical>
              <TextField
                fullWidth
                size="small"
                placeholder="可选"
                value={globalProxy.username || ''}
                onChange={handleUsernameChange}
                sx={inputSx}
              />
            </SettingRow>

            <SettingRow label="密码" vertical last>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                placeholder="可选"
                value={globalProxy.password || ''}
                onChange={handlePasswordChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </SettingRow>
          </SettingsCard>

          {/* ==================== 连接测试 ==================== */}
          <SettingsCard title="连接测试" icon={<RefreshCw />}>
            <SettingRow label="测试地址" vertical>
              <TextField
                fullWidth
                size="small"
                placeholder="https://www.google.com"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                sx={inputSx}
              />
            </SettingRow>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleTestProxy}
              disabled={isTesting || !globalProxy.host || !globalProxy.port}
              startIcon={isTesting ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
              sx={{ borderRadius: 2, textTransform: 'none', mt: 0.5 }}
            >
              {isTesting ? '测试中...' : '测试连接'}
            </Button>

            {/* 测试结果 */}
            {lastTestResult && (
              <Alert
                severity={lastTestResult.success ? 'success' : 'error'}
                icon={lastTestResult.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                sx={{ mt: 1.5, borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {lastTestResult.success ? '连接成功' : '连接失败'}
                </Typography>
                {lastTestResult.success && lastTestResult.responseTime && (
                  <Typography variant="caption" color="text.secondary">
                    响应时间: {lastTestResult.responseTime}ms
                  </Typography>
                )}
                {lastTestResult.success && lastTestResult.externalIp && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    出口 IP: {lastTestResult.externalIp}
                  </Typography>
                )}
                {!lastTestResult.success && lastTestResult.error && (
                  <Typography variant="caption" color="text.secondary">
                    {lastTestResult.error}
                  </Typography>
                )}
              </Alert>
            )}
          </SettingsCard>

          {/* ==================== 高级设置（折叠） ==================== */}
          <Box>
            <Button
              fullWidth
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                color: 'text.secondary',
                justifyContent: 'space-between',
                px: 1.5,
                mb: showAdvanced ? 1 : 0,
              }}
            >
              高级设置
            </Button>

            <Collapse in={showAdvanced}>
              <YStack sx={{ gap: 2 }}>

                {/* CORS 代理服务器 */}
                <SettingsCard
                  title="Web CORS 代理"
                  description="Web 端用于绕过浏览器跨域限制的本地代理服务器地址"
                  icon={<Chrome />}
                >
                  <SettingRow label="代理地址" vertical last>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="http://localhost:8888"
                      value={corsProxyUrlInput}
                      onChange={handleCorsProxyUrlChange}
                      onBlur={handleCorsProxyUrlBlur}
                      helperText="修改后失焦自动生效，所有 API 请求将通过此地址转发"
                      sx={inputSx}
                    />
                  </SettingRow>
                </SettingsCard>

                {/* 代理跳过列表 */}
                <SettingsCard
                  title="跳过代理"
                  description="匹配的域名将直接连接，不经过代理"
                  icon={<Globe />}
                >
                  {/* 已有域名 */}
                  {(globalProxy.bypass || []).length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                      {(globalProxy.bypass || []).map((domain: string) => (
                        <Chip
                          key={domain}
                          label={domain}
                          size="small"
                          onDelete={() => handleRemoveBypassDomain(domain)}
                          deleteIcon={<X size={12} />}
                          sx={{ borderRadius: 1.5, height: 28 }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* 添加新域名 */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="*.example.com"
                      value={newBypassDomain}
                      onChange={(e) => setNewBypassDomain(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBypassDomain()}
                      sx={inputSx}
                    />
                    <IconButton
                      onClick={handleAddBypassDomain}
                      disabled={!newBypassDomain.trim()}
                      size="small"
                      sx={(theme) => ({
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                        borderRadius: 2,
                        width: 40,
                        height: 40,
                      })}
                    >
                      <Plus size={18} />
                    </IconButton>
                  </Box>
                </SettingsCard>
              </YStack>
            </Collapse>
          </Box>

          {/* ==================== 平台说明 ==================== */}
          <Box
            sx={(theme) => ({
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.info.main, 0.08)
                : alpha(theme.palette.info.main, 0.04),
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
            })}
          >
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
              平台支持
            </Typography>
            <YStack sx={{ gap: 1 }}>
              {[
                { icon: <Monitor size={15} />, label: 'Tauri 桌面端', desc: '原生 HTTP 插件，支持系统代理' },
                { icon: <Smartphone size={15} />, label: 'Capacitor 移动端', desc: 'CorsBypass 插件，支持全局代理' },
                { icon: <Chrome size={15} />, label: 'Web 端', desc: '通过本地 CORS 代理服务器转发请求' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}>{item.icon}</Box>
                  <Typography variant="caption">
                    <strong>{item.label}</strong> — {item.desc}
                  </Typography>
                </Box>
              ))}
            </YStack>
          </Box>

        </YStack>
      </Container>
    </SafeAreaContainer>
  );
};

export default NetworkProxySettings;
