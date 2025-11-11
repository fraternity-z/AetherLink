/**
 * 简单的 SolidJS 计数器组件
 * 用于验证 SolidJS 集成是否正常工作
 */
import { createSignal } from 'solid-js';

export default function SimpleCounter() {
  const [count, setCount] = createSignal(0);

  return (
    <div style={{
      padding: '40px',
      'text-align': 'center',
      background: '#1a1a1a',
      color: '#fff',
      'min-height': '100vh',
      'font-family': 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{ color: '#00d4ff', 'margin-bottom': '20px' }}>
        ⚡ SolidJS 集成成功！
      </h1>
      <p style={{ 'font-size': '18px', 'margin-bottom': '30px' }}>
        这是一个运行在 Capacitor + React 应用中的 SolidJS 组件
      </p>
      <div style={{
        background: '#2a2a2a',
        padding: '30px',
        'border-radius': '12px',
        'max-width': '400px',
        margin: '0 auto',
      }}>
        <div style={{ 'font-size': '48px', 'margin-bottom': '20px' }}>
          {count()}
        </div>
        <button
          onClick={() => setCount(count() + 1)}
          style={{
            padding: '12px 24px',
            'font-size': '16px',
            background: '#00d4ff',
            color: '#000',
            border: 'none',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-weight': '600',
            'margin-right': '10px',
          }}
        >
          增加
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '12px 24px',
            'font-size': '16px',
            background: '#ff4444',
            color: '#fff',
            border: 'none',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-weight': '600',
          }}
        >
          重置
        </button>
      </div>
      <div style={{
        'margin-top': '40px',
        padding: '20px',
        background: '#2a2a2a',
        'border-radius': '8px',
        'max-width': '600px',
        margin: '40px auto 0',
      }}>
        <h3 style={{ color: '#00ff88', 'margin-bottom': '10px' }}>
          ✅ 验证成功
        </h3>
        <p style={{ 'line-height': '1.6' }}>
          如果你能看到这个页面并且计数器可以点击，说明 React + SolidJS 混合架构已经成功集成！
        </p>
        <p style={{ 'margin-top': '10px', color: '#999', 'font-size': '14px' }}>
          SolidJS 使用细粒度响应式系统，点击按钮时只更新数字 DOM 节点，不会重新渲染整个组件。
        </p>
      </div>
    </div>
  );
}

