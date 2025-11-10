import React, { useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  useTheme,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  useMediaQuery
} from '@mui/material';
import { X as CloseIcon, Check as CheckIcon } from 'lucide-react';
import type { Model } from '../../../shared/types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import { getModelIdentityKey } from '../../../shared/utils/modelUtils';
import { getModelOrProviderIcon } from '../../../shared/utils/providerIcons';

// 样式常量 - 提取重复的样式对象以提升性能
const DIALOG_STYLES = {
  dialogPaper: (fullScreen: boolean) => ({
    borderRadius: fullScreen ? 0 : 2,
    height: fullScreen ? '100%' : 'auto',
    maxHeight: fullScreen ? '100%' : '80vh'
  }),
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pb: 1
  },
  tabsContainer: {
    borderBottom: 1,
    borderColor: 'divider'
  },
  dialogContent: {
    px: 1,
    py: 2
  },
  list: {
    pt: 0
  }
} as const;

// ModelItem 样式常量
const MODEL_ITEM_STYLES = {
  listItem: (isSelected: boolean, isDark: boolean) => ({
    borderRadius: 1,
    mb: 0.5,
    cursor: 'pointer',
    bgcolor: isSelected
      ? isDark
        ? 'rgba(144, 202, 249, 0.16)'
        : 'rgba(25, 118, 210, 0.08)'
      : 'transparent',
    '&:hover': {
      bgcolor: isSelected
        ? isDark
          ? 'rgba(144, 202, 249, 0.24)'
          : 'rgba(25, 118, 210, 0.12)'
        : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)'
    }
  }),
  listItemIcon: {
    minWidth: 40
  },
  avatar: {
    width: 28,
    height: 28,
    bgcolor: 'transparent',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  },
  primaryText: (isSelected: boolean) => ({
    variant: 'body1' as const,
    fontWeight: isSelected ? 'medium' : 'normal'
  }),
  secondaryText: {
    variant: 'caption' as const,
    noWrap: true
  }
} as const;

interface DialogModelSelectorProps {
  selectedModel: Model | null;
  availableModels: Model[];
  handleModelSelect: (model: Model) => void;
  handleMenuClick: () => void;
  handleMenuClose: () => void;
  menuOpen: boolean;
  hideButton?: boolean; // 是否隐藏触发按钮（用于工具栏环境）
}

// 创建稳定的空数组引用
const EMPTY_PROVIDERS_ARRAY: any[] = [];

export const DialogModelSelector: React.FC<DialogModelSelectorProps> = ({
  selectedModel,
  availableModels,
  handleModelSelect,
  handleMenuClick: _handleMenuClick, // 重命名为下划线前缀表示未使用但必需的参数
  handleMenuClose,
  menuOpen
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = React.useState<string>('all');
  const providers = useSelector((state: RootState) => state.settings.providers || EMPTY_PROVIDERS_ARRAY);

  // 优化提供商名称映射 - 使用 useMemo 预计算
  const providerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    providers.forEach(provider => {
      map.set(provider.id, provider.name);
    });
    return map;
  }, [providers]);

  // 优化获取提供商名称的函数 - 使用 useCallback 和预计算的映射
  const getProviderName = useCallback((providerId: string) => {
    return providerNameMap.get(providerId) || providerId;
  }, [providerNameMap]);

  // 优化按提供商分组的模型 - 修复依赖项问题
  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {};
    const providersMap: Record<string, { id: string, displayName: string }> = {};

    availableModels.forEach(model => {
      const providerId = model.provider || model.providerType || '未知';
      const displayName = getProviderName(providerId);

      // 使用原始ID作为键但保存显示名
      if (!providersMap[providerId]) {
        providersMap[providerId] = { id: providerId, displayName };
      }

      if (!groups[providerId]) {
        groups[providerId] = [];
      }
      groups[providerId].push(model);
    });

    // 转换为数组格式，以便可以排序
    const providersArray = Object.values(providersMap);
    
    // 按照用户添加的供应商列表顺序排序
    // 创建供应商ID到索引的映射
    const providerOrderMap = new Map<string, number>();
    providers.forEach((provider, index) => {
      providerOrderMap.set(provider.id, index);
    });

    providersArray.sort((a, b) => {
      const orderA = providerOrderMap.get(a.id);
      const orderB = providerOrderMap.get(b.id);
      
      // 如果都在列表中，按照列表顺序排序
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      // 如果a在列表中，b不在，a排在前面
      if (orderA !== undefined) return -1;
      // 如果b在列表中，a不在，b排在前面
      if (orderB !== undefined) return 1;
      // 如果都不在列表中，按字母顺序排序
      return a.displayName.localeCompare(b.displayName);
    });

    return { groups, providers: providersArray };
  }, [availableModels, getProviderName, providers]);

  // 优化标签页切换处理函数 - 使用 useCallback
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  }, []);

  // 优化模型选择处理函数 - 使用 useCallback
  const handleModelSelectWithClose = useCallback((model: Model) => {
    handleModelSelect(model);
  }, [handleModelSelect]);

  const getIdentityValue = useCallback((model: Model): string => {
    return getModelIdentityKey({ id: model.id, provider: model.provider });
  }, []);

  const selectedIdentity = useMemo(() => (
    selectedModel ? getIdentityValue(selectedModel) : ''
  ), [selectedModel, getIdentityValue]);

  // 获取当前选中模型的供应商ID（用于"常用"标签页）
  const currentProviderId = useMemo(() => {
    return selectedModel?.provider || selectedModel?.providerType || null;
  }, [selectedModel]);

  // 当对话框打开时，如果有当前供应商且activeTab还是初始值，自动切换到"常用"
  React.useEffect(() => {
    if (menuOpen && currentProviderId && activeTab === 'all') {
      setActiveTab('frequently-used');
    }
  }, [menuOpen, currentProviderId]);

  return (
    <Dialog
        open={menuOpen}
        onClose={handleMenuClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: DIALOG_STYLES.dialogPaper(fullScreen)
          }
        }}
      >
        <DialogTitle sx={DIALOG_STYLES.dialogTitle}>
          选择模型
          <IconButton edge="end" onClick={handleMenuClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <Box sx={DIALOG_STYLES.tabsContainer}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="model provider tabs"
          >
            <Tab label="全部" value="all" />
            {currentProviderId && groupedModels.groups[currentProviderId] && (
              <Tab label="常用" value="frequently-used" />
            )}
            {groupedModels.providers
              .filter(provider => provider.id !== currentProviderId)
              .map(provider => (
                <Tab key={provider.id} label={provider.displayName} value={provider.id} />
              ))}
          </Tabs>
        </Box>

        <DialogContent sx={DIALOG_STYLES.dialogContent}>
          <List sx={DIALOG_STYLES.list}>
            {activeTab === 'all' ? (
              // 显示所有模型
              availableModels.map((model) => (
                <ModelItem
                  key={getIdentityValue(model)}
                  model={model}
                  isSelected={selectedIdentity === getIdentityValue(model)}
                  onSelect={() => handleModelSelectWithClose(model)}
                  providerDisplayName={getProviderName(model.provider || model.providerType || '未知')}
                  providers={providers}
                />
              ))
            ) : activeTab === 'frequently-used' && currentProviderId ? (
              // 显示常用（上次使用的供应商）的模型
              groupedModels.groups[currentProviderId]?.map((model) => (
                <ModelItem
                  key={getIdentityValue(model)}
                  model={model}
                  isSelected={selectedIdentity === getIdentityValue(model)}
                  onSelect={() => handleModelSelectWithClose(model)}
                  providerDisplayName={getProviderName(model.provider || model.providerType || '未知')}
                  providers={providers}
                />
              ))
            ) : (
              // 显示特定提供商的模型
              groupedModels.groups[activeTab]?.map((model) => (
                <ModelItem
                  key={getIdentityValue(model)}
                  model={model}
                  isSelected={selectedIdentity === getIdentityValue(model)}
                  onSelect={() => handleModelSelectWithClose(model)}
                  providerDisplayName={getProviderName(model.provider || model.providerType || '未知')}
                  providers={providers}
                />
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>
  );
};

interface ModelItemProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  providerDisplayName: string;
  providers: any[]; // 传入 providers 避免在组件内部使用 useSelector
}

// 优化 ModelItem 组件 - 使用 React.memo 避免不必要的重新渲染
const ModelItem: React.FC<ModelItemProps> = React.memo(({
  model,
  isSelected,
  onSelect,
  providerDisplayName,
  providers
}) => {
  const theme = useTheme();

  // 优化主题相关计算 - 使用 useMemo 缓存
  const isDark = useMemo(() => theme.palette.mode === 'dark', [theme.palette.mode]);

  // 优化样式计算 - 使用 useMemo 缓存
  const listItemStyle = useMemo(() =>
    MODEL_ITEM_STYLES.listItem(isSelected, isDark),
    [isSelected, isDark]
  );

  const primaryTextProps = useMemo(() =>
    MODEL_ITEM_STYLES.primaryText(isSelected),
    [isSelected]
  );

  // 获取模型或供应商图标（优先显示模型图标）
  const providerIcon = useMemo(() => {
    const modelId = model.id || '';
    const providerId = model.provider || model.providerType || '';
    return getModelOrProviderIcon(modelId, providerId, isDark);
  }, [model.id, model.provider, model.providerType, isDark]);

  return (
    <ListItem
      onClick={onSelect}
      sx={{
        ...listItemStyle,
        cursor: 'pointer',
        '&:hover': {
          ...listItemStyle['&:hover'],
          backgroundColor: isSelected
            ? (isDark ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)')
            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
        }
      }}
    >
      <ListItemIcon sx={MODEL_ITEM_STYLES.listItemIcon}>
        <Avatar 
          src={providerIcon}
          alt={providerDisplayName}
          sx={MODEL_ITEM_STYLES.avatar}
        >
          {providerDisplayName[0]}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={model.name}
        secondary={model.description || `${providerDisplayName}模型`}
        slotProps={{
          primary: primaryTextProps,
          secondary: MODEL_ITEM_STYLES.secondaryText
        }}
      />
      {isSelected && (
        <CheckIcon color="primary" fontSize="small" />
      )}
    </ListItem>
  );
});

export default DialogModelSelector;