/**
 * 文档处理状态图标组件
 * 显示文档的处理状态：pending/processing/completed/failed
 */
import React from 'react';
import { Box, CircularProgress, Tooltip, IconButton } from '@mui/material';
import {
  Clock as PendingIcon,
  CheckCircle as CompletedIcon,
  AlertCircle as FailedIcon,
  RefreshCw as RetryIcon,
} from 'lucide-react';
import type { ProcessingStatus } from '../../shared/types/KnowledgeBase';

interface ProcessingStatusIconProps {
  status: ProcessingStatus;
  progress?: number;
  error?: string;
  onRetry?: () => void;
  size?: number;
}

const ProcessingStatusIcon: React.FC<ProcessingStatusIconProps> = ({
  status,
  progress,
  error,
  onRetry,
  size = 20,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return (
          <Tooltip title="等待处理">
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
              <PendingIcon size={size} />
            </Box>
          </Tooltip>
        );

      case 'processing':
        return (
          <Tooltip title={progress !== undefined ? `处理中 ${progress}%` : '处理中...'}>
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <CircularProgress
                size={size}
                variant={progress !== undefined ? 'determinate' : 'indeterminate'}
                value={progress}
                sx={{ color: 'primary.main' }}
              />
              {progress !== undefined && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: size * 0.4,
                    fontWeight: 'bold',
                    color: 'primary.main',
                  }}
                >
                  {Math.round(progress)}
                </Box>
              )}
            </Box>
          </Tooltip>
        );

      case 'completed':
        return (
          <Tooltip title="处理完成">
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
              <CompletedIcon size={size} />
            </Box>
          </Tooltip>
        );

      case 'failed':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={error || '处理失败'}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                <FailedIcon size={size} />
              </Box>
            </Tooltip>
            {onRetry && (
              <Tooltip title="重试">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  sx={{ 
                    p: 0.5,
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <RetryIcon size={size - 4} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      {getStatusContent()}
    </Box>
  );
};

export default ProcessingStatusIcon;
