/**
 * 知识库选择状态 Redux Slice
 * 
 * 管理聊天输入框中的知识库选择状态，替代原有的 sessionStorage + CustomEvent 方案。
 * 
 * 状态生命周期：
 * - 用户选择知识库时设置
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
  /** 当前选中的知识库信息，null 表示未选择 */
  selectedKnowledgeBase: {
    knowledgeBase: SelectedKnowledgeInfo;
    isSelected: boolean;
    searchOnSend: boolean;
  } | null;
}

const initialState: KnowledgeSelectionState = {
  selectedKnowledgeBase: null,
};

const knowledgeSelectionSlice = createSlice({
  name: 'knowledgeSelection',
  initialState,
  reducers: {
    /** 设置选中的知识库 */
    setSelectedKnowledgeBase(
      state,
      action: PayloadAction<SelectedKnowledgeInfo>
    ) {
      state.selectedKnowledgeBase = {
        knowledgeBase: action.payload,
        isSelected: true,
        searchOnSend: true,
      };
    },

    /** 清除选中的知识库 */
    clearSelectedKnowledgeBase(state) {
      state.selectedKnowledgeBase = null;
    },
  },
});

export const {
  setSelectedKnowledgeBase,
  clearSelectedKnowledgeBase,
} = knowledgeSelectionSlice.actions;

export default knowledgeSelectionSlice.reducer;
