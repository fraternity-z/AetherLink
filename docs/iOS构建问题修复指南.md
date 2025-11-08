# iOS构建问题修复指南

## 问题描述

构建失败，主要错误：
```
iOS 26.1 Platform Not Installed
```

## 问题原因

1. **Xcode版本配置错误**：构建环境使用了不存在的 `Xcode_26.1_Release_Candidate.app`
2. **Storyboard工具版本过旧**：Interface Builder文件使用了过时的toolsVersion

## 已完成的修复

### ✅ 1. 更新Storyboard文件

已将以下文件更新到合理的工具版本（Xcode 14.x兼容）：
- `ios/App/App/Base.lproj/Main.storyboard` - toolsVersion从14111更新到21701
- `ios/App/App/Base.lproj/LaunchScreen.storyboard` - toolsVersion从17132更新到21701

## 需要的额外操作

### 🔧 2. 修复CI/CD环境配置

#### 如果使用GitHub Actions：

在workflow文件中添加正确的Xcode选择：

```yaml
- name: 选择正确的Xcode版本
  run: |
    # 列出所有可用的Xcode版本
    sudo ls -1 /Applications | grep "Xcode"
    
    # 选择合适的Xcode版本（例如15.2）
    sudo xcode-select -s /Applications/Xcode_15.2.app/Contents/Developer
    
    # 验证Xcode版本
    xcodebuild -version
```

推荐的runner版本：
- `macos-13` - 提供Xcode 14.x 和 15.x
- `macos-14` - 提供Xcode 15.x（推荐）
- `macos-15` - 提供Xcode 16.x（最新）

**参考文件**：`.github/workflows/ios-build.yml`（已创建）

#### 如果使用其他CI平台：

**GitLab CI**:
```yaml
build_ios:
  tags:
    - macos
  before_script:
    - sudo xcode-select -s /Applications/Xcode_15.2.app/Contents/Developer
    - xcodebuild -version
```

**Bitrise**:
在Stack选择中选择：
- `Xcode 15.2.x on macOS 13`
- `Xcode 15.3.x on macOS 14`

**CircleCI**:
```yaml
macos:
  xcode: "15.2.0"
```

### 🔧 3. 本地构建修复

如果在本地Mac上遇到类似问题：

```bash
# 1. 检查当前Xcode版本
xcode-select -p
xcodebuild -version

# 2. 如果版本不对，切换到正确版本
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# 3. 清理构建缓存
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData/*
xcodebuild clean -workspace App.xcworkspace -scheme App

# 4. 重新安装CocoaPods依赖
pod deintegrate
pod install --repo-update

# 5. 重新构建
cd ../..
npm run build
npx cap sync ios
```

### 🔧 4. 其他警告修复（可选但建议）

#### 4.1 修复Splash资源警告

```
warning: The image set "Splash" has 3 unassigned children.
```

检查 `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json` 并确保所有图片都正确分配。

#### 4.2 添加CocoaPods脚本输出

在 `ios/App/Podfile` 的 `post_install` 中添加：

```ruby
post_install do |installer|
  assertDeploymentTarget(installer)
  
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      if config.name == 'Debug'
        config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
      end
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
    end
    
    # 修复CocoaPods脚本警告
    target.build_phases.each do |phase|
      if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
        if phase.name&.include?("Copy XCFrameworks") || 
           phase.name&.include?("Embed Pods Frameworks")
          phase.always_out_of_date = "1"
        end
      end
    end
  end
end
```

#### 4.3 Capacitor插件警告

这些是来自第三方插件的警告，暂时不影响构建：
- `WKProcessPool` 已废弃警告（来自Capacitor核心）
- `UIDocumentPickerViewController` 初始化方法废弃（来自file-picker插件）
- Metal toolchain路径警告（系统问题，可忽略）

## 验证修复

运行以下命令验证修复是否成功：

```bash
# 1. 同步项目
npx cap sync ios

# 2. 在Xcode中打开项目
npx cap open ios

# 3. 在Xcode中：
#    - 检查构建设置中的iOS部署目标（应该是14.0）
#    - 尝试构建项目（Cmd+B）
```

## iOS版本对照表

| Xcode版本 | iOS SDK | Swift版本 | macOS要求 |
|----------|---------|-----------|-----------|
| 14.3.1   | 16.4    | 5.8       | 13.0+     |
| 15.0     | 17.0    | 5.9       | 13.5+     |
| 15.2     | 17.2    | 5.9.2     | 13.5+     |
| 15.3     | 17.4    | 5.10      | 14.0+     |
| 16.0     | 18.0    | 6.0       | 14.5+     |

## 总结

主要修复措施：
1. ✅ **已完成**：更新storyboard文件到合理版本
2. ⚠️ **需要操作**：在CI/CD环境中指定正确的Xcode版本
3. 📝 **建议**：清理构建缓存并重新安装依赖

如果问题仍然存在，请检查：
- CI/CD环境是否有权限访问Xcode
- Xcode命令行工具是否正确安装
- CocoaPods版本是否兼容（建议1.12.0+）

