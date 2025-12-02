/**
 * 文件管理插件类型定义
 */

export interface PermissionResult {
  granted: boolean;
  message: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  mtime: number;
  ctime: number;
  permissions: string;
  isHidden: boolean;
}

export interface ListDirectoryOptions {
  path: string;
  showHidden: boolean;
  sortBy: 'name' | 'size' | 'mtime' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface ListDirectoryResult {
  files: FileInfo[];
  totalCount: number;
}

export interface CreateDirectoryOptions {
  path: string;
  recursive: boolean;
}

export interface FileOperationOptions {
  path: string;
}

export interface CreateFileOptions {
  path: string;
  content: string;
  encoding: 'utf8' | 'base64';
}

export interface ReadFileOptions {
  path: string;
  encoding: 'utf8' | 'base64';
}

export interface ReadFileResult {
  content: string;
  encoding: string;
}

export interface WriteFileOptions {
  path: string;
  content: string;
  encoding: 'utf8' | 'base64';
  append: boolean;
}

export interface MoveFileOptions {
  sourcePath: string;
  destinationPath: string;
}

export interface CopyFileOptions {
  sourcePath: string;
  destinationPath: string;
  overwrite: boolean;
}

export interface RenameFileOptions {
  path: string;
  newName: string;
}

export interface SearchFilesOptions {
  directory: string;
  query: string;
  searchType: 'name' | 'content' | 'both';
  fileTypes: string[];
  maxResults: number;
  recursive: boolean;
}

export interface SearchFilesResult {
  files: FileInfo[];
  totalFound: number;
}

// 新增的系统文件选择器相关类型
export interface SystemFilePickerOptions {
  type: 'file' | 'directory' | 'both';
  multiple: boolean;
  accept?: string[];
  startDirectory?: string;
  title?: string;
}

export interface SelectedFileInfo {
  name: string;
  path: string;
  uri: string;
  size: number;
  type: 'file' | 'directory';
  mimeType: string;
  mtime: number;
  ctime: number;
  displayPath?: string; // 用于显示的友好路径
}

export interface SystemFilePickerResult {
  files: SelectedFileInfo[];
  directories: SelectedFileInfo[];
  cancelled: boolean;
}

// ============ AI 编辑相关类型 ============

export interface ReadFileRangeOptions {
  path: string;
  startLine: number;
  endLine: number;
  encoding?: 'utf8' | 'base64';
}

export interface ReadFileRangeResult {
  content: string;
  totalLines: number;
  startLine: number;
  endLine: number;
  rangeHash: string;
}

export interface InsertContentOptions {
  path: string;
  line: number;
  content: string;
}

export interface ReplaceInFileOptions {
  path: string;
  search: string;
  replace: string;
  isRegex?: boolean;
  replaceAll?: boolean;
  caseSensitive?: boolean;
}

export interface ReplaceInFileResult {
  replacements: number;
  modified: boolean;
}

export interface ApplyDiffOptions {
  path: string;
  diff: string;
  createBackup?: boolean;
}

export interface ApplyDiffResult {
  success: boolean;
  linesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  backupPath?: string;
}

export interface GetFileHashOptions {
  path: string;
  algorithm?: 'md5' | 'sha256';
}

export interface GetFileHashResult {
  hash: string;
  algorithm: string;
}

export interface GetLineCountResult {
  lines: number;
}

export interface AdvancedFileManagerPlugin {
  requestPermissions(): Promise<PermissionResult>;
  checkPermissions(): Promise<PermissionResult>;
  openSystemFilePicker(options: SystemFilePickerOptions): Promise<SystemFilePickerResult>;
  openSystemFileManager(path?: string): Promise<void>;
  openFileWithSystemApp(filePath: string, mimeType?: string): Promise<void>;
  listDirectory(options: ListDirectoryOptions): Promise<ListDirectoryResult>;
  createDirectory(options: CreateDirectoryOptions): Promise<void>;
  deleteDirectory(options: FileOperationOptions): Promise<void>;
  createFile(options: CreateFileOptions): Promise<void>;
  readFile(options: ReadFileOptions): Promise<ReadFileResult>;
  writeFile(options: WriteFileOptions): Promise<void>;
  deleteFile(options: FileOperationOptions): Promise<void>;
  moveFile(options: MoveFileOptions): Promise<void>;
  copyFile(options: CopyFileOptions): Promise<void>;
  renameFile(options: RenameFileOptions): Promise<void>;
  getFileInfo(options: FileOperationOptions): Promise<FileInfo>;
  exists(options: FileOperationOptions): Promise<{ exists: boolean }>;
  searchFiles(options: SearchFilesOptions): Promise<SearchFilesResult>;
  // AI 编辑相关
  readFileRange(options: ReadFileRangeOptions): Promise<ReadFileRangeResult>;
  insertContent(options: InsertContentOptions): Promise<void>;
  replaceInFile(options: ReplaceInFileOptions): Promise<ReplaceInFileResult>;
  applyDiff(options: ApplyDiffOptions): Promise<ApplyDiffResult>;
  getFileHash(options: GetFileHashOptions): Promise<GetFileHashResult>;
  getLineCount(options: FileOperationOptions): Promise<GetLineCountResult>;
  echo(options: { value: string }): Promise<{ value: string }>;
}
