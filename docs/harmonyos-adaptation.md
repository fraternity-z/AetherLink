# AetherLink 鸿蒙系统适配文档

## 📱 概述

本文档详细说明了 AetherLink 应用对华为鸿蒙（HarmonyOS）系统的适配情况，包括权限配置、功能支持和使用指南。

## 🎯 适配范围

### 支持的鸿蒙版本
- **最低版本**: HarmonyOS 4.0
- **目标版本**: HarmonyOS 5.0
- **推荐版本**: HarmonyOS 5.0 或更高

### 核心功能适配

#### ✅ 已完全适配
1. **剪贴板功能**
   - 复制文本
   - 粘贴文本
   - 自动权限请求
   - 重试机制

2. **文件访问**
   - 读取文件
   - 写入文件
   - 文件选择
   - 权限管理

3. **相机功能**
   - 拍照
   - 从相册选择
   - 权限请求

4. **通知功能**
   - 本地通知
   - 权限管理
   - 定时通知

5. **平台检测**
   - 自动识别鸿蒙系统
   - 版本检测
   - 功能检测

## 🔐 权限说明

### 必需权限

#### 1. 剪贴板权限
- **权限名称**: `ohos.permission.READ_CLIPBOARD`, `ohos.permission.WRITE_CLIPBOARD`
- **用途**: 支持复制和粘贴功能
- **使用场景**:
  - 复制消息内容
  - 复制代码块
  - 粘贴文本到输入框

#### 2. 网络权限
- **权限名称**: `ohos.permission.INTERNET`
- **用途**: 连接 AI 服务和云端功能
- **使用场景**:
  - API 请求
  - 实时通信
  - 数据同步

### 可选权限

#### 1. 存储权限
- **权限名称**: `ohos.permission.READ_USER_STORAGE`, `ohos.permission.WRITE_USER_STORAGE`
- **用途**: 读写文件
- **使用场景**:
  - 上传文档
  - 导出聊天记录
  - 保存生成的文件

#### 2. 相机权限
- **权限名称**: `ohos.permission.CAMERA`
- **用途**: 拍照和扫描
- **使用场景**:
  - 拍照上传
  - 扫描二维码

#### 3. 麦克风权限
- **权限名称**: `ohos.permission.MICROPHONE`
- **用途**: 语音输入
- **使用场景**:
  - 语音转文字
  - 语音消息

#### 4. 通知权限
- **权限名称**: `ohos.permission.NOTIFICATION`
- **用途**: 消息提醒
- **使用场景**:
  - 新消息通知
  - 任务完成提醒

## 🚀 使用指南

### 开发者指南

#### 1. 引入鸿蒙适配模块

```typescript
import { isHarmonyOS } from '@/shared/utils/platformDetection';
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';
```

#### 2. 检测鸿蒙系统

```typescript
if (isHarmonyOS()) {
  console.log('运行在鸿蒙系统上');
}
```

#### 3. 请求权限

```typescript
// 请求单个权限
const result = await harmonyOSPermissionService.requestPermission(
  HarmonyOSPermission.WRITE_CLIPBOARD
);

if (result.status === 'granted') {
  // 权限已授予
} else {
  // 权限被拒绝
  console.error(result.error);
}
```

#### 4. 使用剪贴板

```typescript
import { platformAdapter } from '@/shared/adapters/PlatformAdapter';

// 复制文本（自动处理权限）
try {
  await platformAdapter.clipboard.writeText('Hello HarmonyOS');
  console.log('复制成功');
} catch (error) {
  console.error('复制失败:', error);
}

// 读取剪贴板（自动处理权限）
try {
  const text = await platformAdapter.clipboard.readText();
  console.log('读取成功:', text);
} catch (error) {
  console.error('读取失败:', error);
}
```

#### 5. 使用权限守卫组件

```tsx
import { HarmonyOSPermissionGuard } from '@/components/HarmonyOS';
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';

function MyComponent() {
  return (
    <HarmonyOSPermissionGuard
      permission={HarmonyOSPermission.WRITE_CLIPBOARD}
      autoRequest={true}
      fallback={<div>需要剪贴板权限</div>}
    >
      <CopyButton />
    </HarmonyOSPermissionGuard>
  );
}
```

#### 6. 使用鸿蒙适配的复制按钮

```tsx
import { HarmonyOSClipboardButton } from '@/components/HarmonyOS';

function MyComponent() {
  return (
    <HarmonyOSClipboardButton
      text="要复制的文本"
      onSuccess={() => console.log('复制成功')}
      onError={(error) => console.error('复制失败:', error)}
    />
  );
}
```

### 用户指南

#### 首次使用

1. **安装应用**: 从华为应用市场下载并安装 AetherLink
2. **授予权限**: 首次使用时，应用会请求必要的权限
3. **功能测试**: 尝试复制文本或使用其他功能

#### 权限管理

如果功能无法使用，可能是权限未授予：

1. 打开**设置** → **应用和服务** → **应用管理**
2. 找到 **AetherLink**
3. 点击**权限**
4. 手动开启所需权限：
   - ✅ 剪贴板
   - ✅ 存储
   - ✅ 相机
   - ✅ 麦克风
   - ✅ 通知

#### 常见问题

**Q: 为什么复制功能不可用？**
A: 鸿蒙系统需要明确授予剪贴板权限。请在设置中检查并开启"剪贴板"权限。

**Q: 权限请求对话框没有出现？**
A: 如果之前拒绝过权限，可能被标记为"永久拒绝"。请在设置中手动开启权限。

**Q: 应用提示不支持鸿蒙系统？**
A: 请确保您的鸿蒙系统版本在 4.0 或以上。可以在设置中查看系统版本。

**Q: 部分功能在鸿蒙上表现异常？**
A: 这可能是兼容性问题。请：
1. 更新到最新版本的 AetherLink
2. 更新鸿蒙系统到最新版本
3. 向我们反馈问题

## 🔧 技术实现

### 架构设计

```
┌─────────────────────────────────────┐
│   应用层 (UI Components)            │
│   - HarmonyOSPermissionDialog       │
│   - HarmonyOSPermissionGuard        │
│   - HarmonyOSClipboardButton        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   服务层 (Services)                 │
│   - HarmonyOSPermissionService      │
│   - HarmonyOSFileService            │
│   - HarmonyOSCameraService          │
│   - HarmonyOSNotificationService    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   适配器层 (Adapters)               │
│   - PlatformAdapter                 │
│   - CapacitorAdapter (Enhanced)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   平台层 (Platform Detection)       │
│   - platformDetection               │
│   - harmonyOSDetector               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   原生层 (Native)                   │
│   - Capacitor Plugins               │
│   - HarmonyOS APIs                  │
└─────────────────────────────────────┘
```

### 关键特性

#### 1. 自动权限请求
- 功能使用时自动检测权限
- 无权限时自动弹出请求对话框
- 智能处理"永久拒绝"情况

#### 2. 重试机制
- 剪贴板操作自动重试 3 次
- 超时保护（读取 5s，写入 3s）
- 失败后友好错误提示

#### 3. 降级方案
- 权限被拒绝时提供替代方案
- Web API 作为后备选项
- 保证基本功能可用

#### 4. 用户体验优化
- 清晰的权限说明界面
- 详细的使用场景说明
- 一键跳转到系统设置

## 📊 兼容性矩阵

| 功能 | HarmonyOS 4.0 | HarmonyOS 5.0+ | 说明 |
|------|---------------|----------------|------|
| 剪贴板读写 | ✅ | ✅ | 需要权限 |
| 文件访问 | ✅ | ✅ | 需要权限 |
| 相机 | ✅ | ✅ | 需要权限 |
| 通知 | ✅ | ✅ | 需要权限 |
| 语音输入 | ✅ | ✅ | 需要权限 |
| 手势导航 | ⚠️ | ✅ | 5.0 更好支持 |
| 分屏 | ⚠️ | ✅ | 5.0 更好支持 |
| 折叠屏 | ❌ | ✅ | 仅 5.0+ |

## 🐛 已知问题

1. **剪贴板偶尔超时**
   - 影响: 极少数情况下剪贴板操作可能超时
   - 解决方案: 已实现自动重试机制

2. **权限对话框样式**
   - 影响: 系统权限对话框样式与应用不一致
   - 解决方案: 无法修改，这是系统行为

3. **版本检测不准确**
   - 影响: 部分华为设备无法准确检测鸿蒙版本
   - 解决方案: 已添加降级检测逻辑

## 📝 更新日志

### v0.5.4 (2025-01-10)
- ✨ 新增完整的鸿蒙系统适配
- ✨ 新增剪贴板权限管理
- ✨ 新增文件、相机、通知权限管理
- ✨ 新增权限请求 UI 组件
- ✨ 新增兼容性检测工具
- 🐛 修复鸿蒙系统下复制功能不可用的问题
- 📝 完善鸿蒙适配文档

## 🤝 贡献指南

如果您在使用过程中发现问题或有改进建议，欢迎：

1. 提交 Issue 描述问题
2. 提交 Pull Request 改进代码
3. 在社区讨论分享经验

## 📞 联系支持

- **GitHub Issues**: [提交问题](https://github.com/your-repo/issues)
- **邮箱**: support@aetherlink.app
- **文档**: [完整文档](https://docs.aetherlink.app)

---

**注意**: 本适配基于 HarmonyOS 4.0 和 5.0 开发和测试。如果您使用的是其他版本，部分功能可能需要调整。

