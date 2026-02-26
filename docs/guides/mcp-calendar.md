# 日历 MCP 使用指南

## 概述

`@aether/calendar` 是 AetherLink 的内置日历 MCP 服务器，提供完整的日历事件管理功能，包括创建、查询、修改和删除日历事件。

## 功能特性

### 1. 获取日历列表 (`get_calendars`)
获取设备上的所有日历。

**参数：** 无

**返回示例：**
```json
{
  "calendars": [
    {
      "id": "1",
      "name": "默认日历",
      "displayName": "我的日历",
      "isPrimary": true
    }
  ]
}
```

### 2. 查询日历事件 (`get_calendar_events`)
获取指定时间范围内的日历事件。

**参数：**
- `startDate` (必填): 开始日期，ISO 8601格式，例如 `2025-11-08T00:00:00.000Z`
- `endDate` (必填): 结束日期，ISO 8601格式，例如 `2025-11-15T23:59:59.999Z`
- `calendarId` (可选): 日历ID，如果不提供则查询所有日历

**返回示例：**
```json
{
  "events": [
    {
      "id": "event-123",
      "title": "团队会议",
      "startDate": "2025-11-10T10:00:00.000Z",
      "endDate": "2025-11-10T11:00:00.000Z",
      "location": "会议室A",
      "notes": "讨论项目进度",
      "calendarId": "1"
    }
  ],
  "count": 1
}
```

### 3. 创建日历事件 (`create_calendar_event`)
创建新的日历事件。

**参数：**
- `title` (必填): 事件标题
- `startDate` (必填): 开始时间，ISO 8601格式
- `endDate` (必填): 结束时间，ISO 8601格式
- `location` (可选): 事件地点
- `notes` (可选): 事件备注
- `calendarId` (可选): 目标日历ID，如果不提供则使用默认日历

**返回示例：**
```json
{
  "success": true,
  "message": "成功创建日历事件: 团队会议",
  "event": {
    "title": "团队会议",
    "startDate": "2025-11-10T10:00:00.000Z",
    "endDate": "2025-11-10T11:00:00.000Z",
    "location": "会议室A",
    "notes": "讨论项目进度"
  }
}
```

### 4. 更新日历事件 (`update_calendar_event`)
更新已存在的日历事件。

**参数：**
- `eventId` (必填): 要更新的事件ID
- `title` (可选): 新的事件标题
- `startDate` (可选): 新的开始时间，ISO 8601格式
- `endDate` (可选): 新的结束时间，ISO 8601格式
- `location` (可选): 新的事件地点
- `notes` (可选): 新的事件备注

**返回示例：**
```json
{
  "success": true,
  "message": "成功更新日历事件: event-123",
  "updates": {
    "eventId": "event-123",
    "title": "项目评审会议"
  }
}
```

### 5. 删除日历事件 (`delete_calendar_event`)
删除日历事件。

**参数：**
- `eventId` (必填): 要删除的事件ID
- `startDate` (必填): 事件开始时间，ISO 8601格式
- `endDate` (必填): 事件结束时间，ISO 8601格式

**返回示例：**
```json
{
  "success": true,
  "message": "成功删除日历事件: event-123"
}
```

## 启用日历 MCP

1. 打开 AetherLink 应用
2. 进入 **设置** → **MCP 服务器设置**
3. 找到 **@aether/calendar** 并启用
4. 在对话中，AI 助手将能够使用日历功能

## 使用示例

### 示例 1: 查询本周的日程
**用户：** "帮我看看本周有什么安排"

AI 会调用 `get_calendar_events` 工具，传入本周的开始和结束日期。

### 示例 2: 创建会议提醒
**用户：** "下周一上午10点安排一个团队会议，地点在会议室A"

AI 会调用 `create_calendar_event` 工具：
```javascript
{
  "title": "团队会议",
  "startDate": "2025-11-11T02:00:00.000Z",
  "endDate": "2025-11-11T03:00:00.000Z",
  "location": "会议室A"
}
```

### 示例 3: 修改现有事件
**用户：** "把明天的会议改到下午3点"

AI 会先查询明天的事件，然后调用 `update_calendar_event` 更新时间。

## 权限配置

### Android
已在 `AndroidManifest.xml` 中配置：
```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

### iOS
已在 `Info.plist` 中配置：
- `NSCalendarsFullAccessUsageDescription` (iOS 17+)
- `NSCalendarsWriteOnlyAccessUsageDescription` (iOS 17+)
- `NSCalendarsUsageDescription` (iOS 13-16)

## 技术实现

### 插件
使用 `cordova-plugin-calendar` 插件，兼容 Capacitor 框架。

### 文件结构
```
src/shared/
├── config/
│   └── builtinMCPServers.ts          # 日历 MCP 配置
├── services/mcp/
    ├── core/
    │   └── MCPServerFactory.ts       # 服务器工厂
    └── servers/
        └── CalendarServer.ts         # 日历服务器实现
```

### Mock 模式
在非移动端环境（如浏览器开发），日历 MCP 会运行在 Mock 模式，返回模拟数据，便于开发和测试。

## 常见问题

### Q: 为什么在浏览器中无法使用？
A: 日历功能需要原生设备支持。在浏览器中会显示模拟数据，实际功能需要在 Android 或 iOS 设备上运行。

### Q: 如何授予日历权限？
A: 首次使用日历功能时，应用会自动请求权限。请在系统弹窗中允许访问日历。

### Q: 可以访问多个日历吗？
A: 可以。使用 `get_calendars` 获取所有日历列表，然后在创建事件时指定 `calendarId` 参数。

## 未来计划

- [ ] 支持重复事件
- [ ] 支持事件提醒
- [ ] 支持邀请参与者
- [ ] 支持日历颜色和图标
- [ ] 支持日历同步状态

## 技术支持

如有问题，请访问：https://github.com/your-repo/AetherLink-app3/issues

