import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Divider,
  alpha,
} from '@mui/material';
import { ArrowLeft, FileText, Search } from 'lucide-react';
import DocumentManager from '../../components/KnowledgeManagement/DocumentManager';
import { KnowledgeSearch } from '../../components/KnowledgeManagement/KnowledgeSearch';
import { useKnowledge } from '../../components/KnowledgeManagement/KnowledgeProvider';

// 标签页切换按钮样式
const TabButton = ({ active, icon: Icon, label, onClick }: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      py: 1.5,
      cursor: 'pointer',
      borderBottom: 2,
      borderColor: active ? 'text.primary' : 'transparent',
      color: active ? 'text.primary' : 'text.secondary',
      transition: 'all 0.2s',
      '&:hover': {
        color: 'text.primary',
        bgcolor: (theme) => alpha(theme.palette.text.primary, 0.05),
      }
    }}
  >
    <Icon size={18} />
    <Typography variant="body2" fontWeight={active ? 600 : 400}>
      {label}
    </Typography>
  </Box>
);

const KnowledgeBaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { selectKnowledgeBase, selectedKnowledgeBase } = useKnowledge();

  useEffect(() => {
    if (id) {
      selectKnowledgeBase(id);
    }
  }, [id, selectKnowledgeBase]);


  const handleGoBack = () => {
    navigate('/settings/knowledge');
  };

  if (!id) {
    navigate('/settings/knowledge');
    return null;
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.02)
        : alpha(theme.palette.background.default, 0.9),
    }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleGoBack}
            aria-label="back"
            sx={{ color: (theme) => theme.palette.primary.main }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, ml: 1 }}>
            {selectedKnowledgeBase?.name || '知识库详情'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 主内容区 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', mt: 8, px: { xs: 1, sm: 2 }, py: 2 }}>
        {selectedKnowledgeBase ? (
          <>
            {/* 知识库信息 */}
            <Box sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedKnowledgeBase.description || '暂无描述'}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">模型</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedKnowledgeBase.model}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">维度</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedKnowledgeBase.dimensions}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">块大小</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedKnowledgeBase.chunkSize}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">重叠</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedKnowledgeBase.chunkOverlap}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">阈值</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedKnowledgeBase.threshold}</Typography>
                </Box>
              </Box>
            </Box>

            {/* 标签页切换 */}
            <Box sx={{
              display: 'flex',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              borderRadius: '8px 8px 0 0',
            }}>
              <TabButton
                active={tabValue === 0}
                icon={FileText}
                label="文档管理"
                onClick={() => setTabValue(0)}
              />
              <TabButton
                active={tabValue === 1}
                icon={Search}
                label="知识搜索"
                onClick={() => setTabValue(1)}
              />
            </Box>

            {/* 内容区域 */}
            <Box sx={{
              bgcolor: 'background.paper',
              borderRadius: '0 0 8px 8px',
              border: '1px solid',
              borderColor: 'divider',
              borderTop: 'none',
              p: 2,
            }}>
              {tabValue === 0 && <DocumentManager knowledgeBaseId={id} />}
              {tabValue === 1 && <KnowledgeSearch knowledgeBaseId={id} />}
            </Box>
          </>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default KnowledgeBaseDetail; 