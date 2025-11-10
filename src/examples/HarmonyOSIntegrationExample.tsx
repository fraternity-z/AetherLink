/**
 * HarmonyOS 集成示例
 * 展示如何在现有代码中集成鸿蒙适配功能
 */

import React, { useState, useEffect } from 'react';
import { Box, Button, Alert, Typography, Paper } from '@mui/material';
import { Copy, Camera, FileUp, Bell } from 'lucide-react';

// 导入鸿蒙适配模块
import { isHarmonyOS, getPlatformInfo } from '../shared/utils/platformDetection';
import { platformAdapter } from '../shared/adapters/PlatformAdapter';
import { HarmonyOSClipboardButton } from '../components/HarmonyOS';
import { harmonyOSCameraService } from '../shared/services/HarmonyOSCameraService';
import { harmonyOSFileService } from '../shared/services/HarmonyOSFileService';
import { harmonyOSNotificationService } from '../shared/services/HarmonyOSNotificationService';
import { 
  initHarmonyOSCompatibilityCheck,
  detectHarmonyOSCompatibility 
} from '../shared/utils/harmonyOSDetector';

/**
 * 鸿蒙集成示例组件
 */
export const HarmonyOSIntegrationExample: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isHarmony, setIsHarmony] = useState(false);
  const [compatibility, setCompatibility] = useState<any>(null);

  useEffect(() => {
    // 检测鸿蒙系统
    setIsHarmony(isHarmonyOS());
    
    // 执行兼容性检查
    initHarmonyOSCompatibilityCheck();
    
    // 获取兼容性信息
    const compat = detectHarmonyOSCompatibility();
    setCompatibility(compat);
    
    // 显示平台信息
    const platformInfo = getPlatformInfo();
    console.log('平台信息:', platformInfo);
  }, []);

  // 示例1: 使用 platformAdapter 复制文本
  const handleCopy = async () => {
    try {
      await platformAdapter.clipboard.writeText('Hello HarmonyOS! 这是一个测试文本。');
      setMessage('✅ 复制成功');
    } catch (error) {
      setMessage(`❌ 复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 示例2: 使用 platformAdapter 粘贴文本
  const handlePaste = async () => {
    try {
      const text = await platformAdapter.clipboard.readText();
      setMessage(`✅ 粘贴成功: ${text.substring(0, 50)}...`);
    } catch (error) {
      setMessage(`❌ 粘贴失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 示例3: 使用相机服务
  const handleTakePicture = async () => {
    try {
      const result = await harmonyOSCameraService.takePicture();
      setMessage('✅ 拍照成功');
      console.log('照片数据:', result.dataUrl);
    } catch (error) {
      setMessage(`❌ 拍照失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 示例4: 使用文件服务
  const handlePickFile = async () => {
    try {
      const file = await harmonyOSFileService.pickFile();
      if (file) {
        setMessage(`✅ 选择文件成功: ${file.name}`);
      } else {
        setMessage('❌ 未选择文件');
      }
    } catch (error) {
      setMessage(`❌ 选择文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 示例5: 使用通知服务
  const handleShowNotification = async () => {
    try {
      await harmonyOSNotificationService.showNotification({
        title: '测试通知',
        body: '这是一个来自 AetherLink 的测试通知',
      });
      setMessage('✅ 通知已发送');
    } catch (error) {
      setMessage(`❌ 通知失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        HarmonyOS 集成示例
      </Typography>

      {/* 平台信息 */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          平台信息
        </Typography>
        <Typography variant="body2" color="text.secondary">
          运行在鸿蒙系统: {isHarmony ? '✅ 是' : '❌ 否'}
        </Typography>
        {compatibility && (
          <>
            <Typography variant="body2" color="text.secondary">
              系统版本: {compatibility.version || '未知'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              兼容性: {compatibility.isSupported ? '✅ 支持' : '⚠️ 不支持'}
            </Typography>
          </>
        )}
      </Paper>

      {/* 消息提示 */}
      {message && (
        <Alert 
          severity={message.includes('✅') ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {/* 功能按钮 */}
      <Box display="flex" flexDirection="column" gap={2}>
        {/* 示例1: 标准复制按钮 */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            示例1: 使用 platformAdapter 复制
          </Typography>
          <Button
            variant="contained"
            startIcon={<Copy size={18} />}
            onClick={handleCopy}
          >
            复制文本
          </Button>
        </Paper>

        {/* 示例2: 标准粘贴按钮 */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            示例2: 使用 platformAdapter 粘贴
          </Typography>
          <Button
            variant="contained"
            startIcon={<Copy size={18} />}
            onClick={handlePaste}
          >
            粘贴文本
          </Button>
        </Paper>

        {/* 示例3: 鸿蒙适配的复制按钮 */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            示例3: 使用鸿蒙专用组件
          </Typography>
          <HarmonyOSClipboardButton
            text="这是通过鸿蒙专用组件复制的文本"
            onSuccess={() => setMessage('✅ 复制成功（鸿蒙组件）')}
            onError={(err) => setMessage(`❌ 复制失败: ${err}`)}
            size="medium"
            tooltip="复制测试文本"
          />
        </Paper>

        {/* 示例4: 相机功能 */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            示例4: 使用相机服务
          </Typography>
          <Button
            variant="contained"
            startIcon={<Camera size={18} />}
            onClick={handleTakePicture}
          >
            拍照
          </Button>
        </Paper>

        {/* 示例5: 文件选择 */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            示例5: 使用文件服务
          </Typography>
          <Button
            variant="contained"
            startIcon={<FileUp size={18} />}
            onClick={handlePickFile}
          >
            选择文件
          </Button>
        </Paper>

        {/* 示例6: 通知 */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            示例6: 使用通知服务
          </Typography>
          <Button
            variant="contained"
            startIcon={<Bell size={18} />}
            onClick={handleShowNotification}
          >
            发送通知
          </Button>
        </Paper>
      </Box>

      {/* 使用说明 */}
      <Paper elevation={2} sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          使用说明
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>所有功能都会自动处理鸿蒙权限</li>
            <li>首次使用时会弹出权限请求对话框</li>
            <li>权限被拒绝时会有友好的错误提示</li>
            <li>支持自动重试和降级方案</li>
            <li>可以在控制台查看详细的平台信息</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default HarmonyOSIntegrationExample;

