import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WorkspaceList from './WorkspaceList';

const WorkspaceTab: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectWorkspace = (workspaceId: string) => {
    // 跳转到工作区详情页面，添加 from=chat 参数标记来源
    navigate(`/settings/workspace/${workspaceId}?from=chat`);
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      // 负边距抵消 TabPanel 的 padding，让 WorkspaceList 铺满可用空间
      margin: '-10px',
      // 使用 flex: 1 确保组件填满剩余空间
      flex: 1,
      minHeight: 0,
    }}>
      <WorkspaceList onSelectWorkspace={handleSelectWorkspace} />
    </Box>
  );
};

export default WorkspaceTab;
