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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <WorkspaceList onSelectWorkspace={handleSelectWorkspace} />
    </Box>
  );
};

export default WorkspaceTab;
