import React, { Fragment, useState } from 'react';
import { Box, Divider, CircularProgress, IconButton, Collapse, Tooltip } from '@mui/material';
import { Languages } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import type { TranslationMessageBlock } from '../../../shared/types/newMessage';
import Markdown from '../Markdown';

interface Props {
  block: TranslationMessageBlock;
}

/**
 * 翻译块组件 - 完全按照 cherry-studio 参考项目实现
 */
const TranslationBlock: React.FC<Props> = ({ block }) => {
  const [collapsed, setCollapsed] = useState(false);

  // 直接从 Redux 获取最新的块数据，确保流式更新
  const latestBlock = useSelector(
    (state: RootState) => state.messageBlocks.entities[block.id] as TranslationMessageBlock | undefined
  ) || block;

  const isTranslating = !latestBlock.content || latestBlock.content === '翻译中...';

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Fragment>
      <Divider sx={{ margin: 0, marginBottom: collapsed ? 0 : '10px' }}>
        <Tooltip title={collapsed ? '展开翻译' : '折叠翻译'}>
          <IconButton
            size="small"
            onClick={handleToggleCollapse}
            sx={{
              padding: '2px',
              opacity: 0.7,
              '&:hover': { opacity: 1 }
            }}
          >
            <Languages size={16} />
          </IconButton>
        </Tooltip>
      </Divider>
      <Collapse in={!collapsed}>
        {isTranslating ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <Markdown content={latestBlock.content} allowHtml={false} />
        )}
      </Collapse>
    </Fragment>
  );
};

export default TranslationBlock;
