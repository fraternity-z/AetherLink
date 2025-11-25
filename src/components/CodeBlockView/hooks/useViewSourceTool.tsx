import { useEffect } from 'react';
import { Code, Eye } from 'lucide-react';
import type { ActionTool, ViewMode } from '../types';

interface UseViewSourceToolOptions {
  enabled: boolean;
  editable: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
}

/**
 * 查看源码/编辑工具 hook
 */
export function useViewSourceTool({
  enabled,
  editable,
  viewMode,
  onViewModeChange,
  setTools
}: UseViewSourceToolOptions) {
  useEffect(() => {
    if (!enabled) {
      setTools(prev => prev.filter(t => t.id !== 'view-source'));
      return;
    }

    // 分屏模式下不显示此按钮
    if (viewMode === 'split') {
      setTools(prev => prev.filter(t => t.id !== 'view-source'));
      return;
    }

    const getIcon = () => {
      if (viewMode === 'special') return <Code size={14} />;
      if (editable) return <Eye size={14} />;
      return <Eye size={14} />;
    };

    const getTitle = () => {
      if (viewMode === 'special') return editable ? '编辑代码' : '查看源码';
      return '预览效果';
    };

    const handleClick = () => {
      if (viewMode === 'special') {
        onViewModeChange('source');
      } else {
        onViewModeChange('special');
      }
    };

    const tool: ActionTool = {
      id: 'view-source',
      icon: getIcon(),
      title: getTitle(),
      onClick: handleClick,
      group: 'core'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'view-source');
      return [...filtered, tool];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'view-source'));
    };
  }, [enabled, editable, viewMode, onViewModeChange, setTools]);
}
