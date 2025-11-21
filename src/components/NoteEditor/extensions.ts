import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import type { Extensions } from '@tiptap/react';
import { commandSuggestion } from './command';

/**
 * 获取 TipTap 编辑器扩展配置
 */
export function getEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6]
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'code-block'
        }
      },
      bulletList: {
        HTMLAttributes: {
          class: 'bullet-list'
        }
      },
      orderedList: {
        HTMLAttributes: {
          class: 'ordered-list'
        }
      },
      blockquote: {
        HTMLAttributes: {
          class: 'blockquote'
        }
      },
      horizontalRule: {
        HTMLAttributes: {
          class: 'horizontal-rule'
        }
      }
    }),
    Underline,
    Typography,
    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'editor-image'
      }
    }),
    // 斜杠命令菜单支持
    Mention.configure({
      HTMLAttributes: {
        class: 'mention'
      },
      suggestion: commandSuggestion
    })
  ];
}
