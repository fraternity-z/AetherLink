# 对话框返回键处理系统

## 概述

本系统提供了统一的对话框返回键处理机制，确保在移动端使用返回键时能够正确关闭对话框，而不是直接退出应用。

## 核心组件

### 1. useAppState Hook

位置：`src/shared/hooks/useAppState.ts`

全局状态管理，用于跟踪当前打开的对话框：

```typescript
interface AppState {
  showExitConfirm: boolean;
  setShowExitConfirm: (show: boolean) => void;
  // 对话框状态管理
  openDialogs: Set<string>;
  openDialog: (dialogId: string) => void;
  closeDialog: (dialogId: string) => void;
  hasOpenDialogs: () => boolean;
}
```

### 2. BackButtonHandler 组件

位置：`src/components/BackButtonHandler.tsx`

处理Android返回键事件的核心组件：

- 优先检查是否有打开的对话框
- 如果有对话框，关闭最后打开的对话框
- 如果没有对话框，根据当前路由决定行为

### 3. useDialogBackHandler Hook

位置：`src/hooks/useDialogBackHandler.ts`

为对话框组件提供的便捷Hook：

```typescript
export const useDialogBackHandler = (
  dialogId: string,
  open: boolean,
  onClose: () => void
) => {
  // 自动管理对话框状态
  // 监听返回键关闭事件
  // 返回清理函数
}
```

## 使用方法

### 在对话框组件中使用

```typescript
import { useDialogBackHandler } from '../hooks/useDialogBackHandler';

const MyDialog: React.FC<MyDialogProps> = ({ open, onClose }) => {
  const DIALOG_ID = 'my-dialog'; // 唯一标识符
  
  // 使用Hook处理返回键
  const { handleClose } = useDialogBackHandler(DIALOG_ID, open, onClose);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // ... 其他属性
    >
      {/* 对话框内容 */}
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleClose}>确定</Button>
      </DialogActions>
    </Dialog>
  );
};
```

### 手动管理对话框状态

如果需要更精细的控制，可以直接使用 `useAppState`：

```typescript
import { useAppState } from '../shared/hooks/useAppState';

const MyComponent = () => {
  const { openDialog, closeDialog, hasOpenDialogs } = useAppState();
  
  const handleOpenDialog = () => {
    openDialog('my-dialog-id');
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    closeDialog('my-dialog-id');
    setDialogOpen(false);
  };
};
```

## 工作原理

### 1. 对话框打开时
- Hook自动调用 `openDialog(dialogId)` 将对话框ID添加到全局状态
- BackButtonHandler 可以检测到有对话框打开

### 2. 返回键按下时
- BackButtonHandler 检查 `hasOpenDialogs()`
- 如果有对话框，获取最后打开的对话框ID
- 触发 `closeDialog` 事件，通知对应的对话框关闭

### 3. 对话框关闭时
- Hook自动调用 `closeDialog(dialogId)` 从全局状态中移除
- 清理事件监听器

## 已实现的组件

### SystemPromptDialog
位置：`src/components/SystemPromptDialog.tsx`

系统提示词编辑对话框，已完整实现返回键处理：

```typescript
const DIALOG_ID = 'system-prompt-dialog';
const { handleClose } = useDialogBackHandler(DIALOG_ID, open, onClose);
```

## 待实现的组件

以下对话框组件建议添加返回键处理：

1. **ModelManagementDialog** (`src/components/ModelManagementDialog.tsx`)
2. **VoiceRecognitionModal** (`src/components/VoiceRecognition/VoiceRecognitionModal.tsx`)
3. **AssistantIconPicker** (`src/components/TopicManagement/AssistantTab/AssistantIconPicker.tsx`)
4. **DialogModelSelector** (`src/pages/ChatPage/components/DialogModelSelector.tsx`)
5. **各种备份相关对话框** (`src/pages/Settings/DataSettings/components/backup/`)

## 最佳实践

### 1. 对话框ID命名规范
- 使用kebab-case格式：`my-dialog-name`
- 确保在应用中唯一
- 建议使用组件名称作为前缀

### 2. 错误处理
```typescript
const { handleClose } = useDialogBackHandler(DIALOG_ID, open, onClose);

// 在保存等操作中使用handleClose而不是直接调用onClose
const handleSave = async () => {
  try {
    await saveData();
    handleClose(); // 这会正确清理对话框状态
  } catch (error) {
    // 错误处理，不关闭对话框
  }
};
```

### 3. 嵌套对话框
系统支持多个对话框同时打开，返回键会关闭最后打开的对话框：

```typescript
// 父对话框
const { handleClose: handleParentClose } = useDialogBackHandler('parent-dialog', parentOpen, onParentClose);

// 子对话框
const { handleClose: handleChildClose } = useDialogBackHandler('child-dialog', childOpen, onChildClose);
```

## 调试

### 检查对话框状态
```typescript
const { openDialogs, hasOpenDialogs } = useAppState();

console.log('当前打开的对话框:', Array.from(openDialogs));
console.log('是否有对话框打开:', hasOpenDialogs());
```

### 事件监听
```typescript
// 监听对话框关闭事件
window.addEventListener('closeDialog', (event) => {
  console.log('关闭对话框:', event.detail.dialogId);
});
```

## 注意事项

1. **唯一性**：确保每个对话框的ID在应用中是唯一的
2. **清理**：Hook会自动处理清理，无需手动移除监听器
3. **性能**：状态管理使用Set数据结构，性能良好
4. **兼容性**：仅在移动端（Capacitor环境）生效，Web端不受影响

## 未来改进

1. **类型安全**：可以考虑使用字符串字面量类型来约束对话框ID
2. **优先级**：为对话框添加优先级概念，控制关闭顺序
3. **动画**：支持对话框关闭动画的协调
4. **持久化**：在应用重启后恢复对话框状态（如果需要）
