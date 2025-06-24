# AetherLink

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/1600822305/CS-LLM-house)

[![](https://img.shields.io/badge/License-AGPLv3-important.svg?style=plastic&logo=gnu)](https://www.gnu.org/licenses/agpl-3.0) [![](https://img.shields.io/badge/License-Commercial-blue.svg?style=plastic&logoColor=white&logo=telegram&color=blue)](mailto:1600822305@qq.com?subject=AetherLink%20Commercial%20License%20Inquiry)

## 项目概述

官方交流群Q群 点击链接加入群聊【AetherLink 官方群】：http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=V-b46WoBNLIM4oc34JMULwoyJ3hyrKac&authKey=q%2FSwCcxda4e55ygtwp3h9adQXhqBLZ9wJdvM0QxTjXQkbxAa2tHoraOGy2fiibyY&noverify=0&group_code=930126592

AetherLink移动应用是一个基于现代Web技术构建的跨平台AI助手应用。该应用支持与多种AI模型（如OpenAI、Google Gemini、Anthropic Claude、Grok、硅基流动、火山方舟等）的交互，提供流畅的对话体验，并支持Android平台部署。应用采用React、TypeScript和Capacitor框架开发，具有高度可定制的模型配置、多主题聊天管理、AI思考过程可视化、语音合成、语音识别、MCP工具支持、知识库管理等特色功能。

## 技术栈

- **前端框架**: React 19、Material UI 7
- **构建工具**: Vite 6、SWC编译器
- **编程语言**: TypeScript 5.8
- **移动框架**: Capacitor 7
- **状态管理**: Redux & Redux Toolkit 2.8
- **API集成**: OpenAI、Google Gemini、Anthropic Claude、Grok、硅基流动、火山方舟等AI模型
- **存储**: IndexedDB (Dexie)、localStorage
- **样式**: MUI组件 + Tailwind CSS + 自定义CSS
- **语音技术**: 硅基流动TTS API、OpenAI TTS、Azure TTS、Web Speech API、Capacitor语音识别
- **代码高亮**: Shiki语法高亮引擎
- **工具支持**: MCP (Model Context Protocol) 工具集成

## 系统要求

- **Node.js**: v22.x 或更高
- **npm**: v10.x 或更高
- **Android Studio**: 用于Android平台开发
- **JDK**: Java 11 或更高版本
- **Vite**: 6.x 或更高版本
- **Capacitor CLI**: 7.x 或更高版本
- **React**: 19.x
- **TypeScript**: 5.8.x


## 安装指南

1. **克隆仓库**

```bash
git clone https://github.com/1600822305/AetherLink.git
cd AetherLink
```

2. **安装依赖**

```bash
npm install
```

3. **初始化Capacitor**

```bash
npx cap init
```

## 开发指南

### 启动开发服务器

```bash
npm run dev
```

### 构建选项

```bash
npm run build              # 快速构建（推荐）
npm run build:ultra        # 完整构建（包含类型检查）
```

### 移动端开发

```bash
# 构建并同步到Android
npm run build
npx cap sync android
npx cap open android
```

### 主要功能

- **多模型AI对话**：支持OpenAI、Claude、Gemini、Grok等主流AI模型
- **语音交互**：语音识别输入 + TTS语音播放
- **移动端优化**：原生Android应用体验
- **知识库管理**：文档上传、智能检索
- **MCP工具集成**：扩展AI能力的工具生态
- **React架构**：现代化的React 19应用架构

## 构建与部署

### Android APK构建

```bash
# 在Android Studio中构建
npx cap open android
# 然后在Android Studio中: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

APK将保存在 `android/app/build/outputs/apk/debug/` 目录

## 许可证

AetherLink 采用**分层许可模式**，根据使用者规模提供不同的许可方案：

- **个人用户及8人以下团队**：适用 GNU Affero 通用公共许可证 v3.0 (AGPLv3)
- **8人以上的组织机构**：必须获取商业使用许可证

### 商业许可

如果您的组织超过8人，或需要规避AGPLv3的开源义务，请联系我们获取商业许可证：

📧 **商业授权联系**：1600822305@qq.com

详细许可条款请查看 [LICENSE](LICENSE) 文件。

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加一些功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个Pull Request

**注意**：所有代码贡献将被视为在AGPLv3许可证下提供。



## 特色功能

### 🤖 自动获取模型列表

AetherLink支持从各大AI提供商API自动获取可用模型列表：

- 支持OpenAI、Claude (Anthropic)、Gemini (Google)、Grok (xAI)、硅基流动和火山方舟等主流AI提供商
- 自动处理不同API格式和端点路径
- 智能适配自定义中转站API
- 提供优雅的回退机制，当API请求失败时使用预设模型列表
- 支持的API端点:
  - OpenAI: `/v1/models`
  - Claude: `/v1/models`
  - Gemini: `/v1beta/models`
  - Grok: `/v1/models`
  - 硅基流动: `/v1/models`
  - 火山方舟: `/api/v3/models`
  - 自定义中转站: 自动检测并适配

### 🎙️ 语音识别功能

AetherLink支持多种语音识别方案：

- **Capacitor语音识别**：移动端原生语音识别，支持实时转录
- **OpenAI Whisper**：高精度语音转文本，支持多语言
- **Web Speech API**：浏览器原生语音识别作为备选方案
- **智能提供商切换**：根据环境自动选择最佳识别方案
- **实时反馈**：支持部分结果显示和实时状态更新
- **按住说话**：直观的语音输入交互方式

### 🔊 增强语音合成

AetherLink提供多层级的语音合成解决方案：

- **Azure TTS**：微软Azure认知服务，支持SSML和高质量语音
- **OpenAI TTS**：OpenAI语音合成，支持流式和非流式输出
- **硅基流动TTS**：高质量中文语音合成
- **Web Speech API**：浏览器原生语音合成作为备选
- **智能降级**：自动尝试多种TTS服务，确保语音播放成功
- **语音控制**：播放/暂停、语速调整、语音选择等功能

### 🛠️ MCP工具支持

集成Model Context Protocol (MCP)工具生态：

- **Fetch工具**：支持网络请求和数据获取
- **跨平台兼容**：移动端使用原生HTTP，Web端使用代理
- **工具块渲染**：可视化工具执行结果
- **错误处理**：完善的错误处理和重试机制

### 📱 移动端优化

AetherLink针对移动设备进行了多项优化：

- **返回键智能处理**：根据当前页面上下文智能处理Android返回键行为
  - 在聊天和欢迎页面显示退出确认对话框
  - 在其他页面返回上一级页面
  - 防止意外退出应用
- **WebView版本检测**：自动检测WebView版本并提供升级建议
- **响应式布局**：自适应不同屏幕尺寸和方向
- **触摸优化**：针对触摸交互优化的UI元素和手势
- **性能优化**：减少不必要的渲染和计算，确保在移动设备上流畅运行
- **原生功能集成**：相机、文件系统、剪贴板等原生功能无缝集成

### 🎨 React架构

- **React主框架**：使用React 19作为主要UI框架
- **类型安全**：完整的TypeScript支持

### 📚 知识库管理

- **文档管理**：支持多种文档格式的上传和管理
- **智能检索**：基于AI的语义搜索和内容检索

### 💻 代码编辑器

- **语法高亮**：基于Shiki的高质量语法高亮
- **多语言支持**：支持主流编程语言

### 🧠 AI思考过程

- 支持显示AI的思考过程（主要支持Grok模型）
- 可视化思考时间和过程，改善用户体验

### 🛠️ 开发者工具

- 控制台日志查看
- 网络请求监控
- API请求和响应分析
## 项目结构

```
AetherLink/
├── android/                # Android平台相关代码和配置
│   ├── app/                # Android应用主要代码
│   │   ├── src/            # 源代码目录
│   │   │   ├── main/       # 主要代码
│   │   │   │   ├── assets/ # Web资源和配置文件
│   │   │   │   ├── java/   # Java代码
│   │   │   │   └── res/    # Android资源文件(布局、图标等)
│   │   │   └── test/       # 测试代码
│   │   └── build.gradle    # 应用级构建配置
│   ├── build.gradle        # 项目级构建配置
│   ├── capacitor.settings.gradle # Capacitor插件配置
│   └── variables.gradle    # 全局变量和版本配置
├── public/                 # 静态资源文件和公共资产
│   └── assets/             # 图标、图片等公共资源
├── src/                    # 源代码目录
│   ├── assets/             # 应用内图片、字体等资源
│   ├── components/         # 可复用UI组件
│   │   ├── AIDebateButton.tsx # AI辩论功能按钮组件
│   │   ├── AppInitializer.tsx # 应用初始化组件
│   │   ├── BackButtonHandler.tsx # Android返回键处理组件，管理返回键行为
│   │   ├── ChatInput.tsx   # 聊天输入框组件，处理消息输入和发送
│   │   ├── ChatToolbar.tsx # 聊天工具栏组件，提供聊天页面顶部操作
│   │   ├── CitationsList.tsx # 引用列表组件，显示消息引用
│   │   ├── CodeEditor/     # 代码编辑器组件目录
│   │   ├── CompactChatInput.tsx # 紧凑型聊天输入框
│   │   ├── DevTools/       # 开发者工具组件目录
│   │   ├── EnhancedToast.tsx # 增强型提示组件
│   │   ├── ExitConfirmDialog.tsx # 退出确认对话框，防止意外退出应用
│   │   ├── FilePreview.tsx # 文件预览组件
│   │   ├── ImageGeneration/ # 图像生成功能组件目录
│   │   ├── IntegratedFilePreview.tsx # 集成文件预览组件
│   │   ├── KnowledgeManagement/ # 知识库管理组件目录
│   │   ├── ModelManagementDialog.tsx # 模型管理对话框
│   │   ├── MultiModelSelector.tsx # 多模型选择器组件
│   │   ├── RouterWrapper.tsx # 路由包装组件，提供路由转换和动画
│   │   ├── SearchResultsCollapsible.tsx # 搜索结果折叠组件
│   │   ├── Sidebar/        # 侧边栏组件目录
│   │   ├── SystemPromptBubble.tsx # 系统提示气泡组件
│   │   ├── SystemPromptDialog.tsx # 系统提示对话框
│   │   ├── TTS/            # 语音合成组件目录
│   │   ├── ToolsSwitch.tsx # 工具开关组件
│   │   ├── TopicManagement/ # 话题管理组件，包含分组和拖拽功能
│   │   │   ├── AssistantTab.tsx # 助手标签页组件
│   │   │   ├── GroupComponents.tsx # 分组相关组件
│   │   │   ├── GroupDialog.tsx # 创建/编辑分组对话框
│   │   │   ├── Sidebar.tsx # 侧边栏主组件
│   │   │   ├── SidebarTabs.tsx # 侧边栏标签页组件
│   │   │   ├── TopicTab.tsx # 话题标签页组件
│   │   │   └── index.ts # 导出组件
│   │   ├── TopicStats/     # 话题统计组件目录
│   │   ├── UpdateNoticeDialog.tsx # 更新通知对话框
│   │   ├── UploadMenu.tsx  # 上传菜单组件
│   │   ├── UrlScraperStatus.tsx # URL抓取状态组件
│   │   ├── VoiceRecognition/ # 语音识别组件目录

│   │   ├── WebSearchProviderSelector.tsx # 网络搜索提供商选择器
│   │   ├── chat/           # 聊天相关子组件
│   │   ├── common/         # 通用组件目录
│   │   ├── message/        # 消息相关子组件
│   │   │   ├── ThinkingProcess/ # AI思考过程展示组件
│   │   │   └── MessageActions/  # 消息操作按钮组件
│   │   ├── settings/       # 设置相关组件
│   │   │   └── ModelCard/  # 模型卡片组件，展示单个模型信息
│   │   └── test/           # 测试组件目录
│   ├── pages/              # 页面级组件
│   │   ├── ChatPage/       # 聊天主界面
│   │   │   ├── components/ # 聊天页面子组件
│   │   │   │   ├── ModelSelector.tsx # 模型选择器组件
│   │   │   │   └── ... # 其他聊天页面子组件
│   │   │   ├── hooks/      # 聊天页面自定义钩子
│   │   │   │   ├── useModelSelection.ts # 模型选择逻辑钩子
│   │   │   │   ├── useChatFeatures.ts # 聊天功能钩子
│   │   │   │   └── ... # 其他聊天页面钩子
│   │   │   └── index.tsx   # 聊天页面主组件
│   │   ├── DevToolsPage.tsx # 开发者调试工具页面，提供日志和API调试
│   │   ├── KnowledgeBase/  # 知识库管理页面目录
│   │   ├── Settings/       # 设置相关页面
│   │   │   ├── AppearanceSettings/ # 外观设置，主题和字体配置
│   │   │   ├── BehaviorSettings/   # 行为设置，如发送方式和通知
│   │   │   ├── DefaultModelSettings/ # 默认模型设置页面
│   │   │   ├── ModelProviderSettings/ # 模型提供商设置页面
│   │   │   ├── AddProviderPage/ # 添加提供商页面
│   │   │   ├── DataSettings/ # 数据管理设置，包括备份和恢复
│   │   │   ├── VoiceSettings/ # 语音设置，TTS和语音识别配置
│   │   │   ├── index.tsx   # 设置主页面
│   │   │   └── AboutPage/  # 关于页面，显示应用信息
│   │   ├── SettingsPage.tsx # 设置页面入口

│   │   └── WelcomePage.tsx # 欢迎/引导页面，首次使用时显示
│   ├── routes/             # 路由配置和导航逻辑
│   │   └── index.tsx       # 路由定义和配置
│   ├── shared/             # 共享代码和业务逻辑
│   │   ├── api/            # API接口封装
│   │   │   ├── anthropic/  # Anthropic Claude API集成
│   │   │   ├── google/     # Google Gemini API集成
│   │   │   ├── grok/       # Grok API集成
│   │   │   ├── openai/     # OpenAI API集成
│   │   │   ├── siliconflow/ # 硅基流动API集成
│   │   │   ├── volcengine/ # 火山方舟API集成
│   │   │   └── index.ts    # API统一入口和路由
│   │   ├── config/         # 配置文件目录
│   │   ├── constants/      # 常量定义目录
│   │   ├── data/           # 静态数据和预设配置
│   │   │   ├── models/     # 预设模型配置
│   │   │   └── presetModels.ts # 预设模型数据
│   │   ├── hooks/          # 自定义React Hooks
│   │   │   ├── useAppState/ # 应用状态管理Hook
│   │   │   ├── useModels/  # 模型管理Hook
│   │   │   └── ... # 其他自定义Hook
│   │   ├── middlewares/    # Redux中间件目录
│   │   ├── prompts/        # 提示词模板目录
│   │   ├── providers/      # 提供商相关代码目录
│   │   ├── services/       # 业务服务层
│   │   │   ├── APIService.ts # API服务，处理模型获取和消息发送
│   │   │   ├── AssistantService.ts # 助手服务，管理AI助手配置
│   │   │   ├── LoggerService.ts # 日志记录服务，统一日志管理
│   │   │   ├── SystemPromptService.ts # 系统提示词服务
│   │   │   ├── ThinkingService.ts # AI思考过程处理服务
│   │   │   ├── TopicService.ts # 话题管理服务
│   │   │   ├── TTSService.ts # 文本到语音转换服务
│   │   │   ├── VoiceRecognitionService.ts # 语音识别服务
│   │   │   ├── VersionService.ts # 版本管理服务
│   │   │   ├── ImageUploadService.ts # 图片上传服务，处理图片选择和压缩
│   │   │   ├── assistant/  # 助手相关服务目录
│   │   │   ├── mcpServers/ # MCP服务器集成目录

│   │   │   └── storageService.ts # 存储服务(IndexedDB/localStorage)
│   │   ├── store/          # Redux状态管理
│   │   │   ├── messagesSlice.ts # 消息状态管理
│   │   │   ├── settingsSlice.ts # 设置状态管理
│   │   │   ├── slices/     # 其他状态切片
│   │   │   │   ├── groupsSlice.ts # 分组状态管理
│   │   │   │   └── ... # 其他状态切片
│   │   │   └── index.ts    # Store配置和导出
│   │   ├── styles/         # 样式文件目录
│   │   ├── types/          # TypeScript类型定义
│   │   │   ├── Assistant.ts # 助手类型定义
│   │   │   └── index.ts    # 核心类型定义，包含消息、模型等类型
│   │   └── utils/          # 工具函数和辅助方法
│   │       ├── api/        # API相关工具函数
│   │       ├── format/     # 格式化工具函数
│   │       ├── storage/    # 本地存储工具函数
│   │       └── index.ts    # 通用工具函数，如ID生成、Token计算等
│   ├── App.tsx             # 应用根组件，包含主题和路由配置
│   ├── main.tsx            # 应用入口文件，渲染根组件
│   └── index.css           # 全局样式
├── capacitor.config.ts     # Capacitor移动应用配置，定义应用ID和插件设置
├── index.html              # 应用入口HTML文件
├── package.json            # 项目依赖和脚本配置
├── tsconfig.json           # TypeScript编译配置(引用配置)
├── tsconfig.app.json       # 应用代码TypeScript配置
├── tsconfig.node.json      # Node环境TypeScript配置
├── vite.config.ts          # Vite构建工具配置，包含优化和分包策略
├── tailwind.config.js      # Tailwind CSS配置
└── eslint.config.js        # ESLint代码规范配置
```