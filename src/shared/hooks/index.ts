// 导出所有钩子函数

// 助手相关
export { useAssistant } from './useAssistant';

// 输入框相关 - 重构后的统一hooks
export { useChatInputLogic } from './useChatInputLogic';
export { useInputState } from './useInputState';
export { useInputMenus } from './useInputMenus';
export { useInputExpand, type UseInputExpandOptions, type UseInputExpandReturn } from './useInputExpand';
export { useInputStyles } from './useInputStyles';
export { useKnowledgeContext } from './useKnowledgeContext';

// 长文本粘贴
export { useLongTextPaste, type UseLongTextPasteOptions, type UseLongTextPasteReturn } from './useLongTextPaste';

// 文件上传
export { useFileUpload } from './useFileUpload';

// 语音识别
export { useVoiceRecognition } from './useVoiceRecognition';