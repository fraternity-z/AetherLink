# 侧边栏手势优化 - 原生丝滑体验

## 优化目标
实现原生应用般丝滑流畅的侧边栏手势拖动效果，完全跟随手指移动，无任何延迟或卡顿。

## 核心改进

### 1. 手势系统重构 (`useSwipeGesture.ts`)

#### ✅ 像素级精确跟随
- **改前**: 使用百分比进度 (0-100)，计算不精确
- **改后**: 使用实际像素偏移量 (deltaX)，完全跟随手指

```typescript
// 旧实现
const progress = Math.min(Math.abs(deltaX), threshold * 2) / threshold * 50;
onSwipeProgress(progress, direction);

// 新实现
const clampedDeltaX = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, deltaX));
onSwipeProgress(clampedDeltaX, direction);
```

#### ✅ 双向手势支持
- **打开状态**: 支持左滑关闭
- **关闭状态**: 支持右滑打开
- 手势覆盖层智能切换，不影响内容交互

#### ✅ 优化触发参数
```typescript
{
  threshold: drawerWidth * 0.4,  // 滑动超过40%宽度才触发
  velocityThreshold: 0.3,         // 降低速度要求，更灵敏
  edgeThreshold: 50,              // 增大边缘区域到50px
  maxSwipeDistance: drawerWidth   // 限制最大滑动距离
}
```

### 2. 侧边栏组件优化 (`MotionSidebar.tsx`)

#### ✅ 实时位置计算
```typescript
// 根据滑动偏移量和当前状态动态计算位置
transform: swipeDeltaX !== 0
  ? `translateX(${finalOpen ? swipeDeltaX : -drawerWidth + swipeDeltaX}px)`
  : (finalOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`)
```

#### ✅ 零延迟响应
```typescript
// 滑动时完全禁用过渡动画
transition: swipeDeltaX !== 0 ? 'none' : 'transform 225ms cubic-bezier(0.4, 0, 0.2, 1)'
```

#### ✅ 智能手势覆盖层
```typescript
// 打开时添加覆盖层捕获左滑关闭手势
{finalOpen && (
  <Box
    {...swipeHandlers}
    sx={{
      position: 'fixed',
      width: drawerWidth,
      zIndex: 1301,
      pointerEvents: swipeDeltaX !== 0 ? 'auto' : 'none', // 只在滑动时拦截
    }}
  />
)}
```

#### ✅ 动态背景遮罩
```typescript
// 背景透明度随滑动距离实时变化
backgroundColor: swipeDeltaX !== 0
  ? `rgba(0, 0, 0, ${Math.min(0.5, Math.max(0, (drawerWidth + swipeDeltaX) / drawerWidth) * 0.5)})`
  : 'rgba(0, 0, 0, 0.5)'
```

### 3. 性能优化

#### GPU 加速
```typescript
willChange: 'transform',
backfaceVisibility: 'hidden'
```

#### 状态同步
```typescript
// 使用 requestAnimationFrame 确保丝滑重置
useEffect(() => {
  if (swipeDeltaX !== 0) {
    const rafId = requestAnimationFrame(() => {
      setSwipeDeltaX(0);
    });
    return () => cancelAnimationFrame(rafId);
  }
}, [finalOpen]);
```

## 用户体验提升

### 触发区域
- **边缘触发区域**: 50px (原 30px)
- **视觉提示**: 半透明指示条，触摸时显示

### 手势灵敏度
- **最小滑动距离**: 5px 即开始响应 (原 10px)
- **触发阈值**: 40% 侧边栏宽度 (原固定 80px)
- **速度阈值**: 0.3px/ms (原 0.5px/ms)

### 动画效果
- **滑动中**: 完全禁用过渡，0延迟跟随
- **释放后**: 225ms 流畅过渡动画
- **背景遮罩**: 透明度实时跟随滑动进度

## 技术亮点

1. **像素级精确**: 使用实际像素值而非百分比，精确到1px
2. **零延迟响应**: 滑动时禁用所有过渡动画
3. **智能事件拦截**: 只在滑动时拦截事件，不影响正常交互
4. **双向手势**: 打开和关闭都支持手势操作
5. **性能优化**: GPU 加速 + requestAnimationFrame 同步

## 测试要点

- [ ] 从左边缘右滑，侧边栏应丝滑跟随手指打开
- [ ] 打开后左滑，侧边栏应丝滑跟随手指关闭
- [ ] 滑动过程中背景遮罩透明度应实时变化
- [ ] 释放手指后，侧边栏应平滑过渡到最终状态
- [ ] 快速滑动应能触发打开/关闭（速度检测）
- [ ] 滑动距离不足时应回弹到原位置
- [ ] 侧边栏内容滚动不应触发关闭手势

## 文件修改

### 修改文件
1. `src/hooks/useSwipeGesture.ts` - 手势系统核心逻辑
2. `src/components/TopicManagement/MotionSidebar.tsx` - 侧边栏组件

### 关键改动
- ✅ 进度值从百分比改为像素值
- ✅ 支持打开和关闭时的手势跟随
- ✅ 增大触发区域到 50px
- ✅ 滑动时完全禁用过渡动画
- ✅ 添加智能手势覆盖层
- ✅ 优化背景遮罩动态效果

## 效果对比

### 优化前
- ❌ 只支持关闭状态下的右滑打开
- ❌ 使用百分比计算，不够精确
- ❌ 触发区域小 (30px)
- ❌ 有延迟感，不够丝滑

### 优化后
- ✅ 支持双向手势操作
- ✅ 像素级精确跟随
- ✅ 触发区域大 (50px)
- ✅ 零延迟，原生般丝滑
