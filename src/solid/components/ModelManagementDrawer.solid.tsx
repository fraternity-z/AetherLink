/**
 * ModelManagementDrawer - SolidJS 版本
 * 模型管理抽屉，从网络自动获取模型列表，支持批量添加/移除
 * 使用原生 HTML + CSS，不依赖 Material-UI 组件库
 */
import { createSignal, createMemo, For, Show, createEffect, on } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Model } from '../../shared/types';
import { getDefaultGroupName, modelMatchesIdentity } from '../../shared/utils/modelUtils';
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

// 品牌头像组件
function BrandAvatar(props: { name: string; size?: number }) {
  const size = () => props.size || 28;
  
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
    <div
      class="model-avatar"
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        'background-color': getColor(props.name),
        'font-size': `${size() * 0.5}px`,
      }}
    >
      {getInitial(props.name)}
    </div>
  );
}

// 触感反馈按钮组件
function TactileButton(props: { children: any; onClick?: () => void; class?: string }) {
  const [pressed, setPressed] = createSignal(false);

  return (
    <div
      class={`tactile-button ${props.class || ''}`}
      classList={{ pressed: pressed() }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}

export function ModelManagementDrawer(props: ModelManagementDrawerProps) {
  console.log('🚀 [SolidJS] ModelManagementDrawer 已加载');

  const [searchTerm, setSearchTerm] = createSignal('');
  const [pendingModels, setPendingModels] = createSignal<Set<string>>(new Set());
  // 默认收起所有分组（用户可以手动展开）
  const [expandedGroups, setExpandedGroups] = createSignal<Set<string>>(new Set());

  // 检查模型是否已添加 - 使用 createMemo 确保响应式
  const isModelAdded = createMemo<(modelId: string) => boolean>(() => {
    return (modelId: string) => {
      const existing = props.existingModels.some(m => 
        modelMatchesIdentity(m, { id: modelId, provider: props.provider?.id }, props.provider?.id)
      );
      const pending = pendingModels().has(modelId);
      return existing || pending;
    };
  });

  // 过滤和分组模型
  const groupedModels = createMemo(() => {
    const searchLower = searchTerm().toLowerCase();
    const result: Record<string, Model[]> = {};

    props.models.forEach(model => {
      const modelName = model.name || model.id;
      if (!searchLower || modelName.toLowerCase().includes(searchLower) || model.id.toLowerCase().includes(searchLower)) {
        const group = model.group || getDefaultGroupName(model.id, props.provider?.id);
        
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

  // 处理添加单个模型
  const handleAddModel = (model: Model) => {
    if (!isModelAdded()(model.id)) {
      console.log('[handleAddModel] 添加模型:', model.id);
      setPendingModels(prev => new Set([...prev, model.id]));
      props.onAddModel(model);
    }
  };

  // 处理移除单个模型
  const handleRemoveModel = (modelId: string) => {
    console.log('[handleRemoveModel] 移除模型:', modelId);
    setPendingModels(prev => {
      const newSet = new Set(prev);
      newSet.delete(modelId);
      return newSet;
    });
    props.onRemoveModel(modelId);
  };

  // 处理添加整组
  const handleAddGroup = (groupName: string) => {
    const modelsInGroup = groupedModels()[groupName] || [];
    const modelsToAdd = modelsInGroup.filter(m => !isModelAdded()(m.id));
    console.log('[handleAddGroup] 添加整组:', groupName, '模型数:', modelsToAdd.length);

    if (modelsToAdd.length > 0) {
      setPendingModels(prev => new Set([...prev, ...modelsToAdd.map(m => m.id)]));
      
      if (props.onAddModels) {
        props.onAddModels(modelsToAdd.map(m => ({ ...m })));
      } else {
        modelsToAdd.forEach(model => props.onAddModel({ ...model }));
      }
    }
  };

  // 处理移除整组
  const handleRemoveGroup = (groupName: string) => {
    const modelsInGroup = groupedModels()[groupName] || [];
    const modelsToRemove = modelsInGroup.filter(m => isModelAdded()(m.id));
    console.log('[handleRemoveGroup] 移除整组:', groupName, '模型数:', modelsToRemove.length);

    if (modelsToRemove.length > 0) {
      setPendingModels(prev => {
        const newSet = new Set(prev);
        modelsToRemove.forEach(m => newSet.delete(m.id));
        return newSet;
      });

      if (props.onRemoveModels) {
        props.onRemoveModels(modelsToRemove.map(m => m.id));
      } else {
        modelsToRemove.forEach(model => props.onRemoveModel(model.id));
      }
    }
  };

  // 切换分组展开/折叠
  const toggleGroup = (groupName: string) => {
    console.log('[toggleGroup] 切换分组:', groupName, '当前状态:', expandedGroups().has(groupName));
    setExpandedGroups(prev => {
      const newSet = new Set<string>(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
        console.log('[toggleGroup] 折叠分组:', groupName);
      } else {
        newSet.add(groupName);
        console.log('[toggleGroup] 展开分组:', groupName);
      }
      console.log('[toggleGroup] 新状态:', Array.from(newSet));
      return newSet;
    });
  };

  // 检查整组是否全部添加
  const isGroupFullyAdded = createMemo<(groupName: string) => boolean>(() => {
    return (groupName: string) => {
      const modelsInGroup = groupedModels()[groupName] || [];
      return modelsInGroup.length > 0 && modelsInGroup.every(m => isModelAdded()(m.id));
    };
  });

  // 关闭时清理
  createEffect(on(() => props.open, (isOpen) => {
    if (!isOpen) {
      setSearchTerm('');
      setPendingModels(new Set<string>());
    }
  }));

  // 点击背景关闭
  const handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('model-drawer-backdrop')) {
      props.onClose();
    }
  };

  return (
    <Show when={props.open}>
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
                when={!props.loading}
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
                        const allAdded = () => isGroupFullyAdded()(groupName);
                        
                        console.log('[Render] 分组:', groupName, '展开状态:', isExpanded(), '模型数:', modelsInGroup.length);

                        return (
                          <div class="model-group">
                            {/* 分组头部 */}
                            <div
                              class="model-group-header"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(groupName);
                              }}
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
                              
                              {/* 批量添加/移除按钮 */}
                              <button
                                type="button"
                                class="model-group-action-btn"
                                classList={{
                                  'action-remove': allAdded(),
                                  'action-add': !allAdded()
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log(`[批量操作] ${allAdded() ? '移除' : '添加'}整组:`, groupName);
                                  if (allAdded()) {
                                    handleRemoveGroup(groupName);
                                  } else {
                                    handleAddGroup(groupName);
                                  }
                                }}
                                title={allAdded() ? '移除整组' : '添加整组'}
                              >
                                <Show when={allAdded()} fallback={
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                }>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                </Show>
                              </button>
                            </div>

                            {/* 分组模型列表 */}
                            <Show when={isExpanded()}>
                              <div class="model-group-content">
                                <For each={modelsInGroup}>
                                  {(model) => {
                                    const added = () => isModelAdded()(model.id);

                                    return (
                                      <TactileButton class="model-item-wrapper">
                                        <div class="model-item">
                                          <BrandAvatar name={model.id} size={28} />
                                          
                                          <div class="model-item-info">
                                            <div class="model-item-name">{model.name || model.id}</div>
                                            <Show when={model.id !== model.name}>
                                              <div class="model-item-id">{model.id}</div>
                                            </Show>
                                          </div>
                                          
                                          {/* 添加/移除按钮 */}
                                          <button
                                            type="button"
                                            class="model-item-action-btn"
                                            classList={{
                                              'action-remove': added(),
                                              'action-add': !added()
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              console.log(`[单个操作] ${added() ? '移除' : '添加'}模型:`, model.id);
                                              if (added()) {
                                                handleRemoveModel(model.id);
                                              } else {
                                                handleAddModel(model);
                                              }
                                            }}
                                          >
                                            <Show when={added()} fallback={
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                              </svg>
                                            }>
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                              </svg>
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
