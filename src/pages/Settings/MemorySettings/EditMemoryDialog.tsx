import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import BackButtonDialog from '../../../components/common/BackButtonDialog';

interface EditMemoryDialogProps {
  open: boolean;
  onClose: () => void;
  memoryText: string;
  onMemoryTextChange: (text: string) => void;
  onSave: () => void;
}

/**
 * 编辑记忆对话框
 */
const EditMemoryDialog: React.FC<EditMemoryDialogProps> = ({
  open,
  onClose,
  memoryText,
  onMemoryTextChange,
  onSave,
}) => {
  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>编辑记忆</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={memoryText}
          onChange={(e) => onMemoryTextChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>取消</Button>
          <Button variant="contained" onClick={onSave}>保存</Button>
        </Box>
      </Box>
    </BackButtonDialog>
  );
};

export default EditMemoryDialog;
