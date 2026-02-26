# 文档维护规范

## 目录结构

```
docs/
├── README.md              # 总索引（每次增删文档必须同步更新）
├── guides/                # 开发指南 — 长期维护的 how-to 文档
├── design/                # 设计方案 — 功能/架构的设计 RFC
├── architecture-upgrade/  # 架构升级 — 系统级架构演进方案
├── refactoring/           # 重构计划 — 进行中的重构方案
├── analysis/              # 外部分析 — 第三方项目的参考分析
└── archive/               # 已完成归档 — 只读，不再维护
    ├── reports/           #   完成报告
    ├── agentic-loop/      #   按功能分组的归档
    └── theme-migration/   #   按功能分组的归档
```

## 文档生命周期

```
design/ → guides/ or archive/
         ↑ 设计通过 → 实现完成后：
         │   - 产出指南 → 放入 guides/
         │   - 纯记录   → 放入 archive/
         └ 设计废弃 → 直接删除或放入 archive/
```

1. **新功能设计** → 写入 `design/`
2. **实现完成后**：
   - 如果产出了可复用的开发指南 → 移入 `guides/`
   - 设计文档本身 → 移入 `archive/`
   - 完成报告 → 写入 `archive/reports/`
3. **重构计划** → 写入 `refactoring/`，完成后移入 `archive/`

## 命名规范

- 文件名使用 **kebab-case**：`gemini-tts-integration.md`
- 禁止中文文件名、空格、驼峰
- 归档文件可按功能建子目录：`archive/agentic-loop/`

## 内容规范

- 每篇文档开头注明状态（如适用）：
  ```markdown
  > 状态：✅ 已完成 / 🚧 进行中 / ❌ 已废弃
  ```
- 引用代码路径时使用相对于 `src/` 的路径：`src/shared/services/tts-v2/TTSManager.ts`
- 禁止硬编码绝对盘符路径（如 `J:\Cherry\...`）

## 更新规则

| 场景 | 操作 |
|------|------|
| 新增文档 | 放入对应目录 + 更新 `README.md` 索引 |
| 删除文档 | 同步删除 `README.md` 中的条目 |
| 代码重构后 | 检查 `guides/` 中引用的文件路径是否仍然有效 |
| 功能完成后 | 将 `design/` 中的方案移入 `archive/` |
| 发现过时文档 | 要么更新内容，要么移入 `archive/` 并标注 `❌ 已废弃` |

## 定期维护

建议每月或每个大版本发布前：
1. 检查 `guides/` 中的代码引用是否过时
2. 检查 `design/` 中是否有已完成但未归档的方案
3. 确认 `README.md` 索引与实际文件一致
