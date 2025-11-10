# 移动端触觉反馈测试指南 📱

## ✅ 已完成的修复

### 1. **正确导入 Capacitor Haptics 插件**
```typescript
import { Haptics as CapacitorHaptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
```

### 2. **优先使用原生 API**
- 移动端优先使用 Capacitor Haptics API
- Web 端降级到 Vibration API
- 完整的错误处理和日志

### 3. **添加详细日志**
所有触觉反馈操作都会在控制台输出日志，方便调试：
```
🎵 [Haptic] Capacitor 原生平台，使用 Haptics API
🎵 [Haptic] 触发 drawerPulse 反馈
```

## 📱 移动端测试步骤

### 方法 1：直接重新构建 APK（推荐）

1. **清理旧构建**
```bash
cd J:\Cherry\AetherLink-app3
npm run clean
```

2. **重新构建并同步到 Android**
```bash
npm run build:android
```
或
```bash
npm run build && npx cap sync android
```

3. **打开 Android Studio**
```bash
npm run open:android
```

4. **运行应用**
- 在 Android Studio 中点击 Run 按钮
- 或使用命令：`npx cap run android`

### 方法 2：开发模式测试

1. **启动开发服务器**
```bash
npm run dev -- --host
```

2. **连接手机到电脑**（USB 调试模式）

3. **运行到手机**
```bash
npm run dev:android
```

### 方法 3：直接安装已构建的 APK

如果之前已经构建过：
1. 找到 APK 文件：`android/app/build/outputs/apk/debug/app-debug.apk`
2. 卸载旧版本应用
3. 安装新版本 APK
4. 打开应用测试

## 🔍 调试步骤

### 1. 启用 Chrome DevTools（推荐）

1. **手机连接电脑**，启用 USB 调试

2. **打开 Chrome 浏览器**，访问：
```
chrome://inspect/#devices
```

3. **找到你的设备和应用**，点击 "inspect"

4. **在 Console 中查看日志**：
   - 打开/关闭侧边栏时应该看到：
   ```
   🎬 MotionSidebar渲染 #X
   🎵 [Haptic] 侧边栏状态变化: {...}
   🎵 [Haptic] 触发侧边栏触觉反馈！
   🎵 [Haptic] Capacitor 原生平台，使用 Haptics API
   🎵 [Haptic] 触发 drawerPulse 反馈
   ```

### 2. 使用 Android Logcat

```bash
# 查看所有日志
adb logcat

# 只看你的应用日志
adb logcat | grep "AetherLink"

# 过滤 Capacitor 日志
adb logcat | grep "Capacitor"
```

### 3. 检查设置状态

在 Chrome DevTools Console 中运行：
```javascript
// 查看触觉反馈设置
JSON.parse(localStorage.getItem('settings')).hapticFeedback
```

应该显示：
```json
{
  "enabled": true,
  "enableOnSidebar": true,
  "enableOnSwitch": true,
  "enableOnListItem": false
}
```

## ⚙️ 如果还是没有触觉反馈

### 检查清单：

#### 1. ✅ 手机设置
- [ ] 手机**未开启静音模式**
- [ ] 手机**振动功能已启用**
- [ ] **触摸振动反馈已开启**（系统设置 → 声音与振动）

#### 2. ✅ 应用设置
- [ ] 进入 **设置 > 行为设置**
- [ ] **启用触觉反馈** 开关是开启状态 ✅
- [ ] **侧边栏触觉反馈** 开关是开启状态 ✅

#### 3. ✅ 权限检查
某些 Android 设备可能需要振动权限。检查 `AndroidManifest.xml`：
```xml
<uses-permission android:name="android.permission.VIBRATE" />
```

#### 4. ✅ 重启应用
- 完全关闭应用
- 从后台任务中清除
- 重新打开应用

#### 5. ✅ 清除应用数据
```bash
# 清除应用数据和缓存
adb shell pm clear com.llmhouse.app
```
或在手机上：设置 → 应用 → AetherLink → 存储 → 清除数据

## 🎯 触觉反馈强度说明

### Capacitor 提供 3 种强度级别：

| 触觉类型 | Capacitor 强度 | 振动时长 | 使用场景 |
|---------|---------------|---------|---------|
| `light()` | ImpactStyle.Light | 10ms | 按钮点击 |
| `soft()` / `drawerPulse()` | ImpactStyle.Medium | 15ms | 侧边栏、列表 |
| `medium()` | ImpactStyle.Medium | 20ms | 开关切换 |

### iOS vs Android 差异

- **iOS**：使用 Taptic Engine，提供更细腻的触觉反馈
- **Android**：使用振动马达，反馈可能稍强

## 📋 测试用例

### 测试 1：侧边栏触觉反馈
1. 打开应用
2. 点击左上角菜单按钮打开侧边栏 → 应该有振动
3. 点击关闭按钮关闭侧边栏 → 应该有振动
4. 在侧边栏外点击关闭 → 应该有振动

### 测试 2：开关触觉反馈
1. 进入 **设置 > 行为设置**
2. 切换任意开关 → 应该有振动反馈

### 测试 3：设置中的测试
1. 进入 **设置 > 行为设置 > 触觉反馈**
2. 切换 "启用触觉反馈" → 应该有中等强度振动
3. 切换 "侧边栏触觉反馈" → 应该有侧边栏专用振动
4. 切换 "开关触觉反馈" → 应该有柔和振动

## 🐛 常见问题

### Q1: 我看到日志但没有振动
**A:** 检查手机是否开启静音模式，某些手机在静音模式下会禁用所有振动。

### Q2: 只在设置页面有振动，侧边栏没有
**A:** 清除应用数据或 localStorage，重新加载默认设置。

### Q3: iOS 没有触觉反馈
**A:** iOS 需要物理设备测试，模拟器不支持触觉反馈。确保设备支持 Haptic Engine（iPhone 7 及以上）。

### Q4: Android 振动太强
**A:** 可以在代码中调整：
```typescript
// 在 hapticFeedback.ts 中
// 将 ImpactStyle.Medium 改为 ImpactStyle.Light
await CapacitorHaptics.impact({ style: ImpactStyle.Light });
```

## 📊 验证成功的标志

✅ **成功的日志输出示例：**
```
🎬 MotionSidebar渲染 #1 { mobileOpen: false, desktopOpen: true }
🎵 [Haptic] 初次渲染，跳过触觉反馈
🎵 [Haptic] 侧边栏状态变化: {
  from: false,
  to: true,
  hapticSettings: {
    enabled: true,
    enableOnSidebar: true,
    enableOnSwitch: true,
    enableOnListItem: false
  },
  enabled: true,
  enableOnSidebar: true
}
🎵 [Haptic] 触发侧边栏触觉反馈！
🎵 [Haptic] Capacitor 原生平台，使用 Haptics API
🎵 [Haptic] 触发 drawerPulse 反馈
```

## 🚀 快速验证命令

```bash
# 1. 重新构建
cd J:\Cherry\AetherLink-app3
npm run build:android

# 2. 打开 Android Studio
npm run open:android

# 3. 运行到手机
# 在 Android Studio 中点击 Run 按钮

# 4. 启用 Chrome DevTools 调试
# 打开 chrome://inspect/#devices
# 点击你的设备下的 "inspect"

# 5. 测试侧边栏
# 打开/关闭侧边栏，查看控制台日志和振动反馈
```

---

**如果以上所有步骤都完成了还是不工作，请提供：**
1. Chrome DevTools Console 的完整日志
2. 手机型号和 Android 版本
3. 应用版本和构建时间

祝测试顺利！🎉

