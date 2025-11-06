import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  FormControlLabel,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowLeft as ArrowBackIcon,
  Trash2 as DeleteIcon,
  Settings as SettingsIcon,
  Terminal as TerminalIcon,
  Wifi as NetworkCheckIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from '../i18n';
import CustomSwitch from '../components/CustomSwitch';
import ConsolePanel from '../components/DevTools/ConsolePanel';
import NetworkPanel from '../components/DevTools/NetworkPanel';
import EnhancedConsoleService from '../shared/services/EnhancedConsoleService';
import EnhancedNetworkService from '../shared/services/network/EnhancedNetworkService';

const DevToolsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tabValue, setTabValue] = useState(0);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [preserveLog, setPreserveLog] = useState(false);

  const consoleService = EnhancedConsoleService.getInstance();
  const networkService = EnhancedNetworkService.getInstance();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleClear = () => {
    if (tabValue === 0) {
      consoleService.clear();
    } else if (tabValue === 1) {
      networkService.clear();
    }
    setClearDialogOpen(false);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
      }}
    >
      {/* 顶部工具栏 - 优化设计 */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar variant={isMobile ? 'dense' : 'regular'} sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label={t('devtools.back')}
            sx={{
              color: 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ArrowBackIcon size={20} />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            >
              <TerminalIcon size={18} />
            </Box>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {t('devtools.title')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={t('devtools.settings')} arrow>
              <IconButton 
                onClick={() => setSettingsOpen(true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                  },
                }}
              >
                <SettingsIcon size={18} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('devtools.clear')} arrow>
              <IconButton 
                onClick={() => setClearDialogOpen(true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: 'error.main',
                  },
                }}
              >
                <DeleteIcon size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 标签页 - 优化样式 */}
      <Paper 
        elevation={0}
        square
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.6)
            : theme.palette.background.paper,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            minHeight: isMobile ? 48 : 56,
            '& .MuiTab-root': {
              minHeight: isMobile ? 48 : 56,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              gap: 1,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '1px 1px 0 0',
            },
          }}
        >
          <Tab
            icon={<TerminalIcon size={18} />}
            label={t('devtools.tabs.console')}
            iconPosition="start"
          />
          <Tab
            icon={<NetworkCheckIcon size={18} />}
            label={t('devtools.tabs.network')}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 主内容区域 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        {tabValue === 0 && <ConsolePanel autoScroll={autoScroll} />}
        {tabValue === 1 && <NetworkPanel />}
      </Box>

      {/* 设置对话框 - 优化设计 */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon size={20} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {t('devtools.settingsDialog.title')}
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {t('devtools.settingsDialog.autoScroll.label')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('devtools.settingsDialog.autoScroll.description')}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
            <Divider />
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={preserveLog}
                  onChange={(e) => setPreserveLog(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {t('devtools.settingsDialog.preserveLog.label')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('devtools.settingsDialog.preserveLog.description')}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setSettingsOpen(false)}
            variant="contained"
            sx={{ textTransform: 'none', px: 3 }}
          >
            {t('devtools.settingsDialog.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 清除确认对话框 - 优化设计 */}
      <Dialog 
        open={clearDialogOpen} 
        onClose={() => setClearDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main',
              }}
            >
              <DeleteIcon size={20} />
            </Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {t('devtools.clearDialog.title')}
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ fontSize: '0.9375rem' }}>
            <strong>
              {tabValue === 0 
                ? t('devtools.clearDialog.consoleMessage')
                : t('devtools.clearDialog.networkMessage')}
            </strong>
            <br />
            <Typography component="span" variant="caption" color="text.secondary">
              {t('devtools.clearDialog.warning')}
            </Typography>
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button 
            onClick={() => setClearDialogOpen(false)}
            variant="outlined"
            sx={{ textTransform: 'none', px: 3 }}
          >
            {t('devtools.clearDialog.cancel')}
          </Button>
          <Button 
            onClick={handleClear} 
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', px: 3 }}
          >
            {t('devtools.clearDialog.clear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DevToolsPage;
