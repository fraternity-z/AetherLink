/**
 * Agentic File Tracker 初始化
 * 在 store 加载后订阅事件，将文件修改同步到 Redux store
 */

import store from '../store';
import { 
  addFileChange, 
  setAgenticMode, 
  setCurrentTopicId 
} from '../store/slices/agenticFilesSlice';
import { agenticFileTracker } from './AgenticFileTracker';

/**
 * 初始化 Agentic 文件跟踪器与 Redux store 的连接
 */
export function initAgenticFileTracker(): void {
  // 订阅 Agentic 模式变化
  agenticFileTracker.onAgenticModeChange((enabled, topicId) => {
    console.log('[AgenticFileTrackerInit] Agentic 模式变化:', enabled, topicId);
    store.dispatch(setAgenticMode(enabled));
    if (topicId) {
      store.dispatch(setCurrentTopicId(topicId));
    }
  });

  // 订阅文件修改事件
  agenticFileTracker.onFileChange((change) => {
    console.log('[AgenticFileTrackerInit] 收到文件修改事件:', change.path, change.operation);
    store.dispatch(addFileChange(change));
  });

  console.log('[AgenticFileTrackerInit] 已初始化，监听器已注册');
}
