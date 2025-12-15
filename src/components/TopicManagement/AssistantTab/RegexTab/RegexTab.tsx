import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme
} from '@mui/material';
import { Plus, Wand2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AssistantRegex } from '../../../../shared/types/Assistant';
import RegexRuleCard from './RegexRuleCard';
import RegexRuleDialog from './RegexRuleDialog';

export interface RegexTabProps {
  rules: AssistantRegex[];
  onChange: (rules: AssistantRegex[]) => void;
}

/**
 * 可排序的规则项包装组件
 */
const SortableRuleItem: React.FC<{
  rule: AssistantRegex;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}> = ({ rule, onEdit, onDelete, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1.5 }}>
      <RegexRuleCard
        rule={rule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </Box>
  );
};

/**
 * 正则替换 Tab 组件
 */
const RegexTab: React.FC<RegexTabProps> = ({ rules, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssistantRegex | null>(null);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex(r => r.id === active.id);
      const newIndex = rules.findIndex(r => r.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(rules, oldIndex, newIndex));
      }
    }
  };

  // 添加规则
  const handleAddRule = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  // 编辑规则
  const handleEditRule = (rule: AssistantRegex) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  // 保存规则
  const handleSaveRule = (rule: AssistantRegex) => {
    if (editingRule) {
      // 更新现有规则
      onChange(rules.map(r => r.id === rule.id ? rule : r));
    } else {
      // 添加新规则
      onChange([...rules, rule]);
    }
  };

  // 删除规则
  const handleDeleteRule = (ruleId: string) => {
    onChange(rules.filter(r => r.id !== ruleId));
  };

  // 切换规则启用状态
  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    onChange(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
  };

  // 空状态
  if (rules.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 3
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <Wand2 size={28} color={theme.palette.primary.main} style={{ opacity: 0.7 }} />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            textAlign: 'center',
            mb: 3,
            maxWidth: 280
          }}
        >
          正则替换可以自动处理消息内容，如隐藏敏感信息、格式化文本等
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Plus size={18} />}
          onClick={handleAddRule}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            px: 3
          }}
        >
          添加正则规则
        </Button>

        <RegexRuleDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveRule}
          rule={editingRule}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部说明和添加按钮 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          拖拽调整规则执行顺序
        </Typography>
        <Button
          size="small"
          startIcon={<Plus size={16} />}
          onClick={handleAddRule}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '0.8rem'
          }}
        >
          添加规则
        </Button>
      </Box>

      {/* 规则列表 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {rules.map(rule => (
              <SortableRuleItem
                key={rule.id}
                rule={rule}
                onEdit={() => handleEditRule(rule)}
                onDelete={() => handleDeleteRule(rule.id)}
                onToggle={(enabled) => handleToggleRule(rule.id, enabled)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Box>

      {/* 编辑对话框 */}
      <RegexRuleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveRule}
        rule={editingRule}
      />
    </Box>
  );
};

export default RegexTab;
