/**
 * Agentic Files Slice
 * 管理 Agentic 模式下 AI 编辑的文件状态
 * 
 * 功能：
 * - 跟踪文件创建、修改、删除操作
 * - 保存原始内容和修改后内容用于 Diff 显示
 * - 支持接受/拒绝单个文件修改
 * - 支持批量接受/拒绝所有修改
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/** 文件操作类型 */
export type FileOperationType = 'create' | 'modify' | 'delete' | 'rename' | 'move';

/** 文件修改状态 */
export type FileChangeStatus = 'pending' | 'accepted' | 'rejected';

/** 单个文件修改记录 */
export interface FileChange {
  /** 唯一标识 */
  id: string;
  /** 文件路径 */
  path: string;
  /** 操作类型 */
  operation: FileOperationType;
  /** 原始内容 (修改/删除时) */
  originalContent?: string;
  /** 新内容 (创建/修改时) */
  newContent?: string;
  /** 重命名/移动时的新路径 */
  newPath?: string;
  /** 修改状态 */
  status: FileChangeStatus;
  /** 时间戳 */
  timestamp: number;
  /** 关联的消息 ID */
  messageId?: string;
  /** 关联的 Topic ID */
  topicId?: string;
  /** Diff 统计 */
  diffStats?: {
    added: number;
    removed: number;
  };
  /** 备份文件路径 */
  backupPath?: string;
  /** 是否为新文件 */
  isNewFile?: boolean;
}

/** Agentic Files 状态 */
export interface AgenticFilesState {
  /** 是否处于 Agentic 模式 */
  isAgenticMode: boolean;
  /** 当前会话的文件修改列表 */
  changes: FileChange[];
  /** 当前展开查看的文件 ID */
  expandedFileId: string | null;
  /** 是否显示文件列表面板 */
  isPanelVisible: boolean;
  /** 当前 Topic ID */
  currentTopicId: string | null;
}

const initialState: AgenticFilesState = {
  isAgenticMode: false,
  changes: [],
  expandedFileId: null,
  isPanelVisible: true,
  currentTopicId: null,
};

export const agenticFilesSlice = createSlice({
  name: 'agenticFiles',
  initialState,
  reducers: {
    /** 设置 Agentic 模式状态 */
    setAgenticMode: (state, action: PayloadAction<boolean>) => {
      state.isAgenticMode = action.payload;
      // 退出 Agentic 模式时不清空修改列表，让用户可以继续查看
    },

    /** 设置当前 Topic ID */
    setCurrentTopicId: (state, action: PayloadAction<string | null>) => {
      state.currentTopicId = action.payload;
    },

    /** 添加文件修改记录 */
    addFileChange: (state, action: PayloadAction<Omit<FileChange, 'id' | 'timestamp' | 'status'>>) => {
      const change: FileChange = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        status: 'pending',
      };

      // 检查是否已存在相同路径的修改，如果有则更新
      const existingIndex = state.changes.findIndex(c => c.path === change.path && c.status === 'pending');
      if (existingIndex !== -1) {
        // 保留原始内容，更新新内容
        const existing = state.changes[existingIndex];
        state.changes[existingIndex] = {
          ...change,
          originalContent: existing.originalContent, // 保留最初的原始内容
        };
      } else {
        state.changes.push(change);
      }
    },

    /** 更新文件修改状态 */
    updateFileChangeStatus: (state, action: PayloadAction<{ id: string; status: FileChangeStatus }>) => {
      const change = state.changes.find(c => c.id === action.payload.id);
      if (change) {
        change.status = action.payload.status;
      }
    },

    /** 接受单个文件修改 */
    acceptFileChange: (state, action: PayloadAction<string>) => {
      const change = state.changes.find(c => c.id === action.payload);
      if (change) {
        change.status = 'accepted';
      }
    },

    /** 拒绝单个文件修改 (需要恢复原始内容) */
    rejectFileChange: (state, action: PayloadAction<string>) => {
      const change = state.changes.find(c => c.id === action.payload);
      if (change) {
        change.status = 'rejected';
      }
    },

    /** 接受所有待处理的修改 */
    acceptAllChanges: (state) => {
      state.changes.forEach(change => {
        if (change.status === 'pending') {
          change.status = 'accepted';
        }
      });
    },

    /** 拒绝所有待处理的修改 */
    rejectAllChanges: (state) => {
      state.changes.forEach(change => {
        if (change.status === 'pending') {
          change.status = 'rejected';
        }
      });
    },

    /** 移除单个文件修改记录 */
    removeFileChange: (state, action: PayloadAction<string>) => {
      state.changes = state.changes.filter(c => c.id !== action.payload);
    },

    /** 清空所有文件修改记录 */
    clearAllChanges: (state) => {
      state.changes = [];
      state.expandedFileId = null;
    },

    /** 清空指定 Topic 的文件修改记录 */
    clearTopicChanges: (state, action: PayloadAction<string>) => {
      state.changes = state.changes.filter(c => c.topicId !== action.payload);
    },

    /** 设置展开查看的文件 */
    setExpandedFileId: (state, action: PayloadAction<string | null>) => {
      state.expandedFileId = action.payload;
    },

    /** 切换面板可见性 */
    togglePanelVisibility: (state) => {
      state.isPanelVisible = !state.isPanelVisible;
    },

    /** 设置面板可见性 */
    setPanelVisibility: (state, action: PayloadAction<boolean>) => {
      state.isPanelVisible = action.payload;
    },
  },
});

export const {
  setAgenticMode,
  setCurrentTopicId,
  addFileChange,
  updateFileChangeStatus,
  acceptFileChange,
  rejectFileChange,
  acceptAllChanges,
  rejectAllChanges,
  removeFileChange,
  clearAllChanges,
  clearTopicChanges,
  setExpandedFileId,
  togglePanelVisibility,
  setPanelVisibility,
} = agenticFilesSlice.actions;

export default agenticFilesSlice.reducer;
