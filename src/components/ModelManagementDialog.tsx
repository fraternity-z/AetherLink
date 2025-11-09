import React, { useState, useEffect, useCallback, useRef, useTransition, useMemo } from 'react';
import {
  Drawer,
  Button,
  IconButton,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Collapse,
  useTheme,
  InputAdornment,
  Avatar
} from '@mui/material';
import { 
  Plus as AddIcon, 
  Minus as RemoveIcon, 
  Search as SearchIcon, 
  ChevronRight,
  Square,
  CheckSquare,
  Repeat
} from 'lucide-react';
import { alpha } from '@mui/material/styles';
import { fetchModels } from '../shared/services/network/APIService';
import type { Model } from '../shared/types';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

// 定义分组模型的类型
type GroupedModels = Record<string, Model[]>;

// 触感反馈按钮组件
const TactileButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  sx?: any;
}> = ({ children, onClick, sx }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Box
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      sx={{
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

// 品牌头像组件
const BrandAvatar: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => {
  const getInitial = (name: string) => {
    const match = name.match(/^([a-zA-Z0-9])/);
    return match ? match[1].toUpperCase() : '?';
  };

  const getColor = (name: string) => {
    const colors = [
      '#9333EA', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: getColor(name),
        fontSize: size * 0.5,
        fontWeight: 600
      }}
    >
      {getInitial(name)}
    </Avatar>
  );
};

interface ModelManagementDialogProps {
  open: boolean;
  onClose: () => void;
  provider: any;
  onAddModel: (model: Model) => void;
  onAddModels?: (models: Model[]) => void;
  onRemoveModel: (modelId: string) => void;
  onRemoveModels?: (modelIds: string[]) => void;
  existingModels: Model[];
}

const ModelManagementDialog: React.FC<ModelManagementDialogProps> = ({
  open,
  onClose,
  provider,
  onAddModel,
  onAddModels,
  onRemoveModel,
  onRemoveModels,
  existingModels
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [models, setModels] = useState<Model[]>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [actualSearchTerm, setActualSearchTerm] = useState<string>('');
  const [pendingModels, setPendingModels] = useState<Map<string, boolean>>(new Map());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [isSearchPending, startSearchTransition] = useTransition();

  // 使用ref存储初始provider，避免重新加载
  const initialProviderRef = useRef<any>(null);

  // 检查模型是否已经在提供商的模型列表中
  const isModelInProvider = useCallback((modelId: string): boolean => {
    return existingModels.some(m => m.id === modelId) || pendingModels.get(modelId) === true;
  }, [existingModels, pendingModels]);

  // 恢复防抖搜索函数，使用 useTransition 优化性能
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => {
      startSearchTransition(() => {
        setActualSearchTerm(value);
      });
    }, 300), // 300ms防抖延迟
    []
  );

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [debouncedSetSearchTerm]);

  // 优化搜索输入处理 - 确保输入框立即响应
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    // 立即同步更新输入框显示，不使用任何异步操作
    setSearchInputValue(newValue);
    // 防抖更新实际搜索逻辑
    debouncedSetSearchTerm(newValue);
  }, [debouncedSetSearchTerm]);

  // 将过滤和分组操作合并为一次循环，以提升性能，解决首次输入卡顿问题
  const groupedModels = useMemo((): GroupedModels => {
    const searchLower = actualSearchTerm.toLowerCase();
    const result: GroupedModels = {};

    for (const model of models) {
      // 如果搜索词为空，或模型名称/ID匹配，则处理该模型
      const modelName = model.name || model.id;
      if (!searchLower || modelName.toLowerCase().includes(searchLower) || model.id.toLowerCase().includes(searchLower)) {
        // 使用模型的分组信息，如果没有则使用默认分组
        const group = model.group || '其他模型';

        if (!result[group]) {
          result[group] = [];
        }
        result[group].push(model);
      }
    }
    return result;
  }, [models, actualSearchTerm]);

  // 获取过滤后的模型列表
  const filteredModels = useMemo(() => {
    const searchLower = actualSearchTerm.toLowerCase();
    return models.filter(model => {
      const modelName = model.name || model.id;
      return !searchLower || 
             modelName.toLowerCase().includes(searchLower) || 
             model.id.toLowerCase().includes(searchLower);
    });
  }, [models, actualSearchTerm]);

  // 切换分组折叠状态
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleAddSingleModel = useCallback((model: Model) => {
    if (!isModelInProvider(model.id)) {
      setPendingModels(prev => new Map(prev).set(model.id, true));
      onAddModel(model);
    }
  }, [isModelInProvider, onAddModel]);

  const handleRemoveSingleModel = useCallback((modelId: string) => {
    setPendingModels(prev => {
      const newMap = new Map(prev);
      newMap.delete(modelId);
      return newMap;
    });
    onRemoveModel(modelId);
  }, [onRemoveModel]);

  // 添加整个组 - 使用 useCallback 优化性能
  const handleAddGroup = useCallback((group: string) => {
    // 创建新模型集合，一次性添加整个组
    const modelsToAdd = groupedModels[group]?.filter((model: Model) => !isModelInProvider(model.id)) || [];

    if (modelsToAdd.length > 0) {
      // 批量更新pendingModels状态
      setPendingModels(prev => {
        const newPendingModels = new Map(prev);
        modelsToAdd.forEach((model: Model) => {
          newPendingModels.set(model.id, true);
        });
        return newPendingModels;
      });

      // 使用批量添加API（如果可用）
      if (onAddModels) {
        // 为每个模型创建副本
        const modelsCopy = modelsToAdd.map((model: Model) => ({...model}));
        // 批量添加
        onAddModels(modelsCopy);
      } else {
        // 为每个要添加的模型创建一个副本，添加到provider中
        modelsToAdd.forEach((model: Model) => {
          onAddModel({...model});
        });
      }
    }
  }, [groupedModels, isModelInProvider, onAddModels, onAddModel]);

  // 移除整个组 - 使用 useCallback 优化性能
  const handleRemoveGroup = useCallback((group: string) => {
    const modelsToRemove = groupedModels[group]?.filter((model: Model) => isModelInProvider(model.id)) || [];

    if (modelsToRemove.length > 0) {
      // 批量更新pendingModels状态
      setPendingModels(prev => {
        const newPendingModels = new Map(prev);
        modelsToRemove.forEach((model: Model) => {
          newPendingModels.delete(model.id);
        });
        return newPendingModels;
      });

      // 使用批量移除API（如果可用）
      if (onRemoveModels) {
        // 批量移除
        const modelIdsToRemove = modelsToRemove.map((model: Model) => model.id);
        onRemoveModels(modelIdsToRemove);
      } else {
        // 逐个移除
        modelsToRemove.forEach((model: Model) => {
          onRemoveModel(model.id);
        });
      }
    }
  }, [groupedModels, isModelInProvider, onRemoveModels, onRemoveModel]);

  // 全选/取消全选当前过滤结果
  const handleToggleAll = useCallback(() => {
    if (filteredModels.length === 0) return;
    
    const allSelected = filteredModels.every(m => isModelInProvider(m.id));
    
    if (allSelected) {
      // 取消全选
      const toRemove = filteredModels.map(m => m.id);
      if (onRemoveModels) {
        onRemoveModels(toRemove);
      } else {
        toRemove.forEach(id => onRemoveModel(id));
      }
      setPendingModels(prev => {
        const newMap = new Map(prev);
        toRemove.forEach(id => newMap.delete(id));
        return newMap;
      });
    } else {
      // 全选
      const toAdd = filteredModels.filter(m => !isModelInProvider(m.id));
      if (onAddModels) {
        onAddModels(toAdd);
      } else {
        toAdd.forEach(m => onAddModel(m));
      }
      setPendingModels(prev => {
        const newMap = new Map(prev);
        toAdd.forEach(m => newMap.set(m.id, true));
        return newMap;
      });
    }
  }, [filteredModels, isModelInProvider, onAddModels, onRemoveModels, onAddModel, onRemoveModel]);

  // 反选当前过滤结果
  const handleInvertSelection = useCallback(() => {
    if (filteredModels.length === 0) return;
    
    const toAdd: Model[] = [];
    const toRemove: string[] = [];
    
    filteredModels.forEach(m => {
      if (isModelInProvider(m.id)) {
        toRemove.push(m.id);
      } else {
        toAdd.push(m);
      }
    });
    
    if (toRemove.length > 0) {
      if (onRemoveModels) {
        onRemoveModels(toRemove);
      } else {
        toRemove.forEach(id => onRemoveModel(id));
      }
    }
    
    if (toAdd.length > 0) {
      if (onAddModels) {
        onAddModels(toAdd);
      } else {
        toAdd.forEach(m => onAddModel(m));
      }
    }
    
    setPendingModels(prev => {
      const newMap = new Map(prev);
      toRemove.forEach(id => newMap.delete(id));
      toAdd.forEach(m => newMap.set(m.id, true));
      return newMap;
    });
  }, [filteredModels, isModelInProvider, onAddModels, onRemoveModels, onAddModel, onRemoveModel]);

  // 加载模型列表
  const loadModels = async () => {
    try {
      setLoading(true);
      // 使用ref中存储的provider或当前provider
      const providerToUse = initialProviderRef.current || provider;
      const fetchedModels = await fetchModels(providerToUse);
      // 合并现有模型和从API获取的模型
      const allModels = [...fetchedModels];
      setModels(allModels);
    } catch (error) {
      console.error('加载模型失败:', error);
    } finally {
      setLoading(false);
    }
  };



  // 当对话框打开时加载模型（避免每次provider变化都重新加载）
  useEffect(() => {
    if (open && provider && (!initialProviderRef.current || initialProviderRef.current.id !== provider.id)) {
      initialProviderRef.current = provider;
      loadModels();
    }
  }, [open, provider]); // 只依赖open状态，不依赖provider

  // 当对话框关闭时重置搜索状态
  useEffect(() => {
    if (!open) {
      setSearchInputValue('');
      setActualSearchTerm('');
      debouncedSetSearchTerm.cancel();
    }
  }, [open, debouncedSetSearchTerm]);

  // 分组后的模型数据
  const groupedModelsList = useMemo(() => {
    const groupKeys = Object.keys(groupedModels).sort((a, b) => {
      if (a === 'Embeddings') return -1;
      if (b === 'Embeddings') return 1;
      if (a === '其他模型') return 1;
      if (b === '其他模型') return -1;
      return a.localeCompare(b);
    });
    
    return groupKeys.map(name => ({
      name,
      models: groupedModels[name]
    }));
  }, [groupedModels]);

  // 计算是否全部已选择
  const allSelected = useMemo(() => {
    return filteredModels.length > 0 && filteredModels.every(m => isModelInProvider(m.id));
  }, [filteredModels, isModelInProvider]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh',
          bgcolor: 'background.paper'
        }
      }}
    >
      <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* 拖拽指示器 */}
        <Box sx={{ pt: 1, pb: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: (theme) => alpha(theme.palette.text.primary, 0.2),
              borderRadius: 999
            }}
          />
        </Box>

        {/* 搜索栏 */}
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            fullWidth
            placeholder={t('modelSettings.dialogs.modelManagement.searchPlaceholder')}
            value={searchInputValue}
            onChange={handleSearchChange}
            autoComplete="off"
            spellCheck={false}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {/* 全选/取消全选 */}
                    <IconButton
                      size="small"
                      onClick={handleToggleAll}
                      disabled={filteredModels.length === 0}
                      title={allSelected ? t('modelSettings.dialogs.modelManagement.deselectAll') : t('modelSettings.dialogs.modelManagement.selectAll')}
                      sx={{ p: 0.5 }}
                    >
                      {allSelected ? (
                        <Square size={22} color={theme.palette.text.secondary} />
                      ) : (
                        <CheckSquare size={22} color={theme.palette.text.secondary} />
                      )}
                    </IconButton>
                    
                    {/* 反选 */}
                    <IconButton
                      size="small"
                      onClick={handleInvertSelection}
                      disabled={filteredModels.length === 0}
                      title={t('modelSettings.dialogs.modelManagement.invertSelection')}
                      sx={{ p: 0.5 }}
                    >
                      <Repeat size={22} color={theme.palette.text.secondary} />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F2F3F5',
                '& fieldset': { border: 'none' }
              }
            }}
          />
        </Box>

        {/* 模型列表 */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : groupedModelsList.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {actualSearchTerm ? t('modelSettings.dialogs.modelManagement.noModelsFound') : t('modelSettings.dialogs.modelManagement.noModelsAvailable')}
              </Typography>
            </Box>
          ) : (
            groupedModelsList.map((group) => (
              <Box key={group.name} sx={{ mb: 0.75 }}>
                {/* 分组头部 */}
                <TactileButton
                  onClick={() => toggleGroup(group.name)}
                  sx={{ width: '100%' }}
                >
                  <Box
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : '#F2F3F5',
                      borderRadius: 3,
                      px: 2,
                      py: 0.75
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 28,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Box
                          sx={{
                            transform: collapsedGroups[group.name] ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <ChevronRight size={20} color={theme.palette.text.secondary} />
                        </Box>
                      </Box>
                      
                      <Box sx={{ flex: 1, ml: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {group.name}
                          <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}>
                            ({group.models.length})
                          </Typography>
                        </Typography>
                      </Box>
                      
                      {/* 分组批量按钮 */}
                      <Box onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const allAdded = group.models.every(m => isModelInProvider(m.id));
                            if (allAdded) {
                              handleRemoveGroup(group.name);
                            } else {
                              handleAddGroup(group.name);
                            }
                          }}
                          sx={{
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                            }
                          }}
                          title={group.models.every(m => isModelInProvider(m.id)) ? t('modelSettings.dialogs.modelManagement.removeGroup') : t('modelSettings.dialogs.modelManagement.addGroup')}
                        >
                          {group.models.every(m => isModelInProvider(m.id)) ? (
                            <RemoveIcon size={18} color={theme.palette.primary.main} />
                          ) : (
                            <AddIcon size={18} color={theme.palette.primary.main} />
                          )}
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </TactileButton>

                {/* 分组内的模型 */}
                <Collapse in={!collapsedGroups[group.name]} timeout={220}>
                  <Box sx={{ pl: 0.5 }}>
                    {group.models.map((model) => {
                      const added = isModelInProvider(model.id);
                      return (
                        <TactileButton key={model.id} sx={{ width: '100%' }}>
                          <Box
                            sx={{
                              borderRadius: 3,
                              px: 2,
                              py: 1.25,
                              my: 0.75
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                                <BrandAvatar name={model.id} size={28} />
                              </Box>
                              
                              <Box sx={{ flex: 1, ml: 2 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
                                  {model.name || model.id}
                                </Typography>
                                {model.id !== model.name && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.3 }}>
                                    {model.id}
                                  </Typography>
                                )}
                              </Box>
                              
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (added) {
                                    handleRemoveSingleModel(model.id);
                                  } else {
                                    handleAddSingleModel(model);
                                  }
                                }}
                                sx={{ ml: 1 }}
                              >
                                {added ? (
                                  <RemoveIcon size={24} color={theme.palette.text.secondary} />
                                ) : (
                                  <AddIcon size={24} color={theme.palette.text.secondary} />
                                )}
                              </IconButton>
                            </Box>
                          </Box>
                        </TactileButton>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default ModelManagementDialog;