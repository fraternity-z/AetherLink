import type { Skill } from '../../types/Skill';

export const sqlOptimizationSkill: Skill = {
  id: 'builtin-sql-optimization',
  name: 'SQL 优化',
  description: '分析SQL查询性能，提供索引建议、执行计划分析和查询重写方案',
  emoji: '🗄️',
  tags: ['数据库', 'SQL', '性能'],
  content: `# SQL 优化技能

## 分析流程

1. **理解查询意图** — 确认查询要达成的业务目标
2. **分析执行计划** — 检查 EXPLAIN 输出（如果提供）
3. **识别瓶颈** — 找出全表扫描、笛卡尔积、临时表等问题
4. **提供优化方案** — 给出索引建议、查询重写、架构调整

## 常见优化手段

### 索引优化
- 根据 WHERE、JOIN、ORDER BY 条件建议索引
- 识别冗余索引和缺失索引
- 考虑覆盖索引减少回表

### 查询重写
- 子查询改 JOIN
- OR 改 UNION ALL
- LIMIT 优化分页查询
- 避免 SELECT *

### 架构建议
- 表分区策略
- 读写分离场景
- 缓存层引入时机

## 输出格式

\`\`\`
📊 当前问题
- 问题描述和影响

🔧 优化建议
- 建议1（预期提升 xx%）
- 建议2

📝 优化后的 SQL
[重写后的查询]
\`\`\``,
  triggerPhrases: ['优化SQL', 'SQL优化', '查询优化', 'optimize query'],
  source: 'builtin',
  version: '1.0.0',
  author: 'AetherLink',
  enabled: true,
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
};
