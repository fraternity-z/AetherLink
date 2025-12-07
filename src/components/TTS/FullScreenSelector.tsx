import React, { useState, useMemo, useId } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  Slide,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { ArrowLeft, Search, Check } from 'lucide-react';
import { cssVar } from '../../shared/utils/cssVariables';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';

// 全屏滑动过渡动画
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

export interface SelectorGroup {
  name: string;
  items: { key: string; label: string; subLabel?: string }[];
}

interface FullScreenSelectorProps {
  open: boolean;
  onClose: () => void;
  title: string;
  groups: SelectorGroup[];
  selectedKey: string;
  onSelect: (key: string, label: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

const FullScreenSelector: React.FC<FullScreenSelectorProps> = ({
  open,
  onClose,
  title,
  groups,
  selectedKey,
  onSelect,
  allowEmpty = false,
  emptyLabel = '无',
}) => {
  const [searchText, setSearchText] = useState('');
  
  // 生成唯一的对话框 ID
  const dialogId = useId();
  
  // 使用返回键处理 Hook - 支持 Android 返回键关闭
  const { handleClose } = useDialogBackHandler(`fullscreen-selector-${dialogId}`, open, onClose);
  
  // 主题变量
  const toolbarBg = cssVar('toolbar-bg');
  const toolbarBorder = cssVar('toolbar-border');
  const textPrimary = cssVar('text-primary');
  const textSecondary = cssVar('text-secondary');
  const borderSubtle = cssVar('border-subtle');
  const bgDefault = cssVar('bg-default');
  const bgPaper = cssVar('bg-paper');
  const primaryColor = cssVar('primary');
  const hoverBg = cssVar('hover-bg');

  // 过滤搜索结果
  const filteredGroups = useMemo(() => {
    if (!searchText.trim()) return groups;
    
    const lowerSearch = searchText.toLowerCase();
    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(lowerSearch) ||
        item.key.toLowerCase().includes(lowerSearch) ||
        (item.subLabel && item.subLabel.toLowerCase().includes(lowerSearch))
      ),
    })).filter(group => group.items.length > 0);
  }, [groups, searchText]);

  const handleSelect = (key: string, label: string) => {
    onSelect(key, label);
    onClose();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          backgroundColor: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          // 底部安全区域（顶部由 AppBar 的 className 处理）
          paddingBottom: 'var(--safe-area-bottom, 0px)',
        }
      }}
    >
      {/* 顶部导航栏 */}
      <AppBar
        position="static"
        elevation={0}
        className="status-bar-safe-area"
        sx={{
          backgroundColor: toolbarBg,
          color: textPrimary,
          borderBottom: `1px solid ${toolbarBorder}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2.5 } }}>
          <IconButton
            edge="start"
            onClick={handleClose}
            sx={{
              color: primaryColor,
              mr: 2,
              borderRadius: 2,
              border: `1px solid ${borderSubtle}`,
              '&:hover': { backgroundColor: hoverBg },
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 搜索栏 */}
      <Box sx={{ px: 2, py: 1.5, backgroundColor: bgPaper, borderBottom: `1px solid ${borderSubtle}` }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color={textSecondary} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: bgDefault,
            }
          }}
        />
      </Box>

      {/* 选项列表 */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
        {/* 空选项 */}
        {allowEmpty && !searchText && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Box
              onClick={() => handleSelect('', emptyLabel)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: selectedKey === '' ? hoverBg : 'transparent',
                border: `1px solid ${selectedKey === '' ? primaryColor : borderSubtle}`,
                '&:hover': { backgroundColor: hoverBg },
              }}
            >
              <Typography sx={{ color: textSecondary }}>{emptyLabel}</Typography>
              {selectedKey === '' && <Check size={18} color={primaryColor} />}
            </Box>
          </Box>
        )}

        {/* 分组列表 */}
        {filteredGroups.map((group) => (
          <Box key={group.name} sx={{ mb: 2 }}>
            {/* 分组标题 */}
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                py: 1.5,
                color: textSecondary,
                fontWeight: 600,
                backgroundColor: bgPaper,
                position: 'sticky',
                top: 0,
                zIndex: 1,
                borderBottom: `1px solid ${borderSubtle}`,
              }}
            >
              {group.name}
            </Typography>
            
            {/* 选项网格 */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                px: 2,
                py: 1.5,
              }}
            >
              {group.items.map((item) => {
                const isSelected = selectedKey === item.key;
                return (
                  <Chip
                    key={item.key}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{item.label}</span>
                        {isSelected && <Check size={14} />}
                      </Box>
                    }
                    onClick={() => handleSelect(item.key, item.label)}
                    sx={{
                      height: 'auto',
                      py: 0.8,
                      px: 0.5,
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      backgroundColor: isSelected ? primaryColor : bgPaper,
                      color: isSelected ? '#fff' : textPrimary,
                      border: `1px solid ${isSelected ? primaryColor : borderSubtle}`,
                      '&:hover': {
                        backgroundColor: isSelected ? primaryColor : hoverBg,
                      },
                      '& .MuiChip-label': {
                        px: 1,
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        ))}

        {/* 无搜索结果 */}
        {filteredGroups.length === 0 && searchText && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">
              未找到匹配的选项
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default FullScreenSelector;
