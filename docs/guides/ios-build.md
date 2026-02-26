# AetherLink iOS 构建和安装指南

## 🚀 自动构建

### GitHub Actions 构建
- **推送到主分支**: 自动触发 iOS 构建，生成未签名的 IPA 文件
- **发布标签**: 创建 `v*` 标签时自动构建并发布到 GitHub Releases

### 下载构建产物
1. 访问 [GitHub Actions](../../actions) 页面
2. 选择最新的 "iOS Build" 工作流运行
3. 下载 `ios-app-unsigned` 压缩包
4. 解压获得 `AetherLink-unsigned.ipa` 文件

## 📱 安装方法

### 方法一：AltStore / SideStore（推荐）
**适用于**: 所有 iOS 设备，无需越狱

1. **安装 AltStore**:
   - 访问 [altstore.io](https://altstore.io/) 下载 AltStore
   - 按照官方指南安装到 iOS 设备

2. **安装应用**:
   - 将 `AetherLink-unsigned.ipa` 传输到 iOS 设备
   - 使用 AltStore 打开 IPA 文件
   - 点击安装

3. **信任开发者**:
   - 设置 → 通用 → VPN与设备管理
   - 找到开发者证书并信任

### 方法二：Xcode（需要开发者账号）
**适用于**: 有 Mac 和 Apple 开发者账号的用户

1. 在 Mac 上打开 Xcode
2. 连接 iOS 设备到 Mac
3. 打开 Window → Devices and Simulators
4. 将 IPA 文件拖拽到设备列表中

### 方法三：第三方工具
**适用于**: 高级用户

- **3uTools**: Windows/Mac 工具，可能需要越狱设备
- **iMazing**: 商业软件，支持安装未签名应用
- **Cydia Impactor**: 需要开发者账号

### 方法四：重新签名
**适用于**: 有开发者证书的用户

1. 下载 [iOS App Signer](https://github.com/DanTheMan827/ios-app-signer)
2. 使用您的开发者证书重新签名 IPA
3. 安装签名后的 IPA 文件

## 🛠️ 本地构建

### 环境要求
- macOS 系统
- Xcode 14+ 
- Node.js 22+
- CocoaPods

### 构建步骤
```bash
# 1. 安装依赖
npm install

# 2. 构建 Web 应用
npm run build

# 3. 同步到 iOS 项目
npm run build:ios

# 4. 打开 Xcode 项目
npm run open:ios

# 5. 在 Xcode 中构建和导出 IPA
```

### Xcode 中的设置
1. 选择 "Any iOS Device" 作为目标
2. Product → Archive 创建归档
3. 在 Organizer 中选择 "Distribute App"
4. 选择 "Development" 或 "Ad Hoc" 分发方式
5. 导出 IPA 文件

## ⚠️ 重要提醒

### 法律和安全
- 此 IPA 文件未经 Apple 官方签名
- 仅供个人测试和学习使用
- 某些安装方法可能违反 Apple 服务条款
- 请自行承担使用风险

### 技术限制
- 未签名应用可能无法使用某些系统功能
- 应用可能会定期失效，需要重新安装
- 推送通知等功能可能受限

### 建议
- 仅在测试设备上安装
- 定期备份设备数据
- 关注应用更新和安全补丁

## 🔧 故障排除

### 安装失败
- 确保设备有足够存储空间
- 检查 iOS 版本兼容性
- 尝试重启设备后再安装

### 应用闪退
- 检查是否已信任开发者证书
- 查看设备日志获取错误信息
- 尝试重新安装应用

### 功能异常
- 检查网络连接
- 确认应用权限设置
- 查看应用内设置选项

## 📞 支持

如果遇到问题，请：
1. 查看 [GitHub Issues](../../issues)
2. 提交新的 Issue 并附上详细信息
3. 参考官方文档和社区讨论

---

**免责声明**: 本指南仅供教育和测试目的。使用未签名应用可能存在安全风险，请谨慎使用。
