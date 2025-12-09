/**
 * FullScreenSelector - SolidJS 版本
 * 全屏音色/情感选择器，使用分页 Tab + 细粒度响应式提升性能
 * 使用原生 HTML + CSS，不依赖 Material-UI 组件库
 */
import { createSignal, createMemo, For, Show, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useAppState } from '../../../shared/hooks/useAppState';
import './FullScreenSelector.solid.css';

export interface SelectorItem {
  key: string;
  label: string;
  subLabel?: string;
  deletable?: boolean; // 是否可删除
}

export interface SelectorGroup {
  name: string;
  items: SelectorItem[];
}

export interface FullScreenSelectorProps {
  open: boolean;
  onClose: () => void;
  title: string;
  groups: SelectorGroup[];
  selectedKey: string;
  onSelect: (key: string, label: string) => void;
  onDelete?: (key: string) => void; // 删除回调
  allowEmpty?: boolean;
  emptyLabel?: string;
  themeMode?: 'light' | 'dark';
}

export function FullScreenSelector(props: FullScreenSelectorProps) {
  const [searchText, setSearchText] = createSignal('');
  const [activeTab, setActiveTab] = createSignal<string>('all');
  let searchInputRef: HTMLInputElement | undefined;
  let tabsContainerRef: HTMLDivElement | undefined;
  
  // 主题
  const themeMode = () => props.themeMode || 'light';
  
  // 生成唯一ID用于返回键处理
  const dialogId = `solid-fullscreen-selector-${Math.random().toString(36).slice(2)}`;
  
  // 获取所有分组名称（用于 Tab）
  const groupNames = createMemo(() => props.groups.map(g => g.name));
  
  // 过滤搜索结果
  const filteredGroups = createMemo(() => {
    const search = searchText().toLowerCase().trim();
    const tab = activeTab();
    
    let groups = props.groups;
    
    // 如果不是"全部"，只显示当前 Tab 对应的分组
    if (tab !== 'all') {
      groups = groups.filter(g => g.name === tab);
    }
    
    // 如果有搜索文本，进一步过滤
    if (search) {
      groups = groups
        .map(group => ({
          ...group,
          items: group.items.filter(item =>
            item.label.toLowerCase().includes(search) ||
            item.key.toLowerCase().includes(search) ||
            (item.subLabel && item.subLabel.toLowerCase().includes(search))
          ),
        }))
        .filter(group => group.items.length > 0);
    }
    
    return groups;
  });
  
  // 处理选择
  const handleSelect = (key: string, label: string) => {
    props.onSelect(key, label);
    props.onClose();
  };
  
  // 处理关闭
  const handleClose = () => {
    setSearchText('');
    setActiveTab('all');
    props.onClose();
  };
  
  // 处理背景点击
  const handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('solid-selector-backdrop')) {
      handleClose();
    }
  };
  
  // 鼠标滚轮横向滚动
  const handleWheel = (e: WheelEvent) => {
    if (!tabsContainerRef) return;
    e.preventDefault();
    tabsContainerRef.scrollLeft += e.deltaY * 2;
  };
  
  // 集成全局返回键处理
  createEffect(() => {
    const isOpen = props.open;
    const { openDialog, closeDialog } = useAppState.getState();
    
    if (isOpen) {
      openDialog(dialogId, handleClose);
    } else {
      closeDialog(dialogId);
      setSearchText('');
      setActiveTab('all');
    }
    
    onCleanup(() => {
      if (isOpen) {
        closeDialog(dialogId);
      }
    });
  });
  
  return (
    <Show when={props.open}>
      <Portal>
        <div 
          class={`solid-selector-backdrop ${themeMode()}`}
          onClick={handleBackdropClick}
        >
          <div class={`solid-selector-panel ${themeMode()}`}>
            {/* 顶部导航栏 */}
            <header class="solid-selector-header">
              <button class="solid-selector-back-btn" onClick={handleClose} aria-label="返回">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h2 class="solid-selector-title">{props.title}</h2>
              <span class="solid-selector-badge">⚡ SolidJS</span>
            </header>
            
            {/* Tab 标签页 */}
            <div class="solid-selector-tabs-wrapper">
              <div 
                class="solid-selector-tabs-container"
                ref={tabsContainerRef}
                onWheel={handleWheel}
              >
                <div class="solid-selector-tabs">
                  {/* 全部 Tab */}
                  <button
                    class="solid-selector-tab"
                    classList={{ active: activeTab() === 'all' }}
                    onClick={() => setActiveTab('all')}
                  >
                    全部
                  </button>
                  {/* 各分组 Tab */}
                  <For each={groupNames()}>
                    {(name) => (
                      <button
                        class="solid-selector-tab"
                        classList={{ active: activeTab() === name }}
                        onClick={() => setActiveTab(name)}
                      >
                        {name}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </div>
            
            {/* 搜索栏 */}
            <div class="solid-selector-search">
              <div class="solid-selector-search-wrapper">
                <span class="solid-selector-search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  class="solid-selector-search-input"
                  type="text"
                  placeholder="搜索..."
                  value={searchText()}
                  onInput={(e) => setSearchText(e.currentTarget.value)}
                />
              </div>
            </div>
            
            {/* 内容区域 */}
            <div class="solid-selector-content">
              {/* 空选项 */}
              <Show when={props.allowEmpty && !searchText()}>
                <div
                  class={`solid-selector-empty-option ${props.selectedKey === '' ? 'selected' : ''}`}
                  onClick={() => handleSelect('', props.emptyLabel || '无')}
                >
                  <span class="solid-selector-empty-label">{props.emptyLabel || '无'}</span>
                  <Show when={props.selectedKey === ''}>
                    <span class="solid-selector-check">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  </Show>
                </div>
              </Show>
              
              {/* 分组列表 */}
              <For each={filteredGroups()}>
                {(group) => (
                  <div class="solid-selector-group">
                    {/* 只在"全部" Tab 时显示分组标题 */}
                    <Show when={activeTab() === 'all'}>
                      <div class="solid-selector-group-title">{group.name}</div>
                    </Show>
                    <div class="solid-selector-grid">
                      <For each={group.items}>
                        {(item) => (
                          <div
                            class={`solid-selector-chip ${props.selectedKey === item.key ? 'selected' : ''} ${item.deletable ? 'deletable' : ''}`}
                            onClick={() => handleSelect(item.key, item.label)}
                          >
                            <span>{item.label}</span>
                            <Show when={props.selectedKey === item.key}>
                              <span class="solid-selector-chip-check">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                            </Show>
                            {/* 删除按钮 */}
                            <Show when={item.deletable && props.onDelete}>
                              <span 
                                class="solid-selector-chip-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  props.onDelete?.(item.key);
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
              
              {/* 无搜索结果 */}
              <Show when={filteredGroups().length === 0 && searchText()}>
                <div class="solid-selector-no-results">
                  未找到匹配的选项
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}

export default FullScreenSelector;
