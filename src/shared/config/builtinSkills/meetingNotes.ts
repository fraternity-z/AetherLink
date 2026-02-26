import type { Skill } from '../../types/Skill';

export const meetingNotesSkill: Skill = {
  id: 'builtin-meeting-notes',
  name: '会议纪要',
  description: '将会议内容整理为结构化纪要，包括议题、决策、待办事项和负责人',
  emoji: '📋',
  tags: ['办公', '会议', '纪要'],
  content: `# 会议纪要技能

## 纪要模板

### 基本信息
- 会议主题
- 日期/时间
- 参会人员
- 记录人

### 议题与讨论
按议题逐条记录：
1. 议题名称
2. 讨论要点（简明扼要）
3. 达成的结论/决策

### 决策事项
用表格列出所有决策：
| 编号 | 决策内容 | 决策人 | 生效时间 |

### 待办事项（Action Items）
| 编号 | 任务描述 | 负责人 | 截止日期 | 优先级 |

### 遗留问题
需要后续跟进但本次未解决的问题

## 整理原则

1. **客观记录** — 记录事实和决策，不加主观判断
2. **简明扼要** — 每个要点不超过 2 句话
3. **可追溯** — 每个决策和待办都有明确的负责人
4. **可执行** — 待办事项必须具体、可衡量、有截止时间`,
  triggerPhrases: ['整理会议', '会议纪要', '会议记录', 'meeting notes', 'meeting minutes'],
  source: 'builtin',
  version: '1.0.0',
  author: 'AetherLink',
  enabled: true,
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
};
