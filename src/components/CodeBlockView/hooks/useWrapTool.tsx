import { useEffect } from 'react';
import { WrapText, AlignLeft } from 'lucide-react';
import type { ActionTool } from '../types';

interface UseWrapToolOptions {
  enabled: boolean;
  wrapped: boolean;
  wrappable: boolean;
  toggle: () => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
}

/**
 * 自动换行工具 hook
 */
export function useWrapTool({
  enabled,
  wrapped,
  wrappable,
  toggle,
  setTools
}: UseWrapToolOptions) {
  useEffect(() => {
    if (!enabled || !wrappable) {
      setTools(prev => prev.filter(t => t.id !== 'wrap'));
      return;
    }

    const tool: ActionTool = {
      id: 'wrap',
      icon: wrapped ? <AlignLeft size={14} /> : <WrapText size={14} />,
      title: wrapped ? '取消换行' : '自动换行',
      onClick: toggle,
      active: wrapped,
      group: 'core'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'wrap');
      return [...filtered, tool];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'wrap'));
    };
  }, [enabled, wrapped, wrappable, toggle, setTools]);
}
