/**
 * DialogModelSelector - SolidJS 版本
 * 弹窗式模型选择器，使用细粒度响应式提升性能
 * 使用原生 HTML + CSS，不依赖 Material-UI 组件库
 */
import { createSignal, createMemo, For, Show, createEffect, on } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Model } from '../../shared/types';
import { getModelIdentityKey } from '../../shared/utils/modelUtils';
import { getModelOrProviderIcon } from '../../shared/utils/providerIcons';
import './DialogModelSelector.solid.css';

export interface DialogModelSelectorProps {
  selectedModel: Model | null;
  availableModels: Model[];
  handleModelSelect: (model: Model) => void;
  handleMenuClose: () => void;
  menuOpen: boolean;
  providers: any[];
  themeMode: 'light' | 'dark';
  fullScreen: boolean;
}

export function DialogModelSelector(props: DialogModelSelectorProps) {
  // 确认 SolidJS 组件已加载
  console.log('🚀 [SolidJS] DialogModelSelector 已加载');
  
  const [activeTab, setActiveTab] = createSignal<string>('all');
  const [showLeftArrow, setShowLeftArrow] = createSignal(false);
  const [showRightArrow, setShowRightArrow] = createSignal(false);
  let tabsContainerRef: HTMLDivElement | undefined;

  // 提供商名称映射
  const providerNameMap = createMemo(() => {
    const map = new Map<string, string>();
    props.providers.forEach((provider: any) => {
      map.set(provider.id, provider.name);
    });
    return map;
  });

  // 获取提供商名称
  const getProviderName = (providerId: string) => {
    return providerNameMap().get(providerId) || providerId;
  };

  // 按提供商分组的模型
  const groupedModels = createMemo(() => {
    const groups: Record<string, Model[]> = {};
    const providersMap: Record<string, { id: string; displayName: string }> = {};

    props.availableModels.forEach(model => {
      const providerId = model.provider || model.providerType || '未知';
      const displayName = getProviderName(providerId);

      if (!providersMap[providerId]) {
        providersMap[providerId] = { id: providerId, displayName };
      }

      if (!groups[providerId]) {
        groups[providerId] = [];
      }
      groups[providerId].push(model);
    });

    const providersArray = Object.values(providersMap);
    
    const providerOrderMap = new Map<string, number>();
    props.providers.forEach((provider: any, index: number) => {
      providerOrderMap.set(provider.id, index);
    });

    providersArray.sort((a, b) => {
      const orderA = providerOrderMap.get(a.id);
      const orderB = providerOrderMap.get(b.id);
      
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return { groups, providers: providersArray };
  });

  // 获取当前选中模型的供应商ID
  const currentProviderId = createMemo(() => {
    return props.selectedModel?.provider || props.selectedModel?.providerType || null;
  });

  // 获取模型标识
  const getIdentityValue = (model: Model): string => {
    return getModelIdentityKey({ id: model.id, provider: model.provider });
  };

  // 选中模型的标识
  const selectedIdentity = createMemo(() => 
    props.selectedModel ? getIdentityValue(props.selectedModel) : ''
  );

  // 当对话框打开时，如果有当前供应商且activeTab还是初始值，自动切换到"常用"
  // 只在对话框刚打开时执行一次
  createEffect(
    on(
      () => props.menuOpen,
      (isOpen, prevIsOpen) => {
        // 只在对话框从关闭变为打开时执行
        if (isOpen && !prevIsOpen) {
          const providerId = currentProviderId();
          if (providerId && activeTab() === 'all') {
            setActiveTab('frequently-used');
          }
        }
        // 对话框关闭时重置为"全部"标签
        if (!isOpen) {
          setActiveTab('all');
        }
      },
      { defer: true } // 使用 defer 来获取 prevValue
    )
  );

  // 当前标签页显示的模型列表
  const displayedModels = createMemo(() => {
    const tab = activeTab();
    const groups = groupedModels().groups;
    const currentProvider = currentProviderId();

    if (tab === 'all') {
      return props.availableModels;
    } else if (tab === 'frequently-used' && currentProvider) {
      return groups[currentProvider] || [];
    } else {
      return groups[tab] || [];
    }
  });

  // 检查是否需要显示滚动箭头
  const updateScrollButtons = () => {
    if (!tabsContainerRef) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };

  // 滚动标签页
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef) return;
    
    const scrollAmount = 200;
    const newScrollLeft = direction === 'left' 
      ? tabsContainerRef.scrollLeft - scrollAmount
      : tabsContainerRef.scrollLeft + scrollAmount;
    
    tabsContainerRef.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // 监听标签页变化，更新滚动按钮
  createEffect(() => {
    // 依赖 groupedModels 和 currentProviderId 来触发更新
    groupedModels();
    currentProviderId();
    
    // 延迟检查，等待DOM更新
    setTimeout(updateScrollButtons, 0);
  });

  // 点击背景关闭对话框
  const handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('solid-dialog-backdrop')) {
      props.handleMenuClose();
    }
  };

  return (
    <Show when={props.menuOpen}>
      <Portal>
        <div 
          class={`solid-dialog-backdrop ${props.themeMode}`}
          onClick={handleBackdropClick}
        >
          <div class={`solid-dialog ${props.fullScreen ? 'fullscreen' : ''} ${props.themeMode}`}>
            {/* 标题栏 */}
            <div class="solid-dialog-header">
              <h2 class="solid-dialog-title">
                选择模型
                <span style="margin-left: 8px; font-size: 12px; color: #90caf9; font-weight: normal;">
                  ⚡ SolidJS
                </span>
              </h2>
              <button 
                class="solid-dialog-close-btn"
                onClick={props.handleMenuClose}
                aria-label="close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* 标签页 */}
            <div class="solid-tabs-wrapper">
              <Show when={showLeftArrow()}>
                <button 
                  class="solid-tab-scroll-button left"
                  onClick={() => scrollTabs('left')}
                  aria-label="向左滚动"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              </Show>
              
              <div 
                class="solid-tabs-container"
                ref={tabsContainerRef}
                onScroll={updateScrollButtons}
              >
                <div class="solid-tabs">
                <button
                  class={`solid-tab ${activeTab() === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  全部
                </button>
                <Show when={currentProviderId() && groupedModels().groups[currentProviderId()!]}>
                  <button
                    class={`solid-tab ${activeTab() === 'frequently-used' ? 'active' : ''}`}
                    onClick={() => setActiveTab('frequently-used')}
                  >
                    {getProviderName(currentProviderId()!)}
                  </button>
                </Show>
                <For each={groupedModels().providers.filter(p => p.id !== currentProviderId())}>
                  {(provider) => (
                    <button
                      class={`solid-tab ${activeTab() === provider.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(provider.id)}
                    >
                      {provider.displayName}
                    </button>
                  )}
                </For>
                </div>
              </div>
              
              <Show when={showRightArrow()}>
                <button 
                  class="solid-tab-scroll-button right"
                  onClick={() => scrollTabs('right')}
                  aria-label="向右滚动"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </Show>
            </div>

            {/* 模型列表 */}
            <div class="solid-dialog-content">
              <div class="solid-model-list">
                <For each={displayedModels()}>
                  {(model) => (
                    <ModelItem
                      model={model}
                      isSelected={selectedIdentity() === getIdentityValue(model)}
                      onSelect={() => props.handleModelSelect(model)}
                      providerDisplayName={getProviderName(model.provider || model.providerType || '未知')}
                      isDark={props.themeMode === 'dark'}
                    />
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

interface ModelItemProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  providerDisplayName: string;
  isDark: boolean;
}

// ModelItem 子组件
function ModelItem(props: ModelItemProps) {
  // 获取模型或供应商图标
  const providerIcon = createMemo(() => {
    const modelId = props.model.id || '';
    const providerId = props.model.provider || props.model.providerType || '';
    return getModelOrProviderIcon(modelId, providerId, props.isDark);
  });

  return (
    <div
      class={`solid-model-item ${props.isSelected ? 'selected' : ''}`}
      onClick={props.onSelect}
    >
      <div class="solid-model-icon">
        <img 
          src={providerIcon()}
          alt={props.providerDisplayName}
          onError={(e) => {
            // 如果图片加载失败，显示首字母
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) {
              (fallback as HTMLElement).style.display = 'flex';
            }
          }}
        />
        <div class="solid-model-icon-fallback" style="display: none;">
          {props.providerDisplayName[0]}
        </div>
      </div>
      <div class="solid-model-info">
        <div class={`solid-model-name ${props.isSelected ? 'selected' : ''}`}>
          {props.model.name}
        </div>
        <div class="solid-model-description">
          {props.model.description || `${props.providerDisplayName}模型`}
        </div>
      </div>
      <Show when={props.isSelected}>
        <div class="solid-model-check">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </Show>
    </div>
  );
}

export default DialogModelSelector;
