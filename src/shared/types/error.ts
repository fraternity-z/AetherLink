/**
 * 错误类型定义
 * 完全参考另一个项目，支持 AI SDK 的所有错误类型
 */
import {
  AISDKError,
  APICallError,
  DownloadError,
  InvalidArgumentError,
  InvalidDataContentError,
  InvalidMessageRoleError,
  InvalidPromptError,
  JSONParseError,
  MessageConversionError,
  NoObjectGeneratedError,
  NoSuchModelError,
  NoSuchProviderError,
  NoSuchToolError,
  RetryError,
  ToolCallRepairError,
  TypeValidationError,
  UnsupportedFunctionalityError
} from 'ai';

// FinishReason 类型定义（AI SDK 内部类型）
export type FinishReason = 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';

// Serializable 类型定义
export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };

/**
 * 基础序列化错误接口
 */
export interface SerializedError {
  name: string | null;
  message: string | null;
  stack: string | null;
  [key: string]: Serializable;
}

/**
 * 判断是否为序列化错误
 */
export const isSerializedError = (error: Record<string, unknown>): error is SerializedError => {
  return 'name' in error && 'message' in error && 'stack' in error;
};

/**
 * AI SDK 基础错误接口
 */
export interface SerializedAiSdkError extends SerializedError {
  readonly cause: Serializable;
}

/**
 * 判断是否为 AI SDK 错误
 */
export const isSerializedAiSdkError = (error: SerializedError): error is SerializedAiSdkError => {
  return 'cause' in error;
};

/**
 * API 调用错误
 */
export interface SerializedAiSdkAPICallError extends SerializedAiSdkError {
  readonly url: string;
  readonly requestBodyValues: Serializable;
  readonly statusCode: number | null;
  readonly responseHeaders: Record<string, string> | null;
  readonly responseBody: string | null;
  readonly isRetryable: boolean;
  readonly data: Serializable | null;
}

export const isSerializedAiSdkAPICallError = (error: SerializedError): error is SerializedAiSdkAPICallError => {
  return (
    isSerializedAiSdkError(error) &&
    'url' in error &&
    'requestBodyValues' in error &&
    'statusCode' in error &&
    'responseHeaders' in error &&
    'responseBody' in error &&
    'isRetryable' in error &&
    'data' in error
  );
};

/**
 * 下载错误
 */
export interface SerializedAiSdkDownloadError extends SerializedAiSdkError {
  readonly url: string;
  readonly statusCode: number | null;
  readonly statusText: string | null;
}

export const isSerializedAiSdkDownloadError = (error: SerializedError): error is SerializedAiSdkDownloadError => {
  return isSerializedAiSdkError(error) && 'url' in error && 'statusCode' in error && 'statusText' in error;
};

/**
 * 无效参数错误
 */
export interface SerializedAiSdkInvalidArgumentError extends SerializedAiSdkError {
  readonly parameter: string;
  readonly value: Serializable;
}

export const isSerializedAiSdkInvalidArgumentError = (
  error: SerializedError
): error is SerializedAiSdkInvalidArgumentError => {
  return isSerializedAiSdkError(error) && 'parameter' in error && 'value' in error;
};

/**
 * 无效数据内容错误
 */
export interface SerializedAiSdkInvalidDataContentError extends SerializedAiSdkError {
  readonly content: Serializable;
}

export const isSerializedAiSdkInvalidDataContentError = (
  error: SerializedError
): error is SerializedAiSdkInvalidDataContentError => {
  return isSerializedAiSdkError(error) && 'content' in error;
};

/**
 * 无效消息角色错误
 */
export interface SerializedAiSdkInvalidMessageRoleError extends SerializedAiSdkError {
  readonly role: string;
}

export const isSerializedAiSdkInvalidMessageRoleError = (
  error: SerializedError
): error is SerializedAiSdkInvalidMessageRoleError => {
  return isSerializedAiSdkError(error) && 'role' in error;
};

/**
 * 无效提示词错误
 */
export interface SerializedAiSdkInvalidPromptError extends SerializedAiSdkError {
  readonly prompt: Serializable;
}

export const isSerializedAiSdkInvalidPromptError = (
  error: SerializedError
): error is SerializedAiSdkInvalidPromptError => {
  return isSerializedAiSdkError(error) && 'prompt' in error;
};

/**
 * 无效工具输入错误（工具参数错误）
 */
export interface SerializedAiSdkInvalidToolInputError extends SerializedAiSdkError {
  readonly toolName: string;
  readonly toolInput: string;
  readonly toolArgs?: string; // ai 4.x 使用 toolArgs
}

export const isSerializedAiSdkInvalidToolInputError = (
  error: SerializedError
): error is SerializedAiSdkInvalidToolInputError => {
  return isSerializedAiSdkError(error) && 'toolName' in error && ('toolInput' in error || 'toolArgs' in error);
};

/**
 * JSON 解析错误
 */
export interface SerializedAiSdkJSONParseError extends SerializedAiSdkError {
  readonly text: string;
}

export const isSerializedAiSdkJSONParseError = (error: SerializedError): error is SerializedAiSdkJSONParseError => {
  return isSerializedAiSdkError(error) && 'text' in error;
};

/**
 * 消息转换错误
 */
export interface SerializedAiSdkMessageConversionError extends SerializedAiSdkError {
  readonly originalMessage: Serializable;
}

export const isSerializedAiSdkMessageConversionError = (
  error: SerializedError
): error is SerializedAiSdkMessageConversionError => {
  return isSerializedAiSdkError(error) && 'originalMessage' in error;
};

/**
 * 未生成语音错误
 */
export interface SerializedAiSdkNoSpeechGeneratedError extends SerializedAiSdkError {
  readonly responses: string[];
}

export const isSerializedAiSdkNoSpeechGeneratedError = (
  error: SerializedError
): error is SerializedAiSdkNoSpeechGeneratedError => {
  return isSerializedAiSdkError(error) && 'responses' in error;
};

/**
 * 未生成对象错误
 */
export interface SerializedAiSdkNoObjectGeneratedError extends SerializedAiSdkError {
  readonly text: string | null;
  readonly response: Serializable;
  readonly usage: Serializable;
  readonly finishReason: string | null;
}

export const isSerializedAiSdkNoObjectGeneratedError = (
  error: SerializedError
): error is SerializedAiSdkNoObjectGeneratedError => {
  return (
    isSerializedAiSdkError(error) &&
    'text' in error &&
    'response' in error &&
    'usage' in error &&
    'finishReason' in error
  );
};

/**
 * 模型不存在错误
 */
export interface SerializedAiSdkNoSuchModelError extends SerializedAiSdkError {
  readonly modelId: string;
  readonly modelType: string;
}

export const isSerializedAiSdkNoSuchModelError = (error: SerializedError): error is SerializedAiSdkNoSuchModelError => {
  return isSerializedAiSdkError(error) && 'modelId' in error && 'modelType' in error;
};

/**
 * 提供商不存在错误
 */
export interface SerializedAiSdkNoSuchProviderError extends SerializedAiSdkNoSuchModelError {
  readonly providerId: string;
  readonly availableProviders: string[];
}

export const isSerializedAiSdkNoSuchProviderError = (
  error: SerializedError
): error is SerializedAiSdkNoSuchProviderError => {
  return isSerializedAiSdkNoSuchModelError(error) && 'providerId' in error && 'availableProviders' in error;
};

/**
 * 工具不存在错误
 */
export interface SerializedAiSdkNoSuchToolError extends SerializedAiSdkError {
  readonly toolName: string;
  readonly availableTools: string[] | null;
}

export const isSerializedAiSdkNoSuchToolError = (error: SerializedError): error is SerializedAiSdkNoSuchToolError => {
  return isSerializedAiSdkError(error) && 'toolName' in error && 'availableTools' in error;
};

/**
 * 重试错误
 */
export interface SerializedAiSdkRetryError extends SerializedAiSdkError {
  readonly reason: string;
  readonly lastError: Serializable;
  readonly errors: Serializable[];
}

export const isSerializedAiSdkRetryError = (error: SerializedError): error is SerializedAiSdkRetryError => {
  return isSerializedAiSdkError(error) && 'reason' in error && 'lastError' in error && 'errors' in error;
};

/**
 * 嵌入值过多错误
 */
export interface SerializedAiSdkTooManyEmbeddingValuesForCallError extends SerializedAiSdkError {
  readonly provider: string;
  readonly modelId: string;
  readonly maxEmbeddingsPerCall: number;
  readonly values: Serializable[];
}

export const isSerializedAiSdkTooManyEmbeddingValuesForCallError = (
  error: SerializedError
): error is SerializedAiSdkTooManyEmbeddingValuesForCallError => {
  return (
    isSerializedAiSdkError(error) &&
    'provider' in error &&
    'modelId' in error &&
    'maxEmbeddingsPerCall' in error &&
    'values' in error
  );
};

/**
 * 工具调用修复错误
 */
export interface SerializedAiSdkToolCallRepairError extends SerializedAiSdkError {
  readonly originalError: SerializedAiSdkNoSuchToolError | SerializedAiSdkInvalidToolInputError;
}

export const isSerializedAiSdkToolCallRepairError = (
  error: SerializedError
): error is SerializedAiSdkToolCallRepairError => {
  return isSerializedAiSdkError(error) && 'originalError' in error;
};

/**
 * 类型验证错误
 */
export interface SerializedAiSdkTypeValidationError extends SerializedAiSdkError {
  readonly value: Serializable;
}

export const isSerializedAiSdkTypeValidationError = (
  error: SerializedError
): error is SerializedAiSdkTypeValidationError => {
  return isSerializedAiSdkError(error) && 'value' in error && !('parameter' in error);
};

/**
 * 不支持的功能错误
 */
export interface SerializedAiSdkUnsupportedFunctionalityError extends SerializedAiSdkError {
  readonly functionality: string;
}

export const isSerializedAiSdkUnsupportedFunctionalityError = (
  error: SerializedError
): error is SerializedAiSdkUnsupportedFunctionalityError => {
  return isSerializedAiSdkError(error) && 'functionality' in error;
};

/**
 * AI SDK 错误联合类型（原始错误）
 */
export type AiSdkErrorUnion =
  | AISDKError
  | APICallError
  | DownloadError
  | InvalidArgumentError
  | InvalidDataContentError
  | InvalidMessageRoleError
  | InvalidPromptError
  | JSONParseError
  | MessageConversionError
  | NoObjectGeneratedError
  | NoSuchModelError
  | NoSuchProviderError
  | NoSuchToolError
  | RetryError
  | ToolCallRepairError
  | TypeValidationError
  | UnsupportedFunctionalityError;

/**
 * 序列化后的 AI SDK 错误联合类型
 */
export type SerializedAiSdkErrorUnion =
  | SerializedAiSdkAPICallError
  | SerializedAiSdkDownloadError
  | SerializedAiSdkInvalidArgumentError
  | SerializedAiSdkInvalidDataContentError
  | SerializedAiSdkInvalidMessageRoleError
  | SerializedAiSdkInvalidPromptError
  | SerializedAiSdkInvalidToolInputError
  | SerializedAiSdkJSONParseError
  | SerializedAiSdkMessageConversionError
  | SerializedAiSdkNoSpeechGeneratedError
  | SerializedAiSdkNoObjectGeneratedError
  | SerializedAiSdkNoSuchModelError
  | SerializedAiSdkNoSuchProviderError
  | SerializedAiSdkNoSuchToolError
  | SerializedAiSdkRetryError
  | SerializedAiSdkToolCallRepairError
  | SerializedAiSdkTypeValidationError
  | SerializedAiSdkUnsupportedFunctionalityError;

/**
 * 判断是否为 AI SDK 错误联合类型
 */
export const isSerializedAiSdkErrorUnion = (error: SerializedError): error is SerializedAiSdkErrorUnion => {
  return (
    isSerializedAiSdkAPICallError(error) ||
    isSerializedAiSdkDownloadError(error) ||
    isSerializedAiSdkInvalidArgumentError(error) ||
    isSerializedAiSdkInvalidDataContentError(error) ||
    isSerializedAiSdkInvalidMessageRoleError(error) ||
    isSerializedAiSdkInvalidPromptError(error) ||
    isSerializedAiSdkInvalidToolInputError(error) ||
    isSerializedAiSdkJSONParseError(error) ||
    isSerializedAiSdkMessageConversionError(error) ||
    isSerializedAiSdkNoObjectGeneratedError(error) ||
    isSerializedAiSdkNoSuchModelError(error) ||
    isSerializedAiSdkNoSuchProviderError(error) ||
    isSerializedAiSdkNoSuchToolError(error) ||
    isSerializedAiSdkRetryError(error) ||
    isSerializedAiSdkToolCallRepairError(error) ||
    isSerializedAiSdkTypeValidationError(error) ||
    isSerializedAiSdkUnsupportedFunctionalityError(error)
  );
};

