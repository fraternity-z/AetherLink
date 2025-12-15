/**
 * 统一导出/保存菜单组件
 * 合并了：保存为笔记、分享文件、导出信息 三个功能
 * 支持多端：Tauri桌面端、Capacitor移动端、鸿蒙端
 * 使用底部上拉式抽屉，移动端更友好
 */
import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Divider,
  Typography,
  alpha
} from '@mui/material';
import BackButtonDrawer from '../common/BackButtonDrawer';
import {
  FileDown,
  Copy,
  Share,
  FileText,
  Brain,
  ExternalLink,
  Image,
  NotebookPen,
  Save
} from 'lucide-react';
import type { Message } from '../../shared/types/newMessage';
import {
  exportMessageAsMarkdown,
  copyMessageAsMarkdown,
  shareMessage,
  exportToObsidian,
  captureMessageAsImage,
  exportMessageAsImage,
  shareContentAsFile
} from '../../utils/exportUtils';
import { toastManager } from '../EnhancedToast';
import { simpleNoteService } from '../../shared/services/notes/SimpleNoteService';
import { getMainTextContent } from '../../shared/utils/messageUtils';
import { useNavigate } from 'react-router-dom';
import { getPlatformInfo } from '../../shared/utils/platformDetection';

interface UnifiedExportMenuProps {
  message: Message;
  open: boolean;
  onClose: () => void;
}

interface ObsidianDialogState {
  open: boolean;
  vault: string;
  folder: string;
  processingMethod: '1' | '2' | '3';
  includeReasoning: boolean;
}

// 使用统一的平台检测工具 (src/shared/utils/platformDetection.ts)
// getPlatformInfo() 返回 { isMobile, isDesktop, isWeb, isTauri, isCapacitor, isHarmonyOS, ... }

export const UnifiedExportMenu: React.FC<UnifiedExportMenuProps> = ({
  message,
  open,
  onClose
}) => {
  const navigate = useNavigate();
  const platform = getPlatformInfo();
  
  const [obsidianDialog, setObsidianDialog] = useState<ObsidianDialogState>({
    open: false,
    vault: '',
    folder: '',
    processingMethod: '3',
    includeReasoning: false
  });

  // ========== 保存为笔记 ==========
  const handleSaveToNote = async () => {
    onClose();
    try {
      // 检查笔记功能是否配置
      const hasConfig = await simpleNoteService.hasValidConfig();
      if (!hasConfig) {
        toastManager.warning('请先在设置中配置笔记存储目录', '未配置笔记');
        navigate('/settings/notes');
        return;
      }

      // 获取消息内容
      const textContent = getMainTextContent(message);
      if (!textContent || !textContent.trim()) {
        toastManager.warning('没有可保存的内容', '提示');
        return;
      }

      // 生成笔记标题
      const contentPreview = textContent
        .trim()
        .replace(/[\r\n]+/g, ' ')
        .substring(0, 30)
        .replace(/[\\/:*?"<>|！？。，、；：""''【】（）\s]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/[/\s:]/g, '-');
      const noteTitle = contentPreview || `消息-${timestamp}`;

      // 添加来源标记
      const roleLabel = message.role === 'user' ? '👤 用户' : '🤖 AI';
      const noteContent = `# ${roleLabel}\n\n${textContent}\n\n---\n*保存时间: ${new Date().toLocaleString('zh-CN')}*`;

      // 保存到笔记根目录
      await simpleNoteService.createNote('', noteTitle, noteContent);
      
      toastManager.success('已保存到笔记', '成功');
    } catch (error) {
      console.error('保存为笔记失败:', error);
      toastManager.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'), '错误');
    }
  };

  // ========== 分享为文件 ==========
  const handleShareAsFile = async () => {
    onClose();
    try {
      await shareContentAsFile(message);
    } catch (error) {
      console.error('分享文件失败:', error);
      toastManager.error('分享失败', '操作失败');
    }
  };

  // ========== Markdown 相关 ==========
  const handleExportMarkdown = async (includeReasoning = false) => {
    onClose();
    await exportMessageAsMarkdown(message, includeReasoning);
  };

  const handleCopyMarkdown = async (includeReasoning = false) => {
    onClose();
    await copyMessageAsMarkdown(message, includeReasoning);
  };

  // ========== 分享相关 ==========
  const handleShare = async (format: 'text' | 'markdown' = 'text') => {
    onClose();
    await shareMessage(message, format);
  };

  // ========== Obsidian 相关 ==========
  const handleObsidianExport = () => {
    onClose();
    setObsidianDialog(prev => ({ ...prev, open: true }));
  };

  const handleObsidianConfirm = async () => {
    await exportToObsidian(message, {
      vault: obsidianDialog.vault || undefined,
      folder: obsidianDialog.folder || undefined,
      processingMethod: obsidianDialog.processingMethod,
      includeReasoning: obsidianDialog.includeReasoning
    });
    setObsidianDialog(prev => ({ ...prev, open: false }));
  };

  const handleObsidianCancel = () => {
    setObsidianDialog(prev => ({ ...prev, open: false }));
  };

  // ========== 图片相关 ==========
  const handleCaptureImage = async () => {
    onClose();
    const messageElement = document.getElementById(`message-${message.id}`) as HTMLElement;
    if (messageElement) {
      await captureMessageAsImage(messageElement);
    } else {
      toastManager.error('无法找到消息元素', '操作失败');
    }
  };

  const handleExportImage = async () => {
    onClose();
    const messageElement = document.getElementById(`message-${message.id}`) as HTMLElement;
    if (messageElement) {
      await exportMessageAsImage(messageElement);
    } else {
      toastManager.error('无法找到消息元素', '操作失败');
    }
  };

  return (
    <>
      {/* 底部上拉式抽屉 - 移动端更友好 */}
      <BackButtonDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
            bgcolor: 'background.paper',
            pb: 'var(--safe-area-bottom-computed, 0px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 拖拽指示器 */}
          <Box sx={{ pt: 1, pb: 1, display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 4,
                bgcolor: (theme) => alpha(theme.palette.text.primary, 0.2),
                borderRadius: 999
              }}
            />
          </Box>

          {/* 标题 */}
          <Typography
            variant="subtitle1"
            sx={{ px: 2, pb: 1, fontWeight: 'bold', textAlign: 'center' }}
          >
            导出/保存
          </Typography>

          {/* 滚动内容区 */}
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <List dense disablePadding>
              {/* ===== 快捷保存区 ===== */}
              <ListItem disablePadding>
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}
                >
                  快捷保存
                </Typography>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={handleSaveToNote}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <NotebookPen size={20} />
                  </ListItemIcon>
                  <ListItemText primary="保存为笔记" secondary="保存到应用笔记" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={handleShareAsFile}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Save size={20} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={platform.isMobile ? "分享为文件" : "下载为文件"} 
                    secondary={platform.isMobile ? "通过系统分享保存" : "保存为TXT文件"} 
                  />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              {/* ===== Markdown区 ===== */}
              <ListItem disablePadding>
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}
                >
                  Markdown
                </Typography>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleCopyMarkdown(false)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Copy size={20} />
                  </ListItemIcon>
                  <ListItemText primary="复制为Markdown" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleCopyMarkdown(true)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Brain size={20} />
                  </ListItemIcon>
                  <ListItemText primary="复制Markdown（含思考）" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleExportMarkdown(false)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FileDown size={20} />
                  </ListItemIcon>
                  <ListItemText primary={platform.isMobile ? "分享Markdown文件" : "下载Markdown文件"} />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleExportMarkdown(true)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FileText size={20} />
                  </ListItemIcon>
                  <ListItemText primary={platform.isMobile ? "分享Markdown（含思考）" : "下载Markdown（含思考）"} />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              {/* ===== 图片区 ===== */}
              <ListItem disablePadding>
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}
                >
                  图片
                </Typography>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={handleCaptureImage}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Copy size={20} />
                  </ListItemIcon>
                  <ListItemText primary={platform.isMobile ? "分享为图片" : "复制为图片"} />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={handleExportImage}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Image size={20} />
                  </ListItemIcon>
                  <ListItemText primary={platform.isMobile ? "保存图片" : "下载图片"} />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              {/* ===== 分享区 ===== */}
              <ListItem disablePadding>
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}
                >
                  分享
                </Typography>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleShare('text')}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Share size={20} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="分享文本" 
                    secondary={platform.isMobile ? "通过系统分享" : "复制到剪贴板"} 
                  />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleShare('markdown')}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Share size={20} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="分享Markdown" 
                    secondary={platform.isMobile ? "通过系统分享" : "复制到剪贴板"} 
                  />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              {/* ===== 第三方应用区 ===== */}
              <ListItem disablePadding>
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}
                >
                  第三方应用
                </Typography>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={handleObsidianExport}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ExternalLink size={20} />
                  </ListItemIcon>
                  <ListItemText primary="导出到Obsidian" secondary="通过URL Scheme" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </BackButtonDrawer>

      {/* Obsidian导出对话框 */}
      <Dialog
        open={obsidianDialog.open}
        onClose={handleObsidianCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>导出到Obsidian</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Vault名称（可选）"
            value={obsidianDialog.vault}
            onChange={(e) => setObsidianDialog(prev => ({ ...prev, vault: e.target.value }))}
            margin="normal"
            helperText="留空将使用默认Vault"
          />

          <TextField
            fullWidth
            label="文件夹路径（可选）"
            value={obsidianDialog.folder}
            onChange={(e) => setObsidianDialog(prev => ({ ...prev, folder: e.target.value }))}
            margin="normal"
            helperText="例如: Notes/AI对话"
          />

          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">处理方式</FormLabel>
            <RadioGroup
              value={obsidianDialog.processingMethod}
              onChange={(e) => setObsidianDialog(prev => ({
                ...prev,
                processingMethod: e.target.value as '1' | '2' | '3'
              }))}
            >
              <FormControlLabel value="3" control={<Radio />} label="新建文件（存在则覆盖）" />
              <FormControlLabel value="1" control={<Radio />} label="追加到文件末尾" />
              <FormControlLabel value="2" control={<Radio />} label="插入到文件开头" />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">内容选项</FormLabel>
            <RadioGroup
              value={obsidianDialog.includeReasoning ? 'true' : 'false'}
              onChange={(e) => setObsidianDialog(prev => ({
                ...prev,
                includeReasoning: e.target.value === 'true'
              }))}
            >
              <FormControlLabel value="false" control={<Radio />} label="仅导出回答内容" />
              <FormControlLabel value="true" control={<Radio />} label="包含思考过程" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleObsidianCancel}>取消</Button>
          <Button onClick={handleObsidianConfirm} variant="contained">
            导出
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UnifiedExportMenu;
