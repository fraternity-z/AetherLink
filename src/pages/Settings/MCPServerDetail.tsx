import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Button,
  Chip,
  Avatar,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import CustomSwitch from '../../components/CustomSwitch';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft as ArrowBackIcon,
  Save as SaveIcon,
  Play as TestIcon,
  ChevronDown as ExpandMoreIcon,
  Database as StorageIcon,
  Globe as HttpIcon,
  Settings as SettingsIcon,
  Wrench as BuildIcon,
  FileText as DescriptionIcon,
  Folder as FolderIcon
} from 'lucide-react';
import type { MCPServer, MCPServerType, MCPTool, MCPPrompt, MCPResource } from '../../shared/types';
import { mcpService } from '../../shared/services/mcp';
import { useTranslation } from '../../i18n';

const MCPServerDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { serverId } = useParams<{ serverId: string }>();
  const location = useLocation();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [prompts, setPrompts] = useState<MCPPrompt[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (location.state?.server) {
      setServer(location.state.server);
      loadServerData(location.state.server);
    } else if (serverId) {
      const foundServer = mcpService.getServerById(serverId);
      if (foundServer) {
        setServer(foundServer);
        loadServerData(foundServer);
      }
    }
  }, [serverId, location.state]);

  const loadServerData = async (serverData: MCPServer) => {
    if (!serverData.isActive) return;

    setLoading(true);
    try {
      const [toolsList, promptsList, resourcesList] = await Promise.all([
        mcpService.listTools(serverData),
        mcpService.listPrompts(serverData),
        mcpService.listResources(serverData)
      ]);

      setTools(toolsList);
      setPrompts(promptsList);
      setResources(resourcesList);
    } catch (error) {
      console.error(t('settings.mcpServer.messages.loadDataFailed'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/settings/mcp-server');
  };

  const handleSave = async () => {
    if (!server) return;

    try {
      await mcpService.updateServer(server);
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.saveSuccess'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.saveFailed'),
        severity: 'error'
      });
    }
  };

  const handleTest = async () => {
    if (!server) return;

    setTesting(true);
    try {
      const result = await mcpService.testConnection(server);
      setSnackbar({
        open: true,
        message: result ? t('settings.mcpServer.messages.testSuccess') : t('settings.mcpServer.messages.testFailed'),
        severity: result ? 'success' : 'error'
      });

      if (result && server.isActive) {
        await loadServerData(server);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.testFailed'),
        severity: 'error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!server) return;

    try {
      await mcpService.toggleServer(server.id, isActive);
      setServer({ ...server, isActive });

      if (isActive) {
        await loadServerData({ ...server, isActive });
      } else {
        setTools([]);
        setPrompts([]);
        setResources([]);
      }

      setSnackbar({
        open: true,
        message: isActive ? t('settings.mcpServer.messages.serverEnabled') : t('settings.mcpServer.messages.serverDisabled'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.operationFailed'),
        severity: 'error'
      });
    }
  };

  const getServerTypeIcon = (type: MCPServerType) => {
    switch (type) {
      case 'httpStream':
        return <HttpIcon />;
      case 'inMemory':
        return <StorageIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const getServerTypeColor = (type: MCPServerType) => {
    switch (type) {
      case 'httpStream':
        return '#9c27b0';
      case 'inMemory':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  if (!server) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: 'background.default'
    }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="back"
            sx={{ color: 'primary.main' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Avatar
            sx={{
              bgcolor: alpha(getServerTypeColor(server.type), 0.1),
              color: getServerTypeColor(server.type),
              mr: 2,
              width: 32,
              height: 32
            }}
          >
            {getServerTypeIcon(server.type)}
          </Avatar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600
            }}
          >
            {server.name}
          </Typography>
          <Button
            startIcon={testing ? <CircularProgress size={16} /> : <TestIcon />}
            onClick={handleTest}
            disabled={testing}
            size="small"
            sx={{ mr: 1 }}
          >
            {t('settings.mcpServer.detail.buttons.test')}
          </Button>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            variant="contained"
            size="small"
          >
            {t('settings.mcpServer.detail.buttons.save')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          mt: 8,
          px: 2,
          py: 2
        }}
      >
        {/* 基本信息 */}
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            {t('settings.mcpServer.detail.basicInfo.title')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={server.isActive}
                  onChange={(e) => handleToggleActive(e.target.checked)}
                />
              }
              label={t('settings.mcpServer.detail.basicInfo.enableServer')}
            />
            {server.isActive && (
              <Chip
                label={t('settings.mcpServer.status.active')}
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          <TextField
            fullWidth
            label={t('settings.mcpServer.detail.basicInfo.serverName')}
            value={server.name}
            onChange={(e) => setServer({ ...server, name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('settings.mcpServer.detail.basicInfo.serverType')}</InputLabel>
            <Select
              value={server.type}
              label={t('settings.mcpServer.detail.basicInfo.serverType')}
              onChange={(e) => setServer({ ...server, type: e.target.value as MCPServerType })}
            >
              <MenuItem value="sse">{t('settings.mcpServer.detail.basicInfo.types.sse')}</MenuItem>
              <MenuItem value="streamableHttp">{t('settings.mcpServer.detail.basicInfo.types.streamableHttp')}</MenuItem>
              <MenuItem value="inMemory">{t('settings.mcpServer.detail.basicInfo.types.inMemory')}</MenuItem>
            </Select>
          </FormControl>

          {(server.type === 'sse' || server.type === 'streamableHttp' || server.type === 'httpStream') && (
            <TextField
              fullWidth
              label={t('settings.mcpServer.detail.basicInfo.serverUrl')}
              value={server.baseUrl || ''}
              onChange={(e) => setServer({ ...server, baseUrl: e.target.value })}
              placeholder={t('settings.mcpServer.detail.basicInfo.placeholders.url')}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label={t('settings.mcpServer.detail.basicInfo.description')}
            value={server.description || ''}
            onChange={(e) => setServer({ ...server, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t('settings.mcpServer.detail.basicInfo.timeout')}
            type="number"
            value={server.timeout || 60}
            onChange={(e) => setServer({ ...server, timeout: parseInt(e.target.value) || 60 })}
            inputProps={{ min: 1, max: 300 }}
            sx={{ mb: 2 }}
          />

        </Paper>

        {/* 高级设置 */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon />
              {t('settings.mcpServer.detail.advanced.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              label={t('settings.mcpServer.detail.advanced.headers')}
              value={JSON.stringify(server.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  setServer({ ...server, headers });
                } catch (error) {
                  // 忽略无效的 JSON
                }
              }}
              multiline
              rows={4}
              sx={{ mb: 2 }}
              placeholder={t('settings.mcpServer.detail.advanced.placeholders.headers')}
            />

            <TextField
              fullWidth
              label={t('settings.mcpServer.detail.advanced.env')}
              value={JSON.stringify(server.env || {}, null, 2)}
              onChange={(e) => {
                try {
                  const env = JSON.parse(e.target.value);
                  setServer({ ...server, env });
                } catch (error) {
                  // 忽略无效的 JSON
                }
              }}
              multiline
              rows={4}
              sx={{ mb: 2 }}
              placeholder={t('settings.mcpServer.detail.advanced.placeholders.env')}
            />

            <TextField
              fullWidth
              label={t('settings.mcpServer.detail.advanced.args')}
              value={(server.args || []).join('\n')}
              onChange={(e) => {
                const value = e.target.value || '';
                const args = value.split('\n').filter(arg => arg.trim());
                setServer({ ...server, args });
              }}
              multiline
              rows={3}
              placeholder={t('settings.mcpServer.detail.advanced.placeholders.args')}
            />
          </AccordionDetails>
        </Accordion>

        {/* 工具列表 */}
        {server.isActive && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildIcon />
                {t('settings.mcpServer.detail.tools.title')} ({tools.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : tools.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {t('settings.mcpServer.detail.tools.empty')}
                </Typography>
              ) : (
                <List>
                  {tools.map((tool, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={tool.name}
                        secondary={tool.description || t('settings.mcpServer.detail.tools.noDescription')}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* 提示词列表 */}
        {server.isActive && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon />
                {t('settings.mcpServer.detail.prompts.title')} ({prompts.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : prompts.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {t('settings.mcpServer.detail.prompts.empty')}
                </Typography>
              ) : (
                <List>
                  {prompts.map((prompt, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={prompt.name}
                        secondary={prompt.description || t('settings.mcpServer.detail.prompts.noDescription')}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* 资源列表 */}
        {server.isActive && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon />
                {t('settings.mcpServer.detail.resources.title')} ({resources.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : resources.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {t('settings.mcpServer.detail.resources.empty')}
                </Typography>
              ) : (
                <List>
                  {resources.map((resource, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={resource.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {resource.description || t('settings.mcpServer.detail.resources.noDescription')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('settings.mcpServer.detail.resources.uri')}: {resource.uri}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MCPServerDetail;
