import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme
} from '@mui/material';
import { useTranslation } from '../../i18n';

interface MessageBubblePreviewProps {
  customBubbleColors: {
    userBubbleColor?: string;
    userTextColor?: string;
    aiBubbleColor?: string;
    aiTextColor?: string;
  };
  messageActionMode: 'bubbles' | 'toolbar';
  showMicroBubbles: boolean;
  // 新增宽度设置props
  messageBubbleMinWidth?: number;
  messageBubbleMaxWidth?: number;
  userMessageMaxWidth?: number;
  // 新增头像和名称显示props
  showUserAvatar?: boolean;
  showUserName?: boolean;
  showModelAvatar?: boolean;
  showModelName?: boolean;
  // 新增隐藏气泡props
  hideUserBubble?: boolean;
  hideAIBubble?: boolean;
}

const MessageBubblePreview: React.FC<MessageBubblePreviewProps> = ({
  customBubbleColors,
  messageActionMode,
  showMicroBubbles,
  messageBubbleMinWidth = 50,
  messageBubbleMaxWidth = 99,
  userMessageMaxWidth = 80,
  showUserAvatar = true,
  showUserName = true,
  showModelAvatar = true,
  showModelName = true,
  hideUserBubble = false,
  hideAIBubble = false
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // 计算实际使用的颜色 - 使用 CSS Variables 作为默认值
  const actualUserBubbleColor = customBubbleColors.userBubbleColor || 
    getComputedStyle(document.documentElement).getPropertyValue('--theme-msg-user-bg').trim() ||
    '#1976d2';
  const actualUserTextColor = customBubbleColors.userTextColor || 
    getComputedStyle(document.documentElement).getPropertyValue('--theme-text-primary').trim() ||
    '#ffffff';
  const actualAiBubbleColor = customBubbleColors.aiBubbleColor || 
    getComputedStyle(document.documentElement).getPropertyValue('--theme-msg-ai-bg').trim() ||
    '#f5f5f5';
  const actualAiTextColor = customBubbleColors.aiTextColor || 
    getComputedStyle(document.documentElement).getPropertyValue('--theme-text-primary').trim() ||
    '#333333';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        minHeight: '300px'
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        {t('settings.appearance.messageBubble.preview.title')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 用户消息预览 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'flex-start',
            gap: 1,
            width: '100%',
            maxWidth: `${userMessageMaxWidth}%`
          }}>
            {showUserAvatar && (
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '25%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                  {t('settings.appearance.messageBubble.preview.userInitial')}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {showUserName && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.85rem',
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    lineHeight: 1.2
                  }}
                >
                  {t('settings.appearance.messageBubble.preview.userName')}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: theme.palette.text.secondary,
                  lineHeight: 1,
                  marginTop: showUserName ? '2px' : 0
                }}
              >
                {t('settings.appearance.messageBubble.preview.userSampleTime')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            position: 'relative',
            maxWidth: `${userMessageMaxWidth}%`,
            minWidth: `${messageBubbleMinWidth}%`,
            alignSelf: 'flex-end'
          }}>
            <Paper
              sx={{
                paddingTop: 1.5,
                paddingBottom: 1.5,
                paddingLeft: 1.5,
                paddingRight: messageActionMode === 'bubbles' ? 3 : 1.5,
                backgroundColor: hideUserBubble ? 'transparent' : actualUserBubbleColor,
                color: actualUserTextColor,
                borderRadius: hideUserBubble ? 0 : '12px',
                border: 'none',
                boxShadow: 'none',
                position: 'relative',
                maxWidth: '100%'
              }}
            >
              <Typography variant="body1" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                {t('settings.appearance.messageBubble.preview.userSampleText')}
              </Typography>

              {messageActionMode === 'toolbar' && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  opacity: 0.8
                }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualUserTextColor,
                      opacity: 0.6
                    }} />
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualUserTextColor,
                      opacity: 0.6
                    }} />
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualUserTextColor,
                      opacity: 0.6
                    }} />
                  </Box>
                </Box>
              )}
            </Paper>

            {messageActionMode === 'bubbles' && (
              <Box sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 14,
                height: 14,
                borderRadius: '2px',
                backgroundColor: actualUserTextColor,
                opacity: 0.6
              }} />
            )}
          </Box>
        </Box>

        {/* AI消息预览 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            width: '100%',
            maxWidth: `${messageBubbleMaxWidth}%`
          }}>
            {showModelAvatar && (
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '25%',
                backgroundColor: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'white'
              }}>
                {t('settings.appearance.messageBubble.preview.aiInitial')}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {showModelName && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.85rem',
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    lineHeight: 1.2
                  }}
                >
                  {t('settings.appearance.messageBubble.preview.aiName')}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: theme.palette.text.secondary,
                  lineHeight: 1,
                  marginTop: showModelName ? '2px' : 0
                }}
              >
                {t('settings.appearance.messageBubble.preview.aiSampleTime')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            position: 'relative',
            maxWidth: `${messageBubbleMaxWidth}%`,
            minWidth: `${messageBubbleMinWidth}%`,
            alignSelf: 'flex-start'
          }}>
            <Paper
              sx={{
                paddingTop: 1.5,
                paddingBottom: 1.5,
                paddingLeft: 1.5,
                paddingRight: messageActionMode === 'bubbles' ? 3 : 1.5,
                backgroundColor: hideAIBubble ? 'transparent' : actualAiBubbleColor,
                color: actualAiTextColor,
                borderRadius: hideAIBubble ? 0 : '12px',
                border: 'none',
                boxShadow: 'none',
                position: 'relative',
                maxWidth: '100%'
              }}
            >
              <Typography variant="body1" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                {t('settings.appearance.messageBubble.preview.aiSampleText')}
              </Typography>

              {messageActionMode === 'toolbar' && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  opacity: 0.8
                }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualAiTextColor,
                      opacity: 0.6
                    }} />
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualAiTextColor,
                      opacity: 0.6
                    }} />
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualAiTextColor,
                      opacity: 0.6
                    }} />
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: actualAiTextColor,
                      opacity: 0.6
                    }} />
                  </Box>
                </Box>
              )}
            </Paper>

            {messageActionMode === 'bubbles' && (
              <>
                <Box sx={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 14,
                  height: 14,
                  borderRadius: '2px',
                  backgroundColor: actualAiTextColor,
                  opacity: 0.6
                }} />

                {showMicroBubbles && (
                  <Box sx={{
                    position: 'absolute',
                    top: -22,
                    right: 0,
                    display: 'flex',
                    gap: '5px'
                  }}>
                    <Box sx={{
                      width: 20,
                      height: 12,
                      borderRadius: '6px',
                      backgroundColor: actualAiBubbleColor,
                      opacity: 0.8
                    }} />
                    <Box sx={{
                      width: 16,
                      height: 12,
                      borderRadius: '6px',
                      backgroundColor: actualAiBubbleColor,
                      opacity: 0.8
                    }} />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {t('settings.appearance.messageBubble.preview.modeLabel', {
              mode: messageActionMode === 'bubbles'
                ? t('settings.appearance.messageBubble.preview.mode.bubbles')
                : t('settings.appearance.messageBubble.preview.mode.toolbar')
            })}
            {messageActionMode === 'bubbles' && !showMicroBubbles && ` ${t('settings.appearance.messageBubble.preview.microBubblesHidden')}`}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MessageBubblePreview;
