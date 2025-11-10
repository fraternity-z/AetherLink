/**
 * HarmonyOS 权限守卫组件
 * 自动检查权限并在需要时显示请求对话框
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HarmonyOSPermission } from '../../shared/config/harmonyOSConfig';
import { harmonyOSPermissionService } from '../../shared/services/HarmonyOSPermissionService';
import { isHarmonyOS } from '../../shared/utils/platformDetection';
import HarmonyOSPermissionDialog from './PermissionDialog';

interface PermissionGuardProps {
  permission: HarmonyOSPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onPermissionDenied?: () => void;
  autoRequest?: boolean; // 是否自动请求权限
}

/**
 * 权限守卫组件
 * 包裹需要权限的功能，自动处理权限检查和请求
 */
export const HarmonyOSPermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
  onPermissionDenied,
  autoRequest = false,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // 检查权限
  const checkPermission = useCallback(async () => {
    if (!isHarmonyOS()) {
      setHasPermission(true);
      return;
    }

    const granted = await harmonyOSPermissionService.hasPermission(permission);
    setHasPermission(granted);

    // 如果没有权限且需要自动请求
    if (!granted && autoRequest) {
      setShowDialog(true);
    }
  }, [permission, autoRequest]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const handlePermissionGranted = useCallback(() => {
    setHasPermission(true);
    setShowDialog(false);
  }, []);

  const handlePermissionDenied = useCallback(() => {
    setHasPermission(false);
    setShowDialog(false);
    onPermissionDenied?.();
  }, [onPermissionDenied]);

  // 正在检查权限
  if (hasPermission === null) {
    return null;
  }

  // 有权限，显示子组件
  if (hasPermission) {
    return <>{children}</>;
  }

  // 没有权限
  return (
    <>
      {fallback || null}
      <HarmonyOSPermissionDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        permission={permission}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </>
  );
};

export default HarmonyOSPermissionGuard;

