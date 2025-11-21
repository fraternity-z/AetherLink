import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  alpha,
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  CircularProgress
} from '@mui/material';
import { ArrowLeft as ArrowBackIcon, Save } from 'lucide-react';
import { simpleNoteService } from '../../shared/services/notes/SimpleNoteService';
import { toastManager } from '../../components/EnhancedToast';
import { NoteEditorView } from '../../components/NoteEditor';

const NoteEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const fileName = searchParams.get('name');
  const from = searchParams.get('from'); // 获取来源参数

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 根据来源决定返回路径
  const getBackPath = useCallback(() => {
    return from === 'chat' ? '/chat' : '/settings/notes';
  }, [from]);

  useEffect(() => {
    if (!filePath) {
      toastManager.error('未指定文件路径', '错误');
      navigate(getBackPath());
      return;
    }

    loadFile();
  }, [filePath, getBackPath]);

  const loadFile = async () => {
    if (!filePath) return;

    setLoading(true);
    try {
      const fileContent = await simpleNoteService.readNote(filePath);
      setContent(fileContent);
    } catch (error) {
      console.error('读取文件失败:', error);
      toastManager.error('读取文件失败', '错误');
      navigate(getBackPath());
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!filePath || saving) return;

    setSaving(true);
    try {
      await simpleNoteService.saveNote(filePath, content);
      setHasUnsavedChanges(false);
      toastManager.success('保存成功', '成功');
    } catch (error) {
      console.error('保存失败:', error);
      toastManager.error('保存失败', '错误');
    } finally {
      setSaving(false);
    }
  }, [filePath, content, saving]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  const handleBack = useCallback(() => {
    const backPath = getBackPath();
    if (hasUnsavedChanges) {
      if (window.confirm('有未保存的更改，确定要离开吗？')) {
        navigate(backPath);
      }
    } else {
      navigate(backPath);
    }
  }, [hasUnsavedChanges, navigate, getBackPath]);

  // 自动保存（可选）
  useEffect(() => {
    if (!hasUnsavedChanges || !filePath) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // 2秒后自动保存

    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, filePath, handleSave]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: (theme) =>
          theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.02)
            : alpha(theme.palette.background.default, 0.9)
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} aria-label="back" sx={{ color: 'primary.main', mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {fileName || '编辑笔记'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasUnsavedChanges && (
              <Typography variant="caption" color="warning.main" sx={{ mr: 1 }}>
                未保存
              </Typography>
            )}
            <IconButton
              color="primary"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              <Save size={20} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', mt: 8 }}>
        <NoteEditorView
          content={content}
          onContentChange={handleContentChange}
          fileName={fileName || '未命名笔记'}
          readOnly={false}
        />
      </Box>
    </Box>
  );
};

export default NoteEditor;
