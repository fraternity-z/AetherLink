import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  useTheme
} from '@mui/material';
import CustomSwitch from '../../CustomSwitch';
import { ChevronDown, ChevronUp, Edit, Palette } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../shared/store';
import {
  setCodeThemeLight,
  setCodeThemeDark,
  setCodeEditor,
  setCodeShowLineNumbers,
  setCodeCollapsible,
  setCodeWrappable,
  setCodeDefaultCollapsed,
  setMermaidEnabled
} from '../../../shared/store/settingsSlice';
import type { BundledThemeInfo } from 'shiki/types';

interface CodeBlockSettingsProps {
  // 暂时保留接口以保持兼容性，但不使用参数
  onSettingChange?: (settingId: string, value: string | boolean) => void;
}

/**
 * 代码块设置组件
 */
const CodeBlockSettings: React.FC<CodeBlockSettingsProps> = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [themeNames, setThemeNames] = useState<string[]>(['auto']);

  // 从 Redux store 获取设置
  const {
    codeThemeLight,
    codeThemeDark,
    codeEditor,
    codeShowLineNumbers,
    codeCollapsible,
    codeWrappable,
    codeDefaultCollapsed,
    mermaidEnabled
  } = useAppSelector(state => state.settings);

  // 当前主题值和设置函数
  const currentCodeTheme = isDarkMode ? codeThemeDark : codeThemeLight;
  const setCurrentCodeTheme = isDarkMode ? setCodeThemeDark : setCodeThemeLight;
  const defaultThemeName = isDarkMode ? 'material-theme-darker' : 'one-light';

  // 加载 Shiki 主题列表
  useEffect(() => {
    import('shiki').then(({ bundledThemesInfo }) => {
      const names = ['auto', ...bundledThemesInfo.map((info: BundledThemeInfo) => info.id)];
      setThemeNames(names);
    });
  }, []);

  return (
    <>
      {/* 代码块设置标题 */}
      <ListItem
        component="div"
        onClick={() => setExpanded(!expanded)}
        sx={{
          px: 2,
          py: 0.5,
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1,
          // 优化触摸响应
          touchAction: 'manipulation',
          userSelect: 'none',
          // 移动端优化
          '@media (hover: none)': {
            '&:active': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              transform: 'scale(0.98)',
              transition: 'all 0.1s ease-out'
            }
          },
          // 桌面端优化
          '@media (hover: hover)': {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              transform: 'none !important',
              boxShadow: 'none !important'
            },
            '&:focus': {
              backgroundColor: 'transparent !important'
            },
            '&:active': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          },
          '& *': {
            pointerEvents: 'none', // 防止子元素干扰点击
            '&:hover': {
              backgroundColor: 'transparent !important',
              transform: 'none !important'
            }
          }
        }}
      >
        <ListItemText
          primary="代码块设置"
          secondary="配置代码显示和编辑功能"
          primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.95rem', lineHeight: 1.2 }}
          secondaryTypographyProps={{ fontSize: '0.75rem', lineHeight: 1.2 }}
        />
        <IconButton edge="end" size="small" sx={{ padding: '2px' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </IconButton>
      </ListItem>

      {/* 可折叠的设置内容 */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List sx={{ pl: 2, pr: 2, py: 0 }}>
          
          {/* 代码高亮主题 - 根据当前应用主题显示对应选择器 */}
          <ListItem sx={{ px: 1, py: 1.5, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
              <Palette size={20} color={isDarkMode ? '#6366f1' : '#f59e0b'} style={{ marginRight: 8 }} />
              <Typography variant="body2" fontWeight="medium">
                代码高亮主题
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({isDarkMode ? '深色模式' : '浅色模式'})
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={currentCodeTheme}
                onChange={(e) => dispatch(setCurrentCodeTheme(e.target.value))}
                sx={{ fontSize: '0.875rem' }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
              >
                {themeNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name === 'auto' ? `自动 (${defaultThemeName})` : name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem>

          {/* 代码编辑 */}
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemIcon sx={{ minWidth: '36px' }}>
              <Edit size={20} color="#666" />
            </ListItemIcon>
            <ListItemText
              primary="代码编辑"
              secondary="启用代码块编辑功能"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <CustomSwitch
              checked={codeEditor}
              onChange={(e) => dispatch(setCodeEditor(e.target.checked))}
            />
          </ListItem>

          {/* 代码显示行号 */}
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemText
              primary="代码显示行号"
              secondary="在代码块左侧显示行号"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
              secondaryTypographyProps={{ variant: 'caption' }}
              sx={{ pl: 4.5 }}
            />
            <CustomSwitch
              checked={codeShowLineNumbers}
              onChange={(e) => dispatch(setCodeShowLineNumbers(e.target.checked))}
            />
          </ListItem>

          {/* 代码可折叠 */}
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemText
              primary="代码可折叠"
              secondary="长代码块可以折叠显示"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
              secondaryTypographyProps={{ variant: 'caption' }}
              sx={{ pl: 4.5 }}
            />
            <CustomSwitch
              checked={codeCollapsible}
              onChange={(e) => dispatch(setCodeCollapsible(e.target.checked))}
            />
          </ListItem>

          {/* 代码可换行 */}
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemText
              primary="代码可换行"
              secondary="长代码行可以自动换行"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
              secondaryTypographyProps={{ variant: 'caption' }}
              sx={{ pl: 4.5 }}
            />
            <CustomSwitch
              checked={codeWrappable}
              onChange={(e) => dispatch(setCodeWrappable(e.target.checked))}
            />
          </ListItem>

          {/* 默认收起代码块 */}
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemText
              primary="默认收起代码块"
              secondary="新代码块默认以折叠状态显示"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
              secondaryTypographyProps={{ variant: 'caption' }}
              sx={{ pl: 4.5 }}
            />
            <CustomSwitch
              checked={codeDefaultCollapsed}
              onChange={(e) => dispatch(setCodeDefaultCollapsed(e.target.checked))}
            />
          </ListItem>

          {/* Mermaid图表功能 */}
          <ListItem sx={{ px: 1, py: 1 }}>
            <ListItemText
              primary="Mermaid图表"
              secondary="启用Mermaid图表渲染功能"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
              secondaryTypographyProps={{ variant: 'caption' }}
              sx={{ pl: 4.5 }}
            />
            <CustomSwitch
              checked={mermaidEnabled}
              onChange={(e) => dispatch(setMermaidEnabled(e.target.checked))}
            />
          </ListItem>

        </List>
      </Collapse>
    </>
  );
};

export default CodeBlockSettings;
