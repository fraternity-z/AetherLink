import type { Skill } from '../../types/Skill';

export const dataAnalysisSkill: Skill = {
  id: 'builtin-data-analysis',
  name: '数据分析',
  description: '分析数据集，生成统计摘要、趋势分析和可视化建议',
  emoji: '📊',
  tags: ['数据', '分析', '统计'],
  content: `# 数据分析技能

## 分析框架

### 1. 数据概览
- 数据量、字段数、时间范围
- 数据类型分布（数值、分类、时间等）
- 缺失值和异常值统计

### 2. 描述性统计
- 数值字段：均值、中位数、标准差、分位数
- 分类字段：频次分布、Top N
- 时间字段：趋势、周期性、季节性

### 3. 关联分析
- 变量间的相关性
- 分组对比（A/B 测试结果）
- 交叉分析

### 4. 洞察与建议
- 关键发现总结
- 数据质量问题提示
- 进一步分析方向建议

## 可视化建议

根据数据特征推荐合适的图表类型：
- 趋势 → 折线图
- 分布 → 直方图/箱线图
- 占比 → 饼图/环形图
- 对比 → 柱状图
- 关系 → 散点图
- 地理 → 热力图/地图`,
  triggerPhrases: ['分析数据', '数据分析', 'analyze data', '统计分析'],
  source: 'builtin',
  version: '1.0.0',
  author: 'AetherLink',
  enabled: true,
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
};
