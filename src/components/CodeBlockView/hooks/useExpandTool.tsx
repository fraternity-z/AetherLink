import { useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ActionTool } from '../types';

interface UseExpandToolOptions {
  enabled: boolean;
  expanded: boolean;
  expandable: boolean;
  toggle: () => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
}

/**
 * 展开/折叠工具 hook
 */
export function useExpandTool({
  enabled,
  expanded,
  expandable,
  toggle,
  setTools
}: UseExpandToolOptions) {
  useEffect(() => {
    if (!enabled) {
      setTools(prev => prev.filter(t => t.id !== 'expand'));
      return;
    }

    const tool: ActionTool = {
      id: 'expand',
      icon: expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />,
      title: expanded ? '折叠代码' : '展开代码',
      onClick: toggle,
      disabled: !expandable,
      group: 'core'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'expand');
      return [...filtered, tool];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'expand'));
    };
  }, [enabled, expanded, expandable, toggle, setTools]);
}
