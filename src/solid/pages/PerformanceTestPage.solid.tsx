/**
 * SolidJS 性能测试页面
 * 用于对比 React 和 SolidJS 在大量数据渲染时的性能差异
 */
import { createSignal, For, Show, onMount } from 'solid-js';
import type { Component } from 'solid-js';

interface Message {
  id: string;
  content: string;
  timestamp: number;
  sender: 'user' | 'ai';
}

interface PerformanceTestPageProps {
  initialMessages?: Message[];
}

const PerformanceTestPage: Component<PerformanceTestPageProps> = (props) => {
  const [messages, setMessages] = createSignal<Message[]>(props.initialMessages || []);
  const [isGenerating, setIsGenerating] = createSignal(false);
  const [renderTime, setRenderTime] = createSignal(0);
  const [messageCount, setMessageCount] = createSignal(1000);

  // 生成大量测试消息
  const generateMessages = (count: number) => {
    const startTime = performance.now();
    
    const newMessages: Message[] = [];
    for (let i = 0; i < count; i++) {
      newMessages.push({
        id: `msg-${i}-${Date.now()}`,
        content: `这是测试消息 #${i + 1}。SolidJS 使用细粒度响应式系统，只更新变化的 DOM 节点，而不是重新渲染整个组件树。`,
        timestamp: Date.now() - i * 1000,
        sender: i % 2 === 0 ? 'user' : 'ai',
      });
    }
    
    setMessages(newMessages);
    
    // 等待 DOM 更新完成
    requestAnimationFrame(() => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      setIsGenerating(false);
    });
  };

  // 添加单条消息（测试增量更新性能）
  const addMessage = () => {
    const newMessage: Message = {
      id: `msg-${messages().length}-${Date.now()}`,
      content: `新增消息 #${messages().length + 1}`,
      timestamp: Date.now(),
      sender: Math.random() > 0.5 ? 'user' : 'ai',
    };
    setMessages([...messages(), newMessage]);
  };

  // 批量添加消息（测试批量更新）
  const addBatchMessages = () => {
    const startTime = performance.now();
    const batch: Message[] = [];
    for (let i = 0; i < 100; i++) {
      batch.push({
        id: `batch-${i}-${Date.now()}`,
        content: `批量消息 #${i + 1}`,
        timestamp: Date.now(),
        sender: i % 2 === 0 ? 'user' : 'ai',
      });
    }
    setMessages([...messages(), ...batch]);
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      alert(`批量添加 100 条消息耗时: ${(endTime - startTime).toFixed(2)}ms`);
    });
  };

  // 模拟消息流式更新
  const streamMessage = () => {
    const messageId = `stream-${Date.now()}`;
    const fullContent = '这是一条流式消息，模拟 AI 逐字输出的场景。SolidJS 的细粒度更新在这种场景下性能优势明显。';
    let currentLength = 0;

    const newMessage: Message = {
      id: messageId,
      content: '',
      timestamp: Date.now(),
      sender: 'ai',
    };
    
    setMessages([...messages(), newMessage]);

    const interval = setInterval(() => {
      currentLength += 3;
      if (currentLength >= fullContent.length) {
        currentLength = fullContent.length;
        clearInterval(interval);
      }

      setMessages(msgs => 
        msgs.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: fullContent.slice(0, currentLength) }
            : msg
        )
      );
    }, 50);
  };

  // 清空消息
  const clearMessages = () => {
    setMessages([]);
    setRenderTime(0);
  };

  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#1a1a1a',
      color: '#ffffff',
      padding: '20px',
      'font-family': 'system-ui, -apple-system, sans-serif',
    }}>
      {/* 头部控制面板 */}
      <div style={{
        background: '#2a2a2a',
        padding: '20px',
        'border-radius': '12px',
        'margin-bottom': '20px',
        border: '1px solid #3a3a3a',
      }}>
        <h1 style={{ margin: '0 0 16px 0', color: '#00d4ff' }}>
          ⚡ SolidJS 性能测试页面
        </h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          'flex-wrap': 'wrap',
          'align-items': 'center',
          'margin-bottom': '16px',
        }}>
          <input
            type="number"
            value={messageCount()}
            onInput={(e) => setMessageCount(parseInt(e.currentTarget.value) || 1000)}
            style={{
              padding: '8px 12px',
              'border-radius': '6px',
              border: '1px solid #3a3a3a',
              background: '#1a1a1a',
              color: '#ffffff',
              width: '120px',
            }}
            placeholder="消息数量"
          />
          
          <button
            onClick={() => {
              setIsGenerating(true);
              setTimeout(() => generateMessages(messageCount()), 100);
            }}
            disabled={isGenerating()}
            style={{
              padding: '8px 16px',
              'border-radius': '6px',
              border: 'none',
              background: '#00d4ff',
              color: '#000',
              cursor: isGenerating() ? 'not-allowed' : 'pointer',
              'font-weight': '600',
              opacity: isGenerating() ? 0.5 : 1,
            }}
          >
            {isGenerating() ? '生成中...' : `生成 ${messageCount()} 条消息`}
          </button>

          <button
            onClick={addMessage}
            style={{
              padding: '8px 16px',
              'border-radius': '6px',
              border: '1px solid #3a3a3a',
              background: '#2a2a2a',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            添加 1 条
          </button>

          <button
            onClick={addBatchMessages}
            style={{
              padding: '8px 16px',
              'border-radius': '6px',
              border: '1px solid #3a3a3a',
              background: '#2a2a2a',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            批量添加 100 条
          </button>

          <button
            onClick={streamMessage}
            style={{
              padding: '8px 16px',
              'border-radius': '6px',
              border: '1px solid #3a3a3a',
              background: '#2a2a2a',
              color: '#00ff88',
              cursor: 'pointer',
            }}
          >
            流式消息模拟
          </button>

          <button
            onClick={clearMessages}
            style={{
              padding: '8px 16px',
              'border-radius': '6px',
              border: '1px solid #ff4444',
              background: 'transparent',
              color: '#ff4444',
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>

        {/* 性能指标 */}
        <div style={{
          display: 'flex',
          gap: '20px',
          'font-size': '14px',
        }}>
          <div>
            <span style={{ color: '#999' }}>消息总数: </span>
            <span style={{ color: '#00ff88', 'font-weight': '600' }}>
              {messages().length}
            </span>
          </div>
          <Show when={renderTime() > 0}>
            <div>
              <span style={{ color: '#999' }}>渲染耗时: </span>
              <span style={{ color: '#ffaa00', 'font-weight': '600' }}>
                {renderTime().toFixed(2)}ms
              </span>
            </div>
          </Show>
        </div>
      </div>

      {/* 消息列表 */}
      <div style={{
        flex: 1,
        'overflow-y': 'auto',
        background: '#0a0a0a',
        'border-radius': '12px',
        padding: '16px',
        border: '1px solid #3a3a3a',
      }}>
        <Show 
          when={messages().length > 0}
          fallback={
            <div style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              height: '100%',
              color: '#666',
            }}>
              点击上方按钮生成测试消息
            </div>
          }
        >
          <For each={messages()}>
            {(message) => (
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  'margin-bottom': '12px',
                  padding: '12px',
                  'border-radius': '8px',
                  background: message.sender === 'user' ? '#1a3a5a' : '#2a2a2a',
                  border: `1px solid ${message.sender === 'user' ? '#2a4a6a' : '#3a3a3a'}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  'margin-bottom': '8px',
                  'font-size': '12px',
                  color: '#999',
                }}>
                  <span style={{ 'font-weight': '600' }}>
                    {message.sender === 'user' ? '👤 用户' : '🤖 AI'}
                  </span>
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ 'line-height': '1.6' }}>
                  {message.content}
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* 底部信息 */}
      <div style={{
        'margin-top': '16px',
        'text-align': 'center',
        'font-size': '12px',
        color: '#666',
      }}>
        💡 提示：在 Chrome DevTools Performance 面板中录制，对比 React 和 SolidJS 的性能差异
      </div>
    </div>
  );
};

export default PerformanceTestPage;

