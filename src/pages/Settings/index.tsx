import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe as LanguageIcon,
  Bot as SmartToyIcon,
  Settings as SettingsIcon,
  Keyboard as KeyboardIcon,
  Database as StorageIcon,
  Mic as RecordVoiceOverIcon,
  Puzzle as ExtensionIcon,
  Info as InfoIcon,
  Palette as FormatColorFillIcon,
  Settings as SettingsApplicationsIcon,
  Sliders as TuneIcon,
  Wand2 as AutoFixHighIcon,
  GitBranch,
  MessageSquare as ForumIcon,
  BookOpen as MenuBookIcon,
  Folder as WorkspaceIcon,
  Database as DatabaseIcon,
} from 'lucide-react';
import {
  SafeAreaContainer,
  HeaderBar,
  Container,
  YStack,
  SettingGroup,
  SettingItem,
} from '../../components/settings/SettingComponents';
import useScrollPosition from '../../hooks/useScrollPosition';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-main', {
    autoRestore: true,
    restoreDelay: 100
  });

  const handleBack = () => {
    // 返回聊天界面时清理所有设置页面的滚动位置缓存
    // 使用动态清理方式，自动支持所有以 scroll:settings- 开头的键
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('scroll:settings-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('清理滚动位置缓存失败:', error);
    }

    navigate('/chat');
  };

  // 右滑返回手势
  const { swipeHandlers } = useSwipeGesture({
    onSwipeRight: handleBack,
    threshold: 100, // 滑动距离阈值
    velocityThreshold: 0.3, // 速度阈值
    enabled: true,
    enableEdgeDetection: true, // 启用边缘检测，只有从左边缘开始滑动才触发
    edgeThreshold: 50 // 左边缘50px内开始滑动才有效
  });

  // 功能开放状态配置
  const FEATURE_FLAGS = {
    shortcuts: false,  // 快捷键设置功能未开放
    features: false,   // 功能设置未开放
  };

  const navigateTo = (path: string) => {
    // 从路径中提取功能ID
    const featureId = path.split('/').pop();
    // 检查功能是否开放
    if (featureId && FEATURE_FLAGS[featureId as keyof typeof FEATURE_FLAGS] === false) {
      return; // 功能未开放，不进行导航
    }
    navigate(path);
  };

  // 定义设置菜单组
  const settingsGroups = [
    {
      title: '基本设置',
      items: [
        {
          id: 'appearance',
          title: '外观',
          description: '主题、字体大小和语言设置',
          icon: <FormatColorFillIcon size={24} />,
          path: '/settings/appearance',
          onClick: () => navigateTo('/settings/appearance'),
        },
        {
          id: 'behavior',
          title: '行为',
          description: '消息发送和通知设置',
          icon: <SettingsApplicationsIcon size={24} />,
          path: '/settings/behavior',
          onClick: () => navigateTo('/settings/behavior'),
        },
      ],
    },
    {
      title: '模型服务',
      items: [
        {
          id: 'default-model',
          title: '配置模型',
          description: '管理AI模型和API密钥',
          icon: <SmartToyIcon size={24} />,
          path: '/settings/default-model',
          onClick: () => navigateTo('/settings/default-model'),
        },
        {
          id: 'topic-naming-settings',
          title: '话题命名设置',
          description: '配置话题自动命名功能',
          icon: <TuneIcon size={24} />,
          path: '/settings/topic-naming-settings',
          onClick: () => navigateTo('/settings/topic-naming-settings'),
        },
        {
          id: 'agent-prompts',
          title: '智能体提示词集合',
          description: '浏览和使用内置的丰富提示词模板',
          icon: <AutoFixHighIcon size={24} />,
          path: '/settings/agent-prompts',
          onClick: () => navigateTo('/settings/agent-prompts'),
        },
        {
          id: 'ai-debate',
          title: 'AI辩论设置',
          description: '配置AI互相辩论讨论功能',
          icon: <ForumIcon size={24} />,
          path: '/settings/ai-debate',
          onClick: () => navigateTo('/settings/ai-debate'),
        },
        {
          id: 'model-combo',
          title: '模型组合',
          description: '创建和管理多模型组合',
          icon: <GitBranch size={24} />,
          path: '/settings/model-combo',
          onClick: () => navigateTo('/settings/model-combo'),
        },
        {
          id: 'web-search',
          title: '网络搜索',
          description: '配置网络搜索和相关服务',
          icon: <LanguageIcon size={24} />,
          path: '/settings/web-search',
          onClick: () => navigateTo('/settings/web-search'),
        },
        {
          id: 'mcp-server',
          title: 'MCP 服务器',
          description: '高级服务器配置',
          icon: <SettingsIcon size={24} />,
          path: '/settings/mcp-server',
          onClick: () => navigateTo('/settings/mcp-server'),
        },
      ],
    },
    {
      title: '快捷方式',
      items: [
        {
          id: 'shortcuts',
          title: '快捷助手',
          description: '自定义键盘快捷键',
          icon: <KeyboardIcon size={24} />,
          path: '/settings/shortcuts',
          onClick: () => navigateTo('/settings/shortcuts'),
          disabled: FEATURE_FLAGS.shortcuts === false,
        },
        {
          id: 'quick-phrases',
          title: '快捷短语',
          description: '创建常用短语模板',
          icon: <KeyboardIcon size={24} />,
          path: '/settings/quick-phrases',
          onClick: () => navigateTo('/settings/quick-phrases'),
        },
      ],
    },
    {
      title: '其他设置',
      items: [
        {
          id: 'workspace-settings',
          title: '工作区管理',
          description: '创建和管理文件工作区',
          icon: <WorkspaceIcon size={24} />,
          path: '/settings/workspace',
          onClick: () => navigateTo('/settings/workspace'),
        },
        {
          id: 'knowledge-settings',
          title: '知识库设置',
          description: '管理知识库配置和嵌入模型',
          icon: <MenuBookIcon size={24} />,
          path: '/settings/knowledge',
          onClick: () => navigateTo('/settings/knowledge'),
        },
        {
          id: 'data-settings',
          title: '数据设置',
          description: '管理数据存储和隐私选项',
          icon: <StorageIcon size={24} />,
          path: '/settings/data',
          onClick: () => navigateTo('/settings/data'),
        },
        {
          id: 'notion-settings',
          title: 'Notion 集成',
          description: '配置Notion数据库导出设置',
          icon: <DatabaseIcon size={24} />,
          path: '/settings/notion',
          onClick: () => navigateTo('/settings/notion'),
        },
        {
          id: 'voice-settings',
          title: '语音功能',
          description: '语音识别和文本转语音设置',
          icon: <RecordVoiceOverIcon size={24} />,
          path: '/settings/voice',
          onClick: () => navigateTo('/settings/voice'),
        },
        {
          id: 'features',
          title: '功能模块',
          description: '启用或禁用应用功能',
          icon: <ExtensionIcon size={24} />,
          path: '/settings/features',
          onClick: () => navigateTo('/settings/features'),
          disabled: FEATURE_FLAGS.features === false,
        },
        {
          id: 'about',
          title: '关于我们',
          description: '应用信息和技术支持',
          icon: <InfoIcon size={24} />,
          path: '/settings/about',
          onClick: () => navigateTo('/settings/about'),
        },
      ],
    },
  ];

  return (
    <SafeAreaContainer {...swipeHandlers}>
      <HeaderBar title="设置" onBackPress={handleBack} />
      <Container
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <YStack sx={{ gap: 3 }}>
          {settingsGroups.map((group, index) => (
            <SettingGroup key={index} title={group.title}>
              {group.items.map((item) => (
                <SettingItem
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  showArrow={true}
                />
              ))}
            </SettingGroup>
          ))}
        </YStack>
      </Container>
    </SafeAreaContainer>
  );
};

export default SettingsPage;