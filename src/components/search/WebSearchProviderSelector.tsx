/**
 * 网络搜索提供商选择器组件
 * 
 * 用于在助手设置中选择网络搜索提供商
 * 选择后，AI 将能够自主决定是否调用网络搜索
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Search, Globe, Zap, X } from 'lucide-react';
import type { RootState } from '../../shared/store';
import type { WebSearchProvider } from '../../shared/types';

interface WebSearchProviderSelectorProps {
  /** 当前选择的提供商ID */
  selectedProviderId?: string;
  /** 选择变更回调 */
  onSelect: (providerId: string | undefined) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
}

interface ProviderOption {
  id: WebSearchProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresApiKey: boolean;
  isConfigured: boolean;
}

/**
 * 网络搜索提供商选择器
 */
export const WebSearchProviderSelector: React.FC<WebSearchProviderSelectorProps> = ({
  selectedProviderId,
  onSelect,
  disabled = false,
  compact = false
}) => {
  // 从 Redux 获取网络搜索设置
  const webSearchSettings = useSelector((state: RootState) => state.webSearch);

  // 构建提供商选项列表
  const providerOptions = useMemo<ProviderOption[]>(() => {
    const apiKeys = webSearchSettings?.apiKeys || {};
    
    return [
      {
        id: 'bing-free' as WebSearchProvider,
        name: '免费搜索',
        description: '使用 Bing/Google/Baidu 等免费搜索引擎',
        icon: <Globe size={16} />,
        requiresApiKey: false,
        isConfigured: true
      },
      {
        id: 'tavily' as WebSearchProvider,
        name: 'Tavily',
        description: 'AI 优化的搜索 API',
        icon: <Zap size={16} />,
        requiresApiKey: true,
        isConfigured: !!apiKeys['tavily']
      },
      {
        id: 'exa' as WebSearchProvider,
        name: 'Exa',
        description: '语义搜索引擎',
        icon: <Search size={16} />,
        requiresApiKey: true,
        isConfigured: !!apiKeys['exa']
      },
      {
        id: 'bocha' as WebSearchProvider,
        name: 'Bocha',
        description: '博查搜索',
        icon: <Search size={16} />,
        requiresApiKey: true,
        isConfigured: !!apiKeys['bocha']
      },
      {
        id: 'firecrawl' as WebSearchProvider,
        name: 'Firecrawl',
        description: '网页抓取和搜索',
        icon: <Search size={16} />,
        requiresApiKey: true,
        isConfigured: !!apiKeys['firecrawl']
      },
      {
        id: 'cloudflare-ai-search' as WebSearchProvider,
        name: 'Cloudflare AI',
        description: 'Cloudflare AI 搜索',
        icon: <Zap size={16} />,
        requiresApiKey: true,
        isConfigured: !!apiKeys['cloudflare-ai-search']
      }
    ];
  }, [webSearchSettings?.apiKeys]);

  // 过滤出已配置的提供商
  const configuredProviders = useMemo(() => {
    return providerOptions.filter(p => p.isConfigured || !p.requiresApiKey);
  }, [providerOptions]);

  // 获取当前选中的提供商
  const selectedProvider = useMemo(() => {
    return providerOptions.find(p => p.id === selectedProviderId);
  }, [providerOptions, selectedProviderId]);

  // 处理选择
  const handleSelect = (providerId: string) => {
    if (disabled) return;
    
    // 如果点击已选中的，则取消选择
    if (providerId === selectedProviderId) {
      onSelect(undefined);
    } else {
      onSelect(providerId);
    }
  };

  // 处理清除选择
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
  };

  // 紧凑模式：只显示一个按钮
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (selectedProviderId) {
              onSelect(undefined);
            } else {
              // 默认选择第一个可用的提供商
              const firstProvider = configuredProviders[0];
              if (firstProvider) {
                onSelect(firstProvider.id);
              }
            }
          }}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
            transition-all duration-200
            ${selectedProviderId
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={selectedProvider ? `网络搜索: ${selectedProvider.name}` : '启用网络搜索'}
        >
          <Search size={14} />
          <span>{selectedProvider?.name || '网络搜索'}</span>
          {selectedProviderId && (
            <X
              size={14}
              className="ml-1 hover:text-red-300"
              onClick={handleClear}
            />
          )}
        </button>
      </div>
    );
  }

  // 完整模式：显示所有提供商选项
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          网络搜索提供商
        </label>
        {selectedProviderId && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <X size={12} />
            清除选择
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        选择一个搜索提供商后，AI 将能够自主决定是否需要搜索网络来回答问题
      </p>

      <div className="grid grid-cols-2 gap-2">
        {configuredProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSelect(provider.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 p-3 rounded-lg border text-left
              transition-all duration-200
              ${selectedProviderId === provider.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`
              p-1.5 rounded-md
              ${selectedProviderId === provider.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            `}>
              {provider.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {provider.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {provider.description}
              </div>
            </div>
            {selectedProviderId === provider.id && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {configuredProviders.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <Search size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无可用的搜索提供商</p>
          <p className="text-xs mt-1">请在设置中配置搜索 API</p>
        </div>
      )}
    </div>
  );
};

export default WebSearchProviderSelector;
