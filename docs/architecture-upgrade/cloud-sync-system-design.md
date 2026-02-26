# AetherLink 云同步账号系统设计文档

> 版本: v1.0 | 日期: 2026-02-27
> 目标: 为内部团队提供类 GPT/豆包的多设备数据同步体验

---

## 一、系统定位

### 1.1 核心目标

为内部团队（≤50 人）提供：
- **账号登录** → 在任何设备上用账号密码登录
- **数据云同步** → 聊天记录、助手配置、设置在所有设备间自动同步
- **无缝切换** → 换手机/电脑后登录即恢复所有数据

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **服务端存储，客户端缓存** | 数据以服务器为准，客户端做本地缓存加速 |
| **AI 调用留在客户端** | 服务器不代理 AI API，只管数据存取，节省资源 |
| **渐进式改造** | 不破坏现有本地存储逻辑，新增同步层覆盖在上面 |
| **内部使用，简化认证** | 管理员创建账号，不开放注册，无需邮箱验证/OAuth |
| **轻量后端** | 适配现有服务器资源（2 核 / 1.9G RAM） |

### 1.3 与 GPT/豆包的异同

| 维度 | GPT / 豆包 | AetherLink 内部版 |
|------|-----------|-------------------|
| AI 调用 | 服务端统一调用 | **客户端各自调用**（Key 在客户端） |
| 数据主权 | 平台持有 | **用户/团队持有**（自部署） |
| 用户规模 | 百万级 | ≤50 人 |
| 注册方式 | 手机号/OAuth | **管理员创建** |
| 基础设施 | K8s 集群 | **单台 VPS + Docker** |
| 实时推送 | WebSocket | **请求时拉取**（简化） |

---

## 二、整体架构

### 2.1 架构图

```
┌────────────────────────────────────────────────────────┐
│                    客户端 (App/Web)                      │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │
│  │ 登录页面  │  │ 设置同步  │  │ SyncService       │    │
│  │ LoginPage │  │ Settings │  │ (新增同步服务层)    │    │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘    │
│       │              │                 │               │
│       │   ┌──────────┴─────────────────┘               │
│       │   │                                            │
│  ┌────┴───┴──────────────────────────────────────┐    │
│  │              AuthService (新增)                 │    │
│  │  JWT Token 管理 / 自动刷新 / 登录状态           │    │
│  └────────────────────┬──────────────────────────┘    │
│                       │                               │
│  ┌────────────────────┴──────────────────────────┐    │
│  │           DexieStorageService (现有)            │    │
│  │  本地 IndexedDB 缓存（离线可用）                 │    │
│  └───────────────────────────────────────────────┘    │
└────────────────────────┬───────────────────────────────┘
                         │ HTTPS REST API
                         ▼
┌────────────────────────────────────────────────────────┐
│              服务器 (154.37.208.52)                      │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Nginx 反向代理 (端口 TBD)                        │  │
│  │  - HTTPS 终端 / CORS / Rate Limit               │  │
│  └──────────────────────┬──────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────┴──────────────────────────┐  │
│  │  Node.js API 服务 (Express/Fastify)              │  │
│  │                                                  │  │
│  │  ├── /api/auth/*      认证模块                    │  │
│  │  ├── /api/sync/*      数据同步模块                │  │
│  │  ├── /api/admin/*     管理模块                    │  │
│  │  └── middleware       JWT 验证 / 日志            │  │
│  └──────────────────────┬──────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────┴──────────────────────────┐  │
│  │  SQLite 数据库                                    │  │
│  │  users / sync_snapshots / sync_logs              │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
【发送消息时】
用户输入 → 客户端调 AI API → 获取回复 → 显示界面
                                        ↓ 同时
                              存本地 IndexedDB (立即)
                                        ↓ 异步
                              上传到服务器 (POST /api/sync/push)

【换设备登录时】
登录 → 获取 Token → 拉取数据快照 (GET /api/sync/pull)
                            ↓
                   写入本地 IndexedDB → 显示界面

【日常使用时（已登录）】
打开 App → 检查本地缓存 → 显示界面（立即）
                    ↓ 后台
           增量同步 (GET /api/sync/diff?since=<timestamp>)
                    ↓
            合并远程变更 → 更新本地 + 界面
```

---

## 三、后端设计

### 3.1 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| **运行时** | Node.js 20+ | 与前端统一 TypeScript，团队熟悉 |
| **框架** | Fastify | 性能优于 Express，内存占用小 |
| **数据库** | SQLite (via better-sqlite3) | 零运维、单文件、足够 50 人使用 |
| **认证** | JWT (access + refresh token) | 无状态、轻量 |
| **密码** | bcrypt | 工业标准 |
| **部署** | Docker | 与 SearXNG 统一管理 |

### 3.2 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id            TEXT PRIMARY KEY,        -- UUID
  username      TEXT UNIQUE NOT NULL,    -- 登录用户名
  password_hash TEXT NOT NULL,           -- bcrypt 哈希
  display_name  TEXT,                    -- 显示名称
  role          TEXT DEFAULT 'user',     -- 角色: admin / user
  is_active     INTEGER DEFAULT 1,      -- 是否启用
  created_at    TEXT NOT NULL,           -- 创建时间 ISO8601
  updated_at    TEXT NOT NULL,           -- 更新时间
  last_login_at TEXT,                    -- 最后登录时间
  settings      TEXT                     -- 用户个性化设置 JSON
);

-- 数据快照表（存储完整的用户数据）
CREATE TABLE sync_snapshots (
  id            TEXT PRIMARY KEY,        -- UUID
  user_id       TEXT NOT NULL,           -- 关联用户
  data_type     TEXT NOT NULL,           -- 数据类型: full / assistants / topics / messages / settings
  data          TEXT NOT NULL,           -- JSON 数据（压缩存储）
  version       INTEGER NOT NULL,        -- 版本号（递增）
  checksum      TEXT,                    -- 数据校验和
  size_bytes    INTEGER,                 -- 数据大小
  created_at    TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 增量变更日志
CREATE TABLE sync_changelog (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  entity_type   TEXT NOT NULL,           -- 实体类型: assistant / topic / message / message_block / settings
  entity_id     TEXT NOT NULL,           -- 实体 ID
  action        TEXT NOT NULL,           -- 操作: create / update / delete
  data          TEXT,                    -- 变更后的完整数据 JSON（delete 时为 null）
  timestamp     TEXT NOT NULL,           -- 变更时间 ISO8601（精确到毫秒）
  device_id     TEXT,                    -- 来源设备标识
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_snapshots_user      ON sync_snapshots(user_id, data_type);
CREATE INDEX idx_snapshots_version   ON sync_snapshots(user_id, version);
CREATE INDEX idx_changelog_user_time ON sync_changelog(user_id, timestamp);
CREATE INDEX idx_changelog_entity    ON sync_changelog(user_id, entity_type, entity_id);

-- Refresh Token 表
CREATE TABLE refresh_tokens (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  token_hash    TEXT NOT NULL,           -- Token 的哈希值
  device_info   TEXT,                    -- 设备信息
  expires_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.3 API 设计

#### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录，返回 access_token + refresh_token | 无 |
| POST | `/api/auth/refresh` | 刷新 Token | refresh_token |
| POST | `/api/auth/logout` | 登出，废弃 refresh_token | access_token |
| GET  | `/api/auth/me` | 获取当前用户信息 | access_token |
| PUT  | `/api/auth/password` | 修改密码 | access_token |

```typescript
// POST /api/auth/login
// Request
{ username: string, password: string, deviceInfo?: string }

// Response 200
{
  access_token: string,    // JWT, 有效期 2 小时
  refresh_token: string,   // 有效期 30 天
  user: {
    id: string,
    username: string,
    display_name: string,
    role: 'admin' | 'user'
  }
}
```

#### 数据同步模块 `/api/sync`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/sync/push` | 上传数据变更 | access_token |
| GET  | `/api/sync/pull` | 拉取完整数据快照 | access_token |
| GET  | `/api/sync/diff` | 获取增量变更 | access_token |
| GET  | `/api/sync/status` | 获取同步状态（版本号、最后同步时间） | access_token |

```typescript
// POST /api/sync/push - 推送变更
// Request
{
  changes: Array<{
    entity_type: 'assistant' | 'topic' | 'message' | 'message_block' | 'settings',
    entity_id: string,
    action: 'create' | 'update' | 'delete',
    data?: any,               // create/update 时提供
    timestamp: string          // 客户端变更时间
  }>,
  device_id: string
}

// Response 200
{
  accepted: number,           // 成功处理的变更数
  rejected: number,           // 被拒绝的变更数（冲突）
  server_version: number,     // 当前服务器版本号
  conflicts?: Array<{         // 冲突详情（如果有）
    entity_type: string,
    entity_id: string,
    server_data: any,
    client_data: any
  }>
}

// GET /api/sync/pull?type=full - 全量拉取
// Response 200
{
  version: number,
  data: {
    assistants: Assistant[],
    topics: ChatTopic[],
    messages: Message[],
    message_blocks: MessageBlock[],
    settings: SettingsState,
    memories: Memory[],
    quick_phrases: QuickPhrase[]
  },
  timestamp: string
}

// GET /api/sync/diff?since=2026-02-27T00:00:00.000Z - 增量拉取
// Response 200
{
  changes: Array<{
    entity_type: string,
    entity_id: string,
    action: 'create' | 'update' | 'delete',
    data?: any,
    timestamp: string
  }>,
  server_version: number,
  has_more: boolean           // 变更太多时分页
}
```

#### 管理模块 `/api/admin`（仅管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/users` | 创建用户 |
| GET  | `/api/admin/users` | 列出所有用户 |
| PUT  | `/api/admin/users/:id` | 修改用户信息 |
| DELETE | `/api/admin/users/:id` | 删除/禁用用户 |
| POST | `/api/admin/users/:id/reset-password` | 重置用户密码 |

---

## 四、前端改造设计

### 4.1 新增模块

```
src/shared/services/
├── auth/
│   ├── AuthService.ts          # 认证服务（登录/登出/Token管理）
│   ├── AuthContext.tsx          # React 认证上下文
│   └── authInterceptor.ts      # 请求拦截器（自动带 Token）
│
├── sync/
│   ├── SyncService.ts          # 同步服务（push/pull/diff）
│   ├── SyncQueue.ts            # 变更队列（离线时缓存变更）
│   ├── SyncConflictResolver.ts # 冲突解决策略
│   └── SyncStatus.ts           # 同步状态管理
│
src/shared/store/slices/
│   ├── authSlice.ts            # 认证状态 (Redux)
│   └── syncSlice.ts            # 同步状态 (Redux)
│
src/pages/
├── Login/
│   └── LoginPage.tsx           # 登录页面
│
src/pages/Settings/
│   └── SyncSettings.tsx        # 同步设置页面
│   └── AccountSettings.tsx     # 账号设置页面
```

### 4.2 认证服务 (AuthService)

```
AuthService 职责:
├── login(username, password)    → 调用 API, 存储 Token
├── logout()                     → 清除 Token, 可选清除本地数据
├── refreshToken()               → 自动刷新过期 Token
├── getAccessToken()             → 获取当前有效 Token
├── isAuthenticated()            → 检查登录状态
├── getCurrentUser()             → 获取当前用户信息
└── onAuthStateChange(callback)  → 监听登录状态变化
```

**Token 存储策略:**
- `access_token` → 内存 + sessionStorage（敏感，短期）
- `refresh_token` → Capacitor Preferences / localStorage（持久化）

### 4.3 同步服务 (SyncService)

```
SyncService 职责:
├── initialize()                 → 登录后启动同步
├── pushChanges(changes)         → 推送本地变更到服务器
├── pullFullData()               → 全量拉取（首次登录/重置）
├── pullDiff()                   → 增量同步（日常使用）
├── startAutoSync(interval)      → 启动定时同步（默认 30 秒）
├── stopAutoSync()               → 停止自动同步
├── getSyncStatus()              → 获取同步状态
└── resolveConflicts(conflicts)  → 处理冲突
```

### 4.4 数据层改造（关键）

**现有架构：**
```
UI → Redux dispatch → saveMessageAndBlocksToDB() → DexieStorageService (IndexedDB)
```

**改造后架构：**
```
UI → Redux dispatch → saveMessageAndBlocksToDB() → DexieStorageService (IndexedDB)
                                                         ↓ 同时
                                                  SyncQueue.enqueue(change)
                                                         ↓ 异步批量
                                                  SyncService.pushChanges()
                                                         ↓
                                                     服务器 API
```

**改造方式：在 DexieStorageService 中增加同步钩子**

```
现有方法（不动）:
  saveAssistant(assistant) → IndexedDB

增加同步层（Wrapper）:
  SyncableStorageService extends DexieStorageService {
    async saveAssistant(assistant) {
      await super.saveAssistant(assistant);              // 先存本地
      SyncQueue.enqueue('assistant', assistant.id, 'update', assistant); // 加入同步队列
    }
  }
```

**优势：** 所有现有代码不需要改动，只需要把 `dexieStorage` 实例替换为 `SyncableStorageService` 实例即可。

### 4.5 冲突解决策略

内部使用场景下，采用**最简单的 Last-Write-Wins (LWW) 策略**：

| 场景 | 处理 |
|------|------|
| 同一条消息在两台设备上修改 | 时间戳更新的覆盖旧的 |
| 设备 A 删除了消息，设备 B 修改了同一条 | 删除优先 |
| 新设备首次登录 | 全量拉取服务器数据覆盖本地 |
| 离线期间的变更 | 上线后批量推送，服务器按时间戳排序处理 |

**不做实时推送（WebSocket）**，内部使用场景下定时轮询（30 秒）足够。

### 4.6 登录页面

```
登录流程:
1. App 启动 → 检查本地 Token
2. Token 有效 → 直接进入主界面，后台增量同步
3. Token 过期 → 尝试 refresh
4. 无 Token / refresh 失败 → 显示登录页

登录页 UI:
┌─────────────────────────┐
│                         │
│      AetherLink Logo    │
│                         │
│   ┌─────────────────┐   │
│   │   用户名         │   │
│   └─────────────────┘   │
│   ┌─────────────────┐   │
│   │   密码           │   │
│   └─────────────────┘   │
│                         │
│   [      登录       ]   │
│                         │
│   记住登录状态 ☑        │
│                         │
└─────────────────────────┘
```

---

## 五、同步的数据范围

### 5.1 需要同步的数据

| 数据表 | 对应 Dexie 表 | 数据量估算 | 同步策略 |
|--------|--------------|-----------|---------|
| **助手** | `assistants` | ~10-50 条 | 全量 + 增量 |
| **话题** | `topics` | ~50-500 条 | 全量 + 增量 |
| **消息** | `messages` | ~1K-50K 条 | 增量为主 |
| **消息块** | `message_blocks` | ~2K-100K 条 | 增量为主 |
| **设置** | `settings` | 1 条 (大 JSON) | 全量覆盖 |
| **快捷短语** | `quick_phrases` | ~10-50 条 | 全量 + 增量 |
| **记忆** | `memories` | ~10-100 条 | 全量 + 增量 |

### 5.2 不同步的数据

| 数据 | 理由 |
|------|------|
| **图片 Blob** (`images` 表) | 太大，走单独的文件同步（后续阶段） |
| **知识库文件** | 太大，且通常是设备本地的文件 |
| **API Key** | 安全原因，不上传到服务器（或加密后同步） |
| **MCP 服务器配置** | 可能包含本地路径，按需同步 |

### 5.3 API Key 的特殊处理

API Key 是敏感数据，提供两种策略供用户选择：

1. **不同步**（默认）：每台设备自行配置 Key
2. **加密同步**：用用户密码派生密钥 (PBKDF2) 加密后存储到服务器，其他设备拉取后解密

---

## 六、部署方案

### 6.1 Docker Compose

```yaml
# /opt/aetherlink-api/docker-compose.yml
version: '3.7'
services:
  api:
    build: .
    container_name: aetherlink-api
    restart: unless-stopped
    volumes:
      - ./data:/app/data          # SQLite 数据库文件
      - ./logs:/app/logs          # 日志
    environment:
      - JWT_SECRET=<随机生成>
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=<初始密码>
      - PORT=3000

  nginx:
    image: nginx:alpine
    container_name: aetherlink-api-proxy
    restart: unless-stopped
    ports:
      - '39282:80'                # API 端口
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api
```

### 6.2 资源评估

| 资源 | 预计占用 |
|------|---------|
| **内存** | ~50-100 MB (Node.js + SQLite) |
| **磁盘** | ~100 MB 基础 + 按数据增长 |
| **CPU** | 极低（REST API 请求量很小） |
| **带宽** | 极低（文本数据，无文件传输） |

现有服务器（2 核 / 1.9G RAM / 34G 磁盘 / 4G Swap）完全够用。

### 6.3 安全措施

| 措施 | 说明 |
|------|------|
| **HTTPS** | Nginx 配置 SSL（Let's Encrypt 免费证书） |
| **bcrypt** | 密码哈希，salt rounds = 12 |
| **JWT 短期过期** | access_token 2 小时，refresh_token 30 天 |
| **Rate Limiting** | 登录接口限频（5 次/分钟） |
| **CORS 白名单** | 仅允许 AetherLink 域名/App |
| **IP 白名单**（可选） | 限制只有特定 IP 才能访问 API |

---

## 七、实施计划

### 阶段一：后端 API（2 天）

| 任务 | 时间 |
|------|------|
| 搭建项目结构 (Fastify + TypeScript) | 2h |
| 数据库初始化 + 用户表 | 2h |
| 认证模块 (login/refresh/logout) | 3h |
| 同步模块 (push/pull/diff) | 4h |
| 管理模块 (用户管理) | 2h |
| Docker 部署 + Nginx 配置 | 2h |
| **小计** | ~15h / 2天 |

### 阶段二：前端 - 认证层（1 天）

| 任务 | 时间 |
|------|------|
| AuthService + Token 管理 | 3h |
| 登录页面 UI | 2h |
| 路由守卫（未登录跳转登录页） | 1h |
| Redux authSlice | 1h |
| **小计** | ~7h / 1天 |

### 阶段三：前端 - 同步层（2-3 天）

| 任务 | 时间 |
|------|------|
| SyncService 核心逻辑 | 4h |
| SyncQueue 变更队列 | 3h |
| SyncableStorageService 包装层 | 4h |
| 冲突解决 (LWW) | 2h |
| 同步设置 UI | 2h |
| 首次登录全量拉取流程 | 3h |
| **小计** | ~18h / 2-3天 |

### 阶段四：测试与优化（1 天）

| 任务 | 时间 |
|------|------|
| 多设备同步测试 | 3h |
| 离线→上线恢复测试 | 2h |
| 大数据量性能测试 | 2h |
| Bug 修复 | 1h |
| **小计** | ~8h / 1天 |

### 总计：约 6-7 天

---

## 八、后续扩展（不在本期范围）

| 功能 | 说明 |
|------|------|
| **文件/图片同步** | 使用对象存储（MinIO）同步知识库文件和图片 |
| **WebSocket 实时推送** | 多设备同时在线时实时同步消息 |
| **共享助手/话题** | 团队成员之间共享助手配置和对话 |
| **API Key 池** | 服务端管理 API Key 池，按用户分配额度 |
| **操作审计日志** | 记录所有用户操作，用于安全审计 |
| **HTTPS/SSL** | 配置 Let's Encrypt 证书 |
| **2FA 双因素认证** | TOTP 二次验证 |

---

## 九、关键决策记录

| 编号 | 决策 | 理由 |
|------|------|------|
| D1 | 选择 SQLite 而非 PostgreSQL | 内部 ≤50 人，SQLite 零运维，单文件备份方便 |
| D2 | 不做 WebSocket 实时推送 | 内部使用，30 秒轮询足够，大幅降低复杂度 |
| D3 | AI 调用留在客户端 | 节省服务器资源，用户自主管理 Key |
| D4 | LWW 冲突解决 | 内部使用，同一用户很少同时在两台设备上编辑同一内容 |
| D5 | 管理员创建账号 | 内部使用，不需要注册流程和验证 |
| D6 | SyncableStorageService 包装 | 不修改现有代码，最小改动完成集成 |
| D7 | API Key 默认不同步 | 安全优先，用户可选择加密同步 |
