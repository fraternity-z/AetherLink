# 主题系统迁移文档

## 📚 文档索引

### 计划文档
- [`theme-migration-plan.md`](./theme-migration-plan.md) - **主要计划文档**，包含 10 个会话的详细任务清单
- [`theme-refactoring-analysis.md`](./theme-refactoring-analysis.md) - 改造影响分析

### 进度跟踪
- [`session-progress-template.md`](./session-progress-template.md) - 会话进度跟踪模板
- `session-01-progress.md` - 会话 1 进度（创建中）
- `session-02-progress.md` - 会话 2 进度（创建中）
- ... （其他会话进度文档）

### 参考文档
- `css-variables-naming.md` - CSS Variables 命名规范（会话 4 创建）
- `theme-migration-guide.md` - 迁移指南（会话 10 创建）
- `adding-new-theme.md` - 新主题添加指南（会话 10 创建）
- `css-variables-api.md` - API 文档（会话 10 创建）

## 🚀 快速开始

1. **阅读主计划文档**
   ```bash
   # 查看完整迁移计划
   cat docs/theme-migration/theme-migration-plan.md
   ```

2. **开始第一个会话**
   - 查看 `theme-migration-plan.md` 中的"会话 1"部分
   - 复制 `session-progress-template.md` 创建 `session-01-progress.md`
   - 按照任务清单逐步完成

3. **跟踪进度**
   - 每完成一个任务就在任务清单中勾选
   - 记录遇到的问题和解决方案
   - 完成会话后更新总体进度

## 📋 会话概览

| 会话 | 名称 | 状态 | 依赖 |
|------|------|------|------|
| 1 | 基础架构搭建 | ⏳ 待开始 | - |
| 2 | Material-UI Theme 适配层改造 | ⏳ 待开始 | 1 |
| 3 | 重构 themeUtils.ts - 基础颜色部分 | ⏳ 待开始 | 1, 2 |
| 4 | 重构 themeUtils.ts - 主题特定颜色（上）| ⏳ 待开始 | 1, 2, 3 |
| 5 | 重构 themeUtils.ts - 主题特定颜色（下）| ⏳ 待开始 | 1, 2, 3, 4 |
| 6 | 迁移核心聊天组件（上）| ⏳ 待开始 | 1-5 |
| 7 | 迁移核心聊天组件（下）| ⏳ 待开始 | 1-6 |
| 8 | 迁移消息块组件 | ⏳ 待开始 | 1-7 |
| 9 | 迁移设置页面和侧边栏组件 | ⏳ 待开始 | 1-8 |
| 10 | 清理、测试和文档 | ⏳ 待开始 | 1-9 |

## 🔄 工作流程

### 开始新会话
1. 查看 `theme-migration-plan.md` 中对应会话的任务清单
2. 确认依赖会话已完成
3. 创建会话进度文档（如 `session-01-progress.md`）
4. 按照任务清单开始工作

### 进行中
1. 每完成一个任务就勾选
2. 遇到问题及时记录
3. 定期测试功能
4. 保持代码提交

### 完成会话
1. 完成所有任务
2. 通过所有验收标准
3. 更新进度跟踪
4. 提交代码（如使用版本控制）

## 📝 注意事项

- **保持向后兼容**：每个会话都要确保现有功能不受影响
- **逐步迁移**：不要一次性修改太多组件
- **充分测试**：每个会话结束前都要测试相关功能
- **文档同步**：重要的 API 变更要及时更新文档

## 🆘 遇到问题？

1. 查看对应会话的任务清单
2. 检查依赖会话是否完成
3. 查看相关参考文档
4. 记录问题并寻求帮助

---

**最后更新：** 2025-01-XX

