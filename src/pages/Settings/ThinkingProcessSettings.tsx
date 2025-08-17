import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  IconButton,
  AppBar,
  Toolbar,
  Divider,
  alpha,
  FormControlLabel,
  Switch,
  FormGroup
} from '@mui/material';
import { ArrowLeft, Info, Brain, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { updateSettings } from '../../shared/store/settingsSlice';
import { ThinkingDisplayStyle } from '../../components/message/blocks/ThinkingBlock';
import ThinkingBlock from '../../components/message/blocks/ThinkingBlock';
import type { ThinkingMessageBlock } from '../../shared/types/newMessage';
import { MessageBlockType, MessageBlockStatus } from '../../shared/types/newMessage';

const ThinkingProcessSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  // 获取思考过程相关设置
  const thinkingDisplayStyle = ThinkingDisplayStyle.STREAM; // 仅保留流式文字
  const thoughtAutoCollapse = (settings as any).thoughtAutoCollapse !== false;

  // 创建预览用的思考块数据
  const previewThinkingBlock: ThinkingMessageBlock = {
    id: 'preview-thinking-block',
    messageId: 'preview-message',
    type: MessageBlockType.THINKING,
    createdAt: new Date(Date.now() - 3500).toISOString(),
    updatedAt: new Date().toISOString(),
    status: MessageBlockStatus.SUCCESS,
    content: `用户询问了关于"如何提高工作效率"的问题。我需要从多个角度来分析这个问题：

首先，我应该考虑工作效率的定义。工作效率通常指在单位时间内完成的工作量和质量。提高工作效率可以从以下几个方面入手：

1. 时间管理
- 使用番茄工作法，将工作分解为25分钟的专注时段
- 制定优先级清单，先处理重要且紧急的任务
- 避免多任务处理，专注于一件事情

2. 工作环境优化
- 保持工作区域整洁有序
- 减少干扰因素，如关闭不必要的通知
- 确保有良好的照明和舒适的座椅

3. 技能提升
- 学习使用效率工具和软件
- 提高专业技能，减少完成任务所需时间
- 培养良好的沟通能力

4. 身心健康
- 保证充足的睡眠
- 定期运动，保持身体健康
- 学会放松和减压

我觉得这个回答涵盖了工作效率的主要方面，既实用又全面。用户应该能够从中找到适合自己的方法。`,
    thinking_millsec: 3500
  };

  const handleBack = () => {
    navigate('/settings/appearance');
  };

  // 事件处理函数
  const handleThinkingStyleChange = () => {
    // 仅单一样式，无需处理
  };

  const handleThoughtAutoCollapseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      thoughtAutoCollapse: event.target.checked
    }));
  };

  // 获取样式显示名称的辅助函数
  const getStyleDisplayName = () => '🌊 流式文字';

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.02)
        : alpha(theme.palette.background.default, 0.9),
    }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowLeft />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            思考过程设置
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: { xs: 1, sm: 2 },
          mt: 8,
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px' },
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* 思考过程显示设置 */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Brain size={20} style={{ marginRight: 8, color: '#9333EA' }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                思考过程显示
              </Typography>
              <Tooltip title="配置AI思考过程的显示方式和行为">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Info size={16} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              自定义AI思考过程的显示方式和自动折叠行为
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>显示样式</InputLabel>
              <Select value={thinkingDisplayStyle} onChange={handleThinkingStyleChange} label="显示样式" disabled>
                <MenuItem value={ThinkingDisplayStyle.STREAM}>🌊 流式文字（逐字显示）</MenuItem>
              </Select>
            </FormControl>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={thoughtAutoCollapse}
                    onChange={handleThoughtAutoCollapseChange}
                  />
                }
                label="思考完成后自动折叠"
              />
            </FormGroup>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.5 }}>
              当前系统仅保留 <strong>流式文字（逐字显示）</strong> 思考过程展示方式，其它样式已移除。
            </Typography>
          </Box>
        </Paper>

        {/* 实时预览组件 */}
  {true && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'rgba(0,0,0,0.01)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Eye size={20} style={{ marginRight: 8, color: '#9333EA' }} />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.1rem' }
                  }}
                >
                  实时预览
                </Typography>
                <Tooltip title="预览当前选择的思考过程显示样式">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Info size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                实时查看当前设置下的思考过程显示效果
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                当前样式：<strong>{getStyleDisplayName()}</strong>
              </Typography>

              {/* 预览思考块 */}
              <Box sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                bgcolor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(0,0,0,0.01)'
              }}>
                <ThinkingBlock block={previewThinkingBlock} />
              </Box>
            </Box>
          </Paper>
        )}

        {/* 底部间距 */}
        <Box sx={{ height: '20px' }} />
      </Box>
    </Box>
  );
};

export default ThinkingProcessSettings;
