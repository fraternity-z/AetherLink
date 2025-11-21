import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { FileText, Folder, ChevronRight } from 'lucide-react';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { simpleNoteService } from '../shared/services/notes/SimpleNoteService';
import type { NoteFile } from '../shared/types/note';
import styled from '@emotion/styled';

interface NoteSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectNote: (path: string, content: string, fileName: string) => void;
}

// 样式组件定义
const NotePanelBody = styled.div<{ theme?: any }>`
  padding: 5px 0;
  background-color: ${props => props.theme?.palette?.background?.paper};
`;

const NotePanelList = styled.div<{ theme?: any }>`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 3px;
  }
`;

const NotePanelItem = styled.div<{ theme?: any }>`
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 5px 1px 5px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'};
  }

  &.focused {
    background-color: ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
  }
`;

const NotePanelItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const NotePanelItemIcon = styled.span<{ theme?: any }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme?.palette?.text?.secondary || '#666'};
  flex-shrink: 0;
`;

const NotePanelItemLabel = styled.span`
  font-size: 14px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const NotePanelItemRight = styled.div<{ theme?: any }>`
  display: flex;
  align-items: center;
  color: ${props => props.theme?.palette?.text?.secondary || '#666'};
  flex-shrink: 0;
`;

const NotePanelFooter = styled.div<{ theme?: any }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 6px;
  border-top: 1px solid ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
`;

const NotePanelFooterTitle = styled.div<{ theme?: any }>`
  font-size: 12px;
  color: ${props => props.theme?.palette?.text?.secondary || '#666'};
`;

const NotePanelFooterTips = styled.div<{ theme?: any }>`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: ${props => props.theme?.palette?.text?.secondary || '#666'};
`;

const Breadcrumb = styled.div<{ theme?: any }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-size: 13px;
  color: ${props => props.theme?.palette?.text?.secondary || '#666'};
  border-bottom: 1px solid ${props => props.theme?.palette?.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
`;

const BreadcrumbItem = styled.span<{ clickable?: boolean; theme?: any }>`
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  color: ${props => props.clickable ? props.theme?.palette?.primary?.main : 'inherit'};
  
  &:hover {
    text-decoration: ${props => props.clickable ? 'underline' : 'none'};
  }
`;

const NoteSelector: React.FC<NoteSelectorProps> = ({
  open,
  onClose,
  onSelectNote
}) => {
  const theme = useTheme();
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const panelRef = useRef<HTMLDivElement>(null);

  // 加载笔记列表
  const loadNotes = useCallback(async (path: string = '') => {
    setLoading(true);
    try {
      const items = await simpleNoteService.listNotes(path);
      setNotes(items);
    } catch (error) {
      console.error('加载笔记列表失败:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadNotes(currentPath);
      setSelectedIndex(-1);
    }
  }, [open, currentPath, loadNotes]);

  // 处理文件/文件夹点击
  const handleItemClick = async (item: NoteFile) => {
    if (item.isDirectory) {
      // 进入文件夹
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      setCurrentPath(newPath);
    } else {
      // 选择文件
      try {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        const content = await simpleNoteService.readNote(fullPath);
        onSelectNote(fullPath, content, item.name);
        onClose();
      } catch (error) {
        console.error('读取笔记失败:', error);
      }
    }
  };

  // 返回上级目录
  const handleGoBack = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  // 面包屑导航
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return ['根目录'];
    return ['根目录', ...currentPath.split('/')];
  }, [currentPath]);

  // 键盘导航
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (currentPath) {
          handleGoBack();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < notes.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : notes.length - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleItemClick(notes[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, selectedIndex, notes, currentPath]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70vh',
          bgcolor: 'background.paper'
        }
      }}
    >
      <Box sx={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        {/* 拖拽指示器 */}
        <Box sx={{ pt: 1, pb: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: (theme) => alpha(theme.palette.text.primary, 0.2),
              borderRadius: 999
            }}
          />
        </Box>

        {/* 面包屑导航 */}
        <Breadcrumb theme={theme}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight size={14} />}
              <BreadcrumbItem
                clickable={index < breadcrumbs.length - 1}
                theme={theme}
                onClick={() => {
                  if (index === 0) {
                    setCurrentPath('');
                  } else if (index < breadcrumbs.length - 1) {
                    const newPath = breadcrumbs.slice(1, index + 1).join('/');
                    setCurrentPath(newPath);
                  }
                }}
              >
                {crumb}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </Breadcrumb>

        <NotePanelBody ref={panelRef} theme={theme}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notes.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                此文件夹为空
              </Typography>
            </Box>
          ) : (
            <NotePanelList theme={theme}>
              {notes.map((note, index) => (
                <NotePanelItem
                  key={note.id}
                  theme={theme}
                  className={selectedIndex === index ? 'focused' : ''}
                  onClick={() => handleItemClick(note)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <NotePanelItemLeft>
                    <NotePanelItemIcon theme={theme}>
                      {note.isDirectory ? (
                        <Folder size={18} color="#FBC02D" />
                      ) : (
                        <FileText size={18} color="#42A5F5" />
                      )}
                    </NotePanelItemIcon>
                    <NotePanelItemLabel>{note.name}</NotePanelItemLabel>
                  </NotePanelItemLeft>
                  {note.isDirectory && (
                    <NotePanelItemRight theme={theme}>
                      <ChevronRight size={16} />
                    </NotePanelItemRight>
                  )}
                </NotePanelItem>
              ))}
            </NotePanelList>
          )}

          <NotePanelFooter theme={theme}>
            <NotePanelFooterTitle theme={theme}>选择笔记</NotePanelFooterTitle>
            <NotePanelFooterTips theme={theme}>
              <span>ESC {currentPath ? '返回' : '关闭'}</span>
              <span>▲▼ 选择</span>
              <span>↩︎ 确认</span>
            </NotePanelFooterTips>
          </NotePanelFooter>
        </NotePanelBody>
      </Box>
    </Drawer>
  );
};

export default NoteSelector;
