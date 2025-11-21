/**
 * 笔记文件模型
 */
export interface NoteFile {
  id: string;          // 文件唯一标识 (路径哈希或UUID)
  name: string;        // 文件名 (e.g., "会议记录.md")
  path: string;        // 相对存储根目录的路径
  isDirectory: boolean;
  lastModified: string; // ISO 时间戳
  size?: number;
  extension?: string;   // 文件扩展名
}