import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  CardActions,
  Divider,
  Avatar,
  IconButton,
  AppBar,
  Toolbar,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import BackButtonDialog from '../../components/common/BackButtonDialog';
import { styled } from '@mui/material/styles';
import {
  Folder,
  Trash2,
  Plus,
  Eye,
  ArrowLeft,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { MobileKnowledgeService } from '../../shared/services/knowledge/MobileKnowledgeService';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import type { KnowledgeBase } from '../../shared/types/KnowledgeBase';
import { useNavigate } from 'react-router-dom';
import { useKnowledge } from '../../components/KnowledgeManagement/KnowledgeProvider';
import CreateKnowledgeDialog from '../../components/KnowledgeManagement/CreateKnowledgeDialog';
import { toastManager } from '../../components/EnhancedToast';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

const Container = styled(SafeAreaContainer)(() => ({
  position: 'relative',
  overflow: 'hidden',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  borderRadius: (theme.shape.borderRadius as number) * 2,
}));

interface KnowledgeStats {
  totalKnowledgeBases: number;
  totalDocuments: number;
  totalVectors: number;
  storageSize: string;
}

const KnowledgeSettings: React.FC = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<KnowledgeStats>({
    totalKnowledgeBases: 0,
    totalDocuments: 0,
    totalVectors: 0,
    storageSize: '0 MB'
  });

  const {
    knowledgeBases,
    isLoading,
    refreshKnowledgeBases
  } = useKnowledge();

  // 导航到详情页
  const handleViewDetails = (id: string) => {
    navigate(`/knowledge/${id}`);
  };

  // 返回到设置页面
  const handleBack = () => {
    navigate('/settings'); // 直接导航到设置页面
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      setLoading(true);
      const documents = await dexieStorage.knowledge_documents.toArray();
      const totalDocuments = documents.length;
      const totalVectors = totalDocuments;
      const avgVectorSize = 1536 * 4;
      const estimatedSize = totalVectors * avgVectorSize;
      const storageSize = formatBytes(estimatedSize);

      setStats({
        totalKnowledgeBases: knowledgeBases.length,
        totalDocuments,
        totalVectors,
        storageSize
      });
    } catch (error) {
      console.error('加载统计信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 初始化加载
  useEffect(() => {
    if (knowledgeBases.length > 0) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeBases]);

  // 打开创建对话框
  const handleOpenDialog = () => {
    setCreateDialogOpen(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
  };

  // 提交表单
  const handleSubmitKnowledgeBase = async (formData: Partial<KnowledgeBase>) => {
    try {
      setLoading(true);
      await MobileKnowledgeService.getInstance().createKnowledgeBase(formData as any);
      handleCloseDialog();
      refreshKnowledgeBases();
      toastManager.success('知识库创建成功！', '创建成功');
    } catch (error) {
      console.error('创建知识库失败:', error);
      toastManager.error('创建失败，请重试', '创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除知识库
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('确认要删除这个知识库吗？此操作将删除所有相关文档，无法撤销。')) {
      return;
    }
    try {
      await MobileKnowledgeService.getInstance().deleteKnowledgeBase(id);
      refreshKnowledgeBases();
      toastManager.success('知识库删除成功', '删除成功');
    } catch (error) {
      console.error('删除知识库失败:', error);
      toastManager.error('删除失败，请重试', '删除失败');
    }
  };

  // 导出知识库数据
  const handleExportData = async () => {
    try {
      setLoading(true);
      const kbs = await dexieStorage.knowledge_bases.toArray();
      const documents = await dexieStorage.knowledge_documents.toArray();

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        knowledgeBases: kbs,
        documents
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDialogOpen(false);
      toastManager.success('知识库数据导出成功', '导出成功');
    } catch (error) {
      console.error('导出知识库数据失败:', error);
      toastManager.error('导出失败，请重试', '导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 导入知识库数据
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const importData = JSON.parse(text);

      // 验证数据格式
      if (!importData.version || !importData.knowledgeBases || !importData.documents) {
        throw new Error('无效的备份文件格式');
      }

      // 导入知识库
      for (const kb of importData.knowledgeBases) {
        await dexieStorage.knowledge_bases.put(kb);
      }

      // 导入文档
      for (const doc of importData.documents) {
        await dexieStorage.knowledge_documents.put(doc);
      }

      refreshKnowledgeBases();
      setImportDialogOpen(false);
      toastManager.success(`成功导入 ${importData.knowledgeBases.length} 个知识库和 ${importData.documents.length} 个文档`, '导入成功');
    } catch (error) {
      console.error('导入知识库数据失败:', error);
      toastManager.error('导入失败，请检查文件格式', '导入失败');
    } finally {
      setLoading(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 清理所有知识库数据
  const handleClearAllData = async () => {
    try {
      setLoading(true);
      await dexieStorage.knowledge_bases.clear();
      await dexieStorage.knowledge_documents.clear();
      refreshKnowledgeBases();
      setClearDialogOpen(false);
      toastManager.success('知识库数据已清理完成', '清理成功');
    } catch (error) {
      console.error('清理知识库数据失败:', error);
      toastManager.error('清理失败，请重试', '清理失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleBack}
            aria-label="back"
            sx={{ color: (theme) => theme.palette.primary.main }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            知识库设置
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(45deg, #059669 30%, #10b981 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #047857 30%, #059669 90%)',
              }
            }}
          >
            创建知识库
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        px: 2, 
        py: 2, 
        pb: 'var(--content-bottom-padding)',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
        },
      }}>
        {/* 统计信息卡片 */}
        <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>知识库统计</Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1 }}>
                <Box sx={{ width: { xs: '50%', sm: '25%' }, p: 1 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">{stats.totalKnowledgeBases}</Typography>
                      <Typography variant="body2" color="textSecondary">知识库数量</Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ width: { xs: '50%', sm: '25%' }, p: 1 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">{stats.totalDocuments}</Typography>
                      <Typography variant="body2" color="textSecondary">文档数量</Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ width: { xs: '50%', sm: '25%' }, p: 1 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">{stats.totalVectors}</Typography>
                      <Typography variant="body2" color="textSecondary">向量数量</Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ width: { xs: '50%', sm: '25%' }, p: 1 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">{stats.storageSize}</Typography>
                      <Typography variant="body2" color="textSecondary">存储大小</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* 知识库列表 */}
        <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>已添加的知识库 ({knowledgeBases.length})</Typography>
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : knowledgeBases.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', my: 5, borderRadius: 2 }}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              暂无知识库
            </Typography>
            <Typography variant="body2" color="textSecondary">
              点击右上角"创建知识库"按钮开始使用
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1 }}>
            {knowledgeBases.map((kb) => (
              <Box key={kb.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1 }}>
                <StyledCard onClick={() => handleViewDetails(kb.id)}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                        <Folder size={20} />
                      </Avatar>
                      <Typography variant="h6" noWrap>{kb.name}</Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 2,
                      height: 40,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {kb.description || '无描述'}
                    </Typography>

                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        模型: {kb.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • 创建: {formatDate(kb.created_at)}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <IconButton size="small" onClick={(e) => handleDelete(kb.id, e)}>
                      <Trash2 size={16} />
                    </IconButton>
                    <Box flexGrow={1} />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Eye size={16} />}
                      onClick={() => handleViewDetails(kb.id)}
                    >
                      查看
                    </Button>
                  </CardActions>
                </StyledCard>
              </Box>
            ))}
          </Box>
        )}
          </Box>
        </Paper>

        {/* 数据管理 */}
        <Paper elevation={0} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>数据管理</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              导入、导出备份和清理知识库数据
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Upload size={18} />}
                onClick={() => setImportDialogOpen(true)}
                disabled={loading}
              >
                导入数据
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download size={18} />}
                onClick={() => setExportDialogOpen(true)}
                disabled={loading || knowledgeBases.length === 0}
              >
                导出数据
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<AlertTriangle size={18} />}
                onClick={() => setClearDialogOpen(true)}
                disabled={loading || knowledgeBases.length === 0}
              >
                清理所有数据
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 创建知识库对话框 */}
      <BackButtonDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
      >
        <CreateKnowledgeDialog
          open={true}
          onClose={handleCloseDialog}
          onSave={handleSubmitKnowledgeBase}
          isEditing={false}
        />
      </BackButtonDialog>

      {/* 导入对话框 */}
      <BackButtonDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>导入知识库数据</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            选择之前导出的 JSON 备份文件进行导入。导入的数据将与现有数据合并。
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportData}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : '选择文件'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </BackButtonDialog>

      {/* 导出确认对话框 */}
      <BackButtonDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>导出知识库数据</DialogTitle>
        <DialogContent>
          <Typography>
            将导出所有知识库和文档数据为JSON文件，可用于备份或迁移。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>取消</Button>
          <Button onClick={handleExportData} disabled={loading} variant="contained">
            {loading ? <CircularProgress size={20} /> : '确认导出'}
          </Button>
        </DialogActions>
      </BackButtonDialog>

      {/* 清理确认对话框 */}
      <BackButtonDialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>确认清理所有知识库数据</DialogTitle>
        <DialogContent>
          <Typography>
            此操作将删除所有知识库、文档和向量数据，且无法恢复。确定要继续吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>取消</Button>
          <Button onClick={handleClearAllData} color="error" disabled={loading} variant="contained">
            {loading ? <CircularProgress size={20} /> : '确认清理'}
          </Button>
        </DialogActions>
      </BackButtonDialog>
    </Container>
  );
};

export default KnowledgeSettings;