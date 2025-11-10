# 鸿蒙适配迁移指南

## 📝 如何将现有代码迁移到鸿蒙适配版本

本指南帮助您快速将现有的剪贴板、文件、相机等功能迁移到鸿蒙适配版本。

---

## 🔄 剪贴板功能迁移

### 旧代码（不支持鸿蒙）

```typescript
// ❌ 直接使用 navigator.clipboard
await navigator.clipboard.writeText(text);
const text = await navigator.clipboard.readText();

// ❌ 或直接使用 Capacitor Clipboard
import { Clipboard } from '@capacitor/clipboard';
await Clipboard.write({ string: text });
```

### 新代码（支持鸿蒙）

```typescript
// ✅ 使用 platformAdapter（自动处理鸿蒙权限）
import { platformAdapter } from '@/shared/adapters/PlatformAdapter';

await platformAdapter.clipboard.writeText(text);
const text = await platformAdapter.clipboard.readText();
```

### 批量替换建议

1. 全局搜索 `navigator.clipboard.writeText`
2. 替换为 `platformAdapter.clipboard.writeText`
3. 添加导入: `import { platformAdapter } from '@/shared/adapters/PlatformAdapter';`

---

## 📁 文件功能迁移

### 旧代码

```typescript
// ❌ 直接使用 Capacitor Filesystem
import { Filesystem } from '@capacitor/filesystem';
await Filesystem.readFile({ path, directory });
```

### 新代码

```typescript
// ✅ 使用 HarmonyOSFileService（自动处理权限）
import { harmonyOSFileService } from '@/shared/services/HarmonyOSFileService';

const content = await harmonyOSFileService.readFile(path);
await harmonyOSFileService.writeFile(path, data);
```

---

## 📷 相机功能迁移

### 旧代码

```typescript
// ❌ 直接使用 Capacitor Camera
import { Camera } from '@capacitor/camera';
const photo = await Camera.getPhoto({ ... });
```

### 新代码

```typescript
// ✅ 使用 HarmonyOSCameraService（自动处理权限）
import { harmonyOSCameraService } from '@/shared/services/HarmonyOSCameraService';

const result = await harmonyOSCameraService.takePicture();
const result = await harmonyOSCameraService.pickFromGallery();
```

---

## 🔔 通知功能迁移

### 旧代码

```typescript
// ❌ 直接使用 Capacitor LocalNotifications
import { LocalNotifications } from '@capacitor/local-notifications';
await LocalNotifications.schedule({ ... });
```

### 新代码

```typescript
// ✅ 使用 HarmonyOSNotificationService（自动处理权限）
import { harmonyOSNotificationService } from '@/shared/services/HarmonyOSNotificationService';

await harmonyOSNotificationService.showNotification({
  title: '标题',
  body: '内容',
});
```

---

## 🎨 UI 组件迁移

### 复制按钮

#### 旧代码

```tsx
// ❌ 普通按钮 + navigator.clipboard
<IconButton onClick={() => navigator.clipboard.writeText(text)}>
  <Copy />
</IconButton>
```

#### 新代码

```tsx
// ✅ 使用鸿蒙适配组件
import { HarmonyOSClipboardButton } from '@/components/HarmonyOS';

<HarmonyOSClipboardButton 
  text={text}
  onSuccess={() => console.log('成功')}
  onError={(err) => console.error(err)}
/>
```

---

## 🛡️ 添加权限守卫

### 为需要权限的功能添加守卫

```tsx
import { HarmonyOSPermissionGuard } from '@/components/HarmonyOS';
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';

// 包裹需要权限的组件
<HarmonyOSPermissionGuard
  permission={HarmonyOSPermission.CAMERA}
  autoRequest={true}
  fallback={<div>需要相机权限才能使用此功能</div>}
>
  <CameraComponent />
</HarmonyOSPermissionGuard>
```

---

## 📋 完整迁移步骤

### 步骤 1: 识别需要迁移的代码

搜索以下关键词：
- `navigator.clipboard`
- `Clipboard.write`
- `Clipboard.read`
- `Filesystem.readFile`
- `Filesystem.writeFile`
- `Camera.getPhoto`
- `LocalNotifications.schedule`

### 步骤 2: 替换为适配版本

按照上述示例逐个替换。

### 步骤 3: 添加必要的导入

```typescript
// 平台检测
import { isHarmonyOS } from '@/shared/utils/platformDetection';

// 统一适配器
import { platformAdapter } from '@/shared/adapters/PlatformAdapter';

// 鸿蒙服务
import { harmonyOSPermissionService } from '@/shared/services/HarmonyOSPermissionService';
import { harmonyOSFileService } from '@/shared/services/HarmonyOSFileService';
import { harmonyOSCameraService } from '@/shared/services/HarmonyOSCameraService';
import { harmonyOSNotificationService } from '@/shared/services/HarmonyOSNotificationService';

// UI 组件
import { 
  HarmonyOSPermissionDialog,
  HarmonyOSPermissionGuard,
  HarmonyOSClipboardButton 
} from '@/components/HarmonyOS';

// 配置和类型
import { HarmonyOSPermission } from '@/shared/config/harmonyOSConfig';
```

### 步骤 4: 测试

1. 在鸿蒙设备上测试
2. 测试权限请求流程
3. 测试权限被拒绝的情况
4. 测试"永久拒绝"后的引导

---

## ⚡ 快速参考

### 最常用的替换

| 旧代码 | 新代码 |
|--------|--------|
| `navigator.clipboard.writeText(text)` | `platformAdapter.clipboard.writeText(text)` |
| `navigator.clipboard.readText()` | `platformAdapter.clipboard.readText()` |
| `Clipboard.write({ string: text })` | `platformAdapter.clipboard.writeText(text)` |
| `Clipboard.read()` | `platformAdapter.clipboard.readText()` |

### 错误处理

```typescript
try {
  await platformAdapter.clipboard.writeText(text);
} catch (error) {
  if (error.message.includes('权限')) {
    // 权限相关错误
    console.error('需要授予剪贴板权限');
  } else {
    // 其他错误
    console.error('操作失败:', error);
  }
}
```

---

## 🎯 迁移优先级

### 高优先级（必须迁移）
1. ✅ 剪贴板功能 - 鸿蒙必需权限
2. ✅ 文件访问 - 鸿蒙必需权限

### 中优先级（建议迁移）
3. ⚠️ 相机功能 - 提升用户体验
4. ⚠️ 通知功能 - 提升用户体验

### 低优先级（可选迁移）
5. 📝 其他功能 - 视具体情况而定

---

## 🧪 测试清单

迁移完成后，请测试以下场景：

- [ ] 首次使用功能，权限请求正常弹出
- [ ] 授予权限后功能正常工作
- [ ] 拒绝权限后有友好提示
- [ ] "永久拒绝"后能引导到设置
- [ ] 在非鸿蒙设备上功能正常
- [ ] 在 Web 环境下功能正常

---

## 💡 提示

1. **渐进式迁移**: 可以先迁移关键功能，其他功能逐步迁移
2. **向后兼容**: 新的适配器和服务在非鸿蒙设备上也能正常工作
3. **统一接口**: 使用 `platformAdapter` 可以自动适配所有平台
4. **错误处理**: 记得添加 try-catch 处理权限错误

---

## 📚 相关文档

- [完整适配文档](./harmonyos-adaptation.md)
- [快速上手指南](./harmonyos-quick-start.md)
- [集成示例](../src/examples/HarmonyOSIntegrationExample.tsx)

---

**开始迁移吧！如有问题，请查看文档或提交 Issue。**

