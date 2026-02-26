/**
 * Skills Redux Slice
 * 管理技能列表的缓存状态，避免每次发消息都查数据库
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Skill } from '../../types/Skill';
import { SkillManager } from '../../services/skills/SkillManager';

interface SkillsState {
  skills: Skill[];
  loading: boolean;
  initialized: boolean;
}

const initialState: SkillsState = {
  skills: [],
  loading: false,
  initialized: false,
};

/** 加载所有技能到缓存 */
export const loadSkills = createAsyncThunk(
  'skills/loadSkills',
  async () => {
    await SkillManager.initializeBuiltinSkills();
    return SkillManager.getAllSkills();
  }
);

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    setSkills: (state, action: PayloadAction<Skill[]>) => {
      state.skills = action.payload;
    },
    addSkill: (state, action: PayloadAction<Skill>) => {
      state.skills.push(action.payload);
    },
    updateSkill: (state, action: PayloadAction<Skill>) => {
      const index = state.skills.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.skills[index] = action.payload;
      }
    },
    removeSkill: (state, action: PayloadAction<string>) => {
      state.skills = state.skills.filter(s => s.id !== action.payload);
    },
    toggleSkillEnabled: (state, action: PayloadAction<{ id: string; enabled: boolean }>) => {
      const skill = state.skills.find(s => s.id === action.payload.id);
      if (skill) {
        skill.enabled = action.payload.enabled;
        skill.updatedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSkills.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadSkills.fulfilled, (state, action) => {
        state.skills = action.payload;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(loadSkills.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      });
  },
});

export const { setSkills, addSkill, updateSkill, removeSkill, toggleSkillEnabled } = skillsSlice.actions;
export default skillsSlice.reducer;
