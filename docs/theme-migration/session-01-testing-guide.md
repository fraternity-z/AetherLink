# 会话 1 测试指南

## 如何验证 CSS Variables 是否正确注入

### 方法 1：浏览器开发者工具验证

1. **启动应用**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

2. **打开浏览器开发者工具**
   - 按 `F12` 或右键选择"检查"
   - 切换到 "Elements" 或 "元素" 标签页

3. **检查 `:root` 元素的样式**
   - 在元素树中找到 `<html>` 元素
   - 在右侧的样式面板中查看 CSS Variables
   - 你应该能看到类似这样的变量：
     ```css
     :root {
       --theme-primary: #64748B;
       --theme-secondary: #10B981;
       --theme-bg-default: #FFFFFF;
       --theme-bg-paper: #FFFFFF;
       --theme-text-primary: #1E293B;
       --theme-msg-ai-bg: #F8FAFC;
       --theme-msg-user-bg: #E0F2FE;
       /* ... 更多变量 */
     }
     ```

4. **测试主题切换**
   - 在应用中切换主题（设置 → 外观 → 主题风格）
   - 观察 CSS Variables 的值是否动态更新
   - 切换亮色/暗色模式，观察颜色值是否改变

### 方法 2：控制台验证

1. **打开浏览器控制台**
   - 按 `F12` → Console 标签页

2. **运行以下命令查看 CSS Variables**
   ```javascript
   // 查看所有主题变量
   const root = document.documentElement;
   const styles = getComputedStyle(root);
   
   // 查看主要颜色变量
   console.log('Primary:', styles.getPropertyValue('--theme-primary'));
   console.log('Secondary:', styles.getPropertyValue('--theme-secondary'));
   console.log('Background:', styles.getPropertyValue('--theme-bg-default'));
   console.log('AI Message BG:', styles.getPropertyValue('--theme-msg-ai-bg'));
   console.log('User Message BG:', styles.getPropertyValue('--theme-msg-user-bg'));
   ```

3. **查看开发环境初始化日志**
   - 如果是开发模式，应该能在控制台看到：
     ```
     ✅ CSS Variables 系统已初始化
     ```

### 方法 3：使用工具函数验证

1. **在控制台中导入并使用工具函数**
   ```javascript
   // 注意：这需要在应用运行时执行
   // 如果使用了模块化打包，可能需要在代码中添加测试
   
   // 手动测试 CSS Variables
   const testColors = {
     primary: getComputedStyle(document.documentElement).getPropertyValue('--theme-primary'),
     secondary: getComputedStyle(document.documentElement).getPropertyValue('--theme-secondary'),
     bgDefault: getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-default'),
   };
   console.table(testColors);
   ```

## 预期结果

### ✅ 成功标志

1. **CSS Variables 存在**
   - `:root` 元素上有 `--theme-*` 开头的 CSS 变量
   - 所有主要颜色变量都有值（不为空）

2. **主题切换生效**
   - 切换主题风格时，CSS Variables 的值会改变
   - 例如：default → claude，primary 从 `#64748B` 变为 `#D97706`

3. **亮色/暗色模式切换**
   - 切换模式时，颜色值会改变
   - 例如：`--theme-bg-default` 在 light 模式是白色，dark 模式是深色

4. **无错误日志**
   - 控制台没有与 CSS Variables 相关的错误
   - 没有 "CSS Variables 注入失败" 的错误信息

### ❌ 常见问题

1. **CSS Variables 未注入**
   - 检查 `useTheme` hook 是否正确调用
   - 确认 `AppContent.tsx` 已正确导入

2. **颜色值为空**
   - 检查 Design Tokens 配置是否正确
   - 确认主题风格名称拼写正确

3. **切换主题无反应**
   - 检查 Redux store 中的 `themeStyle` 是否正确更新
   - 确认 `useEffect` 依赖项包含 `themeStyle` 和 `mode`

## 完整测试清单

- [ ] 应用启动时 CSS Variables 已注入
- [ ] 切换到 Claude 主题，变量值正确更新
- [ ] 切换到 Nature 主题，变量值正确更新
- [ ] 切换到 Tech 主题，变量值正确更新
- [ ] 切换到 Soft 主题，变量值正确更新
- [ ] 切换回 Default 主题，变量值正确更新
- [ ] 切换亮色/暗色模式，所有主题都正常
- [ ] 控制台无错误日志
- [ ] 应用界面显示正常，无视觉问题

## 下一步

如果所有测试都通过，说明会话 1 的基础架构搭建已经成功完成！

可以继续进行 **会话 2：Material-UI Theme 适配层改造**。

