import React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Box,
  Chip,
  Divider
} from '@mui/material';
import BackButtonDialog from '../../../../../components/common/BackButtonDialog';
import { Settings as SettingsIcon, MessageSquare, Bot, Sliders } from 'lucide-react';
import { useTranslation } from '../../../../../i18n';
import CustomSwitch from '../../../../../components/CustomSwitch';
import type { SelectiveBackupOptions } from '../../utils/selectiveBackupUtils';

interface SelectiveBackupDialogProps {
  open: boolean;
  options: SelectiveBackupOptions;
  isLoading: boolean;
  onClose: () => void;
  onOptionChange: (option: keyof SelectiveBackupOptions) => void;
  onBackup: () => void;
}

/**
 * 选择性备份对话框组件
 */
const SelectiveBackupDialog: React.FC<SelectiveBackupDialogProps> = ({
  open,
  options,
  isLoading,
  onClose,
  onOptionChange,
  onBackup
}) => {
  const { t } = useTranslation();
  // 检查是否有选中的选项
  const isAnyOptionSelected = Object.values(options).some(value => value);
  
  return (
    <BackButtonDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <SettingsIcon size={24} color="#9333EA" />
        {t('dataSettings.selectiveBackupDialog.title')}
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('dataSettings.selectiveBackupDialog.description')}
        </Typography>
        
        <FormGroup sx={{ gap: 1 }}>
          {/* 模型配置选项 */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: options.modelConfig ? 'primary.main' : 'divider',
            bgcolor: options.modelConfig ? 'rgba(147, 51, 234, 0.04)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <FormControlLabel
              control={
                <CustomSwitch 
                  checked={options.modelConfig} 
                  onChange={() => onOptionChange('modelConfig')}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon size={18} color="#9333EA" />
                  <Typography variant="body2" fontWeight={500}>
                    {t('dataSettings.selectiveBackupDialog.modelConfig.label')}
                  </Typography>
                  <Chip 
                    label={t('dataSettings.selectiveBackupDialog.modelConfig.recommended')} 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: '0.65rem',
                      bgcolor: '#9333EA',
                      color: 'white'
                    }} 
                  />
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: 'block', mt: 0.5 }}>
              {t('dataSettings.selectiveBackupDialog.modelConfig.hint')}
            </Typography>
          </Box>

          {/* 聊天记录选项 */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: options.chatHistory ? 'primary.main' : 'divider',
            bgcolor: options.chatHistory ? 'rgba(147, 51, 234, 0.04)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <FormControlLabel
              control={
                <CustomSwitch 
                  checked={options.chatHistory} 
                  onChange={() => onOptionChange('chatHistory')}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MessageSquare size={18} color="#2563EB" />
                  <Typography variant="body2" fontWeight={500}>
                    {t('dataSettings.selectiveBackupDialog.chatHistory.label')}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: 'block', mt: 0.5 }}>
              {t('dataSettings.selectiveBackupDialog.chatHistory.hint')}
            </Typography>
          </Box>

          {/* 助手配置选项 */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: options.assistants ? 'primary.main' : 'divider',
            bgcolor: options.assistants ? 'rgba(147, 51, 234, 0.04)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <FormControlLabel
              control={
                <CustomSwitch 
                  checked={options.assistants} 
                  onChange={() => onOptionChange('assistants')}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bot size={18} color="#059669" />
                  <Typography variant="body2" fontWeight={500}>
                    {t('dataSettings.selectiveBackupDialog.assistants.label')}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: 'block', mt: 0.5 }}>
              {t('dataSettings.selectiveBackupDialog.assistants.hint')}
            </Typography>
          </Box>

          {/* 用户设置选项 */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: options.userSettings ? 'primary.main' : 'divider',
            bgcolor: options.userSettings ? 'rgba(147, 51, 234, 0.04)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <FormControlLabel
              control={
                <CustomSwitch 
                  checked={options.userSettings} 
                  onChange={() => onOptionChange('userSettings')}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sliders size={18} color="#D97706" />
                  <Typography variant="body2" fontWeight={500}>
                    {t('dataSettings.selectiveBackupDialog.userSettings.label')}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: 'block', mt: 0.5 }}>
              {t('dataSettings.selectiveBackupDialog.userSettings.hint')}
            </Typography>
          </Box>
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        {/* 备份提示 */}
        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('dataSettings.selectiveBackupDialog.backupTip')}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={isLoading}
        >
          {t('dataSettings.selectiveBackupDialog.cancel')}
        </Button>
        <Button 
          onClick={onBackup} 
          variant="contained" 
          disabled={isLoading || !isAnyOptionSelected}
          sx={{ 
            bgcolor: "#9333EA", 
            "&:hover": { bgcolor: "#8324DB" },
            "&:disabled": { 
              bgcolor: "grey.300",
              color: "grey.500"
            }
          }}
        >
          {isLoading ? t('dataSettings.selectiveBackupDialog.backingUp') : t('dataSettings.selectiveBackupDialog.createBackup')}
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

export default SelectiveBackupDialog;
