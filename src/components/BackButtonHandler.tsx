import React, { useEffect, useRef, useCallback } from 'react';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../shared/hooks/useAppState';

/**
 * 处理设置页面的智能返回逻辑
 * @param pathname 当前路径
 * @param navigate 导航函数
 */
const handleSettingsBack = (pathname: string, navigate: (path: string) => void) => {
  // 设置页面的层级关系映射
  const settingsRoutes: { [key: string]: string } = {
    // 主设置页面返回聊天页面
    '/settings': '/chat',

    // 一级设置页面返回主设置页面
    '/settings/appearance': '/settings',
    '/settings/behavior': '/settings',
    '/settings/default-model': '/settings',
    '/settings/topic-naming-settings': '/settings',
    '/settings/agent-prompts': '/settings',
    '/settings/ai-debate': '/settings',
    '/settings/model-combo': '/settings',
    '/settings/web-search': '/settings',
    '/settings/mcp-server': '/settings',
    '/settings/quick-phrases': '/settings',
    '/settings/workspace': '/settings',
    '/settings/knowledge': '/settings',
    '/settings/data': '/settings',
    '/settings/notion': '/settings',
    '/settings/voice': '/settings',
    '/settings/about': '/settings',
    '/settings/assistant-settings': '/settings',
    
    // 开发者工具(三级页面) - 从关于我们进入
    '/devtools': '/settings/about',

    // 二级设置页面返回对应的一级页面
    '/settings/appearance/chat-interface': '/settings/appearance',
    '/settings/appearance/message-bubble': '/settings/appearance',
    '/settings/appearance/toolbar-customization': '/settings/appearance',
    '/settings/appearance/thinking-process': '/settings/appearance',
    '/settings/appearance/input-box': '/settings/appearance',
    '/settings/appearance/top-toolbar': '/settings/appearance',
    '/settings/appearance/theme-style': '/settings/appearance',
    '/settings/data/advanced-backup': '/settings/data',
    '/settings/assistant-model-settings': '/settings/assistant-settings',
    '/settings/voice/tts/capacitor': '/settings/voice',
    '/settings/voice/tts/siliconflow': '/settings/voice',
    '/settings/voice/tts/openai': '/settings/voice',
    '/settings/voice/tts/azure': '/settings/voice',
    '/settings/voice/tts/gemini': '/settings/voice',
    '/settings/voice/asr/capacitor': '/settings/voice',
    '/settings/voice/asr/openai-whisper': '/settings/voice',
    '/settings/add-provider': '/settings/default-model',
  };

  // 处理动态路由（如 /settings/model-provider/:providerId）
  if (pathname.startsWith('/settings/model-provider/')) {
    // 检查是否是四级页面（如 /settings/model-provider/:providerId/advanced-api）
    const modelProviderMatch = pathname.match(/^\/settings\/model-provider\/([^/]+)(?:\/(.+))?$/);
    if (modelProviderMatch) {
      const providerId = modelProviderMatch[1];
      const subPath = modelProviderMatch[2];
      
      // 如果有子路径（如 advanced-api 或 multi-key），说明是四级页面，返回到三级页面
      if (subPath) {
        navigate(`/settings/model-provider/${providerId}`);
        return;
      }
      // 如果没有子路径，说明是三级页面，返回到二级页面
      navigate('/settings/default-model');
      return;
    }
    // 如果匹配失败，默认返回到二级页面
    navigate('/settings/default-model');
    return;
  }
  if (pathname.startsWith('/settings/mcp-server/') && pathname !== '/settings/mcp-server') {
    navigate('/settings/mcp-server');
    return;
  }
  if (pathname.startsWith('/settings/workspace/') && pathname !== '/settings/workspace') {
    navigate('/settings/workspace');
    return;
  }

  // 查找对应的返回路径
  const backPath = settingsRoutes[pathname];
  if (backPath) {
    navigate(backPath);
  } else {
    // 如果没有找到对应的路径，默认返回主设置页面
    navigate('/settings');
  }
};

/**
 * 处理Android返回键的组件
 * 当用户点击返回键时，根据当前路由和对话框状态决定行为
 * 
 * 重构改进：
 * 1. 使用 closeLastDialog 方法，保证按 LIFO 顺序关闭对话框
 * 2. 移除自定义事件系统，使用回调模式
 * 3. 修复防抖逻辑，确保事件被正确处理
 * 4. 改进错误处理和状态同步
 */
const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setShowExitConfirm, 
    hasOpenDialogs, 
    closeLastDialog 
  } = useAppState();

  // 防抖机制：防止短时间内重复处理返回键事件
  const lastBackButtonTime = useRef<number>(0);
  const DEBOUNCE_DELAY = 300; // 300ms 防抖延迟
  
  // 用于追踪组件是否已卸载
  const isMountedRef = useRef(true);
  
  // 处理返回键的逻辑
  const handleBackButton = useCallback(() => {
    // 检查组件是否已卸载
    if (!isMountedRef.current) {
      return;
    }

    const now = Date.now();

    // 防抖检查：如果距离上次处理时间太短，则忽略此次事件
    // 注意：虽然我们忽略事件，但不会阻止默认行为（因为 Capacitor 的 backButton 事件没有返回值）
    if (now - lastBackButtonTime.current < DEBOUNCE_DELAY) {
      console.log('[BackButtonHandler] 防抖：忽略重复的返回键事件');
      return;
    }

    lastBackButtonTime.current = now;

    // 获取当前路径（实时获取，避免闭包问题）
    const currentPath = window.location.hash.replace('#', '') || '/';

    // 优先处理对话框关闭
    if (hasOpenDialogs()) {
      // 关闭最后打开的对话框（栈顶）
      const closed = closeLastDialog();
      if (closed) {
        console.log('[BackButtonHandler] 已关闭最后一个对话框');
        // 对话框的关闭回调会在 closeLastDialog 中执行，不需要额外处理
        return;
      }
      // 如果关闭失败，继续执行页面返回逻辑
      console.warn('[BackButtonHandler] 关闭对话框失败，继续执行页面返回逻辑');
    }

    // 根据当前路径决定行为
    if (currentPath === '/chat') {
      // 在聊天页面，显示退出确认对话框
      setShowExitConfirm(true);
    } else if (currentPath === '/welcome') {
      // 在欢迎页面，显示退出确认对话框
      setShowExitConfirm(true);
    } else if (currentPath.startsWith('/settings') || currentPath === '/devtools') {
      // 在设置页面或开发者工具页面，智能返回到上级页面
      handleSettingsBack(currentPath, navigate);
    } else {
      // 在其他页面，返回到聊天页面
      navigate('/chat');
    }
  }, [navigate, setShowExitConfirm, hasOpenDialogs, closeLastDialog]);

  useEffect(() => {
    isMountedRef.current = true;
    let listenerCleanup: (() => void) | undefined;

    // 监听返回键事件
    const setupListener = async () => {
      try {
        const listener = await App.addListener('backButton', handleBackButton);

        // 确保组件仍然挂载
        if (isMountedRef.current) {
          listenerCleanup = () => {
            listener.remove();
          };
        } else {
          // 如果组件已卸载，立即清理
          listener.remove();
        }
      } catch (error) {
        console.error('[BackButtonHandler] 设置返回键监听器失败:', error);
      }
    };

    // 设置监听器并处理Promise
    setupListener().catch(error => {
      console.error('[BackButtonHandler] setupListener error:', error);
    });

    // 组件卸载时移除监听器
    return () => {
      isMountedRef.current = false;
      if (listenerCleanup) {
        listenerCleanup();
      }
    };
  }, [handleBackButton]);

  // 组件卸载时设置标记
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 这是一个纯逻辑组件，不渲染任何UI
  return null;
};

export default BackButtonHandler;
