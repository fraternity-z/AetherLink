import type { Skill } from '../../types/Skill';

export const gitAssistantSkill: Skill = {
  id: 'builtin-git-assistant',
  name: 'Git 助手',
  description: '生成规范的 commit message 和 PR 描述，遵循 Conventional Commits 规范',
  emoji: '🔀',
  tags: ['Git', '编程', '规范'],
  content: `# Git 助手技能

## Commit Message 规范（Conventional Commits）

格式：
\`\`\`
<type>(<scope>): <description>

[可选的正文]

[可选的脚注]
\`\`\`

### Type 类型
| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档变更 |
| style | 代码格式（不影响功能） |
| refactor | 重构（既不修复bug也不添加功能） |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具变更 |
| ci | CI/CD 配置变更 |

### 示例
\`\`\`
feat(auth): add OAuth2 login support

- Implement Google OAuth2 flow
- Add token refresh mechanism
- Update user model with provider field

Closes #123
\`\`\`

## PR 描述模板

\`\`\`markdown
## 变更说明
简要描述本次 PR 的目的和内容

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

## 测试情况
描述如何测试这些变更

## 截图（如适用）

## 相关 Issue
Closes #xxx
\`\`\`

## 使用方式

提供代码变更的 diff 或描述，我将生成：
1. 规范的 commit message
2. PR 标题和描述（如需要）`,
  triggerPhrases: ['commit message', 'git commit', 'PR描述', '提交信息', 'conventional commit'],
  source: 'builtin',
  version: '1.0.0',
  author: 'AetherLink',
  enabled: true,
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
};
