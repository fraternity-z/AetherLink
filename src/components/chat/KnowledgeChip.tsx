import React from 'react';
import { Box, useTheme, Chip } from '@mui/material';
import { BookOpen, X } from 'lucide-react';

interface KnowledgeChipProps {
  knowledgeBaseName: string;
  onRemove: () => void;
}

/**
 * 知识库 Chip 组件
 * 紧凑显示当前选中的知识库，类似附件的显示方式
 */
const KnowledgeChip: React.FC<KnowledgeChipProps> = ({
  knowledgeBaseName,
  onRemove
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 1,
        px: 1,
      }}
    >
      <Chip
        icon={
          <BookOpen 
            size={14} 
            color={isDarkMode ? 'rgba(5, 150, 105, 0.9)' : 'rgba(5, 150, 105, 0.8)'} 
          />
        }
        label={knowledgeBaseName}
        onDelete={onRemove}
        deleteIcon={<X size={14} />}
        size="small"
        sx={{
          backgroundColor: isDarkMode 
            ? 'rgba(5, 150, 105, 0.15)' 
            : 'rgba(5, 150, 105, 0.08)',
          color: isDarkMode ? 'rgba(5, 150, 105, 0.95)' : 'rgba(5, 150, 105, 0.85)',
          border: `1px solid ${isDarkMode ? 'rgba(5, 150, 105, 0.3)' : 'rgba(5, 150, 105, 0.2)'}`,
          fontWeight: 500,
          height: 28,
          '& .MuiChip-label': {
            fontWeight: 500,
            fontSize: '0.8125rem',
          },
          '& .MuiChip-icon': {
            color: isDarkMode ? 'rgba(5, 150, 105, 0.9)' : 'rgba(5, 150, 105, 0.8)',
          },
          '& .MuiChip-deleteIcon': {
            color: isDarkMode ? 'rgba(5, 150, 105, 0.9)' : 'rgba(5, 150, 105, 0.8)',
            '&:hover': {
              color: theme.palette.error.main,
            },
          },
        }}
      />
    </Box>
  );
};

export default KnowledgeChip;
