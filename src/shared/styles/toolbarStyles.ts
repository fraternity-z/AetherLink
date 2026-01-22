// 从 InputToolbar.tsx 提取的共享样式函数
// 这些样式被多个按钮组件使用：KnowledgeButton, MCPToolsButton, WebSearchButton

// iOS 26 液体玻璃UI工具栏样式 - 2025年设计趋势
export const getGlassmorphismToolbarStyles = (isDarkMode: boolean) => {
  return {
    // 容器样式 - 液体玻璃容器
    container: {
      background: 'transparent',
      border: 'none',
      borderRadius: '24px',
      padding: '0 8px',
      position: 'relative'
    },
    // 按钮样式 - iOS 26 液体玻璃背景
    button: {
      position: 'relative',
      // iOS 26 液体玻璃背景效果 - 极致通透感
      background: isDarkMode
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(255, 255, 255, 0.06)',
      // 液体玻璃边框 - 几乎透明的边框
      border: isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.04)'
        : '1px solid rgba(255, 255, 255, 0.08)',
      // 保持原有圆角设计
      borderRadius: '16px',
      padding: '8px 14px',
      // iOS 26 极致通透的毛玻璃效果
      backdropFilter: 'blur(40px) saturate(200%) brightness(105%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(105%)',
      // iOS 26 轻盈的液体玻璃阴影 - 极致通透
      boxShadow: isDarkMode
        ? `0 4px 20px rgba(0, 0, 0, 0.06),
           0 1px 4px rgba(0, 0, 0, 0.04),
           inset 0 1px 0 rgba(255, 255, 255, 0.03),
           inset 0 -1px 0 rgba(255, 255, 255, 0.01)`
        : `0 4px 20px rgba(0, 0, 0, 0.03),
           0 1px 4px rgba(0, 0, 0, 0.02),
           inset 0 1px 0 rgba(255, 255, 255, 0.12),
           inset 0 -1px 0 rgba(255, 255, 255, 0.06)`,
      // 流畅的液体动画过渡
      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minHeight: '36px',
      // 防止文本选择
      userSelect: 'none',
      WebkitUserSelect: 'none',
      // 硬件加速和液体效果
      willChange: 'transform, background, box-shadow, backdrop-filter',
      transform: 'translateZ(0)',
      // iOS 26 极致微妙的液体反射效果
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '1px',
        left: '1px',
        right: '1px',
        height: '40%',
        background: isDarkMode
          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)',
        borderRadius: '15px 15px 0 0',
        pointerEvents: 'none'
      }
    },
    // 按钮悬停效果 - iOS 26 通透悬停
    buttonHover: {
      background: isDarkMode
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(255, 255, 255, 0.1)',
      border: isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.06)'
        : '1px solid rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(50px) saturate(220%) brightness(108%)',
      WebkitBackdropFilter: 'blur(50px) saturate(220%) brightness(108%)',
      boxShadow: isDarkMode
        ? `0 8px 30px rgba(0, 0, 0, 0.08),
           0 2px 8px rgba(0, 0, 0, 0.06),
           inset 0 1px 0 rgba(255, 255, 255, 0.05),
           inset 0 -1px 0 rgba(255, 255, 255, 0.02)`
        : `0 8px 30px rgba(0, 0, 0, 0.04),
           0 2px 8px rgba(0, 0, 0, 0.03),
           inset 0 1px 0 rgba(255, 255, 255, 0.18),
           inset 0 -1px 0 rgba(255, 255, 255, 0.08)`,
      transform: 'translateY(-1px) scale(1.01) translateZ(0)'
    },
    // 按钮激活效果 - iOS 26 通透按压
    buttonActive: {
      background: isDarkMode
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(255, 255, 255, 0.14)',
      border: isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(255, 255, 255, 0.16)',
      backdropFilter: 'blur(35px) saturate(240%) brightness(112%)',
      WebkitBackdropFilter: 'blur(35px) saturate(240%) brightness(112%)',
      boxShadow: isDarkMode
        ? `0 2px 12px rgba(0, 0, 0, 0.1),
           inset 0 1px 4px rgba(0, 0, 0, 0.04),
           inset 0 1px 0 rgba(255, 255, 255, 0.06)`
        : `0 2px 12px rgba(0, 0, 0, 0.05),
           inset 0 1px 4px rgba(0, 0, 0, 0.02),
           inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
      transform: 'translateY(0px) scale(0.98) translateZ(0)'
    },
    // 文字样式 - iOS 26 现代字体
    text: {
      fontSize: '13px',
      fontWeight: 600,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 0, 0, 0.85)',
      textShadow: isDarkMode
        ? '0 1px 3px rgba(0, 0, 0, 0.4)'
        : '0 1px 3px rgba(255, 255, 255, 0.9)',
      letterSpacing: '0.02em'
    }
  };
};

// 透明样式工具栏样式 - 简约设计
export const getTransparentToolbarStyles = (isDarkMode: boolean) => {
  return {
    // 容器样式 - 透明容器
    container: {
      background: 'transparent',
      border: 'none',
      borderRadius: '24px',
      padding: '0 8px'
    },
    // 按钮样式 - 简约透明
    button: {
      background: 'transparent',
      border: 'none',
      borderRadius: '20px',
      padding: '6px 12px',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      minHeight: '32px'
    },
    // 按钮悬停效果 - 轻微
    buttonHover: {
      background: isDarkMode
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.04)'
    },
    // 按钮激活效果 - 简单
    buttonActive: {
      background: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.06)',
      transform: 'scale(0.96)'
    },
    // 文字样式 - 小字体
    text: {
      fontSize: '13px',
      fontWeight: 500,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)'
    }
  };
};
