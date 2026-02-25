/**
 * useModelTest - 模型连接测试 Hook
 * 
 * 模块化的测试连接逻辑，参考 Cherry Studio 的简洁设计：
 * - 单一状态源：只用 React state 管理测试结果，移除 signal 冗余
 * - 防重入：通过 ref 锁定，避免信号/状态更新时序导致重复调用
 * - AbortController：支持取消正在进行的测试
 * - 自动清理：组件卸载时取消未完成的请求
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Model } from '../../../../shared/types';
import { testApiConnection } from '../../../../shared/api';
import ApiKeyManager from '../../../../shared/services/ai/ApiKeyManager';
import type { LoadBalanceStrategy } from '../../../../shared/config/defaultModels';
import { testingModelId } from './providerSignals';
import { CONSTANTS } from './constants';

// ============================================================================
// 类型定义
// ============================================================================

export interface TestResult {
  success: boolean;
  message: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  providerType?: string;
  models: Model[];
  apiKey?: string;
  apiKeys?: any[];
  keyManagement?: {
    strategy?: LoadBalanceStrategy;
    [key: string]: any;
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useModelTest(
  provider: ProviderConfig | undefined,
  apiKey: string,
  baseUrl: string,
  multiKeyEnabled: boolean
) {
  // 单一状态源
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResultDialogOpen, setTestResultDialogOpen] = useState(false);

  // 防重入锁 - 使用 ref 而非 signal/state，避免异步竞态
  const isTestingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const keyManager = ApiKeyManager.getInstance();

  // 长消息自动弹出详情对话框
  const shouldShowDetailDialog = testResult && 
    testResult.message && 
    testResult.message.length > CONSTANTS.MESSAGE_LENGTH_THRESHOLD;

  useEffect(() => {
    if (shouldShowDetailDialog) {
      setTestResultDialogOpen(true);
    }
  }, [shouldShowDetailDialog]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isTestingRef.current = false;
      testingModelId.value = null;
    };
  }, []);

  // ========================================================================
  // 内部工具函数
  // ========================================================================

  /** 获取当前可用的 API Key */
  const resolveApiKey = useCallback((): string => {
    if (multiKeyEnabled && provider?.apiKeys && provider.apiKeys.length > 0) {
      const keySelection = keyManager.selectApiKey(
        provider.apiKeys,
        provider.keyManagement?.strategy || 'round_robin'
      );
      if (keySelection.key) {
        return keySelection.key.key;
      }
      throw new Error('没有可用的 API Key。请检查多 Key 配置。');
    }
    return apiKey;
  }, [provider, apiKey, multiKeyEnabled, keyManager]);

  // ========================================================================
  // 测试单个模型连接
  // ========================================================================

  const handleTestModelConnection = useCallback(async (model: Model) => {
    if (!provider) return;

    // 防重入：ref 同步检查，不依赖异步状态
    if (isTestingRef.current) return;
    isTestingRef.current = true;

    // 更新 UI 状态
    testingModelId.value = model.id;
    setTestResult(null);

    try {
      const testApiKey = resolveApiKey();

      const testModel = {
        ...model,
        provider: provider.id,
        providerType: provider.providerType,
        apiKey: testApiKey,
        baseUrl: baseUrl,
        enabled: true
      };

      const success = await testApiConnection(testModel);

      if (success) {
        setTestResult({
          success: true,
          message: `模型 ${model.name} 连接成功！`
        });
      } else {
        setTestResult({
          success: false,
          message: `模型 ${model.name} 连接失败，请检查API密钥和基础URL是否正确。`
        });
      }
    } catch (error) {
      console.error('测试模型连接时出错:', error);
      setTestResult({
        success: false,
        message: `连接错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      testingModelId.value = null;
      isTestingRef.current = false;
    }
  }, [provider, baseUrl, resolveApiKey]);

  // ========================================================================
  // 测试供应商连接（整体）
  // ========================================================================

  const handleTestConnection = useCallback(async () => {
    if (!provider) return;

    // 防重入
    if (isTestingRef.current) return;
    isTestingRef.current = true;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsTesting(true);
    setTestResult(null);

    try {
      const testApiKey = resolveApiKey();

      const testModel = {
        id: provider.models.length > 0 
          ? provider.models[0].id 
          : (provider.providerType || provider.id || 'gpt-3.5-turbo'),
        name: provider.name,
        provider: provider.id,
        providerType: provider.providerType,
        apiKey: testApiKey,
        baseUrl: baseUrl,
        enabled: true
      };

      const success = await testApiConnection(testModel);

      // 检查是否被取消
      if (abortControllerRef.current?.signal.aborted) return;

      if (success) {
        setTestResult({ success: true, message: '连接成功！API配置有效。' });
      } else {
        setTestResult({ success: false, message: '连接失败，请检查API密钥和基础URL是否正确。' });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      console.error('测试API连接时出错:', error);
      setTestResult({
        success: false,
        message: `连接错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsTesting(false);
      isTestingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [provider, baseUrl, resolveApiKey]);

  // ========================================================================
  // 清除测试结果
  // ========================================================================

  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  return {
    // 状态
    testResult,
    setTestResult,
    isTesting,
    testResultDialogOpen,
    setTestResultDialogOpen,

    // 方法
    handleTestConnection,
    handleTestModelConnection,
    clearTestResult,
  };
}
