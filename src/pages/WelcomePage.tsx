import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { setStorageItem } from '../shared/utils/storage';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理开始使用
  const handleStart = useCallback(async () => {
    try {
      await setStorageItem('first-time-user', 'false');
      navigate('/chat');
    } catch (error) {
      console.error('保存用户状态失败:', error);
      navigate('/chat');
    }
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        p: 3,
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 500,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}
      >
        {/* Logo 图标 */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 3,
            bgcolor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 4,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          <Sparkles size={40} color="#fff" strokeWidth={2} />
        </Box>

        {/* 标题 */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AetherLink
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 400,
            color: theme.palette.text.secondary,
            mb: 5,
          }}
        >
          开始您的 AI 对话之旅
        </Typography>

        {/* 开始按钮 */}
        <Button
          variant="contained"
          size="large"
          onClick={handleStart}
          endIcon={<ArrowRight size={20} />}
          sx={{
            px: 5,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: theme.palette.primary.main,
            boxShadow: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              boxShadow: 'none',
            },
          }}
        >
          开始使用
        </Button>
      </Box>
    </Box>
  );
};

export default WelcomePage;
