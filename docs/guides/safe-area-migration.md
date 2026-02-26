# 设置页面安全区域迁移指南

> 迁移状态：✅ **已全部完成**

## 布局规范

所有设置页面使用统一的 `SafeAreaContainer` + `Container` 布局模式：

```
┌─────────────────────────┐
│      HeaderBar          │
├─────────────────────────┤
│                         │
│    Container 内容       │  ← 可滚动，有底部 padding
│                         │
├─────────────────────────┤
│   透明安全区域 48px     │  ← 透明，可以看到下面
└─────────────────────────┘
```

## CSS 变量（定义在 `src/components/GlobalStyles.tsx`）

```css
--safe-area-bottom-min: 48px;
--safe-area-bottom-computed: max(env(safe-area-inset-bottom), 48px);
--content-bottom-padding: calc(var(--safe-area-bottom-computed) + 16px);
```

## 正确用法

```tsx
// ✅ 推荐：使用 Container 组件
<SafeAreaContainer>
  <HeaderBar title="标题" onBackPress={handleBack} />
  <Container ref={containerRef} onScroll={handleScroll}>
    {/* 内容 */}
  </Container>
</SafeAreaContainer>
```

## 禁止用法

```tsx
// ❌ 不要在 SafeAreaContainer 上设置 bgcolor
<SafeAreaContainer sx={{ bgcolor: 'xxx' }}>

// ❌ 不要硬编码 padding 值
<Box sx={{ pb: 'calc(var(--safe-area-bottom-computed) + 16px)' }}>
```

## 核心组件

- `src/components/settings/SettingComponents.tsx` — `SafeAreaContainer` + `Container` 组件定义
- `src/components/GlobalStyles.tsx` — CSS 变量定义
