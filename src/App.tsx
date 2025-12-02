
// 🚀 全局 fetch 代理初始化 - 必须在最前面导入
// 这样可以在任何 SDK 使用 fetch 之前完成初始化
import { initGlobalFetchProxy } from './shared/utils/globalFetchProxy';

// 尽早初始化全局 fetch 代理（在 Tauri 环境中支持网络代理）
initGlobalFetchProxy();

import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { HashRouter } from 'react-router-dom';

import store, { persistor } from './shared/store';
import KnowledgeProvider from './components/KnowledgeManagement/KnowledgeProvider';
import { CodeStyleProvider } from './context/CodeStyleProvider';
import AppContent from './components/AppContent';
import LoggerService from './shared/services/LoggerService';
import { loadSettings } from './shared/store/settingsSlice';

// 初始化日志拦截器
LoggerService.log('INFO', '应用初始化');

// 🚀 性能优化：非阻塞式恢复 Redux 状态
// 在后台恢复状态，不阻塞渲染
persistor.persist();

// 在应用启动时加载设置（异步）
store.dispatch(loadSettings());

function App() {
  return (
    <Provider store={store}>
      <KnowledgeProvider>
        <CodeStyleProvider>
          <SnackbarProvider
            maxSnack={3}
            autoHideDuration={3000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <HashRouter>
              <AppContent />
            </HashRouter>
          </SnackbarProvider>
        </CodeStyleProvider>
      </KnowledgeProvider>
    </Provider>
  );
}

export default App;
