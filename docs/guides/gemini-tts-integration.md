# Gemini TTS 集成文档

## 概述

本文档介绍 AetherLink 中 Google Gemini TTS 的集成方式。TTS 系统已重构为 **tts-v2 架构**，基于 `TTSManager` + 多引擎插件设计。

## 架构

```
src/shared/services/tts-v2/
├── TTSManager.ts           # 统一管理器（单例）
├── types.ts                # 类型定义
├── index.ts                # 导出入口
├── engines/
│   ├── BaseTTSEngine.ts    # 引擎抽象基类
│   ├── GeminiEngine.ts     # Gemini TTS 引擎
│   ├── AzureEngine.ts      # Azure TTS
│   ├── OpenAIEngine.ts     # OpenAI TTS
│   ├── SiliconFlowEngine.ts
│   ├── ElevenLabsEngine.ts
│   ├── MiniMaxEngine.ts
│   ├── VolcanoEngine.ts
│   ├── CapacitorEngine.ts  # 原生设备 TTS
│   └── WebSpeechEngine.ts  # 浏览器 Web Speech API
└── utils/
    ├── AudioPlayer.ts      # 音频播放器
    └── textProcessor.ts    # 文本预处理/分块
```

## 功能特性

- **单说话人模式**：使用单一语音进行文本转语音
- **多说话人模式**：支持最多 2 个说话人的对话场景
- **风格控制**：通过自然语言提示词控制语音风格、语调、节奏和情感
- **30 种预设语音**
- **自动引擎降级**：活动引擎失败时按优先级自动降级到其他引擎
- **文本分块播放**：长文本自动分块，逐块合成和播放

### 支持的模型
- `gemini-2.5-flash-preview-tts` - 快速响应，适合实时应用
- `gemini-2.5-pro-preview-tts` - 高质量输出，适合专业场景

## API 配置

### 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/apikey)
2. 登录 Google 账号
3. 创建或获取 API Key
4. 在应用设置中配置 API Key

### 基本配置

```typescript
import { TTSManager } from '@/shared/services/tts-v2';

const tts = TTSManager.getInstance();

// 设置活动引擎为 Gemini
tts.setActiveEngine('gemini');

// 配置 Gemini 引擎
tts.configureEngine('gemini', {
  enabled: true,
  apiKey: 'your-api-key-here',
  model: 'gemini-2.5-flash-preview-tts',
  voice: 'Kore',
});
```

### GeminiTTSConfig 类型定义

```typescript
interface GeminiTTSConfig {
  enabled: boolean;
  apiKey: string;
  model: 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-preview-tts';
  voice: string;           // 30 种预设语音
  stylePrompt?: string;    // 风格提示词
  useMultiSpeaker: boolean;
  speakers?: Array<{ speaker: string; voiceName: string }>;
}
```

## 语音选项

### 30种预设语音

| 语音名称 | 特征 | 适用场景 |
|---------|------|---------|
| **Zephyr** | Bright (明亮) | 活力、积极的内容 |
| **Puck** | Upbeat (乐观) | 轻松、愉快的对话 |
| **Charon** | Informative (信息丰富) | 新闻、教育内容 |
| **Kore** | Firm (坚定) | 专业、正式场合 |
| **Fenrir** | Excitable (兴奋) | 激动人心的内容 |
| **Leda** | Youthful (年轻) | 年轻化的内容 |
| **Orus** | Firm (坚定) | 权威性内容 |
| **Aoede** | Breezy (轻松) | 休闲对话 |
| **Callirrhoe** | Easy-going (随和) | 友好交流 |
| **Autonoe** | Bright (明亮) | 清晰表达 |
| **Enceladus** | Breathy (气息感) | 温柔、私密的内容 |
| **Iapetus** | Clear (清晰) | 清晰表达 |
| **Umbriel** | Easy-going (随和) | 轻松对话 |
| **Algieba** | Smooth (流畅) | 流畅叙述 |
| **Despina** | Smooth (流畅) | 平滑过渡 |
| **Erinome** | Clear (清晰) | 明确表达 |
| **Algenib** | Gravelly (沙哑) | 独特风格 |
| **Rasalgethi** | Informative (信息丰富) | 知识传递 |
| **Laomedeia** | Upbeat (乐观) | 积极向上 |
| **Achernar** | Soft (柔和) | 温和内容 |
| **Alnilam** | Firm (坚定) | 确定性表达 |
| **Schedar** | Even (平稳) | 稳定叙述 |
| **Gacrux** | Mature (成熟) | 成熟内容 |
| **Pulcherrima** | Forward (直接) | 直接表达 |
| **Achird** | Friendly (友好) | 友好交流 |
| **Zubenelgenubi** | Casual (随意) | 随意对话 |
| **Vindemiatrix** | Gentle (温和) | 温柔表达 |
| **Sadachbia** | Lively (活泼) | 活泼内容 |
| **Sadaltager** | Knowledgeable (博学) | 专业知识 |
| **Sulafat** | Warm (温暖) | 温暖表达 |

## 使用示例

### 单说话人模式

```typescript
import { TTSManager } from '@/shared/services/tts-v2';

const tts = TTSManager.getInstance();

// 基本使用
await tts.speak('你好，欢迎使用 Gemini TTS！');

// 带风格控制
tts.configureEngine('gemini', { stylePrompt: 'Say cheerfully:' });
await tts.speak('今天天气真好！');

// 切换语音
tts.configureEngine('gemini', { voice: 'Puck' });
await tts.speak('这是一个乐观的声音。');
```

### 多说话人模式

```typescript
// 启用多说话人模式
tts.configureEngine('gemini', {
  useMultiSpeaker: true,
  speakers: [
    { speaker: 'Alice', voiceName: 'Kore' },
    { speaker: 'Bob', voiceName: 'Puck' },
  ],
});

const dialogueText = `
TTS the following conversation between Alice and Bob:
Alice: 你好，Bob！今天过得怎么样？
Bob: 很好！我刚完成了一个项目。
`;

await tts.speak(dialogueText);
```

### 播放控制

```typescript
// 暂停
tts.pause();

// 恢复
await tts.resume();

// 停止
tts.stop();

// 获取播放进度
const progress = tts.getProgress();
// { current: 2, total: 5, percentage: 40 }

// 事件监听
const removeListener = tts.addEventListener((event) => {
  switch (event.type) {
    case 'start': console.log('开始播放'); break;
    case 'end':   console.log('播放结束'); break;
    case 'pause': console.log('已暂停'); break;
    case 'error': console.log('错误:', event.error); break;
  }
});

// 移除监听
removeListener();
```

## 支持的语言

Gemini TTS 自动检测输入语言，支持以下24种语言：

- 🇨🇳 中文 (简体) - zh-CN
- 🇺🇸 英语 (美国) - en-US
- 🇯🇵 日语 - ja-JP
- 🇰🇷 韩语 - ko-KR
- 🇫🇷 法语 - fr-FR
- 🇩🇪 德语 - de-DE
- 🇪🇸 西班牙语 - es-US
- 🇧🇷 葡萄牙语 (巴西) - pt-BR
- 🇷🇺 俄语 - ru-RU
- 🇮🇳 印地语 - hi-IN
- 🇮🇩 印尼语 - id-ID
- 🇮🇹 意大利语 - it-IT
- 🇳🇱 荷兰语 - nl-NL
- 🇵🇱 波兰语 - pl-PL
- 🇹🇭 泰语 - th-TH
- 🇹🇷 土耳其语 - tr-TR
- 🇻🇳 越南语 - vi-VN
- 🇷🇴 罗马尼亚语 - ro-RO
- 🇺🇦 乌克兰语 - uk-UA
- 🇧🇩 孟加拉语 - bn-BD
- 以及其他印度语言 (马拉地语、泰米尔语、泰卢固语等)

## 技术细节

### API 端点
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

### 请求格式

**单说话人：**
```json
{
  "contents": [{
    "parts": [{ "text": "Say cheerfully: Hello!" }]
  }],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "voiceConfig": {
        "prebuiltVoiceConfig": {
          "voiceName": "Kore"
        }
      }
    }
  }
}
```

**多说话人：**
```json
{
  "contents": [{
    "parts": [{
      "text": "TTS the following conversation between Joe and Jane:\nJoe: Hello!\nJane: Hi there!"
    }]
  }],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "multiSpeakerVoiceConfig": {
        "speakerVoiceConfigs": [
          {
            "speaker": "Joe",
            "voiceConfig": {
              "prebuiltVoiceConfig": { "voiceName": "Kore" }
            }
          },
          {
            "speaker": "Jane",
            "voiceConfig": {
              "prebuiltVoiceConfig": { "voiceName": "Puck" }
            }
          }
        ]
      }
    }
  }
}
```

### 响应格式

返回的音频数据为 base64 编码的 PCM 格式：
- 采样率：24kHz
- 声道：单声道 (Mono)
- 位深度：16-bit
- 格式：PCM (需转换为 WAV 才能播放)

### 音频处理

`GeminiEngine` 自动处理 PCM 到 WAV 的转换（`pcmToWav` 方法），转换后的 WAV 数据交给 `AudioPlayer` 播放。长文本会通过 `textProcessor.ts` 的 `chunkText()` 自动分块，逐块合成和播放。

## 限制和注意事项

### API 限制
- 上下文窗口：32k tokens
- 多说话人：最多2个说话人
- 仅支持文本输入和音频输出

### 最佳实践

1. **选择合适的模型**
   - 实时应用：使用 `gemini-2.5-flash-preview-tts`
   - 高质量需求：使用 `gemini-2.5-pro-preview-tts`

2. **风格提示词建议**
   - 简洁明确：`Say cheerfully:`, `Say softly:`
   - 描述性：`Say in a spooky whisper:`, `Make the speaker sound tired:`
   - 针对性：为不同说话人设置不同风格

3. **语音选择建议**
   - 根据内容情感选择合适的语音特征
   - 多说话人场景使用对比明显的语音
   - 测试不同语音找到最适合的

4. **性能优化**
   - 合理控制文本长度
   - 避免频繁切换配置
   - `TTSManager` 为单例，通过 `getInstance()` 获取

## 故障排查

### 常见问题

**1. API Key 无效**
```
错误：Gemini TTS API请求失败: 401
解决：检查 API Key 是否正确，是否已启用 Gemini API
```

**2. 音频无法播放**
```
错误：Gemini TTS播放失败
解决：检查浏览器是否支持 Audio API，确保音频格式转换正确
```

**3. 多说话人不工作**
```
错误：只有一个声音
解决：确保文本格式正确，说话人名称与配置匹配
```

## 参考资源

- [Gemini API 官方文档](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini TTS Cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_TTS.ipynb)

## 所有支持的 TTS 引擎

| 引擎 | TTSEngineType | 优先级 | 说明 |
|------|--------------|--------|------|
| Capacitor | `capacitor` | - | 原生设备 TTS（directPlay） |
| Gemini | `gemini` | 2 | Google Gemini TTS |
| Azure | `azure` | - | 微软 Azure TTS |
| OpenAI | `openai` | - | OpenAI TTS |
| SiliconFlow | `siliconflow` | - | 硅基流动 TTS |
| ElevenLabs | `elevenlabs` | - | ElevenLabs TTS |
| MiniMax | `minimax` | - | MiniMax TTS |
| Volcano | `volcano` | - | 火山引擎 TTS（字节跳动） |
| WebSpeech | `webspeech` | - | 浏览器 Web Speech API（directPlay） |

---

**注意**：Gemini TTS 目前处于预览阶段，API 可能会有变化。请关注官方文档获取最新信息。