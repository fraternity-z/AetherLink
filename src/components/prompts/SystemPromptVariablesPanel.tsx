import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Divider,
  Chip,
  IconButton,
  Alert,
  alpha
} from '@mui/material';
import { ChevronDown as ExpandMoreIcon, ChevronUp as ExpandLessIcon, Clock as AccessTimeIcon, MapPin as LocationOnIcon, Info as InfoIcon, Monitor as ComputerIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { updateSettings } from '../../shared/store/slices/settingsSlice';
import {
  getCurrentTimeString,
  getLocationString,
  getOperatingSystemString
} from '../../shared/utils/systemPromptVariables';
import CustomSwitch from '../CustomSwitch';

/**
 * 系统提示词变量注入配置面板
 * 允许用户配置在系统提示词中自动注入的变量
 */
const SystemPromptVariablesPanel: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const [expanded, setExpanded] = useState(false);

  const variableConfig = settings.systemPromptVariables || {
    enableTimeVariable: false,
    enableLocationVariable: false,
    customLocation: '',
    enableOSVariable: false
  };

  // 更新变量配置
  const updateVariableConfig = (updates: Partial<typeof variableConfig>) => {
    dispatch(updateSettings({
      systemPromptVariables: {
        ...variableConfig,
        ...updates
      }
    }));
  };

  // 处理时间变量开关
  const handleTimeVariableToggle = (enabled: boolean) => {
    updateVariableConfig({ enableTimeVariable: enabled });
  };

  // 处理位置变量开关
  const handleLocationVariableToggle = (enabled: boolean) => {
    updateVariableConfig({ enableLocationVariable: enabled });
  };

  // 处理自定义位置输入
  const handleLocationChange = (location: string) => {
    updateVariableConfig({ customLocation: location });
  };

  // 处理操作系统变量开关
  const handleOSVariableToggle = (enabled: boolean) => {
    updateVariableConfig({ enableOSVariable: enabled });
  };

  return (
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
      {/* 面板标题 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          p: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04)
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            🔧 {t('settings.systemPromptVariables.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('settings.systemPromptVariables.description')}
          </Typography>
        </Box>

        {/* 状态指示器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          {variableConfig.enableTimeVariable && (
            <Chip
              icon={<AccessTimeIcon size={13} />}
              label={t('settings.systemPromptVariables.chips.time')}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
          )}
          {variableConfig.enableLocationVariable && (
            <Chip
              icon={<LocationOnIcon size={13} />}
              label={t('settings.systemPromptVariables.chips.location')}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
          )}
          {variableConfig.enableOSVariable && (
            <Chip
              icon={<ComputerIcon size={13} />}
              label={t('settings.systemPromptVariables.chips.system')}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
          )}
          {!variableConfig.enableTimeVariable && !variableConfig.enableLocationVariable && !variableConfig.enableOSVariable && (
            <Typography variant="caption" color="text.secondary">
              {t('settings.systemPromptVariables.disabled')}
            </Typography>
          )}
        </Box>

        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* 配置内容 */}
      {expanded && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            {/* 说明信息 */}
            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{ mb: 2, fontSize: '0.85rem' }}
            >
              {t('settings.systemPromptVariables.infoMessage')}
            </Alert>

          {/* 时间变量配置 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon size={16} />
                  {t('settings.systemPromptVariables.timeVariable.label')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  {t('settings.systemPromptVariables.timeVariable.description', { time: getCurrentTimeString() })}
                </Typography>
              </Box>
              <CustomSwitch
                checked={variableConfig.enableTimeVariable ?? false}
                onChange={(e) => handleTimeVariableToggle(e.target.checked)}
              />
            </Box>

            {variableConfig.enableTimeVariable && (
              <Box sx={{ mt: 1.5, p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('settings.systemPromptVariables.timeVariable.hint')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 位置变量配置 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon size={16} />
                  {t('settings.systemPromptVariables.locationVariable.label')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  {t('settings.systemPromptVariables.locationVariable.description', { location: getLocationString(variableConfig.customLocation) })}
                </Typography>
              </Box>
              <CustomSwitch
                checked={variableConfig.enableLocationVariable ?? false}
                onChange={(e) => handleLocationVariableToggle(e.target.checked)}
              />
            </Box>

            {variableConfig.enableLocationVariable && (
              <Box sx={{ mt: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('settings.systemPromptVariables.locationVariable.placeholder')}
                  value={variableConfig.customLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('settings.systemPromptVariables.locationVariable.hint')}
                    <br />
                    {t('settings.systemPromptVariables.locationVariable.hintEmpty')}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* 操作系统变量配置 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ComputerIcon size={16} />
                  {t('settings.systemPromptVariables.osVariable.label')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  {t('settings.systemPromptVariables.osVariable.description', { os: getOperatingSystemString() })}
                </Typography>
              </Box>
              <CustomSwitch
                checked={variableConfig.enableOSVariable ?? false}
                onChange={(e) => handleOSVariableToggle(e.target.checked)}
              />
            </Box>

            {variableConfig.enableOSVariable && (
              <Box sx={{ mt: 1.5, p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('settings.systemPromptVariables.osVariable.hint')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        </>
      )}
    </Paper>
  );
};

export default SystemPromptVariablesPanel;
