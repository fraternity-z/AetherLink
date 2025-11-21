import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import type { SuggestionProps } from '@tiptap/suggestion'
import type { Command } from './command'
import './CommandListPopover.css'

export interface CommandListPopoverProps extends SuggestionProps<Command> {
  ref?: React.RefObject<CommandListPopoverRef | null>
}

export interface CommandListPopoverRef extends SuggestionProps<Command> {
  updateSelectedIndex: (index: number) => void
  selectCurrent: () => void
  onKeyDown: (event: KeyboardEvent) => boolean
}

const CommandListPopover = ({
  ref,
  ...props
}: SuggestionProps<Command> & { ref?: React.RefObject<CommandListPopoverRef | null> }) => {
  const { items, command } = props
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef<boolean>(true)
  const theme = useTheme()

  useEffect(() => {
    shouldAutoScrollRef.current = true
    setInternalSelectedIndex(0)
  }, [items])

  useEffect(() => {
    if (listRef.current && items.length > 0 && shouldAutoScrollRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${internalSelectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [internalSelectedIndex, items.length])

  const selectItem = useCallback(
    (index: number) => {
      const item = props.items[index]
      if (item) {
        command({ id: item.id, label: item.title })
      }
    },
    [props.items, command]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!items.length) return false

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          shouldAutoScrollRef.current = true
          setInternalSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
          return true

        case 'ArrowDown':
          event.preventDefault()
          shouldAutoScrollRef.current = true
          setInternalSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
          return true

        case 'Enter':
          if (event.shiftKey) {
            return false
          }
          event.preventDefault()
          if (items[internalSelectedIndex]) {
            selectItem(internalSelectedIndex)
          }
          return true

        case 'Escape':
          event.preventDefault()
          return true

        default:
          return false
      }
    },
    [items, internalSelectedIndex, selectItem]
  )

  useImperativeHandle(
    ref,
    () => ({
      ...props,
      updateSelectedIndex: (index: number) => {
        shouldAutoScrollRef.current = true
        setInternalSelectedIndex(index)
      },
      selectCurrent: () => selectItem(internalSelectedIndex),
      onKeyDown: handleKeyDown
    }),
    [handleKeyDown, props, internalSelectedIndex, selectItem]
  )

  const colors = useMemo(() => {
    const isDark = theme.palette.mode === 'dark'
    return {
      background: isDark ? theme.palette.background.paper : '#ffffff',
      border: isDark ? theme.palette.divider : '#e1e5e9',
      selectedBackground: isDark ? theme.palette.action.hover : '#f0f0f0',
      boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
    }
  }, [theme])

  const handleItemMouseEnter = useCallback((index: number) => {
    shouldAutoScrollRef.current = false
    setInternalSelectedIndex(index)
  }, [])

  return (
    <Box
      ref={listRef}
      className="command-list-popover"
      sx={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow: colors.boxShadow,
        maxHeight: '280px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '240px',
        maxWidth: '320px'
      }}
    >
      {items.length === 0 ? (
        <Box sx={{ padding: '12px', color: 'text.secondary', textAlign: 'center', fontSize: '14px' }}>
          未找到命令
        </Box>
      ) : (
        items.map((item, index) => (
          <Box
            key={item.id}
            data-index={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => handleItemMouseEnter(index)}
            sx={{
              padding: '10px 16px',
              cursor: 'pointer',
              backgroundColor: index === internalSelectedIndex ? colors.selectedBackground : 'transparent',
              border: 'none',
              borderRadius: '4px',
              margin: '2px',
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                backgroundColor: colors.selectedBackground
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <Box
                sx={{
                  width: '20px',
                  height: '20px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}
              >
                <item.icon size={16} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: 'text.primary'
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: 'text.secondary'
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))
      )}
    </Box>
  )
}

CommandListPopover.displayName = 'CommandListPopover'

export default CommandListPopover
