import React from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  Slider,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useDialogBackHandler } from '../../../hooks/useDialogBackHandler';

// 侧边栏宽度限制
const SIDEBAR_WIDTH_MIN = 340;
const SIDEBAR_WIDTH_MAX = 800;

interface SidebarWidthDialogProps {
  open: boolean;
  onClose: () => void;
  currentWidth: number;
  onWidthChange: (width: number) => void;
}

const DIALOG_ID = 'sidebar-width-dialog';

/**
 * 侧边栏宽度调整对话框
 * 支持滑块、输入框和快捷预设
 */
const SidebarWidthDialog: React.FC<SidebarWidthDialogProps> = ({
  open,
  onClose,
  currentWidth,
  onWidthChange,
}) => {
  // 使用返回键处理
  const { handleClose } = useDialogBackHandler(DIALOG_ID, open, onClose);

  const handleWidthChange = (newWidth: number) => {
    const validWidth = Math.max(SIDEBAR_WIDTH_MIN, newWidth);
    onWidthChange(validWidth);
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* 点击外部关闭 */}
      <Box
        onClick={handleClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
          bgcolor: 'rgba(0, 0, 0, 0.3)',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1301,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 6,
          p: 2.5,
          width: 280,
        }}
        data-gesture-exclude="true"
      >
        <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1.5 }}>
          侧边栏宽度
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          最小 {SIDEBAR_WIDTH_MIN}px，可自定义输入更大值
        </Typography>
        
        {/* 滑块 */}
        <Slider
          value={currentWidth}
          min={SIDEBAR_WIDTH_MIN}
          max={SIDEBAR_WIDTH_MAX}
          step={10}
          onChange={(_, value) => handleWidthChange(value as number)}
          sx={{
            mb: 2,
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
            },
          }}
        />
        
        {/* 数值输入 */}
        <TextField
          type="number"
          size="small"
          value={currentWidth}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
              handleWidthChange(value);
            }
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
            inputProps: { min: SIDEBAR_WIDTH_MIN, style: { textAlign: 'center' } },
          }}
          sx={{ width: '100%' }}
        />
        
        {/* 快捷预设 */}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
          {[340, 400, 500, 600].map((preset) => (
            <Box
              key={preset}
              onClick={() => handleWidthChange(preset)}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                cursor: 'pointer',
                bgcolor: currentWidth === preset ? 'primary.main' : 'action.hover',
                color: currentWidth === preset ? 'primary.contrastText' : 'text.secondary',
                '&:hover': {
                  bgcolor: currentWidth === preset ? 'primary.dark' : 'action.selected',
                },
                transition: 'all 0.15s',
              }}
            >
              {preset}
            </Box>
          ))}
        </Box>
      </Box>
    </>,
    document.body
  );
};

export default SidebarWidthDialog;
