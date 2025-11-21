# 简单笔记功能实施计划

## 1. 概述
本项目旨在实现一个基于本地文件系统的简单笔记功能，允许用户在应用内直接管理和编辑 Markdown 笔记文件。该功能不依赖现有的 RAG（检索增强生成）或向量数据库机制，而是直接对文件系统进行操作。

## 2. 核心需求
- **文件系统存储**：笔记以文件形式（如 `.md`）存储在本地磁盘。
- **用户自定义路径**：用户可以在设置中选择笔记存储的根目录。
- **侧边栏集成**：提供开关控制是否在聊天界面侧边栏显示“笔记”Tab。
- **基础 CRUD**：支持笔记文件和文件夹的创建、读取、更新、删除和重命名。
- **UI 界面**：独立的笔记管理列表和 Markdown 编辑器。

## 3. 技术架构

### 3.1 数据模型
新建类型定义文件 `src/shared/types/note.ts`：

```typescript
export interface NoteFile {
  id: string;          // 文件唯一标识 (路径哈希或UUID)
  name: string;        // 文件名 (e.g., "会议记录.md")
  path: string;        // 相对存储根目录的路径
  isDirectory: boolean;
  lastModified: string; // ISO 时间戳
  size?: number;
  extension?: string;   // 文件扩展名
}
```

### 3.2 核心服务 (`SimpleNoteService`)
新建服务文件 `src/shared/services/notes/SimpleNoteService.ts`，封装底层文件操作。
该服务将依赖现有的 `WorkspaceService` 或 `AdvancedFileManagerService`。

**主要方法：**
- `getStoragePath()`: 获取用户配置的存储路径。
- `setStoragePath(path: string)`: 设置存储路径。
- `listNotes(subPath?: string)`: 列出指定目录下的文件和文件夹。
- `createNote(path: string, name: string, content?: string)`: 创建新笔记。
- `createFolder(path: string, name: string)`: 创建新文件夹。
- `readNote(path: string)`: 读取笔记内容。
- `saveNote(path: string, content: string)`: 保存笔记内容。
- `deleteItem(path: string)`: 删除文件或文件夹。
- `renameItem(oldPath: string, newName: string)`: 重命名。

### 3.3 配置管理
在 `DexieStorageService` 的 `settings` 表中存储以下配置项：
- `NOTE_STORAGE_PATH` (string): 用户选择的笔记根目录绝对路径。
- `ENABLE_NOTE_SIDEBAR` (boolean): 是否在侧边栏显示笔记入口。

## 4. UI 实现计划

### 4.1 设置页面
在设置模块中新增“笔记设置”页面：
- **路径选择器**：允许用户浏览并选择本地文件夹作为笔记库。
- **侧边栏开关**：Toggle 开关，控制 `ENABLE_NOTE_SIDEBAR` 配置。

### 4.2 侧边栏集成
- 修改侧边栏组件，监听 `ENABLE_NOTE_SIDEBAR` 配置的变化。
- 当开关开启时，渲染“笔记”图标/Tab。
- 点击该 Tab 跳转到笔记管理页面。

### 4.3 笔记管理界面
- **文件树/列表视图**：展示当前目录下的笔记和文件夹。
- **面包屑导航**：显示当前路径层级。
- **操作工具栏**：新建笔记、新建文件夹、刷新等按钮。

### 4.4 编辑器界面
- **Markdown 编辑器**：复用现有的编辑器组件或集成新的 Markdown 编辑器。
- **实时/手动保存**：调用 `SimpleNoteService.saveNote` 进行保存。

## 5. 实施步骤
1.  **类型定义**：创建 `NoteFile` 接口。
2.  **服务开发**：实现 `SimpleNoteService`，打通文件系统操作。
3.  **配置集成**：在 `SettingsService` 中添加笔记相关配置的读写逻辑。
4.  **设置 UI**：开发笔记设置页面。
5.  **侧边栏逻辑**：实现侧边栏 Tab 的动态显示。
6.  **管理 UI**：开发文件列表和管理界面。
7.  **编辑 UI**：开发笔记编辑界面。
8.  **测试与优化**：验证文件操作的稳定性和路径处理的正确性。