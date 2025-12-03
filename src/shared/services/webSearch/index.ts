/**
 * 网络搜索服务模块
 * 
 * 这个模块包含了所有与网络搜索相关的服务：
 * - BingFreeSearchService: 免费Bing搜索服务，支持多种搜索引擎
 * - EnhancedWebSearchService: 增强的网络搜索服务，整合多个搜索提供商
 * - BingMobileSDK: Bing移动端SDK
 * - TavilyMobileSDK: Tavily移动端SDK
 */

// 导入服务类
import BingFreeSearchServiceClass from './BingFreeSearchService';
import enhancedWebSearchServiceInstance from './EnhancedWebSearchService';

// 导出主要的搜索服务
export { default as BingFreeSearchService } from './BingFreeSearchService';
export { default as EnhancedWebSearchService } from './EnhancedWebSearchService';
export { default as BingMobileSDK } from './BingMobileSDK';
export { default as TavilyMobileSDK } from './TavilyMobileSDK';

// 导出类型定义
export type {
  BingSearchOptions,
  BingSearchResult,
  BingSearchResponse
} from './BingFreeSearchService';

// 导出常用的搜索引擎实例
export const bingFreeSearchService = BingFreeSearchServiceClass.getInstance();
export const enhancedWebSearchService = enhancedWebSearchServiceInstance;

// 🚀 导出 AI Tool Use 相关模块
export * from './WebSearchTool';
export * from './SearchIntentAnalyzer';
export * from './AIIntentAnalyzer';
