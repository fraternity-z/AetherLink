# 依赖更新分析报告

> 更新日期：2026-02-27
> 项目版本：AetherLink v0.6.2

---

## ✅ 已完成的安全更新（`npm update`）

| 包名 | 更新前 | 更新后 | 说明 |
|---|---|---|---|
| `ai` | 6.0.99 | 6.0.103 | fix: tool 重复创建修复，event notifiers |
| `axios` | 1.13.2 | 1.13.5 | 🔒 安全修复：`__proto__` DoS 攻击 |
| `core-js` | 3.47.0 | 3.48.0 | Map upsert 提案进入稳定 ES |
| `dexie` | 4.2.1 | 4.3.0 | 社交认证、React Suspense 支持（opt-in） |
| `docx` | 9.5.1 | 9.6.0 | UTF-8 编码修复（中文重要）、尾注、目录扩展 |
| `i18next` | 25.7.3 | 25.8.13 | Intl API 崩溃保护、类型补全、嵌套解析修复 |
| `i18next-browser-languagedetector` | 8.2.0 | 8.2.1 | TS 类型补全 |
| `katex` | 0.16.27 | 0.16.33 | 宏参数修复、SCSS 变量转发 |
| `lodash` | 4.17.21 | 4.17.23 | 🔒 安全修复：CVE-2025-134655 原型污染 |
| `lru-cache` | 11.2.4 | 11.2.6 | patch 修复 |
| `mermaid` | 11.12.2 | 11.12.3 | 依赖更新 |
| `microsoft-cognitiveservices-speech-sdk` | 1.47.0 | 1.48.0 | SDK 功能更新 |
| `motion` | 12.23.26 | 12.34.3 | AnimatePresence/drag/useScroll 修复，新增 propagate.tap 等 |
| `node-html-parser` | 7.0.1 | 7.0.2 | patch 修复 |
| `pdfjs-dist` | 5.4.449 | 5.4.624 | 持续 patch 修复 |
| `react` | 19.2.3 | 19.2.4 | 🔒 Server Actions DoS 防护 |
| `react-dom` | 19.2.3 | 19.2.4 | 同上 |
| `react-error-boundary` | 6.0.0 | 6.1.1 | error 类型改为 unknown，导出 getErrorMessage |
| `react-i18next` | 16.5.0 | 16.5.4 | 组件 props 覆盖修复、Trans 标签修复 |
| `react-router-dom` | 7.11.0 | 7.13.1 | 🔒 CSRF/XSS 3 个漏洞修复，matchPath 修复 |
| `rolldown-vite` | 7.3.0 | 7.3.1 | patch 修复 |
| `shiki` | 3.20.0 | 3.23.0 | 语法主题更新，新增 [!code info] 标记 |
| `tailwind-merge` | 3.4.0 | 3.5.0 | 支持 Tailwind CSS v4.2 |
| `tokenx` | 1.2.1 | 1.3.0 | minor 更新 |
| `unist-util-visit` | 5.0.0 | 5.1.0 | minor 更新 |
| `zustand` | 5.0.9 | 5.0.11 | persist 竞态修复、immer+slices 类型修复 |
| `eslint` | 9.39.2 | 9.39.3 | patch |
| `eslint-plugin-react-refresh` | 0.4.24 | 0.4.26 | patch |
| `solid-js` | 1.9.10 | 1.9.11 | patch |
| `terser` | 5.44.1 | 5.46.0 | minor 更新 |
| `typescript-eslint` | 8.50.1 | 8.56.1 | 规则改进和修复 |
| `lucide-react` | 0.562.0 | 0.575.0 | 新增图标、ESM 修复、flip-* 重命名（项目未使用） |
| `globals` | 16.5.0 | 17.0.0 | audioWorklet 从 browser 拆出（不影响），新增环境 |
| `@ai-sdk/google` | 3.0.32 | 3.0.33 | Google 图像模型新宽高比支持 |
| `eslint` | 9.39.3 | 10.0.2 | 移除 eslintrc（项目已用 flat config，无影响） |
| `@eslint/js` | 9.39.3 | 10.0.1 | 随 eslint 10 一起升 |
| `eslint-plugin-react-refresh` | 0.4.26 | 0.5.2 | ESM-only，customHOCs→extraHOCs（项目未使用） |

---

## 🔴 主版本升级（暂不升级）

| 包名 | 当前版本 | latest | 风险 | 建议 |
|---|---|---|---|---|
| `zod` | 3.25.76 | 4.3.6 | ⚠️ 高 | 等 ai-sdk 生态支持 v4 后再升 |
| `remark-cjk-friendly` | 1.2.3 | 2.0.1 | ⚠️ 中 | npm latest 仍为 1.2.3，v2 为过渡版，暂缓 |
| `@capacitor/*` 系列 | 7.x | 8.x | ⚠️ 高 | Capacitor 8 需整体迁移 |
