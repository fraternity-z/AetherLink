import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Camera,
  Search,
  BookOpen,
  Plus,
  Trash2
} from 'lucide-react';
import MCPToolsButton from './chat/MCPToolsButton';

interface ToolsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onNewTopic?: () => void;
  onClearTopic?: () => void;
  onKnowledgeBase?: () => void;
  onImageGeneration?: () => void;
  onWebSearch?: () => void;
  imageGenerationMode?: boolean;
  webSearchActive?: boolean;
  toolsEnabled?: boolean;
  onToolsEnabledChange?: (enabled: boolean) => void;
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onNewTopic,
  onClearTopic,
  onKnowledgeBase,
  onImageGeneration,
  onWebSearch,
  imageGenerationMode = false,
  webSearchActive = false,
  toolsEnabled = true,
  onToolsEnabledChange
}) => {
  const [localClearConfirmMode, setLocalClearConfirmMode] = useState(false);

  // 清空话题确认模式处理
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (localClearConfirmMode) {
      timer = setTimeout(() => {
        setLocalClearConfirmMode(false);
      }, 3000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [localClearConfirmMode]);

  const handleClearTopic = () => {
    if (localClearConfirmMode) {
      onClearTopic?.();
      setLocalClearConfirmMode(false);
      onClose(); // 只有确认清空时才关闭工具栏
    } else {
      setLocalClearConfirmMode(true);
      // 移除这里的 onClose()，保持工具栏打开以显示确认状态
    }
  };

  const handleImageGeneration = () => {
    onImageGeneration?.();
    onClose();
  };

  const handleWebSearch = () => {
    onWebSearch?.();
    onClose();
  };

  const handleKnowledgeBase = () => {
    onKnowledgeBase?.();
    onClose();
  };

  const handleNewTopic = () => {
    onNewTopic?.();
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 200,
          maxHeight: 400,
          '& .MuiMenuItem-root': {
            fontSize: '0.875rem',
            py: 1
          }
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* 通用功能分组 */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          通用功能
        </Typography>
      </Box>
      
      <MenuItem onClick={handleImageGeneration}>
        <ListItemIcon>
          <Camera size={20} color={imageGenerationMode ? '#9C27B0' : undefined} />
        </ListItemIcon>
        <ListItemText primary={imageGenerationMode ? '取消生成图片' : '创建图片'} />
      </MenuItem>
      
      <MenuItem onClick={handleWebSearch}>
        <ListItemIcon>
          <Search size={20} color={webSearchActive ? '#3b82f6' : undefined} />
        </ListItemIcon>
        <ListItemText primary={webSearchActive ? '关闭网页搜索' : '搜索网页'} />
      </MenuItem>
      
      <MenuItem onClick={handleKnowledgeBase}>
        <ListItemIcon>
          <BookOpen size={20} />
        </ListItemIcon>
        <ListItemText primary="知识库" />
      </MenuItem>
      
      <Divider sx={{ my: 1 }} />
      
      <MenuItem onClick={handleNewTopic}>
        <ListItemIcon>
          <Plus size={20} />
        </ListItemIcon>
        <ListItemText primary="新建话题" />
      </MenuItem>
      
      <MenuItem onClick={handleClearTopic}>
        <ListItemIcon>
          <Trash2 size={20} color={localClearConfirmMode ? '#f44336' : undefined} />
        </ListItemIcon>
        <ListItemText 
          primary={localClearConfirmMode ? '确认清空？' : '清空内容'}
          sx={{
            color: localClearConfirmMode ? '#f44336' : 'inherit'
          }}
        />
      </MenuItem>
      
      <Divider sx={{ my: 1 }} />
      
      {/* MCP工具分组 */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          MCP 工具
        </Typography>
      </Box>
      
      <Box sx={{ px: 1 }}>
        <MCPToolsButton
          toolsEnabled={toolsEnabled}
          onToolsEnabledChange={onToolsEnabledChange}
        />
      </Box>
    </Menu>
  );
};

export default ToolsMenu;