import { create } from 'zustand';

interface DialogInfo {
  id: string;
  onClose?: () => void;
  timestamp: number;
}

interface AppState {
  showExitConfirm: boolean;
  setShowExitConfirm: (show: boolean) => void;
  // 对话框状态管理 - 使用数组栈保证 LIFO 顺序
  dialogStack: DialogInfo[];
  openDialog: (dialogId: string, onClose?: () => void) => void;
  closeDialog: (dialogId: string) => void;
  closeLastDialog: () => boolean; // 返回是否成功关闭
  hasOpenDialogs: () => boolean;
  getLastDialog: () => DialogInfo | null;
}

/**
 * 应用状态管理钩子
 * 用于管理全局应用状态，如退出确认对话框的显示状态和对话框管理
 * 
 * 改进：
 * 1. 使用数组栈替代 Set，保证 LIFO（后进先出）顺序
 * 2. 支持对话框关闭回调，避免使用事件系统
 * 3. 添加时间戳，便于调试和排序
 */
export const useAppState = create<AppState>((set, get) => ({
  showExitConfirm: false,
  setShowExitConfirm: (show) => set({ showExitConfirm: show }),

  // 对话框状态管理 - 使用数组栈
  dialogStack: [],
  
  /**
   * 打开对话框
   * @param dialogId 对话框唯一标识符
   * @param onClose 关闭回调函数（可选）
   */
  openDialog: (dialogId: string, onClose?: () => void) => {
    set((state) => {
      // 如果对话框已存在，先移除旧记录（避免重复）
      const filteredStack = state.dialogStack.filter(d => d.id !== dialogId);
      // 添加到栈顶（最后打开的对话框）
      return {
        dialogStack: [...filteredStack, {
          id: dialogId,
          onClose,
          timestamp: Date.now()
        }]
      };
    });
  },
  
  /**
   * 关闭指定对话框
   * @param dialogId 对话框唯一标识符
   * @param skipCallback 是否跳过回调（用于手动关闭时）
   */
  closeDialog: (dialogId: string, skipCallback: boolean = true) => {
    set((state) => {
      const dialog = state.dialogStack.find(d => d.id === dialogId);
      if (dialog && !skipCallback) {
        // 只有在不跳过回调时才执行（通常用于外部调用）
        dialog.onClose?.();
      }
      // 从栈中移除
      return {
        dialogStack: state.dialogStack.filter(d => d.id !== dialogId)
      };
    });
  },
  
  /**
   * 关闭最后一个打开的对话框（栈顶）
   * @returns 是否成功关闭了对话框
   */
  closeLastDialog: () => {
    const state = get();
    if (state.dialogStack.length === 0) {
      return false;
    }
    
    const lastDialog = state.dialogStack[state.dialogStack.length - 1];
    // 执行关闭回调
    lastDialog.onClose?.();
    
    // 从栈中移除
    set({
      dialogStack: state.dialogStack.slice(0, -1)
    });
    
    return true;
  },
  
  /**
   * 检查是否有打开的对话框
   */
  hasOpenDialogs: () => get().dialogStack.length > 0,
  
  /**
   * 获取最后一个打开的对话框
   */
  getLastDialog: () => {
    const stack = get().dialogStack;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  },
}));
