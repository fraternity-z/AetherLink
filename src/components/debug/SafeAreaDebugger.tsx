import { useEffect, useState } from 'react';
import { safeAreaService, type SafeAreaInsets } from '../../shared/services/SafeAreaService';

/**
 * 安全区域调试组件
 * 用于可视化显示安全区域范围
 * 
 * 使用方法：
 * 1. 在控制台执行: document.body.setAttribute('data-debug-safe-area', 'true')
 * 2. 或在App组件中添加 <SafeAreaDebugger />
 */
export const SafeAreaDebugger = () => {
  const [insets, setInsets] = useState<SafeAreaInsets | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 获取初始安全区域
    if (safeAreaService.isReady()) {
      setInsets(safeAreaService.getCurrentInsets());
    }

    // 监听安全区域变化
    const removeListener = safeAreaService.addListener((newInsets) => {
      setInsets(newInsets);
    });

    // 检查是否启用调试模式
    const checkDebugMode = () => {
      const debugAttr = document.body.getAttribute('data-debug-safe-area');
      setShow(debugAttr === 'true' || document.body.classList.contains('debug-mode'));
    };

    checkDebugMode();

    // 监听属性变化
    const observer = new MutationObserver(checkDebugMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-debug-safe-area', 'class'] });

    return () => {
      removeListener();
      observer.disconnect();
    };
  }, []);

  if (!show || !insets) return null;

  return (
    <>
      <div 
        className="debug-safe-area"
        data-top={`${insets.top}px`}
        data-bottom={`${insets.bottom}px`}
      />
      <div style={{
        position: 'fixed',
        bottom: '50%',
        left: '50%',
        transform: 'translate(-50%, 50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10000,
        pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Safe Area (Rikkahub Style)</div>
        <div>Top: {insets.top}px</div>
        <div>Bottom: {insets.bottom}px</div>
        <div>Left: {insets.left}px</div>
        <div>Right: {insets.right}px</div>
        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
          Source: CSS env(safe-area-inset-*)
        </div>
      </div>
    </>
  );
};

export default SafeAreaDebugger;
