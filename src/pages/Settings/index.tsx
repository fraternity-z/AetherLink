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
import { useTranslation } from '../../i18n';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      console.error(t('settings.scrollCacheError'), error);
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
      title: t('settings.groups.basic'),
      items: [
        {
          id: 'appearance',
          title: t('settings.items.appearance.title'),
          description: t('settings.items.appearance.description'),
          icon: <FormatColorFillIcon size={24} />,
          path: '/settings/appearance',
          onClick: () => navigateTo('/settings/appearance'),
        },
        {
          id: 'behavior',
          title: t('settings.items.behavior.title'),
          description: t('settings.items.behavior.description'),
          icon: <SettingsApplicationsIcon size={24} />,
          path: '/settings/behavior',
          onClick: () => navigateTo('/settings/behavior'),
        },
      ],
    },
    {
      title: t('settings.groups.modelService'),
      items: [
        {
          id: 'default-model',
          title: t('settings.items.defaultModel.title'),
          description: t('settings.items.defaultModel.description'),
          icon: <SmartToyIcon size={24} />,
          path: '/settings/default-model',
          onClick: () => navigateTo('/settings/default-model'),
        },
        {
          id: 'topic-naming-settings',
          title: t('settings.items.topicNaming.title'),
          description: t('settings.items.topicNaming.description'),
          icon: <TuneIcon size={24} />,
          path: '/settings/topic-naming-settings',
          onClick: () => navigateTo('/settings/topic-naming-settings'),
        },
        {
          id: 'agent-prompts',
          title: t('settings.items.agentPrompts.title'),
          description: t('settings.items.agentPrompts.description'),
          icon: <AutoFixHighIcon size={24} />,
          path: '/settings/agent-prompts',
          onClick: () => navigateTo('/settings/agent-prompts'),
        },
        {
          id: 'ai-debate',
          title: t('settings.items.aiDebate.title'),
          description: t('settings.items.aiDebate.description'),
          icon: <ForumIcon size={24} />,
          path: '/settings/ai-debate',
          onClick: () => navigateTo('/settings/ai-debate'),
        },
        {
          id: 'model-combo',
          title: t('settings.items.modelCombo.title'),
          description: t('settings.items.modelCombo.description'),
          icon: <GitBranch size={24} />,
          path: '/settings/model-combo',
          onClick: () => navigateTo('/settings/model-combo'),
        },
        {
          id: 'web-search',
          title: t('settings.items.webSearch.title'),
          description: t('settings.items.webSearch.description'),
          icon: <LanguageIcon size={24} />,
          path: '/settings/web-search',
          onClick: () => navigateTo('/settings/web-search'),
        },
        {
          id: 'mcp-server',
          title: t('settings.items.mcpServer.title'),
          description: t('settings.items.mcpServer.description'),
          icon: <SettingsIcon size={24} />,
          path: '/settings/mcp-server',
          onClick: () => navigateTo('/settings/mcp-server'),
        },
      ],
    },
    {
      title: t('settings.groups.shortcuts'),
      items: [
        {
          id: 'shortcuts',
          title: t('settings.items.shortcuts.title'),
          description: t('settings.items.shortcuts.description'),
          icon: <KeyboardIcon size={24} />,
          path: '/settings/shortcuts',
          onClick: () => navigateTo('/settings/shortcuts'),
          disabled: FEATURE_FLAGS.shortcuts === false,
        },
        {
          id: 'quick-phrases',
          title: t('settings.items.quickPhrases.title'),
          description: t('settings.items.quickPhrases.description'),
          icon: <KeyboardIcon size={24} />,
          path: '/settings/quick-phrases',
          onClick: () => navigateTo('/settings/quick-phrases'),
        },
      ],
    },
    {
      title: t('settings.groups.other'),
      items: [
        {
          id: 'workspace-settings',
          title: t('settings.items.workspace.title'),
          description: t('settings.items.workspace.description'),
          icon: <WorkspaceIcon size={24} />,
          path: '/settings/workspace',
          onClick: () => navigateTo('/settings/workspace'),
        },
        {
          id: 'knowledge-settings',
          title: t('settings.items.knowledge.title'),
          description: t('settings.items.knowledge.description'),
          icon: <MenuBookIcon size={24} />,
          path: '/settings/knowledge',
          onClick: () => navigateTo('/settings/knowledge'),
        },
        {
          id: 'data-settings',
          title: t('settings.items.data.title'),
          description: t('settings.items.data.description'),
          icon: <StorageIcon size={24} />,
          path: '/settings/data',
          onClick: () => navigateTo('/settings/data'),
        },
        {
          id: 'notion-settings',
          title: t('settings.items.notion.title'),
          description: t('settings.items.notion.description'),
          icon: <DatabaseIcon size={24} />,
          path: '/settings/notion',
          onClick: () => navigateTo('/settings/notion'),
        },
        {
          id: 'voice-settings',
          title: t('settings.items.voice.title'),
          description: t('settings.items.voice.description'),
          icon: <RecordVoiceOverIcon size={24} />,
          path: '/settings/voice',
          onClick: () => navigateTo('/settings/voice'),
        },
        {
          id: 'features',
          title: t('settings.items.features.title'),
          description: t('settings.items.features.description'),
          icon: <ExtensionIcon size={24} />,
          path: '/settings/features',
          onClick: () => navigateTo('/settings/features'),
          disabled: FEATURE_FLAGS.features === false,
        },
        {
          id: 'about',
          title: t('settings.items.about.title'),
          description: t('settings.items.about.description'),
          icon: <InfoIcon size={24} />,
          path: '/settings/about',
          onClick: () => navigateTo('/settings/about'),
        },
      ],
    },
  ];

  return (
    <SafeAreaContainer {...swipeHandlers}>
      <HeaderBar title={t('settings.title')} onBackPress={handleBack} />
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