import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  Card,
  CardMedia,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { Image as ImageIcon, X } from 'lucide-react';
import { cleanupBackgroundImage } from '../../../../shared/utils/backgroundUtils';
import WallpaperEditor from './WallpaperEditor';

export interface AssistantChatBackground {
  enabled: boolean;
  imageUrl: string;
  opacity?: number;
  size?: string;
  position?: string;
  repeat?: string;
  showOverlay?: boolean;
}

export interface BasicSettingsTabProps {
  assistantName: string;
  assistantAvatar: string;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
  chatBackground?: AssistantChatBackground;
  onChatBackgroundChange?: (background: AssistantChatBackground) => void;
}

/**
 * 基础设置 Tab 组件
 * 包含助手头像和名称设置
 */
const BasicSettingsTab: React.FC<BasicSettingsTabProps> = ({
  assistantName,
  assistantAvatar,
  onNameChange,
  onAvatarClick,
  chatBackground,
  onChatBackgroundChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [wallpaperEditorOpen, setWallpaperEditorOpen] = useState(false);

  const currentBackground = chatBackground || { enabled: false, imageUrl: '' };

  const handleRemoveBackground = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onChatBackgroundChange) return;
    
    if (currentBackground.imageUrl) {
      cleanupBackgroundImage(currentBackground.imageUrl);
    }

    onChatBackgroundChange({
      enabled: false,
      imageUrl: ''
    });
  };

  const handleOpenWallpaperEditor = () => {
    setWallpaperEditorOpen(true);
  };

  const handleSaveWallpaper = (background: AssistantChatBackground) => {
    if (onChatBackgroundChange) {
      onChatBackgroundChange(background);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
      {/* 头像 + 名称 水平布局 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2.5
      }}>
        {/* 左侧头像 */}
        <Box 
          onClick={onAvatarClick}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0,
            '&:hover': {
              opacity: 0.9
            }
          }}
        >
          <Avatar
            src={assistantAvatar}
            sx={{
              width: 64,
              height: 64,
              bgcolor: assistantAvatar ? 'transparent' : theme.palette.mode === 'dark' 
                ? 'rgba(100, 100, 150, 0.5)' 
                : 'rgba(180, 190, 220, 0.8)',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.9)' 
                : 'rgba(50, 60, 100, 0.9)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {!assistantAvatar && (assistantName.charAt(0) || '助')}
          </Avatar>
        </Box>

        {/* 右侧名称输入 */}
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="body2" 
            sx={{
              mb: 0.75,
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            助手名称
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={assistantName}
            onChange={onNameChange}
            placeholder="示例助手"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                }
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontSize: isMobile ? '16px' : '0.9rem',
                py: 1.25
              }
            }}
          />
        </Box>
      </Box>

      {/* 聊天壁纸设置 */}
      <Box>
        <Typography 
          variant="body2" 
          sx={{
            mb: 1,
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          聊天壁纸
        </Typography>
        <Typography 
          variant="caption" 
          sx={{
            display: 'block',
            mb: 1.5,
            color: theme.palette.text.disabled,
            fontSize: '0.75rem'
          }}
        >
          助手壁纸优先级高于全局设置
        </Typography>

        {currentBackground.imageUrl ? (
          <Card 
            onClick={handleOpenWallpaperEditor}
            sx={{ 
              width: '100%',
              maxWidth: 200,
              position: 'relative',
              borderRadius: 2,
              overflow: 'visible',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
          >
            <CardMedia
              component="img"
              height="100"
              image={currentBackground.imageUrl}
              alt="壁纸预览"
              sx={{ borderRadius: 2, objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={handleRemoveBackground}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                width: 24,
                height: 24,
                '&:hover': { bgcolor: 'error.dark' },
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <X size={14} />
            </IconButton>
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                bgcolor: 'rgba(0,0,0,0.5)',
                borderRadius: 1,
                px: 0.75,
                py: 0.25
              }}
            >
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.65rem' }}>
                点击编辑
              </Typography>
            </Box>
          </Card>
        ) : (
          <Box
            onClick={handleOpenWallpaperEditor}
            sx={{
              width: '100%',
              height: 100,
              border: '2px dashed',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.02)',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            <ImageIcon 
              size={28} 
              style={{ 
                color: theme.palette.text.disabled, 
                marginBottom: 6 
              }} 
            />
            <Typography variant="caption" color="text.secondary">
              点击上传壁纸
            </Typography>
          </Box>
        )}

        {/* 壁纸编辑器对话框 */}
        <WallpaperEditor
          open={wallpaperEditorOpen}
          onClose={() => setWallpaperEditorOpen(false)}
          onSave={handleSaveWallpaper}
          currentBackground={currentBackground}
        />
      </Box>
    </Box>
  );
};

export default BasicSettingsTab;
