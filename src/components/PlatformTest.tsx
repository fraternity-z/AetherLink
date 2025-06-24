/**
 * 平台测试组件
 * 用于测试和展示跨平台功能
 */

import React, { useState } from 'react';
import { 
  usePlatformInfo, 
  useDeviceInfo, 
  useNotifications, 
  useClipboard, 
  useWindowControls,
  useFileSystem 
} from '../hooks/usePlatform';

const PlatformTest: React.FC = () => {
  const { platformInfo, isMobile, isDesktop, isWeb, isTauri, isCapacitor } = usePlatformInfo();
  const { deviceInfo, batteryInfo, loading: deviceLoading } = useDeviceInfo();
  const { showNotification, permissionGranted } = useNotifications();
  const { writeText, readText } = useClipboard();
  const { minimize, maximize, close, setTitle, available: windowControlsAvailable } = useWindowControls();
  const { writeFile, readFile, fileExists } = useFileSystem();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [clipboardText, setClipboardText] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('test.txt');

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testNotification = async () => {
    try {
      await showNotification('测试通知', '这是一个来自 AetherLink 的测试通知');
      addResult('✅ 通知发送成功');
    } catch (error) {
      addResult(`❌ 通知发送失败: ${error}`);
    }
  };

  const testClipboard = async () => {
    try {
      await writeText(clipboardText || '测试剪贴板内容');
      const text = await readText();
      addResult(`✅ 剪贴板测试成功: ${text}`);
    } catch (error) {
      addResult(`❌ 剪贴板测试失败: ${error}`);
    }
  };

  const testFileSystem = async () => {
    try {
      const content = fileContent || '这是测试文件内容';
      await writeFile(fileName, content);
      
      const exists = await fileExists(fileName);
      if (exists) {
        const readContent = await readFile(fileName);
        addResult(`✅ 文件系统测试成功: 写入并读取了 "${readContent}"`);
      } else {
        addResult('❌ 文件写入后不存在');
      }
    } catch (error) {
      addResult(`❌ 文件系统测试失败: ${error}`);
    }
  };

  const testWindowControls = async () => {
    if (!windowControlsAvailable) {
      addResult('❌ 窗口控制不可用 (仅桌面端支持)');
      return;
    }

    try {
      await setTitle('AetherLink - 测试窗口标题');
      addResult('✅ 窗口标题设置成功');
    } catch (error) {
      addResult(`❌ 窗口控制测试失败: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">平台适配器测试</h1>
      
      {/* 平台信息 */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">平台信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>平台类型:</strong> {platformInfo?.type}</p>
            <p><strong>是否移动端:</strong> {isMobile ? '是' : '否'}</p>
            <p><strong>是否桌面端:</strong> {isDesktop ? '是' : '否'}</p>
            <p><strong>是否Web端:</strong> {isWeb ? '是' : '否'}</p>
          </div>
          <div>
            <p><strong>是否Tauri:</strong> {isTauri ? '是' : '否'}</p>
            <p><strong>是否Capacitor:</strong> {isCapacitor ? '是' : '否'}</p>
            <p><strong>用户代理:</strong> {platformInfo?.userAgent.substring(0, 50)}...</p>
          </div>
        </div>
      </div>

      {/* 设备信息 */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">设备信息</h2>
        {deviceLoading ? (
          <p>加载中...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>平台:</strong> {deviceInfo?.platform}</p>
              <p><strong>型号:</strong> {deviceInfo?.model}</p>
              <p><strong>操作系统:</strong> {deviceInfo?.operatingSystem}</p>
            </div>
            <div>
              <p><strong>系统版本:</strong> {deviceInfo?.osVersion}</p>
              <p><strong>制造商:</strong> {deviceInfo?.manufacturer}</p>
              {batteryInfo && (
                <p><strong>电池:</strong> {Math.round(batteryInfo.batteryLevel * 100)}% 
                   {batteryInfo.isCharging ? ' (充电中)' : ''}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 功能测试 */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">功能测试</h2>
        
        <div className="space-y-4">
          {/* 通知测试 */}
          <div className="flex items-center gap-4">
            <button
              onClick={testNotification}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!permissionGranted}
            >
              测试通知
            </button>
            <span className="text-sm text-gray-600">
              {permissionGranted ? '✅ 通知权限已授予' : '❌ 通知权限未授予'}
            </span>
          </div>

          {/* 剪贴板测试 */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder="输入要复制的文本"
              className="px-3 py-2 border rounded flex-1 max-w-xs"
            />
            <button
              onClick={testClipboard}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              测试剪贴板
            </button>
          </div>

          {/* 文件系统测试 */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="文件名"
              className="px-3 py-2 border rounded w-32"
            />
            <input
              type="text"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="文件内容"
              className="px-3 py-2 border rounded flex-1 max-w-xs"
            />
            <button
              onClick={testFileSystem}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              测试文件系统
            </button>
          </div>

          {/* 窗口控制测试 */}
          {windowControlsAvailable && (
            <div className="flex items-center gap-4">
              <button
                onClick={testWindowControls}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                测试窗口控制
              </button>
              <button
                onClick={minimize}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                最小化
              </button>
              <button
                onClick={maximize}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                最大化
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 测试结果 */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">测试结果</h2>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p>暂无测试结果...</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))
          )}
        </div>
        <button
          onClick={() => setTestResults([])}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          清空结果
        </button>
      </div>
    </div>
  );
};

export default PlatformTest;
