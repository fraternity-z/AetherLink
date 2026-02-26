# Agentic Loop UI 集成指南

## 组件说明

**文件位置：**
- `src/components/Chat/AgenticLoopIndicator.tsx` - React 组件
- `src/components/Chat/AgenticLoopIndicator.css` - 样式文件

## 功能特性

### 显示内容
- ✅ 当前迭代次数 / 最大迭代次数
- ✅ 连续错误计数（仅在有错误时显示）
- ✅ 进度条可视化
- ✅ 循环状态（进行中/已完成）
- ✅ 完成原因和摘要
- ✅ 建议执行的命令（如果有）

### 状态样式
| 状态 | 颜色 | 图标 |
|------|------|------|
| 进行中 | 蓝色 | 🔄 (旋转动画) |
| 成功完成 | 绿色 | ✅ |
| 达到限制 | 橙色 | ⏱️ |
| 错误过多 | 红色 | ⚠️ |
| 用户取消 | 灰色 | 🚫 |

### 动画效果
- 滑入动画（从右侧）
- 旋转图标（进行中状态）
- 脉冲效果（所有状态）
- 自动隐藏（完成后2秒）

## 集成步骤

### 方法 1：在聊天页面中集成（推荐）

找到主聊天页面组件（例如 `src/pages/Chat/ChatPage.tsx`），添加组件：

```typescript
import { AgenticLoopIndicator } from '../../components/Chat/AgenticLoopIndicator';

function ChatPage() {
  return (
    <div className="chat-page">
      {/* 其他聊天内容 */}
      
      {/* Agentic 循环指示器 - 固定在右下角 */}
      <AgenticLoopIndicator />
    </div>
  );
}
```

### 方法 2：在 App 根组件中全局集成

如果希望在所有页面显示（适用于全局状态监控）：

```typescript
// src/App.tsx
import { AgenticLoopIndicator } from './components/Chat/AgenticLoopIndicator';

function App() {
  return (
    <>
      <Router>
        {/* 路由内容 */}
      </Router>
      
      {/* 全局 Agentic 循环指示器 */}
      <AgenticLoopIndicator />
    </>
  );
}
```

## 样式定制

### 位置调整

修改 `.agentic-loop-indicator` 的位置：

```css
.agentic-loop-indicator {
  /* 默认：右下角 */
  bottom: 80px;
  right: 20px;
  
  /* 改为左下角 */
  /* bottom: 80px; */
  /* left: 20px; */
  
  /* 改为顶部居中 */
  /* top: 20px; */
  /* left: 50%; */
  /* transform: translateX(-50%); */
}
```

### 颜色主题

修改状态颜色：

```css
/* 进行中 - 默认蓝色 */
.agentic-loop-indicator--active {
  border-left: 4px solid #2196F3;
}

/* 成功 - 默认绿色 */
.agentic-loop-indicator--success {
  border-left: 4px solid #4CAF50;
}

/* 警告 - 默认橙色 */
.agentic-loop-indicator--warning {
  border-left: 4px solid #FF9800;
}

/* 错误 - 默认红色 */
.agentic-loop-indicator--error {
  border-left: 4px solid #F44336;
}
```

### 尺寸调整

```css
.agentic-loop-indicator {
  /* 默认尺寸 */
  min-width: 280px;
  max-width: 380px;
  padding: 16px;
  
  /* 缩小版 */
  /* min-width: 220px; */
  /* max-width: 300px; */
  /* padding: 12px; */
}
```

## 事件监听

组件自动监听 `AgenticLoopService` 的以下事件：

```typescript
agenticLoopService.on('iteration:start', handler);  // 迭代开始
agenticLoopService.on('iteration:end', handler);    // 迭代结束
agenticLoopService.on('complete', handler);         // 循环完成
agenticLoopService.on('mistake', handler);          // 发生错误
agenticLoopService.on('error', handler);            // 致命错误
```

## 手动控制

如果需要手动控制显示/隐藏：

```typescript
import { agenticLoopService } from '../../shared/services/AgenticLoopService';

// 获取当前状态
const state = agenticLoopService.getState();
console.log('Is Agentic Mode:', state.isAgenticMode);
console.log('Current Iteration:', state.currentIteration);

// 手动取消循环（会触发 UI 更新）
agenticLoopService.cancel();
```

## 移动端适配

组件已内置移动端响应式设计：

```css
@media (max-width: 768px) {
  .agentic-loop-indicator {
    /* 移动端全宽显示 */
    bottom: 60px;
    right: 10px;
    left: 10px;
  }
}
```

## 暗黑模式支持

组件自动适配系统暗黑模式：

```css
@media (prefers-color-scheme: dark) {
  .agentic-loop-indicator {
    background: rgba(40, 40, 40, 0.95);
    color: #e0e0e0;
  }
}
```

## 测试建议

### 手动测试

1. **触发 Agentic 模式**
   - 启用 `@aether/file-editor` MCP
   - 发送需要多步操作的任务

2. **观察指示器**
   - 确认迭代次数递增
   - 验证进度条更新
   - 检查完成状态显示

3. **测试终止条件**
   - 等待 AI 调用 `attempt_completion`
   - 故意触发连续错误
   - 观察达到最大迭代次数

### 自动化测试（未实现，仅建议）

```typescript
// 示例：单元测试
describe('AgenticLoopIndicator', () => {
  it('should display iteration count', () => {
    // 测试迭代计数显示
  });

  it('should show completion message', () => {
    // 测试完成消息显示
  });

  it('should hide after completion', () => {
    // 测试自动隐藏功能
  });
});
```

## 故障排查

### 问题：组件不显示

**解决方案：**
1. 确认 `@aether/file-editor` MCP 已启用
2. 检查 `AgenticLoopService` 是否正确启动循环
3. 查看浏览器控制台是否有错误

### 问题：样式错乱

**解决方案：**
1. 确认 CSS 文件已正确导入
2. 检查是否有样式冲突
3. 清除浏览器缓存

### 问题：状态不更新

**解决方案：**
1. 确认事件监听器正确注册
2. 检查 `AgenticLoopService` 是否正常触发事件
3. 查看 React DevTools 确认状态变化

## 未来增强建议

- [ ] 添加折叠/展开功能
- [ ] 支持拖拽改变位置
- [ ] 添加详细日志查看
- [ ] 提供用户暂停/继续控制
- [ ] 添加声音通知选项
- [ ] 支持自定义主题色
