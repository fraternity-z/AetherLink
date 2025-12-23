import React from 'react';
import {
  Box,
  Typography,
  styled,
  IconButton,
  Toolbar,
  AppBar,
  ListItemButton,
  Paper,
} from '@mui/material';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * SafeAreaContainer - 安全区域容器
 * 
 * 参考 cherry-studio-app-main 的实现：
 * - 自动适配底部安全区域（顶部由 MuiAppBar 全局配置）
 * - 所有设置页面统一使用此组件包装
 * 
 * 使用方式：
 * <SafeAreaContainer>
 *   <HeaderBar />
 *   <Container>内容</Container>
 * </SafeAreaContainer>
 */
export const SafeAreaContainer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - var(--titlebar-height, 0px))',
  // 背景透明，让底部安全区域也透明（模仿 kelivo/rikkahub）
  backgroundColor: 'transparent',
  overflow: 'hidden',
  // 不在容器上添加 paddingBottom，改为在 Container 内部处理
}));

// Container - 内容容器（支持 ref 转发）
// 🚀 性能优化：添加硬件加速和滚动优化
export const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'ref',
})(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  // 底部添加安全区域的 padding，让内容可以滚动到安全区域下方
  // 使用全局统一变量，方便统一修改
  paddingBottom: 'calc(var(--content-bottom-padding) + 24px)',
  gap: theme.spacing(3), // gap-6 (24px)
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  backgroundColor: 'transparent',
  minHeight: 0, // 允许 flex 子元素缩小，使滚动生效
  // 🚀 性能优化：硬件加速
  willChange: 'scroll-position',
  transform: 'translateZ(0)',
  WebkitOverflowScrolling: 'touch',
  // 🚀 性能优化：减少重排
  contain: 'layout style paint',
}));

// HeaderBar - 标题栏
interface HeaderBarProps {
  title?: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightButton?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title = '',
  onBackPress,
  showBackButton = true,
  rightButton,
}) => {
  const theme = useTheme();

  return (
    <AppBar
      position="static"
      elevation={0}
      className="status-bar-safe-area"
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: '56px !important',
          height: '56px',
          paddingX: 2,
        }}
      >
        {showBackButton && (
          <IconButton
            edge="start"
            onClick={onBackPress}
            aria-label="back"
            sx={{
              color: theme.palette.primary.main, // 使用主题色，与子级页面保持一致
            }}
          >
            <ArrowLeft size={24} />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1, // 左对齐，与子级页面保持一致
            fontSize: 'calc(var(--global-font-size) * 1.125)',
            fontWeight: 600, // 与子级页面保持一致
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>

        {rightButton}
      </Toolbar>
    </AppBar>
  );
};

// YStack - 垂直堆叠容器
export const YStack = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

// XStack - 水平堆叠容器
export const XStack = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

// Group - 分组容器（卡片样式）
export const Group = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`,
}));

// GroupTitle - 分组标题
export const GroupTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  opacity: 0.7,
  paddingLeft: theme.spacing(1.5),
  fontSize: 'calc(var(--global-font-size, 1rem) * 0.875)',
  color: theme.palette.text.secondary,
  textTransform: 'none',
  letterSpacing: '0.05em',
}));

// PressableRow - 可点击的行
interface PressableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

export const PressableRow: React.FC<PressableRowProps> = ({
  children,
  onClick,
  disabled = false,
  sx,
}) => {
  return (
    <ListItemButton
      onClick={onClick}
      disabled={disabled}
      sx={{
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 'auto',
        '&:hover': {
          backgroundColor: 'transparent',
        },
        ...sx,
      }}
    >
      {children}
    </ListItemButton>
  );
};

// RowRightArrow - 右侧箭头
export const RowRightArrow: React.FC = () => {
  const theme = useTheme();
  return (
    <ChevronRight
      size={20}
      style={{
        color: theme.palette.text.secondary,
        opacity: 0.9,
        marginRight: -4,
      }}
    />
  );
};

// SettingGroup - 设置分组包装器
interface SettingGroupProps {
  title?: string;
  children: React.ReactNode;
}

// 🚀 性能优化：使用 React.memo 避免不必要的重渲染
export const SettingGroup: React.FC<SettingGroupProps> = React.memo(({ title, children }) => {
  return (
    <YStack sx={{ gap: 1 }}> {/* gap-2 (8px) */}
      {title && title.trim() !== '' && <GroupTitle>{title}</GroupTitle>}
      <Group>{children}</Group>
    </YStack>
  );
});

// Row - 设置行组件（用于在Group内展示设置项）
interface RowProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const Row: React.FC<RowProps> = ({ children, sx }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        minHeight: 'auto',
        gap: 2, // 增加左右元素之间的间距
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        '&:last-child': {
          borderBottom: 'none',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

// SettingItem - 设置项组件
interface SettingItemProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  value?: string;
  showArrow?: boolean;
  danger?: boolean; // 危险操作样式（红色文字）
}

// 🚀 性能优化：使用 React.memo 避免不必要的重渲染
export const SettingItem: React.FC<SettingItemProps> = React.memo(({
  title,
  description,
  icon,
  onClick,
  disabled = false,
  value,
  showArrow = true,
  danger = false,
}) => {
  const theme = useTheme();

  return (
    <PressableRow 
      onClick={onClick} 
      disabled={disabled}
      sx={{ opacity: disabled ? 0.5 : 1 }}
    >
      <XStack sx={{ gap: 1.5, alignItems: 'center', flex: 1 }}>
        {icon && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: danger ? theme.palette.error.main : 'inherit'
          }}>
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 'var(--global-font-size, 1rem)',
              color: danger ? theme.palette.error.main : theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontSize: 'calc(var(--global-font-size, 1rem) * 0.75)',
                color: theme.palette.text.secondary,
                marginTop: 0.25,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </XStack>
      {value && (
        <Typography
          sx={{
            fontSize: 'calc(var(--global-font-size, 1rem) * 0.875)',
            color: theme.palette.text.secondary,
            marginRight: showArrow ? 1 : 0,
          }}
        >
          {value}
        </Typography>
      )}
      {showArrow && <RowRightArrow />}
    </PressableRow>
  );
});

