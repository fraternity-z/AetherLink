import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  alpha,
} from '@mui/material';
import { FileText, Search, Database, Layers, Scissors, Blend, SlidersHorizontal, LayoutList } from 'lucide-react';
import DocumentManager from '../../components/KnowledgeManagement/DocumentManager';
import { KnowledgeSearch } from '../../components/KnowledgeManagement/KnowledgeSearch';
import { useKnowledge } from '../../components/KnowledgeManagement/KnowledgeProvider';
import { SafeAreaContainer, HeaderBar } from '../../components/settings/SettingComponents';

// 知识库信息项
const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
}> = ({ icon: Icon, label, value }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    py: 0.75,
    px: 1.5,
    borderRadius: 1.5,
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
    minWidth: 0,
  }}>
    <Icon size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2, display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// 标签页按钮
const TabButton: React.FC<{
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}> = ({ active, icon: Icon, label, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.75,
      py: 1.25,
      cursor: 'pointer',
      position: 'relative',
      color: active ? 'primary.main' : 'text.secondary',
      transition: 'all 0.2s ease',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 2.5,
        borderRadius: '2px 2px 0 0',
        bgcolor: active ? 'primary.main' : 'transparent',
        transition: 'all 0.2s ease',
      },
      '&:active': {
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
      },
    }}
  >
    <Icon size={16} />
    <Typography variant="body2" fontWeight={active ? 600 : 400} sx={{ fontSize: '0.85rem' }}>
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
    <SafeAreaContainer>
      <HeaderBar
        title={selectedKnowledgeBase?.name || '知识库详情'}
        onBackPress={handleGoBack}
      />

      {/* 主内容区 */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        pb: 'var(--content-bottom-padding)',
        WebkitOverflowScrolling: 'touch',
      }}>
        {selectedKnowledgeBase ? (
          <>
            {/* 知识库描述 */}
            {selectedKnowledgeBase.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  px: 0.5,
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                {selectedKnowledgeBase.description}
              </Typography>
            )}

            {/* 知识库配置参数 */}
            <Box sx={{
              display: 'flex',
              gap: 1,
              mb: 2,
              flexWrap: 'wrap',
            }}>
              <Chip
                icon={<Database size={12} />}
                label={selectedKnowledgeBase.model}
                size="small"
                variant="outlined"
                sx={{ height: 26, fontSize: '0.75rem', borderRadius: 1.5 }}
              />
              <InfoItem icon={Layers} label="维度" value={selectedKnowledgeBase.dimensions} />
              <InfoItem icon={LayoutList} label="分块策略" value={{
                fixed: '固定大小',
                paragraph: '按段落',
                markdown: 'Markdown',
                code: '按代码',
              }[selectedKnowledgeBase.chunkStrategy || 'fixed'] || '固定大小'} />
              <InfoItem icon={Scissors} label="块大小" value={selectedKnowledgeBase.chunkSize ?? '-'} />
              <InfoItem icon={Blend} label="重叠" value={selectedKnowledgeBase.chunkOverlap ?? '-'} />
              <InfoItem icon={SlidersHorizontal} label="阈值" value={selectedKnowledgeBase.threshold ?? '-'} />
            </Box>

            {/* 标签页切换 */}
            <Box sx={{
              display: 'flex',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              borderRadius: '8px 8px 0 0',
              border: '1px solid',
              borderBottomColor: 'divider',
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
              p: { xs: 1.5, sm: 2 },
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
    </SafeAreaContainer>
  );
};

export default KnowledgeBaseDetail; 