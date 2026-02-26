/**
 * 助手技能绑定 Tab
 * 在编辑助手对话框中，管理助手绑定的技能列表
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Zap } from 'lucide-react';
import { SkillManager } from '../../../shared/services/skills/SkillManager';
import type { Skill } from '../../../shared/types/Skill';

interface SkillsTabProps {
  assistantId: string;
  skillIds?: string[];
  onSkillIdsChange?: (skillIds: string[]) => void;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
  assistantId: _assistantId,
  skillIds = [],
  onSkillIdsChange,
}) => {
  const theme = useTheme();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const skills = await SkillManager.getEnabledSkills();
      setAllSkills(skills);
    } catch (error) {
      console.error('[SkillsTab] 加载技能失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleToggle = (skillId: string) => {
    const newIds = skillIds.includes(skillId)
      ? skillIds.filter(id => id !== skillId)
      : [...skillIds, skillId];
    onSkillIdsChange?.(newIds);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Zap size={20} />
          <Typography variant="subtitle2">绑定技能</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          选择要绑定到此助手的技能，绑定后技能摘要将注入系统提示词
        </Typography>
      </Paper>

      {allSkills.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            暂无可用技能，请先在设置 → 技能管理中启用技能
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: { xs: '40vh', sm: '45vh' },
          WebkitOverflowScrolling: 'touch',
        }}>
          {allSkills.map(skill => {
            const checked = skillIds.includes(skill.id);
            return (
              <Paper
                key={skill.id}
                elevation={0}
                onClick={() => handleToggle(skill.id)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  backgroundColor: checked
                    ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)')
                    : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  border: checked ? `1px solid ${theme.palette.primary.main}40` : '1px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={checked}
                  onChange={() => handleToggle(skill.id)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ p: 0 }}
                />
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
                  {skill.emoji || '🔧'}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight="medium" noWrap>
                    {skill.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {skill.description}
                  </Typography>
                </Box>
                {skill.source === 'builtin' && (
                  <Chip label="内置" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                )}
              </Paper>
            );
          })}
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        已绑定 {skillIds.length} 个技能
      </Typography>
    </Box>
  );
};

export default SkillsTab;
