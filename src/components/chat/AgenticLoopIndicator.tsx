import React, { useEffect, useState } from 'react';
import { agenticLoopService, type AgenticLoopState } from '../../shared/services/AgenticLoopService';
import './AgenticLoopIndicator.css';

/**
 * Agentic 循环状态指示器
 * 显示当前迭代次数、状态和进度
 */
export const AgenticLoopIndicator: React.FC = () => {
  const [loopState, setLoopState] = useState<AgenticLoopState>(agenticLoopService.getState());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 监听循环状态变化
    const handleIterationStart = () => {
      setLoopState(agenticLoopService.getState());
      setIsVisible(true);
    };

    const handleIterationEnd = () => {
      setLoopState(agenticLoopService.getState());
    };

    const handleComplete = (state: AgenticLoopState) => {
      setLoopState(state);
      // 完成后显示2秒后隐藏
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    };

    // 订阅事件
    agenticLoopService.on('iteration:start', handleIterationStart);
    agenticLoopService.on('iteration:end', handleIterationEnd);
    agenticLoopService.on('complete', handleComplete);

    // 初始检查
    const currentState = agenticLoopService.getState();
    if (currentState.isAgenticMode && !currentState.isComplete) {
      setIsVisible(true);
      setLoopState(currentState);
    }

    return () => {
      agenticLoopService.off('iteration:start', handleIterationStart);
      agenticLoopService.off('iteration:end', handleIterationEnd);
      agenticLoopService.off('complete', handleComplete);
    };
  }, []);

  if (!isVisible || !loopState.isAgenticMode) {
    return null;
  }

  const config = agenticLoopService.getConfig();
  const progress = (loopState.currentIteration / config.maxIterations) * 100;

  // 根据状态显示不同的图标和颜色
  const getStatusIcon = () => {
    if (loopState.isComplete) {
      if (loopState.completionReason === 'attempt_completion') {
        return '✅';
      } else if (loopState.completionReason === 'consecutive_mistakes') {
        return '⚠️';
      } else if (loopState.completionReason === 'max_iterations_reached') {
        return '⏱️';
      } else if (loopState.completionReason === 'user_cancelled') {
        return '🚫';
      }
      return '✓';
    }
    return '🔄';
  };

  const getStatusText = () => {
    if (loopState.isComplete) {
      switch (loopState.completionReason) {
        case 'attempt_completion':
          return '任务完成';
        case 'consecutive_mistakes':
          return '错误过多，已停止';
        case 'max_iterations_reached':
          return '达到最大迭代次数';
        case 'user_cancelled':
          return '已取消';
        case 'error':
          return '发生错误';
        default:
          return '已完成';
      }
    }
    return 'AI 正在迭代处理...';
  };

  const getStatusClass = () => {
    if (loopState.isComplete) {
      if (loopState.completionReason === 'attempt_completion') {
        return 'agentic-loop-indicator--success';
      } else if (loopState.completionReason === 'consecutive_mistakes' || loopState.completionReason === 'error') {
        return 'agentic-loop-indicator--error';
      } else {
        return 'agentic-loop-indicator--warning';
      }
    }
    return 'agentic-loop-indicator--active';
  };

  return (
    <div className={`agentic-loop-indicator ${getStatusClass()}`}>
      <div className="agentic-loop-indicator__header">
        <span className="agentic-loop-indicator__icon">{getStatusIcon()}</span>
        <span className="agentic-loop-indicator__status">{getStatusText()}</span>
      </div>
      
      <div className="agentic-loop-indicator__stats">
        <div className="agentic-loop-indicator__stat">
          <span className="agentic-loop-indicator__stat-label">迭代次数</span>
          <span className="agentic-loop-indicator__stat-value">
            {loopState.currentIteration} / {config.maxIterations}
          </span>
        </div>
        
        {loopState.consecutiveMistakeCount > 0 && (
          <div className="agentic-loop-indicator__stat agentic-loop-indicator__stat--warning">
            <span className="agentic-loop-indicator__stat-label">连续错误</span>
            <span className="agentic-loop-indicator__stat-value">
              {loopState.consecutiveMistakeCount} / {config.consecutiveMistakeLimit}
            </span>
          </div>
        )}
      </div>

      <div className="agentic-loop-indicator__progress">
        <div 
          className="agentic-loop-indicator__progress-bar"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {loopState.isComplete && loopState.completionResult && (
        <div className="agentic-loop-indicator__result">
          <div className="agentic-loop-indicator__result-label">完成摘要：</div>
          <div className="agentic-loop-indicator__result-content">
            {loopState.completionResult}
          </div>
          {loopState.suggestedCommand && (
            <div className="agentic-loop-indicator__command">
              <span className="agentic-loop-indicator__command-label">建议执行：</span>
              <code className="agentic-loop-indicator__command-code">
                {loopState.suggestedCommand}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgenticLoopIndicator;
