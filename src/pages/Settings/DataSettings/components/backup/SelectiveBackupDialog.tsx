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
  Alert,
  AlertTitle,
  Chip
} from '@mui/material';
import BackButtonDialog from '../../../../../components/common/BackButtonDialog';
import { Settings as SettingsIcon } from 'lucide-react';
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
        
        <FormGroup>
          <FormControlLabel
            control={
              <CustomSwitch 
                checked={options.modelConfig} 
                onChange={() => onOptionChange('modelConfig')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {t('dataSettings.selectiveBackupDialog.modelConfig.label')}
                </Typography>
                <Chip 
                  label={t('dataSettings.selectiveBackupDialog.modelConfig.recommended')} 
                  size="small" 
                  color="primary" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: '#9333EA',
                    color: 'white'
                  }} 
                />
              </Box>
            }
          />
        </FormGroup>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" dangerouslySetInnerHTML={{
            __html: `<strong>${t('dataSettings.selectiveBackupDialog.modelConfig.label')}包含：</strong><br/>${t('dataSettings.selectiveBackupDialog.modelConfig.description')}`
          }} />
        </Box>

        {/* 未来扩展区域的占位符 */}
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ bgcolor: 'rgba(147, 51, 234, 0.05)' }}>
            <AlertTitle sx={{ color: '#9333EA' }}>{t('dataSettings.selectiveBackupDialog.comingSoon.title')}</AlertTitle>
            <Typography variant="body2" color="text.secondary">
              {t('dataSettings.selectiveBackupDialog.comingSoon.message')}
            </Typography>
          </Alert>
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
