# Gemini TTS 快速开始指南

## 5分钟快速上手

### 步骤 1: 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/apikey)
2. 使用 Google 账号登录
3. 点击 "Create API Key" 创建新的 API Key
4. 复制生成的 API Key

### 步骤 2: 配置 Gemini TTS

在你的应用设置中配置 Gemini TTS：

```typescript
import { TTSService } from '@/shared/services/TTSService';

const ttsService = TTSService.getInstance();

// 1. 设置 API Key
ttsService.setGeminiApiKey('YOUR_API_KEY_HERE');

// 2. 启用 Gemini TTS
ttsService.setUseGemini(true);

// 3. 选择语音（可选，默认为 Kore）
ttsService.setGeminiVoice('Puck');
```

### 步骤 3: 开始使用

```typescript
// 简单播放
await ttsService.speak('你好，这是 Gemini TTS 测试！');

// 带风格的播放
ttsService.setGeminiStylePrompt('Say cheerfully:');
await ttsService.speak('今天天气真好！');
```

## 常用场景示例

### 场景 1: 新闻播报

```typescript
ttsService.setGeminiVoice('Charon'); // Informative 风格
ttsService.setGeminiStylePrompt('Read as a news anchor:');
await ttsService.speak('今日头条：科技创新推动社会进步...');
```

### 场景 2: 故事讲述

```typescript
ttsService.setGeminiVoice('Enceladus'); // Breathy 风格
ttsService.setGeminiStylePrompt('Tell the story in a mysterious tone:');
await ttsService.speak('很久很久以前，在一个遥远的王国...');
```

### 场景 3: 对话场景

```typescript
// 启用多说话人
ttsService.setUseGeminiMultiSpeaker(true);
ttsService.setGeminiSpeakers([
  { speaker: '小明', voiceName: 'Kore' },
  { speaker: '小红', voiceName: 'Leda' }
]);

const dialogue = `
TTS the following conversation between 小明 and 小红:
小明: 你好，小红！周末有什么计划吗？
小红: 我打算去图书馆看书，你呢？
小明: 我想去爬山，要不要一起？
小红: 好主意！我们一起去吧！
`;

await ttsService.speak(dialogue);
```

### 场景 4: 教育内容

```typescript
ttsService.setGeminiVoice('Sadaltager'); // Knowledgeable 风格
ttsService.setGeminiStylePrompt('Explain clearly and patiently:');
await ttsService.speak('今天我们来学习光合作用的原理...');
```

## 推荐语音组合

### 专业场景
- **新闻播报**: Charon (Informative)
- **商务演讲**: Kore (Firm)
- **教育讲解**: Sadaltager (Knowledgeable)

### 休闲场景
- **轻松对话**: Puck (Upbeat)
- **友好交流**: Achird (Friendly)
- **随意聊天**: Zubenelgenubi (Casual)

### 情感表达
- **温暖关怀**: Sulafat (Warm)
- **温柔细语**: Vindemiatrix (Gentle)
- **活泼开朗**: Sadachbia (Lively)

### 特殊效果
- **神秘氛围**: Enceladus (Breathy)
- **独特风格**: Algenib (Gravelly)
- **成熟稳重**: Gacrux (Mature)

## 风格提示词示例

### 情感类
```typescript
'Say cheerfully:'        // 愉快地说
'Say sadly:'             // 悲伤地说
'Say excitedly:'         // 兴奋地说
'Say calmly:'            // 平静地说
'Say angrily:'           // 愤怒地说
```

### 语气类
```typescript
'Say in a whisper:'      // 低声说
'Say loudly:'            // 大声说
'Say softly:'            // 轻声说
'Say firmly:'            // 坚定地说
```

### 场景类
```typescript
'Read as a news anchor:'           // 像新闻主播一样
'Tell the story dramatically:'     // 戏剧化地讲故事
'Explain like a teacher:'          // 像老师一样解释
'Speak like a friend:'             // 像朋友一样说话
```

### 组合使用
```typescript
'Say in a spooky whisper:'                    // 恐怖的低语
'Make the speaker sound tired and bored:'     // 疲惫无聊的语气
'Say with enthusiasm and energy:'             // 充满热情和活力
```

## 完整配置示例

```typescript
import { TTSService } from '@/shared/services/TTSService';
import type { GeminiVoiceName } from '@/shared/types/voice';

class GeminiTTSManager {
  private ttsService: TTSService;

  constructor(apiKey: string) {
    this.ttsService = TTSService.getInstance();
    this.initialize(apiKey);
  }

  private initialize(apiKey: string) {
    // 基础配置
    this.ttsService.setGeminiApiKey(apiKey);
    this.ttsService.setUseGemini(true);
    
    // 模型选择
    this.ttsService.setGeminiModel('gemini-2.5-flash-preview-tts');
    
    // 默认语音
    this.ttsService.setGeminiVoice('Kore');
  }

  // 单说话人播放
  async playSingle(text: string, voice?: GeminiVoiceName, style?: string) {
    if (voice) {
      this.ttsService.setGeminiVoice(voice);
    }
    if (style) {
      this.ttsService.setGeminiStylePrompt(style);
    }
    
    this.ttsService.setUseGeminiMultiSpeaker(false);
    await this.ttsService.speak(text);
  }

  // 多说话人播放
  async playDialogue(
    text: string,
    speakers: Array<{ speaker: string; voiceName: GeminiVoiceName }>
  ) {
    this.ttsService.setUseGeminiMultiSpeaker(true);
    this.ttsService.setGeminiSpeakers(speakers);
    await this.ttsService.speak(text);
  }

  // 停止播放
  stop() {
    this.ttsService.stop();
  }
}

// 使用示例
const manager = new GeminiTTSManager('YOUR_API_KEY');

// 单说话人
await manager.playSingle(
  '欢迎使用 Gemini TTS！',
  'Puck',
  'Say cheerfully:'
);

// 多说话人
await manager.playDialogue(
  `TTS the following conversation between Alice and Bob:
   Alice: 你好！
   Bob: 你好，很高兴见到你！`,
  [
    { speaker: 'Alice', voiceName: 'Leda' },
    { speaker: 'Bob', voiceName: 'Kore' }
  ]
);
```

## 调试技巧

### 1. 检查 API Key
```typescript
const apiKey = 'YOUR_API_KEY';
console.log('API Key 长度:', apiKey.length);
console.log('API Key 前缀:', apiKey.substring(0, 10));
```

### 2. 监听播放状态
```typescript
const isPlaying = ttsService.getIsPlaying();
console.log('正在播放:', isPlaying);

const currentMessageId = ttsService.getCurrentMessageId();
console.log('当前消息ID:', currentMessageId);
```

### 3. 错误处理
```typescript
try {
  await ttsService.speak('测试文本');
} catch (error) {
  console.error('TTS 播放失败:', error);
  // 回退到其他 TTS 服务
  ttsService.setUseGemini(false);
  await ttsService.speak('测试文本');
}
```

## 性能优化建议

1. **复用实例**: 使用单例模式，避免重复创建 TTSService
2. **合理分段**: 长文本分段播放，提升响应速度
3. **预加载配置**: 应用启动时初始化配置
4. **缓存策略**: 对常用文本考虑缓存音频

## 下一步

- 📖 阅读 [完整文档](./gemini-tts-integration.md)
- 🎨 探索 [30种语音选项](./gemini-tts-integration.md#语音选项)
- 🌍 查看 [支持的语言列表](./gemini-tts-integration.md#支持的语言)
- 🔧 了解 [技术细节](./gemini-tts-integration.md#技术细节)

## 获取帮助

- 遇到问题？查看 [故障排查](./gemini-tts-integration.md#故障排查)
- 需要更多示例？访问 [Gemini Cookbook](https://github.com/google-gemini/cookbook)
- API 问题？查看 [官方文档](https://ai.google.dev/gemini-api/docs/speech-generation)

---

**提示**: 首次使用建议先在 [AI Studio](https://aistudio.google.com/generate-speech) 中测试不同语音效果，找到最适合你的语音配置。