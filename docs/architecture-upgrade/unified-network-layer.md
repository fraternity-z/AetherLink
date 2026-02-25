# AetherLink 统一网络层架构文档

## 1. 现状分析

### 1.1 平台与供应商矩阵

| 平台 | CORS 绕过方式 | 网络代理 | 流式响应 |
|------|-------------|---------|---------|
| **Tauri 桌面** | `@tauri-apps/plugin-http` (reqwest) | ✅ HTTP/HTTPS/SOCKS4/SOCKS5 | ✅ 原生支持 |
| **Capacitor Android/iOS** | `capacitor-cors-bypass-enhanced` (OkHttp/URLSession) | ✅ 插件已实现但**未接入** | ✅ streamRequest API |
| **Web 浏览器** | `cors-proxy.js` (localhost:8888) | ❌ 不支持 | ✅ 通过代理透传 |

| 供应商类型 | SDK | fetch 注入方式 |
|-----------|-----|---------------|
| **OpenAI** | `openai` npm | `config.fetch` |
| **OpenAI AISDK** | `@ai-sdk/openai` | `config.fetch` |
| **Anthropic AISDK** | `@ai-sdk/anthropic` | `config.fetch` |
| **Gemini AISDK** | `@ai-sdk/google` | `config.fetch` |

### 1.2 当前代码问题

#### 问题 1：`needsCORSProxy()` 重复 4 次

同一个函数在以下 4 个文件中各写了一份，逻辑微妙不同：

- `src/shared/utils/universalFetch.ts`
- `src/shared/api/openai/client.ts`
- `src/shared/api/openai-aisdk/client.ts`
- `src/shared/api/anthropic-aisdk/client.ts`
- `src/shared/api/gemini-aisdk/client.ts`

#### 问题 2：`createPlatformFetch()` / `createProxyFetch()` 重复 4 次

每个 provider 的 `client.ts` 都自己实现了：
1. 平台检测 (Tauri / Capacitor / Web)
2. fetch 包装 (universalFetch / CorsBypass / proxy)
3. Header 过滤 (createHeaderFilterFetch)

这些代码 **完全相同**，只有日志前缀不同。

#### 问题 3：Capacitor 代理未接入

`networkProxySlice.ts` 中的 `applyGlobalProxy` 已经调用了 `CorsBypass.setGlobalProxy()`，
但 CORS 插件源码中 `ProxyManager` 已实现完整代理支持（HTTP/HTTPS/SOCKS4/5），
问题在于 **应用启动时没有从 storage 恢复代理配置到插件**。

#### 问题 4：CORS 代理地址硬编码

`localhost:8888` 写死在至少 6 个位置，不可配置。

#### 问题 5：`CORSBypassService` 类是废代码

`src/shared/services/network/CORSBypassService.ts` 封装了 CorsBypass 插件，
但所有 provider 都直接通过 `universalFetch` 调用插件，没有人使用这个服务类。

---

## 2. 目标架构

### 2.1 统一 fetch 层

```
所有 Provider 的 client.ts
    │
    │  config.fetch = createPlatformFetch(model)
    │
    ▼
┌─────────────────────────────────────────────────┐
│        createPlatformFetch(model)                │  ← 唯一导出，在 universalFetch.ts 中
│                                                  │
│  1. 检测平台  isTauri / isCapacitor / isWeb      │
│  2. 选择 fetch 实现                              │
│  3. 包装 header 过滤（如果 model 有配置）         │
│  4. 返回 typeof fetch                            │
├──────────┬──────────┬────────────────────────────┤
│  Tauri   │Capacitor │        Web                 │
│          │          │                            │
│ tauriFetch│CorsBypass│   proxyFetch               │
│ (已有)   │ (已有)   │  (CORS proxy URL 可配置)    │
│          │          │                            │
│ 代理：从  │ 代理：    │  代理：proxy server         │
│ storage  │ 插件全局  │  可配置上游代理             │
│ 自动读取 │ proxy    │                            │
└──────────┴──────────┴────────────────────────────┘
```

### 2.2 文件结构变更

```
src/shared/utils/
  universalFetch.ts          ← 保留，增加 createPlatformFetch() 导出
                                增加 createHeaderFilterFetch() 导出
                                增加 needsCORSProxy() 导出（唯一定义）
                                增加 createProxyFetch() 导出（唯一定义）

src/shared/api/openai/client.ts         ← 删除本地 needsCORSProxy/createProxyFetch/平台检测
src/shared/api/openai-aisdk/client.ts   ← 同上
src/shared/api/anthropic-aisdk/client.ts← 同上
src/shared/api/gemini-aisdk/client.ts   ← 同上

src/shared/services/network/
  CORSBypassService.ts      ← 标记废弃或删除

src/shared/store/slices/
  networkProxySlice.ts       ← 保持不变（已正确实现）
```

### 2.3 代理配置流

```
用户修改代理设置
    │
    ▼
networkProxySlice.saveNetworkProxySettings()
    │
    ├─ 保存到 storage
    │
    └─ dispatch(applyGlobalProxy(config))
         │
         ├─ Tauri:     无需额外操作，tauriFetch 每次请求从 storage 读取
         ├─ Capacitor:  CorsBypass.setGlobalProxy(config) ← 已实现
         └─ Web:        （暂不支持，或可扩展 cors-proxy.js 支持上游代理）
```

### 2.4 应用启动恢复

```
AppInitializer
    │
    ▼
dispatch(loadNetworkProxySettings())
    │
    ▼
extraReducers fulfilled → state 更新
    │
    ▼
如果 state.globalProxy.enabled && isCapacitor:
    dispatch(applyGlobalProxy(state.globalProxy))
    → CorsBypass.setGlobalProxy(config)
```

---

## 3. 实施计划

### Phase 1：统一 fetch 层（消除重复代码）

**目标**：将 4 个 provider 中重复的 ~80 行代码提取为公共函数

**改动文件**：
1. `universalFetch.ts` — 新增导出：
   - `createPlatformFetch(model): typeof fetch | undefined`
   - `createHeaderFilterFetch(baseFetch, headersToRemove): typeof fetch`
   - `needsCORSProxy(url): boolean`（已存在，确保只有一份）
   - `createProxyFetch(): typeof fetch`

2. `openai/client.ts` — 删除本地 `needsCORSProxy`、`createProxyFetch`，改为：
   ```ts
   import { createPlatformFetch, createHeaderFilterFetch } from '../../utils/universalFetch';
   ```

3. `openai-aisdk/client.ts` — 同上
4. `anthropic-aisdk/client.ts` — 同上
5. `gemini-aisdk/client.ts` — 同上

**验证**：`npx tsc --noEmit` 编译通过 + 手动测试 4 个供应商的聊天功能

### Phase 2：Capacitor 代理启动恢复

**目标**：确保 App 启动时，已保存的代理配置被正确应用到 CorsBypass 插件

**改动文件**：
1. `AppInitializer.tsx` 或等效启动逻辑 — 在 `loadNetworkProxySettings` fulfilled 后，
   如果代理已启用且在 Capacitor 平台，调用 `applyGlobalProxy`

**验证**：Android 端启用代理 → 重启 App → 检查 CorsBypass 插件日志确认代理已应用

### Phase 3：CORS 代理 URL 可配置（可选）

**目标**：将 `localhost:8888` 改为可配置

**改动**：
1. `networkProxySlice` 或 settings 中增加 `corsProxyUrl` 字段
2. `universalFetch.ts` 中 `createProxyFetch()` 读取此配置
3. Web 端代理设置 UI 增加输入框

### Phase 4：清理废代码（可选）

- 删除 `CORSBypassService.ts`（无人使用）
- 更新 `src/shared/services/network/index.ts` 移除相关导出

---

## 4. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Phase 1 重构可能破坏某个 provider 的特殊逻辑 | 高 | 逐个 provider 改，每改一个编译+测试 |
| OpenAI SDK 的 `config.fetch` 签名与 AISDK 不同 | 中 | OpenAI SDK 保持自己的包装方式，只复用底层函数 |
| Capacitor 代理恢复时机问题 | 低 | 在第一个 API 请求前确保恢复完成 |
| 删除 CORSBypassService 可能有隐藏引用 | 低 | grep 确认无引用后再删 |

---

## 5. 代码量估算

| Phase | 新增行 | 删除行 | 改动文件数 |
|-------|--------|--------|-----------|
| Phase 1 | ~40 | ~240 | 5 |
| Phase 2 | ~15 | 0 | 1-2 |
| Phase 3 | ~30 | ~20 | 3-4 |
| Phase 4 | 0 | ~280 | 2 |

**总计**：净减少 ~450 行重复代码
