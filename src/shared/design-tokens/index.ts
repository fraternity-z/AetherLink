/**
 * Design Tokens 定义
 * 
 * 这个文件包含了所有主题的设计令牌定义
 * 所有颜色值都从这里统一管理
 */

import type { DesignTokens, ThemeColorTokens } from './types';

/**
 * 默认主题 - 简洁现代的默认设计风格
 */
const defaultTheme: ThemeColorTokens = {
  primary: { value: '#64748B' },
  secondary: { value: '#10B981' },
  
  background: {
    default: { light: '#FFFFFF', dark: '#1A1A1A' },
    paper: { light: '#FFFFFF', dark: '#2A2A2A' },
    elevated: { light: '#FAFAFA', dark: '#333333' },
  },
  
  text: {
    primary: { light: '#1E293B', dark: '#F0F0F0' },
    secondary: { light: '#64748B', dark: '#B0B0B0' },
    disabled: { light: '#94A3B8', dark: '#6B7280' },
    hint: { light: '#CBD5E1', dark: '#4B5563' },
  },
  
  border: {
    default: { light: 'rgba(0, 0, 0, 0.12)', dark: 'rgba(255, 255, 255, 0.12)' },
    subtle: { light: 'rgba(0, 0, 0, 0.06)', dark: 'rgba(255, 255, 255, 0.06)' },
    strong: { light: 'rgba(0, 0, 0, 0.23)', dark: 'rgba(255, 255, 255, 0.23)' },
    focus: { light: '#64748B', dark: '#94A3B8' },
  },
  
  interaction: {
    hover: { light: 'rgba(100, 116, 139, 0.08)', dark: 'rgba(100, 116, 139, 0.16)' },
    active: { light: 'rgba(100, 116, 139, 0.12)', dark: 'rgba(100, 116, 139, 0.24)' },
    selected: { light: 'rgba(100, 116, 139, 0.16)', dark: 'rgba(100, 116, 139, 0.32)' },
    disabled: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.04)' },
  },
  
  message: {
    ai: {
      background: { light: '#F8FAFC', dark: '#2D3748' },
      backgroundActive: { light: '#F1F5F9', dark: '#374151' },
      text: { light: '#1E293B', dark: '#F0F0F0' },
      border: { light: 'rgba(100, 116, 139, 0.2)', dark: 'rgba(100, 116, 139, 0.3)' },
    },
    user: {
      background: { light: '#E0F2FE', dark: '#1E3A5F' },
      backgroundActive: { light: '#BAE6FD', dark: '#2C5282' },
      text: { light: '#0C4A6E', dark: '#E0F2FE' },
      border: { light: 'rgba(14, 165, 233, 0.3)', dark: 'rgba(14, 165, 233, 0.4)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  button: {
    primary: {
      background: { light: '#64748B', dark: '#94A3B8' },
      text: { light: '#FFFFFF', dark: '#0F172A' },
      border: { light: '#64748B', dark: '#94A3B8' },
      hover: { light: '#475569', dark: '#CBD5E1' },
    },
    secondary: {
      background: { light: '#F1F5F9', dark: '#334155' },
      text: { light: '#475569', dark: '#E2E8F0' },
      border: { light: '#E2E8F0', dark: '#475569' },
      hover: { light: '#E2E8F0', dark: '#475569' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#1E293B' },
    text: { light: '#1E293B', dark: '#F0F0F0' },
    placeholder: { light: '#94A3B8', dark: '#64748B' },
    border: { light: 'rgba(0, 0, 0, 0.23)', dark: 'rgba(255, 255, 255, 0.23)' },
    borderHover: { light: '#64748B', dark: '#94A3B8' },
    borderFocus: { light: '#64748B', dark: '#94A3B8' },
  },
  
  sidebar: {
    background: { light: '#FFFFFF', dark: '#1A1A1A' },
    itemHover: { light: 'rgba(100, 116, 139, 0.08)', dark: 'rgba(100, 116, 139, 0.16)' },
    itemSelected: { light: 'rgba(100, 116, 139, 0.12)', dark: 'rgba(100, 116, 139, 0.24)' },
    itemSelectedHover: { light: 'rgba(100, 116, 139, 0.16)', dark: 'rgba(100, 116, 139, 0.32)' },
    border: { light: 'rgba(0, 0, 0, 0.12)', dark: 'rgba(255, 255, 255, 0.12)' },
  },
  
  icon: {
    default: { light: '#1976D2', dark: '#64B5F6' },
    success: { value: '#4CAF50' },
    warning: { value: '#FF9800' },
    error: { value: '#f44336' },
    info: { value: '#2196F3' },
  },
  
  toolbar: {
    background: { light: 'rgba(255, 255, 255, 0.85)', dark: 'rgba(30, 30, 30, 0.85)' },
    border: { light: 'rgba(230, 230, 230, 0.8)', dark: 'rgba(60, 60, 60, 0.8)' },
    shadow: { light: 'rgba(0, 0, 0, 0.07)', dark: 'rgba(0, 0, 0, 0.15)' },
  },
  
  messageBlock: {
    background: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.02)' },
    backgroundHover: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.05)' },
    backgroundContent: { light: 'rgba(0, 0, 0, 0.03)', dark: 'rgba(0, 0, 0, 0.2)' },
    backgroundHeader: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.05)' },
    codeBackground: { light: 'rgba(0, 0, 0, 0.05)', dark: 'rgba(0, 0, 0, 0.3)' },
    scrollbarThumb: { light: 'rgba(0, 0, 0, 0.2)', dark: 'rgba(255, 255, 255, 0.2)' },
    scrollbarTrack: { light: 'transparent', dark: 'transparent' },
  },
  
  gradients: {
    primary: 'linear-gradient(90deg, #9333EA, #754AB4)',
  },
};

/**
 * Claude 风格 - 温暖优雅的 Claude AI 设计风格
 */
const claudeTheme: ThemeColorTokens = {
  primary: { value: '#D97706' },
  secondary: { value: '#059669' },
  accent: { value: '#DC2626' },
  
  background: {
    default: { light: '#FEF7ED', dark: '#1C1917' },
    paper: { light: '#FEF7ED', dark: '#292524' },
    elevated: { light: '#FFF8E7', dark: '#332F2C' },
  },
  
  text: {
    primary: { light: '#1C1917', dark: '#F5F5F4' },
    secondary: { light: '#78716C', dark: '#A8A29E' },
    disabled: { light: '#A8A29E', dark: '#78716C' },
    hint: { light: '#D6D3D1', dark: '#57534E' },
  },
  
  border: {
    default: { light: 'rgba(217, 119, 6, 0.12)', dark: 'rgba(217, 119, 6, 0.2)' },
    subtle: { light: 'rgba(217, 119, 6, 0.06)', dark: 'rgba(217, 119, 6, 0.1)' },
    strong: { light: 'rgba(217, 119, 6, 0.23)', dark: 'rgba(217, 119, 6, 0.3)' },
    focus: { light: '#D97706', dark: '#F59E0B' },
  },
  
  interaction: {
    hover: { light: 'rgba(217, 119, 6, 0.08)', dark: 'rgba(217, 119, 6, 0.12)' },
    active: { light: 'rgba(217, 119, 6, 0.12)', dark: 'rgba(217, 119, 6, 0.16)' },
    selected: { light: 'rgba(217, 119, 6, 0.16)', dark: 'rgba(217, 119, 6, 0.20)' },
    disabled: { light: 'rgba(217, 119, 6, 0.04)', dark: 'rgba(217, 119, 6, 0.06)' },
  },
  
  message: {
    ai: {
      background: { light: '#FFF8E7', dark: '#292524' },
      backgroundActive: { light: '#FEEFD0', dark: '#322C28' },
      text: { light: '#1C1917', dark: '#F5F5F4' },
      border: { light: 'rgba(217, 119, 6, 0.2)', dark: 'rgba(217, 119, 6, 0.3)' },
    },
    user: {
      background: { light: '#FED7AA', dark: '#7C2D12' },
      backgroundActive: { light: '#FDBA74', dark: '#9A3412' },
      text: { light: '#7C2D12', dark: '#FED7AA' },
      border: { light: 'rgba(234, 88, 12, 0.3)', dark: 'rgba(234, 88, 12, 0.4)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  button: {
    primary: {
      background: { light: '#D97706', dark: '#F59E0B' },
      text: { light: '#FFFFFF', dark: '#1C1917' },
      border: { light: '#D97706', dark: '#F59E0B' },
      hover: { light: '#B45309', dark: '#FCD34D' },
    },
    secondary: {
      background: { light: '#FFF8E7', dark: '#44403C' },
      text: { light: '#78716C', dark: '#E7E5E4' },
      border: { light: '#E7E5E4', dark: '#57534E' },
      hover: { light: '#FEEFD0', dark: '#57534E' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#292524' },
    text: { light: '#1C1917', dark: '#F5F5F4' },
    placeholder: { light: '#A8A29E', dark: '#78716C' },
    border: { light: 'rgba(120, 113, 108, 0.3)', dark: 'rgba(168, 162, 158, 0.3)' },
    borderHover: { light: 'rgba(217, 119, 6, 0.5)', dark: 'rgba(217, 119, 6, 0.7)' },
    borderFocus: { light: '#D97706', dark: '#F59E0B' },
  },
  
  sidebar: {
    background: { light: '#FEF7ED', dark: '#1C1917' },
    itemHover: { light: 'rgba(217, 119, 6, 0.08)', dark: 'rgba(217, 119, 6, 0.12)' },
    itemSelected: { light: 'rgba(217, 119, 6, 0.12)', dark: 'rgba(217, 119, 6, 0.16)' },
    itemSelectedHover: { light: 'rgba(217, 119, 6, 0.16)', dark: 'rgba(217, 119, 6, 0.20)' },
    border: { light: 'rgba(217, 119, 6, 0.1)', dark: 'rgba(217, 119, 6, 0.2)' },
  },
  
  icon: {
    default: { light: '#D97706', dark: '#F59E0B' },
    success: { value: '#059669' },
    warning: { value: '#F59E0B' },
    error: { value: '#DC2626' },
    info: { value: '#3B82F6' },
  },
  
  toolbar: {
    background: { light: 'rgba(254, 247, 237, 0.85)', dark: 'rgba(28, 25, 23, 0.85)' },
    border: { light: 'rgba(217, 119, 6, 0.2)', dark: 'rgba(217, 119, 6, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.07)', dark: 'rgba(0, 0, 0, 0.15)' },
  },
  
  messageBlock: {
    background: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.02)' },
    backgroundHover: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.05)' },
    backgroundContent: { light: 'rgba(0, 0, 0, 0.03)', dark: 'rgba(0, 0, 0, 0.2)' },
    backgroundHeader: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.05)' },
    codeBackground: { light: 'rgba(0, 0, 0, 0.05)', dark: 'rgba(0, 0, 0, 0.3)' },
    scrollbarThumb: { light: 'rgba(0, 0, 0, 0.2)', dark: 'rgba(255, 255, 255, 0.2)' },
    scrollbarTrack: { light: 'transparent', dark: 'transparent' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #D97706, #EA580C)',
    secondary: 'linear-gradient(135deg, #059669, #047857)',
  },
};

/**
 * 自然风格 - 2025年流行的自然系大地色调设计
 */
const natureTheme: ThemeColorTokens = {
  primary: { value: '#2D5016' },
  secondary: { value: '#8B7355' },
  accent: { value: '#C7B299' },
  
  background: {
    default: { light: '#F7F5F3', dark: '#1A1F16' },
    paper: { light: '#F7F5F3', dark: '#252B20' },
    elevated: { light: '#FDFCFB', dark: '#2F3529' },
  },
  
  text: {
    primary: { light: '#1A1F16', dark: '#E8E6E3' },
    secondary: { light: '#5D6B47', dark: '#B8B5B0' },
    disabled: { light: '#9CA389', dark: '#6B7055' },
    hint: { light: '#D4D2CB', dark: '#4A5040' },
  },
  
  border: {
    default: { light: 'rgba(45, 80, 22, 0.12)', dark: 'rgba(45, 80, 22, 0.2)' },
    subtle: { light: 'rgba(45, 80, 22, 0.06)', dark: 'rgba(45, 80, 22, 0.1)' },
    strong: { light: 'rgba(45, 80, 22, 0.23)', dark: 'rgba(45, 80, 22, 0.3)' },
    focus: { light: '#2D5016', dark: '#5D6B47' },
  },
  
  interaction: {
    hover: { light: 'rgba(45, 80, 22, 0.08)', dark: 'rgba(45, 80, 22, 0.12)' },
    active: { light: 'rgba(45, 80, 22, 0.12)', dark: 'rgba(45, 80, 22, 0.16)' },
    selected: { light: 'rgba(45, 80, 22, 0.16)', dark: 'rgba(45, 80, 22, 0.20)' },
    disabled: { light: 'rgba(45, 80, 22, 0.04)', dark: 'rgba(45, 80, 22, 0.06)' },
  },
  
  message: {
    ai: {
      background: { light: '#FDFCFB', dark: '#252B20' },
      backgroundActive: { light: '#F5F3EF', dark: '#2F3529' },
      text: { light: '#1A1F16', dark: '#E8E6E3' },
      border: { light: 'rgba(45, 80, 22, 0.2)', dark: 'rgba(45, 80, 22, 0.3)' },
    },
    user: {
      background: { light: '#E8E3D8', dark: '#3D4E2C' },
      backgroundActive: { light: '#DED9CC', dark: '#4A5E36' },
      text: { light: '#2D5016', dark: '#E8E3D8' },
      border: { light: 'rgba(93, 107, 71, 0.3)', dark: 'rgba(93, 107, 71, 0.4)' },
    },
    system: {
      background: { light: '#F5EDDC', dark: '#4A4035' },
      text: { light: '#654321', dark: '#E8DCC8' },
      border: { light: 'rgba(139, 115, 85, 0.3)', dark: 'rgba(139, 115, 85, 0.4)' },
    },
  },
  
  button: {
    primary: {
      background: { light: '#2D5016', dark: '#5D6B47' },
      text: { light: '#FFFFFF', dark: '#F7F5F3' },
      border: { light: '#2D5016', dark: '#5D6B47' },
      hover: { light: '#234010', dark: '#6B7955' },
    },
    secondary: {
      background: { light: '#F5F3EF', dark: '#3D4430' },
      text: { light: '#5D6B47', dark: '#D4D2CB' },
      border: { light: '#E8E6E3', dark: '#4A5040' },
      hover: { light: '#EBEAE5', dark: '#4A5040' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#1A1F16' },
    text: { light: '#1A1F16', dark: '#E8E6E3' },
    placeholder: { light: '#9CA389', dark: '#6B7055' },
    border: { light: 'rgba(93, 107, 71, 0.3)', dark: 'rgba(184, 181, 176, 0.3)' },
    borderHover: { light: 'rgba(45, 80, 22, 0.5)', dark: 'rgba(45, 80, 22, 0.7)' },
    borderFocus: { light: '#2D5016', dark: '#5D6B47' },
  },
  
  sidebar: {
    background: { light: '#F7F5F3', dark: '#1A1F16' },
    itemHover: { light: 'rgba(45, 80, 22, 0.08)', dark: 'rgba(45, 80, 22, 0.12)' },
    itemSelected: { light: 'rgba(45, 80, 22, 0.12)', dark: 'rgba(45, 80, 22, 0.16)' },
    itemSelectedHover: { light: 'rgba(45, 80, 22, 0.16)', dark: 'rgba(45, 80, 22, 0.20)' },
    border: { light: 'rgba(45, 80, 22, 0.1)', dark: 'rgba(45, 80, 22, 0.2)' },
  },
  
  icon: {
    default: { light: '#2D5016', dark: '#5D6B47' },
    success: { value: '#059669' },
    warning: { value: '#D97706' },
    error: { value: '#DC2626' },
    info: { value: '#3B82F6' },
  },
  
  toolbar: {
    background: { light: 'rgba(247, 245, 243, 0.85)', dark: 'rgba(26, 31, 22, 0.85)' },
    border: { light: 'rgba(45, 80, 22, 0.2)', dark: 'rgba(45, 80, 22, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.07)', dark: 'rgba(0, 0, 0, 0.15)' },
  },
  
  messageBlock: {
    background: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.02)' },
    backgroundHover: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.05)' },
    backgroundContent: { light: 'rgba(0, 0, 0, 0.03)', dark: 'rgba(0, 0, 0, 0.2)' },
    backgroundHeader: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.05)' },
    codeBackground: { light: 'rgba(0, 0, 0, 0.05)', dark: 'rgba(0, 0, 0, 0.3)' },
    scrollbarThumb: { light: 'rgba(0, 0, 0, 0.2)', dark: 'rgba(255, 255, 255, 0.2)' },
    scrollbarTrack: { light: 'transparent', dark: 'transparent' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #2D5016, #5D6B47)',
    secondary: 'linear-gradient(135deg, #8B7355, #C7B299)',
  },
};

/**
 * 未来科技 - 2025年流行的科技感设计，冷色调与玻璃态效果
 */
const techTheme: ThemeColorTokens = {
  primary: { value: '#3B82F6' },
  secondary: { value: '#8B5CF6' },
  accent: { value: '#06B6D4' },
  
  background: {
    default: { light: '#F8FAFC', dark: '#0F172A' },
    paper: { light: '#F8FAFC', dark: '#1E293B' },
    elevated: { light: '#FFFFFF', dark: '#293548' },
  },
  
  text: {
    primary: { light: '#0F172A', dark: '#F1F5F9' },
    secondary: { light: '#64748B', dark: '#94A3B8' },
    disabled: { light: '#94A3B8', dark: '#64748B' },
    hint: { light: '#CBD5E1', dark: '#475569' },
  },
  
  border: {
    default: { light: 'rgba(59, 130, 246, 0.12)', dark: 'rgba(59, 130, 246, 0.2)' },
    subtle: { light: 'rgba(59, 130, 246, 0.06)', dark: 'rgba(59, 130, 246, 0.1)' },
    strong: { light: 'rgba(59, 130, 246, 0.23)', dark: 'rgba(59, 130, 246, 0.3)' },
    focus: { light: '#3B82F6', dark: '#60A5FA' },
  },
  
  interaction: {
    hover: { light: 'rgba(59, 130, 246, 0.08)', dark: 'rgba(59, 130, 246, 0.12)' },
    active: { light: 'rgba(59, 130, 246, 0.12)', dark: 'rgba(59, 130, 246, 0.16)' },
    selected: { light: 'rgba(59, 130, 246, 0.16)', dark: 'rgba(59, 130, 246, 0.20)' },
    disabled: { light: 'rgba(59, 130, 246, 0.04)', dark: 'rgba(59, 130, 246, 0.06)' },
  },
  
  message: {
    ai: {
      background: { light: '#F0F9FF', dark: '#1E293B' },
      backgroundActive: { light: '#E0F2FE', dark: '#293548' },
      text: { light: '#0F172A', dark: '#F1F5F9' },
      border: { light: 'rgba(59, 130, 246, 0.2)', dark: 'rgba(59, 130, 246, 0.3)' },
    },
    user: {
      background: { light: '#DBEAFE', dark: '#1E3A8A' },
      backgroundActive: { light: '#BFDBFE', dark: '#1E40AF' },
      text: { light: '#1E3A8A', dark: '#DBEAFE' },
      border: { light: 'rgba(59, 130, 246, 0.3)', dark: 'rgba(59, 130, 246, 0.4)' },
    },
    system: {
      background: { light: '#E0F2FE', dark: '#164E63' },
      text: { light: '#164E63', dark: '#E0F2FE' },
      border: { light: 'rgba(6, 182, 212, 0.3)', dark: 'rgba(6, 182, 212, 0.4)' },
    },
  },
  
  button: {
    primary: {
      background: { light: '#3B82F6', dark: '#60A5FA' },
      text: { light: '#FFFFFF', dark: '#0F172A' },
      border: { light: '#3B82F6', dark: '#60A5FA' },
      hover: { light: '#2563EB', dark: '#93C5FD' },
    },
    secondary: {
      background: { light: '#F0F9FF', dark: '#334155' },
      text: { light: '#1E40AF', dark: '#BFDBFE' },
      border: { light: '#BFDBFE', dark: '#475569' },
      hover: { light: '#E0F2FE', dark: '#475569' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#1E293B' },
    text: { light: '#0F172A', dark: '#F1F5F9' },
    placeholder: { light: '#94A3B8', dark: '#64748B' },
    border: { light: 'rgba(100, 116, 139, 0.3)', dark: 'rgba(148, 163, 184, 0.3)' },
    borderHover: { light: 'rgba(59, 130, 246, 0.5)', dark: 'rgba(59, 130, 246, 0.7)' },
    borderFocus: { light: '#3B82F6', dark: '#60A5FA' },
  },
  
  sidebar: {
    background: { light: '#F8FAFC', dark: '#0F172A' },
    itemHover: { light: 'rgba(59, 130, 246, 0.08)', dark: 'rgba(59, 130, 246, 0.12)' },
    itemSelected: { light: 'rgba(59, 130, 246, 0.12)', dark: 'rgba(59, 130, 246, 0.16)' },
    itemSelectedHover: { light: 'rgba(59, 130, 246, 0.16)', dark: 'rgba(59, 130, 246, 0.20)' },
    border: { light: 'rgba(59, 130, 246, 0.1)', dark: 'rgba(59, 130, 246, 0.2)' },
  },
  
  icon: {
    default: { light: '#3B82F6', dark: '#60A5FA' },
    success: { value: '#10B981' },
    warning: { value: '#F59E0B' },
    error: { value: '#EF4444' },
    info: { value: '#06B6D4' },
  },
  
  toolbar: {
    background: { light: 'rgba(248, 250, 252, 0.85)', dark: 'rgba(15, 23, 42, 0.85)' },
    border: { light: 'rgba(59, 130, 246, 0.2)', dark: 'rgba(59, 130, 246, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.07)', dark: 'rgba(0, 0, 0, 0.15)' },
  },
  
  messageBlock: {
    background: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.02)' },
    backgroundHover: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.05)' },
    backgroundContent: { light: 'rgba(0, 0, 0, 0.03)', dark: 'rgba(0, 0, 0, 0.2)' },
    backgroundHeader: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.05)' },
    codeBackground: { light: 'rgba(0, 0, 0, 0.05)', dark: 'rgba(0, 0, 0, 0.3)' },
    scrollbarThumb: { light: 'rgba(0, 0, 0, 0.2)', dark: 'rgba(255, 255, 255, 0.2)' },
    scrollbarTrack: { light: 'transparent', dark: 'transparent' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    secondary: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
  },
};

/**
 * 柔和渐变 - 2025年流行的柔和渐变设计，温暖舒适的视觉体验
 */
const softTheme: ThemeColorTokens = {
  primary: { value: '#EC4899' },
  secondary: { value: '#14B8A6' },
  accent: { value: '#F59E0B' },
  
  background: {
    default: { light: '#FDF2F8', dark: '#1F1626' },
    paper: { light: '#FDF2F8', dark: '#2D1B3D' },
    elevated: { light: '#FEF3FB', dark: '#3B2151' },
  },
  
  text: {
    primary: { light: '#1F1626', dark: '#FCE7F3' },
    secondary: { light: '#9F1239', dark: '#F9A8D4' },
    disabled: { light: '#DB2777', dark: '#9D174D' },
    hint: { light: '#FBCFE8', dark: '#831843' },
  },
  
  border: {
    default: { light: 'rgba(236, 72, 153, 0.12)', dark: 'rgba(236, 72, 153, 0.2)' },
    subtle: { light: 'rgba(236, 72, 153, 0.06)', dark: 'rgba(236, 72, 153, 0.1)' },
    strong: { light: 'rgba(236, 72, 153, 0.23)', dark: 'rgba(236, 72, 153, 0.3)' },
    focus: { light: '#EC4899', dark: '#F472B6' },
  },
  
  interaction: {
    hover: { light: 'rgba(236, 72, 153, 0.08)', dark: 'rgba(236, 72, 153, 0.12)' },
    active: { light: 'rgba(236, 72, 153, 0.12)', dark: 'rgba(236, 72, 153, 0.16)' },
    selected: { light: 'rgba(236, 72, 153, 0.16)', dark: 'rgba(236, 72, 153, 0.20)' },
    disabled: { light: 'rgba(236, 72, 153, 0.04)', dark: 'rgba(236, 72, 153, 0.06)' },
  },
  
  message: {
    ai: {
      background: { light: '#FEF3FB', dark: '#2D1B3D' },
      backgroundActive: { light: '#FCE7F3', dark: '#3B2151' },
      text: { light: '#1F1626', dark: '#FCE7F3' },
      border: { light: 'rgba(236, 72, 153, 0.2)', dark: 'rgba(236, 72, 153, 0.3)' },
    },
    user: {
      background: { light: '#FBCFE8', dark: '#831843' },
      backgroundActive: { light: '#F9A8D4', dark: '#9D174D' },
      text: { light: '#831843', dark: '#FBCFE8' },
      border: { light: 'rgba(244, 114, 182, 0.3)', dark: 'rgba(244, 114, 182, 0.4)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  button: {
    primary: {
      background: { light: '#EC4899', dark: '#F472B6' },
      text: { light: '#FFFFFF', dark: '#1F1626' },
      border: { light: '#EC4899', dark: '#F472B6' },
      hover: { light: '#DB2777', dark: '#F9A8D4' },
    },
    secondary: {
      background: { light: '#FEF3FB', dark: '#4C1D95' },
      text: { light: '#9F1239', dark: '#F9A8D4' },
      border: { light: '#FBCFE8', dark: '#6B21A8' },
      hover: { light: '#FCE7F3', dark: '#6B21A8' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#2D1B3D' },
    text: { light: '#1F1626', dark: '#FCE7F3' },
    placeholder: { light: '#DB2777', dark: '#9D174D' },
    border: { light: 'rgba(159, 18, 57, 0.3)', dark: 'rgba(249, 168, 212, 0.3)' },
    borderHover: { light: 'rgba(236, 72, 153, 0.5)', dark: 'rgba(236, 72, 153, 0.7)' },
    borderFocus: { light: '#EC4899', dark: '#F472B6' },
  },
  
  sidebar: {
    background: { light: '#FDF2F8', dark: '#1F1626' },
    itemHover: { light: 'rgba(236, 72, 153, 0.08)', dark: 'rgba(236, 72, 153, 0.12)' },
    itemSelected: { light: 'rgba(236, 72, 153, 0.12)', dark: 'rgba(236, 72, 153, 0.16)' },
    itemSelectedHover: { light: 'rgba(236, 72, 153, 0.16)', dark: 'rgba(236, 72, 153, 0.20)' },
    border: { light: 'rgba(236, 72, 153, 0.1)', dark: 'rgba(236, 72, 153, 0.2)' },
  },
  
  icon: {
    default: { light: '#EC4899', dark: '#F472B6' },
    success: { value: '#14B8A6' },
    warning: { value: '#F59E0B' },
    error: { value: '#EF4444' },
    info: { value: '#06B6D4' },
  },
  
  toolbar: {
    background: { light: 'rgba(253, 242, 248, 0.85)', dark: 'rgba(31, 22, 38, 0.85)' },
    border: { light: 'rgba(236, 72, 153, 0.2)', dark: 'rgba(236, 72, 153, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.07)', dark: 'rgba(0, 0, 0, 0.15)' },
  },
  
  messageBlock: {
    background: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.02)' },
    backgroundHover: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.05)' },
    backgroundContent: { light: 'rgba(0, 0, 0, 0.03)', dark: 'rgba(0, 0, 0, 0.2)' },
    backgroundHeader: { light: 'rgba(0, 0, 0, 0.02)', dark: 'rgba(255, 255, 255, 0.05)' },
    codeBackground: { light: 'rgba(0, 0, 0, 0.05)', dark: 'rgba(0, 0, 0, 0.3)' },
    scrollbarThumb: { light: 'rgba(0, 0, 0, 0.2)', dark: 'rgba(255, 255, 255, 0.2)' },
    scrollbarTrack: { light: 'transparent', dark: 'transparent' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #EC4899, #F472B6)',
    secondary: 'linear-gradient(135deg, #14B8A6, #06B6D4)',
  },
};

/**
 * 导出所有设计令牌
 */
/**
 * Ocean 主题 - 清新的海洋蓝绿色系设计
 */
const oceanTheme: ThemeColorTokens = {
  primary: { value: '#0EA5E9' },
  secondary: { value: '#06B6D4' },
  accent: { value: '#14B8A6' },
  
  background: {
    default: { light: '#F0F9FF', dark: '#0C1A2E' },
    paper: { light: '#F0F9FF', dark: '#1E3A5F' },
    elevated: { light: '#E0F2FE', dark: '#2C5282' },
  },
  
  text: {
    primary: { light: '#0C4A6E', dark: '#E0F2FE' },
    secondary: { light: '#0369A1', dark: '#7DD3FC' },
    disabled: { light: '#075985', dark: '#38BDF8' },
    hint: { light: '#0C4A6E', dark: '#BAE6FD' },
  },
  
  border: {
    default: { light: 'rgba(14, 165, 233, 0.2)', dark: 'rgba(14, 165, 233, 0.3)' },
    subtle: { light: 'rgba(14, 165, 233, 0.1)', dark: 'rgba(14, 165, 233, 0.15)' },
    strong: { light: 'rgba(14, 165, 233, 0.4)', dark: 'rgba(14, 165, 233, 0.5)' },
    focus: { light: '#0EA5E9', dark: '#38BDF8' },
  },
  
  interaction: {
    hover: { light: 'rgba(14, 165, 233, 0.08)', dark: 'rgba(14, 165, 233, 0.16)' },
    active: { light: 'rgba(14, 165, 233, 0.12)', dark: 'rgba(14, 165, 233, 0.24)' },
    selected: { light: 'rgba(14, 165, 233, 0.16)', dark: 'rgba(14, 165, 233, 0.32)' },
    disabled: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.04)' },
  },
  
  message: {
    ai: {
      background: { light: '#E0F2FE', dark: '#1E3A5F' },
      backgroundActive: { light: '#BAE6FD', dark: '#2C5282' },
      text: { light: '#0C4A6E', dark: '#E0F2FE' },
      border: { light: 'rgba(14, 165, 233, 0.3)', dark: 'rgba(14, 165, 233, 0.4)' },
    },
    user: {
      background: { light: '#CFFAFE', dark: '#164E63' },
      backgroundActive: { light: '#A5F3FC', dark: '#22D3EE' },
      text: { light: '#164E63', dark: '#CFFAFE' },
      border: { light: 'rgba(6, 182, 212, 0.3)', dark: 'rgba(6, 182, 212, 0.4)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  messageBlock: {
    background: { light: 'rgba(14, 165, 233, 0.03)', dark: 'rgba(14, 165, 233, 0.05)' },
    backgroundHover: { light: 'rgba(14, 165, 233, 0.05)', dark: 'rgba(14, 165, 233, 0.08)' },
    backgroundContent: { light: '#FFFFFF', dark: '#1E3A5F' },
    backgroundHeader: { light: 'rgba(14, 165, 233, 0.08)', dark: 'rgba(14, 165, 233, 0.12)' },
    codeBackground: { light: '#F8FAFC', dark: '#0F172A' },
    scrollbarThumb: { light: 'rgba(14, 165, 233, 0.3)', dark: 'rgba(14, 165, 233, 0.4)' },
    scrollbarTrack: { light: 'rgba(14, 165, 233, 0.1)', dark: 'rgba(14, 165, 233, 0.15)' },
  },
  
  button: {
    primary: {
      background: { light: '#0EA5E9', dark: '#38BDF8' },
      text: { light: '#FFFFFF', dark: '#0C4A6E' },
      border: { light: '#0EA5E9', dark: '#38BDF8' },
      hover: { light: '#0284C7', dark: '#7DD3FC' },
    },
    secondary: {
      background: { light: '#E0F2FE', dark: '#1E3A5F' },
      text: { light: '#0369A1', dark: '#BAE6FD' },
      border: { light: '#BAE6FD', dark: '#0369A1' },
      hover: { light: '#BAE6FD', dark: '#0369A1' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#0F172A' },
    text: { light: '#0C4A6E', dark: '#E0F2FE' },
    placeholder: { light: '#0369A1', dark: '#7DD3FC' },
    border: { light: 'rgba(14, 165, 233, 0.3)', dark: 'rgba(14, 165, 233, 0.4)' },
    borderHover: { light: '#0EA5E9', dark: '#38BDF8' },
    borderFocus: { light: '#0EA5E9', dark: '#38BDF8' },
  },
  
  sidebar: {
    background: { light: '#F0F9FF', dark: '#0C1A2E' },
    itemHover: { light: 'rgba(14, 165, 233, 0.08)', dark: 'rgba(14, 165, 233, 0.16)' },
    itemSelected: { light: 'rgba(14, 165, 233, 0.12)', dark: 'rgba(14, 165, 233, 0.24)' },
    itemSelectedHover: { light: 'rgba(14, 165, 233, 0.16)', dark: 'rgba(14, 165, 233, 0.32)' },
    border: { light: 'rgba(14, 165, 233, 0.2)', dark: 'rgba(14, 165, 233, 0.3)' },
  },
  
  icon: {
    default: { light: '#0EA5E9', dark: '#38BDF8' },
    success: { value: '#10B981' },
    warning: { value: '#F59E0B' },
    error: { value: '#EF4444' },
    info: { value: '#0EA5E9' },
  },
  
  toolbar: {
    background: { light: 'rgba(240, 249, 255, 0.95)', dark: 'rgba(12, 26, 46, 0.95)' },
    border: { light: 'rgba(14, 165, 233, 0.2)', dark: 'rgba(14, 165, 233, 0.3)' },
    shadow: { light: 'rgba(14, 165, 233, 0.1)', dark: 'rgba(0, 0, 0, 0.3)' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
    secondary: 'linear-gradient(135deg, #06B6D4, #14B8A6)',
  },
};

/**
 * Sunset 主题 - 温暖浪漫的日落色系设计
 */
const sunsetTheme: ThemeColorTokens = {
  primary: { value: '#F97316' },
  secondary: { value: '#FB923C' },
  accent: { value: '#FDE047' },
  
  background: {
    default: { light: '#FFF7ED', dark: '#1C1917' },
    paper: { light: '#FFF7ED', dark: '#292524' },
    elevated: { light: '#FFEDD5', dark: '#3F3F46' },
  },
  
  text: {
    primary: { light: '#7C2D12', dark: '#FED7AA' },
    secondary: { light: '#C2410C', dark: '#FDBA74' },
    disabled: { light: '#EA580C', dark: '#FB923C' },
    hint: { light: '#F97316', dark: '#FDE68A' },
  },
  
  border: {
    default: { light: 'rgba(249, 115, 22, 0.2)', dark: 'rgba(249, 115, 22, 0.3)' },
    subtle: { light: 'rgba(249, 115, 22, 0.1)', dark: 'rgba(249, 115, 22, 0.15)' },
    strong: { light: 'rgba(249, 115, 22, 0.4)', dark: 'rgba(249, 115, 22, 0.5)' },
    focus: { light: '#F97316', dark: '#FB923C' },
  },
  
  interaction: {
    hover: { light: 'rgba(249, 115, 22, 0.08)', dark: 'rgba(249, 115, 22, 0.16)' },
    active: { light: 'rgba(249, 115, 22, 0.12)', dark: 'rgba(249, 115, 22, 0.24)' },
    selected: { light: 'rgba(249, 115, 22, 0.16)', dark: 'rgba(249, 115, 22, 0.32)' },
    disabled: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.04)' },
  },
  
  message: {
    ai: {
      background: { light: '#FFEDD5', dark: '#292524' },
      backgroundActive: { light: '#FED7AA', dark: '#3F3F46' },
      text: { light: '#7C2D12', dark: '#FED7AA' },
      border: { light: 'rgba(249, 115, 22, 0.3)', dark: 'rgba(249, 115, 22, 0.4)' },
    },
    user: {
      background: { light: '#FEF3C7', dark: '#713F12' },
      backgroundActive: { light: '#FDE68A', dark: '#A16207' },
      text: { light: '#713F12', dark: '#FEF3C7' },
      border: { light: 'rgba(253, 224, 71, 0.5)', dark: 'rgba(253, 224, 71, 0.6)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  messageBlock: {
    background: { light: 'rgba(249, 115, 22, 0.03)', dark: 'rgba(249, 115, 22, 0.05)' },
    backgroundHover: { light: 'rgba(249, 115, 22, 0.05)', dark: 'rgba(249, 115, 22, 0.08)' },
    backgroundContent: { light: '#FFFFFF', dark: '#292524' },
    backgroundHeader: { light: 'rgba(249, 115, 22, 0.08)', dark: 'rgba(249, 115, 22, 0.12)' },
    codeBackground: { light: '#F8FAFC', dark: '#0F172A' },
    scrollbarThumb: { light: 'rgba(249, 115, 22, 0.3)', dark: 'rgba(249, 115, 22, 0.4)' },
    scrollbarTrack: { light: 'rgba(249, 115, 22, 0.1)', dark: 'rgba(249, 115, 22, 0.15)' },
  },
  
  button: {
    primary: {
      background: { light: '#F97316', dark: '#FB923C' },
      text: { light: '#FFFFFF', dark: '#7C2D12' },
      border: { light: '#F97316', dark: '#FB923C' },
      hover: { light: '#EA580C', dark: '#FDBA74' },
    },
    secondary: {
      background: { light: '#FFEDD5', dark: '#292524' },
      text: { light: '#C2410C', dark: '#FED7AA' },
      border: { light: '#FED7AA', dark: '#C2410C' },
      hover: { light: '#FED7AA', dark: '#C2410C' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#1C1917' },
    text: { light: '#7C2D12', dark: '#FED7AA' },
    placeholder: { light: '#C2410C', dark: '#FDBA74' },
    border: { light: 'rgba(249, 115, 22, 0.3)', dark: 'rgba(249, 115, 22, 0.4)' },
    borderHover: { light: '#F97316', dark: '#FB923C' },
    borderFocus: { light: '#F97316', dark: '#FB923C' },
  },
  
  sidebar: {
    background: { light: '#FFF7ED', dark: '#1C1917' },
    itemHover: { light: 'rgba(249, 115, 22, 0.08)', dark: 'rgba(249, 115, 22, 0.16)' },
    itemSelected: { light: 'rgba(249, 115, 22, 0.12)', dark: 'rgba(249, 115, 22, 0.24)' },
    itemSelectedHover: { light: 'rgba(249, 115, 22, 0.16)', dark: 'rgba(249, 115, 22, 0.32)' },
    border: { light: 'rgba(249, 115, 22, 0.2)', dark: 'rgba(249, 115, 22, 0.3)' },
  },
  
  icon: {
    default: { light: '#F97316', dark: '#FB923C' },
    success: { value: '#10B981' },
    warning: { value: '#F59E0B' },
    error: { value: '#EF4444' },
    info: { value: '#F97316' },
  },
  
  toolbar: {
    background: { light: 'rgba(255, 247, 237, 0.95)', dark: 'rgba(28, 25, 23, 0.95)' },
    border: { light: 'rgba(249, 115, 22, 0.2)', dark: 'rgba(249, 115, 22, 0.3)' },
    shadow: { light: 'rgba(249, 115, 22, 0.1)', dark: 'rgba(0, 0, 0, 0.3)' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #F97316, #FB923C)',
    secondary: 'linear-gradient(135deg, #FB923C, #FDE047)',
  },
};

/**
 * Cinnamon Slate 主题 - 2025年流行趋势：肉桂板岩
 * 深邃温暖的色调，介于神秘与温暖之间，带来内心的平静
 */
const cinnamonSlateTheme: ThemeColorTokens = {
  primary: { value: '#8B6F5C' },
  secondary: { value: '#5D4E4A' },
  accent: { value: '#B08968' },
  
  background: {
    default: { light: '#F5F1ED', dark: '#1A1614' },
    paper: { light: '#F5F1ED', dark: '#2B2420' },
    elevated: { light: '#FAF7F3', dark: '#3D332D' },
  },
  
  text: {
    primary: { light: '#2B2420', dark: '#F0EBE3' },
    secondary: { light: '#5D4E4A', dark: '#C4B5A8' },
    disabled: { light: '#8B7B75', dark: '#7D6F68' },
    hint: { light: '#B5A89D', dark: '#5D4E4A' },
  },
  
  border: {
    default: { light: 'rgba(139, 111, 92, 0.15)', dark: 'rgba(139, 111, 92, 0.25)' },
    subtle: { light: 'rgba(139, 111, 92, 0.08)', dark: 'rgba(139, 111, 92, 0.12)' },
    strong: { light: 'rgba(139, 111, 92, 0.3)', dark: 'rgba(139, 111, 92, 0.4)' },
    focus: { light: '#8B6F5C', dark: '#B08968' },
  },
  
  interaction: {
    hover: { light: 'rgba(139, 111, 92, 0.08)', dark: 'rgba(139, 111, 92, 0.15)' },
    active: { light: 'rgba(139, 111, 92, 0.12)', dark: 'rgba(139, 111, 92, 0.22)' },
    selected: { light: 'rgba(139, 111, 92, 0.16)', dark: 'rgba(139, 111, 92, 0.28)' },
    disabled: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.04)' },
  },
  
  message: {
    ai: {
      background: { light: '#FAF7F3', dark: '#2B2420' },
      backgroundActive: { light: '#F0EBE3', dark: '#3D332D' },
      text: { light: '#2B2420', dark: '#F0EBE3' },
      border: { light: 'rgba(139, 111, 92, 0.2)', dark: 'rgba(139, 111, 92, 0.35)' },
    },
    user: {
      background: { light: '#E6DDD3', dark: '#4A3B32' },
      backgroundActive: { light: '#DDD1C4', dark: '#5D4B3F' },
      text: { light: '#2B2420', dark: '#E6DDD3' },
      border: { light: 'rgba(93, 78, 74, 0.3)', dark: 'rgba(93, 78, 74, 0.45)' },
    },
    system: {
      background: { light: '#F5EDDC', dark: '#4A4035' },
      text: { light: '#654321', dark: '#E8DCC8' },
      border: { light: 'rgba(139, 115, 85, 0.3)', dark: 'rgba(139, 115, 85, 0.4)' },
    },
  },
  
  messageBlock: {
    background: { light: 'rgba(139, 111, 92, 0.03)', dark: 'rgba(139, 111, 92, 0.06)' },
    backgroundHover: { light: 'rgba(139, 111, 92, 0.05)', dark: 'rgba(139, 111, 92, 0.09)' },
    backgroundContent: { light: '#FFFFFF', dark: '#2B2420' },
    backgroundHeader: { light: 'rgba(139, 111, 92, 0.08)', dark: 'rgba(139, 111, 92, 0.13)' },
    codeBackground: { light: '#F8F6F3', dark: '#1A1614' },
    scrollbarThumb: { light: 'rgba(139, 111, 92, 0.3)', dark: 'rgba(139, 111, 92, 0.4)' },
    scrollbarTrack: { light: 'rgba(139, 111, 92, 0.1)', dark: 'rgba(139, 111, 92, 0.15)' },
  },
  
  button: {
    primary: {
      background: { light: '#8B6F5C', dark: '#B08968' },
      text: { light: '#FFFFFF', dark: '#2B2420' },
      border: { light: '#8B6F5C', dark: '#B08968' },
      hover: { light: '#74594A', dark: '#C9A17E' },
    },
    secondary: {
      background: { light: '#FAF7F3', dark: '#3D332D' },
      text: { light: '#5D4E4A', dark: '#E6DDD3' },
      border: { light: '#E6DDD3', dark: '#5D4E4A' },
      hover: { light: '#F0EBE3', dark: '#4A3B32' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#1A1614' },
    text: { light: '#2B2420', dark: '#F0EBE3' },
    placeholder: { light: '#8B7B75', dark: '#7D6F68' },
    border: { light: 'rgba(139, 111, 92, 0.3)', dark: 'rgba(139, 111, 92, 0.45)' },
    borderHover: { light: '#8B6F5C', dark: '#B08968' },
    borderFocus: { light: '#8B6F5C', dark: '#B08968' },
  },
  
  sidebar: {
    background: { light: '#F5F1ED', dark: '#1A1614' },
    itemHover: { light: 'rgba(139, 111, 92, 0.08)', dark: 'rgba(139, 111, 92, 0.15)' },
    itemSelected: { light: 'rgba(139, 111, 92, 0.12)', dark: 'rgba(139, 111, 92, 0.22)' },
    itemSelectedHover: { light: 'rgba(139, 111, 92, 0.16)', dark: 'rgba(139, 111, 92, 0.28)' },
    border: { light: 'rgba(139, 111, 92, 0.15)', dark: 'rgba(139, 111, 92, 0.25)' },
  },
  
  icon: {
    default: { light: '#8B6F5C', dark: '#B08968' },
    success: { value: '#059669' },
    warning: { value: '#D97706' },
    error: { value: '#DC2626' },
    info: { value: '#3B82F6' },
  },
  
  toolbar: {
    background: { light: 'rgba(245, 241, 237, 0.95)', dark: 'rgba(26, 22, 20, 0.95)' },
    border: { light: 'rgba(139, 111, 92, 0.2)', dark: 'rgba(139, 111, 92, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.08)', dark: 'rgba(0, 0, 0, 0.25)' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #8B6F5C, #B08968)',
    secondary: 'linear-gradient(135deg, #5D4E4A, #8B7B75)',
  },
};

/**
 * Horizon Green 主题 - 2025年日本流行色彩协会代表色
 * 带有蓝色调的绿色，象征着对未来的希望和对自然的关注
 */
const horizonGreenTheme: ThemeColorTokens = {
  primary: { value: '#4A9B8E' },
  secondary: { value: '#70B8A8' },
  accent: { value: '#95D5C8' },
  
  background: {
    default: { light: '#F5FAF8', dark: '#0F1B18' },
    paper: { light: '#F5FAF8', dark: '#1A2B26' },
    elevated: { light: '#ECF7F3', dark: '#253D36' },
  },
  
  text: {
    primary: { light: '#0F3D34', dark: '#E8F5F1' },
    secondary: { light: '#2D6B5E', dark: '#A8D5C8' },
    disabled: { light: '#6B9A8D', dark: '#4A7A6D' },
    hint: { light: '#A8C9C0', dark: '#2D544A' },
  },
  
  border: {
    default: { light: 'rgba(74, 155, 142, 0.15)', dark: 'rgba(74, 155, 142, 0.25)' },
    subtle: { light: 'rgba(74, 155, 142, 0.08)', dark: 'rgba(74, 155, 142, 0.12)' },
    strong: { light: 'rgba(74, 155, 142, 0.3)', dark: 'rgba(74, 155, 142, 0.4)' },
    focus: { light: '#4A9B8E', dark: '#70B8A8' },
  },
  
  interaction: {
    hover: { light: 'rgba(74, 155, 142, 0.08)', dark: 'rgba(74, 155, 142, 0.15)' },
    active: { light: 'rgba(74, 155, 142, 0.12)', dark: 'rgba(74, 155, 142, 0.22)' },
    selected: { light: 'rgba(74, 155, 142, 0.16)', dark: 'rgba(74, 155, 142, 0.28)' },
    disabled: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.04)' },
  },
  
  message: {
    ai: {
      background: { light: '#ECF7F3', dark: '#1A2B26' },
      backgroundActive: { light: '#DDEFEA', dark: '#253D36' },
      text: { light: '#0F3D34', dark: '#E8F5F1' },
      border: { light: 'rgba(74, 155, 142, 0.2)', dark: 'rgba(74, 155, 142, 0.35)' },
    },
    user: {
      background: { light: '#C5E8DF', dark: '#1E4D42' },
      backgroundActive: { light: '#B0DED2', dark: '#2A6254' },
      text: { light: '#0F3D34', dark: '#C5E8DF' },
      border: { light: 'rgba(45, 107, 94, 0.3)', dark: 'rgba(45, 107, 94, 0.45)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  messageBlock: {
    background: { light: 'rgba(74, 155, 142, 0.03)', dark: 'rgba(74, 155, 142, 0.06)' },
    backgroundHover: { light: 'rgba(74, 155, 142, 0.05)', dark: 'rgba(74, 155, 142, 0.09)' },
    backgroundContent: { light: '#FFFFFF', dark: '#1A2B26' },
    backgroundHeader: { light: 'rgba(74, 155, 142, 0.08)', dark: 'rgba(74, 155, 142, 0.13)' },
    codeBackground: { light: '#F0F9F7', dark: '#0F1B18' },
    scrollbarThumb: { light: 'rgba(74, 155, 142, 0.3)', dark: 'rgba(74, 155, 142, 0.4)' },
    scrollbarTrack: { light: 'rgba(74, 155, 142, 0.1)', dark: 'rgba(74, 155, 142, 0.15)' },
  },
  
  button: {
    primary: {
      background: { light: '#4A9B8E', dark: '#70B8A8' },
      text: { light: '#FFFFFF', dark: '#0F3D34' },
      border: { light: '#4A9B8E', dark: '#70B8A8' },
      hover: { light: '#3D8375', dark: '#8DCDBF' },
    },
    secondary: {
      background: { light: '#ECF7F3', dark: '#253D36' },
      text: { light: '#2D6B5E', dark: '#C5E8DF' },
      border: { light: '#C5E8DF', dark: '#2D6B5E' },
      hover: { light: '#DDEFEA', dark: '#2A6254' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#0F1B18' },
    text: { light: '#0F3D34', dark: '#E8F5F1' },
    placeholder: { light: '#6B9A8D', dark: '#4A7A6D' },
    border: { light: 'rgba(74, 155, 142, 0.3)', dark: 'rgba(74, 155, 142, 0.45)' },
    borderHover: { light: '#4A9B8E', dark: '#70B8A8' },
    borderFocus: { light: '#4A9B8E', dark: '#70B8A8' },
  },
  
  sidebar: {
    background: { light: '#F5FAF8', dark: '#0F1B18' },
    itemHover: { light: 'rgba(74, 155, 142, 0.08)', dark: 'rgba(74, 155, 142, 0.15)' },
    itemSelected: { light: 'rgba(74, 155, 142, 0.12)', dark: 'rgba(74, 155, 142, 0.22)' },
    itemSelectedHover: { light: 'rgba(74, 155, 142, 0.16)', dark: 'rgba(74, 155, 142, 0.28)' },
    border: { light: 'rgba(74, 155, 142, 0.15)', dark: 'rgba(74, 155, 142, 0.25)' },
  },
  
  icon: {
    default: { light: '#4A9B8E', dark: '#70B8A8' },
    success: { value: '#10B981' },
    warning: { value: '#F59E0B' },
    error: { value: '#EF4444' },
    info: { value: '#06B6D4' },
  },
  
  toolbar: {
    background: { light: 'rgba(245, 250, 248, 0.95)', dark: 'rgba(15, 27, 24, 0.95)' },
    border: { light: 'rgba(74, 155, 142, 0.2)', dark: 'rgba(74, 155, 142, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.08)', dark: 'rgba(0, 0, 0, 0.25)' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #4A9B8E, #70B8A8)',
    secondary: 'linear-gradient(135deg, #70B8A8, #95D5C8)',
  },
};

/**
 * Cherry Coded 主题 - 2025年流行趋势：樱桃编码
 * 深樱桃红色，传达热情和活力的感觉
 */
const cherryCodedTheme: ThemeColorTokens = {
  primary: { value: '#C41E3A' },
  secondary: { value: '#E63E6D' },
  accent: { value: '#FF6B9D' },
  
  background: {
    default: { light: '#FFF5F7', dark: '#1A0C0F' },
    paper: { light: '#FFF5F7', dark: '#2B1418' },
    elevated: { light: '#FFEEF2', dark: '#3D1E25' },
  },
  
  text: {
    primary: { light: '#450A0F', dark: '#FFE8ED' },
    secondary: { light: '#78121C', dark: '#FFB3C6' },
    disabled: { light: '#A8384A', dark: '#8B2E3D' },
    hint: { light: '#D98292', dark: '#561219' },
  },
  
  border: {
    default: { light: 'rgba(196, 30, 58, 0.15)', dark: 'rgba(196, 30, 58, 0.3)' },
    subtle: { light: 'rgba(196, 30, 58, 0.08)', dark: 'rgba(196, 30, 58, 0.15)' },
    strong: { light: 'rgba(196, 30, 58, 0.3)', dark: 'rgba(196, 30, 58, 0.45)' },
    focus: { light: '#C41E3A', dark: '#E63E6D' },
  },
  
  interaction: {
    hover: { light: 'rgba(196, 30, 58, 0.08)', dark: 'rgba(196, 30, 58, 0.15)' },
    active: { light: 'rgba(196, 30, 58, 0.12)', dark: 'rgba(196, 30, 58, 0.22)' },
    selected: { light: 'rgba(196, 30, 58, 0.16)', dark: 'rgba(196, 30, 58, 0.28)' },
    disabled: { light: 'rgba(0, 0, 0, 0.04)', dark: 'rgba(255, 255, 255, 0.04)' },
  },
  
  message: {
    ai: {
      background: { light: '#FFEEF2', dark: '#2B1418' },
      backgroundActive: { light: '#FFE0E8', dark: '#3D1E25' },
      text: { light: '#450A0F', dark: '#FFE8ED' },
      border: { light: 'rgba(196, 30, 58, 0.2)', dark: 'rgba(196, 30, 58, 0.35)' },
    },
    user: {
      background: { light: '#FFD1DC', dark: '#6B1E2E' },
      backgroundActive: { light: '#FFB8CA', dark: '#8B2A3D' },
      text: { light: '#450A0F', dark: '#FFD1DC' },
      border: { light: 'rgba(120, 18, 28, 0.3)', dark: 'rgba(120, 18, 28, 0.5)' },
    },
    system: {
      background: { light: '#FEF3C7', dark: '#78350F' },
      text: { light: '#78350F', dark: '#FEF3C7' },
      border: { light: 'rgba(245, 158, 11, 0.3)', dark: 'rgba(245, 158, 11, 0.4)' },
    },
  },
  
  messageBlock: {
    background: { light: 'rgba(196, 30, 58, 0.03)', dark: 'rgba(196, 30, 58, 0.06)' },
    backgroundHover: { light: 'rgba(196, 30, 58, 0.05)', dark: 'rgba(196, 30, 58, 0.09)' },
    backgroundContent: { light: '#FFFFFF', dark: '#2B1418' },
    backgroundHeader: { light: 'rgba(196, 30, 58, 0.08)', dark: 'rgba(196, 30, 58, 0.13)' },
    codeBackground: { light: '#FFF8FA', dark: '#1A0C0F' },
    scrollbarThumb: { light: 'rgba(196, 30, 58, 0.3)', dark: 'rgba(196, 30, 58, 0.4)' },
    scrollbarTrack: { light: 'rgba(196, 30, 58, 0.1)', dark: 'rgba(196, 30, 58, 0.15)' },
  },
  
  button: {
    primary: {
      background: { light: '#C41E3A', dark: '#E63E6D' },
      text: { light: '#FFFFFF', dark: '#450A0F' },
      border: { light: '#C41E3A', dark: '#E63E6D' },
      hover: { light: '#A0182E', dark: '#FF6B9D' },
    },
    secondary: {
      background: { light: '#FFEEF2', dark: '#3D1E25' },
      text: { light: '#78121C', dark: '#FFD1DC' },
      border: { light: '#FFD1DC', dark: '#78121C' },
      hover: { light: '#FFE0E8', dark: '#6B1E2E' },
    },
  },
  
  input: {
    background: { light: '#FFFFFF', dark: '#1A0C0F' },
    text: { light: '#450A0F', dark: '#FFE8ED' },
    placeholder: { light: '#A8384A', dark: '#8B2E3D' },
    border: { light: 'rgba(196, 30, 58, 0.3)', dark: 'rgba(196, 30, 58, 0.45)' },
    borderHover: { light: '#C41E3A', dark: '#E63E6D' },
    borderFocus: { light: '#C41E3A', dark: '#E63E6D' },
  },
  
  sidebar: {
    background: { light: '#FFF5F7', dark: '#1A0C0F' },
    itemHover: { light: 'rgba(196, 30, 58, 0.08)', dark: 'rgba(196, 30, 58, 0.15)' },
    itemSelected: { light: 'rgba(196, 30, 58, 0.12)', dark: 'rgba(196, 30, 58, 0.22)' },
    itemSelectedHover: { light: 'rgba(196, 30, 58, 0.16)', dark: 'rgba(196, 30, 58, 0.28)' },
    border: { light: 'rgba(196, 30, 58, 0.15)', dark: 'rgba(196, 30, 58, 0.3)' },
  },
  
  icon: {
    default: { light: '#C41E3A', dark: '#E63E6D' },
    success: { value: '#10B981' },
    warning: { value: '#F59E0B' },
    error: { value: '#EF4444' },
    info: { value: '#3B82F6' },
  },
  
  toolbar: {
    background: { light: 'rgba(255, 245, 247, 0.95)', dark: 'rgba(26, 12, 15, 0.95)' },
    border: { light: 'rgba(196, 30, 58, 0.2)', dark: 'rgba(196, 30, 58, 0.3)' },
    shadow: { light: 'rgba(0, 0, 0, 0.08)', dark: 'rgba(0, 0, 0, 0.25)' },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #C41E3A, #E63E6D)',
    secondary: 'linear-gradient(135deg, #E63E6D, #FF6B9D)',
  },
};

export const designTokens: DesignTokens = {
  default: defaultTheme,
  claude: claudeTheme,
  nature: natureTheme,
  tech: techTheme,
  soft: softTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  cinnamonSlate: cinnamonSlateTheme,
  horizonGreen: horizonGreenTheme,
  cherryCoded: cherryCodedTheme,
};

/**
 * 导出类型
 */
export * from './types';

