/**
 * Gemini 流式响应处理服务
 * 职责：处理流式和非流式响应，收集内容和工具调用
 */

import type { FunctionCall, Content } from '@google/genai';
import { GenerateContentResponse } from '@google/genai';
import { ChunkType } from '../../types/chunk';

// 处理选项
export interface ProcessStreamOptions {
  onChunk: (chunk: any) => void;
  history: Content[];
  abortSignal?: AbortSignal;
}

// 处理结果
export interface StreamProcessResult {
  functionCalls: FunctionCall[];
  textContent: string;
  hasXMLTools: boolean;
}

/**
 * Gemini 流式响应处理器
 */
export class GeminiStreamProcessor {
  /**
   * 处理流式或非流式响应的统一入口
   */
  async processStream(
    stream: AsyncGenerator<GenerateContentResponse> | GenerateContentResponse,
    options: ProcessStreamOptions,
    _iteration: number // 保留用于未来调试需求
  ): Promise<StreamProcessResult> {
    if (stream instanceof GenerateContentResponse) {
      return this.processNonStreamResponse(stream, options);
    } else {
      return this.processStreamResponse(stream, options);
    }
  }

  /**
   * 处理非流式响应
   */
  private async processNonStreamResponse(
    stream: GenerateContentResponse,
    options: ProcessStreamOptions
  ): Promise<StreamProcessResult> {
    const { onChunk, history } = options;
    let functionCalls: FunctionCall[] = [];
    const start_time_millsec = new Date().getTime();
    let finalTextContent = '';

    const time_completion_millsec = new Date().getTime() - start_time_millsec;
    
    // 收集内容
    let thinkingContent = '';
    let textContent = '';
    
    console.log(`[Gemini processStream] 非流式响应 - candidates数量: ${stream.candidates?.length || 0}, stream.text长度: ${stream.text?.length || 0}`);
    
    // 🔧 历史消息管理：总是添加 candidate.content 到 history
    stream.candidates?.forEach((candidate, candidateIdx) => {
      if (candidate.content) {
        history.push(candidate.content);
        console.log(`[Gemini processStream] candidate[${candidateIdx}] parts数量: ${candidate.content.parts?.length || 0}`);
        candidate.content.parts?.forEach((part, partIdx) => {
          console.log(`[Gemini processStream] part[${partIdx}]:`, {
            hasText: !!part.text,
            textLength: part.text?.length || 0,
            thought: part.thought,
            hasFunctionCall: !!part.functionCall
          });
          if (part.functionCall) {
            functionCalls.push(part.functionCall);
          }
          if (part.thought && part.text) {
            thinkingContent += part.text;
          } else if (part.text) {
            textContent += part.text;
          }
        });
      }
    });
    
    // 使用 stream.text 作为后备（如果 parts 没有提取到文本）
    if (!textContent && stream.text?.length) {
      console.log(`[Gemini processStream] 使用 stream.text 作为后备文本`);
      textContent = stream.text;
    }
    
    finalTextContent = textContent;
    
    console.log(`[Gemini processStream] 最终内容 - thinking: ${thinkingContent.length}字符, text: ${textContent.length}字符`);
    
    // 按正确顺序发送：先 thinking，后 text
    if (thinkingContent) {
      console.log(`[Gemini processStream] 发送 THINKING_COMPLETE`);
      await onChunk({ type: ChunkType.THINKING_COMPLETE, text: thinkingContent, thinking_millsec: time_completion_millsec });
    }
    
    // 检测 XML 工具调用
    const hasXMLToolsInText = textContent.includes('<tool_use>');
    
    // 有工具调用时也要发送文本块（在工具块之前）
    if (textContent) {
      console.log(`[Gemini processStream] 发送 TEXT_COMPLETE${hasXMLToolsInText ? ' (含 XML 工具)' : ''}`);
      await onChunk({ type: ChunkType.TEXT_COMPLETE, text: textContent });
    } else {
      console.log(`[Gemini processStream] 没有文本内容，跳过 TEXT_COMPLETE`);
    }

    // ⚠️ 不在 processStream 内部发送 BLOCK_COMPLETE
    // 统一由主循环末尾发送，避免重复

    // 检测文本中是否包含 XML 工具调用标签
    const hasXMLTools = finalTextContent.includes('<tool_use>');
    
    return { functionCalls, textContent: finalTextContent, hasXMLTools };
  }

  /**
   * 处理流式响应
   */
  private async processStreamResponse(
    stream: AsyncGenerator<GenerateContentResponse>,
    options: ProcessStreamOptions
  ): Promise<StreamProcessResult> {
    const { onChunk, history, abortSignal } = options;
    let functionCalls: FunctionCall[] = [];
    let time_first_token_millsec = 0;
    const start_time_millsec = new Date().getTime();
    let finalTextContent = '';

    const finalUsage = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 };
    const finalMetrics = { completion_tokens: 0, time_completion_millsec: 0, time_first_token_millsec: 0 };

    let content = '';
    let thinkingContent = '';
    let chunkIndex = 0;

    for await (const chunk of stream) {
      chunkIndex++;
      
      // 检查中断信号
      if (abortSignal?.aborted) {
        console.log('[GeminiStreamProcessor] 流式响应被用户中断');
        break;
      }

      if (time_first_token_millsec == 0) {
        time_first_token_millsec = new Date().getTime();
      }

      const partsCount = chunk.candidates?.[0]?.content?.parts?.length || 0;
      console.log(`[Gemini 流式] chunk[${chunkIndex}] - parts数量: ${partsCount}, finishReason: ${chunk.candidates?.[0]?.finishReason || 'none'}`);

      if (chunk.candidates?.[0]?.content?.parts && chunk.candidates[0].content.parts.length > 0) {
        const parts = chunk.candidates[0].content.parts;
        for (const part of parts) {
          console.log(`[Gemini 流式] part - thought: ${part.thought}, hasText: ${!!part.text}, textLen: ${part.text?.length || 0}`);
          
          if (!part.text) continue;

          if (part.thought) {
            // 思考过程
            if (time_first_token_millsec === 0) {
              time_first_token_millsec = new Date().getTime();
            }
            thinkingContent += part.text;
            await onChunk({ type: ChunkType.THINKING_DELTA, text: part.text || '' });
          } else {
            // 正常内容
            if (time_first_token_millsec == 0) {
              time_first_token_millsec = new Date().getTime();
            }

            // 当遇到正常文本且有思考内容时，发送 THINKING_COMPLETE
            if (thinkingContent) {
              console.log(`[Gemini 流式] 发送 THINKING_COMPLETE (${thinkingContent.length}字符)`);
              await onChunk({
                type: ChunkType.THINKING_COMPLETE,
                text: thinkingContent,
                thinking_millsec: new Date().getTime() - time_first_token_millsec
              });
              thinkingContent = ''; // 清空思维内容
            }

            content += part.text;
            await onChunk({ type: ChunkType.TEXT_DELTA, text: part.text });
          }
        }
      }

      if (chunk.candidates?.[0]?.finishReason) {
        console.log(`[Gemini 流式] 完成 - content长度: ${content.length}, thinkingContent长度: ${thinkingContent.length}`);
        
        // 🔧 修复：如果只有思考内容没有普通文本，把思考内容作为普通文本发送
        if (!content && thinkingContent) {
          console.log(`[Gemini 流式] 只有思考内容，作为普通文本发送`);
          content = thinkingContent;
          thinkingContent = '';
        }
        
        if (content) {
          console.log(`[Gemini 流式] 发送 TEXT_COMPLETE (${content.length}字符)`);
          await onChunk({ type: ChunkType.TEXT_COMPLETE, text: content });
        }
        if (chunk.usageMetadata) {
          finalUsage.prompt_tokens += chunk.usageMetadata.promptTokenCount || 0;
          finalUsage.completion_tokens += chunk.usageMetadata.candidatesTokenCount || 0;
          finalUsage.total_tokens += chunk.usageMetadata.totalTokenCount || 0;
        }
        if (chunk.candidates?.[0]?.groundingMetadata) {
          const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
          await onChunk({
            type: ChunkType.LLM_WEB_SEARCH_COMPLETE,
            llm_web_search: {
              results: groundingMetadata,
              source: 'gemini'
            }
          });
        }
        
        // 🔧 修复：统一历史消息管理策略
        // 与非流式保持一致：总是添加 candidate.content 到 history
        chunk.candidates?.forEach((candidate) => {
          if (candidate.content) {
            history.push(candidate.content);
          }
        });
        
        // 收集 functionCalls（如果有）
        if (chunk.functionCalls) {
          functionCalls = functionCalls.concat(chunk.functionCalls);
        }

        finalMetrics.completion_tokens = finalUsage.completion_tokens;
        finalMetrics.time_completion_millsec += new Date().getTime() - start_time_millsec;
        finalMetrics.time_first_token_millsec =
          (finalMetrics.time_first_token_millsec || 0) + (time_first_token_millsec - start_time_millsec);
      }
    }

    finalTextContent = content;

    // ⚠️ 不在 processStream 内部发送 BLOCK_COMPLETE
    // 统一由主循环末尾发送，避免重复

    // 检测文本中是否包含 XML 工具调用标签
    const hasXMLTools = finalTextContent.includes('<tool_use>');
    
    return { functionCalls, textContent: finalTextContent, hasXMLTools };
  }
}
