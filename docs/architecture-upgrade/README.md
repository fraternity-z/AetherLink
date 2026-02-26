# AetherLink 架构升级计划

> 基于 Cherry Studio 最佳实践的渐进式架构重构方案

## 当前状态

| 阶段 | 状态 | 说明 |
|------|------|------|
| 阶段一：BlockManager 分离 | ✅ 已完成 | Redux 更新 15-17 次/响应，代码减少 40% |
| 阶段二：统一 Chunk 适配器 | ❌ 已取消 | 与现有流式处理架构不兼容 |
| 阶段三：插件系统引入 | ⏳ 未开始 | 待规划 |

## 活跃文档

| 文档 | 说明 |
|------|------|
| [cloud-sync-system-design.md](cloud-sync-system-design.md) | 云同步系统设计方案 |

## 归档文档

> 以下文档已移入 `archive/`，仅供历史参考。

| 文档 | 说明 |
|------|------|
| [01-current-architecture-analysis.md](archive/01-current-architecture-analysis.md) | 当前架构分析 |
| [02-cherry-studio-comparison.md](archive/02-cherry-studio-comparison.md) | Cherry Studio 对比分析 |
| [06-implementation-roadmap.md](archive/06-implementation-roadmap.md) | 实施路线图 |
| [unified-network-layer.md](archive/unified-network-layer.md) | 统一网络层设计 |
| [STRUCTURE.md](archive/STRUCTURE.md) | 旧文档结构说明 |
