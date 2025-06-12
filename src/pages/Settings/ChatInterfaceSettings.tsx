import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  FormGroup,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
  Slider,
  AppBar,
  Toolbar,
  Divider,
  alpha
} from '@mui/material';
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { updateSettings } from '../../shared/store/settingsSlice';
import { ThinkingDisplayStyle } from '../../components/message/blocks/ThinkingBlock';

const ChatInterfaceSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  // 获取所有设置项
  const thinkingDisplayStyle = (settings as any).thinkingDisplayStyle || ThinkingDisplayStyle.COMPACT;
  const thoughtAutoCollapse = (settings as any).thoughtAutoCollapse !== false;
  const multiModelDisplayStyle = (settings as any).multiModelDisplayStyle || 'horizontal';
  const showToolDetails = (settings as any).showToolDetails !== false;
  const showCitationDetails = (settings as any).showCitationDetails !== false;
  const toolbarDisplayStyle = settings.toolbarDisplayStyle || 'both';
  const inputBoxStyle = settings.inputBoxStyle || 'default';
  const inputLayoutStyle = (settings as any).inputLayoutStyle || 'default';
  const showSystemPromptBubble = settings.showSystemPromptBubble !== false;
  const showUserAvatar = settings.showUserAvatar !== false;
  const showUserName = settings.showUserName !== false;
  const showModelAvatar = settings.showModelAvatar !== false;
  const showModelName = settings.showModelName !== false;
  const messageBubbleMinWidth = settings.messageBubbleMinWidth || 50;
  const messageBubbleMaxWidth = settings.messageBubbleMaxWidth || 99;
  const userMessageMaxWidth = settings.userMessageMaxWidth || 80;

  const handleBack = () => {
    navigate('/settings/appearance');
  };

  // 事件处理函数
  const handleThinkingStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      thinkingDisplayStyle: event.target.value
    }));
  };

  const handleThoughtAutoCollapseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      thoughtAutoCollapse: event.target.checked
    }));
  };

  const handleMultiModelDisplayStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      multiModelDisplayStyle: event.target.value
    }));
  };

  const handleShowToolDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showToolDetails: event.target.checked
    }));
  };

  const handleShowCitationDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showCitationDetails: event.target.checked
    }));
  };

  const handleToolbarStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      toolbarDisplayStyle: event.target.value
    }));
  };

  const handleInputBoxStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      inputBoxStyle: event.target.value
    }));
  };

  const handleInputLayoutStyleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      inputLayoutStyle: event.target.value
    }));
  };

  const handleSystemPromptBubbleChange = (event: { target: { value: any } }) => {
    dispatch(updateSettings({
      showSystemPromptBubble: event.target.value === 'show'
    }));
  };

  const handleMessageBubbleMinWidthChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      messageBubbleMinWidth: newValue as number
    }));
  };

  const handleMessageBubbleMaxWidthChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      messageBubbleMaxWidth: newValue as number
    }));
  };

  const handleUserMessageMaxWidthChange = (_event: Event, newValue: number | number[]) => {
    dispatch(updateSettings({
      userMessageMaxWidth: newValue as number
    }));
  };

  // 头像和名称显示设置的事件处理函数
  const handleShowUserAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showUserAvatar: event.target.checked
    }));
  };

  const handleShowUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showUserName: event.target.checked
    }));
  };

  const handleShowModelAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showModelAvatar: event.target.checked
    }));
  };

  const handleShowModelNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({
      showModelName: event.target.checked
    }));
  };

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
            <ArrowLeft size={20} />
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
            聊天界面设置
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
              <Select
                value={thinkingDisplayStyle}
                onChange={handleThinkingStyleChange}
                label="显示样式"
                MenuProps={{
                  disableAutoFocus: true,
                  disableRestoreFocus: true
                }}
              >
                <MenuItem value={ThinkingDisplayStyle.COMPACT}>紧凑模式（可折叠）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.FULL}>完整模式（始终展开）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.MINIMAL}>极简模式（小图标）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.BUBBLE}>气泡模式（聊天气泡）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.TIMELINE}>时间线模式（左侧指示器）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.CARD}>卡片模式（突出显示）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.INLINE}>内联模式（嵌入消息）</MenuItem>
                <MenuItem value={ThinkingDisplayStyle.HIDDEN}>隐藏（不显示思考过程）</MenuItem>
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

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: 1.5
              }}
            >
              设置AI助手思考过程的显示方式：
              <br />• 紧凑模式：标准卡片样式，可折叠展开
              <br />• 完整模式：始终展开显示全部内容
              <br />• 极简模式：只显示小图标，悬停查看内容
              <br />• 气泡模式：类似聊天气泡的圆润设计
              <br />• 时间线模式：左侧带时间线指示器
              <br />• 卡片模式：突出的渐变卡片设计
              <br />• 内联模式：嵌入在消息中的紧凑显示
              <br />• 隐藏：完全不显示思考过程
            </Typography>
          </Box>
        </Paper>

        {/* 多模型对比显示设置 */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">多模型对比显示</Typography>
            <Tooltip title="配置多模型对比时的布局方式">
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>布局方式</InputLabel>
            <Select
              value={multiModelDisplayStyle}
              onChange={handleMultiModelDisplayStyleChange}
              label="布局方式"
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="horizontal">水平布局（默认）</MenuItem>
              <MenuItem value="vertical">垂直布局（并排显示）</MenuItem>
              <MenuItem value="single">单独布局（堆叠显示）</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            设置多模型对比时的布局方式。水平布局将模型响应并排显示，垂直布局将模型响应上下排列，单独布局将模型响应堆叠显示。
          </Typography>
        </Paper>

        {/* 工具栏显示设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            工具栏显示方式
          </Typography>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>工具栏显示样式</InputLabel>
            <Select
              value={toolbarDisplayStyle}
              onChange={handleToolbarStyleChange}
              label="工具栏显示样式"
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="both">图标+文字（默认）</MenuItem>
              <MenuItem value="icon">仅图标</MenuItem>
              <MenuItem value="text">仅文字</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            设置聊天界面顶部工具栏的显示方式。可以选择同时显示图标和文字，或仅显示图标，或仅显示文字。
          </Typography>
        </Paper>

        {/* 输入框风格设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            输入框风格
          </Typography>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>输入框风格</InputLabel>
            <Select
              value={inputBoxStyle}
              onChange={handleInputBoxStyleChange}
              label="输入框风格"
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="default">默认风格</MenuItem>
              <MenuItem value="modern">现代风格</MenuItem>
              <MenuItem value="minimal">简约风格</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            选择聊天输入框和工具栏的视觉风格。默认风格保持原有设计，现代风格采用更时尚的外观，简约风格则更加简洁。
          </Typography>
        </Paper>

        {/* 输入框布局样式设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            输入框布局样式
          </Typography>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>布局样式</InputLabel>
            <Select
              value={inputLayoutStyle}
              onChange={handleInputLayoutStyleChange}
              label="布局样式"
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="default">默认样式（工具栏+输入框分离）</MenuItem>
              <MenuItem value="compact">聚合样式（输入框+功能图标集成）</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            选择聊天输入区域的布局方式：
            <br />• 默认样式：工具栏和输入框分别显示，功能清晰分离
            <br />• 聚合样式：输入框上方，下方为功能图标行，点击+号可展开更多功能
          </Typography>
        </Paper>

        {/* 工具调用设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">工具调用设置</Typography>
            <Tooltip title="配置工具调用的显示详情">
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showToolDetails}
                  onChange={handleShowToolDetailsChange}
                />
              }
              label="显示工具调用详情"
            />
          </FormGroup>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            控制是否显示工具调用的详细信息，包括调用参数和返回结果。
          </Typography>
        </Paper>

        {/* 引用设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">引用设置</Typography>
            <Tooltip title="配置引用的显示详情">
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showCitationDetails}
                  onChange={handleShowCitationDetailsChange}
                />
              }
              label="显示引用详情"
            />
          </FormGroup>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            控制是否显示引用的详细信息，包括引用来源和相关内容。
          </Typography>
        </Paper>

        {/* 头像和名称显示设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">头像和名称显示</Typography>
            <Tooltip title="自定义聊天界面中用户和模型的头像及名称显示">
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showUserAvatar}
                  onChange={handleShowUserAvatarChange}
                />
              }
              label="显示用户头像"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showUserName}
                  onChange={handleShowUserNameChange}
                />
              }
              label="显示用户名称"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showModelAvatar}
                  onChange={handleShowModelAvatarChange}
                />
              }
              label="显示模型头像"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showModelName}
                  onChange={handleShowModelNameChange}
                />
              }
              label="显示模型名称"
            />
          </FormGroup>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            控制聊天界面中用户和AI模型的头像及名称显示。可以根据个人喜好选择性隐藏这些元素，获得更简洁的聊天体验。
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            系统提示词气泡设置
          </Typography>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="prompt-bubble-style-label">系统提示词气泡显示</InputLabel>
            <Select
              labelId="prompt-bubble-style-label"
              value={showSystemPromptBubble ? 'show' : 'hide'}
              onChange={handleSystemPromptBubbleChange}
              label="系统提示词气泡显示"
              MenuProps={{
                disableAutoFocus: true,
                disableRestoreFocus: true
              }}
            >
              <MenuItem value="show">显示</MenuItem>
              <MenuItem value="hide">隐藏</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            控制是否在聊天界面顶部显示系统提示词气泡。系统提示词气泡可以帮助您查看和编辑当前会话的系统提示词。
          </Typography>
        </Paper>

        {/* 消息气泡宽度设置 */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">消息气泡宽度设置</Typography>
            <Tooltip title="自定义聊天界面中消息气泡的宽度范围，适配不同设备屏幕">
              <IconButton size="small" sx={{ ml: 1 }}>
                <Info size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* AI消息最大宽度 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              AI消息最大宽度: {messageBubbleMaxWidth}%
            </Typography>
            <Slider
              value={messageBubbleMaxWidth}
              onChange={handleMessageBubbleMaxWidthChange}
              min={50}
              max={100}
              step={5}
              marks={[
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>

          {/* 用户消息最大宽度 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              用户消息最大宽度: {userMessageMaxWidth}%
            </Typography>
            <Slider
              value={userMessageMaxWidth}
              onChange={handleUserMessageMaxWidthChange}
              min={50}
              max={100}
              step={5}
              marks={[
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>

          {/* 消息最小宽度 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              消息最小宽度: {messageBubbleMinWidth}%
            </Typography>
            <Slider
              value={messageBubbleMinWidth}
              onChange={handleMessageBubbleMinWidthChange}
              min={10}
              max={90}
              step={5}
              marks={[
                { value: 10, label: '10%' },
                { value: 30, label: '30%' },
                { value: 50, label: '50%' },
                { value: 70, label: '70%' },
                { value: 90, label: '90%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            调整消息气泡的宽度范围以适配不同设备：
            <br />• AI消息最大宽度：控制AI回复的最大显示宽度
            <br />• 用户消息最大宽度：控制用户消息的最大显示宽度
            <br />• 消息最小宽度：所有消息的最小显示宽度，避免过窄影响阅读
            <br />• 较小的宽度适合手机等窄屏设备，较大的宽度适合平板和电脑
          </Typography>
        </Paper>

        {/* 底部间距 */}
        <Box sx={{ height: '20px' }} />
      </Box>
    </Box>
  );
};

export default ChatInterfaceSettings;