# BlockManager 使用示例

## 基本用法

### 1. 创建块

```typescript
import { BlockManager } from '@/shared/services/messages/BlockManager';

// 创建主文本块
const textBlock = await BlockManager.createMainTextBlock(messageId);

// 创建思考块
const thinkingBlock = await BlockManager.createThinkingBlock(messageId);

// 创建错误块
const errorBlock = await BlockManager.createErrorBlock(messageId, '错误信息');
```

### 2. 智能更新块

```typescript
import { BlockManager } from '@/shared/services/messages/BlockManager';
import { MessageBlockType } from '@/shared/types/newMessage';

// 普通更新（使用节流）
BlockManager.smartUpdate(
  blockId,
  { content: '更新的内容' },
  MessageBlockType.MAIN_TEXT
);

// 立即更新（块类型变化时自动触发）
BlockManager.smartUpdate(
  blockId,
  { content: '思考内容' },
  MessageBlockType.THINKING  // 类型变化，自动立即更新
);

// 完成时立即更新
BlockManager.smartUpdate(
  blockId,
  { content: '最终内容' },
  MessageBlockType.MAIN_TEXT,
  true  // isComplete = true
);

// 强制立即更新
BlockManager.smartUpdate(
  blockId,
  { content: '重要更新' },
  MessageBlockType.MAIN_TEXT,
  false,
  { immediate: true }  // 强制立即更新
);
```

### 3. 完成块

```typescript
// 完成块并保存到数据库
await BlockManager.completeBlock(blockId, '最终内容');

// 不修改内容，只标记为完成
await BlockManager.completeBlock(blockId);
```

### 4. 清理资源

```typescript
// 取消所有节流函数，清空活动块
BlockManager.cleanup();
```

### 5. 获取活动块数量

```typescript
const count = BlockManager.getActiveBlockCount();
console.log(`当前活动块数量: ${count}`);
```

## 高级用法

### 在 ResponseHandler 中使用

```typescript
import blockManagerInstance from '@/shared/services/messages/BlockManager';
import { MessageBlockType } from '@/shared/types/newMessage';

class MyResponseHandler {
  private blockId: string;
  private messageId: string;

  async handleTextDelta(text: string) {
    // 使用智能更新，自动节流
    blockManagerInstance.smartUpdate(
      this.blockId,
      { content: text },
      MessageBlockType.MAIN_TEXT
    );
  }

  async handleThinkingDelta(thinking: string) {
    // 块类型变化时自动立即更新
    blockManagerInstance.smartUpdate(
      this.blockId,
      { content: thinking },
      MessageBlockType.THINKING
    );
  }

  async complete() {
    // 完成块
    await blockManagerInstance.completeBlock(this.blockId);
    
    // 清理资源
    blockManagerInstance.cleanup();
  }
}
```

## 性能优势

### 传统方式
```typescript
// ❌ 每次 chunk 都触发 Redux 更新和数据库写入
for (const chunk of chunks) {
  store.dispatch(updateBlock({ id: blockId, content: chunk }));
  await db.updateBlock(blockId, { content: chunk });
}
// 1000 个 chunk = 1000 次 Redux dispatch + 1000 次 DB 写入
```

### BlockManager 方式
```typescript
// ✅ 智能节流，大幅减少更新次数
for (const chunk of chunks) {
  BlockManager.smartUpdate(blockId, { content: chunk }, blockType);
}
// 1000 个 chunk ≈ 20 次 Redux dispatch + 10 次 DB 写入
```

## 智能策略

BlockManager 会自动判断是否需要立即更新：

1. **立即更新的情况**
   - 块类型改变（TEXT → THINKING）
   - 块完成（isComplete = true）
   - 强制立即更新（options.immediate = true）

2. **节流更新的情况**
   - 正常的内容累积
   - 频繁的小更新

## API 对比

### 旧 API（仍然可用）
```typescript
// 创建方法保持不变
const block = await BlockManager.createMainTextBlock(messageId);
```

### 新 API
```typescript
// 新增的智能更新方法
BlockManager.smartUpdate(blockId, changes, blockType, isComplete, options);
BlockManager.completeBlock(blockId, finalContent);
BlockManager.cleanup();
BlockManager.getActiveBlockCount();
```

## 类型定义

```typescript
interface BlockUpdateOptions {
  /** 是否立即更新 */
  immediate?: boolean;
  /** 是否保存到数据库 */
  saveToDb?: boolean;
}
```

## 注意事项

1. **向后兼容**：所有原有的创建方法继续可用
2. **自动清理**：记得在响应完成后调用 `cleanup()`
3. **节流控制**：通过 `performanceSettings` 全局配置节流间隔
4. **类型安全**：使用 TypeScript 类型定义确保类型安全
