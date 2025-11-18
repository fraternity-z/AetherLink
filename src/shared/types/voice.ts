export interface SpeechRecognitionResult {
  matches: string[];
}

export interface SpeechRecognitionPermissions {
  speechRecognition: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown';
}

export interface SpeechRecognitionOptions {
  language?: string;
  maxResults?: number;
  partialResults?: boolean;
  popup?: boolean;
}

export interface VoiceRecognitionSettings {
  enabled: boolean;
  language: string;
  autoStart: boolean;
  silenceTimeout: number;
  maxResults: number;
  partialResults: boolean;
  permissionStatus: 'granted' | 'denied' | 'unknown';
  provider: 'capacitor' | 'openai';
}

// OpenAI Whisper API 相关类型
export interface OpenAIWhisperSettings {
  apiKey: string;
  showApiKey: boolean;
  model: string;
  language?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface WhisperTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: WhisperSegment[];
}

export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

// Gemini TTS API 相关类型
export interface GeminiTTSSettings {
  apiKey: string;
  showApiKey: boolean;
  model: 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-preview-tts';
  voice: GeminiVoiceName;
  stylePrompt?: string;
  useMultiSpeaker: boolean;
  speakers?: GeminiSpeaker[];
}

export interface GeminiSpeaker {
  speaker: string;
  voiceName: GeminiVoiceName;
}

// Gemini TTS 支持的30种预设语音
export type GeminiVoiceName =
  | 'Zephyr'      // Bright
  | 'Puck'        // Upbeat
  | 'Charon'      // Informative
  | 'Kore'        // Firm
  | 'Fenrir'      // Excitable
  | 'Leda'        // Youthful
  | 'Orus'        // Firm
  | 'Aoede'       // Breezy
  | 'Callirrhoe'  // Easy-going
  | 'Autonoe'     // Bright
  | 'Enceladus'   // Breathy
  | 'Iapetus'     // Clear
  | 'Umbriel'     // Easy-going
  | 'Algieba'     // Smooth
  | 'Despina'     // Smooth
  | 'Erinome'     // Clear
  | 'Algenib'     // Gravelly
  | 'Rasalgethi'  // Informative
  | 'Laomedeia'   // Upbeat
  | 'Achernar'    // Soft
  | 'Alnilam'     // Firm
  | 'Schedar'     // Even
  | 'Gacrux'      // Mature
  | 'Pulcherrima' // Forward
  | 'Achird'      // Friendly
  | 'Zubenelgenubi' // Casual
  | 'Vindemiatrix' // Gentle
  | 'Sadachbia'   // Lively
  | 'Sadaltager'  // Knowledgeable
  | 'Sulafat';    // Warm

// Gemini TTS 语音特征描述
export const GeminiVoiceDescriptions: Record<GeminiVoiceName, string> = {
  'Zephyr': 'Bright - 明亮',
  'Puck': 'Upbeat - 乐观',
  'Charon': 'Informative - 信息丰富',
  'Kore': 'Firm - 坚定',
  'Fenrir': 'Excitable - 兴奋',
  'Leda': 'Youthful - 年轻',
  'Orus': 'Firm - 坚定',
  'Aoede': 'Breezy - 轻松',
  'Callirrhoe': 'Easy-going - 随和',
  'Autonoe': 'Bright - 明亮',
  'Enceladus': 'Breathy - 气息感',
  'Iapetus': 'Clear - 清晰',
  'Umbriel': 'Easy-going - 随和',
  'Algieba': 'Smooth - 流畅',
  'Despina': 'Smooth - 流畅',
  'Erinome': 'Clear - 清晰',
  'Algenib': 'Gravelly - 沙哑',
  'Rasalgethi': 'Informative - 信息丰富',
  'Laomedeia': 'Upbeat - 乐观',
  'Achernar': 'Soft - 柔和',
  'Alnilam': 'Firm - 坚定',
  'Schedar': 'Even - 平稳',
  'Gacrux': 'Mature - 成熟',
  'Pulcherrima': 'Forward - 直接',
  'Achird': 'Friendly - 友好',
  'Zubenelgenubi': 'Casual - 随意',
  'Vindemiatrix': 'Gentle - 温和',
  'Sadachbia': 'Lively - 活泼',
  'Sadaltager': 'Knowledgeable - 博学',
  'Sulafat': 'Warm - 温暖'
};

// Gemini TTS 支持的语言
export const GeminiSupportedLanguages = [
  { code: 'ar-EG', name: 'Arabic (Egyptian)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-US', name: 'Spanish (US)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (Korea)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian (Russia)' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)' },
  { code: 'pl-PL', name: 'Polish (Poland)' },
  { code: 'th-TH', name: 'Thai (Thailand)' },
  { code: 'tr-TR', name: 'Turkish (Turkey)' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
  { code: 'ro-RO', name: 'Romanian (Romania)' },
  { code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'mr-IN', name: 'Marathi (India)' },
  { code: 'ta-IN', name: 'Tamil (India)' },
  { code: 'te-IN', name: 'Telugu (India)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }
] as const;