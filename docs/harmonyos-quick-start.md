# 鸿蒙适配快速上手指南

## 🚀 5分钟快速集成

### 第一步：检测鸿蒙系统

```typescript
import { isHarmonyOS, getPlatformInfo } from '@/shared/utils/platformDetection';

// 简单检测
if (isHarmonyOS()) {
  console.log('当前设备运行在鸿蒙系统上');
}

// 详细信息
const platformInfo = getPlatformInfo();
console.log('平台信息:', platformInfo);
```

### 第二步：使用剪贴板（最常用）

```typescript
import { platformAdapter } from '@/shared/adapters/PlatformAdapter';

// 复制文本（自动处理鸿蒙权限）
async function copyText() {
  try {
    await platformAdapter.clipboard.writeText('Hello');
    alert('复制成功');
  } catch (error) {
    alert('复制失败: ' + error.message);
  }
}

// 粘贴文本（自动处理鸿蒙权限）
async function pasteText() {
  try {
    const text = await platformAdapter.clipboard.readText();
    console.log('粘贴的内容:', text);
  } catch (error) {
    alert('粘贴失败: ' + error.message);
  }
}
```

### 第三步：在 UI 中使用

```tsx
import { HarmonyOSClipboardButton } from '@/components/HarmonyOS';

function MyComponent() {
  return (
    <HarmonyOSClipboardButton
      text="要复制的内容"
      onSuccess={() => console.log('复制成功')}
      onError={(err) => console.error(err)}
    />
  );
}
```

## 🎯 常用场景

### 场景1: 复制按钮

```tsx
import { HarmonyOSClipboardButton } from '@/components/HarmonyOS';

<HarmonyOSClipboardButton 
  text={messageContent} 
  tooltip="复制消息"
/>
```

### 场景2: 文件上传

```typescript
import { harmonyOSFileService } from '@/shared/services/HarmonyOSFileService';

async function uploadFile() {
  try {
    const file = await harmonyOSFileService.pickFile();
    if (file) {
      // 处理文件
    }
  } catch (error) {
    console.error('文件选择失败:', error);
  }
}
```

### 场景3: 拍照功能

```typescript
import { harmonyOSCameraService } from '@/shared/services/HarmonyOSCameraService';

async function takePicture() {
  try {
    const result = await harmonyOSCameraService.takePicture();
    console.log('照片:', result.dataUrl);
  } catch (error) {
    console.error('拍照失败:', error);
  }
}
```

### 场景4: 权限守卫

```tsx
import { HarmonyOSPermissionGuard } from '@/components/HarmonyOS';
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';

<HarmonyOSPermissionGuard
  permission={HarmonyOSPermission.CAMERA}
  autoRequest={true}
  fallback={<div>需要相机权限</div>}
>
  <CameraComponent />
</HarmonyOSPermissionGuard>
```

## ⚡ 最佳实践

### 1. 统一使用 platformAdapter

```typescript
// ✅ 推荐：使用统一适配器
import { platformAdapter } from '@/shared/adapters/PlatformAdapter';
await platformAdapter.clipboard.writeText(text);

// ❌ 不推荐：直接使用原生 API
await navigator.clipboard.writeText(text); // 鸿蒙可能失败
```

### 2. 处理权限拒绝

```typescript
try {
  await platformAdapter.clipboard.writeText(text);
} catch (error) {
  if (error.message.includes('权限')) {
    // 引导用户到设置
    alert('请在设置中开启剪贴板权限');
  }
}
```

### 3. 使用鸿蒙专用组件

```tsx
// ✅ 推荐：使用鸿蒙适配组件
import { HarmonyOSClipboardButton } from '@/components/HarmonyOS';
<HarmonyOSClipboardButton text={text} />

// ❌ 不推荐：普通按钮 + 原生 API
<button onClick={() => navigator.clipboard.writeText(text)}>
  复制
</button>
```

## 🔍 调试技巧

### 1. 启用鸿蒙兼容性检查

在应用启动时添加：

```typescript
import { initHarmonyOSCompatibilityCheck } from '@/shared/utils/harmonyOSDetector';

// 在 App.tsx 或 main.tsx 中
initHarmonyOSCompatibilityCheck();
```

这会在控制台输出详细的兼容性报告。

### 2. 查看权限状态

```typescript
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';

const hasPermission = await harmonyOSPermissionService.hasPermission(
  HarmonyOSPermission.WRITE_CLIPBOARD
);
console.log('剪贴板权限:', hasPermission ? '已授予' : '未授予');
```

### 3. 清除权限缓存

```typescript
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';

// 如果权限状态异常，清除缓存重试
harmonyOSPermissionService.clearPermissionCache();
```

## ❓ 常见问题

**Q: 复制按钮点击后没反应？**
```typescript
// 检查是否在鸿蒙系统上
import { isHarmonyOS } from '@/shared/utils/platformDetection';
console.log('是否鸿蒙:', isHarmonyOS());

// 检查权限
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';
const status = await harmonyOSPermissionService.checkPermission(
  HarmonyOSPermission.WRITE_CLIPBOARD
);
console.log('权限状态:', status);
```

**Q: 如何手动请求权限？**
```typescript
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';

const result = await harmonyOSPermissionService.requestPermission(
  HarmonyOSPermission.WRITE_CLIPBOARD
);

if (result.status === 'granted') {
  console.log('权限已授予');
} else {
  console.error('权限被拒绝:', result.error);
}
```

**Q: 如何打开系统设置？**
```typescript
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';

await harmonyOSPermissionService.openAppSettings();
```

## 📚 更多资源

- [完整文档](./harmonyos-adaptation.md)
- [API 参考](../src/shared/config/harmonyOSConfig.ts)
- [示例代码](../src/components/HarmonyOS/)

## 💡 提示

1. 所有需要权限的操作都会自动处理权限请求
2. 权限被拒绝时会有友好的错误提示
3. 使用 `platformAdapter` 可以自动适配所有平台
4. 鸿蒙特有的 UI 组件在 `@/components/HarmonyOS` 中

---

开始使用吧！如有问题，请查看[完整文档](./harmonyos-adaptation.md)。

