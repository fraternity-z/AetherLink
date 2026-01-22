import { useState, useEffect, useCallback } from 'react';

/**
 * 菜单状态管理 Hook
 * 
 * 统一管理输入框组件中的菜单状态，包括：
 * - 上传菜单（图片/文件上传）
 * - 多模型选择器
 * - 工具菜单
 * 
 * 提供便捷的打开/关闭方法，并自动处理内存泄漏防护（组件卸载时清理DOM引用）
 */
export interface UseInputMenusReturn {
  // 上传菜单状态
  uploadMenuAnchorEl: HTMLElement | null;
  setUploadMenuAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  openUploadMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  closeUploadMenu: () => void;
  isUploadMenuOpen: boolean;
  
  // 多模型选择器状态
  multiModelSelectorOpen: boolean;
  setMultiModelSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMultiModelSelector: () => void;
  closeMultiModelSelector: () => void;
  toggleMultiModelSelector: () => void;
  
  // 工具菜单状态
  toolsMenuOpen: boolean;
  setToolsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toolsMenuAnchorEl: HTMLElement | null;
  setToolsMenuAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  openToolsMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  closeToolsMenu: () => void;
  isToolsMenuOpen: boolean;
  
  // 关闭所有菜单
  closeAllMenus: () => void;
}

export function useInputMenus(): UseInputMenusReturn {
  // 上传菜单状态
  const [uploadMenuAnchorEl, setUploadMenuAnchorEl] = useState<HTMLElement | null>(null);
  
  // 多模型选择器状态
  const [multiModelSelectorOpen, setMultiModelSelectorOpen] = useState(false);
  
  // 工具菜单状态
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [toolsMenuAnchorEl, setToolsMenuAnchorEl] = useState<HTMLElement | null>(null);
  
  // 内存泄漏防护：组件卸载时清理DOM引用
  useEffect(() => {
    return () => {
      setUploadMenuAnchorEl(null);
      setToolsMenuAnchorEl(null);
    };
  }, []);
  
  // 上传菜单方法
  const openUploadMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setUploadMenuAnchorEl(event.currentTarget);
  }, []);
  
  const closeUploadMenu = useCallback(() => {
    setUploadMenuAnchorEl(null);
  }, []);
  
  const isUploadMenuOpen = Boolean(uploadMenuAnchorEl);
  
  // 多模型选择器方法
  const openMultiModelSelector = useCallback(() => {
    setMultiModelSelectorOpen(true);
  }, []);
  
  const closeMultiModelSelector = useCallback(() => {
    setMultiModelSelectorOpen(false);
  }, []);
  
  const toggleMultiModelSelector = useCallback(() => {
    setMultiModelSelectorOpen(prev => !prev);
  }, []);
  
  // 工具菜单方法
  const openToolsMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setToolsMenuAnchorEl(event.currentTarget);
    setToolsMenuOpen(true);
  }, []);
  
  const closeToolsMenu = useCallback(() => {
    setToolsMenuAnchorEl(null);
    setToolsMenuOpen(false);
  }, []);
  
  const isToolsMenuOpen = toolsMenuOpen && Boolean(toolsMenuAnchorEl);
  
  // 关闭所有菜单
  const closeAllMenus = useCallback(() => {
    setUploadMenuAnchorEl(null);
    setMultiModelSelectorOpen(false);
    setToolsMenuAnchorEl(null);
    setToolsMenuOpen(false);
  }, []);
  
  return {
    // 上传菜单
    uploadMenuAnchorEl,
    setUploadMenuAnchorEl,
    openUploadMenu,
    closeUploadMenu,
    isUploadMenuOpen,
    
    // 多模型选择器
    multiModelSelectorOpen,
    setMultiModelSelectorOpen,
    openMultiModelSelector,
    closeMultiModelSelector,
    toggleMultiModelSelector,
    
    // 工具菜单
    toolsMenuOpen,
    setToolsMenuOpen,
    toolsMenuAnchorEl,
    setToolsMenuAnchorEl,
    openToolsMenu,
    closeToolsMenu,
    isToolsMenuOpen,
    
    // 关闭所有
    closeAllMenus
  };
}

export default useInputMenus;