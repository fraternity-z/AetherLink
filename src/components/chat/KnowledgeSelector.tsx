import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  BookOpen as MenuBookIcon,
  Search as SearchIcon,
  FileText as DocumentIcon,
  X as CloseIcon,
} from 'lucide-react';
import { MobileKnowledgeService } from '../../shared/services/MobileKnowledgeService';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  createdAt: Date;
}

interface KnowledgeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (knowledgeBase: KnowledgeBase, searchResults: any[]) => void;
  searchQuery?: string;
}

const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({
  open,
  onClose,
  onSelect,
  searchQuery = ''
}) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedKB, setSelectedKB] = useState<string>('');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const kbs = await dexieStorage.knowledge_bases.toArray();

      // 获取每个知识库的文档数量
      const kbsWithCount = await Promise.all(
        kbs.map(async (kb) => {
          const docs = await dexieStorage.knowledge_documents
            .where('knowledgeBaseId')
            .equals(kb.id)
            .toArray();

          return {
            id: kb.id,
            name: kb.name,
            description: kb.description,
            documentCount: docs.length,
            createdAt: kb.createdAt
          };
        })
      );

      setKnowledgeBases(kbsWithCount);
    } catch (error) {
      console.error('加载知识库失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索知识库内容
  const handleSearch = async () => {
    if (!selectedKB || !localSearchQuery.trim()) {
      return;
    }

    try {
      setSearchLoading(true);

      // 获取选中知识库的配置
      const selectedKnowledgeBase = knowledgeBases.find(kb => kb.id === selectedKB);
      const limit = selectedKnowledgeBase?.documentCount || 5; // 使用知识库配置的文档数量

      const results = await MobileKnowledgeService.getInstance().searchKnowledge(
        selectedKB,
        localSearchQuery.trim(),
        limit
      );
      setSearchResults(results);
    } catch (error) {
      console.error('搜索知识库失败:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    const selectedKnowledgeBase = knowledgeBases.find(kb => kb.id === selectedKB);
    if (selectedKnowledgeBase) {
      // 如果有搜索结果，传递搜索结果；否则传递空数组表示使用整个知识库
      onSelect(selectedKnowledgeBase, searchResults);
      handleClose();
    }
  };

  // 关闭对话框
  const handleClose = () => {
    setSelectedKB('');
    setLocalSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  // 选择知识库
  const handleSelectKB = (kbId: string) => {
    setSelectedKB(kbId);
    setSearchResults([]);

    // 如果有搜索词，自动搜索
    if (localSearchQuery.trim()) {
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  };

  // 直接使用知识库（双击或长按）
  const handleDirectUse = (kb: any) => {
    onSelect(kb, []);
    handleClose();
  };

  useEffect(() => {
    if (open) {
      loadKnowledgeBases();
      setLocalSearchQuery(searchQuery);
    }
  }, [open, searchQuery]);

  useEffect(() => {
    // 当搜索词变化时，如果已选择知识库，自动搜索
    if (selectedKB && localSearchQuery.trim()) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500); // 防抖

      return () => clearTimeout(timer);
    }
  }, [localSearchQuery, selectedKB]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <MenuBookIcon color="primary" />
          <Typography variant="h6">选择知识库</Typography>
        </Box>
        <IconButton onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* 搜索输入框 */}
        <TextField
          fullWidth
          placeholder="输入搜索内容..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchLoading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* 知识库列表 */}
        <Typography variant="subtitle2" gutterBottom>
          选择知识库 ({knowledgeBases.length})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          单击选择，双击直接使用知识库
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : knowledgeBases.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            暂无知识库，请先创建知识库
          </Alert>
        ) : (
          <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
            {knowledgeBases.map((kb) => (
              <ListItem key={kb.id} disablePadding>
                <ListItemButton
                  selected={selectedKB === kb.id}
                  onClick={() => handleSelectKB(kb.id)}
                  onDoubleClick={() => handleDirectUse(kb)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }
                  }}
                >
                  <ListItemIcon>
                    <MenuBookIcon color={selectedKB === kb.id ? 'inherit' : 'primary'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={kb.name}
                    secondary={
                      <span style={{ display: 'block' }}>
                        {kb.description && (
                          <span style={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.2 }}>
                            {kb.description}
                          </span>
                        )}
                        <span style={{ display: 'inline-block', marginTop: '4px' }}>
                          <Chip
                            size="small"
                            label={`${kb.documentCount} 个文档`}
                            component="span"
                          />
                        </span>
                      </span>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {/* 搜索结果 */}
        {selectedKB && localSearchQuery.trim() && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              搜索结果 ({searchResults.length})
            </Typography>

            {searchResults.length === 0 ? (
              <Alert severity="warning">
                未找到相关内容，请尝试其他关键词
              </Alert>
            ) : (
              <List sx={{ maxHeight: 150, overflow: 'auto' }}>
                {searchResults.map((result, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemIcon>
                      <DocumentIcon size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {result.title || `文档 ${index + 1}`}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="textSecondary">
                          相似度: {(result.similarity * 100).toFixed(1)}%
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedKB}
          startIcon={<MenuBookIcon />}
        >
          使用知识库
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KnowledgeSelector;
