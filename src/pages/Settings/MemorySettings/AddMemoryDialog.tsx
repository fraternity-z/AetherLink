import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import BackButtonDialog from '../../../components/common/BackButtonDialog';

interface AddMemoryDialogProps {
  open: boolean;
  onClose: () => void;
  memoryText: string;
  onMemoryTextChange: (text: string) => void;
  onAdd: () => void;
}

/**
 * 添加记忆对话框
 */
const AddMemoryDialog: React.FC<AddMemoryDialogProps> = ({
  open,
  onClose,
  memoryText,
  onMemoryTextChange,
  onAdd,
}) => {
  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>添加记忆</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="输入要记住的内容..."
          value={memoryText}
          onChange={(e) => onMemoryTextChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>取消</Button>
          <Button variant="contained" onClick={onAdd}>添加</Button>
        </Box>
      </Box>
    </BackButtonDialog>
  );
};

export default AddMemoryDialog;
