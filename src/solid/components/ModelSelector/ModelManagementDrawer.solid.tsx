/**
 * ModelManagementDrawer - SolidJS 版本
 * 模型管理抽屉，从网络自动获取模型列表，支持批量添加/移除
 * 使用原生 HTML + CSS，不依赖 Material-UI 组件库
 */
import { createSignal, createMemo, For, Show, createEffect, on, batch, splitProps, mergeProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Model } from '../../../shared/types';
import { getDefaultGroupName, modelMatchesIdentity } from '../../../shared/utils/modelUtils';
import { getModelOrProviderIcon } from '../../../shared/utils/providerIcons';
import './ModelManagementDrawer.solid.css';

export interface ModelManagementDrawerProps {
  open: boolean;
  onClose: () => void;
  provider: any;
  models: Model[];
  loading: boolean;
  existingModels: Model[];
  onAddModel: (model: Model) => void;
  onAddModels?: (models: Model[]) => void;
  onRemoveModel: (modelId: string) => void;
  onRemoveModels?: (modelIds: string[]) => void;
  themeMode: 'light' | 'dark';
}

// SVG 图标常量 - 避免重复创建
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MinusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// 模型图标组件 - 使用项目内的图标系统
function ModelIcon(props: { 
  modelId: string; 
  providerId?: string; 
  isDark: boolean;
  size?: number;
  iconCache: Map<string, string>;
}) {
  const merged = mergeProps({ size: 28 }, props);
  
  // 从缓存获取图标
  const iconSrc = () => {
    const key = `${merged.modelId}:${merged.providerId || ''}`;
    return merged.iconCache.get(key) || getModelOrProviderIcon(merged.modelId, merged.providerId || '', merged.isDark);
  };

  return (
    <img
      class="model-icon"
      src={iconSrc()}
      alt={merged.modelId}
      style={{
        width: `${merged.size}px`,
        height: `${merged.size}px`,
        'border-radius': '6px',
        'object-fit': 'contain',
      }}
      onError={(e) => {
        // 图片加载失败时显示默认图标
        const target = e.currentTarget as HTMLImageElement;
        target.src = merged.isDark 
          ? '/images/providerIcons/dark/custom.png'
          : '/images/providerIcons/light/custom.png';
      }}
    />
  );
}


// 触感反馈按钮组件 - 使用 splitProps 分离 props
function TactileButton(props: { children: any; class?: string }) {
  const [local, others] = splitProps(props, ['children', 'class']);
  const [pressed, setPressed] = createSignal(false);

  return (
    <div
      class="tactile-button"
      classList={{ 
        pressed: pressed(),
        [local.class || '']: !!local.class 
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      {...others}
    >
      {local.children}
    </div>
  );
}

export function ModelManagementDrawer(props: ModelManagementDrawerProps) {
  // 使用 splitProps 分离本地和传递的 props，保持响应性
  const [local, handlers] = splitProps(props, 
    ['open', 'provider', 'models', 'loading', 'existingModels', 'themeMode'],
  );

  const [searchTerm, setSearchTerm] = createSignal('');
  const [pendingModels, setPendingModels] = createSignal<Set<string>>(new Set());
  // 默认收起所有分组（用户可以手动展开）
  const [expandedGroups, setExpandedGroups] = createSignal<Set<string>>(new Set());

  // 使用 Set 缓存已添加的模型 ID，避免每次调用创建新函数
  const addedModelIds = createMemo(() => {
    const ids = new Set<string>();
    // 添加已存在的模型
    local.existingModels.forEach(m => {
      if (modelMatchesIdentity(m, { id: m.id, provider: local.provider?.id }, local.provider?.id)) {
        ids.add(m.id);
      }
    });
    // 添加 pending 状态的模型
    pendingModels().forEach(id => ids.add(id));
    return ids;
  });

  // 简单的查询函数，使用缓存的 Set
  const isModelAdded = (modelId: string) => addedModelIds().has(modelId);

  // 🚀 性能优化：预计算所有模型的图标并缓存
  const iconCache = createMemo(() => {
    const isDark = local.themeMode === 'dark';
    const cache = new Map<string, string>();
    local.models.forEach(model => {
      const key = `${model.id}:${local.provider?.id || ''}`;
      if (!cache.has(key)) {
        cache.set(key, getModelOrProviderIcon(model.id, local.provider?.id || '', isDark));
      }
    });
    return cache;
  });

  // 获取当前主题
  const isDarkTheme = () => local.themeMode === 'dark';

  // 过滤和分组模型
  const groupedModels = createMemo(() => {
    const searchLower = searchTerm().toLowerCase();
    const result: Record<string, Model[]> = {};

    local.models.forEach(model => {
      const modelName = model.name || model.id;
      if (!searchLower || modelName.toLowerCase().includes(searchLower) || model.id.toLowerCase().includes(searchLower)) {
        const group = model.group || getDefaultGroupName(model.id, local.provider?.id);
        
        if (!result[group]) {
          result[group] = [];
        }
        result[group].push(model);
      }
    });

    return result;
  });

  // 排序后的分组列表
  const sortedGroups = createMemo(() => {
    const groups = Object.keys(groupedModels()).sort((a, b) => {
      if (a === 'Embeddings') return -1;
      if (b === 'Embeddings') return 1;
      if (a === '其他模型') return 1;
      if (b === '其他模型') return -1;
      return a.localeCompare(b);
    });
    return groups;
  });

  // 处理添加单个模型 - 使用 batch 批量更新
  const handleAddModel = (model: Model) => {
    const modelId = model.id;
    if (!isModelAdded(modelId)) {
      batch(() => {
        // 立即更新pending状态，确保UI立即响应
        setPendingModels(prev => {
          const newSet = new Set(prev);
          newSet.add(modelId);
          return newSet;
        });
        // 调用父组件回调
        handlers.onAddModel(model);
      });
    }
  };

  // 处理移除单个模型 - 使用 batch 批量更新
  const handleRemoveModel = (modelId: string) => {
    batch(() => {
      // 立即更新pending状态，确保UI立即响应
      setPendingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
      // 调用父组件回调
      handlers.onRemoveModel(modelId);
    });
  };

  // 处理添加整组 - 使用 batch 批量更新
  const handleAddGroup = (groupName: string) => {
    const modelsInGroup = groupedModels()[groupName] || [];
    const modelsToAdd = modelsInGroup.filter(m => !isModelAdded(m.id));

    if (modelsToAdd.length > 0) {
      batch(() => {
        setPendingModels(prev => new Set([...prev, ...modelsToAdd.map(m => m.id)]));
        
        if (handlers.onAddModels) {
          handlers.onAddModels(modelsToAdd.map(m => ({ ...m })));
        } else {
          modelsToAdd.forEach(model => handlers.onAddModel({ ...model }));
        }
      });
    }
  };

  // 处理移除整组 - 使用 batch 批量更新
  const handleRemoveGroup = (groupName: string) => {
    const modelsInGroup = groupedModels()[groupName] || [];
    const modelsToRemove = modelsInGroup.filter(m => isModelAdded(m.id));

    if (modelsToRemove.length > 0) {
      batch(() => {
        setPendingModels(prev => {
          const newSet = new Set(prev);
          modelsToRemove.forEach(m => newSet.delete(m.id));
          return newSet;
        });

        if (handlers.onRemoveModels) {
          handlers.onRemoveModels(modelsToRemove.map(m => m.id));
        } else {
          modelsToRemove.forEach(model => handlers.onRemoveModel(model.id));
        }
      });
    }
  };

  // 切换分组展开/折叠
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set<string>(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // 检查整组是否全部添加 - 使用简单函数，依赖 addedModelIds memo
  const isGroupFullyAdded = (groupName: string) => {
    const modelsInGroup = groupedModels()[groupName] || [];
    return modelsInGroup.length > 0 && modelsInGroup.every(m => isModelAdded(m.id));
  };

  // 关闭时清理
  createEffect(on(() => local.open, (isOpen) => {
    if (!isOpen) {
      setSearchTerm('');
      setPendingModels(new Set<string>());
    }
  }));

  // 点击背景关闭
  const handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('model-drawer-backdrop')) {
      handlers.onClose();
    }
  };

  // 优化：单个模型点击处理器，使用数组绑定避免闭包
  const handleModelItemClick = (model: Model, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isModelAdded(model.id)) {
      handleRemoveModel(model.id);
    } else {
      handleAddModel(model);
    }
  };

  // 优化：分组操作处理器
  const handleGroupActionClick = (groupName: string, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isGroupFullyAdded(groupName)) {
      handleRemoveGroup(groupName);
    } else {
      handleAddGroup(groupName);
    }
  };

  // 优化：分组展开/折叠处理器 - 用于数组绑定
  const handleGroupToggle = (groupName: string, e: MouseEvent) => {
    e.stopPropagation();
    toggleGroup(groupName);
  };

  return (
    <Show when={local.open}>
      <Portal>
        <div
          class="model-drawer-backdrop"
          onClick={handleBackdropClick}
        >
          {/* 抽屉容器 */}
          <div class="model-drawer">
            {/* 拖拽指示器 */}
            <div class="model-drawer-handle">
              <div class="model-drawer-handle-bar"></div>
            </div>

            {/* 搜索栏 */}
            <div class="model-drawer-search">
              <div class="model-search-input-wrapper">
                <svg class="model-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  class="model-search-input"
                  placeholder="搜索模型..."
                  value={searchTerm()}
                  onInput={(e) => setSearchTerm(e.currentTarget.value)}
                  autocomplete="off"
                  spellcheck={false}
                />
              </div>
            </div>

            {/* 模型列表 */}
            <div class="model-drawer-content">
              <Show
                when={!local.loading}
                fallback={
                  <div class="model-drawer-loading">
                    <div class="loading-spinner"></div>
                    <p>加载模型列表中...</p>
                  </div>
                }
              >
                <Show
                  when={sortedGroups().length > 0}
                  fallback={
                    <div class="model-drawer-empty">
                      <p>{searchTerm() ? '未找到匹配的模型' : '暂无可用模型'}</p>
                    </div>
                  }
                >
                  <div class="model-groups-list">
                    <For each={sortedGroups()}>
                      {(groupName) => {
                        const modelsInGroup = groupedModels()[groupName] || [];
                        const isExpanded = () => expandedGroups().has(groupName);
                        const allAdded = () => isGroupFullyAdded(groupName);
                        

                        return (
                          <div class="model-group">
                            {/* 分组头部 - 使用数组绑定优化 */}
                            <div
                              class="model-group-header"
                              onClick={[handleGroupToggle, groupName]}
                            >
                              <div class="model-group-title">
                                <svg
                                  class="model-group-arrow"
                                  classList={{ expanded: isExpanded() }}
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                                <span>{groupName}</span>
                                <span class="model-group-count">({modelsInGroup.length})</span>
                              </div>
                              
                              {/* 批量添加/移除按钮 - 使用数组绑定优化 */}
                              <button
                                type="button"
                                class="model-group-action-btn"
                                classList={{
                                  'action-remove': allAdded(),
                                  'action-add': !allAdded()
                                }}
                                onClick={[handleGroupActionClick, groupName]}
                                title={allAdded() ? '移除整组' : '添加整组'}
                              >
                                <Show when={allAdded()} fallback={<PlusIcon />}>
                                  <MinusIcon />
                                </Show>
                              </button>
                            </div>

                            {/* 分组模型列表 */}
                            <Show when={isExpanded()}>
                              <div class="model-group-content">
                                <For each={modelsInGroup}>
                                  {(model) => {
                                    const added = () => isModelAdded(model.id);

                                    return (
                                      <TactileButton class="model-item-wrapper">
                                        <div class="model-item">
                                          <ModelIcon 
                                            modelId={model.id} 
                                            providerId={local.provider?.id}
                                            isDark={isDarkTheme()}
                                            size={28}
                                            iconCache={iconCache()}
                                          />
                                          
                                          <div class="model-item-info">
                                            <div class="model-item-name">{model.name || model.id}</div>
                                            <Show when={model.id !== model.name}>
                                              <div class="model-item-id">{model.id}</div>
                                            </Show>
                                          </div>
                                          
                                          {/* 添加/移除按钮 - 使用数组绑定优化 */}
                                          <button
                                            type="button"
                                            class="model-item-action-btn"
                                            classList={{
                                              'action-remove': added(),
                                              'action-add': !added()
                                            }}
                                            onClick={[handleModelItemClick, model]}
                                          >
                                            <Show when={added()} fallback={<PlusIcon />}>
                                              <MinusIcon />
                                            </Show>
                                          </button>
                                        </div>
                                      </TactileButton>
                                    );
                                  }}
                                </For>
                              </div>
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
