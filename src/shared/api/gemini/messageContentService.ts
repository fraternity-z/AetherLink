/**
 * Gemini 消息内容处理服务
 * 专门处理消息中的文件、图片等内容转换
 */
import type { Message, FileType, Model } from '../../types';
import type { Content, Part } from '@google/genai';
import { getMainTextContent } from '../../utils/messageUtils';
import { findImageBlocks, findFileBlocks } from '../../utils/blockUtils';
import { createGeminiFileService } from './fileService';
import { log } from '../../services/LoggerService';
import { FileProcessingUtils } from '../../utils/fileProcessingUtils';
import { dexieStorage } from '../../services/DexieStorageService';

// 文件大小常量
const MB = 1024 * 1024;
const SMALL_FILE_SIZE = 20 * MB;

/**
 * Gemini 消息内容处理服务类
 */
export class GeminiMessageContentService {
  private fileService: ReturnType<typeof createGeminiFileService>;

  constructor(model: Model) {
    this.fileService = createGeminiFileService(model);
  }

  /**
   * 将文件块中的文件对象转换为完整的 FileType
   */
  private adaptFileBlockToFileType(fileBlockFile: {
    id: string;
    name: string;
    origin_name: string;
    size: number;
    mimeType: string;
    base64Data?: string;
    type?: string;
  }): FileType {
    return {
      id: fileBlockFile.id,
      name: fileBlockFile.name,
      origin_name: fileBlockFile.origin_name,
      path: '', // 移动端通常没有路径
      size: fileBlockFile.size,
      ext: this.extractExtension(fileBlockFile.origin_name),
      type: fileBlockFile.type || 'unknown',
      created_at: new Date().toISOString(),
      count: 1,
      mimeType: fileBlockFile.mimeType,
      base64Data: fileBlockFile.base64Data
    };
  }

  /**
   * 从文件名提取扩展名
   */
  private extractExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  /**
   * 获取消息内容，包含文本、图片、文件等
   */
  async getMessageContents(message: Message): Promise<Content> {
    const role = message.role === 'user' ? 'user' : 'model';
    const parts: Part[] = [];

    // 获取用户文本内容
    const textContent = getMainTextContent(message);

    // 只有当文本内容不为空时才添加文本part
    if (textContent && textContent.trim()) {
      parts.push({ text: textContent.trim() });
    }

    // 处理图片块
    await this.processImageBlocks(message, parts);

    // 处理文件块
    await this.processFileBlocks(message, parts);

    // 确保至少有一个part
    if (parts.length === 0) {
      parts.push({ text: '' });
    }

    return { role, parts };
  }

  /**
   * 处理消息中的图片块
   */
  private async processImageBlocks(message: Message, parts: Part[]): Promise<void> {
    const imageBlocks = findImageBlocks(message);

    for (const imageBlock of imageBlocks) {
      // 处理AI生成的图片（保留原有逻辑）
      if (imageBlock.metadata?.generateImageResponse?.images) {
        for (const imageUrl of imageBlock.metadata.generateImageResponse.images) {
          if (imageUrl?.startsWith('data:')) {
            const matches = imageUrl.match(/^data:(.+);base64,(.*)$/);
            if (matches && matches.length === 3) {
              parts.push({
                inlineData: {
                  data: matches[2],
                  mimeType: matches[1]
                } as Part['inlineData']
              });
            }
          }
        }
      }
      // 处理用户上传的图片
      else {
        try {
          let base64Data: string | null = null;
          let mimeType: string = imageBlock.mimeType || 'image/jpeg';

          // 情况1：直接的base64数据
          if (imageBlock.base64Data) {
            if (imageBlock.base64Data.startsWith('data:')) {
              const matches = imageBlock.base64Data.match(/^data:(.+);base64,(.*)$/);
              if (matches && matches.length === 3) {
                base64Data = matches[2];
                mimeType = matches[1];
              }
            } else {
              base64Data = imageBlock.base64Data;
            }
          }
          // 情况2：图片引用格式 [图片:ID]，需要从数据库加载
          else if (imageBlock.url) {
            const refMatch = imageBlock.url.match(/\[图片:([a-zA-Z0-9_-]+)\]/);
            if (refMatch && refMatch[1]) {
              try {
                // 从数据库加载图片
                const imageId = refMatch[1];
                const blob = await dexieStorage.getImageBlob(imageId);

                if (blob) {
                  // 将Blob转换为base64
                  const arrayBuffer = await blob.arrayBuffer();
                  const uint8Array = new Uint8Array(arrayBuffer);
                  const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
                  base64Data = btoa(binaryString);
                  mimeType = blob.type || 'image/jpeg';
                }
              } catch (error) {
                log('WARN', `加载图片引用失败: ${imageBlock.url}`, { error });
              }
            } else if (imageBlock.url.startsWith('data:')) {
              // 直接的data URL
              const matches = imageBlock.url.match(/^data:(.+);base64,(.*)$/);
              if (matches && matches.length === 3) {
                base64Data = matches[2];
                mimeType = matches[1];
              }
            }
          }

          // 如果成功获取到base64数据，添加到parts中
          if (base64Data) {
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              } as Part['inlineData']
            });
          }
        } catch (error) {
          log('ERROR', `处理图片块失败: ${imageBlock.id}`, { error });
        }
      }
    }
  }

  /**
   * 处理消息中的文件块
   */
  private async processFileBlocks(message: Message, parts: Part[]): Promise<void> {
    const fileBlocks = findFileBlocks(message);

    for (const fileBlock of fileBlocks) {
      const blockFile = fileBlock.file;
      if (!blockFile) {
        continue;
      }

      // 将文件块的文件对象适配为完整的 FileType
      const file = this.adaptFileBlockToFileType(blockFile);

      try {
        // 处理图片文件
        if (FileProcessingUtils.isImageFile(file)) {
          const imagePart = await this.handleImageFile(file);
          if (imagePart) {
            parts.push(imagePart);
          }
        }
        // 处理PDF文件
        else if (FileProcessingUtils.isPdfFile(file)) {
          const pdfPart = await this.handlePdfFile(file);
          if (pdfPart) {
            parts.push(pdfPart);
          }
        }
        // 处理其他文件类型
        else {
          const textPart = await this.handleTextFile(file);
          if (textPart) {
            parts.push(textPart);
          }
        }
      } catch (error) {
        log('ERROR', `处理文件失败: ${file.origin_name}`, {
          fileId: file.id,
          fileType: file.type,
          error
        });
        // 添加错误提示
        parts.push({
          text: `[无法处理文件: ${file.origin_name}]`
        });
      }
    }
  }

  /**
   * 处理图片文件
   */
  private async handleImageFile(file: FileType): Promise<Part | null> {
    try {
      const base64Data = await FileProcessingUtils.getImageBase64(file);
      return {
        inlineData: {
          data: base64Data.base64,
          mimeType: base64Data.mime
        } as Part['inlineData']
      };
    } catch (error) {
      log('ERROR', `处理图片文件失败: ${file.origin_name}`, { error });
      return null;
    }
  }

  /**
   * 处理PDF文件
   */
  private async handlePdfFile(file: FileType): Promise<Part | null> {
    try {
      const isSmallFile = FileProcessingUtils.isSmallFile(file, SMALL_FILE_SIZE);

      if (isSmallFile) {
        // 小文件使用 base64
        const { data, mimeType } = await FileProcessingUtils.getFileBase64(file);
        return {
          inlineData: {
            data,
            mimeType
          } as Part['inlineData']
        };
      }

      // 大文件处理
      // 1. 先检索已上传的文件
      const fileMetadata = await this.fileService.retrieveFile(file);

      if (fileMetadata) {
        log('INFO', `使用已上传的文件: ${fileMetadata.uri}`, {
          fileName: file.origin_name
        });
        return {
          fileData: {
            fileUri: fileMetadata.uri,
            mimeType: fileMetadata.mimeType
          } as Part['fileData']
        };
      }

      // 2. 如果文件不存在，上传到 Gemini
      log('INFO', `上传新文件: ${file.origin_name}`, {
        fileSize: file.size
      });
      const uploadResult = await this.fileService.uploadFile(file);

      return {
        fileData: {
          fileUri: uploadResult.uri,
          mimeType: uploadResult.mimeType
        } as Part['fileData']
      };
    } catch (error) {
      log('WARN', `PDF文件处理失败，回退到base64: ${file.origin_name}`, { error });

      // 回退策略 - 使用 base64
      try {
        const base64Data = file.base64Data || '';
        const cleanBase64 = FileProcessingUtils.cleanBase64Data(base64Data);
        return {
          inlineData: {
            data: cleanBase64,
            mimeType: 'application/pdf'
          } as Part['inlineData']
        };
      } catch (fallbackError) {
        log('ERROR', `PDF文件回退处理也失败: ${file.origin_name}`, { fallbackError });
        return null;
      }
    }
  }

  /**
   * 处理文本文件
   */
  private async handleTextFile(file: FileType): Promise<Part | null> {
    try {
      const content = await FileProcessingUtils.readFileContent(file);
      return {
        text: `[文件: ${file.origin_name}]\n${content}`
      };
    } catch (error) {
      log('ERROR', `处理文本文件失败: ${file.origin_name}`, { error });
      return null;
    }
  }


}

/**
 * 创建 Gemini 消息内容处理服务实例的工厂函数
 */
export function createGeminiMessageContentService(model: Model): GeminiMessageContentService {
  return new GeminiMessageContentService(model);
}

/**
 * 快速获取消息内容的便捷函数
 */
export async function getGeminiMessageContents(
  message: Message,
  model: Model
): Promise<Content> {
  const service = createGeminiMessageContentService(model);
  return service.getMessageContents(message);
}
