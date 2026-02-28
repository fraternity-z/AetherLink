/**
 * 知识库选择状态 Redux Slice
 * 
 * 管理聊天输入框中的知识库选择状态，替代原有的 sessionStorage + CustomEvent 方案。
 * 支持多知识库并行选择。
 * 
 * 状态生命周期：
 * - 用户选择知识库时设置（支持多选）
 * - 消息发送并搜索知识库后自动清除
 * - 用户手动点击芯片关闭按钮时清除
 * - 不需要持久化（会话级状态）
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/** 已选择的知识库信息 */
export interface SelectedKnowledgeInfo {
  id: string;
  name: string;
  documentCount?: number;
}

/** 知识库选择状态 */
export interface KnowledgeSelectionState {
  /** 当前选中的知识库列表 */
  selectedKnowledgeBases: SelectedKnowledgeInfo[];
  /** 是否在发送时搜索 */
  searchOnSend: boolean;
  /** 向后兼容：单选视图 */
  selectedKnowledgeBase: {
    knowledgeBase: SelectedKnowledgeInfo;
    isSelected: boolean;
    searchOnSend: boolean;
  } | null;
}

const initialState: KnowledgeSelectionState = {
  selectedKnowledgeBases: [],
  searchOnSend: true,
  selectedKnowledgeBase: null,
};

/** 同步单选兼容字段 */
function syncLegacyField(state: KnowledgeSelectionState) {
  if (state.selectedKnowledgeBases.length > 0) {
    state.selectedKnowledgeBase = {
      knowledgeBase: state.selectedKnowledgeBases[0],
      isSelected: true,
      searchOnSend: state.searchOnSend,
    };
  } else {
    state.selectedKnowledgeBase = null;
  }
}

const knowledgeSelectionSlice = createSlice({
  name: 'knowledgeSelection',
  initialState,
  reducers: {
    /** 设置选中的知识库（替换所有已选，兼容旧的单选调用） */
    setSelectedKnowledgeBase(
      state,
      action: PayloadAction<SelectedKnowledgeInfo>
    ) {
      state.selectedKnowledgeBases = [action.payload];
      state.searchOnSend = true;
      syncLegacyField(state);
    },

    /** 切换知识库选中状态（多选模式） */
    toggleKnowledgeBase(
      state,
      action: PayloadAction<SelectedKnowledgeInfo>
    ) {
      const idx = state.selectedKnowledgeBases.findIndex(kb => kb.id === action.payload.id);
      if (idx >= 0) {
        state.selectedKnowledgeBases.splice(idx, 1);
      } else {
        state.selectedKnowledgeBases.push(action.payload);
      }
      state.searchOnSend = true;
      syncLegacyField(state);
    },

    /** 移除单个知识库 */
    removeSelectedKnowledgeBase(
      state,
      action: PayloadAction<string>
    ) {
      state.selectedKnowledgeBases = state.selectedKnowledgeBases.filter(kb => kb.id !== action.payload);
      syncLegacyField(state);
    },

    /** 清除所有选中的知识库 */
    clearSelectedKnowledgeBase(state) {
      state.selectedKnowledgeBases = [];
      state.searchOnSend = true;
      state.selectedKnowledgeBase = null;
    },
  },
});

export const {
  setSelectedKnowledgeBase,
  toggleKnowledgeBase,
  removeSelectedKnowledgeBase,
  clearSelectedKnowledgeBase,
} = knowledgeSelectionSlice.actions;

export default knowledgeSelectionSlice.reducer;
