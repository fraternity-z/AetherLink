import { useCallback, useRef, useState, useEffect } from 'react';
import { Box, Typography, Button, ButtonGroup } from '@mui/material';
import { FileText, Eye, Code2 } from 'lucide-react';
import RichEditor from './RichEditor';
import type { RichEditorRef, EditorViewMode } from './types';
import { countCharacters } from './utils/markdown';

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
  const [viewMode, setViewMode] = useState<EditorViewMode>('preview');
  const [charCount, setCharCount] = useState(0);

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
              onClick={() => setViewMode('preview')}
              variant={viewMode === 'preview' ? 'contained' : 'outlined'}
              startIcon={<Eye size={14} />}
              disabled={readOnly}
            >
              预览
            </Button>
            <Button
              onClick={() => setViewMode('source')}
              variant={viewMode === 'source' ? 'contained' : 'outlined'}
              startIcon={<Code2 size={14} />}
            >
              源码
            </Button>
            <Button
              onClick={() => setViewMode('read')}
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
          <Box
            component="textarea"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            readOnly={readOnly}
            sx={{
              flex: 1,
              p: 2,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              backgroundColor: 'background.paper',
              color: 'text.primary',
              '&:focus': {
                backgroundColor: 'background.paper'
              }
            }}
          />
        ) : (
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
      </Box>
    </Box>
  );
};

export default NoteEditorView;
