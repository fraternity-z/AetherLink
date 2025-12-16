import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  useTheme, 
  Snackbar, 
  useMediaQuery, 
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  AppBar,
  Toolbar
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Save, 
  Copy, 
  Undo2,
  Redo2,
  Compass,
  Pencil,
  MoreVertical,
  Search,
  Code,
  ArrowUp,
  ArrowDown,
  Hash,
  WrapText,
  Eye,
  Zap,
  CircleDot,
  Upload,
  Settings,
  X,
  Scissors,
  Trash2,
  SquareSlash,
  Replace,
  CopyPlus,
  CaseSensitive,
  CaseLower,
  IndentIncrease,
  IndentDecrease,
  MessageSquare,
  AlignLeft,
  Cpu,
  Maximize2
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { vscodeLight, vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { nord } from '@uiw/codemirror-theme-nord';
import { materialLight, materialDark } from '@uiw/codemirror-theme-material';
import { solarizedLight, solarizedDark } from '@uiw/codemirror-theme-solarized';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { StreamLanguage } from '@codemirror/language';
import { useBackButton } from '../../shared/hooks/useBackButton';
import { useKeyboard } from '../../shared/hooks/useKeyboard';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { setEditorZoomLevel } from '../../shared/store/settingsSlice';
import {
  SafeAreaContainer
} from '../settings/SettingComponents';

// Smali 语法定义
const smaliLanguage = StreamLanguage.define({
  token(stream) {
    // 注释
    if (stream.match(/^#.*/)) {
      return 'comment';
    }
    
    // 字符串
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) {
      return 'string';
    }
    
    // 指令 (.class, .method, .field, .end, etc.)
    if (stream.match(/^\.(class|super|source|implements|field|method|end|annotation|local|param|line|prologue|locals|registers|array-data|packed-switch|sparse-switch|catch|catchall|restart)/)) {
      return 'keyword';
    }
    
    // 访问修饰符
    if (stream.match(/\b(public|private|protected|static|final|abstract|synthetic|bridge|varargs|native|enum|interface|annotation|volatile|transient|synchronized|strictfp)\b/)) {
      return 'keyword';
    }
    
    // Dalvik 指令
    if (stream.match(/\b(invoke-virtual|invoke-super|invoke-direct|invoke-static|invoke-interface|invoke-virtual\/range|invoke-super\/range|invoke-direct\/range|invoke-static\/range|invoke-interface\/range)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(move|move\/from16|move\/16|move-wide|move-wide\/from16|move-wide\/16|move-object|move-object\/from16|move-object\/16|move-result|move-result-wide|move-result-object|move-exception)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(return-void|return|return-wide|return-object|const\/4|const\/16|const|const\/high16|const-wide\/16|const-wide\/32|const-wide|const-wide\/high16|const-string|const-string\/jumbo|const-class)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(monitor-enter|monitor-exit|check-cast|instance-of|array-length|new-instance|new-array|filled-new-array|filled-new-array\/range|fill-array-data|throw|goto|goto\/16|goto\/32)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(packed-switch|sparse-switch|cmpl-float|cmpg-float|cmpl-double|cmpg-double|cmp-long|if-eq|if-ne|if-lt|if-ge|if-gt|if-le|if-eqz|if-nez|if-ltz|if-gez|if-gtz|if-lez)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(aget|aget-wide|aget-object|aget-boolean|aget-byte|aget-char|aget-short|aput|aput-wide|aput-object|aput-boolean|aput-byte|aput-char|aput-short)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(iget|iget-wide|iget-object|iget-boolean|iget-byte|iget-char|iget-short|iput|iput-wide|iput-object|iput-boolean|iput-byte|iput-char|iput-short)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(sget|sget-wide|sget-object|sget-boolean|sget-byte|sget-char|sget-short|sput|sput-wide|sput-object|sput-boolean|sput-byte|sput-char|sput-short)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(add-int|sub-int|mul-int|div-int|rem-int|and-int|or-int|xor-int|shl-int|shr-int|ushr-int|add-long|sub-long|mul-long|div-long|rem-long|and-long|or-long|xor-long|shl-long|shr-long|ushr-long)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(add-float|sub-float|mul-float|div-float|rem-float|add-double|sub-double|mul-double|div-double|rem-double)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(neg-int|not-int|neg-long|not-long|neg-float|neg-double|int-to-long|int-to-float|int-to-double|long-to-int|long-to-float|long-to-double|float-to-int|float-to-long|float-to-double|double-to-int|double-to-long|double-to-float|int-to-byte|int-to-char|int-to-short)\b/)) {
      return 'atom';
    }
    if (stream.match(/\b(nop)\b/)) {
      return 'atom';
    }
    
    // 寄存器
    if (stream.match(/\b[vp]\d+\b/)) {
      return 'variable';
    }
    
    // 类型描述符
    if (stream.match(/L[a-zA-Z0-9_/$]+;/)) {
      return 'type';
    }
    
    // 数字
    if (stream.match(/\b-?0x[0-9a-fA-F]+\b/) || stream.match(/\b-?\d+(\.\d+)?\b/)) {
      return 'number';
    }
    
    // 标签
    if (stream.match(/:[a-zA-Z0-9_]+/)) {
      return 'tag';
    }
    
    // 其他
    stream.next();
    return null;
  }
});

// ============ 类型定义 ============
interface SmaliEditorProps {
  open: boolean;
  onClose: () => void;
  initialContent: string;
  onSave?: (newContent: string) => void;
  title?: string;
  className?: string;
  readOnly?: boolean;
}

// ============ 组件 ============
const SmaliEditor: React.FC<SmaliEditorProps> = ({
  open,
  onClose,
  initialContent,
  onSave,
  title = 'Smali 编辑器',
  className,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 从 Redux store 获取代码主题设置
  const { editorTheme, editorZoomLevel } = useAppSelector(state => state.settings);
  const dispatch = useAppDispatch();
  
  // 添加fallback值防止undefined和NaN
  const safeEditorTheme = editorTheme || 'oneDark';
  const zoomLevel = editorZoomLevel || 1.0;
  
  // 键盘适配 - 在移动端锁定键盘，避免其他组件响应
  useKeyboard({ lock: isMobile && open });

  // 状态
  const [content, setContent] = useState(initialContent);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  
  // 菜单状态
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [pencilMenuAnchor, setPencilMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [goToLineDialogOpen, setGoToLineDialogOpen] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState('');
  const [confirmCloseDialogOpen, setConfirmCloseDialogOpen] = useState(false);

  // Refs
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const saveCallbackRef = useRef(onSave);
  const contentRef = useRef(content);
  const initialContentRef = useRef(initialContent);
  const prevOpenRef = useRef(false);
  
  // 手势缩放相关
  const lastTouchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef(zoomLevel);
  const pendingZoomRef = useRef(zoomLevel);

  // 返回键处理
  const handleBack = useCallback(() => {
    if (content !== initialContent) {
      setConfirmCloseDialogOpen(true);
      return false;
    }
    onClose();
    return true;
  }, [content, initialContent, onClose]);

  // 确认关闭（放弃修改）
  const handleConfirmClose = useCallback(() => {
    setConfirmCloseDialogOpen(false);
    onClose();
  }, [onClose]);

  useBackButton(handleBack, [handleBack]);

  // 手势缩放处理
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDistanceRef.current = getDistance(e.touches);
        initialZoomRef.current = zoomLevel;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / lastTouchDistanceRef.current;
        const newZoom = Math.min(Math.max(initialZoomRef.current * scale, 0.3), 1.5);
        pendingZoomRef.current = newZoom;
        
        // 只用 CSS transform 实时预览（不更新 Redux，避免抽搐）
        const scroller = container.querySelector('.cm-scroller') as HTMLElement;
        if (scroller) {
          const scaleRatio = newZoom / initialZoomRef.current;
          scroller.style.transform = `scale(${scaleRatio})`;
          scroller.style.transformOrigin = 'top left';
        }
      }
    };

    const handleTouchEnd = () => {
      if (lastTouchDistanceRef.current !== null) {
        // 重置 CSS transform
        const scroller = container.querySelector('.cm-scroller') as HTMLElement;
        if (scroller) {
          scroller.style.transform = '';
          scroller.style.transformOrigin = '';
        }
        
        // 松手后一次性更新 Redux
        dispatch(setEditorZoomLevel(pendingZoomRef.current));
      }
      lastTouchDistanceRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoomLevel, dispatch]);

  // 保持 refs 最新
  useEffect(() => {
    saveCallbackRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    initialContentRef.current = initialContent;
  }, [initialContent]);

  // 同步 initialContent 到 content
  // 1. 对话框首次打开时重置
  // 2. initialContent 变化且用户未编辑时同步
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // 首次打开，重置内容
      setContent(initialContent);
    } else if (open && content === '' && initialContent !== '') {
      // 异步加载完成后同步
      setContent(initialContent);
    }
    prevOpenRef.current = open;
  }, [open, initialContent, content]);

  // 计算是否有修改
  const hasChanges = content !== initialContent;

  // 行数统计
  const lineCount = useMemo(() => content.split('\n').length, [content]);

  // 统一的保存逻辑
  const doSave = useCallback(async () => {
    if (readOnly) return;
    if (contentRef.current === initialContentRef.current) {
      setSnackbar({ open: true, message: '没有修改需要保存' });
      return;
    }
    if (saveCallbackRef.current) {
      setSnackbar({ open: true, message: '保存中...' });
      try {
        await saveCallbackRef.current(contentRef.current);
        // 保存成功后更新 initialContent
        initialContentRef.current = contentRef.current;
        setSnackbar({ open: true, message: '保存成功' });
      } catch (err) {
        setSnackbar({ open: true, message: '保存失败' });
      }
    } else {
      setSnackbar({ open: true, message: '保存回调未设置' });
    }
  }, [readOnly]);

  // 复制处理
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setSnackbar({ open: true, message: '已复制到剪贴板' });
    } catch (err) {
      setSnackbar({ open: true, message: '复制失败' });
    }
  }, [content]);

  // 获取编辑器视图
  const getEditorView = useCallback(() => {
    return editorRef.current?.view;
  }, []);

  // 撤销
  const handleUndo = useCallback(() => {
    const view = getEditorView();
    if (view) {
      import('@codemirror/commands').then(({ undo }) => {
        undo(view);
      });
    }
  }, [getEditorView]);

  // 重做
  const handleRedo = useCallback(() => {
    const view = getEditorView();
    if (view) {
      import('@codemirror/commands').then(({ redo }) => {
        redo(view);
      });
    }
  }, [getEditorView]);

  // 删除当前行
  const handleDeleteLine = useCallback(() => {
    const view = getEditorView();
    if (view) {
      import('@codemirror/commands').then(({ deleteLine }) => {
        deleteLine(view);
      });
    }
  }, [getEditorView]);

  // 复制当前行
  const handleCopyLine = useCallback(() => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const line = state.doc.lineAt(state.selection.main.head);
      navigator.clipboard.writeText(line.text);
      setSnackbar({ open: true, message: '已复制当前行' });
    }
  }, [getEditorView]);

  // 剪切当前行
  const handleCutLine = useCallback(() => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const line = state.doc.lineAt(state.selection.main.head);
      navigator.clipboard.writeText(line.text);
      view.dispatch({
        changes: { from: line.from, to: line.to + 1 }
      });
      setSnackbar({ open: true, message: '已剪切当前行' });
    }
  }, [getEditorView]);

  // 重复当前行
  const handleDuplicateLine = useCallback(() => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const line = state.doc.lineAt(state.selection.main.head);
      view.dispatch({
        changes: { from: line.to, insert: '\n' + line.text }
      });
    }
  }, [getEditorView]);

  // 转为大写
  const handleToUpperCase = useCallback(() => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const { from, to } = state.selection.main;
      if (from !== to) {
        const text = state.sliceDoc(from, to).toUpperCase();
        view.dispatch({ changes: { from, to, insert: text } });
      }
    }
  }, [getEditorView]);

  // 转为小写
  const handleToLowerCase = useCallback(() => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const { from, to } = state.selection.main;
      if (from !== to) {
        const text = state.sliceDoc(from, to).toLowerCase();
        view.dispatch({ changes: { from, to, insert: text } });
      }
    }
  }, [getEditorView]);

  // 增加缩进
  const handleIndent = useCallback(() => {
    const view = getEditorView();
    if (view) {
      import('@codemirror/commands').then(({ indentMore }) => {
        indentMore(view);
      });
    }
  }, [getEditorView]);

  // 减少缩进
  const handleOutdent = useCallback(() => {
    const view = getEditorView();
    if (view) {
      import('@codemirror/commands').then(({ indentLess }) => {
        indentLess(view);
      });
    }
  }, [getEditorView]);

  // 切换注释
  const handleToggleComment = useCallback(() => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const line = state.doc.lineAt(state.selection.main.head);
      const lineText = line.text;
      if (lineText.trimStart().startsWith('#')) {
        // 取消注释
        const idx = lineText.indexOf('#');
        view.dispatch({
          changes: { from: line.from + idx, to: line.from + idx + 1 }
        });
      } else {
        // 添加注释
        view.dispatch({
          changes: { from: line.from, insert: '# ' }
        });
      }
    }
  }, [getEditorView]);

  // 转到指定行
  const handleGoToLine = useCallback((lineNum: number) => {
    const view = getEditorView();
    if (view) {
      const { state } = view;
      const maxLine = state.doc.lines;
      const targetLine = Math.min(Math.max(1, lineNum), maxLine);
      const line = state.doc.line(targetLine);
      view.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true
      });
    }
  }, [getEditorView]);

  // CodeMirror 扩展（缓存）
  const extensions = useMemo(() => {
    const exts: any[] = [];

    // 1. Smali 语言支持
    exts.push(smaliLanguage);

    // 2. 只在非只读模式添加保存快捷键和缩放快捷键
    if (!readOnly) {
      exts.push(
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              document.dispatchEvent(new CustomEvent('smali-editor-save'));
              return true;
            },
            preventDefault: true,
          },
          // 缩放快捷键
          {
            key: 'Mod-+',
            run: () => {
              const newZoom = Math.min(zoomLevel + 0.1, 1.5);
              dispatch(setEditorZoomLevel(newZoom));
              setSnackbar({ open: true, message: `缩放: ${Math.round(newZoom * 100)}%` });
              return true;
            },
            preventDefault: true,
          },
          {
            key: 'Mod-=',
            run: () => {
              const newZoom = Math.min(zoomLevel + 0.1, 1.5);
              dispatch(setEditorZoomLevel(newZoom));
              setSnackbar({ open: true, message: `缩放: ${Math.round(newZoom * 100)}%` });
              return true;
            },
            preventDefault: true,
          },
          {
            key: 'Mod--',
            run: () => {
              const newZoom = Math.max(zoomLevel - 0.1, 0.3);
              dispatch(setEditorZoomLevel(newZoom));
              setSnackbar({ open: true, message: `缩放: ${Math.round(newZoom * 100)}%` });
              return true;
            },
            preventDefault: true,
          },
          {
            key: 'Mod-0',
            run: () => {
              dispatch(setEditorZoomLevel(1.0));
              setSnackbar({ open: true, message: '缩放: 100%' });
              return true;
            },
            preventDefault: true,
          },
        ])
      );
    }

    // 3. 编辑器布局样式
    exts.push(
      EditorView.theme({
        '&': {
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, Monaco, monospace',
          fontSize: `${13 * zoomLevel}px`,
          overflow: 'auto',
          lineHeight: 1.6,
          minHeight: '100%',
        },
        '.cm-content': {
          minHeight: '100%',
          padding: `${8 * zoomLevel}px 0`,
          caretColor: 'auto',
        },
        '.cm-gutters': {
          minHeight: '100%',
          fontSize: `${13 * zoomLevel}px`,
          borderRight: 'none',
        },
        '.cm-lineNumbers .cm-gutterElement': {
          paddingLeft: '8px',
          paddingRight: '4px',
          minWidth: '32px',
          textAlign: 'right',
        },
        '.cm-line': {
          paddingLeft: '8px',
          paddingRight: '8px',
        }
      })
    );

    return exts;
  }, [isMobile, readOnly, zoomLevel, dispatch]);

  // 编辑器主题
  const codeMirrorTheme = useMemo(() => {
    switch (safeEditorTheme) {
      case 'oneDark':
        return oneDark;
      case 'githubLight':
        return githubLight;
      case 'githubDark':
        return githubDark;
      case 'vscodeLight':
        return vscodeLight;
      case 'vscodeDark':
        return vscodeDark;
      case 'tokyoNight':
        return tokyoNight;
      case 'dracula':
        return dracula;
      case 'nord':
        return nord;
      case 'materialLight':
        return materialLight;
      case 'materialDark':
        return materialDark;
      case 'solarizedLight':
        return solarizedLight;
      case 'solarizedDark':
        return solarizedDark;
      case 'monokai':
        return monokai;
      default:
        return oneDark;
    }
  }, [safeEditorTheme]);

  // 保存事件监听
  useEffect(() => {
    const handleSaveEvent = () => doSave();
    document.addEventListener('smali-editor-save', handleSaveEvent);
    return () => {
      document.removeEventListener('smali-editor-save', handleSaveEvent);
    };
  }, [doSave]);

  if (!open) return null;

  return (
    <SafeAreaContainer>
      {/* MT风格工具栏 */}
      <AppBar 
        position="static" 
        elevation={0}
        className="status-bar-safe-area"
        sx={{ 
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ minHeight: '48px !important', px: 1, gap: 0.5 }}>
          {/* 左侧：侧边栏按钮 */}
          <IconButton size="small" sx={{ color: 'text.primary' }}>
            <MenuIcon size={20} />
          </IconButton>
          
          {/* 中间占位 */}
          <Box sx={{ flex: 1 }} />
          
          {/* 右侧功能按钮 */}
          {/* 导航按钮 */}
          <IconButton size="small" onClick={() => setNavDialogOpen(true)} sx={{ color: 'text.primary' }}>
            <Compass size={20} />
          </IconButton>
          
          {/* 撤销 */}
          <IconButton 
            size="small" 
            onClick={handleUndo}
            sx={{ color: 'text.primary' }}
          >
            <Undo2 size={20} />
          </IconButton>
          
          {/* 重做 */}
          <IconButton 
            size="small" 
            onClick={handleRedo}
            sx={{ color: 'text.primary' }}
          >
            <Redo2 size={20} />
          </IconButton>
          
          {/* 保存 */}
          <IconButton 
            size="small" 
            onClick={doSave}
            disabled={!hasChanges}
            sx={{ color: hasChanges ? 'primary.main' : 'text.disabled' }}
          >
            <Save size={20} />
          </IconButton>
          
          {/* 笔菜单 */}
          <IconButton 
            size="small" 
            onClick={(e) => setPencilMenuAnchor(e.currentTarget)}
            sx={{ color: 'text.primary' }}
          >
            <Pencil size={20} />
          </IconButton>
          
          {/* 三点菜单 */}
          <IconButton 
            size="small" 
            onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
            sx={{ color: 'text.primary' }}
          >
            <MoreVertical size={20} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 类名和位置信息 */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2, 
        py: 0.5, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'action.hover'
      }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {title}{hasChanges && '*'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {lineCount}:{1} | {className?.split('.').pop() || title}
        </Typography>
      </Box>

      {/* 笔菜单 */}
      <Menu
        anchorEl={pencilMenuAnchor}
        open={Boolean(pencilMenuAnchor)}
        onClose={() => setPencilMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handleCopyLine(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><Copy size={18} /></ListItemIcon>
          <ListItemText>复制行</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleCutLine(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><Scissors size={18} /></ListItemIcon>
          <ListItemText>剪切行</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteLine(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><Trash2 size={18} /></ListItemIcon>
          <ListItemText>删除行</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteLine(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><SquareSlash size={18} /></ListItemIcon>
          <ListItemText>清空行</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setPencilMenuAnchor(null)}>
          <ListItemIcon><Replace size={18} /></ListItemIcon>
          <ListItemText>替换行</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDuplicateLine(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><CopyPlus size={18} /></ListItemIcon>
          <ListItemText>重复行</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleToUpperCase(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><CaseSensitive size={18} /></ListItemIcon>
          <ListItemText>转为大写</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToLowerCase(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><CaseLower size={18} /></ListItemIcon>
          <ListItemText>转为小写</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleIndent(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><IndentIncrease size={18} /></ListItemIcon>
          <ListItemText>增加缩进</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleOutdent(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><IndentDecrease size={18} /></ListItemIcon>
          <ListItemText>减小缩进</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToggleComment(); setPencilMenuAnchor(null); }}>
          <ListItemIcon><MessageSquare size={18} /></ListItemIcon>
          <ListItemText>切换注释</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setPencilMenuAnchor(null)}>
          <ListItemIcon><AlignLeft size={18} /></ListItemIcon>
          <ListItemText>格式化代码</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setPencilMenuAnchor(null)}>
          <ListItemIcon><Cpu size={18} /></ListItemIcon>
          <ListItemText>寄存器分析</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setPencilMenuAnchor(null)}>
          <ListItemIcon><Maximize2 size={18} /></ListItemIcon>
          <ListItemText>寄存器扩充</ListItemText>
        </MenuItem>
      </Menu>

      {/* 三点菜单 */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><Search size={18} /></ListItemIcon>
          <ListItemText>搜索</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><Code size={18} /></ListItemIcon>
          <ListItemText>转成 Java</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><Hash size={18} /></ListItemIcon>
          <ListItemText>指令查询</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><ArrowUp size={18} /></ListItemIcon>
          <ListItemText>上个位置</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><ArrowDown size={18} /></ListItemIcon>
          <ListItemText>下个位置</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMoreMenuAnchor(null); setGoToLineDialogOpen(true); }}>
          <ListItemIcon><Hash size={18} /></ListItemIcon>
          <ListItemText>转到指定行</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><WrapText size={18} /></ListItemIcon>
          <ListItemText>自动换行</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><Eye size={18} /></ListItemIcon>
          <ListItemText>只读模式</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><Zap size={18} /></ListItemIcon>
          <ListItemText>流畅模式</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><CircleDot size={18} /></ListItemIcon>
          <ListItemText>指令补全</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleCopy(); setMoreMenuAnchor(null); }}>
          <ListItemIcon><Upload size={18} /></ListItemIcon>
          <ListItemText>导出</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon><Settings size={18} /></ListItemIcon>
          <ListItemText>设置</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMoreMenuAnchor(null); handleBack(); }}>
          <ListItemIcon><X size={18} /></ListItemIcon>
          <ListItemText>关闭</ListItemText>
        </MenuItem>
      </Menu>

      {/* 导航对话框 */}
      <Dialog open={navDialogOpen} onClose={() => setNavDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          导航
          <IconButton size="small" onClick={() => setNavDialogOpen(false)}>
            <Search size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'action.selected', borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                <Box sx={{ width: 24, height: 24, bgcolor: '#4CAF50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>C</Typography>
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={title} 
                secondary={className}
                primaryTypographyProps={{ fontWeight: 'medium' }}
                secondaryTypographyProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavDialogOpen(false)}>切换</Button>
          <Button onClick={() => setNavDialogOpen(false)}>设置</Button>
          <Button onClick={() => setNavDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 转到指定行对话框 */}
      <Dialog open={goToLineDialogOpen} onClose={() => setGoToLineDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>转到指定行</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <input
              type="number"
              value={goToLineValue}
              onChange={(e) => setGoToLineValue(e.target.value)}
              placeholder={`1 - ${lineCount}`}
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const num = parseInt(goToLineValue);
                  if (!isNaN(num)) {
                    handleGoToLine(num);
                    setGoToLineDialogOpen(false);
                    setGoToLineValue('');
                  }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoToLineDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained"
            onClick={() => {
              const num = parseInt(goToLineValue);
              if (!isNaN(num)) {
                handleGoToLine(num);
                setGoToLineDialogOpen(false);
                setGoToLineValue('');
              }
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 确认关闭对话框 */}
      <Dialog open={confirmCloseDialogOpen} onClose={() => setConfirmCloseDialogOpen(false)}>
        <DialogTitle>确认关闭</DialogTitle>
        <DialogContent>
          <Typography>有未保存的修改，确定要关闭吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCloseDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleConfirmClose}>
            放弃修改
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑器 */}
      <Box 
        ref={editorContainerRef}
        sx={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: 'transparent',
          touchAction: 'pan-y pinch-zoom',
        }}
      >
        <CodeMirror
          ref={editorRef}
          value={content}
          onChange={setContent}
          height="100%"
          style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
          theme={codeMirrorTheme}
          extensions={extensions}
          readOnly={readOnly}
          autoFocus={!isMobile}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            rectangularSelection: true,
            crosshairCursor: false,
            highlightSelectionMatches: true,
            searchKeymap: true,
          }}
        />
      </Box>

      {/* 底部状态栏 */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          pb: 'calc(12px + var(--content-bottom-padding, 0px))'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          SMALI • {lineCount} 行 {hasChanges && '• 已修改'}
        </Typography>
        
        {/* 缩放控制按钮组 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button 
              onClick={() => {
                const newZoom = Math.max(zoomLevel - 0.1, 0.3);
                dispatch(setEditorZoomLevel(newZoom));
              }}
              sx={{ minWidth: '32px', px: 1 }}
            >
              -
            </Button>
            <Button 
              disabled 
              sx={{ 
                minWidth: '48px',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: 'text.primary',
                fontWeight: 'medium',
                fontSize: '0.75rem'
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </Button>
            <Button 
              onClick={() => {
                const newZoom = Math.min(zoomLevel + 0.1, 1.5);
                dispatch(setEditorZoomLevel(newZoom));
              }}
              sx={{ minWidth: '32px', px: 1 }}
            >
              +
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </SafeAreaContainer>
  );
};

export default SmaliEditor;
