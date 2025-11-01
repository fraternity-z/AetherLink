# Cherry Studio 数据设置 UI 风格总结

## 概述

Cherry Studio 项目中的数据设置页面采用了分组卡片式设计，使用自定义组件系统和 Tailwind CSS 类名，具有清晰的视觉层次和良好的深色模式支持。

## 核心组件结构

### 1. 页面布局层次

```
SafeAreaContainer (根容器)
  └─ HeaderBar (标题栏)
  └─ YStack (主内容容器, gap-6)
      └─ Container (内容包装器, p-4 gap-5)
          └─ YStack (设置组容器, gap-6)
              └─ GroupContainer (分组容器)
                  ├─ GroupTitle (分组标题)
                  └─ Group (卡片容器)
                      └─ SettingItem (设置项)
```

### 2. 关键组件说明

#### SafeAreaContainer
- 作用：安全区域容器，确保内容不被系统UI遮挡
- 样式：`flex: 1`

#### HeaderBar
- 作用：页面标题栏
- 功能：显示页面标题，支持返回导航

#### Container
- 作用：内容包装器
- 样式：
  - `flex-1`
  - `p-4` (padding)
  - `gap-5` (间距)
  - `bg-transparent` (透明背景)

#### GroupContainer
- 结构：
  ```tsx
  <YStack className="gap-2">
    {title.trim() !== '' && <GroupTitle>{title}</GroupTitle>}
    <Group>{children}</Group>
  </YStack>
  ```
- 特点：
  - 分组标题为空时不显示标题
  - 分组间距为 `gap-2`

#### GroupTitle
- 样式：
  - `font-bold` (粗体)
  - `opacity-70` (70% 透明度)
  - `pl-3` (左侧内边距)

#### Group (卡片容器)
- 样式：
  - `rounded-xl` (大圆角)
  - `bg-ui-card-background` (浅色背景)
  - `dark:bg-ui-card-background-dark` (深色背景)
  - `overflow-hidden` (溢出隐藏)

#### PressableRow (设置项)
- 结构：
  ```tsx
  <TouchableOpacity>
    <XStack className="justify-between items-center py-[14px] px-4">
      {children}
    </XStack>
  </TouchableOpacity>
  ```
- 特点：
  - 可点击的行
  - 垂直内边距：`py-[14px]`
  - 水平内边距：`px-4`
  - 内容两端对齐

#### SettingItem (设置项内容)
- 结构：
  ```tsx
  <PressableRow>
    <XStack className="items-center gap-3">
      {icon} {/* 24px 图标 */}
      <YStack>
        <Text>{title}</Text>
        {subtitle && <Text className="text-sm">{subtitle}</Text>}
      </YStack>
    </XStack>
    {screen && <RowRightArrow />}
  </PressableRow>
  ```
- 特点：
  - 左侧：图标 + 标题（可带副标题）
  - 右侧：如果有导航目标，显示右箭头
  - 支持 `danger` 样式（红色文字）
  - 支持 `disabled` 状态（50% 透明度）

#### RowRightArrow
- 样式：
  - `ChevronRight` 图标
  - 尺寸：20px
  - `text-text-secondary` (次要文本颜色)
  - `opacity-90` (90% 透明度)
  - `-mr-1` (右侧负边距)

## 数据设置页面示例

### DataSettingsScreen.tsx
```tsx
export default function DataSettingsScreen() {
  const { t } = useTranslation()

  const settingsItems: SettingGroupConfig[] = [
    {
      title: ' ',
      items: [
        {
          title: t('settings.data.basic_title'),
          screen: 'BasicDataSettingsScreen',
          icon: <FolderSearch2 size={24} />
        },
        {
          title: t('settings.data.landrop.title'),
          screen: 'LandropSettingsScreen',
          icon: <Wifi size={24} />
        }
      ]
    }
  ]

  return (
    <SafeAreaContainer style={{ flex: 1 }}>
      <HeaderBar title={t('settings.data.title')} />
      <YStack className="flex-1">
        <Container>
          <YStack className="gap-6 flex-1">
            {settingsItems.map(group => (
              <GroupContainer key={group.title} title={group.title}>
                {group.items.map(item => (
                  <SettingItem 
                    key={item.title} 
                    title={item.title} 
                    screen={item.screen} 
                    icon={item.icon} 
                  />
                ))}
              </GroupContainer>
            ))}
          </YStack>
        </Container>
      </YStack>
    </SafeAreaContainer>
  )
}
```

### BasicDataSettingsScreen.tsx
```tsx
const settingsItems: SettingGroupConfig[] = [
  {
    title: t('settings.data.title'),
    items: [
      {
        title: t('settings.data.backup'),
        icon: <Save size={24} />,
        onPress: handleBackup
      },
      {
        title: t('settings.data.restore.title'),
        icon: <Folder size={24} />,
        onPress: handleRestore
      },
      {
        title: isResetting ? t('common.loading') : t('settings.data.reset'),
        icon: <RotateCcw size={24} className="text-red-500 dark:text-red-500" />,
        danger: true,
        onPress: handleDataReset,
        disabled: isResetting
      }
    ]
  },
  {
    title: t('settings.data.data.title'),
    items: [
      {
        title: t('settings.data.app_data'),
        icon: <FolderOpen size={24} />,
        onPress: handleOpenAppData
      },
      {
        title: t('settings.data.app_logs'),
        icon: <FileText size={24} />,
        onPress: handleOpenAppLogs
      },
      {
        title: t('settings.data.clear_cache.button', { cacheSize }),
        icon: <Trash2 size={24} className="text-red-500 dark:text-red-500" />,
        danger: true,
        onPress: handleClearCache
      }
    ]
  }
]
```

## 设计特点

### 1. 视觉层次
- **分组标题**：粗体、70% 透明度，左侧内边距
- **卡片容器**：圆角卡片，背景色区分
- **设置项**：清晰的间距和内边距

### 2. 交互反馈
- 可点击项使用 `PressableRow`
- 危险操作使用红色文字 (`text-red-500`)
- 禁用状态降低透明度 (`opacity: 0.5`)
- 导航项显示右箭头

### 3. 深色模式支持
- 所有组件都支持 `dark:` 前缀的 Tailwind 类
- 背景色：`bg-ui-card-background dark:bg-ui-card-background-dark`
- 文本颜色：`text-text-primary dark:text-text-primary-dark`

### 4. 间距系统
- 页面级间距：`gap-6`
- 分组间距：`gap-2`
- 设置项内边距：`py-[14px] px-4`
- 图标与文本间距：`gap-3`

### 5. 图标使用
- 统一使用 Lucide React 图标
- 标准尺寸：24px
- 危险操作图标添加红色样式

## 与当前项目的对比

### Cherry Studio (React Native)
- 使用自定义组件系统 (`componentsV2`)
- Tailwind CSS 类名
- 分组卡片式设计
- 支持深色模式

### 当前项目 (React Web)
- 使用 Material-UI (MUI)
- MUI sx 属性或 styled-components
- AppBar + Toolbar 布局
- 渐变标题样式

## 参考文件位置

- `docs/cherry-studio另外一个项目不是本项目/src/screens/settings/data/DataSettingsScreen.tsx`
- `docs/cherry-studio另外一个项目不是本项目/src/screens/settings/data/BasicDataSettingsScreen.tsx`
- `docs/cherry-studio另外一个项目不是本项目/src/componentsV2/layout/Group/index.tsx`
- `docs/cherry-studio另外一个项目不是本项目/src/componentsV2/layout/PressableRow/index.tsx`
- `docs/cherry-studio另外一个项目不是本项目/src/componentsV2/layout/Container/index.tsx`

