/**
 * 文件拖拽区域组件
 * 支持 Web、Capacitor 移动端、Tauri 桌面端
 */
import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Upload as UploadIcon, File as FileIcon } from 'lucide-react';
import { getPlatformInfo } from '../../shared/utils/platformDetection';
import { ALL_SUPPORTED_EXTENSIONS, SUPPORTED_FILE_EXTENSIONS } from '../../shared/services/knowledge/FileParserService';

// Capacitor 文件选择器
const loadCapacitorFilePicker = async () => {
  try {
    const { FilePicker } = await import('@capawesome/capacitor-file-picker');
    return FilePicker;
  } catch {
    return null;
  }
};

// Tauri 对话框
const loadTauriDialog = async () => {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    return open;
  } catch {
    return null;
  }
};

// Tauri 文件系统
const loadTauriFs = async () => {
  try {
    const fs = await import('@tauri-apps/plugin-fs');
    return fs;
  } catch {
    return null;
  }
};

const DropZoneContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'disabled',
})<{ isDragActive?: boolean; disabled?: boolean }>(({ theme, isDragActive, disabled }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease-in-out',
  backgroundColor: isDragActive 
    ? alpha(theme.palette.primary.main, 0.08)
    : disabled 
      ? alpha(theme.palette.action.disabled, 0.04)
      : 'transparent',
  opacity: disabled ? 0.6 : 1,
  '&:hover': {
    borderColor: disabled ? theme.palette.divider : theme.palette.primary.main,
    backgroundColor: disabled 
      ? alpha(theme.palette.action.disabled, 0.04)
      : alpha(theme.palette.primary.main, 0.04),
  },
}));

const HiddenInput = styled('input')({
  display: 'none',
});

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  content?: string;
  path?: string;
  arrayBuffer?: ArrayBuffer; // 二进制文件的原始数据
}

interface FileDropZoneProps {
  onFilesSelected: (files: FileInfo[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number; // 单位：字节
  children?: React.ReactNode;
}

// 默认支持的文件格式
const DEFAULT_ACCEPT = ALL_SUPPORTED_EXTENSIONS.join(',');

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  disabled = false,
  maxSize = 50 * 1024 * 1024, // 默认50MB（支持更大文件）
  children,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const platformInfo = getPlatformInfo();

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  };

  // 处理 Web/Capacitor Web 的文件
  const processWebFiles = async (files: FileList | File[]): Promise<FileInfo[]> => {
    const fileArray = Array.from(files);
    const processedFiles: FileInfo[] = [];

    for (const file of fileArray) {
      if (maxSize && file.size > maxSize) {
        console.warn(`文件 ${file.name} 超过大小限制`);
        continue;
      }

      try {
        let content: string | undefined;
        let arrayBuffer: ArrayBuffer | undefined;
        
        // 根据文件类型选择读取方式
        if (isBinaryFile(file.name)) {
          // 二进制文件读取为 ArrayBuffer，后续由 FileParserService 解析
          arrayBuffer = await readFileAsArrayBuffer(file);
          // 临时存储为 base64，方便传输
          content = await readFileAsBase64(file);
        } else {
          // 文本文件直接读取
          content = await readFileContent(file);
        }
        
        processedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type || getFileType(file.name),
          content,
          arrayBuffer, // 二进制文件的原始数据
        });
      } catch (err) {
        console.error(`读取文件 ${file.name} 失败:`, err);
      }
    }

    return processedFiles;
  };

  // 获取文件类型
  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      // 文本格式
      txt: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json',
      html: 'text/html',
      xml: 'application/xml',
      yaml: 'text/yaml',
      yml: 'text/yaml',
      // 代码格式
      js: 'text/javascript',
      ts: 'text/typescript',
      jsx: 'text/javascript',
      tsx: 'text/typescript',
      py: 'text/x-python',
      java: 'text/x-java',
      // 文档格式
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      rtf: 'application/rtf',
      // 表格格式
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      // 演示文稿
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      // 电子书
      epub: 'application/epub+zip',
    };
    return typeMap[ext] || 'application/octet-stream';
  };

  // 检查是否为二进制文件（需要特殊处理）
  const isBinaryFile = (fileName: string): boolean => {
    const ext = '.' + (fileName.split('.').pop()?.toLowerCase() || '');
    const binaryExts = [
      ...SUPPORTED_FILE_EXTENSIONS.document.filter(e => e !== '.html' && e !== '.htm'),
      ...SUPPORTED_FILE_EXTENSIONS.spreadsheet,
      ...SUPPORTED_FILE_EXTENSIONS.presentation,
      ...SUPPORTED_FILE_EXTENSIONS.ebook,
    ];
    return binaryExts.includes(ext);
  };

  // 读取二进制文件为 Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // 移除 data URL 前缀
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsDataURL(file);
    });
  };

  // 读取文件为 ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Capacitor 原生文件选择
  const handleCapacitorFilePick = async () => {
    const FilePicker = await loadCapacitorFilePicker();
    if (!FilePicker) return;

    try {
      const result = await FilePicker.pickFiles({
        types: accept.split(',').map(ext => ext.trim().replace('.', '')),
        readData: true,
        limit: multiple ? 0 : 1, // 0 表示不限制数量
      });

      const files: FileInfo[] = result.files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.mimeType || getFileType(file.name),
        content: file.data ? atob(file.data) : undefined,
        path: file.path,
      }));

      onFilesSelected(files);
    } catch (err) {
      console.error('Capacitor 文件选择失败:', err);
    }
  };

  // Tauri 原生文件选择
  const handleTauriFilePick = async () => {
    const openDialog = await loadTauriDialog();
    const fs = await loadTauriFs();
    if (!openDialog || !fs) return;

    try {
      const selected = await openDialog({
        multiple,
        filters: [{
          name: '文本文件',
          extensions: accept.split(',').map(ext => ext.trim().replace('.', '')),
        }],
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      const files: FileInfo[] = [];

      for (const filePath of paths) {
        try {
          const content = await fs.readTextFile(filePath);
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          const stat = await fs.stat(filePath);

          files.push({
            name: fileName,
            size: stat.size,
            type: getFileType(fileName),
            content,
            path: filePath,
          });
        } catch (err) {
          console.error(`读取文件失败: ${filePath}`, err);
        }
      }

      onFilesSelected(files);
    } catch (err) {
      console.error('Tauri 文件选择失败:', err);
    }
  };

  // 处理点击事件
  const handleClick = useCallback(() => {
    if (disabled) return;

    if (platformInfo.isCapacitor && platformInfo.isMobile) {
      handleCapacitorFilePick();
    } else if (platformInfo.isTauri) {
      handleTauriFilePick();
    } else {
      fileInputRef.current?.click();
    }
  }, [disabled, platformInfo]);

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 处理拖拽放下
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const processedFiles = await processWebFiles(files);
      if (processedFiles.length > 0) {
        onFilesSelected(processedFiles);
      }
    }
  }, [disabled, onFilesSelected, maxSize]);

  // 处理文件输入变化
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const processedFiles = await processWebFiles(files);
      if (processedFiles.length > 0) {
        onFilesSelected(processedFiles);
      }
    }
    // 清空输入以允许重复选择相同文件
    e.target.value = '';
  }, [onFilesSelected, maxSize]);

  // 移动端不支持拖拽，显示简化的界面
  const isMobileNative = platformInfo.isCapacitor && platformInfo.isMobile;

  return (
    <DropZoneContainer
      isDragActive={isDragActive}
      disabled={disabled}
      onClick={handleClick}
      onDragEnter={!isMobileNative ? handleDragEnter : undefined}
      onDragLeave={!isMobileNative ? handleDragLeave : undefined}
      onDragOver={!isMobileNative ? handleDragOver : undefined}
      onDrop={!isMobileNative ? handleDrop : undefined}
    >
      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
      />

      {children || (
        <Box sx={{ py: 2 }}>
          <Box sx={{ mb: 2, color: isDragActive ? 'primary.main' : 'text.secondary' }}>
            {isDragActive ? (
              <FileIcon size={48} />
            ) : (
              <UploadIcon size={48} />
            )}
          </Box>
          
          <Typography variant="body1" color={isDragActive ? 'primary' : 'textSecondary'} gutterBottom>
            {isDragActive 
              ? '松开以上传文件' 
              : isMobileNative 
                ? '点击选择文件'
                : '拖拽文件到此处，或点击选择'}
          </Typography>
          
          <Typography variant="caption" color="textSecondary">
            支持 TXT, MD, CSV, JSON, HTML, XML 格式
          </Typography>

          {!isMobileNative && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadIcon size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                disabled={disabled}
              >
                选择文件
              </Button>
            </Box>
          )}
        </Box>
      )}
    </DropZoneContainer>
  );
};

export default FileDropZone;
