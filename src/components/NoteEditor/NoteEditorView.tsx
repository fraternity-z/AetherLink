import { useCallback, useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';
import { FileText, Eye, Code2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import type { RichEditorRef, EditorViewMode } from './types';
import { countCharacters } from './utils/markdown';

// 懒加载 RichEditor，只有切换到预览/只读模式时才加载
const RichEditor = lazy(() => import('./RichEditor'));

interface NoteEditorViewProps {
  content: string;
  onContentChange: (content: string) => void;
  fileName?: string;
  readOnly?: boolean;
}

const NoteEditorView: React.FC<NoteEditorViewProps> = ({
  content,
  onContentChange,
  fileName: _fileName = '未命名笔记', // fileName 由页面 AppBar 显示，这里保留 props 兼容性
  readOnly = false
}) => {
  const editorRef = useRef<RichEditorRef>(null);
  // 默认使用源码模式，性能更好
  const [viewMode, setViewMode] = useState<EditorViewMode>('source');
  const [charCount, setCharCount] = useState(0);
  // 标记是否已经加载过 RichEditor（避免切换时重复初始化）
  const [hasLoadedRichEditor, setHasLoadedRichEditor] = useState(false);

  // CodeMirror 自适应主题
  const cmTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px'
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
    },
    '.cm-content': {
      padding: '16px'
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none'
    }
  });

  useEffect(() => {
    setCharCount(countCharacters(content));
  }, [content]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      onContentChange(newContent);
      setCharCount(countCharacters(newContent));
    },
    [onContentChange]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.default'
      }}
    >
      {/* 顶部工具栏 - 只显示字符数和视图切换，文件名由页面AppBar显示 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {charCount} 字符
          </Typography>

          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setViewMode('source')}
              variant={viewMode === 'source' ? 'contained' : 'outlined'}
              startIcon={<Code2 size={14} />}
            >
              源码
            </Button>
            <Button
              onClick={() => {
                setViewMode('preview');
                setHasLoadedRichEditor(true);
              }}
              variant={viewMode === 'preview' ? 'contained' : 'outlined'}
              startIcon={<Eye size={14} />}
              disabled={readOnly}
            >
              预览
            </Button>
            <Button
              onClick={() => {
                setViewMode('read');
                setHasLoadedRichEditor(true);
              }}
              variant={viewMode === 'read' ? 'contained' : 'outlined'}
              startIcon={<FileText size={14} />}
            >
              只读
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* 编辑器区域 */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'source' ? (
          // 源码模式：使用 CodeMirror，性能更好
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden',
            '& .cm-editor': {
              height: '100%'
            },
            '& .cm-scroller': {
              overflow: 'auto'
            }
          }}>
            <CodeMirror
              value={content}
              onChange={(value) => handleContentChange(value)}
              extensions={[markdown(), cmTheme]}
              theme={oneDark}
              readOnly={readOnly}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                bracketMatching: true
              }}
              style={{ height: '100%' }}
            />
          </Box>
        ) : (
          // 预览/只读模式：使用 RichEditor（懒加载）
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }} color="text.secondary">加载编辑器...</Typography>
            </Box>
          }>
            {hasLoadedRichEditor && (
              <RichEditor
                ref={editorRef}
                initialContent={content}
                onMarkdownChange={handleContentChange}
                showToolbar={viewMode === 'preview' && !readOnly}
                editable={viewMode === 'preview' && !readOnly}
                isFullWidth={true}
                fontSize={16}
                fontFamily="system-ui, -apple-system, sans-serif"
              />
            )}
          </Suspense>
        )}
      </Box>
    </Box>
  );
};

export default NoteEditorView;
