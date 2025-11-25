import { useCallback, useEffect } from 'react';
import { Copy } from 'lucide-react';
import type { ActionTool, BasicPreviewHandles } from '../types';

interface UseCopyToolOptions {
  showPreviewTools: boolean;
  previewRef: React.RefObject<BasicPreviewHandles | null>;
  onCopySource: () => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
}

/**
 * 复制工具 hook
 */
export function useCopyTool({
  showPreviewTools,
  previewRef,
  onCopySource,
  setTools
}: UseCopyToolOptions) {
  const handleCopy = useCallback(() => {
    if (showPreviewTools && previewRef.current?.copy) {
      previewRef.current.copy();
    } else {
      onCopySource();
    }
  }, [showPreviewTools, previewRef, onCopySource]);

  useEffect(() => {
    const tool: ActionTool = {
      id: 'copy',
      icon: <Copy size={14} />,
      title: '复制代码',
      onClick: handleCopy,
      group: 'quick'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'copy');
      return [tool, ...filtered];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'copy'));
    };
  }, [handleCopy, setTools]);
}
