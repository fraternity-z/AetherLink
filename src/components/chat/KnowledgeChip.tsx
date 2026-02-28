import React from 'react';
import { useTheme, Chip } from '@mui/material';
import { FileSearch, X } from 'lucide-react';

interface KnowledgeChipProps {
  knowledgeBaseName: string;
  onRemove: () => void;
}

/**
 * 知识库 Chip 组件
 * 紧凑显示当前选中的知识库，对齐 CS 风格（绿色标签 + FileSearch 图标）
 */
const KnowledgeChip: React.FC<KnowledgeChipProps> = ({
  knowledgeBaseName,
  onRemove
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Chip
      icon={
        <FileSearch 
          size={13} 
          color={isDarkMode ? 'rgba(61, 157, 15, 0.95)' : 'rgba(61, 157, 15, 0.85)'} 
        />
      }
      label={knowledgeBaseName}
      onDelete={onRemove}
      deleteIcon={<X size={12} />}
      size="small"
      sx={{
        backgroundColor: isDarkMode 
          ? 'rgba(61, 157, 15, 0.15)' 
          : 'rgba(61, 157, 15, 0.08)',
        color: isDarkMode ? 'rgba(61, 157, 15, 0.95)' : 'rgba(61, 157, 15, 0.85)',
        border: `1px solid ${isDarkMode ? 'rgba(61, 157, 15, 0.3)' : 'rgba(61, 157, 15, 0.2)'}`,
        fontWeight: 500,
        height: 24,
        flexShrink: 0,
        '& .MuiChip-label': {
          fontWeight: 500,
          fontSize: '0.75rem',
          px: 0.75,
        },
        '& .MuiChip-icon': {
          ml: 0.75,
          mr: -0.25,
          color: isDarkMode ? 'rgba(61, 157, 15, 0.95)' : 'rgba(61, 157, 15, 0.85)',
        },
        '& .MuiChip-deleteIcon': {
          fontSize: 12,
          mr: 0.5,
          color: isDarkMode ? 'rgba(61, 157, 15, 0.7)' : 'rgba(61, 157, 15, 0.6)',
          '&:hover': {
            color: theme.palette.error.main,
          },
        },
      }}
    />
  );
};

export default KnowledgeChip;
