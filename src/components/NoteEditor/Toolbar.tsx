import React from 'react';
import { Box, IconButton, Divider, Tooltip } from '@mui/material';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Minus,
  Undo,
  Redo
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const toolbarButtons = [
    {
      icon: <Bold size={18} />,
      label: '粗体',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold')
    },
    {
      icon: <Italic size={18} />,
      label: '斜体',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic')
    },
    {
      icon: <UnderlineIcon size={18} />,
      label: '下划线',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline')
    },
    {
      icon: <Strikethrough size={18} />,
      label: '删除线',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike')
    },
    { divider: true },
    {
      icon: <Heading1 size={18} />,
      label: '标题 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 })
    },
    {
      icon: <Heading2 size={18} />,
      label: '标题 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 })
    },
    {
      icon: <Heading3 size={18} />,
      label: '标题 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 })
    },
    { divider: true },
    {
      icon: <List size={18} />,
      label: '无序列表',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList')
    },
    {
      icon: <ListOrdered size={18} />,
      label: '有序列表',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList')
    },
    { divider: true },
    {
      icon: <Quote size={18} />,
      label: '引用',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote')
    },
    {
      icon: <Code size={18} />,
      label: '行内代码',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code')
    },
    {
      icon: <CodeSquare size={18} />,
      label: '代码块',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock')
    },
    {
      icon: <Minus size={18} />,
      label: '分割线',
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: () => false
    },
    { divider: true },
    {
      icon: <Undo size={18} />,
      label: '撤销',
      action: () => editor.chain().focus().undo().run(),
      isActive: () => false,
      isDisabled: () => !editor.can().undo()
    },
    {
      icon: <Redo size={18} />,
      label: '重做',
      action: () => editor.chain().focus().redo().run(),
      isActive: () => false,
      isDisabled: () => !editor.can().redo()
    }
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        flexWrap: 'wrap'
      }}
    >
      {toolbarButtons.map((button, index) => {
        if ('divider' in button && button.divider) {
          return (
            <Divider
              key={`divider-${index}`}
              orientation="vertical"
              flexItem
              sx={{ mx: 0.5, height: 24, alignSelf: 'center' }}
            />
          );
        }

        const isActive = button.isActive?.() || false;
        const isDisabled = button.isDisabled?.() || false;

        return (
          <Tooltip key={index} title={button.label} arrow placement="top">
            <span>
              <IconButton
                size="small"
                onClick={button.action}
                disabled={isDisabled}
                sx={{
                  color: isActive ? 'primary.main' : 'text.secondary',
                  backgroundColor: isActive ? 'action.selected' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? 'action.selected' : 'action.hover'
                  },
                  '&.Mui-disabled': {
                    color: 'action.disabled'
                  }
                }}
              >
                {button.icon}
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default Toolbar;
