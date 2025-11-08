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

// SafeAreaContainer - 安全区域容器
export const SafeAreaContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
}));

// Container - 内容容器
export const Container = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  gap: theme.spacing(3), // gap-6 (24px)
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  backgroundColor: 'transparent',
  minHeight: 0, // 允许 flex 子元素缩小，使滚动生效
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
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        height: 44,
        minHeight: 44,
      }}
    >
      <Toolbar
        sx={{
          minHeight: '44px !important',
          height: '44px',
          paddingX: 2,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>
          {showBackButton && (
            <IconButton
              onClick={onBackPress}
              size="small"
              sx={{
                color: theme.palette.text.primary,
              }}
            >
              <ArrowLeft size={24} />
            </IconButton>
          )}
        </Box>

        <Typography
          variant="h6"
          sx={{
            flex: 1,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>

        <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {rightButton || <Box sx={{ width: 40 }} />}
        </Box>
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
  fontSize: '0.875rem',
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

export const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => {
  return (
    <YStack sx={{ gap: 1 }}> {/* gap-2 (8px) */}
      {title && title.trim() !== '' && <GroupTitle>{title}</GroupTitle>}
      <Group>{children}</Group>
    </YStack>
  );
};

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

export const SettingItem: React.FC<SettingItemProps> = ({
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
              fontSize: '1rem',
              color: danger ? theme.palette.error.main : theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontSize: '0.75rem',
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
            fontSize: '0.875rem',
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
};

