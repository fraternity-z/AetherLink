/**
 * 网络搜索快捷按钮组件
 * 
 * 在输入栏旁边显示，用于快速切换网络搜索状态
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Globe, Zap, ChevronDown, Check, X } from 'lucide-react';
import type { RootState } from '../../shared/store';
import type { WebSearchProvider } from '../../shared/types';

interface WebSearchQuickButtonProps {
  /** 当前助手的 webSearchProviderId */
  currentProviderId?: string;
  /** 更新助手的 webSearchProviderId */
  onProviderChange: (providerId: string | undefined) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

interface ProviderItem {
  id: WebSearchProvider | 'none';
  name: string;
  icon: React.ReactNode;
  isConfigured: boolean;
}

/**
 * 网络搜索快捷按钮
 */
export const WebSearchQuickButton: React.FC<WebSearchQuickButtonProps> = ({
  currentProviderId,
  onProviderChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 从 Redux 获取网络搜索设置
  const webSearchSettings = useSelector((state: RootState) => state.webSearch);

  // 构建提供商列表
  const providers: ProviderItem[] = ([
    {
      id: 'none' as const,
      name: '关闭搜索',
      icon: <X size={14} />,
      isConfigured: true
    },
    {
      id: 'bing-free' as WebSearchProvider,
      name: '免费搜索',
      icon: <Globe size={14} />,
      isConfigured: true
    },
    {
      id: 'tavily' as WebSearchProvider,
      name: 'Tavily',
      icon: <Zap size={14} />,
      isConfigured: !!(webSearchSettings?.apiKeys?.['tavily'])
    },
    {
      id: 'exa' as WebSearchProvider,
      name: 'Exa',
      icon: <Search size={14} />,
      isConfigured: !!(webSearchSettings?.apiKeys?.['exa'])
    }
  ] as ProviderItem[]).filter(p => p.isConfigured);

  // 获取当前选中的提供商
  const currentProvider = providers.find(p => p.id === currentProviderId);
  const isEnabled = !!currentProviderId && currentProviderId !== 'none';

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 处理选择
  const handleSelect = (providerId: string) => {
    if (providerId === 'none') {
      onProviderChange(undefined);
    } else {
      onProviderChange(providerId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 主按钮 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-xs
          transition-all duration-200
          ${isEnabled
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isEnabled ? `网络搜索: ${currentProvider?.name}` : '启用网络搜索'}
      >
        <Search size={12} />
        <span className="hidden sm:inline">
          {isEnabled ? currentProvider?.name : '搜索'}
        </span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute bottom-full left-0 mb-1 w-40
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            py-1 z-50
          "
        >
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            选择搜索引擎
          </div>
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSelect(provider.id)}
              className={`
                w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
                hover:bg-gray-100 dark:hover:bg-gray-700
                ${(provider.id === currentProviderId || (provider.id === 'none' && !currentProviderId))
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {provider.icon}
              <span className="flex-1">{provider.name}</span>
              {(provider.id === currentProviderId || (provider.id === 'none' && !currentProviderId)) && (
                <Check size={12} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebSearchQuickButton;
