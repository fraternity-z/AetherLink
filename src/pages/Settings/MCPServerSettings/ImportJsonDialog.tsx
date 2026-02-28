import React from 'react';
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography
} from '@mui/material';
import BackButtonDialog from '../../../components/common/BackButtonDialog';
import { useTranslation } from '../../../i18n';

interface ImportJsonDialogProps {
  open: boolean;
  onClose: () => void;
  importJson: string;
  onImportJsonChange: (value: string) => void;
  onImport: () => void;
}

const ImportJsonDialog: React.FC<ImportJsonDialogProps> = ({
  open,
  onClose,
  importJson,
  onImportJsonChange,
  onImport
}) => {
  const { t } = useTranslation();

  return (
    <BackButtonDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('settings.mcpServer.importDialog.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('settings.mcpServer.importDialog.description')}
        </Typography>
        <Box
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            mb: 2,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        >
          {`{
  "mcpServers": {
    "fetch": {
      "type": "sse",
      "url": "https://mcp.api-inference.modelscope.cn/sse/89261d74d6814a"
    },
    "memory": {
      "type": "streamableHttp",
      "url": "https://example.com/mcp/memory"
    }
  }
}`}
        </Box>
        <TextField
          autoFocus
          margin="dense"
          label={t('settings.mcpServer.importDialog.label')}
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={importJson}
          onChange={(e) => onImportJsonChange(e.target.value)}
          placeholder={t('settings.mcpServer.importDialog.placeholder')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('settings.mcpServer.importDialog.cancel')}</Button>
        <Button onClick={onImport} variant="contained" disabled={!importJson.trim()}>
          {t('settings.mcpServer.importDialog.import')}
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

export default ImportJsonDialog;
