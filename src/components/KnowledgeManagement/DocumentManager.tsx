/**
 * 文档管理器组件 v2.1
 * 支持拖拽上传、处理状态追踪、刷新/重试功能、虚拟列表
 * 兼容 Capacitor 移动端和 Tauri 桌面端
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  Divider,
  LinearProgress,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Collapse,
} from '@mui/material';
import BackButtonDialog from '../common/BackButtonDialog';
import {
  File as InsertDriveFileIcon,
  Search as SearchIcon,
  Trash2 as DeleteIcon,
  X as CloseIcon,
  RefreshCw as RefreshIcon,
  ChevronDown as ExpandIcon,
  ChevronUp as CollapseIcon,
} from 'lucide-react';

import { MobileKnowledgeService } from '../../shared/services/knowledge/MobileKnowledgeService';
import { fileParserService } from '../../shared/services/knowledge/FileParserService';
import type { KnowledgeDocument, ProcessingStatus } from '../../shared/types/KnowledgeBase';
import FileDropZone, { type FileInfo } from './FileDropZone';
import ProcessingStatusIcon from './ProcessingStatusIcon';
import { v4 as uuidv4 } from 'uuid';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DocumentManagerProps {
  knowledgeBaseId: string;
  onDocumentsAdded?: () => void;
}

interface ProgressState {
  active: boolean;
  current: number;
  total: number;
  currentFileName?: string;
  currentFileProgress?: number; // 单文件处理进度 0-100
  currentStage?: 'reading' | 'parsing' | 'chunking' | 'embedding' | 'saving'; // 当前处理阶段
}

// 文档项状态管理（内存中）
interface DocumentItemState {
  id: string;
  fileName: string;
  fileSize: number;
  fileContent: string;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  retryCount: number;
  chunkIds: string[];
  created_at: number;
}

const MAX_RETRY_COUNT = 3;

const DocumentManager: React.FC<DocumentManagerProps> = ({
  knowledgeBaseId,
  onDocumentsAdded,
}) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [documentItems, setDocumentItems] = useState<DocumentItemState[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    current: 0,
    total: 0,
  });
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const knowledgeService = MobileKnowledgeService.getInstance();

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // 获取文件扩展名
  const getFileExtension = useCallback((fileName: string): string => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'TXT';
    return ext;
  }, []);

  // 格式化时间
  const formatTime = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  }, []);

  // 获取处理阶段文本
  const getStageText = useCallback((stage?: string): string => {
    switch (stage) {
      case 'reading': return '读取文件...';
      case 'parsing': return '解析内容...';
      case 'chunking': return '分块处理...';
      case 'embedding': return '向量化...';
      case 'saving': return '保存中...';
      default: return '处理中...';
    }
  }, []);

  // 检查是否为二进制文件
  const isBinaryFile = useCallback((fileName: string): boolean => {
    const ext = '.' + (fileName.split('.').pop()?.toLowerCase() || '');
    const binaryExts = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.epub', '.rtf', '.odt'];
    return binaryExts.includes(ext);
  }, []);

  // 加载文档列表
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await knowledgeService.getDocumentsByKnowledgeBaseId(knowledgeBaseId);
      setDocuments(docs);
    } catch (err) {
      console.error('加载文档失败:', err);
      setError('无法加载文档列表，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, [knowledgeBaseId, knowledgeService]);

  useEffect(() => {
    if (knowledgeBaseId) {
      loadDocuments();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [knowledgeBaseId, loadDocuments]);

  // 更新文档项状态
  const updateDocumentItemStatus = useCallback((
    itemId: string,
    updates: Partial<DocumentItemState>
  ) => {
    setDocumentItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  // 处理单个文档（带细化进度，支持二进制文件解析）
  const processDocument = useCallback(async (item: DocumentItemState & { arrayBuffer?: ArrayBuffer }) => {
    updateDocumentItemStatus(item.id, { status: 'processing', progress: 0 });

    try {
      let contentToProcess = item.fileContent;

      // 阶段1: 读取文件 (0-10%)
      setProgress(prev => ({
        ...prev,
        currentFileProgress: 5,
        currentStage: 'reading',
      }));
      updateDocumentItemStatus(item.id, { progress: 5 });
      await new Promise(resolve => setTimeout(resolve, 50));
      updateDocumentItemStatus(item.id, { progress: 10 });
      setProgress(prev => ({ ...prev, currentFileProgress: 10 }));

      // 阶段2: 解析内容 (10-30%) - 仅二进制文件需要
      if (isBinaryFile(item.fileName)) {
        setProgress(prev => ({
          ...prev,
          currentFileProgress: 15,
          currentStage: 'parsing',
        }));
        updateDocumentItemStatus(item.id, { progress: 15 });

        try {
          // 使用 FileParserService 解析二进制文件
          const arrayBuffer = item.arrayBuffer || 
            (item.fileContent ? Uint8Array.from(atob(item.fileContent), c => c.charCodeAt(0)).buffer : null);
          
          if (arrayBuffer) {
            const parsed = await fileParserService.parseFile(
              arrayBuffer,
              item.fileName
            );
            contentToProcess = parsed.content;
          }
        } catch (parseErr) {
          console.warn('文件解析失败，使用原始内容:', parseErr);
          // 解析失败时使用提示信息
          contentToProcess = `[${item.fileName}]\n\n此文件格式需要额外依赖才能解析。\n\n${parseErr instanceof Error ? parseErr.message : '解析失败'}`;
        }

        updateDocumentItemStatus(item.id, { progress: 30 });
        setProgress(prev => ({ ...prev, currentFileProgress: 30 }));
      } else {
        updateDocumentItemStatus(item.id, { progress: 30 });
        setProgress(prev => ({ ...prev, currentFileProgress: 30 }));
      }

      // 阶段3: 分块处理 (30-50%)
      setProgress(prev => ({
        ...prev,
        currentFileProgress: 40,
        currentStage: 'chunking',
      }));
      updateDocumentItemStatus(item.id, { progress: 40 });
      await new Promise(resolve => setTimeout(resolve, 50));
      updateDocumentItemStatus(item.id, { progress: 50 });
      setProgress(prev => ({ ...prev, currentFileProgress: 50 }));

      // 阶段4: 向量化 (50-85%)
      setProgress(prev => ({
        ...prev,
        currentFileProgress: 60,
        currentStage: 'embedding',
      }));
      updateDocumentItemStatus(item.id, { progress: 60 });

      // 添加到知识库
      await knowledgeService.addDocument({
        knowledgeBaseId,
        content: contentToProcess,
        metadata: {
          source: item.fileName,
          fileName: item.fileName,
        }
      });

      updateDocumentItemStatus(item.id, { progress: 85 });
      setProgress(prev => ({ ...prev, currentFileProgress: 85 }));

      // 阶段5: 保存 (85-100%)
      setProgress(prev => ({
        ...prev,
        currentFileProgress: 95,
        currentStage: 'saving',
      }));
      updateDocumentItemStatus(item.id, { progress: 95 });
      await new Promise(resolve => setTimeout(resolve, 50));

      updateDocumentItemStatus(item.id, { 
        status: 'completed', 
        progress: 100 
      });
      setProgress(prev => ({ ...prev, currentFileProgress: 100 }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理失败';
      updateDocumentItemStatus(item.id, {
        status: 'failed',
        error: errorMessage,
        retryCount: item.retryCount + 1,
      });
      return false;
    }
  }, [knowledgeBaseId, knowledgeService, updateDocumentItemStatus]);

  // 处理文件选择（来自拖拽区域）
  const handleFilesSelected = useCallback(async (files: FileInfo[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress({
      active: true,
      current: 0,
      total: files.length,
    });

    // 创建文档项
    const newItems: DocumentItemState[] = files.map(file => ({
      id: uuidv4(),
      fileName: file.name,
      fileSize: file.size,
      fileContent: file.content || '',
      status: 'pending' as ProcessingStatus,
      progress: 0,
      retryCount: 0,
      chunkIds: [],
      created_at: Date.now(),
    }));

    setDocumentItems(prev => [...prev, ...newItems]);

    // 依次处理每个文档
    let successCount = 0;
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      setProgress(prev => ({
        ...prev,
        current: i,
        currentFileName: item.fileName,
      }));

      const success = await processDocument(item);
      if (success) successCount++;

      setProgress(prev => ({
        ...prev,
        current: i + 1,
      }));
    }

    // 完成后重新加载文档
    await loadDocuments();
    
    if (onDocumentsAdded && successCount > 0) {
      onDocumentsAdded();
    }

    setUploading(false);
    setProgress({
      active: false,
      current: 0,
      total: 0,
    });

    // 清理已完成的项目
    setDocumentItems(prev => prev.filter(item => item.status !== 'completed'));
  }, [processDocument, loadDocuments, onDocumentsAdded]);

  // 重试失败的文档
  const handleRetryDocument = useCallback(async (itemId: string) => {
    const item = documentItems.find(i => i.id === itemId);
    if (!item || item.retryCount >= MAX_RETRY_COUNT) {
      setError(`文档 ${item?.fileName || ''} 已达到最大重试次数`);
      return;
    }

    await processDocument(item);
    await loadDocuments();
  }, [documentItems, processDocument, loadDocuments]);

  // 删除文档
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await knowledgeService.deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      console.error('删除文档失败:', err);
      setError('删除文档失败，请稍后再试');
    }
  }, [knowledgeService, loadDocuments]);

  // 删除失败的文档项
  const handleRemoveFailedItem = useCallback((itemId: string) => {
    setDocumentItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // 一键清理所有文档
  const handleClearAllDocuments = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all(documents.map(doc => knowledgeService.deleteDocument(doc.id)));
      await loadDocuments();
      setDocumentItems([]);
    } catch (err) {
      console.error('清理文档失败:', err);
      setError('清理文档失败，请稍后再试');
    } finally {
      setClearAllDialogOpen(false);
      setLoading(false);
    }
  }, [documents, knowledgeService, loadDocuments]);

  // 刷新文档（重新向量化）
  const handleRefreshDocument = useCallback(async (doc: KnowledgeDocument) => {
    try {
      // 删除旧的向量
      await knowledgeService.deleteDocument(doc.id);
      
      // 创建新的文档项进行处理
      const newItem: DocumentItemState = {
        id: uuidv4(),
        fileName: doc.metadata.fileName || doc.metadata.source,
        fileSize: doc.content.length,
        fileContent: doc.content,
        status: 'pending',
        progress: 0,
        retryCount: 0,
        chunkIds: [],
        created_at: Date.now(),
      };

      setDocumentItems(prev => [...prev, newItem]);
      await processDocument(newItem);
      await loadDocuments();
      
      // 清理已完成的项目
      setDocumentItems(prev => prev.filter(item => item.status !== 'completed'));
    } catch (err) {
      console.error('刷新文档失败:', err);
      setError('刷新文档失败，请稍后再试');
    }
  }, [knowledgeService, processDocument, loadDocuments]);

  // 搜索处理
  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  // 过滤文档（使用 useMemo 优化）
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (!searchTerm) return true;
      const searchTermLower = searchTerm.toLowerCase();
      return (
        doc.content.toLowerCase().includes(searchTermLower) ||
        doc.metadata.fileName?.toLowerCase().includes(searchTermLower) ||
        doc.metadata.source.toLowerCase().includes(searchTermLower)
      );
    });
  }, [documents, searchTerm]);

  // 按文件名分组文档（同一文件的多个块）
  const groupedDocuments = useMemo(() => {
    const groups = new Map<string, KnowledgeDocument[]>();
    filteredDocuments.forEach(doc => {
      const key = doc.metadata.fileName || doc.metadata.source;
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, doc]);
    });
    return Array.from(groups.entries()).map(([fileName, docs]) => ({
      fileName,
      docs: docs.sort((a, b) => (a.metadata.chunkIndex || 0) - (b.metadata.chunkIndex || 0)),
      totalSize: docs.reduce((sum, d) => sum + d.content.length, 0),
      timestamp: Math.max(...docs.map(d => d.metadata.timestamp)),
    }));
  }, [filteredDocuments]);

  // 虚拟列表配置（必须在 groupedDocuments 之后定义）
  const virtualizer = useVirtualizer({
    count: groupedDocuments.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 72, // 预估每行高度
    overscan: 5, // 预渲染行数
  });

  // 获取处理中和失败的项目
  const processingItems = documentItems.filter(item => 
    item.status === 'processing' || item.status === 'pending'
  );
  const failedItems = documentItems.filter(item => item.status === 'failed');

  return (
    <Box sx={{ width: '100%', overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
      {/* 拖拽上传区域 */}
      <Box sx={{ mb: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1 
          }}
        >
          <Typography variant="subtitle2" color="textSecondary">
            文件上传
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowDropZone(!showDropZone)}
          >
            {showDropZone ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
          </IconButton>
        </Box>
        
        <Collapse in={showDropZone}>
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            disabled={uploading}
            accept=".txt,.md,.csv,.json,.html,.xml"
            multiple
          />
        </Collapse>
      </Box>

      {/* 上传进度（细化显示） */}
      {progress.active && (
        <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              处理文件 ({progress.current}/{progress.total})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round((progress.current / progress.total) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(progress.current / progress.total) * 100}
            sx={{ mb: 1.5, height: 6, borderRadius: 3 }}
          />
          
          {/* 当前文件进度 */}
          {progress.currentFileName && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" noWrap sx={{ maxWidth: '60%' }}>
                  {progress.currentFileName}
                </Typography>
                <Chip 
                  label={getStageText(progress.currentStage)} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.currentFileProgress || 0}
                sx={{ height: 4, borderRadius: 2 }}
                color="secondary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* 处理中的项目 */}
      {processingItems.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 2, p: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            处理中 ({processingItems.length})
          </Typography>
          <List dense>
            {processingItems.map(item => (
              <ListItem key={item.id}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <ProcessingStatusIcon 
                    status={item.status} 
                    progress={item.progress}
                    size={20}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={item.fileName}
                  secondary={`${(item.fileSize / 1024).toFixed(1)} KB`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 失败的项目 */}
      {failedItems.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              size="small" 
              onClick={() => setDocumentItems(prev => 
                prev.filter(item => item.status !== 'failed')
              )}
            >
              清除全部
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            处理失败 ({failedItems.length})
          </Typography>
          {failedItems.map(item => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2">{item.fileName}</Typography>
              <ProcessingStatusIcon
                status="failed"
                error={item.error}
                onRetry={item.retryCount < MAX_RETRY_COUNT 
                  ? () => handleRetryDocument(item.id) 
                  : undefined
                }
                size={16}
              />
              <IconButton 
                size="small" 
                onClick={() => handleRemoveFailedItem(item.id)}
              >
                <CloseIcon size={14} />
              </IconButton>
            </Box>
          ))}
        </Alert>
      )}

      {/* 错误消息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 搜索和操作栏 */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField
          placeholder="搜索文档..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearch}
          disabled={loading}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setSearchTerm('')}
                    size="small"
                  >
                    <CloseIcon size={20} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }
          }}
        />

        {documents.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon size={16} />}
            onClick={() => setClearAllDialogOpen(true)}
            disabled={uploading || loading}
            sx={{ whiteSpace: 'nowrap' }}
          >
            清理全部
          </Button>
        )}
      </Stack>

      {/* 文档统计 */}
      {groupedDocuments.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            共 {groupedDocuments.length} 个文件，{filteredDocuments.length} 个块
          </Typography>
          <Typography variant="caption" color="text.secondary">
            总大小: {formatFileSize(filteredDocuments.reduce((sum, d) => sum + d.content.length, 0))}
          </Typography>
        </Box>
      )}

      {/* 文档列表（虚拟化） */}
      <Paper variant="outlined">
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress size={32} />
            <Typography ml={2} variant="body1">加载文档中...</Typography>
          </Box>
        ) : groupedDocuments.length > 0 ? (
          <Box
            ref={listContainerRef}
            sx={{
              height: 400,
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { 
                backgroundColor: 'action.disabled',
                borderRadius: 3,
              },
            }}
          >
            <Box
              sx={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const group = groupedDocuments[virtualRow.index];
                const firstDoc = group.docs[0];
                const ext = getFileExtension(group.fileName);
                
                return (
                  <Box
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {virtualRow.index > 0 && <Divider />}
                    <ListItem
                      sx={{ py: 1.5 }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            onClick={() => handleRefreshDocument(firstDoc)}
                            size="small"
                            title="重新处理"
                          >
                            <RefreshIcon size={18} />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              // 删除该文件的所有块
                              group.docs.forEach(d => handleDeleteDocument(d.id));
                            }}
                            size="small"
                            title="删除"
                          >
                            <DeleteIcon size={18} />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <InsertDriveFileIcon size={20} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              noWrap
                              sx={{ maxWidth: 200 }}
                            >
                              {group.fileName}
                            </Typography>
                            <Chip
                              label={ext}
                              size="small"
                              sx={{ 
                                height: 18, 
                                fontSize: '0.65rem',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(group.totalSize)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {group.docs.length} 块
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(group.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Box p={4} textAlign="center">
            <Typography color="textSecondary">
              {searchTerm ? '没有找到匹配的文档' : '暂无文档，请拖拽文件上传'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 清理确认对话框 */}
      <BackButtonDialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
      >
        <DialogTitle>确认清理所有文档</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除知识库中的所有 {documents.length} 个文档吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialogOpen(false)}>
            取消
          </Button>
          <Button onClick={handleClearAllDocuments} color="error">
            清理全部
          </Button>
        </DialogActions>
      </BackButtonDialog>
    </Box>
  );
};

export default DocumentManager;
