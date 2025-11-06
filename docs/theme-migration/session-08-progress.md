# 会话 8 进度跟踪 - 迁移消息块组件

**开始时间**: 2025-11-05
**状态**: 进行中 ⏳

## 📋 任务清单

### 1. 准备工作
- [x] 创建会话进度文档
- [ ] 分析消息块组件的颜色使用模式
- [ ] 在 Design Tokens 中添加消息块相关的 CSS Variables

### 2. 优先组件迁移
- [ ] 迁移 `ToolBlock.tsx`
- [ ] 迁移 `ThinkingDisplayRenderer.tsx`
- [ ] 迁移 `ThinkingAdvancedStyles.tsx`
- [ ] 迁移 `KnowledgeReferenceBlock.tsx`
- [ ] 迁移 `FileBlock.tsx`
- [ ] 迁移 `CitationBlock.tsx`

### 3. 其他消息块组件
- [ ] 迁移 `ModelComparisonBlock.tsx`
- [ ] 迁移 `MultiModelBlock.tsx`
- [ ] 迁移 `ChartBlock.tsx`
- [ ] 迁移 `ErrorBlock.tsx`
- [ ] 迁移 `SearchResultsBlock.tsx`
- [ ] 迁移 `TranslationBlock.tsx`
- [ ] 迁移其他 Block 组件（如有必要）

### 4. 测试与验收
- [ ] 测试所有消息块显示
- [ ] 验证所有主题下的颜色显示
- [ ] 验证亮色/暗色模式切换
- [ ] 运行构建检查无错误

### 5. 文档更新
- [ ] 创建会话 8 总结报告
- [ ] 更新 README.md
- [ ] 更新 theme-migration-plan.md

## 📊 进度统计

### 文件修改
- 已修改: 0 个
- 待修改: ~20 个

### 颜色迁移
- 已迁移: 0 处
- 待迁移: 待评估

### Design Tokens
- 新增 CSS Variables: 0 个

## 🔍 发现的问题

### 1. 硬编码颜色模式
**组件**: 多个 Block 组件
**问题**: 大量使用 `theme.palette.mode === 'dark' ? ... : ...` 进行条件判断
**示例**:
```typescript
backgroundColor: theme.palette.mode === 'dark'
  ? 'rgba(255, 255, 255, 0.05)'
  : 'rgba(0, 0, 0, 0.02)'
```
**解决方案**: 创建统一的 CSS Variables 来替代这些条件判断

### 2. 重复的 rgba 值
**问题**: 相同的 rgba 值在多个组件中重复出现
**常见值**:
- `rgba(255, 255, 255, 0.05)` / `rgba(0, 0, 0, 0.02)` - 轻微背景色
- `rgba(255, 255, 255, 0.08)` / `rgba(0, 0, 0, 0.04)` - 悬停背景色
- `rgba(255, 255, 255, 0.02)` / `rgba(0, 0, 0, 0.02)` - 内容背景色
- `rgba(0, 0, 0, 0.2)` - 滚动条颜色

**解决方案**: 在 Design Tokens 中创建语义化的 CSS Variables

## 💡 优化建议

### 1. 创建消息块专用的 Design Tokens
建议添加以下 CSS Variables:
- `--message-block-bg` - 消息块背景色
- `--message-block-bg-hover` - 消息块悬停背景色
- `--message-block-border` - 消息块边框色
- `--message-block-header-bg` - 消息块头部背景色
- `--message-block-content-bg` - 消息块内容背景色
- `--message-block-scrollbar-thumb` - 滚动条颜色
- `--message-block-scrollbar-track` - 滚动条轨道颜色

### 2. 统一滚动条样式
许多组件都定义了自己的滚动条样式，建议创建统一的滚动条样式工具类。

## 📝 技术笔记

### 当前状态
- 所有消息块组件都使用 MUI theme 的 palette
- 大量使用条件判断来根据 dark/light 模式选择颜色
- 存在大量重复的 rgba 颜色值

### 迁移策略
1. 首先在 Design Tokens 中添加所需的 CSS Variables
2. 更新 CSS Variables 注入函数
3. 逐个组件迁移，用 CSS Variables 替换硬编码颜色
4. 移除条件判断，简化代码

## 🎯 验收标准
- ✅ 所有消息块组件不包含硬编码的 rgba 颜色值
- ✅ 所有条件判断 `theme.palette.mode === 'dark' ? ... : ...` 被移除
- ✅ 所有主题下消息块显示正常
- ✅ 亮色/暗色模式切换正常
- ✅ 构建无错误
- ✅ Linter 无错误

---

**最后更新**: 2025-11-05

