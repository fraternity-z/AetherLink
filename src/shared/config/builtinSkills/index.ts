/**
 * 内置技能注册表（Enterprise-grade Skill Registry）
 *
 * 架构说明：
 * - 每个内置技能独立一个文件，职责单一，便于维护和 Code Review
 * - 通过分类注册表（SkillCategory）组织技能，支持按类目检索
 * - 新增技能只需：1) 创建技能文件  2) 在下方 registry 中注册
 * - 导出的 builtinSkills 数组保持与旧接口 100% 兼容
 */

import type { Skill } from '../../types/Skill';

// ======================== 技能模块导入 ========================

// —— 编程开发类 ——
import { codeReviewSkill } from './codeReview';
import { unitTestingSkill } from './unitTesting';
import { debuggingSkill } from './debugging';
import { refactoringSkill } from './refactoring';
import { gitAssistantSkill } from './gitAssistant';
import { apiDesignSkill } from './apiDesign';
import { sqlOptimizationSkill } from './sqlOptimization';

// —— 写作办公类 ——
import { docWritingSkill } from './docWriting';
import { creativeWritingSkill } from './creativeWriting';
import { meetingNotesSkill } from './meetingNotes';

// —— 数据与信息类 ——
import { dataAnalysisSkill } from './dataAnalysis';
import { webSummarySkill } from './webSummary';

// —— 语言工具类 ——
import { translationSkill } from './translation';

// —— 工具集成类 ——
import { mcpBridgeSkill } from './mcpBridge';

// ======================== 分类注册表 ========================

/** 技能分类 */
export interface SkillCategory {
  /** 分类标识 */
  id: string;
  /** 分类名称 */
  label: string;
  /** 分类下的技能列表 */
  skills: Skill[];
}

/**
 * 技能分类注册表
 * 新增技能时，将技能文件导入后添加到对应分类的 skills 数组即可
 */
export const skillCategories: SkillCategory[] = [
  {
    id: 'development',
    label: '编程开发',
    skills: [
      codeReviewSkill,
      unitTestingSkill,
      debuggingSkill,
      refactoringSkill,
      gitAssistantSkill,
      apiDesignSkill,
      sqlOptimizationSkill,
    ],
  },
  {
    id: 'writing',
    label: '写作办公',
    skills: [
      docWritingSkill,
      creativeWritingSkill,
      meetingNotesSkill,
    ],
  },
  {
    id: 'data',
    label: '数据与信息',
    skills: [
      dataAnalysisSkill,
      webSummarySkill,
    ],
  },
  {
    id: 'language',
    label: '语言工具',
    skills: [
      translationSkill,
    ],
  },
  {
    id: 'tooling',
    label: '工具集成',
    skills: [
      mcpBridgeSkill,
    ],
  },
];

// ======================== 兼容导出 ========================

/**
 * 全部内置技能（扁平数组）
 * 与旧 builtinSkills.ts 导出完全兼容，外部无需改动任何导入
 */
export const builtinSkills: Skill[] = skillCategories.flatMap(c => c.skills);

// ======================== 工具函数 ========================

/** 按分类 ID 获取技能列表 */
export function getSkillsByCategory(categoryId: string): Skill[] {
  return skillCategories.find(c => c.id === categoryId)?.skills ?? [];
}

/** 按技能 ID 查找内置技能 */
export function getBuiltinSkillById(skillId: string): Skill | undefined {
  return builtinSkills.find(s => s.id === skillId);
}

/** 获取所有分类 ID 列表 */
export function getCategoryIds(): string[] {
  return skillCategories.map(c => c.id);
}
