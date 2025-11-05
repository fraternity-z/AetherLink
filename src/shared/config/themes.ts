import { createTheme, alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { getFontFamilyString } from './fonts';

// 主题风格类型
export type ThemeStyle = 'default' | 'claude' | 'nature' | 'tech' | 'soft';

// 主题配置接口
export interface ThemeConfig {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: {
      light: string;
      dark: string;
    };
    paper: {
      light: string;
      dark: string;
    };
    text: {
      primary: {
        light: string;
        dark: string;
      };
      secondary: {
        light: string;
        dark: string;
      };
    };
  };
  gradients?: {
    primary: string;
    secondary?: string;
  };
  shadows?: {
    light: string[];
    dark: string[];
  };
}

// 预定义主题配置
export const themeConfigs: Record<ThemeStyle, ThemeConfig> = {
  default: {
    name: '默认主题',
    description: '简洁现代的默认设计风格',
    colors: {
      primary: '#64748B',
      secondary: '#10B981',
      background: {
        light: '#FFFFFF',
        dark: '#1A1A1A', // 统一使用稍微柔和的深灰色
      },
      paper: {
        light: '#FFFFFF',
        dark: '#2A2A2A', // 改为更柔和的深灰色，提高可读性
      },
      text: {
        primary: {
          light: '#1E293B',
          dark: '#F0F0F0', // 改为稍微柔和的白色，提高舒适度
        },
        secondary: {
          light: '#64748B',
          dark: '#B0B0B0', // 提高次要文字的对比度
        },
      },
    },
    gradients: {
      primary: 'linear-gradient(90deg, #9333EA, #754AB4)',
    },
  },

  claude: {
    name: 'Claude 风格',
    description: '温暖优雅的 Claude AI 设计风格',
    colors: {
      primary: '#D97706',
      secondary: '#059669',
      accent: '#DC2626',
      background: {
        light: '#FEF7ED',
        dark: '#1C1917',
      },
      paper: {
        light: '#FEF7ED', // 改为与背景色一致的米色
        dark: '#292524',
      },
      text: {
        primary: {
          light: '#1C1917',
          dark: '#F5F5F4',
        },
        secondary: {
          light: '#78716C',
          dark: '#A8A29E',
        },
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #D97706, #EA580C)',
      secondary: 'linear-gradient(135deg, #059669, #047857)',
    },
  },

  nature: {
    name: '自然风格',
    description: '2025年流行的自然系大地色调设计',
    colors: {
      primary: '#2D5016', // 深森林绿
      secondary: '#8B7355', // 大地棕色
      accent: '#C7B299', // 温暖米色
      background: {
        light: '#F7F5F3', // 温暖的米白色背景
        dark: '#1A1F16', // 深绿黑色
      },
      paper: {
        light: '#F7F5F3', // 与背景一致的米白色
        dark: '#252B20', // 深绿灰色
      },
      text: {
        primary: {
          light: '#1A1F16', // 深绿黑色文字
          dark: '#E8E6E3', // 温暖的浅色文字
        },
        secondary: {
          light: '#5D6B47', // 橄榄绿色次要文字
          dark: '#B8B5B0', // 温暖的灰色次要文字
        },
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2D5016, #5D6B47)', // 森林绿渐变
      secondary: 'linear-gradient(135deg, #8B7355, #C7B299)', // 大地色渐变
    },
  },

  tech: {
    name: '未来科技',
    description: '2025年流行的科技感设计，冷色调与玻璃态效果',
    colors: {
      primary: '#3B82F6', // 科技蓝
      secondary: '#8B5CF6', // 紫色
      accent: '#06B6D4', // 青色
      background: {
        light: '#F8FAFC', // 淡蓝白色
        dark: '#0F172A', // 深蓝黑色
      },
      paper: {
        light: '#F8FAFC', // 与背景色一致的淡蓝白色
        dark: '#1E293B', // 深灰蓝色
      },
      text: {
        primary: {
          light: '#0F172A', // 深蓝黑色
          dark: '#F1F5F9', // 淡蓝白色
        },
        secondary: {
          light: '#64748B', // 灰蓝色
          dark: '#94A3B8', // 浅灰蓝色
        },
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', // 蓝紫渐变
      secondary: 'linear-gradient(135deg, #06B6D4, #3B82F6)', // 青蓝渐变
    },
  },

  soft: {
    name: '柔和渐变',
    description: '2025年流行的柔和渐变设计，温暖舒适的视觉体验',
    colors: {
      primary: '#EC4899', // 粉红色
      secondary: '#14B8A6', // 青绿色
      accent: '#F59E0B', // 暖橙色
      background: {
        light: '#FDF2F8', // 淡粉色背景
        dark: '#1F1626', // 深紫黑色
      },
      paper: {
        light: '#FDF2F8', // 与背景色一致的淡粉色
        dark: '#2D1B3D', // 深紫色
      },
      text: {
        primary: {
          light: '#1F1626', // 深紫黑色
          dark: '#FCE7F3', // 淡粉色
        },
        secondary: {
          light: '#9F1239', // 深粉红色
          dark: '#F9A8D4', // 浅粉红色
        },
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #EC4899, #F472B6)', // 粉红渐变
      secondary: 'linear-gradient(135deg, #14B8A6, #06B6D4)', // 青绿渐变
    },
  },
};

// 创建主题函数
export const createCustomTheme = (
  mode: 'light' | 'dark',
  themeStyle: ThemeStyle,
  fontSize: number = 16,
  fontFamily: string = 'system'
): Theme => {
  const config = themeConfigs[themeStyle];
  const fontScale = fontSize / 16;
  const fontFamilyString = getFontFamilyString(fontFamily);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: config.colors.primary,
        light: alpha(config.colors.primary, 0.7),
        dark: alpha(config.colors.primary, 0.9),
      },
      secondary: {
        main: config.colors.secondary,
        light: alpha(config.colors.secondary, 0.7),
        dark: alpha(config.colors.secondary, 0.9),
      },
      background: {
        default: config.colors.background[mode],
        paper: config.colors.paper[mode],
      },
      text: {
        primary: config.colors.text.primary[mode],
        secondary: config.colors.text.secondary[mode],
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      error: {
        main: '#EF4444',
      },
      warning: {
        main: '#F59E0B',
      },
      info: {
        main: '#38BDF8',
      },
      success: {
        main: '#10B981',
      },
    },
    typography: {
      fontSize: fontSize,
      fontFamily: fontFamilyString,
      h1: { fontSize: `${2.5 * fontScale}rem` },
      h2: { fontSize: `${2 * fontScale}rem` },
      h3: { fontSize: `${1.75 * fontScale}rem` },
      h4: { fontSize: `${1.5 * fontScale}rem` },
      h5: { fontSize: `${1.25 * fontScale}rem` },
      h6: { fontSize: `${1.125 * fontScale}rem` },
      body1: { fontSize: `${1 * fontScale}rem` },
      body2: { fontSize: `${0.875 * fontScale}rem` },
      caption: { fontSize: `${0.75 * fontScale}rem` },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(themeStyle === 'claude' && {
              boxShadow: mode === 'light'
                ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
                : '0 4px 6px rgba(0, 0, 0, 0.3)',
            }),
            ...(themeStyle === 'nature' && {
              boxShadow: mode === 'light'
                ? '0 2px 4px rgba(45, 80, 22, 0.08), 0 1px 2px rgba(45, 80, 22, 0.04)'
                : '0 4px 8px rgba(0, 0, 0, 0.4)',
            }),
            ...(themeStyle === 'tech' && {
              boxShadow: mode === 'light'
                ? '0 4px 6px rgba(59, 130, 246, 0.1), 0 2px 4px rgba(59, 130, 246, 0.06)'
                : '0 8px 16px rgba(59, 130, 246, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3)',
            }),
            ...(themeStyle === 'soft' && {
              boxShadow: mode === 'light'
                ? '0 2px 8px rgba(236, 72, 153, 0.12), 0 1px 4px rgba(236, 72, 153, 0.08)'
                : '0 4px 12px rgba(236, 72, 153, 0.15), 0 2px 6px rgba(0, 0, 0, 0.3)',
            }),
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            ...(config.gradients && {
              '&.MuiButton-contained': {
                background: config.gradients.primary,
                '&:hover': {
                  background: config.gradients.primary,
                  filter: 'brightness(0.9)',
                },
              },
            }),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...(themeStyle === 'claude' && {
              background: mode === 'light'
                ? `rgba(254, 247, 237, 0.95)` // 使用Claude主题的米色背景
                : 'rgba(41, 37, 36, 0.95)',
              backdropFilter: 'blur(12px)',
            }),
            ...(themeStyle === 'nature' && {
              background: mode === 'light'
                ? `rgba(247, 245, 243, 0.95)` // 使用自然主题的温暖米色背景
                : 'rgba(26, 31, 22, 0.95)',
              backdropFilter: 'blur(12px)',
            }),
            ...(themeStyle === 'tech' && {
              background: mode === 'light'
                ? `rgba(248, 250, 252, 0.95)` // 使用科技主题的淡蓝白色背景
                : 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
            }),
            ...(themeStyle === 'soft' && {
              background: mode === 'light'
                ? `rgba(253, 242, 248, 0.95)` // 使用柔和主题的淡粉色背景
                : 'rgba(31, 22, 38, 0.95)',
              backdropFilter: 'blur(12px)',
            }),
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...(themeStyle === 'claude' && {
              background: mode === 'light'
                ? config.colors.background.light
                : config.colors.background.dark,
              borderRight: mode === 'light'
                ? '1px solid rgba(217, 119, 6, 0.1)'
                : '1px solid rgba(217, 119, 6, 0.2)',
            }),
            ...(themeStyle === 'nature' && {
              background: mode === 'light'
                ? config.colors.background.light
                : config.colors.background.dark,
              borderRight: mode === 'light'
                ? '1px solid rgba(45, 80, 22, 0.1)'
                : '1px solid rgba(45, 80, 22, 0.2)',
            }),
            ...(themeStyle === 'tech' && {
              background: mode === 'light'
                ? config.colors.background.light
                : config.colors.background.dark,
              borderRight: mode === 'light'
                ? '1px solid rgba(59, 130, 246, 0.1)'
                : '1px solid rgba(59, 130, 246, 0.2)',
            }),
            ...(themeStyle === 'soft' && {
              background: mode === 'light'
                ? config.colors.background.light
                : config.colors.background.dark,
              borderRight: mode === 'light'
                ? '1px solid rgba(236, 72, 153, 0.1)'
                : '1px solid rgba(236, 72, 153, 0.2)',
            }),
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            ...(themeStyle === 'claude' && {
              '&:hover': {
                backgroundColor: mode === 'light'
                  ? 'rgba(217, 119, 6, 0.08)'
                  : 'rgba(217, 119, 6, 0.12)',
              },
              '&.Mui-selected': {
                backgroundColor: mode === 'light'
                  ? 'rgba(217, 119, 6, 0.12)'
                  : 'rgba(217, 119, 6, 0.16)',
                '&:hover': {
                  backgroundColor: mode === 'light'
                    ? 'rgba(217, 119, 6, 0.16)'
                    : 'rgba(217, 119, 6, 0.20)',
                },
              },
            }),
            ...(themeStyle === 'nature' && {
              '&:hover': {
                backgroundColor: mode === 'light'
                  ? 'rgba(45, 80, 22, 0.08)'
                  : 'rgba(45, 80, 22, 0.12)',
              },
              '&.Mui-selected': {
                backgroundColor: mode === 'light'
                  ? 'rgba(45, 80, 22, 0.12)'
                  : 'rgba(45, 80, 22, 0.16)',
                '&:hover': {
                  backgroundColor: mode === 'light'
                    ? 'rgba(45, 80, 22, 0.16)'
                    : 'rgba(45, 80, 22, 0.20)',
                },
              },
            }),
            ...(themeStyle === 'tech' && {
              '&:hover': {
                backgroundColor: mode === 'light'
                  ? 'rgba(59, 130, 246, 0.08)'
                  : 'rgba(59, 130, 246, 0.12)',
              },
              '&.Mui-selected': {
                backgroundColor: mode === 'light'
                  ? 'rgba(59, 130, 246, 0.12)'
                  : 'rgba(59, 130, 246, 0.16)',
                '&:hover': {
                  backgroundColor: mode === 'light'
                    ? 'rgba(59, 130, 246, 0.16)'
                    : 'rgba(59, 130, 246, 0.20)',
                },
              },
            }),
            ...(themeStyle === 'soft' && {
              '&:hover': {
                backgroundColor: mode === 'light'
                  ? 'rgba(236, 72, 153, 0.08)'
                  : 'rgba(236, 72, 153, 0.12)',
              },
              '&.Mui-selected': {
                backgroundColor: mode === 'light'
                  ? 'rgba(236, 72, 153, 0.12)'
                  : 'rgba(236, 72, 153, 0.16)',
                '&:hover': {
                  backgroundColor: mode === 'light'
                    ? 'rgba(236, 72, 153, 0.16)'
                    : 'rgba(236, 72, 153, 0.20)',
                },
              },
            }),
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            ...(themeStyle === 'claude' && {
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light'
                    ? 'rgba(217, 119, 6, 0.5)'
                    : 'rgba(217, 119, 6, 0.7)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: config.colors.primary,
                },
              },
            }),
            ...(themeStyle === 'nature' && {
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light'
                    ? 'rgba(45, 80, 22, 0.5)'
                    : 'rgba(45, 80, 22, 0.7)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: config.colors.primary,
                },
              },
            }),
            ...(themeStyle === 'tech' && {
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light'
                    ? 'rgba(59, 130, 246, 0.5)'
                    : 'rgba(59, 130, 246, 0.7)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: config.colors.primary,
                },
              },
            }),
            ...(themeStyle === 'soft' && {
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'light'
                    ? 'rgba(236, 72, 153, 0.5)'
                    : 'rgba(236, 72, 153, 0.7)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: config.colors.primary,
                },
              },
            }),
          },
        },
      },
      // 移除全局Box样式覆盖，避免影响消息内容
      // 添加全局CssBaseline样式覆盖
      MuiCssBaseline: {
        styleOverrides: {
          ...(themeStyle === 'claude' && {
            body: {
              backgroundColor: config.colors.background[mode],
            },
            '#root': {
              backgroundColor: config.colors.background[mode],
            },
          }),
          ...(themeStyle === 'nature' && {
            body: {
              backgroundColor: config.colors.background[mode],
            },
            '#root': {
              backgroundColor: config.colors.background[mode],
            },
          }),
          ...(themeStyle === 'tech' && {
            body: {
              backgroundColor: config.colors.background[mode],
            },
            '#root': {
              backgroundColor: config.colors.background[mode],
            },
          }),
          ...(themeStyle === 'soft' && {
            body: {
              backgroundColor: config.colors.background[mode],
            },
            '#root': {
              backgroundColor: config.colors.background[mode],
            },
          }),
        },
      },
    },
  });
};

// 获取主题预览颜色
export const getThemePreviewColors = (themeStyle: ThemeStyle) => {
  const config = themeConfigs[themeStyle];
  return {
    primary: config.colors.primary,
    secondary: config.colors.secondary,
    background: config.colors.background.light,
    paper: config.colors.paper.light,
  };
};
