import { useEffect } from 'react';
import { Columns2, Square } from 'lucide-react';
import type { ActionTool, ViewMode } from '../types';

interface UseSplitViewToolOptions {
  enabled: boolean;
  viewMode: ViewMode;
  onToggleSplitView: () => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
}

/**
 * 分屏视图工具 hook
 */
export function useSplitViewTool({
  enabled,
  viewMode,
  onToggleSplitView,
  setTools
}: UseSplitViewToolOptions) {
  useEffect(() => {
    if (!enabled) {
      setTools(prev => prev.filter(t => t.id !== 'split-view'));
      return;
    }

    const isSplit = viewMode === 'split';

    const tool: ActionTool = {
      id: 'split-view',
      icon: isSplit ? <Square size={14} /> : <Columns2 size={14} />,
      title: isSplit ? '退出分屏' : '分屏显示',
      onClick: onToggleSplitView,
      active: isSplit,
      group: 'core'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'split-view');
      return [...filtered, tool];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'split-view'));
    };
  }, [enabled, viewMode, onToggleSplitView, setTools]);
}
