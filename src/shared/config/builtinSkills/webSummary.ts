import type { Skill } from '../../types/Skill';

export const webSummarySkill: Skill = {
  id: 'builtin-web-summary',
  name: '网页摘要',
  description: '提取和总结网页内容的关键信息，生成结构化摘要',
  emoji: '🌐',
  tags: ['阅读', '摘要', '网页'],
  content: `# 网页摘要技能

## 摘要流程

1. **识别内容类型** — 新闻、博客、论文、产品页、文档等
2. **提取核心信息** — 根据内容类型选择提取策略
3. **结构化输出** — 按统一格式呈现

## 输出格式

### 一句话总结
用一句话概括文章核心观点

### 关键要点
- 要点1
- 要点2
- 要点3（最多5个）

### 详细摘要
2-3 段文字，涵盖：
- 背景/问题
- 核心观点/方案
- 结论/影响

### 元信息
- 来源/作者
- 发布时间
- 内容质量评估（客观性、时效性、可信度）

## 不同类型的处理策略

- **新闻** — 关注 5W1H（何人何事何时何地为何如何）
- **技术博客** — 关注问题、方案、实现细节、效果
- **论文** — 关注研究问题、方法、结果、局限性
- **产品页** — 关注核心功能、定价、与竞品对比`,
  triggerPhrases: ['总结网页', '摘要', '网页摘要', 'summarize', '总结一下'],
  mcpServerId: undefined,
  source: 'builtin',
  version: '1.0.0',
  author: 'AetherLink',
  enabled: true,
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
};
