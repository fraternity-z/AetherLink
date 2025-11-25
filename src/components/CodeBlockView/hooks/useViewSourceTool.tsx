import { useEffect } from 'react';
import { Code, Edit, Eye } from 'lucide-react';
import type { ActionTool, ViewMode } from '../types';

interface UseViewSourceToolOptions {
  enabled: boolean;
  editable: boolean;
  viewMode: ViewMode;
  isEditorOpen: boolean; // 新增：编辑器是否打开
  onViewModeChange: (mode: ViewMode) => void;
  setTools: React.Dispatch<React.SetStateAction<ActionTool[]>>;
  onEdit?: () => void;
}

/**
 * 查看源码/编辑工具 hook
 * 重构版本：简化状态管理，基于外部状态计算按钮显示
 */
export function useViewSourceTool({
  enabled,
  editable,
  viewMode,
  isEditorOpen,
  onViewModeChange,
  setTools,
  onEdit
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

    // 计算按钮状态
    const isCurrentlyEditing = editable && isEditorOpen;
    
    const getIcon = () => {
      if (editable) {
        return isCurrentlyEditing ? <Eye size={14} /> : <Edit size={14} />;
      }
      return <Code size={14} />;
    };

    const getTitle = () => {
      if (editable) {
        return isCurrentlyEditing ? '查看源码' : '编辑代码';
      }
      return '查看源码';
    };

    const handleClick = () => {
      if (editable) {
        if (!isCurrentlyEditing) {
          // 编辑模式：打开编辑器
          if (onEdit) {
            onEdit();
          }
        } else {
          // 查看模式：切换到源码视图
          onViewModeChange('source');
        }
      } else {
        // 非编辑模式：切换视图
        if (viewMode === 'special') {
          onViewModeChange('source');
        } else {
          onViewModeChange('special');
        }
      }
    };

    const tool: ActionTool = {
      id: 'view-source',
      icon: getIcon(),
      title: getTitle(),
      onClick: handleClick,
      active: isCurrentlyEditing,
      group: 'core'
    };

    setTools(prev => {
      const filtered = prev.filter(t => t.id !== 'view-source');
      return [...filtered, tool];
    });

    return () => {
      setTools(prev => prev.filter(t => t.id !== 'view-source'));
    };
  }, [enabled, editable, viewMode, isEditorOpen, onViewModeChange, setTools, onEdit]);

  // 移除内部状态管理，完全依赖外部传入的状态
  return {};
}
