import type { Skill } from '../../types/Skill';

export const docWritingSkill: Skill = {
  id: 'builtin-doc-writing',
  name: '文档写作',
  description: '按照结构化模板撰写技术文档，包括 API 文档、设计文档和用户指南',
  emoji: '📝',
  tags: ['写作', '文档'],
  content: `# 文档写作技能

## 文档类型识别

根据用户需求选择合适的文档模板：

### API 文档
- 接口路径、方法、参数说明
- 请求/响应示例
- 错误码说明
- 认证方式

### 设计文档（RFC/ADR）
- 背景与动机
- 方案选项对比
- 推荐方案详述
- 实施计划
- 风险评估

### 用户指南
- 快速开始（5分钟内可运行）
- 核心概念说明
- 常见用例示例
- 故障排查

## 写作原则

1. **读者优先** — 始终考虑目标读者的技术水平
2. **示例驱动** — 每个概念都配备可运行的代码示例
3. **渐进复杂** — 从简单到复杂，层层递进
4. **保持更新** — 标注文档版本和最后更新时间`,
  triggerPhrases: ['写文档', '写技术文档', 'write doc', '撰写文档'],
  source: 'builtin',
  version: '1.0.0',
  author: 'AetherLink',
  enabled: true,
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
};
