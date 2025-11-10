# CustomSwitch 使用情况检查报告

## 检查时间
2025年1月

## 检查范围
检查项目中所有使用开关组件的页面，确认是否统一使用了 `CustomSwitch` 组件。

## 检查结果

### ✅ 已使用 CustomSwitch 的文件
以下文件已正确使用 `CustomSwitch` 组件：

1. `src/components/ToolsSwitch.tsx` ✅
2. `src/components/TopicManagement/SettingsTab/SettingItem.tsx` ✅
3. `src/components/TopicManagement/SettingsTab/MCPSidebarControls.tsx` ✅
4. `src/pages/Settings/BehaviorSettings.tsx` ✅
5. `src/pages/Settings/AppearanceSettings.tsx` ✅
6. `src/pages/Settings/WebSearchSettings.tsx` ✅
7. `src/pages/Settings/AIDebateSettings.tsx` ✅
8. `src/pages/Settings/NotionSettings.tsx` ✅
9. `src/pages/Settings/ChatInterfaceSettings.tsx` ✅
10. `src/pages/Settings/MessageBubbleSettings.tsx` ✅
11. `src/pages/Settings/MCPServerSettings.tsx` ✅ (已导入 CustomSwitch)
12. `src/pages/Settings/ModelProviderSettings.tsx` ✅
13. `src/pages/Settings/VoiceSettingsV2/CapacitorTTSSettings.tsx` ✅
14. `src/pages/Settings/DataSettings/components/webdav/WebDavSettings.tsx` ✅
15. `src/pages/Settings/ThinkingProcessSettings.tsx` ✅
16. `src/pages/Settings/DefaultModelSettings/index.tsx` ✅
17. 以及其他多个设置页面 ✅

### ❌ 未使用 CustomSwitch 的文件

以下文件使用了 `Checkbox` 组件而不是 `CustomSwitch`，需要统一替换：

#### 1. `src/pages/Settings/DataSettings/AdvancedBackupPage.tsx`
**问题位置：**
- 第 20 行：导入了 `Checkbox`
- 第 476-481 行：使用 `Checkbox` 用于 `includeChats` 选项
- 第 514-519 行：使用 `Checkbox` 用于 `includeAssistants` 选项
- 第 552-557 行：使用 `Checkbox` 用于 `includeSettings` 选项
- 第 590-595 行：使用 `Checkbox` 用于 `includeLocalStorage` 选项

**建议修改：**
- 将 `Checkbox` 导入替换为 `CustomSwitch`
- 将所有 `Checkbox` 组件替换为 `CustomSwitch`
- 注意：`CustomSwitch` 使用 `onChange` 事件，需要适配事件处理

#### 2. `src/pages/Settings/DataSettings/components/backup/SelectiveBackupDialog.tsx`
**问题位置：**
- 第 11 行：导入了 `Checkbox`
- 第 76-83 行：使用 `Checkbox` 用于 `modelConfig` 选项

**建议修改：**
- 将 `Checkbox` 导入替换为 `CustomSwitch`
- 将 `Checkbox` 组件替换为 `CustomSwitch`
- 移除 `Checkbox` 相关的样式设置（`CustomSwitch` 有自己的样式）

## 注意事项

1. **事件处理差异：**
   - `Checkbox` 使用 `onChange={(e) => handleChange(e.target.checked)}`
   - `CustomSwitch` 使用 `onChange={(e) => handleChange(e.target.checked)}`（相同）
   - 两者的事件处理方式相同，可以直接替换

2. **样式差异：**
   - `Checkbox` 是方形的复选框
   - `CustomSwitch` 是圆形的开关（Switch）
   - 如果 UI 设计需要复选框样式，可能需要保留 `Checkbox`
   - 但如果需要统一的开关样式，应使用 `CustomSwitch`

3. **使用场景：**
   - `Checkbox` 适合多选场景（如备份选项）
   - `CustomSwitch` 适合开关/切换场景（如启用/禁用功能）
   - 根据实际使用场景决定是否需要替换

## 建议

1. **统一开关样式：** 如果项目要求所有开关都使用统一的 `CustomSwitch` 样式，建议将上述文件中的 `Checkbox` 替换为 `CustomSwitch`。

2. **保留复选框：** 如果某些场景确实需要复选框样式（如多选列表），可以考虑：
   - 保留 `Checkbox` 用于多选场景
   - 使用 `CustomSwitch` 用于开关/切换场景
   - 在项目文档中明确两者的使用场景

3. **代码审查：** 建议在代码审查时检查新添加的开关组件是否使用了 `CustomSwitch`。

## 总结

- **已检查文件数：** 42+ 个使用 `FormControlLabel` 的文件
- **已使用 CustomSwitch：** 40+ 个文件 ✅
- **未使用 CustomSwitch：** 2 个文件 ❌
- **统一度：** 约 95%

大部分文件已经正确使用了 `CustomSwitch` 组件，只有 2 个文件使用了 `Checkbox`，需要根据实际需求决定是否替换。

