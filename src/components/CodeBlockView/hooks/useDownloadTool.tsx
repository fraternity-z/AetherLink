import { useCallback, useEffect } from 'react';
import { Download } from 'lucide-react';
import type { ActionTool, BasicPreviewHandles } from '../types';

interface UseDownloadToolOptions {
  showPreviewTools: boolean;
  previewRef: React.RefObject<BasicPreviewHandles | null>;
  onDownloadSource: () => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
}

/**
 * 下载工具 hook
 */
export function useDownloadTool({
  showPreviewTools,
  previewRef,
  onDownloadSource,
  setTools
}: UseDownloadToolOptions) {
  const handleDownload = useCallback(() => {
    if (showPreviewTools && previewRef.current?.download) {
      previewRef.current.download();
    } else {
      onDownloadSource();
    }
  }, [showPreviewTools, previewRef, onDownloadSource]);

  useEffect(() => {
    const tool: ActionTool = {
      id: 'download',
      icon: <Download size={14} />,
      title: '下载代码',
      onClick: handleDownload,
      group: 'quick'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'download');
      const copyIndex = prev.findIndex(t => t.id === 'copy');
      if (copyIndex >= 0) {
        filtered.splice(copyIndex + 1, 0, tool);
        return filtered;
      }
      return [tool, ...filtered];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'download'));
    };
  }, [handleDownload, setTools]);
}
